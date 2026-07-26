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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>Attendance & Leaves</h1>
      <ClockWidget employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={tabChip(tab === t.id)}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>
      {tab === 'daily' && <DailyLogs employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />}
      {tab === 'leave' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <LeaveRequests employees={employees} attendance={attendance} setAttendance={setAttendance} addToast={addToast} />
          <LeaveBalanceCard employees={employees} balances={attendance.balances || {}} />
        </div>
      )}
      {tab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <RosterPlanner employees={employees} roster={roster} setRoster={setRoster} shiftTemplates={shiftTemplates} addToast={addToast} />
          <ShiftSwaps employees={employees} shiftSwaps={shiftSwaps} setShiftSwaps={setShiftSwaps} roster={roster} setRoster={setRoster} addToast={addToast} />
        </div>
      )}
      {tab === 'overtime' && <OvertimeClaims employees={employees} overtimeClaims={overtimeClaims} setOvertimeClaims={setOvertimeClaims} addToast={addToast} />}
    </div>
  )
}
