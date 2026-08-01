# Task 3 Brief — Migrate `helpers.js` (nav config) + `layout/` components

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `src/utils/helpers.js`
- Modify: `src/components/layout/Sidebar.jsx`, `src/components/layout/Topbar.jsx`, `src/components/layout/CommandPalette.jsx`, `src/components/layout/ToastContainer.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1). Import path: in `src/components/layout/*.jsx` use `import Icon from "@/components/ui/Icon.jsx"`. In `src/utils/helpers.js` use `import Icon from '../components/ui/Icon.jsx'`.
- Produces: `allNavItems` with `icon` as React elements (`<Icon name="..." size={18} />`)

## Step 1: Migrate `src/utils/helpers.js`

Replace:
```jsx
import { LayoutDashboard, Users, User, Banknote, Clock, Receipt, Settings2, FolderOpen, Megaphone, CalendarDays, Laptop, CloudSync, CheckSquare } from 'lucide-react'
import { createElement } from 'react'
```
with:
```jsx
import { createElement } from 'react'
import Icon from '../components/ui/Icon.jsx'
```
Then replace each nav entry. `createElement(LayoutDashboard, { size: 18 })` becomes `createElement(Icon, { name: 'dashboard', size: 18 })`. Full mapping for `allNavItems`:
- dashboard → `dashboard`
- tasks (CheckSquare) → `check_box`
- announcements (Megaphone) → `campaign`
- calendar (CalendarDays) → `calendar_month`
- documents (FolderOpen) → `folder_open`
- employees (Users) → `group`
- payroll (Banknote) → `payments`
- attendance (Clock) → `schedule`
- expenses (Receipt) → `receipt_long`
- assets (Laptop) → `laptop_windows`
- settings (Settings2) → `settings`
- drive (CloudSync) → `cloud_sync`
- profile (User) → `person`

Read the actual file first — the exact import line and nav config may differ; map every icon used in `helpers.js` via the plan's table (rows 25-87). Verify no other lucide icons exist in the file beyond the migration.

## Step 2: Migrate `src/components/layout/Sidebar.jsx`

Replace:
```jsx
import { X, Shield, User as UserIcon, BadgeCheck, Building2, LogOut, ArrowLeftRight } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Replace direct JSX icons: `<ArrowLeftRight size={16} />` → `<Icon name="swap_horiz" size={16} />`, `<LogOut size={16} />` → `<Icon name="logout" size={16} />`, `<X size={16} />` → `<Icon name="close" size={16} />`.
The role options store component references:
```jsx
{ id: 'Admin', label: 'Admin', icon: Shield, ... },
{ id: 'Teammate', label: 'Teammate', icon: UserIcon, ... },
```
becomes:
```jsx
{ id: 'Admin', label: 'Admin', icon: <Icon name="shield" size={16} />, ... },
{ id: 'Teammate', label: 'Teammate', icon: <Icon name="person" size={16} />, ... },
```
And the render site `<role.icon size={16} />` becomes `{role.icon}`.
Note: `{item.icon}` (nav items from helpers) is unchanged — it already renders elements. Read the file first — there may be additional icons (BadgeCheck, Building2) to map via the table (BadgeCheck→verified, Building2→apartment).

## Step 3: Migrate `src/components/layout/Topbar.jsx`

Replace:
```jsx
import { Monitor, Sun, Moon, Menu, Bell, UserRound } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Replace each icon JSX per the mapping table: Monitor→monitor, Sun→light_mode, Moon→dark_mode, Menu→menu, Bell→notifications, UserRound→person. Read the file to get exact usage and props.

## Step 4: Migrate `src/components/layout/CommandPalette.jsx`

Replace `import { Search } from 'lucide-react'` with `import Icon from "@/components/ui/Icon.jsx"` and `<Search ... />` with `<Icon name="search" ... />`. Read the file for exact usage.

## Step 5: Migrate `src/components/layout/ToastContainer.jsx`

Replace `import { X, Bell } from 'lucide-react'` with `import Icon from "@/components/ui/Icon.jsx"`. Replace `<X ... />` → `<Icon name="close" ... />`, `<Bell ... />` → `<Icon name="notifications" ... />`. Read the file for exact usage.

## Step 6: Verify build + grep

Run: `npm run build`
Expected: success. Grep the 5 files for `lucide-react` — zero matches. Note: `useCommandPalette.jsx` still imports lucide — it is handled in Task 8, leave it.

## Step 7: Commit

```bash
git add src/utils/helpers.js src/components/layout/
git commit -m "refactor: migrate helpers nav config and layout components to Material Symbols Icon"
```
