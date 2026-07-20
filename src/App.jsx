import { useState, useEffect } from 'react'
import { TopAppBar, NavigationRail, IconButton, Badge, Avatar, Button, Dialog, Divider } from 'actify'
import Dashboard from './components/Dashboard.jsx'
import Employees from './components/Employees.jsx'
import DriveSync from './components/DriveSync.jsx'
import Login from './components/Login.jsx'
import Payroll from './components/Payroll.jsx'
import Settings from './components/Settings.jsx'
import Attendance from './components/Attendance.jsx'
import Reports from './components/Reports.jsx'
import Expenses from './components/Expenses.jsx'
import Announcements from './components/Announcements.jsx'
import Assets from './components/Assets.jsx'
import Calendar from './components/Calendar.jsx'
import Documents from './components/Documents.jsx'
import EmployeePortal from './components/EmployeePortal.jsx'
import { readMeta, writeMeta, readTable, writeTable, flushPendingWrites, checkAndRunAutoBackup, createBackup } from './services/googleDrive.js'
import { clearLocalCache } from './services/db.js'
import { validateDatabase } from './services/validator.js'
import { Bell, AlertTriangle, Search, LayoutDashboard, Users, CreditCard, Calendar as CalendarIcon, Receipt, BarChart3, Settings as SettingsIcon, HardDrive, FileText, Megaphone, CalendarDays, Monitor, Database, User, History, Moon, Sparkles, Trash2, LogOut, Sun, HelpCircle, X, Activity } from 'lucide-react'
import { useModal } from './services/useModal.js'

const EMPLOYEES_STORAGE_KEY = 'hr_pulse_employees'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

const deriveAesKey = async (material) => {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(material))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

const encryptJson = async (value, keyMaterial) => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(keyMaterial)
  const plaintext = textEncoder.encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return JSON.stringify({
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext))
  })
}

const decryptJson = async (payload, keyMaterial) => {
  const parsed = JSON.parse(payload)
  if (!parsed?.iv || !parsed?.data) return null
  const key = await deriveAesKey(keyMaterial)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(parsed.iv) },
    key,
    fromBase64(parsed.data)
  )
  return JSON.parse(textDecoder.decode(new Uint8Array(decrypted)))
}

