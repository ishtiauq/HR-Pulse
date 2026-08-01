# Material Symbols Icon Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `lucide-react` and `@hugeicons/react` icons across the app with Google Material Symbols (Rounded, filled) rendered via a single `<Icon>` component, and remove the old icon packages completely.

**Architecture:** Install `@fontsource-variable/material-symbols-rounded` (self-hosted variable font, same pattern as the existing `@fontsource-variable/inter`). Create `src/components/ui/Icon.jsx` — a ligature-span component — and a `.msr` CSS class that applies the variable axes globally: `FILL=1`, `wght=600`, `GRAD=0`, `opsz` optical sizing. Migrate all 35 source files that import `lucide-react` or `@hugeicons/react`, then uninstall the three old packages and verify zero references remain.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, `@fontsource-variable/material-symbols-rounded` v5.3.1.

## Global Constraints

- The three old icon packages (`lucide-react`, `@hugeicons/react`, `@hugeicons/core-free-icons`) must be **completely removed** — zero references in `package.json`, `package-lock.json`, `node_modules`, or `src/`.
- Only `src/` source files are modified. `docs/`, `.superpowers/`, `.opencode/` references are historical and stay untouched.
- Font axes applied globally in one `.msr` class: `font-variation-settings: "FILL" 1, "wght" 600, "GRAD" 0, "opsz" auto` (optical sizing), `line-height: 1`, `user-select: none`.
- Every `<Icon>` span is `aria-hidden="true"` unless an `aria-label` is provided.
- Verify with `npm run build` (Vite import analysis fails on any unresolved import) and grep for `lucide-react|@hugeicons` in `src/`.

## Verified Icon Mapping Table

All 103 ligature names below were validated to exist in the `material-symbols-rounded` font (0.45.10 `index.d.ts`). `expand_more` and `smartphone` do NOT exist in the current set — `ChevronDown→keyboard_arrow_down` and `Smartphone→mobile` are the validated equivalents.

| Lucide/Hugeicons | Material Symbol | Lucide/Hugeicons | Material Symbol |
|---|---|---|---|
| Activity | monitoring | Megaphone | campaign |
| AlertCircle | error | Menu | menu |
| AlertTriangle | warning | MessageSquare | chat |
| ArrowLeft | arrow_back | Monitor | monitor |
| ArrowLeftRight | swap_horiz | Moon | dark_mode |
| ArrowRight | arrow_forward | MoreVertical | more_vert |
| ArrowUpDown | swap_vert | Mouse | mouse |
| Award | workspace_premium | PartyPopper | celebration |
| BadgeCheck | verified | Pencil | edit |
| Banknote | payments | PenTool | draw |
| Bell | notifications | Percent | percent |
| Building2 | apartment | Plus | add |
| Calendar | calendar_month | PlusCircle | add_circle |
| CalendarCheck2 | event_available | Receipt | receipt_long |
| CalendarClock | calendar_clock | RefreshCw | refresh |
| CalendarDays | calendar_month | Repeat | repeat |
| Check | check | RotateCcw | restart_alt |
| CheckCircle | check_circle | Save | save |
| CheckCircle2 | check_circle | Search | search |
| CheckSquare | check_box | Send | send |
| ChevronDown | **keyboard_arrow_down** | Settings | settings |
| ChevronLeft | chevron_left | Settings2 | settings |
| ChevronRight | chevron_right | Shield | shield |
| Clock | schedule | ShieldAlert | gpp_maybe |
| Cloud | cloud | ShieldCheck | verified_user |
| CloudLightning | bolt | Sliders | tune |
| CloudOff | cloud_off | **Smartphone** | **mobile** |
| CloudSync | cloud_sync | Speaker | speaker |
| Cpu | memory | Sun | light_mode |
| CreditCard | credit_card | ThumbsUp | thumb_up |
| DollarSign | attach_money | Trash2 | delete |
| Download | download | TrendingDown | trending_down |
| Edit | edit | Upload | upload |
| Eye | visibility | User | person |
| EyeOff | visibility_off | UserPlus | person_add |
| File | description | UserRound | person |
| FileArchive | folder_zip | Users | group |
| FileImage | image | Wrench | build |
| FileJson | data_object | X | close |
| FileSignature | edit_document | XCircle | cancel |
| FileSpreadsheet | table_chart | Image (as ImageIcon) | image |
| FileText | description | PieChart (as PieChartIcon) | pie_chart |
| Filter | filter_list | Calendar (as CalendarIcon) | calendar_month |
| Folder | folder | Settings (as SettingsIcon) | settings |
| FolderOpen | folder_open | User (as UserIcon) | person |
| Gift | redeem | X (as XIcon) | close |
| Globe | language | Tick02Icon (Hugeicons) | check |
| HardDrive | storage | ArrowRight01Icon (Hugeicons) | arrow_forward |
| Heart | favorite | Cloud (inline svg, Dashboard) | cloud |
| History | history | TrendingUp (inline svg, Dashboard) | trending_up |
| Home | home | Download (inline svg, Dashboard) | download |
| Info | info | | |
| Key | key | | |
| Laptop | laptop_windows | | |
| LayoutDashboard | dashboard | | |
| LayoutGrid | grid_view | | |
| List | list | | |
| Loader2 | progress_activity | | |
| Lock | lock | | |
| LogIn | login | | |
| LogOut | logout | | |
| Mail | mail | | |
| MapPin | pin_drop | | |

