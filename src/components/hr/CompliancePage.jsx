import { useState, useEffect, useCallback } from 'react'
import Icon from "@/components/ui/Icon.jsx"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { complianceApi } from '../../services/hr.js'

const severityTone = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  info: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
}

export default function CompliancePage({ adminUid, addToast }) {
  const [tab, setTab] = useState('alerts')
  const [alerts, setAlerts] = useState([])
  const [rules, setRules] = useState([])
  const [festivals, setFestivals] = useState([])
  const [loading, setLoading] = useState(false)
  const [newFestival, setNewFestival] = useState({ name: '', date: '' })

  const loadAlerts = useCallback(async () => {
    try { setAlerts((await complianceApi.getAlerts()).alerts || []) } catch (e) { addToast(e.message, 'error') }
  }, [addToast])

  const loadRules = useCallback(async () => {
    try {
      const res = await complianceApi.getRules()
      setRules(res.rules || [])
      setFestivals(res.festivals || [])
    } catch (e) { addToast(e.message, 'error') }
  }, [addToast])

  useEffect(() => {
    if (tab === 'alerts') { setLoading(true); loadAlerts().finally(() => setLoading(false)) }
    if (tab === 'rules' || tab === 'festivals') { setLoading(true); loadRules().finally(() => setLoading(false)) }
  }, [tab, loadAlerts, loadRules])

  const resolveAlert = async (id) => {
    try { await complianceApi.resolveAlert({ alertId: id }); addToast('Alert resolved.', 'success'); loadAlerts() } catch (e) { addToast(e.message, 'error') }
  }

  const saveRule = async (rule) => {
    try {
      await complianceApi.updateRule({ ruleId: rule.id, value: Number(rule.value), unit: rule.unit })
      addToast(`${rule.id.replace(/_/g, ' ')} updated.`, 'success')
      loadRules()
    } catch (e) { addToast(e.message, 'error') }
  }

  const addFestival = async () => {
    if (!newFestival.name.trim() || !newFestival.date) { addToast('Name and date are required.', 'error'); return }
    try {
      await complianceApi.addFestival({ name: newFestival.name.trim(), date: newFestival.date })
      addToast('Festival date added.', 'success')
      setNewFestival({ name: '', date: '' })
      loadRules()
    } catch (e) { addToast(e.message, 'error') }
  }

  const removeFestival = async (name) => {
    try { await complianceApi.removeFestival({ name }); addToast('Festival date removed.', 'success'); loadRules() } catch (e) { addToast(e.message, 'error') }
  }

  const tabBtn = (key, label, icon) => (
    <Button variant={tab === key ? 'default' : 'ghost'} size="sm" onClick={() => setTab(key)}>
      <Icon name={icon} size={14} className="mr-1.5" /> {label}
    </Button>
  )

  return (
    <div className="animate-fade-in flex flex-col gap-5 max-w-[1200px] mx-auto w-full">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 headline-gradient m-0">
        <Icon name="gavel" size={20} className="text-foreground" /> Labour Law Compliance
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open alerts</div>
            <div className="text-3xl font-black tabular-nums text-destructive mt-1">{loading ? '—' : alerts.filter(a => !a.resolved).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto-check rules</div>
            <div className="text-3xl font-black tabular-nums text-foreground mt-1">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracked festivals</div>
            <div className="text-3xl font-black tabular-nums text-foreground mt-1">{festivals.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-muted/40 border border-border p-1 w-fit">
        {tabBtn('alerts', 'Alerts', 'notifications_active')}
        {tabBtn('rules', 'Rules', 'tune')}
        {tabBtn('festivals', 'Festivals', 'celebration')}
      </div>

      {tab === 'alerts' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Compliance alerts</CardTitle>
            <Badge variant="secondary">{alerts.filter(a => !a.resolved).length} open</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>
            ) : alerts.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                <Icon name="verified" size={28} className="opacity-30 mx-auto mb-2" />
                No compliance alerts yet. The engine checks automatically.
              </div>
            ) : (
              <div className="rounded-b-xl border-t border-border overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-center">Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell><Badge variant="outline" className={severityTone[a.severity] || severityTone.info}>{a.severity || 'info'}</Badge></TableCell>
                        <TableCell className="max-w-[420px]"><span className="text-sm text-foreground">{a.message}</span></TableCell>
                        <TableCell className="text-center text-sm">{a.employeeName || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{a.date}</TableCell>
                        <TableCell className="text-right">
                          {a.resolved ? <span className="text-xs text-muted-foreground">Resolved</span>
                            : <Button size="sm" variant="outline" onClick={() => resolveAlert(a.id)}>Resolve</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'rules' && (
        <Card>
          <CardHeader><CardTitle>Auto-check rules</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-xl border-t border-border overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead className="text-right w-40">Current limit</TableHead>
                    <TableHead className="text-right w-40">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium text-sm text-foreground capitalize">{r.id.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">{r.value} {r.unit}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input type="number" defaultValue={r.value} className="w-24 h-8 text-sm inline-block text-right"
                          onBlur={(e) => e.target.value && Number(e.target.value) !== r.value && saveRule({ ...r, value: e.target.value })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'festivals' && (
        <Card>
          <CardHeader><CardTitle>Festival bonus window dates</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {festivals.map((f) => (
                <Badge key={f.name} variant="outline" className="px-3 py-1.5 text-sm gap-2 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                  onClick={() => removeFestival(f.name)}>
                  {f.name} <span className="opacity-60">{f.date}</span> <Icon name="close" size={12} className="opacity-60" />
                </Badge>
              ))}
              {festivals.length === 0 && <span className="text-sm text-muted-foreground">No festival dates configured.</span>}
            </div>
            <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Festival name</label>
                <Input value={newFestival.name} onChange={(e) => setNewFestival({ ...newFestival, name: e.target.value })} placeholder="e.g. Pahela Boishakh" className="w-56" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Date</label>
                <Input type="date" value={newFestival.date} onChange={(e) => setNewFestival({ ...newFestival, date: e.target.value })} className="w-44" />
              </div>
              <Button onClick={addFestival}><Icon name="add" size={16} className="mr-1.5" /> Add</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
