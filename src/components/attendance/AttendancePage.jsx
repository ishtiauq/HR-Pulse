import { useState } from 'react'
import { Clock, CalendarDays, ArrowUpDown, Cpu } from 'lucide-react'
import { tabChip } from '../../services/attendance.js'
import ClockWidget from './ClockWidget.jsx'
import DailyLogs from './DailyLogs.jsx'
import LeaveRequests from './LeaveRequests.jsx'
import LeaveBalanceCard from './LeaveBalanceCard.jsx'
import RosterPlanner from './RosterPlanner.jsx'
import ShiftSwaps from './ShiftSwaps.jsx'
import OvertimeClaims from './OvertimeClaims.jsx'

export default function AttendancePage({ employees, attendance, setAttendance, roster, setRoster, shiftSwaps, setShiftSwaps, shiftTemplates, overtimeClaims, setOvertimeClaims, addLog, addToast, addNotification, simulatedRole, addAuditLog }) {
  const [tab, setTab] = useState('daily')
  const tabs = [
    { id: 'daily', label: 'Daily Logs', icon: Clock },
    { id: 'leave', label: 'Leave Requests', icon: CalendarDays },
    { id: 'roster', label: 'Roster', icon: ArrowUpDown },
    { id: 'overtime', label: 'Overtime', icon: Cpu },
  ]
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <h1 className="headline-small m-0" style={{ color: 'var(--md-bw-on-surface)' }}>Attendance & Leaves</h1>
      <ClockWidget employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />
      <div role="tablist" aria-label="Attendance sections" className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={tabChip(tab === t.id)}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>
      {tab === 'daily' && <DailyLogs employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />}
      {tab === 'leave' && (
        <div className="flex flex-col gap-5">
          <LeaveRequests employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />
          <LeaveBalanceCard employees={employees} balances={attendance.balances || {}} />
        </div>
      )}
      {tab === 'roster' && (
        <div className="flex flex-col gap-5">
          <RosterPlanner employees={employees} roster={roster} setRoster={setRoster} shiftTemplates={shiftTemplates} addToast={addToast} />
          <ShiftSwaps employees={employees} shiftSwaps={shiftSwaps} setShiftSwaps={setShiftSwaps} roster={roster} setRoster={setRoster} addToast={addToast} />
        </div>
      )}
      {tab === 'overtime' && <OvertimeClaims employees={employees} overtimeClaims={overtimeClaims} setOvertimeClaims={setOvertimeClaims} addToast={addToast} />}
    </div>
  )
}
