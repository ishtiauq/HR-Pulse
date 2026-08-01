# Task 1 Brief — Font package + `.msr` CSS + `Icon` component

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `package.json` (add `@fontsource-variable/material-symbols-rounded`)
- Modify: `src/index.css` (add `@import` + `.msr` class)
- Create: `src/components/ui/Icon.jsx`

**Interfaces:**
- Consumes: nothing
- Produces: `Icon` default export — `<Icon name="shield" size={14} className="text-primary" aria-label="Optional" />`

## Step 1: Install the font package

```bash
npm install @fontsource-variable/material-symbols-rounded@^5.3.1
```

## Step 2: Add the font import and `.msr` class to `src/index.css`

Add `@import "@fontsource-variable/material-symbols-rounded";` right after the existing `@import "@fontsource-variable/inter";` (line 4). Then append the `.msr` class at the end of the file:

```css
.msr {
  font-family: "Material Symbols Rounded Variable", "Material Symbols Rounded";
  font-weight: 600;
  font-style: normal;
  font-variation-settings: "FILL" 1, "wght" 600, "GRAD" 0, "opsz" auto;
  font-size: 1.25rem;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga";
  user-select: none;
}
```

## Step 3: Create `src/components/ui/Icon.jsx`

```jsx
import { cn } from "@/lib/utils"

export default function Icon({ name, size = 20, className, style, ariaLabel, ...props }) {
  return (
    <span
      className={cn("msr", className)}
      style={{ fontSize: size, ...style }}
      aria-hidden={ariaLabel ? undefined : "true"}
      aria-label={ariaLabel}
      {...props}
    >
      {name}
    </span>
  )
}
```

`src/lib/utils.js` exports `cn` as a named export — the path is correct. Verify it in place.

## Step 4: Verify build + component renders

Run: `npm run build`
Expected: build succeeds. Note: `Icon.jsx` itself isn't imported anywhere yet, so this only proves the CSS/font load.

## Step 5: Commit

```bash
git add package.json package-lock.json src/index.css src/components/ui/Icon.jsx
git commit -m "feat: add Material Symbols variable font and Icon component"
```
