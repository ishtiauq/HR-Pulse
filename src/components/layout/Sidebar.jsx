import TooltipPopover from '../TooltipPopover.jsx'

export default function Sidebar({
  visibleNavItems, isCollapsed, isDarkMode, currentView, setCurrentView,
  mobileMenuOpen, toggleSidebar, user, simulatedRole,
  showRoleModal, setShowRoleModal, handleLogout,
  setIsCollapsed, setSimulatedRole, setMobileMenuOpen
}) {
  return (
    <aside aria-label="Sidebar navigation" className={`macos-sidebar sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''} flex flex-col shrink-0 relative z-30 overflow-visible`} style={{
      width: isCollapsed ? '72px' : '260px',
      background: isDarkMode ? 'rgba(18, 18, 18, 0.55)' : 'rgba(248, 249, 250, 0.55)',
      backdropFilter: 'blur(12px) saturate(150%)',
      WebkitBackdropFilter: 'blur(12px) saturate(150%)',
      borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
      transition: 'width 0.35s cubic-bezier(0.32, 0.72, 0, 1)'
    }}>
      
      {/* PROGRESSIVE BLUR HEADER */}
          <div className="sidebar-header-wrapper shrink-0 absolute top-0 inset-x-0 z-20 flex flex-col">
          <div className="relative w-full flex items-center gap-3 py-3 px-4" style={{
          zIndex: 2,
          padding: isCollapsed ? '12px 8px' : '12px 16px',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}>
          {/* ANIMATED COLLAPSE TRIGGER BUTTON */}
          <TooltipPopover label="Expand Sidebar" isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button id="sidebar-toggle" aria-label="Toggle sidebar" className="collapse-btn flex items-center rounded-lg cursor-pointer shrink-0 relative overflow-hidden" onClick={toggleSidebar} style={{
            width: isCollapsed ? '32px' : '100%',
            height: isCollapsed ? '32px' : '44px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '10px',
            padding: isCollapsed ? '0' : '10px 12px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
          }}>
            <span className="collapse-icon flex items-center justify-center size-8 shrink-0" style={{
              transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
              transform: isCollapsed ? 'rotate(180deg)' : 'none'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </span>
            {!isCollapsed && (
              <span className="btn-label text-sm font-medium leading-5 whitespace-nowrap opacity-100 transition-opacity duration-200">Collapse Sidebar</span>
            )}
          </button>
          </TooltipPopover>
        </div>
      </div>

      {/* SCROLLABLE NAV AREA */}
      <nav aria-label="Main navigation" className="sidebar-nav absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col gap-2.5 z-10" style={{
        padding: isCollapsed ? '76px 8px 250px 8px' : '76px 12px 250px 12px'
      }}>
        {visibleNavItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <TooltipPopover key={item.id} label={item.label} isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
            <div role="button" tabIndex={0} aria-label={item.label} className={`nav-item ${isActive ? 'active' : ''} flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer h-[52px] box-border transition-all duration-200 relative no-underline`} data-active={isActive ? 'true' : 'false'} data-label={item.label} onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false) }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView(item.id); setMobileMenuOpen(false); }}}>
              {/* Icon container */}
              <div className="nav-icon size-8 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200">
                {item.icon}
              </div>
              
              <span className="nav-label text-sm font-medium leading-5 whitespace-nowrap flex-1" style={{
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
      <div className="sidebar-footer-wrapper shrink-0 absolute bottom-0 inset-x-0 z-20 flex flex-col">
        <div className="sidebar-footer relative flex flex-col gap-2" style={{
          zIndex: 2,
          padding: isCollapsed ? '12px 8px' : '12px'
        }}>
          {/* GLASSMORPHISM USER PROFILE BOX */}
          <div className="user-profile-glass flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer relative overflow-hidden transition-all duration-200" data-label={user?.name || "Ishtiaq Rizve"} style={{
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: isDarkMode 
              ? '0 1px 2px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 1px 2px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
          }}>
            <span className="absolute inset-0 pointer-events-none" style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
              borderRadius: 'inherit'
            }}></span>
            
            <img src={user?.avatar || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} className="rounded-full object-cover shrink-0 relative" style={{
              width: '34px',
              height: '34px',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              zIndex: 1,
              margin: '0 auto'
            }} alt={user?.name ? `${user.name}'s avatar` : "User avatar"} />
            
            <div className="user-info overflow-hidden whitespace-nowrap flex-1 min-w-0 relative" style={{
              zIndex: 1,
              opacity: isCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease, width 0.3s ease',
              width: isCollapsed ? 0 : 'auto'
            }}>
              <p className="text-sm font-medium leading-4 m-0" style={{ color: 'var(--md-bw-on-surface)' }}>{user?.name || "Ishtiaq Rizve"}</p>
              <p className="text-xs font-normal leading-[14px] mt-0.5" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{user?.role || "HR Manager"}</p>
            </div>
          </div>

          {/* ROLE BUTTON */}
          <TooltipPopover label={`Role: ${simulatedRole}`} isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button aria-label={isCollapsed ? `Role: ${simulatedRole}` : undefined} className="role-btn btn-shine flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer border-0 w-full h-[52px] box-border transition-all duration-300 relative overflow-hidden" data-active={showRoleModal ? "true" : "false"} data-label={`Role: ${simulatedRole}`} onClick={() => { if (isCollapsed) setIsCollapsed(false); setShowRoleModal(!showRoleModal); }} style={{
            background: '#0062E6',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <div className="size-8 flex items-center justify-center rounded-lg shrink-0 transition-all duration-300 bg-white/20 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="btn-label text-sm font-medium leading-5 text-white whitespace-nowrap" style={{
              opacity: isCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease, width 0.3s ease',
              width: isCollapsed ? 0 : 'auto'
            }}>Role: {simulatedRole}</span>
            
            {!isCollapsed && (
              <svg className="expand-icon ml-auto shrink-0 relative" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" style={{ 
                zIndex: 1,
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
            <div role="listbox" aria-label="Select role" className="macos-card rounded-xl overflow-hidden flex flex-col p-1.5 gap-0.5" style={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(30px) saturate(200%)',
              WebkitBackdropFilter: 'blur(30px) saturate(200%)',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              animation: 'slide-down 0.2s ease'
            }}>
              {['Admin', 'HR Manager', 'Payroll Manager', 'Employee'].map(r => (
                <button key={r} role="option" aria-selected={simulatedRole === r} onClick={() => { setSimulatedRole(r); setShowRoleModal(false); }} className="block w-full text-left px-3 py-2 border-0 rounded-md cursor-pointer text-xs font-medium transition-colors duration-200" style={{
                  background: simulatedRole === r ? 'rgba(0,122,255,0.1)' : 'transparent',
                  color: simulatedRole === r ? '#007aff' : 'var(--md-bw-on-surface-variant)'
                }}>
                  {r}
                </button>
              ))}
            </div>
          )}
          
          {/* LOGOUT BUTTON */}
          <TooltipPopover label="Log Out" isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button aria-label="Log out" className="logout-btn btn-shine flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer border-0 w-full h-[52px] box-border transition-all duration-300 relative overflow-hidden" data-label="Log Out" onClick={handleLogout} style={{
            background: '#E02014',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <div className="size-8 flex items-center justify-center rounded-lg shrink-0 transition-all duration-300 bg-white/20 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <span className="btn-label text-sm font-medium leading-5 text-white whitespace-nowrap" style={{
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
