import { useState } from 'react'
import { CreditCard, Download, Search, X, PlusCircle, Calendar, Pencil, CheckSquare, Trash2 } from 'lucide-react'
import AdSlot from './AdSlot.jsx'
import { formatDate } from '../services/date.js'

export default function Payroll({ employees, payroll, setPayroll, addLog, driveConnected, settings, simulatedRole, addAuditLog }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-07')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [processingId, setProcessingId] = useState(null)

  // Side Drawer and editing states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedEmpLog, setSelectedEmpLog] = useState(null)
  const [grossSalaryInput, setGrossSalaryInput] = useState(0)
  const [advanceInput, setAdvanceInput] = useState(0)
  const [loanTotalInput, setLoanTotalInput] = useState(0)
  const [loanInstallmentInput, setLoanInstallmentInput] = useState(0)
  const [loanRemainingInput, setLoanRemainingInput] = useState(0)

  // Bulk Action State
  const [selectedRows, setSelectedRows] = useState([])
  const [scrollTop, setScrollTop] = useState(0)

  const currency = settings?.currency || '$'
  const structure = settings?.salaryStructure || [
    { id: 'basic', name: 'Basic Salary', percentage: 50, type: 'earning' },
    { id: 'hra', name: 'House Rent Allowance (HRA)', percentage: 25, type: 'earning' },
    { id: 'medical', name: 'Medical Allowance', percentage: 10, type: 'earning' },
    { id: 'conveyance', name: 'Conveyance Allowance', percentage: 10, type: 'earning' },
    { id: 'pf', name: 'Provident Fund (PF)', percentage: 5, type: 'deduction' }
  ]

  const monthOptions = [
    { value: '2026-05', label: 'May 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-10', label: 'October 2026' }
  ]

  // Map/Sync payroll items with current employees list for the selected month
  const getPayrollEntries = () => {
    const monthData = payroll[selectedMonth]
    if (!monthData) return null // Requires initialization

    const basicComp = structure.find(s => s.id === 'basic' || s.name.toLowerCase().includes('basic'))
    const basicPercent = basicComp ? basicComp.percentage : 50

    const allowanceComps = structure.filter(s => s.type === 'earning' && s.id !== (basicComp?.id || 'basic'))
    const allowancePercent = allowanceComps.reduce((a, c) => a + c.percentage, 0)

    const deductionComps = structure.filter(s => s.type === 'deduction')
    const deductionPercent = deductionComps.reduce((a, c) => a + c.percentage, 0)

    return employees.map(emp => {
      const existing = monthData.find(p => p.employeeId === emp.id)
      
      // Default Gross salaries by role
      let gross = 3200
      if (existing && existing.grossSalary) {
        gross = existing.grossSalary
      } else {
        if (emp.role.includes('Manager')) {
          gross = 4500
        } else if (emp.role.includes('Lead') || emp.role.includes('Senior')) {
          gross = 5200
        } else if (emp.role.includes('Engineer')) {
          gross = 4000
        }
      }

      // Compute dynamic components using global settings
      const baseSalary = Math.round(gross * (basicPercent / 100))
      const allowance = Math.round(gross * (allowancePercent / 100))
      const deductions = Math.round(gross * (deductionPercent / 100))
      
      // Advance and Loan allocations
      const advance = existing?.advance || 0
      const loan = existing?.loan || { total: 0, installment: 0, remaining: 0 }

      return {
        employeeId: emp.id,
        grossSalary: gross,
        baseSalary,
        allowance,
        deductions,
        advance,
        loan,
        status: existing?.status || 'Pending',
        paymentDate: existing?.paymentDate || '',
        employee: emp
      }
    })
  }

  const entries = getPayrollEntries()

  // Initialize a new month copying previous settings and subtracting paid loan installments
  const handleInitializeMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const prevMonthVal = m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2, '0')}`
    const prevMonthData = payroll[prevMonthVal] || []

    const newEntries = employees.map(emp => {
      const prevRecord = prevMonthData.find(p => p.employeeId === emp.id)
      const prevRemaining = prevRecord?.loan?.remaining || 0
      const prevInstallment = prevRecord?.loan?.installment || 0
      const prevTotal = prevRecord?.loan?.total || 0

      // Calculate carried over loan balance deducting paid installment
      let nextRemaining = prevRemaining
      if (prevRecord && prevRecord.status === 'Paid') {
        nextRemaining = Math.max(0, prevRemaining - Math.min(prevRemaining, prevInstallment))
      }

      let gross = prevRecord?.grossSalary || 3200
      if (!prevRecord) {
        if (emp.role.includes('Manager')) gross = 4500
        else if (emp.role.includes('Lead') || emp.role.includes('Senior')) gross = 5200
        else if (emp.role.includes('Engineer')) gross = 4000
      }

      return {
        employeeId: emp.id,
        grossSalary: gross,
        baseSalary: 0,
        allowance: 0,
        deductions: 0,
        advance: 0, // Reset advances for new month
        loan: {
          total: prevTotal,
          installment: prevInstallment,
          remaining: nextRemaining
        },
        status: 'Pending',
        paymentDate: ''
      }
    })

    setPayroll(prev => ({
      ...prev,
      [selectedMonth]: newEntries
    }))

    addLog('Payroll Initialized', `Created new payroll record sheet for ${selectedMonth}`, 'success')
    if (addAuditLog) addAuditLog('CREATE', 'Payroll', `Initialized payroll for ${selectedMonth}`)
  }

  // Calculations (Only if initialized)
  const totalCost = entries ? entries.reduce((acc, curr) => {
    const loanDeduction = Math.min(curr.loan.remaining, curr.loan.installment)
    const net = curr.baseSalary + curr.allowance - curr.deductions - curr.advance - loanDeduction
    return acc + net
  }, 0) : 0
  
  const paidCount = entries ? entries.filter(e => e.status === 'Paid').length : 0
  const totalCount = entries ? entries.length : 0
  const averageSalary = totalCount > 0 ? Math.round(totalCost / totalCount) : 0
  const progressPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0

  // Filter list
  const filteredEntries = entries ? entries.filter(entry => {
    const emp = entry.employee
    if (!emp) return false
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || entry.status === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  const containerHeight = 600 // px
  const rowHeight = 75 // px
  const overscan = 5
  
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop)
  }

  const totalRows = filteredEntries.length
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(totalRows - 1, Math.floor((scrollTop + containerHeight) / rowHeight) + overscan)
  
  const visibleEntries = filteredEntries.slice(startIndex, endIndex + 1)
  
  const paddingTop = startIndex * rowHeight
  const paddingBottom = Math.max(0, (totalRows - endIndex - 1) * rowHeight)

  // Execute payment and reduce loan remaining balances
  const handleExecutePayment = (entry) => {
    setProcessingId(entry.employeeId)
    setTimeout(() => {
      const today = formatDate(new Date().toISOString().split('T')[0])
      
      const loanDeduction = Math.min(entry.loan.remaining, entry.loan.installment)
      const nextRemaining = Math.max(0, entry.loan.remaining - loanDeduction)

      // Update state for selected month dictionary key
      setPayroll(prev => {
        const monthData = prev[selectedMonth] || []
        const index = monthData.findIndex(p => p.employeeId === entry.employeeId)
        
        const updatedEntry = {
          employeeId: entry.employeeId,
          grossSalary: entry.grossSalary,
          baseSalary: entry.baseSalary,
          allowance: entry.allowance,
          deductions: entry.deductions,
          status: 'Paid',
          paymentDate: today,
          advance: 0,
          loan: {
            total: entry.loan.total,
            installment: entry.loan.installment,
            remaining: nextRemaining
          }
        }
        
        const nextMonthData = [...monthData]
        if (index > -1) {
          nextMonthData[index] = updatedEntry
        } else {
          nextMonthData.push(updatedEntry)
        }

        return {
          ...prev,
          [selectedMonth]: nextMonthData
        }
      })

      const finalNet = entry.baseSalary + entry.allowance - entry.deductions - entry.advance - loanDeduction
      addLog('Salary Disbursed', `Processed salary payout of ${currency}${finalNet} to ${entry.employee.name}`, 'success')
      if (addAuditLog) addAuditLog('UPDATE', 'Payroll', `Executed payment for ${entry.employee.name} in ${selectedMonth}`)
      setProcessingId(null)

      // Download Payslip text receipt
      generatePayslipReceipt(entry, today)
    }, 1200)
  }

  // Bulk Actions
  const handlePayAllPending = () => {
    const pendingEntries = entries ? entries.filter(e => e.status === 'Pending') : []
    if (pendingEntries.length === 0) return

    setProcessingId('bulk-all')
    setTimeout(() => {
      const today = formatDate(new Date().toISOString().split('T')[0])
      setPayroll(prev => {
        const monthData = prev[selectedMonth] || []
        const updatedMonthData = monthData.map(entry => {
          if (entry.status === 'Pending') {
            const loanDeduction = Math.min(entry.loan.remaining, entry.loan.installment)
            return {
              ...entry,
              status: 'Paid',
              paymentDate: today,
              advance: 0,
              loan: {
                ...entry.loan,
                remaining: Math.max(0, entry.loan.remaining - loanDeduction)
              }
            }
          }
          return entry
        })
        return { ...prev, [selectedMonth]: updatedMonthData }
      })
      addLog('Bulk Disbursed', `Processed salary payout for ${pendingEntries.length} employees`, 'success')
      if (addAuditLog) addAuditLog('UPDATE', 'Payroll', `Bulk executed ${pendingEntries.length} payments in ${selectedMonth}`)
      setProcessingId(null)
    }, 1500)
  }

  const handleBulkExecute = () => {
    if (simulatedRole === 'HR Manager') return;
    if (selectedRows.length === 0) return
    const entriesToPay = entries.filter(e => selectedRows.includes(e.employeeId) && e.status === 'Pending')
    if (entriesToPay.length === 0) return

    setProcessingId('bulk-selected')
    setTimeout(() => {
      const today = formatDate(new Date().toISOString().split('T')[0])
      setPayroll(prev => {
        const monthData = prev[selectedMonth] || []
        const updatedMonthData = monthData.map(entry => {
          if (selectedRows.includes(entry.employeeId) && entry.status === 'Pending') {
            const loanDeduction = Math.min(entry.loan.remaining, entry.loan.installment)
            return {
              ...entry,
              status: 'Paid',
              paymentDate: today,
              advance: 0,
              loan: {
                ...entry.loan,
                remaining: Math.max(0, entry.loan.remaining - loanDeduction)
              }
            }
          }
          return entry
        })
        return { ...prev, [selectedMonth]: updatedMonthData }
      })
      addLog('Bulk Disbursed', `Processed salary payout for ${entriesToPay.length} selected employees`, 'success')
      if (addAuditLog) addAuditLog('UPDATE', 'Payroll', `Bulk executed ${entriesToPay.length} payments in ${selectedMonth}`)
      setProcessingId(null)
      setSelectedRows([])
    }, 1500)
  }

  const toggleRowSelection = (empId) => {
    setSelectedRows(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredEntries.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredEntries.map(e => e.employeeId))
    }
  }

  // Generate a beautiful text-based receipt download
  const generatePayslipReceipt = (entry, payDate) => {
    const loanDeduction = Math.min(entry.loan.remaining, entry.loan.installment)
    const net = entry.baseSalary + entry.allowance - entry.deductions - entry.advance - loanDeduction
    const grossVal = entry.grossSalary

    const earningsLines = structure
      .filter(s => s.type === 'earning')
      .map(s => `- ${s.name} (${s.percentage}%):      ${currency}${(grossVal * (s.percentage / 100)).toFixed(2)}`)
      .join('\n')

    const deductionsLines = structure
      .filter(s => s.type === 'deduction')
      .map(s => `- ${s.name} (${s.percentage}%):    - ${currency}${(grossVal * (s.percentage / 100)).toFixed(2)}`)
      .join('\n')

    // Advance and Loan lines
    const advanceSection = entry.advance > 0 ? `\n- Salary Advance Settlement:       - ${currency}${entry.advance.toFixed(2)}` : ''
    const loanSection = loanDeduction > 0 ? `\n- Company Loan Installment:        - ${currency}${loanDeduction.toFixed(2)} (Remaining: ${currency}${(entry.loan.remaining - loanDeduction).toFixed(2)})` : ''

    const receiptText = `
