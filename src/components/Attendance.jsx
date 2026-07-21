import { useState } from 'react'
import { Check, X, Clock, Plus, CalendarDays, ChevronLeft, ChevronRight, Cpu, ArrowUpDown, Repeat } from 'lucide-react'
import { formatDateShort } from '../services/date.js'

const z = (v) => v < 10 ? `0${v}` : `${v}`
const toLocal = (d) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
const getMon = (offset) => {
  const n = new Date()
  const d = n.getDay()
  const mon = new Date(n.getFullYear(), n.getMonth(), n.getDate() - d + (d === 0 ? -6 : 1) + offset * 7)
  return toLocal(mon)
}
const addDays = (s, n) => {
  const d = new Date(s + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return toLocal(d)
}
const parseMin = (t) => {
  if (!t || t === '--') return null
  const s = t.trim().toUpperCase()
  const pm = s.includes('PM')
  const am = s.includes('AM')
  const p = s.replace(/\s*(AM|PM)\s*/, '').split(':')
  const h = parseInt(p[0], 10)
  const m = parseInt(p[1], 10) || 0
  if (isNaN(h)) return null
  let h24 = h
  if (pm && h !== 12) h24 = h + 12
  if (am && h === 12) h24 = 0
  return h24 * 60 + m
}
const fmtH = (m) => m === null ? '0.0' : (m / 60).toFixed(1)

const tabChip = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 16px', borderRadius: '100px',
  border: isActive ? 'none' : '1px solid var(--glass-border)',
  background: isActive ? 'linear-gradient(135deg, #0062E6 0%, #003A8C 100%)' : 'rgba(0,0,0,0.05)',
  color: isActive ? '#fff' : 'var(--md-bw-on-surface-variant)',
  cursor: 'pointer', font: "500 13px 'Roboto'",
  transition: 'all 0.2s ease', outline: 'none', minHeight: '32px'
})

const pill = (bg, color) => ({
  height: '24px', padding: '0 10px', fontSize: '11px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', borderRadius: '20px',
  backgroundColor: bg, color, letterSpacing: '0.03em', whiteSpace: 'nowrap'
})

const PILL_STYLES = {
  Present: { bg: '#28a745', color: '#fff' },
  Absent: { bg: '#dc3545', color: '#fff' },
  'On Leave': { bg: '#ffc107', color: '#121212' },
  WFH: { bg: '#007aff', color: '#fff' },
}

const selStyle = {
  padding: '0 28px 0 12px', height: '32px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
  border: '1px solid var(--glass-border)', outline: 'none', cursor: 'pointer',
  appearance: 'none', background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)',
}

const cell = { padding: '0 16px' }
const thStyle = { padding: '0 16px', height: '48px', textAlign: 'left', borderBottom: '1.5px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em', color: 'var(--md-bw-on-surface)', whiteSpace: 'nowrap' }

export default function Attendance({ employees, attendance, setAttendance, roster, setRoster, shiftSwaps, setShiftSwaps, shiftTemplates, overtimeClaims, setOvertimeClaims, addLog, addToast, addNotification, simulatedRole, addAuditLog }) {
  const [tab, setTab] = useState('daily')
  const tabs = [
    { id: 'daily', label: 'Daily Logs', icon: Clock },
    { id: 'leave', label: 'Leave Requests', icon: CalendarDays },
    { id: 'roster', label: 'Roster', icon: ArrowUpDown },
    { id: 'overtime', label: 'Overtime', icon: Cpu },
  ]
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Attendance & Leaves</h1>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={tabChip(tab === t.id)}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>
      {tab === 'daily' && <DailyAttendance employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />}
      {tab === 'leave' && <LeaveRequests employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />}
      {tab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <RosterPlanner employees={employees} roster={roster} setRoster={setRoster} shiftTemplates={shiftTemplates} addToast={addToast} />
          <ShiftSwaps employees={employees} shiftSwaps={shiftSwaps} setShiftSwaps={setShiftSwaps} roster={roster} setRoster={setRoster} addToast={addToast} />
        </div>
      )}
      {tab === 'overtime' && <OvertimeClaims employees={employees} overtimeClaims={overtimeClaims} setOvertimeClaims={setOvertimeClaims} addToast={addToast} />}
    </div>
  )
}

