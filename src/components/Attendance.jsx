import { useState } from 'react'
import { Calendar, Check, X, ClipboardList, Clock, CheckCircle2, AlertCircle, Plus, CalendarDays, BarChart3, ChevronLeft, ChevronRight, Cpu, Download, FileSpreadsheet } from 'lucide-react'
import AdSlot from './AdSlot.jsx'

export default function Attendance({ employees, attendance, setAttendance, addLog, driveConnected }) {
  const [activeTab, setActiveTab] = useState('daily') // 'daily', 'leaves', 'analytics', or 'biometric'
  
  // Daily Roll Call states
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localToday = new Date(today.getTime() - (offset*60*1000))
    return localToday.toISOString().split('T')[0]
  })
  const [localLogs, setLocalLogs] = useState({})

  // Leave states
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [leaveEmployeeId, setLeaveEmployeeId] = useState(employees[0]?.id || '')
  const [leaveType, setLeaveType] = useState('Sick Leave')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveReason, setLeaveReason] = useState('')

  // Calendar Analytics states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '')
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(6) // July (0-indexed: 6)

  const leaves = attendance.leaves || []
  const dailyLogs = attendance.dailyLogs || {}
  const balances = attendance.balances || {}

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Default employee balances helper
  const getEmployeeBalances = (empId) => {
    return balances[empId] || {
      sick: { used: 0, limit: 14 },
      casual: { used: 0, limit: 10 },
      annual: { used: 0, limit: 20 }
    }
  }

  // Overlap leave check
  const isEmployeeOnLeave = (empId, dateStr) => {
    const targetDate = new Date(dateStr)
    return leaves.some(l => 
      l.employeeId === empId &&
      l.status === 'Approved' &&
      targetDate >= new Date(l.startDate) &&
      targetDate <= new Date(l.endDate)
    )
  }

  // Work hours check
  const calculateHours = (checkIn, checkOut) => {
    try {
      const parseTime = (t) => {
        const [time, modifier] = t.split(' ')
        let [hours, minutes] = time.split(':').map(Number)
        if (modifier === 'PM' && hours !== 12) hours += 12
        if (modifier === 'AM' && hours === 12) hours = 0
        return hours + minutes / 60
      }
      const duration = parseTime(checkOut) - parseTime(checkIn)
      return duration > 0 ? duration.toFixed(1) : '0.0'
    } catch (e) {
      return '9.0'
    }
  }

  // Late check-in check (later than 09:15 AM)
  const isLateCheckIn = (checkInStr) => {
    try {
      const [time, modifier] = checkInStr.split(' ')
      const [hours, minutes] = time.split(':').map(Number)
      const minutesSum = (modifier === 'PM' && hours !== 12 ? (hours + 12) * 60 : hours * 60) + minutes
      if (modifier === 'AM' && minutesSum > 555) return true // 9:15 AM is 555 minutes
      if (modifier === 'PM') return true
      return false
    } catch (e) {
      return false
    }
  }

  // Get active log values for date
  const getEmployeeDailyData = (empId) => {
    if (isEmployeeOnLeave(empId, selectedDate)) {
      return { status: 'On Leave', checkIn: '--', checkOut: '--', hours: '0.0' }
    }

    const savedLog = (dailyLogs[selectedDate] && dailyLogs[selectedDate][empId]) || null
    const localLog = localLogs[empId] || null

    const checkIn = localLog?.checkIn || savedLog?.checkIn || '09:00 AM'
    const checkOut = localLog?.checkOut || savedLog?.checkOut || '06:00 PM'
    
    let status = 'Present'
    if (localLog?.status) {
      status = localLog.status
    } else if (savedLog?.status) {
      status = savedLog.status
    } else {
      status = isLateCheckIn(checkIn) ? 'Late' : 'Present'
    }

    const hours = status === 'Absent' ? '0.0' : calculateHours(checkIn, checkOut)

    return { status, checkIn, checkOut, hours }
  }

  const handleLocalLogUpdate = (empId, field, value) => {
    const currentData = getEmployeeDailyData(empId)
    const nextData = { ...currentData, [field]: value }

    if (field === 'checkIn') {
      nextData.status = isLateCheckIn(value) ? 'Late' : 'Present'
    }

    if (nextData.status === 'Absent') {
      nextData.hours = '0.0'
    } else {
      nextData.hours = calculateHours(nextData.checkIn, nextData.checkOut)
    }

    setLocalLogs(prev => ({
      ...prev,
      [empId]: nextData
    }))
  }

  const handleSaveDailyLogs = () => {
    const updatedDayLogs = {}
    employees.forEach(emp => {
      const data = getEmployeeDailyData(emp.id)
      updatedDayLogs[emp.id] = {
        status: data.status,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        hours: data.hours
      }
    })

    setAttendance(prev => ({
      ...prev,
      dailyLogs: {
        ...(prev.dailyLogs || {}),
        [selectedDate]: updatedDayLogs
      }
    }))

    setLocalLogs({})
    addLog('Attendance Logged', `Saved attendance check-ins for ${selectedDate}`, 'success')
    alert(`Roster for ${selectedDate} synced successfully!`)
  }

  // Approval handler
  const handleApproveLeave = (leaveId) => {
    const targetLeave = leaves.find(l => l.id === leaveId)
    if (!targetLeave) return
    const empId = targetLeave.employeeId
    const empName = employees.find(e => e.id === empId)?.name || 'Employee'
    const days = targetLeave.days

    // Map leave type to balance key
    let balanceKey = 'sick'
    if (targetLeave.leaveType.includes('Casual')) balanceKey = 'casual'
    else if (targetLeave.leaveType.includes('Annual') || targetLeave.leaveType.includes('PTO')) balanceKey = 'annual'

    setAttendance(prev => {
      const updatedLeaves = (prev.leaves || []).map(l => 
        l.id === leaveId ? { ...l, status: 'Approved' } : l
      )

      const updatedBalances = { ...(prev.balances || {}) }
      if (!updatedBalances[empId]) {
        updatedBalances[empId] = {
          sick: { used: 0, limit: 14 },
          casual: { used: 0, limit: 10 },
          annual: { used: 0, limit: 20 }
        }
      }

      // Add used duration
      const current = { ...updatedBalances[empId][balanceKey] }
      current.used = Math.min(current.limit, current.used + days)
      
      updatedBalances[empId] = {
        ...updatedBalances[empId],
        [balanceKey]: current
      }

      return {
        ...prev,
        leaves: updatedLeaves,
        balances: updatedBalances
      }
    })

    addLog('Leave Approved', `Approved ${days} days ${targetLeave.leaveType} for ${empName}`, 'success')
  }

  const handleRejectLeave = (leaveId) => {
    const targetLeave = leaves.find(l => l.id === leaveId)
    if (!targetLeave) return
    const empName = employees.find(e => e.id === targetLeave.employeeId)?.name || 'Employee'

    setAttendance(prev => {
      const updatedLeaves = (prev.leaves || []).map(l => 
        l.id === leaveId ? { ...l, status: 'Rejected' } : l
      )
      return { ...prev, leaves: updatedLeaves }
    })

    addLog('Leave Rejected', `Rejected leave request for ${empName}`, 'warning')
  }

  // Calculate days requested
  const getRequestedDays = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.abs(end - start)
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  // Check remaining limit inside form
  const getFormBalanceWarning = () => {
    const days = getRequestedDays()
    if (days <= 0) return null

    const currentBalances = getEmployeeBalances(leaveEmployeeId)
    let balanceKey = 'sick'
    if (leaveType.includes('Casual')) balanceKey = 'casual'
    else if (leaveType.includes('Annual')) balanceKey = 'annual'

    const limitObj = currentBalances[balanceKey]
    const remaining = limitObj.limit - limitObj.used

    if (days > remaining) {
      return `Warning: Requested ${days} days exceeds remaining ${remaining} days balance for ${leaveType}. Approval will log unpaid excess days.`
    }
    return null
  }

  const handleApplyLeave = (e) => {
    e.preventDefault()
    if (!startDate || !endDate || !leaveReason) return

    const diffDays = getRequestedDays()
    const newLeave = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: leaveEmployeeId,
      leaveType,
      startDate,
      endDate,
      days: diffDays,
      reason: leaveReason,
      status: 'Pending'
    }

    setAttendance(prev => ({
      ...prev,
      leaves: [newLeave, ...(prev.leaves || [])]
    }))

    const empName = employees.find(e => e.id === leaveEmployeeId)?.name || 'Employee'
    addLog('Leave Applied', `Logged leave request (${diffDays} days) for ${empName}`, 'success')

    // Reset Form
    setStartDate('')
    setEndDate('')
    setLeaveReason('')
    setShowApplyModal(false)
  }

  // ZKTeco CSV File parser handler
  const handleCSVUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        const lines = text.split(/\r?\n/)
        
        const parsedPunches = []
        lines.forEach(line => {
          if (!line.trim()) return
          
          let parts = line.split('\t')
          if (parts.length < 2) parts = line.split(',')
          if (parts.length < 2) parts = line.split(';')

          if (parts.length >= 2) {
            const rawPin = parts[0].replace(/["']/g, '').trim()
            // Normalize pin ID
            const pin = rawPin.startsWith('EMP-') ? rawPin : `EMP-${rawPin}`
            
            const dateTimeStr = parts[1].replace(/["']/g, '').trim()
            // Format to ISO
            const isoStr = dateTimeStr.replace(' ', 'T')
            const dt = new Date(isoStr)
            
            if (!isNaN(dt.getTime())) {
              const punchType = parts[2]?.trim() === '1' ? 'check_out' : 'check_in'
              parsedPunches.push({ employeeId: pin, timestamp: dt, type: punchType })
            }
          }
        })

        if (parsedPunches.length === 0) {
          alert("Could not identify valid punch logs. Ensure columns are: Pin/ID, Date Time (YYYY-MM-DD HH:MM:SS), State (0=In, 1=Out).")
          return
        }

        // Merge parsed logs with attendance db state
        setAttendance(prev => {
          const updatedLogs = { ...(prev.dailyLogs || {}) }

          parsedPunches.forEach(p => {
            const offset = p.timestamp.getTimezoneOffset()
            const localDate = new Date(p.timestamp.getTime() - (offset*60*1000))
            const dateKey = localDate.toISOString().split('T')[0]
            
            const hours = p.timestamp.getHours()
            const minutes = p.timestamp.getMinutes()
            const modifier = hours >= 12 ? 'PM' : 'AM'
            const displayHours = hours % 12 || 12
            const timeStr = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${modifier}`

            if (!updatedLogs[dateKey]) updatedLogs[dateKey] = {}
            if (!updatedLogs[dateKey][p.employeeId]) {
              updatedLogs[dateKey][p.employeeId] = {
                status: 'Present',
                checkIn: '--',
                checkOut: '--',
                hours: '0.0'
              }
            }

            const entry = updatedLogs[dateKey][p.employeeId]
            if (p.type === 'check_in' || entry.checkIn === '--') {
              entry.checkIn = timeStr
              entry.status = isLateCheckIn(timeStr) ? 'Late' : 'Present'
            } else {
              entry.checkOut = timeStr
            }

            if (entry.checkIn !== '--' && entry.checkOut !== '--') {
              entry.hours = calculateHours(entry.checkIn, entry.checkOut)
            }

            updatedLogs[dateKey][p.employeeId] = entry
          })

          return {
            ...prev,
            dailyLogs: updatedLogs
          }
        })

        addLog('Imported Biometric logs', `Uploaded ZKTeco device transactions file (${parsedPunches.length} records)`, 'success')
        alert(`Successfully imported ${parsedPunches.length} punch records from ZKTeco logs! Roster records have been updated.`)
      } catch (err) {
        alert("Error parsing file: " + err.message)
      }
    }
    reader.readAsText(file)
  }

  const downloadCSVSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "101,2026-07-16 09:00:00,0\n"
      + "102,2026-07-16 08:50:00,0\n"
      + "103,2026-07-16 09:30:00,0\n"
      + "101,2026-07-16 18:00:00,1\n"
      + "102,2026-07-16 18:10:00,1\n"
      + "103,2026-07-16 18:00:00,1\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "zkteco_sample_logs.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calendar cell builder
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const renderAnalyticsCalendar = () => {
    const days = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const blanks = Array(firstDay).fill(null)
    const daysArray = Array.from({ length: days }, (_, i) => i + 1)
    const totalCells = [...blanks, ...daysArray]

    const handleMonthChange = (direction) => {
      if (direction === 'prev') {
        if (currentMonth === 0) {
          setCurrentMonth(11)
          setCurrentYear(prev => prev - 1)
        } else {
          setCurrentMonth(prev => prev - 1)
        }
      } else {
        if (currentMonth === 11) {
          setCurrentMonth(0)
          setCurrentYear(prev => prev + 1)
        } else {
          setCurrentMonth(prev => prev + 1)
        }
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Employee dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
              }}
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => handleMonthChange('prev')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>{monthNames[currentMonth]} {currentYear}</span>
            <button 
              onClick={() => handleMonthChange('next')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '14px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
            <span>Present & On-Time</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-warning)' }} />
            <span>Late Check-in</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-danger)' }} />
            <span>Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
            <span>On Approved Leave</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#475569' }} />
            <span>Weekend</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '12px',
            textAlign: 'center'
          }}>
            {/* Weekdays */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: '8px' }}>{d}</span>
            ))}

            {/* Cells */}
            {totalCells.map((day, idx) => {
              if (day === null) return <div key={`blank-${idx}`} />
              
              const monthStr = String(currentMonth + 1).padStart(2, '0')
              const dayStr = String(day).padStart(2, '0')
              const dateKey = `${currentYear}-${monthStr}-${dayStr}`
              const cellDate = new Date(currentYear, currentMonth, day)
              const dayOfWeek = cellDate.getDay() // 0 = Sunday, 6 = Saturday

              let color = 'rgba(255,255,255,0.02)'
              let border = '1px solid var(--border-color)'
              let title = 'No logged entry'

              if (dayOfWeek === 0 || dayOfWeek === 6) {
                color = 'rgba(71, 85, 105, 0.15)'
                border = '1px dashed #475569'
                title = 'Weekend'
              }

              if (isEmployeeOnLeave(selectedEmployeeId, dateKey)) {
                color = 'var(--accent-primary-glow)'
                border = '1px solid var(--accent-primary)'
                title = 'On Approved Leave'
              } else {
                const dayLog = dailyLogs[dateKey]?.[selectedEmployeeId]
                if (dayLog) {
                  if (dayLog.status === 'Present') {
                    color = 'var(--accent-success-glow)'
                    border = '1px solid var(--accent-success)'
                    title = `Present: check-in: ${dayLog.checkIn}, check-out: ${dayLog.checkOut}`
                  } else if (dayLog.status === 'Late') {
                    color = 'var(--accent-warning-glow)'
                    border = '1px solid var(--accent-warning)'
                    title = `Late Check-in: ${dayLog.checkIn}`
                  } else if (dayLog.status === 'Absent') {
                    color = 'var(--accent-danger-glow)'
                    border = '1px solid var(--accent-danger)'
                    title = 'Absent'
                  }
                }
              }

              return (
                <div
                  key={`day-${day}`}
                  title={title}
                  style={{
                    height: '52px',
                    borderRadius: '8px',
                    background: color,
                    border: border,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    position: 'relative'
                  }}
                >
                  <span>{day}</span>
                  {title !== 'No logged entry' && (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: title === 'Weekend' ? '#475569' :
                        title === 'On Approved Leave' ? 'var(--accent-primary)' :
                        title.startsWith('Present') ? 'var(--accent-success)' :
                        title.startsWith('Late') ? 'var(--accent-warning)' : 'var(--accent-danger)',
                      position: 'absolute',
                      bottom: '6px'
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px', fontWeight: 700 }}>Attendance & Leaves</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Verify timecards, check balances, and manage company time-off cycles.</p>
        </div>
        {activeTab === 'leaves' && (
          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            <Plus size={16} /> Apply for Leave
          </button>
        )}
      </div>

      {/* Navigation Submenu */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
        <button
          onClick={() => setActiveTab('daily')}
          style={{
            padding: '10px 18px', background: activeTab === 'daily' ? 'var(--bg-tertiary)' : 'transparent', border: 'none',
            borderRadius: '10px',
            color: activeTab === 'daily' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <ClipboardList size={16} style={{ color: activeTab === 'daily' ? 'var(--accent-primary)' : 'inherit' }} /> Daily Roll Call
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          style={{
            padding: '10px 18px', background: activeTab === 'leaves' ? 'var(--bg-tertiary)' : 'transparent', border: 'none',
            borderRadius: '10px',
            color: activeTab === 'leaves' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <CalendarDays size={16} style={{ color: activeTab === 'leaves' ? 'var(--accent-primary)' : 'inherit' }} /> Time-Off & Leaves
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 18px', background: activeTab === 'analytics' ? 'var(--bg-tertiary)' : 'transparent', border: 'none',
            borderRadius: '10px',
            color: activeTab === 'analytics' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <BarChart3 size={16} style={{ color: activeTab === 'analytics' ? 'var(--accent-primary)' : 'inherit' }} /> Analytics Calendar
        </button>
        <button
          onClick={() => setActiveTab('biometric')}
          style={{
            padding: '10px 18px', background: activeTab === 'biometric' ? 'var(--bg-tertiary)' : 'transparent', border: 'none',
            borderRadius: '10px',
            color: activeTab === 'biometric' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Cpu size={16} style={{ color: activeTab === 'biometric' ? 'var(--accent-primary)' : 'inherit' }} /> Biometric Integrations
        </button>
      </div>

      {/* TAB CONTENT: DAILY ROLL CALL */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Roster Date:</span>
              <input 
                type="date" value={selectedDate} 
                onChange={(e) => { setSelectedDate(e.target.value); setLocalLogs({}) }}
                style={{
                  padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveDailyLogs}>
              <Check size={16} /> Save Daily Logs
            </button>
          </div>

          {/* Roster list table */}
          <div className="glass-card" style={{ overflowX: 'auto', padding: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Personnel</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clock-In Time</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clock-Out Time</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hours Logged</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Check-In Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const data = getEmployeeDailyData(emp.id)
                  const onLeave = data.status === 'On Leave'
                  const absent = data.status === 'Absent'

                  return (
                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={emp.avatar} alt={emp.name} style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{emp.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.role}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {onLeave || absent ? <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>--</span> : (
                          <input 
                            type="text" value={data.checkIn} 
                            placeholder="e.g. 09:00 AM"
                            onChange={(e) => handleLocalLogUpdate(emp.id, 'checkIn', e.target.value)}
                            style={{
                              padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', width: '90px'
                            }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {onLeave || absent ? <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>--</span> : (
                          <input 
                            type="text" value={data.checkOut} 
                            placeholder="e.g. 06:00 PM"
                            onChange={(e) => handleLocalLogUpdate(emp.id, 'checkOut', e.target.value)}
                            style={{
                              padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', width: '90px'
                            }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {data.hours} hrs
                      </td>
                      <td style={{ padding: '16px' }}>
                        {onLeave ? (
                          <span style={{
                            display: 'inline-flex', gap: '4px', padding: '4px 8px', borderRadius: '12px',
                            fontSize: '0.75rem', fontWeight: 600, background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)'
                          }}>On Leave</span>
                        ) : (
                          <select
                            value={data.status}
                            onChange={(e) => handleLocalLogUpdate(emp.id, 'status', e.target.value)}
                            style={{
                              padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer'
                            }}
                          >
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TIME-OFF & LEAVES */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Leaves Ledger Section */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Annual Leave Balances Ledger</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {employees.map(emp => {
                const bal = getEmployeeBalances(emp.id)
                return (
                  <div key={emp.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={emp.avatar} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{emp.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.department}</span>
                      </div>
                    </div>
                    {/* Progress details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sick Leave</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent-info)' }}>{bal.sick.used} / {bal.sick.limit} days</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Casual Leave</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent-warning)' }}>{bal.casual.used} / {bal.casual.limit} days</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Annual Leave</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent-success)' }}>{bal.annual.used} / {bal.annual.limit} days</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leaves Request table */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Leave Requests History Queue</h3>
            <div className="glass-card" style={{ overflowX: 'auto', padding: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Employee</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Leave Details</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reason</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No leave records logged.
                      </td>
                    </tr>
                  ) : (
                    leaves.map(req => {
                      const emp = employees.find(e => e.id === req.employeeId)
                      if (!emp) return null
                      const isPending = req.status === 'Pending'

                      return (
                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={emp.avatar} alt={emp.name} style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{emp.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.role}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{req.leaveType}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.85rem' }}>{req.startDate} to {req.endDate}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({req.days} days)</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', wordBreak: 'break-word' }}>
                            {req.reason}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: req.status === 'Approved' ? 'var(--accent-success-glow)' : 
                                req.status === 'Rejected' ? 'var(--accent-danger-glow)' : 'var(--accent-warning-glow)',
                              color: req.status === 'Approved' ? 'var(--accent-success)' : 
                                req.status === 'Rejected' ? 'var(--accent-danger)' : 'var(--accent-warning)'
                            }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleApproveLeave(req.id)}
                                  className="btn btn-success" style={{ padding: '6px', borderRadius: '50%' }}
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleRejectLeave(req.id)}
                                  className="btn btn-danger" style={{ padding: '6px', borderRadius: '50%' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged</span>
                            )}
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

      {/* TAB CONTENT: ANALYTICS CALENDAR */}
      {activeTab === 'analytics' && renderAnalyticsCalendar()}

      {/* TAB CONTENT: BIOMETRIC INTEGRATIONS */}
      {activeTab === 'biometric' && (
        <div className="responsive-biometric-grid">
          
          {/* Left Side: CSV Importer */}
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={18} style={{ color: 'var(--accent-primary)' }} />
              ZKTeco CSV Log Importer
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Export attendance transaction logs from ZKAccess or BioTime software as a CSV or text file, and upload it below. 
              The engine will parse the raw punch events and populate the timecards automatically.
            </p>

            {/* Drag & Drop zone */}
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.01)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              position: 'relative',
              cursor: 'pointer'
            }}>
              <Download size={32} style={{ color: 'var(--accent-primary)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click to Select File</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accepts CSV, TXT files (Tab/Comma delimited)</span>
              </div>
              <input 
                type="file" 
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  opacity: 0, cursor: 'pointer', width: '100%', height: '100%'
                }}
              />
            </div>

            {/* Template Download */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Need a formatted sample ZK log?</span>
              <button 
                onClick={downloadCSVSample}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={12} /> Sample CSV
              </button>
            </div>
          </div>

          {/* Right Side: Scripts Setup Guides */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Guide: Python SDK Sync Agent */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} style={{ color: 'var(--accent-success)' }} />
                Python Local TCP/IP Sync Agent
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                To connect directly with ZKTeco devices on your office local network (port 4370), use the Python script located at:
                <br />
                <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '6px', fontSize: '0.75rem' }}>
                  /scripts/zkteco_sync_agent.py
                </code>
              </p>
              <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Quick Commands:</strong>
                <pre style={{ margin: '6px 0 0 0', color: 'var(--accent-info)', fontFamily: 'monospace' }}>
                  pip install pyzk google-api-python-client<br />
                  python scripts/zkteco_sync_agent.py
                </pre>
              </div>
            </div>

            {/* Guide: ADMS Cloud HTTP receiver */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} style={{ color: 'var(--accent-info)' }} />
                ADMS Cloud Webhook Middleware
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Configure ZKTeco push devices to automatically post transactions in real-time. The server receiver script is located at:
                <br />
                <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '6px', fontSize: '0.75rem' }}>
                  /scripts/adms_receiver.js
                </code>
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Point the ADMS target server IP inside ZK network configurations to this node receiver address.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* APPLY LEAVE OVERLAY MODAL */}
      {showApplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
                Apply for Time Off
              </h3>
              <button onClick={() => setShowApplyModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Employee Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Personnel</label>
                <select
                  value={leaveEmployeeId} onChange={(e) => setLeaveEmployeeId(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Category</label>
                <select
                  value={leaveType} onChange={(e) => setLeaveType(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="Sick Leave">Sick Leave (14 days limit)</option>
                  <option value="Casual Leave">Casual Leave (10 days limit)</option>
                  <option value="Annual Leave">Annual Leave (20 days limit)</option>
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Start Date</label>
                  <input
                    type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>End Date</label>
                  <input
                    type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Warnings */}
              {getFormBalanceWarning() && (
                <div style={{
                  display: 'flex', gap: '8px', padding: '12px', borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '0.75rem', color: 'var(--accent-danger)', alignItems: 'center'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{getFormBalanceWarning()}</span>
                </div>
              )}

              {/* Reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Reason Statement</label>
                <textarea
                  required placeholder="Provide details..." value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minHeight: '60px' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ad slot */}
      <AdSlot type="horizontal" style={{ marginTop: '20px' }} />
    </div>
  )
}
