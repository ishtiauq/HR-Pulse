import { useState, useEffect } from 'react'
import { MapPin, Clock, ShieldCheck, ShieldAlert, Zap, Loader2, PartyPopper, CheckCircle2 } from 'lucide-react'
import { toLocal, parseMin, fmtH } from '../../services/attendance.js'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c); 
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

export default function GeoCheckInWidget({ currentUser, attendance, setAttendance, addToast, settings }) {
  const today = toLocal(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Use settings or fallback to default
  const officeLat = settings?.officeLocation?.lat ?? 23.8103
  const officeLng = settings?.officeLocation?.lng ?? 90.4125
  const maxDistance = settings?.officeLocation?.radius ?? 100
  
  const [userLocation, setUserLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [locError, setLocError] = useState(null)
  const [isLoadingLoc, setIsLoadingLoc] = useState(false)
  const [bypassGps, setBypassGps] = useState(false)
  
  // Success Message State
  const [successMsg, setSuccessMsg] = useState(null)
  
  // Ensure current user is valid
  const empId = currentUser?.employeeId || currentUser?.id
  const empName = currentUser?.name || 'Teammate'

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const logs = attendance?.dailyLogs?.[today] || {}
  const empLog = logs[empId] || { status: 'Absent', checkIn: '--', checkOut: '--', hours: '0.0' }

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  
  const canCheckIn = empId && empLog.checkIn === '--'
  const canCheckOut = empId && empLog.checkIn !== '--' && empLog.checkOut === '--'

  const showSuccessOverlay = (type, time, hoursWorked = null) => {
    setSuccessMsg({ type, time, hoursWorked })
    // Only auto-close if it's a Check-in
    if (type === 'Check-in') {
      setTimeout(() => {
        setSuccessMsg(null)
      }, 4000)
    }
  }

  const executeActionWithLocation = (actionCallback) => {
    if (bypassGps) {
      actionCallback();
      return;
    }

    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser')
      addToast?.('Geolocation is not supported by your browser', 'error')
      return
    }

    setIsLoadingLoc(true)
    setLocError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserLocation({ lat, lng })
        const dist = getDistanceFromLatLonInMeters(lat, lng, officeLat, officeLng)
        setDistance(dist)
        setIsLoadingLoc(false)
        
        if (dist <= maxDistance) {
          actionCallback();
        } else {
          setLocError(`You are ${dist}m away from the office (Max: ${maxDistance}m)`)
          addToast?.(`Check-in failed: You are ${dist}m away from the office`, 'error')
        }
      },
      (err) => {
        setLocError('Location access denied or unavailable.')
        addToast?.('Location access denied or unavailable.', 'error')
        setIsLoadingLoc(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleCheckIn = () => {
    if (!empId) return
    executeActionWithLocation(() => {
      const now = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      setAttendance(prev => ({
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: {
            ...(prev.dailyLogs?.[today] || {}),
            [empId]: {
              status: 'Present',
              checkIn: now,
              checkOut: empLog?.checkOut || '--',
              hours: empLog?.hours || '0.0'
            }
          }
        }
      }))
      showSuccessOverlay('Check-in', now)
    })
  }

  const handleCheckOut = () => {
    if (!empId || empLog.checkIn === '--') return
    executeActionWithLocation(() => {
      const now = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      const ci = parseMin(empLog.checkIn)
      const co = parseMin(now)
      let h = '0.0'
      if (ci !== null && co !== null) {
        let d = co - ci; if (d < 0) d += 1440
        h = fmtH(d)
      }
      setAttendance(prev => ({
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: {
            ...(prev.dailyLogs?.[today] || {}),
            [empId]: { ...empLog, checkOut: now, hours: h }
          }
        }
      }))
      showSuccessOverlay('Check-out', now, h)
    })
  }

  if (!empId) return null

  return (
    <>
      <Dialog open={!!successMsg} onOpenChange={(open) => { if (!open) setSuccessMsg(null) }}>
        <DialogContent className="max-w-[400px] border-border/50 bg-popover shadow-lg flex flex-col items-center justify-center p-8 gap-4 rounded-[1rem] outline-none">
          <DialogTitle className="sr-only">Check In Successful</DialogTitle>
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center animate-bounce mt-4 shadow-inner">
            {successMsg?.type === 'Check-in' ? (
              <PartyPopper className="text-primary" size={48} />
            ) : (
              <CheckCircle2 className="text-primary" size={48} />
            )}
          </div>
          <h2 className="text-3xl font-black headline-gradient text-center">
            {successMsg?.type} Successful!
          </h2>
          <div className="text-center flex flex-col gap-2 w-full mt-2">
            <div className="bg-muted/30 py-3 rounded-lg border border-border flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Time Recorded</span>
              <span className="text-foreground font-mono text-xl font-bold">{successMsg?.time}</span>
            </div>
            
            {successMsg?.hoursWorked && (
              <div className="bg-primary/5 py-3 rounded-lg border border-primary/20 flex flex-col items-center justify-center mt-2">
                <span className="text-xs text-primary/70 uppercase tracking-wider font-semibold mb-1">Total Hours Today</span>
                <span className="text-primary font-mono text-xl font-bold">{successMsg.hoursWorked} <span className="text-sm">hrs</span></span>
              </div>
            )}
          </div>
          <Button onClick={() => setSuccessMsg(null)} className="w-full mt-4 rounded-full h-11 text-base font-semibold shadow-sm">
            Done
          </Button>
        </DialogContent>
      </Dialog>

      <Card className="col-span-full xl:col-span-12 border-primary/20 bg-card overflow-hidden shadow-sm mb-6">
        <CardHeader className="bg-primary/5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold m-0">Self-Service Check-In</CardTitle>
              <p className="text-xs text-muted-foreground m-0 mt-0.5">Welcome back, {empName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black tabular-nums tracking-tight font-mono headline-gradient">{timeStr}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex-1 flex flex-col gap-2">
          {isLoadingLoc ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="animate-spin" size={16} />
              Verifying Location...
            </div>
          ) : locError ? (
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <ShieldAlert size={16} />
              {locError}
            </div>
          ) : distance !== null ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {distance <= maxDistance || bypassGps ? (
                  <ShieldCheck size={18} className="text-green-500" />
                ) : (
                  <ShieldAlert size={18} className="text-destructive" />
                )}
                <span className="text-sm font-semibold">
                  {distance <= maxDistance ? 'Location Verified' : 'Outside Office Zone'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground m-0">
                You are {distance} meters away from the office. {distance <= maxDistance ? 'You may check in.' : `You must be within ${maxDistance} meters to check in.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <MapPin size={16} />
                Location pending
              </div>
              <p className="text-xs text-muted-foreground m-0">
                Click Check In / Out to verify your location.
              </p>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-7 text-[10px] uppercase tracking-wider rounded-full ${bypassGps ? 'bg-orange-500/10 text-orange-500 border-orange-500/50' : 'text-muted-foreground'}`}
              onClick={() => setBypassGps(!bypassGps)}
            >
              <Zap size={12} className="mr-1" /> Bypass GPS (Test)
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</span>
              <Badge variant={empLog.status === 'Present' ? 'default' : 'secondary'} className="mt-1">
                {empLog.status}
              </Badge>
            </div>
            
            <div className="h-10 w-px bg-border mx-1"></div>

            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn || isLoadingLoc}
              className="rounded-full px-6 h-10 shadow-md"
              style={{ background: canCheckIn && !isLoadingLoc ? '#28a745' : undefined }}
            >
              <Clock size={16} className="mr-2" /> {isLoadingLoc ? 'Verifying...' : 'Check In'}
            </Button>

            <Button
              variant="outline"
              onClick={handleCheckOut}
              disabled={!canCheckOut || isLoadingLoc}
              className="rounded-full px-6 h-10 border-destructive text-destructive hover:bg-destructive/10"
            >
              {isLoadingLoc ? 'Verifying...' : 'Check Out'}
            </Button>
          </div>
          
          <div className="flex gap-4 text-xs font-medium text-muted-foreground">
            <span>In: {empLog.checkIn}</span>
            <span>Out: {empLog.checkOut}</span>
            <span>Hrs: {empLog.hours}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
