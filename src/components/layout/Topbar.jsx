import { Monitor, Sun, Moon, Menu } from 'lucide-react'

export default function Topbar({ isDarkMode, toggleSidebar, themeMode, toggleTheme, handleSync, isSyncing, driveConnected, syncConflicts, notifications, showNotifications, setShowNotifications, markNotificationsRead, unreadCount }) {
  return (
    <header className="macos-toolbar topbar" style={{ 
      height: '56px', minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '0 20px', position: 'sticky', top: '0', zIndex: 15, flexShrink: 0,
      margin: '0 auto', width: '100%', maxWidth: '700px', borderRadius: '100px',
      background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(30px) saturate(150%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="mobile-menu-btn" onClick={toggleSidebar} style={{
          width: '32px', height: '32px', display: 'none', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer',
          color: 'var(--md-bw-on-surface-variant)'
        }}>
          <Menu size={18} />
        </button>
        
        <div className="brand-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', background: 'var(--md-bw-primary)', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <span style={{ color: 'var(--md-bw-on-primary)', font: "700 12px 'Roboto'" }}>HP</span>
          </div>
          <span className="brand-text" style={{ font: "700 18px/24px 'Roboto'", color: 'var(--md-bw-on-surface)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            HR Pulse
          </span>
        </div>
      </div>
      <div className="right" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '32px' }}>
        <button className="sync-btn" onClick={handleSync} disabled={isSyncing} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
          background: isSyncing ? 'rgba(255, 159, 10, 0.12)' : (!driveConnected || syncConflicts.length > 0) ? 'rgba(224, 32, 20, 0.1)' : 'rgba(52, 199, 89, 0.1)',
          border: isSyncing ? '1px solid rgba(255, 159, 10, 0.3)' : (!driveConnected || syncConflicts.length > 0) ? '1px solid rgba(224, 32, 20, 0.25)' : '1px solid rgba(52, 199, 89, 0.3)',
          borderRadius: '8px', cursor: 'pointer', font: "500 11px/14px 'Roboto'",
          color: isSyncing ? '#b8860b' : (!driveConnected || syncConflicts.length > 0) ? 'var(--md-bw-error)' : '#1a7d3a',
        }}>
          <span className={`sync-dot ${isSyncing ? 'sync-spin' : (!driveConnected || syncConflicts.length > 0) ? '' : 'sync-blink'}`} style={{
            width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
            background: isSyncing ? '#ff9f0a' : (!driveConnected || syncConflicts.length > 0) ? '#dc3545' : '#34c759'
          }}></span>
          {isSyncing ? 'Syncing...' : (!driveConnected || syncConflicts.length > 0) ? 'Not Synced' : 'Synced'}
        </button>
        
        <button className="icon-btn" onClick={toggleTheme} title={`Theme: ${themeMode}`} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--md-bw-on-surface-variant)', cursor: 'pointer' }}>
          {themeMode === 'system' ? <Monitor size={18} /> : themeMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead() }} style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--md-bw-on-surface-variant)', cursor: 'pointer' }}>
            <svg className={unreadCount > 0 ? 'bell-ring' : ''} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div className="macos-card" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              width: '320px',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
              zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--md-bw-on-surface)' }}>Notifications</h3>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--md-bw-on-surface-variant)', fontSize: '14px' }}>No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                      background: n.read ? 'transparent' : 'rgba(0,0,0,0.03)'
                    }}>
                      <p style={{ fontSize: '14px', color: 'var(--md-bw-on-surface)', margin: 0, fontWeight: n.read ? 400 : 500, lineHeight: 1.4 }}>{n.text}</p>
                      <span style={{ fontSize: '12px', color: 'var(--md-bw-on-surface-variant)', marginTop: '4px', display: 'block' }}>{n.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}