# Task 6 Report — Migrate Assets, Announcements, Employees, Expenses to Material Symbols Icon

Status: **DONE**

## 1. What changed per file

All 4 files: replaced the lucide-react import with `import Icon from "@/components/ui/Icon.jsx"` and swapped every icon usage to `<Icon name="..." />`. No non-icon code (logic, handlers, classNames, structure) was changed; no comments added. Mappings verified against the plan master table (`docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md` rows 25-87).

### src/components/Assets.jsx
| Lucide | Material Symbol | Occurrences |
|---|---|---|
| Monitor | monitor | categoryIcons + stat cards + fallbacks (6) |
| Smartphone | mobile | categoryIcons 'Phone' (1) |
| Mouse | mouse | categoryIcons 'Peripherals' (1) |
| Key | key | categoryIcons 'Access Card' (1) |
| Plus | add | Add Asset (1) |
| Search | search | search input + empty state (2) |
| AlertTriangle | warning | warranty alert + expiry warning (2) |
| PenTool | draw | Log New Maintenance (1) |
| TrendingDown | trending_down | Depreciation (1) |
| Upload | upload | Import CSV (1) |
| FileSignature | edit_document | Agreement (1) |
| Wrench | build | Under Repair stat + repair history + empty (4) |
| CheckCircle | check_circle | Available stat (2) |
| BadgeCheck | verified | Assigned stat (2) |
| MessageSquare | chat | No Pending Requests (1) |
| AlertCircle | error | assign modal info (1) |
| Laptop | laptop_windows | categoryIcons + header (2) |
| User | person | assignee avatar (1) |

Note: `Speaker` was imported but unused in JSX — removed with the import, nothing to map.

### src/components/Announcements.jsx
| Lucide | Material Symbol | Occurrences |
|---|---|---|
| Megaphone | campaign | header + empty state (2) |
| Plus | add | New Post, Add category, Add Option, FAB (4) |
| Send | send | reply + comment buttons (2) |
| Edit | edit | edit post (1) |
| Pencil | edit | edit category (1) |
| Trash2 | delete | delete post + delete category (2) |
| Users | group | views (1) |
| AlertTriangle | warning | Attach Poll (1) |
| MessageSquare | chat | comments toggle (1) |
| User | person | author/comments avatars (3) |
| X | close | close category modal (1) |

Note: `ImageIcon`, `FileText`, `Calendar`, `Clock`, `Heart`, `ThumbsUp`, `PartyPopper` were imported but unused in JSX — removed with the import, nothing to map.

### src/components/Employees.jsx
| Lucide | Material Symbol | Occurrences |
|---|---|---|
| Plus | add | Add Employee (2) |
| Search | search | search input (1) |
| Trash2 | delete | bulk delete + card delete (2) |
| UserPlus | person_add | new employee form title (1) |
| X | close | reject + clear selection (2) |
| Edit | edit | card edit + edit profile + form title (3) |
| Check | check | dept filter + approve + selection bar (3) |
| AlertCircle | error | pending updates (1) |
| FileSpreadsheet | table_chart | import CSV (2) + upload CV (1) |
| Users | group | header + empty state (2) |
| Mail | mail | card email (1) |
| ChevronDown | keyboard_arrow_down | expand toggle (1) |
| Download | download | download CSV (1) |
| Building2 | apartment | card dept (1) |
| User | person | avatars (2) |

Note: `Eye` was imported but unused in JSX — removed with the import, nothing to map.

### src/components/Expenses.jsx
| Lucide | Material Symbol | Occurrences |
|---|---|---|
| Receipt | receipt_long | header + form title (2) |
| Plus | add | Claim tab (1) |
| Upload | upload | receipt upload (1) |
| Check | check | bulk approve, approve, success dialog (3) |
| X (as XIcon) | close | reject (1) |
| Clock | schedule | Approvals tab (1) |
| DollarSign | attach_money | pending liability + mark reimbursed (2) |
| Download | download | export CSV (1) |
| AlertTriangle | warning | over-limit notice (1) |
| PieChart (as PieChartIcon) | pie_chart | Finance tab (1) |
| User | person | avatars (3) |
| History | history | History tab + title (2) |
| List | list | My Claims tab + title (2) |

Note: `Filter`, `Search` were imported but unused in JSX — removed with the import, nothing to map. The recharts `PieChart` import/usage was left untouched.

## 2. Build output (last ~10 lines)

```
dist/assets/material-symbols-rounded-latin-wght-normal-BPlF0bBf.woff2    959.77 kB
dist/assets/index-Clyqzjdx.css                                           172.67 kB │ gzip:  31.10 kB
dist/assets/purify.es-DuRL7t6i.js                                         26.87 kB │ gzip:  10.45 kB
dist/assets/index.es-DaYUrpCO.js                                         151.32 kB │ gzip:  48.88 kB
dist/assets/html2canvas-0SSim43t.js                                      199.55 kB │ gzip:  46.77 kB
dist/assets/index-BUc1IVb_.js                                          2,053.73 kB │ gzip: 598.96 kB

[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeLimitWarning
✓ built in 841ms
```

