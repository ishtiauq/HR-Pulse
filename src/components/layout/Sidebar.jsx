import TooltipPopover from '../TooltipPopover.jsx'
import { X } from 'lucide-react'

export default function Sidebar({
  visibleNavItems, isCollapsed, isDarkMode, currentView, setCurrentView,
  mobileMenuOpen, toggleSidebar, user, simulatedRole,
  showRoleModal, setShowRoleModal, handleLogout,
  setIsCollapsed, setSimulatedRole, setMobileMenuOpen
}) {
  return (
    <>
      {/* Mobile fullscreen overlay backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      <aside 
        aria-label="Sidebar navigation" 
        className={`
          flex flex-col h-full shrink-0 relative z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border
          transition-all duration-300 ease-in-out overflow-hidden
          ${mobileMenuOpen 
            ? 'fixed inset-0 w-full max-w-full border-r-0' 
            : 'hidden lg:flex'}
        `}
        style={{
          width: mobileMenuOpen ? '100%' : (isCollapsed ? '64px' : '220px'),
        }}
      >
      
        {/* HEADER SECTION */}
        <div className="shrink-0 p-3 pb-2 flex flex-col">
          {/* Mobile: close button row */}
          {mobileMenuOpen && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-bold text-sidebar-foreground/80">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="size-9 flex items-center justify-center rounded-xl bg-sidebar-accent/50 text-sidebar-foreground border border-sidebar-border hover:bg-sidebar-accent transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Desktop: collapse toggle */}
          {!mobileMenuOpen && (
            <TooltipPopover label="Expand Sidebar" isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
              <button 
                id="sidebar-toggle" 
                aria-label="Toggle sidebar" 
                className="collapse-btn flex items-center rounded-xl cursor-pointer shrink-0 relative overflow-hidden w-full h-10 bg-sidebar-accent/50 text-sidebar-foreground border border-sidebar-border hover:bg-sidebar-accent transition-all duration-200 px-3"
                onClick={toggleSidebar} 
                style={{
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0' : '10px'
                }}
              >
                <span className="flex items-center justify-center size-5 shrink-0 transition-transform duration-300" style={{
                  transform: isCollapsed ? 'rotate(180deg)' : 'none'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </span>
                <span className="text-xs font-bold leading-5 whitespace-nowrap tracking-tight transition-[opacity,max-width] duration-300 overflow-hidden" style={{
                  opacity: isCollapsed ? 0 : 1,
                  maxWidth: isCollapsed ? 0 : '150px'
                }}>Collapse</span>
              </button>
            </TooltipPopover>
          )}
        </div>

        {/* MIDDLE SCROLLABLE NAV AREA */}
        <nav 
          aria-label="Main navigation" 
          className="sidebar-nav-scroll flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1"
        >
          {visibleNavItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <TooltipPopover key={item.id} label={item.label} isCollapsed={isCollapsed && !mobileMenuOpen} isDarkMode={isDarkMode}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={item.label}
                  className={`${isActive ? 'active bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer h-10 box-border transition-all duration-200 relative no-underline shrink-0`}
                  data-active={isActive ? 'true' : 'false'}
                  data-label={item.label}
                  onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView(item.id); setMobileMenuOpen(false); }}}
                >
                  {/* Icon */}
                  <div className="size-6 flex items-center justify-center rounded-lg shrink-0">
                    {item.icon}
                  </div>
                  
                  {/* Label: always visible on mobile, animated on desktop */}
                  <span className="text-xs font-semibold leading-5 whitespace-nowrap transition-[opacity,max-width] duration-300 overflow-hidden" style={{
                    opacity: (mobileMenuOpen || !isCollapsed) ? 1 : 0,
                    maxWidth: (mobileMenuOpen || !isCollapsed) ? '160px' : 0,
                  }}>{item.label}</span>
                </div>
              </TooltipPopover>
            )
          })}
        </nav>

        {/* FOOTER SECTION */}
        <div className="shrink-0 p-3 pt-2 flex flex-col gap-2 border-t border-sidebar-border bg-sidebar/80">
          
          {/* USER PROFILE BOX */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sidebar-accent/40 border border-sidebar-border relative overflow-hidden transition-all">
            <img 
              src={user?.avatar || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} 
              className="rounded-full object-cover shrink-0 relative w-8 h-8 border border-sidebar-border" 
              alt={user?.name ? `${user.name}'s avatar` : "User avatar"} 
            />
            
            <div className="overflow-hidden whitespace-nowrap flex-1 min-w-0 relative transition-[opacity,max-width] duration-300" style={{
              opacity: (mobileMenuOpen || !isCollapsed) ? 1 : 0,
              maxWidth: (mobileMenuOpen || !isCollapsed) ? '160px' : 0,
            }}>
              <p className="text-xs font-extrabold m-0 text-sidebar-foreground truncate">{user?.name || "Ishtiaq Rizve"}</p>
              <p className="text-[10px] font-semibold m-0 text-sidebar-foreground/70 truncate">{user?.role || "HR Administrator"}</p>
            </div>
          </div>

          {/* ROLE SIMULATION */}
          {(mobileMenuOpen || !isCollapsed) && (
            <div className="flex flex-col gap-1 animate-fade-in">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sidebar-foreground/60 px-1">Simulated Role</span>
              <button
                onClick={() => setShowRoleModal && setShowRoleModal(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-sidebar-accent/60 border border-sidebar-border text-sidebar-foreground text-xs font-semibold hover:bg-sidebar-accent transition-all cursor-pointer"
              >
                <span className="truncate">{simulatedRole || "Admin"}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-md shrink-0">Switch</span>
              </button>
            </div>
          )}

          {/* LOGOUT BUTTON */}
          {(mobileMenuOpen || !isCollapsed) && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 text-xs font-bold transition-all cursor-pointer animate-fade-in"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Scoped scrollbar styles */}
      <style>{`
        .sidebar-nav-scroll {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          transition: scrollbar-color 0.3s ease;
        }
        .sidebar-nav-scroll:hover {
          scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
        }
        .dark .sidebar-nav-scroll:hover {
          scrollbar-color: hsl(0 0% 30%) transparent;
        }

        /* Webkit scrollbar */
        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 9999px;
          transition: background 0.3s ease;
        }
        .sidebar-nav-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
        }
        .dark .sidebar-nav-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  )
}
