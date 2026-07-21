import { useState, useRef, useMemo, useEffect } from 'react'
import jsPDF from 'jspdf'
import { CreditCard, Download, Search, X, PlusCircle, Calendar, Pencil, CheckSquare, Trash2, ChevronDown } from 'lucide-react'
import AdSlot from './AdSlot.jsx'
import { formatDate } from '../services/date.js'

export default function Payroll({ employees, payroll, setPayroll, addLog, driveConnected, settings, simulatedRole, addAuditLog }) {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [processingId, setProcessingId] = useState(null)

  // Month/Year dropdown states
  const [monthOpen, setMonthOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)
  const pickerRef = useRef(null)

  const currentMonth = parseInt(selectedMonth.split('-')[1])
  const currentYear = parseInt(selectedMonth.split('-')[0])

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = 2050; y >= 2000; y--) years.push(y)
    return years
  }, [])

  // Close pickers on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) { setMonthOpen(false); setYearOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Global salary overrides (keyed by employeeId)
  const [salaryOverrides, setSalaryOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hrp_salary_overrides') || '{}') } catch { return {} }
  })

  // Side Drawer and editing states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedEmpLog, setSelectedEmpLog] = useState(null)
  const [grossSalaryInput, setGrossSalaryInput] = useState(0)
  const [advanceInput, setAdvanceInput] = useState(0)
  const [loanTotalInput, setLoanTotalInput] = useState(0)
  const [loanInstallmentInput, setLoanInstallmentInput] = useState(0)
  const [loanRemainingInput, setLoanRemainingInput] = useState(0)
  const [applyGlobally, setApplyGlobally] = useState(true)

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

  const monthLabel = `${monthNames[currentMonth - 1]} ${currentYear}`

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

      let gross = salaryOverrides[emp.id] || prevRecord?.grossSalary || 3200
      if (!prevRecord && !salaryOverrides[emp.id]) {
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

  // Generate PDF payslip
  const generatePayslipReceipt = (entry, payDate) => {
    const loanDeduction = Math.min(entry.loan.remaining, entry.loan.installment)
    const net = entry.baseSalary + entry.allowance - entry.deductions - entry.advance - loanDeduction
    const grossVal = entry.grossSalary

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = margin

    // Header bar
    doc.setFillColor(0, 0, 0)
    doc.rect(margin, y, contentW, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('HR PULSE — PAYSLIP RECEIPT', pageW / 2, y + 9, { align: 'center' })
    y += 22

    // Employee info
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const infoLeft = [
      `Employee: ${entry.employee.name}`,
      `Role: ${entry.employee.role}`,
      `Department: ${entry.employee.department || '-'}`
    ]
    const infoRight = [
      `Pay Period: ${selectedMonth}`,
      `Issue Date: ${payDate}`,
      `ID: ${entry.employeeId}`
    ]
    infoLeft.forEach((line, i) => doc.text(line, margin, y + i * 5))
    infoRight.forEach((line, i) => doc.text(line, pageW - margin, y + i * 5, { align: 'right' }))
    y += infoLeft.length * 5 + 6

    // Separator
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageW - margin, y)
    y += 6

    // Earnings table
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('EARNINGS', margin, y); y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    let earningsTotal = 0
    structure.filter(s => s.type === 'earning').forEach(s => {
      const amt = grossVal * (s.percentage / 100)
      earningsTotal += amt
      doc.text(s.name, margin + 4, y)
      doc.text(`${currency}${amt.toFixed(2)}`, pageW - margin, y, { align: 'right' })
      y += 4.5
    })
    doc.setFont('helvetica', 'bold')
    doc.text('Total Earnings', margin + 4, y)
    doc.text(`${currency}${earningsTotal.toFixed(2)}`, pageW - margin, y, { align: 'right' })
    y += 7

    // Deductions table
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('DEDUCTIONS', margin, y); y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    let deductionsTotal = 0
    structure.filter(s => s.type === 'deduction').forEach(s => {
      const amt = grossVal * (s.percentage / 100)
      deductionsTotal += amt
      doc.text(s.name, margin + 4, y)
      doc.text(`-${currency}${amt.toFixed(2)}`, pageW - margin, y, { align: 'right' })
      y += 4.5
    })
    if (entry.advance > 0) {
      deductionsTotal += entry.advance
      doc.text('Salary Advance Settlement', margin + 4, y)
      doc.text(`-${currency}${entry.advance.toFixed(2)}`, pageW - margin, y, { align: 'right' })
      y += 4.5
    }
    if (loanDeduction > 0) {
      deductionsTotal += loanDeduction
      doc.text('Company Loan Installment', margin + 4, y)
      doc.text(`-${currency}${loanDeduction.toFixed(2)}`, pageW - margin, y, { align: 'right' })
      y += 4.5
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Total Deductions', margin + 4, y)
    doc.text(`-${currency}${deductionsTotal.toFixed(2)}`, pageW - margin, y, { align: 'right' })
    y += 8

    // Separator
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageW - margin, y)
    y += 6

    // Net payout
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('NET PAYOUT', margin, y)
    doc.text(`${currency}${net.toFixed(2)}`, pageW - margin, y, { align: 'right' })
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Payment Method: Direct Deposit (Google Drive Ledger)', margin, y); y += 4
    doc.text('Status: PAID / SUCCESSFUL', margin, y); y += 8

    // Footer
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageW - margin, y)
    y += 5
    doc.setFontSize(7.5)
    doc.setTextColor(150, 150, 150)
    doc.text('This is a computer-generated document. No signature is required.', pageW / 2, y, { align: 'center' })

    // Loan remaining note
    if (loanDeduction > 0) {
      y += 4
      doc.text(`Loan remaining balance: ${currency}${(entry.loan.remaining - loanDeduction).toFixed(2)}`, margin, y)
    }

    doc.save(`payslip_${entry.employeeId}_${selectedMonth}_${entry.employee.name.replace(/\s+/g, '_')}.pdf`)
  }

  // Manage Compensation & Loan/Advance helper
  const openCompensationModal = (entry) => {
    setSelectedEmpLog(entry)
    setGrossSalaryInput(entry.grossSalary)
    setAdvanceInput(entry.advance)
    setLoanTotalInput(entry.loan.total)
    setLoanInstallmentInput(entry.loan.installment)
    setLoanRemainingInput(entry.loan.remaining)
    setApplyGlobally(true)
    setIsDrawerOpen(true)
  }

  const handleSaveCompensationLedger = (e) => {
    e.preventDefault()
    if (!selectedEmpLog) return

    const newGross = Number(grossSalaryInput) || 3200

    setPayroll(prev => {
      const monthData = prev[selectedMonth] || []
      const index = monthData.findIndex(p => p.employeeId === selectedEmpLog.employeeId)

      const updatedEntry = {
        employeeId: selectedEmpLog.employeeId,
        grossSalary: newGross,
        baseSalary: selectedEmpLog.baseSalary,
        allowance: selectedEmpLog.allowance,
        deductions: selectedEmpLog.deductions,
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

      if (applyGlobally) {
        setSalaryOverrides(prevOverrides => {
          const next = { ...prevOverrides, [selectedEmpLog.employeeId]: newGross }
          localStorage.setItem('hrp_salary_overrides', JSON.stringify(next))
          return next
        })
        // Also update all existing months' entries for this employee
        const updatedPayroll = {}
        Object.keys(prev).forEach(monthKey => {
          const monthEntries = prev[monthKey].map(entry =>
            entry.employeeId === selectedEmpLog.employeeId
              ? { ...entry, grossSalary: newGross }
              : entry
          )
          updatedPayroll[monthKey] = monthEntries
        })
        return { ...updatedPayroll, [selectedMonth]: nextMonthData }
      }

      return { ...prev, [selectedMonth]: nextMonthData }
    })

    setIsDrawerOpen(false)
    setTimeout(() => setSelectedEmpLog(null), 300)

    addLog('Ledger Updated', `${applyGlobally ? 'Globally updated' : 'Updated'} compensation for ${selectedEmpLog.employee.name}`, 'success')
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header and Month Selector */}
      <div className="page-header">
        <h1 className="page-title">
          <CreditCard size={28} className="page-title-icon" />
          Payroll
        </h1>

        <div ref={pickerRef} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Month dropdown */}
          <div style={{ position: 'relative', width: '140px', height: '40px' }}>
            <button onClick={() => { setMonthOpen(!monthOpen); setYearOpen(false) }} style={{
              width: '100%', height: '40px', padding: '0 30px 0 12px', borderRadius: '8px',
              border: `1px solid ${monthOpen ? '#007aff' : 'var(--glass-border)'}`,
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
              color: 'var(--md-bw-on-surface)', fontSize: '13px', fontWeight: 500, outline: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: monthOpen ? '0 0 0 3px rgba(0,122,255,0.2)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
              <Calendar size={14} style={{ flexShrink: 0, color: 'var(--md-bw-on-surface-variant)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{monthNames[currentMonth - 1]}</span>
              <ChevronDown size={12} style={{ flexShrink: 0, color: 'var(--md-bw-on-surface-variant)', transition: 'transform 0.2s', transform: monthOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {monthOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                maxHeight: '240px', overflowY: 'auto',
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)', borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 100, padding: '6px'
              }}>
                {monthNames.map((name, i) => (
                  <button key={name} onClick={() => { setSelectedMonth(`${currentYear}-${String(i + 1).padStart(2, '0')}`); setMonthOpen(false) }} style={{
                    display: 'block', width: '100%', padding: '8px 10px', border: 'none', borderRadius: '6px',
                    background: i + 1 === currentMonth ? 'rgba(0,122,255,0.1)' : 'transparent',
                    color: i + 1 === currentMonth ? '#007aff' : 'var(--md-bw-on-surface)', fontSize: '13px',
                    fontWeight: i + 1 === currentMonth ? 600 : 400, textAlign: 'left', cursor: 'pointer'
                  }}
                    onMouseEnter={(e) => { if (i + 1 !== currentMonth) e.target.style.background = 'rgba(0,0,0,0.04)' }}
                    onMouseLeave={(e) => { if (i + 1 !== currentMonth) e.target.style.background = 'transparent' }}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Year dropdown */}
          <div style={{ position: 'relative', width: '96px', height: '40px' }}>
            <button onClick={() => { setYearOpen(!yearOpen); setMonthOpen(false) }} style={{
              width: '100%', height: '40px', padding: '0 28px 0 12px', borderRadius: '8px',
              border: `1px solid ${yearOpen ? '#007aff' : 'var(--glass-border)'}`,
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
              color: 'var(--md-bw-on-surface)', fontSize: '13px', fontWeight: 500, outline: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: yearOpen ? '0 0 0 3px rgba(0,122,255,0.2)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
              <span style={{ flex: 1, textAlign: 'left' }}>{currentYear}</span>
              <ChevronDown size={12} style={{ flexShrink: 0, color: 'var(--md-bw-on-surface-variant)', transition: 'transform 0.2s', transform: yearOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {yearOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                maxHeight: '240px', overflowY: 'auto',
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)', borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 100, padding: '6px'
              }}>
                {yearOptions.map(y => (
                  <button key={y} onClick={() => { setSelectedMonth(`${y}-${String(currentMonth).padStart(2, '0')}`); setYearOpen(false) }} style={{
                    display: 'block', width: '100%', padding: '8px 10px', border: 'none', borderRadius: '6px',
                    background: y === currentYear ? 'rgba(0,122,255,0.1)' : 'transparent',
                    color: y === currentYear ? '#007aff' : 'var(--md-bw-on-surface)', fontSize: '13px',
                    fontWeight: y === currentYear ? 600 : 400, textAlign: 'left', cursor: 'pointer'
                  }}
                    onMouseEnter={(e) => { if (y !== currentYear) e.target.style.background = 'rgba(0,0,0,0.04)' }}
                    onMouseLeave={(e) => { if (y !== currentYear) e.target.style.background = 'transparent' }}>
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER BASED ON INITIALIZATION STATE */}
      {!entries ? (
        <div className="glass-card animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Calendar size={48} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Payroll Not Initialized</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
              The payroll sheet for {monthLabel} has not been created yet. 
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
          <div className="payroll-table-container">
            {/* Fixed Header */}
            <div className="payroll-table-header-wrap">
              <table className="payroll-table">
                <colgroup>
                  <col style={{ width: '50px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '44px' }} />
                  <col style={{ width: '130px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        className="round-checkbox"
                        checked={selectedRows.length === filteredEntries.length && filteredEntries.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Employee</th>
                    <th>Salary Details</th>
                    <th>Deductions (PF)</th>
                    <th>Advanced</th>
                    <th>Company Loan</th>
                    <th>Net Payout</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Edit</th>
                    <th style={{ textAlign: 'right' }}>Execute</th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable Body */}
            <div className="payroll-table-body-scroll" onScroll={handleScroll}>
              <table className="payroll-table">
                <colgroup>
                  <col style={{ width: '50px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '44px' }} />
                  <col style={{ width: '130px' }} />
                </colgroup>
                <tbody>
                  {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }}><td colSpan="10" style={{ padding: 0, border: 'none' }} /></tr>}
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
                      <td>
                        <input 
                          type="checkbox" 
                          className="round-checkbox"
                          checked={selectedRows.includes(entry.employeeId)}
                          onChange={() => toggleRowSelection(entry.employeeId)}
                        />
                      </td>
                      <td>
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
                      <span style={{ 
                        height: '24px', padding: '0 10px', fontSize: '11px', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center',
                        borderRadius: '20px',
                        backgroundColor: isPaid ? '#28a745' : '#dc3545',
                        color: '#fff',
                        letterSpacing: '0.03em'
                      }}>
                        {entry.status}
                      </span>
                    </td>

                    <td className="payroll-edit-cell" style={{ textAlign: 'center' }}>
                      <button 
                        type="button"
                        onClick={() => openCompensationModal(entry)}
                        title="Edit Compensation"
                        className="payroll-edit-btn"
                      >
                        <Pencil size={16} style={{ color: '#007aff' }} />
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!isPaid ? (
                        <button
                          onClick={() => handleExecutePayment(entry)}
                          disabled={isProcessing || simulatedRole === 'HR Manager'}
                          title={simulatedRole === 'HR Manager' ? "HR Managers cannot execute payroll" : "Execute Payment"}
                          className="btn btn-tonal"
                          style={{ padding: '0 16px', height: '32px', fontSize: '12px' }}
                        >
                          {isProcessing ? '...' : 'Execute'}
                        </button>
                      ) : (
                        <button
                          onClick={() => generatePayslipReceipt(entry, entry.paymentDate)}
                          className="btn btn-text"
                          style={{ padding: '0 12px', height: '32px', fontSize: '12px' }}
                        >
                          <Download size={14} style={{ marginRight: '4px' }} /> Payslip
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }}><td colSpan="10" style={{ padding: 0, border: 'none' }} /></tr>}
            </tbody>
          </table>
          </div>
          </div>
        </>
      )}

      {/* MANAGE COMPENSATION MODAL */}
      {selectedEmpLog && (
        <div className={`dialog-scrim${isDrawerOpen ? ' visible' : ''}`} onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }} style={{ zIndex: 999 }}>
          <div className="m3-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--md-bw-on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                Manage Compensation
              </h3>
              <button onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }} style={{ background: 'transparent', border: 'none', color: 'var(--md-bw-on-surface-variant)', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Employee Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--md-bw-surface-variant)', borderRadius: '10px', marginBottom: '16px' }}>
              <img src={selectedEmpLog.employee.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-bw-on-surface)', display: 'block' }}>{selectedEmpLog.employee.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--md-bw-on-surface-variant)' }}>{selectedEmpLog.employee.role}</span>
              </div>
            </div>

            <form onSubmit={handleSaveCompensationLedger} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Gross Salary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Gross Monthly Salary ({currency})</label>
                <input type="number" min="0" value={grossSalaryInput} onChange={(e) => setGrossSalaryInput(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none', fontWeight: 600, fontSize: '0.85rem' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--md-bw-on-surface-variant)' }}>Basic and allowances dynamically split from gross.</span>
              </div>

              {/* Advance Pay */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Salary Advance ({currency})</label>
                <input type="number" min="0" value={advanceInput} onChange={(e) => setAdvanceInput(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none', fontSize: '0.85rem' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--md-bw-on-surface-variant)' }}>Deducted in full from the next payout.</span>
              </div>

              {/* Company Loan */}
              <div style={{ borderTop: '1px solid var(--md-bw-outline)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>Company Loan Settings</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--md-bw-on-surface-variant)' }}>Total Principal</label>
                    <input type="number" min="0" value={loanTotalInput} onChange={(e) => setLoanTotalInput(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none', fontSize: '0.8rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--md-bw-on-surface-variant)' }}>Remaining Balance</label>
                    <input type="number" min="0" value={loanRemainingInput} onChange={(e) => setLoanRemainingInput(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none', fontSize: '0.8rem' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--md-bw-on-surface-variant)' }}>Monthly Installment Deduction ({currency})</label>
                  <input type="number" min="0" value={loanInstallmentInput} onChange={(e) => setLoanInstallmentInput(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none', fontSize: '0.85rem' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--md-bw-on-surface-variant)' }}>Deducted monthly until balance reaches $0.</span>
                </div>
              </div>

              {/* Apply Scope */}
              <div style={{ borderTop: '1px solid var(--md-bw-outline)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Apply Changes To</span>
                <div style={{ display: 'flex', border: '1px solid var(--md-bw-outline)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button type="button" onClick={() => setApplyGlobally(false)} style={{
                    flex: 1, padding: '8px 12px', border: 'none', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                    background: !applyGlobally ? 'var(--md-bw-primary)' : 'transparent',
                    color: !applyGlobally ? 'var(--md-bw-on-primary)' : 'var(--md-bw-on-surface-variant)',
                    transition: 'all 0.15s'
                  }}>This Month Only</button>
                  <button type="button" onClick={() => setApplyGlobally(true)} style={{
                    flex: 1, padding: '8px 12px', border: 'none', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                    background: applyGlobally ? 'var(--md-bw-primary)' : 'transparent',
                    color: applyGlobally ? 'var(--md-bw-on-primary)' : 'var(--md-bw-on-surface-variant)',
                    transition: 'all 0.15s'
                  }}>All Future Months</button>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--md-bw-on-surface-variant)' }}>
                  {applyGlobally ? 'Salary is saved centrally and affects all months.' : 'Change applies only to the current selected month.'}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-text" onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Cancel</button>
                <button type="submit" className="btn btn-filled" style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckSquare size={14} /> Apply Changes</button>
              </div>
            </form>
          </div>
        </div>
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
