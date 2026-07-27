import TooltipPopover from '../TooltipPopover.jsx'

export default function Sidebar({
  visibleNavItems, isCollapsed, isDarkMode, currentView, setCurrentView,
  mobileMenuOpen, toggleSidebar, user, simulatedRole,
  showRoleModal, setShowRoleModal, handleLogout,
  setIsCollapsed, setSimulatedRole, setMobileMenuOpen
}) {
  return (
    <aside aria-label="Sidebar navigation" className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''} flex flex-col h-full shrink-0 relative z-30 overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300`} style={{
      width: isCollapsed ? '84px' : '280px'
    }}>
      
      {/* HEADER SECTION (COLLAPSE TRIGGER) */}
      <div className="sidebar-header shrink-0 p-4 pb-2 flex flex-col">
        <TooltipPopover label="Expand Sidebar" isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
          <button id="sidebar-toggle" aria-label="Toggle sidebar" className="collapse-btn flex items-center rounded-xl cursor-pointer shrink-0 relative overflow-hidden w-full h-11 bg-sidebar-accent/50 text-sidebar-foreground border border-sidebar-border hover:bg-sidebar-accent transition-all px-3.5" onClick={toggleSidebar} style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '12px'
          }}>
            <span className="collapse-icon flex items-center justify-center size-7 shrink-0 transition-transform duration-300" style={{
              transform: isCollapsed ? 'rotate(180deg)' : 'none'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </span>
            {!isCollapsed && (
              <span className="btn-label text-xs font-bold leading-5 whitespace-nowrap tracking-tight">Collapse Sidebar</span>
            )}
          </button>
        </TooltipPopover>
      </div>

      {/* MIDDLE SCROLLABLE NAV AREA */}
      <nav aria-label="Main navigation" className="sidebar-nav flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-1.5">
        {visibleNavItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <TooltipPopover key={item.id} label={item.label} isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
              <div
                role="button"
                tabIndex={0}
                aria-label={item.label}
                className={`nav-item ${isActive ? 'active bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer h-11 box-border transition-all duration-200 relative no-underline shrink-0 my-0.5`}
                data-active={isActive ? 'true' : 'false'}
                data-label={item.label}
                onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView(item.id); setMobileMenuOpen(false); }}}
              >
                {/* Icon container */}
                <div className="nav-icon size-7 w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200">
                  {item.icon}
                </div>
                
                <span className="nav-label text-xs font-semibold leading-5 whitespace-nowrap flex-1" style={{
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
      <div className="sidebar-footer shrink-0 p-4 pt-3 flex flex-col gap-2.5 border-t border-sidebar-border bg-sidebar/80 backdrop-blur-md">
        
        {/* USER PROFILE BOX */}
        <div className="user-profile-glass flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-sidebar-accent/40 border border-sidebar-border relative overflow-hidden transition-all" data-label={user?.name || "Ishtiaq Rizve"}>
          <img src={user?.avatar || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} className="rounded-full object-cover shrink-0 relative w-9 h-9 border border-sidebar-border" alt={user?.name ? `${user.name}'s avatar` : "User avatar"} />
          
          <div className="user-info overflow-hidden whitespace-nowrap flex-1 min-w-0 relative" style={{
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 0.2s ease, width 0.3s ease',
            width: isCollapsed ? 0 : 'auto'
          }}>
            <p className="user-name text-xs font-extrabold m-0 text-sidebar-foreground truncate">{user?.name || "Ishtiaq Rizve"}</p>
            <p className="user-role text-[11px] font-semibold m-0 text-sidebar-foreground/70 truncate">{user?.role || "HR Administrator"}</p>
          </div>
        </div>

                {/* ROLE SIMULATION SELECTION TRIGGER */}
        {!isCollapsed && (
          <div className="role-selector-box flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sidebar-foreground/60 px-1">Simulated Role</span>
            <button
              onClick={() => setShowRoleModal && setShowRoleModal(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-sidebar-accent/60 border border-sidebar-border text-sidebar-foreground text-xs font-semibold hover:bg-sidebar-accent transition-all cursor-pointer"
            >
              <span className="truncate">{simulatedRole || "Admin"}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-md shrink-0">Switch</span>
            </button>
          </div>
        )}

        {/* LOGOUT BUTTON */}
        {!isCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 text-xs font-bold transition-all cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout Account
          </button>
        )}
      </div>
    </aside>
  )
}
