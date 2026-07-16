import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Employees from './components/Employees.jsx'
import DriveSync from './components/DriveSync.jsx'
import Login from './components/Login.jsx'
import Payroll from './components/Payroll.jsx'
import Settings from './components/Settings.jsx'
import Attendance from './components/Attendance.jsx'
import { loadOrInitializeDatabase, updateAppDataFile } from './services/googleDrive.js'
import { Menu } from 'lucide-react'

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
    const saved = localStorage.getItem('hr_pulse_employees')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved employees:', e)
      }
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

  const [settings, setSettings] = useState({
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
    localStorage.setItem('hr_pulse_employees', JSON.stringify(employees))
  }, [employees])

  useEffect(() => {
    localStorage.setItem('hr_pulse_payroll', JSON.stringify(payroll))
  }, [payroll])

  useEffect(() => {
    localStorage.setItem('hr_pulse_attendance', JSON.stringify(attendance))
  }, [attendance])

  useEffect(() => {
    localStorage.setItem('hr_pulse_sync_logs', JSON.stringify(syncLogs))
  }, [syncLogs])

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

  const handleSetSettings = async (updatedSettings) => {
    setSettings(updatedSettings)
    
    // Auto-save changes back to Google Drive
    if (user && !user.isSimulated && settingsFileId && driveConnected) {
      updateAppDataFile(settingsFileId, updatedSettings, user.token)
        .then(() => {
          addLog('Settings Saved', 'System configurations synced to Google Drive.', 'success')
        })
        .catch((err) => {
          addLog('Save Failed', 'Could not save settings configurations to cloud: ' + err.message, 'danger')
        })
    }
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

  const renderContent = () => {
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
          />
        )
      case 'attendance':
        return (
          <Attendance 
            employees={employees}
            attendance={attendance}
            setAttendance={handleSetAttendance}
            addLog={addLog}
            driveConnected={driveConnected}
          />
        )
      case 'settings':
        return (
          <Settings 
            settings={settings}
            setSettings={handleSetSettings}
            addLog={addLog}
          />
        )
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
          />
        )
    }
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
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
      />
      <main className="content-container">
        {renderContent()}
      </main>
    </div>
  )
}
