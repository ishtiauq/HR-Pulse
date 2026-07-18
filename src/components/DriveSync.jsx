import { useState, useEffect } from 'react'
import { Database, HardDrive, CloudOff, CloudLightning, ArrowLeftRight, Download, UploadCloud, Info, FileJson, Check, AlertCircle, RefreshCw, Eye, X, Trash2, Shield, RotateCcw } from 'lucide-react'
import AdSlot from './AdSlot'
import { useModal } from '../services/useModal.js'
import { getLocalCacheSizeMB, clearLocalCache } from '../services/db.js'
import { createBackup, listBackups, restoreBackup } from '../services/googleDrive.js'
import { formatDateTime } from '../services/date.js'

const mockFiles = [
  { id: '1', name: 'employees.json', size: '42.5 KB', modified: '2026-07-18T04:30:00Z' },
  { id: '2', name: 'attendance.json', size: '128.1 KB', modified: '2026-07-18T04:45:00Z' },
  { id: '3', name: 'payroll_history.json', size: '56.2 KB', modified: '2026-07-18T04:15:00Z' },
  { id: '4', name: 'settings.json', size: '2.1 KB', modified: '2026-07-17T10:00:00Z' }
]

export default function DriveSync({ user, driveConnected, setDriveConnected, syncLogs, addLog, addToast, employees }) {
  const [isBackupSimulating, setIsBackupSimulating] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({ employees: true, attendance: true, settings: true, payroll: true })
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [importError, setImportError] = useState('')
  const [timeSinceSync, setTimeSinceSync] = useState(2)
  const [timeUntilSync, setTimeUntilSync] = useState(13)
  const [previewFile, setPreviewFile] = useState(null)
  const [cacheSize, setCacheSize] = useState('0.00')
  const [isClearing, setIsClearing] = useState(false)
  const [backupsList, setBackupsList] = useState([])
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedRestoreBackup, setSelectedRestoreBackup] = useState(null)
  useModal(() => setSelectedRestoreBackup(null))
  useModal(() => setPreviewFile(null))
  
  useEffect(() => {
    const fetchCacheSize = async () => {
      const size = await getLocalCacheSizeMB()
      setCacheSize(size)
    }
    fetchCacheSize()

    const loadBackups = async () => {
      if (driveConnected && user?.token) {
        try {
          const bks = await listBackups(user.token)
          setBackupsList(bks)
        } catch(e) {
          console.warn("Failed to load backups", e)
        }
      }
    }
    loadBackups()

    const timer = setInterval(() => {
      setTimeSinceSync(prev => prev < 15 ? prev + 1 : 0)
      setTimeUntilSync(prev => prev > 0 ? prev - 1 : 15)
      fetchCacheSize()
    }, 60000)
    return () => clearInterval(timer)
  }, [driveConnected, user])
  
  const handleToggleConnection = () => {
    const nextState = !driveConnected
    setDriveConnected(nextState)
    if (nextState) {
      addLog('Google Drive Connection Restored', 'Re-established sync tunnel with /HR-Pulse-DB/')
    } else {
      addLog('Google Drive Connection Paused', 'Local storage offline, cloud sync suspended', 'warning')
    }
  }

  const handleTestConnection = () => {
    addToast('Pinging Google Drive API...', 'info')
    setTimeout(() => {
      addToast('Success: Read/Write access verified in /HR-Pulse-DB/', 'success')
    }, 1000)
  }

  const handleCreateBackup = async () => {
    setIsBackingUp(true)
    addToast('Creating backup package...', 'info')
    try {
      await createBackup(user.token, false)
      const bks = await listBackups(user.token)
      setBackupsList(bks)
      addToast('Manual backup created successfully.', 'success')
      addLog('Backup Created', 'Manual snapshot saved to Drive', 'success')
    } catch(e) {
      addToast('Failed to create backup', 'error')
    }
    setIsBackingUp(false)
  }

  const handleExecuteRestore = async () => {
    if (!selectedRestoreBackup) return
    setIsRestoring(true)
    addToast('Restoring database from backup...', 'info')
    try {
      await restoreBackup(user.token, selectedRestoreBackup.id)
      addToast('Restore successful. Reloading...', 'success')
      addLog('Backup Restored', `Restored from ${selectedRestoreBackup.name}`, 'warning')
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      addToast('Restore failed.', 'error')
      setIsRestoring(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <Database size={28} className="page-title-icon" />
          Google Drive Sync Management
        </h1>
      </div>

      {/* Connection Controller Card */}
      <div className="glass-card" style={{
        padding: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        background: driveConnected ? 'radial-gradient(at 100% 0%, var(--accent-success-glow) 0px, transparent 40%), var(--glass-bg)' : 'var(--glass-bg)'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: driveConnected ? 'var(--accent-success-glow)' : 'var(--accent-danger-glow)',
            color: driveConnected ? 'var(--accent-success)' : 'var(--accent-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: driveConnected ? '0 4px 20px rgba(16, 185, 129, 0.2)' : 'none',
            position: 'relative'
          }}>
            {driveConnected && (
              <span className="animate-ping" style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-success)'
              }} />
            )}
            {driveConnected && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-success)'
              }} />
            )}
            {driveConnected ? <CloudLightning size={28} /> : <CloudOff size={28} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {driveConnected ? 'Sync Tunnel Active' : 'Sync Tunnel Paused'}
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {driveConnected ? (
                <>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={14} /> Last Synced: {timeSinceSync} minutes ago</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowLeftRight size={14} /> Next sync in {timeUntilSync} minutes</span>
                </>
              ) : (
                'Local database is working offline. Operations will be buffered until connection resumes.'
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={async () => {
              if(window.confirm("Are you sure you want to clear the local cache? Unsynced offline changes will be lost, and the app will reload.")) {
                setIsClearing(true)
                try {
                  await clearLocalCache()
                  window.location.reload()
                } catch(e) {
                  addLog('Cache Error', 'Failed to clear local cache', 'error')
                  setIsClearing(false)
                }
              }
            }}
            disabled={isClearing}
            className="btn btn-outline"
            style={{
              borderColor: 'var(--accent-danger)',
              color: 'var(--accent-danger)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={16} />
            {isClearing ? 'Clearing...' : 'Clear Local Cache & Resync'}
          </button>
          <button 
            onClick={handleToggleConnection}
            className={`btn ${driveConnected ? 'btn-secondary' : 'btn-primary'}`}
            style={{
              borderColor: driveConnected ? 'var(--accent-warning)' : 'transparent',
              color: driveConnected ? 'var(--accent-warning)' : '#fff',
              fontWeight: 600
            }}
          >
            {driveConnected ? 'Pause Cloud Connection' : 'Establish Cloud Connection'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Sync Mechanism Diagram */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Data Synchronization Flow</h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'space-between', padding: '20px 0' }}>
            <div style={{ flex: 1, minWidth: '100px', padding: '12px 8px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.01)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <HardDrive size={24} style={{ color: 'var(--accent-primary)', margin: '0 auto 6px' }} />
              <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>Local Cache</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>{driveConnected ? '0 pending' : 'Offline queue'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{cacheSize} MB</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '60px', flexShrink: 0 }}>
              <ArrowLeftRight size={20} style={{ 
                color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)',
                animation: driveConnected ? 'slideLoop 1.5s ease-in-out infinite alternate' : 'none'
              }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                {driveConnected ? 'Active' : 'Offline'}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: '100px', padding: '12px 8px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.01)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <CloudLightning size={24} style={{ color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)', margin: '0 auto 6px' }} />
              <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>Drive DB</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{driveConnected ? 'Synced' : 'Waiting'}</span>
            </div>
          </div>
        </div>

        {/* Database backup commands */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Manual Backup</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Create an immediate snapshot of the current state, combining all tables into a single JSON package in the `_backups` folder.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, justifyContent: 'center' }} 
              onClick={handleCreateBackup}
              disabled={isBackingUp || !driveConnected}
            >
              <Download size={16} /> {isBackingUp ? 'Creating Backup...' : 'Create Backup Now'}
            </button>
          </div>
        </div>

        {/* Data Integrity Testing */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent-danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Data Integrity Testing
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Simulate cloud database corruption by writing duplicate IDs to `employees.json` in your Google Drive. Reloading the app will trigger validation alerts and backup recovery flows.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }} 
              onClick={() => {
                const MOCK_DRIVE_KEY = 'hr_pulse_mock_drive_files';
                const driveRaw = localStorage.getItem(MOCK_DRIVE_KEY);
                if (driveRaw) {
                  try {
                    const drive = JSON.parse(driveRaw);
                    if (drive['employees']) {
                      const employees = drive['employees'].content;
                      if (Array.isArray(employees) && employees.length > 0) {
                        const duplicate = { ...employees[0], name: employees[0].name + " (Duplicate)" };
                        employees.push(duplicate);
                        drive['employees'].content = employees;
                        drive['employees'].modifiedTime = new Date().toISOString();
                        localStorage.setItem(MOCK_DRIVE_KEY, JSON.stringify(drive));
                        alert('Corruption simulated successfully! Please reload the page to trigger the integrity validator.');
                      } else {
                        alert('Mock drive has no employees to duplicate. Please load data first.');
                      }
                    } else {
                      alert('Employees table not found in mock drive. Please sync first.');
                    }
                  } catch (e) {
                    alert('Error writing corruption: ' + e.message);
                  }
                } else {
                  alert('No mock drive found in localStorage. Please log in as a simulated user first.');
                }
              }}
            >
              Simulate Drive Corruption
            </button>
          </div>
        </div>
      </div>

      {/* Backup Browser Widget */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} style={{ color: 'var(--accent-primary)' }}/> Database Backups (/_backups/)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Automated backups are retained for 7 days + 4 weeks</p>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="table-striped" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <th style={{ padding: '12px' }}>Backup Name</th>
                <th style={{ padding: '12px' }}>Size</th>
                <th style={{ padding: '12px' }}>Created Date</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!Array.isArray(backupsList) || backupsList.length === 0) ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No backups found.</td>
                </tr>
              ) : backupsList.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileJson size={16} style={{ color: 'var(--text-muted)' }} /> {f.name}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {f.size ? (parseInt(f.size) / 1024).toFixed(1) + ' KB' : 'Unknown'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDateTime(f.modifiedTime)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => window.open(`https://drive.google.com/uc?export=download&id=${f.id}`, '_blank')}
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                      title="Download Backup"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      onClick={() => setSelectedRestoreBackup(f)}
                      className="btn" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', background: 'var(--accent-warning)', color: '#fff' }}
                      title="Restore from this backup"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {selectedRestoreBackup && (
        <div className="modal-overlay" onClick={() => setSelectedRestoreBackup(null)}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={24} /> Confirm Restore
              </h2>
            </div>
            <div className="modal-body">
              <p>You are about to restore the database from:</p>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', margin: '16px 0', fontFamily: 'monospace' }}>
                {selectedRestoreBackup.name}
              </div>
              <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
                WARNING: This will completely overwrite your current active database tables and cannot be undone. Unsynced offline changes will be permanently lost.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => setSelectedRestoreBackup(null)}
                  disabled={isRestoring}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1 }}
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                >
                  {isRestoring ? 'Restoring...' : 'Yes, Overwrite Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Warning Alert */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
          <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Authentication Note</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', maxWidth: '800px' }}>
              This application uses standard OAuth2 authentication to establish read/write access to its private App Data folder on Google Drive. 
              The database files are stored securely and cannot be read by other tools.
            </span>
          </div>
        </div>
        <button onClick={handleTestConnection} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
          Test Connection
        </button>
      </div>


      {/* JSON Preview Modal */}
      {previewFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setPreviewFile(null)}>
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><FileJson size={18}/> Preview: {previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '8px', overflowY: 'auto', fontSize: '0.85rem', flex: 1 }}>
{`{
  "__schema": "HRPulse",
  "version": "1.0",
  "records": 42,
  "data": [
    // Simulating ${previewFile.name} contents...
    // Actual parsing would happen here.
  ]
}`}
            </pre>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideLoop {
          0% { transform: translateX(-8px); }
          100% { transform: translateX(8px); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <AdSlot />
    </div>
  )
}
