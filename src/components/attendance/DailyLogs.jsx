import { useAttendanceLogs } from '../../hooks/useAttendanceLogs.js'
import { PILL_STYLES, cell, thStyle, pill, selStyle } from '../../services/attendance.js'
import { formatDateShort } from '../../services/date.js'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react'

const z = (v) => v < 10 ? `0${v}` : `${v}`

export default function DailyLogs({ employees, attendance, setAttendance, addToast }) {
  const {
    selectedDate, setSelectedDate, showDatePicker, setShowDatePicker,
    calYear, setCalYear, calMonth, setCalMonth,
    logs, setLog, markAll, openStatusEmp, setOpenStatusEmp,
    calDaysInMonth, calFirstDow, calGrid, selNum, selMonth, selYear,
  } = useAttendanceLogs(attendance, setAttendance, addToast)

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-3 pb-4">
        <div className="flex items-center gap-3 relative">
          <button aria-label={`Selected date: ${selectedDate}`} onClick={(e) => { e.stopPropagation(); setShowDatePicker(v => !v); setCalYear(selYear); setCalMonth(selMonth) }}
            className="pl-3.5 pr-[38px] py-2.5 rounded-full min-h-10 cursor-pointer flex items-center gap-2 outline-none font-medium text-sm"
            style={{
              border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
              color: 'var(--md-bw-on-surface)', fontFamily: "'Roboto'"
            }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            <CalendarDays size={16} className="opacity-60" style={{ color: 'var(--md-bw-on-surface-variant)' }} />
          </button>
          <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
          {showDatePicker && (
            <div onClick={e => e.stopPropagation()}
              className="absolute top-full left-0 z-50 w-[280px] p-4 mt-1.5"
              style={{
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
                color: 'var(--md-bw-on-surface)' }}>
              <div className="flex justify-between items-center mb-3">
                <button aria-label="Previous month" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                  className="bg-transparent border-0 cursor-pointer p-1 flex" style={{ color: 'var(--md-bw-on-surface)' }}>
                  <ChevronLeft size={16} />
                </button>
                <span className="font-semibold text-sm" style={{ fontFamily: "'Roboto'", color: 'var(--md-bw-on-surface)' }}>
                  {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button aria-label="Next month" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                  className="bg-transparent border-0 cursor-pointer p-1 flex" style={{ color: 'var(--md-bw-on-surface)' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <span key={d} className="font-medium text-xs py-1" style={{ fontFamily: "'Roboto'", color: 'var(--md-bw-on-surface-variant)' }}>{d}</span>
                ))}
                {calGrid.map((d, i) => (
                  d === null ? <div key={i} /> : (
                    <button key={i} aria-label={`${calYear}-${z(calMonth+1)}-${z(d)}`} onClick={() => { setSelectedDate(`${calYear}-${z(calMonth+1)}-${z(d)}`); setShowDatePicker(false) }}
                      className="size-8 rounded-full border-0 cursor-pointer mx-auto font-normal text-[13px]"
                      style={{
                        fontFamily: "'Roboto'",
                        background: d === selNum && calMonth === selMonth && calYear === selYear
                          ? 'linear-gradient(135deg, #0062E6 0%, #003A8C 100%)' : 'transparent',
                        color: d === selNum && calMonth === selMonth && calYear === selYear ? '#fff' : 'var(--md-bw-on-surface)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!(d === selNum && calMonth === selMonth && calYear === selYear)) e.target.style.background = 'rgba(128,128,128,0.12)' }}
                      onMouseLeave={e => { if (!(d === selNum && calMonth === selMonth && calYear === selYear)) e.target.style.background = 'transparent' }}>
                      {d}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
        <button aria-label="Mark all employees present" className="btn btn-text flex items-center gap-1.5" onClick={() => markAll(employees)}>
          <Plus size={15} /> Mark All Present
        </button>
      </div>
      <div className="payroll-table-container">
        <div className="payroll-table-header-wrap">
          <table className="payroll-table">
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
          </table>
        </div>
        <div className="payroll-table-body-scroll max-h-[520px]">
          <table className="payroll-table">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '160px' }} />
            </colgroup>
            <tbody>
              {employees.map(emp => {
                const log = logs[emp.id] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }
                const ps = PILL_STYLES[log.status] || PILL_STYLES.Absent
                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={cell}>
                      <div className="flex items-center gap-2.5">
                        <img src={emp.avatar} alt="" className="size-7 rounded-full object-cover" />
                        <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <input aria-label={`Check-in time for ${emp.name}`} type="text" value={log.checkIn} onChange={e => setLog(emp.id, { [e.target.name]: e.target.value })} name="checkIn"
                        className="w-[90px] text-center py-1.5 px-2 rounded-md outline-none font-normal text-[13px]"
                        style={{ border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)', fontFamily: "'Roboto'" }}
                        placeholder="09:00 AM"
                      />
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <input aria-label={`Check-out time for ${emp.name}`} type="text" value={log.checkOut} onChange={e => setLog(emp.id, { [e.target.name]: e.target.value })} name="checkOut"
                        className="w-[90px] text-center py-1.5 px-2 rounded-md outline-none font-normal text-[13px]"
                        style={{ border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)', fontFamily: "'Roboto'" }}
                        placeholder="06:00 PM"
                      />
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <span className="body-large tabular-nums font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>{log.hours}</span>
                    </td>
                    <td style={cell}>
                      <div className="relative">
                        <button aria-label={`Status: ${log.status} for ${emp.name}`} role="status" onClick={(e) => { e.stopPropagation(); setOpenStatusEmp(v => v === emp.id ? null : emp.id) }}
                          style={{ ...selStyle, background: ps.bg, color: ps.color, border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {log.status}
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="opacity-70"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        {openStatusEmp === emp.id && (
                          <div onClick={e => e.stopPropagation()}
                            className="absolute left-0 z-50 min-w-[140px] p-1.5"
                            style={{ top: 'calc(100% + 4px)',
                              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                              border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
                              color: 'var(--md-bw-on-surface)' }}>
                            {Object.entries(PILL_STYLES).map(([k, v]) => (
                              <button key={k} onClick={() => { setLog(emp.id, { status: k }); setOpenStatusEmp(null) }}
                                className="block w-full px-3 py-2 rounded-full border-0 cursor-pointer text-xs text-left transition-all duration-150"
                                style={{
                                  fontFamily: "'Roboto'", fontWeight: 600,
                                  background: k === log.status ? v.bg : 'transparent',
                                  color: k === log.status ? v.color : 'var(--md-bw-on-surface)',
                                }}
                                onMouseEnter={e => { if (k !== log.status) e.target.style.background = 'var(--glass-bg)' }}
                                onMouseLeave={e => { if (k !== log.status) e.target.style.background = 'transparent' }}>
                                {k}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end px-6 py-4">
          <button aria-label="Save daily logs" className="btn btn-filled flex items-center gap-2" onClick={() => addToast('Daily logs saved.', 'success')}>
            <Check size={16} /> Save Daily Logs
          </button>
        </div>
      </div>
    </>
  )
}
