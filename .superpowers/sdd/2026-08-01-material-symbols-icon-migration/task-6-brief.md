# Task 6 Brief — Migrate Assets, Announcements, Employees, Expenses

From plan: `docs/superpowers/plans/2026-08-01-material-symbols-icon-migration.md`

**Files:**
- Modify: `src/components/Assets.jsx`, `src/components/Announcements.jsx`, `src/components/Employees.jsx`, `src/components/Expenses.jsx`

**Interfaces:**
- Consumes: `Icon` (Task 1). Import path: `import Icon from "@/components/ui/Icon.jsx"`
- Produces: 4 clean components

## Step 1: Migrate `src/components/Assets.jsx`

Replace:
```jsx
import { Monitor, Plus, Search, AlertTriangle, PenTool, TrendingDown, Upload, FileSignature, Wrench, CheckCircle, BadgeCheck, MessageSquare, AlertCircle, Laptop, Smartphone, Speaker, Mouse, Key, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Monitor→monitor, Plus→add, Search→search, AlertTriangle→warning, PenTool→draw, TrendingDown→trending_down, Upload→upload, FileSignature→edit_document, Wrench→build, CheckCircle→check_circle, BadgeCheck→verified, MessageSquare→chat, AlertCircle→error, Laptop→laptop_windows, Smartphone→mobile, Speaker→speaker, Mouse→mouse, Key→key, User→person.

## Step 2: Migrate `src/components/Announcements.jsx`

Replace:
```jsx
import { Megaphone, Plus, Image as ImageIcon, FileText, Send, Calendar, Clock, Edit, Trash2, Users, AlertTriangle, MessageSquare, Heart, ThumbsUp, PartyPopper, User, Pencil, X } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Megaphone→campaign, Plus→add, ImageIcon→image, FileText→description, Send→send, Calendar→calendar_month, Clock→schedule, Edit→edit, Trash2→delete, Users→group, AlertTriangle→warning, MessageSquare→chat, Heart→favorite, ThumbsUp→thumb_up, PartyPopper→celebration, User→person, Pencil→edit, X→close.

## Step 3: Migrate `src/components/Employees.jsx`

Replace:
```jsx
import { Plus, Search, Trash2, UserPlus, X, Edit, Check, AlertCircle, FileSpreadsheet, Users, Mail, Eye, ChevronDown, Download, Building2, User } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Plus→add, Search→search, Trash2→delete, UserPlus→person_add, X→close, Edit→edit, Check→check, AlertCircle→error, FileSpreadsheet→table_chart, Users→group, Mail→mail, Eye→visibility, ChevronDown→keyboard_arrow_down, Download→download, Building2→apartment, User→person.

## Step 4: Migrate `src/components/Expenses.jsx`

Replace:
```jsx
import { Receipt, Plus, Upload, Check, X as XIcon, Clock, DollarSign, Filter, Search, Download, AlertTriangle, PieChart as PieChartIcon, User, History, List } from 'lucide-react'
```
with:
```jsx
import Icon from "@/components/ui/Icon.jsx"
```
Map: Receipt→receipt_long, Plus→add, Upload→upload, Check→check, XIcon→close, Clock→schedule, DollarSign→attach_money, Filter→filter_list, Search→search, Download→download, AlertTriangle→warning, PieChartIcon→pie_chart, User→person, History→history, List→list.

## Step 5: Verify build + grep

Run: `npm run build`
Expected: success. Grep the 4 files for `lucide-react` — zero matches.

## Step 6: Commit

```bash
git add src/components/Assets.jsx src/components/Announcements.jsx src/components/Employees.jsx src/components/Expenses.jsx
git commit -m "refactor: migrate Assets, Announcements, Employees, Expenses to Material Symbols Icon"
```
