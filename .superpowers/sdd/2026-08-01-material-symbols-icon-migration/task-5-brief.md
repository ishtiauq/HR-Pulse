# Task 5 Brief — Migrate Dashboard, Calendar, Documents, DriveSync

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `src/components/Dashboard.jsx`, `src/components/Calendar.jsx`, `src/components/Documents.jsx`, `src/components/DriveSync.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1). Import path: `import Icon from "@/components/ui/Icon.jsx"`
- Produces: 4 clean components; Dashboard's 3 inline SVG widgets replaced with `<Icon>`

## Step 1: Migrate `src/components/Dashboard.jsx`

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

Read the actual file to locate these exactly (line numbers may shift).

## Step 2: Migrate `src/components/Calendar.jsx`

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

## Step 3: Migrate `src/components/Documents.jsx`

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

## Step 4: Migrate `src/components/DriveSync.jsx`

Replace:
```jsx
import { CloudSync, HardDrive, CloudOff, CloudLightning, ArrowLeftRight, Download, Info, FileJson, AlertCircle, RefreshCw, X, Trash2, Shield, RotateCcw } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: CloudSync→cloud_sync, HardDrive→storage, CloudOff→cloud_off, CloudLightning→bolt, ArrowLeftRight→swap_horiz, Download→download, Info→info, FileJson→data_object, AlertCircle→error, RefreshCw→refresh, X→close, Trash2→delete, Shield→shield, RotateCcw→restart_alt.

## Step 5: Verify build + grep

Run: `npm run build`
Expected: success. Grep the 4 files for `lucide-react` — zero matches.

## Step 6: Commit

```bash
git add src/components/Dashboard.jsx src/components/Calendar.jsx src/components/Documents.jsx src/components/DriveSync.jsx
git commit -m "refactor: migrate Dashboard, Calendar, Documents, DriveSync to Material Symbols Icon"
```
