import Dashboard from './Dashboard.jsx'
import Employees from './Employees.jsx'
import Payroll from './Payroll.jsx'
import Attendance from './Attendance.jsx'
import Expenses from './Expenses.jsx'
import Announcements from './Announcements.jsx'
import Calendar from './Calendar.jsx'
import Documents from './Documents.jsx'
import Assets from './Assets.jsx'
import Settings from './Settings.jsx'
import Tasks from './Tasks.jsx'
import ProfileView from './ProfileView.jsx'
import Notes from './Notes.jsx'
import GigBoardPage from './hr/GigBoardPage.jsx'
import PerformancePage from './hr/PerformancePage.jsx'
import WellbeingPage from './hr/WellbeingPage.jsx'
import LoadingScreen from './layout/LoadingScreen.jsx'
import { Skeleton } from "@/components/ui/skeleton"

export default function AppContent({ currentView, setCurrentView, isAppLoading, hasPermission, user, isSidebarCollapsed, themeMode, toggleTheme, ...data }) {
  const renderBreadcrumbs = () => {
    if (currentView === 'dashboard') return null
    return (
      <div className="breadcrumb-container">
        <span className="breadcrumb-item" onClick={() => setCurrentView('dashboard')}>Dashboard</span>
        <span>/</span>
        <span className="breadcrumb-current" style={{ textTransform: 'capitalize' }}>
          {currentView === 'profile' ? 'My Profile' : currentView}
        </span>
      </div>
    )
  }

  if (isAppLoading) {
    return <LoadingScreen isDarkMode={themeMode === 'dark'} />
  }

  if (!hasPermission(currentView)) {
    return (
      <div className="animate-fade-in p-16 px-8" style={{ textAlign: 'center', background: 'var(--color-md-sys-surface-container)', borderRadius: '16px', border: '1px solid var(--color-md-sys-outline-variant)', marginTop: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-md-sys-error)', marginBottom: '16px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700 }}>!</span>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-md-sys-error)', marginBottom: '16px' }}>403 Forbidden</h2>
        <p style={{ color: 'var(--color-md-sys-on-surface-variant)', maxWidth: '400px', margin: '0 auto' }}>
          Your current role (<strong>{user?.role || (user?.isEmployee ? 'Teammate' : 'Admin')}</strong>) does not have permission to access the <strong>{currentView}</strong> module.
        </p>
      </div>
    )
  }

  switch (currentView) {
    case 'dashboard':
      return <Dashboard employees={data.employees} syncLogs={data.syncLogs} addLog={data.addLog} onSync={data.handleSync} setCurrentView={setCurrentView} announcements={data.announcements} events={data.events} payroll={data.payroll} isSidebarCollapsed={isSidebarCollapsed} hasPermission={hasPermission} tasks={data.tasks} documents={data.documents} assets={data.assets} attendance={data.attendance} setAttendance={data.handleSetAttendance} currentUser={user} addToast={data.addToast} settings={data.settings} notes={data.notes} setNotes={data.handleSetNotes} />
    case 'employees':
      return <Employees employees={data.employees} setEmployees={data.handleSetEmployees} addLog={data.addLog} addAuditLog={data.addAuditLog} pendingProfileEdits={data.pendingProfileEdits} setPendingProfileEdits={data.setPendingProfileEdits} addToast={data.addToast} selectedEmployeeId={data.selectedEmployeeId} setSelectedEmployeeId={data.setSelectedEmployeeId} isSidebarCollapsed={isSidebarCollapsed} adminUid={data.adminUid} currentUser={user} />
    case 'payroll':
      return <Payroll employees={data.employees} payroll={data.payroll} setPayroll={data.handleSetPayroll} addLog={data.addLog} settings={data.settings} addAuditLog={data.addAuditLog} />
    case 'attendance':
      return <Attendance employees={data.employees} attendance={data.attendance} setAttendance={data.handleSetAttendance} roster={data.roster} setRoster={data.setRoster} shiftSwaps={data.shiftSwaps} setShiftSwaps={data.setShiftSwaps} shiftTemplates={data.settings?.shiftTemplates} overtimeClaims={data.overtimeClaims} setOvertimeClaims={data.setOvertimeClaims} addLog={data.addLog} addToast={data.addToast} addNotification={data.addNotification} addAuditLog={data.addAuditLog} settings={data.settings} />
    case 'announcements':
      return <Announcements employees={data.employees} announcements={data.announcements} setAnnouncements={data.setAnnouncements} addLog={data.addLog} addToast={data.addToast} currentUser={user} addNotification={data.addNotification} />
    case 'calendar':
      return <Calendar events={data.events} setEvents={data.handleSetEvents} employees={data.employees} addLog={data.addLog} addToast={data.addToast} currentUser={user} addNotification={data.addNotification} />
    case 'documents':
      return <Documents documents={data.documents} setDocuments={data.handleSetDocuments} employees={data.employees} addLog={data.addLog} addToast={data.addToast} currentUser={user} adminUid={data.adminUid} addNotification={data.addNotification} />
    case 'assets':
      return <Assets employees={data.employees} assets={data.assets} setAssets={data.setAssets} assetRequests={data.assetRequests} setAssetRequests={data.setAssetRequests} assetCategories={data.assetCategories} setAssetCategories={data.setAssetCategories} addLog={data.addLog} addToast={data.addToast} currentUser={user} addNotification={data.addNotification} />
    case 'tasks':
      return <Tasks tasks={data.tasks} setTasks={data.handleSetTasks} employees={data.employees} currentUser={user} addToast={data.addToast} addLog={data.addLog} addNotification={data.addNotification} />
    case 'expenses':
      return <Expenses employees={data.employees} expenses={data.expenses} setExpenses={data.handleSetExpenses} settings={data.settings} addLog={data.addLog} addToast={data.addToast} addAuditLog={data.addAuditLog} currentUser={user} />
    case 'settings':
      return <Settings settings={data.settings} setSettings={data.handleSetSettings} addLog={data.addLog} addToast={data.addToast} auditLogs={data.auditLogs} themeMode={themeMode} toggleTheme={toggleTheme} />
    case 'profile':
      return <ProfileView currentUser={user} pendingProfileEdits={data.pendingProfileEdits} setPendingProfileEdits={data.setPendingProfileEdits} addToast={data.addToast} addLog={data.addLog} settings={data.settings} setSettings={data.handleSetSettings} employees={data.employees} setEmployees={data.handleSetEmployees} />
    case 'notes':
      return <Notes notes={data.notes} setNotes={data.handleSetNotes} currentUser={user} addToast={data.addToast} />
    case 'gigs':
      return <GigBoardPage adminUid={data.adminUid} currentUser={user} employees={data.employees} addToast={data.addToast} />
    case 'performance':
      return <PerformancePage adminUid={data.adminUid} currentUser={user} addToast={data.addToast} />
    case 'wellbeing':
      return <WellbeingPage adminUid={data.adminUid} currentUser={user} employees={data.employees} addToast={data.addToast} />
    default:
      return <Dashboard employees={data.employees} syncLogs={data.syncLogs} addLog={data.addLog} onSync={data.handleSync} setCurrentView={setCurrentView} announcements={data.announcements} events={data.events} payroll={data.payroll} isSidebarCollapsed={isSidebarCollapsed} hasPermission={hasPermission} tasks={data.tasks} documents={data.documents} assets={data.assets} attendance={data.attendance} setAttendance={data.handleSetAttendance} currentUser={user} addToast={data.addToast} />
  }
}
