import { useState, useEffect } from 'react'

import Login from './components/Login.jsx'
import EmployeePortal from './components/EmployeePortal.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  useEffect(() => { localStorage.setItem('hr_pulse_current_view', currentView) }, [currentView])

  useEffect(() => {
    const handleResize = () => setMobileMenuOpen(false)
    handleResize()
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

  const { showCommandPalette, setShowCommandPalette, commandSearch, setCommandSearch, paletteIndex, setPaletteIndex, filteredItems, selectPaletteItem, getCategoryIcon } = useCommandPalette({
    user, employees: appData.employees, themeMode, toggleTheme, setCurrentView, addToast, setSelectedEmployeeId
  })

  if (!user) {
    return <Login onLogin={handleLogin} themeMode={themeMode} toggleTheme={toggleTheme} />
  }

  if (appData.simulatedRole === 'Employee' || user.isEmployee) {
    return (
      <EmployeePortal
        currentUser={{...user, role: user.role || 'Employee', department: user.department || 'Engineering'}}
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
    <div className="dashboard-root app-shell" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', padding: '16px', gap: '16px', boxSizing: 'border-box' }}>
      {mobileMenuOpen && <div className="sidebar-overlay open" onClick={() => setMobileMenuOpen(false)} />}
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
      <main className="content dashboard-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollbarGutter: 'stable' }}>
        <Topbar
          isDarkMode={isDarkMode}
          toggleSidebar={toggleSidebar}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          handleSync={appData.handleSync}
          isSyncing={appData.isSyncing}
          driveConnected={appData.driveConnected}
          syncConflicts={appData.syncConflicts}
          notifications={appData.notifications}
          showNotifications={appData.showNotifications}
          setShowNotifications={appData.setShowNotifications}
          markNotificationsRead={appData.markNotificationsRead}
          unreadCount={unreadCount}
        />
        <AppContent
          currentView={currentView}
          setCurrentView={setCurrentView}
          isAppLoading={appData.isAppLoading}
          hasPermission={appData.hasPermission}
          simulatedRole={appData.simulatedRole}
          user={user}
          addToast={addToast}
          {...appData}
        />
      </main>
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
    </div>
  )
}
