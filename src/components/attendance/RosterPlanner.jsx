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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '0 0 16px' }}>
        <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Weekly Roster Planner</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-outlined" onClick={handleCopyPrev} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', fontSize: '12px' }}>
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
        <div className="payroll-table-body-scroll" style={{ maxHeight: '520px' }}>
          <table className="payroll-table">
            <colgroup>
              <col style={{ width: '160px' }} />
              {weekDates.map(d => <col key={d} style={{ width: '120px' }} />)}
            </colgroup>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
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
                    const isOpen = openRosterEmp === emp.id && openRosterDate === d
                    return (
                      <td key={d} style={{ ...cell, textAlign: 'center', padding: '8px', position: 'relative' }}>
                        <button onClick={(e) => { e.stopPropagation(); setOpenRosterEmp(v => v === emp.id && openRosterDate === d ? null : emp.id); setOpenRosterDate(d) }}
                          style={{
                            width: '100%', padding: '6px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, minHeight: '32px',
                            border: '1px solid var(--glass-border)', outline: 'none', cursor: 'pointer',
                            background: tmpl ? `${tmpl.color}18` : 'var(--glass-bg)',
                            color: tmpl ? tmpl.color : 'var(--md-bw-on-surface-variant)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                          }}>
                          {tmpl ? tmpl.name : 'Off'}
                          <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.5 }}><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        {isOpen && (
                          <div onClick={e => e.stopPropagation()}
                            style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', zIndex: 50, minWidth: '120px', padding: '6px',
                              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                              border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)',
                              color: 'var(--md-bw-on-surface)' }}>
                            <button key="Off" onClick={() => { assignWithRestCheck(emp.id, d, 'Off'); setOpenRosterEmp(null) }}
                              style={{
                                display: 'block', width: '100%', padding: '6px 10px', borderRadius: '100px', border: 'none',
                                cursor: 'pointer', font: "600 11px 'Roboto'", textAlign: 'center',
                                background: tid === 'Off' ? '#6c757d' : 'transparent',
                                color: tid === 'Off' ? '#fff' : 'var(--md-bw-on-surface)',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { if (tid !== 'Off') e.target.style.background = 'var(--glass-bg)' }}
                              onMouseLeave={e => { if (tid !== 'Off') e.target.style.background = 'transparent' }}>
                              Off
                            </button>
                            {(shiftTemplates || []).map(t => (
                              <button key={t.id} onClick={() => { assignWithRestCheck(emp.id, d, t.id); setOpenRosterEmp(null) }}
                                style={{
                                  display: 'block', width: '100%', padding: '6px 10px', borderRadius: '100px', border: 'none',
                                  cursor: 'pointer', font: "600 11px 'Roboto'", textAlign: 'center',
                                  background: tid === t.id ? t.color : 'transparent',
                                  color: tid === t.id ? '#fff' : 'var(--md-bw-on-surface)',
                                  transition: 'all 0.15s',
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

