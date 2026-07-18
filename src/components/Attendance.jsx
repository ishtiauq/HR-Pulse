import { useState } from 'react'
import { Calendar, Check, X, ClipboardList, Clock, CheckCircle2, AlertCircle, Plus, CalendarDays, BarChart3, ChevronLeft, ChevronRight, Cpu, Download, FileSpreadsheet, FileText, User, CheckSquare, Trash2, History, MessageSquare, Repeat } from 'lucide-react'
import AdSlot from './AdSlot.jsx'
import { formatDateShort } from '../services/date.js'

export default function Attendance({ 
  employees, 
  attendance, 
  setAttendance,
  roster,
  setRoster,
  shiftSwaps,
  setShiftSwaps,
  shiftTemplates,
  overtimeClaims,
  setOvertimeClaims,
  addLog, 
  driveConnected, 
  addToast, 
  addNotification, 
  simulatedRole, 
  addAuditLog 
}) {
  const [activeTab, setActiveTab] = useState('roster') // 'roster', 'swaps', 'overtime', 'requests'
  const [viewMode, setViewMode] = useState('manager') // 'manager' or 'employee'

  const leaves = attendance.leaves || []

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">
          <Calendar size={28} className="page-title-icon" />
          Roster & Attendance
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('roster')}
          className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: activeTab === 'roster' ? 'var(--bg-secondary)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'roster' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'roster' ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <CalendarDays size={18} /> Roster Planner
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`tab-btn ${activeTab === 'swaps' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: activeTab === 'swaps' ? 'var(--bg-secondary)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'swaps' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'swaps' ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Repeat size={18} /> Shift Swaps
          {shiftSwaps?.filter(s => s.status === 'Pending').length > 0 && (
            <span style={{ background: 'var(--accent-warning)', color: '#000', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
              {shiftSwaps.filter(s => s.status === 'Pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('overtime')}
          className={`tab-btn ${activeTab === 'overtime' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: activeTab === 'overtime' ? 'var(--bg-secondary)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'overtime' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'overtime' ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Clock size={18} /> Overtime Claims
          {overtimeClaims?.filter(c => c.status === 'Pending').length > 0 && (
            <span style={{ background: 'var(--accent-warning)', color: '#000', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
              {overtimeClaims.filter(c => c.status === 'Pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: activeTab === 'requests' ? 'var(--bg-secondary)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'requests' ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <ClipboardList size={18} /> Leave Requests
          {leaves?.filter(l => l.status === 'Pending').length > 0 && (
            <span style={{ background: 'var(--accent-warning)', color: '#000', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
              {leaves.filter(l => l.status === 'Pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: activeTab === 'daily' ? 'var(--bg-secondary)' : 'transparent', border: 'none', borderRadius: '8px', color: activeTab === 'daily' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'daily' ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <Clock size={18} /> Daily Attendance Logs
        </button>
      </div>

      {activeTab === 'roster' && (
        <RosterPlanner 
          employees={employees} 
          roster={roster} 
          setRoster={setRoster} 
          shiftTemplates={shiftTemplates} 
          addToast={addToast}
        />
      )}

      {activeTab === 'swaps' && (
        <ShiftSwaps
          employees={employees}
          shiftSwaps={shiftSwaps}
          setShiftSwaps={setShiftSwaps}
          roster={roster}
          setRoster={setRoster}
          addToast={addToast}
        />
      )}

      {activeTab === 'overtime' && (
        <OvertimeClaims
          employees={employees}
          overtimeClaims={overtimeClaims}
          setOvertimeClaims={setOvertimeClaims}
          addToast={addToast}
        />
      )}

      {activeTab === 'requests' && (
        <LeaveRequests 
          employees={employees} 
          attendance={attendance} 
          setAttendance={setAttendance} 
          addToast={addToast} 
        />
      )}

      {activeTab === 'daily' && (
        <DailyAttendance 
          employees={employees} 
          attendance={attendance} 
          setAttendance={setAttendance} 
          addToast={addToast}
        />
      )}
      
      <AdSlot type="horizontal" style={{ marginTop: '20px' }} />
    </div>
  )
}

// ----------------------------------------------------------------------
// Roster Planner Component
// ----------------------------------------------------------------------
function RosterPlanner({ employees, roster, setRoster, shiftTemplates, addToast }) {
  const [weekOffset, setWeekOffset] = useState(0)

  // Generate current week dates (Mon-Sun)
  const getWeekDates = (offset) => {
    const today = new Date()
    const currentDay = today.getDay()
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) // Adjust for Sunday (0)
    const monday = new Date(today.setDate(diff + (offset * 7)))
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const weekDates = getWeekDates(weekOffset)

  // Handlers
  const handleAssignShift = (empId, dateStr, templateId) => {
    const newEntry = { employeeId: empId, date: dateStr, templateId }
    
    // Conflict Detection (< 8 hours rest)
    if (templateId !== 'Off') {
      const prevDate = new Date(dateStr)
      prevDate.setDate(prevDate.getDate() - 1)
      const prevDateStr = prevDate.toISOString().split('T')[0]
      const prevShiftEntry = (roster || []).find(r => r.employeeId === empId && r.date === prevDateStr)
      
      if (prevShiftEntry && prevShiftEntry.templateId !== 'Off') {
        const prevTemp = (shiftTemplates || []).find(t => t.id === prevShiftEntry.templateId)
        const currTemp = (shiftTemplates || []).find(t => t.id === templateId)
        
        if (prevTemp && currTemp) {
          // Simplistic rest check logic (assuming same-day shifts for start times)
          const prevEndHour = parseInt(prevTemp.end.split(':')[0])
          const currStartHour = parseInt(currTemp.start.split(':')[0])
          
          let restHours = currStartHour - prevEndHour
          if (restHours < 0) restHours += 24 // crossing midnight roughly

          if (restHours < 8) {
            addToast(`Conflict warning: Less than 8 hours rest for ${employees.find(e=>e.id===empId)?.name}`, 'warning')
          }
        }
      }
    }

    setRoster(prev => {
      const filtered = prev.filter(r => !(r.employeeId === empId && r.date === dateStr))
      return [...filtered, newEntry]
    })
  }

  const handleCopyPreviousWeek = () => {
    const prevWeekDates = getWeekDates(weekOffset - 1).map(d => d.toISOString().split('T')[0])
    const currWeekDates = weekDates.map(d => d.toISOString().split('T')[0])
    
    let newEntries = []
    employees.forEach(emp => {
      for(let i=0; i<7; i++) {
        const prevEntry = (roster || []).find(r => r.employeeId === emp.id && r.date === prevWeekDates[i])
        if (prevEntry) {
          newEntries.push({ employeeId: emp.id, date: currWeekDates[i], templateId: prevEntry.templateId })
        }
      }
    })

    if (newEntries.length === 0) return addToast('No shifts found in the previous week to copy.', 'warning')
    
    setRoster(prev => {
      // Remove any existing entries for this week to overwrite
      const currWeekSet = new Set(currWeekDates)
      const filtered = prev.filter(r => !currWeekSet.has(r.date))
      return [...filtered, ...newEntries]
    })
    addToast('Copied previous week roster.', 'success')
  }

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Weekly Roster Planner</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={handleCopyPreviousWeek}>
            <CalendarDays size={16} /> Copy Prev Week
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setWeekOffset(o => o - 1)}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 8px' }}>
              {formatDateShort(weekDates[0].toISOString().split('T')[0])} - {formatDateShort(weekDates[6].toISOString().split('T')[0])}
            </span>
            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setWeekOffset(o => o + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="table-container" style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <table className="table-responsive table-striped" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', width: '200px' }}>Employee</th>
              {weekDates.map(date => (
                <th key={date.toISOString()} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}<br/>
                  <span style={{ color: 'var(--text-muted)' }}>{formatDateShort(date.toISOString().split('T')[0])}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {emp.name}
                  </div>
                </td>
                {weekDates.map(date => {
                  const dateStr = date.toISOString().split('T')[0]
                  const shiftEntry = (roster || []).find(r => r.employeeId === emp.id && r.date === dateStr)
                  const currentTemplateId = shiftEntry?.templateId || 'Off'
                  const currentTemplate = (shiftTemplates || []).find(t => t.id === currentTemplateId)
                  
                  return (
                    <td key={dateStr} style={{ padding: '8px', textAlign: 'center' }}>
                      <select 
                        value={currentTemplateId}
                        onChange={(e) => handleAssignShift(emp.id, dateStr, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: currentTemplate ? `${currentTemplate.color}15` : 'var(--bg-secondary)',
                          color: currentTemplate ? currentTemplate.color : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: currentTemplate ? 700 : 500,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Off">Off</option>
                        {(shiftTemplates || []).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Shift Swaps Component
// ----------------------------------------------------------------------
function ShiftSwaps({ employees, shiftSwaps, setShiftSwaps, roster, setRoster, addToast }) {
  const pendingSwaps = (shiftSwaps || []).filter(s => s.status === 'Pending')
  
  const handleApprove = (swapId) => {
    const swap = (shiftSwaps || []).find(s => s.id === swapId)
    if (!swap) return

    // Perform the swap in the roster
    setRoster(prev => {
      const newRoster = [...prev]
      const requesterShiftIdx = newRoster.findIndex(r => r.employeeId === swap.requesterId && r.date === swap.date)
      const targetShiftIdx = newRoster.findIndex(r => r.employeeId === swap.targetId && r.date === swap.date)

      const reqShift = requesterShiftIdx >= 0 ? newRoster[requesterShiftIdx].templateId : 'Off'
      const tgtShift = targetShiftIdx >= 0 ? newRoster[targetShiftIdx].templateId : 'Off'

      // Apply swaps
      if (requesterShiftIdx >= 0) newRoster[requesterShiftIdx].templateId = tgtShift
      else newRoster.push({ employeeId: swap.requesterId, date: swap.date, templateId: tgtShift })

      if (targetShiftIdx >= 0) newRoster[targetShiftIdx].templateId = reqShift
      else newRoster.push({ employeeId: swap.targetId, date: swap.date, templateId: reqShift })

      return newRoster
    })

    setShiftSwaps(prev => prev.map(s => s.id === swapId ? { ...s, status: 'Approved' } : s))
    addToast('Shift swap approved and applied to roster.', 'success')
  }

  const handleReject = (swapId) => {
    setShiftSwaps(prev => prev.map(s => s.id === swapId ? { ...s, status: 'Rejected' } : s))
    addToast('Shift swap rejected.', 'info')
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 20px 0' }}>Pending Shift Swaps</h3>
      {pendingSwaps.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>No pending shift swap requests.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingSwaps.map(swap => {
            const reqEmp = employees.find(e => e.id === swap.requesterId)
            const tgtEmp = employees.find(e => e.id === swap.targetId)
            
            return (
              <div key={swap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{swap.date}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{reqEmp?.name}</span>
                    <Repeat size={14} style={{ margin: '0 8px', color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{tgtEmp?.name}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Reason: {swap.reason}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={() => handleApprove(swap.id)}><Check size={16} /> Approve</button>
                  <button className="btn btn-secondary" style={{ color: 'var(--accent-danger)' }} onClick={() => handleReject(swap.id)}><X size={16} /> Reject</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// Overtime Claims Component
// ----------------------------------------------------------------------
function OvertimeClaims({ employees, overtimeClaims, setOvertimeClaims, addToast }) {
  const pendingClaims = (overtimeClaims || []).filter(c => c.status === 'Pending')

  const handleAction = (claimId, status) => {
    setOvertimeClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c))
    addToast(`Overtime claim ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info')
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 20px 0' }}>Overtime Approvals</h3>
      {pendingClaims.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>No pending overtime claims.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingClaims.map(claim => {
            const emp = employees.find(e => e.id === claim.employeeId)
            
            return (
              <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{emp?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {claim.date} • <span style={{ color: 'var(--accent-warning)', fontWeight: 700 }}>{claim.hours} hours</span> OT
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Reason: {claim.reason}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={() => handleAction(claim.id, 'Approved')}><Check size={16} /> Approve</button>
                  <button className="btn btn-secondary" style={{ color: 'var(--accent-danger)' }} onClick={() => handleAction(claim.id, 'Rejected')}><X size={16} /> Reject</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// Leave Requests Component
// ----------------------------------------------------------------------
function LeaveRequests({ employees, attendance, setAttendance, addToast }) {
  const leaves = attendance.leaves || []
  
  const handleApproveLeave = (leaveId) => {
    setAttendance(prev => {
      const updatedLeaves = (prev.leaves || []).map(l => l.id === leaveId ? { ...l, status: 'Approved' } : l)
      return { ...prev, leaves: updatedLeaves }
    })
    addToast('Leave request approved.', 'success')
  }

  const handleRejectLeave = (leaveId) => {
    setAttendance(prev => {
      const updatedLeaves = (prev.leaves || []).map(l => l.id === leaveId ? { ...l, status: 'Rejected' } : l)
      return { ...prev, leaves: updatedLeaves }
    })
    addToast('Leave request rejected.', 'info')
  }

  const pendingLeaves = leaves.filter(l => l.status === 'Pending')

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 20px 0' }}>Pending Leave Requests</h3>
      {pendingLeaves.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>No pending leave requests.</div>
      ) : (
        <div className="table-container">
          <table className="table-responsive table-striped" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Employee</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Dates</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Reason</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Receipt</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.map(leave => {
                const emp = employees.find(e => e.id === leave.employeeId)
                return (
                  <tr key={leave.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{emp?.name || leave.employeeId}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{leave.leaveType}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{leave.startDate} to {leave.endDate}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{leave.reason || '--'}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                      {leave.receipt ? (
                        <a href={leave.receipt} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px' }}>
                          <FileText size={14} /> View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', minHeight: '44px' }} onClick={() => handleApproveLeave(leave.id)}>Approve</button>
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', color: 'var(--accent-danger)', minHeight: '44px' }} onClick={() => handleRejectLeave(leave.id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DailyAttendance({ employees, attendance, setAttendance, addToast }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const logs = attendance?.dailyLogs?.[selectedDate] || {}
  
  const handleStatusChange = (empId, status) => {
    const currentLog = logs[empId] || { checkIn: '--', checkOut: '--', hours: '0.0' }
    let checkIn = currentLog.checkIn
    let checkOut = currentLog.checkOut
    let hours = currentLog.hours
    
    if (status === 'Present') {
      checkIn = '09:00 AM'
      checkOut = '06:00 PM'
      hours = '9.0'
    } else if (status === 'Late') {
      checkIn = '09:30 AM'
      checkOut = '06:00 PM'
      hours = '8.5'
    } else if (status === 'Absent') {
      checkIn = '--'
      checkOut = '--'
      hours = '0.0'
    }
    
    const newLogs = {
      ...attendance.dailyLogs,
      [selectedDate]: {
        ...logs,
        [empId]: { status, checkIn, checkOut, hours }
      }
    }
    
    setAttendance(prev => ({
      ...prev,
      dailyLogs: newLogs
    }))
    addToast(`Marked ${employees.find(e => e.id === empId)?.name} as ${status}.`, 'success')
  }
  
  const handleTimeChange = (empId, field, val) => {
    const currentLog = logs[empId] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
    const updatedLog = { ...currentLog, [field]: val }
    
    if (updatedLog.checkIn !== '--' && updatedLog.checkOut !== '--') {
      updatedLog.status = updatedLog.status === 'Absent' ? 'Present' : updatedLog.status
      updatedLog.hours = '9.0'
    }
    
    const newLogs = {
      ...attendance.dailyLogs,
      [selectedDate]: {
        ...logs,
        [empId]: updatedLog
      }
    }
    
    setAttendance(prev => ({
      ...prev,
      dailyLogs: newLogs
    }))
  }

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Daily Attendance Logging</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Date:</span>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '160px', minHeight: '44px' }} 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="table-container" style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <table className="table-responsive table-striped" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Employee</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Check In</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Check Out</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Hours</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const log = logs[emp.id] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={emp.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                      background: log.status === 'Present' ? 'var(--accent-success-glow)' : log.status === 'Late' ? 'var(--accent-warning-glow)' : 'var(--accent-danger-glow)',
                      color: log.status === 'Present' ? 'var(--accent-success)' : log.status === 'Late' ? 'var(--accent-warning)' : 'var(--accent-danger)'
                    }}>{log.status}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input 
                      type="text" 
                      value={log.checkIn} 
                      onChange={e => handleTimeChange(emp.id, 'checkIn', e.target.value)}
                      style={{ width: '80px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input 
                      type="text" 
                      value={log.checkOut} 
                      onChange={e => handleTimeChange(emp.id, 'checkOut', e.target.value)}
                      style={{ width: '80px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{log.hours}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: '44px', borderColor: 'var(--accent-success)', color: 'var(--accent-success)' }}
                        onClick={() => handleStatusChange(emp.id, 'Present')}
                      >
                        Present
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: '44px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
                        onClick={() => handleStatusChange(emp.id, 'Late')}
                      >
                        Late
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: '44px', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
                        onClick={() => handleStatusChange(emp.id, 'Absent')}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
