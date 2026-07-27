import { useState } from 'react'
import { Megaphone, Plus, Image as ImageIcon, FileText, Send, Calendar, Clock, Edit, Trash2, Users, AlertTriangle, MessageSquare, Heart, ThumbsUp, PartyPopper } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { useConfirm } from '../hooks/useConfirm'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AdSlot from './AdSlot'
import { formatDateTime } from '../services/date.js'

export default function Announcements({ employees, announcements, setAnnouncements, addLog, addToast, currentUser }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form States
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('Normal')
  const [audience, setAudience] = useState('all')

  const [hasPoll, setHasPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])

  const [filterCategory, setFilterCategory] = useState('All')

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
    setIsDialogOpen(false)
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
  
  const getPriorityBadgeVariant = (p) => {
    if (p === 'Urgent') return 'destructive'
    if (p === 'Important') return 'secondary'
    return 'outline'
  }

  const filteredAnnouncements = announcements.filter(a => filterCategory === 'All' || a.category === filterCategory)

  return (
    <div className="fade-in pb-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
          <Megaphone size={20} className="text-primary" />
          Announcements
        </h1>
        
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Post</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6 mt-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q3 Town Hall Meeting" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <Select value={category} onChange={setCategory}>
                    <SelectItem id="General">General</SelectItem>
                    <SelectItem id="Policy Update">Policy Update</SelectItem>
                    <SelectItem id="Event">Event</SelectItem>
                    <SelectItem id="Emergency">Emergency</SelectItem>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Priority</label>
                  <Select value={priority} onChange={setPriority}>
                    <SelectItem id="Normal">Normal</SelectItem>
                    <SelectItem id="Important">Important</SelectItem>
                    <SelectItem id="Urgent">Urgent</SelectItem>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Target Audience</label>
                  <Select value={audience} onChange={setAudience}>
                    <SelectItem id="all">All Employees</SelectItem>
                    <SelectItem id="Engineering">Engineering Dept</SelectItem>
                    <SelectItem id="Design">Design Dept</SelectItem>
                    <SelectItem id="HR">HR Dept</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Message Content</label>
                <textarea required rows={6} value={content} onChange={(e) => setContent(e.target.value)} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" placeholder="Type your message here..." />
              </div>

              <div className="flex flex-col gap-4 p-4 rounded-lg border border-dashed bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <AlertTriangle size={16} className="text-muted-foreground" /> Attach Poll (Optional)
                  </span>
                  <button type="button" role="switch" aria-checked={hasPoll} onClick={() => setHasPoll(!hasPoll)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${hasPoll ? 'bg-primary' : 'bg-input'}`}>
                    <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${hasPoll ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {hasPoll && (
                  <div className="flex flex-col gap-3 pt-2">
                    <Input aria-label="Poll question" type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll Question..." />
                    {pollOptions.map((opt, i) => (
                      <Input key={i} aria-label={`Poll option ${i + 1}`} type="text" value={opt} onChange={(e) => handlePollOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPollOption} className="self-start mt-1">
                      <Plus size={14} className="mr-1" /> Add Option
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Publish Announcement</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      <div className="border-t border-border mb-6" />
      
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {['All', 'General', 'Policy Update', 'Event', 'Emergency'].map(cat => (
          <Badge 
            key={cat} 
            variant={filterCategory === cat ? 'default' : 'secondary'}
            className="cursor-pointer hover:bg-primary/80 whitespace-nowrap"
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:gap-6">
        {filteredAnnouncements.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/10">
            <CardContent className="p-12 text-center flex flex-col items-center gap-3 text-muted-foreground">
              <Megaphone size={40} className="text-muted-foreground/50" />
              <p>No announcements found in this category.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map(post => {
            const author = post.authorId === 'system' ? { name: 'System Auto-Post', avatar: '' } : employees.find(e => e.id === post.authorId) || { name: 'Unknown User' }
            const dateStr = formatDateTime(post.date)
            const isUrgent = post.priority === 'Urgent'

            return (
              <Card key={post.id} className="overflow-hidden mb-4 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 pt-5 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={author.avatar} alt={author.name} />
                      <AvatarFallback className="bg-primary/10 text-primary"><Megaphone size={18} /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm leading-none">{author.name}</span>
                        {isUrgent && <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase animate-pulse tracking-wider">Pinned</Badge>}
                        {post.priority !== 'Normal' && <Badge variant={getPriorityBadgeVariant(post.priority)} className="h-5 px-1.5 text-[10px] uppercase tracking-wider">{post.priority}</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dateStr} &bull; {post.audience === 'all' ? 'All Employees' : post.audience}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="hidden sm:inline-flex">{post.category}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Delete post">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-5">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2">{post.title}</h3>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm text-foreground/90">
                    {post.content}
                  </div>

                  {post.poll && (
                    <div className="mt-6 p-4 rounded-xl border border-border/50 bg-muted/20">
                      <h4 className="font-medium text-sm mb-4 flex items-center gap-2 text-foreground">
                         <span className="text-lg">📊</span> {post.poll.question}
                      </h4>
                      <div className="flex flex-col gap-3">
                        {post.poll.options.map((opt, i) => {
                          const votes = opt.votes.length
                          const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0)
                          const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100)
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="flex-1 relative overflow-hidden h-9 rounded-md bg-muted/50 border border-transparent hover:border-border transition-colors">
                                <div className="absolute top-0 left-0 h-full opacity-10 bg-primary transition-all duration-500 ease-in-out" style={{ width: `${pct}%` }} />
                                <div className="absolute top-0 left-0 h-full w-full flex items-center px-3 text-sm font-medium text-foreground">
                                  {opt.text}
                                </div>
                              </div>
                              <div className="w-10 text-sm text-right text-muted-foreground font-medium">{votes}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-3 pb-3 border-t flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-wrap gap-1 -ml-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                      👍 <span className="ml-1.5 text-xs font-medium">{post.reactions['👍']}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                      ❤️ <span className="ml-1.5 text-xs font-medium">{post.reactions['❤️']}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                      🎉 <span className="ml-1.5 text-xs font-medium">{post.reactions['🎉']}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                      <MessageSquare size={14} className="mr-1.5" /> <span className="text-xs font-medium">{post.comments.length}</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users size={13} /> {post.readBy.length} views
                  </div>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
      <ConfirmDialog />
      <AdSlot />
    </div>
  )
}
