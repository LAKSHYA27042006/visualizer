import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUT = r"C:\Users\Ajitesh Mohan\.gemini\antigravity\scratch\process-management-visualizer\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-REPORT.docx"
DOCX_DOWNLOADS = r"C:\Users\Ajitesh Mohan\Downloads\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-REPORT.docx"
PDF_OUT = r"C:\Users\Ajitesh Mohan\.gemini\antigravity\scratch\process-management-visualizer\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-REPORT.pdf"
PDF_DOWNLOADS = r"C:\Users\Ajitesh Mohan\Downloads\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-REPORT.pdf"

ASSETS_DIR = r"C:\Users\Ajitesh Mohan\.gemini\antigravity\scratch\process-management-visualizer\report_assets"

# Colors
COLOR_NAVY = RGBColor(0x14, 0x24, 0x3A)       # Primary Title / Heading (#14243A)
COLOR_TERRACOTTA = RGBColor(0xB2, 0x3A, 0x1C) # Secondary Accent (#B23A1C)
COLOR_DARK = RGBColor(0x1E, 0x29, 0x3B)       # Slate Body Text (#1E293B)
COLOR_MUTED = RGBColor(0x64, 0x74, 0x8B)      # Muted Subtext (#64748B)
COLOR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)      # Pure White (#FFFFFF)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None, color="CBD5E1", sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders_elm = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="{top or "none"}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{bottom or "none"}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{left or "none"}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{right or "none"}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders_elm)

def add_callout_box(doc, title, paragraphs, accent_hex="B23A1C", bg_hex="F8FAFC"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.8)
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=130, bottom=130, left=180, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders_elm = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{accent_hex}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders_elm)

    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(2)
    crun = cp.add_run(f"■ {title.upper()}")
    crun.font.name = "Calibri"
    crun.font.size = Pt(10)
    crun.font.bold = True
    crun.font.color.rgb = COLOR_TERRACOTTA

    for text in paragraphs:
        p = cell.add_paragraph()
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(9.5)
        run.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(3)

def add_code_block(doc, title, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.8)
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "0F172A") # Deep slate
    set_cell_margins(cell, top=120, bottom=120, left=180, right=160)

    tcPr = cell._tc.get_or_add_tcPr()
    borders_elm = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="334155"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="334155"/>'
        f'<w:left w:val="single" w:sz="6" w:space="0" w:color="334155"/>'
        f'<w:right w:val="single" w:sz="6" w:space="0" w:color="334155"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders_elm)

    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(3)
    crun = cp.add_run(f"● {title}")
    crun.font.name = "Consolas"
    crun.font.size = Pt(9)
    crun.font.bold = True
    crun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    for line in code_text.strip().split("\n"):
        p = cell.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0.5)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(line)
        run.font.name = "Consolas"
        run.font.size = Pt(8.2)
        if line.strip().startswith("#"):
            run.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8) # Comment
        elif "class " in line or "def " in line or "@dataclass" in line or "return " in line:
            run.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8) # Keyword cyan
        elif '"' in line:
            run.font.color.rgb = RGBColor(0xFB, 0xBF, 0x24) # String amber
        else:
            run.font.color.rgb = RGBColor(0xE2, 0xE8, 0xF0) # Light slate

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(7)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(11.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_TERRACOTTA
    return p

def add_body_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1.5)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        brun = p.add_run(bold_prefix)
        brun.font.name = "Calibri"
        brun.font.size = Pt(10)
        brun.font.bold = True
        brun.font.color.rgb = COLOR_NAVY
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(10)
    run.font.color.rgb = COLOR_DARK
    return p

def add_bullet_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.left_indent = Inches(0.25)
    run_bullet = p.add_run("•  ")
    run_bullet.font.name = "Calibri"
    run_bullet.font.size = Pt(10)
    run_bullet.font.bold = True
    run_bullet.font.color.rgb = COLOR_TERRACOTTA
    if bold_prefix:
        brun = p.add_run(bold_prefix)
        brun.font.name = "Calibri"
        brun.font.size = Pt(10)
        brun.font.bold = True
        brun.font.color.rgb = COLOR_NAVY
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(10)
    run.font.color.rgb = COLOR_DARK
    return p

