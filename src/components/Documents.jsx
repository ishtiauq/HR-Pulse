import { useState, useRef, useEffect } from 'react'
import { useModal } from '../services/useModal.js'
import { FileText, Search, Upload, Download, Trash2, Folder, X, FileSpreadsheet, FileImage, FileArchive, File, Settings, Pencil, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import AdSlot from './AdSlot'
import { formatDate } from '../services/date.js'

const defaultCategories = [
  { id: 'hr-docs', label: 'HR Documents', icon: Folder, color: '#3b82f6' },
  { id: 'policies', label: 'Policies', icon: FileText, color: '#10b981' },
  { id: 'forms', label: 'Forms', icon: FileText, color: '#8b5cf6' },
  { id: 'training', label: 'Training', icon: FileArchive, color: '#ec4899' },
  { id: 'other', label: 'Other', icon: File, color: '#64748b' },
]

const getFileIcon = (type) => {
  if (!type) return File
  const t = type.toLowerCase()
  if (t.includes('pdf')) return FileText
  if (t.includes('sheet') || t.includes('excel') || t.includes('xls') || t.includes('csv')) return FileSpreadsheet
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif')) return FileImage
  if (t.includes('zip') || t.includes('rar') || t.includes('tar') || t.includes('gz')) return FileArchive
  return File
}

const formatFileSize = (bytes) => {
  if (!bytes) return '--'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Documents({ documents, setDocuments, addLog, addToast, currentUser }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [categories, setCategories] = useState(defaultCategories)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [catFormName, setCatFormName] = useState('')
  const [catFormColor, setCatFormColor] = useState('#3b82f6')
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const categoryScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkCategoryScroll = () => {
    const el = categoryScrollRef.current
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
    }
  }

  useEffect(() => {
    checkCategoryScroll()
    const el = categoryScrollRef.current
    if (el) {
      el.addEventListener('scroll', checkCategoryScroll)
      return () => el.removeEventListener('scroll', checkCategoryScroll)
    }
  }, [categories])

  const scrollCategory = (dir) => {
    const el = categoryScrollRef.current
    if (el) el.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      setTimeout(checkCategoryScroll, 50)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('hr-docs')
  const [formDescription, setFormDescription] = useState('')
  const [formFile, setFormFile] = useState(null)
  useModal(() => { setShowUploadModal(false); resetForm() })

  const resetForm = () => {
    setFormName('')
    setFormCategory('hr-docs')
    setFormDescription('')
    setFormFile(null)
    setEditingDoc(null)
  }

  const openUploadModal = () => {
    resetForm()
    setShowUploadModal(true)
  }

  const openEditModal = (doc) => {
    setEditingDoc(doc)
    setFormName(doc.name)
    setFormCategory(doc.category)
    setFormDescription(doc.description || '')
    setFormFile(null)
    setShowUploadModal(true)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) setFormFile(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!formName) return addToast('Document name is required', 'warning')

    if (editingDoc) {
      setDocuments(prev => prev.map(d =>
        d.id === editingDoc.id
          ? { ...d, name: formName, category: formCategory, description: formDescription }
          : d
      ))
      addToast('Document updated', 'success')
      addLog('Document Updated', formName)
    } else {
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: formName,
        category: formCategory,
        description: formDescription,
        fileName: formFile?.name || `${formName.replace(/\s+/g, '_')}.pdf`,
        fileSize: formFile?.size || Math.floor(Math.random() * 5000000) + 100000,
        fileType: formFile?.type || 'application/pdf',
        uploadedBy: currentUser?.id || 'unknown',
        uploadedAt: new Date().toISOString(),
      }
      setDocuments(prev => [newDoc, ...prev])
      addToast('Document uploaded successfully', 'success')
      addLog('Document Uploaded', formName)
    }

    setShowUploadModal(false)
    resetForm()
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this document?')) {
      setDocuments(prev => prev.filter(d => d.id !== id))
      addToast('Document deleted', 'info')
    }
  }

  const handleSaveCategory = () => {
    if (!catFormName.trim()) return addToast('Category name is required', 'warning')
    if (editingCategory) {
      setCategories(prev => prev.map(c =>
        c.id === editingCategory.id ? { ...c, label: catFormName.trim(), color: catFormColor } : c
      ))
      addToast('Category updated', 'success')
    } else {
      setCategories(prev => [...prev, { id: `cat-${Date.now()}`, label: catFormName.trim(), icon: File, color: catFormColor }])
      addToast('Category added', 'success')
    }
    setShowCategoryModal(false)
  }

  const handleDeleteCategory = (catId) => {
    const docsInCategory = documents.filter(d => d.category === catId)
    if (docsInCategory.length > 0) {
      if (!window.confirm(`"${getCategoryInfo(catId)?.label}" category has ${docsInCategory.length} document(s). Moving them to the first available category. Delete anyway?`)) return
      const remaining = categories.filter(c => c.id !== catId)
      const fallback = remaining.length > 0 ? remaining[0].id : 'other'
      setDocuments(prev => prev.map(d =>
        d.category === catId ? { ...d, category: fallback } : d
      ))
    } else {
      if (!window.confirm(`Delete "${getCategoryInfo(catId)?.label}" category?`)) return
    }
    setCategories(prev => prev.filter(c => c.id !== catId))
    if (selectedCategory === catId) setSelectedCategory('all')
    addToast('Category deleted', 'info')
  }

  const getCategoryInfo = (catId) => categories.find(c => c.id === catId) || categories[categories.length - 1]

  const filteredDocs = documents.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || d.category === selectedCategory
    return matchSearch && matchCategory
  })

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const theme = {
    bg: isDark ? '#000000' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    secondary: isDark ? '#cccccc' : '#333333',
    muted: isDark ? '#999999' : '#666666',
    border: isDark ? '#333333' : '#e0e0e0',
    inputBg: isDark ? '#1a1a1a' : '#f5f5f5'
  }

  return (
    <div className="fade-in px-1 sm:px-0 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
          <FileText size={20} className="text-primary" />
          Documents
        </h1>
      </div>
      <hr className="border-border my-0" />

      {/* Upload Hero Card */}
      <div className="glass-card cursor-pointer text-center mb-6 flex flex-col items-center gap-3 p-6 sm:p-8 lg:p-10" onClick={openUploadModal} role="button" tabIndex={0} aria-label="Upload document"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openUploadModal() } }}
        style={{
          border: '2px dashed var(--border-color)', borderRadius: '16px',
          background: 'var(--bg-secondary)',
          transition: 'border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.background = 'var(--accent-primary-glow, rgba(59,130,246,0.04))';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.background = 'var(--bg-secondary)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
        <div className="flex items-center justify-center" style={{
          width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', borderRadius: isMobile ? '12px' : '14px',
          background: 'var(--accent-primary-glow, rgba(59,130,246,0.1))',
          color: 'var(--accent-primary)',
        }}>
          <Upload size={isMobile ? 22 : 28} />
        </div>
        <div>
          <h3 className="m-0 font-bold" style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: 'var(--text-primary)' }}>Upload Document</h3>
          <p className="m-0 mt-1 text-[0.85rem]" style={{ color: 'var(--text-muted)' }}>
            Click to upload — PDF, images, spreadsheets & more
          </p>
        </div>
      </div>

      <div className="relative flex items-center mb-3">
        <Search size={16} className="absolute left-3" style={{ color: 'var(--text-muted)' }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." aria-label="Search documents"
          className="w-full p-2.5 pl-9 rounded-lg text-[0.9rem]" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
      </div>

      <div className="flex gap-2 mb-5">
        <div className="glass-card flex-1 min-w-0 flex items-center p-3 pl-1 rounded-xl">
          <div className="relative flex-1 min-w-0 overflow-hidden flex items-center">
            {canScrollLeft && (
              <button onClick={() => scrollCategory(-1)}
                className="absolute left-1 z-[3] flex items-center justify-center rounded-full cursor-pointer"
                style={{ background: 'var(--md-bw-surface-variant)', border: 'none', width: '28px', height: '28px', color: 'var(--md-bw-on-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                <ChevronLeft size={18} />
              </button>
            )}
            <div ref={categoryScrollRef} className="flex gap-1.5 flex-nowrap overflow-hidden scroll-smooth flex-1 px-1">
              <button onClick={() => setSelectedCategory('all')}
                className="shrink-0 px-3.5 py-1.5 rounded-full font-semibold text-[0.8rem] cursor-pointer"
                style={{ background: selectedCategory === 'all' ? 'var(--md-bw-primary)' : 'var(--md-bw-surface-variant)', color: selectedCategory === 'all' ? 'var(--md-bw-on-primary)' : 'var(--md-bw-on-surface)', border: selectedCategory === 'all' ? 'none' : '1px solid var(--md-bw-outline)' }}>
                All
              </button>
              {categories.map(cat => {
                const isActive = selectedCategory === cat.id
                const isProtected = cat.id === 'other'
                const showActions = hoveredCategory === cat.id && !isActive && !isProtected
                return (
                  <div key={cat.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}>
                    <button onClick={() => setSelectedCategory(cat.id)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5"
                      style={{borderRadius: '20px', background: isActive ? cat.color : 'var(--md-bw-surface-variant)',
                        color: isActive ? '#fff' : 'var(--md-bw-on-surface)', fontWeight: 600, fontSize: '0.8rem',
                        cursor: 'pointer', border: isActive ? 'none' : '1px solid var(--md-bw-outline)',
                        paddingRight: showActions ? '32px' : '14px',
                        transition: 'border-color var(--transition-fast), background var(--transition-fast)'
                      }}>
                      {cat.label}
                    </button>
                    {showActions && (
                      <span style={{ position: 'absolute', right: '8px', display: 'flex', gap: '2px', alignItems: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setCatFormName(cat.label); setCatFormColor(cat.color); setShowCategoryModal(true) }}
                          style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--md-bw-on-surface)', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                          <Pencil size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id) }}
                          style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                          <Trash2 size={10} />
                        </button>
                      </span>
                    )}
                  </div>
                )
              })}
              {categories.length > 0 && (
                <button onClick={() => {
                  setEditingCategory(null)
                  setCatFormName('')
                  setCatFormColor('#3b82f6')
                  setShowCategoryModal(true)
                }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5" style={{borderRadius: '20px', background: 'transparent',
                    color: 'var(--md-bw-on-surface)', fontWeight: 600, fontSize: '0.85rem',
                    cursor: 'pointer', border: '1px dashed var(--md-bw-outline)',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'border-color var(--transition-fast), color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--md-bw-outline)'; e.currentTarget.style.color = 'var(--md-bw-on-surface)' }}>
                  <Plus size={14} /> Add
                </button>
              )}
            </div>
            {canScrollRight && (
              <button onClick={() => scrollCategory(1)}
                className="absolute right-1 z-[3] flex items-center justify-center rounded-full cursor-pointer"
                style={{ background: 'var(--md-bw-surface-variant)', border: 'none', width: '28px', height: '28px', color: 'var(--md-bw-on-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="glass-card shrink-0 flex items-center p-3 px-4 rounded-xl">
          <button onClick={() => { setEditingCategory(null); setCatFormName(''); setCatFormColor('#3b82f6'); setShowCategoryModal(true) }}
            className="px-2.5 py-1.5 rounded-lg bg-transparent font-semibold text-[0.8rem] cursor-pointer border-0 flex items-center gap-1 whitespace-nowrap"
            style={{ color: 'var(--md-bw-on-surface)', transition: 'color var(--transition-fast)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--md-bw-on-surface)' }}>
            <Settings size={14} /> Manage
          </button>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="glass-card text-center p-8 sm:p-10 lg:p-12">
          <FileText size={48} className="mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
          <h3 className="m-0 mb-2" style={{ color: 'var(--text-secondary)' }}>No documents found</h3>
          <p className="m-0 text-[0.9rem]" style={{ color: 'var(--text-muted)' }}>
            {search || selectedCategory !== 'all' ? 'Try a different search or filter' : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <div role="list" className="flex flex-col gap-2">
          {filteredDocs.map(doc => {
            const catInfo = getCategoryInfo(doc.category)
            const Icon = getFileIcon(doc.fileType)
            const CatIcon = catInfo.icon
            return (
              <div key={doc.id} role="listitem" className="glass-card cursor-default p-3 sm:p-4 lg:p-5" style={{
                display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '12px' : '16px',
                transition: 'border-color var(--transition-fast)',
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center shrink-0 rounded-xl" style={{
                    width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px',
                    background: `${catInfo.color}15`, color: catInfo.color,
                  }}>
                    <Icon size={isMobile ? 18 : 20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold" style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', color: 'var(--text-primary)' }}>{doc.name}</span>
                      <span className="text-[0.7rem] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${catInfo.color}20`, color: catInfo.color }}>
                        <CatIcon size={10} className="inline mr-0.5" />{catInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-muted)' }}>{doc.fileName}</span>
                      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)' }}>{formatFileSize(doc.fileSize)}</span>
                      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)' }}>Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                    {doc.description && (
                      <p style={{ fontSize: isMobile ? '0.78rem' : '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{doc.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1" style={{ justifyContent: isMobile ? 'flex-end' : 'flex-start', borderTop: isMobile ? '1px solid var(--border-color)' : 'none', paddingTop: isMobile ? '10px' : '0' }}>
                  <button aria-label="Download document" className="bg-transparent border-0 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1 text-[0.8rem]" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Download size={16} /> {isMobile ? 'Download' : ''}
                  </button>
                  <button aria-label="Edit document" onClick={() => openEditModal(doc)} className="bg-transparent border-0 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1 text-[0.8rem]" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Upload size={16} /> {isMobile ? 'Edit' : ''}
                  </button>
                  <button aria-label="Delete document" onClick={() => handleDelete(doc.id)} className="bg-transparent border-0 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1 text-[0.8rem]" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 size={16} /> {isMobile ? 'Delete' : ''}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center" onClick={() => { setShowUploadModal(false); resetForm() }}
          style={{
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            zIndex: 10000, padding: isMobile ? '12px' : '20px'
          }}>
          <div className="modal-container"
            style={{ maxWidth: isMobile ? '100%' : '520px', width: '100%', padding: 0, borderRadius: isMobile ? '12px' : '14px', background: theme.bg, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'modalFadeIn 0.2s ease', margin: isMobile ? '10px' : '0' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header flex justify-between items-start" style={{ padding: isMobile ? '16px' : '20px 24px', borderBottom: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl" style={{
                  width: '40px', height: '40px',
                  background: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6',
                }}>
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="m-0 text-lg" style={{ color: theme.text }}>{editingDoc ? 'Edit Document' : 'Upload Document'}</h2>
                  <p className="m-0 mt-0.5 text-[0.8rem]" style={{ color: theme.muted }}>
                    {editingDoc ? 'Update document details' : 'Add a new document to the repository'}
                  </p>
                </div>
              </div>
              <button className="modal-close bg-transparent border-0 cursor-pointer p-1" aria-label="Close" onClick={() => { setShowUploadModal(false); resetForm() }} style={{ color: theme.muted }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col" style={{ padding: isMobile ? '16px' : '24px', gap: isMobile ? '16px' : '20px' }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold" style={{ color: theme.secondary }}>Document Name *</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Employee Handbook 2026" aria-label="Document name"
                  className="p-2.5 px-3.5 rounded-lg text-[0.95rem] outline-none"
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: theme.inputBg, color: theme.text,
                    transition: 'border-color var(--transition-fast)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold" style={{ color: theme.secondary }}>Category</label>
                <div className="flex gap-1.5 flex-wrap">
                  {categories.map(cat => {
                    const isActive = formCategory === cat.id
                    const Icon = cat.icon
                    return (
                      <button key={cat.id} type="button" onClick={() => setFormCategory(cat.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-[0.8rem] cursor-pointer"
                        style={{
                          border: isActive ? `2px solid ${cat.color}` : `1px solid ${theme.border}`,
                          background: isActive ? `${cat.color}18` : theme.inputBg,
                          color: isActive ? cat.color : theme.secondary,
                          transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                        }}>
                        <Icon size={14} /> {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              {!editingDoc && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold" style={{ color: theme.secondary }}>File</label>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl text-center cursor-pointer"
                    style={{
                      padding: isMobile ? '24px 16px' : '32px 20px',
                      border: `2px dashed ${formFile ? '#10b981' : theme.border}`,
                      background: formFile ? 'rgba(16,185,129,0.06)' : theme.inputBg,
                      transition: 'border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      if (!formFile) { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59,130,246,0.04)' }
                    }}
                    onMouseLeave={(e) => {
                      if (!formFile) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.inputBg }
                    }}>
                    {formFile ? (
                      <>
                        <div className="w-10 h-10 rounded-xl inline-flex items-center justify-center mb-2.5" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                          <FileText size={20} />
                        </div>
                        <p className="m-0 text-[0.9rem] font-semibold" style={{ color: theme.text }}>{formFile.name}</p>
                        <p className="m-0 mt-1 text-[0.78rem]" style={{ color: theme.muted }}>{formatFileSize(formFile.size)}</p>
                      </>
                    ) : (
                      <>
                        <Upload size={isMobile ? 22 : 28} className="mb-2.5 opacity-60" style={{ color: theme.muted }} />
                        <p className="m-0 text-[0.9rem]" style={{ color: theme.secondary }}><span className="font-semibold" style={{ color: '#3b82f6' }}>Click to browse</span> or drop a file</p>
                        <p className="m-0 mt-1.5 text-[0.75rem]" style={{ color: theme.muted }}>PDF, Images, Spreadsheets — up to 10MB</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold" style={{ color: theme.secondary }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Brief description (optional)" aria-label="Document description"
                  className="p-2.5 px-3.5 rounded-lg text-[0.95rem] resize-y outline-none"
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: theme.inputBg, color: theme.text,
                    transition: 'border-color var(--transition-fast)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              </div>
              <div className="flex gap-3 justify-end" style={{ borderTop: `1px solid ${theme.border}`, paddingTop: isMobile ? '16px' : '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowUploadModal(false); resetForm() }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-1.5">
                  <Upload size={16} /> {editingDoc ? 'Update' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center" onClick={() => setShowCategoryModal(false)}
          style={{
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            zIndex: 10000, padding: isMobile ? '12px' : '20px'
          }}>
          <div className="modal-container"
            style={{ maxWidth: isMobile ? '100%' : '480px', width: '100%', padding: 0, borderRadius: isMobile ? '12px' : '14px', background: theme.bg, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'modalFadeIn 0.2s ease', margin: isMobile ? '10px' : '0' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header flex justify-between items-center" style={{ padding: isMobile ? '16px' : '20px 24px', borderBottom: `1px solid ${theme.border}` }}>
              <h2 className="m-0 text-lg" style={{ color: theme.text }}>Manage Categories</h2>
              <button className="modal-close bg-transparent border-0 cursor-pointer p-1" aria-label="Close" onClick={() => setShowCategoryModal(false)} style={{ color: theme.muted }}><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-5" style={{ padding: isMobile ? '16px' : '24px' }}>
              {/* Category list */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold" style={{ color: theme.secondary }}>Categories</label>
                <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                  {categories.filter(c => c.id !== 'other').map(cat => (
                    <div key={cat.id} className="flex items-center gap-2.5 p-2 px-3 rounded-lg" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
                      <div className="w-6 h-6 rounded-md shrink-0" style={{ background: cat.color }} />
                      <span className="flex-1 text-[0.9rem] font-medium" style={{ color: theme.text }}>{cat.label}</span>
                      <button aria-label="Edit category" onClick={() => { setEditingCategory(cat); setCatFormName(cat.label); setCatFormColor(cat.color) }}
                        className="bg-transparent border-0 p-1 cursor-pointer flex" style={{ color: theme.muted }}>
                        <Pencil size={14} />
                      </button>
                      <button aria-label="Delete category" onClick={() => handleDeleteCategory(cat.id)}
                        className="bg-transparent border-0 p-1 cursor-pointer flex" style={{ color: theme.muted }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {categories.filter(c => c.id === 'other').map(cat => (
                    <div key={cat.id} className="flex items-center gap-2.5 p-2 px-3 rounded-lg opacity-60" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
                      <div className="w-6 h-6 rounded-md shrink-0" style={{ background: cat.color }} />
                      <span className="flex-1 text-[0.9rem] font-medium" style={{ color: theme.text }}>{cat.label}</span>
                      <span className="text-[0.75rem]" style={{ color: theme.muted }}>Protected</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                <h3 className="m-0 mb-3 text-[0.95rem] font-semibold" style={{ color: theme.text }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                <div className="flex flex-col gap-3">
                  <input type="text" value={catFormName} onChange={e => setCatFormName(e.target.value)} aria-label="Category name"
                    placeholder={editingCategory ? 'Category name' : 'e.g. Payroll'}
                    className="p-2.5 px-3.5 rounded-lg text-[0.95rem] outline-none"
                    style={{
                      border: `1px solid ${theme.border}`,
                      background: theme.inputBg, color: theme.text,
                      transition: 'border-color var(--transition-fast)'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()} />
                  <div className="flex gap-2 flex-wrap">
                    {['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b', '#f59e0b'].map(color => (
                      <button key={color} type="button" onClick={() => setCatFormColor(color)}
                        className="rounded-full cursor-pointer"
                        style={{
                          width: '32px', height: '32px', background: color,
                          border: catFormColor === color ? '3px solid var(--md-bw-primary)' : `2px solid ${color}`,
                          outline: catFormColor === color ? `2px solid ${color}` : 'none',
                          outlineOffset: '2px', transition: 'transform var(--transition-fast)',
                          transform: catFormColor === color ? 'scale(1.15)' : 'scale(1)'
                        }} />
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    {editingCategory && (
                      <button type="button" className="btn btn-secondary px-3.5 py-2" onClick={() => { setEditingCategory(null); setCatFormName(''); setCatFormColor('#3b82f6') }}
                        style={{ fontSize: '0.85rem' }}>
                        Cancel
                      </button>
                    )}
                    <button type="button" className="btn btn-primary flex items-center gap-1.5 px-3.5 py-2" onClick={handleSaveCategory}
                      style={{ fontSize: '0.85rem' }}>
                      {editingCategory ? 'Save' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AdSlot />
    </div>
  )
}
