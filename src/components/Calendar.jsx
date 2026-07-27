import { useState } from 'react'
import { useModal } from '../services/useModal.js'
import { Calendar as CalendarIcon, Plus, Edit, Trash2, ChevronLeft, ChevronRight, FileText, Users, Gift, AlertTriangle, Clock, X } from 'lucide-react'
import AdSlot from './AdSlot'
import { formatDate } from '../services/date.js'

const EVENT_TYPES = [
  { id: 'meeting', label: 'Meeting', icon: Users, color: '#3b82f6' },
  { id: 'holiday', label: 'Holiday', icon: CalendarIcon, color: '#10b981' },
  { id: 'birthday', label: 'Birthday', icon: Gift, color: '#f59e0b' },
  { id: 'deadline', label: 'Deadline', icon: AlertTriangle, color: '#ef4444' },
  { id: 'other', label: 'Other', icon: FileText, color: '#8b5cf6' },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar({ events, setEvents, employees, addLog, addToast, currentUser, simulatedRole }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [viewMode, setViewMode] = useState('month')

  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formType, setFormType] = useState('meeting')
  const [formDescription, setFormDescription] = useState('')
  useModal(() => { setShowEventModal(false); resetForm() })

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDate('')
    setFormTime('')
    setFormType('meeting')
    setFormDescription('')
    setEditingEvent(null)
  }

  const openCreateModal = (date) => {
    const dateStr = date || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
    resetForm()
    setFormDate(dateStr)
    setShowEventModal(true)
  }

  const openEditModal = (event) => {
    setEditingEvent(event)
    setFormTitle(event.title)
    setFormDate(event.date)
    setFormTime(event.time || '')
    setFormType(event.type)
    setFormDescription(event.description || '')
    setShowEventModal(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!formTitle || !formDate) return addToast('Title and date are required', 'warning')

    if (editingEvent) {
      setEvents(prev => prev.map(ev =>
        ev.id === editingEvent.id
          ? { ...ev, title: formTitle, date: formDate, time: formTime, type: formType, description: formDescription }
          : ev
      ))
      addToast('Event updated', 'success')
      addLog('Event Updated', `${formTitle} on ${formDate}`)
    } else {
      const newEvent = {
        id: `evt-${Date.now()}`,
        title: formTitle,
        date: formDate,
        time: formTime,
        type: formType,
        description: formDescription,
        createdBy: currentUser?.id || 'unknown',
        createdAt: new Date().toISOString(),
      }
      setEvents(prev => [...prev, newEvent])
      addToast('Event created', 'success')
      addLog('Event Created', `${formTitle} on ${formDate}`)
    }

    setShowEventModal(false)
    resetForm()
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this event?')) {
      setEvents(prev => prev.filter(ev => ev.id !== id))
      addToast('Event deleted', 'info')
    }
  }

  const getEventsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(ev => ev.date === dateStr)
  }

  const getTypeInfo = (typeId) => EVENT_TYPES.find(t => t.id === typeId) || EVENT_TYPES[4]

  const upcomingEvents = [...events]
    .filter(ev => ev.date >= `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10)

  const filteredEvents = selectedDate
    ? events.filter(ev => ev.date === selectedDate)
    : events.filter(ev => {
        const d = new Date(ev.date + 'T00:00:00')
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })

  const renderCalendarGrid = () => (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} aria-label="Previous month" className="flex rounded-lg p-2 cursor-pointer" style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-[1.3rem] font-bold m-0 min-w-[180px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} aria-label="Next month" className="flex rounded-lg p-2 cursor-pointer" style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)' }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <button className="btn btn-primary flex items-center gap-1.5" aria-label="Add event"
          onClick={() => openCreateModal(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div role="grid" aria-label="Calendar" className="grid grid-cols-7 gap-1 text-center">
        {DAYS.map(d => (
          <div key={d} role="columnheader" className="py-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayEvents = getEventsForDate(day)
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day
          const isSelected = selectedDate === dateStr
          return (
            <div key={day}
              role="gridcell"
              aria-label={`${MONTHS[currentMonth]} ${day}, ${currentYear}`}
              onClick={() => setSelectedDate(dateStr)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(dateStr) } }}
              tabIndex={0}
              className="flex flex-col items-center gap-1 p-2 cursor-pointer min-h-[64px]"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'var(--accent-primary)' : isToday ? 'var(--accent-primary-dim)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                border: isToday && !isSelected ? '1px solid var(--accent-primary)' : 'none',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isToday ? 'var(--accent-primary-dim)' : 'transparent' }}
            >
              <span className="text-sm" style={{ fontWeight: isToday ? 800 : 600 }}>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {dayEvents.slice(0, 3).map(ev => {
                    const typeInfo = getTypeInfo(ev.type)
                    return <div key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ background: typeInfo.color }} />
                  })}
                  {dayEvents.length > 3 && <span className="text-[0.6rem]" style={{ color: 'var(--text-muted)' }}>+{dayEvents.length - 3}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderEventList = () => (
    <div className="glass-card p-5 sm:p-6">
      <h3 className="text-lg font-bold m-0 mb-4 flex items-center gap-2">
        <CalendarIcon size={18} color="var(--accent-primary)" />
        {selectedDate ? `Events on ${formatDate(selectedDate)}` : 'This Month\'s Events'}
      </h3>

      {filteredEvents.length === 0 ? (
        <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          {selectedDate ? 'No events on this day' : 'No events this month'}
        </p>
      ) : (
        <div role="list" className="flex flex-col gap-2">
          {filteredEvents.map(ev => {
            const typeInfo = getTypeInfo(ev.type)
            const TypeIcon = typeInfo.icon
            return (
              <div key={ev.id} role="listitem" className="flex items-center gap-3 p-2 sm:p-3 px-3 sm:px-4" style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)', transition: 'all var(--transition-fast)'
              }}>
                <div className="flex items-center justify-center shrink-0 rounded-lg" style={{
                  width: '36px', height: '36px',
                  background: `${typeInfo.color}20`, color: typeInfo.color,
                }}>
                  <TypeIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[0.9rem]" style={{ color: 'var(--text-primary)' }}>{ev.title}</span>
                    <span className="text-[0.7rem] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>{typeInfo.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[0.8rem] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <CalendarIcon size={12} /> {formatDate(ev.date)}
                    </span>
                    {ev.time && (
                      <span className="text-[0.8rem] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={12} /> {ev.time}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-[0.8rem] m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>{ev.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button aria-label="Edit event" onClick={() => openEditModal(ev)} className="bg-transparent border-0 p-1.5 rounded-md cursor-pointer" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Edit size={14} />
                  </button>
                  <button aria-label="Delete event" onClick={() => handleDelete(ev.id)} className="bg-transparent border-0 p-1.5 rounded-md cursor-pointer" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="fade-in p-4 md:p-6 lg:p-8 pb-6 sm:pb-8 lg:pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
          <CalendarIcon size={20} className="text-primary" />
          Calendar
        </h1>
      </div>
      <hr className="border-border my-0" />

      <div className="grid gap-6 items-start" style={{ gridTemplateColumns: selectedDate ? '1fr 380px' : '1fr' }}>
        {renderCalendarGrid()}
        {selectedDate && renderEventList()}
      </div>

      {!selectedDate && (
        <div className="mt-6">{renderEventList()}</div>
      )}

      <div className="flex gap-2 justify-end mt-4">
        {EVENT_TYPES.map(t => (
          <div key={t.id} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {showEventModal && (
        <div className="modal-overlay" onClick={() => { setShowEventModal(false); resetForm() }}>
          <div className="modal-container max-w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button className="modal-close" aria-label="Close" onClick={() => { setShowEventModal(false); resetForm() }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Event title" aria-label="Event title"
                  className="p-2 sm:p-2.5 px-2 sm:px-3 rounded-lg text-[0.95rem]" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Date *</label>
                  <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)} aria-label="Event date"
                    className="p-2 sm:p-2.5 px-2 sm:px-3 rounded-lg text-[0.95rem]" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Time</label>
                  <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} aria-label="Event time"
                    className="p-2 sm:p-2.5 px-2 sm:px-3 rounded-lg text-[0.95rem]" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_TYPES.map(t => {
                    const Icon = t.icon
                    const isActive = formType === t.id
                    return (
                      <button key={t.id} type="button" onClick={() => setFormType(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[0.8rem] cursor-pointer"
                        style={{
                          border: isActive ? `2px solid ${t.color}` : '1px solid var(--border-color)',
                          background: isActive ? `${t.color}15` : 'var(--bg-tertiary)',
                          color: isActive ? t.color : 'var(--text-secondary)',
                        }}>
                        <Icon size={14} /> {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Event description (optional)" aria-label="Event description"
                  className="p-2 sm:p-2.5 px-2 sm:px-3 rounded-lg text-[0.95rem] resize-y" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEventModal(false); resetForm() }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AdSlot />
    </div>
  )
}
