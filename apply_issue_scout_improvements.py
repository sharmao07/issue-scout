from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
PAGE_PATH = ROOT / "src" / "app" / "page.tsx"
README_SOURCE = ROOT / "README-improved.md"
README_TARGET = ROOT / "README.md"
BACKUP_PATH = PAGE_PATH.with_name("page.tsx.before-issue-scout-improvement.bak")
README_BACKUP_PATH = ROOT / "README.md.before-issue-scout-improvement.bak"

needle = '''              </div>
            </div>

            <div className="p-5 sm:p-7">'''

replacement = '''              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-medium text-slate-500">
                  Quick start:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("good first issue");
                    setLanguage("");
                    setLabel("good first issue");
                    setLevel("beginner");
                  }}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Beginner-friendly
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("documentation");
                    setLanguage("");
                    setLabel("documentation");
                    setLevel("all");
                  }}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Documentation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("bug");
                    setLanguage("");
                    setLabel("bug");
                    setLevel("all");
                  }}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Bug fixes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setLanguage("Python");
                    setLabel("");
                    setLevel("all");
                  }}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  Python
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Pick a starting point, adjust the filters, then select Find issues.
              </p>
            </div>

            <div className="p-5 sm:p-7">'''

if not PAGE_PATH.exists():
    sys.exit("Couldn't find src/app/page.tsx. Open this script from the root of your issue-scout repository.")
if not README_SOURCE.exists():
    sys.exit("Couldn't find README-improved.md. Keep it next to this script.")

page = PAGE_PATH.read_text(encoding="utf-8")
if "Quick start:" in page:
    sys.exit("Quick-start presets already appear to be installed. No changes were made.")
count = page.count(needle)
if count != 1:
    sys.exit(f"Expected to find exactly one insertion point in page.tsx; found {count}. No files were changed.")

if not BACKUP_PATH.exists():
    shutil.copy2(PAGE_PATH, BACKUP_PATH)
if README_TARGET.exists() and not README_BACKUP_PATH.exists():
    shutil.copy2(README_TARGET, README_BACKUP_PATH)
PAGE_PATH.write_text(page.replace(needle, replacement, 1), encoding="utf-8")
shutil.copy2(README_SOURCE, README_TARGET)
print("Updated src/app/page.tsx with quick-start presets and replaced README.md.")
print(f"Original page backup: {BACKUP_PATH.name}")
if README_BACKUP_PATH.exists():
    print(f"Original README backup: {README_BACKUP_PATH.name}")
print("Next: run npm run lint and npm run build, then inspect the changes before committing.")
