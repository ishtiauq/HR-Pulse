import { useState, useEffect, useRef } from 'react'

import Login from './components/Login.jsx'
import EmployeePortal from './components/EmployeePortal.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Monitor, Sun, Moon, User as UserIcon, Menu, XCircle, LayoutDashboard, Users, Clock, Megaphone, ArrowLeftRight, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ToastContainer from './components/layout/ToastContainer.jsx'
import CommandPalette from './components/layout/CommandPalette.jsx'
import AppContent from './components/AppContent.jsx'
import { allNavItems } from './utils/helpers.js'
import { useTheme } from './hooks/useTheme.js'
import { useToast } from './hooks/useToast.js'
import { useAuth } from './hooks/useAuth.js'
import { useCommandPalette } from './hooks/useCommandPalette.jsx'
import useAppData from './hooks/useAppData.js'

export default function App() {
  const { themeMode, isDarkMode, toggleTheme } = useTheme()
  const { user, handleLogin, handleLogout } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const appData = useAppData({ user, addToast })

  const [currentView, setCurrentView] = useState(() => localStorage.getItem('hr_pulse_current_view') || 'dashboard')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const lastScrollY = useRef(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  useEffect(() => {
    localStorage.setItem('hr_pulse_current_view', currentView)
    const timer = setTimeout(() => appData.setIsAppLoading(false), 500)
    return () => clearTimeout(timer)
  }, [currentView])

  const handleScroll = (e) => {
    if (!isMobile) return;
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY < 50) {
      setIsScrollingDown(false);
    } else if (currentScrollY > lastScrollY.current + 5) {
      setIsScrollingDown(true);
    } else if (currentScrollY < lastScrollY.current - 5) {
      setIsScrollingDown(false);
    }
    lastScrollY.current = currentScrollY;
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      window.history.pushState({ mobileMenu: true }, '')
      const handlePop = () => setMobileMenuOpen(false)
      window.addEventListener('popstate', handlePop)
      return () => window.removeEventListener('popstate', handlePop)
    }
  }, [mobileMenuOpen])

  const toggleSidebar = () => {
    const width = window.innerWidth
    if (width >= 768) {
      const next = !isCollapsed
      setIsCollapsed(next)
      localStorage.setItem('sidebar_collapsed', next)
    } else {
      setIsCollapsed(false)
      setMobileMenuOpen(!mobileMenuOpen)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        appData.setShowCommandPalette(prev => !prev)
        appData.setCommandSearch('')
        appData.setPaletteIndex(0)
        return
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
        if (e.key === 'Escape') { e.preventDefault(); appData.setShowCommandPalette(false); appData.setCommandSearch(''); appData.setPaletteIndex(0); e.target.blur() }
        return
      }
      if (e.key === '/') { e.preventDefault(); appData.setShowCommandPalette(true); appData.setCommandSearch(''); appData.setPaletteIndex(0) }
      else if (e.key.toLowerCase() === 'e') { e.preventDefault(); setCurrentView('employees') }
      else if (e.key.toLowerCase() === 's') { e.preventDefault(); addToast('Save shortcut triggered', 'info') }
      else if (e.key === 'Escape') { appData.setShowCommandPalette(false); setMobileMenuOpen(false) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { showCommandPalette, setShowCommandPalette, commandSearch, setCommandSearch, paletteIndex, setPaletteIndex, filteredItems, selectPaletteItem, getCategoryIcon, ConfirmDialog } = useCommandPalette({
    user, employees: appData.employees, themeMode, toggleTheme, setCurrentView, addToast, setSelectedEmployeeId
  })

  if (!user) {
    return <Login onLogin={handleLogin} themeMode={themeMode} toggleTheme={toggleTheme} />
  }

  if (appData.simulatedRole === 'Employee' || user.isEmployee) {
    return (
      <EmployeePortal
        currentUser={{...user, role: user.role || 'Employee', department: user.department || 'Engineering'}}
        themeMode={themeMode}
        toggleTheme={toggleTheme}
        employees={appData.employees}
        attendance={appData.attendance}
        payroll={appData.payroll}
        expenses={appData.expenses}
        addLog={appData.addLog}
        addToast={addToast}
        setAttendance={appData.handleSetAttendance}
        pendingProfileEdits={appData.pendingProfileEdits}
        setPendingProfileEdits={appData.setPendingProfileEdits}
        setExpenses={appData.handleSetExpenses}
        roster={appData.roster}
        shiftSwaps={appData.shiftSwaps}
        setShiftSwaps={appData.setShiftSwaps}
        shiftTemplates={appData.settings?.shiftTemplates}
        overtimeClaims={appData.overtimeClaims}
        setOvertimeClaims={appData.setOvertimeClaims}
        announcements={appData.announcements}
        setAnnouncements={appData.setAnnouncements}
        assets={appData.assets}
        setAssets={appData.setAssets}
        tasks={appData.tasks}
        setTasks={appData.handleSetTasks}
        events={appData.events}
        setEvents={appData.handleSetEvents}
        assetRequests={appData.assetRequests}
        setAssetRequests={appData.setAssetRequests}
        settings={appData.settings}
        simulatedRole={appData.simulatedRole}
        setSimulatedRole={appData.setSimulatedRole}
      />
    )
  }

  const visibleNavItems = allNavItems.filter(item => appData.hasPermission(item.id))
  const unreadCount = appData.notifications.filter(n => !n.read).length

  return (
    <div className="dashboard-root app-shell relative" style={{ display: 'flex', height: '100vh', width: '100vw', maxWidth: '100vw', overflow: 'hidden', boxSizing: 'border-box' }}>
      


      <Sidebar
        visibleNavItems={visibleNavItems}
        isCollapsed={isCollapsed}
        isDarkMode={isDarkMode}
        currentView={currentView}
        setCurrentView={setCurrentView}
        mobileMenuOpen={mobileMenuOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        simulatedRole={appData.simulatedRole}
        showRoleModal={appData.showRoleModal}
        setShowRoleModal={appData.setShowRoleModal}
        handleLogout={handleLogout}
        setIsCollapsed={setIsCollapsed}
        setSimulatedRole={appData.setSimulatedRole}
        setMobileMenuOpen={setMobileMenuOpen}
      />



      <main 
        className={`content dashboard-content ${isMobile ? 'pb-24' : 'pb-12'} flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center max-w-[100vw]`} 
        style={{ scrollbarGutter: 'stable' }}
        onScroll={handleScroll}
      >
        <div className="w-full max-w-[1600px] flex flex-col relative">
          
          {/* Sticky Header Wrapper */}
          <div className={`sticky top-0 z-40 w-full pt-6 md:pt-8 lg:pt-10 pb-6 md:pb-8 lg:pb-10 px-4 md:px-6 lg:px-8 transition-transform duration-300 ease-in-out ${isMobile && isScrollingDown && !showMobileMenu ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
            <Topbar
                isDarkMode={isDarkMode}
                toggleSidebar={toggleSidebar}
                themeMode={themeMode}
                toggleTheme={toggleTheme}
                handleSync={appData.handleSync}
                isSyncing={appData.isSyncing}
                driveConnected={appData.driveConnected}
                syncConflicts={appData.syncConflicts}
                setShowNotifications={appData.setShowNotifications}
                markNotificationsRead={appData.markNotificationsRead}
                unreadCount={unreadCount}
              />
          </div>

          {/* Notification Panel */}
          {appData.showNotifications && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="fixed top-[calc(64px+2rem)] right-4 md:right-6 lg:right-8 w-[300px] sm:w-[340px] rounded-2xl z-50 overflow-hidden bg-popover text-popover-foreground border border-border shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 p-0"
            >
              <div className="p-3.5 px-4 flex justify-between items-center border-b border-border bg-muted/30">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground m-0">Notifications</h3>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {appData.notifications.length} Total
                </Badge>
              </div>
              <div className="max-h-[280px] overflow-y-auto p-1">
                {appData.notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground italic">No new notifications</div>
                ) : (
                  appData.notifications.map(n => (
                    <div role="listitem" key={n.id} className="p-3 px-3.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer my-0.5">
                      <p className="text-xs m-0 leading-relaxed text-foreground" style={{ fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                      <span className="text-[10px] font-medium block mt-1 text-muted-foreground">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="w-full flex-1 px-4 md:px-6 lg:px-8">
            <AppContent
            currentView={currentView}
            setCurrentView={setCurrentView}
            isAppLoading={appData.isAppLoading}
            hasPermission={appData.hasPermission}
            simulatedRole={appData.simulatedRole}
            user={user}
            addToast={addToast}
            isSidebarCollapsed={isCollapsed}
            {...appData}
          />
          </div>
        </div>
      </main>

      {/* Bottom Tab Bar (Mobile) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-auto">
          <nav 
            className={`w-full h-12 sm:h-14 px-4 flex items-center justify-between sm:justify-evenly bg-background/80 backdrop-blur-xl saturate-150 text-foreground border-t border-border/50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 ${isScrollingDown && !showMobileMenu ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {visibleNavItems.filter(i => ['dashboard', 'employees', 'attendance', 'tasks', 'announcements'].includes(i.id)).map(item => {
              const active = currentView === item.id
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-label={item.label}
                  title={item.label}
                  aria-selected={active}
                  onClick={() => {
                    setCurrentView(item.id)
                    setShowMobileMenu(false)
                  }}
                  className={`flex-shrink-0 flex items-center justify-center border-0 cursor-pointer w-[44px] h-[44px] transition-all bg-transparent outline-none select-none tap-highlight-transparent ${active ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <div className="[&>svg]:w-6 [&>svg]:h-6">{item.icon}</div>
                </button>
              )
            })}
            
            {/* Menu Toggle */}
            <button
              role="button"
              aria-label="Menu"
              title="Menu"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`flex-shrink-0 flex items-center justify-center border-0 cursor-pointer w-[44px] h-[44px] transition-all bg-transparent outline-none select-none tap-highlight-transparent ${showMobileMenu ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Menu size={24} strokeWidth={showMobileMenu ? 2.5 : 2} />
            </button>
          </nav>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed inset-0 z-50 bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowMobileMenu(false)}
        aria-hidden={!showMobileMenu}
      />
      
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-popover rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] border border-border/40 transition-transform duration-300 ease-in-out sm:w-[400px] sm:mx-auto max-h-[85vh] md:hidden ${showMobileMenu ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!showMobileMenu}
      >
        <div className="px-5 py-4 border-b border-border/50 bg-muted/20 rounded-t-2xl shrink-0 flex items-center justify-between">
          <h2 className="text-left text-lg font-bold text-foreground">Menu</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={() => setShowMobileMenu(false)}>
            <XCircle size={18} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5 pb-24">
          {visibleNavItems.filter(i => !['dashboard', 'employees', 'attendance', 'tasks', 'announcements'].includes(i.id)).map(item => {
            const active = currentView === item.id
            return (
              <Button
                key={item.id}
                variant={active ? "secondary" : "ghost"}
                className={`w-full justify-start py-6 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary font-semibold shadow-sm' : 'text-foreground font-medium hover:bg-muted/60'}`}
                onClick={() => { setCurrentView(item.id); setShowMobileMenu(false) }}
              >
                <div className={`mr-4 h-[22px] w-[22px] [&>svg]:w-[22px] [&>svg]:h-[22px] flex items-center justify-center ${active ? 'text-primary' : 'text-muted-foreground/70'}`}>{item.icon}</div>
                <span className="text-base">{item.label}</span>
              </Button>
            )
          })}
          
          <div className="h-px bg-border/60 my-4 mx-2 shrink-0" />
          
          <button 
            className="btn-shimmer w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors cursor-pointer border-none shadow-sm"
            onClick={() => { appData.setShowRoleModal(true); setShowMobileMenu(false) }}
          >
            <ArrowLeftRight size={20} />
            <span className="font-semibold text-base">Switch Role</span>
          </button>

          <button 
            className="btn-shimmer mt-2 w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white transition-colors cursor-pointer border-none shadow-sm"
            onClick={() => { handleLogout(); setShowMobileMenu(false) }}
          >
            <LogOut size={20} />
            <span className="font-semibold text-base">Logout</span>
          </button>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <CommandPalette
        showCommandPalette={showCommandPalette}
        setShowCommandPalette={setShowCommandPalette}
        commandSearch={commandSearch}
        setCommandSearch={setCommandSearch}
        paletteIndex={paletteIndex}
        setPaletteIndex={setPaletteIndex}
        filteredItems={filteredItems}
        selectPaletteItem={selectPaletteItem}
        getCategoryIcon={getCategoryIcon}
      />
      <ConfirmDialog />
    </div>
  )
}
