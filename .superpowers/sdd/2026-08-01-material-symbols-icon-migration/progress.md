# SDD ledger — plan: docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md

Plan: Replace all lucide-react/@hugeicons icons with Material Symbols (Rounded, filled) via a single Icon component; remove old icon packages. 10 tasks, 35 source files.

## Pre-flight
- Scan complete, no conflicts between tasks or with Global Constraints.
- Working directly on `main` per explicit human consent (2026-08-01).
- Note: bash unavailable on this Windows host; SDD scripts replicated manually.
  
Task 1: complete (commits 25297b1..2358d75, review clean) 
Task 2: complete (commits 2358d75..354f825, review clean)
Task 2: minor (deferred): [&_svg...] selectors in dropdown-menu.jsx dead against span-based Icon; size fixed via size=16, shrink-0/pointer-events-none loss cosmetic
Task 3: complete (commits 354f825..4b534a1, review clean)
Task 4: complete (commits 4b534a1..5ee58f9, review clean)
Task 5: complete (commits 5ee58f9..285c5e8, review clean)
Task 5: minor (deferred): Icon span baseline nuance for absolutely-positioned icons (e.g. Documents search) — cosmetic
Task 6: in-progress — reviewer flagged ⚠️ confirmed as real gap: Icon usages with box-size className (h-4 w-4 etc.) but NO size prop render 20px glyph in 16px box (visual regression vs lucide). Affects Assets/Employees/Expenses (T6) + DailyLogs/LeaveRequests (T4). Fix loop round 1.
Task 6: fix round 1/5 (1 addressed, 0 open — added size={N} to 47 box-classed Icon usages; commits 686f27d..b91114a)
Task 6: complete (commits 285c5e8..b91114a, review clean after fix round 1)
Task 7: complete (commits b91114a..cb5c1f0, review clean; note: prior partial attempt fixed — latent ReferenceError bugs in Payroll <User>/Tasks <ChevronDown> corrected in final commit)
Task 7: minor (deferred): empty-state h-12 w-12 icons use size=48 (beyond brief list h-10→40 but correct)
