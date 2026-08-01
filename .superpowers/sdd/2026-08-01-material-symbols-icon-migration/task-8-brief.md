# Task 8 Brief — Migrate auth/portal components, hooks, App.jsx

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `src/components/Login.jsx`, `src/components/EmployeeLogin.jsx`, `src/components/EmployeePortal.jsx`, `src/hooks/useCommandPalette.jsx`, `src/App.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1). Import path: `import Icon from "@/components/ui/Icon.jsx"`
- Produces: clean files; last `lucide-react` references in `src/` removed

## Step 1: Migrate `src/components/Login.jsx`

Replace the lucide import (spans lines — match exactly what's in the file):
```jsx
import { Shield, User, ArrowRight, Cloud, Eye, EyeOff, Activity, Moon, Sun } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Shield→shield, User→person, ArrowRight→arrow_forward, Cloud→cloud, Eye→visibility, EyeOff→visibility_off, Activity→monitoring, Moon→dark_mode, Sun→light_mode.

## Step 2: Migrate `src/components/EmployeeLogin.jsx`

Replace:
```jsx
import { LogIn, ArrowLeft, Shield, Activity, Lock, Eye, EyeOff, Users } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: LogIn→login, ArrowLeft→arrow_back, Shield→shield, Activity→monitoring, Lock→lock, Eye→visibility, EyeOff→visibility_off, Users→group.

## Step 3: Migrate `src/components/EmployeePortal.jsx`

Replace:
```jsx
import { Home, Calendar as CalendarIcon, FileText, User as UserIcon, Plus, Send, Download, CheckCircle2, XCircle, Clock, AlertCircle, User, Megaphone, MessageSquare, Heart, ThumbsUp, PartyPopper, Monitor, Sun, Moon, AlertTriangle, Upload, CheckSquare, CalendarDays, Menu, Receipt, FolderOpen, ArrowLeftRight, LogOut, LogIn, X, Bell } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map per table: Home→home, CalendarIcon→calendar_month, FileText→description, UserIcon→person, Plus→add, Send→send, Download→download, CheckCircle2→check_circle, XCircle→cancel, Clock→schedule, AlertCircle→error, User→person, Megaphone→campaign, MessageSquare→chat, Heart→favorite, ThumbsUp→thumb_up, PartyPopper→celebration, Monitor→monitor, Sun→light_mode, Moon→dark_mode, AlertTriangle→warning, Upload→upload, CheckSquare→check_box, CalendarDays→calendar_month, Menu→menu, Receipt→receipt_long, FolderOpen→folder_open, ArrowLeftRight→swap_horiz, LogOut→logout, LogIn→login, X→close, Bell→notifications.
The nav `{item.icon}` render site is unchanged (already renders elements — EmployeePortal nav uses component-ref elements `icon: <Home size={18} />` which become `icon: <Icon name="home" size={18} />`).

## Step 4: Migrate `src/hooks/useCommandPalette.jsx`

Replace:
```jsx
import { User, History, Moon, Sun, Trash2, HardDrive, LayoutDashboard, Settings as SettingsIcon, FileText } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: User→person, History→history, Moon→dark_mode, Sun→light_mode, Trash2→delete, HardDrive→storage, LayoutDashboard→dashboard, SettingsIcon→settings, FileText→description.

## Step 5: Migrate `src/App.jsx`

Replace:
```jsx
import { Monitor, Sun, Moon, User as UserIcon, Menu, XCircle, LayoutDashboard, Users, Clock, Megaphone, ArrowLeftRight, LogOut, Bell, Home } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Monitor→monitor, Sun→light_mode, Moon→dark_mode, UserIcon→person, Menu→menu, XCircle→cancel, LayoutDashboard→dashboard, Users→group, Clock→schedule, Megaphone→campaign, ArrowLeftRight→swap_horiz, LogOut→logout, Bell→notifications, Home→home.
The `{item.icon}` nav render sites are unchanged — helpers.js already provides elements.

## Step 6: Verify whole `src/` is clean + build

```bash
npm run build
```
Then:
```bash
findstr /s /n "lucide-react @hugeicons HugeiconsIcon" src\*.*
```
Expected: build succeeds; findstr returns nothing (or only comments). If any match remains in `src/`, fix it before proceeding.

## Step 7: Commit

```bash
git add src/components/Login.jsx src/components/EmployeeLogin.jsx src/components/EmployeePortal.jsx src/hooks/useCommandPalette.jsx src/App.jsx
git commit -m "refactor: migrate auth, portal, hooks, and App to Material Symbols Icon"
```
