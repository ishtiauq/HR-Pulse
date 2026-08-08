import { useState, useEffect, useCallback } from 'react'
import Icon from "@/components/ui/Icon.jsx"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { performanceApi, currentMonthKey, lastMonthKey } from '../../services/hr.js'

const gradeTone = {
  A: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  B: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  C: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  D: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export default function PerformancePage({ adminUid, currentUser, addToast }) {
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'HR'
  const [month, setMonth] = useState(isAdmin ? lastMonthKey() : currentMonthKey())
  const [scores, setScores] = useState([])
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [scoreRes, trendRes] = await Promise.all([
        isAdmin ? performanceApi.getScores({ month }) : performanceApi.getMyScore({ month }),
        performanceApi.getTrends({ month, mine: !isAdmin }),
      ])
      setScores(scoreRes.scores || [])
      setTrends(trendRes.trends || [])
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, month, addToast])

  useEffect(() => { load() }, [load])

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      const res = await performanceApi.calculate({ month })
      addToast(`Calculated scores for ${res.scores?.length || 0} employees.`, 'success')
      load()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setCalculating(false)
    }
  }

  const myScore = scores[0]
  const avg = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0
  const top = scores.length ? [...scores].sort((a, b) => b.score - a.score)[0] : null

  return (
    <div className="animate-fade-in flex flex-col gap-5 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 headline-gradient m-0">
          <Icon name="insights" size={20} className="text-foreground" /> Performance Tracker
        </h1>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={handleCalculate} disabled={calculating}>
              <Icon name="calculate" size={14} className="mr-1.5" /> {calculating ? 'Calculating...' : 'Calculate month'}
            </Button>
          )}
        </div>
      </div>

      {!isAdmin && myScore && (
        <Card>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My score • {month}</div>
              <div className="text-3xl font-black tabular-nums text-foreground mt-1">{myScore.score}<span className="text-base text-muted-foreground font-semibold">/100</span></div>
            </div>
            <Badge variant="outline" className={gradeTone[myScore.grade]}>{myScore.grade}</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isAdmin && (
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company average</div>
              <div className="text-3xl font-black tabular-nums text-foreground mt-1">{loading ? '—' : avg}</div>
            </CardContent>
          </Card>
        )}
        {isAdmin ? (
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top performer</div>
              <div className="text-xl font-bold text-foreground mt-1">{top ? top.employeeName : '—'}</div>
              <div className="text-xs text-muted-foreground">{top ? `${top.score} pts (grade ${top.grade})` : ''}</div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evaluated dimensions</div>
              <div className="text-xl font-bold text-foreground mt-1 capitalize">{myScore?.breakdown ? Object.keys(myScore.breakdown).join(', ') : '—'}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Scores — {month}</CardTitle>
            <Badge variant="secondary">{scores.length} employees</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Loading...</div>
            ) : scores.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                <Icon name="insights" size={28} className="opacity-30 mx-auto mb-2" />
                No scores for this month yet. Run "Calculate month".
              </div>
            ) : (
              <div className="rounded-b-xl border-t border-border overflow-x-auto">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Rank</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...scores].sort((a, b) => b.score - a.score).map((s, i) => (
                      <TableRow key={s.employeeId || s.id}>
                        <TableCell>
                          <div className="font-medium text-sm text-foreground">{s.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{s.department || '—'}</div>
                        </TableCell>
                        <TableCell className="text-center font-bold tabular-nums">{s.score}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className={gradeTone[s.grade]}>{s.grade}</Badge></TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">#{i + 1}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {trends.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{isAdmin ? 'Company' : 'My'} monthly trend</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {trends.map((t) => (
                <div key={t.month} className="flex items-center gap-3">
                  <span className="w-14 text-xs font-semibold text-muted-foreground tabular-nums">{t.month}</span>
                  <div className="flex-1 h-6 rounded-md bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-md bg-primary flex items-center px-2 transition-all" style={{ width: `${Math.min(t.score, 100)}%` }}>
                      <span className="text-[10px] font-bold text-primary-foreground whitespace-nowrap">{t.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
