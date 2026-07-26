export default function LeaveBalanceCard({ employees, balances }) {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Leave Balances</h3>
      <div className="payroll-table-header-wrap">
        <table className="payroll-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1.5px solid var(--glass-border)', fontWeight: 600, fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Employee</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1.5px solid var(--glass-border)', fontWeight: 600, fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Sick</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1.5px solid var(--glass-border)', fontWeight: 600, fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Casual</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1.5px solid var(--glass-border)', fontWeight: 600, fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Annual</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const b = balances[emp.id] || {}
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--md-bw-on-surface)', fontWeight: 500, fontSize: '13px' }}>{emp.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: 'var(--md-bw-on-surface-variant)' }}>{b.sick?.used || 0}/{b.sick?.limit || 14}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: 'var(--md-bw-on-surface-variant)' }}>{b.casual?.used || 0}/{b.casual?.limit || 10}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: 'var(--md-bw-on-surface-variant)' }}>{b.annual?.used || 0}/{b.annual?.limit || 20}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
