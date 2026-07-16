import { LayoutDashboard, Users, Database, Settings, Activity, LogOut, X, CreditCard, Calendar } from 'lucide-react'

export default function Sidebar({ currentView, setCurrentView, driveConnected, user, onLogout, mobileOpen, setMobileOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'attendance', label: 'Leaves & Attendance', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'drive', label: 'Google Drive Sync', icon: Database },
  ]

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
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-primary-glow)',
            flexShrink: 0
          }}>
            <Activity size={18} color="#ffffff" style={{
              animation: 'pulse 2s infinite'
            }} />
          </div>
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

        {/* Mobile Close Button */}
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
                  color: isActive ? 'var(--text-active-tab)' : 'var(--text-secondary)',
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
            <button 
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '6px',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-danger)'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

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
    </aside>
  )
}
