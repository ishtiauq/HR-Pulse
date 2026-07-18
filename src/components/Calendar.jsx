import { useState } from 'react'
import { useModal } from '../services/useModal.js'
import { Calendar as CalendarIcon, Plus, Edit, Trash2, ChevronLeft, ChevronRight, FileText, Users, Gift, AlertTriangle, Clock, X } from 'lucide-react'
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
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={prevMonth} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, minWidth: '180px', textAlign: 'center' }}>
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => openCreateModal(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {DAYS.map(d => (
          <div key={d} style={{ padding: '8px 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
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
              onClick={() => setSelectedDate(dateStr)}
              style={{
                padding: '8px 4px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'var(--accent-primary)' : isToday ? 'var(--accent-primary-glow)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
                minHeight: '64px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all var(--transition-fast)',
                border: isToday && !isSelected ? '1px solid var(--accent-primary)' : 'none',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isToday ? 'var(--accent-primary-glow)' : 'transparent' }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: isToday ? 800 : 600 }}>{day}</span>
              {dayEvents.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dayEvents.slice(0, 3).map(ev => {
                    const typeInfo = getTypeInfo(ev.type)
                    return <div key={ev.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: typeInfo.color }} />
                  })}
                  {dayEvents.length > 3 && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>+{dayEvents.length - 3}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderEventList = () => (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarIcon size={18} color="var(--accent-primary)" />
        {selectedDate ? `Events on ${formatDate(selectedDate)}` : 'This Month\'s Events'}
      </h3>

      {filteredEvents.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
          {selectedDate ? 'No events on this day' : 'No events this month'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredEvents.map(ev => {
            const typeInfo = getTypeInfo(ev.type)
            const TypeIcon = typeInfo.icon
            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)', transition: 'all var(--transition-fast)'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: `${typeInfo.color}20`, color: typeInfo.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <TypeIcon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ev.title}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: `${typeInfo.color}20`, color: typeInfo.color, fontWeight: 600 }}>{typeInfo.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarIcon size={12} /> {formatDate(ev.date)}
                    </span>
                    {ev.time && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {ev.time}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{ev.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEditModal(ev)} style={{ background: 'transparent', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(ev.id)} style={{ background: 'transparent', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}
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
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header">
        <h1 className="page-title">
          <CalendarIcon size={28} className="page-title-icon" />
          Calendar
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 380px' : '1fr', gap: '24px', alignItems: 'start' }}>
        {renderCalendarGrid()}
        {selectedDate && renderEventList()}
      </div>

      {!selectedDate && (
        <div style={{ marginTop: '24px' }}>{renderEventList()}</div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
        {EVENT_TYPES.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {showEventModal && (
        <div className="modal-overlay" onClick={() => { setShowEventModal(false); resetForm() }}>
          <div className="modal-container" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button className="modal-close" onClick={() => { setShowEventModal(false); resetForm() }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Title *</label>
                <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Event title"
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date *</label>
                  <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Time</label>
                  <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {EVENT_TYPES.map(t => {
                    const Icon = t.icon
                    const isActive = formType === t.id
                    return (
                      <button key={t.id} type="button" onClick={() => setFormType(t.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px',
                          border: isActive ? `2px solid ${t.color}` : '1px solid var(--border-color)',
                          background: isActive ? `${t.color}15` : 'var(--bg-tertiary)',
                          color: isActive ? t.color : 'var(--text-secondary)',
                          fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                        }}>
                        <Icon size={14} /> {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Event description (optional)"
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
    </div>
  )
}