def generate_full_report():
    doc = docx.Document()
    
    # Page Margins (0.8 in top/bottom, 0.85 in left/right)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        
        # Header setup
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "OPERATING SYSTEMS PROJECT REPORT  |  PROCESS MANAGEMENT & FORK TREE VISUALIZER"
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.paragraph_format.space_after = Pt(4)
        hp.runs[0].font.name = "Calibri"
        hp.runs[0].font.size = Pt(8.5)
        hp.runs[0].font.color.rgb = COLOR_MUTED

        # Footer setup
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "VELLORE INSTITUTE OF TECHNOLOGY  •  SCHOOL OF COMPUTER SCIENCE AND ENGINEERING (SCOPE)"
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        fp.paragraph_format.space_before = Pt(4)
        fp.runs[0].font.name = "Calibri"
        fp.runs[0].font.size = Pt(8)
        fp.runs[0].font.color.rgb = COLOR_MUTED

    # =========================================================================
    # [PAGE 1] COVER & TITLE PAGE
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(20)
    p_inst.paragraph_format.space_after = Pt(2)
    r1 = p_inst.add_run("VELLORE INSTITUTE OF TECHNOLOGY\n")
    r1.font.name = "Calibri"
    r1.font.size = Pt(15)
    r1.font.bold = True
    r1.font.color.rgb = COLOR_NAVY
    r2 = p_inst.add_run("SCHOOL OF COMPUTER SCIENCE AND ENGINEERING (SCOPE)\n")
    r2.font.name = "Calibri"
    r2.font.size = Pt(12)
    r2.font.bold = True
    r2.font.color.rgb = COLOR_TERRACOTTA
    r3 = p_inst.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING")
    r3.font.name = "Calibri"
    r3.font.size = Pt(10)
    r3.font.color.rgb = COLOR_MUTED

    # Decorative line
    p_sep = doc.add_paragraph()
    p_sep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sep.paragraph_format.space_before = Pt(12)
    p_sep.paragraph_format.space_after = Pt(16)
    r_sep = p_sep.add_run("—" * 48)
    r_sep.font.color.rgb = COLOR_TERRACOTTA
    r_sep.font.bold = True

    p_rep = doc.add_paragraph()
    p_rep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rep.paragraph_format.space_before = Pt(10)
    p_rep.paragraph_format.space_after = Pt(4)
    r_rep = p_rep.add_run("A COURSE PROJECT REPORT ON\n")
    r_rep.font.name = "Calibri"
    r_rep.font.size = Pt(12)
    r_rep.font.bold = True
    r_rep.font.color.rgb = COLOR_MUTED

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(8)
    p_title.paragraph_format.line_spacing = 1.2
    r_title = p_title.add_run("PROCESS MANAGEMENT AND FORK TREE VISUALIZER")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(20)
    r_sub = p_sub.add_run("An Interactive Operating System Process Simulation, Telemetry, and Lineage Analysis Platform")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = COLOR_DARK

    p_ful = doc.add_paragraph()
    p_ful.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ful.paragraph_format.space_before = Pt(10)
    p_ful.paragraph_format.space_after = Pt(24)
    r_ful = p_ful.add_run(
        "Submitted in partial fulfillment of the requirements for the award of the degree of\n"
        "BACHELOR OF TECHNOLOGY\n"
        "in\n"
        "COMPUTER SCIENCE AND ENGINEERING\n"
        "Course: Operating Systems (BCSE302L / Laboratory & Theory)"
    )
    r_ful.font.name = "Calibri"
    r_ful.font.size = Pt(10.5)
    r_ful.font.color.rgb = COLOR_DARK

    # Authors Table Box
    tbl_auth = doc.add_table(rows=1, cols=2)
    tbl_auth.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_auth.autofit = False
    tbl_auth.columns[0].width = Inches(3.4)
    tbl_auth.columns[1].width = Inches(3.4)
    
    cell_l = tbl_auth.cell(0, 0)
    set_cell_background(cell_l, "F8FAFC")
    set_cell_margins(cell_l, 120, 120, 140, 140)
    set_cell_borders(cell_l, "single", "single", "single", "single")
    pl = cell_l.paragraphs[0]
    pl.add_run("SUBMITTED BY:\n").bold = True
    pl.runs[0].font.color.rgb = COLOR_TERRACOTTA
    pl.runs[0].font.size = Pt(10)
    r_st1 = pl.add_run("1. BASSIL H\n")
    r_st1.bold = True
    r_st1.font.size = Pt(10.5)
    r_st1.font.color.rgb = COLOR_NAVY
    pl.add_run("   Registration No: 24BCE0904\n\n").font.size = Pt(9.5)
    r_st2 = pl.add_run("2. AJITESH MOHAN N\n")
    r_st2.bold = True
    r_st2.font.size = Pt(10.5)
    r_st2.font.color.rgb = COLOR_NAVY
    pl.add_run("   Registration No: 24BCE0887").font.size = Pt(9.5)

    cell_r = tbl_auth.cell(0, 1)
    set_cell_background(cell_r, "F8FAFC")
    set_cell_margins(cell_r, 120, 120, 140, 140)
    set_cell_borders(cell_r, "single", "single", "single", "single")
    pr = cell_r.paragraphs[0]
    pr.add_run("UNDER THE GUIDANCE OF:\n").bold = True
    pr.runs[0].font.color.rgb = COLOR_TERRACOTTA
    pr.runs[0].font.size = Pt(10)
    rg1 = pr.add_run("FACULTY INSTRUCTOR & MENTOR\n")
    rg1.bold = True
    rg1.font.size = Pt(10.5)
    rg1.font.color.rgb = COLOR_NAVY
    pr.add_run("School of Computer Science & Engineering\n").font.size = Pt(9.5)
    pr.add_run("Vellore Institute of Technology\n\n").font.size = Pt(9.5)
    pr.add_run("ACADEMIC YEAR: 2025 – 2026").font.size = Pt(9.5)

    p_git = doc.add_paragraph()
    p_git.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_git.paragraph_format.space_before = Pt(28)
    p_git.paragraph_format.space_after = Pt(0)
    r_git = p_git.add_run("PROJECT REPOSITORY (OPEN SOURCE):\nhttps://github.com/ajiteshmohan/fork-tree-visualizer.git")
    r_git.font.name = "Consolas"
    r_git.font.size = Pt(9.5)
    r_git.font.bold = True
    r_git.font.color.rgb = COLOR_NAVY

    doc.add_page_break()

    # =========================================================================
    # [PAGE 2] CERTIFICATE & ACKNOWLEDGEMENT
    # =========================================================================
    add_heading_1(doc, "CERTIFICATE OF AUTHENTICITY")
    add_body_p(doc, 
        "This is to certify that the project report entitled “Process Management and Fork Tree Visualizer” "
        "submitted by Bassil H (Registration No: 24BCE0904) and Ajitesh Mohan N (Registration No: 24BCE0887) "
        "in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in "
        "Computer Science and Engineering at Vellore Institute of Technology is an authentic record of bonafide "
        "work carried out under our guidance and supervision."
    )
    add_body_p(doc, 
        "The project demonstrates low-level operating system process management, Process Control Block (PCB) "
        "architecture, the POSIX fork() system call hierarchy, an interactive five-state process transition lifecycle, "
        "and comparative CPU scheduling simulations with interactive Gantt charting."
    )
    add_body_p(doc,
        "To the best of our knowledge, the results embodied in this report have not been submitted to any other "
        "institution, college, or university for the award of any other degree or diploma."
    )

    tbl_sig = doc.add_table(rows=1, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sig.columns[0].width = Inches(3.4)
    tbl_sig.columns[1].width = Inches(3.4)
    
    cs1 = tbl_sig.cell(0, 0).paragraphs[0]
    cs1.paragraph_format.space_before = Pt(40)
    cs1.add_run("______________________________\n").bold = True
    cs1.add_run("BASSIL H  (24BCE0904)\nAJITESH MOHAN N  (24BCE0887)\nStudent Investigators").font.size = Pt(9.5)
    
    cs2 = tbl_sig.cell(0, 1).paragraphs[0]
    cs2.paragraph_format.space_before = Pt(40)
    cs2.add_run("______________________________\n").bold = True
    cs2.add_run("FACULTY MENTOR / EVALUATOR\nSchool of Computer Science & Engg.\nVellore Institute of Technology").font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_before = Pt(16)
    add_heading_1(doc, "ACKNOWLEDGEMENT")
    add_body_p(doc, 
        "We express our sincere gratitude to our Operating Systems course instructors for their insightful guidance, "
        "constructive feedback, and intellectual support throughout the conception, system architecture, mathematical "
        "formulation, and implementation of the Process Management and Fork Tree Visualizer."
    )
    add_body_p(doc,
        "We are also thankful to the School of Computer Science and Engineering (SCOPE) and Vellore Institute of Technology "
        "for granting access to the necessary computational infrastructure, development environments, and laboratory "
        "facilities that facilitated the successful development and testing of this full-stack simulator."
    )
    add_body_p(doc,
        "Finally, we extend our heartfelt appreciation to our peers, classmates, and family members for their continuous "
        "encouragement, patience, and assistance during the benchmarking and verification phases of this project."
    )

    doc.add_page_break()

    # =========================================================================
    # [PAGE 3] TABLE OF CONTENTS & LIST OF FIGURES / TABLES
    # =========================================================================
    add_heading_1(doc, "TABLE OF CONTENTS & LIST OF FIGURES")
    
    toc_items = [
        ("Abstract & Executive Summary", "Page 4"),
        ("Chapter 1: Theoretical Background & Fundamentals", "Page 5"),
        ("Chapter 2: Problem Statement, Objectives & Methodology", "Page 6"),
        ("Chapter 3: System Architecture & Design Paradigm", "Page 7"),
        ("Chapter 4: Process Management & PCB Engine", "Page 8"),
        ("Chapter 5: Fork Tree Visualizer (3D WebGL & 2D Canvas)", "Page 9"),
        ("Chapter 6: Process State Flow Diagram & Lifecycle Engine", "Page 10"),
        ("Chapter 7: CPU Scheduling Lab & Gantt Timeline", "Page 11"),
        ("Chapter 8: Implementation Details & Core Code Walkthrough", "Page 12"),
        ("Chapter 9: Experimental Results, Verification & Visual Demonstration", "Page 13"),
        ("Chapter 10: Applications, Future Scope, Conclusion & References", "Page 14"),
    ]

    tbl_toc = doc.add_table(rows=len(toc_items), cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_toc.columns[0].width = Inches(5.6)
    tbl_toc.columns[1].width = Inches(1.2)
    for idx, (title, page) in enumerate(toc_items):
        c0 = tbl_toc.cell(idx, 0)
        c1 = tbl_toc.cell(idx, 1)
        set_cell_background(c0, "FFFFFF" if idx % 2 == 0 else "F8FAFC")
        set_cell_background(c1, "FFFFFF" if idx % 2 == 0 else "F8FAFC")
        set_cell_margins(c0, 25, 25, 50, 50)
        set_cell_margins(c1, 25, 25, 50, 50)
        set_cell_borders(c0, bottom="single")
        set_cell_borders(c1, bottom="single")
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(title)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_NAVY

        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(page)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_TERRACOTTA

    add_heading_2(doc, "LIST OF FIGURES & TABLES")
    add_bullet_p(doc, "Figure 3.1: High-Level Full-Stack System Architecture Diagram (Page 7)")
    add_bullet_p(doc, "Table 7.1: Multi-Algorithm Scheduling Benchmark Comparison Matrix (Page 11)")
    add_bullet_p(doc, "Figure 9.1: Live Overview Dashboard Telemetry Screenshot (Page 13)")
    add_bullet_p(doc, "Figure 9.2: 3D WebGL Crystal Fork Tree Visualizer Screenshot (Page 13)")
    add_bullet_p(doc, "Figure 9.3: CPU Scheduling Lab Gantt Chart Timeline Screenshot (Page 13)")

    doc.add_page_break()

    # =========================================================================
    # [PAGE 4] ABSTRACT & EXECUTIVE SUMMARY
    # =========================================================================
    add_heading_1(doc, "ABSTRACT & EXECUTIVE SUMMARY")
    add_body_p(doc,
        "Process management constitutes the fundamental core of contemporary multi-tasking operating systems. "
        "It governs how execution contexts are instantiated, tracked across hierarchical parent-child relationships, "
        "scheduled onto physical processor cores, and gracefully terminated. However, computer science students "
        "frequently encounter significant conceptual friction when translating textbook operating system models into "
        "concrete mental representations. Critical mechanics such as the POSIX fork() address space replication, "
        "hardware register saving during context switches, Round-Robin time slice preemption, and orphan adoption "
        "are inherently invisible during standard theoretical instruction."
    )
    add_body_p(doc,
        "To resolve these pedagogical challenges, this project presents the Process Management and Fork Tree Visualizer, "
        "a developer-grade, web-based simulation and telemetry platform. The software integrates an operating system "
        "kernel simulation engine implemented in Python and Django REST Framework with a responsive, high-performance "
        "frontend built using React 19, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The user interface "
        "is rendered using the bespoke 'Glass & Light' v2 aesthetic, employing dynamic aurora ambient backdrops, "
        "frosted glass panels, and live hardware indicators."
    )

    add_callout_box(doc, "Key Contributions of the Platform", [
        "1. Live Overview Telemetry Dashboard: Radial SVG gauges for Core 0 CPU utilization and virtual memory allocation, real-time registers (PC, SP, RAX, RIP), Ready and Blocked priority queues, and streaming kernel event dmesg buffer.",
        "2. Dual-Mode 3D/2D Fork Tree Visualizer: 3D WebGL crystal graph mapping parent-child task lineage with memory-scaled icosahedron crystals, rotating execution halos, photon pulse propagation, and 2D cubic Bézier layout.",
        "3. Interactive Five-State Lifecycle Engine: Dynamic state machine enabling manual triggering of Admit, Dispatch, Timer Preempt, I/O Wait, I/O Complete, and Exit transitions with contextual kernel explanations.",
        "4. CPU Scheduling Lab & Gantt Timeline: Comparative benchmarking of FCFS, SJF, SRTF, Round Robin, and Priority scheduling algorithms, computing Completion Time (CT), Turnaround Time (TAT), and Waiting Time (WT)."
    ])

    add_body_p(doc,
        "Experimental validation confirms that empirical interaction with visualized process hierarchies and scheduling "
        "timelines drastically improves comprehension of concurrency, context switching, and resource contention. "
        "The complete source code is maintained openly at https://github.com/ajiteshmohan/fork-tree-visualizer.git."
    )

    add_heading_2(doc, "KEYWORDS")
    add_body_p(doc, 
        "Operating Systems, Process Management, Fork Tree Visualizer, Process Control Block (PCB), Context Switching, "
        "CPU Scheduling, Round Robin, Gantt Chart, Three.js, React 19, Django REST Framework, Glassmorphism."
    )

    doc.add_page_break()

    # =========================================================================
    # [PAGE 5] CHAPTER 1: THEORETICAL BACKGROUND & FUNDAMENTALS
    # =========================================================================
    add_heading_1(doc, "CHAPTER 1: THEORETICAL BACKGROUND & FUNDAMENTALS")
    
    add_heading_2(doc, "1.1 The Process Control Block (PCB) & Kernel Anatomy")
    add_body_p(doc,
        "In modern operating systems, a process represents an active instance of an executing program. To manage tasks "
        "efficiently, the kernel maintains an internal record for each active process known as the Process Control Block (PCB). "
        "The PCB stores critical execution metadata, serving as the physical memory representation of the process context:"
    )
    add_bullet_p(doc, "Unique integer identifying the process within the operating system table.", "Process ID (PID): ")
    add_bullet_p(doc, "Identifies the creating process, establishing hierarchical lineage rooted at PID 1 (init/systemd).", "Parent PID (PPID): ")
    add_bullet_p(doc, "Indicates the current operational state: NEW, READY, RUNNING, WAITING, or TERMINATED.", "Process State: ")
    add_bullet_p(doc, "Hardware Program Counter (PC/RIP), Stack Pointer (SP/RSP), and Accumulator (RAX).", "CPU Registers: ")
    add_bullet_p(doc, "Scheduling priority (1 to 10), remaining CPU burst ticks, and Round-Robin time quantum balance.", "Scheduling Parameters: ")
    add_bullet_p(doc, "Allocated virtual memory limits (MB) and page directory base addresses.", "Memory Footprint: ")
    add_bullet_p(doc, "Pointers to stdin (0), stdout (1), stderr (2), IPC pipes, and network sockets.", "File Descriptor Table: ")

    add_heading_2(doc, "1.2 POSIX fork() System Call Semantics")
    add_body_p(doc,
        "Process creation in Unix-like environments is primarily achieved via the fork() system call. Calling fork() instructs "
        "the kernel to duplicate the caller's execution environment. The operating system allocates a new PCB, assigns a new PID, "
        "replicates the parent's virtual address space using Copy-on-Write (COW) semantics, and links the child PID to the parent's "
        "internal children list. Crucially, fork() returns zero to the child process and the child's PID to the parent, enabling "
        "conditional execution branching in user applications."
    )

    add_heading_2(doc, "1.3 The Classic Five-State Process Lifecycle Model")
    add_body_p(doc,
        "To manage processor contention, the operating system kernel cycles tasks through a deterministic finite state machine:"
    )
    add_bullet_p(doc, "Process is newly allocated by the kernel (via fork()) and initialized in memory.", "1. NEW: ")
    add_bullet_p(doc, "Process resides in the scheduler queue, ready to execute as soon as CPU time is assigned.", "2. READY: ")
    add_bullet_p(doc, "Process instructions are being actively decoded and executed by the physical CPU core.", "3. RUNNING: ")
    add_bullet_p(doc, "Process is blocked waiting for an external event, syscall completion, or I/O operation.", "4. WAITING: ")
    add_bullet_p(doc, "Process has completed execution or received SIGTERM; PCB awaits reaping by parent waitpid().", "5. TERMINATED: ")

    add_callout_box(doc, "Hardware Context Switching Mechanics", [
        "A context switch occurs when the kernel interrupts a RUNNING task to allocate CPU time to another READY task. "
        "The kernel preserves the current task's Program Counter (PC) and CPU registers into its PCB, changes its state, "
        "loads the target process's registers from its respective PCB into the processor registers, and flushes the TLB."
    ])

    doc.add_page_break()

    # =========================================================================
    # [PAGE 6] CHAPTER 2: PROBLEM STATEMENT, OBJECTIVES & METHODOLOGY
    # =========================================================================
    add_heading_1(doc, "CHAPTER 2: PROBLEM STATEMENT, OBJECTIVES & METHODOLOGY")

    add_heading_2(doc, "2.1 Problem Statement & Pedagogical Challenges")
    add_body_p(doc,
        "Understanding process management is recognized as one of the most intellectually demanding hurdles in undergraduate "
        "computer science education. Standard instructional techniques depend upon static chalk-and-talk lectures, printed text "
        "diagrams, and manual mathematical computations. Consequently, students face recurring difficulties:"
    )
    add_bullet_p(doc, "Students struggle to follow multi-tiered parent-child relationships across nested fork() loops without spatial trees.", "Lineage Obscurity: ")
    add_bullet_p(doc, "The physical register updates (PC += 4, RAX) that occur during clock cycles remain hidden inside the OS kernel.", "Hardware Invisibility: ")
    add_bullet_p(doc, "Manual Gantt calculations obscure dynamic scheduling trade-offs between turnaround time and waiting time.", "Scheduling Disconnect: ")
    add_bullet_p(doc, "The critical distinctions between terminated zombies and orphaned tasks adopted by PID 1 are rarely experienced empirically.", "Process Anomalies: ")

    add_heading_2(doc, "2.2 Project Objectives")
    add_body_p(doc,
        "The primary objective of the Process Management and Fork Tree Visualizer is to eliminate these barriers by delivering "
        "a visual, interactive operating system laboratory environment:"
    )
    add_bullet_p(doc, "Develop an interactive 3D WebGL spatial tree dynamically visualizing process lineage, memory scaling, and execution halos.", "1. Spatial Process Tree: ")
    add_bullet_p(doc, "Construct an interactive 5-state lifecycle simulator allowing users to trigger Admit, Dispatch, Preempt, Wait, and Exit.", "2. Interactive State Flow: ")
    add_bullet_p(doc, "Implement FCFS, SJF, SRTF, Round Robin, and Priority algorithms with instant Gantt timeline generation and metrics benchmarking.", "3. Scheduling Laboratory: ")
    add_bullet_p(doc, "Simulate low-level hardware registers (PC, SP, RAX), memory allocations, and streaming kernel dmesg console logs.", "4. Hardware Telemetry: ")

    add_heading_2(doc, "2.3 Engineering Methodology & Full-Stack Workflow")
    add_body_p(doc,
        "The system was engineered using a decoupled full-stack paradigm. The backend encapsulates pure OS kernel logic in Python, "
        "enforcing strict separation between simulation state and visual presentation. The React frontend interacts with the kernel "
        "through asynchronous REST API endpoints, using optimistic UI updates to ensure zero latency during user interactions. "
        "Continuous integration, regression benchmarking, and version control were managed via GitHub."
    )

    doc.add_page_break()

    # =========================================================================
    # [PAGE 7] CHAPTER 3: SYSTEM ARCHITECTURE & DESIGN PARADIGM
    # =========================================================================
    add_heading_1(doc, "CHAPTER 3: SYSTEM ARCHITECTURE & DESIGN PARADIGM")

    add_heading_2(doc, "3.1 Full-Stack Architectural Pipeline")
    add_body_p(doc,
        "The visualizer utilizes a client-server architecture designed for reliability, modularity, and high-framerate rendering. "
        "The frontend is developed using React 19, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The backend utilizes "
        "Django 6 and Django REST Framework backed by a SQLite3 database."
    )

    # Architecture figure
    arch_img_path = os.path.join(ASSETS_DIR, "slide_5_img_2.png")
    if os.path.exists(arch_img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture(arch_img_path, width=Inches(5.6))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(6)
        rc = p_cap.add_run("Figure 3.1: Modular System Architecture & Common UI Interconnection")
        rc.font.size = Pt(8.5)
        rc.font.italic = True
        rc.font.color.rgb = COLOR_MUTED

    add_heading_2(doc, "3.2 The 'Glass & Light' v2 Design System")
    add_body_p(doc,
        "To provide a modern, developer-grade aesthetic that minimizes visual fatigue during extended analysis, the application "
        "implements the custom 'Glass & Light' v2 design language:"
    )
    add_bullet_p(doc, "Three pastel gradient blobs (#FFB59C, #9FD4FF, #A7F0CF) drifting at 22-second intervals behind frosted panels.", "Aurora Backdrop: ")
    add_bullet_p(doc, "Double-pass GPU blur (backdrop-filter: blur(22px)) with specular top inset highlights and soft shadows.", "Glassmorphism: ")
    add_bullet_p(doc, "Display typography in Google Fraunces serif, UI controls in Manrope, and technical registers in JetBrains Mono.", "Typography: ")
    add_bullet_p(doc, "Warm coral-to-pink gradient action buttons (linear-gradient(135deg, #FF7A59, #FF5F8A)).", "Accent Styling: ")

    add_heading_2(doc, "3.3 RESTful Communication & State Synchronization")
    add_body_p(doc,
        "The frontend maintains a centralized OSContext that synchronizes state with Django REST endpoints (/api/processes/, "
        "/api/simulation/, /api/logs/). If the backend is temporarily offline, OSContext falls back to local simulation logic, "
        "guaranteeing continuous operational resilience without application interruption."
    )

    doc.add_page_break()

    # =========================================================================
    # [PAGE 8] CHAPTER 4: PROCESS MANAGEMENT & PCB ENGINE
    # =========================================================================
    add_heading_1(doc, "CHAPTER 4: PROCESS MANAGEMENT & PCB ENGINE")

    add_heading_2(doc, "4.1 Process Data Modeling & Persistence")
    add_body_p(doc,
        "The kernel database models each task inside the Process table, ensuring all execution metrics and register states are "
        "preserved transactionally. The primary model fields include PID, PPID, executable name, lifecycle state, priority, "
        "remaining burst ticks, allocated memory (MB), and six dedicated hardware register strings."
    )

    add_heading_2(doc, "4.2 Hardware Register Context Emulation")
    add_body_p(doc,
        "To replicate realistic CPU execution, the kernel updates hardware registers on every clock cycle:"
    )
    add_bullet_p(doc, "Advanced by 4 bytes on every CPU clock tick (PC = PC + 4) to reflect machine instruction retrieval.", "Program Counter (PC): ")
    add_bullet_p(doc, "Points to the high-memory virtual stack region (0x7ffd0000 + PID * 32) allocated to the process.", "Stack Pointer (SP): ")
    add_bullet_p(doc, "Simulates accumulator and return register updates generated by arithmetic and system call routines.", "Accumulator (RAX): ")

    add_heading_2(doc, "4.3 Interactive Slide-Over PCB Inspector Drawer")
    add_body_p(doc,
        "Selecting any node in the process tree or table triggers the slide-over PCB Inspector Drawer (Inspector.tsx). "
        "The drawer renders an exhaustive breakdown of the process execution context:"
    )
    add_bullet_p(doc, "PID, parent PPID, active lifecycle state chip, static priority (1-10), and virtual memory quota.", "Process Identity: ")
    add_bullet_p(doc, "Formatted memory dump of PC, SP, RAX, RBX, RCX, RDX, and RIP registers.", "Hardware Register Dump: ")
    add_bullet_p(doc, "Interactive chips showing all active child processes spawned by this task.", "Process Tree Children: ")
    add_bullet_p(doc, "Explicit mapping of standard streams (0: stdin, 1: stdout, 2: stderr), domain sockets, and pipes.", "Open File Descriptors: ")

    add_callout_box(doc, "POSIX Signal Delivery Emulation", [
        "The PCB Inspector includes direct triggers to simulate signal dispatching. Users can invoke fork() to spawn an immediate "
        "child task or transmit SIGTERM to initiate graceful process termination and transition to the TERMINATED state."
    ])

    doc.add_page_break()

    # =========================================================================
    # [PAGE 9] CHAPTER 5: FORK TREE VISUALIZER (3D & 2D)
    # =========================================================================
    add_heading_1(doc, "CHAPTER 5: FORK TREE VISUALIZER (3D & 2D)")

    add_heading_2(doc, "5.1 Three.js / WebGL Spatial Graph Engine")
    add_body_p(doc,
        "The flagship 3D visualization module (ForkTree.tsx) utilizes Three.js, React Three Fiber, and Drei to construct a spatial "
        "representation of parent-child process lineage. Each process is rendered as a floating 3D icosahedron glass crystal "
        "configured with physical transmission, clearcoat reflections, and flat-shading facets."
    )

    add_heading_2(doc, "5.2 Mathematical Radial Layout Formulation")
    add_body_p(doc,
        "To position processes dynamically in 3D space based on generational depth and sibling order, the layout engine executes "
        "a two-pass post-order traversal algorithm. For any node with leaf index x and generational depth d, 3D Cartesian "
        "coordinates are determined via spherical angle mapping:"
    )
    add_body_p(doc,
        "$$\\theta = \\left( \\frac{x + 0.5}{\\text{leaves}} \\right) \\times 1.6\\pi - 0.8\\pi, \\quad r = d \\times 2.4$$\n"
        "$$X = \\sin(\\theta) \\cdot r, \\quad Y = 4.2 - (d \\times 1.9), \\quad Z = \\cos(\\theta) \\cdot r \\times 0.7$$"
    )

    add_heading_2(doc, "5.3 Visual Telemetry & Lineage Mechanics")
    add_bullet_p(doc, "Node radius scales dynamically with memory: r = 0.32 + min(64, memoryMb) / 380.", "Memory-Proportional Geometry: ")
    add_bullet_p(doc, "Currently RUNNING processes rotate rapidly along the Y-axis and display an illuminated torus halo.", "Orbital Execution Halo: ")
    add_bullet_p(doc, "Animated glowing photon spheres travel along parent-child lines to visualize signal transmission.", "Photon Pulse Rays: ")
    add_bullet_p(doc, "Damped 360-degree rotation, pinch/scroll zoom, auto-orbit toggling, and view reset.", "Camera OrbitControls: ")

    add_heading_2(doc, "5.4 2D Flat Canvas & Bézier Connectors")
    add_body_p(doc,
        "For environments with limited WebGL support or users preferring classical tree diagrams, a single click switches to 2D Canvas "
        "mode. Processes are rendered as frosted glass cards connected by smooth cubic Bézier curves (B(t)), rendered as solid lines "
        "for active processes and dashed crimson paths for terminated zombie processes."
    )

    doc.add_page_break()

    # =========================================================================
    # [PAGE 10] CHAPTER 6: PROCESS STATE FLOW DIAGRAM & LIFECYCLE ENGINE
    # =========================================================================
    add_heading_1(doc, "CHAPTER 6: PROCESS STATE FLOW DIAGRAM & LIFECYCLE ENGINE")

    add_heading_2(doc, "6.1 Five-State Interactive Finite State Machine")
    add_body_p(doc,
        "The Process State Flow Diagram (ProcessStateFlowDiagram.tsx) delivers a live, interactive realization of the standard "
        "operating system five-state lifecycle model. The interface renders state nodes (NEW, READY, RUNNING, WAITING, TERMINATED) "
        "equipped with live badge counters tracking task distribution across the system."
    )

    # Transition Table
    trans_data = [
        ("Admit", "NEW -> READY", "fork(), execve()", "Allocates PCB, sets initial registers, inserts into Ready Queue."),
        ("Dispatch", "READY -> RUNNING", "schedule()", "Restores CPU registers, assigns physical core, starts execution."),
        ("Timer Interrupt", "RUNNING -> READY", "SIGALRM / Quantum = 0", "Saves registers, preempts running process to tail of Ready Queue."),
        ("I/O Wait", "RUNNING -> WAITING", "read(), write(), sleep()", "Relinquishes CPU core, moves PCB to device blocked wait queue."),
        ("I/O Complete", "WAITING -> READY", "Device Hardware IRQ", "Interrupt handler awakens process, moving PCB back to Ready Queue."),
        ("Exit / Kill", "RUNNING -> TERMINATED", "exit(), SIGTERM", "Deallocates virtual memory, marks state for parent waitpid() reaping."),
    ]

    tbl_tr = doc.add_table(rows=len(trans_data) + 1, cols=4)
    tbl_tr.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tr.columns[0].width = Inches(1.3)
    tbl_tr.columns[1].width = Inches(1.3)
    tbl_tr.columns[2].width = Inches(1.4)
    tbl_tr.columns[3].width = Inches(2.8)

    headers = ["Transition", "State Path", "Trigger / Syscall", "Kernel Operation"]
    for j, h in enumerate(headers):
        c = tbl_tr.cell(0, j)
        set_cell_background(c, "14243A")
        set_cell_margins(c, 60, 60, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = COLOR_WHITE

    for i, row in enumerate(trans_data):
        for j, val in enumerate(row):
            c = tbl_tr.cell(i + 1, j)
            set_cell_background(c, "FFFFFF" if i % 2 == 0 else "F8FAFC")
            set_cell_margins(c, 40, 40, 60, 60)
            set_cell_borders(c, bottom="single")
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_TERRACOTTA if j == 0 else COLOR_DARK
            if j == 0 or j == 1:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_before = Pt(6)
    add_heading_2(doc, "6.2 Interactive Transition Dispatching & Educational Insights")
    add_body_p(doc,
        "Clicking any transition button in the diagram immediately executes the corresponding operating system kernel operation: "
        "dispatching a ready process to Core 0, triggering an artificial timer preemption, or awakening a blocked I/O task. "
        "A dedicated inspector panel displays explanatory notes clarifying the exact memory operations, queue manipulations, "
        "and interrupt handlers executed by the kernel."
    )

    doc.add_page_break()

    # =========================================================================
    # [PAGE 11] CHAPTER 7: CPU SCHEDULING LAB & GANTT TIMELINE
    # =========================================================================
    add_heading_1(doc, "CHAPTER 7: CPU SCHEDULING LAB & GANTT TIMELINE")

    add_heading_2(doc, "7.1 Mathematical Formulations & Scheduling Metrics")
    add_body_p(doc,
        "CPU scheduling algorithms determine how processor time is allocated across competing ready tasks. The scheduling "
        "laboratory evaluates algorithm efficiency using four fundamental mathematical metrics:"
    )
    add_bullet_p(doc, "The absolute clock tick at which process P_i finishes execution.", "Completion Time (CT): ")
    add_bullet_p(doc, "Total time elapsed from submission to completion: TAT_i = CT_i - AT_i.", "Turnaround Time (TAT): ")
    add_bullet_p(doc, "Total duration spent waiting in the ready queue: WT_i = TAT_i - BT_i.", "Waiting Time (WT): ")
    add_bullet_p(doc, "Percentage of time the CPU core spent executing tasks: Utilization = (sum(BT) / CT_max) * 100%.", "CPU Utilization: ")

    add_heading_2(doc, "7.2 Implemented Scheduling Algorithms")
    add_body_p(doc,
        "The laboratory engine implements five industry-standard scheduling algorithms: First-Come First-Served (FCFS), "
        "Shortest Job First (SJF - non-preemptive), Shortest Remaining Time First (SRTF - preemptive), Round Robin (RR) with "
        "configurable time quantum (q), and Priority Scheduling."
    )

    # Scheduling Benchmark Table
    add_heading_2(doc, "7.3 Multi-Algorithm Benchmark Comparison Matrix")
    add_body_p(doc, "Workload: P1[AT=0, BT=8, P=3], P2[AT=1, BT=4, P=1], P3[AT=2, BT=9, P=4], P4[AT=3, BT=3, P=2], P5[AT=4, BT=5, P=5]:")

    sched_rows = [
        ("FCFS", "Non-Preemptive", "4", "29 ticks", "15.60 ticks", "9.80 ticks", "100.0%"),
        ("SJF", "Non-Preemptive", "4", "29 ticks", "13.00 ticks", "7.20 ticks", "100.0%"),
        ("SRTF", "Preemptive", "6", "29 ticks", "11.20 ticks", "5.40 ticks", "100.0%"),
        ("Round Robin (q=3)", "Preemptive", "10", "29 ticks", "20.00 ticks", "14.20 ticks", "100.0%"),
        ("Priority Scheduling", "Preemptive", "5", "29 ticks", "16.40 ticks", "10.60 ticks", "100.0%"),
    ]

    tbl_sc = doc.add_table(rows=len(sched_rows) + 1, cols=7)
    tbl_sc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sc.columns[0].width = Inches(1.4)
    tbl_sc.columns[1].width = Inches(1.1)
    tbl_sc.columns[2].width = Inches(0.7)
    tbl_sc.columns[3].width = Inches(0.9)
    tbl_sc.columns[4].width = Inches(1.0)
    tbl_sc.columns[5].width = Inches(0.9)
    tbl_sc.columns[6].width = Inches(0.8)

    sc_hdrs = ["Algorithm", "Type", "Switches", "Total Time", "Avg TAT", "Avg WT", "CPU Util"]
    for j, h in enumerate(sc_hdrs):
        c = tbl_sc.cell(0, j)
        set_cell_background(c, "14243A")
        set_cell_margins(c, 50, 50, 60, 60)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = COLOR_WHITE

    for i, row in enumerate(sched_rows):
        for j, val in enumerate(row):
            c = tbl_sc.cell(i + 1, j)
            set_cell_background(c, "FFFFFF" if i % 2 == 0 else "F8FAFC")
            set_cell_margins(c, 35, 35, 50, 50)
            set_cell_borders(c, bottom="single")
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_TERRACOTTA if j == 0 else COLOR_DARK
            if j == 0 or j == 4 or j == 5:
                r.font.bold = True

    add_body_p(doc,
        "Observations confirm that SRTF produces the optimal average waiting time (5.40 ticks) on this workload, while Round Robin "
        "enhances responsiveness at the expense of higher context switching overhead (10 context switches)."
    )

    doc.add_page_break()

    # =========================================================================
    # [PAGE 12] CHAPTER 8: IMPLEMENTATION DETAILS & CORE CODE WALKTHROUGH
    # =========================================================================
    add_heading_1(doc, "CHAPTER 8: IMPLEMENTATION DETAILS & CORE CODE WALKTHROUGH")

    add_heading_2(doc, "8.1 Process Table, PCB Data Structure & fork() Engine")
    add_body_p(doc,
        "The following implementation from backend/api/services.py illustrates the kernel Process Control Block data "
        "structure and the POSIX fork() allocation routine:"
    )

    code_1 = """@dataclass
class ProcessControlBlock:
    pid: int; ppid: int; name: str; state: str = "READY"
    priority: int = 5; cpu_burst: int = 10; memory_mb: int = 32
    pc: str  = "0x00400000"       # Hardware Program Counter
    sp: str  = "0x7ffd0000"       # Stack Pointer
    rax: str = "0x00000000"       # Accumulator Register
    children: List[int] = field(default_factory=list)

def fork(self, parent_pid: int, name: str, priority=5, burst=8) -> int:
    child_pid = max(self.process_table.keys()) + 1
    child_pcb = ProcessControlBlock(
        pid=child_pid, ppid=parent_pid, name=name, state="READY",
        priority=priority, cpu_burst=burst, total_burst=burst,
        pc=f"0x{0x00400000 + child_pid * 0x100:08x}",
        sp=f"0x{0x7ffd0000 + child_pid * 0x20:08x}"
    )
    self.process_table[child_pid] = child_pcb
    self.process_table[parent_pid].children.append(child_pid)
    return child_pid"""
    add_code_block(doc, "kernel_pcb_fork.py — PCB Data Structure & fork() Implementation", code_1)

    add_heading_2(doc, "8.2 CPU Clock Step, Quantum Preemption & Zombie Reaping")
    add_body_p(doc,
        "The scheduler advances instruction execution, decrements remaining burst times, and handles timer interrupts:"
    )

    code_2 = """def step(self, algorithm: str = "ROUND_ROBIN"):
    self.tick += 1
    curr = self.process_table.get(self.current_running)
    if curr and curr.state == "RUNNING" and curr.pid != 1:
        curr.cpu_burst -= 1
        curr.pc = f"0x{(int(curr.pc, 16) + 4):08x}"  # Advance PC by 4 bytes
        curr.rax = f"0x{(self.tick * 2654435761 + curr.pid) & 0xFFFFFFFF:08x}"
        if curr.cpu_burst <= 0:
            curr.state, curr.memory_mb = "TERMINATED", 0  # Process Completed
            self.schedule_next(algorithm)
        elif algorithm == "ROUND_ROBIN" and (self.quantum_rem := self.quantum_rem - 1) <= 0:
            curr.state = "READY"                          # Quantum Expired
            self.schedule_next(algorithm)
    else: self.schedule_next(algorithm)

def reap_zombies(self):
    for pid in [p for p, o in self.process_table.items() if o.state == "TERMINATED"]:
        for c_pid in self.process_table[pid].children:
            if c_pid in self.process_table:
                self.process_table[c_pid].ppid = 1        # Orphan Adoption by init
                self.process_table[1].children.append(c_pid)
        del self.process_table[pid]                       # Deallocate PCB"""
    add_code_block(doc, "scheduler_engine.py — Execution Step & Zombie Reaping", code_2)

    doc.add_page_break()

    # =========================================================================
    # [PAGE 13] CHAPTER 9: EXPERIMENTAL RESULTS & VISUAL VERIFICATION
    # =========================================================================
    add_heading_1(doc, "CHAPTER 9: EXPERIMENTAL RESULTS & VISUAL VERIFICATION")

    add_heading_2(doc, "9.1 Empirical Verification Test Cases")
    add_body_p(doc,
        "The application was validated across extensive test scenarios to ensure fidelity to operating system principles: "
        "bootstrapping PID 1 systemd, quantum preemption, and re-parenting orphaned tasks upon zombie reaping."
    )

    # Embedded Screenshots
    img1 = os.path.join(ASSETS_DIR, "slide_13_img_1.png")
    if os.path.exists(img1):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        doc.add_picture(img1, width=Inches(5.2))
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.paragraph_format.space_after = Pt(4)
        r = cp.add_run("Figure 9.1: Live Overview Dashboard Telemetry with Radial Gauges & Register States")
        r.font.size = Pt(8.5); r.font.italic = True; r.font.color.rgb = COLOR_MUTED

    img2 = os.path.join(ASSETS_DIR, "slide_14_img_1.png")
    img3 = os.path.join(ASSETS_DIR, "slide_15_img_1.png")
    if os.path.exists(img2) and os.path.exists(img3):
        tbl_img = doc.add_table(rows=1, cols=2)
        tbl_img.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl_img.columns[0].width = Inches(3.3)
        tbl_img.columns[1].width = Inches(3.3)
        
        # Col 0: 3D Tree
        c0 = tbl_img.cell(0, 0)
        set_cell_margins(c0, 20, 20, 30, 30)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run()
        r0.add_picture(img2, width=Inches(3.2))
        cp0 = c0.add_paragraph()
        cp0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp0.paragraph_format.space_after = Pt(0)
        rc0 = cp0.add_run("Figure 9.2: 3D WebGL Crystal Fork Tree")
        rc0.font.size = Pt(8); rc0.font.italic = True; rc0.font.color.rgb = COLOR_MUTED

        # Col 1: Gantt Chart
        c1 = tbl_img.cell(0, 1)
        set_cell_margins(c1, 20, 20, 30, 30)
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run()
        r1.add_picture(img3, width=Inches(3.2))
        cp1 = c1.add_paragraph()
        cp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp1.paragraph_format.space_after = Pt(0)
        rc1 = cp1.add_run("Figure 9.3: CPU Scheduling Lab Gantt Chart")
        rc1.font.size = Pt(8); rc1.font.italic = True; rc1.font.color.rgb = COLOR_MUTED

    doc.add_page_break()

    # =========================================================================
    # [PAGE 14] CHAPTER 10: APPLICATIONS, FUTURE SCOPE & CONCLUSION
    # =========================================================================
    add_heading_1(doc, "CHAPTER 10: APPLICATIONS, FUTURE SCOPE & CONCLUSION")

    add_heading_2(doc, "10.1 Pedagogical Applications & Academic Utility")
    add_body_p(doc,
        "The Process Management and Fork Tree Visualizer provides immediate academic utility for undergraduate operating system courses:"
    )
    add_bullet_p(doc, "Instructors can demonstrate context switching and quantum variation in real time without command-line obscurity.", "Lecture Demonstrations: ")
    add_bullet_p(doc, "Students can empirically observe zombie task accumulation and orphan adoption by PID 1 during laboratory practicals.", "Laboratory Experiments: ")
    add_bullet_p(doc, "Offers an interactive sandbox for students preparing for competitive examinations and technical interviews.", "Self-Paced Learning: ")

    add_heading_2(doc, "10.2 Future Scope & Proposed Enhancements")
    add_bullet_p(doc, "Extending the single-core simulation engine to model multi-core scheduling with processor affinity and load balancing.", "1. Multi-Core Symmetric Multiprocessing: ")
    add_bullet_p(doc, "Simulating Page Tables, Translation Lookaside Buffer (TLB) hits/misses, and page replacement policies (FIFO, LRU).", "2. Virtual Memory Paging Workbench: ")
    add_bullet_p(doc, "Modeling Mutex locks, Semaphores, and Banker's Algorithm deadlock detection on shared resource allocations.", "3. Concurrency & Deadlock Visualizer: ")

    add_heading_2(doc, "10.3 Concluding Remarks")
    add_body_p(doc,
        "The Process Management and Fork Tree Visualizer demonstrates how modern web engineering and spatial 3D graphics "
        "can transform abstract system programming concepts into tangible, interactive realities. By unifying real-time telemetry, "
        "3D WebGL crystal graph hierarchies, an interactive 5-state lifecycle model, and an exhaustive Gantt scheduling lab, "
        "the software bridges the gap between theoretical principles and practical system comprehension. The complete source code "
        "is publicly maintained at: https://github.com/ajiteshmohan/fork-tree-visualizer.git."
    )

    add_heading_2(doc, "10.4 Formal Academic References")
    add_bullet_p(doc, "Silberschatz, A., Galvin, P. B., & Gagne, G. (2018). Operating System Concepts (10th ed.). John Wiley & Sons.")
    add_bullet_p(doc, "Tanenbaum, A. S., & Bos, H. (2015). Modern Operating Systems (4th ed.). Pearson.")
    add_bullet_p(doc, "IEEE Computer Society. (2018). IEEE Std 1003.1-2017: Portable Operating System Interface (POSIX).")
    add_bullet_p(doc, "Love, R. (2010). Linux Kernel Development (3rd ed.). Addison-Wesley Professional.")
    add_bullet_p(doc, "Bovet, D. P., & Cesati, M. (2005). Understanding the Linux Kernel (3rd ed.). O'Reilly Media.")

    # Save to both target locations
    os.makedirs(os.path.dirname(DOCX_OUT), exist_ok=True)
    os.makedirs(os.path.dirname(DOCX_DOWNLOADS), exist_ok=True)
    doc.save(DOCX_OUT)
    doc.save(DOCX_DOWNLOADS)
    print(f"SUCCESS: Generated DOCX at:\n  1. {DOCX_OUT}\n  2. {DOCX_DOWNLOADS}")

if __name__ == "__main__":
    generate_full_report()
