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
    <div className="payroll-table-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
        Pending Requests {pendingCount > 0 && <span style={{ fontWeight: 400, color: 'var(--md-bw-on-surface-variant)' }}>({pendingCount})</span>}
      </h3>
      {pendingLeaves.length === 0 ? (
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
              {pendingLeaves.map(l => {
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
                        <button className="btn btn-tonal" style={{ padding: '0 14px', height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => approveLeave(l.id)}>
                          <Check size={13} /> Approve
                        </button>
                        <button className="btn btn-outlined" style={{ padding: '0 14px', height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--md-bw-error)' }} onClick={() => rejectLeave(l.id)}>
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
                {historyLeaves.slice().reverse().map(l => {
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
