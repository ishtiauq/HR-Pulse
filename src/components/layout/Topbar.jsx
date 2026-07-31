import { Monitor, Sun, Moon, Menu, Bell, UserRound } from 'lucide-react'
import { Button } from "@/components/ui/button"
import hrPulseLogo from '../../Assets/Logo Banner.svg'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
export default function Topbar({ isDarkMode, toggleSidebar, themeMode, toggleTheme, handleSync, isSyncing, driveConnected, syncConflicts, setShowNotifications, markNotificationsRead, unreadCount, showNotifications, notifications = [], clearNotifications, onProfileClick, showThemeToggle = true }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const buttonRef = useRef(null)
  const [modalPos, setModalPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (showNotifications && !isMobile && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setModalPos({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right
      })
    }
  }, [showNotifications, isMobile])

  return (
    <>
      {/* Mobile: Liquid Glass Top Bar */}
      {isMobile ? (
        <header aria-label="Top bar" className="topbar topbar-bar w-full h-14 px-4 flex items-center justify-between text-foreground transition-all duration-300">
          <div className="flex items-center shrink-0">
            <img 
              src={hrPulseLogo} 
              alt="HR Pulse Logo" 
              className="h-9 w-auto max-w-[160px] object-contain shrink-0 drop-shadow-sm dark:invert" 
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onProfileClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onProfileClick}
                title="Profile"
                aria-label="Profile"
                className="rounded-full size-10 sm:size-11 text-foreground hover:bg-muted shrink-0"
              >
                <UserRound size={22} />
              </Button>
            )}
            {showThemeToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={`Theme: ${themeMode}`}
                aria-label="Toggle theme"
                className="rounded-full size-10 sm:size-11 text-foreground hover:bg-muted shrink-0"
              >
                {themeMode === 'light' ? <Sun size={22} /> : <Moon size={22} />}
              </Button>
            )}
          </div>
        </header>
      ) : (
        <header aria-label="Top bar" className="topbar w-[98%] min-[400px]:w-[94%] sm:w-[85%] max-w-3xl mx-auto h-14 sm:h-16 px-2 min-[400px]:px-4 flex items-center justify-between rounded-full bg-background/50 backdrop-blur-lg saturate-150 text-foreground border border-border/50 shadow-sm transition-all duration-300">
          
          {/* Left Section: Brand Pill */}
          <div className="flex items-center gap-1 min-[400px]:gap-3 sm:gap-4 shrink-0">


            <div className="flex items-center px-2 min-[400px]:px-3 py-1 sm:py-1.5 rounded-xl bg-transparent border-transparent">
              <img 
                src={hrPulseLogo} 
                alt="HR Pulse Logo" 
                className="h-8 sm:h-10 w-auto max-w-[140px] sm:max-w-[180px] object-contain shrink-0 drop-shadow-sm dark:invert" 
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
              <span className={`w-2 h-2 min-w-[8px] min-h-[8px] block rounded-full shrink-0 ${isSyncing ? 'bg-status-warning animate-spin' : (!driveConnected || syncConflicts.length > 0) ? 'bg-status-error animate-pulse' : 'bg-status-success animate-pulse'}`}></span>
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : (!driveConnected || syncConflicts.length > 0) ? 'Not Synced' : 'Synced'}</span>
            </Button>

            {/* Theme Toggle Button */}
            {showThemeToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={`Theme: ${themeMode}`}
                className="rounded-full size-8 min-[400px]:size-9 sm:size-10 text-foreground hover:bg-muted shrink-0"
              >
                {themeMode === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            )}

            {/* Notifications Button (Desktop) */}
            <div className="relative">
              <Button
                ref={buttonRef}
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
            </div>

          </div>
        </header>
      )}

      {/* Mobile Notifications Dialog */}
      {showNotifications && isMobile && (
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
          <DialogContent className="sm:max-w-[425px] p-0">
            <DialogHeader className="p-4 px-6 border-b border-border bg-muted/30 pb-4">
              <div className="flex justify-between items-center w-full">
                <DialogTitle className="text-sm">Notifications</DialogTitle>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {notifications.length} Total
                </Badge>
              </div>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground italic">No new notifications</div>
              ) : (
                notifications.map(n => (
                  <div role="listitem" key={n.id} className="p-3 px-4 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer my-1 border border-transparent hover:border-border/50">
                    <p className="text-sm m-0 leading-relaxed text-foreground" style={{ fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                    <span className="text-[11px] font-medium block mt-1.5 text-muted-foreground">{n.time}</span>
                  </div>
                ))
              )}
            </div>
            <DialogFooter className="p-3 px-6 bg-muted/10 pb-3">
              <div className="flex justify-between items-center w-full">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); if(clearNotifications) clearNotifications(); }} 
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }} 
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Notifications Portal */}
      {showNotifications && !isMobile && createPortal(
        <>
          {/* Click-away overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="fixed flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/95 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 p-0 z-50"
            style={{ top: `${modalPos.top}px`, right: `${modalPos.right}px`, width: '380px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-primary z-10" />
            <div className="p-4 px-6 flex justify-between items-center border-b border-border/50 bg-muted/20 relative z-20">
              <h2 className="text-lg font-extrabold tracking-tight text-foreground leading-none">Notifications</h2>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {notifications.length} Total
              </Badge>
            </div>
            <div className="max-h-[350px] overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground italic">No new notifications</div>
              ) : (
                notifications.map(n => (
                  <div role="listitem" key={n.id} className="p-3 px-4 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer my-1 border border-transparent hover:border-border/50">
                    <p className="text-sm m-0 leading-relaxed text-foreground" style={{ fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                    <span className="text-[11px] font-medium block mt-1.5 text-muted-foreground">{n.time}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 px-6 border-t border-border/50 mt-2 shrink-0 pb-4 bg-muted/5 relative z-20">
              <div className="flex justify-between items-center w-full">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); if(clearNotifications) clearNotifications(); }} 
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }} 
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
