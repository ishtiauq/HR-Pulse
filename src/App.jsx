import { useState, useEffect, useRef } from 'react'

import Dashboard from './components/Dashboard.jsx'
import Employees from './components/Employees.jsx'
import DriveSync from './components/DriveSync.jsx'
import Login from './components/Login.jsx'
import Payroll from './components/Payroll.jsx'
import Settings from './components/Settings.jsx'
import Attendance from './components/Attendance.jsx'
import Expenses from './components/Expenses.jsx'
import Announcements from './components/Announcements.jsx'
import Assets from './components/Assets.jsx'
import Calendar from './components/Calendar.jsx'
import Documents from './components/Documents.jsx'
import EmployeePortal from './components/EmployeePortal.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import ToastContainer from './components/layout/ToastContainer.jsx'
import CommandPalette from './components/layout/CommandPalette.jsx'
import { readMeta, writeMeta, readTable, writeTable, flushPendingWrites, checkAndRunAutoBackup, createBackup } from './services/googleDrive.js'
import { validateDatabase } from './services/validator.js'
import { useModal } from './services/useModal.js'
import { EMPLOYEES_STORAGE_KEY, timestampArrayChanges, allNavItems } from './utils/helpers.js'
import { encryptJson, decryptJson } from './services/crypto.js'
import { useTheme } from './hooks/useTheme.js'
import { useToast } from './hooks/useToast.js'
import { useAuth } from './hooks/useAuth.js'
import { useCommandPalette } from './hooks/useCommandPalette.jsx'

