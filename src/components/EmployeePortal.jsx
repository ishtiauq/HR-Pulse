import { useState, useEffect } from 'react'
import { Home, Calendar as CalendarIcon, FileText, User as UserIcon, Plus, Send, Download, CheckCircle2, XCircle, Clock, AlertCircle, Megaphone, MessageSquare, Heart, ThumbsUp, PartyPopper, Monitor, AlertTriangle, Upload } from 'lucide-react'
import { useModal } from '../services/useModal.js'
import { formatDate, formatDateShort, formatDateTime, formatMonthYear, formatDateWithWeekday } from '../services/date.js'
import { Select, SelectItem } from "@/components/ui/select"

// Dummy profile image generation based on initials
const getInitialsAvatar = (name) => {
  const parts = name.split(' ')
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]
  
  // Deterministic color
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const h = hash % 360
  
  return (
    <div className="flex items-center justify-center size-10 rounded-full font-bold text-base shrink-0" style={{
      background: `hsl(${h}, 70%, 80%)`, color: `hsl(${h}, 70%, 20%)`,
    }}>
      {initials.toUpperCase()}
    </div>
  )
}

export default function EmployeePortal({ 
  currentUser, 
  employees, 
  attendance, 
  payroll, 
  expenses, 
  addLog, 
  addToast, 
  setAttendance, 
  pendingProfileEdits, 
  setPendingProfileEdits,
  setExpenses,
  roster,
  shiftSwaps,
  setShiftSwaps,
  shiftTemplates,
  overtimeClaims,
  setOvertimeClaims,
  announcements,
  setAnnouncements,
  assets,
  setAssets,
  assetRequests,
  setAssetRequests,
  settings,
  simulatedRole,
  setSimulatedRole
}) {
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, attendance, payslips, leave, profile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showPunchModal, setShowPunchModal] = useState(false)
  useModal(() => setShowPunchModal(false))
  const [punchType, setPunchType] = useState('In')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePunchSubmit = () => {
    const today = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    const todayLogs = attendance?.dailyLogs?.[today] || {}
    const myLog = todayLogs[currentUser.id] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
    
    let updatedLog = { ...myLog }
    if (punchType === 'In') {
      updatedLog.status = 'Present'
      updatedLog.checkIn = nowTime
    } else {
      updatedLog.checkOut = nowTime
      if (updatedLog.checkIn !== '--') {
        updatedLog.hours = '9.0'
      }
    }
    
    const newLogs = {
      ...attendance.dailyLogs,
      [today]: {
        ...todayLogs,
        [currentUser.id]: updatedLog
      }
    }
    
    setAttendance(prev => ({
      ...prev,
      dailyLogs: newLogs
    }))
    
    setShowPunchModal(false)
    addToast(`Successfully clocked ${punchType.toLowerCase()} at ${nowTime}.`, 'success')
  }

  if (!currentUser) {
    return <div className="p-5">Loading portal...</div>
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView currentUser={currentUser} attendance={attendance} expenses={expenses} announcements={announcements} setActiveTab={setActiveTab} />
      case 'attendance':
        return <AttendanceView 
                 currentUser={currentUser} 
                 employees={employees}
                 attendance={attendance} 
                 roster={roster}
                 shiftSwaps={shiftSwaps}
                 setShiftSwaps={setShiftSwaps}
                 shiftTemplates={shiftTemplates}
                 overtimeClaims={overtimeClaims}
                 setOvertimeClaims={setOvertimeClaims}
                 settings={settings}
                 addToast={addToast} 
               />
      case 'announcements':
        return <AnnouncementsFeedView 
                 currentUser={currentUser} 
                 employees={employees} 
                 announcements={announcements} 
                 setAnnouncements={setAnnouncements} 
                 addToast={addToast} 
               />
      case 'payslips':
        return <PayslipsView currentUser={currentUser} payroll={payroll} addToast={addToast} />
      case 'leave':
        return <LeaveView currentUser={currentUser} attendance={attendance} setAttendance={setAttendance} addToast={addToast} addLog={addLog} />
      case 'profile':
        return <ProfileView currentUser={currentUser} pendingProfileEdits={pendingProfileEdits} setPendingProfileEdits={setPendingProfileEdits} addToast={addToast} addLog={addLog} />
      case 'my-assets':
        return <MyAssetsView
                 currentUser={currentUser}
                 assets={assets}
                 setAssets={setAssets}
                 assetRequests={assetRequests}
                 setAssetRequests={setAssetRequests}
                 addToast={addToast}
               />
      default:
        return <DashboardView currentUser={currentUser} attendance={attendance} expenses={expenses} announcements={announcements} setActiveTab={setActiveTab} />
    }
  }

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'announcements', icon: Megaphone, label: 'Feed' },
    { id: 'my-assets', icon: Monitor, label: 'My Assets' },
    { id: 'attendance', icon: Clock, label: 'Attendance' },
    { id: 'payslips', icon: FileText, label: 'Payslips' },
    { id: 'leave', icon: CalendarIcon, label: 'Leave' },
    { id: 'profile', icon: UserIcon, label: 'Profile' }
  ]

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: 'var(--bg-primary)', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {/* Sidebar (Desktop) */}
      {!isMobile && (
        <div className="w-[250px] flex flex-col px-4 py-6" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
          <div className="mb-8 px-3">
            <h2 className="text-[1.4rem] font-extrabold m-0" style={{ color: 'var(--accent-primary)' }}>HR Pulse <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>ESS</span></h2>
          </div>
          <nav className="flex flex-col gap-2" role="tablist">
            {navItems.map(item => {
              const active = activeTab === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(item.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(item.id) } }}
                  className="flex items-center gap-3 p-2 sm:p-3 rounded-lg border-0 cursor-pointer text-left"
                  style={{
                    background: active ? 'var(--bg-tertiary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: active ? 600 : 500, transition: 'background-color 0.2s, color 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  <Icon size={18} style={{ color: active ? 'var(--accent-primary)' : 'inherit' }} />
                  {item.label}
                </button>
              )
            })}
          </nav>
          {!currentUser.isEmployee && (
            <button aria-label="Back to admin" onClick={() => setSimulatedRole('Admin')}
              className="mt-auto flex items-center gap-2.5 p-3 rounded-lg cursor-pointer font-medium w-full text-left"
              style={{
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.85rem',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
              ← Back to Admin
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
        {renderContent()}
      </div>

      {/* Bottom Tab Bar (Mobile) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 py-3 z-[100]" style={{
          background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        }}>
          {navItems.map(item => {
            const active = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(item.id) } }}
                className="flex flex-col items-center justify-center gap-1 border-0 cursor-pointer flex-1 min-h-[44px] p-1.5"
                style={{
                  background: 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={20} />
                <span className="text-[0.65rem]" style={{ fontWeight: active ? 600 : 500 }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {isMobile && !currentUser.isEmployee && (
        <button onClick={() => setSimulatedRole('Admin')}
          className="fixed top-3 right-3 z-[101] px-3.5 py-2 rounded-full cursor-pointer font-semibold"
          style={{
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
            fontSize: '0.78rem',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
          ← Admin
        </button>
      )}

      {showPunchModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[11000]" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowPunchModal(false)}>
          <div className="glass-card p-6 w-[90%] max-w-[400px] flex flex-col gap-4" style={{ background: 'var(--bg-secondary)' }} onClick={e => e.stopPropagation()}>
            <h3 className="m-0">Attendance Punch</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select punch type for today (<strong>{formatDate(new Date().toISOString().split('T')[0])}</strong>):</p>
            <div className="flex gap-3">
              <button 
                className={`btn flex-1 min-h-[44px] ${punchType === 'In' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setPunchType('In')}
              >
                Clock In
              </button>
              <button 
                className={`btn flex-1 min-h-[44px] ${punchType === 'Out' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setPunchType('Out')}
              >
                Clock Out
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-3">
              <button className="btn btn-secondary min-h-[44px]" onClick={() => setShowPunchModal(false)}>Cancel</button>
              <button className="btn btn-primary min-h-[44px]" onClick={handlePunchSubmit}>Confirm Punch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------
// SUB-VIEWS
// ----------------------------------------------------

function DashboardView({ currentUser, attendance, expenses, announcements, setActiveTab }) {
  const currentBalances = attendance?.balances?.[currentUser.id] || {
    annual: { limit: 20, used: 0 },
    sick: { limit: 14, used: 0 },
    casual: { limit: 10, used: 0 }
  }

  const myExpenses = expenses?.list?.filter(e => e.employeeId === currentUser.id && e.status === 'Pending') || []
  const totalPending = myExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  const recentAnnouncements = (announcements || [])
    .filter(a => a.audience === 'all' || a.audience === currentUser.department)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1000px] mx-auto">
      <div className="glass-card p-6 flex items-center gap-5">
        {getInitialsAvatar(currentUser.name)}
        <div>
          <h1 className="text-2xl m-0 mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back, {currentUser.name}!</h1>
          <p className="m-0 text-sm" style={{ color: 'var(--text-secondary)' }}>{currentUser.department} • {currentUser.role}</p>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="glass-card stat-card p-5">
          <h3 className="text-sm uppercase m-0 mb-2" style={{ color: 'var(--text-secondary)' }}>Annual Leave Balance</h3>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {currentBalances.annual.limit - currentBalances.annual.used} <span className="text-base" style={{ color: 'var(--text-muted)' }}>/ {currentBalances.annual.limit} days</span>
          </div>
        </div>
        <div className="glass-card stat-card p-5">
          <h3 className="text-sm uppercase m-0 mb-2" style={{ color: 'var(--text-secondary)' }}>Sick Leave Balance</h3>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {currentBalances.sick.limit - currentBalances.sick.used} <span className="text-base" style={{ color: 'var(--text-muted)' }}>/ {currentBalances.sick.limit} days</span>
          </div>
        </div>
        <div className="glass-card stat-card p-5">
          <h3 className="text-sm uppercase m-0 mb-2" style={{ color: 'var(--text-secondary)' }}>Pending Reimbursements</h3>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ${totalPending.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="flex flex-col gap-4">
          <h3 className="text-lg m-0" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <button className="btn btn-secondary p-4 flex flex-col gap-2 items-center" onClick={() => setActiveTab('leave')}>
              <CalendarIcon size={24} style={{ color: 'var(--accent-primary)' }} />
              Request Leave
            </button>
            <button className="btn btn-secondary p-4 flex flex-col gap-2 items-center" onClick={() => setActiveTab('payslips')}>
              <Download size={24} style={{ color: 'var(--accent-success)' }} />
              Download Payslip
            </button>
            <button className="btn btn-secondary p-4 flex flex-col gap-2 items-center" onClick={() => setShowPunchModal(true)}>
              <Clock size={24} style={{ color: 'var(--accent-warning)' }} />
              Mark Attendance
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg m-0" style={{ color: 'var(--text-primary)' }}>Company Feed</h3>
            <button className="bg-transparent border-0 font-semibold cursor-pointer text-sm" style={{ color: 'var(--accent-primary)' }} onClick={() => setActiveTab('announcements')}>View All</button>
          </div>
          <div className="flex flex-col gap-3">
            {recentAnnouncements.length === 0 ? (
              <div className="glass-card p-6 text-center" style={{ color: 'var(--text-secondary)' }}>No new announcements</div>
            ) : (
              recentAnnouncements.map(ann => (
                <div key={ann.id} className="glass-card p-4 cursor-pointer" style={{ borderLeft: ann.priority === 'Urgent' ? '4px solid var(--accent-danger)' : 'none' }} onClick={() => setActiveTab('announcements')}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>{ann.category}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(ann.date)}</span>
                  </div>
                  <h4 className="m-0 mb-1 text-base" style={{ color: 'var(--text-primary)' }}>{ann.title}</h4>
                  <p className="m-0 text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{ann.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AttendanceView({ 
  currentUser, 
  employees,
  attendance, 
  roster,
  shiftSwaps,
  setShiftSwaps,
  shiftTemplates,
  overtimeClaims,
  setOvertimeClaims,
  settings,
  addToast 
}) {
  const currentMonth = formatMonthYear(new Date().toISOString().split('T')[0])
  const [activeSubTab, setActiveSubTab] = useState('roster') // 'roster', 'swap', 'overtime'

  // Generate current week dates
  const today = new Date()
  const currentDay = today.getDay()
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
  const monday = new Date(today.setDate(diff))
  
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(d)
  }

  const myRoster = weekDates.map(date => {
    const dateStr = date.toISOString().split('T')[0]
    const shiftEntry = roster?.find(r => r.employeeId === currentUser.id && r.date === dateStr)
    const template = shiftTemplates?.find(t => t.id === shiftEntry?.templateId)
    return { date, dateStr, template }
  })

  // Swap Form States
  const [swapDate, setSwapDate] = useState('')
  const [swapColleague, setSwapColleague] = useState('')
  const [swapReason, setSwapReason] = useState('')

  const handleRequestSwap = (e) => {
    e.preventDefault()
    if (!swapDate || !swapColleague) return addToast('Please select date and colleague', 'warning')
    
    const newSwap = {
      id: `swap-${Date.now()}`,
      requesterId: currentUser.id,
      targetId: swapColleague,
      date: swapDate,
      reason: swapReason,
      status: 'Pending'
    }
    
    setShiftSwaps(prev => [...prev, newSwap])
    setSwapDate('')
    setSwapColleague('')
    setSwapReason('')
    addToast('Shift swap request sent to HR for approval.', 'success')
  }

  // Overtime Form States
  const [otDate, setOtDate] = useState('')
  const [otHours, setOtHours] = useState('')
  const [otReason, setOtReason] = useState('')

  const handleClaimOvertime = (e) => {
    e.preventDefault()
    if (!otDate || !otHours) return addToast('Please fill required fields', 'warning')

    const newClaim = {
      id: `ot-${Date.now()}`,
      employeeId: currentUser.id,
      date: otDate,
      hours: parseFloat(otHours),
      reason: otReason,
      status: 'Pending'
    }

    setOvertimeClaims(prev => [...prev, newClaim])
    setOtDate('')
    setOtHours('')
    setOtReason('')
    addToast('Overtime claim submitted for approval.', 'success')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1000px] mx-auto">
      <h2 className="m-0">My Attendance & Roster</h2>
      
      <div className="flex gap-3 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button className={`tab-btn px-4 py-2 rounded-lg border-0 font-semibold cursor-pointer ${activeSubTab === 'roster' ? 'active' : ''}`} style={{ background: activeSubTab === 'roster' ? 'var(--bg-secondary)' : 'transparent', color: activeSubTab === 'roster' ? 'var(--text-primary)' : 'var(--text-secondary)' }} onClick={() => setActiveSubTab('roster')}>My Schedule</button>
        <button className={`tab-btn px-4 py-2 rounded-lg border-0 font-semibold cursor-pointer ${activeSubTab === 'swap' ? 'active' : ''}`} style={{ background: activeSubTab === 'swap' ? 'var(--bg-secondary)' : 'transparent', color: activeSubTab === 'swap' ? 'var(--text-primary)' : 'var(--text-secondary)' }} onClick={() => setActiveSubTab('swap')}>Request Swap</button>
        <button className={`tab-btn px-4 py-2 rounded-lg border-0 font-semibold cursor-pointer ${activeSubTab === 'overtime' ? 'active' : ''}`} style={{ background: activeSubTab === 'overtime' ? 'var(--bg-secondary)' : 'transparent', color: activeSubTab === 'overtime' ? 'var(--text-primary)' : 'var(--text-secondary)' }} onClick={() => setActiveSubTab('overtime')}>Log Overtime</button>
      </div>

      {activeSubTab === 'roster' && (
        <div className="glass-card p-6 flex flex-col gap-4">
          <h3 className="m-0 text-lg">This Week ({currentMonth})</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            {myRoster.map(({ date, template }, i) => (
              <div key={i} className="p-4 rounded-lg flex flex-col gap-2" style={{ 
                border: `1px solid ${template ? template.color : 'var(--border-color)'}`,
                background: template ? `${template.color}15` : 'var(--bg-secondary)',
              }}>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDateWithWeekday(date.toISOString().split('T')[0])}</div>
                {template ? (
                  <>
                    <div className="font-bold" style={{ color: template.color }}>{template.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-primary)' }}>{template.start} - {template.end}</div>
                  </>
                ) : (
                  <div className="font-semibold" style={{ color: 'var(--text-muted)' }}>Off</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'swap' && (
        <div className="glass-card p-6 max-w-[600px]">
          <h3 className="m-0 mb-5 text-lg">Request Shift Swap</h3>
          <form onSubmit={handleRequestSwap} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Date to Swap</label>
              <input type="date" required value={swapDate} onChange={(e) => setSwapDate(e.target.value)} aria-label="Swap date" className="px-3.5 py-2.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
            </div>
            
            <Select label="Colleague to Swap With" value={swapColleague} onChange={setSwapColleague} placeholder="Select Colleague...">
              {employees?.filter(e => e.id !== currentUser.id && e.department === currentUser.department).map(emp => (
                <SelectItem key={emp.id} id={emp.id}>{emp.name}</SelectItem>
              ))}
            </Select>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Reason</label>
              <textarea rows={3} value={swapReason} onChange={(e) => setSwapReason(e.target.value)} className="px-3.5 py-2.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="Why do you need to swap?" aria-label="Swap reason" />
            </div>

            <button type="submit" className="btn btn-primary self-start mt-2">
              Submit Request
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'overtime' && (
        <div className="glass-card p-6 max-w-[600px]">
          <h3 className="m-0 mb-5 text-lg">Log Overtime</h3>
          <form onSubmit={handleClaimOvertime} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Date</label>
              <input type="date" required value={otDate} onChange={(e) => setOtDate(e.target.value)} aria-label="Overtime date" className="px-3.5 py-2.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Total Overtime Hours</label>
              <input type="number" step="0.5" required value={otHours} onChange={(e) => setOtHours(e.target.value)} aria-label="Overtime hours" className="px-3.5 py-2.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="e.g. 2.5" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Justification / Manager Name</label>
              <textarea rows={3} required value={otReason} onChange={(e) => setOtReason(e.target.value)} aria-label="Overtime justification" className="px-3.5 py-2.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="Explain work done..." />
            </div>

            <button type="submit" className="btn btn-primary self-start mt-2">
              Submit Overtime
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function PayslipsView({ currentUser, payroll, addToast }) {
  const myPayslips = (payroll?.history || []).filter(p => p.employeeId === currentUser.id)

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1000px] mx-auto">
      <h2 className="m-0">My Payslips</h2>
      
      {myPayslips.length === 0 ? (
        <div className="glass-card p-10 text-center" style={{ color: 'var(--text-secondary)' }}>
          No payslips available yet.
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myPayslips.map((slip, i) => (
                <tr key={i}>
                  <td>{slip.date}</td>
                  <td>${slip.gross}</td>
                  <td>${slip.deductions}</td>
                  <td className="font-semibold" style={{ color: 'var(--accent-success)' }}>${slip.net}</td>
                  <td>
                    <button className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => addToast('Downloading PDF...', 'info')}>
                      <Download size={14} className="inline mr-1" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LeaveView({ currentUser, attendance, setAttendance, addToast, addLog }) {
  const myLeaves = (attendance?.leaves || []).filter(l => l.employeeId === currentUser.id)
  
  const [type, setType] = useState('Annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [receiptName, setReceiptName] = useState('')

  const handleApply = (e) => {
    e.preventDefault()
    if (!startDate || !endDate) return addToast('Please select dates', 'warning')
    
    const newLeave = {
      id: `leave-${Date.now()}`,
      employeeId: currentUser.id,
      leaveType: type,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      receipt,
      receiptName
    }

    setAttendance(prev => ({ ...prev, leaves: [newLeave, ...(prev.leaves || [])] }))
    addToast('Leave request submitted successfully!', 'success')
    addLog('Leave Requested', `${currentUser.name} requested ${type} leave.`, 'info')
    setStartDate(''); setEndDate(''); setReason(''); setReceipt(null); setReceiptName('')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[1000px] mx-auto">
      <h2 className="m-0">My Leave</h2>
      
      <div className="glass-card p-6">
        <h3 className="mt-0">Apply for Leave</h3>
        <form onSubmit={handleApply} className="flex flex-col gap-4 max-w-[500px]">
          <Select value={type} onChange={setType} placeholder="Leave type">
            <SelectItem id="Annual">Annual</SelectItem>
            <SelectItem id="Sick">Sick</SelectItem>
            <SelectItem id="Casual">Casual</SelectItem>
            <SelectItem id="Unpaid">Unpaid</SelectItem>
          </Select>
          <div className="flex gap-4">
            <input type="date" className="form-input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} required aria-label="Leave start date" />
            <input type="date" className="form-input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} required aria-label="Leave end date" />
          </div>
          <textarea className="form-input" placeholder="Reason / Handover notes" rows="3" value={reason} onChange={e => setReason(e.target.value)} required aria-label="Leave reason" />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Attach Receipt / Medical Certificate</label>
            <div className="flex items-center gap-3">
              <label 
                className="btn btn-secondary m-0 px-4 py-2.5 inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-sm"
              >
                <Upload size={16} /> 
                <span>{receiptName ? 'Change Document' : 'Upload File'}</span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReceiptName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setReceipt(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
              {receiptName && (
                <span className="text-sm truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                  {receiptName}
                </span>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary self-start"><Send size={16} /> Submit Request</button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h3 className="mt-0">Application History</h3>
        <div className="table-container">
          <table className="w-full table-striped w-full border-collapse">
            <thead>
              <tr className="text-left" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="p-3">Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Receipt</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-3">{l.leaveType}</td>
                  <td className="p-3">{l.startDate} to {l.endDate}</td>
                  <td className="p-3">{l.reason}</td>
                  <td className="p-3">
                    {l.receipt ? (
                      <a href={l.receipt} target="_blank" rel="noreferrer" className="font-semibold inline-flex items-center gap-1 min-h-[44px]" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                        <FileText size={14} /> View
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>None</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{ 
                      background: l.status === 'Approved' ? 'rgba(34, 197, 94, 0.2)' : l.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                      color: l.status === 'Approved' ? 'var(--accent-success)' : l.status === 'Rejected' ? 'var(--accent-danger)' : 'var(--accent-warning)'
                    }}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {myLeaves.length === 0 && <tr><td colSpan="5" className="p-3 text-center" style={{ color: 'var(--text-secondary)' }}>No leave history found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ProfileView({ currentUser, pendingProfileEdits, setPendingProfileEdits, addToast, addLog }) {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    personalEmail: currentUser.personalEmail || '',
    phone: currentUser.phone || '',
    address: currentUser.address || '',
    emergencyContact: currentUser.emergencyContact || ''
  })

  const hasPending = pendingProfileEdits?.some(e => e.employeeId === currentUser.id)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (hasPending) return addToast('You already have a pending edit request.', 'warning')
    
    setPendingProfileEdits(prev => [...(prev || []), {
      id: `edit-${Date.now()}`,
      employeeId: currentUser.id,
      timestamp: new Date().toISOString(),
      changes: formData
    }])

    setEditMode(false)
    addToast('Profile update submitted for HR review.', 'success')
    addLog('Profile Edit Requested', `${currentUser.name} requested to update their profile info.`, 'info')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[800px] mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="m-0">My Profile</h2>
        {!editMode && !hasPending && (
          <button className="btn btn-secondary" onClick={() => setEditMode(true)}>Edit Details</button>
        )}
      </div>

      {hasPending && (
        <div className="p-4 rounded flex gap-3 items-center" style={{ background: 'rgba(234, 179, 8, 0.1)', borderLeft: '4px solid var(--accent-warning)', color: 'var(--text-primary)' }}>
          <AlertCircle style={{ color: 'var(--accent-warning)' }} />
          <span>You have pending profile updates waiting for HR approval.</span>
        </div>
      )}

      <div className="glass-card p-6 flex gap-6 items-start">
        {getInitialsAvatar(currentUser.name)}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <div className="font-medium">{currentUser.name}</div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Employee ID</label>
            <div className="font-medium">{currentUser.id}</div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Department</label>
            <div className="font-medium">{currentUser.department}</div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Role</label>
            <div className="font-medium">{currentUser.role}</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mt-0 mb-5">Contact & Personal Information</h3>
        
        {editMode ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Personal Email</label>
              <input type="email" className="form-input" value={formData.personalEmail} onChange={e => setFormData(p => ({...p, personalEmail: e.target.value}))} aria-label="Personal email" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
              <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} aria-label="Phone number" />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Address</label>
              <input type="text" className="form-input" value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} aria-label="Address" />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Emergency Contact</label>
              <input type="text" className="form-input" value={formData.emergencyContact} onChange={e => setFormData(p => ({...p, emergencyContact: e.target.value}))} aria-label="Emergency contact" />
            </div>
            <div className="col-span-2 flex gap-3 mt-2">
              <button type="submit" className="btn btn-primary">Submit for Approval</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Personal Email</label>
              <div className="font-medium">{currentUser.personalEmail || '-'}</div>
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
              <div className="font-medium">{currentUser.phone || '-'}</div>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Address</label>
              <div className="font-medium">{currentUser.address || '-'}</div>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Emergency Contact</label>
              <div className="font-medium">{currentUser.emergencyContact || '-'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Announcements Feed View
// ----------------------------------------------------------------------
function AnnouncementsFeedView({ currentUser, employees, announcements, setAnnouncements, addToast }) {
  const [filter, setFilter] = useState('All')

  const handleReaction = (postId, emoji) => {
    setAnnouncements(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [emoji]: (post.reactions[emoji] || 0) + 1
          }
        }
      }
      return post
    }))
  }

  const handleVote = (postId, optionIndex) => {
    setAnnouncements(prev => prev.map(post => {
      if (post.id === postId && post.poll) {
        // Prevent double voting
        const hasVoted = post.poll.options.some(o => o.votes.includes(currentUser.id))
        if (hasVoted) {
          addToast('You have already voted on this poll', 'warning')
          return post
        }
        
        const newOptions = [...post.poll.options]
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          votes: [...newOptions[optionIndex].votes, currentUser.id]
        }
        return { ...post, poll: { ...post.poll, options: newOptions } }
      }
      return post
    }))
  }

  // Mark as read when rendering (simplistic approach for now)
  useEffect(() => {
    setAnnouncements(prev => prev.map(post => {
      if (!post.readBy.includes(currentUser.id)) {
        return { ...post, readBy: [...post.readBy, currentUser.id] }
      }
      return post
    }))
  }, [])

  const visiblePosts = (announcements || [])
    .filter(a => a.audience === 'all' || a.audience === currentUser.department)
    .filter(a => filter === 'All' || a.category === filter)
    .sort((a, b) => {
      if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1
      if (b.priority === 'Urgent' && a.priority !== 'Urgent') return 1
      return new Date(b.date) - new Date(a.date)
    })

  const getPriorityColor = (p) => {
    if (p === 'Urgent') return 'var(--accent-danger)'
    if (p === 'Important') return 'var(--accent-warning)'
    return 'var(--accent-primary)'
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[800px] mx-auto pb-10">
      <div className="flex justify-between items-center">
        <h2 className="m-0 flex items-center gap-3">
          <Megaphone size={24} color="var(--accent-primary)" />
          Company Feed
        </h2>
        <Select value={filter} onChange={setFilter} placeholder="All Categories">
          <SelectItem id="All">All Categories</SelectItem>
          <SelectItem id="General">General</SelectItem>
          <SelectItem id="Policy Update">Policy Update</SelectItem>
          <SelectItem id="Event">Event</SelectItem>
          <SelectItem id="Achievement/Birthday/Work Anniversary">Celebrations</SelectItem>
          <SelectItem id="Emergency">Emergency</SelectItem>
        </Select>
      </div>

      <div className="flex flex-col gap-6">
        {visiblePosts.length === 0 ? (
          <div className="glass-card p-10 text-center" style={{ color: 'var(--text-secondary)' }}>
            No announcements found in this category.
          </div>
        ) : (
          visiblePosts.map(post => {
            const author = post.authorId === 'system' ? { name: 'System Auto-Post', avatar: '' } : employees.find(e => e.id === post.authorId) || { name: 'Unknown User' }
            const dateStr = formatDateTime(post.date)
            const isUrgent = post.priority === 'Urgent'

            return (
              <div key={post.id} className="glass-card p-6 relative" style={{ borderLeft: `4px solid ${getPriorityColor(post.priority)}` }}>
                {isUrgent && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-xl text-[0.7rem] font-bold uppercase" style={{ background: 'var(--accent-danger)', color: '#fff' }}>
                    Pinned
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {author.avatar ? (
                      <img src={author.avatar} alt="" className="size-10 rounded-full object-cover" />
                    ) : (
                      <div className="size-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        <Megaphone size={20} />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{author.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{dateStr}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {post.category}
                  </span>
                </div>

                <h3 className="m-0 mb-3 text-xl" style={{ color: 'var(--text-primary)' }}>{post.title}</h3>
                <div className="text-sm" style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {post.content}
                </div>

                {post.poll && (
                  <div className="mt-5 p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <h4 className="m-0 mb-4 text-base" style={{ color: 'var(--text-primary)' }}>📊 {post.poll.question}</h4>
                    <div className="flex flex-col gap-3">
                      {post.poll.options.map((opt, i) => {
                        const hasVoted = post.poll.options.some(o => o.votes.includes(currentUser.id))
                        const iVoted = opt.votes.includes(currentUser.id)
                        const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0)
                        const pct = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100)

                        if (hasVoted) {
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="flex-1 relative overflow-hidden rounded h-8" style={{ background: 'var(--bg-tertiary)' }}>
                                <div className="absolute top-0 left-0 h-full" style={{ width: `${pct}%`, background: iVoted ? 'var(--accent-success)' : 'var(--accent-primary)', opacity: 0.2 }}></div>
                                <div className="absolute inset-0 flex items-center px-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                  {opt.text} {iVoted && ' (Your Vote)'}
                                </div>
                              </div>
                              <div className="w-10 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>{pct}%</div>
                            </div>
                          )
                        } else {
                          return (
                            <button key={i} className="btn btn-secondary text-left p-3 px-4" onClick={() => handleVote(post.id, i)}>
                              {opt.text}
                            </button>
                          )
                        }
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-secondary px-3 py-1.5 flex items-center gap-2 text-sm" onClick={() => handleReaction(post.id, '👍')}>
                    <ThumbsUp size={16} /> {post.reactions['👍']}
                  </button>
                  <button className="btn btn-secondary px-3 py-1.5 flex items-center gap-2 text-sm" onClick={() => handleReaction(post.id, '❤️')}>
                    <Heart size={16} /> {post.reactions['❤️']}
                  </button>
                  <button className="btn btn-secondary px-3 py-1.5 flex items-center gap-2 text-sm" onClick={() => handleReaction(post.id, '🎉')}>
                    <PartyPopper size={16} /> {post.reactions['🎉']}
                  </button>
                  
                  <div className="flex-1"></div>
                  
                  <button className="btn btn-secondary px-3 py-1.5 flex items-center gap-2 text-sm" onClick={() => addToast('Comments coming soon', 'info')}>
                    <MessageSquare size={16} /> Comment
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// My Assets View (Employee)
// ----------------------------------------------------------------------
function MyAssetsView({ currentUser, assets, setAssets, assetRequests, setAssetRequests, addToast }) {
  const [activeTab, setActiveTab] = useState('assigned') // 'assigned', 'request'
  const [requestForm, setRequestForm] = useState({ category: 'Laptop', justification: '', urgency: 'Medium' })
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueAsset, setIssueAsset] = useState(null)
  const [issueText, setIssueText] = useState('')

  const myAssets = (assets || []).filter(a => a.assignedTo === currentUser.id && a.status === 'Assigned')
  const myRequests = (assetRequests || []).filter(r => r.employeeId === currentUser.id)

  const handleReportIssue = (e) => {
    e.preventDefault()
    setAssets(prev => prev.map(a => {
      if (a.id === issueAsset.id) {
        return {
          ...a,
          status: 'Under Repair',
          maintenanceLogs: [...(a.maintenanceLogs || []), {
            id: `maint-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            issue: issueText,
            cost: 0,
            vendor: 'Reported by Employee',
            status: 'In Progress'
          }]
        }
      }
      return a
    }))
    setIssueText('')
    setShowIssueModal(false)
    addToast('Issue reported. IT will follow up shortly.', 'success')
  }

  const handleRequestReturn = (assetId) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return { ...a, status: 'Available', assignedTo: null, assignmentDate: null }
      }
      return a
    }))
    addToast('Return request submitted. Please hand over the device to IT/HR.', 'info')
  }

  const handleSubmitRequest = (e) => {
    e.preventDefault()
    const newReq = {
      id: `AREQ-${Date.now()}`,
      employeeId: currentUser.id,
      category: requestForm.category,
      justification: requestForm.justification,
      urgency: requestForm.urgency,
      status: 'Pending',
      date: new Date().toISOString()
    }
    setAssetRequests(prev => [newReq, ...prev])
    setRequestForm({ category: 'Laptop', justification: '', urgency: 'Medium' })
    addToast('Asset request submitted to IT/HR', 'success')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-[900px] mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="m-0 flex items-center gap-3">
          <Monitor size={24} color="var(--accent-primary)" />
          My Assets
        </h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border-0 font-semibold cursor-pointer" style={{ background: activeTab === 'assigned' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'assigned' ? 'var(--text-primary)' : 'var(--text-secondary)' }} onClick={() => setActiveTab('assigned')}>
            Assigned to Me
          </button>
          <button className="px-4 py-2 rounded-lg border-0 font-semibold cursor-pointer" style={{ background: activeTab === 'request' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'request' ? 'var(--text-primary)' : 'var(--text-secondary)' }} onClick={() => setActiveTab('request')}>
            Request Equipment
          </button>
        </div>
      </div>

      {activeTab === 'assigned' && (
        <div className="flex flex-col gap-4">
          {myAssets.length === 0 ? (
            <div className="glass-card p-10 text-center" style={{ color: 'var(--text-secondary)' }}>
              No assets are currently assigned to you.
            </div>
          ) : (
            myAssets.map(asset => (
              <div key={asset.id} className="glass-card p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                    <Monitor size={24} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{asset.name}</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.category} · SN: {asset.serialNumber}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Assigned: {asset.assignmentDate} · Condition: {asset.condition}
                    </div>
                    {asset.warrantyExpiry && (
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Warranty until: {asset.warrantyExpiry}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-secondary px-4 py-2 text-sm flex items-center gap-1.5" style={{ color: 'var(--accent-warning)' }} onClick={() => { setIssueAsset(asset); setShowIssueModal(true) }}>
                    <AlertTriangle size={14} /> Report Issue
                  </button>
                  <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => handleRequestReturn(asset.id)}>
                    Request Return
                  </button>
                </div>
              </div>
            ))
          )}

          {myRequests.length > 0 && (
            <div className="mt-2">
              <h4 className="m-0 mb-3" style={{ color: 'var(--text-secondary)' }}>My Past Requests</h4>
              {myRequests.map(req => (
                <div key={req.id} className="glass-card p-4 mb-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{req.category}</span>
                    <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>"{req.justification}"</span>
                  </div>
                  <span className={`badge ${req.status === 'Approved' ? 'badge-success' : req.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{req.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'request' && (
        <div className="glass-card p-6">
          <h3 className="m-0 mb-5">Request New Equipment</h3>
          <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
            <Select label="Equipment Category" value={requestForm.category} onChange={(val) => setRequestForm(p => ({...p, category: val}))}>
              <SelectItem id="Laptop">Laptop</SelectItem>
              <SelectItem id="Phone">Phone</SelectItem>
              <SelectItem id="Monitor">Monitor</SelectItem>
              <SelectItem id="Peripherals">Peripherals</SelectItem>
              <SelectItem id="Access Card">Access Card</SelectItem>
            </Select>
            <Select label="Urgency Level" value={requestForm.urgency} onChange={(val) => setRequestForm(p => ({...p, urgency: val}))}>
              <SelectItem id="Low">Low</SelectItem>
              <SelectItem id="Medium">Medium</SelectItem>
              <SelectItem id="High">High</SelectItem>
            </Select>
            <div className="form-group">
              <label>Justification</label>
              <textarea required rows={4} className="form-input" placeholder="Explain why you need this equipment..." value={requestForm.justification} onChange={e => setRequestForm(p => ({...p, justification: e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary self-start">Submit Request</button>
          </form>
        </div>
      )}

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card fade-in max-w-[500px] w-full">
            <h3 className="mt-0">Report Issue: {issueAsset?.name}</h3>
            <form onSubmit={handleReportIssue} className="flex flex-col gap-4">
              <textarea required rows={5} className="form-input" placeholder="Describe the issue in detail..." value={issueText} onChange={e => setIssueText(e.target.value)} />
              <div className="flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