Build succeeded (the chunk-size warning is pre-existing and unrelated).

## 3. Grep result

`findstr /n "lucide-react" src\components\Assets.jsx src\components\Announcements.jsx src\components\Employees.jsx src\components\Expenses.jsx` → **no matches** (exit 0, empty output). A follow-up grep for any leftover original lucide component tokens (`<Monitor`, `<Plus`, `<User`, etc.) also returned zero files.

## 4. Commit SHA

`686f27d` — `refactor: migrate Assets, Announcements, Employees, Expenses to Material Symbols Icon` (4 files changed, 99 insertions(+), 99 deletions(-)). Verified via `git show --stat` that only the 4 intended files were staged/committed; untracked plan/brief files were not staged.

## 5. Self-review / concerns

- All 25/13/16/13 mapped icon usages converted; every ligature name taken from the master table — none guessed.
- Aliases handled: `Image as ImageIcon`, `X as XIcon`, `PieChart as PieChartIcon` → rendered uniformly as `<Icon name="image|close|pie_chart" />`. `X as XIcon` in Employees (unaliased) and Expenses (aliased) both → `close`.
- The recharts `PieChart` in Expenses.jsx is untouched — the replacement pattern was scoped to `PieChartIcon` only.
- Component-reference pattern: no file in this set stored icon components as values, so no ELEMENT-ref conversion was required (Assets' `categoryIcons` already stored elements).
- Unused imports (Speaker, ImageIcon, FileText, Calendar, Clock, Heart, ThumbsUp, PartyPopper, Eye, Filter, Search) were simply removed with the import line; nothing rendered.
- Icon usages keep their original `size` and `className` props; `Icon` maps `size` → font-size and inherits the global `.msr` styling, so no layout/class changes were needed.
- Build verified clean; grep verified clean; commit scope verified. No concerns.

## 6. Fix round 1 — add explicit `size` props to box-classed Icons

Reviewers confirmed a visual regression: migrated usages that retained the original lucide pattern `className="w-4 h-4"` (16px box) without a `size` prop rendered the glyph at the default 20px inside a 16px box (overflow/misalignment).

Fix: for every migrated `<Icon name="..." className="...h-4 w-4...">` (also h-3/w-3=12, h-3.5/w-3.5=14, h-4/w-4=16, h-5/w-5=20, h-6/w-6=24, h-10/w-10=40, h-16/w-16=64) lacking a `size` prop, added `size={N}` matching the box. ClassNames left as-is; no other code touched. Files with existing `size` props (Dashboard, Calendar, Documents, DriveSync, layout/, ui/, other attendance/) had no box-classed usages missing size — nothing to change.

**Files changed / Icon usages fixed (47 total):**
- `src/components/Assets.jsx` — 20 (w-4 h-4→16 ×6, h-4 w-4→16 ×7, w-3 h-3→12 ×1, h-5 w-5→20 ×2, h-6 w-6→24 ×1, h-10 w-10→40 ×3)
- `src/components/Employees.jsx` — 23 (h-4 w-4→16 ×11, h-3 w-3→12 ×1, h-3.5 w-3.5→14 ×6, h-5 w-5→20 ×3, h-16 w-16→64 ×1, plus template-string className)
- `src/components/Expenses.jsx` — 3 (h-4 w-4→16)
- `src/components/attendance/DailyLogs.jsx` — 1 (h-5 w-5→20)
- `src/components/attendance/LeaveRequests.jsx` — 1 (h-5 w-5→20)

**Build result (last lines):**
```
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeLimitWarning
✓ built in 993ms
```
Build succeeded (chunk-size warning pre-existing/unrelated).

**Grep verification:** re-ran the box-class regex across `src/**/*.jsx` — every migrated `<Icon name="...">` carrying a box class now also carries a `size` prop (Assets 19-875, Employees 459-1014, Expenses 368-471, DailyLogs 181, LeaveRequests 122); h-10/h-16 usages re-checked separately (Assets 171/386/546, Employees 597) all have size. No remaining box-classed Icon without size. Lucide-only files (Settings, Tasks, Payroll, Login, EmployeeLogin, EmployeePortal, ProfileView, useCommandPalette, App) left untouched per task scope.

**Commit SHA:** `b91114afd26f8ab6d7cec365caecd9debb743cd4` — `fix: add size props to Material Symbols icons sized via className` (5 files changed, 47 insertions(+), 47 deletions(-)). Staged via `git add -u src/` only; untracked `.superpowers/` and `docs/superpowers/plans/` not staged.
