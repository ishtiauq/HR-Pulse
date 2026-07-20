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
    <div style={{ backgroundColor: 'var(--md-bw-background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', padding: '24px' }}>
          {/* Total Personnel */}
          <div style={{ background: 'var(--md-bw-surface)', padding: '24px', border: '1px solid var(--md-bw-outline)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--md-bw-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <Users size={20} style={{ color: 'var(--md-bw-on-secondary-container)' }} />
              </div>
              <span style={{ font: "500 11px/16px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)' }}>Total Personnel</span>
            </div>
            <p style={{ font: "700 36px/44px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{totalEmployees}</p>
          </div>

          {/* Active Today */}
          <div style={{ background: 'var(--md-bw-surface)', padding: '24px', border: '1px solid var(--md-bw-outline)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--md-bw-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <Activity size={20} style={{ color: 'var(--md-bw-on-secondary-container)' }} />
              </div>
              <span style={{ font: "500 11px/16px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)' }}>Active Today</span>
            </div>
            <p style={{ font: "700 36px/44px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{activeCount}</p>
          </div>

          {/* On Leave */}
          <div style={{ background: 'var(--md-bw-surface)', padding: '24px', border: '1px solid var(--md-bw-outline)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--md-bw-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <Calendar size={20} style={{ color: 'var(--md-bw-on-secondary-container)' }} />
              </div>
              <span style={{ font: "500 11px/16px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)' }}>On Leave</span>
            </div>
            <p style={{ font: "700 36px/44px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{leaveCount}</p>
          </div>

          {/* Database Status */}
          <div style={{ background: 'var(--md-bw-surface)', padding: '24px', border: '1px solid var(--md-bw-outline)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--md-bw-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <Cloud size={20} style={{ color: 'var(--md-bw-on-secondary-container)' }} />
              </div>
              <span style={{ font: "500 11px/16px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)' }}>Drive Connection</span>
            </div>
            <p style={{ font: "700 28px/44px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{driveConnected ? 'Healthy' : 'Disconnected'}</p>
          </div>
        </div>

        {/* Attendance Section */}
        <div style={{ padding: '0 24px', marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ font: "700 24px/32px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: 0 }}>Today's Attendance</h2>
              <p style={{ font: "400 13px/20px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface-variant)', margin: '4px 0 0' }}>Attendance Rate: {attendanceRate}%</p>
            </div>
            <button onClick={() => setCurrentView && setCurrentView('attendance')} style={{ font: "500 13px/20px 'Roboto', sans-serif", textTransform: 'uppercase', background: 'transparent', border: 'none', color: 'var(--md-bw-primary)', cursor: 'pointer' }}>View All</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Present */}
            <div style={{ background: 'var(--md-bw-surface)', padding: '24px', border: '1px solid var(--md-bw-outline)', borderLeft: '4px solid var(--md-bw-primary)', borderRadius: '16px' }}>
              <p style={{ font: "700 32px/40px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{todayStats.present}</p>
              <p style={{ font: "500 11px/16px 'Roboto', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)', margin: '8px 0 0' }}>Present</p>
            </div>
            {/* Absent */}
            <div style={{ background: 'var(--md-bw-surface)', padding: '24px', border: '1px solid var(--md-bw-outline)', borderLeft: '4px dashed var(--md-bw-on-surface-variant)', borderRadius: '16px' }}>
              <p style={{ font: "700 32px/40px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{todayStats.absent}</p>
              <p style={{ font: "500 11px/16px 'Roboto', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)', margin: '8px 0 0' }}>Absent</p>
            </div>
            {/* On Leave */}
            <div style={{ background: 'var(--md-bw-surface)', padding: '24px', border: '1px solid var(--md-bw-outline)', borderLeft: '4px dotted var(--md-bw-outline)', borderRadius: '16px' }}>
              <p style={{ font: "700 32px/40px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{todayStats.onLeave}</p>
              <p style={{ font: "500 11px/16px 'Roboto', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-bw-on-surface-variant)', margin: '8px 0 0' }}>On Leave</p>
            </div>
          </div>
        </div>

        {/* Milestones & Drive Logs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', padding: '0 24px', marginTop: '32px', marginBottom: '32px' }}>
          
          {/* Milestones */}
          <div>
            <h2 style={{ font: "700 24px/32px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: '0 0 16px' }}>Milestones</h2>
            {upcomingMilestones.length === 0 ? (
              <div style={{ background: 'var(--md-bw-surface-variant)', padding: '24px', borderRadius: '16px', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ font: "400 14px/20px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface-variant)' }}>No milestones</p>
              </div>
            ) : (
              <div style={{ background: 'var(--md-bw-surface)', border: '1px solid var(--md-bw-outline)', borderRadius: '16px', padding: '16px' }}>
                {upcomingMilestones.map((milestone, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: idx !== upcomingMilestones.length - 1 ? '1px solid var(--md-bw-outline)' : 'none' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--md-bw-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 }}>
                      {milestone.type === 'birthday' ? <Gift size={20} style={{ color: 'var(--md-bw-on-secondary-container)' }} /> : <Award size={20} style={{ color: 'var(--md-bw-on-secondary-container)' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ font: "500 14px/20px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: 0 }}>{milestone.empName}</p>
                      <p style={{ font: "400 13px/20px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface-variant)', margin: '2px 0 0' }}>{milestone.label}</p>
                    </div>
                    <span style={{ font: "500 11px/16px 'Roboto', sans-serif", textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>{milestone.daysRemaining === 0 ? 'Today' : `${milestone.daysRemaining}d`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drive Logs */}
          <div>
            <h2 style={{ font: "700 24px/32px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: '0 0 16px' }}>Drive Logs</h2>
            <div style={{ background: 'var(--md-bw-surface)', border: '1px solid var(--md-bw-outline)', borderRadius: '16px', padding: '16px' }}>
              {syncLogs.map((log, idx) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: idx !== syncLogs.length - 1 ? '1px solid var(--md-bw-outline)' : 'none' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--md-bw-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 }}>
                    <Activity size={20} style={{ color: 'var(--md-bw-on-secondary-container)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ font: "500 14px/20px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface)', margin: 0 }}>{log.action}</p>
                    <p style={{ font: "400 13px/20px 'Roboto', sans-serif", color: 'var(--md-bw-on-surface-variant)', margin: '2px 0 0' }}>{log.details}</p>
                  </div>
                  <span style={{ font: "500 11px/16px 'Roboto', sans-serif", textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>{log.status === 'success' ? 'Synced' : (log.status === 'error' ? 'Failed' : 'Pending')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