function timestampArrayChanges(prev, next) {
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

const allNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={20} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={20} /> },
  { id: 'employees', label: 'Employees', icon: <Users size={20} /> },
  { id: 'payroll', label: 'Payroll', icon: <CreditCard size={20} /> },
  { id: 'attendance', label: 'Leaves & Attendance', icon: <CalendarIcon size={20} /> },
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={20} /> },
  { id: 'assets', label: 'Assets', icon: <Monitor size={20} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  { id: 'drive', label: 'Drive Sync', icon: <Database size={20} /> },
]

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_user')
    return saved ? JSON.parse(saved) : null
  })
  const [currentView, setCurrentView] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [driveConnected, setDriveConnected] = useState(true)
  const [driveFileId, setDriveFileId] = useState(null)
  const [payrollFileId, setPayrollFileId] = useState(null)
  const [settingsFileId, setSettingsFileId] = useState(null)
  const [attendanceFileId, setAttendanceFileId] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [dbStatus, setDbStatus] = useState('healthy')
  const [dataIntegrityIssues, setDataIntegrityIssues] = useState([])
  const [showCorruptionModal, setShowCorruptionModal] = useState(false)
  useModal(() => setShowCorruptionModal(false))
  const [syncConflicts, setSyncConflicts] = useState([])
  const [metaManifest, setMetaManifest] = useState(null)
  const [isAppLoading, setIsAppLoading] = useState(true)

  const [simulatedRole, setSimulatedRole] = useState('Admin')
  const [pendingProfileEdits, setPendingProfileEdits] = useState([])
  const [auditLogs, setAuditLogs] = useState([
    { id: 'audit-1', timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'System', action: 'CREATE', entity: 'System', details: 'Initialized audit logging.', ip: '192.168.1.1' }
  ])

  const addAuditLog = (action, entity, details) => {
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Admin',
      action,
      entity,
      details,
      ip: '192.168.1.1'
    }
    setAuditLogs(prev => [newLog, ...prev])
  }

  const hasPermission = (resource) => {
    if (simulatedRole === 'Admin') return true
    if (simulatedRole === 'Employee') {
      return ['dashboard', 'attendance', 'expenses', 'calendar'].includes(resource)
    }
    if (simulatedRole === 'Payroll Manager') {
      return ['dashboard', 'employees', 'payroll', 'reports', 'expenses', 'calendar', 'documents'].includes(resource)
    }
    if (simulatedRole === 'HR Manager') {
      return ['dashboard', 'employees', 'attendance', 'payroll', 'reports', 'expenses', 'calendar', 'documents'].includes(resource)
    }
    return false
  }

  const [toasts, setToasts] = useState([])
  const addToast = (message, type = 'success', action = null) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, action }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const [notifications, setNotifications] = useState([
    { id: 'notif-1', text: 'Your leave request was approved', read: false, time: '2 mins ago' },
    { id: 'notif-2', text: 'New leave request from Sarah Rahman', read: false, time: '1 hour ago' }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  
  const addNotification = (text) => {
    setNotifications(prev => [{ id: `notif-${Date.now()}`, text, read: false, time: 'Just now' }, ...prev])
  }
  
  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('hr_pulse_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('hr_pulse_theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 500)
    return () => clearTimeout(timer)
  }, [currentView])

  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandSearch, setCommandSearch] = useState('')
  const [paletteIndex, setPaletteIndex] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [recentActions, setRecentActions] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_recent_actions')
    return saved ? JSON.parse(saved) : [
      { id: 'page-employees', type: 'page', label: 'Go to Employees', view: 'employees' },
      { id: 'page-attendance', type: 'page', label: 'Go to Attendance & Leaves', view: 'attendance' }
    ]
  })

  useEffect(() => {
    localStorage.setItem('hr_pulse_recent_actions', JSON.stringify(recentActions))
  }, [recentActions])

  const trackRecentAction = (action) => {
    setRecentActions(prev => {
      const filtered = prev.filter(a => a.id !== action.id)
      const next = [action, ...filtered].slice(0, 5)
      return next
    })
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
        setCommandSearch('')
        setPaletteIndex(0)
        return
      }

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowCommandPalette(false)
          setCommandSearch('')
          setPaletteIndex(0)
          e.target.blur()
        } else {
          return
        }
      }

      if (e.key === '/') {
        e.preventDefault()
        setShowCommandPalette(true)
        setCommandSearch('')
        setPaletteIndex(0)
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setCurrentView('employees')
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        addToast('Save shortcut triggered', 'info')
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false)
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogin = (userInfo) => {
    setUser(userInfo)
    localStorage.setItem('hr_pulse_user', JSON.stringify(userInfo))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('hr_pulse_user')
    setCurrentView('dashboard')
  }

  const [employees, setEmployees] = useState(() => {
    return [
      { 
        id: 'EMP-101', 
        name: 'Ishtiauq Ahmed', 
        role: 'HR Manager', 
        department: 'Human Resources', 
        status: 'Active', 
        email: 'ishtiauq@gmail.com', 
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        dob: '1992-04-18',
        joiningDate: '2021-08-01',
        cvFileName: 'Ishtiauq_CV.pdf',
        nidFileName: 'Ishtiauq_Passport.pdf'
      },
      { 
        id: 'EMP-102', 
        name: 'Sarah Rahman', 
        role: 'Lead Frontend Developer', 
        department: 'Engineering', 
        status: 'Active', 
        email: 'sarah.r@hrpulse.io', 
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        dob: '1995-07-30',
        joiningDate: '2023-01-15',
        cvFileName: 'Sarah_Frontend_CV.pdf',
        nidFileName: 'Sarah_NID.jpg'
      },
      { 
        id: 'EMP-103', 
        name: 'Nafis Chowdhury', 
        role: 'Senior Product Designer', 
        department: 'Design', 
        status: 'Active', 
        email: 'nafis.c@hrpulse.io', 
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        dob: '1994-07-25',
        joiningDate: '2023-06-01',
        cvFileName: 'Nafis_Design_Portfolio.pdf',
        nidFileName: 'Nafis_Passport.pdf'
      },
      { 
        id: 'EMP-104', 
        name: 'Tanvir Hasan', 
        role: 'QA Automation Engineer', 
        department: 'Engineering', 
        status: 'On Leave', 
        email: 'tanvir.h@hrpulse.io', 
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        dob: '1993-12-05',
        joiningDate: '2024-02-10',
        cvFileName: 'Tanvir_QA_Resume.pdf',
        nidFileName: 'Tanvir_NID.jpg'
      }
    ]
  })

  const [payroll, setPayroll] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_payroll')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved payroll:', e)
      }
    }
    return {
      '2026-07': [
        { employeeId: 'EMP-101', grossSalary: 3200, status: 'Paid', paymentDate: 'July 15, 2026', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } },
        { employeeId: 'EMP-102', grossSalary: 4500, status: 'Pending', paymentDate: '', advance: 150, loan: { total: 1000, installment: 100, remaining: 900 } },
        { employeeId: 'EMP-103', grossSalary: 4000, status: 'Pending', paymentDate: '', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } },
        { employeeId: 'EMP-104', grossSalary: 5200, status: 'Pending', paymentDate: '', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } }
      ]
    }
  })

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_attendance')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved attendance:', e)
      }
    }
    return { 
      leaves: [], 
      dailyLogs: {
        '2026-07-17': {
          'EMP-101': { checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0', status: 'Present' },
          'EMP-102': { checkIn: '09:15 AM', checkOut: '06:00 PM', hours: '8.7', status: 'Present' },
          'EMP-103': { checkIn: '', checkOut: '', hours: '0.0', status: 'Absent' },
          'EMP-104': { checkIn: '', checkOut: '', hours: '0.0', status: 'On Leave' }
        }
      }, 
      balances: {} 
    }
  })

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_expenses')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { console.error(e) }
    }
    return [
      { id: 'EXP-101', employeeId: 'EMP-101', category: 'Medical', amount: 120, currency: '$', date: '2026-07-15', description: 'Annual checkup', status: 'Pending', receipt: null },
      { id: 'EXP-102', employeeId: 'EMP-102', category: 'Office Supplies', amount: 45, currency: '$', date: '2026-07-16', description: 'Mechanical keyboard', status: 'Approved', receipt: null }
    ]
  })

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_events')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return [
      { id: 'evt-1', title: 'Company Town Hall', date: '2026-07-20', time: '14:00', type: 'meeting', description: 'Quarterly all-hands meeting', createdBy: 'EMP-101', createdAt: new Date().toISOString() },
      { id: 'evt-2', title: 'Independence Day', date: '2026-08-15', time: '', type: 'holiday', description: 'National holiday', createdBy: 'EMP-101', createdAt: new Date().toISOString() },
      { id: 'evt-3', title: "Sarah's Birthday", date: '2026-07-30', time: '', type: 'birthday', description: '', createdBy: 'EMP-101', createdAt: new Date().toISOString() },
    ]
  })

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_documents')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return [
      { id: 'doc-1', name: 'Employee Handbook 2026', category: 'hr-docs', description: 'Official company policies and procedures handbook', fileName: 'Employee_Handbook_2026.pdf', fileSize: 2450000, fileType: 'application/pdf', uploadedBy: 'EMP-101', uploadedAt: new Date().toISOString() },
      { id: 'doc-2', name: 'Q2 Financial Report', category: 'reports', description: 'Quarterly financial performance report', fileName: 'Q2_Financial_Report.xlsx', fileSize: 1800000, fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadedBy: 'EMP-101', uploadedAt: new Date().toISOString() },
    ]
  })

  const [roster, setRoster] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_roster')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return []
  })

  const [shiftSwaps, setShiftSwaps] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_shift_swaps')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return []
  })

  const [overtimeClaims, setOvertimeClaims] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_overtime_claims')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return []
  })

  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_announcements')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return [
      {
        id: 'ann-1',
        title: 'Welcome to HR Pulse!',
        content: 'We are thrilled to roll out the new HR Pulse internal portal. Please take a moment to review your profile details and explore the new ESS features.',
        authorId: 'EMP-101',
        date: new Date().toISOString(),
        category: 'General',
        priority: 'Important',
        audience: 'all',
        attachments: [],
        reactions: { '\u{1F44D}': 0, '\u2764\uFE0F': 0, '\u{1F389}': 0 },
        comments: [],
        readBy: [],
        poll: null
      }
    ]
  })

  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_assets')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return [
      { id: 'AST-001', serialNumber: 'C02ZG001MD6M', name: 'MacBook Pro M3', category: 'Laptop', purchaseDate: '2025-01-15', purchasePrice: 2499, warrantyExpiry: '2028-01-14', usefulLife: 36, status: 'Available', assignedTo: null, assignmentDate: null, condition: 'New', maintenanceLogs: [] },
      { id: 'AST-002', serialNumber: 'S24ULTRA-992', name: 'Samsung Galaxy S24 Ultra', category: 'Phone', purchaseDate: '2024-03-10', purchasePrice: 1199, warrantyExpiry: '2025-03-09', usefulLife: 24, status: 'Assigned', assignedTo: 'EMP-102', assignmentDate: '2024-03-15', condition: 'Good', maintenanceLogs: [] }
    ]
  })

  const [assetRequests, setAssetRequests] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_asset_requests')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return []
  })

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved settings:', e)
      }
    }
    return {
      currency: '$',
      salaryStructure: [
        { id: 'basic', name: 'Basic Salary', percentage: 50, type: 'earning' },
        { id: 'hra', name: 'House Rent Allowance (HRA)', percentage: 25, type: 'earning' },
        { id: 'medical', name: 'Medical Allowance', percentage: 10, type: 'earning' },
        { id: 'conveyance', name: 'Conveyance Allowance', percentage: 10, type: 'earning' },
        { id: 'pf', name: 'Provident Fund (PF)', percentage: 5, type: 'deduction' }
      ],
      company: { 
        name: 'HR Pulse Ltd.', 
        email: 'hr@hrpulse.io', 
        website: 'www.hrpulse.io',
        logo: '',
        logoX: 0,
        logoY: 0,
        logoZoom: 1
      },
      shiftTemplates: [
        { id: 'st-1', name: 'Morning Shift', start: '09:00', end: '18:00', break: 60, color: '#3b82f6' },
        { id: 'st-2', name: 'Evening Shift', start: '14:00', end: '23:00', break: 60, color: '#8b5cf6' },
        { id: 'st-3', name: 'Night Shift', start: '22:00', end: '07:00', break: 60, color: '#1e293b' },
        { id: 'st-4', name: 'Half-Day', start: '09:00', end: '13:00', break: 0, color: '#f59e0b' }
      ],
      overtimeRules: { multiplierWeekday: 1.5, multiplierWeekend: 2.0 },
      notifications: { syncAlerts: true, emailDigests: false }
    }
  })

  const [syncLogs, setSyncLogs] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_sync_logs')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved sync logs:', e)
      }
    }
    return [
      { id: 'log-1', action: 'Synced employee_list.json', status: 'success', timestamp: '2 mins ago', details: '4 records updated' },
      { id: 'log-2', action: 'Uploaded payslip_july.pdf', status: 'success', timestamp: '1 hour ago', details: 'Document saved to /HR-Pulse-DB/Documents/' },
      { id: 'log-3', action: 'Auto-Backup DB', status: 'success', timestamp: '4 hours ago', details: 'Google Drive backup completed successfully' }
    ]
  })

  useEffect(() => {
    const loadEmployeesFromStorage = async () => {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY)
      if (!saved) return
      try {
        const keyMaterial = user?.token || 'hr-pulse-local-fallback-key'
        const parsed = await decryptJson(saved, keyMaterial)
        if (Array.isArray(parsed)) {
          setEmployees(parsed)
        }
      } catch (e) {
        console.error('Failed to decrypt saved employees:', e)
        localStorage.removeItem(EMPLOYEES_STORAGE_KEY)
      }
    }

    loadEmployeesFromStorage()
  }, [user?.token])

  useEffect(() => {
    const persistEmployees = async () => {
      try {
        const keyMaterial = user?.token || 'hr-pulse-local-fallback-key'
        const encrypted = await encryptJson(employees, keyMaterial)
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, encrypted)
      } catch (e) {
        console.error('Failed to encrypt employees for storage:', e)
      }
    }

    persistEmployees()
  }, [employees, user?.token])

  useEffect(() => {
    localStorage.setItem('hr_pulse_payroll', JSON.stringify(payroll))
  }, [payroll])

  useEffect(() => {
    localStorage.setItem('hr_pulse_attendance', JSON.stringify(attendance))
  }, [attendance])

  useEffect(() => {
    localStorage.setItem('hr_pulse_expenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('hr_pulse_sync_logs', JSON.stringify(syncLogs))
  }, [syncLogs])

  useEffect(() => {
    localStorage.setItem('hr_pulse_announcements', JSON.stringify(announcements))
  }, [announcements])

  useEffect(() => {
    localStorage.setItem('hr_pulse_assets', JSON.stringify(assets))
  }, [assets])

  useEffect(() => {
    localStorage.setItem('hr_pulse_asset_requests', JSON.stringify(assetRequests))
  }, [assetRequests])

  useEffect(() => {
    localStorage.setItem('hr_pulse_events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('hr_pulse_documents', JSON.stringify(documents))
  }, [documents])

  useEffect(() => {
    if (!employees || employees.length === 0) return

    const today = new Date()
    const currentMonthDay = `${today.getMonth() + 1}-${today.getDate()}`
    const currentYear = today.getFullYear()

    let newPosts = []

    employees.forEach(emp => {
      if (emp.dob) {
        const dobDate = new Date(emp.dob)
        const dobMonthDay = `${dobDate.getMonth() + 1}-${dobDate.getDate()}`
        
        if (dobMonthDay === currentMonthDay) {
          const existing = announcements.find(a => a.category === 'Birthday' && a.content.includes(emp.name) && a.date.startsWith(currentYear.toString()))
          if (!existing) {
            newPosts.push({
              id: `ann-bday-${emp.id}-${currentYear}`,
              title: `\u{1F389} Happy Birthday, ${emp.name}!`,
              content: `Let's all wish a fantastic birthday to ${emp.name} from the ${emp.department} team! Have a great day! \u{1F382}\u{1F388}`,
              authorId: 'system',
              date: new Date().toISOString(),
              category: 'Achievement/Birthday/Work Anniversary',
              priority: 'Normal',
              audience: 'all',
              attachments: [],
              reactions: { '\u{1F44D}': 0, '\u2764\uFE0F': 0, '\u{1F389}': 0 },
              comments: [],
              readBy: [],
              poll: null
            })
          }
        }
      }

      if (emp.joiningDate) {
        const joinDate = new Date(emp.joiningDate)
        const joinMonthDay = `${joinDate.getMonth() + 1}-${joinDate.getDate()}`
        const years = currentYear - joinDate.getFullYear()

        if (joinMonthDay === currentMonthDay && years > 0) {
          const existing = announcements.find(a => a.category === 'Anniversary' && a.content.includes(emp.name) && a.date.startsWith(currentYear.toString()))
          if (!existing) {
            newPosts.push({
              id: `ann-work-${emp.id}-${currentYear}`,
              title: `\u{1F31F} Happy Work Anniversary, ${emp.name}!`,
              content: `Congratulations to ${emp.name} for completing ${years} year${years > 1 ? 's' : ''} with us! Thank you for your hard work and dedication! \u{1F3C6}`,
              authorId: 'system',
              date: new Date().toISOString(),
              category: 'Achievement/Birthday/Work Anniversary',
              priority: 'Normal',
              audience: 'all',
              attachments: [],
              reactions: { '\u{1F44D}': 0, '\u2764\uFE0F': 0, '\u{1F389}': 0 },
              comments: [],
              readBy: [],
              poll: null
            })
          }
        }
      }
    })

    if (newPosts.length > 0) {
      setAnnouncements(prev => [...newPosts, ...prev])
    }
  }, [employees])

  useEffect(() => {
    const handleOnline = () => {
      if (user && metaManifest) {
        flushPendingWrites(
          user.token, 
          metaManifest, 
          (conflicts, data, tableName) => {
            if (conflicts && conflicts.length > 0) {
              setSyncConflicts(c => [...c, ...conflicts]);
              addToast(`Offline changes synced. Conflicts detected in ${tableName}.`, 'warning');
              if (tableName === 'employees') setEmployees(data);
              if (tableName === 'payroll') setPayroll(data);
              if (tableName === 'settings') setSettings(data);
              if (tableName === 'attendance_logs') setAttendance(prev => ({ ...prev, dailyLogs: data }));
              if (tableName === 'leave_requests') setAttendance(prev => ({ ...prev, leaves: data }));
              if (tableName === 'leave_balances') setAttendance(prev => ({ ...prev, balances: data }));
            }
          },
          (syncedCount) => {
            addToast(`${syncedCount} changes synced`, 'success');
          }
        );
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, metaManifest]);

  useEffect(() => {
    const syncDatabase = async () => {
      if (!user || !driveConnected) {
        setIsAppLoading(false)
        return
      }

      const bgSyncCallback = (tableName, data) => {
        addToast(`Background sync updated ${tableName} with remote changes.`, 'info');
        if (tableName === 'employees') setEmployees(data);
        if (tableName === 'payroll') setPayroll(data);
        if (tableName === 'settings') setSettings(data);
        if (tableName === 'expenses') setExpenses(data);
        if (tableName === 'attendance_logs') setAttendance(prev => ({ ...prev, dailyLogs: data }));
        if (tableName === 'leave_requests') setAttendance(prev => ({ ...prev, leaves: data }));
        if (tableName === 'leave_balances') setAttendance(prev => ({ ...prev, balances: data }));
      };

      try {
        setIsSyncing(true)
        addLog('Connecting to Drive', 'Initializing strict DB workspace folder')
        
        let meta = await readMeta(user.token)
        
        if (!meta) {
          setDbStatus('rebuilding')
          addLog('DB Status', 'No _meta.json found. Rebuilding from defaults.', 'warning')
          meta = { schema_version: "1.0", last_sync: new Date().toISOString(), files: {} }
        } else {
          setDbStatus('healthy')
          setMetaManifest(meta)
        }

        const defaultContent = [
          { id: 'EMP-101', name: 'Ishtiauq Ahmed', role: 'HR Manager', department: 'Human Resources', status: 'Active', email: 'ishtiauq@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
          { id: 'EMP-102', name: 'Sarah Rahman', role: 'Lead Frontend Developer', department: 'Engineering', status: 'Active', email: 'sarah.r@hrpulse.io', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
          { id: 'EMP-103', name: 'Nafis Chowdhury', role: 'Senior Product Designer', department: 'Design', status: 'Active', email: 'nafis.c@hrpulse.io', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
          { id: 'EMP-104', name: 'Tanvir Hasan', role: 'QA Automation Engineer', department: 'Engineering', status: 'On Leave', email: 'tanvir.h@hrpulse.io', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' }
        ]

        let empData = await readTable('employees', user.token, bgSyncCallback)
        if (!empData) {
          empData = defaultContent
          await writeTable('employees', defaultContent, meta, user.token)
        }
        setEmployees(empData)

        const defaultPayroll = {
          '2026-07': [
            { employeeId: 'EMP-101', grossSalary: 3200, status: 'Paid', paymentDate: 'July 15, 2026', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } },
            { employeeId: 'EMP-102', grossSalary: 4500, status: 'Pending', paymentDate: '', advance: 150, loan: { total: 1000, installment: 100, remaining: 900 } },
            { employeeId: 'EMP-103', grossSalary: 4000, status: 'Pending', paymentDate: '', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } },
            { employeeId: 'EMP-104', grossSalary: 5200, status: 'Pending', paymentDate: '', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } }
          ]
        }
        let payrollData = await readTable('payroll', user.token, bgSyncCallback)
        if (!payrollData) {
          payrollData = defaultPayroll
          await writeTable('payroll', defaultPayroll, meta, user.token)
        }
        if (Array.isArray(payrollData)) payrollData = { '2026-07': payrollData }
        setPayroll(payrollData)

        const defaultSettings = {
          currency: '$',
          salaryStructure: [
            { id: 'basic', name: 'Basic Salary', percentage: 50, type: 'earning' },
            { id: 'hra', name: 'House Rent Allowance (HRA)', percentage: 25, type: 'earning' },
            { id: 'medical', name: 'Medical Allowance', percentage: 10, type: 'earning' },
            { id: 'conveyance', name: 'Conveyance Allowance', percentage: 10, type: 'earning' },
            { id: 'pf', name: 'Provident Fund (PF)', percentage: 5, type: 'deduction' }
          ],
          company: { name: 'HR Pulse Ltd.', email: 'hr@hrpulse.io', website: 'www.hrpulse.io' },
          notifications: { syncAlerts: true, emailDigests: false }
        }
        let settingsData = await readTable('settings', user.token, bgSyncCallback)
        if (!settingsData) {
          settingsData = defaultSettings
          await writeTable('settings', defaultSettings, meta, user.token)
        }
        setSettings(settingsData)

        const defaultLeaves = [
          { id: 'REQ-101', employeeId: 'EMP-102', leaveType: 'Sick Leave', startDate: '2026-07-10', endDate: '2026-07-12', days: 3, reason: 'Flu symptoms', status: 'Approved' },
          { id: 'REQ-102', employeeId: 'EMP-104', leaveType: 'Annual Leave', startDate: '2026-07-20', endDate: '2026-07-25', days: 6, reason: 'Family vacation', status: 'Pending' }
        ]
        const defaultBalances = {
          'EMP-101': { sick: { used: 0, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } },
          'EMP-102': { sick: { used: 3, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } },
          'EMP-103': { sick: { used: 0, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } },
          'EMP-104': { sick: { used: 0, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } }
        }
        const defaultLogs = {
          '2026-07-16': {
            'EMP-101': { status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0' },
            'EMP-102': { status: 'Present', checkIn: '08:50 AM', checkOut: '06:10 PM', hours: '9.3' },
            'EMP-103': { status: 'Late', checkIn: '09:30 AM', checkOut: '06:00 PM', hours: '8.5' },
            'EMP-104': { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
          }
        }
        
        let leavesData = await readTable('leave_requests', user.token, bgSyncCallback)
        let balancesData = await readTable('leave_balances', user.token, bgSyncCallback)
        let logsData = await readTable('attendance_logs', user.token, bgSyncCallback)
        
        if (!leavesData || !balancesData || !logsData) {
          const legacyAtt = await readTable('attendance', user.token, bgSyncCallback)
          if (legacyAtt) {
            leavesData = leavesData || legacyAtt.leaves || defaultLeaves
            balancesData = balancesData || legacyAtt.balances || defaultBalances
            logsData = logsData || legacyAtt.dailyLogs || defaultLogs
          } else {
            leavesData = leavesData || defaultLeaves
            balancesData = balancesData || defaultBalances
            logsData = logsData || defaultLogs
          }
          await writeTable('leave_requests', leavesData, meta, user.token)
          await writeTable('leave_balances', balancesData, meta, user.token)
          await writeTable('attendance_logs', logsData, meta, user.token)
        }
        
        setAttendance({ leaves: leavesData, balances: balancesData, dailyLogs: logsData })

        const defaultExpenses = []
        let expensesData = await readTable('expenses', user.token, bgSyncCallback)
        if (!expensesData) {
          expensesData = defaultExpenses
          await writeTable('expenses', defaultExpenses, meta, user.token)
        }
        setExpenses(expensesData)

        if (dbStatus === 'rebuilding') {
          setMetaManifest(meta)
          setDbStatus('healthy')
        }

        const issues = validateDatabase(empData, logsData, leavesData, payrollData, expensesData)
        setDataIntegrityIssues(issues)
        if (issues.length > 0) {
          setDbStatus('corruption')
          addLog('Data Integrity Warning', `${issues.length} corruption issues detected in the database.`, 'warning')
        }

        setIsSyncing(false)
        addLog('Database Synced', 'Strict schema successfully loaded from Drive.', 'success')
        
        checkAndRunAutoBackup(user.token)
      } catch (err) {
        setIsSyncing(false)
        setDbStatus('corruption')
        addLog('Sync Failed', 'Could not sync database with Google Drive: ' + err.message, 'danger')
        console.error(err)
      }
    }

    syncDatabase()
  }, [user])

  const handleSetEmployees = async (updater) => {
    setEmployees((prev) => {
      const next = timestampArrayChanges(prev, typeof updater === 'function' ? updater(prev) : updater)
      
      if (user && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('employees', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) {
              addToast('Offline - saved locally. Will sync when connected.', 'warning')
              setEmployees(updatedData)
            } else if (conflicts && conflicts.length > 0) {
              setSyncConflicts(c => [...c, ...conflicts])
              addToast('Sync conflict auto-resolved. Review flagged items.', 'warning')
              setEmployees(updatedData)
            } else {
              addLog('Database Saved', 'Changes successfully uploaded to Google Drive.', 'success')
            }
          })
          .catch((err) => {
            setDbStatus('corruption')
            addLog('Save Failed', 'Could not save changes to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }

  const handleSetPayroll = async (updater) => {
    setPayroll((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      
      if (user && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('payroll', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) {
              addToast('Offline - saved locally. Will sync when connected.', 'warning')
              setPayroll(updatedData)
            } else if (conflicts && conflicts.length > 0) {
              setSyncConflicts(c => [...c, ...conflicts])
              addToast('Sync conflict auto-resolved. Review flagged items.', 'warning')
              setPayroll(updatedData)
            } else {
              addLog('Payroll Saved', 'Salary updates synced to Google Drive.', 'success')
            }
          })
          .catch((err) => {
            setDbStatus('corruption')
            addLog('Save Failed', 'Could not save payroll data to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }

  const handleSetSettings = async (updater) => {
    setSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem('hr_pulse_settings', JSON.stringify(next))
      
      if (user && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('settings', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) {
              addToast('Offline - saved locally. Will sync when connected.', 'warning')
              setSettings(updatedData)
            } else if (conflicts && conflicts.length > 0) {
              setSyncConflicts(c => [...c, ...conflicts])
              addToast('Sync conflict auto-resolved. Review flagged items.', 'warning')
              setSettings(updatedData)
            } else {
              addLog('Settings Saved', 'System configurations synced to Google Drive.', 'success')
            }
          })
          .catch((err) => {
            setDbStatus('corruption')
            addLog('Save Failed', 'Could not save settings configurations to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }

  const handleAutoRepairDatabase = async () => {
    if (!user) return
    try {
      setIsSyncing(true)
      addLog('Repairing DB', 'Running deduplication and logical constraint repairs...')
      const meta = { ...metaManifest }
      
      let empData = await readTable('employees', user.token) || []
      
      const uniqueEmps = []
      const seenIds = new Set()
      empData.forEach(emp => {
        if (!seenIds.has(emp.id)) {
          seenIds.add(emp.id)
          uniqueEmps.push(emp)
        }
      })
      
      await writeTable('employees', uniqueEmps, meta, user.token)
      setEmployees(uniqueEmps)
      
      const leavesData = await readTable('leave_requests', user.token) || []
      const balancesData = await readTable('leave_balances', user.token) || {}
      const logsData = await readTable('attendance_logs', user.token) || {}
      const payrollData = await readTable('payroll', user.token) || {}
      const expensesData = await readTable('expenses', user.token) || []
      
      const fixedIssues = validateDatabase(uniqueEmps, logsData, leavesData, payrollData, expensesData)
      setDataIntegrityIssues(fixedIssues)
      if (fixedIssues.length === 0) {
        setDbStatus('healthy')
        addToast('Database successfully repaired!', 'success')
        addLog('Repair Success', 'Removed duplicate employee IDs. Database is healthy.', 'success')
        setShowCorruptionModal(false)
      } else {
        addToast('Database partially repaired, remaining issues exist.', 'warning')
      }
    } catch (e) {
      addToast('Repair failed: ' + e.message, 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSetAttendance = async (updater) => {
    setAttendance((prev) => {
      const rawNext = typeof updater === 'function' ? updater(prev) : updater
      const next = {
        ...rawNext,
        leaves: timestampArrayChanges(prev.leaves, rawNext.leaves)
      }
      
      if (user && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        Promise.all([
          writeTable('leave_requests', next.leaves, meta, user.token),
          writeTable('leave_balances', next.balances, meta, user.token),
          writeTable('attendance_logs', next.dailyLogs, meta, user.token)
        ]).then(() => {
          setMetaManifest(meta)
          addLog('Attendance Saved', 'Attendance logs synced to Google Drive.', 'success')
        }).catch((err) => {
          setDbStatus('corruption')
          addLog('Save Failed', 'Could not save attendance data to cloud: ' + err.message, 'danger')
        })
      }
      return next
    })
  }

  const handleSetExpenses = (updater) => {
    setExpenses((prev) => {
      const next = timestampArrayChanges(prev, typeof updater === 'function' ? updater(prev) : updater)
      if (user && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('expenses', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) {
              addToast('Offline - saved locally. Will sync when connected.', 'warning')
              setExpenses(updatedData)
            } else if (conflicts && conflicts.length > 0) {
              setSyncConflicts(c => [...c, ...conflicts])
              addToast('Sync conflict auto-resolved. Review flagged items.', 'warning')
              setExpenses(updatedData)
            } else {
              addLog('Expenses Saved', 'Expenses synced to Google Drive.', 'success')
            }
          })
          .catch((err) => {
            setDbStatus('corruption')
            addLog('Save Failed', 'Could not save expenses data to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }
  const handleSetEvents = (updater) => {
    setEvents((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }

  const handleSetDocuments = (updater) => {
    setDocuments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }

  const addLog = (action, details, status = 'success') => {
    const newLog = {
      id: `log-${Date.now()}`,
      action,
      status,
      timestamp: 'Just now',
      details
    }
    setSyncLogs(prev => [newLog, ...prev.slice(0, 4)])
    
    if (status === 'success') {
      addToast(action, 'success')
    } else if (status === 'danger') {
      addToast(action, 'error')
    }
  }

  useEffect(() => {
    if (!driveConnected) return
    const interval = setInterval(() => {
      const actions = [
        { action: 'Auto-sync database.json', details: 'No changes detected' },
        { action: 'Checked connection state', details: 'Google Drive API v3 - Connected' },
        { action: 'Refreshed folder credentials', details: 'Token valid' }
      ]
      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      
      const newLog = {
        id: `log-${Date.now()}`,
        action: randomAction.action,
        status: 'success',
        timestamp: 'Just now',
        details: randomAction.details
      }
      setSyncLogs(prev => [newLog, ...prev.slice(0, 4)])
    }, 45000)

    return () => clearInterval(interval)
  }, [driveConnected])

  const renderBreadcrumbs = () => {
    if (currentView === 'dashboard') return null;
    return (
      <div className="breadcrumb-container">
        <span className="breadcrumb-item" onClick={() => setCurrentView('dashboard')}>Dashboard</span>
        <span>/</span>
        <span className="breadcrumb-current" style={{ textTransform: 'capitalize' }}>
          {currentView === 'drive' ? 'Google Drive Sync' : currentView}
        </span>
      </div>
    )
  }

  const renderContent = () => {
    if (isAppLoading) {
      const skeletonLayouts = {
        dashboard: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton skeleton-header" />
            <div className="skeleton skeleton-subtitle" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-stat-card" />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="skeleton skeleton-card" style={{ height: '240px' }} />
              <div className="skeleton skeleton-card" style={{ height: '240px' }} />
            </div>
          </div>
        ),
        employees: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton skeleton-header" />
            <div className="skeleton skeleton-subtitle" />
            <div className="skeleton" style={{ height: '44px', borderRadius: '12px', marginBottom: '8px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-card" />)}
            </div>
          </div>
        ),
        table: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton skeleton-header" />
            <div className="skeleton skeleton-subtitle" />
            <div className="skeleton skeleton-tabs" />
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ),
        settings: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton skeleton-header" />
            <div className="skeleton skeleton-subtitle" />
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-row" />)}
              </div>
              <div className="skeleton skeleton-card" style={{ height: '400px' }} />
            </div>
          </div>
        )
      }
      const layoutKey = currentView === 'dashboard' ? 'dashboard'
        : currentView === 'employees' ? 'employees'
        : (currentView === 'settings' || currentView === 'drive') ? 'settings'
        : 'table'
      return skeletonLayouts[layoutKey]
    }

    if (!hasPermission(currentView)) {
      return (
        <div className="animate-fade-in" style={{ padding: '64px 32px', textAlign: 'center', background: 'var(--color-md-sys-surface-container)', borderRadius: '16px', border: '1px solid var(--color-md-sys-outline-variant)', marginTop: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-md-sys-error)', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>!</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-md-sys-error)', marginBottom: '16px' }}>403 Forbidden</h2>
          <p style={{ color: 'var(--color-md-sys-on-surface-variant)', maxWidth: '400px', margin: '0 auto' }}>
            Your current role (<strong>{simulatedRole}</strong>) does not have permission to access the <strong>{currentView}</strong> module.
          </p>
        </div>
      )
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            employees={employees} 
            syncLogs={syncLogs} 
            driveConnected={driveConnected} 
            addLog={addLog}
          />
        )
      case 'employees':
        return (
          <Employees 
            employees={employees} 
            setEmployees={handleSetEmployees} 
            addLog={addLog}
            driveConnected={driveConnected}
            simulatedRole={simulatedRole}
            addAuditLog={addAuditLog}
            pendingProfileEdits={pendingProfileEdits}
            setPendingProfileEdits={setPendingProfileEdits}
            addToast={addToast}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
          />
        )
      case 'payroll':
        return (
          <Payroll 
            employees={employees}
            payroll={payroll}
            setPayroll={handleSetPayroll}
            addLog={addLog}
            driveConnected={driveConnected}
            settings={settings}
            simulatedRole={simulatedRole}
            addAuditLog={addAuditLog}
          />
        )
      case 'attendance':
        return (
          <Attendance 
            employees={employees}
            attendance={attendance}
            setAttendance={handleSetAttendance}
            roster={roster}
            setRoster={setRoster}
            shiftSwaps={shiftSwaps}
            setShiftSwaps={setShiftSwaps}
            shiftTemplates={settings.shiftTemplates}
            overtimeClaims={overtimeClaims}
            setOvertimeClaims={setOvertimeClaims}
            addLog={addLog}
            driveConnected={driveConnected}
            addToast={addToast}
            addNotification={addNotification}
            simulatedRole={simulatedRole}
            addAuditLog={addAuditLog}
          />
        )
      case 'announcements':
        return (
          <Announcements
            employees={employees}
            announcements={announcements}
            setAnnouncements={setAnnouncements}
            addLog={addLog}
            addToast={addToast}
            currentUser={user}
            simulatedRole={simulatedRole}
          />
        )
      case 'calendar':
        return (
          <Calendar
            events={events}
            setEvents={handleSetEvents}
            employees={employees}
            addLog={addLog}
            addToast={addToast}
            currentUser={user}
            simulatedRole={simulatedRole}
          />
        )
      case 'documents':
        return (
          <Documents
            documents={documents}
            setDocuments={handleSetDocuments}
            employees={employees}
            addLog={addLog}
            addToast={addToast}
            currentUser={user}
            simulatedRole={simulatedRole}
          />
        )
      case 'assets':
        return (
          <Assets
            employees={employees}
            assets={assets}
            setAssets={setAssets}
            assetRequests={assetRequests}
            setAssetRequests={setAssetRequests}
            addLog={addLog}
            addToast={addToast}
            currentUser={user}
            simulatedRole={simulatedRole}
          />
        )
      case 'reports':
        return (
          <Reports 
            employees={employees}
            payroll={payroll}
            attendance={attendance}
            addLog={addLog}
            addToast={addToast}
            simulatedRole={simulatedRole}
          />
        )
      case 'expenses':
        return (
          <Expenses
            employees={employees}
            expenses={expenses}
            setExpenses={handleSetExpenses}
            settings={settings}
            addLog={addLog}
            addToast={addToast}
            addAuditLog={addAuditLog}
            simulatedRole={simulatedRole}
          />
        )
      case 'settings':
        return <Settings 
          settings={settings} 
          setSettings={handleSetSettings} 
          addLog={addLog} 
          addToast={addToast}
          auditLogs={auditLogs}
          simulatedRole={simulatedRole}
          syncConflicts={syncConflicts}
          setSyncConflicts={setSyncConflicts}
        />
      case 'drive':
        return (
          <DriveSync 
            user={user}
            driveConnected={driveConnected} 
            setDriveConnected={setDriveConnected} 
            syncLogs={syncLogs}
            addLog={addLog}
            employees={employees}
          />
        )
      default:
        return (
          <Dashboard 
            employees={employees} 
            syncLogs={syncLogs} 
            driveConnected={driveConnected} 
            addLog={addLog}
            attendance={attendance}
            setCurrentView={setCurrentView}
          />
        )
    }
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  if (simulatedRole === 'Employee') {
    return (
      <EmployeePortal
        currentUser={{...user, role: 'Employee', department: 'Engineering'}}
        employees={employees}
        attendance={attendance}
        payroll={payroll}
        expenses={expenses}
        addLog={addLog}
        addToast={addToast}
        setAttendance={handleSetAttendance}
        pendingProfileEdits={pendingProfileEdits}
        setPendingProfileEdits={setPendingProfileEdits}
        setExpenses={handleSetExpenses}
        roster={roster}
        shiftSwaps={shiftSwaps}
        setShiftSwaps={setShiftSwaps}
        shiftTemplates={settings.shiftTemplates}
        overtimeClaims={overtimeClaims}
        setOvertimeClaims={setOvertimeClaims}
        announcements={announcements}
        setAnnouncements={setAnnouncements}
        assets={assets}
        setAssets={setAssets}
        assetRequests={assetRequests}
        setAssetRequests={setAssetRequests}
        settings={settings}
      />
    )
  }

  // Filter nav items by role permissions
  const visibleNavItems = allNavItems.filter(item => hasPermission(item.id))

  // Map currentView to NavigationRail index
  const currentNavIndex = visibleNavItems.findIndex(item => item.id === currentView)
  const safeNavIndex = currentNavIndex >= 0 ? currentNavIndex : 0

  const handleNavChange = (index) => {
    setCurrentView(visibleNavItems[index].id)
  }

  const getFilteredItems = () => {
    const query = commandSearch.toLowerCase().trim()
    const pages = [
      { id: 'page-dashboard', category: 'Pages', label: 'Go to Dashboard', action: () => setCurrentView('dashboard'), keywords: 'dashboard home main' },
      { id: 'page-employees', category: 'Pages', label: 'Go to Employees', action: () => setCurrentView('employees'), keywords: 'employees staff members directory profile' },
      { id: 'page-payroll', category: 'Pages', label: 'Go to Payroll', action: () => setCurrentView('payroll'), keywords: 'payroll salary pay compensation' },
      { id: 'page-attendance', category: 'Pages', label: 'Go to Attendance & Leaves', action: () => setCurrentView('attendance'), keywords: 'attendance leaves roster schedule timeoff vacation' },
      { id: 'page-announcements', category: 'Pages', label: 'Go to Announcements', action: () => setCurrentView('announcements'), keywords: 'announcements news posts updates' },
      { id: 'page-calendar', category: 'Pages', label: 'Go to Calendar', action: () => setCurrentView('calendar'), keywords: 'calendar events meetings holidays schedule' },
      { id: 'page-documents', category: 'Pages', label: 'Go to Documents', action: () => setCurrentView('documents'), keywords: 'documents files upload download manager' },
      { id: 'page-assets', category: 'Pages', label: 'Go to Assets', action: () => setCurrentView('assets'), keywords: 'assets inventory devices macbook laptop' },
      { id: 'page-reports', category: 'Pages', label: 'Go to Reports', action: () => setCurrentView('reports'), keywords: 'reports analytics charts download' },
      { id: 'page-expenses', category: 'Pages', label: 'Go to Expenses', action: () => setCurrentView('expenses'), keywords: 'expenses claims reimbursements money' },
      { id: 'page-settings', category: 'Pages', label: 'Go to Settings', action: () => setCurrentView('settings'), keywords: 'settings admin config role audit' },
      { id: 'page-drive', category: 'Pages', label: 'Go to Google Drive Sync', action: () => setCurrentView('drive'), keywords: 'drive sync backup restore cloud' }
    ]

    const recent = recentActions.map((act) => {
      let actionFn = () => {}
      if (act.type === 'page') {
        actionFn = () => setCurrentView(act.view)
      } else if (act.type === 'action') {
        if (act.id === 'action-darkmode') actionFn = () => setIsDarkMode(prev => !prev)
        if (act.id === 'action-clearcache') actionFn = () => {
          if (window.confirm("Clear cache?")) {
            clearLocalCache().then(() => window.location.reload())
          }
        }
        if (act.id === 'action-backup') actionFn = () => {
          if (user?.token) createBackup(user.token).then(() => addToast('Backup created', 'success'))
        }
      } else if (act.type === 'employee') {
        actionFn = () => {
          setSelectedEmployeeId(act.employeeId)
          setCurrentView('employees')
        }
      }
      return {
        ...act,
        category: 'Recent Actions',
        action: actionFn
      }
    })

    const quickActions = [
      { id: 'action-darkmode', category: 'Actions', label: 'Toggle Dark Mode', action: () => setIsDarkMode(prev => !prev), keywords: 'dark light mode theme appearance toggle' },
      { id: 'action-clearcache', category: 'Actions', label: 'Clear Local Cache & Resync', action: () => {
        if (window.confirm("Clear cache?")) {
          clearLocalCache().then(() => window.location.reload())
        }
      }, keywords: 'clear cache reset clean reload' },
      { id: 'action-backup', category: 'Actions', label: 'Trigger Drive Backup', action: () => {
        if (user?.token) {
          addToast('Creating backup...', 'info')
          createBackup(user.token).then(() => addToast('Backup created successfully', 'success'))
        } else {
          addToast('Drive connection required for backup', 'warning')
        }
      }, keywords: 'backup save snapshot archive drive' }
    ]

    const emps = (employees || []).map(emp => ({
      id: `emp-${emp.id}`,
      category: 'Employees',
      label: `${emp.name} (${emp.role} - ${emp.department})`,
      employeeId: emp.id,
      action: () => {
        setSelectedEmployeeId(emp.id)
        setCurrentView('employees')
      },
      keywords: `${emp.name} ${emp.role} ${emp.department} ${emp.id}`
    }))

    if (!query) {
      return [
        ...pages,
        ...recent,
        ...emps.slice(0, 5)
      ]
    }

    const allItems = [
      ...pages,
      ...quickActions,
      ...emps
    ]

    return allItems.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(query)
      const matchKeywords = item.keywords ? item.keywords.toLowerCase().includes(query) : false
      return matchLabel || matchKeywords
    })
  }

  const filteredItems = getFilteredItems()

  const selectPaletteItem = (index) => {
    const selectedItem = filteredItems[index]
    if (selectedItem) {
      selectedItem.action()
      trackRecentAction({
        id: selectedItem.id,
        type: selectedItem.category === 'Pages' ? 'page' : (selectedItem.category === 'Employees' ? 'employee' : 'action'),
        label: selectedItem.label,
        view: selectedItem.id.replace('page-', ''),
        employeeId: selectedItem.employeeId
      })
      setShowCommandPalette(false)
      setCommandSearch('')
      setPaletteIndex(0)
    }
  }

  const getCategoryIcon = (category, id) => {
    if (category === 'Employees') return <User size={16} />
    if (category === 'Recent Actions') return <History size={16} />
    if (id.includes('darkmode')) return <Moon size={16} />
    if (id.includes('clearcache')) return <Trash2 size={16} />
    if (id.includes('backup')) return <HardDrive size={16} />
    if (id.includes('dashboard')) return <LayoutDashboard size={16} />
    if (id.includes('settings')) return <SettingsIcon size={16} />
    if (id.includes('drive')) return <HardDrive size={16} />
    if (id.includes('employees')) return <User size={16} />
    return <FileText size={16} />
  }

  const navRailItems = visibleNavItems.map(item => ({
    label: item.label,
    icon: item.icon,
  }))

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="app-container">
      {/* M3 TopAppBar from actify */}
      <TopAppBar
        title="HR Pulse"
        size="default"
        onClick={() => window.innerWidth < 769 && setMobileMenuOpen(prev => !prev)}
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setIsDarkMode(prev => !prev);
          }}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </IconButton>
      </TopAppBar>

      <div className="app-body">
        {/* M3 NavigationRail from actify - Desktop sidebar */}
        <NavigationRail
          items={navRailItems}
          value={safeNavIndex}
          setValue={handleNavChange}
          menu={
            <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
              <div
                onClick={() => setMobileMenuOpen(true)}
                style={{ cursor: 'pointer' }}
              >
                <Avatar
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  size="small"
                />
              </div>
            </div>
          }
        />

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
              {/* Drawer Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--color-md-sys-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}
                >
                  <Activity size={20} color="var(--color-md-sys-on-primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>HR Pulse</h2>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-md-sys-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Drive-based HRM</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-md-sys-on-surface-variant)', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {visibleNavItems.map((item, index) => {
                  const isActive = currentView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '12px', border: 'none',
                        background: isActive ? 'var(--color-md-sys-primary)' : 'transparent',
                        color: isActive ? 'var(--color-md-sys-on-primary)' : 'var(--color-md-sys-on-surface-variant)',
                        fontSize: '0.95rem', fontWeight: 700, textAlign: 'left', cursor: 'pointer',
                        transition: 'background-color 150ms, color 150ms'
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--color-md-sys-surface-container-high)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Drawer Footer - User info */}
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar src={user?.avatar} alt={user?.name || 'User'} size="small" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-md-sys-on-surface-variant)' }}>{user?.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <IconButton
                    variant="standard"
                    onClick={() => setIsDarkMode(prev => !prev)}
                  >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </IconButton>
                  <IconButton
                    variant="standard"
                    onClick={handleLogout}
                    color="error"
                  >
                    <LogOut size={18} />
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="content-container">
          {/* Toolbar: breadcrumbs + controls */}
          <div className="content-toolbar">
            <div>{renderBreadcrumbs()}</div>
            <div className="toolbar-actions">
              {/* Sync Status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--color-md-sys-surface-container)',
                padding: '6px 12px', borderRadius: '12px',
                border: '1px solid var(--color-md-sys-outline-variant)'
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: !driveConnected ? 'var(--color-md-sys-error)'
                    : syncConflicts.length > 0 ? 'var(--color-md-sys-error)'
                    : isSyncing ? 'var(--color-md-sys-tertiary)'
                    : 'var(--color-md-sys-secondary)'
                }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-md-sys-on-surface-variant)' }}>
                  {!driveConnected ? 'Offline' : syncConflicts.length > 0 ? 'Conflict' : isSyncing ? 'Syncing...' : 'Synced'}
                </span>
              </div>

              {/* Role Simulator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--color-md-sys-surface-container)',
                padding: '6px 12px', borderRadius: '12px',
                border: '1px solid var(--color-md-sys-outline-variant)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-md-sys-on-surface-variant)' }}>View:</span>
                <select
                  value={simulatedRole}
                  onChange={(e) => setSimulatedRole(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--color-md-sys-on-surface)', fontWeight: 600,
                    fontSize: '0.85rem', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="Admin">Admin</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Payroll Manager">Payroll Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {/* Notifications Bell */}
              <div style={{ position: 'relative' }}>
                <IconButton
                  variant="standard"
                  onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead() }}
                >
                  <Bell size={20} />
                </IconButton>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    background: 'var(--color-md-sys-error)', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 800,
                    width: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', pointerEvents: 'none'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  width: '320px',
                  background: 'var(--color-md-sys-surface-container)',
                  border: '1px solid var(--color-md-sys-outline-variant)',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                  zIndex: 100, overflow: 'hidden',
                  animation: 'modalFadeIn 0.2s ease-out'
                }}>
                  <div style={{
                    padding: '16px', borderBottom: '1px solid var(--color-md-sys-outline-variant)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--color-md-sys-surface-container-high)'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Notifications</h3>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-md-sys-on-surface-variant)', fontSize: '0.85rem' }}>No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{
                          padding: '12px 16px', borderBottom: '1px solid var(--color-md-sys-outline-variant)',
                          background: n.read ? 'transparent' : 'rgba(0,0,0,0.03)'
                        }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-md-sys-on-surface)', margin: 0, fontWeight: n.read ? 500 : 600, lineHeight: 1.4 }}>{n.text}</p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-md-sys-on-surface-variant)', marginTop: '4px', display: 'block' }}>{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Corruption Banner */}
          {dbStatus === 'corruption' && (
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid var(--color-md-sys-error)',
              color: 'var(--color-md-sys-error)',
              padding: '16px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} />
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-md-sys-error)' }}>Data integrity issue detected.</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-md-sys-on-surface-variant)' }}>
                    {dataIntegrityIssues.length > 0 
                      ? `${dataIntegrityIssues.length} logical conflict(s) found in the database.` 
                      : 'A sync or data integrity constraint failed. Review logs or check structure.'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {dataIntegrityIssues.some(iss => iss.includes('Duplicate')) && (
                  <Button variant="filled" color="primary" onClick={handleAutoRepairDatabase}>
                    Auto-Fix Duplicates
                  </Button>
                )}
                <Button variant="outlined" color="primary" onClick={() => setShowCorruptionModal(true)}>
                  View Details
                </Button>
                <Button variant="filled" color="error" onClick={() => {
                  if (window.confirm("Restore to default clean data? This will clear local cache and reload.")) {
                    clearLocalCache().then(() => window.location.reload())
                  }
                }}>
                  Reset Database
                </Button>
              </div>
            </div>
          )}

          {/* Corruption Modal - using actify Dialog */}
          {showCorruptionModal && (
            <Dialog open={showCorruptionModal} onClose={() => setShowCorruptionModal(false)}>
              <div style={{ padding: '24px', maxWidth: '600px' }}>
                <h2 style={{ color: 'var(--color-md-sys-error)', marginBottom: '16px' }}>Data Integrity Report</h2>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dataIntegrityIssues.length > 0 ? (
                      dataIntegrityIssues.map((issue, idx) => (
                        <li key={idx} style={{ color: 'var(--color-md-sys-on-surface-variant)', fontSize: '0.9rem' }}>{issue}</li>
                      ))
                    ) : (
                      <li style={{ color: 'var(--color-md-sys-on-surface-variant)', fontSize: '0.9rem' }}>
                        No logical constraint conflicts found. A sync process or structure generation constraint has triggered a warning.
                      </li>
                    )}
                  </ul>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-md-sys-outline-variant)' }}>
                  {dataIntegrityIssues.some(iss => iss.includes('Duplicate')) && (
                    <Button variant="filled" color="primary" onClick={handleAutoRepairDatabase}>
                      Auto-Fix Duplicates
                    </Button>
                  )}
                  <Button variant="outlined" onClick={() => setShowCorruptionModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </Dialog>
          )}

          {/* Page Content */}
          {renderContent()}
        </main>
      </div>

      {/* Global Toast Container */}
      <div className="global-toast-container" style={{ position: 'fixed', top: 'calc(4rem + 16px)', right: '24px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`global-toast ${toast.type}`}>
            <div className="global-toast-content">
              <span style={{ flex: 1 }}>{toast.message}</span>
              {toast.action && (
                <button
                  onClick={() => { toast.action.onClick(); removeToast(toast.id); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', color: 'currentColor', border: '1px solid currentColor',
                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <div className="toast-progress">
              <div className="toast-progress-bar" />
            </div>
          </div>
        ))}
      </div>

      {/* Global Command Palette */}
      {showCommandPalette && (
        <div className="command-palette-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCommandPalette(false) }}>
          <div className="command-palette">
            <div className="command-palette-search-wrapper">
              <Search size={18} style={{ color: 'var(--color-md-sys-on-surface-variant)' }} />
              <input
                autoFocus
                className="command-palette-input"
                type="text"
                placeholder="Type a command or search..."
                value={commandSearch}
                onChange={(e) => {
                  setCommandSearch(e.target.value)
                  setPaletteIndex(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    e.stopPropagation()
                    setPaletteIndex(prev => (prev + 1) % filteredItems.length)
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    e.stopPropagation()
                    setPaletteIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    selectPaletteItem(paletteIndex)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowCommandPalette(false)
                    setCommandSearch('')
                    setPaletteIndex(0)
                  }
                }}
              />
            </div>
            <div className="command-palette-list">
              {filteredItems.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-md-sys-on-surface-variant)', fontSize: '0.9rem' }}>
                  No results found.
                </div>
              ) : (
                (() => {
                  let lastCategory = null
                  return filteredItems.map((item, index) => {
                    const showHeader = item.category !== lastCategory
                    lastCategory = item.category
                    return (
                      <div key={item.id}>
                        {showHeader && (
                          <div className="command-palette-section-header">
                            {item.category}
                          </div>
                        )}
                        <div
                          className={`command-palette-item ${paletteIndex === index ? 'active' : ''}`}
                          onClick={() => selectPaletteItem(index)}
                          onMouseEnter={() => setPaletteIndex(index)}
                        >
                          <div className="command-palette-item-left">
                            <span className="command-palette-item-icon">
                              {getCategoryIcon(item.category, item.id)}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          <span className="command-palette-item-shortcut">
                            {item.category === 'Pages' ? '\u23CE' : (item.category === 'Employees' ? 'View' : 'Action')}
                          </span>
                        </div>
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
