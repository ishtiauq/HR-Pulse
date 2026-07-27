import { useShiftSwaps } from '../../hooks/useShiftSwaps.js'
import { formatDateShort } from '../../services/date.js'
import { Check, X, Repeat } from 'lucide-react'

export default function ShiftSwaps({ employees, shiftSwaps, setShiftSwaps, roster, setRoster, addToast }) {
  const { pendingSwaps, approveSwap, rejectSwap } = useShiftSwaps(shiftSwaps, setShiftSwaps, roster, setRoster, addToast)

  if (pendingSwaps.length === 0) return null

  return (
    <div className="glass-card flex flex-col gap-4 p-6">
      <h3 className="title-medium m-0" style={{ color: 'var(--md-bw-on-surface)' }}>Pending Shift Swaps ({pendingSwaps.length})</h3>
      {pendingSwaps.map(swap => {
        const r = employees.find(e => e.id === swap.requesterId)
        const t = employees.find(e => e.id === swap.targetId)
        return (
          <div key={swap.id} className="flex justify-between items-center flex-wrap gap-3 p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div className="flex-1 min-w-[200px]">
              <div className="label-small mb-1" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{formatDateShort(swap.date)}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="body-large font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>{r?.name}</span>
                <Repeat size={14} className="opacity-60" style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                <span className="body-large font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>{t?.name}</span>
              </div>
              {swap.reason && <div className="body-small mt-1" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Reason: {swap.reason}</div>}
            </div>
            <div className="flex gap-2">
              <button aria-label="Approve shift swap" className="btn btn-tonal h-8 px-3.5 text-xs flex items-center gap-1" onClick={() => approveSwap(swap.id)}>
                <Check size={13} /> Approve
              </button>
              <button aria-label="Reject shift swap" className="btn btn-outlined h-8 px-3.5 text-xs flex items-center gap-1" style={{ color: 'var(--md-bw-error)' }} onClick={() => rejectSwap(swap.id)}>
                <X size={13} /> Reject
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
