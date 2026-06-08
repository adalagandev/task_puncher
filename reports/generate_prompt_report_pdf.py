"""Render the prompt-history analysis as a styled PDF (fpdf2, pure-Python, no system deps).

Why a script and not a one-off: data is embedded so the PDF is reproducible — rerun after the
next prompt_history audit to regenerate. Output: reports/Prompt_Analysis_Report.pdf
"""
from pathlib import Path
from fpdf import FPDF

# --- analysis data (kept in sync with PROMPT_ANALYSIS.md) ---
TOTAL_RECORDS = 97
REAL_PROMPTS = 92
NOISE = 5
SESSIONS = 11

CATEGORIES = [
    # name, count, [tips]
    ("Session Management", 23, [
        "SessionStart hook (shipped) already kills 'read whats_up' opens - keep leaning on it.",
        "Add a session-end hook to auto-write the PLAN.md left-off note.",
        "Stop logging 'read...' / 'end session' as prompts - they bias every percentage.",
    ]),
    ("Git / PR / Version Control", 17, [
        "Conflicts (4 prompts) cluster on long-lived branches - merge each TP branch same-day.",
        "Keep combining 'merge #N and start TP-M' into one instruction.",
        "Rebase on origin/main before opening a PR so conflicts surface early.",
    ]),
    ("Workflow & Task Navigation", 14, [
        "Ask once for the ordered next 3 tasks, then 'do all three' - fewer round-trips.",
        "Keep PLAN.md's 'next up' pointer current so 'what's next' is a glance, not a prompt.",
    ]),
    ("Agentic Automation & Hooks", 11, [
        "Capture the 'local code-review, key off GitHub' setup once - it recurs.",
        "State trigger + output target up front ('on PR create, comment on the PR').",
    ]),
    ("Feature & UI Development", 6, [
        "Pair the vibe ('shiny loud') with a spec: size, color token, max items.",
        "Keep bundling the 'do the usual ticket' ritual into one line.",
    ]),
    ("Meta / Config / Documentation", 6, [
        "Keep CLAUDE.md lean; push procedural detail into hooks - shrinks the session tax.",
    ]),
    ("Learning & Clarifying Questions", 6, [
        "Move recurring answers (DB location, dev.ps1, swap-DB) into CLAUDE.md as reference.",
    ]),
    ("Debugging & Bug Fixes", 5, [
        "Most trace to 'frontend up before backend' - dev.ps1 + health-check wait fixes the class.",
        "Report the error AND what you just did - your best debug prompts did this.",
    ]),
    ("Planning & Prioritization", 4, [
        "Re-run a short 're-prioritize the backlog' prompt at each session start.",
    ]),
]

TAKEAWAYS = [
    "Automate the 25% session tax - SessionStart hook (done) + a session-end hook reclaims most of it.",
    "Tame branch conflicts - merge/rebase TP branches same-day; rebase on origin/main before PR.",
    "Clean the log - filter 'read...', 'end session', and CLI/agent echoes out of prompt_history.csv.",
]

# --- palette ---
INK = (33, 37, 41)
MUTED = (108, 117, 125)
ACCENT = (37, 99, 235)      # blue
BAR_BG = (233, 236, 239)
RULE = (222, 226, 230)


def pct(count):
    return count / REAL_PROMPTS * 100


class Report(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 6, "Prompt History Analysis", align="L")
        self.cell(0, 6, "Task Puncher", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")


def section_title(pdf, text):
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*INK)
    pdf.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*ACCENT)
    pdf.set_line_width(0.6)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.l_margin + 40, y)
    pdf.ln(3)


pdf = Report(orientation="P", unit="mm", format="A4")
pdf.set_auto_page_break(auto=True, margin=18)
pdf.set_margins(18, 16, 18)
pdf.add_page()