**Alias handling:** `import { Calendar as CalendarIcon }` etc. — the alias name becomes the `name` prop of `<Icon>`. All aliases collapse into `<Icon name="..." />`.

**Component-reference pattern:** Some files store icon components as values (`icon: Clock`, `const Icon = t.icon; <Icon size={15} />`). These become `icon: <Icon name="schedule" size={15} />` (element), and the render site changes from `const Icon = t.icon; <Icon size={15} />` to `{t.icon}`.

---

### Task 1: Font package + `.msr` CSS + `Icon` component

**Files:**
- Modify: `package.json` (add `@fontsource-variable/material-symbols-rounded`)
- Modify: `src/index.css` (add `@import` + `.msr` class)
- Create: `src/components/ui/Icon.jsx`

**Interfaces:**
- Consumes: nothing
- Produces: `Icon` default export — `<Icon name="shield" size={14} className="text-primary" aria-label="Optional" />`

- [ ] **Step 1: Install the font package**

```bash
npm install @fontsource-variable/material-symbols-rounded@^5.3.1
```

- [ ] **Step 2: Add the font import and `.msr` class to `src/index.css`**

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

- [ ] **Step 3: Create `src/components/ui/Icon.jsx`**

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

Verify `src/lib/utils.js` exports `cn` (used by other `ui/` components). If the path differs, match it.

- [ ] **Step 4: Verify build + component renders**

Run: `npm run build`
Expected: build succeeds. Note: `Icon.jsx` itself isn't imported anywhere yet, so this only proves the CSS/font load. Check in browser that a temporary `<Icon name="shield" />` renders a filled rounded shield at 600 weight (optional spot check).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/index.css src/components/ui/Icon.jsx
git commit -m "feat: add Material Symbols variable font and Icon component"
```

---

### Task 2: Migrate `ui/` components (calendar, date-picker, select, dropdown-menu)

**Files:**
- Modify: `src/components/ui/calendar.jsx`, `src/components/ui/date-picker.jsx`, `src/components/ui/select.jsx`, `src/components/ui/dropdown-menu.jsx`

**Interfaces:**
- Consumes: `Icon` from Task 1
- Produces: 4 clean `ui/` components with no lucide/hugeicons imports

- [ ] **Step 1: Migrate `src/components/ui/calendar.jsx`**

Replace:
```jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
```
with:
```jsx
import Icon from "./Icon.jsx"
```
Then replace every `<ChevronLeft ... />` with `<Icon name="chevron_left" ... />` and every `<ChevronRight ... />` with `<Icon name="chevron_right" ... />`, preserving all props. (Check the file for the exact JSX usage; keep `size`, `className` props unchanged.)

- [ ] **Step 2: Migrate `src/components/ui/date-picker.jsx`**

Replace:
```jsx
import { CalendarIcon } from 'lucide-react'
```
with:
```jsx
import Icon from "./Icon.jsx"
```
Replace `<CalendarIcon ... />` with `<Icon name="calendar_month" ... />`.

- [ ] **Step 3: Migrate `src/components/ui/select.jsx`**

Replace:
```jsx
import { ChevronDown } from "lucide-react"
```
with:
```jsx
import Icon from "./Icon.jsx"
```
Replace `<ChevronDown ... />` with `<Icon name="keyboard_arrow_down" ... />`.

- [ ] **Step 4: Migrate `src/components/ui/dropdown-menu.jsx`**

Replace:
```jsx
import { HugeiconsIcon } from "@hugeicons/react"
```
with:
```jsx
import Icon from "./Icon.jsx"
```
Then replace:
```jsx
<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
```
with:
```jsx
<Icon name="check" />
```
And:
```jsx
<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-auto" />
```
with:
```jsx
<Icon name="arrow_forward" className="ml-auto" />
```
Also remove any now-unused imports (`Tick02Icon`, `ArrowRight01Icon`) if they were imported separately — check the top of the file.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: success. Grep these 4 files for `lucide-react|Hugeicons|hugeicons` — zero matches.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "refactor: migrate ui components to Material Symbols Icon"
```

