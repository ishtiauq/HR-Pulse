import { Monitor, Sun, Moon, Menu } from 'lucide-react'

export default function Topbar({ isDarkMode, toggleSidebar, themeMode, toggleTheme, handleSync, isSyncing, driveConnected, syncConflicts, notifications, showNotifications, setShowNotifications, markNotificationsRead, unreadCount }) {
  return (
    <header aria-label="Top bar" className="macos-toolbar topbar h-14 min-h-14 flex items-center justify-between px-5 sticky top-0 shrink-0 mx-auto w-full max-w-[700px] rounded-full z-10" style={{
      background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(30px) saturate(150%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div className="left flex items-center gap-4">
        <button aria-label="Open menu" className="mobile-menu-btn size-8 hidden items-center justify-center bg-transparent border-0 rounded-md cursor-pointer" onClick={toggleSidebar} style={{
          color: 'var(--md-bw-on-surface-variant)'
        }}>
          <Menu size={18} />
        </button>

        <div className="brand-container flex items-center gap-2">
          <div className="size-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--md-bw-primary)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--md-bw-on-primary)' }}>HP</span>
          </div>
          <span className="brand-text text-lg font-bold leading-6 tracking-[-0.01em] whitespace-nowrap" style={{ color: 'var(--md-bw-on-surface)' }}>
            HR Pulse
          </span>
        </div>
      </div>
      <div className="right flex items-center gap-4 ml-8">
        <button aria-label="Sync status" aria-pressed={isSyncing} className="sync-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium leading-3.5 cursor-pointer" onClick={handleSync} disabled={isSyncing} style={{
          background: isSyncing ? 'rgba(255, 159, 10, 0.12)' : (!driveConnected || syncConflicts.length > 0) ? 'rgba(224, 32, 20, 0.1)' : 'rgba(52, 199, 89, 0.1)',
          border: isSyncing ? '1px solid rgba(255, 159, 10, 0.3)' : (!driveConnected || syncConflicts.length > 0) ? '1px solid rgba(224, 32, 20, 0.25)' : '1px solid rgba(52, 199, 89, 0.3)',
          color: isSyncing ? '#b8860b' : (!driveConnected || syncConflicts.length > 0) ? 'var(--md-bw-error)' : '#1a7d3a',
        }}>
          <span className={`sync-dot ${isSyncing ? 'sync-spin' : (!driveConnected || syncConflicts.length > 0) ? '' : 'sync-blink'} size-1.5 rounded-full inline-block`} style={{
            background: isSyncing ? '#ff9f0a' : (!driveConnected || syncConflicts.length > 0) ? '#dc3545' : '#34c759'
          }}></span>
          {isSyncing ? 'Syncing...' : (!driveConnected || syncConflicts.length > 0) ? 'Not Synced' : 'Synced'}
        </button>

        <button aria-label="Toggle theme" className="icon-btn size-8 flex items-center justify-center bg-transparent border-0 rounded-md cursor-pointer" onClick={toggleTheme} title={`Theme: ${themeMode}`} style={{ color: 'var(--md-bw-on-surface-variant)' }}>
          {themeMode === 'system' ? <Monitor size={18} /> : themeMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative">
          <button aria-label="Notifications" aria-expanded={showNotifications} className="icon-btn size-8 flex items-center justify-center bg-transparent border-0 rounded-md cursor-pointer relative" onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead() }} style={{ color: 'var(--md-bw-on-surface-variant)' }}>
            <svg className={unreadCount > 0 ? 'bell-ring' : ''} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            {unreadCount > 0 && <span aria-live="polite" aria-atomic="true" className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div role="dialog" aria-label="Notifications" className="macos-card absolute top-full right-0 mt-2 w-[320px] rounded-2xl z-30 overflow-hidden" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
            }}>
              <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <h3 className="text-base font-bold m-0" style={{ color: 'var(--md-bw-on-surface)' }}>Notifications</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm" style={{ color: 'var(--md-bw-on-surface-variant)' }}>No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div role="listitem" key={n.id} className="px-4 py-3" style={{
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      background: n.read ? 'transparent' : 'rgba(0,0,0,0.03)'
                    }}>
                      <p className="text-sm m-0 leading-[1.4]" style={{ color: 'var(--md-bw-on-surface)', fontWeight: n.read ? 400 : 500 }}>{n.text}</p>
                      <span className="text-xs block mt-1" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{n.time}</span>
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
