import { useState, useRef, useEffect } from 'react'
import { useModal } from '../services/useModal.js'
import { FileText, Search, Upload, Download, Trash2, Folder, X, FileSpreadsheet, FileImage, FileArchive, File } from 'lucide-react'
import AdSlot from './AdSlot'
import { formatDate } from '../services/date.js'

const CATEGORIES = [
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
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
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

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1]

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
    <div className="fade-in" style={{ padding: isMobile ? '0 4px 40px' : '0 0 40px 0' }}>
      <div className="page-header">
        <h1 className="page-title">
          <FileText size={28} className="page-title-icon" />
          Documents
        </h1>
      </div>

      {/* Upload Hero Card */}
      <div className="glass-card" onClick={openUploadModal}
        style={{
          padding: isMobile ? '24px 16px' : '36px 24px', cursor: 'pointer', textAlign: 'center', marginBottom: '24px',
          border: '2px dashed var(--border-color)', borderRadius: '16px',
          background: 'var(--bg-secondary)',
          transition: 'border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
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
        <div style={{
          width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', borderRadius: isMobile ? '12px' : '14px',
          background: 'var(--accent-primary-glow, rgba(59,130,246,0.1))',
          color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Upload size={isMobile ? 22 : 28} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upload Document</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Click to upload — PDF, images, spreadsheets & more
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedCategory('all')}
            style={{ padding: '6px 14px', borderRadius: '20px', background: selectedCategory === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: selectedCategory === 'all' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', border: selectedCategory === 'all' ? 'none' : '1px solid var(--border-color)' }}>
            All
          </button>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                style={{ padding: '6px 14px', borderRadius: '20px', background: isActive ? cat.color : 'var(--bg-secondary)', color: isActive ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', border: isActive ? 'none' : '1px solid var(--border-color)' }}>
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="glass-card" style={{ padding: isMobile ? '48px 20px' : '64px 32px', textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>No documents found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {search || selectedCategory !== 'all' ? 'Try a different search or filter' : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredDocs.map(doc => {
            const catInfo = getCategoryInfo(doc.category)
            const Icon = getFileIcon(doc.fileType)
            const CatIcon = catInfo.icon
            return (
              <div key={doc.id} className="glass-card" style={{
                display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '12px' : '16px', padding: isMobile ? '14px' : '16px 20px',
                transition: 'border-color var(--transition-fast)', cursor: 'default'
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%'
                }}>
                  <div style={{
                    width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', borderRadius: '10px',
                    background: `${catInfo.color}15`, color: catInfo.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={isMobile ? 18 : 20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: isMobile ? '0.85rem' : '0.95rem', color: 'var(--text-primary)' }}>{doc.name}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: `${catInfo.color}20`, color: catInfo.color, fontWeight: 600 }}>
                        <CatIcon size={10} style={{ display: 'inline', marginRight: '3px' }} />{catInfo.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-muted)' }}>{doc.fileName}</span>
                      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)' }}>{formatFileSize(doc.fileSize)}</span>
                      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)' }}>Uploaded {formatDate(doc.uploadedAt)}</span>
                    </div>
                    {doc.description && (
                      <p style={{ fontSize: isMobile ? '0.78rem' : '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{doc.description}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: isMobile ? 'flex-end' : 'flex-start', borderTop: isMobile ? '1px solid var(--border-color)' : 'none', paddingTop: isMobile ? '10px' : '0' }}>
                  <button title="Download" style={{ background: 'transparent', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Download size={16} /> {isMobile ? 'Download' : ''}
                  </button>
                  <button title="Edit" onClick={() => openEditModal(doc)} style={{ background: 'transparent', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Upload size={16} /> {isMobile ? 'Edit' : ''}
                  </button>
                  <button title="Delete" onClick={() => handleDelete(doc.id)} style={{ background: 'transparent', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
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
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); resetForm() }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: isMobile ? '12px' : '20px'
          }}>
          <div className="modal-container"
            style={{ maxWidth: isMobile ? '100%' : '520px', width: '100%', padding: 0, borderRadius: isMobile ? '12px' : '14px', background: theme.bg, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'modalFadeIn 0.2s ease', margin: isMobile ? '10px' : '0' }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: isMobile ? '16px' : '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Upload size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: theme.text }}>{editingDoc ? 'Edit Document' : 'Upload Document'}</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: theme.muted }}>
                    {editingDoc ? 'Update document details' : 'Add a new document to the repository'}
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => { setShowUploadModal(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted, padding: '4px' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.secondary }}>Document Name *</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Employee Handbook 2026"
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`,
                    background: theme.inputBg, color: theme.text, fontSize: '0.95rem',
                    outline: 'none', transition: 'border-color var(--transition-fast)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.secondary }}>Category</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => {
                    const isActive = formCategory === cat.id
                    const Icon = cat.icon
                    return (
                      <button key={cat.id} type="button" onClick={() => setFormCategory(cat.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px',
                          border: isActive ? `2px solid ${cat.color}` : `1px solid ${theme.border}`,
                          background: isActive ? `${cat.color}18` : theme.inputBg,
                          color: isActive ? cat.color : theme.secondary,
                          fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                          transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                        }}>
                        <Icon size={14} /> {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              {!editingDoc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.secondary }}>File</label>
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: isMobile ? '24px 16px' : '32px 20px', borderRadius: '10px', border: `2px dashed ${theme.border}`,
                      textAlign: 'center', cursor: 'pointer',
                      background: formFile ? 'rgba(16,185,129,0.06)' : theme.inputBg,
                      borderColor: formFile ? '#10b981' : theme.border,
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
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                          <FileText size={20} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: theme.text }}>{formFile.name}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: theme.muted }}>{formatFileSize(formFile.size)}</p>
                      </>
                    ) : (
                      <>
                        <Upload size={isMobile ? 22 : 28} style={{ marginBottom: '10px', color: theme.muted, opacity: 0.6 }} />
                        <p style={{ margin: 0, fontSize: '0.9rem', color: theme.secondary }}><span style={{ color: '#3b82f6', fontWeight: 600 }}>Click to browse</span> or drop a file</p>
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: theme.muted }}>PDF, Images, Spreadsheets — up to 10MB</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.secondary }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Brief description (optional)"
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`,
                    background: theme.inputBg, color: theme.text, fontSize: '0.95rem',
                    resize: 'vertical', outline: 'none', transition: 'border-color var(--transition-fast)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: `1px solid ${theme.border}`, paddingTop: isMobile ? '16px' : '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowUploadModal(false); resetForm() }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={16} /> {editingDoc ? 'Update' : 'Upload'}
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
