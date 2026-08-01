# Material Symbols Icon Migration Design

**Date:** 2026-08-01
**Status:** Approved

## Goal

Replace all icon packs currently used in the app — `lucide-react`, `@hugeicons/react`, `@hugeicons/core-free-icons` — with the **Google Material Symbols (Rounded, New)** icon set, self-hosted via Fontsource. Apply the variable-font axes globally: **FILL=1 (filled), weight=600, grade=0, optical size=auto**.

The three icon packages must be removed completely with no trace (no `package.json`, `package-lock.json`, or `node_modules` references), and no lucide/hugeicons imports anywhere in `src/`.

## Approach

**A — Variable font + single `<Icon>` component (approved)**

- Install `@fontsource-variable/material-symbols-rounded` (matches existing `@fontsource-variable/inter` self-hosting pattern).
- Create one `<Icon name="..." />` component that renders a Material Symbols ligature span.
- Set the 4 variable axes once, globally, via a `.msr` CSS utility.
- Migrate all 35 source files, mapping ~95 lucide icon names to Material Symbols ligature names.

## Design

### 1. Font setup — `src/index.css`

```css
@import "@fontsource-variable/material-symbols-rounded";

.msr {
  font-family: "Material Symbols Rounded Variable";
  font-weight: 600;
  font-variation-settings: "FILL" 1, "wght" 600, "GRAD" 0, "opsz" auto;
  line-height: 1;
  user-select: none;
  font-style: normal;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  display: inline-block;
}
```

- `font-size` is set per-instance by the `<Icon>` component (default `1.25rem` = 20px).
- `opsz: auto` lets the font pick optical size from `font-size`.

### 2. Icon component — `src/components/ui/Icon.jsx`

```jsx
<Icon name="shield" size={14} className="text-primary" aria-label="Shield" />
```

Props:
- `name` (required) — Material Symbols ligature name.
- `size` (number, default 20) — font-size in px.
- `className`, `style` — forwarded to the span.
- `aria-label` — when provided, span is not `aria-hidden`; when omitted, `aria-hidden="true"`.

Renders `<span className="msr" aria-hidden={ariaLabel ? undefined : true}>{name}</span>`.

### 3. Name mapping

Map every lucide/hugeicons icon to a Material Symbols ligature name. Full mapping table maintained in the implementation plan. Examples:

| Lucide | Material Symbol |
|---|---|
| Shield | shield |
| Users | group |
| User | person |
| Trash2 | delete |
| Clock | schedule |
| CalendarDays | calendar_month |
| LayoutDashboard | dashboard |
| ArrowLeftRight | swap_horiz |
| Check | check |
| X | close |
| ChevronDown | expand_more |
| Plus | add |

Alias imports (`User as UserIcon`, `Calendar as CalendarIcon`, `X as XIcon`, `Settings as SettingsIcon`, `PieChart as PieChartIcon`) all collapse into `<Icon name="..." />`.

### 4. Migration

- Update all 35 source files in `src/`:
  - Remove lucide/hugeicons import lines.
  - Add `import Icon from "../ui/Icon.jsx"` (path per file depth).
  - Replace every `<IconName ... />` JSX with `<Icon name="..." ... />`, preserving `size`, `className`, and other props.
- `src/components/ui/dropdown-menu.jsx`: replace `HugeiconsIcon icon={Tick02Icon}` → `<Icon name="check" />` and `ArrowRight01Icon` → `<Icon name="arrow_forward" />`.
- `src/components/ui/select.jsx`: `ChevronDown` → `<Icon name="expand_more" />`.
- `src/components/ui/calendar.jsx` / `date-picker.jsx`: `ChevronLeft/Right` → `chevron_left/chevron_right`, `CalendarIcon` → `calendar_month`.

### 5. Package removal

- `npm uninstall lucide-react @hugeicons/react @hugeicons/core-free-icons`
- Confirm zero references remain in `package.json` and `package-lock.json`.

### 6. Verification

- `npm run build` must succeed (Vite import analysis catches any missed import).
- Grep `src/` for `lucide-react`, `@hugeicons`, `HugeiconsIcon` → zero matches.
- Manual check in browser: icons render filled, rounded, weight 600, optical sizing applied.

## Scope guard

- Only `src/` source files are modified.
- References in `docs/`, `.superpowers/`, `.opencode/` are historical/planning artifacts and are left untouched.

## Out of scope

- No behavior changes, no layout changes, no new features.
- Icons whose Material Symbol equivalent is ambiguous are mapped to the closest semantic match.
