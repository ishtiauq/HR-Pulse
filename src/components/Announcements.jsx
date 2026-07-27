import { useState } from 'react'
import { Megaphone, Plus, Image as ImageIcon, FileText, Send, Calendar, Clock, Edit, Trash2, Users, AlertTriangle, MessageSquare, Heart, ThumbsUp, PartyPopper } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { useConfirm } from '../hooks/useConfirm'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectItem } from "@/components/ui/select"
import AdSlot from './AdSlot'
import { formatDateTime } from '../services/date.js'

export default function Announcements({ employees, announcements, setAnnouncements, addLog, addToast, currentUser }) {
  const [activeTab, setActiveTab] = useState('feed')

  // Form States
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('Normal')
  const [audience, setAudience] = useState('all')

  const [hasPoll, setHasPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])

  const { confirm, ConfirmDialog } = useConfirm()

  const handleAddPollOption = () => setPollOptions([...pollOptions, ''])
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title || !content) return addToast('Title and content are required', 'warning')

    const newPost = {
      id: `ann-${Date.now()}`,
      title,
      content,
      authorId: currentUser.id,
      date: new Date().toISOString(),
      category,
      priority,
      audience,
      attachments: [],
      reactions: { '👍': 0, '❤️': 0, '🎉': 0 },
      comments: [],
      readBy: [],
      poll: hasPoll && pollQuestion ? {
        question: pollQuestion,
        options: pollOptions.filter(o => o.trim() !== '').map(opt => ({ text: opt, votes: [] }))
      } : null
    }

    setAnnouncements(prev => [newPost, ...prev])
    addToast('Announcement published successfully!', 'success')
    addLog('Announcement Created', `Title: ${title}`)

    setTitle('')
    setContent('')
    setCategory('General')
    setPriority('Normal')
    setAudience('all')
    setHasPoll(false)
    setPollQuestion('')
    setPollOptions(['', ''])
    setActiveTab('feed')
  }

  const handleDelete = async (id) => {
    const ok = await confirm('This announcement will be permanently removed.', 'Delete Announcement?', { destructive: true })
    if (!ok) return
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    addToast('Announcement deleted', 'info')
  }

  const getPriorityBorder = (p) => {
    if (p === 'Urgent') return 'border-l-destructive'
    if (p === 'Important') return 'border-l-amber-500'
    return 'border-l-primary'
  }

  return (
    <div className="fade-in pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
          <Megaphone size={20} className="text-primary" />
          Announcements
        </h1>
        <div className="flex gap-3">
          <Button variant={activeTab === 'feed' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('feed')}>Company Feed</Button>
          <Button variant={activeTab === 'create' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('create')}>
            <Plus size={16} /> New Post
          </Button>
        </div>
      </div>
      <div className="border-t border-border" />

      {activeTab === 'create' && (
        <Card className="max-w-[800px] mx-auto mt-6">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            <h2 className="mt-0 mb-6 text-xl text-foreground font-bold">Create Announcement</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">Title</label>
                <Input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q3 Town Hall Meeting" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select label="Category" value={category} onChange={setCategory}>
                  <SelectItem id="General">General</SelectItem>
                  <SelectItem id="Policy Update">Policy Update</SelectItem>
                  <SelectItem id="Event">Event</SelectItem>
                  <SelectItem id="Emergency">Emergency</SelectItem>
                </Select>
                <Select label="Priority" value={priority} onChange={setPriority}>
                  <SelectItem id="Normal">Normal (Blue)</SelectItem>
                  <SelectItem id="Important">Important (Orange)</SelectItem>
                  <SelectItem id="Urgent">Urgent (Red - Pinned)</SelectItem>
                </Select>
                <Select label="Target Audience" value={audience} onChange={setAudience}>
                  <SelectItem id="all">All Employees</SelectItem>
                  <SelectItem id="Engineering">Engineering Dept</SelectItem>
                  <SelectItem id="Design">Design Dept</SelectItem>
                  <SelectItem id="HR">HR Dept</SelectItem>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">Message Content</label>
                <textarea required rows={6} value={content} onChange={(e) => setContent(e.target.value)} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs sm:text-sm shadow-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" placeholder="Type your message here..." />
                <p className="text-xs text-muted-foreground">Line breaks will be preserved. Formatting tools coming soon.</p>
              </div>

              <div className="flex flex-col gap-3 p-4 rounded-lg border border-dashed border-border bg-muted/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle size={14} className="text-muted-foreground" /> Attach Poll (Optional)
                  </span>
                  <button type="button" role="checkbox" aria-checked={hasPoll} onClick={() => setHasPoll(!hasPoll)}
                    className={`w-9 h-5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 ${hasPoll ? 'bg-primary' : 'bg-input'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${hasPoll ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {hasPoll && (
                  <div className="flex flex-col gap-3 pt-2">
                    <Input aria-label="Poll question" type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll Question..." />
                    {pollOptions.map((opt, i) => (
                      <Input key={i} aria-label={`Poll option ${i + 1}`} type="text" value={opt} onChange={(e) => setPollOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                    ))}
                    <Button type="button" variant="link" size="sm" onClick={handleAddPollOption} className="self-start">+ Add Option</Button>
                  </div>
                )}
              </div>

              <Button type="submit" size="lg" className="mt-2">
                Publish Announcement
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'feed' && (
        <div className="flex flex-col gap-4 sm:gap-6 max-w-[800px] mx-auto">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-10 text-center text-muted-foreground">
                No announcements found.
              </CardContent>
            </Card>
          ) : (
            announcements.map(post => {
              const author = post.authorId === 'system' ? { name: 'System Auto-Post', avatar: '' } : employees.find(e => e.id === post.authorId) || { name: 'Unknown User' }
              const dateStr = formatDateTime(post.date)
              const isUrgent = post.priority === 'Urgent'

              return (
                <Card key={post.id} className={`border-l-4 ${getPriorityBorder(post.priority)}`}>
                  <CardContent className="p-5 sm:p-6 relative">
                    {isUrgent && (
                      <div className="absolute top-3 right-3 text-[0.7rem] font-bold px-2 py-1 rounded-xl uppercase bg-destructive text-white">
                        Pinned
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {author.avatar ? (
                          <img src={author.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                            <Megaphone size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground">{author.name}</div>
                          <div className="text-[0.8rem] text-muted-foreground">{dateStr} • {post.audience === 'all' ? 'All Employees' : post.audience}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.8rem] px-2 py-1 rounded bg-muted text-muted-foreground">
                          {post.category}
                        </span>
                        <Button variant="ghost" size="icon-xs" aria-label="Delete announcement" onClick={() => handleDelete(post.id)} className="text-destructive hover:text-destructive" title="Delete Post">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <h3 className="m-0 mb-3 text-xl text-foreground">{post.title}</h3>
                    <div className="whitespace-pre-wrap leading-relaxed text-[0.95rem] text-muted-foreground">
                      {post.content}
                    </div>

                    {post.poll && (
                      <div className="mt-5 p-4 rounded-lg bg-muted/30">
                        <h4 className="m-0 mb-3 text-base text-foreground">📊 {post.poll.question}</h4>
                        <div className="flex flex-col gap-2">
                          {post.poll.options.map((opt, i) => {
                            const votes = opt.votes.length
                            const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0)
                            const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100)
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="flex-1 relative overflow-hidden h-8 rounded bg-muted">
                                  <div className="absolute top-0 left-0 h-full opacity-20 bg-primary" style={{ width: `${pct}%` }} />
                                  <div className="absolute top-0 left-0 h-full w-full flex items-center px-3 text-[0.9rem] text-foreground">
                                    {opt.text}
                                  </div>
                                </div>
                                <div className="w-10 text-sm text-right text-muted-foreground">{votes}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-5 pt-4 border-t border-border">
                      <div className="flex gap-4" aria-label="Post reactions">
                        <span aria-label={`${post.reactions['👍']} like reactions`} className="flex items-center gap-1.5 text-[0.9rem] text-muted-foreground">
                          👍 {post.reactions['👍']}
                        </span>
                        <span aria-label={`${post.reactions['❤️']} heart reactions`} className="flex items-center gap-1.5 text-[0.9rem] text-muted-foreground">
                          ❤️ {post.reactions['❤️']}
                        </span>
                        <span aria-label={`${post.reactions['🎉']} celebrate reactions`} className="flex items-center gap-1.5 text-[0.9rem] text-muted-foreground">
                          🎉 {post.reactions['🎉']}
                        </span>
                        <span aria-label={`${post.comments.length} comments`} className="flex items-center gap-1.5 text-[0.9rem] ml-3 text-muted-foreground">
                          <MessageSquare size={16} /> {post.comments.length}
                        </span>
                      </div>
                      <div className="text-sm flex items-center gap-1.5 text-muted-foreground/60">
                        <Users size={14} /> Read by {post.readBy.length} employees
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
      <ConfirmDialog />
      <AdSlot />
    </div>
  )
}
