import { useState, useEffect } from 'react'
import { HardDrive, CloudOff, CloudLightning, ArrowLeftRight, Download, UploadCloud, Info, FileJson, Check, AlertCircle, RefreshCw, Eye, X } from 'lucide-react'

const mockFiles = [
  { id: '1', name: 'employees.json', size: '42.5 KB', modified: '2026-07-18T04:30:00Z' },
  { id: '2', name: 'attendance.json', size: '128.1 KB', modified: '2026-07-18T04:45:00Z' },
  { id: '3', name: 'payroll_history.json', size: '56.2 KB', modified: '2026-07-18T04:15:00Z' },
  { id: '4', name: 'settings.json', size: '2.1 KB', modified: '2026-07-17T10:00:00Z' }
]

export default function DriveSync({ driveConnected, setDriveConnected, syncLogs, addLog, employees }) {
  const [isBackupSimulating, setIsBackupSimulating] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({ employees: true, attendance: true, settings: true, payroll: true })
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [importError, setImportError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [timeSinceSync, setTimeSinceSync] = useState(2)
  const [timeUntilSync, setTimeUntilSync] = useState(13)
  const [previewFile, setPreviewFile] = useState(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSinceSync(prev => prev < 15 ? prev + 1 : 0)
      setTimeUntilSync(prev => prev > 0 ? prev - 1 : 15)
    }, 60000)
    return () => clearInterval(timer)
  }, [])
  
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
    setToastMessage('Pinging Google Drive API...')
    setTimeout(() => {
      setToastMessage('✅ Success: Read/Write access verified in /HR-Pulse-DB/')
      setTimeout(() => setToastMessage(''), 4000)
    }, 1000)
  }

  const handleExecuteExport = () => {
    setIsBackupSimulating(true)
    setExportProgress(10)
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsBackupSimulating(false)
            setExportModalOpen(false)
            setExportProgress(0)
            addLog('Manual Database Backup Created', 'Exported selected schemas to backup.json', 'success')
            
            const element = document.createElement("a")
            const file = new Blob([JSON.stringify(employees || [], null, 2)], {type: 'application/json'})
            element.href = URL.createObjectURL(file)
            element.download = "hr_pulse_backup.json"
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)
          }, 500)
          return 100
        }
        return prev + 25
      })
    }, 400)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    validateAndImport(file)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    validateAndImport(file)
  }

  const validateAndImport = (file) => {
    if (!file) return
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setImportError('Invalid file type. Please upload a JSON file.')
      return
    }
    setImportError('')
    setImportProgress(10)
    
    // Simulate parsing and validation
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setImportProgress(0)
            setImportModalOpen(false)
            setToastMessage('✅ Database successfully imported and synced.')
            setTimeout(() => setToastMessage(''), 4000)
            addLog('Database Restored', `Imported schema from ${file.name}`)
          }, 600)
          return 100
        }
        return prev + 30
      })
    }, 300)
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
          padding: '16px 24px',
          borderRadius: '12px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          animation: 'modalFadeIn 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px', fontWeight: 700 }}>Google Drive Sync Management</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configure connection channels, download database states, or force folder sync audits.</p>
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

        <button 
          onClick={handleToggleConnection}
          className={`btn ${driveConnected ? 'btn-secondary' : 'btn-primary'}`}
          style={{
            borderColor: driveConnected ? 'var(--accent-danger)' : 'transparent',
            color: driveConnected ? 'var(--accent-danger)' : '#fff',
            fontWeight: 600
          }}
        >
          {driveConnected ? 'Pause Cloud Connection' : 'Establish Cloud Connection'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Sync Mechanism Diagram */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Data Synchronization Flow</h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%', justifyContent: 'center', padding: '20px 0' }}>
            <div style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <HardDrive size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 8px' }} />
              <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>Local Cache</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{driveConnected ? '0 pending uploads' : '4 records pending'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '80px' }}>
              <ArrowLeftRight size={24} style={{ 
                color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)',
                animation: driveConnected ? 'slideLoop 1.5s ease-in-out infinite alternate' : 'none'
              }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                {driveConnected ? 'Active' : 'Offline'}
              </span>
            </div>

            <div style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <CloudLightning size={32} style={{ color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)', margin: '0 auto 8px' }} />
              <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>Drive DB</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{driveConnected ? 'Up to date' : 'Waiting for sync'}</span>
            </div>
          </div>
        </div>

        {/* Database backup commands */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Manual Backup & Schema Imports</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Export your employee records and configuration settings into a raw JSON package, or restore an offline JSON state.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, justifyContent: 'center' }} 
              onClick={() => setExportModalOpen(true)}
            >
              <Download size={16} /> Export DB
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setImportModalOpen(true)}
            >
              <UploadCloud size={16} /> Import DB
            </button>
          </div>
        </div>
      </div>

      {/* File Browser Widget */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileJson size={20} style={{ color: 'var(--accent-primary)' }}/> Drive Files (/HR-Pulse-DB/)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Using 1.2 MB of Google Drive storage</p>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <th style={{ padding: '12px' }}>File Name</th>
                <th style={{ padding: '12px' }}>Size</th>
                <th style={{ padding: '12px' }}>Last Modified</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockFiles.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileJson size={16} style={{ color: 'var(--text-muted)' }} /> {f.name}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.size}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(f.modified).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setPreviewFile(f)}
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                      title="Preview JSON"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Export Modal */}
      {exportModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', animation: 'modalFadeIn 200ms ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 700 }}>Export Database</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Select the schemas you want to include in the JSON backup.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {Object.keys(exportOptions).map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={exportOptions[key]} 
                    onChange={() => setExportOptions(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{key.replace('_', ' ')} Data</span>
                </label>
              ))}
            </div>

            {exportProgress > 0 && (
              <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ width: `${exportProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setExportModalOpen(false)} className="btn btn-secondary" disabled={isBackupSimulating}>Cancel</button>
              <button onClick={handleExecuteExport} className="btn btn-primary" disabled={isBackupSimulating}>
                {isBackupSimulating ? 'Exporting...' : 'Start Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '450px', animation: 'modalFadeIn 200ms ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 700 }}>Import Database</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Upload a valid HR Pulse JSON backup file. This will overwrite local cache.</p>
            
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0,0,0,0.02)',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                transition: 'all 0.2s',
                marginBottom: '24px',
                position: 'relative'
              }}
            >
              <UploadCloud size={32} style={{ color: dragActive ? 'var(--accent-primary)' : 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Drag and drop JSON file here</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>or click to browse</p>
              <input 
                type="file" 
                accept=".json,application/json" 
                onChange={handleFileInput}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
            </div>

            {importError && <div style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14}/> {importError}</div>}

            {importProgress > 0 && (
              <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ width: `${importProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => {setImportModalOpen(false); setImportError('')}} className="btn btn-secondary" disabled={importProgress > 0}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
