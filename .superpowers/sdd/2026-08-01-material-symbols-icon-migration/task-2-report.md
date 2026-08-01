# Task 2 Report — Migrate `ui/` components to Material Symbols Icon

## 1. What changed per file

- **`src/components/ui/calendar.jsx`**
  - Replaced `import { ChevronLeft, ChevronRight } from 'lucide-react'` with `import Icon from "./Icon.jsx"`.
  - `<ChevronLeft size={16} />` → `<Icon name="chevron_left" size={16} />`
  - `<ChevronRight size={16} />` → `<Icon name="chevron_right" size={16} />`
  - No other changes (Radix/Aria logic, exports untouched).

- **`src/components/ui/date-picker.jsx`**
  - Replaced `import { CalendarIcon } from 'lucide-react'` with `import Icon from "./Icon.jsx"`.
  - `<CalendarIcon size={16} />` → `<Icon name="calendar_month" size={16} />`

- **`src/components/ui/select.jsx`**
  - Replaced `import { ChevronDown } from "lucide-react"` with `import Icon from "./Icon.jsx"`.
  - `<ChevronDown size={16} className="shrink-0 text-muted-foreground opacity-50" />` → `<Icon name="keyboard_arrow_down" size={16} className="shrink-0 text-muted-foreground opacity-50" />`

- **`src/components/ui/dropdown-menu.jsx`**
  - Removed `import { HugeiconsIcon } from "@hugeicons/react"` and `import { Tick02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"`, replaced with `import Icon from "./Icon.jsx"`.
  - `<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />` → `<Icon name="check" />`
  - `<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-auto" />` → `<Icon name="arrow_forward" className="ml-auto" />`
  - No other changes (all Radix logic/exports intact).

## 2. Build output (last ~10 lines)

```
dist/assets/inter-latin-wght-normal-Dx4kXJAl.woff2                        48.25 kB
dist/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2                    85.06 kB
dist/assets/material-symbols-rounded-latin-wght-normal-BPlF0bBf.woff2    959.77 kB
dist/assets/index-Clyqzjdx.css                                           172.67 kB │ gzip:  31.10 kB
dist/assets/purify.es-DuRL7t6i.js                                         26.87 kB │ gzip:  10.45 kB
dist/assets/index.es-BYETD1PE.js                                         151.32 kB │ gzip:  48.88 kB
dist/assets/html2canvas-hwRlfxB-.js                                      199.55 kB │ gzip:  46.77 kB
dist/assets/index-RMswlWlt.js                                          2,059.87 kB │ gzip: 601.55 kB

[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 786ms
```
Build succeeded. The chunk-size warning is pre-existing (not icon-related).

## 3. Grep result

Command: `findstr /n "lucide-react Hugeicons hugeicons" src\components\ui\calendar.jsx src\components\ui\date-picker.jsx src\components\ui\select.jsx src\components\ui\dropdown-menu.jsx`
Result: **no matches** (empty output).

## 4. Commit SHA

`3825f47ddfb33a6939c20570c157ea89f8bfe658` (`refactor: migrate ui components to Material Symbols Icon`)

Only `src/components/ui/` was staged; `.superpowers/` and `docs/superpowers/plans/...md` remain untracked as instructed. `git status --short` confirms only those two untracked entries.

## 5. Self-review / concerns

- All four files migrated exactly per the brief; icons, sizes, and className props preserved verbatim. `strokeWidth` dropped only where the brief specified (dropdown-menu check/arrow icons).
- The `dropdown-menu.jsx` item/sub-trigger class strings still contain `[&_svg:not([class*='size-'])]:size-4` and `[&_svg]:pointer-events-none` selectors, which target `<svg>` elements. `Icon` renders a `<span>`, so those rules no longer apply to the check/arrow icons — they will render at the `Icon` default `size=20` instead of the previous 16px. The brief explicitly instructed to add no `size` prop here and to change nothing else, so this was left as-is; if 16px is desired, either pass `size={16}` or the `[&_svg]` selectors would need a matching span rule (out of scope for this task).
- The pre-existing chunk-size warning is unrelated to this change.

## Fix round

Two edits in `src/components/ui/dropdown-menu.jsx` to restore 16px icon parity, since the shadcn `[&_svg:not([class*='size-'])]:size-4` selectors no longer match the `<span>`-based `Icon`:

1. Line 114: `<Icon name="check" />` → `<Icon name="check" size={16} />`
2. Line 150: `<Icon name="arrow_forward" className="ml-auto" />` → `<Icon name="arrow_forward" size={16} className="ml-auto" />`

Nothing else changed in the file.

### Build result (last ~5 lines)

```
dist/assets/html2canvas-hwRlfxB-.js                                      199.55 kB │ gzip:  46.77 kB
dist/assets/index-RMswlWlt.js                                          2,059.87 kB │ gzip: 601.55 kB

[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
✓ built in 757ms
```

Build succeeded (pre-existing chunk-size warning, unrelated).

### Commit SHA

`354f825` (`refactor: fix dropdown-menu icon size parity`)

