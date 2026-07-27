import { useState, useRef, useMemo } from 'react'
import { Receipt, Plus, Upload, Check, X as XIcon, Clock, DollarSign, Filter, Search, Download, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react'
import AdSlot from './AdSlot'
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
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">
          <Receipt size={28} className="page-title-icon" />
          Expenses
        </h1>
        <div className="flex gap-3">
          <button className={`btn ${activeTab === 'submit' ? 'btn-primary' : 'btn-secondary'}`} aria-label="Submit expense" onClick={() => setActiveTab('submit')}>
            <Plus size={16} /> Submit
          </button>
          {canApprove && (
            <button className={`btn ${activeTab === 'approve' ? 'btn-primary' : 'btn-secondary'}`} aria-label="Approvals" onClick={() => setActiveTab('approve')}>
              <Clock size={16} /> Approvals
              {pendingQueue.length > 0 && (
                <span role="status" style={{ background: 'var(--accent-danger)', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '4px' }}>
                  {pendingQueue.length}
                </span>
              )}
            </button>
          )}
          {canReimburse && (
            <button className={`btn ${activeTab === 'finance' ? 'btn-primary' : 'btn-secondary'}`} aria-label="Finance" onClick={() => setActiveTab('finance')}>
              <PieChartIcon size={16} /> Finance
            </button>
          )}
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === 'submit' && (
        <div className="glass-card p-8 max-w-[600px]">
          <h3 className="text-xl mb-6 flex items-center gap-2">
            <Receipt size={20} style={{ color: 'var(--accent-primary)' }} />
            New Expense Claim
          </h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select aria-label="Expense category" value={category} onChange={e => setCategory(e.target.value)} className="px-3.5 py-2.5 rounded-lg outline-none" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required aria-label="Expense date" className="px-3.5 py-2.5 rounded-lg outline-none" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-[2] flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" aria-label="Expense amount" className="px-3.5 py-2.5 rounded-lg outline-none" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Currency</label>
                <select aria-label="Currency" value={currency} onChange={e => setCurrency(e.target.value)} className="px-3.5 py-2.5 rounded-lg outline-none" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Briefly describe the expense..." rows={3} aria-label="Expense description" className="px-3.5 py-2.5 rounded-lg outline-none resize-y" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}></textarea>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Receipt (Image/PDF)</label>
              <input type="file" accept="image/*,.pdf" ref={fileInputRef} onChange={handleReceiptUpload} className="hidden" />
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
                  transition: 'background-color 0.2s, border-color 0.2s'
                }}
              >
                {receiptBase64 ? (
                  <img src={receiptBase64} alt="Receipt" className="max-h-[100px] rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload size={24} style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Click to upload receipt</span>
                  </>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-3 p-3.5 justify-center">
              Submit for Approval
            </button>
          </form>
        </div>
      )}

      {activeTab === 'approve' && canApprove && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Approval Queue</h3>
            {selectedExpenses.length > 0 && (
              <button className="btn btn-primary" onClick={handleBulkApprove}>
                <Check size={16} /> Bulk Approve ({selectedExpenses.length})
              </button>
            )}
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table role="table" className="data-table table-striped w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="p-4"><input type="checkbox" aria-label="Select all" onChange={(e) => setSelectedExpenses(e.target.checked ? pendingQueue.map(q => q.id) : [])} checked={selectedExpenses.length === pendingQueue.length && pendingQueue.length > 0} /></th>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Employee</th>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Details</th>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Receipt</th>
                    <th className="p-4 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingQueue.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No pending expenses.</td></tr>
                  ) : (
                    pendingQueue.map(exp => {
                      const emp = employees.find(e => e.id === exp.employeeId)
                      const isOverLimit = policies[exp.category] && (exp.usdAmount || (exp.amount * exchangeRates[exp.currency])) > policies[exp.category]

                      return (
                        <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                          <td className="p-4"><input type="checkbox" checked={selectedExpenses.includes(exp.id)} onChange={() => handleToggleSelect(exp.id)} /></td>
                          <td className="p-4">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={emp?.avatar || `https://ui-avatars.com/api/?name=${emp?.name}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <div className="font-semibold text-sm">{emp?.name}</div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{exp.id}</div>
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
                              <img src={exp.receipt} alt="Receipt" className="w-10 h-10 rounded-md object-cover" style={{ border: '1px solid var(--border-color)' }} />
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>None</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button aria-label="Approve" onClick={() => handleApprove(exp.id)} className="border-0 p-1.5 rounded-md cursor-pointer" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-success)' }} title="Approve">
                                <Check size={16} />
                              </button>
                              <button aria-label="Reject" onClick={() => setRejectReasonModal({ open: true, id: exp.id, reason: '' })} className="border-0 p-1.5 rounded-md cursor-pointer" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)' }} title="Reject">
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
        <div className="flex flex-col gap-6">
          {/* Finance Metrics */}
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
            <div className="glass-card p-6 flex flex-col justify-center">
              <h3 className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Pending Liability</h3>
              <div className="text-4xl font-bold flex items-center gap-2" style={{ color: 'var(--accent-warning)' }}>
                <DollarSign size={32} />
                {pendingLiability.toFixed(2)}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Total pending reimbursements (in USD)</p>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-base mb-4">Expenses by Category</h3>
              <div className="h-[200px]">
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
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Ready for Reimbursement</h3>
            <button className="btn btn-secondary" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table role="table" className="data-table table-striped w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Employee</th>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Category</th>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                    <th className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Status</th>
                    <th className="p-4 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedQueue.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No approved expenses waiting for reimbursement.</td></tr>
                  ) : (
                    approvedQueue.map(exp => {
                      const emp = employees.find(e => e.id === exp.employeeId)
                      return (
                        <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px' }}>
                            <div className="font-semibold text-sm">{emp?.name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{exp.id}</div>
                          </td>
                          <td className="p-4 text-sm">{exp.category}</td>
                          <td className="p-4 font-semibold">{exp.currency} {exp.amount.toFixed(2)}</td>
                          <td style={{ padding: '16px' }}>
                            <span role="status" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                              Approved
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => handleMarkReimbursed(exp.id)}>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card animate-fade-in p-6 w-full max-w-[400px]">
            <h3 className="mt-0 mb-4">Reject Expense</h3>
            <textarea 
              value={rejectReasonModal.reason}
              onChange={e => setRejectReasonModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Provide a reason for rejection..."
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button className="btn btn-secondary" onClick={() => setRejectReasonModal({ open: false, id: null, reason: '' })}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--accent-danger)' }} onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
      <AdSlot />
    </div>
  )
}
