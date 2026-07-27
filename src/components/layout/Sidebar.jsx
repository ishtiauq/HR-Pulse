import TooltipPopover from '../TooltipPopover.jsx'

export default function Sidebar({
  visibleNavItems, isCollapsed, isDarkMode, currentView, setCurrentView,
  mobileMenuOpen, toggleSidebar, user, simulatedRole,
  showRoleModal, setShowRoleModal, handleLogout,
  setIsCollapsed, setSimulatedRole, setMobileMenuOpen
}) {
  return (
    <aside className={`macos-sidebar sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      width: isCollapsed ? '72px' : '260px',
      flexShrink: 0,
      position: 'relative',
      zIndex: 30,
      background: isDarkMode ? 'rgba(18, 18, 18, 0.55)' : 'rgba(248, 249, 250, 0.55)',
      backdropFilter: 'blur(12px) saturate(150%)',
      WebkitBackdropFilter: 'blur(12px) saturate(150%)',
      borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
      transition: 'width 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      overflow: 'visible'
    }}>
      
      {/* PROGRESSIVE BLUR HEADER */}
        <div className="sidebar-header-wrapper" style={{
          flexShrink: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          padding: isCollapsed ? '12px 8px' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}>
          {/* ANIMATED COLLAPSE TRIGGER BUTTON */}
          <TooltipPopover label="Expand Sidebar" isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button id="sidebar-toggle" className="collapse-btn" onClick={toggleSidebar} style={{
            width: isCollapsed ? '32px' : '100%',
            height: isCollapsed ? '32px' : '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '10px',
            padding: isCollapsed ? '0' : '10px 12px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            borderRadius: '8px',
            cursor: 'pointer',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
          }}>
            <span className="collapse-icon" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              flexShrink: 0,
              transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
              transform: isCollapsed ? 'rotate(180deg)' : 'none'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </span>
            {!isCollapsed && (
              <span className="btn-label" style={{
                font: "500 13px/20px 'Roboto'",
                whiteSpace: 'nowrap',
                opacity: 1,
                transition: 'opacity 0.2s ease'
              }}>Collapse Sidebar</span>
            )}
          </button>
          </TooltipPopover>
        </div>
      </div>

      {/* SCROLLABLE NAV AREA */}
      <nav className="sidebar-nav" style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: isCollapsed ? '76px 8px 250px 8px' : '76px 12px 250px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 1
      }}>
        {visibleNavItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <TooltipPopover key={item.id} label={item.label} isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
            <div className={`nav-item ${isActive ? 'active' : ''}`} data-active={isActive ? 'true' : 'false'} data-label={item.label} onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false) }} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
              height: '52px',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              position: 'relative',
              textDecoration: 'none',
            }}>
              {/* Icon container */}
              <div className="nav-icon" style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                {item.icon}
              </div>
              
              <span className="nav-label" style={{
                font: "500 13px/20px 'Roboto'",
                whiteSpace: 'nowrap',
                flex: 1,
                opacity: isCollapsed ? 0 : 1,
                transition: 'opacity 0.2s ease, width 0.3s ease',
                width: isCollapsed ? 0 : 'auto'
              }}>{item.label}</span>
            </div>
            </TooltipPopover>
          )
        })}
      </nav>

      {/* PROGRESSIVE BLUR FOOTER */}
      <div className="sidebar-footer-wrapper" style={{
        flexShrink: 0,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="sidebar-footer" style={{
          position: 'relative',
          zIndex: 2,
          padding: isCollapsed ? '12px 8px' : '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* GLASSMORPHISM USER PROFILE BOX */}
          <div className="user-profile-glass" data-label={user?.name || "Ishtiaq Rizve"} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '12px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: isDarkMode 
              ? '0 1px 2px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 2px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
          }}>
            <span style={{
              position: 'absolute',
              inset: 0,
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
              borderRadius: 'inherit',
              pointerEvents: 'none'
            }}></span>
            
            <img src={user?.avatar || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1,
              margin: '0 auto'
            }} alt="Avatar" />
            
            <div className="user-info" style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
              position: 'relative',
              zIndex: 1,
              opacity: isCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease, width 0.3s ease',
              width: isCollapsed ? 0 : 'auto'
            }}>
              <p style={{ font: "500 13px/16px 'Roboto'", color: 'var(--md-bw-on-surface)', margin: 0 }}>{user?.name || "Ishtiaq Rizve"}</p>
              <p style={{ font: "400 11px/14px 'Roboto'", color: 'var(--md-bw-on-surface-variant)', margin: '2px 0 0' }}>{user?.role || "HR Manager"}</p>
            </div>
          </div>

          {/* ROLE BUTTON */}
          <TooltipPopover label={`Role: ${simulatedRole}`} isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button className="role-btn btn-shine" data-active={showRoleModal ? "true" : "false"} data-label={`Role: ${simulatedRole}`} onClick={() => { if (isCollapsed) setIsCollapsed(false); setShowRoleModal(!showRoleModal); }} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            cursor: 'pointer',
            border: 'none',
            background: '#0062E6',
            width: '100%',
            height: '52px',
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              flexShrink: 0,
              transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="btn-label" style={{
              font: "500 13px/20px 'Roboto'",
              color: '#ffffff',
              whiteSpace: 'nowrap',
              opacity: isCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease, width 0.3s ease',
              width: isCollapsed ? 0 : 'auto'
            }}>Role: {simulatedRole}</span>
            
            {!isCollapsed && (
              <svg className="expand-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" style={{ 
                marginLeft: 'auto', flexShrink: 0, position: 'relative', zIndex: 1, 
                transform: showRoleModal ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease' 
              }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </button>
          </TooltipPopover>

          {/* Role Dropdown List Inline */}
          {!isCollapsed && showRoleModal && (
            <div className="macos-card" style={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(30px) saturate(200%)',
              WebkitBackdropFilter: 'blur(30px) saturate(200%)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '6px',
              gap: '2px',
              animation: 'slide-down 0.2s ease'
            }}>
              {['Admin', 'HR Manager', 'Payroll Manager', 'Employee'].map(r => (
                <button key={r} onClick={() => { setSimulatedRole(r); setShowRoleModal(false); }} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                  background: simulatedRole === r ? 'rgba(0,122,255,0.1)' : 'transparent', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', font: "500 12px 'Roboto'",
                  color: simulatedRole === r ? '#007aff' : 'var(--md-bw-on-surface-variant)', transition: 'background 0.2s ease'
                }}>
                  {r}
                </button>
              ))}
            </div>
          )}
          
          {/* LOGOUT BUTTON */}
          <TooltipPopover label="Log Out" isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button className="logout-btn btn-shine" data-label="Log Out" onClick={handleLogout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            cursor: 'pointer',
            border: 'none',
            background: '#E02014',
            width: '100%',
            height: '52px',
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              flexShrink: 0,
              transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <span className="btn-label" style={{
              font: "500 13px/20px 'Roboto'",
              color: '#ffffff',
              whiteSpace: 'nowrap',
              opacity: isCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease, width 0.3s ease',
              width: isCollapsed ? 0 : 'auto'
            }}>Log Out</span>
          </button>
          </TooltipPopover>
        </div>
      </div>
    </aside>
  )
}
