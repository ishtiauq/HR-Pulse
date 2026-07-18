import { LayoutDashboard, Users, Database, Settings, Activity, LogOut, X, CreditCard, Calendar, Upload, Trash2, Moon, Sun, HelpCircle, BarChart3, Receipt, Megaphone, Monitor } from 'lucide-react'
import { useState, useRef } from 'react'

export default function Sidebar({ currentView, setCurrentView, driveConnected, user, onLogout, mobileOpen, setMobileOpen, settings, setSettings, isDarkMode, setIsDarkMode, simulatedRole }) {
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const fileInputRef = useRef(null)

  const [dragStart, setDragStart] = useState(null)

  const logo = settings?.company?.logo || ''
  const logoX = settings?.company?.logoX || 0
  const logoY = settings?.company?.logoY || 0
  const logoZoom = settings?.company?.logoZoom || 1

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          company: {
            ...prev.company,
            logo: reader.result,
            logoX: 0,
            logoY: 0,
            logoZoom: 1
          }
        }))
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
    setSettings(prev => ({
      ...prev,
      company: {
        ...prev.company,
        logoX: e.clientX - dragStart.x,
        logoY: e.clientY - dragStart.y
      }
    }))
  }

  const handlePointerUp = (e) => {
    if (dragStart) {
      setDragStart(null)
    }
  }

  const handleRemoveLogo = () => {
    setSettings(prev => ({
      ...prev,
      company: {
        ...prev.company,
        logo: '',
        logoX: 0,
        logoY: 0,
        logoZoom: 1
      }
    }))
    setShowLogoModal(false)
  }

  const handleZoomChange = (e) => {
    const val = parseFloat(e.target.value)
    setSettings(prev => ({
      ...prev,
      company: {
        ...prev.company,
        logoZoom: val
      }
    }))
  }

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'attendance', label: 'Leaves & Attendance', icon: Calendar },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'assets', label: 'Assets', icon: Monitor },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'drive', label: 'Google Drive Sync', icon: Database },
  ]

  const menuItems = allMenuItems.filter(item => {
    if (simulatedRole === 'Admin') return true
    if (simulatedRole === 'Employee') {
      return ['dashboard', 'attendance', 'expenses'].includes(item.id)
    }
    if (simulatedRole === 'Payroll Manager') {
      return ['dashboard', 'employees', 'payroll', 'reports', 'expenses'].includes(item.id)
    }
    if (simulatedRole === 'HR Manager') {
      return ['dashboard', 'employees', 'attendance', 'payroll', 'reports', 'expenses'].includes(item.id)
    }
    return false
  })

  const handleMenuClick = (viewId) => {
    setCurrentView(viewId)
    if (setMobileOpen) {
      setMobileOpen(false) // Auto close mobile drawer
    }
  }

  return (
    <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Top Split Card: Brand Header */}
      <div className="sidebar-brand-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              width: '38px',
              height: '38px',
              borderRadius: '10px',
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
              <Activity size={18} color="#ffffff" style={{ animation: 'pulse 2s infinite' }} />
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLogoUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          <div>
            <h2 style={{
              fontSize: '1.2rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2
            }}>HR Pulse</h2>
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block'
            }}>Drive-based HRM</span>
          </div>
        </div>

        <button 
          onClick={() => setMobileOpen(false)}
          className="sidebar-close-btn"
        >
          <X size={18} />
        </button>
      </div>

      {/* Bottom Split Card: Menu & Footer Profile */}
      <div className="sidebar-menu-card">
        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={isActive ? 'active' : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isActive ? '0 6px 16px var(--accent-primary-glow)' : 'none',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div 
                  className="glossy-icon-container"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all var(--transition-fast)',
                    flexShrink: 0
                  }}
                >
                  <Icon size={16} className="glossy-svg" />
                </div>
                <span className="sidebar-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Connection Footer */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: driveConnected ? 'var(--accent-success)' : 'var(--accent-danger)',
            boxShadow: driveConnected ? '0 0 8px var(--accent-success)' : '0 0 8px var(--accent-danger)',
            animation: driveConnected ? 'pulseGlow 2.5s infinite' : 'none'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {driveConnected ? 'Drive Connected' : 'Drive Offline'}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              {driveConnected ? 'DB Synced' : 'Sync Paused'}
            </span>
          </div>
        </div>

        {/* User Profile Info Footer */}
        {user && (
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <img 
                src={user.avatar} 
                alt={user.name} 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent-primary)'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-primary)', 
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {user.name}
                </span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {user.role}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                title="Toggle Dark Mode"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <button 
                onClick={() => setShowCheatSheet(true)}
                title="Keyboard Shortcuts"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
              >
                <HelpCircle size={16} />
              </button>

              <button 
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-danger)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showCheatSheet && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Keyboard Shortcuts</h2>
              <button className="modal-close" onClick={() => setShowCheatSheet(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Command Palette</span>
                <kbd style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Ctrl + K</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Search / Quick Action</span>
                <kbd style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>/</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Go to Employees</span>
                <kbd style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>E</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Save current form</span>
                <kbd style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>S</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Close Modals</span>
                <kbd style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for keyframes */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* Logo Settings Modal */}
      {showLogoModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '400px' }}>
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
                  onChange={handleZoomChange}
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
    </aside>
  )
}
