import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

SRC_PPT = r"C:\Users\Ajitesh Mohan\Downloads\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER.pptx"
OUT_DIR = r"C:\Users\Ajitesh Mohan\Downloads"
OUT_PPT = os.path.join(OUT_DIR, "PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-UPDATED.pptx")
SCRATCH_PPT = r"C:\Users\Ajitesh Mohan\.gemini\antigravity\scratch\process-management-visualizer\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-UPDATED.pptx"

def build_presentation():
    prs = pptx.Presentation(SRC_PPT)

    # Colors matching the presentation
    DARK_NAVY = RGBColor(0x14, 0x24, 0x3A)
    TERRACOTTA = RGBColor(0xB2, 0x3A, 0x1C)
    CODE_BG = RGBColor(0x0F, 0x17, 0x2A)       # Deep slate terminal
    CODE_BORDER = RGBColor(0x33, 0x41, 0x55)
    CARD_BG = RGBColor(0xF8, 0xFA, 0xFC)       # Clean off-white card
    CARD_BORDER = RGBColor(0xCB, 0xD5, 0xE1)
    TEXT_DARK = RGBColor(0x1E, 0x29, 0x3B)
    CODE_TEXT = RGBColor(0xE2, 0xE8, 0xF0)
    CODE_COMMENT = RGBColor(0x94, 0xA3, 0xB8)
    CODE_KW = RGBColor(0x38, 0xBD, 0xF8)       # Bright sky blue
    CODE_STR = RGBColor(0xFB, 0xBF, 0x24)      # Amber

    def clear_slide_shapes(slide):
        for shape in list(slide.shapes):
            sp = shape._element
            sp.getparent().remove(sp)

    def add_chrome(slide, title_text):
        title_box = slide.shapes.add_textbox(Inches(0.67), Inches(0.65), Inches(12.0), Inches(0.65))
        tf = title_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Russo One"
        p.font.size = Pt(28)
        p.font.color.rgb = DARK_NAVY

        # Terracotta underline bar
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.67), Inches(1.36), Inches(3.96), Inches(0.04))
        bar.fill.solid()
        bar.fill.fore_color.rgb = TERRACOTTA
        bar.line.fill.background()

    def add_code_editor(slide, filename, code_lines):
        left, top, width, height = Inches(0.67), Inches(1.62), Inches(7.35), Inches(5.35)
        bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = CODE_BG
        bg.line.color.rgb = CODE_BORDER
        bg.line.width = Pt(1.2)

        # Window header dots
        dot_y = top + Inches(0.18)
        dots = [RGBColor(0xEF, 0x44, 0x44), RGBColor(0xF5, 0x9E, 0x0B), RGBColor(0x10, 0xB9, 0x81)]
        for i, col in enumerate(dots):
            d = slide.shapes.add_shape(MSO_SHAPE.OVAL, left + Inches(0.25 + i * 0.22), dot_y, Inches(0.12), Inches(0.12))
            d.fill.solid()
            d.fill.fore_color.rgb = col
            d.line.fill.background()

        # Filename label
        lbl = slide.shapes.add_textbox(left + Inches(1.05), top + Inches(0.12), Inches(5.8), Inches(0.3))
        tf_lbl = lbl.text_frame
        tf_lbl.margin_left = tf_lbl.margin_top = tf_lbl.margin_right = tf_lbl.margin_bottom = 0
        p_lbl = tf_lbl.paragraphs[0]
        p_lbl.text = filename
        p_lbl.font.name = "Consolas"
        p_lbl.font.size = Pt(9.5)
        p_lbl.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

        # Divider line
        sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top + Inches(0.42), width, Pt(1))
        sep.fill.solid()
        sep.fill.fore_color.rgb = CODE_BORDER
        sep.line.fill.background()

        # Code text area
        code_box = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.50), width - Inches(0.5), height - Inches(0.58))
        tf_code = code_box.text_frame
        tf_code.word_wrap = True
        tf_code.margin_left = tf_code.margin_top = tf_code.margin_right = tf_code.margin_bottom = 0

        for idx, (kind, text) in enumerate(code_lines):
            p = tf_code.paragraphs[0] if idx == 0 else tf_code.add_paragraph()
            p.text = text
            p.font.name = "Consolas"
            p.font.size = Pt(8.8)
            p.space_after = Pt(1.5)
            if kind == "comment":
                p.font.color.rgb = CODE_COMMENT
            elif kind == "keyword":
                p.font.color.rgb = CODE_KW
            elif kind == "string":
                p.font.color.rgb = CODE_STR
            else:
                p.font.color.rgb = CODE_TEXT

    def add_explanation_column(slide, cards):
        col_left = Inches(8.25)
        col_width = Inches(4.42)
        top_start = Inches(1.62)
        card_h = Inches(1.66)
        gap = Inches(0.18)

        for i, (tag, heading, points) in enumerate(cards):
            card_top = top_start + i * (card_h + gap)
            
            c_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_left, card_top, col_width, card_h)
            c_shape.fill.solid()
            c_shape.fill.fore_color.rgb = CARD_BG
            c_shape.line.color.rgb = CARD_BORDER
            c_shape.line.width = Pt(1)

            # Left terracotta accent strip
            strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_left, card_top, Inches(0.14), card_h)
            strip.fill.solid()
            strip.fill.fore_color.rgb = TERRACOTTA
            strip.line.fill.background()

            # Text content
            tb = slide.shapes.add_textbox(col_left + Inches(0.28), card_top + Inches(0.12), col_width - Inches(0.38), card_h - Inches(0.24))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

            # Tag category
            p0 = tf.paragraphs[0]
            p0.text = tag.upper()
            p0.font.name = "Russo One"
            p0.font.size = Pt(8.5)
            p0.font.color.rgb = TERRACOTTA
            p0.space_after = Pt(2)

            # Title
            p1 = tf.add_paragraph()
            p1.text = heading
            p1.font.name = "Russo One"
            p1.font.size = Pt(11.5)
            p1.font.color.rgb = DARK_NAVY
            p1.space_after = Pt(4)

            # Bullet points
            for pt in points:
                p_pt = tf.add_paragraph()
                p_pt.text = f"•  {pt}"
                p_pt.font.name = "Mulish"
                p_pt.font.size = Pt(9.5)
                p_pt.font.color.rgb = TEXT_DARK
                p_pt.space_after = Pt(2)

    # -------------------------------------------------------------------------
    # Format Slide 11: Core Kernel Architecture, PCB & fork() Syscall
    # -------------------------------------------------------------------------
    slide11 = prs.slides[10]
    clear_slide_shapes(slide11)
    add_chrome(slide11, "CORE IMPLEMENTATION: PCB & FORK() SYSCALL")

    code_lines_1 = [
        ("comment", "# 1. Process Control Block (PCB) Data Structure"),
        ("keyword", "@dataclass"),
        ("normal", "class ProcessControlBlock:"),
        ("normal", "    pid: int; ppid: int; name: str; state: str = \"READY\""),
        ("normal", "    priority: int = 5; cpu_burst: int = 10; memory_mb: int = 32"),
        ("normal", "    children: List[int] = field(default_factory=list)"),
        ("comment", "    # Hardware CPU Registers saved across Context Switches"),
        ("normal", "    pc: str  = \"0x00400000\"  # Program Counter"),
        ("normal", "    sp: str  = \"0x7ffd0000\"  # Stack Pointer"),
        ("normal", "    rax: str = \"0x00000000\"  # Accumulator Register"),
        ("normal", ""),
        ("comment", "# 2. POSIX fork() System Call Simulation"),
        ("keyword", "def fork(self, parent_pid: int, name: str, priority=5, burst=8):"),
        ("comment", "    \"\"\"Replicates context, allocates PID & updates process tree.\"\"\""),
        ("normal", "    if parent_pid not in self.process_table:"),
        ("normal", "        raise ValueError(f\"Parent {parent_pid} not found\")"),
        ("normal", "    child_pid = max(self.process_table.keys()) + 1"),
        ("normal", "    child_pcb = ProcessControlBlock("),
        ("normal", "        pid=child_pid, ppid=parent_pid, name=name, state=\"READY\","),
        ("normal", "        priority=priority, cpu_burst=burst, total_burst=burst,"),
        ("normal", "        pc=f\"0x{0x00400000 + child_pid * 0x100:08x}\","),
        ("normal", "        sp=f\"0x{0x7ffd0000 + child_pid * 0x20:08x}\""),
        ("normal", "    )"),
        ("normal", "    self.process_table[child_pid] = child_pcb"),
        ("normal", "    self.process_table[parent_pid].children.append(child_pid)"),
        ("normal", "    return child_pid"),
    ]
    add_code_editor(slide11, "kernel_pcb_fork.py  (Process Table & Syscall Logic)", code_lines_1)

    cards_1 = [
        ("DATA STRUCTURE", "Process Control Block (PCB)", [
            "Encapsulates process ID, parent ID, priority, and memory quota.",
            "Maintains 5-state lifecycle: NEW, READY, RUNNING, WAITING, TERMINATED.",
            "Enables dynamic hierarchical traversal across the fork tree visualizer."
        ]),
        ("SYSTEM CALL", "POSIX fork() Mechanics", [
            "Simulates address space replication and unique PID allocation.",
            "Links child PID directly into parent PCB children list to preserve lineage.",
            "Child process is admitted immediately into the READY Queue."
        ]),
        ("HARDWARE CONTEXT", "Register State Preservation", [
            "Simulates PC (Program Counter), SP (Stack Pointer), and RAX registers.",
            "Preserves execution offsets to support transparent context switching.",
            "Directly serialized and displayed in the frontend PCB Inspector drawer."
        ]),
    ]
    add_explanation_column(slide11, cards_1)

    # -------------------------------------------------------------------------
    # Format Slide 12: CPU Scheduler, Time Quantum Preemption & Zombie Reaping
    # -------------------------------------------------------------------------
    slide12 = prs.slides[11]
    clear_slide_shapes(slide12)
    add_chrome(slide12, "CORE IMPLEMENTATION: SCHEDULING & CONTEXT SWITCHING")

    code_lines_2 = [
        ("comment", "# 1. CPU Execution Step & Timer Preemption"),
        ("keyword", "def step(self, algorithm: str = \"ROUND_ROBIN\"):"),
        ("comment", "    \"\"\"Advances hardware clock & executes running process.\"\"\""),
        ("normal", "    self.tick += 1"),
        ("normal", "    curr = self.process_table.get(self.current_running)"),
        ("normal", "    if curr and curr.state == \"RUNNING\" and curr.pid != 1:"),
        ("normal", "        curr.cpu_burst -= 1"),
        ("normal", "        curr.pc = f\"0x{(int(curr.pc, 16) + 4):08x}\"  # PC += 4 bytes"),
        ("normal", "        curr.rax = f\"0x{(self.tick * 2654435761 + curr.pid) & 0xFFFFFFFF:08x}\""),
        ("normal", "        if curr.cpu_burst <= 0:"),
        ("normal", "            curr.state, curr.memory_mb = \"TERMINATED\", 0"),
        ("normal", "            self.schedule_next(algorithm)  # Finished execution"),
        ("normal", "        elif algorithm == \"ROUND_ROBIN\":"),
        ("normal", "            self.quantum_rem -= 1"),
        ("normal", "            if self.quantum_rem <= 0:"),
        ("normal", "                curr.state = \"READY\"  # Quantum timer interrupt"),
        ("normal", "                self.schedule_next(algorithm)"),
        ("normal", "    else: self.schedule_next(algorithm)"),
        ("normal", ""),
        ("comment", "# 2. POSIX waitpid() Zombie Reaping & Orphan Adoption"),
        ("keyword", "def reap_zombies(self):"),
        ("normal", "    dead = [p for p, obj in self.process_table.items() if obj.state == \"TERMINATED\"]"),
        ("normal", "    for pid in dead:"),
        ("normal", "        for c_pid in self.process_table[pid].children:"),
        ("normal", "            if c_pid in self.process_table:"),
        ("normal", "                self.process_table[c_pid].ppid = 1  # Re-parent to init"),
        ("normal", "                self.process_table[1].children.append(c_pid)"),
        ("normal", "        del self.process_table[pid]  # Free PCB from kernel table"),
    ]
    add_code_editor(slide12, "scheduler_engine.py  (Round-Robin & Preemption)", code_lines_2)

    cards_2 = [
        ("EXECUTION CYCLE", "CPU Clock Tick & PC Advance", [
            "Clock ticks decrement CPU burst for the active core process.",
            "Program Counter (PC) steps forward 4 bytes per instruction cycle.",
            "Tasks automatically transition to TERMINATED when burst reaches zero."
        ]),
        ("ALGORITHM DISPATCH", "Round-Robin & Preemption", [
            "Hardware timer decrements allocated time quantum (q ticks).",
            "On quantum timeout, running process is preempted back to READY queue.",
            "Dispatcher selects the next eligible task, resetting the time quantum."
        ]),
        ("PROCESS ANOMALIES", "Zombie Reaping & Orphan Adoption", [
            "Simulates parent waitpid() call to reap zombie PCB records.",
            "Active orphan children are adopted by PID 1 (systemd/init).",
            "Frees virtual memory allocation while maintaining fork tree consistency."
        ]),
    ]
    add_explanation_column(slide12, cards_2)

    # Save presentation
    prs.save(OUT_PPT)
    prs.save(SCRATCH_PPT)
    print("SUCCESS: Updated presentation generated perfectly!")
    print(f"File 1: {OUT_PPT}")
    print(f"File 2: {SCRATCH_PPT}")

if __name__ == "__main__":
    build_presentation()
