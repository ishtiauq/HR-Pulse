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
    <div className="flex-1 flex flex-col gap-6 sm:gap-8">
      
      {/* Page Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
        <h1 className="page-title m-0 flex items-center gap-3.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--md-bw-on-surface)]">
          <LayoutDashboard size={32} className="text-[#007AFF]" />
          Dashboard Overview
        </h1>
        <span className="text-xs sm:text-sm font-semibold text-[var(--md-bw-on-surface-variant)] bg-[rgba(0,0,0,0.04)] px-4 py-2 rounded-full border border-[rgba(0,0,0,0.05)] shadow-xs">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Unified 12-Column Responsive & Adaptive Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Widget 1 — Employee Directory (Span 4) */}
        <div className="macos-card flex flex-col h-full bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-4">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(0,122,255,0.12)] shrink-0">
                <Users size={18} className="text-[#007AFF]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--md-bw-on-surface)] m-0">
                Employee Directory
              </h2>
            </div>
            <button
              onClick={() => setCurrentView && setCurrentView('employees')}
              className="py-1.5 px-3.5 rounded-full text-xs font-extrabold bg-[rgba(0,122,255,0.12)] text-[#007AFF] hover:bg-[rgba(0,122,255,0.22)] transition-colors cursor-pointer border-none"
            >
              View All
            </button>
          </div>
          <div className="flex-1 flex items-center justify-around py-3">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-4xl sm:text-5xl font-black tabular-nums text-[var(--md-bw-on-surface)]">{activeCount}</span>
              <span className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold bg-[rgba(52,199,89,0.12)] border border-[rgba(52,199,89,0.3)] text-[#1a7d3a]">
                <span className="sync-dot sync-blink w-2 h-2 rounded-full bg-[#34c759]"></span>
                Active
              </span>
            </div>
            <div className="w-[1.5px] h-14 bg-[rgba(0,0,0,0.08)]"></div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-4xl sm:text-5xl font-black tabular-nums text-[var(--md-bw-on-surface)]">{inactiveCount}</span>
              <span className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold bg-[rgba(224,32,20,0.1)] border border-[rgba(224,32,20,0.25)] text-[#dc3545]">
                <span className="sync-dot w-2 h-2 rounded-full bg-[#dc3545]"></span>
                Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Widget 2 — Today's Attendance (Span 4) */}
        <div className="macos-card flex flex-col h-full bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-4">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(52,199,89,0.12)] shrink-0">
                <Users size={18} className="text-[#34C759]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--md-bw-on-surface)] m-0">
                Today's Attendance
              </h2>
            </div>
            <button
              onClick={() => setShowAttDropdown(!showAttDropdown)}
              className="py-1.5 px-3.5 rounded-full text-xs font-extrabold bg-[rgba(0,122,255,0.12)] text-[#007AFF] hover:bg-[rgba(0,122,255,0.22)] transition-colors cursor-pointer border-none"
            >
              {showAttDropdown ? 'Hide' : 'Details'}
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="flex flex-col items-center flex-1">
                <span className="text-2xl sm:text-3xl font-black text-[#34C759] flex items-center gap-1.5">
                  <span className="pulse-dot pulse-dot-green m-0"></span>
                  {todayStats.present}
                </span>
                <span className="text-xs font-bold text-[var(--md-bw-on-surface-variant)] mt-1">Present</span>
              </div>
              <div className="w-[1.5px] h-10 bg-[rgba(0,0,0,0.08)]"></div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-2xl sm:text-3xl font-black text-[#dc3545] flex items-center gap-1.5">
                  <span className="pulse-dot pulse-dot-red m-0"></span>
                  {todayStats.absent}
                </span>
                <span className="text-xs font-bold text-[var(--md-bw-on-surface-variant)] mt-1">Absent</span>
              </div>
              <div className="w-[1.5px] h-10 bg-[rgba(0,0,0,0.08)]"></div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-2xl sm:text-3xl font-black text-[#f0ad4e] flex items-center gap-1.5">
                  <span className="pulse-dot pulse-dot-orange m-0"></span>
                  {todayStats.onLeave}
                </span>
                <span className="text-xs font-bold text-[var(--md-bw-on-surface-variant)] mt-1">Leave</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.06)] flex justify-between items-center text-xs font-semibold text-[var(--md-bw-on-surface-variant)]">
              <span>Attendance Rate</span>
              <span className="font-black text-sm sm:text-base text-[var(--md-bw-on-surface)]">{attendanceRate}%</span>
            </div>
          </div>
        </div>

        {/* Widget 3 — Drive Connection (Span 4) */}
        <div className={`macos-card flex flex-col h-full rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-4 ${driveConnected ? 'bg-[rgba(52,199,89,0.08)] border border-[rgba(52,199,89,0.3)]' : 'bg-[rgba(255,59,48,0.08)] border border-[rgba(255,59,48,0.3)]'}`}>
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(52,199,89,0.15)] shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#34C759]">
                  <path d="M17.5 19a4.5 4.5 0 0 0 0-9 4.4 4.4 0 0 0-.8.1 7 7 0 1 0-11 5.9"></path>
                </svg>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#34C759] m-0">
                Drive Connection
              </h2>
            </div>
            <span className={`py-1.5 px-3 rounded-full text-xs font-black uppercase tracking-wider ${driveConnected ? 'bg-[#34c759]/15 text-[#34C759]' : 'bg-[#dc3545]/15 text-[#FF453A]'}`}>
              {driveConnected ? 'Synced' : 'Error'}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black text-[#34C759]">
                {driveConnected ? 'Healthy Connection' : 'Drive Disconnected'}
              </span>
            </div>
            <p className="text-xs font-semibold m-0 mt-3 text-[var(--md-bw-on-surface-variant)] leading-relaxed">
              {driveConnected ? 'Google Drive biometric & roster logs sync automatically.' : 'Re-authenticate with Google Drive to enable auto sync.'}
            </p>
          </div>
        </div>

        {/* Attendance Details Dropdown (Span 12 Full Width) */}
        {showAttDropdown && (
          <div className="macos-card bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] overflow-hidden shadow-sm backdrop-blur-md lg:col-span-12">
            <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.06)] font-extrabold text-xs uppercase tracking-wider text-[var(--md-bw-on-surface-variant)]">
              Today's Attendance Roster Breakdowns
            </div>
            {[
              { key: 'present', label: 'Present', count: todayStats.present, dot: 'pulse-dot-green' },
              { key: 'absent', label: 'Absent', count: todayStats.absent, dot: 'pulse-dot-red' },
              { key: 'onLeave', label: 'On Leave', count: todayStats.onLeave, dot: 'pulse-dot-orange' },
            ].map(item => (
              <div key={item.key} className="border-b border-[rgba(0,0,0,0.04)] last:border-none">
                <button
                  onClick={() => setAttFilter(attFilter === item.key ? null : item.key)}
                  className="w-full flex items-center justify-between px-6 py-3.5 border-none bg-transparent hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer text-xs sm:text-sm font-bold text-[var(--md-bw-on-surface)]"
                >
                  <span className="flex items-center gap-3">
                    <span className={`pulse-dot ${item.dot} m-0`}></span>
                    {item.label}
                  </span>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[rgba(0,0,0,0.06)] text-[var(--md-bw-on-surface-variant)]">
                    {item.count}
                  </span>
                </button>
                {attFilter === item.key && (
                  <div className="px-6 pb-4 pt-1 bg-[rgba(0,0,0,0.015)]">
                    {attendanceLists[item.key].length === 0 ? (
                      <p className="my-1.5 text-xs text-[var(--md-bw-on-surface-variant)] italic">No personnel in this category</p>
                    ) : (
                      attendanceLists[item.key].map((emp) => (
                        <div key={emp.id} className="flex items-center gap-3.5 py-2 border-b border-[rgba(0,0,0,0.04)] last:border-none">
                          <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-extrabold text-[var(--md-bw-on-surface)]">{emp.name}</span>
                            <span className="text-[11px] font-semibold text-[var(--md-bw-on-surface-variant)]">{emp.role}</span>
                          </div>
                          {emp.time && <span className="text-[11px] font-bold text-[var(--md-bw-on-surface-variant)] bg-[rgba(0,0,0,0.04)] px-2.5 py-0.5 rounded-md">{emp.time}</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Widget 4 — Announcements (Span 6) */}
        <div className="macos-card flex flex-col h-full bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-6">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(255,149,0,0.12)] shrink-0">
                <Megaphone size={18} className="text-[#FF9500]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--md-bw-on-surface)] m-0">
                Announcements
              </h2>
            </div>
            <button
              onClick={() => setCurrentView && setCurrentView('announcements')}
              className="py-1.5 px-3.5 rounded-full text-xs font-extrabold bg-[rgba(0,122,255,0.12)] text-[#007AFF] hover:bg-[rgba(0,122,255,0.22)] transition-colors cursor-pointer border-none"
            >
              View All
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-start gap-3">
            {recentAnnouncements.length === 0 ? (
              <p className="text-center my-auto text-xs text-[var(--md-bw-on-surface-variant)]">No active announcements</p>
            ) : (
              recentAnnouncements.map((ann, idx) => (
                <div
                  key={ann.id || idx}
                  className="flex items-center gap-3 p-3 sm:p-3.5 px-3.5 sm:px-4 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.04)] transition-colors cursor-pointer"
                  onClick={() => setCurrentView && setCurrentView('announcements')}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(255,149,0,0.12)] shrink-0">
                    <Megaphone size={17} className="text-[#FF9500]" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="m-0 text-xs sm:text-sm font-extrabold text-[var(--md-bw-on-surface)] truncate">{ann.title}</p>
                    <p className="m-0 mt-0.5 text-[11px] font-semibold text-[var(--md-bw-on-surface-variant)]">
                      {getEmployeeName(ann.authorId)} &middot; {new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {ann.priority === 'Important' && (
                    <span className="uppercase tracking-wider text-[10px] font-black text-[#D32F2F] bg-[#FFEBEE] px-3 py-1 rounded-lg shrink-0 border border-[#FFCDD2] ml-1">
                      Important
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 5 — Payroll Summary (Span 6) */}
        <div className="macos-card flex flex-col h-full bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-6">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(0,122,255,0.12)] shrink-0">
                <CreditCard size={18} className="text-[#007AFF]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--md-bw-on-surface)] m-0">
                Payroll Summary
              </h2>
            </div>
            {currentPayrollMonth && (
              <span className="text-xs font-bold text-[var(--md-bw-on-surface-variant)] bg-[rgba(0,0,0,0.04)] px-3 py-1 rounded-full">
                {currentPayrollMonth}
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {!currentPayrollMonth ? (
              <p className="text-center my-auto text-xs text-[var(--md-bw-on-surface-variant)]">No payroll data found</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)]">
                  <div>
                    <span className="block text-xs font-bold text-[var(--md-bw-on-surface-variant)]">Paid</span>
                    <span className="text-2xl sm:text-3xl font-black tabular-nums text-[#34C759] mt-0.5 block">{paidCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[var(--md-bw-on-surface-variant)]">Pending</span>
                    <span className="text-2xl sm:text-3xl font-black tabular-nums text-[#FF9500] mt-0.5 block">{pendingCount}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-[var(--md-bw-on-surface-variant)]">Total Payroll</span>
                    <span className="text-2xl sm:text-3xl font-black tabular-nums text-[var(--md-bw-on-surface)] mt-0.5 block">${totalPayrollCost.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 flex justify-between items-center border-t border-[rgba(0,0,0,0.06)]">
                  <span className="text-xs font-semibold text-[var(--md-bw-on-surface-variant)]">{currentPayrollData.length} Employees total</span>
                  <button
                    onClick={() => setCurrentView && setCurrentView('payroll')}
                    className="py-1.5 px-3.5 rounded-full text-xs font-extrabold bg-[rgba(0,122,255,0.12)] text-[#007AFF] hover:bg-[rgba(0,122,255,0.22)] transition-colors cursor-pointer border-none"
                  >
                    View Payroll
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Widget 6 — Upcoming Events (Span 4) */}
        <div className="macos-card flex flex-col h-full bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-4">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(52,199,89,0.12)] shrink-0">
                <CalendarIcon size={18} className="text-[#34C759]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--md-bw-on-surface)] m-0">
                Upcoming Events
              </h2>
            </div>
            <button
              onClick={() => setCurrentView && setCurrentView('calendar')}
              className="py-1.5 px-3.5 rounded-full text-xs font-extrabold bg-[rgba(0,122,255,0.12)] text-[#007AFF] hover:bg-[rgba(0,122,255,0.22)] transition-colors cursor-pointer border-none"
            >
              Calendar
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-start gap-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-center my-auto text-xs text-[var(--md-bw-on-surface-variant)]">No upcoming events</p>
            ) : (
              upcomingEvents.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className="flex items-center gap-3 p-3 sm:p-3.5 px-3.5 sm:px-4 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.04)] transition-colors cursor-pointer"
                  onClick={() => setCurrentView && setCurrentView('calendar')}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: evt.type === 'holiday' ? 'rgba(52, 199, 89, 0.12)' : evt.type === 'birthday' ? 'rgba(255, 149, 0, 0.12)' : 'rgba(0, 122, 255, 0.12)' }}
                  >
                    <CalendarIcon size={17} style={{ color: evt.type === 'holiday' ? '#34C759' : evt.type === 'birthday' ? '#FF9500' : '#007AFF' }} />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="m-0 text-xs sm:text-sm font-extrabold text-[var(--md-bw-on-surface)] truncate">{evt.title}</p>
                    <p className="m-0 mt-0.5 text-[11px] font-semibold text-[var(--md-bw-on-surface-variant)] truncate">
                      {formatDate(evt.date)}{evt.time ? ` at ${evt.time}` : ''}
                    </p>
                  </div>
                  <span className="capitalize text-[10px] sm:text-xs font-bold text-[var(--md-bw-on-surface-variant)] bg-[rgba(0,0,0,0.05)] px-2.5 py-1 rounded-lg shrink-0 ml-1">
                    {evt.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 7 — Drive Sync Logs (Span 4) */}
        <div className="macos-card flex flex-col h-full bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-4">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(0,122,255,0.12)] shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#007AFF]">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--md-bw-on-surface)] m-0">
                Drive Sync Logs
              </h2>
            </div>
            <span className="text-xs font-black text-[#1a7d3a] bg-[rgba(52,199,89,0.12)] px-3.5 py-1 rounded-full">
              Live
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-start gap-3">
            {syncLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 sm:p-3.5 px-3.5 sm:px-4 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(0,0,0,0.05)] shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--md-bw-on-surface-variant)]">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="m-0 text-xs sm:text-sm font-extrabold text-[var(--md-bw-on-surface)] truncate">{log.action}</p>
                  <p className="m-0 mt-0.5 text-[11px] font-semibold text-[var(--md-bw-on-surface-variant)] truncate">{log.details}</p>
                </div>
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 ml-1 ${log.status === 'success' ? 'bg-[#34c759]/15 text-[#1A7D3A]' : log.status === 'error' ? 'bg-[#dc3545]/15 text-[#D32F2F]' : 'bg-[#ff9f0a]/15 text-[#b8860b]'}`}>
                  {log.status === 'success' ? 'Synced' : log.status === 'error' ? 'Failed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 8 — Upcoming Milestones (Span 4) */}
        <div className="macos-card flex flex-col h-full bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 sm:p-6 lg:p-6.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg lg:col-span-4">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(255,149,0,0.12)] shrink-0">
                <Award size={18} className="text-[#FF9500]" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--md-bw-on-surface)] m-0">
                Upcoming Milestones
              </h2>
            </div>
            <span className="text-xs font-bold text-[var(--md-bw-on-surface-variant)] bg-[rgba(0,0,0,0.05)] px-3.5 py-1 rounded-full">
              30 Days
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-start">
            {upcomingMilestones.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
                <Gift size={36} className="text-[var(--md-bw-on-surface-variant)] opacity-40 mb-2" />
                <p className="m-0 text-xs font-semibold text-[var(--md-bw-on-surface-variant)] max-w-[200px] leading-relaxed">No birthdays or work anniversaries in the next 30 days.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingMilestones.map((milestone) => (
                  <div key={`${milestone.type}-${milestone.empName}`} className="flex items-center gap-3 p-3 sm:p-3.5 px-3.5 sm:px-4 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.04)] transition-colors">
                    <img src={milestone.avatar} alt={milestone.empName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="m-0 text-xs sm:text-sm font-extrabold text-[var(--md-bw-on-surface)] truncate">{milestone.empName}</p>
                      <p className="m-0 mt-0.5 text-[11px] font-semibold text-[var(--md-bw-on-surface-variant)]">{milestone.label}</p>
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[rgba(0,122,255,0.12)] text-[#007AFF] px-2.5 py-1 rounded-lg shrink-0 ml-1">
                      {milestone.daysRemaining === 0 ? 'Today' : `${milestone.daysRemaining}d`}
                    </span>
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
