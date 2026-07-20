import { useState, useRef } from 'react'
import { Save, Settings as SettingsIcon, DollarSign, Sliders, Info, Percent, Building2, Bell, Globe, Mail, Plus, Trash2, Upload, Activity, X, ShieldCheck, List, FileSpreadsheet, Download, Receipt, CalendarClock } from 'lucide-react'
import { useModal } from '../services/useModal.js'
import AdSlot from './AdSlot.jsx'
import { formatDateTime } from '../services/date.js'

export default function Settings({ settings, setSettings, addLog, addToast, auditLogs, simulatedRole, syncConflicts, setSyncConflicts }) {
  const [activeSubmenu, setActiveSubmenu] = useState('payroll')

  // Audit Logs filtering
  const [auditFilterDate, setAuditFilterDate] = useState('')
  const [auditFilterAction, setAuditFilterAction] = useState('All')

  // Security tab states
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess-1', device: 'Chrome / Windows', location: 'New York, US', current: true, ip: '192.168.1.1', time: 'Active now' },
    { id: 'sess-2', device: 'Safari / iPhone 13', location: 'New York, US', current: false, ip: '192.168.1.5', time: 'Last active 2 hours ago' }
  ])

  // Payroll general states
  const [currency, setCurrency] = useState(settings.currency || '$')
  const [salaryStructure, setSalaryStructure] = useState(settings.salaryStructure || [])
  const [expensePolicies, setExpensePolicies] = useState(settings.expensePolicies || {
    Travel: 500, Meals: 50, 'Office Supplies': 100, Medical: 200, Other: 50
  })

  // Company profile states
  const [companyName, setCompanyName] = useState(settings.company?.name || 'HR Pulse Ltd.')
  const [companyEmail, setCompanyEmail] = useState(settings.company?.email || 'hr@hrpulse.io')
  const [companyWebsite, setCompanyWebsite] = useState(settings.company?.website || 'www.hrpulse.io')

  // Logo states
  const [logo, setLogo] = useState(settings.company?.logo || '')
  const [logoX, setLogoX] = useState(settings.company?.logoX || 0)
  const [logoY, setLogoY] = useState(settings.company?.logoY || 0)
  const [logoZoom, setLogoZoom] = useState(settings.company?.logoZoom || 1)
  
  const [showLogoModal, setShowLogoModal] = useState(false)
  useModal(() => setShowLogoModal(false))
  const [dragStart, setDragStart] = useState(null)
  const fileInputRef = useRef(null)

  // Notification states
  const [syncAlerts, setSyncAlerts] = useState(settings.notifications?.syncAlerts ?? true)
  const [emailDigests, setEmailDigests] = useState(settings.notifications?.emailDigests ?? false)

  // Roster & Shifts states
  const [shiftTemplates, setShiftTemplates] = useState(settings.shiftTemplates || [])
  const [overtimeRules, setOvertimeRules] = useState(settings.overtimeRules || { multiplierWeekday: 1.5, multiplierWeekend: 2.0 })

  const [isSaving, setIsSaving] = useState(false)

  // Calculations for split visualization
  const earningsSum = salaryStructure.filter(s => s.type === 'earning').reduce((a, c) => a + c.percentage, 0)
  const deductionsSum = salaryStructure.filter(s => s.type === 'deduction').reduce((a, c) => a + c.percentage, 0)
  const netPayPercent = earningsSum - deductionsSum

  const handleComponentChange = (id, field, value) => {
    setSalaryStructure(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleAddComponent = () => {
    const newId = `comp-${Date.now()}`
    const newComp = { id: newId, name: 'New Component', percentage: 5, type: 'earning' }
    setSalaryStructure(prev => [...prev, newComp])
  }

  const handleRemoveComponent = (id) => {
    setSalaryStructure(prev => prev.filter(item => item.id !== id))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      const updatedSettings = {
        ...settings,
        currency,
        salaryStructure,
        company: { 
          ...settings.company,
          name: companyName, 
          email: companyEmail, 
          website: companyWebsite,
          logo,
          logoX,
          logoY,
          logoZoom
        },
        expensePolicies,
        shiftTemplates,
        overtimeRules,
        notifications: { syncAlerts, emailDigests }
      }
      
      setSettings(updatedSettings)
      addLog('Settings Updated', 'Saved system settings and synced configurations with Google Drive', 'success')
      setIsSaving(false)
      if (addToast) {
        addToast("Settings saved successfully and synced to Google Drive!", "success")
      } else {
        // Fallback if addToast isn't directly passed or available
        addLog('Settings Saved', 'Settings saved successfully', 'success')
      }
    }, 1000)
  }

  const [showResetModal, setShowResetModal] = useState(false)
  useModal(() => setShowResetModal(false))
  const [sampleGross, setSampleGross] = useState(5000)
  const [hoveredComponentId, setHoveredComponentId] = useState(null)
  
  const totalComponents = earningsSum + deductionsSum
  const isOver100 = totalComponents > 100

  const resetToDefaults = () => {
    if (activeSubmenu === 'payroll') {
      setCurrency('$')
      setSalaryStructure([
        { id: 'basic', name: 'Basic Salary', percentage: 50, type: 'earning' },
        { id: 'hra', name: 'House Rent Allowance (HRA)', percentage: 25, type: 'earning' },
        { id: 'medical', name: 'Medical Allowance', percentage: 10, type: 'earning' },
        { id: 'conveyance', name: 'Conveyance Allowance', percentage: 10, type: 'earning' },
        { id: 'pf', name: 'Provident Fund (PF)', percentage: 5, type: 'deduction' }
      ])
    } else if (activeSubmenu === 'company') {
      setCompanyName('HR Pulse Ltd.')
      setCompanyEmail('hr@hrpulse.io')
      setCompanyWebsite('www.hrpulse.io')
      setLogo('')
      setLogoX(0)
      setLogoY(0)
      setLogoZoom(1)
    } else {
      setSyncAlerts(true)
      setEmailDigests(false)
    }
  }

  const getSegmentColor = (item, index) => {
    const colors = ['#121212', '#4A4A4A', '#7A7A7A', '#AAAAAA', '#DDDDDD']
    return colors[index % colors.length]
  }

  const getLineStyle = (index) => {
    const styles = ['solid', 'dashed', 'dotted']
    return styles[index % styles.length]
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result)
        setLogoX(0)
        setLogoY(0)
        setLogoZoom(1)
        setShowLogoModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handlePointerDown = (e) => {
    e.preventDefault()
    setDragStart({ x: e.clientX - logoX, y: e.clientY - logoY })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragStart) return
    setLogoX(e.clientX - dragStart.x)
    setLogoY(e.clientY - dragStart.y)
  }

  const handlePointerUp = (e) => {
    if (dragStart) {
      setDragStart(null)
    }
  }

  const handleRemoveLogo = () => {
    setLogo('')
    setLogoX(0)
    setLogoY(0)
    setLogoZoom(1)
    setShowLogoModal(false)
  }

  // Render Submenu Content Panel
  const renderSubmenuContent = () => {
    switch (activeSubmenu) {
      case 'payroll':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="m3-card m3-card-filled" style={{ padding: '24px' }}>
              <h4 className="title-large" style={{ margin: '0 0 8px 0', color: 'var(--md-bw-on-surface)' }}>
                Currency Setup
              </h4>
              <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)', margin: '0 0 24px 0' }}>
                Select the currency symbol applied globally across dashboards and receipts.
              </p>
              
              <div style={{ position: 'relative', width: '300px' }}>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
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
                  <option value="$">$ (USD)</option>
                  <option value="৳">৳ (BDT)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="¥">¥ (JPY)</option>
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--md-bw-on-surface-variant)' }}>▼</span>
              </div>
            </div>

            {/* Salary breakdown display */}
            <div className="m3-card m3-card-filled" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h4 className="title-large" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
                  Split Visualization
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Sample Gross:</label>
                  <input 
                    type="number" 
                    value={sampleGross} 
                    onChange={(e) => setSampleGross(Number(e.target.value))}
                    style={{
                      width: '100px', padding: '10px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)',
                      background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '14px', outline: 'none',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  />
                </div>
              </div>

              {salaryStructure.length === 0 ? (
                <span className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>No salary components configured.</span>
              ) : (
                <>
                  <div style={{
                    height: '24px',
                    width: '100%',
                    background: 'var(--md-bw-surface-variant)',
                    display: 'flex',
                    marginBottom: '24px'
                  }}>
                    {salaryStructure.map((item, index) => (
                      <div 
                        key={item.id}
                        onMouseEnter={() => setHoveredComponentId(item.id)}
                        onMouseLeave={() => setHoveredComponentId(null)}
                        style={{ 
                          width: `${item.percentage}%`, 
                          background: getSegmentColor(item, index),
                          height: '100%',
                          opacity: hoveredComponentId && hoveredComponentId !== item.id ? 0.4 : 1,
                          cursor: 'pointer',
                          transition: 'opacity 0ms'
                        }} 
                        title={`${item.name}: ${item.percentage}% (${currency}${(sampleGross * (item.percentage / 100)).toLocaleString()})`}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {salaryStructure.map((item, index) => (
                      <div 
                        key={item.id} 
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px',
                          background: hoveredComponentId === item.id ? 'var(--md-bw-surface-variant)' : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '24px', 
                            borderBottom: `2px ${getLineStyle(index)} var(--md-bw-on-surface)` 
                          }} />
                          <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{item.name} ({item.type})</span>
                        </div>
                        <span className="body-large" style={{ color: 'var(--md-bw-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                          {item.type === 'deduction' ? '-' : ''}{item.percentage}%
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--md-bw-outline)', paddingTop: '12px', marginTop: '12px' }}>
                      <span className="body-medium" style={{ color: 'var(--md-bw-on-surface)' }}>Net Earning ratio:</span>
                      <span className="body-large" style={{ color: 'var(--md-bw-on-surface)', fontVariantNumeric: 'tabular-nums' }}>{netPayPercent}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sliders Configuration */}
            <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="title-large" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
                  Components List
                </h4>
                <button 
                  onClick={handleAddComponent} 
                  className="btn btn-outlined" 
                  style={{ padding: '0 16px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={18} /> Add Item
                </button>
              </div>

              {isOver100 && (
                <div style={{ padding: '16px', background: 'var(--md-bw-surface-variant)', border: '1px solid var(--md-bw-outline)', color: 'var(--md-bw-on-surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Info size={20} />
                  <span className="body-medium">Component total exceeds 100%. Please adjust before saving.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {salaryStructure.map((item, index) => (
                  <div key={item.id} className="m3-card m3-card-elevated" style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {/* Name Input */}
                      <div className="m3-text-field outlined" style={{ flex: 1 }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="text" value={item.name} 
                            onChange={(e) => handleComponentChange(item.id, 'name', e.target.value)}
                            style={{
                              width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)',
                              background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Earning/Deduction toggle */}
                      <div style={{ position: 'relative', width: '150px' }}>
                        <select 
                          value={item.type} 
                          onChange={(e) => handleComponentChange(item.id, 'type', e.target.value)}
                          className="m3-select"
                          style={{
                            width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)',
                            background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none', cursor: 'pointer', appearance: 'none'
                          }}
                        >
                          <option value="earning" style={{ background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)' }}>Earning</option>
                          <option value="deduction" style={{ background: 'var(--md-bw-surface)', color: 'var(--md-bw-on-surface)' }}>Deduction</option>
                        </select>
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--md-bw-on-surface-variant)' }}>▼</span>
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleRemoveComponent(item.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--md-bw-on-surface-variant)', cursor: 'pointer', padding: '12px' }}
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>

                    {/* Percentage slider & input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', height: '24px' }}>
                        {/* Custom M3 Slider background track */}
                        <div style={{ position: 'absolute', width: '100%', height: '16px', background: 'var(--md-bw-surface-variant)', borderRadius: '8px' }} />
                        {/* Custom M3 Slider fill */}
                        <div style={{ position: 'absolute', width: `${item.percentage}%`, height: '16px', background: 'var(--md-bw-primary)', borderRadius: '8px 0 0 8px' }} />
                        <input 
                          type="range" min="0" max="100" value={item.percentage} 
                          onChange={(e) => handleComponentChange(item.id, 'percentage', Number(e.target.value))}
                          style={{ 
                            width: '100%', position: 'absolute', opacity: 0, cursor: 'pointer', height: '24px', zIndex: 10
                          }}
                        />
                        {/* Thumb indicator (purely visual over the invisible native range) */}
                        <div style={{ 
                          position: 'absolute', left: `calc(${item.percentage}% - 10px)`,
                          width: '20px', height: '20px', borderRadius: '50%', background: 'var(--md-bw-primary)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)', pointerEvents: 'none'
                        }} />
                      </div>
                      <div className="m3-text-field outlined" style={{ width: '80px' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="number" min="0" max="100" value={item.percentage} 
                            onChange={(e) => handleComponentChange(item.id, 'percentage', Number(e.target.value))}
                            style={{ 
                              width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', 
                              background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none', 
                              textAlign: 'center', fontVariantNumeric: 'tabular-nums' 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'company':
        return (
          <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--md-bw-on-surface)' }}>
              <Building2 size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              Company Profile Settings
            </h3>
            <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
              Manage public details regarding your enterprise. These details are used to brand generated documents like reports, receipts, and payslips.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {/* Brand Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Brand Logo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    onClick={() => {
                      if (logo) {
                        setShowLogoModal(true)
                      } else {
                        triggerFileInput()
                      }
                    }}
                    title={logo ? "Edit Custom Logo" : "Upload Custom Logo"}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'var(--md-bw-surface-variant)',
                      border: '1px solid var(--md-bw-outline)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {logo ? (
                      <img 
                        src={logo} 
                        alt="Logo" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transform: `scale(${logoZoom}) translate(${logoX}px, ${logoY}px)`,
                          transformOrigin: 'center'
                        }} 
                      />
                    ) : (
                      <Activity size={28} color="var(--md-bw-on-surface-variant)" />
                    )}
                  </div>
                  <div>
                    <button 
                      onClick={triggerFileInput}
                      className="btn btn-outlined" 
                      style={{ padding: '0 16px', height: '40px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Upload size={18} /> Upload New Logo
                    </button>
                    <p className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)', marginTop: '8px' }}>
                      Click on the logo to reposition or resize it.
                    </p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLogoUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Legal Entity Name</span>
                <div className="m3-text-field outlined">
                  <input 
                    type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    style={{
                      padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)',
                      background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none', width: '100%'
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>HR Support Email</span>
                <div className="m3-text-field outlined" style={{ position: 'relative' }}>
                  <input 
                    type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)}
                    style={{
                      padding: '16px 14px 16px 48px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)',
                      background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none', width: '100%'
                    }}
                  />
                  <Mail size={24} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-bw-on-surface-variant)' }} />
                </div>
              </div>

              {/* Website */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Company Website URL</span>
                <div className="m3-text-field outlined" style={{ position: 'relative' }}>
                  <input 
                    type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)}
                    style={{
                      padding: '16px 14px 16px 48px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)',
                      background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none', width: '100%'
                    }}
                  />
                  <Globe size={24} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-bw-on-surface-variant)' }} />
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--md-bw-on-surface)' }}>
              <Bell size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              Notification Preferences
            </h3>
            <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
              Enable alerts, sync logs alerts, or background notification parameters.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Sync Toggles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--md-bw-outline)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>Enable Real-time Sync Alerts</span>
                  <span className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Displays popups when files successfully sync with Google Drive.</span>
                </div>
                <input 
                  type="checkbox" checked={syncAlerts} onChange={(e) => setSyncAlerts(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--md-bw-primary)' }}
                />
              </div>

              {/* Email Digests */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>Email Monthly Payout Digest</span>
                  <span className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Sends a copy of the payroll statements to the HR support inbox.</span>
                </div>
                <input 
                  type="checkbox" checked={emailDigests} onChange={(e) => setEmailDigests(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--md-bw-primary)' }}
                />
              </div>
            </div>
          </div>
        )

      case 'expenses':
        return (
          <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--md-bw-on-surface)' }}>
              <Receipt size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              Expense Policies
            </h3>
            <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
              Set maximum reimbursement limits per category. Expenses exceeding these limits will be flagged for review in the approval queue.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.keys(expensePolicies).map(category => (
                <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>{category} Limit ($)</span>
                  <div className="m3-text-field outlined">
                    <input 
                      type="number"
                      value={expensePolicies[category]}
                      onChange={(e) => setExpensePolicies(prev => ({ ...prev, [category]: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'rosters':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--md-bw-on-surface)' }}>
                  <CalendarClock size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                  Shift Templates
                </h3>
                <button className="btn btn-outlined" onClick={() => {
                  const newTemplate = { id: `st-${Date.now()}`, name: 'New Shift', start: '09:00', end: '17:00', break: 60, color: '#333333' }
                  setShiftTemplates([...shiftTemplates, newTemplate])
                }}>
                  <Plus size={18} /> Add Shift
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {shiftTemplates.map((template) => (
                  <div key={template.id} className="m3-card m3-card-elevated" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1.5 }}>
                      <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Shift Name</span>
                      <div className="m3-text-field outlined">
                        <input type="text" value={template.name} onChange={(e) => {
                          setShiftTemplates(prev => prev.map(t => t.id === template.id ? { ...t, name: e.target.value } : t))
                        }} style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Start Time</span>
                      <div className="m3-text-field outlined">
                        <input type="time" value={template.start} onChange={(e) => {
                          setShiftTemplates(prev => prev.map(t => t.id === template.id ? { ...t, start: e.target.value } : t))
                        }} style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>End Time</span>
                      <div className="m3-text-field outlined">
                        <input type="time" value={template.end} onChange={(e) => {
                          setShiftTemplates(prev => prev.map(t => t.id === template.id ? { ...t, end: e.target.value } : t))
                        }} style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Break (min)</span>
                      <div className="m3-text-field outlined">
                        <input type="number" value={template.break} onChange={(e) => {
                          setShiftTemplates(prev => prev.map(t => t.id === template.id ? { ...t, break: parseInt(e.target.value) || 0 } : t))
                        }} style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', fontSize: '16px', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '60px' }}>
                      <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Color</span>
                      <input type="color" value={template.color} onChange={(e) => {
                        setShiftTemplates(prev => prev.map(t => t.id === template.id ? { ...t, color: e.target.value } : t))
                      }} style={{ padding: '0', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', width: '100%', height: '52px', cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end', height: '100%' }}>
                      <span className="label-small" style={{ textTransform: 'uppercase', color: 'transparent' }}>X</span>
                      <button className="btn btn-text" style={{ padding: '16px', color: 'var(--md-bw-on-surface-variant)' }} onClick={() => {
                        setShiftTemplates(prev => prev.filter(t => t.id !== template.id))
                      }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--md-bw-on-surface)' }}>
                <Activity size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                Overtime Rules
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Weekday Multiplier (e.g., 1.5x)</span>
                  <div className="m3-text-field outlined">
                    <input type="number" step="0.1" value={overtimeRules.multiplierWeekday} onChange={(e) => setOvertimeRules(prev => ({ ...prev, multiplierWeekday: parseFloat(e.target.value) || 1 }))} style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Weekend/Holiday Multiplier (e.g., 2.0x)</span>
                  <div className="m3-text-field outlined">
                    <input type="number" step="0.1" value={overtimeRules.multiplierWeekend} onChange={(e) => setOvertimeRules(prev => ({ ...prev, multiplierWeekend: parseFloat(e.target.value) || 1 }))} style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', outline: 'none' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'audit':
        const filteredAudit = (auditLogs || []).filter(l => {
          if (auditFilterAction !== 'All' && l.action !== auditFilterAction) return false
          if (auditFilterDate && !l.timestamp.startsWith(auditFilterDate)) return false
          return true
        })

        const handleExportCSV = () => {
          if (!filteredAudit.length) return
          const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP Address']
          const rows = filteredAudit.map(log => [
            formatDateTime(log.timestamp),
            log.user,
            log.action,
            log.entity,
            log.details,
            log.ip
          ].map(field => `"${field}"`).join(','))
          const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n')
          const encodedUri = encodeURI(csvContent)
          const link = document.createElement("a")
          link.setAttribute("href", encodedUri)
          link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          if (addToast) addToast("Audit logs exported to CSV", "success")
        }

        return (
          <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0', color: 'var(--md-bw-on-surface)' }}>
                  <List size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                  Audit Logs
                </h3>
                <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Review all system actions for compliance and security.</p>
              </div>
              <button onClick={handleExportCSV} className="btn btn-outlined" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} /> Export CSV
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', padding: '16px', background: 'var(--md-bw-surface-variant)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
                <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Date</span>
                <div className="m3-text-field outlined">
                  <input 
                    type="date" 
                    value={auditFilterDate} 
                    onChange={(e) => setAuditFilterDate(e.target.value)}
                    style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
                <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)' }}>Action Type</span>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={auditFilterAction} 
                    onChange={(e) => setAuditFilterAction(e.target.value)}
                    className="m3-select"
                    style={{ width: '100%', padding: '16px 14px', borderRadius: '4px', border: '1px solid var(--md-bw-outline)', background: 'transparent', color: 'var(--md-bw-on-surface)', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="All">All Actions</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--md-bw-on-surface-variant)' }}>▼</span>
                </div>
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <button onClick={() => { setAuditFilterDate(''); setAuditFilterAction('All'); }} className="btn btn-text" style={{ height: '56px' }}>
                  Clear
                </button>
              </div>
            </div>

            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--md-bw-outline)', borderRadius: '12px' }}>
              <table className="m3-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--md-bw-surface)' }}>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--md-bw-on-surface-variant)' }}>No logs found for selected filters.</td>
                    </tr>
                  ) : (
                    filteredAudit.map(log => (
                      <tr key={log.id}>
                        <td>{formatDateTime(log.timestamp)}</td>
                        <td style={{ fontWeight: 500 }}>{log.user}</td>
                        <td>
                          <div className={`m3-chip ${log.action === 'CREATE' ? 'solid' : log.action === 'UPDATE' ? 'outlined' : 'dashed'}`} style={{ display: 'inline-flex', padding: '0 8px', height: '24px', alignItems: 'center', justifyContent: 'center' }}>
                            {log.action}
                          </div>
                        </td>
                        <td>{log.entity}</td>
                        <td style={{ color: 'var(--md-bw-on-surface-variant)' }}>{log.details}</td>
                        <td style={{ color: 'var(--md-bw-on-surface-variant)' }}>{log.ip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      
      case 'sync':
        return (
          <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0', color: 'var(--md-bw-on-surface)' }}>
                <Activity size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                Sync Conflicts
              </h3>
              <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Review and resolve data conflicts between local and remote databases.</p>
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--md-bw-outline)', borderRadius: '12px' }}>
              <table className="m3-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Record ID</th>
                    <th>Local Value</th>
                    <th>Remote Value</th>
                    <th>Resolution</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!syncConflicts || syncConflicts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--md-bw-on-surface-variant)' }}>No sync conflicts detected.</td>
                    </tr>
                  ) : (
                    syncConflicts.map((conflict, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{conflict.file}</td>
                        <td>{conflict.recordId}</td>
                        <td style={{ color: 'var(--md-bw-on-surface-variant)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(conflict.localValue)}>
                          {JSON.stringify(conflict.localValue)}
                        </td>
                        <td style={{ color: 'var(--md-bw-on-surface-variant)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(conflict.remoteValue)}>
                          {JSON.stringify(conflict.remoteValue)}
                        </td>
                        <td style={{ color: 'var(--md-bw-on-surface-variant)' }}>{conflict.resolution}</td>
                        <td>
                          <button 
                            className="btn btn-outlined" 
                            style={{ height: '32px', padding: '0 12px', fontSize: '14px' }}
                            onClick={() => {
                              setSyncConflicts(prev => prev.filter((_, idx) => idx !== i))
                              if (addToast) addToast("Conflict acknowledged", "success")
                            }}
                          >
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
        )
      
      case 'security':
        return (
          <div className="m3-card m3-card-filled" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 className="title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0', color: 'var(--md-bw-on-surface)' }}>
                <ShieldCheck size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
                Session Management
              </h3>
              <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)', margin: 0 }}>Review devices currently logged into your account.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeSessions.map(sess => (
                <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--md-bw-surface-variant)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span className="body-large" style={{ fontWeight: 500, color: 'var(--md-bw-on-surface)' }}>{sess.device}</span>
                      {sess.current && (
                        <div className="m3-chip solid" style={{ height: '24px', padding: '0 8px' }}>This Device</div>
                      )}
                    </div>
                    <div className="body-medium" style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--md-bw-on-surface-variant)' }}>
                      <span>{sess.location}</span>
                      <span>•</span>
                      <span>{sess.time}</span>
                      <span>•</span>
                      <span>{sess.ip}</span>
                    </div>
                  </div>
                  {!sess.current && (
                    <button 
                      onClick={() => {
                        setActiveSessions(prev => prev.filter(s => s.id !== sess.id))
                        if (addToast) addToast("Session terminated", "success")
                      }}
                      className="btn btn-outlined" 
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              ))}
            </div>

            {activeSessions.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  className="btn btn-filled"
                  onClick={() => {
                    setActiveSessions(prev => prev.filter(s => s.current))
                    if (addToast) addToast("All other devices signed out", "success")
                  }}
                >
                  Sign out all other devices
                </button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
          System Settings
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-text" onClick={() => setShowResetModal(true)}>Reset Defaults</button>
          <button className="btn btn-filled" onClick={handleSave} disabled={isSaving || isOver100}>
            {isSaving ? <div className="skeleton" style={{width: 18, height: 18, borderRadius: '50%'}} /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Main Grid: Navigation Drawer Left, Content Right */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Submenu Navigation Drawer */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="label-small" style={{ textTransform: 'uppercase', color: 'var(--md-bw-on-surface-variant)', padding: '0 16px', marginBottom: '8px', display: 'block' }}>Categories</span>
          
          {[
            { id: 'payroll', icon: Sliders, label: 'Payroll Settings' },
            { id: 'company', icon: Building2, label: 'Company Profile' },
            { id: 'expenses', icon: Receipt, label: 'Expense Policies' },
            { id: 'rosters', icon: CalendarClock, label: 'Rosters & Shifts' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'audit', icon: List, label: 'Audit Logs' },
            { id: 'security', icon: ShieldCheck, label: 'Security' },
            { id: 'sync', icon: Activity, label: 'Sync Conflicts', badge: syncConflicts?.length }
          ].map(navItem => {
            const IconComponent = navItem.icon
            const isActive = activeSubmenu === navItem.id
            return (
              <button
                key={navItem.id}
                onClick={() => setActiveSubmenu(navItem.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  height: '56px',
                  padding: '0 16px',
                  borderRadius: '28px',
                  border: 'none',
                  fontSize: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: isActive ? 'var(--md-bw-secondary-container)' : 'transparent',
                  color: isActive ? 'var(--md-bw-on-secondary-container)' : 'var(--md-bw-on-surface-variant)',
                  fontWeight: 500,
                  outline: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <IconComponent size={24} style={{ color: isActive ? 'var(--md-bw-on-secondary-container)' : 'var(--md-bw-on-surface-variant)' }} />
                <span style={{ flex: 1 }}>{navItem.label}</span>
                {navItem.badge > 0 && (
                  <span style={{ background: 'var(--md-bw-on-surface)', color: 'var(--md-bw-surface)', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    {navItem.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right Content View */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {renderSubmenuContent()}
        </div>
      </div>

      {/* Ad slot */}
      <AdSlot type="horizontal" style={{ marginTop: '20px' }} />

      {/* Logo Settings Modal */}
      {showLogoModal && (
        <div className="modal-overlay" onClick={() => setShowLogoModal(false)}>
          <div className="modal-container" style={{ maxWidth: '400px', zIndex: 1000 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Brand Logo</h2>
              <button className="modal-close" onClick={() => setShowLogoModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', margin: 0 }}>
                Drag the image to reposition it, or use the slider below to zoom.
              </p>

              {/* Preview Area */}
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '24px',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(232, 93, 74, 0.25)',
              overflow: 'hidden',
              position: 'relative',
              cursor: dragStart ? 'grabbing' : 'grab',
              touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {logo ? (
              <img 
                src={logo} 
                alt="Logo Preview" 
                draggable="false"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: `scale(${logoZoom}) translate(${logoX}px, ${logoY}px)`,
                  transformOrigin: 'center',
                  pointerEvents: 'none'
                }} 
              />
            ) : (
              <Activity size={40} color="#ffffff" />
            )}
              </div>

              {/* Zoom Slider */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zoom</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.05" 
                  value={logoZoom}
                  onChange={(e) => setLogoZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button 
                  className="btn-outline" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={triggerFileInput}
                >
                  <Upload size={16} /> Replace
                </button>
                <button 
                  className="btn-outline" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  onClick={handleRemoveLogo}
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
              
              <button 
                className="btn-primary" 
                style={{ width: '100%' }}
                onClick={() => setShowLogoModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)} style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0 }}>
          <div className="m3-dialog" style={{ width: '400px', background: 'var(--md-bw-surface)', borderRadius: '28px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <h2 className="headline-small" style={{ margin: '0 0 16px 0', color: 'var(--md-bw-on-surface)' }}>Confirm Reset</h2>
            <p className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)', marginBottom: '24px' }}>
              Are you sure? This will reset all settings in the active tab to their default values.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-text" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button 
                className="btn btn-filled" 
                onClick={() => {
                  resetToDefaults()
                  setShowResetModal(false)
                  if (addToast) {
                    addToast('Settings reset to defaults', 'info')
                  }
                }}
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
