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
    <div className="flex items-center justify-between flex-wrap gap-4 p-5 sm:p-6" style={{
      background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
    }}>
      <div className="flex flex-col gap-0.5">
        <span aria-live="polite" role="timer" className="text-[30px] font-bold tabular-nums leading-[1.2] tracking-[0.02em]" style={{ color: 'var(--md-bw-on-surface)' }}>
          {timeStr}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
          {dateStr}
        </span>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <select aria-label="Select employee" value={clockEmpId} onChange={e => setClockEmpId(e.target.value)}
          className="py-2 pl-3.5 pr-8 rounded-full h-10 cursor-pointer appearance-none min-w-[170px] outline-none font-medium text-[13px]"
          style={{
            border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
            color: 'var(--md-bw-on-surface)', fontFamily: "'Roboto'"
          }}>
          <option value="">— Select employee —</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>

        <button aria-label="Clock in" aria-pressed={canCheckIn} onClick={handleCheckIn} disabled={!canCheckIn} className="px-4 sm:px-6"
          style={{
            borderRadius: '100px', height: '40px', border: 'none',
            cursor: canCheckIn ? 'pointer' : 'not-allowed',
            background: canCheckIn ? '#28a745' : 'rgba(128,128,128,0.12)',
            color: canCheckIn ? '#fff' : 'rgba(128,128,128,0.4)',
            font: "600 13px 'Roboto'", display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s', opacity: canCheckIn ? 1 : 0.6,
            boxShadow: canCheckIn ? '0 2px 8px rgba(40,167,69,0.25)' : 'none'
          }}>
          <Clock size={15} /> Check In
        </button>

        <button aria-label="Clock out" aria-pressed={canCheckOut} onClick={handleCheckOut} disabled={!canCheckOut} className="px-4 sm:px-6"
          style={{
            borderRadius: '100px', height: '40px',
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
          <span role="status" className="text-xs flex items-center gap-1.5 whitespace-nowrap" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
            <span className="font-semibold" style={{ color: '#28a745' }}>In: {empLog.checkIn}</span>
            {empLog.checkOut !== '--' && (
              <><span className="opacity-30">|</span><span className="font-semibold" style={{ color: '#dc3545' }}>Out: {empLog.checkOut}</span><span className="opacity-30">|</span><span className="font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>{empLog.hours}h</span></>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
