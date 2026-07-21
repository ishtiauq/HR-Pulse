import { useEffect, useState } from 'react'
import { Megaphone, Calendar as CalendarIcon, CreditCard, ChevronDown, LayoutDashboard, Gift, Award, Users } from 'lucide-react'
import { formatDateShort } from '../services/date.js'

export default function Dashboard({ employees, driveConnected, onSync, attendance, setCurrentView, announcements, events, payroll }) {
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [leaveCount, setLeaveCount] = useState(0)
  const [syncLogs, setSyncLogs] = useState([])
  const [upcomingMilestones, setUpcomingMilestones] = useState([])
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, onLeave: 0 })
  const [attendanceLists, setAttendanceLists] = useState({ present: [], absent: [], onLeave: [] })
  const [showAttDropdown, setShowAttDropdown] = useState(false)
  const [attFilter, setAttFilter] = useState(null) // 'present' | 'absent' | 'onLeave' | null

  useEffect(() => {
    setTotalEmployees(employees.length)
    
    // Simulate active status
      const active = employees.filter(emp => emp.status?.toLowerCase() !== 'inactive').length
    setActiveCount(active)
    setLeaveCount(employees.filter(emp => emp.status?.toLowerCase() === 'on leave').length)

    // Set mock sync logs
    setSyncLogs([
      { id: 1, action: 'Directory Pulled', timestamp: 'Just now', details: 'Retrieved 8 personnel entries successfully.', status: 'success' },
      { id: 2, action: 'Roster Synced', timestamp: '12 mins ago', details: 'Uploaded today\'s biometric clock-in logs.', status: 'warn' },
      { id: 3, action: 'Leave Ledgers Failed', timestamp: '1 hr ago', details: 'Network timeout while updating sickness allowances.', status: 'error' },
    ])

    // Compute upcoming milestones (Birthdays & Workversaries) in the next 30 days
    const milestones = calculateUpcomingMilestones(employees)
    setUpcomingMilestones(milestones)

    // Compute dynamic today's attendance stats and details
    const todayStr = '2026-07-17' // Match local baseline date
    const todayLogs = attendance?.dailyLogs?.[todayStr] || {}
    
    const presentList = []
    const absentList = []
    const onLeaveList = []

    employees.forEach(emp => {
      if (emp.status === 'Terminated') return
      const log = todayLogs[emp.id]
      const entry = { name: emp.name, avatar: emp.avatar, role: emp.role, time: log?.checkIn || null }
      if (log) {
        if (log.status === 'Present' || log.status === 'Late') {
          presentList.push(entry)
        } else if (log.status === 'Absent') {
          absentList.push(entry)
        } else if (log.status === 'On Leave') {
          onLeaveList.push(entry)
        }
      } else {
        if (emp.status === 'On Leave') {
          onLeaveList.push(entry)
        } else {
          absentList.push(entry)
        }
      }
    })

    setTodayStats({
      present: presentList.length,
      absent: absentList.length,
      onLeave: onLeaveList.length
    })
    setAttendanceLists({ present: presentList, absent: absentList, onLeave: onLeaveList })
  }, [employees, attendance])

  const calculateUpcomingMilestones = (employeesList) => {
    const today = new Date('2026-07-17') // Target simulated baseline date matching our current context
    const milestones = []

    employeesList.forEach(emp => {
      // 1. Birthdays
      if (emp.dob) {
        const dobDate = new Date(emp.dob)
        const birthMonth = dobDate.getMonth()
        const birthDay = dobDate.getDate()

        let bdayThisYear = new Date(today.getFullYear(), birthMonth, birthDay)
        const diffTime = bdayThisYear - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays >= 0 && diffDays <= 30) {
          milestones.push({
            type: 'birthday',
            empName: emp.name,
            avatar: emp.avatar,
            role: emp.role,
            date: bdayThisYear,
            daysRemaining: diffDays,
            label: `Birthday (${formatDateShort(emp.dob)})`
          })
        }
      }

      // 2. Workversaries
      if (emp.joiningDate) {
        const joinDate = new Date(emp.joiningDate)
        const joinMonth = joinDate.getMonth()
        const joinDay = joinDate.getDate()

        let workversaryThisYear = new Date(today.getFullYear(), joinMonth, joinDay)
        const diffTime = workversaryThisYear - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays >= 0 && diffDays <= 30) {
          const years = today.getFullYear() - joinDate.getFullYear()
          if (years > 0) {
            milestones.push({
              type: 'workversary',
              empName: emp.name,
              avatar: emp.avatar,
              role: emp.role,
              date: workversaryThisYear,
              daysRemaining: diffDays,
              label: `${years}${getOrdinalSuffix(years)} Anniversary`
            })
          }
        }
      }
    })

    return milestones.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }

  const getOrdinalSuffix = (i) => {
    const j = i % 10, k = i % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  const handleManualSync = () => {
    if (onSync) onSync()
  }

  const attendanceRate = activeCount > 0 ? Math.round((todayStats.present / activeCount) * 100) : 0
  const inactiveCount = employees.filter(emp => emp.status?.toLowerCase() !== 'active').length

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || id

  const currentPayrollMonth = payroll && Object.keys(payroll).length > 0
    ? Object.keys(payroll).sort().reverse()[0]
    : null
  const currentPayrollData = currentPayrollMonth ? payroll[currentPayrollMonth] : []
  const totalPayrollCost = currentPayrollData.reduce((sum, p) => sum + (p.grossSalary || 0), 0)
  const paidCount = currentPayrollData.filter(p => p.status === 'Paid').length
  const pendingCount = currentPayrollData.filter(p => p.status === 'Pending').length

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const upcomingEvents = (events || [])
    .filter(e => new Date(e.date) >= new Date('2026-07-17'))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4)

  const recentAnnouncements = (announcements || []).slice(0, 3)

  return (
    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Page Title */}
      <h1 className="page-title">
        <LayoutDashboard size={28} className="page-title-icon" />
        Dashboard
      </h1>

      {/* Stats Row — 3-col */}
      <div className="dash-grid-3">
        
        {/* Employee Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Employee Directory</h2>
          <div className="macos-card" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }} onClick={() => setCurrentView && setCurrentView('employees')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1, paddingLeft: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ font: "700 22px/26px 'Roboto'", color: 'var(--md-bw-on-surface)', fontVariantNumeric: 'tabular-nums' }}>{activeCount}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, lineHeight: '16px', background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.3)', color: '#1a7d3a' }}>
                  <span className="sync-dot sync-blink" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34c759' }}></span>
                  Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ font: "700 22px/26px 'Roboto'", color: 'var(--md-bw-on-surface)', fontVariantNumeric: 'tabular-nums' }}>{inactiveCount}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, lineHeight: '16px', background: 'rgba(224, 32, 20, 0.1)', border: '1px solid rgba(224, 32, 20, 0.25)', color: '#dc3545' }}>
                  <span className="sync-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#dc3545' }}></span>
                  Inactive
                </span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setCurrentView && setCurrentView('employees') }} style={{
              marginTop: '10px', padding: '5px 12px', font: "500 11px/16px 'Roboto'",
              background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', border: 'none',
              borderRadius: '20px', cursor: 'pointer', transition: 'background 0.15s ease', alignSelf: 'flex-start'
            }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.18)'}
               onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}>
              View All
            </button>
          </div>
        </div>

        {/* Attendance Card */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Attendance</h2>
          <div className="macos-card" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setShowAttDropdown(!showAttDropdown)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, paddingLeft: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', font: "600 15px/20px 'Roboto'", color: '#34C759' }}><span className="pulse-dot pulse-dot-green" style={{ margin: 0 }}></span>{todayStats.present}
                <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--md-bw-on-surface-variant)' }}>Present</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', font: "600 15px/20px 'Roboto'", color: '#dc3545' }}><span className="pulse-dot pulse-dot-red" style={{ margin: 0 }}></span>{todayStats.absent}
                <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--md-bw-on-surface-variant)' }}>Absent</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', font: "600 15px/20px 'Roboto'", color: '#f0ad4e' }}><span className="pulse-dot pulse-dot-orange" style={{ margin: 0 }}></span>{todayStats.onLeave}
                <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--md-bw-on-surface-variant)' }}>On Leave</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', paddingLeft: '12px' }}>
              <span style={{ font: "400 12px/16px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>Rate: {attendanceRate}%</span>
              <button onClick={(e) => { e.stopPropagation(); setShowAttDropdown(!showAttDropdown) }} style={{
                padding: '5px 12px', font: "500 11px/16px 'Roboto'",
                background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', border: 'none',
                borderRadius: '20px', cursor: 'pointer', transition: 'background 0.15s ease'
              }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.18)'}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}>
                {showAttDropdown ? 'Hide' : 'View Details'}
              </button>
            </div>
          </div>
        </div>

        {/* Drive Connection */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className={`macos-card dash-card drive-card drive-card--${driveConnected ? 'healthy' : 'error'}`} style={{
            flex: 1, background: driveConnected ? '#E8F8EE' : '#FDE8E8',
            border: driveConnected ? '1px solid rgba(52, 199, 89, 0.35)' : '1px solid rgba(255, 59, 48, 0.35)',
            borderRadius: '14px', padding: '14px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column'
          }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div className="icon-3d" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                  <path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.4 4.4 0 0 0-.8.1 7 7 0 1 0-11 5.9"></path>
                </svg>
              </div>
              <span style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: driveConnected ? '#1A7D3A' : '#D32F2F' }}>Drive Connection</span>
            </div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', font: "500 16px/28px 'Roboto'", color: driveConnected ? '#1A7D3A' : '#D32F2F', margin: 0, flex: 1, paddingLeft: '12px' }}>
              {driveConnected ? 'Healthy' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Details Dropdown */}
      {showAttDropdown && (
        <div className="macos-card" style={{
          background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', font: "500 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Today's Attendance Details</div>
          {[
            { key: 'present', label: 'Present', count: todayStats.present, dot: 'pulse-dot-green' },
            { key: 'absent', label: 'Absent', count: todayStats.absent, dot: 'pulse-dot-red' },
            { key: 'onLeave', label: 'On Leave', count: todayStats.onLeave, dot: 'pulse-dot-orange' },
          ].map(item => (
            <div key={item.key}>
              <button onClick={() => setAttFilter(attFilter === item.key ? null : item.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', background: attFilter === item.key ? 'rgba(0,0,0,0.03)' : 'transparent',
                border: 'none', cursor: 'pointer', font: "500 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)',
                transition: 'background 0.15s ease'
              }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'} onMouseLeave={(e) => e.currentTarget.style.background = attFilter === item.key ? 'rgba(0,0,0,0.03)' : 'transparent'}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`pulse-dot ${item.dot}`} style={{ margin: 0 }}></span>
                  {item.label}
                </span>
                <span style={{ color: 'var(--md-bw-on-surface-variant)', font: "500 12px/16px 'Roboto'" }}>{item.count}</span>
              </button>
              {attFilter === item.key && (
                <div style={{ padding: '0 16px 10px' }}>
                  {attendanceLists[item.key].length === 0 ? (
                    <p style={{ font: "400 12px/16px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '4px 0' }}>No one</p>
                  ) : (
                    attendanceLists[item.key].map((emp, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                        <img src={emp.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)', display: 'block' }}>{emp.name}</span>
                          <span style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>{emp.role}</span>
                        </div>
                        {emp.time && <span style={{ font: "400 11px/16px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', flexShrink: 0 }}>{emp.time}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Cards Row 1 — Announcements + Payroll Summary */}
      <div className="dash-grid-2">
        
        {/* Announcements Card */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Announcements</h2>
          <div className="macos-card" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '16px' }}>
            {recentAnnouncements.length === 0 ? (
              <p style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', textAlign: 'center', margin: 0 }}>No announcements</p>
            ) : (
              recentAnnouncements.map((ann, idx) => (
                <div key={ann.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: idx < recentAnnouncements.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' }} onClick={() => setCurrentView && setCurrentView('announcements')}>
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '7px', flexShrink: 0 }}>
                    <Megaphone size={14} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ann.title}</p>
                    <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '2px 0 0' }}>
                      {getEmployeeName(ann.authorId)} &middot; {new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {ann.priority === 'Important' && (
                    <span style={{ font: "500 8px/10px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.05em', color: '#D32F2F', background: '#FFEBEE', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>Important</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payroll Summary Card */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Payroll Summary</h2>
          <div className="macos-card" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {!currentPayrollMonth ? (
              <p style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', textAlign: 'center', margin: 'auto' }}>No payroll data</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 122, 255, 0.12)', borderRadius: '8px', flexShrink: 0 }}>
                    <CreditCard size={16} style={{ color: '#007AFF' }} />
                  </div>
                  <div>
                    <p style={{ font: "500 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0 }}>Month: {currentPayrollMonth}</p>
                    <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '1px 0 0' }}>{currentPayrollData.length} employee{currentPayrollData.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                  <div>
                    <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Paid</p>
                    <p style={{ font: "700 18px/24px 'Roboto'", color: '#34C759', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{paidCount}</p>
                  </div>
                  <div>
                    <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Pending</p>
                    <p style={{ font: "700 18px/24px 'Roboto'", color: '#FF9500', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{pendingCount}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Total</p>
                    <p style={{ font: "700 18px/24px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>${totalPayrollCost.toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={() => setCurrentView && setCurrentView('payroll')} style={{
                    padding: '6px 14px', font: "500 11px/16px 'Roboto'",
                    background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', border: 'none',
                    borderRadius: '20px', cursor: 'pointer', transition: 'background 0.15s ease'
                  }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.18)'}
                     onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}>
                    View Payroll
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards Row 2 — Events + Drive Logs + Milestones */}
      <div className="dash-grid-3">
        
        {/* Events Card */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Events</h2>
          <div className="macos-card" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '16px' }}>
            {upcomingEvents.length === 0 ? (
              <p style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', textAlign: 'center', margin: 0 }}>No upcoming events</p>
            ) : (
              upcomingEvents.map((evt, idx) => (
                <div key={evt.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: idx < upcomingEvents.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' }} onClick={() => setCurrentView && setCurrentView('calendar')}>
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: evt.type === 'holiday' ? 'rgba(52, 199, 89, 0.12)' : evt.type === 'birthday' ? 'rgba(255, 149, 0, 0.12)' : 'rgba(0, 122, 255, 0.12)', borderRadius: '7px', flexShrink: 0 }}>
                    <CalendarIcon size={14} style={{ color: evt.type === 'holiday' ? '#34C759' : evt.type === 'birthday' ? '#FF9500' : '#007AFF' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                    <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '2px 0 0' }}>
                      {formatDate(evt.date)}{evt.time ? ` at ${evt.time}` : ''}
                    </p>
                  </div>
                  <span style={{ font: "500 8px/10px 'Roboto'", textTransform: 'capitalize', letterSpacing: '0.03em', color: 'var(--md-bw-on-surface-variant)', flexShrink: 0 }}>{evt.type}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drive Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Drive Logs</h2>
          <div className="macos-card" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '12px 14px' }}>
            {syncLogs.map((log, idx) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: idx !== syncLogs.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '7px', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.action}</p>
                  <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '1px 0 0' }}>{log.details}</p>
                </div>
                <span style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-bw-on-surface-variant)', flexShrink: 0 }}>{log.status === 'success' ? 'Synced' : (log.status === 'error' ? 'Failed' : 'Pending')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Milestones</h2>
          <div className="macos-card" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {upcomingMilestones.length === 0 ? (
              <p style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>No milestones</p>
            ) : (
              <div style={{ width: '100%' }}>
                {upcomingMilestones.map((milestone, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: idx !== upcomingMilestones.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '7px', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                        {milestone.type === 'birthday' ? (
                          <><rect x="3" y="8" width="18" height="4" rx="1" ry="1"></rect><path d="M12 8v13"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path></>
                        ) : (
                          <><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></>
                        )}
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{milestone.empName}</p>
                      <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '1px 0 0' }}>{milestone.label}</p>
                    </div>
                    <span style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-bw-on-surface-variant)', flexShrink: 0 }}>{milestone.daysRemaining === 0 ? 'Today' : `${milestone.daysRemaining}d`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
