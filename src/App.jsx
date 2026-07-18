import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
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
import EmployeePortal from './components/EmployeePortal.jsx'
import { loadOrInitializeDatabase, updateAppDataFile } from './services/googleDrive.js'
import { Menu, Bell } from 'lucide-react'

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
  const [isAppLoading, setIsAppLoading] = useState(true)

  // RBAC & Security States
  const [simulatedRole, setSimulatedRole] = useState('Admin')
  const [pendingProfileEdits, setPendingProfileEdits] = useState([])
  const [auditLogs, setAuditLogs] = useState([
    { id: 'audit-1', timestamp: new Date(Date.now() - 86400000).toISOString(), user: 'System', action: 'CREATE', entity: 'System', details: 'Initialized audit logging.', ip: '192.168.1.1' }
  ])

  const addAuditLog = (action, entity, details) => {
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Admin', // In real app, from user state
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
      return ['dashboard', 'attendance', 'expenses'].includes(resource)
    }
    if (simulatedRole === 'Payroll Manager') {
      return ['dashboard', 'employees', 'payroll', 'reports', 'expenses'].includes(resource)
    }
    if (simulatedRole === 'HR Manager') {
      return ['dashboard', 'employees', 'attendance', 'payroll', 'reports', 'expenses'].includes(resource)
    }
    return false
  }

  // Global Toasts
  const [toasts, setToasts] = useState([])
  const addToast = (message, type = 'success', action = null) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, action }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Remove toast manually (useful if an action was taken)
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Notifications
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

  // Dark Mode Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_theme')
    return saved === 'dark'
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

  // Initial App Loader Simulator
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 500)
    return () => clearTimeout(timer)
  }, [currentView])

  // Global Keyboard Shortcuts & Command Palette
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandSearch, setCommandSearch] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.target.blur()
        } else {
          return
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      } else if (e.key === '/') {
        e.preventDefault()
        setShowCommandPalette(true)
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setCurrentView('employees')
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        addToast('Save shortcut triggered', 'info')
        // In a real app, this would trigger the specific page's save function
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

  // NEW ROSTER & SHIFT STATES
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

  // NEW ANNOUNCEMENTS STATE
  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_announcements')
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(e) } }
    return [
      {
        id: 'ann-1',
        title: 'Welcome to HR Pulse!',
        content: 'We are thrilled to roll out the new HR Pulse internal portal. Please take a moment to review your profile details and explore the new ESS features.',
        authorId: 'EMP-101', // HR Admin
        date: new Date().toISOString(),
        category: 'General',
        priority: 'Important',
        audience: 'all',
        attachments: [],
        reactions: { '👍': 0, '❤️': 0, '🎉': 0 },
        comments: [],
        readBy: [],
        poll: null
      }
    ]
  })

  // NEW ASSETS STATE
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

  // LocalStorage persistence effects
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

  // Auto-Post Birthdays & Anniversaries
  useEffect(() => {
    if (!employees || employees.length === 0) return

    const today = new Date()
    const currentMonthDay = `${today.getMonth() + 1}-${today.getDate()}`
    const currentYear = today.getFullYear()

    let newPosts = []

    employees.forEach(emp => {
      // Check Birthday
      if (emp.dob) {
        const dobDate = new Date(emp.dob)
        const dobMonthDay = `${dobDate.getMonth() + 1}-${dobDate.getDate()}`
        
        if (dobMonthDay === currentMonthDay) {
          // Check if we already posted for this year
          const existing = announcements.find(a => a.category === 'Birthday' && a.content.includes(emp.name) && a.date.startsWith(currentYear.toString()))
          if (!existing) {
            newPosts.push({
              id: `ann-bday-${emp.id}-${currentYear}`,
              title: `🎉 Happy Birthday, ${emp.name}!`,
              content: `Let's all wish a fantastic birthday to ${emp.name} from the ${emp.department} team! Have a great day! 🎂🎈`,
              authorId: 'system',
              date: new Date().toISOString(),
              category: 'Achievement/Birthday/Work Anniversary',
              priority: 'Normal',
              audience: 'all',
              attachments: [],
              reactions: { '👍': 0, '❤️': 0, '🎉': 0 },
              comments: [],
              readBy: [],
              poll: null
            })
          }
        }
      }

      // Check Work Anniversary
      if (emp.joiningDate) {
        const joinDate = new Date(emp.joiningDate)
        const joinMonthDay = `${joinDate.getMonth() + 1}-${joinDate.getDate()}`
        const years = currentYear - joinDate.getFullYear()

        if (joinMonthDay === currentMonthDay && years > 0) {
          const existing = announcements.find(a => a.category === 'Anniversary' && a.content.includes(emp.name) && a.date.startsWith(currentYear.toString()))
          if (!existing) {
            newPosts.push({
              id: `ann-work-${emp.id}-${currentYear}`,
              title: `🌟 Happy Work Anniversary, ${emp.name}!`,
              content: `Congratulations to ${emp.name} for completing ${years} year${years > 1 ? 's' : ''} with us! Thank you for your hard work and dedication! 🏆`,
              authorId: 'system',
              date: new Date().toISOString(),
              category: 'Achievement/Birthday/Work Anniversary',
              priority: 'Normal',
              audience: 'all',
              attachments: [],
              reactions: { '👍': 0, '❤️': 0, '🎉': 0 },
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

  // Real Google Drive synchronization effect
  useEffect(() => {
    if (!user || user.isSimulated) {
      setDriveFileId(null)
      setPayrollFileId(null)
      setSettingsFileId(null)
      setAttendanceFileId(null)
      return
    }

    const syncDatabase = async () => {
      try {
        setIsSyncing(true)
        addLog('Connecting to Drive', 'Initializing private workspace folder')
        
        const defaultContent = [
          { id: 'EMP-101', name: 'Ishtiauq Ahmed', role: 'HR Manager', department: 'Human Resources', status: 'Active', email: 'ishtiauq@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
          { id: 'EMP-102', name: 'Sarah Rahman', role: 'Lead Frontend Developer', department: 'Engineering', status: 'Active', email: 'sarah.r@hrpulse.io', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
          { id: 'EMP-103', name: 'Nafis Chowdhury', role: 'Senior Product Designer', department: 'Design', status: 'Active', email: 'nafis.c@hrpulse.io', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
          { id: 'EMP-104', name: 'Tanvir Hasan', role: 'QA Automation Engineer', department: 'Engineering', status: 'On Leave', email: 'tanvir.h@hrpulse.io', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' }
        ]

        const empSync = await loadOrInitializeDatabase('employees.json', defaultContent, user.token)
        setEmployees(empSync.data)
        setDriveFileId(empSync.fileId)

        // Load or initialize payroll records
        const defaultPayroll = {
          '2026-07': [
            { employeeId: 'EMP-101', grossSalary: 3200, status: 'Paid', paymentDate: 'July 15, 2026', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } },
            { employeeId: 'EMP-102', grossSalary: 4500, status: 'Pending', paymentDate: '', advance: 150, loan: { total: 1000, installment: 100, remaining: 900 } },
            { employeeId: 'EMP-103', grossSalary: 4000, status: 'Pending', paymentDate: '', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } },
            { employeeId: 'EMP-104', grossSalary: 5200, status: 'Pending', paymentDate: '', advance: 0, loan: { total: 0, installment: 0, remaining: 0 } }
          ]
        }
        const payrollSync = await loadOrInitializeDatabase('payroll.json', defaultPayroll, user.token)
        let payrollData = payrollSync.data
        if (Array.isArray(payrollData)) {
          // Legacy migration
          payrollData = { '2026-07': payrollData }
        }
        setPayroll(payrollData)
        setPayrollFileId(payrollSync.fileId)

        // Load or initialize settings configurations
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
        const settingsSync = await loadOrInitializeDatabase('settings.json', defaultSettings, user.token)
        setSettings(settingsSync.data)
        setSettingsFileId(settingsSync.fileId)

        // Load or initialize attendance configurations
        const defaultAttendance = {
          leaves: [
            { id: 'REQ-101', employeeId: 'EMP-102', leaveType: 'Sick Leave', startDate: '2026-07-10', endDate: '2026-07-12', days: 3, reason: 'Flu symptoms', status: 'Approved' },
            { id: 'REQ-102', employeeId: 'EMP-104', leaveType: 'Annual Leave', startDate: '2026-07-20', endDate: '2026-07-25', days: 6, reason: 'Family vacation', status: 'Pending' }
          ],
          balances: {
            'EMP-101': { sick: { used: 0, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } },
            'EMP-102': { sick: { used: 3, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } },
            'EMP-103': { sick: { used: 0, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } },
            'EMP-104': { sick: { used: 0, limit: 14 }, casual: { used: 0, limit: 10 }, annual: { used: 0, limit: 20 } }
          },
          dailyLogs: {
            '2026-07-16': {
              'EMP-101': { status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0' },
              'EMP-102': { status: 'Present', checkIn: '08:50 AM', checkOut: '06:10 PM', hours: '9.3' },
              'EMP-103': { status: 'Late', checkIn: '09:30 AM', checkOut: '06:00 PM', hours: '8.5' },
              'EMP-104': { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
            }
          }
        }
        const attendanceSync = await loadOrInitializeDatabase('attendance.json', defaultAttendance, user.token)
        setAttendance(attendanceSync.data)
        setAttendanceFileId(attendanceSync.fileId)

        setIsSyncing(false)
        addLog('Database Synced', 'Successfully loaded database, settings, and attendance from Google Drive.', 'success')
      } catch (err) {
        setIsSyncing(false)
        addLog('Sync Failed', 'Could not sync database with Google Drive: ' + err.message, 'danger')
        console.error(err)
      }
    }

    syncDatabase()
  }, [user])

  const handleSetEmployees = async (updater) => {
    setEmployees((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      
      // Auto-save changes back to Google Drive
      if (user && !user.isSimulated && driveFileId && driveConnected) {
        updateAppDataFile(driveFileId, next, user.token)
          .then(() => {
            addLog('Database Saved', 'Changes successfully uploaded to Google Drive.', 'success')
          })
          .catch((err) => {
            addLog('Save Failed', 'Could not save changes to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }

  const handleSetPayroll = async (updater) => {
    setPayroll((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      
      // Auto-save changes back to Google Drive
      if (user && !user.isSimulated && payrollFileId && driveConnected) {
        updateAppDataFile(payrollFileId, next, user.token)
          .then(() => {
            addLog('Payroll Saved', 'Salary updates synced to Google Drive.', 'success')
          })
          .catch((err) => {
            addLog('Save Failed', 'Could not save payroll data to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }

  const handleSetSettings = async (updater) => {
    setSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      
      // LocalStorage persistence
      localStorage.setItem('hr_pulse_settings', JSON.stringify(next))
      
      // Auto-save changes back to Google Drive
      if (user && !user.isSimulated && settingsFileId && driveConnected) {
        updateAppDataFile(settingsFileId, next, user.token)
          .then(() => {
            addLog('Settings Saved', 'System configurations synced to Google Drive.', 'success')
          })
          .catch((err) => {
            addLog('Save Failed', 'Could not save settings configurations to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }

  const handleSetAttendance = async (updater) => {
    setAttendance((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      
      // Auto-save changes back to Google Drive
      if (user && !user.isSimulated && attendanceFileId && driveConnected) {
        updateAppDataFile(attendanceFileId, next, user.token)
          .then(() => {
            addLog('Attendance Saved', 'Attendance logs synced to Google Drive.', 'success')
          })
          .catch((err) => {
            addLog('Save Failed', 'Could not save attendance data to cloud: ' + err.message, 'danger')
          })
      }
      return next
    })
  }

  const handleSetExpenses = (updater) => {
    setExpenses((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }
  // Function to simulate Google Drive activity log update
  const addLog = (action, details, status = 'success') => {
    const newLog = {
      id: `log-${Date.now()}`,
      action,
      status,
      timestamp: 'Just now',
      details
    }
    setSyncLogs(prev => [newLog, ...prev.slice(0, 4)])
    
    // Also trigger global toast for important actions
    if (status === 'success') {
      addToast(action, 'success')
    } else if (status === 'danger') {
      addToast(action, 'error')
    }
  }

  // Effect to simulate periodic sync when connected
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
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton" style={{ height: '40px', width: '200px' }} />
          <div className="skeleton" style={{ height: '120px', width: '100%', borderRadius: '16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '16px' }} />
            <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '16px' }} />
          </div>
        </div>
      )
    }

    if (!hasPermission(currentView)) {
      return (
        <div className="animate-fade-in" style={{ padding: '64px 32px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>!</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-danger)', marginBottom: '16px' }}>403 Forbidden</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
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
        />
      case 'drive':
        return (
          <DriveSync 
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
        currentUser={{...user, role: 'Employee', department: 'Engineering'}} // Mocked for now, normally found in employees array
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

  return (
    <div className="app-container">
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={24} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>HR Pulse</h2>
        <img 
          src={user.avatar} 
          alt={user.name} 
          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
        />
      </header>

      {/* Dim overlay background when drawer is open */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        driveConnected={driveConnected}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        settings={settings}
        setSettings={handleSetSettings}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        simulatedRole={simulatedRole}
      />
      <main className="content-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>{renderBreadcrumbs()}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            
            {/* Role Simulator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View As:</span>
              <select 
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Admin">Admin</option>
                <option value="HR Manager">HR Manager</option>
                <option value="Payroll Manager">Payroll Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>

            <button 
              onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead() }}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent-danger)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', animation: 'modalFadeIn 0.2s ease-out' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Notifications</h3>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.03)', background: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, fontWeight: n.read ? 500 : 600, lineHeight: 1.4 }}>{n.text}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {renderContent()}
      </main>

      {/* Global Toast Container */}
      <div className="global-toast-container">
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
            <input 
              autoFocus
              type="text" 
              placeholder="Type a command or search..." 
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
            />
            <div className="command-palette-list">
              <div className="command-palette-item" onClick={() => { setCurrentView('dashboard'); setShowCommandPalette(false) }}>
                Go to Dashboard
              </div>
              <div className="command-palette-item" onClick={() => { setCurrentView('employees'); setShowCommandPalette(false) }}>
                Go to Employees
              </div>
              <div className="command-palette-item" onClick={() => { setCurrentView('payroll'); setShowCommandPalette(false) }}>
                Go to Payroll
              </div>
              <div className="command-palette-item" onClick={() => { setCurrentView('attendance'); setShowCommandPalette(false) }}>
                Go to Attendance & Leaves
              </div>
              <div className="command-palette-item" onClick={() => { setIsDarkMode(!isDarkMode); setShowCommandPalette(false) }}>
                Toggle Dark Mode
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
