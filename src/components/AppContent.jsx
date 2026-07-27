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
import DriveSync from './DriveSync.jsx'

export default function AppContent({ currentView, setCurrentView, isAppLoading, hasPermission, simulatedRole, user, ...data }) {
  const renderBreadcrumbs = () => {
    if (currentView === 'dashboard') return null
    return (
      <div className="breadcrumb-container">
        <span className="breadcrumb-item" onClick={() => setCurrentView('dashboard')}>Dashboard</span>
        <span>/</span>
        <span className="breadcrumb-current" style={{ textTransform: 'capitalize' }}>
          {currentView === 'drive' ? 'Google Drive Sync' : currentView}
        </span>
      </div>
    )
  }

  if (isAppLoading) {
    const skeletonLayouts = {
      dashboard: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton skeleton-header" />
          <div className="skeleton skeleton-subtitle" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-stat-card" />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="skeleton skeleton-card" style={{ height: '240px' }} />
            <div className="skeleton skeleton-card" style={{ height: '240px' }} />
          </div>
        </div>
      ),
      employees: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton skeleton-header" />
          <div className="skeleton skeleton-subtitle" />
          <div className="skeleton" style={{ height: '44px', borderRadius: '12px', marginBottom: '8px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        </div>
      ),
      table: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton skeleton-header" />
          <div className="skeleton skeleton-subtitle" />
          <div className="skeleton skeleton-tabs" />
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ),
      settings: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton skeleton-header" />
          <div className="skeleton skeleton-subtitle" />
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-row" />)}
            </div>
            <div className="skeleton skeleton-card" style={{ height: '400px' }} />
          </div>
        </div>
      )
    }
    const layoutKey = currentView === 'dashboard' ? 'dashboard'
      : currentView === 'employees' ? 'employees'
      : (currentView === 'settings' || currentView === 'drive') ? 'settings'
      : 'table'
    return skeletonLayouts[layoutKey]
  }

  if (!hasPermission(currentView)) {
    return (
      <div className="animate-fade-in p-16 px-8" style={{ textAlign: 'center', background: 'var(--color-md-sys-surface-container)', borderRadius: '16px', border: '1px solid var(--color-md-sys-outline-variant)', marginTop: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-md-sys-error)', marginBottom: '16px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700 }}>!</span>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-md-sys-error)', marginBottom: '16px' }}>403 Forbidden</h2>
        <p style={{ color: 'var(--color-md-sys-on-surface-variant)', maxWidth: '400px', margin: '0 auto' }}>
          Your current role (<strong>{simulatedRole}</strong>) does not have permission to access the <strong>{currentView}</strong> module.
        </p>
      </div>
    )
  }

  switch (currentView) {
    case 'dashboard':
      return <Dashboard employees={data.employees} syncLogs={data.syncLogs} driveConnected={data.driveConnected} addLog={data.addLog} onSync={data.handleSync} setCurrentView={setCurrentView} announcements={data.announcements} events={data.events} payroll={data.payroll} />
    case 'employees':
      return <Employees employees={data.employees} setEmployees={data.handleSetEmployees} addLog={data.addLog} driveConnected={data.driveConnected} simulatedRole={simulatedRole} addAuditLog={data.addAuditLog} pendingProfileEdits={data.pendingProfileEdits} setPendingProfileEdits={data.setPendingProfileEdits} addToast={data.addToast} selectedEmployeeId={data.selectedEmployeeId} setSelectedEmployeeId={data.setSelectedEmployeeId} />
    case 'payroll':
      return <Payroll employees={data.employees} payroll={data.payroll} setPayroll={data.handleSetPayroll} addLog={data.addLog} driveConnected={data.driveConnected} settings={data.settings} simulatedRole={simulatedRole} addAuditLog={data.addAuditLog} />
    case 'attendance':
      return <Attendance employees={data.employees} attendance={data.attendance} setAttendance={data.handleSetAttendance} roster={data.roster} setRoster={data.setRoster} shiftSwaps={data.shiftSwaps} setShiftSwaps={data.setShiftSwaps} shiftTemplates={data.settings?.shiftTemplates} overtimeClaims={data.overtimeClaims} setOvertimeClaims={data.setOvertimeClaims} addLog={data.addLog} driveConnected={data.driveConnected} addToast={data.addToast} addNotification={data.addNotification} simulatedRole={simulatedRole} addAuditLog={data.addAuditLog} />
    case 'announcements':
      return <Announcements employees={data.employees} announcements={data.announcements} setAnnouncements={data.setAnnouncements} addLog={data.addLog} addToast={data.addToast} currentUser={user} simulatedRole={simulatedRole} />
    case 'calendar':
      return <Calendar events={data.events} setEvents={data.handleSetEvents} employees={data.employees} addLog={data.addLog} addToast={data.addToast} currentUser={user} simulatedRole={simulatedRole} />
    case 'documents':
      return <Documents documents={data.documents} setDocuments={data.handleSetDocuments} employees={data.employees} addLog={data.addLog} addToast={data.addToast} currentUser={user} simulatedRole={simulatedRole} />
    case 'assets':
      return <Assets employees={data.employees} assets={data.assets} setAssets={data.setAssets} assetRequests={data.assetRequests} setAssetRequests={data.setAssetRequests} addLog={data.addLog} addToast={data.addToast} currentUser={user} simulatedRole={simulatedRole} />
    case 'expenses':
      return <Expenses employees={data.employees} expenses={data.expenses} setExpenses={data.handleSetExpenses} settings={data.settings} addLog={data.addLog} addToast={data.addToast} addAuditLog={data.addAuditLog} simulatedRole={simulatedRole} />
    case 'settings':
      return <Settings settings={data.settings} setSettings={data.handleSetSettings} addLog={data.addLog} addToast={data.addToast} auditLogs={data.auditLogs} simulatedRole={simulatedRole} syncConflicts={data.syncConflicts} setSyncConflicts={data.setSyncConflicts} />
    case 'drive':
      return <DriveSync user={user} driveConnected={data.driveConnected} setDriveConnected={data.setDriveConnected} addLog={data.addLog} />
    default:
      return <Dashboard employees={data.employees} syncLogs={data.syncLogs} driveConnected={data.driveConnected} addLog={data.addLog} attendance={data.attendance} setCurrentView={setCurrentView} onSync={data.handleSync} announcements={data.announcements} events={data.events} payroll={data.payroll} />
  }
}
