import TooltipPopover from '../TooltipPopover.jsx'

export default function Sidebar({
  visibleNavItems, isCollapsed, isDarkMode, currentView, setCurrentView,
  mobileMenuOpen, toggleSidebar, user, simulatedRole,
  showRoleModal, setShowRoleModal, handleLogout,
  setIsCollapsed, setSimulatedRole, setMobileMenuOpen
}) {
  return (
    <aside aria-label="Sidebar navigation" className={`macos-sidebar sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''} flex flex-col h-full shrink-0 relative z-30 overflow-hidden`} style={{
      width: isCollapsed ? '84px' : '280px',
      background: isDarkMode ? 'rgba(18, 18, 18, 0.75)' : 'rgba(248, 249, 250, 0.75)',
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
      transition: 'width 0.35s cubic-bezier(0.32, 0.72, 0, 1)'
    }}>
      
      {/* HEADER SECTION (COLLAPSE TRIGGER) */}
      <div className="sidebar-header shrink-0 p-4 sm:p-5 pb-2 flex flex-col">
        <TooltipPopover label="Expand Sidebar" isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button id="sidebar-toggle" aria-label="Toggle sidebar" className="collapse-btn flex items-center rounded-2xl cursor-pointer shrink-0 relative overflow-hidden w-full h-[48px]" onClick={toggleSidebar} style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '14px',
            padding: isCollapsed ? '0' : '12px 16px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
          }}>
            <span className="collapse-icon flex items-center justify-center size-8 shrink-0" style={{
              transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
              transform: isCollapsed ? 'rotate(180deg)' : 'none'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </span>
            {!isCollapsed && (
              <span className="btn-label text-sm font-bold leading-5 whitespace-nowrap opacity-100 transition-opacity duration-200" style={{ color: 'var(--md-bw-on-surface)' }}>Collapse Sidebar</span>
            )}
          </button>
        </TooltipPopover>
      </div>

      {/* MIDDLE SCROLLABLE NAV AREA */}
      <nav aria-label="Main navigation" className="sidebar-nav flex-1 overflow-y-auto px-4 sm:px-5 py-3 flex flex-col gap-2">
        {visibleNavItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <TooltipPopover key={item.id} label={item.label} isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
              <div
                role="button"
                tabIndex={0}
                aria-label={item.label}
                className={`nav-item ${isActive ? 'active' : ''} flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer h-[50px] box-border transition-all duration-200 relative no-underline shrink-0 my-0.5`}
                data-active={isActive ? 'true' : 'false'}
                data-label={item.label}
                onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView(item.id); setMobileMenuOpen(false); }}}
              >
                {/* Icon container */}
                <div className="nav-icon size-8 w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all duration-200">
                  {item.icon}
                </div>
                
                <span className="nav-label text-sm sm:text-base font-bold leading-5 whitespace-nowrap flex-1" style={{
                  opacity: isCollapsed ? 0 : 1,
                  transition: 'opacity 0.2s ease, width 0.3s ease',
                  width: isCollapsed ? 0 : 'auto'
                }}>{item.label}</span>
              </div>
            </TooltipPopover>
          )
        })}
      </nav>

      {/* FOOTER SECTION (PROFILE + ROLE + LOGOUT) */}
      <div className="sidebar-footer shrink-0 p-4 sm:p-5 pt-3 flex flex-col gap-3 border-t border-[rgba(0,0,0,0.06)] bg-[rgba(255,255,255,0.4)] backdrop-blur-md">
        
        {/* USER PROFILE BOX */}
        <div className="user-profile-glass flex items-center gap-3.5 px-4 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-200" data-label={user?.name || "Ishtiaq Rizve"} style={{
          background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <img src={user?.avatar || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} className="rounded-full object-cover shrink-0 relative" style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            zIndex: 1
          }} alt={user?.name ? `${user.name}'s avatar` : "User avatar"} />
          
          <div className="user-info overflow-hidden whitespace-nowrap flex-1 min-w-0 relative" style={{
            zIndex: 1,
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 0.2s ease, width 0.3s ease',
            width: isCollapsed ? 0 : 'auto'
          }}>
            <p className="text-sm sm:text-base font-extrabold leading-5 m-0" style={{ color: 'var(--md-bw-on-surface)' }}>{user?.name || "Ishtiaq Rizve"}</p>
            <p className="text-xs sm:text-sm font-semibold leading-[16px] mt-1" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{user?.role || "HR Manager"}</p>
          </div>
        </div>

        {/* ROLE BUTTON */}
        <TooltipPopover label={`Role: ${simulatedRole}`} isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button aria-label={isCollapsed ? `Role: ${simulatedRole}` : undefined} className="role-btn btn-shine flex items-center gap-3.5 px-4 py-3.5 rounded-2xl cursor-pointer border-0 w-full h-[52px] box-border transition-all duration-300 relative overflow-hidden" data-active={showRoleModal ? "true" : "false"} data-label={`Role: ${simulatedRole}`} onClick={() => { if (isCollapsed) setIsCollapsed(false); setShowRoleModal(!showRoleModal); }} style={{
            background: '#0062E6',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <div className="size-9 w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all duration-300 bg-white/20 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="btn-label text-sm sm:text-base font-extrabold leading-5 text-white whitespace-nowrap" style={{
              opacity: isCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease, width 0.3s ease',
              width: isCollapsed ? 0 : 'auto'
            }}>Role: {simulatedRole}</span>
            
            {!isCollapsed && (
              <svg className="expand-icon ml-auto shrink-0 relative" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" style={{ 
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
          <div role="listbox" aria-label="Select role" className="macos-card rounded-2xl overflow-hidden flex flex-col p-2 gap-1" style={{
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(30px) saturate(200%)',
            WebkitBackdropFilter: 'blur(30px) saturate(200%)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            animation: 'slide-down 0.2s ease'
          }}>
            {['Admin', 'HR Manager', 'Payroll Manager', 'Employee'].map(r => (
              <button key={r} role="option" aria-selected={simulatedRole === r} onClick={() => { setSimulatedRole(r); setShowRoleModal(false); }} className="block w-full text-left px-4 py-2.5 border-0 rounded-xl cursor-pointer text-xs sm:text-sm font-bold transition-colors duration-200" style={{
                background: simulatedRole === r ? 'rgba(0,122,255,0.12)' : 'transparent',
                color: simulatedRole === r ? '#007aff' : 'var(--md-bw-on-surface-variant)'
              }}>
                {r}
              </button>
            ))}
          </div>
        )}

        {/* LOGOUT BUTTON */}
        {!isCollapsed && (
          <button aria-label="Logout" className="logout-btn flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer border-0 w-full transition-all duration-200 text-xs sm:text-sm font-bold" onClick={handleLogout} style={{
            background: isDarkMode ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 59, 48, 0.08)',
            color: '#FF3B30',
            border: '1px solid rgba(255, 59, 48, 0.2)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  )
}
