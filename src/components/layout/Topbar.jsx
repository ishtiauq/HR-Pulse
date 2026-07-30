import { Monitor, Sun, Moon, Menu, Bell } from 'lucide-react'
import { Button } from "@/components/ui/button"
import hrPulseLogo from '../../Assets/hr-pulse-logo.svg'

import { Badge } from "@/components/ui/badge"

export default function Topbar({ isDarkMode, toggleSidebar, themeMode, toggleTheme, handleSync, isSyncing, driveConnected, syncConflicts, setShowNotifications, markNotificationsRead, unreadCount, showNotifications, notifications = [], clearNotifications }) {
  return (
    <header aria-label="Top bar" className="topbar w-[98%] min-[400px]:w-[94%] sm:w-[85%] max-w-3xl mx-auto h-14 sm:h-16 px-2 min-[400px]:px-4 flex items-center justify-between rounded-full bg-background/50 backdrop-blur-lg saturate-150 text-foreground border border-border/50 shadow-sm transition-all duration-300 overflow-hidden">
      
      {/* Left Section: Mobile Menu + Brand Pill */}
      <div className="flex items-center gap-1 min-[400px]:gap-3 sm:gap-4 shrink-0">


        <div className="flex items-center px-2 min-[400px]:px-3 py-1 sm:py-1.5 rounded-xl bg-transparent border-transparent">
          <img 
            src={hrPulseLogo} 
            alt="HR Pulse Logo" 
            className="h-8 sm:h-10 w-auto max-w-[140px] sm:max-w-[180px] object-contain shrink-0 drop-shadow-sm" 
          />
        </div>
      </div>

      {/* Right Section: Sync Badge + Theme Toggle + Notification Trigger */}
      <div className="flex items-center gap-0.5 min-[400px]:gap-2 sm:gap-3 shrink-0">
        
        {/* Sync Status Button */}
        <Button
          variant="outline"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-8 w-8 p-0 sm:w-auto sm:h-9 sm:px-4 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold gap-1.5 sm:gap-2 shrink-0"
        >
          <span className={`size-2 rounded-full shrink-0 ${isSyncing ? 'bg-amber-500 animate-spin' : (!driveConnected || syncConflicts.length > 0) ? 'bg-destructive' : 'bg-emerald-500'}`}></span>
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : (!driveConnected || syncConflicts.length > 0) ? 'Not Synced' : 'Synced'}</span>
        </Button>

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Theme: ${themeMode}`}
          className="rounded-full size-8 min-[400px]:size-9 sm:size-10 text-foreground hover:bg-muted shrink-0"
        >
          {themeMode === 'light' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        {/* Notifications Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setShowNotifications(prev => !prev); markNotificationsRead() }}
            className="rounded-full size-8 min-[400px]:size-9 sm:size-10 text-foreground hover:bg-muted relative shrink-0"
            id="notification-trigger"
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
            <>
              {/* Click-away overlay */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
              />
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute top-[calc(100%+0.75rem)] right-0 w-[300px] sm:w-[340px] rounded-2xl z-50 overflow-hidden bg-popover text-popover-foreground border border-border shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 p-0"
                onClick={(e) => e.stopPropagation()}
              >
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
                <div className="p-2 px-3 border-t border-border bg-muted/10 flex justify-between items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); if(clearNotifications) clearNotifications(); }} 
                    className="text-xs h-7 text-muted-foreground hover:text-destructive"
                  >
                    Clear All
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }} 
                    className="text-xs h-7"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  )
}
