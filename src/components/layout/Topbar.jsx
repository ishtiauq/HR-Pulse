import { Monitor, Sun, Moon, Menu, Bell, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Topbar({ isDarkMode, toggleSidebar, themeMode, toggleTheme, handleSync, isSyncing, driveConnected, syncConflicts, notifications, showNotifications, setShowNotifications, markNotificationsRead, unreadCount }) {
  return (
    <header aria-label="Top bar" className="topbar w-[94%] sm:w-[85%] max-w-3xl mx-auto h-14 sm:h-16 px-4 flex items-center justify-between rounded-full bg-card/90 text-card-foreground backdrop-blur-xl border border-border shadow-md transition-all duration-300">
      
      {/* Left Section: Mobile Menu + Brand Pill */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          aria-label="Open menu"
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0 rounded-full size-10"
          onClick={toggleSidebar}
        >
          <Menu size={22} />
        </Button>

        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-muted/40 border border-border/50">
          <div className="size-8 sm:size-9 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground font-black text-xs sm:text-sm tracking-wider shadow-sm">
            HP
          </div>
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-foreground whitespace-nowrap">
            HR Pulse
          </span>
        </div>
      </div>

      {/* Right Section: Sync Badge + Theme Toggle + Notification Trigger */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Sync Status Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-8 sm:h-9 rounded-full px-3.5 sm:px-4 text-xs font-semibold gap-2 shrink-0"
        >
          <span className={`size-2 rounded-full inline-block ${isSyncing ? 'bg-amber-500 animate-spin' : (!driveConnected || syncConflicts.length > 0) ? 'bg-destructive' : 'bg-emerald-500'}`}></span>
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : (!driveConnected || syncConflicts.length > 0) ? 'Not Synced' : 'Synced'}</span>
        </Button>

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Theme: ${themeMode}`}
          className="rounded-full size-9 sm:size-10 text-foreground hover:bg-muted"
        >
          {themeMode === 'system' ? <Monitor size={20} /> : themeMode === 'light' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead() }}
            className="rounded-full size-9 sm:size-10 text-foreground hover:bg-muted relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full size-3 bg-destructive"></span>
              </span>
            )}
          </Button>

          {showNotifications && (
            <div role="dialog" aria-label="Notifications" className="absolute top-full right-0 mt-2.5 w-[300px] sm:w-[340px] rounded-2xl z-50 overflow-hidden bg-popover text-popover-foreground border border-border shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 p-0">
              <div className="p-3.5 px-4 flex justify-between items-center border-b border-border bg-muted/30">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground m-0">Notifications</h3>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {notifications.length} Total
                </Badge>
              </div>
              <div className="max-h-[280px] overflow-y-auto p-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground italic">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div role="listitem" key={n.id} className="p-3 px-3.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer my-0.5">
                      <p className="text-xs m-0 leading-relaxed text-foreground" style={{ fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                      <span className="text-[10px] font-medium block mt-1 text-muted-foreground">{n.time}</span>
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
