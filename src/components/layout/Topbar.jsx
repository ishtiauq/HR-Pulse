import { Monitor, Sun, Moon, Menu } from 'lucide-react'

export default function Topbar({ isDarkMode, toggleSidebar, themeMode, toggleTheme, handleSync, isSyncing, driveConnected, syncConflicts, notifications, showNotifications, setShowNotifications, markNotificationsRead, unreadCount }) {
  return (
    <header aria-label="Top bar" className="macos-toolbar topbar h-16 min-h-16 flex items-center justify-between px-6 md:px-8 sticky top-0 shrink-0 w-full rounded-2xl z-10" style={{
      background: isDarkMode ? 'rgba(24, 24, 27, 0.75)' : 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(30px) saturate(150%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,0,0,0.06)'
    }}>
      <div className="left flex items-center gap-3 sm:gap-5">
        <button aria-label="Open menu" className="mobile-menu-btn size-10 flex lg:hidden items-center justify-center bg-[rgba(0,0,0,0.05)] border-0 rounded-xl cursor-pointer hover:bg-[rgba(0,0,0,0.08)] transition-colors" onClick={toggleSidebar} style={{
          color: 'var(--md-bw-on-surface)'
        }}>
          <Menu size={22} />
        </button>

        <div className="brand-container flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: '#007AFF' }}>
            <span className="text-xs font-black text-white tracking-wider">HP</span>
          </div>
          <span className="brand-text text-lg sm:text-xl font-extrabold leading-6 tracking-tight whitespace-nowrap" style={{ color: 'var(--md-bw-on-surface)' }}>
            HR Pulse
          </span>
        </div>
      </div>
      <div className="right flex items-center gap-4 sm:gap-6 ml-4 sm:ml-6">
        <button aria-label="Sync status" aria-pressed={isSyncing} className="sync-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold leading-3.5 cursor-pointer transition-all" onClick={handleSync} disabled={isSyncing} style={{
          background: isSyncing ? 'rgba(255, 159, 10, 0.12)' : (!driveConnected || syncConflicts.length > 0) ? 'rgba(224, 32, 20, 0.1)' : 'rgba(52, 199, 89, 0.12)',
          border: isSyncing ? '1px solid rgba(255, 159, 10, 0.3)' : (!driveConnected || syncConflicts.length > 0) ? '1px solid rgba(224, 32, 20, 0.25)' : '1px solid rgba(52, 199, 89, 0.3)',
          color: isSyncing ? '#b8860b' : (!driveConnected || syncConflicts.length > 0) ? 'var(--md-bw-error)' : '#1a7d3a',
        }}>
          <span className={`sync-dot ${isSyncing ? 'sync-spin' : (!driveConnected || syncConflicts.length > 0) ? '' : 'sync-blink'} size-2 rounded-full inline-block`} style={{
            background: isSyncing ? '#ff9f0a' : (!driveConnected || syncConflicts.length > 0) ? '#dc3545' : '#34c759'
          }}></span>
          {isSyncing ? 'Syncing...' : (!driveConnected || syncConflicts.length > 0) ? 'Not Synced' : 'Synced'}
        </button>

        <button aria-label="Toggle theme" className="icon-btn size-9 flex items-center justify-center bg-transparent border-0 rounded-lg cursor-pointer hover:bg-[rgba(0,0,0,0.04)] transition-colors" onClick={toggleTheme} title={`Theme: ${themeMode}`} style={{ color: 'var(--md-bw-on-surface-variant)' }}>
          {themeMode === 'system' ? <Monitor size={19} /> : themeMode === 'light' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <div className="relative">
          <button aria-label="Notifications" aria-expanded={showNotifications} className="icon-btn size-9 flex items-center justify-center bg-transparent border-0 rounded-lg cursor-pointer hover:bg-[rgba(0,0,0,0.04)] transition-colors relative" onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead() }} style={{ color: 'var(--md-bw-on-surface-variant)' }}>
            <svg className={unreadCount > 0 ? 'bell-ring' : ''} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
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
