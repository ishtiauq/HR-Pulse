import { useState, useEffect } from 'react'
import { Clock, X } from 'lucide-react'
import { toLocal, parseMin, fmtH } from '../../services/attendance.js'

export default function ClockWidget({ employees, attendance, setAttendance, addToast }) {
  const today = toLocal(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [clockEmpId, setClockEmpId] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const logs = attendance?.dailyLogs?.[today] || {}
  const empLog = clockEmpId ? (logs[clockEmpId] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }) : null

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const handleCheckIn = () => {
    if (!clockEmpId) return
    const now = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    setAttendance(prev => ({
      ...prev,
      dailyLogs: {
        ...prev.dailyLogs,
        [today]: {
          ...(prev.dailyLogs?.[today] || {}),
          [clockEmpId]: {
            status: 'Present',
            checkIn: now,
            checkOut: empLog?.checkOut || '--',
            hours: empLog?.hours || '0.0'
          }
        }
      }
    }))
    addToast?.('Check-in recorded for today', 'success')
  }

  const handleCheckOut = () => {
    if (!clockEmpId || !empLog || empLog.checkIn === '--') return
    const now = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const ci = parseMin(empLog.checkIn)
    const co = parseMin(now)
    let h = '0.0'
    if (ci !== null && co !== null) {
      let d = co - ci; if (d < 0) d += 1440
      h = fmtH(d)
    }
    setAttendance(prev => ({
      ...prev,
      dailyLogs: {
        ...prev.dailyLogs,
        [today]: {
          ...(prev.dailyLogs?.[today] || {}),
          [clockEmpId]: { ...empLog, checkOut: now, hours: h }
        }
      }
    }))
    addToast?.('Check-out recorded for today', 'success')
  }

  const canCheckIn = clockEmpId && (!empLog || empLog.checkIn === '--')
  const canCheckOut = clockEmpId && empLog && empLog.checkIn !== '--' && empLog.checkOut === '--'

  return (
    <div style={{
      background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
      padding: '20px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '30px', fontWeight: 700, color: 'var(--md-bw-on-surface)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, letterSpacing: '0.02em' }}>
          {timeStr}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', fontWeight: 500 }}>
          {dateStr}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <select value={clockEmpId} onChange={e => setClockEmpId(e.target.value)}
          style={{
            padding: '8px 32px 8px 14px', borderRadius: '100px', height: '40px',
            border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
            color: 'var(--md-bw-on-surface)', font: "500 13px 'Roboto'", outline: 'none',
            cursor: 'pointer', appearance: 'none', minWidth: '170px'
          }}>
          <option value="">— Select employee —</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>

        <button onClick={handleCheckIn} disabled={!canCheckIn}
          style={{
            padding: '0 24px', borderRadius: '100px', height: '40px', border: 'none',
            cursor: canCheckIn ? 'pointer' : 'not-allowed',
            background: canCheckIn ? '#28a745' : 'rgba(128,128,128,0.12)',
            color: canCheckIn ? '#fff' : 'rgba(128,128,128,0.4)',
            font: "600 13px 'Roboto'", display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s', opacity: canCheckIn ? 1 : 0.6,
            boxShadow: canCheckIn ? '0 2px 8px rgba(40,167,69,0.25)' : 'none'
          }}>
          <Clock size={15} /> Check In
        </button>

        <button onClick={handleCheckOut} disabled={!canCheckOut}
          style={{
            padding: '0 24px', borderRadius: '100px', height: '40px',
            border: '2px solid', cursor: canCheckOut ? 'pointer' : 'not-allowed',
            background: canCheckOut ? '#dc3545' : 'transparent',
            color: canCheckOut ? '#fff' : 'rgba(128,128,128,0.35)',
            borderColor: canCheckOut ? '#dc3545' : 'rgba(128,128,128,0.15)',
            font: "600 13px 'Roboto'", display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s', opacity: canCheckOut ? 1 : 0.6,
          }}>
          <X size={15} /> Check Out
        </button>

        {clockEmpId && empLog && empLog.checkIn !== '--' && (
          <span style={{ fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#28a745', fontWeight: 600 }}>In: {empLog.checkIn}</span>
            {empLog.checkOut !== '--' && (
              <><span style={{ opacity: 0.3 }}>|</span><span style={{ color: '#dc3545', fontWeight: 600 }}>Out: {empLog.checkOut}</span><span style={{ opacity: 0.3 }}>|</span><span style={{ fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>{empLog.hours}h</span></>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