---

### Task 3: Migrate `helpers.js` (nav config) + `layout/` components

**Files:**
- Modify: `src/utils/helpers.js`
- Modify: `src/components/layout/Sidebar.jsx`, `src/components/layout/Topbar.jsx`, `src/components/layout/CommandPalette.jsx`, `src/components/layout/ToastContainer.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1)
- Produces: `allNavItems` with `icon` as React elements (`<Icon name="..." size={18} />`)

- [ ] **Step 1: Migrate `src/utils/helpers.js`**

Replace the import:
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

- [ ] **Step 2: Migrate `src/components/layout/Sidebar.jsx`**

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
Note: `{item.icon}` (nav items from helpers) is unchanged — it already renders elements.

- [ ] **Step 3: Migrate `src/components/layout/Topbar.jsx`**

Replace:
```jsx
import { Monitor, Sun, Moon, Menu, Bell, UserRound } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Replace each icon JSX per the mapping table: Monitor→monitor, Sun→light_mode, Moon→dark_mode, Menu→menu, Bell→notifications, UserRound→person.

- [ ] **Step 4: Migrate `src/components/layout/CommandPalette.jsx`**

Replace `import { Search } from 'lucide-react'` with `import Icon from "@/components/ui/Icon.jsx"` and `<Search ... />` with `<Icon name="search" ... />`.

- [ ] **Step 5: Migrate `src/components/layout/ToastContainer.jsx`**

Replace `import { X, Bell } from 'lucide-react'` with `import Icon from "@/components/ui/Icon.jsx"`. Replace `<X ... />` → `<Icon name="close" ... />`, `<Bell ... />` → `<Icon name="notifications" ... />`.

- [ ] **Step 6: Verify build + grep**

Run: `npm run build`
Expected: success. Grep the 5 files for `lucide-react` — zero matches. Note: `useCommandPalette.jsx` still imports lucide — it is handled in Task 8.

- [ ] **Step 7: Commit**

```bash
git add src/utils/helpers.js src/components/layout/
git commit -m "refactor: migrate helpers nav config and layout components to Material Symbols Icon"
```

---

### Task 4: Migrate `attendance/` components (9 files)

**Files:**
- Modify: `src/components/attendance/AttendancePage.jsx`, `ClockWidget.jsx`, `DailyLogs.jsx`, `GeoCheckInWidget.jsx`, `GlassTimePicker.jsx`, `LeaveRequests.jsx`, `OvertimeClaims.jsx`, `RosterPlanner.jsx`, `ShiftSwaps.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1)
- Produces: 9 clean attendance components

- [ ] **Step 1: Migrate `src/components/attendance/AttendancePage.jsx`**

Replace:
```jsx
import { Clock, CalendarDays, ArrowUpDown, Cpu } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Tabs store component refs:
```jsx
{ id: 'daily', label: 'Daily Logs', icon: Clock },
{ id: 'leave', label: 'Leave Requests', icon: CalendarDays },
{ id: 'roster', label: 'Roster', icon: ArrowUpDown },
{ id: 'overtime', label: 'Overtime', icon: Cpu },
```
becomes:
```jsx
{ id: 'daily', label: 'Daily Logs', icon: <Icon name="schedule" size={15} /> },
{ id: 'leave', label: 'Leave Requests', icon: <Icon name="calendar_month" size={15} /> },
{ id: 'roster', label: 'Roster', icon: <Icon name="swap_vert" size={15} /> },
{ id: 'overtime', label: 'Overtime', icon: <Icon name="memory" size={15} /> },
```
Render site `<Icon size={15} /> {t.label}` becomes `{t.icon} {t.label}`. Header `<Clock size={20} className="text-primary" />` → `<Icon name="schedule" size={20} className="text-primary" />`.

- [ ] **Step 2: Migrate `src/components/attendance/ClockWidget.jsx`**

`import { Clock } from 'lucide-react'` → `import Icon from "@/components/ui/Icon.jsx"`. Replace `<Clock ... />` → `<Icon name="schedule" ... />`.

- [ ] **Step 3: Migrate `src/components/attendance/GlassTimePicker.jsx`**

Same as ClockWidget: `Clock` → `Icon` with name `schedule`.

- [ ] **Step 4: Migrate `src/components/attendance/DailyLogs.jsx`**

