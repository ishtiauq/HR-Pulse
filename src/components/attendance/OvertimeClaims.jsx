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
    <div className="payroll-table-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
        Overtime Approvals {pendingOvertime.length > 0 && <span style={{ fontWeight: 400, color: 'var(--md-bw-on-surface-variant)' }}>({pendingOvertime.length})</span>}
      </h3>

      {pendingOvertime.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--md-bw-on-surface-variant)' }}>
          <Clock size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p className="body-medium" style={{ margin: 0 }}>No pending overtime claims.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingOvertime.map(c => {
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
                  <button className="btn btn-tonal" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => approveOvertime(c.id)}>
                    <Check size={13} /> Approve
                  </button>
                  <button className="btn btn-outlined" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--md-bw-error)' }} onClick={() => rejectOvertime(c.id)}>
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
                {historyOvertime.slice().reverse().map(c => {
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
