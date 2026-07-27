import { useLeaves } from '../../hooks/useLeaves.js'
import { thStyle, cell, pill } from '../../services/attendance.js'
import { formatDateShort } from '../../services/date.js'
import { Check, X, CalendarDays } from 'lucide-react'

export default function LeaveRequests({ employees, attendance, setAttendance, addToast }) {
  const { leaves, pendingLeaves, historyLeaves, balances, approveLeave, rejectLeave, pendingCount } = useLeaves(attendance, setAttendance, addToast)

  const STATUS = {
    Approved: { bg: '#28a745', color: '#fff' },
    Rejected: { bg: '#dc3545', color: '#fff' },
    Pending: { bg: '#ffc107', color: '#121212' },
  }

  return (
    <div className="payroll-table-container flex flex-col gap-6 p-6">
      <h3 className="title-medium m-0" style={{ color: 'var(--md-bw-on-surface)' }}>
        Pending Requests {pendingCount > 0 && <span className="font-normal" style={{ color: 'var(--md-bw-on-surface-variant)' }}>({pendingCount})</span>}
      </h3>
      {pendingLeaves.length === 0 ? (
        <div className="text-center p-12" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
          <CalendarDays size={32} className="opacity-30 mb-3" />
          <p className="body-medium m-0">No pending leave requests.</p>
        </div>
      ) : (
        <div className="payroll-table-header-wrap">
          <table className="payroll-table w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '160px' }} /><col style={{ width: '120px' }} /><col style={{ width: '180px' }} /><col className="w-[60px]" /><col /><col className="w-[200px]" />
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
              {pendingLeaves.map(l => {
                const emp = employees.find(e => e.id === l.employeeId)
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={cell}><span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{emp?.name || l.employeeId}</span></td>
                    <td style={cell}><span style={{ color: 'var(--md-bw-on-surface)' }}>{l.leaveType}</span></td>
                    <td style={cell}><span className="text-[0.85rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{formatDateShort(l.startDate)} — {formatDateShort(l.endDate)}</span></td>
                    <td style={{ ...cell, textAlign: 'center' }}><span className="body-large font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>{l.days || '—'}</span></td>
                    <td style={cell}><span className="text-[0.85rem] overflow-hidden text-ellipsis whitespace-nowrap block max-w-[200px]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{l.reason || '—'}</span></td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      <div className="flex gap-2 justify-end">
                        <button aria-label="Approve leave request" className="btn btn-tonal px-3.5 h-8 text-xs flex items-center gap-1" onClick={() => approveLeave(l.id)}>
                          <Check size={13} /> Approve
                        </button>
                        <button aria-label="Reject leave request" className="btn btn-outlined px-3.5 h-8 text-xs flex items-center gap-1" style={{ color: 'var(--md-bw-error)' }} onClick={() => rejectLeave(l.id)}>
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

      {historyLeaves.length > 0 && (
        <>
          <h3 className="title-medium m-0" style={{ color: 'var(--md-bw-on-surface)' }}>History</h3>
          <div className="payroll-table-header-wrap">
            <table className="payroll-table w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
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
                {historyLeaves.slice().reverse().map(l => {
                  const emp = employees.find(e => e.id === l.employeeId)
                  const s = STATUS[l.status] || STATUS.Pending
                  return (
                  <tr key={l.id} className="border-b border-black/[0.06]">
                      <td style={cell}><span className="text-[0.85rem]" style={{ color: 'var(--md-bw-on-surface)' }}>{emp?.name || l.employeeId}</span></td>
                      <td style={cell}><span className="text-[0.85rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{l.leaveType}</span></td>
                      <td style={cell}><span className="text-[0.85rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{formatDateShort(l.startDate)} — {formatDateShort(l.endDate)}</span></td>
                      <td style={cell}><span role="status" style={pill(s.bg, s.color)}>{l.status}</span></td>
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