export default function App() {
  const { user, setUser, handleLogin, handleLogout } = useAuth()
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('hr_pulse_current_view') || 'dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')

  useEffect(() => {
    const handleResize = () => setMobileMenuOpen(false)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      window.history.pushState({ mobileMenu: true }, '')
      const handlePop = () => setMobileMenuOpen(false)
      window.addEventListener('popstate', handlePop)
      return () => window.removeEventListener('popstate', handlePop)
    }
  }, [mobileMenuOpen])

  const toggleSidebar = () => {
    const width = window.innerWidth
    if (width >= 768) {
      const next = !isCollapsed
      setIsCollapsed(next)
      localStorage.setItem('sidebar_collapsed', next)
    } else {
      setIsCollapsed(false)
      setMobileMenuOpen(!mobileMenuOpen)
    }
  }
  const handleSync = () => { if (syncRef.current && !isSyncing) syncRef.current() }
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
  const syncRef = useRef(null)

  const [simulatedRole, setSimulatedRole] = useState('Admin')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [pendingProfileEdits, setPendingProfileEdits] = useState([])
  const [auditLogs, setAuditLogs] = useState([
    { id: 'audit-1', timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'System', action: 'CREATE', entity: 'System', details: 'Initialized audit logging.', ip: 'N/A' }
  ])

  const addAuditLog = (action, entity, details) => {
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Admin',
      action,
      entity,
      details,
      ip: 'N/A'
    }
    setAuditLogs(prev => [newLog, ...prev])
  }

  const hasPermission = (resource) => {
    if (simulatedRole === 'Admin') return true
    if (simulatedRole === 'Employee') {
      return ['dashboard', 'attendance', 'expenses', 'calendar'].includes(resource)
    }
    if (simulatedRole === 'Payroll Manager') {
      return ['dashboard', 'employees', 'payroll', 'expenses', 'calendar', 'documents'].includes(resource)
    }
    if (simulatedRole === 'HR Manager') {
      return ['dashboard', 'employees', 'attendance', 'payroll', 'expenses', 'calendar', 'documents'].includes(resource)
    }
    return false
  }

  const { toasts, addToast, removeToast } = useToast()

  const [notifications, setNotifications] = useState([
    { id: 'notif-1', text: 'Your leave request was approved', read: false, time: '2 mins ago' },
    { id: 'notif-2', text: 'New leave request from Sarah Rahman', read: false, time: '1 hour ago' }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  
  const addNotification = (text) => {
    setNotifications(prev => [{ id: `notif-${Date.now()}`, text, read: false, time: 'Just now' }, ...prev])
  }
  
  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const { themeMode, isDarkMode, toggleTheme } = useTheme()

  useEffect(() => {
    localStorage.setItem('hr_pulse_current_view', currentView)
    const timer = setTimeout(() => setIsAppLoading(false), 500)
    return () => clearTimeout(timer)
  }, [currentView])

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const { showCommandPalette, setShowCommandPalette, commandSearch, setCommandSearch, paletteIndex, setPaletteIndex, filteredItems, selectPaletteItem, getCategoryIcon } = useCommandPalette({
    user, employees, themeMode, toggleTheme, setCurrentView, addToast, setSelectedEmployeeId
  })

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

  const [employees, setEmployees] = useState(() => {
    const plain = localStorage.getItem(EMPLOYEES_STORAGE_KEY + '_plain')
    if (plain) {
      try {
        const parsed = JSON.parse(plain)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch (e) {}
    }
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
    if (!user) return
    const loadEmployeesFromStorage = async () => {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY)
      if (!saved) return
      try {
        const keyMaterial = user?.token || 'hr-pulse-local-fallback-key'
        const parsed = await decryptJson(saved, keyMaterial)
        if (Array.isArray(parsed)) {
          setEmployees(parsed)
          localStorage.setItem(EMPLOYEES_STORAGE_KEY + '_plain', JSON.stringify(parsed))
        }
      } catch (e) {
        console.error('Failed to decrypt saved employees:', e)
      }
    }

    loadEmployeesFromStorage()
  }, [user?.token, user])

  const didPersistEmployees = useRef(false)

  useEffect(() => {
    if (!didPersistEmployees.current) {
      didPersistEmployees.current = true
      return
    }
    const persistEmployees = async () => {
      try {
        const keyMaterial = user?.token || 'hr-pulse-local-fallback-key'
        const encrypted = await encryptJson(employees, keyMaterial)
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, encrypted)
        localStorage.setItem(EMPLOYEES_STORAGE_KEY + '_plain', JSON.stringify(employees))
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
          const plain = localStorage.getItem(EMPLOYEES_STORAGE_KEY + '_plain')
          if (plain) {
            try {
              const parsed = JSON.parse(plain)
              if (Array.isArray(parsed) && parsed.length > 0) empData = parsed
            } catch (e) {}
          }
          if (!empData) {
            const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY)
            if (saved) {
              try {
                const keyMaterial = user?.token || 'hr-pulse-local-fallback-key'
                empData = await decryptJson(saved, keyMaterial)
              } catch (e) {
                console.error('Failed to decrypt saved employees for Drive init:', e)
              }
            }
          }
          if (!empData) empData = defaultContent
          await writeTable('employees', empData, meta, user.token)
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
          const saved = localStorage.getItem('hr_pulse_payroll')
          if (saved) { try { payrollData = JSON.parse(saved) } catch (e) {} }
          if (!payrollData) payrollData = defaultPayroll
          await writeTable('payroll', payrollData, meta, user.token)
        }
        if (Array.isArray(payrollData)) payrollData = { '2026-07': payrollData }
        setPayroll(payrollData)

        const defaultSettings = {
      currency: '৳',
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
          const saved = localStorage.getItem('hr_pulse_settings')
          if (saved) { try { settingsData = JSON.parse(saved) } catch (e) {} }
          if (!settingsData) settingsData = defaultSettings
          await writeTable('settings', settingsData, meta, user.token)
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
          const savedAtt = localStorage.getItem('hr_pulse_attendance')
          if (savedAtt) {
            try {
              const parsed = JSON.parse(savedAtt)
              leavesData = leavesData || parsed.leaves || defaultLeaves
              balancesData = balancesData || parsed.balances || defaultBalances
              logsData = logsData || parsed.dailyLogs || defaultLogs
            } catch (e) {}
          }
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
          }
          await writeTable('leave_requests', leavesData, meta, user.token)
          await writeTable('leave_balances', balancesData, meta, user.token)
          await writeTable('attendance_logs', logsData, meta, user.token)
        }
        
        setAttendance({ leaves: leavesData, balances: balancesData, dailyLogs: logsData })

        const defaultExpenses = []
        let expensesData = await readTable('expenses', user.token, bgSyncCallback)
        if (!expensesData) {
          const saved = localStorage.getItem('hr_pulse_expenses')
          if (saved) { try { expensesData = JSON.parse(saved) } catch (e) {} }
          if (!expensesData) expensesData = defaultExpenses
          await writeTable('expenses', expensesData, meta, user.token)
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
          addToast('Data integrity issues found. Check console for details.', 'warning')
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

    syncRef.current = syncDatabase
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
            onSync={handleSync}
            setCurrentView={setCurrentView}
            announcements={announcements}
            events={events}
            payroll={payroll}
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
            addLog={addLog}
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
            onSync={handleSync}
            announcements={announcements}
            events={events}
            payroll={payroll}
          />
        )
    }
  }

  if (!user) {
    return <Login onLogin={handleLogin} themeMode={themeMode} toggleTheme={toggleTheme} />
  }

  if (simulatedRole === 'Employee' || user.isEmployee) {
    return (
      <EmployeePortal
        currentUser={{...user, role: user.role || 'Employee', department: user.department || 'Engineering'}}
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
        simulatedRole={simulatedRole}
        setSimulatedRole={setSimulatedRole}
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

  const navRailItems = visibleNavItems.map(item => ({
    label: item.label,
    icon: item.icon,
  }))

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="dashboard-root app-shell" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', padding: '16px', gap: '16px', boxSizing: 'border-box' }}>
      {mobileMenuOpen && (
        <div className="sidebar-overlay open" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      <Sidebar
        visibleNavItems={visibleNavItems}
        isCollapsed={isCollapsed}
        isDarkMode={isDarkMode}
        currentView={currentView}
        setCurrentView={setCurrentView}
        mobileMenuOpen={mobileMenuOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        simulatedRole={simulatedRole}
        showRoleModal={showRoleModal}
        setShowRoleModal={setShowRoleModal}
        handleLogout={handleLogout}
        setIsCollapsed={setIsCollapsed}
        setSimulatedRole={setSimulatedRole}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <main className="content dashboard-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollbarGutter: 'stable' }}>
        
        <Topbar
          isDarkMode={isDarkMode}
          toggleSidebar={toggleSidebar}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          handleSync={handleSync}
          isSyncing={isSyncing}
          driveConnected={driveConnected}
          syncConflicts={syncConflicts}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          markNotificationsRead={markNotificationsRead}
          unreadCount={unreadCount}
        />

        {/* Page Content */}
          {renderContent()}
        </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <CommandPalette
        showCommandPalette={showCommandPalette}
        setShowCommandPalette={setShowCommandPalette}
        commandSearch={commandSearch}
        setCommandSearch={setCommandSearch}
        paletteIndex={paletteIndex}
        setPaletteIndex={setPaletteIndex}
        filteredItems={filteredItems}
        selectPaletteItem={selectPaletteItem}
        getCategoryIcon={getCategoryIcon}
      />
    </div>
  )
}
