export default function LeaveBalanceCard({ employees, balances }) {
  return (
    <div className="glass-card flex flex-col gap-4 p-6">
      <h3 className="title-medium m-0" style={{ color: 'var(--md-bw-on-surface)' }}>Leave Balances</h3>
      <div className="payroll-table-header-wrap">
        <table className="payroll-table w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-xs uppercase" style={{ borderBottom: '1.5px solid var(--glass-border)', color: 'var(--md-bw-on-surface-variant)' }}>Employee</th>
              <th className="px-3 py-2 text-center font-semibold text-xs uppercase" style={{ borderBottom: '1.5px solid var(--glass-border)', color: 'var(--md-bw-on-surface-variant)' }}>Sick</th>
              <th className="px-3 py-2 text-center font-semibold text-xs uppercase" style={{ borderBottom: '1.5px solid var(--glass-border)', color: 'var(--md-bw-on-surface-variant)' }}>Casual</th>
              <th className="px-3 py-2 text-center font-semibold text-xs uppercase" style={{ borderBottom: '1.5px solid var(--glass-border)', color: 'var(--md-bw-on-surface-variant)' }}>Annual</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const b = balances[emp.id] || {}
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td className="px-3 py-2.5 font-medium text-[13px]" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</td>
                  <td role="status" className="px-3 py-2.5 text-center text-[13px]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{b.sick?.used || 0}/{b.sick?.limit || 14}</td>
                  <td role="status" className="px-3 py-2.5 text-center text-[13px]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{b.casual?.used || 0}/{b.casual?.limit || 10}</td>
                  <td role="status" className="px-3 py-2.5 text-center text-[13px]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{b.annual?.used || 0}/{b.annual?.limit || 20}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
