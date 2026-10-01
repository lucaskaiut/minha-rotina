#!/usr/bin/env python3
"""Remove Tailwind border-* classes and normalize card shadows."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"

REPLACEMENTS = [
    (r"bg-white rounded-3xl border border-\[#E5E7EB\]", "ui-card"),
    (r"bg-white rounded-2xl border border-\[#E5E7EB\]", "ui-card-sm"),
    (r"rounded-3xl border border-\[#E5E7EB\]", "ui-card"),
    (r"rounded-2xl border border-\[#E5E7EB\]", "ui-card-sm"),
    (r"border border-\[#E5E7EB\] shadow-xl", "ui-panel shadow-xl"),
    (r"border border-\[#E5E7EB\] shadow-2xl", "ui-panel shadow-2xl"),
    (r"bg-gradient-to-br from-white via-white to-\[#EEF0FF\]/40 rounded-3xl border border-\[#D8DBFF\]", "ui-card-tint bg-gradient-to-br from-white via-white to-[#EEF0FF]/40"),
    (r"bg-gradient-to-r from-\[#EEF0FF\] to-white border border-\[#D8DBFF\]", "ui-card-tint bg-gradient-to-r from-[#EEF0FF] to-white"),
    (r"sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-\[#E5E7EB\]", "sticky top-0 z-40 ui-chrome-top"),
    (r"fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-\[#E5E7EB\]", "fixed bottom-0 left-0 right-0 z-40 ui-chrome-bottom"),
    (r"flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200", "flex items-center p-1 ui-segment"),
    (r"flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200", "flex items-center p-1 ui-segment rounded-xl"),
]

BORDER_TOKEN = re.compile(
    r"\s+(?:"
    r"border(?:-\[[^\]]+\]|-(?:t|b|l|r|x|y|2|10)?(?:-\[[^\]]+\]|-[\w#/]+)*)"
    r"|ring-\d+"
    r"|ring-\[[^\]]+\]"
    r")"
)


def strip_borders(text: str) -> str:
    for _ in range(8):
        new = BORDER_TOKEN.sub("", text)
        if new == text:
            break
        text = new
    return text


def main() -> None:
    for path in ROOT.rglob("*.tsx"):
        if "DeviceFrame" in path.name:
            continue
        original = path.read_text(encoding="utf-8")
        updated = original
        for pattern, repl in REPLACEMENTS:
            updated = re.sub(pattern, repl, updated)
        updated = strip_borders(updated)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(path.relative_to(ROOT.parent))


if __name__ == "__main__":
    main()
