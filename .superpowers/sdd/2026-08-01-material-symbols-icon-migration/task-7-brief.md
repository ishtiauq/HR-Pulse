# Task 7 Brief — Migrate Payroll, Settings, Tasks, ProfileView

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `src/components/Payroll.jsx`, `src/components/Settings.jsx`, `src/components/Tasks.jsx`, `src/components/ProfileView.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1). Import path: `import Icon from "@/components/ui/Icon.jsx"`
- Produces: 4 clean components; Settings menu items become element refs

## Step 1: Migrate `src/components/Payroll.jsx`

Replace:
```jsx
import { Banknote, Download, Search, X, PlusCircle, Calendar, Pencil, CheckSquare, Trash2, ChevronDown, Check, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Banknote→payments, Download→download, Search→search, X→close, PlusCircle→add_circle, Calendar→calendar_month, Pencil→edit, CheckSquare→check_box, Trash2→delete, ChevronDown→keyboard_arrow_down, Check→check, User→person.

## Step 2: Migrate `src/components/Settings.jsx`

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

## Step 3: Migrate `src/components/Tasks.jsx`

Replace:
```jsx
import { Plus, Search, LayoutGrid, List, MoreVertical, Calendar as CalendarIcon, Edit, Trash2, CheckSquare, ChevronDown, MessageSquare, Send, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Plus→add, Search→search, LayoutGrid→grid_view, List→list, MoreVertical→more_vert, CalendarIcon→calendar_month, Edit→edit, Trash2→delete, CheckSquare→check_box, ChevronDown→keyboard_arrow_down, MessageSquare→chat, Send→send, User→person.

## Step 4: Migrate `src/components/ProfileView.jsx`

Replace `import { AlertCircle } from 'lucide-react'` with `import Icon from "@/components/ui/Icon.jsx"`. Replace `<AlertCircle ... />` → `<Icon name="error" ... />`.

## Step 5: Verify build + grep

Run: `npm run build`
Expected: success. Grep the 4 files for `lucide-react` — zero matches.

## Step 6: Commit

```bash
git add src/components/Payroll.jsx src/components/Settings.jsx src/components/Tasks.jsx src/components/ProfileView.jsx
git commit -m "refactor: migrate Payroll, Settings, Tasks, ProfileView to Material Symbols Icon"
```
