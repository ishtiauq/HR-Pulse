import { useShiftSwaps } from '../../hooks/useShiftSwaps.js'
import { formatDateShort } from '../../services/date.js'
import { Check, X, Repeat } from 'lucide-react'

export default function ShiftSwaps({ employees, shiftSwaps, setShiftSwaps, roster, setRoster, addToast }) {
  const { pendingSwaps, approveSwap, rejectSwap } = useShiftSwaps(shiftSwaps, setShiftSwaps, roster, setRoster, addToast)

  if (pendingSwaps.length === 0) return null

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Pending Shift Swaps ({pendingSwaps.length})</h3>
      {pendingSwaps.map(swap => {
        const r = employees.find(e => e.id === swap.requesterId)
        const t = employees.find(e => e.id === swap.targetId)
        return (
          <div key={swap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)', marginBottom: '4px' }}>{formatDateShort(swap.date)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="body-large" style={{ fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>{r?.name}</span>
                <Repeat size={14} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                <span className="body-large" style={{ fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>{t?.name}</span>
              </div>
              {swap.reason && <div className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', marginTop: '4px' }}>Reason: {swap.reason}</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-tonal" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => approveSwap(swap.id)}>
                <Check size={13} /> Approve
              </button>
              <button className="btn btn-outlined" style={{ height: '32px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--md-bw-error)' }} onClick={() => rejectSwap(swap.id)}>
                <X size={13} /> Reject
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
