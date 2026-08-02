import { useState, useEffect } from 'react'
import Icon from "@/components/ui/Icon.jsx"
import { Card, CardContent } from "@/components/ui/card"
import { useConfirm } from '../hooks/useConfirm'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import AdSlot from './AdSlot'
import { clearLocalCache } from '../services/db.js'
import { createBackup, listBackups, restoreBackup } from '../services/googleDrive.js'
import { formatDateTime } from '../services/date.js'

export default function DriveSync({ user, driveConnected, setDriveConnected, addLog, addToast }) {
  const [isClearing, setIsClearing] = useState(false)

  const { confirm, ConfirmDialog } = useConfirm()

  const [backupsList, setBackupsList] = useState([])
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedRestoreBackup, setSelectedRestoreBackup] = useState(null)

  useEffect(() => {
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
    <div className="animate-fade-in flex flex-col gap-6 sm:gap-8 lg:gap-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 headline-gradient">
          <Icon name="cloud_sync" size={20} className="text-foreground" />
          Drive Sync
        </h1>
      </div>
      <div className="border-t border-border border-headline" />

      {/* Connection Controller Card */}
      <Card className={`overflow-hidden ${driveConnected ? 'border-primary/40' : ''}`}>
        <div className="flex justify-between items-center flex-wrap gap-6 p-6 sm:p-8 lg:p-10">
          <div className="flex gap-5 items-center">
            <div className={`relative size-14 rounded-2xl flex items-center justify-center shadow-sm ${driveConnected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {driveConnected && (
                <>
                  <span className="absolute -top-1 -right-1 size-3 rounded-full bg-status-success animate-ping" />
                  <span className="absolute -top-1 -right-1 size-3 rounded-full bg-status-success" />
                </>
              )}
              {driveConnected ? <Icon name="bolt" size={28} /> : <Icon name="cloud_off" size={28} />}
            </div>
            <div role="status" aria-live="polite">
              <h3 className="text-xl flex items-center gap-2 text-foreground">
                {driveConnected ? 'Sync Tunnel Active' : 'Sync Tunnel Paused'}
              </h3>
              <div className="text-muted-foreground text-[0.85rem] mt-1">
                {driveConnected
                  ? 'Database tables are synced with the /HR-Pulse-DB/ folder on Google Drive.'
                  : 'Local database is working offline. Operations will be buffered until connection resumes.'}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              onClick={async () => {
                const ok = await confirm('Unsynced offline changes will be lost, and the app will reload.', 'Clear Local Cache?', { destructive: true, confirmText: 'Clear' })
                if (!ok) return
                setIsClearing(true)
                try {
                  await clearLocalCache()
                  window.location.reload()
                } catch(e) {
                  addLog('Cache Error', 'Failed to clear local cache', 'error')
                  setIsClearing(false)
                }
              }}
              disabled={isClearing}
              variant="outline"
              aria-label="Clear local cache and resync"
              className="border-destructive/40 text-destructive hover:text-destructive font-semibold"
            >
              <Icon name="delete" size={16} />
              {isClearing ? 'Clearing...' : 'Clear Local Cache & Resync'}
            </Button>
            <Button
              onClick={handleToggleConnection}
              aria-label={driveConnected ? 'Pause cloud connection' : 'Establish cloud connection'}
              variant={driveConnected ? 'outline' : 'default'}
              className={driveConnected ? 'border-primary/40 text-primary font-semibold' : 'font-semibold'}
            >
              <Icon name="swap_horiz" size={16} />
              {driveConnected ? 'Pause Cloud Connection' : 'Establish Cloud Connection'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Database backup commands */}
        <Card className="flex flex-col">
          <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col h-full gap-5">
            <div>
              <h4 className="text-base text-foreground font-semibold mb-2">Manual Backup</h4>
              <p className="text-[0.8rem] text-muted-foreground">
                Create an immediate snapshot of the current state, combining all tables into a single JSON package in the `_backups` folder.
              </p>
            </div>

            <div className="flex gap-3 mt-auto">
              <Button
                aria-label="Create backup now"
                variant="default"
                className="flex-1 justify-center"
                onClick={handleCreateBackup}
                disabled={isBackingUp || !driveConnected}
              >
                <Icon name="download" size={16} /> {isBackingUp ? 'Creating Backup...' : 'Create Backup Now'}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

        {/* Backup Browser Widget */}
        <Card className="flex flex-col">
        <CardContent className="p-6 sm:p-8 lg:p-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-[1.1rem] font-bold flex items-center gap-2 text-foreground">
                <Icon name="shield" size={20} className="text-foreground" /> Database Backups (/_backups/)
              </h4>
              <p className="text-[0.8rem] text-muted-foreground mt-1">Automated backups are retained for 7 days + 4 weeks</p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div role="log" aria-live="polite" aria-label="Backup logs" className="hidden xl:block overflow-hidden border border-border rounded-lg mt-4">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="p-3">Backup Name</TableHead>
                  <TableHead className="p-3">Size</TableHead>
                  <TableHead className="p-3">Created Date</TableHead>
                  <TableHead className="p-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!Array.isArray(backupsList) || backupsList.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan="4" className="p-6 text-center text-muted-foreground">No backups found.</TableCell>
                  </TableRow>
                ) : backupsList.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="p-3 font-medium">
                      <span className="flex items-center gap-2">
                        <Icon name="data_object" size={16} className="text-muted-foreground shrink-0" /> {f.name}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-[0.85rem] text-muted-foreground">
                      {f.size ? (parseInt(f.size) / 1024).toFixed(1) + ' KB' : 'Unknown'}
                    </TableCell>
                    <TableCell className="p-3 text-[0.85rem] text-muted-foreground">
                      {formatDateTime(f.modifiedTime)}
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          aria-label="Download backup"
                          variant="secondary"
                          size="xs"
                          onClick={() => window.open(`https://drive.google.com/uc?export=download&id=${f.id}`, '_blank')}
                          title="Download Backup"
                        >
                          <Icon name="download" size={14} />
                        </Button>
                        <Button
                          aria-label="Restore from this backup"
                          variant="default"
                          size="xs"
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => setSelectedRestoreBackup(f)}
                          title="Restore from this backup"
                        >
                          <Icon name="restart_alt" size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div role="log" aria-live="polite" aria-label="Backup logs" className="xl:hidden flex flex-col gap-4 mt-4">
            {(!Array.isArray(backupsList) || backupsList.length === 0) ? (
              <div className="text-center text-muted-foreground py-8 border border-border rounded-lg border-dashed">No backups found.</div>
            ) : backupsList.map(f => (
              <div key={`${f.id}-mobile`} className="flex flex-col gap-3 p-4 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="data_object" size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground break-words">{f.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                      <span>Size: {f.size ? (parseInt(f.size) / 1024).toFixed(1) + ' KB' : 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDateTime(f.modifiedTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-1">
                  <Button
                    aria-label="Download backup"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`https://drive.google.com/uc?export=download&id=${f.id}`, '_blank')}
                  >
                    <Icon name="download" size={14} className="mr-2" /> Download
                  </Button>
                  <Button
                    aria-label="Restore from this backup"
                    variant="default"
                    size="sm"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => setSelectedRestoreBackup(f)}
                  >
                    <Icon name="restart_alt" size={14} className="mr-2" /> Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Modal */}
      <Dialog open={!!selectedRestoreBackup} onOpenChange={(open) => { if (!open) setSelectedRestoreBackup(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <Icon name="error" size={24} /> Confirm Restore
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">You are about to restore the database from:</p>
            <div className="p-3 rounded-lg bg-muted font-mono text-sm text-foreground">
              {selectedRestoreBackup?.name}
            </div>
            <p className="text-sm text-destructive font-medium">
              WARNING: This will completely overwrite your current active database tables and cannot be undone. Unsynced offline changes will be permanently lost.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedRestoreBackup(null)} disabled={isRestoring}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteRestore}
              disabled={isRestoring}
            >
              {isRestoring ? 'Restoring...' : 'Yes, Overwrite Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
      <AdSlot />
    </div>
  )
}
