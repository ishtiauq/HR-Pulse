import { useState, useRef } from 'react'
import { Save, DollarSign, Sliders, Info, Percent, Building2, Bell, Globe, Mail, Plus, Trash2, Upload, Activity, X } from 'lucide-react'
import AdSlot from './AdSlot.jsx'

export default function Settings({ settings, setSettings, addLog }) {
  const [activeSubmenu, setActiveSubmenu] = useState('payroll')

  // Payroll general states
  const [currency, setCurrency] = useState(settings.currency || '$')
  const [salaryStructure, setSalaryStructure] = useState(settings.salaryStructure || [])

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
  const [dragStart, setDragStart] = useState(null)
  const fileInputRef = useRef(null)

  // Notification states
  const [syncAlerts, setSyncAlerts] = useState(settings.notifications?.syncAlerts ?? true)
  const [emailDigests, setEmailDigests] = useState(settings.notifications?.emailDigests ?? false)

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
        notifications: { syncAlerts, emailDigests }
      }
      
      setSettings(updatedSettings)
      addLog('Settings Updated', 'Saved system settings and synced configurations with Google Drive', 'success')
      setIsSaving(false)
      alert("Settings saved successfully and synced to Google Drive!")
    }, 1000)
  }

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
    if (item.type === 'deduction') return 'var(--accent-danger)'
    const colors = ['var(--accent-primary)', 'var(--accent-success)', 'var(--accent-info)', 'var(--accent-warning)', '#ec4899', '#8b5cf6']
    return colors[index % colors.length]
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="responsive-inner-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Currency Config */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} style={{ color: 'var(--accent-primary)' }} />
                    Currency Setup
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                    Select the currency symbol applied globally across dashboards and receipts.
                  </p>
                  
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <option value="$">$ (USD)</option>
                    <option value="৳">৳ (BDT)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="₹">₹ (INR)</option>
                    <option value="¥">¥ (JPY)</option>
                  </select>
                </div>

                {/* Salary breakdown display */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Percent size={16} style={{ color: 'var(--accent-success)' }} />
                    Split Visualization
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Gross salary distribution preview.
                  </p>

                  {salaryStructure.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No salary components configured.</span>
                  ) : (
                    <>
                      <div style={{
                        height: '20px',
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        display: 'flex',
                        marginBottom: '16px'
                      }}>
                        {salaryStructure.map((item, index) => (
                          <div 
                            key={item.id}
                            style={{ 
                              width: `${item.percentage}%`, 
                              background: getSegmentColor(item, index),
                              height: '100%'
                            }} 
                            title={`${item.name}: ${item.percentage}%`}
                          />
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                        {salaryStructure.map((item, index) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getSegmentColor(item, index) }} />
                              <span style={{ color: 'var(--text-secondary)' }}>{item.name} ({item.type})</span>
                            </div>
                            <span style={{ fontWeight: 600, color: item.type === 'deduction' ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                              {item.type === 'deduction' ? '-' : ''}{item.percentage}%
                            </span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Net Earning ratio:</span>
                          <span style={{ color: 'var(--accent-success)' }}>{netPayPercent}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sliders Configuration */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={16} style={{ color: 'var(--accent-primary)' }} />
                    Components List
                  </h4>
                  <button 
                    onClick={handleAddComponent} 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {salaryStructure.map((item, index) => (
                    <div key={item.id} style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* Name Input */}
                        <input 
                          type="text" value={item.name} 
                          onChange={(e) => handleComponentChange(item.id, 'name', e.target.value)}
                          style={{
                            flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none'
                          }}
                        />
                        {/* Earning/Deduction toggle */}
                        <select 
                          value={item.type} 
                          onChange={(e) => handleComponentChange(item.id, 'type', e.target.value)}
                          style={{
                            padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', cursor: 'pointer'
                          }}
                        >
                          <option value="earning">Earning</option>
                          <option value="deduction">Deduction</option>
                        </select>
                        {/* Delete Button */}
                        <button 
                          onClick={() => handleRemoveComponent(item.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Percentage slider */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                          type="range" min="0" max="100" value={item.percentage} 
                          onChange={(e) => handleComponentChange(item.id, 'percentage', Number(e.target.value))}
                          style={{ flex: 1, cursor: 'pointer', accentColor: getSegmentColor(item, index) }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '40px', textAlign: 'right' }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'company':
        return (
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: 'var(--accent-primary)' }} />
              Company Profile Settings
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Manage public details regarding your enterprise. These details are used to brand generated documents like reports, receipts, and payslips.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {/* Brand Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Brand Logo</label>
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
                      background: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px var(--accent-primary-glow)',
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
                      <Activity size={28} color="#ffffff" style={{ animation: 'pulse 2s infinite' }} />
                    )}
                  </div>
                  <div>
                    <button 
                      onClick={triggerFileInput}
                      className="btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> Upload New Logo
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Legal Entity Name</label>
                <input 
                  type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>HR Support Email</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)}
                    style={{
                      padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', width: '100%'
                    }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Website */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Company Website URL</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)}
                    style={{
                      padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', width: '100%'
                    }}
                  />
                  <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
              Notification Preferences
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Enable alerts, sync logs alerts, or background notification parameters.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sync Toggles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Enable Real-time Sync Alerts</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Displays popups when files successfully sync with Google Drive.</span>
                </div>
                <input 
                  type="checkbox" checked={syncAlerts} onChange={(e) => setSyncAlerts(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              {/* Email Digests */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Email Monthly Payout Digest</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sends a copy of the payroll statements to the HR support inbox.</span>
                </div>
                <input 
                  type="checkbox" checked={emailDigests} onChange={(e) => setEmailDigests(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>
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
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px', fontWeight: 700 }}>System Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configure structural settings, company profiles, and system behaviors.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={resetToDefaults}>Reset Defaults</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Navigation Submenu, Right Active Form */}
      <div className="responsive-settings-grid">
        {/* Left Submenu Navigation Panel */}
        <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Payroll Configuration Submenu */}
          <button
            onClick={() => setActiveSubmenu('payroll')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              textAlign: 'left',
              cursor: 'pointer',
              background: activeSubmenu === 'payroll' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeSubmenu === 'payroll' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              transition: 'all var(--transition-fast)'
            }}
          >
            <Sliders size={16} style={{ color: activeSubmenu === 'payroll' ? 'var(--accent-primary)' : 'inherit' }} />
            Payroll Settings
          </button>

          {/* Company Profile Submenu */}
          <button
            onClick={() => setActiveSubmenu('company')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              textAlign: 'left',
              cursor: 'pointer',
              background: activeSubmenu === 'company' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeSubmenu === 'company' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              transition: 'all var(--transition-fast)'
            }}
          >
            <Building2 size={16} style={{ color: activeSubmenu === 'company' ? 'var(--accent-primary)' : 'inherit' }} />
            Company Profile
          </button>

          {/* Notifications Submenu */}
          <button
            onClick={() => setActiveSubmenu('notifications')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              textAlign: 'left',
              cursor: 'pointer',
              background: activeSubmenu === 'notifications' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeSubmenu === 'notifications' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              transition: 'all var(--transition-fast)'
            }}
          >
            <Bell size={16} style={{ color: activeSubmenu === 'notifications' ? 'var(--accent-primary)' : 'inherit' }} />
            Notifications
          </button>
        </div>

        {/* Right Content View */}
        <div style={{ minWidth: 0 }}>
          {renderSubmenuContent()}
        </div>
      </div>

      {/* Ad slot */}
      <AdSlot type="horizontal" style={{ marginTop: '20px' }} />

      {/* Logo Settings Modal */}
      {showLogoModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '400px', zIndex: 1000 }}>
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
                  boxShadow: '0 8px 24px var(--accent-primary-glow)',
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
                  <Activity size={40} color="#ffffff" style={{ animation: 'pulse 2s infinite' }} />
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
    </div>
  )
}