Import: `CalendarDays, ChevronLeft, ChevronRight, Check, User, Clock, AlertTriangle` → `Icon`. Map: CalendarDays→calendar_month, ChevronLeft→chevron_left, ChevronRight→chevron_right, Check→check, User→person, Clock→schedule, AlertTriangle→warning.

- [ ] **Step 5: Migrate `src/components/attendance/GeoCheckInWidget.jsx`**

Import: `MapPin, Clock, CalendarCheck2, ShieldCheck, ShieldAlert, Loader2, PartyPopper, CheckCircle2` → `Icon`. Map: MapPin→pin_drop, Clock→schedule, CalendarCheck2→event_available, ShieldCheck→verified_user, ShieldAlert→gpp_maybe, Loader2→progress_activity, PartyPopper→celebration, CheckCircle2→check_circle.

- [ ] **Step 6: Migrate `src/components/attendance/LeaveRequests.jsx`**

Import: `Check, X, CalendarDays, AlertTriangle` → `Icon`. Map: Check→check, X→close, CalendarDays→calendar_month, AlertTriangle→warning.

- [ ] **Step 7: Migrate `src/components/attendance/OvertimeClaims.jsx`**

Import: `Clock, Check, X` → `Icon`. Map: Clock→schedule, Check→check, X→close.

- [ ] **Step 8: Migrate `src/components/attendance/RosterPlanner.jsx`**

Import: `CalendarDays, ChevronLeft, ChevronRight` → `Icon`. Map: CalendarDays→calendar_month, ChevronLeft→chevron_left, ChevronRight→chevron_right.

- [ ] **Step 9: Migrate `src/components/attendance/ShiftSwaps.jsx`**

Import: `Check, X, Repeat` → `Icon`. Map: Check→check, X→close, Repeat→repeat.

- [ ] **Step 10: Verify build + grep**

Run: `npm run build`
Expected: success. Grep `src/components/attendance/` for `lucide-react` — zero matches.

- [ ] **Step 11: Commit**

```bash
git add src/components/attendance/
git commit -m "refactor: migrate attendance components to Material Symbols Icon"
```

---

### Task 5: Migrate Dashboard, Calendar, Documents, DriveSync

**Files:**
- Modify: `src/components/Dashboard.jsx`, `src/components/Calendar.jsx`, `src/components/Documents.jsx`, `src/components/DriveSync.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1)
- Produces: 4 clean components; Dashboard's 3 inline SVG widgets replaced with `<Icon>`

- [ ] **Step 1: Migrate `src/components/Dashboard.jsx`**

Replace:
```jsx
import { Megaphone, Calendar as CalendarIcon, CreditCard, ChevronDown, LayoutDashboard, Gift, Award, Users, Activity, User, CheckSquare, FileText, Monitor } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Replace each icon JSX per mapping table:
- `icon={<Users size={18} />}` (2 occurrences) → `icon={<Icon name="group" size={18} />}`
- `icon={<Megaphone size={18} />}` → `icon={<Icon name="campaign" size={18} />}`
- `icon={<CreditCard size={18} />}` → `icon={<Icon name="credit_card" size={18} />}`
- `icon={<CalendarIcon size={18} />}` → `icon={<Icon name="calendar_month" size={18} />}`
- `icon={<Award size={18} />}` → `icon={<Icon name="workspace_premium" size={18} />}`
- `icon={<CheckSquare size={18} />}` → `icon={<Icon name="check_box" size={18} />}`
- `icon={<FileText size={18} />}` → `icon={<Icon name="description" size={18} />}`
- `icon={<Monitor size={18} />}` → `icon={<Icon name="monitor" size={18} />}`
- Any other lucide icons used as JSX in the file map via the table (ChevronDown→keyboard_arrow_down, Gift→redeem, Activity→monitoring, User→person, LayoutDashboard→dashboard).

**Inline SVG widgets:** Replace the three inline `<svg>` icons with `<Icon>`:
- Line ~329 (cloud path, "Drive Connection") → `icon={<Icon name="cloud" size={18} />}`
- Line ~519 (polyline 22 12 18 12 15 21 9 3 6 12 2 12, "Drive Sync Logs") → `icon={<Icon name="trending_up" size={18} />}`
- Line ~527 (download arrow path) → `<Icon name="download" size={15} />`

- [ ] **Step 2: Migrate `src/components/Calendar.jsx`**

