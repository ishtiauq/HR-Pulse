import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, Cloud, RefreshCw, Activity, FileText, Calendar, Gift, Award } from 'lucide-react'
import AdSlot from './AdSlot'
import { formatDateShort } from '../services/date.js'

export default function Dashboard({ employees, driveConnected, onSync, attendance, setCurrentView }) {
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [showAttendanceDrawer, setShowAttendanceDrawer] = useState(false)
  const [activeCount, setActiveCount] = useState(0)
  const [leaveCount, setLeaveCount] = useState(0)
  const [syncLogs, setSyncLogs] = useState([])
  const [upcomingMilestones, setUpcomingMilestones] = useState([])
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, onLeave: 0 })
  
  // Hover and detail lists states
  const [attendanceDetails, setAttendanceDetails] = useState({ present: [], absent: [], onLeave: [] })

  useEffect(() => {
    setTotalEmployees(employees.length)
    
    // Simulate active status
    const active = employees.filter(emp => emp.status !== 'Terminated').length
    setActiveCount(active)
    
    // Simulated leave records count
    setLeaveCount(Math.ceil(employees.length * 0.12))

    // Set mock sync logs
    setSyncLogs([
      { id: 1, action: 'Directory Pulled', timestamp: 'Just now', details: 'Retrieved 8 personnel entries successfully.' },
      { id: 2, action: 'Roster Synced', timestamp: '12 mins ago', details: 'Uploaded today\'s biometric clock-in logs.' },
      { id: 3, action: 'Leave Ledgers Synced', timestamp: '1 hr ago', details: 'Re-calibrated annual sickness allowance quotas.' },
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

    setAttendanceDetails({
      present: presentList,
      absent: absentList,
      onLeave: onLeaveList
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

        // Birthday this year
        let bdayThisYear = new Date(today.getFullYear(), birthMonth, birthDay)
        
        // Calculate difference
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
              label: `${years}${getOrdinalSuffix(years)} Anniversary (${formatDateShort(emp.joiningDate)})`
            })
          }
        }
      }
    })

    // Sort milestones by closest days remaining
    return milestones.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }

  const renderAvatarStack = (list) => {
    const visible = list.slice(0, 3)
    const remaining = list.length - 3
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px', minHeight: '28px' }}>
        {visible.map((emp, i) => (
          <img key={i} src={emp.avatar} alt={emp.name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? '-10px' : '0', zIndex: 10 - i, backgroundColor: '#f3f4f6' }} />
        ))}
        {remaining > 0 && (
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '2px solid #fff', marginLeft: '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold', zIndex: 0, color: 'var(--text-secondary)' }}>
            +{remaining}
          </div>
        )}
        {list.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None</span>}
      </div>
    )
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

  // Attendance rate calculations
  const attendanceRate = activeCount > 0 ? Math.round((todayStats.present / activeCount) * 100) : 0

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <LayoutDashboard size={28} className="page-title-icon" />
          Dashboard
        </h1>
        <button className="btn btn-primary" onClick={handleManualSync}>
          <RefreshCw size={16} />
          Sync Database
        </button>
      </div>

      {/* Bento Grid layout */}
      <div className="bento-grid">
        {/* Total Directory */}
        <div className="glass-card bento-item-stats stat-card-hover" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid var(--accent-primary)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Directory</span>
            <h3 className="tabular-nums" style={{ fontSize: '1.75rem', marginTop: '4px' }}>{totalEmployees}</h3>
          </div>
        </div>

        {/* Active Today */}
        <div className="glass-card bento-item-stats stat-card-hover" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid var(--accent-success)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-success)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Today</span>
            <h3 className="tabular-nums" style={{ fontSize: '1.75rem', marginTop: '4px' }}>{activeCount}</h3>
          </div>
        </div>

        {/* On Leave */}
        <div className="glass-card bento-item-stats stat-card-hover" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid var(--accent-warning)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-warning)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>On Leave</span>
            <h3 className="tabular-nums" style={{ fontSize: '1.75rem', marginTop: '4px' }}>{leaveCount}</h3>
          </div>
        </div>

        {/* Database Status */}
        <div className="glass-card bento-item-stats stat-card-hover" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderTop: driveConnected ? '4px solid var(--accent-success)' : '4px solid var(--accent-danger)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: driveConnected ? 'var(--accent-success)' : 'var(--accent-danger)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Cloud size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Drive Connection</span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '8px', color: driveConnected ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {driveConnected ? 'Healthy' : 'Disconnected'}
            </h3>
          </div>
        </div>

        {/* Compact Dynamic Attendance Bento Card with Hover Tooltip Popups */}
        <div 
          className="glass-card bento-item-chart stat-card-hover" 
          onMouseEnter={() => setShowAttendanceDrawer(true)}
          onMouseLeave={() => setShowAttendanceDrawer(false)}
          style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} style={{ color: 'var(--accent-primary)' }} />
              Today's Attendance Status
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Attendance Rate: <span style={{ color: 'var(--accent-primary)' }}>{attendanceRate}%</span>
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flex: 1,
            gap: '16px',
            flexWrap: 'wrap',
            padding: '10px 0'
          }}>
            {/* Present Badge */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1',
                minWidth: '120px',
                padding: '16px 20px',
                borderRadius: '20px',
                background: 'rgba(34, 197, 94, 0.04)',
                border: '1px solid rgba(34, 197, 94, 0.1)',
                transition: 'background-color var(--transition-fast), border-color var(--transition-fast)'
              }}
            >
              <h4 className="tabular-nums" style={{ fontSize: '2.2rem', color: 'var(--accent-success)', fontWeight: 800 }}>{todayStats.present}</h4>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '4px' }}>Present</span>
              {renderAvatarStack(attendanceDetails.present)}
            </div>

            {/* Absent Badge */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1',
                minWidth: '120px',
                padding: '16px 20px',
                borderRadius: '20px',
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                transition: 'background-color var(--transition-fast), border-color var(--transition-fast)'
              }}
            >
              <h4 className="tabular-nums" style={{ fontSize: '2.2rem', color: 'var(--accent-danger)', fontWeight: 800 }}>{todayStats.absent}</h4>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '4px' }}>Absent</span>
              {renderAvatarStack(attendanceDetails.absent)}
            </div>

            {/* On Leave Badge */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1',
                minWidth: '120px',
                padding: '16px 20px',
                borderRadius: '20px',
                background: 'rgba(245, 158, 11, 0.04)',
                border: '1px solid rgba(245, 158, 11, 0.1)',
                transition: 'background-color var(--transition-fast), border-color var(--transition-fast)'
              }}
            >
              <h4 className="tabular-nums" style={{ fontSize: '2.2rem', color: 'var(--accent-warning)', fontWeight: 800 }}>{todayStats.onLeave}</h4>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '4px' }}>On Leave</span>
              {renderAvatarStack(attendanceDetails.onLeave)}
            </div>
          </div>

          {/* Centered Hover Modal for Attendance */}
          {showAttendanceDrawer && (
            <div 
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '400px',
                maxWidth: '90vw',
                maxHeight: '85vh',
                backgroundColor: '#ffffff',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                zIndex: 9999,
                cursor: 'default',
                animation: 'fadeIn var(--transition-fast) forwards'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Today's Attendance</h2>
                <button onClick={() => setShowAttendanceDrawer(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <Users size={20} />
                </button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Present Section */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '4px' }}>Present ({todayStats.present})</h4>
                  {attendanceDetails.present.map((e, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={e.avatar} alt={e.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid #fff' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{e.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Checked in at {e.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* On Leave Section */}
                {attendanceDetails.onLeave.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '4px' }}>On Leave ({todayStats.onLeave})</h4>
                    {attendanceDetails.onLeave.map((e, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                        <div style={{ position: 'relative' }}>
                          <img src={e.avatar} alt={e.name} style={{ width: '36px', height: '36px', borderRadius: '50%', filter: 'grayscale(100%)' }} />
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: 'var(--accent-warning)', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{e.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Absent Section */}
                {attendanceDetails.absent.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '4px' }}>Absent ({todayStats.absent})</h4>
                    {attendanceDetails.absent.map((e, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                        <div style={{ position: 'relative' }}>
                          <img src={e.avatar} alt={e.name} style={{ width: '36px', height: '36px', borderRadius: '50%', filter: 'grayscale(100%) opacity(0.7)' }} />
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: 'var(--accent-danger)', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{e.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                className="btn btn-primary" 
                onClick={() => setCurrentView && setCurrentView('attendance')}
                style={{ marginTop: '24px', width: '100%', padding: '12px', borderRadius: '12px' }}
              >
                Manage Attendance
              </button>
            </div>
          )}
        </div>

        {/* Upcoming Milestones Bento Card */}
        <div className="glass-card bento-item-milestones" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={18} style={{ color: 'var(--accent-success)' }} />
            Milestones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {upcomingMilestones.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block', padding: '30px 0' }}>
                No milestones in the next 30 days.
              </span>
            ) : (
              upcomingMilestones.map((milestone, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '14px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0,0,0,0.02)'
                }}>
                  {milestone.type === 'birthday' ? (
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: 'var(--accent-danger)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Gift size={14} />
                    </div>
                  ) : (
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.08)',
                      color: 'var(--accent-warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Award size={14} />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {milestone.empName}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {milestone.label}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: milestone.daysRemaining === 0 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: milestone.daysRemaining === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {milestone.daysRemaining === 0 ? 'Today' : `${milestone.daysRemaining}d`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sync Logs */}
        <div className="glass-card bento-item-logs" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent-success)' }} />
            Drive Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
            {syncLogs.map(log => (
              <div key={log.id} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '12px',
                borderRadius: '14px',
                borderLeft: '4px solid var(--accent-primary)',
                background: 'rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {log.action.toLowerCase().includes('error') || log.action.toLowerCase().includes('failed') ? '❌' : (log.action.toLowerCase().includes('warn') ? '⚠️' : '✅')} 
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{log.timestamp}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.details}</span>
              </div>
            ))}
            
            <button 
              className="btn btn-outline" 
              onClick={() => setCurrentView && setCurrentView('drive')}
              style={{ marginTop: 'auto', alignSelf: 'center', fontSize: '0.8rem', padding: '8px 16px', borderRadius: '20px' }}
            >
              View All Logs
            </button>
          </div>
        </div>

        {/* Google Ads Placement */}
        <div className="bento-item-ad">
          <AdSlot type="horizontal" />
        </div>
      </div>

      {/* Directory File Map */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
          Google Drive Schema Mapping
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: 700 }}>/HR-Pulse-DB/employees.json</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Contains master employee directory data, contact records, department structure, and employment states.
            </p>
          </div>
          <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: 700 }}>/HR-Pulse-DB/attendance.json</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Tracks daily check-in times, clock-out states, device keys, and status entries.
            </p>
          </div>
          <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: 700 }}>/HR-Pulse-DB/leave_requests.json</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Manages leave applications, approval history, supervisor signatures, and remaining balance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