# --- Title block ---
pdf.set_font("Helvetica", "B", 22)
pdf.set_text_color(*INK)
pdf.cell(0, 12, "Prompt History Analysis", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(*MUTED)
pdf.cell(0, 7, "Task Puncher  -  prompt_history.csv + prompt_history_2.csv", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "Span: 2026-05-30 to 2026-06-07  -  8 days  -  11 sessions  -  generated 2026-06-07",
         new_x="LMARGIN", new_y="NEXT")
pdf.ln(3)

# --- Summary stat cards ---
cards = [
    ("Total records", str(TOTAL_RECORDS)),
    ("Real prompts", str(REAL_PROMPTS)),
    ("Tooling noise", f"{NOISE} ({NOISE/TOTAL_RECORDS*100:.1f}%)"),
    ("Sessions", str(SESSIONS)),
]
cw = (pdf.w - 2 * pdf.l_margin - 3 * 4) / 4
x0 = pdf.l_margin
y0 = pdf.get_y()
for i, (label, val) in enumerate(cards):
    x = x0 + i * (cw + 4)
    pdf.set_fill_color(*BAR_BG)
    pdf.set_draw_color(*RULE)
    pdf.rect(x, y0, cw, 20, style="DF")
    pdf.set_xy(x, y0 + 3)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*ACCENT)
    pdf.cell(cw, 8, val, align="C")
    pdf.set_xy(x, y0 + 12)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(cw, 5, label, align="C")
pdf.set_y(y0 + 20)
pdf.ln(4)

# --- Noise note ---
pdf.set_font("Helvetica", "I", 9)
pdf.set_text_color(*MUTED)
pdf.multi_cell(0, 5,
    "Note: 5 records are not real prompts (1 task-notification block + 4 ultraplan CLI echoes "
    "captured by the logging hook). That is a logging bug to fix, not user behavior. Percentages "
    "below are computed over the 92 real prompts.")
pdf.ln(1)

# --- Category breakdown with bars ---
section_title(pdf, "Category Breakdown")
maxpct = max(pct(c) for _, c, _ in CATEGORIES)
label_w = 62
bar_max = pdf.w - 2 * pdf.l_margin - label_w - 22
for name, count, _ in CATEGORIES:
    p = pct(count)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*INK)
    pdf.cell(label_w, 7, name)
    bx, by = pdf.get_x(), pdf.get_y()
    pdf.set_fill_color(*BAR_BG)
    pdf.rect(bx, by + 1.2, bar_max, 4.4, style="F")
    pdf.set_fill_color(*ACCENT)
    pdf.rect(bx, by + 1.2, bar_max * (p / maxpct), 4.4, style="F")
    pdf.set_xy(bx + bar_max + 2, by)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*INK)
    pdf.cell(20, 7, f"{count}  ({p:.1f}%)", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)

# --- Per-category findings & tips ---
section_title(pdf, "Findings & Tips by Category")
for name, count, tips in CATEGORIES:
    if pdf.get_y() > pdf.h - 40:
        pdf.add_page()
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 6.5, f"{name}  -  {count} ({pct(count):.1f}%)", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*INK)
    for tip in tips:
        x = pdf.get_x()
        pdf.set_text_color(*ACCENT)
        pdf.cell(5, 5, chr(149))  # bullet
        pdf.set_text_color(*INK)
        pdf.multi_cell(pdf.w - 2 * pdf.l_margin - 5, 5, tip)
    pdf.ln(1.5)

# --- Takeaways ---
if pdf.get_y() > pdf.h - 50:
    pdf.add_page()
section_title(pdf, "Top 3 Takeaways")
for i, t in enumerate(TAKEAWAYS, 1):
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*ACCENT)
    pdf.cell(7, 6, f"{i}.")
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(*INK)
    pdf.multi_cell(pdf.w - 2 * pdf.l_margin - 7, 6, t)
    pdf.ln(0.5)

out = Path(__file__).with_name("Prompt_Analysis_Report.pdf")
pdf.output(str(out))
print(f"wrote {out}")
