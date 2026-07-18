import { useState, useMemo, useRef } from 'react'
import { 
  BarChart3, FileText, Download, Calendar, Mail, 
  PieChart as PieChartIcon, TrendingUp, Users, Clock, AlertTriangle 
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export default function Reports({ employees, payroll, attendance, addLog, addToast, simulatedRole }) {
  const [activeTab, setActiveTab] = useState('payroll')
  const [deptFilter, setDeptFilter] = useState('All')
  const [searchFilter, setSearchFilter] = useState('')
  const [dateRange, setDateRange] = useState('Last 30 Days')
  
  const reportRef = useRef(null)

  // -- Global Filtered Employees --
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchDept = deptFilter === 'All' || emp.department === deptFilter
      const matchSearch = emp.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchFilter.toLowerCase())
      return matchDept && matchSearch
    })
  }, [employees, deptFilter, searchFilter])

  // -- Payroll Data Processing --
  const payrollHistory = useMemo(() => {
    const history = payroll?.history || []
    const monthlyData = {}
    
    history.forEach(record => {
      const date = new Date(record.executionDate || Date.now())
      const month = date.toLocaleString('default', { month: 'short' })
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, gross: 0, net: 0, deductions: 0 }
      }
      monthlyData[month].gross += record.gross || 0
      monthlyData[month].net += record.net || 0
      monthlyData[month].deductions += record.deductions || 0
    })

    return Object.values(monthlyData)
  }, [payroll])

  const departmentSalaryData = useMemo(() => {
    const data = {}
    filteredEmployees.forEach(emp => {
      const d = emp.department || 'Other'
      if (!data[d]) data[d] = 0
      data[d] += (payroll?.settings?.baseSalary || 5000)
    })
    return Object.entries(data).map(([name, value]) => ({ name, value }))
  }, [filteredEmployees, payroll])

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  const topEarners = useMemo(() => {
    return [...filteredEmployees]
      .map(emp => ({
        ...emp,
        gross: payroll?.settings?.baseSalary || 5000,
        deductions: (payroll?.settings?.baseSalary || 5000) * 0.1, 
        net: (payroll?.settings?.baseSalary || 5000) * 0.9
      }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 5)
  }, [filteredEmployees, payroll])


  // -- Attendance Data Processing --
  const attendanceData = useMemo(() => {
    const logs = attendance?.dailyLogs || {}
    const lateComers = {}
    const overtime = {}
    
    Object.keys(logs).forEach(date => {
      const dayData = logs[date]
      Object.keys(dayData).forEach(empId => {
        const entry = dayData[empId]
        
        if (entry.status === 'Late') {
          lateComers[empId] = (lateComers[empId] || 0) + 1
        }
        
        const hrs = parseFloat(entry.hours || 0)
        if (hrs > 9.0) {
          overtime[empId] = (overtime[empId] || 0) + (hrs - 9.0)
        }
      })
    })

    return {
      lateComers: Object.entries(lateComers).filter(([_, count]) => count >= 1).map(([id, count]) => ({ id, count })),
      overtime: Object.entries(overtime).filter(([_, hours]) => hours > 0).map(([id, hours]) => ({ id, hours: hours.toFixed(1) }))
    }
  }, [attendance])


  // -- Leaves Data Processing --
  const leaveTrends = useMemo(() => {
    const leaves = attendance?.leaves || []
    const trend = { Sick: 0, Casual: 0, Annual: 0 }
    leaves.forEach(l => {
      if (l.leaveType.includes('Sick')) trend.Sick += l.days
      else if (l.leaveType.includes('Casual')) trend.Casual += l.days
      else trend.Annual += l.days
    })
    return [
      { name: 'Sick', days: trend.Sick },
      { name: 'Casual', days: trend.Casual },
      { name: 'Annual', days: trend.Annual }
    ]
  }, [attendance])

  
  // -- Export Actions --
  const handleExportPDF = () => {
    if (!reportRef.current) return
    if (addToast) addToast('Generating PDF Report...', 'info')
    
    html2canvas(reportRef.current, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`HR_Pulse_${activeTab}_Report.pdf`)
      addLog('Report Exported', `Exported ${activeTab} report to PDF`, 'success')
      if (addToast) addToast('PDF Downloaded successfully', 'success')
    }).catch(err => {
      if (addToast) addToast('Failed to generate PDF', 'error')
      console.error(err)
    })
  }

  const handleExportCSV = () => {
    addLog('Report Exported', `Exported ${activeTab} report to CSV`, 'success')
    if (addToast) addToast('CSV Export functionality mocked', 'info')
  }

  const handleScheduleReport = () => {
    if (addToast) addToast('Weekly report scheduled for Admin and HR Manager', 'success')
  }


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.7rem', marginBottom: '4px', fontWeight: 900, letterSpacing: '-0.04em' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Comprehensive insights into payroll, attendance, and leaves.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleScheduleReport}>
            <Mail size={16} /> Schedule Report
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Global Controls */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Date Range</label>
          <select 
            value={dateRange} onChange={e => setDateRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option>Last 30 Days</option>
            <option>This Quarter</option>
            <option>This Year</option>
            <option>Custom</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</label>
          <select 
            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Human Resources">Human Resources</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Search Employee</label>
          <input 
            type="text" placeholder="Search by name or ID..."
            value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
        <button
          onClick={() => setActiveTab('payroll')}
          style={{ padding: '10px 18px', background: activeTab === 'payroll' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', borderRadius: '10px', color: activeTab === 'payroll' ? '#ffffff' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all var(--transition-fast)' }}
        >
          <TrendingUp size={16} style={{ color: activeTab === 'payroll' ? 'var(--accent-primary)' : 'inherit' }} /> Payroll Reports
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          style={{ padding: '10px 18px', background: activeTab === 'attendance' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', borderRadius: '10px', color: activeTab === 'attendance' ? '#ffffff' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all var(--transition-fast)' }}
        >
          <Clock size={16} style={{ color: activeTab === 'attendance' ? 'var(--accent-primary)' : 'inherit' }} /> Attendance Reports
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          style={{ padding: '10px 18px', background: activeTab === 'leaves' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', borderRadius: '10px', color: activeTab === 'leaves' ? '#ffffff' : 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all var(--transition-fast)' }}
        >
          <Calendar size={16} style={{ color: activeTab === 'leaves' ? 'var(--accent-primary)' : 'inherit' }} /> Leave Reports
        </button>
      </div>

      {/* Report Content Area */}
      <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '32px', background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px' }}>
        
        {/* PAYROLL TAB */}
        {activeTab === 'payroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Monthly Payout Summary */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Monthly Payout Summary</h3>
                  <button className="btn-outline" onClick={handleExportCSV} style={{ padding: '4px 10px', fontSize: '0.75rem' }}><Download size={14}/> CSV</button>
                </div>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={payrollHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="gross" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="net" stroke="var(--accent-success)" strokeWidth={3} />
                      <Line type="monotone" dataKey="deductions" stroke="var(--accent-danger)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Distribution */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Salary Distribution</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentSalaryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value"
                      >
                        {departmentSalaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Earners Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Top Earners</h3>
                <button className="btn-outline" onClick={handleExportCSV} style={{ padding: '4px 10px', fontSize: '0.75rem' }}><Download size={14}/> CSV</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px' }}>Employee</th>
                      <th style={{ padding: '12px' }}>Gross Pay</th>
                      <th style={{ padding: '12px' }}>Deductions</th>
                      <th style={{ padding: '12px' }}>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEarners.map(emp => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={emp.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                            <span style={{ fontWeight: 600 }}>{emp.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>${emp.gross.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--accent-danger)' }}>-${emp.deductions.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--accent-success)', fontWeight: 600 }}>${emp.net.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Heatmap mock */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Monthly Heatmap (This Month)</h3>
                <button className="btn-outline" onClick={handleExportCSV} style={{ padding: '4px 10px', fontSize: '0.75rem' }}><Download size={14}/> CSV</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: '800px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredEmployees.slice(0, 8).map(emp => (
                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '120px', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</span>
                      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                        {Array.from({ length: 30 }).map((_, i) => {
                          const r = Math.random()
                          let color = 'var(--accent-success)' // present
                          if (r > 0.9) color = 'var(--accent-danger)' // absent
                          else if (r > 0.8) color = 'var(--accent-warning)' // late
                          else if (r > 0.75) color = 'var(--accent-primary)' // leave
                          
                          return <div key={i} title={`Day ${i+1}`} style={{ flex: 1, height: '24px', backgroundColor: color, borderRadius: '4px', opacity: 0.8 }} />
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Late Comers */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="var(--accent-warning)"/> Late Comers Report
                  </h3>
                  <button className="btn-outline" onClick={handleExportCSV} style={{ padding: '4px 10px', fontSize: '0.75rem' }}><Download size={14}/> CSV</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px' }}>Employee</th>
                      <th style={{ padding: '12px' }}>Occurrences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.lateComers.length === 0 && (
                      <tr><td colSpan={2} style={{ padding: '16px', color: 'var(--text-muted)' }}>No late comers found.</td></tr>
                    )}
                    {attendanceData.lateComers.map(late => {
                      const emp = employees.find(e => e.id === late.id) || {}
                      return (
                        <tr key={late.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src={emp.avatar} alt="" style={{ width: '24px', borderRadius: '50%' }}/> {emp.name}</div></td>
                          <td style={{ padding: '12px', color: 'var(--accent-warning)', fontWeight: 600 }}>{late.count} days</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Overtime Tracker */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="var(--accent-primary)"/> Overtime Tracker
                  </h3>
                  <button className="btn-outline" onClick={handleExportCSV} style={{ padding: '4px 10px', fontSize: '0.75rem' }}><Download size={14}/> CSV</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px' }}>Employee</th>
                      <th style={{ padding: '12px' }}>Total Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.overtime.length === 0 && (
                      <tr><td colSpan={2} style={{ padding: '16px', color: 'var(--text-muted)' }}>No overtime logged.</td></tr>
                    )}
                    {attendanceData.overtime.map(ot => {
                      const emp = employees.find(e => e.id === ot.id) || {}
                      return (
                        <tr key={ot.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src={emp.avatar} alt="" style={{ width: '24px', borderRadius: '50%' }}/> {emp.name}</div></td>
                          <td style={{ padding: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>{ot.hours} hrs</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LEAVES TAB */}
        {activeTab === 'leaves' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Leave Balances Overview */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Leave Balance Overview</h3>
                  <button className="btn-outline" onClick={handleExportCSV} style={{ padding: '4px 10px', fontSize: '0.75rem' }}><Download size={14}/> CSV</button>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px' }}>Employee</th>
                        <th style={{ padding: '12px' }}>Annual Rem.</th>
                        <th style={{ padding: '12px' }}>Sick Rem.</th>
                        <th style={{ padding: '12px' }}>Casual Rem.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map(emp => {
                        const bal = attendance?.balances?.[emp.id] || { 
                          annual: { limit: 20, used: 0 }, 
                          sick: { limit: 14, used: 0 }, 
                          casual: { limit: 10, used: 0 } 
                        }
                        const aRem = bal.annual.limit - bal.annual.used
                        const sRem = bal.sick.limit - bal.sick.used
                        const cRem = bal.casual.limit - bal.casual.used

                        return (
                          <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '12px' }}>{emp.name}</td>
                            <td style={{ padding: '12px', color: aRem < 0 ? 'var(--accent-danger)' : 'inherit', fontWeight: aRem < 0 ? 700 : 400 }}>{aRem} days</td>
                            <td style={{ padding: '12px', color: sRem < 0 ? 'var(--accent-danger)' : 'inherit', fontWeight: sRem < 0 ? 700 : 400 }}>{sRem} days</td>
                            <td style={{ padding: '12px', color: cRem < 0 ? 'var(--accent-danger)' : 'inherit', fontWeight: cRem < 0 ? 700 : 400 }}>{cRem} days</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leave Trend Bar Chart */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Leave Trend</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} />
                      <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="days" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
