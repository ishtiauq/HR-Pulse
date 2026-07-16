import { useState } from 'react'
import { HardDrive, CloudOff, CloudLightning, ArrowLeftRight, Download, UploadCloud, Info } from 'lucide-react'

export default function DriveSync({ driveConnected, setDriveConnected, syncLogs, addLog, employees }) {
  const [isBackupSimulating, setIsBackupSimulating] = useState(false)
  
  const handleToggleConnection = () => {
    const nextState = !driveConnected
    setDriveConnected(nextState)
    if (nextState) {
      addLog('Google Drive Connection Restored', 'Re-established sync tunnel with /HR-Pulse-DB/')
    } else {
      addLog('Google Drive Connection Paused', 'Local storage offline, cloud sync suspended', 'warning')
    }
  }

  const handleSimulateBackup = () => {
    setIsBackupSimulating(true)
    setTimeout(() => {
      setIsBackupSimulating(false)
      addLog('Manual Database Backup Created', 'Exported full schema state to hr_pulse_db_backup.json', 'success')
      // Export live React state employees data
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(employees || [], null, 2)], {type: 'application/json'});
      element.href = URL.createObjectURL(file);
      element.download = "hr_pulse_db_backup.json";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200)
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
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
            boxShadow: driveConnected ? '0 4px 20px rgba(16, 185, 129, 0.2)' : 'none'
          }}>
            {driveConnected ? <CloudLightning size={28} /> : <CloudOff size={28} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {driveConnected ? 'Sync Tunnel Active' : 'Sync Tunnel Paused'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {driveConnected 
                ? 'App database maps records directly to your Google Drive App Folder: /HR-Pulse-DB/'
                : 'Local database is working offline. Operations will be buffered until connection resumes.'
              }
            </p>
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

      {/* Architecture diagram mapping */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        alignItems: 'stretch',
        flexWrap: 'wrap'
      }}>
        {/* Sync Mechanism Diagram */}
        <div className="glass-card" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px'
        }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', width: '100%', textAlign: 'left' }}>Data Synchronization Flow</h4>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            width: '100%',
            justifyContent: 'center',
            padding: '20px 0'
          }}>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              width: '110px'
            }}>
              <HardDrive size={32} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
              <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>HR Pulse App</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Local Cache</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <ArrowLeftRight size={20} style={{ 
                color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)',
                animation: driveConnected ? 'slideLoop 2s infinite' : 'none'
              }} />
              <span style={{
                fontSize: '0.7rem', 
                fontWeight: 500,
                color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)'
              }}>{driveConnected ? 'Auto-Sync Active' : 'Sync Offline'}</span>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              width: '110px'
            }}>
              <CloudLightning size={32} style={{ color: driveConnected ? 'var(--accent-success)' : 'var(--text-muted)', marginBottom: '8px' }} />
              <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>Google Drive</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>App-Folder DB</span>
            </div>
          </div>
        </div>

        {/* Database backup commands */}
        <div className="glass-card" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Manual Backup & Schema Imports</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Export your employee records and configuration settings into a raw JSON package, or restore an offline JSON state.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, justifyContent: 'center' }} 
              onClick={handleSimulateBackup}
              disabled={isBackupSimulating}
            >
              <Download size={16} />
              {isBackupSimulating ? 'Generating...' : 'Export DB'}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => alert("Simulated: Drag and Drop your backup.json here to restore.")}
            >
              <UploadCloud size={16} />
              Import DB
            </button>
          </div>
        </div>
      </div>

      {/* Info Warning Alert */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        alignItems: 'start'
      }}>
        <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Authentication Note</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            This application uses standard OAuth2 authentication to establish read/write access to its private App Data folder on Google Drive. 
            The database files (`employees.json`, `attendance.json`) are stored securely inside your private cloud storage and cannot be read by other tools.
          </span>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideLoop {
          0% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          100% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  )
}
