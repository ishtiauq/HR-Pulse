# Task 2 Brief — Migrate `ui/` components (calendar, date-picker, select, dropdown-menu)

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `src/components/ui/calendar.jsx`, `src/components/ui/date-picker.jsx`, `src/components/ui/select.jsx`, `src/components/ui/dropdown-menu.jsx`

**Interfaces:**
- Consumes: `Icon` from Task 1 (`src/components/ui/Icon.jsx`, default export `<Icon name="..." size={n} className="..." />`)
- Produces: 4 clean `ui/` components with no lucide/hugeicons imports

The plan's exact mappings:
- ChevronLeft → `chevron_left`, ChevronRight → `chevron_right`, CalendarIcon → `calendar_month`, ChevronDown → `keyboard_arrow_down`, Tick02Icon (Hugeicons) → `check`, ArrowRight01Icon (Hugeicons) → `arrow_forward`.

## Step 1: Migrate `src/components/ui/calendar.jsx`

Replace `import { ChevronLeft, ChevronRight } from 'lucide-react'` with `import Icon from "./Icon.jsx"`. Replace every `<ChevronLeft ... />` with `<Icon name="chevron_left" ... />` and every `<ChevronRight ... />` with `<Icon name="chevron_right" ... />`, preserving all props (size, className, etc.). Check the file for the exact JSX usage.

## Step 2: Migrate `src/components/ui/date-picker.jsx`

Replace `import { CalendarIcon } from 'lucide-react'` with `import Icon from "./Icon.jsx"`. Replace `<CalendarIcon ... />` with `<Icon name="calendar_month" ... />`.

## Step 3: Migrate `src/components/ui/select.jsx`

Replace `import { ChevronDown } from "lucide-react"` with `import Icon from "./Icon.jsx"`. Replace `<ChevronDown ... />` with `<Icon name="keyboard_arrow_down" ... />`.

## Step 4: Migrate `src/components/ui/dropdown-menu.jsx`

Replace `import { HugeiconsIcon } from "@hugeicons/react"` with `import Icon from "./Icon.jsx"`. Then:
- `<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />` → `<Icon name="check" />`
- `<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-auto" />` → `<Icon name="arrow_forward" className="ml-auto" />`
- Remove any now-unused imports (`Tick02Icon`, `ArrowRight01Icon`) if imported separately — check the top of the file for how Hugeicons is imported and clean up accordingly.

Note: `dropdown-menu.jsx` is a Radix wrapper (like the other shadcn `ui/` components). Do not change anything else in these files — only the icon imports/usages. The global `.msr` class handles styling; do NOT add `size` props unless the original icon had them (e.g. `<ChevronLeft size={16} />` becomes `<Icon name="chevron_left" size={16} />`).

## Step 5: Verify build + grep

Run: `npm run build`
Expected: success. Then grep these 4 files for `lucide-react|Hugeicons|hugeicons` — zero matches.

## Step 6: Commit

```bash
git add src/components/ui/
git commit -m "refactor: migrate ui components to Material Symbols Icon"
```
