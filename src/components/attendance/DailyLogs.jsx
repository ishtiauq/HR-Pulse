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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '0 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <button onClick={(e) => { e.stopPropagation(); setShowDatePicker(v => !v); setCalYear(selYear); setCalMonth(selMonth) }}
            style={{
              padding: '10px 38px 10px 14px', borderRadius: '100px', minHeight: '40px',
              border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
              color: 'var(--md-bw-on-surface)', font: "500 14px 'Roboto'", outline: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            <CalendarDays size={16} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
          </button>
          <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
          {showDatePicker && (
            <div onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '0', zIndex: 50, width: '280px', padding: '16px',
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
                color: 'var(--md-bw-on-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--md-bw-on-surface)', display: 'flex' }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ font: "600 14px 'Roboto'", color: 'var(--md-bw-on-surface)' }}>
                  {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--md-bw-on-surface)', display: 'flex' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', textAlign: 'center' }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <span key={d} style={{ font: "500 11px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', padding: '4px 0' }}>{d}</span>
                ))}
                {calGrid.map((d, i) => (
                  d === null ? <div key={i} /> : (
                    <button key={i} onClick={() => { setSelectedDate(`${calYear}-${z(calMonth+1)}-${z(d)}`); setShowDatePicker(false) }}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                        font: "400 13px 'Roboto'", margin: '0 auto',
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
        <button className="btn btn-text" onClick={() => markAll(employees)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
        <div className="payroll-table-body-scroll" style={{ maxHeight: '520px' }}>
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
                      <div style={{ position: 'relative' }}>
                        <button onClick={(e) => { e.stopPropagation(); setOpenStatusEmp(v => v === emp.id ? null : emp.id) }}
                          style={{ ...selStyle, background: ps.bg, color: ps.color, border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {log.status}
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.7 }}><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        {openStatusEmp === emp.id && (
                          <div onClick={e => e.stopPropagation()}
                            style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '0', zIndex: 50, minWidth: '140px', padding: '6px',
                              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                              border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
                              color: 'var(--md-bw-on-surface)' }}>
                            {Object.entries(PILL_STYLES).map(([k, v]) => (
                              <button key={k} onClick={() => { setLog(emp.id, { status: k }); setOpenStatusEmp(null) }}
                                style={{
                                  display: 'block', width: '100%', padding: '8px 12px', borderRadius: '100px', border: 'none',
                                  cursor: 'pointer', font: "600 12px 'Roboto'", textAlign: 'left',
                                  background: k === log.status ? v.bg : 'transparent',
                                  color: k === log.status ? v.color : 'var(--md-bw-on-surface)',
                                  transition: 'all 0.15s',
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px' }}>
          <button className="btn btn-filled" onClick={() => addToast('Daily logs saved.', 'success')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} /> Save Daily Logs
          </button>
        </div>
      </div>
    </>
  )
}
