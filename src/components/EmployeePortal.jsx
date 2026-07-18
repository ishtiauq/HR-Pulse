import { useState, useEffect } from 'react'
import { Home, Calendar as CalendarIcon, FileText, User as UserIcon, Plus, Send, Download, CheckCircle2, XCircle, Clock, AlertCircle, Megaphone, MessageSquare, Heart, ThumbsUp, PartyPopper } from 'lucide-react'

// Dummy profile image generation based on initials
const getInitialsAvatar = (name) => {
  const parts = name.split(' ')
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]
  
  // Deterministic color
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const h = hash % 360
  
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '50%', 
      background: `hsl(${h}, 70%, 80%)`, color: `hsl(${h}, 70%, 20%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', fontSize: '1rem', flexShrink: 0
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
  settings
}) {
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, attendance, payslips, leave, profile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!currentUser) {
    return <div style={{ padding: '20px' }}>Loading portal...</div>
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
      default:
        return <DashboardView currentUser={currentUser} attendance={attendance} expenses={expenses} announcements={announcements} setActiveTab={setActiveTab} />
    }
  }

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'announcements', icon: Megaphone, label: 'Feed' },
    { id: 'attendance', icon: Clock, label: 'Attendance' },
    { id: 'payslips', icon: FileText, label: 'Payslips' },
    { id: 'leave', icon: CalendarIcon, label: 'Leave' },
    { id: 'profile', icon: UserIcon, label: 'Profile' }
  ]

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'var(--bg-primary)', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {/* Sidebar (Desktop) */}
      {!isMobile && (
        <div style={{ width: '250px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
          <div style={{ marginBottom: '32px', padding: '0 12px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', margin: 0 }}>HR Pulse <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ESS</span></h2>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map(item => {
              const active = activeTab === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                    borderRadius: '8px', border: 'none', background: active ? 'var(--bg-tertiary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary)', cursor: 'pointer',
                    fontWeight: active ? 600 : 500, transition: 'all 0.2s', textAlign: 'left'
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
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px', paddingBottom: isMobile ? '80px' : '32px' }}>
        {renderContent()}
      </div>

      {/* Bottom Tab Bar (Mobile) */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '12px 8px', zIndex: 100,
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 41, 59, 0.85)'
        }}>
          {navItems.map(item => {
            const active = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              >
                <Icon size={20} />
                <span style={{ fontSize: '0.65rem', fontWeight: active ? 600 : 500 }}>{item.label}</span>
              </button>
            )
          })}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        {getInitialsAvatar(currentUser.name)}
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Welcome back, {currentUser.name}!</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentUser.department} • {currentUser.role}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Annual Leave Balance</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentBalances.annual.limit - currentBalances.annual.used} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {currentBalances.annual.limit} days</span>
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Sick Leave Balance</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentBalances.sick.limit - currentBalances.sick.used} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {currentBalances.sick.limit} days</span>
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Pending Reimbursements</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${totalPending.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <button className="btn btn-secondary" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }} onClick={() => setActiveTab('leave')}>
              <CalendarIcon size={24} style={{ color: 'var(--accent-primary)' }} />
              Request Leave
            </button>
            <button className="btn btn-secondary" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }} onClick={() => setActiveTab('payslips')}>
              <Download size={24} style={{ color: 'var(--accent-success)' }} />
              Download Payslip
            </button>
            <button className="btn btn-secondary" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }} onClick={() => alert('Biometric scan active or request manual punch.')}>
              <Clock size={24} style={{ color: 'var(--accent-warning)' }} />
              Mark Attendance
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Company Feed</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('announcements')}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentAnnouncements.length === 0 ? (
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No new announcements</div>
            ) : (
              recentAnnouncements.map(ann => (
                <div key={ann.id} className="glass-card" style={{ padding: '16px', borderLeft: ann.priority === 'Urgent' ? '4px solid var(--accent-danger)' : 'none', cursor: 'pointer' }} onClick={() => setActiveTab('announcements')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{ann.category}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(ann.date).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{ann.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ann.content}</p>
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
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>My Attendance & Roster</h2>
      
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button className={`tab-btn ${activeSubTab === 'roster' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeSubTab === 'roster' ? 'var(--bg-secondary)' : 'transparent', color: activeSubTab === 'roster' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveSubTab('roster')}>My Schedule</button>
        <button className={`tab-btn ${activeSubTab === 'swap' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeSubTab === 'swap' ? 'var(--bg-secondary)' : 'transparent', color: activeSubTab === 'swap' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveSubTab('swap')}>Request Swap</button>
        <button className={`tab-btn ${activeSubTab === 'overtime' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeSubTab === 'overtime' ? 'var(--bg-secondary)' : 'transparent', color: activeSubTab === 'overtime' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveSubTab('overtime')}>Log Overtime</button>
      </div>

      {activeSubTab === 'roster' && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>This Week ({currentMonth})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            {myRoster.map(({ date, template }, i) => (
              <div key={i} style={{ 
                padding: '16px', 
                borderRadius: '8px', 
                border: `1px solid ${template ? template.color : 'var(--border-color)'}`,
                background: template ? `${template.color}15` : 'var(--bg-secondary)',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                {template ? (
                  <>
                    <div style={{ fontWeight: 700, color: template.color }}>{template.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{template.start} - {template.end}</div>
                  </>
                ) : (
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Off</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'swap' && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Request Shift Swap</h3>
          <form onSubmit={handleRequestSwap} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date to Swap</label>
              <input type="date" required value={swapDate} onChange={(e) => setSwapDate(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Colleague to Swap With</label>
              <select required value={swapColleague} onChange={(e) => setSwapColleague(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                <option value="">Select Colleague...</option>
                {employees?.filter(e => e.id !== currentUser.id && e.department === currentUser.department).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reason</label>
              <textarea rows={3} value={swapReason} onChange={(e) => setSwapReason(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="Why do you need to swap?" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
              Submit Request
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'overtime' && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Log Overtime</h3>
          <form onSubmit={handleClaimOvertime} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</label>
              <input type="date" required value={otDate} onChange={(e) => setOtDate(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Overtime Hours</label>
              <input type="number" step="0.5" required value={otHours} onChange={(e) => setOtHours(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="e.g. 2.5" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Justification / Manager Name</label>
              <textarea rows={3} required value={otReason} onChange={(e) => setOtReason(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="Explain work done..." />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>My Payslips</h2>
      
      {myPayslips.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No payslips available yet.
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full">
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
                  <td style={{ fontWeight: 600, color: 'var(--accent-success)' }}>${slip.net}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => addToast('Downloading PDF...', 'info')}>
                      <Download size={14} style={{ display: 'inline', marginRight: '4px' }} /> PDF
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
      status: 'Pending'
    }

    setAttendance(prev => ({ ...prev, leaves: [newLeave, ...(prev.leaves || [])] }))
    addToast('Leave request submitted successfully!', 'success')
    addLog('Leave Requested', `${currentUser.name} requested ${type} leave.`, 'info')
    setStartDate(''); setEndDate(''); setReason('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>My Leave</h2>
      
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ marginTop: 0 }}>Apply for Leave</h3>
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
          <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
            <option>Annual</option>
            <option>Sick</option>
            <option>Casual</option>
            <option>Unpaid</option>
          </select>
          <div style={{ display: 'flex', gap: '16px' }}>
            <input type="date" className="form-input" style={{ flex: 1 }} value={startDate} onChange={e => setStartDate(e.target.value)} required />
            <input type="date" className="form-input" style={{ flex: 1 }} value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
          <textarea className="form-input" placeholder="Reason / Handover notes" rows="3" value={reason} onChange={e => setReason(e.target.value)} required />
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><Send size={16} /> Submit Request</button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ marginTop: 0 }}>Application History</h3>
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.map(l => (
                <tr key={l.id}>
                  <td>{l.leaveType}</td>
                  <td>{l.startDate} to {l.endDate}</td>
                  <td>{l.reason}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                      background: l.status === 'Approved' ? 'rgba(34, 197, 94, 0.2)' : l.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                      color: l.status === 'Approved' ? 'var(--accent-success)' : l.status === 'Rejected' ? 'var(--accent-danger)' : 'var(--accent-warning)'
                    }}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {myLeaves.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No leave history found.</td></tr>}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>My Profile</h2>
        {!editMode && !hasPending && (
          <button className="btn btn-secondary" onClick={() => setEditMode(true)}>Edit Details</button>
        )}
      </div>

      {hasPending && (
        <div style={{ background: 'rgba(234, 179, 8, 0.1)', borderLeft: '4px solid var(--accent-warning)', padding: '16px', borderRadius: '4px', color: 'var(--text-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle style={{ color: 'var(--accent-warning)' }} />
          <span>You have pending profile updates waiting for HR approval.</span>
        </div>
      )}

      <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {getInitialsAvatar(currentUser.name)}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name</label>
            <div style={{ fontWeight: 500 }}>{currentUser.name}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Employee ID</label>
            <div style={{ fontWeight: 500 }}>{currentUser.id}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</label>
            <div style={{ fontWeight: 500 }}>{currentUser.department}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Role</label>
            <div style={{ fontWeight: 500 }}>{currentUser.role}</div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Contact & Personal Information</h3>
        
        {editMode ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Personal Email</label>
              <input type="email" className="form-input" value={formData.personalEmail} onChange={e => setFormData(p => ({...p, personalEmail: e.target.value}))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Number</label>
              <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Address</label>
              <input type="text" className="form-input" value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Emergency Contact</label>
              <input type="text" className="form-input" value={formData.emergencyContact} onChange={e => setFormData(p => ({...p, emergencyContact: e.target.value}))} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">Submit for Approval</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Personal Email</label>
              <div style={{ fontWeight: 500 }}>{currentUser.personalEmail || '-'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</label>
              <div style={{ fontWeight: 500 }}>{currentUser.phone || '-'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Address</label>
              <div style={{ fontWeight: 500 }}>{currentUser.address || '-'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Emergency Contact</label>
              <div style={{ fontWeight: 500 }}>{currentUser.emergencyContact || '-'}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Megaphone size={24} color="var(--accent-primary)" />
          Company Feed
        </h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <option value="All">All Categories</option>
          <option value="General">General</option>
          <option value="Policy Update">Policy Update</option>
          <option value="Event">Event</option>
          <option value="Achievement/Birthday/Work Anniversary">Celebrations</option>
          <option value="Emergency">Emergency</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {visiblePosts.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No announcements found in this category.
          </div>
        ) : (
          visiblePosts.map(post => {
            const author = post.authorId === 'system' ? { name: 'System Auto-Post', avatar: '' } : employees.find(e => e.id === post.authorId) || { name: 'Unknown User' }
            const dateStr = new Date(post.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            const isUrgent = post.priority === 'Urgent'

            return (
              <div key={post.id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${getPriorityColor(post.priority)}`, position: 'relative' }}>
                {isUrgent && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-danger)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                    Pinned
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {author.avatar ? (
                      <img src={author.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <Megaphone size={20} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{author.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dateStr}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {post.category}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{post.title}</h3>
                <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {post.content}
                </div>

                {post.poll && (
                  <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>📊 {post.poll.question}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {post.poll.options.map((opt, i) => {
                        const hasVoted = post.poll.options.some(o => o.votes.includes(currentUser.id))
                        const iVoted = opt.votes.includes(currentUser.id)
                        const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0)
                        const pct = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100)

                        if (hasVoted) {
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: '4px', height: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, background: iVoted ? 'var(--accent-success)' : 'var(--accent-primary)', opacity: 0.2 }}></div>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {opt.text} {iVoted && ' (Your Vote)'}
                                </div>
                              </div>
                              <div style={{ width: '40px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{pct}%</div>
                            </div>
                          )
                        } else {
                          return (
                            <button key={i} className="btn btn-secondary" style={{ textAlign: 'left', padding: '12px 16px' }} onClick={() => handleVote(post.id, i)}>
                              {opt.text}
                            </button>
                          )
                        }
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }} onClick={() => handleReaction(post.id, '👍')}>
                    <ThumbsUp size={16} /> {post.reactions['👍']}
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }} onClick={() => handleReaction(post.id, '❤️')}>
                    <Heart size={16} /> {post.reactions['❤️']}
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }} onClick={() => handleReaction(post.id, '🎉')}>
                    <PartyPopper size={16} /> {post.reactions['🎉']}
                  </button>
                  
                  <div style={{ flex: 1 }}></div>
                  
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }} onClick={() => addToast('Comments coming soon', 'info')}>
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