Replace:
```jsx
import { Calendar as CalendarIcon, CalendarDays, Plus, Edit, Trash2, ChevronLeft, ChevronRight, FileText, Users, Gift, AlertTriangle, Clock, X } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
`EVENT_TYPES` stores component refs:
```jsx
{ id: 'meeting', label: 'Meeting', icon: Users, color: '#3b82f6' },
{ id: 'holiday', label: 'Holiday', icon: CalendarIcon, color: '#10b981' },
{ id: 'birthday', label: 'Birthday', icon: Gift, color: '#f59e0b' },
{ id: 'deadline', label: 'Deadline', icon: AlertTriangle, color: '#ef4444' },
{ id: 'other', label: 'Other', icon: FileText, color: '#8b5cf6' },
```
becomes:
```jsx
{ id: 'meeting', label: 'Meeting', icon: <Icon name="group" size={14} />, color: '#3b82f6' },
{ id: 'holiday', label: 'Holiday', icon: <Icon name="calendar_month" size={14} />, color: '#10b981' },
{ id: 'birthday', label: 'Birthday', icon: <Icon name="redeem" size={14} />, color: '#f59e0b' },
{ id: 'deadline', label: 'Deadline', icon: <Icon name="warning" size={14} />, color: '#ef4444' },
{ id: 'other', label: 'Other', icon: <Icon name="description" size={14} />, color: '#8b5cf6' },
```
Render sites: `const TypeIcon = typeInfo.icon; <TypeIcon size={16} />` → `{typeInfo.icon}`; `const Icon = t.icon; <Icon size={14} /> {t.label}` → `{t.icon} {t.label}`.
Direct JSX icons: ChevronLeft→chevron_left, ChevronRight→chevron_right, Plus→add, Edit→edit, Trash2→delete, CalendarIcon (list header + date, size 18/12)→calendar_month, Clock (time, size 12)→schedule, CalendarDays (page header, size 20)→calendar_month, X→close.

- [ ] **Step 3: Migrate `src/components/Documents.jsx`**

Replace:
```jsx
import { FileText, Search, Upload, Download, Trash2, X, Folder, FolderOpen, FileSpreadsheet, FileImage, FileArchive, File, Settings, Pencil, ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: FileText→description, Search→search, Upload→upload, Download→download, Trash2→delete, X→close, Folder→folder, FolderOpen→folder_open, FileSpreadsheet→table_chart, FileImage→image, FileArchive→folder_zip, File→description, Settings→settings, Pencil→edit, ChevronLeft→chevron_left, ChevronRight→chevron_right, Filter→filter_list, Plus→add.
`const CatIcon = catInfo.icon; <CatIcon size={10} className="inline mr-0.5" />` → `{catInfo.icon}` (with catInfo.icon set as `<Icon name="..." size={10} className="inline mr-0.5" />` elements wherever categories are defined — inspect the `catInfo`/category definitions in the file and apply the table).

- [ ] **Step 4: Migrate `src/components/DriveSync.jsx`**

Replace:
```jsx
import { CloudSync, HardDrive, CloudOff, CloudLightning, ArrowLeftRight, Download, Info, FileJson, AlertCircle, RefreshCw, X, Trash2, Shield, RotateCcw } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: CloudSync→cloud_sync, HardDrive→storage, CloudOff→cloud_off, CloudLightning→bolt, ArrowLeftRight→swap_horiz, Download→download, Info→info, FileJson→data_object, AlertCircle→error, RefreshCw→refresh, X→close, Trash2→delete, Shield→shield, RotateCcw→restart_alt.

- [ ] **Step 5: Verify build + grep**

Run: `npm run build`
Expected: success. Grep the 4 files for `lucide-react` — zero matches.

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard.jsx src/components/Calendar.jsx src/components/Documents.jsx src/components/DriveSync.jsx
git commit -m "refactor: migrate Dashboard, Calendar, Documents, DriveSync to Material Symbols Icon"
```

---

### Task 6: Migrate Assets, Announcements, Employees, Expenses

**Files:**
- Modify: `src/components/Assets.jsx`, `src/components/Announcements.jsx`, `src/components/Employees.jsx`, `src/components/Expenses.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1)
- Produces: 4 clean components

- [ ] **Step 1: Migrate `src/components/Assets.jsx`**

Replace:
```jsx
import { Monitor, Plus, Search, AlertTriangle, PenTool, TrendingDown, Upload, FileSignature, Wrench, CheckCircle, BadgeCheck, MessageSquare, AlertCircle, Laptop, Smartphone, Speaker, Mouse, Key, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Monitor→monitor, Plus→add, Search→search, AlertTriangle→warning, PenTool→draw, TrendingDown→trending_down, Upload→upload, FileSignature→edit_document, Wrench→build, CheckCircle→check_circle, BadgeCheck→verified, MessageSquare→chat, AlertCircle→error, Laptop→laptop_windows, **Smartphone→mobile**, Speaker→speaker, Mouse→mouse, Key→key, User→person.

- [ ] **Step 2: Migrate `src/components/Announcements.jsx`**

Replace:
```jsx
import { Megaphone, Plus, Image as ImageIcon, FileText, Send, Calendar, Clock, Edit, Trash2, Users, AlertTriangle, MessageSquare, Heart, ThumbsUp, PartyPopper, User, Pencil, X } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Megaphone→campaign, Plus→add, ImageIcon→image, FileText→description, Send→send, Calendar→calendar_month, Clock→schedule, Edit→edit, Trash2→delete, Users→group, AlertTriangle→warning, MessageSquare→chat, Heart→favorite, ThumbsUp→thumb_up, PartyPopper→celebration, User→person, Pencil→edit, X→close.

- [ ] **Step 3: Migrate `src/components/Employees.jsx`**

Replace:
```jsx
import { Plus, Search, Trash2, UserPlus, X, Edit, Check, AlertCircle, FileSpreadsheet, Users, Mail, Eye, ChevronDown, Download, Building2, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Plus→add, Search→search, Trash2→delete, UserPlus→person_add, X→close, Edit→edit, Check→check, AlertCircle→error, FileSpreadsheet→table_chart, Users→group, Mail→mail, Eye→visibility, ChevronDown→keyboard_arrow_down, Download→download, Building2→apartment, User→person.

- [ ] **Step 4: Migrate `src/components/Expenses.jsx`**

Replace:
```jsx
import { Receipt, Plus, Upload, Check, X as XIcon, Clock, DollarSign, Filter, Search, Download, AlertTriangle, PieChart as PieChartIcon, User, History, List } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Receipt→receipt_long, Plus→add, Upload→upload, Check→check, XIcon→close, Clock→schedule, DollarSign→attach_money, Filter→filter_list, Search→search, Download→download, AlertTriangle→warning, PieChartIcon→pie_chart, User→person, History→history, List→list.

- [ ] **Step 5: Verify build + grep**

Run: `npm run build`
Expected: success. Grep the 4 files for `lucide-react` — zero matches.

- [ ] **Step 6: Commit**

```bash
git add src/components/Assets.jsx src/components/Announcements.jsx src/components/Employees.jsx src/components/Expenses.jsx
git commit -m "refactor: migrate Assets, Announcements, Employees, Expenses to Material Symbols Icon"
```

---

### Task 7: Migrate Payroll, Settings, Tasks, ProfileView

**Files:**
- Modify: `src/components/Payroll.jsx`, `src/components/Settings.jsx`, `src/components/Tasks.jsx`, `src/components/ProfileView.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1)
- Produces: 4 clean components; Settings menu items become element refs

- [ ] **Step 1: Migrate `src/components/Payroll.jsx`**

Replace:
```jsx
import { Banknote, Download, Search, X, PlusCircle, Calendar, Pencil, CheckSquare, Trash2, ChevronDown, Check, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Banknote→payments, Download→download, Search→search, X→close, PlusCircle→add_circle, Calendar→calendar_month, Pencil→edit, CheckSquare→check_box, Trash2→delete, ChevronDown→keyboard_arrow_down, Check→check, User→person.

- [ ] **Step 2: Migrate `src/components/Settings.jsx`**

Replace:
```jsx
import { Save, Settings2, DollarSign, Sliders, Info, Percent, Building2, Bell, Globe, Mail, Plus, Trash2, Upload, Activity, X, ShieldCheck, List, FileSpreadsheet, Download, Receipt, CalendarClock, Check, ChevronDown, MapPin, Search, Sun, Moon } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
The `menuItems` array stores component refs (`icon: Sun`, etc.). Convert each to `<Icon name="..." />` element:
- theme (Sun) → `light_mode`
- payroll (Sliders) → `tune`
- company (Building2) → `apartment`
- attendance (MapPin) → `pin_drop`
- expenses (Receipt) → `receipt_long`
- rosters (CalendarClock) → `calendar_clock`
- notifications (Bell) → `notifications`
- audit (List) → `list`
- security (ShieldCheck) → `verified_user`
- sync (Activity) → `monitoring`
Render site `const Icon = item.icon; <Icon className="h-5 w-5" />` → `{item.icon}`.
All direct JSX icons map per table: Save→save, Settings2→settings, DollarSign→attach_money, Info→info, Percent→percent, Globe→language, Mail→mail, Plus→add, Trash2→delete, Upload→upload, X→close, FileSpreadsheet→table_chart, Download→download, Check→check, ChevronDown→keyboard_arrow_down, Search→search, Moon→dark_mode, Sun→light_mode, MapPin→pin_drop, Clock→schedule, CalendarClock→calendar_clock, Activity→monitoring.
**Important:** `Settings.jsx` also imports `L from "leaflet"` and uses `L.Icon.Default` — do NOT touch those leaflet references (they're unrelated to the icon packs).

- [ ] **Step 3: Migrate `src/components/Tasks.jsx`**

Replace:
```jsx
import { Plus, Search, LayoutGrid, List, MoreVertical, Calendar as CalendarIcon, Edit, Trash2, CheckSquare, ChevronDown, MessageSquare, Send, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Plus→add, Search→search, LayoutGrid→grid_view, List→list, MoreVertical→more_vert, CalendarIcon→calendar_month, Edit→edit, Trash2→delete, CheckSquare→check_box, ChevronDown→keyboard_arrow_down, MessageSquare→chat, Send→send, User→person.

- [ ] **Step 4: Migrate `src/components/ProfileView.jsx`**

Replace `import { AlertCircle } from 'lucide-react'` with `import Icon from "@/components/ui/Icon.jsx"`. Replace `<AlertCircle ... />` → `<Icon name="error" ... />`.

- [ ] **Step 5: Verify build + grep**

Run: `npm run build`
Expected: success. Grep the 4 files for `lucide-react` — zero matches.

- [ ] **Step 6: Commit**

```bash
git add src/components/Payroll.jsx src/components/Settings.jsx src/components/Tasks.jsx src/components/ProfileView.jsx
git commit -m "refactor: migrate Payroll, Settings, Tasks, ProfileView to Material Symbols Icon"
```

---

### Task 8: Migrate auth/portal components, hooks, App.jsx

**Files:**
- Modify: `src/components/Login.jsx`, `src/components/EmployeeLogin.jsx`, `src/components/EmployeePortal.jsx`, `src/hooks/useCommandPalette.jsx`, `src/App.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1)
- Produces: clean files; last `lucide-react` references in `src/` removed

- [ ] **Step 1: Migrate `src/components/Login.jsx`**

Replace:
```jsx
import { Shield, User, ArrowRight, Cloud, Eye, EyeOff, Activity, Moon, Sun } from 'lucide-react'
```
(actual import spans lines — match exactly what's in the file) with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Shield→shield, User→person, ArrowRight→arrow_forward, Cloud→cloud, Eye→visibility, EyeOff→visibility_off, Activity→monitoring, Moon→dark_mode, Sun→light_mode.

- [ ] **Step 2: Migrate `src/components/EmployeeLogin.jsx`**

Replace:
```jsx
import { LogIn, ArrowLeft, Shield, Activity, Lock, Eye, EyeOff, Users } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: LogIn→login, ArrowLeft→arrow_back, Shield→shield, Activity→monitoring, Lock→lock, Eye→visibility, EyeOff→visibility_off, Users→group.

- [ ] **Step 3: Migrate `src/components/EmployeePortal.jsx`**

Replace:
```jsx
import { Home, Calendar as CalendarIcon, FileText, User as UserIcon, Plus, Send, Download, CheckCircle2, XCircle, Clock, AlertCircle, User, Megaphone, MessageSquare, Heart, ThumbsUp, PartyPopper, Monitor, Sun, Moon, AlertTriangle, Upload, CheckSquare, CalendarDays, Menu, Receipt, FolderOpen, ArrowLeftRight, LogOut, LogIn, X, Bell } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map per table: Home→home, CalendarIcon→calendar_month, FileText→description, UserIcon→person, Plus→add, Send→send, Download→download, CheckCircle2→check_circle, XCircle→cancel, Clock→schedule, AlertCircle→error, User→person, Megaphone→campaign, MessageSquare→chat, Heart→favorite, ThumbsUp→thumb_up, PartyPopper→celebration, Monitor→monitor, Sun→light_mode, Moon→dark_mode, AlertTriangle→warning, Upload→upload, CheckSquare→check_box, CalendarDays→calendar_month, Menu→menu, Receipt→receipt_long, FolderOpen→folder_open, ArrowLeftRight→swap_horiz, LogOut→logout, LogIn→login, X→close, Bell→notifications.
The nav `{item.icon}` render site is unchanged (already renders elements).

- [ ] **Step 4: Migrate `src/hooks/useCommandPalette.jsx`**

Replace:
```jsx
import { User, History, Moon, Sun, Trash2, HardDrive, LayoutDashboard, Settings as SettingsIcon, FileText } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: User→person, History→history, Moon→dark_mode, Sun→light_mode, Trash2→delete, HardDrive→storage, LayoutDashboard→dashboard, SettingsIcon→settings, FileText→description.

- [ ] **Step 5: Migrate `src/App.jsx`**

Replace:
```jsx
import { Monitor, Sun, Moon, User as UserIcon, Menu, XCircle, LayoutDashboard, Users, Clock, Megaphone, ArrowLeftRight, LogOut, Bell, Home } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Monitor→monitor, Sun→light_mode, Moon→dark_mode, UserIcon→person, Menu→menu, XCircle→cancel, LayoutDashboard→dashboard, Users→group, Clock→schedule, Megaphone→campaign, ArrowLeftRight→swap_horiz, LogOut→logout, Bell→notifications, Home→home.
The `{item.icon}` nav render sites (both in App.jsx and elsewhere) are unchanged — helpers.js already provides elements.

- [ ] **Step 6: Verify whole `src/` is clean + build**

```bash
npm run build
```
Then:
```bash
findstr /s /n "lucide-react @hugeicons HugeiconsIcon" src\*.*
```
Expected: build succeeds; findstr returns nothing (or only comments). If any match remains in `src/`, fix it before proceeding.

- [ ] **Step 7: Commit**

```bash
git add src/components/Login.jsx src/components/EmployeeLogin.jsx src/components/EmployeePortal.jsx src/hooks/useCommandPalette.jsx src/App.jsx
git commit -m "refactor: migrate auth, portal, hooks, and App to Material Symbols Icon"
```

---

### Task 9: Remove old icon packages and verify no trace

**Files:**
- Modify: `package.json`, `package-lock.json`
- Remove from: `node_modules/`

**Interfaces:**
- Consumes: all Tasks 1-8 complete (`src/` has zero references)
- Produces: clean repo with only `@fontsource-variable/material-symbols-rounded` for icons

- [ ] **Step 1: Uninstall the three old packages**

```bash
npm uninstall lucide-react @hugeicons/react @hugeicons/core-free-icons
```

- [ ] **Step 2: Verify zero references in package files**

```bash
findstr /n "lucide-react @hugeicons" package.json package-lock.json
```
Expected: no matches. (If `@hugeicons/core-free-icons` appears only as a transitive dep reference, it must still be gone — re-run `npm uninstall` / `npm install` to regenerate the lockfile cleanly.)

- [ ] **Step 3: Verify node_modules clean**

```bash
if exist node_modules\lucide-react (echo STILL PRESENT) else (echo lucide-react REMOVED)
if exist node_modules\@hugeicons (echo STILL PRESENT) else (echo @hugeicons REMOVED)
```
Expected: both REMOVED.

- [ ] **Step 4: Full verification — build + grep**

```bash
npm run build
findstr /s /n "lucide-react @hugeicons HugeiconsIcon" src\*.*
```
Expected: build succeeds; zero matches in `src/`.

- [ ] **Step 5: Visual smoke test (manual)**

In the running dev server (or after `npm run dev`), open the app and check:
- Sidebar nav icons render filled, rounded, weight 600 (dense but not heavy)
- Dropdown menus, calendar chevrons, login shield, dashboard widgets all show icons
- No missing-glyph boxes (a box/blank where an icon should be means a wrong ligature name)
- Optical sizing adapts icon at small sizes (14-15px) vs large (32px)

If any glyph is missing, look up the correct current name in the font list (`node_modules/material-symbols/...` is gone; use the `index.d.ts` you can regenerate by `npm pack material-symbols` or the Fontsource glyph list) and fix the `name` prop.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove lucide-react and hugeicons icon packages"
```

---

### Task 10: Final self-review pass

**Files:** all migrated files (read-only verification)

- [ ] **Step 1: Grep entire `src/` for leftover icon imports**

```bash
findstr /s /n "lucide-react @hugeicons HugeiconsIcon lucide" src\*.*
```
Expected: zero matches (allow `lucide` in comments only if pre-existing — verify none).

- [ ] **Step 2: Spot-check 3 files for pattern correctness**

Read `src/components/ui/select.jsx`, `src/components/attendance/AttendancePage.jsx`, `src/components/Settings.jsx`. Confirm:
- No lucide/hugeicons imports
- `<Icon name="..." />` used consistently
- Component-reference render sites use `{t.icon}` / `{item.icon}` not `const Icon = ...`
- `aria-hidden` present (component default) — no manual aria props needed unless original had them

- [ ] **Step 3: Final build**

```bash
npm run build
```
Expected: success, no warnings about unresolved imports.

- [ ] **Step 4: Update the design spec status (optional)**

Mark the migration complete in `docs/superpowers/specs/2026-08-01-material-symbols-icon-migration-design.md` (append a "Status: Implemented" note).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final verification for Material Symbols icon migration"
```
