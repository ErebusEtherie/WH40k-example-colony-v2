import os


# Theme-aware replacement for gold accent text; used for icons in Header and Footer.
MECH_GOLD_TEXT = "text-[var(--mech-gold)]"

# Preserves original line endings: read/write with newline="" does no CRLF translation.
def replace_in(path, pairs):
    with open(path, "r", encoding="utf-8", newline="") as fh:
        content = fh.read()
    for old, new, count in pairs:
        n = content.count(old)
        if count is not None:
            flag = "OK  " if n == count else "WARN"
            print(f"[{flag}] {os.path.basename(path)}: {n}x {old!r} -> {new!r} (expected {count})")
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)

# ---- App.tsx : full-viewport backgrounds must follow the theme ----
replace_in("src/App.tsx", [
    ("bg-[#04060b]", "bg-[var(--mech-void)]", 4),
])

# ---- index.css : hardcoded surface colors -> variables (single-line patterns only) ----
replace_in("src/index.css", [
    ("  background: #0f1422;", "  background: var(--mech-panel);", 1),
    ("  border: 1px solid #1e293b;", "  border: 1px solid var(--mech-border);", 1),
    ("  border-color: #334155;", "  border-color: var(--mech-border-highlight);", 1),
    ("  background: #131929;", "  background: var(--mech-panel);", 1),
    ("  background-color: #0b0f19;", "  background-color: var(--mech-panel);", 1),
    ("  background: #080a10;", "  background: var(--mech-void);", 1),
    ("  background: #1e293b;", "  background: var(--mech-border);", 1),
    ("  background: #f59e0b;", "  background: var(--mech-gold);", 1),
])

# ---- Header.tsx : chrome backgrounds + solid gold/plasma/emerald accents -> variables ----
replace_in("src/components/Header.tsx", [
    ("bg-[#090d16]", "bg-[var(--mech-dark)]", 1),
    ("bg-[#060910]", "bg-[var(--mech-void)]", 1),
    ("text-[#f59e0b]", MECH_GOLD_TEXT, None),   # Cpu + Compass icons
    ("border-[#f59e0b]", "border-[var(--mech-gold)]", 4),   # active tab borders
    ("bg-[#f59e0b]/10", "theme-active-tint", 4),            # active tab weak bg
    ("text-[#38bdf8]", "text-[var(--mech-plasma)]", None),  # FileText + system text
    ("text-[#10b981]", "text-[var(--mech-emerald)]", None), # Layers icon + online dot
    ("hover:bg-[#121828]", "hover:bg-[var(--mech-dark)]", None),
    ("bg-[#121622] hover:bg-[#1c2233] border border-[#2c364d]", "bg-[var(--mech-dark)] hover:bg-[var(--mech-steel)] border border-[var(--mech-border)]", 1),
])

# ---- Footer.tsx : chrome background + solid accents -> variables ----
replace_in("src/components/Footer.tsx", [
    ("bg-[#070a12]", "bg-[var(--mech-dark)]", 1),
    ("text-[#f59e0b]", MECH_GOLD_TEXT, 1),          # Terminal icon
    ("text-[#38bdf8] hover:text-[#7dd3fc]", "text-[var(--mech-plasma)] hover:text-[var(--mech-plasma)]", 1),
    ("text-[#fef08a]", MECH_GOLD_TEXT, 1),          # Active Telemetry
])

# ---- Append the theme-aware active-tab tint utility to index.css ----
TINT = """

/* Weak theme-colored tint used for the active nav-tab background (chrome).
   Uses color-mix so it tracks the active theme's --mech-gold at low opacity. */
.theme-active-tint {
  background-color: color-mix(in srgb, var(--mech-gold) 12%, transparent);
}
"""
with open("src/index.css", "a", encoding="utf-8", newline="") as fh:
    fh.write(TINT)

print("DONE")
