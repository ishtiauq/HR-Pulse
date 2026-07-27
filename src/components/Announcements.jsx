import { useState } from 'react'
import { Megaphone, Plus, Image as ImageIcon, FileText, Send, Calendar, Clock, Edit, Trash2, Users, AlertTriangle, MessageSquare, Heart, ThumbsUp, PartyPopper } from 'lucide-react'
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      addToast('Announcement deleted', 'info')
    }
  }

  const getPriorityColor = (p) => {
    if (p === 'Urgent') return 'var(--accent-danger)'
    if (p === 'Important') return 'var(--accent-warning)'
    return 'var(--accent-primary)'
  }

  return (
    <div className="fade-in pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
          <Megaphone size={20} className="text-primary" />
          Announcements
        </h1>
        <div className="flex gap-3">
          <button aria-label={activeTab === 'feed' ? 'View company feed (active)' : 'View company feed'} className={`tab-btn px-4 py-2 rounded-lg border-0 font-semibold cursor-pointer ${activeTab === 'feed' ? 'active' : ''}`} style={{ background: activeTab === 'feed' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'feed' ? 'var(--text-primary)' : 'var(--text-secondary)' }} onClick={() => setActiveTab('feed')}>Company Feed</button>
          <button aria-label={activeTab === 'create' ? 'Create new post (active)' : 'Create new post'} className={`tab-btn px-4 py-2 rounded-lg border-0 font-semibold cursor-pointer flex items-center gap-1.5 ${activeTab === 'create' ? 'active' : ''}`} style={{ background: activeTab === 'create' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'create' ? '#fff' : 'var(--text-secondary)' }} onClick={() => setActiveTab('create')}>
            <Plus size={16} /> New Post
          </button>
        </div>
      </div>
      <hr className="border-border my-0" />

      {activeTab === 'create' && (
        <div className="glass-card p-6 sm:p-8 lg:p-10 max-w-[800px] mx-auto">
          <h2 className="mt-0 mb-6 text-[1.4rem]">Create Announcement</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[0.9rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="p-3 sm:p-3.5 rounded-lg text-base" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="e.g. Q3 Town Hall Meeting" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[0.9rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 sm:p-3.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="General">General</option>
                  <option value="Policy Update">Policy Update</option>
                  <option value="Event">Event</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.9rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-3 sm:p-3.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="Normal">Normal (Blue)</option>
                  <option value="Important">Important (Orange)</option>
                  <option value="Urgent">Urgent (Red - Pinned)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.9rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Target Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className="p-3 sm:p-3.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="all">All Employees</option>
                  <option value="Engineering">Engineering Dept</option>
                  <option value="Design">Design Dept</option>
                  <option value="HR">HR Dept</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.9rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Message Content</label>
              <textarea required rows={6} value={content} onChange={(e) => setContent(e.target.value)} className="p-3 sm:p-3.5 rounded-lg resize-y" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} placeholder="Type your message here..." />
              <div className="text-[0.8rem]" style={{ color: 'var(--text-muted)' }}>* Line breaks will be preserved. Formatting tools coming soon.</div>
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-lg" style={{ border: '1px dashed var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div className="flex justify-between items-center">
                <label className="text-[0.9rem] font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <AlertTriangle size={16} /> Attach Poll (Optional)
                </label>
                <input type="checkbox" aria-label="Enable poll" checked={hasPoll} onChange={(e) => setHasPoll(e.target.checked)} />
              </div>
              
              {hasPoll && (
                <div className="flex flex-col gap-3 mt-3">
                  <input aria-label="Poll question" type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="p-3 sm:p-3.5 rounded-md" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="Poll Question..." />
                  {pollOptions.map((opt, i) => (
                    <input key={i} aria-label={`Poll option ${i + 1}`} type="text" value={opt} onChange={(e) => handlePollOptionChange(i, e.target.value)} className="p-3 sm:p-3.5 rounded-md" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder={`Option ${i + 1}`} />
                  ))}
                  <button type="button" aria-label="Add poll option" onClick={handleAddPollOption} className="self-start bg-transparent border-0 cursor-pointer text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>+ Add Option</button>
                </div>
              )}
            </div>

            <button aria-label="Publish announcement" type="submit" className="btn btn-primary p-3 sm:p-3.5 text-base mt-3">
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="flex flex-col gap-4 sm:gap-6 max-w-[800px] mx-auto">
          {announcements.length === 0 ? (
            <div className="glass-card p-8 sm:p-10 text-center" style={{ color: 'var(--text-secondary)' }}>
              No announcements found.
            </div>
          ) : (
            announcements.map(post => {
              const author = post.authorId === 'system' ? { name: 'System Auto-Post', avatar: '' } : employees.find(e => e.id === post.authorId) || { name: 'Unknown User' }
              const dateStr = formatDateTime(post.date)
              const isUrgent = post.priority === 'Urgent'

              return (
                <div key={post.id} className="glass-card p-5 sm:p-6 relative" style={{ borderLeft: `4px solid ${getPriorityColor(post.priority)}` }}>
                  {isUrgent && (
                    <div className="absolute top-3 right-3 text-[0.7rem] font-bold px-2 py-1 rounded-xl uppercase" style={{ background: 'var(--accent-danger)', color: '#fff' }}>
                      Pinned
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {author.avatar ? (
                        <img src={author.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          <Megaphone size={20} />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{author.name}</div>
                        <div className="text-[0.8rem]" style={{ color: 'var(--text-secondary)' }}>{dateStr} • {post.audience === 'all' ? 'All Employees' : post.audience}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.8rem] px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {post.category}
                      </span>
                      <button aria-label="Delete announcement" onClick={() => handleDelete(post.id)} className="bg-transparent border-0 cursor-pointer p-1" style={{ color: 'var(--accent-danger)' }} title="Delete Post">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="m-0 mb-3 text-xl" style={{ color: 'var(--text-primary)' }}>{post.title}</h3>
                  <div className="whitespace-pre-wrap leading-relaxed text-[0.95rem]" style={{ color: 'var(--text-secondary)' }}>
                    {post.content}
                  </div>

                  {post.poll && (
                    <div className="mt-5 p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                      <h4 className="m-0 mb-3 text-base" style={{ color: 'var(--text-primary)' }}>📊 {post.poll.question}</h4>
                      <div className="flex flex-col gap-2">
                        {post.poll.options.map((opt, i) => {
                          const votes = opt.votes.length
                          const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0)
                          const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100)
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="flex-1 relative overflow-hidden h-8 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                                <div className="absolute top-0 left-0 h-full opacity-20" style={{ width: `${pct}%`, background: 'var(--accent-primary)' }} />
                                <div className="absolute top-0 left-0 h-full w-full flex items-center px-3 text-[0.9rem]" style={{ color: 'var(--text-primary)' }}>
                                  {opt.text}
                                </div>
                              </div>
                              <div className="w-10 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>{votes}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div className="flex gap-4" aria-label="Post reactions">
                      <span aria-label={`${post.reactions['👍']} like reactions`} className="flex items-center gap-1.5 text-[0.9rem]" style={{ color: 'var(--text-secondary)' }}>
                        👍 {post.reactions['👍']}
                      </span>
                      <span aria-label={`${post.reactions['❤️']} heart reactions`} className="flex items-center gap-1.5 text-[0.9rem]" style={{ color: 'var(--text-secondary)' }}>
                        ❤️ {post.reactions['❤️']}
                      </span>
                      <span aria-label={`${post.reactions['🎉']} celebrate reactions`} className="flex items-center gap-1.5 text-[0.9rem]" style={{ color: 'var(--text-secondary)' }}>
                        🎉 {post.reactions['🎉']}
                      </span>
                      <span aria-label={`${post.comments.length} comments`} className="flex items-center gap-1.5 text-[0.9rem] ml-3" style={{ color: 'var(--text-secondary)' }}>
                        <MessageSquare size={16} /> {post.comments.length}
                      </span>
                    </div>
                    <div className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Users size={14} /> Read by {post.readBy.length} employees
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
      <AdSlot />
    </div>
  )
}
