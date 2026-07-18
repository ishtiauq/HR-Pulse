import { useState, useRef } from 'react'
import { FileText, Search, Upload, Download, Trash2, Folder, X, FileSpreadsheet, FileImage, FileArchive, File } from 'lucide-react'

const CATEGORIES = [
  { id: 'hr-docs', label: 'HR Documents', icon: Folder, color: '#3b82f6' },
  { id: 'policies', label: 'Policies', icon: FileText, color: '#10b981' },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet, color: '#f59e0b' },
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
  const fileInputRef = useRef(null)

  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('hr-docs')
  const [formDescription, setFormDescription] = useState('')
  const [formFile, setFormFile] = useState(null)

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

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[5]

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredDocs = documents.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || d.category === selectedCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={28} color="var(--accent-primary)" />
          Documents
        </h1>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          onClick={openUploadModal}>
          <Upload size={16} /> Upload
        </button>
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
        <div className="glass-card" style={{ padding: '64px 32px', textAlign: 'center' }}>
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
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                transition: 'all var(--transition-fast)', cursor: 'default'
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: `${catInfo.color}15`, color: catInfo.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{doc.name}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: `${catInfo.color}20`, color: catInfo.color, fontWeight: 600 }}>
                      <CatIcon size={10} style={{ display: 'inline', marginRight: '3px' }} />{catInfo.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.fileName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatFileSize(doc.fileSize)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded {formatDate(doc.uploadedAt)}</span>
                  </div>
                  {doc.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{doc.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button title="Download" style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Download size={16} />
                  </button>
                  <button title="Edit" onClick={() => openEditModal(doc)} style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Upload size={16} />
                  </button>
                  <button title="Delete" onClick={() => handleDelete(doc.id)} style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); resetForm() }}>
          <div className="modal-container" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDoc ? 'Edit Document' : 'Upload Document'}</h2>
              <button className="modal-close" onClick={() => { setShowUploadModal(false); resetForm() }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Document Name *</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Employee Handbook 2026"
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => {
                    const isActive = formCategory === cat.id
                    const Icon = cat.icon
                    return (
                      <button key={cat.id} type="button" onClick={() => setFormCategory(cat.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px',
                          border: isActive ? `2px solid ${cat.color}` : '1px solid var(--border-color)',
                          background: isActive ? `${cat.color}15` : 'var(--bg-tertiary)',
                          color: isActive ? cat.color : 'var(--text-secondary)',
                          fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                        }}>
                        <Icon size={14} /> {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              {!editingDoc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>File</label>
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '24px', borderRadius: '8px', border: '2px dashed var(--border-color)',
                      textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)',
                      background: formFile ? 'var(--accent-success-glow)' : 'var(--bg-tertiary)',
                      borderColor: formFile ? 'var(--accent-success)' : 'var(--border-color)',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => { if (!formFile) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
                    onMouseLeave={(e) => { if (!formFile) e.currentTarget.style.borderColor = 'var(--border-color)' }}>
                    <Upload size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{formFile ? formFile.name : 'Click to select a file'}</p>
                    {formFile && <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>{formatFileSize(formFile.size)}</p>}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Brief description (optional)"
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-outline" onClick={() => { setShowUploadModal(false); resetForm() }}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  {editingDoc ? 'Update' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
