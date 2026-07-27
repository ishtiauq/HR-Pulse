import { useRoster } from '../../hooks/useRoster.js'
import { thStyle, cell, addDays } from '../../services/attendance.js'
import { formatDateShort } from '../../services/date.js'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

export default function RosterPlanner({ employees, roster, setRoster, shiftTemplates, addToast }) {
  const {
    weekStart, setWeekStart,
    weekDates, labels, assign, copyPrevWeek, goBack, goNext,
    openRosterEmp, setOpenRosterEmp, openRosterDate, setOpenRosterDate,
    closeAll
  } = useRoster(roster, setRoster, shiftTemplates, employees)

  const assignWithRestCheck = (empId, dateStr, templateId) => {
    if (templateId !== 'Off') {
      const prevDate = addDays(dateStr, -1)
      const pe = (roster || []).find(r => r.employeeId === empId && r.date === prevDate)
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
    assign(empId, dateStr, templateId)
  }

  const handleCopyPrev = () => {
    const { entries, curSet } = copyPrevWeek()
    if (entries.length === 0) return addToast('No shifts found in the previous week to copy.', 'warning')
    setRoster(prev => [...prev.filter(r => !curSet.has(r.date)), ...entries])
    addToast('Copied previous week roster.', 'success')
  }

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-3 pb-4">
        <h3 className="title-medium m-0" style={{ color: 'var(--md-bw-on-surface)' }}>Weekly Roster Planner</h3>
        <div className="flex items-center gap-3">
          <button aria-label="Copy previous week roster" className="btn btn-outlined flex items-center gap-1.5 h-9 text-xs" onClick={handleCopyPrev}>
            <CalendarDays size={14} /> Copy Prev Week
          </button>
          <div className="flex items-center gap-1 p-[3px] rounded-full" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <button aria-label="Previous week" className="btn btn-text px-2 py-1 min-h-[30px]" onClick={goBack}>
              <ChevronLeft size={15} />
            </button>
            <span className="text-[0.82rem] font-semibold px-2 whitespace-nowrap" style={{ color: 'var(--md-bw-on-surface)' }}>
              {formatDateShort(weekDates[0])} — {formatDateShort(weekDates[6])}
            </span>
            <button aria-label="Next week" className="btn btn-text px-2 py-1 min-h-[30px]" onClick={goNext}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
      <div className="payroll-table-container">
        <div className="payroll-table-header-wrap">
          <table className="payroll-table">
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
          </table>
        </div>
        <div className="payroll-table-body-scroll max-h-[520px]">
          <table className="payroll-table">
            <colgroup>
              <col style={{ width: '160px' }} />
              {weekDates.map(d => <col key={d} style={{ width: '120px' }} />)}
            </colgroup>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={cell}>
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full text-white flex items-center justify-center text-[0.6rem] font-bold" style={{ background: 'var(--md-bw-primary)' }}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="body-medium font-medium" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</span>
                    </div>
                  </td>
                  {weekDates.map(d => {
                    const entry = (roster || []).find(r => r.employeeId === emp.id && r.date === d)
                    const tid = entry?.templateId || 'Off'
                    const tmpl = (shiftTemplates || []).find(t => t.id === tid)
                    const isOpen = openRosterEmp === emp.id && openRosterDate === d
                    return (
                      <td key={d} style={{ ...cell, textAlign: 'center', padding: '8px', position: 'relative' }}>
                        <button aria-label={`${emp.name} - ${tmpl ? tmpl.name : 'Off'}`} onClick={(e) => { e.stopPropagation(); setOpenRosterEmp(v => v === emp.id && openRosterDate === d ? null : emp.id); setOpenRosterDate(d) }}
                          className="w-full px-2 py-1.5 rounded-md text-[0.7rem] font-semibold min-h-8 outline-none cursor-pointer flex items-center justify-center gap-1"
                          style={{
                            border: '1px solid var(--glass-border)',
                            background: tmpl ? `${tmpl.color}18` : 'var(--glass-bg)',
                            color: tmpl ? tmpl.color : 'var(--md-bw-on-surface-variant)',
                          }}>
                          {tmpl ? tmpl.name : 'Off'}
                          <svg width="8" height="5" viewBox="0 0 10 6" fill="none" className="opacity-50"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        {isOpen && (
                          <div onClick={e => e.stopPropagation()}
                            className="absolute left-1/2 z-50 min-w-[120px] p-1.5 -translate-x-1/2"
                            style={{ top: 'calc(100% + 4px)',
                              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                              border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
                              color: 'var(--md-bw-on-surface)' }}>
                            <button key="Off" aria-label="Set as off" onClick={() => { assignWithRestCheck(emp.id, d, 'Off'); setOpenRosterEmp(null) }}
                              className="block w-full px-2.5 py-1.5 rounded-full border-0 cursor-pointer text-xs text-center transition-all duration-150"
                              style={{
                                fontFamily: "'Roboto'", fontWeight: 600,
                                background: tid === 'Off' ? '#6c757d' : 'transparent',
                                color: tid === 'Off' ? '#fff' : 'var(--md-bw-on-surface)',
                              }}
                              onMouseEnter={e => { if (tid !== 'Off') e.target.style.background = 'var(--glass-bg)' }}
                              onMouseLeave={e => { if (tid !== 'Off') e.target.style.background = 'transparent' }}>
                              Off
                            </button>
                            {(shiftTemplates || []).map(t => (
                              <button key={t.id} aria-label={`Set shift: ${t.name}`} onClick={() => { assignWithRestCheck(emp.id, d, t.id); setOpenRosterEmp(null) }}
                                className="block w-full px-2.5 py-1.5 rounded-full border-0 cursor-pointer text-xs text-center transition-all duration-150"
                                style={{
                                  fontFamily: "'Roboto'", fontWeight: 600,
                                  background: tid === t.id ? t.color : 'transparent',
                                  color: tid === t.id ? '#fff' : 'var(--md-bw-on-surface)',
                                }}
                                onMouseEnter={e => { if (tid !== t.id) e.target.style.background = 'var(--glass-bg)' }}
                                onMouseLeave={e => { if (tid !== t.id) e.target.style.background = 'transparent' }}>
                                {t.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

