import { createElement } from 'react'
import Icon from '../components/ui/Icon.jsx'

export const EMPLOYEES_STORAGE_KEY = 'hr_pulse_employees'

export function timestampArrayChanges(prev, next) {
  if (!Array.isArray(prev) || !Array.isArray(next)) return next;
  const prevMap = new Map(prev.map(item => [item.id, item]));
  return next.map(item => {
    const prevItem = prevMap.get(item.id);
    if (!prevItem) {
      return { ...item, updated_at: new Date().toISOString() };
    }
    const cleanPrev = { ...prevItem, updated_at: undefined, _conflict: undefined };
    const cleanItem = { ...item, updated_at: undefined, _conflict: undefined };
    if (JSON.stringify(cleanPrev) !== JSON.stringify(cleanItem)) {
      return { ...item, updated_at: new Date().toISOString() };
    }
    return item;
  });
}

export const allNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: createElement(Icon, { name: 'dashboard', size: 18 }) },
  { id: 'tasks', label: 'Tasks', icon: createElement(Icon, { name: 'check_box', size: 18 }) },
  { id: 'announcements', label: 'Announcements', icon: createElement(Icon, { name: 'rss_feed', size: 18 }) },
  { id: 'calendar', label: 'Events', icon: createElement(Icon, { name: 'calendar_month', size: 18 }) },
  { id: 'documents', label: 'Documents', icon: createElement(Icon, { name: 'folder_open', size: 18 }) },
  { id: 'employees', label: 'Employees', icon: createElement(Icon, { name: 'group', size: 18 }) },
  { id: 'payroll', label: 'Payroll', icon: createElement(Icon, { name: 'account_balance', size: 18 }) },
  { id: 'attendance', label: 'Attendance & Leaves', icon: createElement(Icon, { name: 'schedule', size: 18 }) },
  { id: 'expenses', label: 'Expenses', icon: createElement(Icon, { name: 'wallet', size: 18 }) },
  { id: 'assets', label: 'Assets', icon: createElement(Icon, { name: 'devices_other', size: 18 }) },
  { id: 'settings', label: 'Settings', icon: createElement(Icon, { name: 'settings', size: 18 }) },
  { id: 'notes', label: 'Notes', icon: createElement(Icon, { name: 'sticky_note_2', size: 18 }) },
  { id: 'drive', label: 'Drive Sync', icon: createElement(Icon, { name: 'cloud_sync', size: 18 }) },
  { id: 'profile', label: 'Profile', icon: createElement(Icon, { name: 'person', size: 18 }) },
]
