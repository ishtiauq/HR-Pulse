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
    <div className="animate-fade-in flex flex-col gap-6 sm:gap-8 lg:gap-10">
      
      {/* Header and Month Selector */}
      <div className="page-header">
        <h1 className="page-title">
          <CreditCard size={28} className="page-title-icon" />
          Payroll
        </h1>

        <div ref={pickerRef} className="flex gap-2 items-center">
          {/* Month dropdown */}
          <div className="relative w-[140px] h-10">
            <button onClick={() => { setMonthOpen(!monthOpen); setYearOpen(false) }} className="w-full h-10 flex items-center gap-1.5 text-[13px] font-medium outline-none cursor-pointer" style={{
              padding: '0 30px 0 12px', borderRadius: '8px',
              border: `1px solid ${monthOpen ? '#007aff' : 'var(--glass-border)'}`,
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
              color: 'var(--md-bw-on-surface)',
              boxShadow: monthOpen ? '0 0 0 3px rgba(0,122,255,0.2)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
              <Calendar size={14} className="shrink-0" style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{monthNames[currentMonth - 1]}</span>
              <ChevronDown size={12} className="shrink-0" style={{ color: 'var(--md-bw-on-surface-variant)', transition: 'transform 0.2s', transform: monthOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {monthOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto z-[100] p-1.5 rounded-xl" style={{
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}>
                {monthNames.map((name, i) => (
                  <button key={name} onClick={() => { setSelectedMonth(`${currentYear}-${String(i + 1).padStart(2, '0')}`); setMonthOpen(false) }} className="block w-full px-2.5 py-2 border-none rounded-[6px] text-left cursor-pointer text-[13px]" style={{
                    background: i + 1 === currentMonth ? 'rgba(0,122,255,0.1)' : 'transparent',
                    color: i + 1 === currentMonth ? '#007aff' : 'var(--md-bw-on-surface)',
                    fontWeight: i + 1 === currentMonth ? 600 : 400,
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
          <div className="relative w-24 h-10">
            <button onClick={() => { setYearOpen(!yearOpen); setMonthOpen(false) }} className="w-full h-10 flex items-center gap-1.5 text-[13px] font-medium outline-none cursor-pointer" style={{
              padding: '0 28px 0 12px', borderRadius: '8px',
              border: `1px solid ${yearOpen ? '#007aff' : 'var(--glass-border)'}`,
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
              color: 'var(--md-bw-on-surface)',
              boxShadow: yearOpen ? '0 0 0 3px rgba(0,122,255,0.2)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
              <span className="flex-1 text-left">{currentYear}</span>
              <ChevronDown size={12} className="shrink-0" style={{ color: 'var(--md-bw-on-surface-variant)', transition: 'transform 0.2s', transform: yearOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {yearOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto z-[100] p-1.5 rounded-xl" style={{
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}>
                {yearOptions.map(y => (
                  <button key={y} onClick={() => { setSelectedMonth(`${y}-${String(currentMonth).padStart(2, '0')}`); setYearOpen(false) }} className="block w-full px-2.5 py-2 border-none rounded-[6px] text-left cursor-pointer text-[13px]" style={{
                    background: y === currentYear ? 'rgba(0,122,255,0.1)' : 'transparent',
                    color: y === currentYear ? '#007aff' : 'var(--md-bw-on-surface)',
                    fontWeight: y === currentYear ? 600 : 400,
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
        <div className="glass-card animate-fade-in flex flex-col items-center gap-5 text-center p-10 sm:p-12 lg:p-16">
          <Calendar size={48} className="opacity-80" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h3 className="text-xl font-semibold mb-2">Payroll Not Initialized</h3>
            <p className="text-sm max-w-[440px] mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The payroll sheet for {monthLabel} has not been created yet. 
              Initialize it to pull the active roster and carry over compensation parameters.
            </p>
          </div>
          <button onClick={handleInitializeMonth} className="btn btn-primary flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3">
            <PlusCircle size={18} /> Initialize Month Payroll
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="grid gap-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {/* Total Cost Card */}
            <div className="m3-card m3-card-elevated p-5 sm:p-6 flex flex-col">
              <span className="label-small uppercase mb-2" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Total Payout Budget</span>
              <h3 className="display-small m-0" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--md-bw-on-surface)' }}>{currency}{totalCost.toLocaleString()}</h3>
            </div>

            {/* Average Salary Card */}
            <div className="m3-card m3-card-elevated p-5 sm:p-6 flex flex-col">
              <span className="label-small uppercase mb-2" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Average Salary</span>
              <h3 className="display-small m-0" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--md-bw-on-surface)' }}>{currency}{averageSalary.toLocaleString()}</h3>
            </div>

            {/* Progress Card */}
            <div className="m3-card m3-card-elevated p-5 sm:p-6 flex flex-col">
              <span className="label-small uppercase mb-2" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Disbursement Flow</span>
              <div className="flex items-center justify-between mb-2">
                <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{paidCount} of {totalCount} Paid</span>
                {paidCount < totalCount && (
                  <button 
                    onClick={handlePayAllPending} 
                    disabled={processingId === 'bulk-all' || simulatedRole === 'HR Manager'}
                    className="btn btn-text text-xs" 
                    style={{ padding: '0', height: 'auto', minHeight: '0' }}
                  >
                    {processingId === 'bulk-all' ? 'Processing...' : 'Pay All Pending'}
                  </button>
                )}
              </div>
              <div className="w-full h-1 rounded overflow-hidden" style={{ backgroundColor: 'var(--md-bw-outline)' }}>
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
          <div className="flex justify-between items-center flex-wrap gap-16 mt-4">
            {/* Search */}
            <div className="search-bar flex-1 max-w-[350px]">
              <div className="tf-icon-leading">
                <Search size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              </div>
              <input
                type="text"
                placeholder="Search employee or role..."
                aria-label="Search employees"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Segmented Buttons */}
            <div role="tablist" aria-label="Filter by status" className="flex rounded-full overflow-hidden" style={{ border: '1px solid var(--md-bw-outline)' }}>
              {['All', 'Paid', 'Pending'].map(status => (
                <button
                  key={status}
                  role="tab"
                  aria-selected={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                  className="flex items-center gap-2 text-sm font-medium outline-none cursor-pointer"
                  className="px-4 py-2"
                  style={{
                    border: 'none',
                    borderRight: status !== 'Pending' ? '1px solid var(--md-bw-outline)' : 'none',
                    background: statusFilter === status ? 'var(--md-bw-secondary-container)' : 'var(--md-bw-surface)',
                    color: statusFilter === status ? 'var(--md-bw-on-secondary-container)' : 'var(--md-bw-on-surface)',
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
            <div className="sticky top-2.5 z-[50] p-3 px-6 flex justify-between items-center mb-4 rounded-xl" style={{
              background: 'var(--md-bw-surface-variant)', color: 'var(--md-bw-on-surface-variant)',
              animation: 'slideDownFade 0.2s ease-out'
            }}>
              <div className="flex items-center gap-2 font-semibold">
                <CheckSquare size={18} />
                <span>{selectedRows.length} employee{selectedRows.length > 1 ? 's' : ''} selected</span>
              </div>
              <div className="flex gap-3 items-center">
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
                  <col className="w-[50px]" />
                  <col className="w-[180px]" />
                  <col className="w-[140px]" />
                  <col className="w-[120px]" />
                  <col className="w-[100px]" />
                  <col className="w-[140px]" />
                  <col className="w-[120px]" />
                  <col className="w-[100px]" />
                  <col className="w-11" />
                  <col className="w-[130px]" />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        className="round-checkbox"
                        aria-label="Select all employees"
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
                    <th className="text-center">Edit</th>
                    <th className="text-right">Execute</th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable Body */}
            <div className="payroll-table-body-scroll" onScroll={handleScroll}>
              <table className="payroll-table">
                <colgroup>
                  <col className="w-[50px]" />
                  <col className="w-[180px]" />
                  <col className="w-[140px]" />
                  <col className="w-[120px]" />
                  <col className="w-[100px]" />
                  <col className="w-[140px]" />
                  <col className="w-[120px]" />
                  <col className="w-[100px]" />
                  <col className="w-11" />
                  <col className="w-[130px]" />
                </colgroup>
                <tbody>
                  {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }}><td colSpan="10" className="p-0 border-none" /></tr>}
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
                          aria-label={`Select ${entry.employee.name}`}
                          checked={selectedRows.includes(entry.employeeId)}
                          onChange={() => toggleRowSelection(entry.employeeId)}
                        />
                      </td>
                      <td>
                      <div className="flex items-center gap-3">
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</span>
                          <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{emp.role}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
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
                        <div className="flex flex-col gap-0.5">
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
                      <span role="status" className="inline-flex items-center text-[11px] font-semibold rounded-full" style={{ 
                        height: '24px', padding: '0 10px',
                        backgroundColor: isPaid ? '#28a745' : '#dc3545',
                        color: '#fff',
                        letterSpacing: '0.03em'
                      }}>
                        {entry.status}
                      </span>
                    </td>

                    <td className="payroll-edit-cell text-center">
                      <button 
                        type="button"
                        onClick={() => openCompensationModal(entry)}
                        aria-label={`Edit ${entry.employee.name}`}
                        title="Edit Compensation"
                        className="payroll-edit-btn"
                      >
                        <Pencil size={16} style={{ color: '#007aff' }} />
                      </button>
                    </td>
                    <td className="text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => handleExecutePayment(entry)}
                          disabled={isProcessing || simulatedRole === 'HR Manager'}
                          title={simulatedRole === 'HR Manager' ? "HR Managers cannot execute payroll" : "Execute Payment"}
                          className="btn btn-tonal text-xs"
                          style={{ padding: '0 16px', height: '32px' }}
                        >
                          {isProcessing ? '...' : 'Execute'}
                        </button>
                      ) : (
                        <button
                          onClick={() => generatePayslipReceipt(entry, entry.paymentDate)}
                          className="btn btn-text text-xs"
                          style={{ padding: '0 12px', height: '32px' }}
                        >
                          <Download size={14} className="mr-1" /> Payslip
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }}><td colSpan="10" className="p-0 border-none" /></tr>}
            </tbody>
          </table>
          </div>
          </div>
        </>
      )}

      {/* MANAGE COMPENSATION MODAL */}
      {selectedEmpLog && (
        <div className="modal-overlay" onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }}>
          <div className="macos-modal max-w-lg flex flex-col gap-5 p-7 sm:p-8" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 mb-2 border-b border-[rgba(0,0,0,0.06)]">
              <h3 className="m-0 text-xl font-extrabold flex items-center gap-2.5" style={{ color: 'var(--md-bw-on-surface)' }}>
                <Pencil size={20} className="text-[#007AFF]" />
                Manage Compensation
              </h3>
              <button onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }} aria-label="Close compensation panel" className="size-9 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] transition-colors border-none cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Employee Info */}
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 px-2 sm:px-3 rounded-xl mb-4" style={{ background: 'var(--md-bw-surface-variant)' }}>
              <img src={selectedEmpLog.employee.avatar} alt={selectedEmpLog.employee.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div>
                <span className="text-[0.85rem] font-semibold block" style={{ color: 'var(--md-bw-on-surface)' }}>{selectedEmpLog.employee.name}</span>
                <span className="text-[0.72rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{selectedEmpLog.employee.role}</span>
              </div>
            </div>

            <form onSubmit={handleSaveCompensationLedger} className="flex flex-col gap-3.5">
              {/* Gross Salary */}
              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Gross Monthly Salary ({currency})</label>
                <input type="number" min="0" value={grossSalaryInput} onChange={(e) => setGrossSalaryInput(e.target.value)} className="font-semibold text-[0.85rem] px-3 py-2" style={{ borderRadius: '8px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none' }} />
                <span className="text-[0.65rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Basic and allowances dynamically split from gross.</span>
              </div>

              {/* Advance Pay */}
              <div className="flex flex-col gap-1">
                <label className="text-[0.75rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Salary Advance ({currency})</label>
                <input type="number" min="0" value={advanceInput} onChange={(e) => setAdvanceInput(e.target.value)} className="text-[0.85rem] px-3 py-2" style={{ borderRadius: '8px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none' }} />
                <span className="text-[0.65rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Deducted in full from the next payout.</span>
              </div>

              {/* Company Loan */}
              <div className="flex flex-col gap-2.5 pt-3" style={{ borderTop: '1px solid var(--md-bw-outline)' }}>
                <span className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>Company Loan Settings</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.7rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Total Principal</label>
                    <input type="number" min="0" value={loanTotalInput} onChange={(e) => setLoanTotalInput(e.target.value)} className="text-[0.8rem] px-2.5 py-1.5" style={{ borderRadius: '6px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none' }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.7rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Remaining Balance</label>
                    <input type="number" min="0" value={loanRemainingInput} onChange={(e) => setLoanRemainingInput(e.target.value)} className="text-[0.8rem] px-2.5 py-1.5" style={{ borderRadius: '6px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none' }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.7rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Monthly Installment Deduction ({currency})</label>
                  <input type="number" min="0" value={loanInstallmentInput} onChange={(e) => setLoanInstallmentInput(e.target.value)} className="text-[0.85rem] px-3 py-2" style={{ borderRadius: '8px', border: '1px solid var(--md-bw-outline)', background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)', outline: 'none' }} />
                  <span className="text-[0.65rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Deducted monthly until balance reaches $0.</span>
                </div>
              </div>

              {/* Apply Scope */}
              <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid var(--md-bw-outline)' }}>
                <span className="text-[0.75rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Apply Changes To</span>
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--md-bw-outline)' }}>
                  <button type="button" onClick={() => setApplyGlobally(false)} className="flex-1 px-3 py-2 border-none text-[0.75rem] font-medium cursor-pointer" style={{
                    background: !applyGlobally ? 'var(--md-bw-primary)' : 'transparent',
                    color: !applyGlobally ? 'var(--md-bw-on-primary)' : 'var(--md-bw-on-surface-variant)',
                    transition: 'all 0.15s'
                  }}>This Month Only</button>
                  <button type="button" onClick={() => setApplyGlobally(true)} className="flex-1 px-3 py-2 border-none text-[0.75rem] font-medium cursor-pointer" style={{
                    background: applyGlobally ? 'var(--md-bw-primary)' : 'transparent',
                    color: applyGlobally ? 'var(--md-bw-on-primary)' : 'var(--md-bw-on-surface-variant)',
                    transition: 'all 0.15s'
                  }}>All Future Months</button>
                </div>
                <span className="text-[0.65rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                  {applyGlobally ? 'Salary is saved centrally and affects all months.' : 'Change applies only to the current selected month.'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 justify-end">
                <button type="button" className="btn btn-text text-[0.8rem] px-5 py-2.5 sm:px-6 sm:py-3" onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedEmpLog(null), 300); }}>Cancel</button>
                <button type="submit" className="btn btn-filled text-[0.8rem] flex items-center gap-1.5 px-5 py-2.5 sm:px-6 sm:py-3"><CheckSquare size={14} /> Apply Changes</button>
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
      <AdSlot type="horizontal" className="mt-8" />
    </div>
  )
}
