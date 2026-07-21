import { useEffect, useState } from 'react'
import { Search, Bell, Users, Cloud, RefreshCw, Calendar, Gift, Award, Activity } from 'lucide-react'
import { formatDateShort } from '../services/date.js'

export default function Dashboard({ employees, driveConnected, onSync, attendance, setCurrentView }) {
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [leaveCount, setLeaveCount] = useState(0)
  const [syncLogs, setSyncLogs] = useState([])
  const [upcomingMilestones, setUpcomingMilestones] = useState([])
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, onLeave: 0 })

  useEffect(() => {
    setTotalEmployees(employees.length)
    
    // Simulate active status
    const active = employees.filter(emp => emp.status?.toLowerCase() !== 'inactive').length
    setActiveCount(active)
    
    // Simulated leave records count
    setLeaveCount(Math.ceil(employees.length * 0.12))

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
      if (log) {
        if (log.status === 'Present' || log.status === 'Late') {
          presentList.push({ name: emp.name, avatar: emp.avatar, time: log.checkIn || '09:00 AM' })
        } else if (log.status === 'Absent') {
          absentList.push({ name: emp.name, avatar: emp.avatar })
        } else if (log.status === 'On Leave') {
          onLeaveList.push({ name: emp.name, avatar: emp.avatar })
        }
      } else {
        // Fallback: check general status or count as absent
        if (emp.status === 'On Leave') {
          onLeaveList.push({ name: emp.name, avatar: emp.avatar })
        } else {
          absentList.push({ name: emp.name, avatar: emp.avatar })
        }
      }
    })

    setTodayStats({
      present: presentList.length,
      absent: absentList.length,
      onLeave: onLeaveList.length
    })
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

  return (
    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        
        {/* Total Personnel */}
        <div className="macos-card dash-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="icon-3d" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)' }}>Total Directory</span>
          </div>
          <p style={{ font: "700 28px/32px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{totalEmployees}</p>
        </div>

        {/* Active Today */}
        <div className="macos-card dash-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="icon-3d" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)' }}>
              <span className="pulse-dot pulse-dot-green" style={{ margin: 0 }}></span>
              Active Today
            </span>
          </div>
          <p style={{ font: "700 28px/32px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{activeCount}</p>
        </div>

        {/* On Leave */}
        <div className="macos-card dash-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="icon-3d" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)' }}>
              <span className="pulse-dot pulse-dot-orange" style={{ margin: 0 }}></span>
              On Leave
            </span>
          </div>
          <p style={{ font: "700 28px/32px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{leaveCount}</p>
        </div>

        {/* Drive Connection — Animated */}
        <div className={`macos-card dash-card drive-card drive-card--${driveConnected ? 'healthy' : 'error'}`} style={{
          background: driveConnected ? 'rgba(52, 199, 89, 0.08)' : 'rgba(224, 32, 20, 0.08)',
          backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          border: driveConnected ? '1px solid rgba(52, 199, 89, 0.35)' : '1px solid rgba(224, 32, 20, 0.35)',
          borderRadius: '14px', padding: '14px', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="icon-3d" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                <path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.4 4.4 0 0 0-.8.1 7 7 0 1 0-11 5.9"></path>
              </svg>
            </div>
            <span style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: driveConnected ? '#1a7d3a' : 'var(--md-bw-error)' }}>Drive Connection</span>
          </div>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', font: "500 16px/28px 'Roboto'", color: driveConnected ? '#1a7d3a' : 'var(--md-bw-error)', margin: 0 }}>
            <span className={`pulse-dot ${driveConnected ? 'pulse-dot-green' : 'pulse-dot-red'} drive-status-dot`} style={{ margin: 0 }}></span>
            {driveConnected ? 'Healthy' : 'Disconnected'}
          </p>
        </div>
      </div>

      {/* Attendance Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ font: "700 18px/24px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, letterSpacing: '-0.01em' }}>Today's Attendance</h2>
            <p style={{ font: "400 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '2px 0 0' }}>Attendance Rate: {attendanceRate}%</p>
          </div>
          <button onClick={() => setCurrentView && setCurrentView('attendance')} style={{ font: "500 11px/14px 'Roboto'", color: 'var(--md-bw-primary)', background: 'transparent', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>View All</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {/* Present */}
          <div className="macos-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '3px', background: 'var(--md-bw-primary)', borderRadius: '0 2px 2px 0' }}></div>
            <p style={{ font: "700 22px/26px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{todayStats.present}</p>
            <p style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)', margin: '6px 0 0' }}>Present</p>
          </div>
          {/* Absent */}
          <div className="macos-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '3px', background: 'transparent', borderLeft: '3px dashed var(--md-bw-on-surface-variant)', borderRadius: 0 }}></div>
            <p style={{ font: "700 22px/26px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{todayStats.absent}</p>
            <p style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)', margin: '6px 0 0' }}>Absent</p>
          </div>
          {/* On Leave */}
          <div className="macos-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '3px', background: 'transparent', borderLeft: '3px dotted var(--md-bw-outline)', borderRadius: 0 }}></div>
            <p style={{ font: "700 22px/26px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{todayStats.onLeave}</p>
            <p style={{ font: "500 9px/12px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)', margin: '6px 0 0' }}>On Leave</p>
          </div>
        </div>
      </div>

      {/* Milestones & Drive Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
        
        {/* Milestones */}
        <div>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Milestones</h2>
          <div className="macos-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '16px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Drive Logs */}
        <div>
          <h2 style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Drive Logs</h2>
          <div className="macos-card" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '14px', padding: '8px 12px' }}>
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
      </div>
    </div>
  )
}
