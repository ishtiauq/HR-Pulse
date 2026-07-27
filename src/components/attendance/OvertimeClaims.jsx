import { useOvertime } from '../../hooks/useOvertime.js'
import { cell, pill, thStyle } from '../../services/attendance.js'
import { formatDateShort } from '../../services/date.js'
import { Clock, Check, X } from 'lucide-react'

export default function OvertimeClaims({ employees, overtimeClaims, setOvertimeClaims, addToast }) {
  const { pendingOvertime, historyOvertime, approveOvertime, rejectOvertime } = useOvertime(overtimeClaims, setOvertimeClaims, addToast)

  const STATUS = {
    Approved: { bg: '#28a745', color: '#fff' },
    Rejected: { bg: '#dc3545', color: '#fff' },
    Pending: { bg: '#ffc107', color: '#121212' },
  }

  return (
    <div className="payroll-table-container flex flex-col gap-5 p-6">
      <h3 className="title-medium m-0" style={{ color: 'var(--md-bw-on-surface)' }}>
        Overtime Approvals {pendingOvertime.length > 0 && <span className="font-normal" style={{ color: 'var(--md-bw-on-surface-variant)' }}>({pendingOvertime.length})</span>}
      </h3>

      {pendingOvertime.length === 0 ? (
        <div className="text-center p-12" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
          <Clock size={32} className="opacity-30 mb-3" />
          <p className="body-medium m-0">No pending overtime claims.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingOvertime.map(c => {
            const emp = employees.find(e => e.id === c.employeeId)
            return (
              <div key={c.id} className="flex justify-between items-center flex-wrap gap-3 p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div className="flex-1 min-w-[200px]">
                  <div className="body-large font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>{emp?.name}</div>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{formatDateShort(c.date)}</span>
                    <span className="body-small font-bold" style={{ color: '#b8860b' }}>{c.hours}h OT</span>
                  </div>
                  {c.reason && <div className="body-small mt-0.5" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{c.reason}</div>}
                </div>
                <div className="flex gap-2">
                  <button aria-label="Approve overtime claim" className="btn btn-tonal h-8 px-3.5 text-xs flex items-center gap-1" onClick={() => approveOvertime(c.id)}>
                    <Check size={13} /> Approve
                  </button>
                  <button aria-label="Reject overtime claim" className="btn btn-outlined h-8 px-3.5 text-xs flex items-center gap-1" style={{ color: 'var(--md-bw-error)' }} onClick={() => rejectOvertime(c.id)}>
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {historyOvertime.length > 0 && (
        <>
          <h3 className="title-medium m-0" style={{ color: 'var(--md-bw-on-surface)' }}>History</h3>
          <div className="payroll-table-header-wrap">
            <table className="payroll-table w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
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
                {historyOvertime.slice().reverse().map(c => {
                  const emp = employees.find(e => e.id === c.employeeId)
                  const s = STATUS[c.status] || STATUS.Pending
                  return (
                    <tr key={c.id} className="border-b border-black/[0.06]">
                      <td style={cell}><span className="text-[0.85rem]" style={{ color: 'var(--md-bw-on-surface)' }}>{emp?.name}</span></td>
                      <td style={cell}><span className="text-[0.85rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{formatDateShort(c.date)}</span></td>
                      <td style={cell}><span className="text-[0.85rem]" style={{ color: 'var(--md-bw-on-surface)' }}>{c.hours}h</span></td>
                      <td style={cell}><span role="status" style={pill(s.bg, s.color)}>{c.status}</span></td>
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
