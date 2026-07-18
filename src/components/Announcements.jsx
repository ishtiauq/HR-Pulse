import { useState } from 'react'
import { Megaphone, Plus, Image as ImageIcon, FileText, Send, Calendar, Clock, Edit, Trash2, Users, AlertTriangle, MessageSquare, Heart, ThumbsUp, PartyPopper } from 'lucide-react'
import { formatDateTime } from '../services/date.js'

export default function Announcements({ employees, announcements, setAnnouncements, addLog, addToast, currentUser }) {
  const [activeTab, setActiveTab] = useState('feed') // 'feed', 'create'
  
  // Form States
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('Normal')
  const [audience, setAudience] = useState('all') // 'all', department name, or 'selected'
  
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
      attachments: [], // Mocking for now
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
    
    // Reset
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
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header">
        <h1 className="page-title">
          <Megaphone size={28} className="page-title-icon" />
          Announcements
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'feed' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'feed' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('feed')}>Company Feed</button>
          <button className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'create' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'create' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setActiveTab('create')}>
            <Plus size={16} /> New Post
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="glass-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.4rem' }}>Create Announcement</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '1.1rem' }} placeholder="e.g. Q3 Town Hall Meeting" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="General">General</option>
                  <option value="Policy Update">Policy Update</option>
                  <option value="Event">Event</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="Normal">Normal (Blue)</option>
                  <option value="Important">Important (Orange)</option>
                  <option value="Urgent">Urgent (Red - Pinned)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  <option value="all">All Employees</option>
                  <option value="Engineering">Engineering Dept</option>
                  <option value="Design">Design Dept</option>
                  <option value="HR">HR Dept</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Message Content</label>
              <textarea required rows={6} value={content} onChange={(e) => setContent(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Type your message here..." />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Line breaks will be preserved. Formatting tools coming soon.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> Attach Poll (Optional)
                </label>
                <input type="checkbox" checked={hasPoll} onChange={(e) => setHasPoll(e.target.checked)} />
              </div>
              
              {hasPoll && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder="Poll Question..." />
                  {pollOptions.map((opt, i) => (
                    <input key={i} type="text" value={opt} onChange={(e) => handlePollOptionChange(i, e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} placeholder={`Option ${i + 1}`} />
                  ))}
                  <button type="button" onClick={handleAddPollOption} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>+ Add Option</button>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1.1rem', marginTop: '12px' }}>
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {announcements.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No announcements found.
            </div>
          ) : (
            announcements.map(post => {
              const author = post.authorId === 'system' ? { name: 'System Auto-Post', avatar: '' } : employees.find(e => e.id === post.authorId) || { name: 'Unknown User' }
              const dateStr = formatDateTime(post.date)
              const isUrgent = post.priority === 'Urgent'

              return (
                <div key={post.id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${getPriorityColor(post.priority)}`, position: 'relative' }}>
                  {isUrgent && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-danger)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                      Pinned
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {author.avatar ? (
                        <img src={author.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                          <Megaphone size={20} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{author.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dateStr} • {post.audience === 'all' ? 'All Employees' : post.audience}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {post.category}
                      </span>
                      <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }} title="Delete Post">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{post.title}</h3>
                  <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    {post.content}
                  </div>

                  {post.poll && (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>📊 {post.poll.question}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {post.poll.options.map((opt, i) => {
                          const votes = opt.votes.length
                          const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0)
                          const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100)
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: '4px', height: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, background: 'var(--accent-primary)', opacity: 0.2 }}></div>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {opt.text}
                                </div>
                              </div>
                              <div style={{ width: '40px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{votes}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        👍 {post.reactions['👍']}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        ❤️ {post.reactions['❤️']}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        🎉 {post.reactions['🎉']}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                        <MessageSquare size={16} /> {post.comments.length}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} /> Read by {post.readBy.length} employees
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
