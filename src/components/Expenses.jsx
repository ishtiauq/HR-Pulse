import { useState, useRef, useMemo } from 'react'
import { Receipt, Plus, Upload, Check, X as XIcon, Clock, DollarSign, Filter, Search, Download, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Expenses({ employees, expenses, setExpenses, settings, addLog, addToast, addAuditLog, simulatedRole }) {
  const [activeTab, setActiveTab] = useState('submit') // submit, approve, finance

  // Employee Submission States
  const [category, setCategory] = useState('Travel')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [receiptBase64, setReceiptBase64] = useState(null)
  
  // Manager Approval States
  const [selectedExpenses, setSelectedExpenses] = useState([])
  const [rejectReasonModal, setRejectReasonModal] = useState({ open: false, id: null, reason: '' })

  const fileInputRef = useRef(null)

  const expenseCategories = ['Travel', 'Meals', 'Office Supplies', 'Medical', 'Other']
  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'BDT']

  // Multi-currency mock exchange rates to USD
  const exchangeRates = { USD: 1, EUR: 1.1, GBP: 1.3, INR: 0.012, BDT: 0.009 }

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptBase64(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || !date || !description) {
      addToast('Please fill all required fields.', 'warning')
      return
    }

    const newExpense = {
      id: `EXP-${Date.now()}`,
      employeeId: 'EMP-101', // Mocking current user ID
      category,
      amount: Number(amount),
      currency,
      usdAmount: Number(amount) * exchangeRates[currency],
      date,
      description,
      status: 'Pending',
      receipt: receiptBase64,
      submittedAt: new Date().toISOString()
    }

    setExpenses(prev => [newExpense, ...prev])
    addAuditLog('CREATE', 'Expense', `Submitted ${currency} ${amount} for ${category}`)
    addToast('Expense submitted for approval.', 'success')
    
    // Reset form
    setAmount('')
    setDescription('')
    setDate('')
    setReceiptBase64(null)
  }

  const handleApprove = (id) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: 'Approved' } : exp))
    addToast('Expense approved.', 'success')
    addAuditLog('UPDATE', 'Expense', `Approved expense ${id}`)
  }

  const handleReject = () => {
    setExpenses(prev => prev.map(exp => exp.id === rejectReasonModal.id ? { ...exp, status: 'Rejected', rejectReason: rejectReasonModal.reason } : exp))
    addToast('Expense rejected.', 'success')
    addAuditLog('UPDATE', 'Expense', `Rejected expense ${rejectReasonModal.id}`)
    setRejectReasonModal({ open: false, id: null, reason: '' })
  }

  const handleBulkApprove = () => {
    setExpenses(prev => prev.map(exp => selectedExpenses.includes(exp.id) ? { ...exp, status: 'Approved' } : exp))
    setSelectedExpenses([])
    addToast(`${selectedExpenses.length} expenses approved.`, 'success')
    addAuditLog('UPDATE', 'Expense', `Bulk approved ${selectedExpenses.length} expenses`)
  }

  const handleToggleSelect = (id) => {
    setSelectedExpenses(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleMarkReimbursed = (id) => {
    const ref = prompt("Enter bank transaction reference:")
    if (ref) {
      setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: 'Reimbursed', transactionRef: ref } : exp))
      addToast('Expense marked as reimbursed.', 'success')
      addAuditLog('UPDATE', 'Expense', `Reimbursed expense ${id} (Ref: ${ref})`)
    }
  }

  const exportCSV = () => {
    const approved = expenses.filter(e => e.status === 'Approved')
    if (approved.length === 0) {
      addToast('No approved expenses to export.', 'warning')
      return
    }
    const headers = ['ID', 'Employee ID', 'Category', 'Amount', 'Currency', 'USD Value', 'Date', 'Description', 'Status']
    const csvContent = [
      headers.join(','),
      ...approved.map(e => `${e.id},${e.employeeId},${e.category},${e.amount},${e.currency},${e.usdAmount},${e.date},"${e.description}",${e.status}`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "approved_expenses.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast('Exported CSV successfully.', 'success')
  }

  // Derived Data
  const pendingQueue = expenses.filter(e => e.status === 'Pending')
  const approvedQueue = expenses.filter(e => e.status === 'Approved')
  
  const pendingLiability = pendingQueue.reduce((acc, curr) => acc + (curr.usdAmount || (curr.amount * exchangeRates[curr.currency])), 0)
  const approvedLiability = approvedQueue.reduce((acc, curr) => acc + (curr.usdAmount || (curr.amount * exchangeRates[curr.currency])), 0)

  const categoryTotals = useMemo(() => {
    const totals = {}
    expenses.filter(e => e.status !== 'Rejected').forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + (exp.usdAmount || (exp.amount * exchangeRates[exp.currency]))
    })
    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  }, [expenses])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const policies = settings.expensePolicies || {}

  const canApprove = ['Admin', 'HR Manager'].includes(simulatedRole)
  const canReimburse = ['Admin', 'Payroll Manager'].includes(simulatedRole)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">
          <Receipt size={28} className="page-title-icon" />
          Expenses
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={`btn ${activeTab === 'submit' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('submit')}>
            <Plus size={16} /> Submit
          </button>
          {canApprove && (
            <button className={`btn ${activeTab === 'approve' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('approve')}>
              <Clock size={16} /> Approvals
              {pendingQueue.length > 0 && (
                <span style={{ background: 'var(--accent-danger)', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '4px' }}>
                  {pendingQueue.length}
                </span>
              )}
            </button>
          )}
          {canReimburse && (
            <button className={`btn ${activeTab === 'finance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('finance')}>
              <PieChartIcon size={16} /> Finance
            </button>
          )}
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === 'submit' && (
        <div className="glass-card" style={{ padding: '32px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} style={{ color: 'var(--accent-primary)' }} />
            New Expense Claim
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                  {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Briefly describe the expense..." rows={3} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}></textarea>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Receipt (Image/PDF)</label>
              <input type="file" accept="image/*,.pdf" ref={fileInputRef} onChange={handleReceiptUpload} style={{ display: 'none' }} />
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {receiptBase64 ? (
                  <img src={receiptBase64} alt="Receipt" style={{ maxHeight: '100px', borderRadius: '8px', objectFit: 'contain' }} />
                ) : (
                  <>
                    <Upload size={24} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Click to upload receipt</span>
                  </>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '14px', justifyContent: 'center' }}>
              Submit for Approval
            </button>
          </form>
        </div>
      )}

      {activeTab === 'approve' && canApprove && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Approval Queue</h3>
            {selectedExpenses.length > 0 && (
              <button className="btn btn-primary" onClick={handleBulkApprove}>
                <Check size={16} /> Bulk Approve ({selectedExpenses.length})
              </button>
            )}
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table table-striped" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px' }}><input type="checkbox" onChange={(e) => setSelectedExpenses(e.target.checked ? pendingQueue.map(q => q.id) : [])} checked={selectedExpenses.length === pendingQueue.length && pendingQueue.length > 0} /></th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Employee</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Details</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receipt</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingQueue.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No pending expenses.</td></tr>
                  ) : (
                    pendingQueue.map(exp => {
                      const emp = employees.find(e => e.id === exp.employeeId)
                      const isOverLimit = policies[exp.category] && (exp.usdAmount || (exp.amount * exchangeRates[exp.currency])) > policies[exp.category]

                      return (
                        <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px' }}><input type="checkbox" checked={selectedExpenses.includes(exp.id)} onChange={() => handleToggleSelect(exp.id)} /></td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={emp?.avatar || `https://ui-avatars.com/api/?name=${emp?.name}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{exp.id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exp.category}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{exp.date} • {exp.description}</div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exp.currency} {exp.amount.toFixed(2)}</div>
                            {isOverLimit && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-warning)', fontSize: '0.75rem', marginTop: '4px' }}>
                                <AlertTriangle size={12} /> Over limit (${policies[exp.category]})
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {exp.receipt ? (
                              <img src={exp.receipt} alt="Receipt" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None</span>
                            )}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleApprove(exp.id)} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-success)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Approve">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setRejectReasonModal({ open: true, id: exp.id, reason: '' })} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Reject">
                                <XIcon size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && canReimburse && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Finance Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Pending Liability</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={32} />
                {pendingLiability.toFixed(2)}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Total pending reimbursements (in USD)</p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Expenses by Category</h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {categoryTotals.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Approved & Waiting for Reimbursement Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Ready for Reimbursement</h3>
            <button className="btn btn-secondary" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table table-striped" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Employee</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedQueue.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No approved expenses waiting for reimbursement.</td></tr>
                  ) : (
                    approvedQueue.map(exp => {
                      const emp = employees.find(e => e.id === exp.employeeId)
                      return (
                        <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{exp.id}</div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '0.9rem' }}>{exp.category}</td>
                          <td style={{ padding: '16px', fontWeight: 600 }}>{exp.currency} {exp.amount.toFixed(2)}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                              Approved
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleMarkReimbursed(exp.id)}>
                              Mark Reimbursed
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectReasonModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Reject Expense</h3>
            <textarea 
              value={rejectReasonModal.reason}
              onChange={e => setRejectReasonModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Provide a reason for rejection..."
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setRejectReasonModal({ open: false, id: null, reason: '' })}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--accent-danger)' }} onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
