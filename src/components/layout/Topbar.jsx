import Icon from "@/components/ui/Icon.jsx"
import { Button } from "@/components/ui/button"
import kormiisLogo from '../../Assets/Kormiis Logo Final.svg'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
export default function Topbar({ isDarkMode, toggleSidebar, themeMode, toggleTheme, handleSync, isSyncing, driveConnected, syncConflicts, dataIntegrityIssues = [], showCorruptionModal, setShowCorruptionModal, handleAutoRepairDatabase, setShowNotifications, markNotificationsRead, unreadCount, showNotifications, notifications = [], clearNotifications, onProfileClick, showThemeToggle = true, user, setCurrentView }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const buttonRef = useRef(null)
  const [modalPos, setModalPos] = useState({ top: 0, right: 0 })
  const [showSyncErrorModal, setShowSyncErrorModal] = useState(false)
  const [notificationTab, setNotificationTab] = useState('all')
  const filteredNotifications = notificationTab === 'unread' ? notifications.filter(n => !n.read) : notifications


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
              src={kormiisLogo} 
              alt="Kormiis Logo" 
              className={`block h-9 w-auto max-w-[160px] object-contain shrink-0 drop-shadow-sm ${isDarkMode ? 'invert' : ''}`} 
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onProfileClick && (
              <button
                onClick={onProfileClick}
                title="Profile"
                aria-label="Profile"
                className="rounded-full size-10 sm:size-11 p-0 overflow-hidden shrink-0 !border-transparent cursor-pointer bg-transparent hover:opacity-80 transition-opacity"
              >
                <img
                  src={user?.avatar || "https://i.pravatar.cc/150?u=a042581f4e29026704d"}
                  alt={user?.name ? `${user.name}'s profile` : "Profile"}
                  className="w-full h-full object-cover rounded-full border border-border/50 shadow-sm"
                />
              </button>
            )}
          </div>
        </header>
      ) : (
        <header aria-label="Top bar" className="topbar w-[98%] min-[400px]:w-[94%] sm:w-[85%] max-w-3xl mx-auto h-14 sm:h-16 px-2 min-[400px]:px-4 flex items-center justify-between rounded-full bg-background text-foreground border border-border shadow-sm transition-all duration-300">
          
          {/* Left Section: Brand Pill */}
          <div className="flex items-center gap-1 min-[400px]:gap-3 sm:gap-4 shrink-0">


            <div className="flex items-center px-2 min-[400px]:px-3 py-1 sm:py-1.5 rounded-xl bg-transparent border-transparent">
              <img 
                src={kormiisLogo} 
                alt="Kormiis Logo" 
                className={`h-8 sm:h-10 w-auto max-w-[140px] sm:max-w-[180px] object-contain shrink-0 drop-shadow-sm ${isDarkMode ? 'invert' : ''}`} 
              />
            </div>
          </div>

          {/* Right Section: Sync Badge + Theme Toggle + Notification Trigger */}
          <div className="flex items-center gap-0.5 min-[400px]:gap-2 sm:gap-3 shrink-0">
            
            {/* Sync Status Button */}
            <Button
              variant="outline"
              onClick={() => {
                if (dataIntegrityIssues && dataIntegrityIssues.length > 0) {
                  if (setShowCorruptionModal) setShowCorruptionModal(true)
                } else if (!driveConnected || (syncConflicts && syncConflicts.length > 0)) {
                  setShowSyncErrorModal(true)
                } else {
                  if (handleSync) handleSync()
                }
              }}
              disabled={isSyncing}
              className="h-8 w-8 p-0 sm:w-auto sm:h-9 sm:px-4 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold gap-1.5 sm:gap-2 shrink-0"
            >
              <span className={`w-2 h-2 min-w-[8px] min-h-[8px] block rounded-full shrink-0 ${isSyncing ? 'bg-status-warning animate-spin' : (!driveConnected || syncConflicts.length > 0 || dataIntegrityIssues.length > 0) ? 'bg-status-error animate-pulse' : 'bg-status-success animate-pulse'}`}></span>
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : (!driveConnected || syncConflicts.length > 0 || dataIntegrityIssues.length > 0) ? (dataIntegrityIssues.length > 0 ? 'Data Error' : 'Not Synced') : 'Synced'}</span>
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
                {themeMode === 'light' ? <Icon name="light_mode" size={20} /> : <Icon name="dark_mode" size={20} />}
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
                <Icon name="notifications_active" size={20} />
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
            <DialogHeader className="p-4 px-6 border-b border-border/50 bg-muted/20 pb-3">
              <div className="flex justify-between items-center w-full">
                <DialogTitle className="text-lg font-extrabold tracking-tight text-foreground leading-none">Notifications</DialogTitle>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {filteredNotifications.length} Total
                </Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant={notificationTab === 'all' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setNotificationTab('all')}
                  className="h-7 text-xs rounded-full px-4"
                >
                  All
                </Button>
                <Button 
                  variant={notificationTab === 'unread' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setNotificationTab('unread')}
                  className="h-7 text-xs rounded-full px-4"
                >
                  Unread
                </Button>
              </div>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No new notifications</div>
              ) : (
                filteredNotifications.map(n => (
                  <div 
                    role="listitem" 
                    key={n.id} 
                    onClick={() => {
                      if (n.view && setCurrentView) {
                        setCurrentView(n.view);
                      }
                      if (markNotificationsRead) markNotificationsRead(n.id);
                      setShowNotifications(false);
                    }}
                    className={`p-3 px-4 rounded-xl transition-colors cursor-pointer my-1 border relative ${n.read ? 'bg-background hover:bg-muted/50 border-transparent opacity-70' : 'bg-primary/5 hover:bg-primary/10 border-primary/20 shadow-sm'}`}
                  >
                    {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />}
                    <p className={`text-sm m-0 leading-relaxed text-foreground ${!n.read ? 'pl-2 font-semibold' : 'font-medium'}`}>{n.text}</p>
                    <span className={`text-[11px] block mt-1.5 text-muted-foreground ${!n.read ? 'pl-2' : ''}`}>{n.time}</span>
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
            className="fixed flex flex-col overflow-hidden rounded-2xl border border-border bg-background text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 p-0 z-50"
            style={{ top: `${modalPos.top}px`, right: `${modalPos.right}px`, width: '380px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-primary z-10" />
            <div className="p-4 px-6 flex flex-col gap-4 border-b border-border/50 bg-muted/20 relative z-20">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-extrabold tracking-tight text-foreground leading-none">Notifications</h2>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {filteredNotifications.length} Total
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={notificationTab === 'all' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setNotificationTab('all')}
                  className="h-7 text-xs rounded-full px-4"
                >
                  All
                </Button>
                <Button 
                  variant={notificationTab === 'unread' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setNotificationTab('unread')}
                  className="h-7 text-xs rounded-full px-4"
                >
                  Unread
                </Button>
              </div>
            </div>
            <div className="max-h-[350px] overflow-y-auto p-2">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No new notifications</div>
              ) : (
                filteredNotifications.map(n => (
                  <div 
                    role="listitem" 
                    key={n.id} 
                    onClick={() => {
                      if (n.view && setCurrentView) {
                        setCurrentView(n.view);
                      }
                      if (markNotificationsRead) markNotificationsRead(n.id);
                      setShowNotifications(false);
                    }}
                    className={`p-3 px-4 rounded-xl transition-colors cursor-pointer my-1 border relative ${n.read ? 'bg-background hover:bg-muted/50 border-transparent opacity-70' : 'bg-primary/5 hover:bg-primary/10 border-primary/20 shadow-sm'}`}
                  >
                    {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />}
                    <p className={`text-sm m-0 leading-relaxed text-foreground ${!n.read ? 'pl-2 font-semibold' : 'font-medium'}`}>{n.text}</p>
                    <span className={`text-[11px] block mt-1.5 text-muted-foreground ${!n.read ? 'pl-2' : ''}`}>{n.time}</span>
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

      {/* Corruption / Data Integrity Modal */}
      {showCorruptionModal !== undefined && (
        <Dialog open={showCorruptionModal} onOpenChange={setShowCorruptionModal}>
          <DialogContent className="max-w-md bg-card border-destructive/20 shadow-2xl p-0 overflow-hidden sm:rounded-[24px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600 z-10" />
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2.5 text-foreground">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-destructive/10 text-destructive shrink-0">
                  <Icon name="warning" size={22} />
                </div>
                Data Integrity Issues
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-2">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                We found {dataIntegrityIssues?.length || 0} discrepancies in your data. Clicking <strong>Auto-Repair</strong> will automatically clean up orphaned records, fix incorrect values, and rebuild your local cache to match the cloud database.
              </p>
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 mb-4">
                {(dataIntegrityIssues || []).map((issue, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm text-foreground">
                    <Icon name="error_outline" size={16} className="text-destructive shrink-0 mt-0.5" />
                    <span className="leading-tight font-medium text-xs sm:text-sm">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="p-4 px-6 bg-muted/10 pb-6 flex justify-end gap-3 mt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => setShowCorruptionModal(false)} className="rounded-full font-semibold">
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => { if(handleAutoRepairDatabase) handleAutoRepairDatabase(); }} 
                disabled={isSyncing}
                className="rounded-full shadow-lg shadow-destructive/20 font-bold px-6"
              >
                {isSyncing ? 'Repairing...' : 'Auto-Repair Database'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Sync Disconnected Modal */}
      {showSyncErrorModal !== undefined && (
        <Dialog open={showSyncErrorModal} onOpenChange={setShowSyncErrorModal}>
          <DialogContent className="max-w-md bg-card border-warning/20 shadow-2xl p-0 overflow-hidden sm:rounded-[24px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-yellow-500 z-10" />
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2.5 text-foreground">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500 shrink-0">
                  <Icon name="cloud_off" size={22} />
                </div>
                Sync Disconnected
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-2">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The application has lost its connection to Google Drive. This usually happens if your session has expired, or if there's a temporary network issue.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Your recent changes have been saved locally, but they will not sync to the cloud until you reconnect.
              </p>
            </div>
            <DialogFooter className="p-4 px-6 bg-muted/10 pb-6 flex justify-end gap-3 mt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => setShowSyncErrorModal(false)} className="rounded-full font-semibold">
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={() => {
                  setShowSyncErrorModal(false);
                  if (handleSync) handleSync();
                }} 
                disabled={isSyncing}
                className="rounded-full shadow-lg font-bold px-6 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSyncing ? 'Retrying...' : 'Retry Sync'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