function DailyAttendance({ employees, attendance, setAttendance, addToast }) {
  const [selectedDate, setSelectedDate] = useState(() => toLocal(new Date()))
  const logs = attendance?.dailyLogs?.[selectedDate] || {}

  const setLog = (empId, upd) => {
    const cur = logs[empId] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
    const next = { ...cur, ...upd }
    if (next.checkIn !== '--' && next.checkOut !== '--') {
      const a = parseMin(next.checkIn), b = parseMin(next.checkOut)
      if (a !== null && b !== null) {
        let d = b - a; if (d < 0) d += 1440
        next.hours = fmtH(d)
        if (cur.status === 'Absent' || cur.status === '--') next.status = 'Present'
      }
    }
    setAttendance(prev => ({ ...prev, dailyLogs: { ...prev.dailyLogs, [selectedDate]: { ...logs, [empId]: next } } }))
  }

  const markAll = () => {
    const o = {}
    employees.forEach(e => { o[e.id] = { status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0' } })
    setAttendance(prev => ({ ...prev, dailyLogs: { ...prev.dailyLogs, [selectedDate]: o } }))
    addToast('Marked all as Present', 'success')
  }

  return (
    <div className="payroll-table-container">
      <div className="payroll-table-header-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                style={{
                  padding: '10px 38px 10px 14px', borderRadius: '100px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)',
                  font: "500 14px 'Roboto'", outline: 'none',
                  cursor: 'pointer', minHeight: '40px'
                }}
              />
              <CalendarDays size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-bw-on-surface-variant)', pointerEvents: 'none' }} />
            </div>
            <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>
          <button className="btn btn-text" onClick={markAll} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> Mark All Present
          </button>
        </div>
      </div>
      <div className="payroll-table-body-scroll" style={{ maxHeight: '520px' }}>
        <table className="payroll-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '200px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '160px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}>Employee</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Check In</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Check Out</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Hours</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const log = logs[emp.id] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
              const ps = PILL_STYLES[log.status] || PILL_STYLES.Absent
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={cell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={emp.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <input type="text" value={log.checkIn} onChange={e => setLog(emp.id, { [e.target.name]: e.target.value })} name="checkIn"
                      style={{ width: '90px', textAlign: 'center', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)', font: "400 13px 'Roboto'", outline: 'none' }}
                      placeholder="09:00 AM"
                    />
                  </td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <input type="text" value={log.checkOut} onChange={e => setLog(emp.id, { [e.target.name]: e.target.value })} name="checkOut"
                      style={{ width: '90px', textAlign: 'center', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)', font: "400 13px 'Roboto'", outline: 'none' }}
                      placeholder="06:00 PM"
                    />
                  </td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <span className="body-large" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--md-bw-on-surface)', fontWeight: 600 }}>{log.hours}</span>
                  </td>
                  <td style={cell}>
                    <select value={log.status} onChange={e => setLog(emp.id, { status: e.target.value })}
                      style={{ ...selStyle, background: ps.bg, color: ps.color, border: 'none' }}
                    >
                      {Object.entries(PILL_STYLES).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: '#fff', color: '#121212' }}>{v.label || k}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px' }}>
        <button className="btn btn-filled" onClick={() => addToast('Daily logs saved.', 'success')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> Save Daily Logs
        </button>
      </div>
    </div>
  )
}

function LeaveRequests({ employees, attendance, setAttendance, addToast }) {
  const leaves = attendance.leaves || []
  const pending = leaves.filter(l => l.status === 'Pending')
  const history = leaves.filter(l => l.status !== 'Pending')

  const act = (id, status) => {
    setAttendance(prev => ({ ...prev, leaves: (prev.leaves || []).map(l => l.id === id ? { ...l, status } : l) }))
    addToast(`Leave request ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info')
  }

  const STATUS = {
    Approved: { bg: '#28a745', color: '#fff' },
    Rejected: { bg: '#dc3545', color: '#fff' },
    Pending: { bg: '#ffc107', color: '#121212' },
  }

  return (
    <div className="payroll-table-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
        Pending Requests {pending.length > 0 && <span style={{ fontWeight: 400, color: 'var(--md-bw-on-surface-variant)' }}>({pending.length})</span>}
      </h3>
      {pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--md-bw-on-surface-variant)' }}>
          <CalendarDays size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p className="body-medium" style={{ margin: 0 }}>No pending leave requests.</p>
        </div>
      ) : (
        <div className="payroll-table-header-wrap">
          <table className="payroll-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '160px' }} /><col style={{ width: '120px' }} /><col style={{ width: '180px' }} /><col style={{ width: '60px' }} /><col /><col style={{ width: '200px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Dates</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Days</th>
                <th style={thStyle}>Reason</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(l => {
                const emp = employees.find(e => e.id === l.employeeId)
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={cell}><span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{emp?.name || l.employeeId}</span></td>
                    <td style={cell}><span style={{ color: 'var(--md-bw-on-surface)' }}>{l.leaveType}</span></td>
                    <td style={cell}><span style={{ color: 'var(--md-bw-on-surface-variant)', fontSize: '0.85rem' }}>{formatDateShort(l.startDate)} — {formatDateShort(l.endDate)}</span></td>
                    <td style={{ ...cell, textAlign: 'center' }}><span className="body-large" style={{ fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>{l.days || '—'}</span></td>
                    <td style={cell}><span style={{ color: 'var(--md-bw-on-surface-variant)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '200px' }}>{l.reason || '—'}</span></td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-tonal" style={{ padding: '0 14px', height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => act(l.id, 'Approved')}>
                          <Check size={13} /> Approve
                        </button>
                        <button className="btn btn-outlined" style={{ padding: '0 14px', height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--md-bw-error)' }} onClick={() => act(l.id, 'Rejected')}>
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {history.length > 0 && (
        <>
          <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>History</h3>
          <div className="payroll-table-header-wrap">
            <table className="payroll-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '180px' }} /><col style={{ width: '120px' }} /><col style={{ width: '200px' }} /><col style={{ width: '100px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Employee</th>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Type</th>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Dates</th>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().map(l => {
                  const emp = employees.find(e => e.id === l.employeeId)
                  const s = STATUS[l.status] || STATUS.Pending
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <td style={cell}><span style={{ color: 'var(--md-bw-on-surface)', fontSize: '0.85rem' }}>{emp?.name || l.employeeId}</span></td>
                      <td style={cell}><span style={{ color: 'var(--md-bw-on-surface-variant)', fontSize: '0.85rem' }}>{l.leaveType}</span></td>
                      <td style={cell}><span style={{ color: 'var(--md-bw-on-surface-variant)', fontSize: '0.85rem' }}>{formatDateShort(l.startDate)} — {formatDateShort(l.endDate)}</span></td>
                      <td style={cell}><span style={pill(s.bg, s.color)}>{l.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function RosterPlanner({ employees, roster, setRoster, shiftTemplates, addToast }) {
  const [weekStart, setWeekStart] = useState(() => getMon(0))

  const goBack = () => setWeekStart(addDays(weekStart, -7))
  const goNext = () => setWeekStart(addDays(weekStart, 7))

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const assign = (empId, dateStr, templateId) => {
    if (templateId !== 'Off') {
      const prev = addDays(dateStr, -1)
      const pe = (roster || []).find(r => r.employeeId === empId && r.date === prev)
      if (pe && pe.templateId !== 'Off') {
        const pt = (shiftTemplates || []).find(t => t.id === pe.templateId)
        const ct = (shiftTemplates || []).find(t => t.id === templateId)
        if (pt && ct) {
          const peh = parseInt(pt.end.split(':')[0])
          const csh = parseInt(ct.start.split(':')[0])
          let rest = csh - peh; if (rest < 0) rest += 24
          if (rest < 8) addToast(`Less than 8h rest for ${employees.find(e=>e.id===empId)?.name}`, 'warning')
        }
      }
    }
    setRoster(prev => [...prev.filter(r => !(r.employeeId === empId && r.date === dateStr)), { employeeId: empId, date: dateStr, templateId }])
  }

  const copyPrev = () => {
    const prevStart = addDays(weekStart, -7)
    const prevDates = Array.from({ length: 7 }, (_, i) => addDays(prevStart, i))
    const curSet = new Set(weekDates)
    const entries = []
    employees.forEach(emp => {
      for (let i = 0; i < 7; i++) {
        const p = (roster || []).find(r => r.employeeId === emp.id && r.date === prevDates[i])
        if (p) entries.push({ employeeId: emp.id, date: weekDates[i], templateId: p.templateId })
      }
    })
    if (entries.length === 0) return addToast('No shifts found in the previous week to copy.', 'warning')
    setRoster(prev => [...prev.filter(r => !curSet.has(r.date)), ...entries])
    addToast('Copied previous week roster.', 'success')
  }

  return (
    <div className="payroll-table-container">
      <div className="payroll-table-header-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '20px 24px 0' }}>
          <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Weekly Roster Planner</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-outlined" onClick={copyPrev} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', fontSize: '12px' }}>
              <CalendarDays size={14} /> Copy Prev Week
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--glass-bg)', padding: '3px', borderRadius: '100px', border: '1px solid var(--glass-border)' }}>
              <button className="btn btn-text" style={{ padding: '4px 8px', minHeight: '30px' }} onClick={goBack}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0 8px', color: 'var(--md-bw-on-surface)', whiteSpace: 'nowrap' }}>
                {formatDateShort(weekDates[0])} — {formatDateShort(weekDates[6])}
              </span>
              <button className="btn btn-text" style={{ padding: '4px 8px', minHeight: '30px' }} onClick={goNext}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="payroll-table-body-scroll" style={{ maxHeight: '520px' }}>
        <table className="payroll-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '160px' }} />
            {weekDates.map(d => <col key={d} style={{ width: '120px' }} />)}
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}>Employee</th>
              {weekDates.map((d, i) => (
                <th key={d} style={{ ...thStyle, textAlign: 'center', fontSize: '12px' }}>
                  {labels[i]}<br /><span style={{ fontWeight: 400, color: 'var(--md-bw-on-surface-variant)' }}>{formatDateShort(d)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <td style={cell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--md-bw-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="body-medium" style={{ color: 'var(--md-bw-on-surface)', fontWeight: 500 }}>{emp.name}</span>
                  </div>
                </td>
                {weekDates.map(d => {
                  const entry = (roster || []).find(r => r.employeeId === emp.id && r.date === d)
                  const tid = entry?.templateId || 'Off'
                  const tmpl = (shiftTemplates || []).find(t => t.id === tid)
                  return (
                    <td key={d} style={{ ...cell, textAlign: 'center', padding: '8px' }}>
                      <select value={tid} onChange={e => assign(emp.id, d, e.target.value)}
                        style={{
                          width: '100%', padding: '6px 4px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                          border: '1px solid var(--glass-border)',
                          background: tmpl ? `${tmpl.color}18` : 'var(--glass-bg)',
                          color: tmpl ? tmpl.color : 'var(--md-bw-on-surface-variant)',
                          outline: 'none', cursor: 'pointer', appearance: 'none', textAlign: 'center', minHeight: '32px'
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

function ShiftSwaps({ employees, shiftSwaps, setShiftSwaps, roster, setRoster, addToast }) {
  const pending = (shiftSwaps || []).filter(s => s.status === 'Pending')

  const approve = (id) => {
    const swap = (shiftSwaps || []).find(s => s.id === id)
    if (!swap) return
    setRoster(prev => {
      const nr = [...prev]
      const ri = nr.findIndex(r => r.employeeId === swap.requesterId && r.date === swap.date)
      const ti = nr.findIndex(r => r.employeeId === swap.targetId && r.date === swap.date)
      const rs = ri >= 0 ? nr[ri].templateId : 'Off'
      const ts = ti >= 0 ? nr[ti].templateId : 'Off'
      if (ri >= 0) nr[ri].templateId = ts; else nr.push({ employeeId: swap.requesterId, date: swap.date, templateId: ts })
      if (ti >= 0) nr[ti].templateId = rs; else nr.push({ employeeId: swap.targetId, date: swap.date, templateId: rs })
      return nr
    })
    setShiftSwaps(prev => prev.map(s => s.id === id ? { ...s, status: 'Approved' } : s))
    addToast('Shift swap approved and applied.', 'success')
  }

  const reject = (id) => {
    setShiftSwaps(prev => prev.map(s => s.id === id ? { ...s, status: 'Rejected' } : s))
    addToast('Shift swap rejected.', 'info')
  }

  if (pending.length === 0) return null

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Pending Shift Swaps ({pending.length})</h3>
      {pending.map(swap => {
        const r = employees.find(e => e.id === swap.requesterId)
        const t = employees.find(e => e.id === swap.targetId)
        return (
          <div key={swap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)', marginBottom: '4px' }}>{formatDateShort(swap.date)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="body-large" style={{ fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>{r?.name}</span>
                <Repeat size={14} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                <span className="body-large" style={{ fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>{t?.name}</span>
              </div>
              {swap.reason && <div className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', marginTop: '4px' }}>Reason: {swap.reason}</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-tonal" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => approve(swap.id)}>
                <Check size={13} /> Approve
              </button>
              <button className="btn btn-outlined" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--md-bw-error)' }} onClick={() => reject(swap.id)}>
                <X size={13} /> Reject
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OvertimeClaims({ employees, overtimeClaims, setOvertimeClaims, addToast }) {
  const pending = (overtimeClaims || []).filter(c => c.status === 'Pending')
  const history = (overtimeClaims || []).filter(c => c.status !== 'Pending')

  const act = (id, status) => {
    setOvertimeClaims(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    addToast(`Overtime claim ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info')
  }

  const STATUS = {
    Approved: { bg: '#28a745', color: '#fff' },
    Rejected: { bg: '#dc3545', color: '#fff' },
    Pending: { bg: '#ffc107', color: '#121212' },
  }

  return (
    <div className="payroll-table-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
        Overtime Approvals {pending.length > 0 && <span style={{ fontWeight: 400, color: 'var(--md-bw-on-surface-variant)' }}>({pending.length})</span>}
      </h3>

      {pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--md-bw-on-surface-variant)' }}>
          <Clock size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p className="body-medium" style={{ margin: 0 }}>No pending overtime claims.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pending.map(c => {
            const emp = employees.find(e => e.id === c.employeeId)
            return (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div className="body-large" style={{ fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>{emp?.name}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{formatDateShort(c.date)}</span>
                    <span className="body-small" style={{ color: '#b8860b', fontWeight: 700 }}>{c.hours}h OT</span>
                  </div>
                  {c.reason && <div className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', marginTop: '2px' }}>{c.reason}</div>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-tonal" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => act(c.id, 'Approved')}>
                    <Check size={13} /> Approve
                  </button>
                  <button className="btn btn-outlined" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--md-bw-error)' }} onClick={() => act(c.id, 'Rejected')}>
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {history.length > 0 && (
        <>
          <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>History</h3>
          <div className="payroll-table-header-wrap">
            <table className="payroll-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '180px' }} /><col style={{ width: '140px' }} /><col style={{ width: '80px' }} /><col style={{ width: '100px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Employee</th>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Date</th>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Hours</th>
                  <th style={{ ...thStyle, fontSize: '11px', height: '40px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().map(c => {
                  const emp = employees.find(e => e.id === c.employeeId)
                  const s = STATUS[c.status] || STATUS.Pending
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <td style={cell}><span style={{ color: 'var(--md-bw-on-surface)', fontSize: '0.85rem' }}>{emp?.name}</span></td>
                      <td style={cell}><span style={{ color: 'var(--md-bw-on-surface-variant)', fontSize: '0.85rem' }}>{formatDateShort(c.date)}</span></td>
                      <td style={cell}><span style={{ color: 'var(--md-bw-on-surface)', fontSize: '0.85rem' }}>{c.hours}h</span></td>
                      <td style={cell}><span style={pill(s.bg, s.color)}>{c.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
