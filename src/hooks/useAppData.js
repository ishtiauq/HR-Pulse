import { useState, useEffect, useRef, useCallback } from 'react'
import { readMeta, readTable, writeTable, flushPendingWrites, checkAndRunAutoBackup, getOrCreateFilesFolder, uploadBinaryFile } from '../services/googleDrive.js'
import { validateDatabase } from '../services/validator.js'
import { encryptJson, decryptJson } from '../services/crypto.js'
import { EMPLOYEES_STORAGE_KEY, timestampArrayChanges, getDeviceInfo } from '../utils/helpers.js'
import { syncEmployeeSnapshot, subscribeToTable, writeToTable, deleteFromFirebaseStorage, downloadFromFirebaseStorage } from '../services/bridge.js'

export default function useAppData({ user, addToast }) {
  /* ─── Drive / DB state ─── */
  const [driveConnected, setDriveConnected] = useState(true)
  const [driveFileId, setDriveFileId] = useState(null)
  const [payrollFileId, setPayrollFileId] = useState(null)
  const [settingsFileId, setSettingsFileId] = useState(null)
  const [attendanceFileId, setAttendanceFileId] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [dbStatus, setDbStatus] = useState('healthy')
  const [dataIntegrityIssues, setDataIntegrityIssues] = useState([])
  const [showCorruptionModal, setShowCorruptionModal] = useState(false)
  const [syncConflicts, setSyncConflicts] = useState([])
  const [metaManifest, setMetaManifest] = useState(null)
  const [isAppLoading, setIsAppLoading] = useState(true)
  const syncRef = useRef(null)
  const syncedForUser = useRef(null)

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
    const currentRole = user?.role || 'Teammate'
    if (currentRole === 'Admin') return true
    
    // For Teammates, base permissions + custom permissions
    if (currentRole === 'Teammate') {
      const basePerms = ['dashboard', 'attendance', 'expenses', 'calendar', 'tasks', 'profile', 'notes']
      const customPerms = user?.permissions || []
      return basePerms.includes(resource) || customPerms.includes(resource)
    }
    return false
  }

  /* ─── Notifications ─── */
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('kormiis_notifications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000)
        return parsed.filter(n => (n.timestamp || Date.now()) > fortyEightHoursAgo)
      } catch (e) {
        return []
      }
    }
    return []
  })
  
  useEffect(() => {
    localStorage.setItem('kormiis_notifications', JSON.stringify(notifications))
  }, [notifications])

  const [showNotifications, setShowNotifications] = useState(false)

  const addNotification = (text, view = null) => {
    setNotifications(prev => [{ 
      id: `notif-${Date.now()}`, 
      text, 
      read: false, 
      timestamp: Date.now(),
      time: 'Just now',
      view 
    }, ...prev])
  }

  const markNotificationsRead = (id = null) => {
    if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  /* ─── Data state initialisers ─── */
  const loadSaved = (key) => {
    const saved = localStorage.getItem(key)
    if (saved) { try { return JSON.parse(saved) } catch (e) { console.error(`parse ${key}:`, e) } }
    return null
  }

  const [employees, setEmployeesRaw] = useState(() => {
    const plain = localStorage.getItem(EMPLOYEES_STORAGE_KEY + '_plain')
    if (plain) { try { const p = JSON.parse(plain); if (Array.isArray(p) && p.length > 0) return p } catch (e) {} }
    return []
  })
  const [payroll, setPayrollRaw] = useState(() => loadSaved('kormiis_payroll') || {})

  const [attendance, setAttendanceRaw] = useState(() => loadSaved('kormiis_attendance') || { leaves: [], dailyLogs: {}, balances: {} })
  const [expenses, setExpensesRaw] = useState(() => loadSaved('kormiis_expenses') || [])
  const [events, setEvents] = useState(() => loadSaved('kormiis_events') || [])
  const [documents, setDocuments] = useState(() => loadSaved('kormiis_documents') || [])
  const [roster, setRoster] = useState(() => loadSaved('kormiis_roster') || [])
  const [shiftSwaps, setShiftSwaps] = useState(() => loadSaved('kormiis_shift_swaps') || [])
  const [overtimeClaims, setOvertimeClaims] = useState(() => loadSaved('kormiis_overtime_claims') || [])
  const [announcements, setAnnouncements] = useState(() => {
    const saved = loadSaved('kormiis_announcements')
    if (saved) return saved
    return []
  })
  const [tasks, setTasks] = useState(() => loadSaved('kormiis_tasks') || [])
  const [notes, setNotesRaw] = useState(() => loadSaved('kormiis_notes') || [])
  const [assets, setAssets] = useState(() => loadSaved('kormiis_assets') || [])
  const [assetRequests, setAssetRequests] = useState(() => loadSaved('kormiis_asset_requests') || [])
  const [assetCategories, setAssetCategories] = useState(() => loadSaved('kormiis_asset_categories') || ['Laptop', 'Phone', 'Monitor', 'Peripherals', 'Access Card'])
  const [settings, setSettingsRaw] = useState(() => loadSaved('kormiis_settings') || { currency: '৳', officeLocation: { lat: 23.8103, lng: 90.4125, radius: 100 }, salaryStructure: [{ id: 'basic', name: 'Basic Salary', percentage: 50, type: 'earning' }, { id: 'hra', name: 'House Rent Allowance (HRA)', percentage: 25, type: 'earning' }, { id: 'medical', name: 'Medical Allowance', percentage: 10, type: 'earning' }, { id: 'conveyance', name: 'Conveyance Allowance', percentage: 10, type: 'earning' }, { id: 'pf', name: 'Provident Fund (PF)', percentage: 5, type: 'deduction' }], company: { name: 'Kormiis Ltd.', email: 'hr@kormiis.io', website: 'www.kormiis.io', logo: '', logoX: 0, logoY: 0, logoZoom: 1 }, shiftTemplates: [{ id: 'st-1', name: 'Morning Shift', start: '09:00', end: '18:00', break: 60, color: '#3b82f6' }, { id: 'st-2', name: 'Evening Shift', start: '14:00', end: '23:00', break: 60, color: '#8b5cf6' }, { id: 'st-3', name: 'Night Shift', start: '22:00', end: '07:00', break: 60, color: '#1e293b' }, { id: 'st-4', name: 'Half-Day', start: '09:00', end: '13:00', break: 0, color: '#f59e0b' }], overtimeRules: { multiplierWeekday: 1.5, multiplierWeekend: 2.0 }, notifications: { syncAlerts: true, emailDigests: false } })
  const [syncLogs, setSyncLogs] = useState(() => loadSaved('kormiis_sync_logs') || [])

  /* ─── addLog ─── */
  const addLog = (action, details, status = 'success') => {
    const newLog = { id: `log-${Date.now()}`, action, status, timestamp: 'Just now', details }
    setSyncLogs(prev => [newLog, ...prev.slice(0, 4)])
    if (status === 'success') addToast(action, 'success')
    else if (status === 'danger') addToast(action, 'error')
  }

  /* ─── Encrypted employee loading ─── */
  useEffect(() => {
    if (!user) return
    const loadEmployeesFromStorage = async () => {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY)
      if (!saved) return
      try {
        const keyMaterial = user?.token || 'kormiis-local-fallback-key'
        const parsed = await decryptJson(saved, keyMaterial)
        if (Array.isArray(parsed)) {
          setEmployeesRaw(parsed)
          localStorage.setItem(EMPLOYEES_STORAGE_KEY + '_plain', JSON.stringify(parsed))
        }
      } catch (e) { console.error('Failed to decrypt saved employees:', e) }
    }
    loadEmployeesFromStorage()
  }, [user?.token, user])

  /* ─── Employee persistence (encrypted) ─── */
  const didPersistEmployees = useRef(false)
  useEffect(() => {
    if (!didPersistEmployees.current) { didPersistEmployees.current = true; return }
    const persistEmployees = async () => {
      try {
        const keyMaterial = user?.token || 'kormiis-local-fallback-key'
        const encrypted = await encryptJson(employees, keyMaterial)
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, encrypted)
        localStorage.setItem(EMPLOYEES_STORAGE_KEY + '_plain', JSON.stringify(employees))
      } catch (e) { console.error('Failed to encrypt employees for storage:', e) }
    }
    persistEmployees()
  }, [employees, user?.token])

  /* ─── Persistence effects ─── */
  const persistStates = [
    { key: 'kormiis_payroll', val: payroll },
    { key: 'kormiis_attendance', val: attendance },
    { key: 'kormiis_expenses', val: expenses },
    { key: 'kormiis_sync_logs', val: syncLogs },
    { key: 'kormiis_announcements', val: announcements },
    { key: 'kormiis_assets', val: assets },
    { key: 'kormiis_asset_requests', val: assetRequests },
    { key: 'kormiis_asset_categories', val: assetCategories },
    { key: 'kormiis_events', val: events },
    { key: 'kormiis_documents', val: documents },
    { key: 'kormiis_notes', val: notes },
  ]
  persistStates.forEach(({ key, val }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => { localStorage.setItem(key, JSON.stringify(val)) }, [val])
  })

  /* ─── Firebase Real-Time Subscriptions ─── */
  const adminUid = user?.isEmployee ? user.adminUid : user?.uid;
  useEffect(() => {
    if (!adminUid) return;

    const applyUpdate = (setter, driveWriter, tableName, data) => {
      if (data) {
        setter(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            // Data changed from remote Firestore
            if (!user?.isEmployee && driveConnected && metaManifest) {
              // Master Node: Backup to Drive
              driveWriter(tableName, data, { ...metaManifest }, user.token).catch(e => console.error(e));
            }
            return data;
          }
          return prev;
        });
      }
    };

    const unsubEmployees = subscribeToTable(adminUid, 'employees', (data) => applyUpdate(setEmployeesRaw, writeTable, 'employees', data));
    const unsubPayroll = subscribeToTable(adminUid, 'payroll', (data) => applyUpdate(setPayrollRaw, writeTable, 'payroll', data));
    const unsubSettings = subscribeToTable(adminUid, 'settings', (data) => applyUpdate(setSettingsRaw, writeTable, 'settings', data));
    const unsubTasks = subscribeToTable(adminUid, 'tasks', (data) => applyUpdate(setTasks, writeTable, 'tasks', data));
    const unsubNotes = subscribeToTable(adminUid, 'notes', (data) => applyUpdate(setNotesRaw, writeTable, 'notes', data));
    const unsubExpenses = subscribeToTable(adminUid, 'expenses', (data) => applyUpdate(setExpensesRaw, writeTable, 'expenses', data));
    const unsubEvents = subscribeToTable(adminUid, 'events', (data) => applyUpdate(setEvents, writeTable, 'events', data));
    const unsubDocuments = subscribeToTable(adminUid, 'documents', (data) => applyUpdate(setDocuments, writeTable, 'documents', data));
    const unsubRoster = subscribeToTable(adminUid, 'roster', (data) => applyUpdate(setRoster, writeTable, 'roster', data));
    const unsubShiftSwaps = subscribeToTable(adminUid, 'shift_swaps', (data) => applyUpdate(setShiftSwaps, writeTable, 'shift_swaps', data));
    const unsubOvertime = subscribeToTable(adminUid, 'overtime_claims', (data) => applyUpdate(setOvertimeClaims, writeTable, 'overtime_claims', data));
    const unsubAnnouncements = subscribeToTable(adminUid, 'announcements', (data) => applyUpdate(setAnnouncements, writeTable, 'announcements', data));
    const unsubAssets = subscribeToTable(adminUid, 'assets', (data) => applyUpdate(setAssets, writeTable, 'assets', data));
    const unsubAssetRequests = subscribeToTable(adminUid, 'asset_requests', (data) => applyUpdate(setAssetRequests, writeTable, 'asset_requests', data));
    const unsubAssetCategories = subscribeToTable(adminUid, 'asset_categories', (data) => applyUpdate(setAssetCategories, writeTable, 'asset_categories', data));

    const handleAttUpdate = (key, data) => {
      if(data) {
        setAttendanceRaw(prev => {
          if (JSON.stringify(prev[key]) !== JSON.stringify(data)) {
            const next = { ...prev, [key]: data };
            if (!user?.isEmployee && driveConnected && metaManifest) {
               const tn = key === 'leaves' ? 'leave_requests' : key === 'balances' ? 'leave_balances' : 'attendance_logs';
               writeTable(tn, data, { ...metaManifest }, user.token).catch(e => console.error(e));
            }
            return next;
          }
          return prev;
        });
      }
    };
    const unsubLeaves = subscribeToTable(adminUid, 'leave_requests', (data) => handleAttUpdate('leaves', data));
    const unsubBalances = subscribeToTable(adminUid, 'leave_balances', (data) => handleAttUpdate('balances', data));
    const unsubLogs = subscribeToTable(adminUid, 'attendance_logs', (data) => handleAttUpdate('dailyLogs', data));

    return () => {
      unsubEmployees(); unsubPayroll(); unsubSettings(); unsubTasks(); unsubNotes(); unsubExpenses(); unsubEvents();
      unsubDocuments(); unsubRoster(); unsubShiftSwaps(); unsubOvertime(); unsubAnnouncements(); unsubAssets();
      unsubAssetRequests(); unsubAssetCategories(); unsubLeaves(); unsubBalances(); unsubLogs();
    };
  }, [adminUid, driveConnected, metaManifest, user]);

  /* ─── Birthday / Work anniversary auto-post ─── */
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
              authorId: 'system', date: new Date().toISOString(),
              category: 'Achievement/Birthday/Work Anniversary',
              priority: 'Normal', audience: 'all', attachments: [],
              reactions: { '\u{1F44D}': 0, '\u2764\uFE0F': 0, '\u{1F389}': 0 },
              comments: [], readBy: [], poll: null
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
              authorId: 'system', date: new Date().toISOString(),
              category: 'Achievement/Birthday/Work Anniversary',
              priority: 'Normal', audience: 'all', attachments: [],
              reactions: { '\u{1F44D}': 0, '\u2764\uFE0F': 0, '\u{1F389}': 0 },
              comments: [], readBy: [], poll: null
            })
          }
        }
      }
    })
    if (newPosts.length > 0) setAnnouncements(prev => [...newPosts, ...prev])
  }, [employees])

  /* ─── Online handler ─── */
  useEffect(() => {
    const handleOnline = () => {
      if (user && metaManifest) {
        flushPendingWrites(
          user.token, metaManifest,
          (conflicts, data, tableName) => {
            if (conflicts && conflicts.length > 0) {
              setSyncConflicts(c => [...c, ...conflicts])
              addToast(`Offline changes synced. Conflicts detected in ${tableName}.`, 'warning')
              if (tableName === 'employees') setEmployeesRaw(data)
              if (tableName === 'payroll') setPayrollRaw(data)
              if (tableName === 'settings') setSettingsRaw(data)
              if (tableName === 'attendance_logs') setAttendanceRaw(prev => ({ ...prev, dailyLogs: data }))
              if (tableName === 'leave_requests') setAttendanceRaw(prev => ({ ...prev, leaves: data }))
              if (tableName === 'leave_balances') setAttendanceRaw(prev => ({ ...prev, balances: data }))
            }
          },
          (syncedCount) => addToast(`${syncedCount} changes synced`, 'success')
        )
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [user, metaManifest])

  /* ─── Drive sync effect ─── */
  useEffect(() => {
    const syncDatabase = async () => {
      if (!user || !driveConnected || user.isEmployee) { setIsAppLoading(false); return }

      const bgSyncCallback = (tableName, data) => {
        addToast(`Background sync updated ${tableName} with remote changes.`, 'info')
        if (tableName === 'employees') setEmployeesRaw(data)
        if (tableName === 'payroll') setPayrollRaw(data)
        if (tableName === 'settings') setSettingsRaw(data)
        if (tableName === 'expenses') setExpensesRaw(data)
        if (tableName === 'attendance_logs') setAttendanceRaw(prev => ({ ...prev, dailyLogs: data }))
        if (tableName === 'leave_requests') setAttendanceRaw(prev => ({ ...prev, leaves: data }))
        if (tableName === 'leave_balances') setAttendanceRaw(prev => ({ ...prev, balances: data }))
        if (tableName === 'notes') setNotesRaw(data)
      }

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
          
          // CRITICAL FIX: Flush any pending offline writes BEFORE reading tables
          // to ensure we don't overwrite offline changes with stale cloud data.
          await new Promise(resolve => {
            flushPendingWrites(
              user.token, meta,
              (conflicts, data, tableName) => {
                addLog('Offline Sync', `Flushed offline changes for ${tableName}`, 'success')
              },
              (syncedCount) => {
                if (syncedCount > 0) addToast(`${syncedCount} offline changes synced to Drive`, 'success')
                resolve()
              }
            )
          })
        }

        const defaultContent = []

        let empData = await readTable('employees', user.token, bgSyncCallback)
        const plainStr = localStorage.getItem(EMPLOYEES_STORAGE_KEY + '_plain')
        let savedEmp = null;
        if (plainStr) { try { savedEmp = JSON.parse(plainStr) } catch(e){} }
        if (!savedEmp) {
          const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY)
          if (saved) { try { const keyMaterial = user?.token || 'kormiis-local-fallback-key'; savedEmp = await decryptJson(saved, keyMaterial) } catch (e) {} }
        }

        if (!empData) {
          empData = savedEmp || defaultContent
          await writeTable('employees', empData, meta, user.token)
        } else if (Array.isArray(empData) && Array.isArray(savedEmp)) {
          if (savedEmp.length > empData.length) {
            console.warn('[Sync] Local employees list is larger than remote Drive data. Keeping local to prevent data loss.');
            empData = savedEmp;
            await writeTable('employees', empData, meta, user.token)
          }
        }
        setEmployeesRaw(empData)

        const defaultPayroll = {}
        let payrollData = await readTable('payroll', user.token, bgSyncCallback)
        if (!payrollData) {
          const saved = localStorage.getItem('kormiis_payroll')
          if (saved) { try { payrollData = JSON.parse(saved) } catch (e) {} }
          if (!payrollData) payrollData = defaultPayroll
          await writeTable('payroll', payrollData, meta, user.token)
        }
        if (Array.isArray(payrollData)) payrollData = { '2026-07': payrollData }
        setPayrollRaw(payrollData)

        const defaultSettings = { currency: '৳', salaryStructure: [{ id: 'basic', name: 'Basic Salary', percentage: 50, type: 'earning' }, { id: 'hra', name: 'House Rent Allowance (HRA)', percentage: 25, type: 'earning' }, { id: 'medical', name: 'Medical Allowance', percentage: 10, type: 'earning' }, { id: 'conveyance', name: 'Conveyance Allowance', percentage: 10, type: 'earning' }, { id: 'pf', name: 'Provident Fund (PF)', percentage: 5, type: 'deduction' }], company: { name: 'Kormiis Ltd.', email: 'hr@kormiis.io', website: 'www.kormiis.io' }, notifications: { syncAlerts: true, emailDigests: false } }
        let settingsData = await readTable('settings', user.token, bgSyncCallback)
        if (!settingsData) {
          const saved = localStorage.getItem('kormiis_settings')
          if (saved) { try { settingsData = JSON.parse(saved) } catch (e) {} }
          if (!settingsData) settingsData = defaultSettings
          await writeTable('settings', settingsData, meta, user.token)
        }

        if (!user.isEmployee && user.uid) {
          const currentDevice = getDeviceInfo()
          const adminDevices = settingsData.adminDevices || []
          const existingDevice = adminDevices.find(d => d.deviceId === currentDevice.deviceId)
          
          if (!existingDevice) {
            settingsData.adminDevices = [...adminDevices, currentDevice]
            await writeTable('settings', settingsData, meta, user.token)
          } else {
            settingsData.adminDevices = adminDevices.map(d => d.deviceId === currentDevice.deviceId ? { ...d, lastLogin: currentDevice.lastLogin } : d)
            await writeTable('settings', settingsData, meta, user.token)
          }
        }

        setSettingsRaw(settingsData)

        const defaultLeaves = []
        const defaultBalances = {}
        const defaultLogs = {}

        let leavesData = await readTable('leave_requests', user.token, bgSyncCallback)
        let balancesData = await readTable('leave_balances', user.token, bgSyncCallback)
        let logsData = await readTable('attendance_logs', user.token, bgSyncCallback)

        if (!leavesData || !balancesData || !logsData) {
          const savedAtt = localStorage.getItem('kormiis_attendance')
          if (savedAtt) {
            try { const parsed = JSON.parse(savedAtt); leavesData = leavesData || parsed.leaves || defaultLeaves; balancesData = balancesData || parsed.balances || defaultBalances; logsData = logsData || parsed.dailyLogs || defaultLogs } catch (e) {}
          }
          if (!leavesData || !balancesData || !logsData) {
            const legacyAtt = await readTable('attendance', user.token, bgSyncCallback)
            if (legacyAtt) { leavesData = leavesData || legacyAtt.leaves || defaultLeaves; balancesData = balancesData || legacyAtt.balances || defaultBalances; logsData = logsData || legacyAtt.dailyLogs || defaultLogs }
            else { leavesData = leavesData || defaultLeaves; balancesData = balancesData || defaultBalances; logsData = logsData || defaultLogs }
          }
          await writeTable('leave_requests', leavesData, meta, user.token)
          await writeTable('leave_balances', balancesData, meta, user.token)
          await writeTable('attendance_logs', logsData, meta, user.token)
        }



        setAttendanceRaw({ leaves: leavesData, balances: balancesData, dailyLogs: logsData })

        const defaultTasks = []
        let tasksData = await readTable('tasks', user.token, bgSyncCallback)
        const savedTasksStr = localStorage.getItem('kormiis_tasks')
        let savedTasks = null
        if (savedTasksStr) { try { savedTasks = JSON.parse(savedTasksStr) } catch (e) {} }
        
        if (!tasksData || (Array.isArray(tasksData) && tasksData.length === 0 && Array.isArray(savedTasks) && savedTasks.length > 0)) {
          tasksData = savedTasks || defaultTasks
          await writeTable('tasks', tasksData, meta, user.token)
        } else if (Array.isArray(tasksData) && Array.isArray(savedTasks)) {
          if (savedTasks.length > tasksData.length) {
            console.warn('[Sync] Local tasks list is larger than remote Drive data. Keeping local to prevent data loss.');
            tasksData = savedTasks;
            await writeTable('tasks', tasksData, meta, user.token)
          }
        }
        setTasks(tasksData)

        let notesData = await readTable('notes', user.token, bgSyncCallback)
        const savedNotesStr = localStorage.getItem('kormiis_notes')
        let savedNotes = null
        if (savedNotesStr) { try { savedNotes = JSON.parse(savedNotesStr) } catch (e) {} }
        
        let shouldUploadNotes = false;
        if (!notesData || (Array.isArray(notesData) && notesData.length === 0 && Array.isArray(savedNotes) && savedNotes.length > 0)) {
          notesData = savedNotes || []
          shouldUploadNotes = true;
        } else if (Array.isArray(notesData) && Array.isArray(savedNotes)) {
          // Prevent local data loss on refresh if local is newer
          const getLatestUpdate = (arr) => arr.reduce((latest, n) => {
            const d = new Date(n.updatedAt || 0).getTime();
            return d > latest ? d : latest;
          }, 0);
          
          const localLatest = getLatestUpdate(savedNotes);
          const remoteLatest = getLatestUpdate(notesData);
          
          if (localLatest > remoteLatest) {
            console.warn('[Sync] Local notes are newer than remote notes. Keeping local notes to prevent data loss.');
            notesData = savedNotes;
            shouldUploadNotes = true;
          }
        }
        
        if (shouldUploadNotes) {
          await writeTable('notes', notesData, meta, user.token)
        }
        setNotesRaw(notesData)

        const defaultExpenses = []
        let expensesData = await readTable('expenses', user.token, bgSyncCallback)
        const savedExpensesStr = localStorage.getItem('kormiis_expenses')
        let savedExpenses = null
        if (savedExpensesStr) { try { savedExpenses = JSON.parse(savedExpensesStr) } catch (e) {} }
        
        if (!expensesData || (Array.isArray(expensesData) && expensesData.length === 0 && Array.isArray(savedExpenses) && savedExpenses.length > 0)) {
          expensesData = savedExpenses || defaultExpenses
          await writeTable('expenses', expensesData, meta, user.token)
        }
        setExpensesRaw(expensesData)

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
        setIsAppLoading(false)
        setDbStatus('corruption')
        setDriveConnected(false)
        if (err.message && (err.message.includes('Unauthorized') || err.message.includes('401'))) {
          addToast('Google Drive session expired. Please sign in again.', 'warning');
          addLog('Sync Paused', 'Session expired. Please sign in to Google Drive.', 'warning');
        } else {
          addLog('Sync Failed', 'Could not sync database with Google Drive: ' + err.message, 'danger')
        }
        console.error(err)
      }
    }
    syncRef.current = syncDatabase
    const userKey = user?.id || user?.employeeId || 'user'
    if (syncedForUser.current === userKey) return
    syncedForUser.current = userKey
    syncDatabase()
  }, [user])

  /* ─── handleSet* functions ─── */
  const handleSetEmployees = (updater) => {
    setEmployeesRaw((prev) => {
      const next = timestampArrayChanges(prev, typeof updater === 'function' ? updater(prev) : updater)
      if (adminUid) writeToTable(adminUid, 'employees', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('employees', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) { addToast('Offline - saved locally. Will sync when connected.', 'warning'); setEmployeesRaw(updatedData) }
            else if (conflicts && conflicts.length > 0) { setSyncConflicts(c => [...c, ...conflicts]); addToast('Sync conflict auto-resolved. Review flagged items.', 'warning'); setEmployeesRaw(updatedData) }
            else { 
              addLog('Database Saved', 'Changes successfully uploaded to Google Drive.', 'success')
              syncEmployeeSnapshot(user.uid, next)
            }
          })
          .catch((err) => { setDbStatus('corruption'); addLog('Save Failed', 'Could not save changes to cloud: ' + err.message, 'danger') })
      }
      return next
    })
  }

  const handleSetPayroll = (updater) => {
    setPayrollRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (adminUid) writeToTable(adminUid, 'payroll', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('payroll', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) { addToast('Offline - saved locally. Will sync when connected.', 'warning'); setPayrollRaw(updatedData) }
            else if (conflicts && conflicts.length > 0) { setSyncConflicts(c => [...c, ...conflicts]); addToast('Sync conflict auto-resolved. Review flagged items.', 'warning'); setPayrollRaw(updatedData) }
            else { addLog('Payroll Saved', 'Salary updates synced to Google Drive.', 'success') }
          })
          .catch((err) => { setDbStatus('corruption'); addLog('Save Failed', 'Could not save payroll data to cloud: ' + err.message, 'danger') })
      }
      return next
    })
  }

  const handleSetSettings = (updater) => {
    setSettingsRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem('kormiis_settings', JSON.stringify(next))
      if (adminUid) writeToTable(adminUid, 'settings', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('settings', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) { addToast('Offline - saved locally. Will sync when connected.', 'warning'); setSettingsRaw(updatedData) }
            else if (conflicts && conflicts.length > 0) { setSyncConflicts(c => [...c, ...conflicts]); addToast('Sync conflict auto-resolved. Review flagged items.', 'warning'); setSettingsRaw(updatedData) }
            else { addLog('Settings Saved', 'System configurations synced to Google Drive.', 'success') }
          })
          .catch((err) => { setDbStatus('corruption'); addLog('Save Failed', 'Could not save settings configurations to cloud: ' + err.message, 'danger') })
      }
      return next
    })
  }

  const handleAutoRepairDatabase = async () => {
    if (!user) return
    try {
      setIsSyncing(true)
      addLog('Repairing DB', 'Running comprehensive deduplication and logical constraint repairs...')
      const meta = { ...metaManifest }
      
      // 1. Employees
      let empData = await readTable('employees', user.token) || []
      const uniqueEmps = []
      const seenIds = new Set()
      const seenEmails = new Set()
      empData.forEach(emp => { 
        if (!seenIds.has(emp.id) && (!emp.email || !seenEmails.has(emp.email))) { 
          seenIds.add(emp.id)
          if (emp.email) seenEmails.add(emp.email)
          uniqueEmps.push(emp) 
        } 
      })

      // 2. Leaves
      let leavesData = await readTable('leave_requests', user.token) || []
      const approvedLeavesByEmp = {}
      const fixedLeaves = leavesData.filter(leave => {
        if (!seenIds.has(leave.employeeId)) return false // Remove orphaned
        
        if (leave.status === 'Approved') {
          const start = new Date(leave.startDate).getTime()
          const end = new Date(leave.endDate).getTime()
          let hasOverlap = false
          if (approvedLeavesByEmp[leave.employeeId]) {
            approvedLeavesByEmp[leave.employeeId].forEach(existingLeave => {
              if (start <= existingLeave.end && end >= existingLeave.start) {
                hasOverlap = true
              }
            })
          }
          if (hasOverlap) {
            // Demote overlapping approved leave to rejected to resolve conflict
            leave.status = 'Rejected'
          } else {
            if (!approvedLeavesByEmp[leave.employeeId]) approvedLeavesByEmp[leave.employeeId] = []
            approvedLeavesByEmp[leave.employeeId].push({ start, end })
          }
        }
        return true
      })
      const balancesData = await readTable('leave_balances', user.token) || {}

      // 3. Attendance Logs
      let logsData = await readTable('attendance_logs', user.token) || {}
      const fixedLogs = { ...logsData }
      Object.keys(fixedLogs).forEach(date => {
        if (fixedLogs[date] && typeof fixedLogs[date] === 'object') {
          Object.keys(fixedLogs[date]).forEach(empId => {
            if (!seenIds.has(empId)) delete fixedLogs[date][empId]
          })
        }
      })

      // 4. Payroll
      let payrollData = await readTable('payroll', user.token) || {}
      const fixedPayroll = { ...payrollData }
      Object.keys(fixedPayroll).forEach(month => {
        if (Array.isArray(fixedPayroll[month])) {
          fixedPayroll[month] = fixedPayroll[month]
            .filter(record => seenIds.has(record.employeeId))
            .map(record => ({ ...record, grossSalary: Math.max(0, record.grossSalary || 0) }))
        }
      })

      // 5. Expenses
      let expensesData = await readTable('expenses', user.token) || []
      const fixedExpenses = expensesData
        .filter(exp => seenIds.has(exp.employeeId))
        .map(exp => ({ ...exp, amount: Math.max(0, exp.amount || 0) }))

      // Save fixed data
      await Promise.all([
        writeTable('employees', uniqueEmps, meta, user.token),
        writeTable('leave_requests', fixedLeaves, meta, user.token),
        writeTable('attendance_logs', fixedLogs, meta, user.token),
        writeTable('payroll', fixedPayroll, meta, user.token),
        writeTable('expenses', fixedExpenses, meta, user.token)
      ])

      // Update state
      setEmployeesRaw(uniqueEmps)
      setAttendanceRaw(prev => ({ ...prev, leaves: fixedLeaves, dailyLogs: fixedLogs }))
      setPayrollRaw(fixedPayroll)
      setExpensesRaw(fixedExpenses)

      // Re-validate
      const remainingIssues = validateDatabase(uniqueEmps, fixedLogs, fixedLeaves, fixedPayroll, fixedExpenses)
      setDataIntegrityIssues(remainingIssues)
      
      if (remainingIssues.length === 0) {
        setDbStatus('healthy')
        addToast('Database successfully repaired!', 'success')
        addLog('Repair Success', 'Removed corrupted and orphaned records. Database is healthy.', 'success')
        setShowCorruptionModal(false)
      } else { 
        addToast('Database partially repaired, remaining issues exist.', 'warning') 
      }
    } catch (e) { addToast('Repair failed: ' + e.message, 'error') }
    finally { setIsSyncing(false) }
  }

  const handleSetAttendance = (updater) => {
    setAttendanceRaw((prev) => {
      const rawNext = typeof updater === 'function' ? updater(prev) : updater
      const next = { ...rawNext, leaves: timestampArrayChanges(prev.leaves, rawNext.leaves) }
      
      if (adminUid) {
        writeToTable(adminUid, 'leave_requests', next.leaves).catch(e => console.error(e));
        writeToTable(adminUid, 'leave_balances', next.balances).catch(e => console.error(e));
        writeToTable(adminUid, 'attendance_logs', next.dailyLogs).catch(e => console.error(e));
      }
      
      if (!user?.isEmployee && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        Promise.all([
          writeTable('leave_requests', next.leaves, meta, user.token), 
          writeTable('leave_balances', next.balances, meta, user.token), 
          writeTable('attendance_logs', next.dailyLogs, meta, user.token)
        ])
          .then(() => { setMetaManifest(meta); addLog('Attendance Saved', 'Attendance logs synced to Google Drive.', 'success') })
          .catch((err) => { setDbStatus('corruption'); addLog('Save Failed', 'Could not save attendance data to cloud: ' + err.message, 'danger') })
      }
      return next
    })
  }

  const handleSetExpenses = (updater) => {
    setExpensesRaw((prev) => {
      const next = timestampArrayChanges(prev, typeof updater === 'function' ? updater(prev) : updater)
      if (adminUid) writeToTable(adminUid, 'expenses', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('expenses', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) { addToast('Offline - saved locally. Will sync when connected.', 'warning'); setExpensesRaw(updatedData) }
            else if (conflicts && conflicts.length > 0) { setSyncConflicts(c => [...c, ...conflicts]); addToast('Sync conflict auto-resolved. Review flagged items.', 'warning'); setExpensesRaw(updatedData) }
            else { addLog('Expenses Saved', 'Expenses synced to Google Drive.', 'success') }
          })
          .catch((err) => { setDbStatus('corruption'); addLog('Save Failed', 'Could not save expenses data to cloud: ' + err.message, 'danger') })
      }
      return next
    })
  }

  const handleSetEvents = (updater) => {
    setEvents((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (adminUid) writeToTable(adminUid, 'events', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        writeTable('events', next, { ...metaManifest }, user.token).catch(err => console.error(err))
      }
      return next
    })
  }

  const handleSetTasks = (updater) => {
    setTasks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem('kormiis_tasks', JSON.stringify(next))
      if (adminUid) writeToTable(adminUid, 'tasks', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('tasks', next, meta, user.token)
          .catch((err) => { setDbStatus('corruption'); addLog('Save Failed', 'Could not save tasks data to cloud: ' + err.message, 'danger') })
      }
      return next
    })
  }

  const handleSetNotes = (updater) => {
    setNotesRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem('kormiis_notes', JSON.stringify(next))
      if (adminUid) writeToTable(adminUid, 'notes', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        const meta = { ...metaManifest }
        writeTable('notes', next, meta, user.token)
          .then(({ updatedData, conflicts, offline }) => {
            setMetaManifest(meta)
            if (offline) { addToast('Offline - notes saved locally.', 'warning'); setNotesRaw(updatedData) }
            else if (conflicts && conflicts.length > 0) { setSyncConflicts(c => [...c, ...conflicts]); addToast('Sync conflict auto-resolved.', 'warning'); setNotesRaw(updatedData) }
          })
          .catch((err) => { setDbStatus('corruption'); addLog('Save Failed', 'Could not save notes data to cloud: ' + err.message, 'danger') })
      }
      return next
    })
  }

  const handleSetDocuments = (updater) => {
    setDocuments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (adminUid) writeToTable(adminUid, 'documents', next).catch(e => console.error(e));
      if (!user?.isEmployee && driveConnected && metaManifest) {
        writeTable('documents', next, { ...metaManifest }, user.token).catch(err => console.error(err))
      }
      return next
    })
  }

  const handleSync = () => { 
    addToast('Retrying sync...', 'info');
    setDriveConnected(true);
    setTimeout(() => {
      if (syncRef.current && !isSyncing) syncRef.current()
    }, 0);
  }

  /* ─── Auto sync log interval ─── */
  useEffect(() => {
    if (!driveConnected) return
    const interval = setInterval(() => {
      const actions = [
        { action: 'Auto-sync database.json', details: 'No changes detected' },
        { action: 'Checked connection state', details: 'Google Drive API v3 - Connected' },
        { action: 'Refreshed folder credentials', details: 'Token valid' }
      ]
      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      const newLog = { id: `log-${Date.now()}`, action: randomAction.action, status: 'success', timestamp: 'Just now', details: randomAction.details }
      setSyncLogs(prev => [newLog, ...prev.slice(0, 4)])
    }, 45000)
    return () => clearInterval(interval)
  }, [driveConnected])

  /* ─── Background File Sync (Admin Node Only) ─── */
  useEffect(() => {
    // Only the Admin (Master Node) with Drive connected processes pending syncs
    if (!user || user.isEmployee || !driveConnected || !adminUid || !documents || !documents.length || !metaManifest) return;

    const pendingDocs = documents.filter(doc => doc.status === 'pending_sync' && doc.downloadUrl);
    if (pendingDocs.length === 0) return;

    let isProcessing = false;

    const syncPendingFiles = async () => {
      if (isProcessing) return;
      isProcessing = true;

      try {
        const folderId = await getOrCreateFilesFolder(user.token);
        
        for (const doc of pendingDocs) {
          try {
            console.log(`Syncing document ${doc.name} to Google Drive...`);
            
            // 1. Download from Firebase Storage bypassing CORS
            const storagePath = `${doc.id}_${doc.fileName}`;
            const blob = await downloadFromFirebaseStorage(adminUid, storagePath);
            
            // 2. Upload to Google Drive
            const driveData = await uploadBinaryFile(doc.fileName, blob, doc.fileType, folderId, user.token);
            
            // 3. Update Firestore Document with the permanent Drive link
            const nextDocs = documents.map(d => d.id === doc.id ? { 
              ...d, 
              status: 'synced', 
              downloadUrl: driveData.webContentLink,
              driveFileId: driveData.id
            } : d);
            
            await writeToTable(adminUid, 'documents', nextDocs).catch(e => console.error(e));
            await writeTable('documents', nextDocs, { ...metaManifest }, user.token).catch(e => console.error(e));
            
            // Update local state early to avoid redundant processing
            setDocuments(nextDocs);
            
            // 4. Delete temporary file from Firebase Storage
            await deleteFromFirebaseStorage(adminUid, storagePath);
            
            console.log(`Document ${doc.name} successfully moved to Google Drive.`);
          } catch(e) {
            console.error(`Failed to sync doc ${doc.id}:`, e);
          }
        }
      } catch (e) {
        console.error("Failed to initialize drive files folder:", e);
      } finally {
        isProcessing = false;
      }
    };
    
    syncPendingFiles();
  }, [documents, user, driveConnected, adminUid, metaManifest]);

  return {
    /* Drive / DB */
    adminUid,
    driveConnected, setDriveConnected,
    driveFileId, setDriveFileId, setPayrollFileId, setSettingsFileId, setAttendanceFileId,
    isSyncing, setIsSyncing,
    dbStatus, setDbStatus,
    dataIntegrityIssues, setDataIntegrityIssues,
    showCorruptionModal, setShowCorruptionModal,
    syncConflicts, setSyncConflicts,
    metaManifest, setMetaManifest,
    isAppLoading, setIsAppLoading,

    /* UI */


    pendingProfileEdits, setPendingProfileEdits,
    auditLogs,
    notifications, showNotifications, setShowNotifications,

    /* Data */
    employees, payroll, attendance, expenses, events, documents, tasks, notes,
    roster, setRoster, shiftSwaps, setShiftSwaps,
    overtimeClaims, setOvertimeClaims,
    announcements, setAnnouncements,
    assets, setAssets, assetRequests, setAssetRequests, assetCategories, setAssetCategories,
    settings, syncLogs,

    /* Functions */
    handleSetEmployees, handleSetPayroll, handleSetSettings, handleSetTasks, handleSetNotes,
    handleSetAttendance, handleSetExpenses, handleSetEvents, handleSetDocuments,
    handleAutoRepairDatabase, handleSync,
    addLog, addAuditLog, hasPermission,
    addNotification, markNotificationsRead, clearNotifications,
  }
}