================================================
             HR PULSE PAYSLIP RECEIPT
================================================
Month Cycle: ${selectedMonth}
Receipt Date: ${payDate}
Employee Name: ${entry.employee.name}
Employee ID: ${entry.employeeId}
Role: ${entry.employee.role}
Department: ${entry.employee.department}
Email: ${entry.employee.email}

------------------------------------------------
SALARY STRUCTURE SPLIT:
------------------------------------------------
Gross Salary Reference:  ${currency}${grossVal.toFixed(2)}

EARNINGS:
${earningsLines || 'No earning components configured.'}

DEDUCTIONS:
${deductionsLines || 'No deduction components configured.'}${advanceSection}${loanSection}

------------------------------------------------
NET PAYOUT AMOUNT:       ${currency}${net.toFixed(2)}
------------------------------------------------
Payment Method:          Direct Deposit (Google Drive Ledger)
Status:                  PAID / SUCCESSFUL

Thank you for your service!
================================================
    `
    const element = document.createElement("a")
    const file = new Blob([receiptText], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `payslip_${entry.employeeId}_${selectedMonth}_${entry.employee.name.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Manage Compensation & Loan/Advance helper
  const openCompensationModal = (entry) => {
    setSelectedEmpLog(entry)
    setGrossSalaryInput(entry.grossSalary)
    setAdvanceInput(entry.advance)
    setLoanTotalInput(entry.loan.total)
    setLoanInstallmentInput(entry.loan.installment)
    setLoanRemainingInput(entry.loan.remaining)
    setIsDrawerOpen(true)
  }

  const handleSaveCompensationLedger = (e) => {
    e.preventDefault()
    if (!selectedEmpLog) return

    setPayroll(prev => {
      const monthData = prev[selectedMonth] || []
      const index = monthData.findIndex(p => p.employeeId === selectedEmpLog.employeeId)
      
      const updatedEntry = {
        employeeId: selectedEmpLog.employeeId,
        grossSalary: Number(grossSalaryInput) || 3200,
        baseSalary: selectedEmpLog.baseSalary, // dynamic
        allowance: selectedEmpLog.allowance,   // dynamic
        deductions: selectedEmpLog.deductions, // dynamic
        status: selectedEmpLog.status,
        paymentDate: selectedEmpLog.paymentDate,
        advance: Number(advanceInput) || 0,
        loan: {
          total: Number(loanTotalInput) || 0,
          installment: Number(loanInstallmentInput) || 0,
          remaining: Number(loanRemainingInput) || 0
        }
      }

      const nextMonthData = [...monthData]
      if (index > -1) {
        nextMonthData[index] = updatedEntry
      } else {
        nextMonthData.push(updatedEntry)
      }

      setIsDrawerOpen(false)
      setTimeout(() => setSelectedEmpLog(null), 300)

      return {
        ...prev,
        [selectedMonth]: nextMonthData
      }
    })

    addLog('Ledger Updated', `Updated compensation settings for ${selectedEmpLog.employee.name}`, 'success')
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header and Month Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
          Payroll
        </h1>

        {/* M3 Outlined Dropdown */}
        <div style={{ position: 'relative', width: '200px' }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="m3-select"
            style={{
              width: '100%',
              padding: '16px 14px',
              borderRadius: '4px',
              border: '1px solid var(--md-bw-outline)',
              background: 'transparent',
              color: 'var(--md-bw-on-surface)',
              fontSize: '16px',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none'
            }}
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', background: 'var(--md-bw-background)', padding: '0 4px', pointerEvents: 'none' }}>Month</span>
          <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--md-bw-on-surface-variant)' }}>▼</span>
        </div>
      </div>

      {/* RENDER BASED ON INITIALIZATION STATE */}
      {!entries ? (
        <div className="glass-card animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Calendar size={48} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Payroll Not Initialized</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
              The payroll sheet for {monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth} has not been created yet. 
              Initialize it to pull the active roster and carry over compensation parameters.
            </p>
          </div>
          <button onClick={handleInitializeMonth} className="btn btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} /> Initialize Month Payroll
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {/* Total Cost Card */}
            <div className="m3-card m3-card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)', marginBottom: '8px' }}>Total Payout Budget</span>
              <h3 className="display-small" style={{ margin: 0, fontVariantNumeric: 'tabular-nums', color: 'var(--md-bw-on-surface)' }}>{currency}{totalCost.toLocaleString()}</h3>
            </div>

            {/* Average Salary Card */}
            <div className="m3-card m3-card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)', marginBottom: '8px' }}>Average Salary</span>
              <h3 className="display-small" style={{ margin: 0, fontVariantNumeric: 'tabular-nums', color: 'var(--md-bw-on-surface)' }}>{currency}{averageSalary.toLocaleString()}</h3>
            </div>

            {/* Progress Card */}
            <div className="m3-card m3-card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)', marginBottom: '8px' }}>Disbursement Flow</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{paidCount} of {totalCount} Paid</span>
                {paidCount < totalCount && (
                  <button 
                    onClick={handlePayAllPending} 
                    disabled={processingId === 'bulk-all' || simulatedRole === 'HR Manager'}
                    className="btn btn-text" 
                    style={{ padding: '0', height: 'auto', minHeight: '0', fontSize: '12px' }}
                  >
                    {processingId === 'bulk-all' ? 'Processing...' : 'Pay All Pending'}
                  </button>
                )}
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--md-bw-outline)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  backgroundColor: 'var(--md-bw-primary)', 
                  width: `${progressPercent}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Toolbar Filter Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginTop: '16px'
          }}>
            {/* Search */}
            <div className="search-bar" style={{ flex: '1', maxWidth: '350px' }}>
              <div className="tf-icon-leading">
                <Search size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              </div>
              <input
                type="text"
                placeholder="Search employee or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Segmented Buttons */}
            <div style={{ display: 'flex', border: '1px solid var(--md-bw-outline)', borderRadius: '20px', overflow: 'hidden' }}>
              {['All', 'Paid', 'Pending'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRight: status !== 'Pending' ? '1px solid var(--md-bw-outline)' : 'none',
                    background: statusFilter === status ? 'var(--md-bw-secondary-container)' : 'var(--md-bw-surface)',
                    color: statusFilter === status ? 'var(--md-bw-on-secondary-container)' : 'var(--md-bw-on-surface)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {statusFilter === status && <CheckSquare size={16} />}
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions Sticky Bar */}
          {selectedRows.length > 0 && (
            <div style={{
              position: 'sticky', top: '10px', zIndex: 50,
              background: 'var(--md-bw-surface-variant)', color: 'var(--md-bw-on-surface-variant)',
              padding: '12px 24px', borderRadius: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '16px',
              animation: 'slideDownFade 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <CheckSquare size={18} />
                <span>{selectedRows.length} employee{selectedRows.length > 1 ? 's' : ''} selected</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => setSelectedRows([])} 
                  className="btn btn-text" 
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkExecute} 
                  disabled={processingId === 'bulk-selected' || simulatedRole === 'HR Manager'}
                  className="btn btn-filled" 
                  title={simulatedRole === 'HR Manager' ? "HR Managers cannot execute payroll" : ""}
                >
                  {processingId === 'bulk-selected' ? 'Processing...' : 'Execute Selected'}
                </button>
              </div>
            </div>
          )}

          {/* Payroll Table */}
          <div 
            className="table-scroll-wrapper" 
            style={{ padding: '0', maxHeight: '600px', overflowY: 'auto' }}
            onScroll={handleScroll}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="m3-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px', zIndex: 11 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.length === filteredEntries.length && filteredEntries.length > 0}
                        onChange={toggleSelectAll}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--md-bw-primary)' }}
                      />
                    </th>
                    <th style={{ zIndex: 11 }}>Employee</th>
                    <th>Salary Details</th>
                    <th>Deductions (PF)</th>
                    <th>Advance Balance</th>
                    <th>Company Loan</th>
                    <th>Net Payout</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }}><td colSpan="9" style={{ padding: 0, border: 'none' }} /></tr>}
                  {visibleEntries.map(entry => {
                  const emp = entry.employee
                  const loanDeduction = Math.min(entry.loan.remaining, entry.loan.installment)
                  const netPay = entry.baseSalary + entry.allowance - entry.deductions - entry.advance - loanDeduction
                  const isPaid = entry.status === 'Paid'
                  const isProcessing = processingId === entry.employeeId

                  return (
                    <tr 
                      key={entry.employeeId}
                      className={selectedRows.includes(entry.employeeId) ? 'selected' : ''}
                    >
                      <td className="sticky-col">
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(entry.employeeId)}
                          onChange={() => toggleRowSelection(entry.employeeId)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--md-bw-primary)' }}
                        />
                      </td>
                      <td className="sticky-col">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={emp.avatar} 
                            alt={emp.name} 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</span>
                            <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{emp.role}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>Gross: {currency}{entry.grossSalary.toLocaleString()}</span>
                          <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Base: {currency}{entry.baseSalary.toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>-{currency}{entry.deductions.toLocaleString()}</span>
                      </td>
                      
                      {/* Advance */}
                      <td>
                        <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{currency}{entry.advance}</span>
                      </td>

                      {/* Loan */}
                      <td>
                        {entry.loan.total > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>Inst: {currency}{loanDeduction}</span>
                            <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Rem: {currency}{entry.loan.remaining}</span>
                          </div>
                        ) : (
                          <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>None</span>
                        )}
                      </td>

                      {/* Net pay */}
                      <td>
                        <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{currency}{netPay.toLocaleString()}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`m3-chip m3-chip-assist ${isPaid ? 'solid' : 'outlined'}`} style={{ 
                          height: '24px', padding: '0 8px', fontSize: '11px',
                          backgroundColor: isPaid ? 'var(--md-bw-on-surface)' : 'transparent',
                          color: isPaid ? 'var(--md-bw-surface)' : 'var(--md-bw-on-surface-variant)',
                          border: isPaid ? 'none' : '1px solid var(--md-bw-outline)'
                        }}>
                          {entry.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {!isPaid && (
                            <>
                              <button 
                                onClick={() => openCompensationModal(entry)}
                                title={simulatedRole === 'HR Manager' ? "HR Managers cannot edit compensation" : "Edit Compensation"}
                                disabled={simulatedRole === 'HR Manager'}
                                className="icon-btn"
                              >
                                <Pencil size={18} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                              </button>
                              
                              <button
                                onClick={() => handleExecutePayment(entry)}
                                disabled={isProcessing || simulatedRole === 'HR Manager'}
                                title={simulatedRole === 'HR Manager' ? "HR Managers cannot execute payroll" : "Execute Payment"}
                                className="btn btn-tonal"
                                style={{ padding: '0 16px', height: '32px', fontSize: '12px' }}
                              >
                                {isProcessing ? '...' : 'Execute'}
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <button
                              onClick={() => generatePayslipReceipt(entry, entry.paymentDate)}
                              className="btn btn-text"
                              style={{ padding: '0 16px', height: '32px', fontSize: '12px' }}
                            >
                              <Download size={14} style={{ marginRight: '4px' }} /> Payslip
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }}><td colSpan="9" style={{ padding: 0, border: 'none' }} /></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* MANAGE COMPENSATION SIDE DRAWER */}
      {selectedEmpLog && (
        <>
          {/* Overlay */}
          <div 
            onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 999,
              opacity: isDrawerOpen ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: isDrawerOpen ? 'auto' : 'none'
            }} 
          />
          
          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100%',
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            zIndex: 1000,
            transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Manage Compensation</h3>
              <button 
                onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <img src={selectedEmpLog.employee.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedEmpLog.employee.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedEmpLog.employee.role}</span>
                </div>
              </div>

              <form onSubmit={handleSaveCompensationLedger} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Gross Salary Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Gross Monthly Salary ({currency})</label>
                  <input 
                    type="number" min="0" value={grossSalaryInput}
                    onChange={(e) => setGrossSalaryInput(e.target.value)}
                    style={{
                      padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontWeight: 600
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Basic and allowances are dynamically split from this total gross.</span>
                </div>

                {/* Advance Pay */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Salary Advance ({currency})</label>
                  <input 
                    type="number" min="0" value={advanceInput}
                    onChange={(e) => setAdvanceInput(e.target.value)}
                    style={{
                      padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deducted in full from the next payout.</span>
                </div>

                {/* Company Loan configs */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Company Loan Settings</span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Loan total */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Principal</label>
                      <input 
                        type="number" min="0" value={loanTotalInput}
                        onChange={(e) => setLoanTotalInput(e.target.value)}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    {/* Loan remaining */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Remaining Balance</label>
                      <input 
                        type="number" min="0" value={loanRemainingInput}
                        onChange={(e) => setLoanRemainingInput(e.target.value)}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Monthly installment */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Monthly Installment Deduction ({currency})</label>
                    <input 
                      type="number" min="0" value={loanInstallmentInput}
                      onChange={(e) => setLoanInstallmentInput(e.target.value)}
                      style={{
                        padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deducted monthly until the remaining balance reaches $0.</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Apply Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Embedded CSS for spin */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Monetization Slot */}
      <AdSlot type="horizontal" style={{ marginTop: '32px' }} />
    </div>
  )
}
