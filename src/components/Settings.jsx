import { useState, useRef, useEffect } from 'react'
import { Save, Settings as SettingsIcon, DollarSign, Sliders, Info, Percent, Building2, Bell, Globe, Mail, Plus, Trash2, Upload, Activity, X, ShieldCheck, List, FileSpreadsheet, Download, Receipt, CalendarClock, Check, ChevronDown } from 'lucide-react'
import { useModal } from '../services/useModal.js'
import AdSlot from './AdSlot.jsx'
import { formatDateTime } from '../services/date.js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const pInp = { width: '100%', padding: '10px 14px', borderRadius: '100px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)', font: "500 14px 'Roboto'", outline: 'none', transition: 'border 0.15s' }
const pSel = { width: '100%', padding: '10px 14px', borderRadius: '100px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--md-bw-on-surface)', font: "500 14px 'Roboto'", outline: 'none', cursor: 'pointer', appearance: 'none' }
const lbl = { font: "500 11px 'Roboto'", textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-bw-on-surface-variant)', marginBottom: '6px', display: 'block' }
const card = { background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--glass-radius)', boxShadow: 'var(--glass-shadow)' }

export default function Settings({ settings, setSettings, addLog, addToast, auditLogs, simulatedRole, syncConflicts, setSyncConflicts }) {
  const [activeSubmenu, setActiveSubmenu] = useState(() => localStorage.getItem('hr_pulse_settings_tab') || null)

  const setTab = (id) => {
    if (activeSubmenu === id) {
      setActiveSubmenu(null)
    } else {
      setActiveSubmenu(id)
      localStorage.setItem('hr_pulse_settings_tab', id)
    }
  }

  const [auditFilterDate, setAuditFilterDate] = useState('')
  const [auditFilterAction, setAuditFilterAction] = useState('All')

  const [activeSessions] = useState([
    { id: 'sess-1', device: 'Chrome / Windows', location: 'New York, US', current: true, ip: '192.168.1.1', time: 'Active now' },
    { id: 'sess-2', device: 'Safari / iPhone 13', location: 'New York, US', current: false, ip: '192.168.1.5', time: 'Last active 2 hours ago' }
  ])

  const [currency, setCurrency] = useState(settings.currency || '৳')
  const [salaryStructure, setSalaryStructure] = useState(settings.salaryStructure || [])
  const [expensePolicies, setExpensePolicies] = useState(settings.expensePolicies || { Travel: 500, Meals: 50, 'Office Supplies': 100, Medical: 200, Other: 50 })
  const [companyName, setCompanyName] = useState(settings.company?.name || 'HR Pulse Ltd.')
  const [companyEmail, setCompanyEmail] = useState(settings.company?.email || 'hr@hrpulse.io')
  const [companyWebsite, setCompanyWebsite] = useState(settings.company?.website || 'www.hrpulse.io')
  const [logo, setLogo] = useState(settings.company?.logo || '')
  const [logoX, setLogoX] = useState(settings.company?.logoX || 0)
  const [logoY, setLogoY] = useState(settings.company?.logoY || 0)
  const [logoZoom, setLogoZoom] = useState(settings.company?.logoZoom || 1)

  const [showLogoModal, setShowLogoModal] = useState(false)
  useModal(() => setShowLogoModal(false))
  const [dragStart, setDragStart] = useState(null)
  const fileInputRef = useRef(null)
  const [syncAlerts, setSyncAlerts] = useState(settings.notifications?.syncAlerts ?? true)
  const [emailDigests, setEmailDigests] = useState(settings.notifications?.emailDigests ?? false)
  const [shiftTemplates, setShiftTemplates] = useState(settings.shiftTemplates || [])
  const [overtimeRules, setOvertimeRules] = useState(settings.overtimeRules || { multiplierWeekday: 1.5, multiplierWeekend: 2.0 })
  const [isSaving, setIsSaving] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  useModal(() => setShowResetModal(false))

  useEffect(() => {
    if (settings.currency && settings.currency !== currency) setCurrency(settings.currency)
    if (settings.salaryStructure) setSalaryStructure(settings.salaryStructure)
    if (settings.expensePolicies) setExpensePolicies(settings.expensePolicies)
    if (settings.company?.name) setCompanyName(settings.company.name)
    if (settings.company?.email) setCompanyEmail(settings.company.email)
    if (settings.company?.website) setCompanyWebsite(settings.company.website)
    if (settings.company?.logo) setLogo(settings.company.logo)
    if (settings.company?.logoX !== undefined) setLogoX(settings.company.logoX)
    if (settings.company?.logoY !== undefined) setLogoY(settings.company.logoY)
    if (settings.company?.logoZoom !== undefined) setLogoZoom(settings.company.logoZoom)
    if (settings.notifications) {
      if (settings.notifications.syncAlerts !== undefined) setSyncAlerts(settings.notifications.syncAlerts)
      if (settings.notifications.emailDigests !== undefined) setEmailDigests(settings.notifications.emailDigests)
    }
    if (settings.shiftTemplates) setShiftTemplates(settings.shiftTemplates)
    if (settings.overtimeRules) setOvertimeRules(settings.overtimeRules)
  }, [settings])

  const earningsSum = salaryStructure.filter(s => s.type === 'earning').reduce((a, c) => a + c.percentage, 0)
  const deductionsSum = salaryStructure.filter(s => s.type === 'deduction').reduce((a, c) => a + c.percentage, 0)
  const netPayPercent = earningsSum - deductionsSum
  const totalComponents = earningsSum + deductionsSum
  const isOver100 = totalComponents > 100

  const handleComponentChange = (id, field, value) => {
    setSalaryStructure(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleAddComponent = () => {
    setSalaryStructure(prev => [...prev, { id: `comp-${Date.now()}`, name: 'New Component', percentage: 5, type: 'earning' }])
  }

  const handleRemoveComponent = (id) => {
    setSalaryStructure(prev => prev.filter(item => item.id !== id))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setSettings({
        ...settings,
        currency, salaryStructure, expensePolicies, shiftTemplates, overtimeRules,
        company: { ...settings.company, name: companyName, email: companyEmail, website: companyWebsite, logo, logoX, logoY, logoZoom },
        notifications: { syncAlerts, emailDigests }
      })
      addLog('Settings Updated', 'Saved system settings and synced configurations with Google Drive', 'success')
      setIsSaving(false)
      if (addToast) addToast("Settings saved successfully and synced to Google Drive!", "success")
      else addLog('Settings Saved', 'Settings saved successfully', 'success')
    }, 1000)
  }

  const SEG_COLORS = ['#0062E6', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#17a2b8', '#6610f2']
  const getSegmentColor = (_, index) => SEG_COLORS[index % SEG_COLORS.length]
  const darkenColor = (hex, amount = 35) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => { setLogo(reader.result); setLogoX(0); setLogoY(0); setLogoZoom(1); setShowLogoModal(true) }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  const handlePointerDown = (e) => {
    e.preventDefault()
    setDragStart({ x: e.clientX - logoX, y: e.clientY - logoY })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => { if (dragStart) setLogoX(e.clientX - dragStart.x); setLogoY(e.clientY - dragStart.y) }
  const handlePointerUp = () => setDragStart(null)

  const handleRemoveLogo = () => { setLogo(''); setLogoX(0); setLogoY(0); setLogoZoom(1); setShowLogoModal(false) }

  const menuItems = [
    { id: 'payroll', icon: Sliders, label: 'Payroll Settings' },
    { id: 'company', icon: Building2, label: 'Company Profile' },
    { id: 'expenses', icon: Receipt, label: 'Expense Policies' },
    { id: 'rosters', icon: CalendarClock, label: 'Rosters & Shifts' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'audit', icon: List, label: 'Audit Logs' },
    { id: 'security', icon: ShieldCheck, label: 'Security' },
    { id: 'sync', icon: Activity, label: 'Sync Conflicts', badge: syncConflicts?.length },
  ]

  const handleExportCSV = () => {
    const filteredAudit = (auditLogs || []).filter(l => {
      if (auditFilterAction !== 'All' && l.action !== auditFilterAction) return false
      if (auditFilterDate && !l.timestamp.startsWith(auditFilterDate)) return false
      return true
    })
    if (!filteredAudit.length) return
    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP Address']
    const rows = filteredAudit.map(log => [formatDateTime(log.timestamp), log.user, log.action, log.entity, log.details, log.ip].map(f => `"${f}"`).join(','))
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n')
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    if (addToast) addToast("Audit logs exported to CSV", "success")
  }

  const renderSettingsContent = (id) => {
    switch (id) {
      case 'payroll': return (
        <div className="payroll-settings-grid">
          <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Currency & Salary</h4>
                <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', margin: '4px 0 0' }}>Currency symbol and salary component configuration.</p>
              </div>
              <div style={{ position: 'relative', width: '180px', flexShrink: 0 }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...pSel }}>
                  <option value="$">$ (USD)</option>
                  <option value="৳">৳ (BDT)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="¥">¥ (JPY)</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--md-bw-on-surface-variant)' }} />
              </div>
            </div>

            <hr style={{ margin: 0, border: 'none', borderTop: '1px solid var(--glass-border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Salary Structure</h4>
              <button onClick={handleAddComponent} className="btn btn-outlined" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px' }}>
                <Plus size={14} /> Add Component
              </button>
            </div>

            {isOver100 && (
              <div style={{ padding: '12px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '100px', color: 'var(--md-bw-on-surface)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <Info size={16} /> Component total exceeds 100%. Please adjust before saving.
              </div>
            )}

            {salaryStructure.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={salaryStructure.map(item => ({ ...item, value: item.percentage }))}
                      cx="50%" cy="54%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}
                      isAnimationActive={false}>
                      {salaryStructure.map((item, index) => (
                        <Cell key={item.id} fill={darkenColor(getSegmentColor(item, index), 50)} stroke="none" />
                      ))}
                    </Pie>
                    <Pie data={salaryStructure.map(item => ({ ...item, value: item.percentage }))}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                      {salaryStructure.map((item, index) => (
                        <Cell key={item.id} fill={getSegmentColor(item, index)} stroke="rgba(255,255,255,0.25)" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} labelFormatter={() => ''}
                      contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', backdropFilter: 'blur(12px)', fontSize: '13px' }}
                      itemStyle={{ color: 'var(--md-bw-on-surface)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {salaryStructure.length === 0 ? (
                <span className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)', textAlign: 'center', padding: '20px 0' }}>
                  No salary components configured. Click "Add Component" to get started.
                </span>
              ) : (
                salaryStructure.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                    background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)',
                  }}>
                    <input type="text" value={item.name} onChange={e => handleComponentChange(item.id, 'name', e.target.value)}
                      placeholder="Component name"
                      style={{ flex: 1, minWidth: '120px', ...pInp, padding: '8px 12px', fontSize: '13px' }} />

                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => handleComponentChange(item.id, 'type', 'earning')}
                        style={{
                          padding: '6px 12px', borderRadius: '100px', border: '1px solid',
                          fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                          background: item.type === 'earning' ? '#0062E6' : 'transparent',
                          color: item.type === 'earning' ? '#fff' : 'var(--md-bw-on-surface-variant)',
                          borderColor: item.type === 'earning' ? '#0062E6' : 'rgba(128,128,128,0.35)',
                        }}>Earning</button>
                      <button onClick={() => handleComponentChange(item.id, 'type', 'deduction')}
                        style={{
                          padding: '6px 12px', borderRadius: '100px', border: '1px solid',
                          fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                          background: item.type === 'deduction' ? '#dc3545' : 'transparent',
                          color: item.type === 'deduction' ? '#fff' : 'var(--md-bw-on-surface-variant)',
                          borderColor: item.type === 'deduction' ? '#dc3545' : 'rgba(128,128,128,0.35)',
                        }}>Deduction</button>
                    </div>

                    <div style={{ position: 'relative', width: '70px', flexShrink: 0 }}>
                      <input type="number" min="0" max="100" value={item.percentage}
                        onChange={e => handleComponentChange(item.id, 'percentage', Number(e.target.value))}
                        style={{ ...pInp, padding: '8px 10px', fontSize: '13px', textAlign: 'center', paddingRight: '20px' }} />
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', pointerEvents: 'none' }}>%</span>
                    </div>

                    <button onClick={() => handleRemoveComponent(item.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--md-bw-on-surface-variant)', cursor: 'pointer', padding: '6px', display: 'flex', flexShrink: 0 }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {salaryStructure.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <span className="body-medium" style={{ color: 'var(--md-bw-on-surface)', fontWeight: 600 }}>Net Earning Ratio</span>
                <span className="body-medium" style={{
                  color: netPayPercent >= 0 ? 'var(--md-bw-on-surface)' : '#dc3545',
                  fontVariantNumeric: 'tabular-nums', fontWeight: 700,
                }}>{netPayPercent}%</span>
              </div>
            )}
          </div>
        </div>
      )
      case 'company': return (
        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
            <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Company Profile Settings</h4>
          </div>
          <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Manage public details regarding your enterprise. These details are used to brand generated documents like reports, receipts, and payslips.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={lbl}>Brand Logo</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div onClick={() => { if (logo) setShowLogoModal(true); else triggerFileInput() }}
                  style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                  {logo ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${logoZoom}) translate(${logoX}px, ${logoY}px)`, transformOrigin: 'center' }} />
                    : <Activity size={24} color="var(--md-bw-on-surface-variant)" />}
                </div>
                <button onClick={triggerFileInput} className="btn btn-outlined" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px' }}>
                  <Upload size={14} /> Upload New Logo
                </button>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
              </div>
            </div>

            {['Name', 'Email', 'Website'].map(field => {
              const val = field === 'Name' ? companyName : field === 'Email' ? companyEmail : companyWebsite
              const set = field === 'Name' ? setCompanyName : field === 'Email' ? setCompanyEmail : setCompanyWebsite
              const Icon = field === 'Name' ? Building2 : field === 'Email' ? Mail : Globe
              const ph = field === 'Name' ? 'HR Pulse Ltd.' : field === 'Email' ? 'hr@hrpulse.io' : 'www.hrpulse.io'
              const type = field === 'Email' ? 'email' : 'text'
              return (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={lbl}>{field === 'Name' ? 'Legal Entity Name' : field === 'Email' ? 'HR Support Email' : 'Company Website URL'}</span>
                  <div style={{ position: 'relative' }}>
                    <Icon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-bw-on-surface-variant)' }} />
                    <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                      style={{ ...pInp, paddingLeft: '38px', fontSize: '13px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
      case 'notifications': return (
        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
            <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Notification Preferences</h4>
          </div>
          <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Enable alerts, sync logs alerts, or background notification parameters.</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'Enable Real-time Sync Alerts', desc: 'Displays popups when files successfully sync with Google Drive.', val: syncAlerts, set: setSyncAlerts },
              { label: 'Email Monthly Payout Digest', desc: 'Sends a copy of the payroll statements to the HR support inbox.', val: emailDigests, set: setEmailDigests },
            ].map((item, i) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i === 0 ? '1px solid var(--glass-border)' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="body-medium" style={{ color: 'var(--md-bw-on-surface)', fontWeight: 500 }}>{item.label}</span>
                  <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{item.desc}</span>
                </div>
                <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0062E6', borderRadius: '4px', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )
      case 'expenses': return (
        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
            <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Expense Policies</h4>
          </div>
          <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Set maximum reimbursement limits per category. Expenses exceeding these limits will be flagged for review in the approval queue.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {Object.keys(expensePolicies).map(cat => (
              <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={lbl}>{cat}</span>
                <input type="number" value={expensePolicies[cat]} onChange={e => setExpensePolicies(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                  style={{ ...pInp, fontSize: '13px' }} />
              </div>
            ))}
          </div>
        </div>
      )
      case 'rosters': return (
        <>
          <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarClock size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Shift Templates</h4>
              </div>
              <button className="btn btn-outlined" onClick={() => setShiftTemplates(prev => [...prev, { id: `st-${Date.now()}`, name: 'New Shift', start: '09:00', end: '17:00', break: 60, color: '#333333' }])}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px' }}>
                <Plus size={14} /> Add Shift
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shiftTemplates.map(t => (
                <div key={t.id} style={{ ...card, padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1.5', minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={lbl}>Shift Name</span>
                    <input type="text" value={t.name} onChange={e => setShiftTemplates(prev => prev.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} style={{ ...pInp, fontSize: '13px' }} />
                  </div>
                  <div style={{ flex: '1', minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={lbl}>Start</span>
                    <input type="time" value={t.start} onChange={e => setShiftTemplates(prev => prev.map(x => x.id === t.id ? { ...x, start: e.target.value } : x))} style={{ ...pInp, fontSize: '13px' }} />
                  </div>
                  <div style={{ flex: '1', minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={lbl}>End</span>
                    <input type="time" value={t.end} onChange={e => setShiftTemplates(prev => prev.map(x => x.id === t.id ? { ...x, end: e.target.value } : x))} style={{ ...pInp, fontSize: '13px' }} />
                  </div>
                  <div style={{ flex: '0.8', minWidth: '80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={lbl}>Break (min)</span>
                    <input type="number" value={t.break} onChange={e => setShiftTemplates(prev => prev.map(x => x.id === t.id ? { ...x, break: parseInt(e.target.value) || 0 } : x))} style={{ ...pInp, fontSize: '13px' }} />
                  </div>
                  <div style={{ width: '50px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ ...lbl, color: 'transparent' }}>C</span>
                    <input type="color" value={t.color} onChange={e => setShiftTemplates(prev => prev.map(x => x.id === t.id ? { ...x, color: e.target.value } : x))}
                      style={{ padding: 0, borderRadius: '100px', border: '1px solid var(--glass-border)', background: 'transparent', width: '100%', height: '38px', cursor: 'pointer' }} />
                  </div>
                  <button className="btn btn-text" style={{ padding: '10px', color: 'var(--md-bw-on-surface-variant)', flexShrink: 0, alignSelf: 'flex-end' }}
                    onClick={() => setShiftTemplates(prev => prev.filter(x => x.id !== t.id))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Overtime Rules</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={lbl}>Weekday Multiplier</span>
                <input type="number" step="0.1" value={overtimeRules.multiplierWeekday} onChange={e => setOvertimeRules(prev => ({ ...prev, multiplierWeekday: parseFloat(e.target.value) || 1 }))} style={{ ...pInp, fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={lbl}>Weekend/Holiday Multiplier</span>
                <input type="number" step="0.1" value={overtimeRules.multiplierWeekend} onChange={e => setOvertimeRules(prev => ({ ...prev, multiplierWeekend: parseFloat(e.target.value) || 1 }))} style={{ ...pInp, fontSize: '13px' }} />
              </div>
            </div>
          </div>
        </>
      )
      case 'audit': return (
        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <List size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Audit Logs</h4>
              </div>
              <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Review all system actions for compliance and security.</p>
            </div>
            <button onClick={handleExportCSV} className="btn btn-outlined" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px' }}>
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', padding: '16px', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ minWidth: '140px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={lbl}>Date</span>
              <input type="date" value={auditFilterDate} onChange={e => setAuditFilterDate(e.target.value)} style={{ ...pInp, fontSize: '13px' }} />
            </div>
            <div style={{ minWidth: '140px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={lbl}>Action Type</span>
              <div style={{ position: 'relative' }}>
                <select value={auditFilterAction} onChange={e => setAuditFilterAction(e.target.value)} style={{ ...pSel, fontSize: '13px' }}>
                  <option value="All">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--md-bw-on-surface-variant)' }} />
              </div>
            </div>
            <button onClick={() => { setAuditFilterDate(''); setAuditFilterAction('All') }} className="btn btn-text" style={{ height: '36px', fontSize: '13px', alignSelf: 'flex-end' }}>Clear</button>
          </div>

          <div className="payroll-table-container">
            <div className="payroll-table-header-wrap">
              <table className="payroll-table">
                <colgroup>
                  <col style={{ width: '160px' }} /><col style={{ width: '120px' }} />
                  <col style={{ width: '90px' }} /><col style={{ width: '100px' }} />
                  <col /><col style={{ width: '130px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ ...thStyle }}>Timestamp</th>
                    <th style={{ ...thStyle }}>User</th>
                    <th style={{ ...thStyle }}>Action</th>
                    <th style={{ ...thStyle }}>Entity</th>
                    <th style={{ ...thStyle }}>Details</th>
                    <th style={{ ...thStyle }}>IP Address</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="payroll-table-body-scroll" style={{ maxHeight: '400px' }}>
              <table className="payroll-table">
                <colgroup>
                  <col style={{ width: '160px' }} /><col style={{ width: '120px' }} />
                  <col style={{ width: '90px' }} /><col style={{ width: '100px' }} />
                  <col /><col style={{ width: '130px' }} />
                </colgroup>
                <tbody>
                  {(auditLogs || []).filter(l => {
                    if (auditFilterAction !== 'All' && l.action !== auditFilterAction) return false
                    if (auditFilterDate && !l.timestamp.startsWith(auditFilterDate)) return false
                    return true
                  }).length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--md-bw-on-surface-variant)', fontSize: '13px' }}>No logs found for selected filters.</td></tr>
                  ) : (
                    (auditLogs || []).filter(l => {
                      if (auditFilterAction !== 'All' && l.action !== auditFilterAction) return false
                      if (auditFilterDate && !l.timestamp.startsWith(auditFilterDate)) return false
                      return true
                    }).map(log => (
                      <tr key={log.id}>
                        <td style={{ ...cellStyle, fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(log.timestamp)}</td>
                        <td style={{ ...cellStyle, fontWeight: 500, fontSize: '13px' }}>{log.user}</td>
                        <td style={cellStyle}>
                          <span style={{
                            display: 'inline-flex', height: '22px', padding: '0 8px', fontSize: '11px', fontWeight: 600, alignItems: 'center', borderRadius: '20px',
                            background: log.action === 'CREATE' ? '#28a745' : log.action === 'UPDATE' ? '#007aff' : log.action === 'DELETE' ? '#dc3545' : 'var(--glass-bg)',
                            color: '#fff'
                          }}>{log.action}</span>
                        </td>
                        <td style={cellStyle}>{log.entity}</td>
                        <td style={{ ...cellStyle, color: 'var(--md-bw-on-surface-variant)', fontSize: '12px' }}>{log.details}</td>
                        <td style={{ ...cellStyle, color: 'var(--md-bw-on-surface-variant)', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{log.ip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
      case 'security': return (
        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
            <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Session Management</h4>
          </div>
          <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Review devices currently logged into your account.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeSessions.map(sess => (
              <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="body-medium" style={{ fontWeight: 500, color: 'var(--md-bw-on-surface)' }}>{sess.device}</span>
                    {sess.current && <span style={{ height: '22px', padding: '0 8px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', borderRadius: '20px', background: '#28a745', color: '#fff' }}>This Device</span>}
                  </div>
                  <div className="body-small" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--md-bw-on-surface-variant)' }}>
                    <span>{sess.location}</span><span>•</span><span>{sess.time}</span><span>•</span><span>{sess.ip}</span>
                  </div>
                </div>
                {!sess.current && (
                  <button className="btn btn-outlined" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                    onClick={() => {
                      if (addToast) addToast("Session terminated", "success")
                    }}>Sign Out</button>
                )}
              </div>
            ))}
          </div>
          {activeSessions.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-filled" style={{ height: '36px', fontSize: '13px' }}
                onClick={() => { if (addToast) addToast("All other devices signed out", "success") }}>
                Sign out all other devices
              </button>
            </div>
          )}
        </div>
      )
      case 'sync': return (
        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
            <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Sync Conflicts</h4>
          </div>
          <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Review and resolve data conflicts between local and remote databases.</p>

          <div className="payroll-table-container">
            <div className="payroll-table-header-wrap">
              <table className="payroll-table">
                <colgroup>
                  <col style={{ width: '120px' }} /><col style={{ width: '100px' }} />
                  <col /><col /><col style={{ width: '100px' }} /><col style={{ width: '100px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thStyle}>File</th>
                    <th style={thStyle}>Record ID</th>
                    <th style={thStyle}>Local Value</th>
                    <th style={thStyle}>Remote Value</th>
                    <th style={thStyle}>Resolution</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="payroll-table-body-scroll">
              <table className="payroll-table">
                <colgroup>
                  <col style={{ width: '120px' }} /><col style={{ width: '100px' }} />
                  <col /><col /><col style={{ width: '100px' }} /><col style={{ width: '100px' }} />
                </colgroup>
                <tbody>
                  {!syncConflicts || syncConflicts.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--md-bw-on-surface-variant)', fontSize: '13px' }}>No sync conflicts detected.</td></tr>
                  ) : (
                    syncConflicts.map((conflict, i) => (
                      <tr key={i}>
                        <td style={{ ...cellStyle, fontWeight: 500 }}>{conflict.file}</td>
                        <td style={cellStyle}>{conflict.recordId}</td>
                        <td style={{ ...cellStyle, color: 'var(--md-bw-on-surface-variant)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }} title={JSON.stringify(conflict.localValue)}>{JSON.stringify(conflict.localValue)}</td>
                        <td style={{ ...cellStyle, color: 'var(--md-bw-on-surface-variant)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }} title={JSON.stringify(conflict.remoteValue)}>{JSON.stringify(conflict.remoteValue)}</td>
                        <td style={{ ...cellStyle, color: 'var(--md-bw-on-surface-variant)', fontSize: '12px' }}>{conflict.resolution}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <button className="btn btn-outlined" style={{ height: '30px', padding: '0 12px', fontSize: '12px' }}
                            onClick={() => { setSyncConflicts(prev => prev.filter((_, idx) => idx !== i)); if (addToast) addToast("Conflict acknowledged", "success") }}>
                            Acknowledge
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
      default: return null
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>System Settings</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-text" onClick={() => setShowResetModal(true)} style={{ height: '36px', fontSize: '13px' }}>Reset Defaults</button>
          <button className="btn btn-filled" onClick={handleSave} disabled={isSaving || isOver100} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', fontSize: '13px' }}>
            {isSaving ? <div className="skeleton" style={{ width: 14, height: 14, borderRadius: '50%' }} /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map(item => {
          const Icon = item.icon
          const isOpen = activeSubmenu === item.id
          return (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => setTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 18px',
                  borderRadius: '14px', border: '1px solid', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  textAlign: 'left', outline: 'none', transition: 'all 0.2s ease',
                  borderColor: isOpen ? 'var(--accent-primary, #0062E6)' : 'var(--glass-border)',
                  background: isOpen ? 'linear-gradient(135deg, rgba(0,98,230,0.08), rgba(0,58,140,0.04))' : 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                  color: isOpen ? 'var(--accent-primary, #0062E6)' : 'var(--md-bw-on-surface)',
                  boxShadow: isOpen ? '0 0 0 1px rgba(0,98,230,0.3), var(--glass-shadow)' : 'var(--glass-shadow)',
                }}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background: isOpen ? 'var(--accent-primary, #0062E6)' : 'var(--md-bw-on-surface)', color: '#fff', fontSize: '11px', padding: '1px 7px', borderRadius: '12px', fontWeight: 600 }}>{item.badge}</span>
                )}
                <ChevronDown size={16} style={{
                  transition: 'transform 0.3s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: 'var(--md-bw-on-surface-variant)',
                }} />
              </button>
              <div style={{
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease',
                maxHeight: isOpen ? '2000px' : '0px',
                opacity: isOpen ? 1 : 0,
              }}>
                <div style={{ padding: '12px 0 4px 0' }}>
                  {renderSettingsContent(item.id)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AdSlot type="horizontal" style={{ marginTop: '4px' }} />

      {showLogoModal && (
        <div className="modal-overlay" onClick={() => setShowLogoModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...card, padding: '24px', maxWidth: '380px', width: '90%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Edit Brand Logo</h3>
              <button onClick={() => setShowLogoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-bw-on-surface-variant)', display: 'flex', padding: '4px' }}><X size={18} /></button>
            </div>
            <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', textAlign: 'center', margin: 0 }}>Drag the image to reposition it, or use the slider below to zoom.</p>
            <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onPointerLeave={handlePointerUp}
              style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: dragStart ? 'grabbing' : 'grab', touchAction: 'none', border: '1px solid var(--glass-border)' }}>
              {logo ? <img src={logo} alt="" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${logoZoom}) translate(${logoX}px, ${logoY}px)`, transformOrigin: 'center', pointerEvents: 'none' }} />
                : <Activity size={36} color="var(--md-bw-on-surface-variant)" />}
            </div>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', fontWeight: 500 }}>Zoom</span>
              <input type="range" min="0.5" max="3" step="0.05" value={logoZoom} onChange={e => setLogoZoom(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#0062E6' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button className="btn btn-outlined" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '36px', fontSize: '12px' }} onClick={triggerFileInput}>
                <Upload size={14} /> Replace
              </button>
              <button className="btn btn-outlined" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '36px', fontSize: '12px', color: '#dc3545' }} onClick={handleRemoveLogo}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
            <button className="btn btn-filled" style={{ width: '100%', height: '36px', fontSize: '13px' }} onClick={() => setShowLogoModal(false)}>
              <Check size={14} /> Done
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...card, padding: '24px', maxWidth: '380px', width: '90%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Confirm Reset</h3>
            <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Are you sure? This will reset all settings in the active tab to their default values.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-text" onClick={() => setShowResetModal(false)} style={{ height: '36px', fontSize: '13px' }}>Cancel</button>
              <button className="btn btn-filled" onClick={() => { setShowResetModal(false); if (addToast) addToast('Settings reset to defaults', 'info') }} style={{ height: '36px', fontSize: '13px' }}>Reset Defaults</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle = { padding: '0 16px', height: '48px', textAlign: 'left', borderBottom: '1.5px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em', color: 'var(--md-bw-on-surface)', whiteSpace: 'nowrap' }
const cellStyle = { padding: '0 16px', height: '48px', color: 'var(--md-bw-on-surface)', fontSize: '13px' }
