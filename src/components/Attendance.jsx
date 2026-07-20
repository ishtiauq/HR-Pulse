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
  const [activeTab, setActiveTab] = useState('daily') // 'daily', 'time-off', 'analytics', 'biometric'
  const [viewMode, setViewMode] = useState('manager') // 'manager' or 'employee'

  const leaves = attendance.leaves || []

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
          Attendance
        </h1>
      </div>

      {/* Tabs - M3 Segmented Button */}
      <div style={{ display: 'flex', border: '1px solid var(--md-bw-outline)', borderRadius: '20px', overflow: 'hidden', alignSelf: 'flex-start' }}>
        {[
          { id: 'daily', label: 'Daily Roll Call' },
          { id: 'time-off', label: 'Time-Off' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'biometric', label: 'Biometric' }
        ].map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRight: idx < 3 ? '1px solid var(--md-bw-outline)' : 'none',
              background: activeTab === tab.id ? 'var(--md-bw-secondary-container)' : 'var(--md-bw-surface)',
              color: activeTab === tab.id ? 'var(--md-bw-on-secondary-container)' : 'var(--md-bw-on-surface-variant)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {activeTab === tab.id && <CheckSquare size={16} />}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <DailyAttendance 
          employees={employees} 
          attendance={attendance} 
          setAttendance={setAttendance} 
          addToast={addToast}
        />
      )}

      {/* Placeholders for new tabs */}
      {activeTab === 'time-off' && <div className="m3-card m3-card-elevated" style={{ padding: '24px', textAlign: 'center' }}><p className="body-large">Time-Off (Under Construction)</p></div>}
      {activeTab === 'analytics' && <div className="m3-card m3-card-elevated" style={{ padding: '24px', textAlign: 'center' }}><p className="body-large">Analytics (Under Construction)</p></div>}
      {activeTab === 'biometric' && <div className="m3-card m3-card-elevated" style={{ padding: '24px', textAlign: 'center' }}><p className="body-large">Biometric (Under Construction)</p></div>}
      
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
  const [selectedRows, setSelectedRows] = useState([])
  
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
    } else if (status === 'Absent' || status === 'On Leave' || status === 'WFH') {
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

  const markAllPresent = () => {
    const newLogsDay = { ...logs }
    employees.forEach(emp => {
      newLogsDay[emp.id] = { status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0' }
    })
    setAttendance(prev => ({
      ...prev,
      dailyLogs: {
        ...prev.dailyLogs,
        [selectedDate]: newLogsDay
      }
    }))
    addToast('Marked all as Present', 'success')
  }

  const toggleSelectAll = () => {
    if (selectedRows.length === employees.length) setSelectedRows([])
    else setSelectedRows(employees.map(e => e.id))
  }

  const toggleRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(r => r !== id))
    else setSelectedRows([...selectedRows, id])
  }

  return (
    <div className="m3-card m3-card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Date Control */}
        <div className="m3-text-field outlined" style={{ width: '200px' }}>
          <label className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)', marginBottom: '4px', display: 'block' }}>Roster Date</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="date" 
              style={{
                width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)',
                background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none'
              }}
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
            />
            <CalendarDays size={20} style={{ position: 'absolute', right: '12px', color: 'var(--md-bw-on-surface-variant)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Bulk Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-text" style={{ padding: '0 16px', height: '40px' }} onClick={() => addToast('Copied times from previous day', 'success')}>
            Copy Times
          </button>
          <button className="btn btn-outlined" style={{ padding: '0 16px', height: '40px' }} onClick={markAllPresent}>
            Mark All Present
          </button>
        </div>
      </div>

      <div className="table-scroll-wrapper" style={{ padding: '0', maxHeight: '600px', overflowY: 'auto' }}>
        <table className="m3-data-table" style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedRows.length === employees.length && employees.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--md-bw-primary)' }}
                />
              </th>
              <th>Employee</th>
              <th style={{ textAlign: 'center' }}>Check In</th>
              <th style={{ textAlign: 'center' }}>Check Out</th>
              <th style={{ textAlign: 'center' }}>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const log = logs[emp.id] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
              return (
                <tr key={emp.id} className={selectedRows.includes(emp.id) ? 'selected' : ''}>
                  <td className="sticky-col">
                    <input 
                      type="checkbox" 
                      checked={selectedRows.includes(emp.id)}
                      onChange={() => toggleRow(emp.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--md-bw-primary)' }}
                    />
                  </td>
                  <td className="sticky-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={emp.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</span>
                        <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{emp.role}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="text" 
                      value={log.checkIn} 
                      onChange={e => handleTimeChange(emp.id, 'checkIn', e.target.value)}
                      style={{ 
                        width: '100px', textAlign: 'center', border: '1px solid var(--md-bw-outline)', 
                        borderRadius: '4px', padding: '12px', background: 'transparent', 
                        color: 'var(--md-bw-on-surface)', fontSize: '14px', outline: 'none' 
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="text" 
                      value={log.checkOut} 
                      onChange={e => handleTimeChange(emp.id, 'checkOut', e.target.value)}
                      style={{ 
                        width: '100px', textAlign: 'center', border: '1px solid var(--md-bw-outline)', 
                        borderRadius: '4px', padding: '12px', background: 'transparent', 
                        color: 'var(--md-bw-on-surface)', fontSize: '14px', outline: 'none' 
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="body-large" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--md-bw-on-surface)' }}>{log.hours}</span>
                  </td>
                  <td>
                    <div style={{ position: 'relative', width: '140px' }}>
                      <select
                        value={log.status}
                        onChange={e => handleStatusChange(emp.id, e.target.value)}
                        className="m3-select"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '4px',
                          border: log.status === 'On Leave' ? '1px dashed var(--md-bw-outline)' : log.status === 'WFH' ? '1px dotted var(--md-bw-outline)' : '1px solid var(--md-bw-outline)',
                          background: log.status === 'Present' ? 'var(--md-bw-on-surface)' : 'transparent',
                          color: log.status === 'Present' ? 'var(--md-bw-surface)' : 'var(--md-bw-on-surface)',
                          fontSize: '14px',
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'none',
                          fontWeight: 500
                        }}
                      >
                        <option value="Present" style={{ background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)' }}>Present</option>
                        <option value="Absent" style={{ background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)' }}>Absent</option>
                        <option value="On Leave" style={{ background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)' }}>On Leave</option>
                        <option value="WFH" style={{ background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)' }}>WFH</option>
                      </select>
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: log.status === 'Present' ? 'var(--md-bw-surface)' : 'var(--md-bw-on-surface-variant)' }}>▼</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Save FAB (Desktop Bottom Right) */}
      <button 
        className="btn btn-filled"
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          height: '56px',
          borderRadius: '16px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100
        }}
        onClick={() => addToast('Daily logs saved successfully.', 'success')}
      >
        <Check size={24} />
        <span className="label-large" style={{ textTransform: 'uppercase' }}>Save Daily Logs</span>
      </button>
    </div>
  )
}
