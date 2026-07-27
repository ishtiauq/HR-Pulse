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
      const entry = { id: emp.id, name: emp.name, avatar: emp.avatar, role: emp.role, time: log?.checkIn || null }
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
    <div className="flex-1 flex flex-col gap-6 sm:gap-8 lg:gap-10">
      
      {/* Page Title */}
      <h1 className="page-title">
        <LayoutDashboard size={28} className="page-title-icon" />
        Dashboard
      </h1>

      {/* Stats Row — 3-col */}
      <div className="dash-grid-3">
        
        {/* Employee Directory */}
        <div className="flex flex-col h-full">
          <h2 className="m-0 mb-2 tracking-tight" style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Employee Directory</h2>
          <div className="macos-card flex-1 bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-4 sm:p-5 cursor-pointer flex flex-col"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            onClick={() => setCurrentView && setCurrentView('employees')} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView && setCurrentView('employees'); } }}>
            <div className="flex items-center gap-6 flex-1 pl-3">
              <div className="flex items-center gap-3 shrink-0">
                <span className="tabular-nums" style={{ font: "700 22px/26px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>{activeCount}</span>
                <span className="inline-flex items-center gap-1.5 py-1 sm:py-1.5 px-2 sm:px-3 rounded-[20px] text-xs font-medium leading-4 bg-[rgba(52,199,89,0.1)] border border-[rgba(52,199,89,0.3)] text-[#1a7d3a]">
                  <span className="sync-dot sync-blink w-[7px] h-[7px] rounded-full bg-[#34c759]"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="tabular-nums" style={{ font: "700 22px/26px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>{inactiveCount}</span>
                <span className="inline-flex items-center gap-1.5 py-1 sm:py-1.5 px-2 sm:px-3 rounded-[20px] text-xs font-medium leading-4 bg-[rgba(224,32,20,0.1)] border border-[rgba(224,32,20,0.25)] text-[#dc3545]">
                  <span className="sync-dot w-[7px] h-[7px] rounded-full bg-[#dc3545]"></span>
                  Inactive
                </span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setCurrentView && setCurrentView('employees') }}
              className="mt-2.5 py-1 sm:py-1.5 px-2 sm:px-3 rounded-[20px] cursor-pointer self-start border-none"
              style={{
                font: "500 11px/16px 'Roboto'",
                background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}>
              View All
            </button>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="flex flex-col h-full">
          <h2 className="m-0 mb-2 tracking-tight" style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Attendance</h2>
          <div className="macos-card flex-1 bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-4 sm:p-5 flex flex-col cursor-pointer"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            onClick={() => setShowAttDropdown(!showAttDropdown)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowAttDropdown(!showAttDropdown); } }}>
            <div className="flex items-center gap-3.5 flex-1 pl-3">
              <span className="flex items-center gap-2 text-[#34C759]" style={{ font: "600 15px/20px 'Roboto'" }}>
                <span className="pulse-dot pulse-dot-green m-0"></span>{todayStats.present}
                <span className="font-normal text-[11px] text-[var(--md-bw-on-surface-variant)]">Present</span>
              </span>
              <span className="flex items-center gap-2 text-[#dc3545]" style={{ font: "600 15px/20px 'Roboto'" }}>
                <span className="pulse-dot pulse-dot-red m-0"></span>{todayStats.absent}
                <span className="font-normal text-[11px] text-[var(--md-bw-on-surface-variant)]">Absent</span>
              </span>
              <span className="flex items-center gap-2 text-[#f0ad4e]" style={{ font: "600 15px/20px 'Roboto'" }}>
                <span className="pulse-dot pulse-dot-orange m-0"></span>{todayStats.onLeave}
                <span className="font-normal text-[11px] text-[var(--md-bw-on-surface-variant)]">On Leave</span>
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-2 pl-3">
              <span style={{ font: "400 12px/16px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>Rate: {attendanceRate}%</span>
              <button onClick={(e) => { e.stopPropagation(); setShowAttDropdown(!showAttDropdown) }}
                className="py-1 sm:py-1.5 px-2 sm:px-3 rounded-[20px] cursor-pointer border-none"
                style={{
                  font: "500 11px/16px 'Roboto'",
                  background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'}>
                {showAttDropdown ? 'Hide' : 'View Details'}
              </button>
            </div>
          </div>
        </div>

        {/* Drive Connection */}
        <div className="flex flex-col h-full">
          <div className={`macos-card dash-card drive-card drive-card--${driveConnected ? 'healthy' : 'error'} rounded-[14px] p-4 sm:p-5 flex flex-col`}
            style={{
              flex: 1, background: driveConnected ? '#E8F8EE' : '#FDE8E8',
              border: driveConnected ? '1px solid rgba(52, 199, 89, 0.35)' : '1px solid rgba(255, 59, 48, 0.35)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="icon-3d w-7 h-7 flex items-center justify-center rounded-[7px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                  <path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.4 4.4 0 0 0-.8.1 7 7 0 1 0-11 5.9"></path>
                </svg>
              </div>
              <span className="uppercase tracking-wide"
                style={{ font: "500 9px/12px 'Roboto'", letterSpacing: '0.08em', color: driveConnected ? '#1A7D3A' : '#D32F2F' }}>Drive Connection</span>
            </div>
            <p className="flex items-center gap-2 m-0 flex-1 pl-3"
              style={{ font: "500 16px/28px 'Roboto'", color: driveConnected ? '#1A7D3A' : '#D32F2F' }}>
              {driveConnected ? 'Healthy' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Details Dropdown */}
      {showAttDropdown && (
        <div className="macos-card bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] overflow-hidden"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', font: "500 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Today's Attendance Details</div>
          {[
            { key: 'present', label: 'Present', count: todayStats.present, dot: 'pulse-dot-green' },
            { key: 'absent', label: 'Absent', count: todayStats.absent, dot: 'pulse-dot-red' },
            { key: 'onLeave', label: 'On Leave', count: todayStats.onLeave, dot: 'pulse-dot-orange' },
          ].map(item => (
            <div key={item.key}>
              <button onClick={() => setAttFilter(attFilter === item.key ? null : item.key)}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-none cursor-pointer"
                style={{
                  background: attFilter === item.key ? 'rgba(0,0,0,0.03)' : 'transparent',
                  font: "500 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = attFilter === item.key ? 'rgba(0,0,0,0.03)' : 'transparent'}>
                <span className="flex items-center gap-2">
                  <span className={`pulse-dot ${item.dot} m-0`}></span>
                  {item.label}
                </span>
                <span style={{ color: 'var(--md-bw-on-surface-variant)', font: "500 12px/16px 'Roboto'" }}>{item.count}</span>
              </button>
              {attFilter === item.key && (
                <div className="px-4 pb-2.5">
                  {attendanceLists[item.key].length === 0 ? (
                    <p className="my-1" style={{ font: "400 12px/16px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>No one</p>
                  ) : (
                    attendanceLists[item.key].map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2.5 py-1.5">
                        <img src={emp.avatar} alt={emp.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="block" style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>{emp.name}</span>
                          <span style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>{emp.role}</span>
                        </div>
                        {emp.time && <span className="shrink-0" style={{ font: "400 11px/16px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>{emp.time}</span>}
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
        <div className="flex flex-col h-full">
          <h2 className="m-0 mb-2 tracking-tight" style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Announcements</h2>
          <div className="macos-card flex-1 bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-5 sm:p-6"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {recentAnnouncements.length === 0 ? (
              <p className="text-center m-0" style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>No announcements</p>
            ) : (
              recentAnnouncements.map((ann, idx) => (
                <div key={ann.id || idx} className="flex items-center gap-2.5 py-1.5 cursor-pointer"
                  style={{ borderBottom: idx < recentAnnouncements.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                  onClick={() => setCurrentView && setCurrentView('announcements')} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView && setCurrentView('announcements'); } }}>
                  <div className="w-7 h-7 flex items-center justify-center bg-[rgba(0,0,0,0.04)] rounded-[7px] shrink-0">
                    <Megaphone size={14} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 truncate" style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>{ann.title}</p>
                    <p className="mt-0.5" style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>
                      {getEmployeeName(ann.authorId)} &middot; {new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {ann.priority === 'Important' && (
                    <span className="uppercase tracking-wide text-[#D32F2F] bg-[#FFEBEE] px-1.5 py-0.5 rounded shrink-0"
                      style={{ font: "500 8px/10px 'Roboto'", letterSpacing: '0.05em' }}>Important</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payroll Summary Card */}
        <div className="flex flex-col h-full">
          <h2 className="m-0 mb-2 tracking-tight" style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Payroll Summary</h2>
          <div className="macos-card flex-1 bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-5 sm:p-6 flex flex-col"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {!currentPayrollMonth ? (
              <p className="text-center m-auto" style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>No payroll data</p>
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-[rgba(0,122,255,0.12)] rounded-lg shrink-0">
                    <CreditCard size={16} className="text-[#007AFF]" />
                  </div>
                  <div>
                    <p className="m-0" style={{ font: "500 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Month: {currentPayrollMonth}</p>
                    <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '1px 0 0' }}>{currentPayrollData.length} employee{currentPayrollData.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex gap-16 mb-2.5">
                  <div>
                    <p className="m-0" style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>Paid</p>
                    <p className="m-0 tabular-nums text-[#34C759]" style={{ font: "700 18px/24px 'Roboto'" }}>{paidCount}</p>
                  </div>
                  <div>
                    <p className="m-0" style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>Pending</p>
                    <p className="m-0 tabular-nums text-[#FF9500]" style={{ font: "700 18px/24px 'Roboto'" }}>{pendingCount}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="m-0" style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>Total</p>
                    <p className="m-0 tabular-nums" style={{ font: "700 18px/24px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>${totalPayrollCost.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <button onClick={() => setCurrentView && setCurrentView('payroll')}
                    className="py-1.5 px-3.5 rounded-[20px] cursor-pointer border-none"
                    style={{
                      font: "500 11px/16px 'Roboto'",
                      background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.18)'}
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
        <div className="flex flex-col h-full">
          <h2 className="m-0 mb-2 tracking-tight" style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Events</h2>
          <div className="macos-card flex-1 bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-5 sm:p-6"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {upcomingEvents.length === 0 ? (
              <p className="text-center m-0" style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>No upcoming events</p>
            ) : (
              upcomingEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="flex items-center gap-2.5 py-1.5 cursor-pointer"
                  style={{ borderBottom: idx < upcomingEvents.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                  onClick={() => setCurrentView && setCurrentView('calendar')} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView && setCurrentView('calendar'); } }}>
                  <div className="w-7 h-7 flex items-center justify-center rounded-[7px] shrink-0"
                    style={{ background: evt.type === 'holiday' ? 'rgba(52, 199, 89, 0.12)' : evt.type === 'birthday' ? 'rgba(255, 149, 0, 0.12)' : 'rgba(0, 122, 255, 0.12)' }}>
                    <CalendarIcon size={14} style={{ color: evt.type === 'holiday' ? '#34C759' : evt.type === 'birthday' ? '#FF9500' : '#007AFF' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 truncate" style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>{evt.title}</p>
                    <p className="mt-0.5" style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>
                      {formatDate(evt.date)}{evt.time ? ` at ${evt.time}` : ''}
                    </p>
                  </div>
                  <span className="capitalize shrink-0 tracking-wide"
                    style={{ font: "500 8px/10px 'Roboto'", letterSpacing: '0.03em', color: 'var(--md-bw-on-surface-variant)' }}>{evt.type}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drive Logs */}
        <div className="flex flex-col h-full">
          <h2 className="m-0 mb-2 tracking-tight" style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Drive Logs</h2>
          <div className="macos-card flex-1 bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-3 px-3.5"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {syncLogs.map((log, idx) => (
              <div key={log.id} className="flex items-center gap-2.5 py-2"
                style={{ borderBottom: idx !== syncLogs.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div className="w-7 h-7 flex items-center justify-center bg-[rgba(0,0,0,0.04)] rounded-[7px] shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 truncate" style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>{log.action}</p>
                  <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '1px 0 0' }}>{log.details}</p>
                </div>
                <span className="uppercase shrink-0 tracking-wide"
                  style={{ font: "500 9px/12px 'Roboto'", letterSpacing: '0.05em', color: 'var(--md-bw-on-surface-variant)' }}>{log.status === 'success' ? 'Synced' : (log.status === 'error' ? 'Failed' : 'Pending')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="flex flex-col h-full">
          <h2 className="m-0 mb-2 tracking-tight" style={{ font: "700 16px/22px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>Milestones</h2>
          <div className="macos-card flex-1 bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-5 sm:p-6 flex items-center justify-center"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {upcomingMilestones.length === 0 ? (
              <p style={{ font: "400 13px/18px 'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>No milestones</p>
            ) : (
              <div className="w-full">
                {upcomingMilestones.map((milestone, idx) => (
                  <div key={`${milestone.type}-${milestone.empName}`} className="flex items-center gap-2.5 py-2"
                    style={{ borderBottom: idx !== upcomingMilestones.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <div className="w-7 h-7 flex items-center justify-center bg-[rgba(0,0,0,0.04)] rounded-[7px] shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                        {milestone.type === 'birthday' ? (
                          <><rect x="3" y="8" width="18" height="4" rx="1" ry="1"></rect><path d="M12 8v13"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path></>
                        ) : (
                          <><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></>
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 truncate" style={{ font: "500 12px/18px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>{milestone.empName}</p>
                      <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '1px 0 0' }}>{milestone.label}</p>
                    </div>
                    <span className="uppercase shrink-0 tracking-wide"
                      style={{ font: "500 9px/12px 'Roboto'", letterSpacing: '0.05em', color: 'var(--md-bw-on-surface-variant)' }}>{milestone.daysRemaining === 0 ? 'Today' : `${milestone.daysRemaining}d`}</span>
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
