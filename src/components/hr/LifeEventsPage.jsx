import { useState, useEffect, useCallback } from 'react'
import Icon from "@/components/ui/Icon.jsx"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { lifeEventsApi } from '../../services/hr.js'

const typeMeta = {
  marriage: { icon: 'favorite', label: 'Marriage', tone: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  child_birth: { icon: 'child_care', label: 'Child birth', tone: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  bereavement: { icon: 'local_florist', label: 'Bereavement', tone: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
}

export default function LifeEventsPage({ adminUid, currentUser, addToast }) {
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'HR'
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = isAdmin ? await lifeEventsApi.getLifeEvents() : await lifeEventsApi.getMine()
      setEvents(res.events || [])
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, addToast])

  useEffect(() => { load() }, [load])

  const completeTask = async (eventId, taskId) => {
    try {
      await lifeEventsApi.completeTask({ eventId, taskId })
      addToast('Task completed.', 'success')
      load()
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-5 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 headline-gradient m-0">
          <Icon name="celebration" size={20} className="text-foreground" /> Life-Event Workflows
        </h1>
        <Badge variant="secondary">{isAdmin ? 'All employees' : 'My events'}</Badge>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <Icon name="event_note" size={32} className="opacity-30 mx-auto mb-2" />
            No life events yet. Approved weddings, births and bereavement leaves will appear here automatically.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => {
            const meta = typeMeta[ev.type] || { icon: 'event', label: ev.type, tone: 'bg-muted text-muted-foreground' }
            const openTasks = ev.tasks?.filter((t) => !t.completed) || []
            const doneCount = (ev.tasks?.filter((t) => t.completed) || []).length
            return (
              <Card key={ev.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center">
                        <Icon name={meta.icon} size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{meta.label}</div>
                        <div className="text-xs text-muted-foreground">{ev.employeeName || '—'} • {ev.date}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={meta.tone}>
                      {openTasks.length === 0 ? 'Done' : `${openTasks.length} pending`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ev.tasks?.length ? Math.round((doneCount / ev.tasks.length) * 100) : 0}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-1">{doneCount}/{ev.tasks?.length || 0} tasks</div>
                  {ev.tasks?.map((t) => (
                    <div key={t.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${t.completed ? 'border-border/40 bg-muted/40 opacity-60' : 'border-border bg-background'}`}>
                      <div className="flex items-center gap-2.5">
                        <Icon name={t.completed ? 'check_circle' : 'radio_button_unchecked'} size={17} className={t.completed ? 'text-primary' : 'text-muted-foreground'} />
                        <div>
                          <div className="text-sm text-foreground">{t.label}</div>
                          {t.details && <div className="text-xs text-muted-foreground">{t.details}</div>}
                        </div>
                      </div>
                      {!t.completed && isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => completeTask(ev.id, t.id)}>Mark done</Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
