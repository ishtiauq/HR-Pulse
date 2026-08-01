# Task 4 Brief — Migrate `attendance/` components (9 files)

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `src/components/attendance/AttendancePage.jsx`, `ClockWidget.jsx`, `DailyLogs.jsx`, `GeoCheckInWidget.jsx`, `GlassTimePicker.jsx`, `LeaveRequests.jsx`, `OvertimeClaims.jsx`, `RosterPlanner.jsx`, `ShiftSwaps.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1). Import path: `import Icon from "@/components/ui/Icon.jsx"`
- Produces: 9 clean attendance components

## Step 1: Migrate `src/components/attendance/AttendancePage.jsx`

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
Render site `<Icon size={15} /> {t.label}` becomes `{t.icon} {t.label}`. Header `<Clock size={20} className="text-primary" />` → `<Icon name="schedule" size={20} className="text-primary" />`. Read the file first — there may be additional lucide icons; map via plan table.

## Step 2: Migrate `src/components/attendance/ClockWidget.jsx`

`import { Clock } from 'lucide-react'` → `import Icon from "@/components/ui/Icon.jsx"`. Replace `<Clock ... />` → `<Icon name="schedule" ... />`. Read file for exact usage.

## Step 3: Migrate `src/components/attendance/GlassTimePicker.jsx`

Same as ClockWidget: `Clock` → `Icon` with name `schedule`. Read file for exact usage.

## Step 4: Migrate `src/components/attendance/DailyLogs.jsx`

Import: `CalendarDays, ChevronLeft, ChevronRight, Check, User, Clock, AlertTriangle` → `Icon`. Map: CalendarDays→calendar_month, ChevronLeft→chevron_left, ChevronRight→chevron_right, Check→check, User→person, Clock→schedule, AlertTriangle→warning.

## Step 5: Migrate `src/components/attendance/GeoCheckInWidget.jsx`

Import: `MapPin, Clock, CalendarCheck2, ShieldCheck, ShieldAlert, Loader2, PartyPopper, CheckCircle2` → `Icon`. Map: MapPin→pin_drop, Clock→schedule, CalendarCheck2→event_available, ShieldCheck→verified_user, ShieldAlert→gpp_maybe, Loader2→progress_activity, PartyPopper→celebration, CheckCircle2→check_circle.

## Step 6: Migrate `src/components/attendance/LeaveRequests.jsx`

Import: `Check, X, CalendarDays, AlertTriangle` → `Icon`. Map: Check→check, X→close, CalendarDays→calendar_month, AlertTriangle→warning.

## Step 7: Migrate `src/components/attendance/OvertimeClaims.jsx`

Import: `Clock, Check, X` → `Icon`. Map: Clock→schedule, Check→check, X→close.

## Step 8: Migrate `src/components/attendance/RosterPlanner.jsx`

Import: `CalendarDays, ChevronLeft, ChevronRight` → `Icon`. Map: CalendarDays→calendar_month, ChevronLeft→chevron_left, ChevronRight→chevron_right.

## Step 9: Migrate `src/components/attendance/ShiftSwaps.jsx`

Import: `Check, X, Repeat` → `Icon`. Map: Check→check, X→close, Repeat→repeat.

## Step 10: Verify build + grep

Run: `npm run build`
Expected: success. Grep `src/components/attendance/` for `lucide-react` — zero matches.

## Step 11: Commit

```bash
git add src/components/attendance/
git commit -m "refactor: migrate attendance components to Material Symbols Icon"
```
