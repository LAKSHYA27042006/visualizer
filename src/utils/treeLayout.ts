import { PCB } from '../types/process';

export interface PositionedNode {
  pcb: PCB;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export interface TreeLink {
  id: string;
  fromPid: number;
  toPid: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface TreeLayoutResult {
  nodes: PositionedNode[];
  links: TreeLink[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

interface InternalNode {
  pcb: PCB;
  children: InternalNode[];
  x: number;
  y: number;
  level: number;
  subtreeWidth: number;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 90;

export function calculateTreeLayout(processes: PCB[], rootPid: number = 1): TreeLayoutResult {
  const activeProcesses = processes.filter(p => p.state !== 'terminated');
  const procMap = new Map<number, PCB>();
  processes.forEach(p => procMap.set(p.pid, p));

  // Determine root: either rootPid or first process without parent
  let rootPcb = procMap.get(rootPid);
  if (!rootPcb && processes.length > 0) {
    rootPcb = processes.find(p => p.ppid === 0) || processes[0];
  }

  if (!rootPcb) {
    return { nodes: [], links: [], minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  // Build tree hierarchy
  function buildSubtree(currentPcb: PCB, level: number): InternalNode {
    const childPcbs = activeProcesses.filter(p => p.ppid === currentPcb.pid && p.pid !== currentPcb.pid);
    const children = childPcbs.map(c => buildSubtree(c, level + 1));

    return {
      pcb: currentPcb,
      children,
      x: 0,
      y: level * (NODE_HEIGHT + VERTICAL_GAP),
      level,
      subtreeWidth: 0,
    };
  }

  const rootNode = buildSubtree(rootPcb, 0);

  // Compute subtree widths
  function computeWidths(node: InternalNode): number {
    if (node.children.length === 0) {
      node.subtreeWidth = NODE_WIDTH;
      return NODE_WIDTH;
    }
    let totalChildWidth = 0;
    for (const child of node.children) {
      totalChildWidth += computeWidths(child);
    }
    totalChildWidth += (node.children.length - 1) * HORIZONTAL_GAP;
    node.subtreeWidth = Math.max(NODE_WIDTH, totalChildWidth);
    return node.subtreeWidth;
  }

  computeWidths(rootNode);

  // Assign X coordinates centering parents over children
  function assignPositions(node: InternalNode, leftX: number) {
    if (node.children.length === 0) {
      node.x = leftX + (node.subtreeWidth - NODE_WIDTH) / 2;
      return;
    }

    let currentLeft = leftX;
    for (const child of node.children) {
      assignPositions(child, currentLeft);
      currentLeft += child.subtreeWidth + HORIZONTAL_GAP;
    }

    // Parent centered above first and last child centers
    const firstChildCenter = node.children[0].x + NODE_WIDTH / 2;
    const lastChildCenter = node.children[node.children.length - 1].x + NODE_WIDTH / 2;
    node.x = (firstChildCenter + lastChildCenter) / 2 - NODE_WIDTH / 2;
  }

  assignPositions(rootNode, 40);

  // Flatten positioned nodes and generate links
  const nodes: PositionedNode[] = [];
  const links: TreeLink[] = [];

  function collectNodes(node: InternalNode) {
    nodes.push({
      pcb: node.pcb,
      x: node.x,
      y: node.y + 40,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      level: node.level,
    });

    for (const child of node.children) {
      links.push({
        id: `${node.pcb.pid}->${child.pcb.pid}`,
        fromPid: node.pcb.pid,
        toPid: child.pcb.pid,
        fromX: node.x + NODE_WIDTH / 2,
        fromY: node.y + 40 + NODE_HEIGHT,
        toX: child.x + NODE_WIDTH / 2,
        toY: child.y + 40,
      });
      collectNodes(child);
    }
  }

  collectNodes(rootNode);

  // Check if any disconnected active processes exist (e.g. orphans or alternate trees)
  const includedPids = new Set(nodes.map(n => n.pcb.pid));
  const unattached = activeProcesses.filter(p => !includedPids.has(p.pid));

  if (unattached.length > 0) {
    let unattachedX = (nodes.length > 0 ? Math.max(...nodes.map(n => n.x + n.width)) : 0) + 100;
    unattached.forEach((p, idx) => {
      nodes.push({
        pcb: p,
        x: unattachedX + idx * (NODE_WIDTH + 30),
        y: 40,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        level: 0,
      });
    });
  }

  const allX = nodes.map(n => n.x);
  const allY = nodes.map(n => n.y);
  const minX = Math.min(...allX, 0);
  const maxX = Math.max(...nodes.map(n => n.x + n.width), 800);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...nodes.map(n => n.y + n.height), 600);

  return {
    nodes,
    links,
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX + 100,
    height: maxY - minY + 100,
  };
}
