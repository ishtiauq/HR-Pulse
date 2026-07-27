import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, UserPlus, X, Edit, Check, AlertCircle, FileSpreadsheet, Users, Mail, Eye, ChevronDown, Download } from 'lucide-react'
import { useModal } from '../services/useModal.js'
import AdSlot from './AdSlot.jsx'
import { formatDate } from '../services/date.js'
import { hashPassword } from '../services/crypto.js'

export default function Employees({ employees, setEmployees, addLog, driveConnected, addAuditLog, pendingProfileEdits, setPendingProfileEdits, addToast, selectedEmployeeId, setSelectedEmployeeId }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [viewingEmployee, setViewingEmployee] = useState(null)
  const [imageErrors, setImageErrors] = useState({})
  const [expandedCardId, setExpandedCardId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmDelete, setConfirmDelete] = useState(null)
  useModal(() => setViewingEmployee(null))

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setViewingEmployee(null)
    }
    if (viewingEmployee) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewingEmployee])

  useEffect(() => {
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId)
      if (emp) {
        setViewingEmployee(emp)
      }
      setSelectedEmployeeId(null)
    }
  }, [selectedEmployeeId, employees, setSelectedEmployeeId])

  useEffect(() => {
    if (!showAddForm) return
    const handleEsc = (e) => { if (e.key === 'Escape') handleCloseForm() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [showAddForm])

  const getAvatarFallback = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa']
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const color = colors[hash % colors.length]
    return { initials, color }
  }

  // Form states
  const [newEmpId, setNewEmpId] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newDept, setNewDept] = useState('Engineering')
  const [newEmail, setNewEmail] = useState('')
  const [newStatus, setNewStatus] = useState('Active')
  const [newDob, setNewDob] = useState('')
  const [newJoiningDate, setNewJoiningDate] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCvFileName, setNewCvFileName] = useState('')
  const [newNidFileName, setNewNidFileName] = useState('')
  const [newAvatar, setNewAvatar] = useState('')
  
  // Repositioning states
  const [photoX, setPhotoX] = useState(0)
  const [photoY, setPhotoY] = useState(0)
  const [photoZoom, setPhotoZoom] = useState(1)
  const [dragStart, setDragStart] = useState(null)

  // Dynamic department states
  const [isCustomDept, setIsCustomDept] = useState(false)
  const [customDept, setCustomDept] = useState('')

  // Compute dynamic departments list from default + current employees
  const defaultDepts = ['Engineering', 'Design', 'Human Resources']
  const activeDepts = Array.from(new Set([...defaultDepts, ...employees.map(emp => emp.department)]))
  const filterDepartments = ['All', ...activeDepts]

  // Image Drag Handlers
  const handlePointerDown = (e) => {
    e.preventDefault()
    setDragStart({ x: e.clientX - photoX, y: e.clientY - photoY })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragStart) return
    setPhotoX(e.clientX - dragStart.x)
    setPhotoY(e.clientY - dragStart.y)
  }

  const handlePointerUp = (e) => {
    if (dragStart) {
      setDragStart(null)
    }
  }

  const handleOpenAddForm = () => {
    const generatedId = `EMP-${Math.floor(100 + Math.random() * 900)}`
    setNewEmpId(generatedId)
    setNewPassword('')
    setNewAvatar('')
    setPhotoX(0)
    setPhotoY(0)
    setPhotoZoom(1)
    setShowAddForm(true)
  }

  const handleSaveEmployee = async (e) => {
    e.preventDefault()
    if (!newEmpId || !newName || !newRole || !newEmail) return

    const finalDept = isCustomDept ? customDept.trim() : newDept
    if (!finalDept) return

    // Prevent duplicate ID for new employees
    if (!editingEmployee && employees.some(emp => emp.id === newEmpId)) {
      alert(`An employee with ID "${newEmpId}" already exists. Please choose a unique ID.`)
      return
    }

    let passwordHash;
    if (editingEmployee) {
      if (newPassword) {
        passwordHash = await hashPassword(newPassword);
      } else {
        passwordHash = editingEmployee.passwordHash || editingEmployee.password || '';
      }
    } else {
      passwordHash = newPassword ? await hashPassword(newPassword) : '';
    }

    if (editingEmployee) {
      // Update employee list
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        id: newEmpId,
        name: newName,
        role: newRole,
        department: finalDept,
        status: newStatus,
        email: newEmail,
        passwordHash,
        dob: newDob,
        joiningDate: newJoiningDate,
        cvFileName: newCvFileName,
        nidFileName: newNidFileName,
        avatar: newAvatar || emp.avatar,
        photoX: photoX,
        photoY: photoY,
        photoZoom: photoZoom
      } : emp))
      
      addLog('Updated employee profile', `Saved edits for ${newName} (${newEmpId}) to Google Drive`)
      if (addAuditLog) addAuditLog('UPDATE', 'Employee', `Updated employee profile for ${newName} (${newEmpId})`)
      if (newCvFileName) {
        addLog('CV Synced', `Uploaded CV (${newCvFileName}) for ${newName} to Drive EMP folder`)
      }
      if (newNidFileName) {
        addLog('Identity Synced', `Uploaded ID/Passport (${newNidFileName}) for ${newName} to Drive secure folder`)
      }
    } else {
      // Add new employee
      const newEmp = {
        id: newEmpId,
        name: newName,
        role: newRole,
        department: finalDept,
        status: newStatus,
        email: newEmail,
        passwordHash,
        avatar: newAvatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=200`,
        dob: newDob,
        joiningDate: newJoiningDate,
        cvFileName: newCvFileName,
        nidFileName: newNidFileName,
        photoX: photoX,
        photoY: photoY,
        photoZoom: photoZoom
      }
      setEmployees(prev => [...prev, newEmp])
      addLog('Added new employee', `Saved ${newName} (${newEmpId}) to Google Drive db folder`)
      if (addAuditLog) addAuditLog('CREATE', 'Employee', `Created new employee profile for ${newName} (${newEmpId})`)
      if (newCvFileName) {
        addLog('CV Uploaded', `Synced CV (${newCvFileName}) to Google Drive employee directory`)
      }
      if (newNidFileName) {
        addLog('Identity Uploaded', `Synced ID/Passport (${newNidFileName}) to Google Drive employee directory`)
      }
    }

    // Reset Form
    handleCloseForm()
  }

  const handleCloseForm = () => {
    setNewEmpId('')
    setNewName('')
    setNewRole('')
    setNewDept('Engineering')
    setNewEmail('')
    setNewStatus('Active')
    setNewDob('')
    setNewJoiningDate('')
    setNewCvFileName('')
    setNewNidFileName('')
    setNewAvatar('')
    setPhotoX(0)
    setPhotoY(0)
    setPhotoZoom(1)
    setDragStart(null)
    setIsCustomDept(false)
    setCustomDept('')
    setEditingEmployee(null)
    setShowAddForm(false)
  }

  const handleDeleteEmployee = (id, name) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id))
    addLog('Deleted employee record', `Removed ${name} (${id}) from Google Drive db folder`)
    if (addAuditLog) addAuditLog('DELETE', 'Employee', `Deleted employee profile for ${name} (${id})`)
  }

  const toggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size > 0 && [...prev].every(id => filteredEmployees.some(emp => emp.id === id))) {
        return new Set()
      }
      return new Set(filteredEmployees.map(emp => emp.id))
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = () => {
    const count = selectedIds.size
    if (count === 0) return
    setConfirmDelete(() => () => {
      const deletedNames = employees.filter(emp => selectedIds.has(emp.id)).map(emp => emp.name).join(', ')
      setEmployees(prev => prev.filter(emp => !selectedIds.has(emp.id)))
      addLog('Bulk deleted employees', `Removed ${count} employees: ${deletedNames}`)
      if (addAuditLog) addAuditLog('DELETE_MANY', 'Employee', `Bulk deleted ${count} employee records`)
      clearSelection()
      setConfirmDelete(null)
    })
  }

  const handleDownloadSelected = () => {
    const count = selectedIds.size
    if (count === 0) return
    const selected = employees.filter(emp => selectedIds.has(emp.id))
    const headers = ['ID', 'Name', 'Role', 'Department', 'Email', 'Status', 'DOB', 'Joining Date']
    const csvRows = [headers.join(',')]
    selected.forEach(emp => {
      csvRows.push([
        emp.id,
        `"${(emp.name || '').replace(/"/g, '""')}"`,
        `"${(emp.role || '').replace(/"/g, '""')}"`,
        `"${(emp.department || '').replace(/"/g, '""')}"`,
        emp.email || '',
        emp.status || '',
        emp.dob || '',
        emp.joiningDate || ''
      ].join(','))
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selected_employees_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addLog('Downloaded employee data', `Exported ${count} employee records as CSV`)
    clearSelection()
  }

  // Filter list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                           emp.role.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           emp.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter
    return matchesSearch && matchesDept
  })

  const handleApproveProfileEdit = (editId) => {
    const editReq = pendingProfileEdits.find(e => e.id === editId)
    if (!editReq) return

    setEmployees(prev => prev.map(emp => {
      if (emp.id === editReq.employeeId) {
        return {
          ...emp,
          personalEmail: editReq.changes.personalEmail || emp.personalEmail,
          phone: editReq.changes.phone || emp.phone,
          address: editReq.changes.address || emp.address,
          emergencyContact: editReq.changes.emergencyContact || emp.emergencyContact
        }
      }
      return emp
    }))

    setPendingProfileEdits(prev => prev.filter(e => e.id !== editId))
    addLog('Profile Edit Approved', `Approved profile updates for ${editReq.employeeId}`, 'success')
    addToast('Profile updates approved and applied.', 'success')
  }

  const handleRejectProfileEdit = (editId) => {
    const editReq = pendingProfileEdits.find(e => e.id === editId)
    if (!editReq) return

    setPendingProfileEdits(prev => prev.filter(e => e.id !== editId))
    addLog('Profile Edit Rejected', `Rejected profile updates for ${editReq.employeeId}`, 'warning')
    addToast('Profile updates rejected.', 'info')
  }

  const expectedHeaders = ['id', 'name', 'email', 'department', 'role', 'status', 'dob', 'joiningDate', 'avatar', 'password', 'passwordHash']

  const validateCSVRow = (row) => {
    if (!row.name || !row.name.trim()) return 'Name is required'
    if (!row.email || !row.email.trim()) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(row.email.trim())) return `Invalid email format: ${row.email}`
    return null
  }

  const sanitizeCell = (value) => {
    if (typeof value !== 'string') return value
    return value.replace(/^[=+\-@\t\r]/, '')
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {confirmDelete && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--md-bw-surface)',padding:24,borderRadius:12,maxWidth:400}}>
            <h3 style={{marginBottom:12}}>Confirm Delete</h3>
            <p style={{marginBottom:16}}>Are you sure you want to delete the selected employee(s)?</p>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-text">Cancel</button>
              <button onClick={() => { confirmDelete(); }} className="btn btn-filled">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>
          Employees
        </h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-outlined" onClick={() => document.getElementById('csv-file-input').click()}>
            <FileSpreadsheet size={18} className="btn-icon-start" style={{ marginRight: '8px' }} />
            Import CSV
          </button>
          <input 
            id="csv-file-input" 
            type="file" 
            accept=".csv" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const csvText = event.target.result;
                  try {
                    const lines = csvText.split('\n').filter(line => line.trim());
                    if (lines.length < 2) {
                      addToast('CSV file must have a header row and at least one data row.', 'warning');
                      return;
                    }
                    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
                    const validHeaders = expectedHeaders.filter(h => rawHeaders.includes(h));
                    if (validHeaders.length === 0) {
                      addToast('CSV headers must include at least one of: ' + expectedHeaders.join(', '), 'warning');
                      return;
                    }
                    const imported = [];
                    const errors = [];
                    for (let i = 1; i < lines.length; i++) {
                      const cols = lines[i].split(',').map(c => sanitizeCell(c.trim().replace(/^["']|["']$/g, '')));
                      const row = {};
                      rawHeaders.forEach((header, index) => {
                        row[header] = cols[index] || '';
                      });
                      const error = validateCSVRow(row);
                      if (error) {
                        errors.push(`Row ${i + 1}: ${error}`);
                        continue;
                      }
                      if (row.password) {
                        row.passwordHash = await hashPassword(row.password);
                        delete row.password;
                      }
                      row.avatar = row.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`;
                      row.updated_at = new Date().toISOString();
                      imported.push(row);
                    }
                    if (errors.length > 0) {
                      addToast(`Skipped ${errors.length} invalid row(s): ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ''}`, 'warning');
                    }
                    if (imported.length > 0) {
                      setEmployees(prev => {
                        const existingIds = new Set(prev.map(e => e.id));
                        const filteredImport = imported.filter(e => !existingIds.has(e.id));
                        return [...prev, ...filteredImport];
                      });
                      addToast(`Successfully imported ${imported.length} employees from CSV.`, 'success');
                    } else if (errors.length === 0) {
                      addToast('No valid employee records found in CSV.', 'warning');
                    }
                  } catch (err) {
                    addToast('Failed to parse CSV file: ' + err.message, 'danger');
                  }
                };
                reader.readAsText(file);
              }
            }}
          />
          <button 
            className="btn btn-filled" 
            onClick={handleOpenAddForm}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-bw-primary-container)',
              color: 'var(--md-bw-on-primary-container)',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-shadow-level3)',
              padding: 0
            }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Select All */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--md-bw-on-surface-variant)', userSelect: 'none', flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={filteredEmployees.length > 0 && selectedIds.size === filteredEmployees.length}
            onChange={toggleSelectAll}
            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--md-bw-primary)', margin: 0 }}
          />
          Select All
        </label>

        {/* Search */}
        <div className="search-bar" style={{ flex: '1', maxWidth: '400px' }}>
          <div className="tf-icon-leading">
            <Search size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
          </div>
          <input
            type="text"
            placeholder="Search by name, role, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dept Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filterDepartments.map(dept => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`m3-chip m3-chip-filter ${deptFilter === dept ? 'selected' : ''}`}
            >
              {deptFilter === dept && <Check size={18} style={{ marginRight: '8px' }} />}
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Profile Updates Queue */}
      {pendingProfileEdits && pendingProfileEdits.length > 0 && (
        <div className="macos-card" style={{ padding: '18px', marginBottom: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: 'var(--md-bw-on-surface)' }}>
            <AlertCircle size={18} style={{ color: '#007aff' }} />
            Pending Profile Update Requests ({pendingProfileEdits.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingProfileEdits.map(editReq => {
              const emp = employees.find(e => e.id === editReq.employeeId)
              return (
                <div key={editReq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--md-bw-on-surface)', fontSize: '13.5px' }}>{emp ? emp.name : 'Unknown Employee'}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--md-bw-on-surface-variant)', opacity: 0.8 }}>ID: {editReq.employeeId}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '11.5px' }}>
                      {Object.entries(editReq.changes).map(([key, val]) => (
                        val ? (
                          <span key={key} style={{ padding: '3px 6px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', border: '1px solid var(--glass-border)', display: 'inline-flex', gap: '4px' }}>
                            <strong style={{ color: 'var(--md-bw-on-surface-variant)' }}>{key}: </strong> 
                            <span style={{ color: 'var(--md-bw-on-surface)' }}>{val}</span>
                          </span>
                        ) : null
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button className="btn btn-filled" onClick={() => handleApproveProfileEdit(editReq.id)} style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '11.5px', borderRadius: '6px !important' }}>
                      <Check size={12} style={{ marginRight: '4px' }} /> Approve
                    </button>
                    <button className="btn btn-tonal" onClick={() => handleRejectProfileEdit(editReq.id)} style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '11.5px', borderRadius: '6px !important', color: '#dc3545', border: '1px solid rgba(220, 53, 69, 0.15)' }}>
                      <X size={12} style={{ marginRight: '4px' }} /> Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selection Bar */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '12px',
          background: 'var(--md-bw-primary-container)',
          color: 'var(--md-bw-on-primary-container)',
          fontSize: '13px',
          fontWeight: 500,
        }}>
          <Check size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{selectedIds.size} selected</span>
          <button
            className="btn btn-filled"
            onClick={handleBulkDelete}
            style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '11px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Trash2 size={11} /> Delete ({selectedIds.size})
          </button>
          <button
            className="btn btn-filled"
            onClick={handleDownloadSelected}
            style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '11px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--md-bw-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Download size={11} /> Download CSV
          </button>
          <button
            onClick={clearSelection}
            style={{ height: '30px', minHeight: '30px', padding: '0 8px', fontSize: '11px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', opacity: 0.7 }}
            title="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Directory Grid */}
      {filteredEmployees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={120} style={{ color: 'var(--md-bw-on-surface-variant)', opacity: 0.5, marginBottom: '24px' }} />
          <h3 className="headline-small" style={{ color: 'var(--md-bw-on-surface-variant)', marginBottom: '24px' }}>No employees found</h3>
          <button onClick={() => {setSearchTerm(''); setDeptFilter('All')}} className="btn btn-filled">Clear Filters</button>
        </div>
      ) : (
        <div className="employee-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          width: '100%'
        }}>
          {filteredEmployees.map(emp => {
            const isExpanded = expandedCardId === emp.id
            return (
            <div key={emp.id}>
              <div className="macos-card employee-card" style={{
                padding: '14px 16px',
                display: 'flex', flexDirection: 'column', cursor: 'pointer',
                position: 'relative',
              }} onClick={() => setViewingEmployee(emp)}>
                
                {/* Checkbox — absolutely positioned so it doesn't steal space from text */}
                <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '12px', left: '10px', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', background: selectedIds.has(emp.id) ? 'var(--md-bw-primary)' : 'rgba(255,255,255,0.85)', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(emp.id)}
                    onChange={(e) => toggleSelect(emp.id, e)}
                    style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--md-bw-primary)', margin: 0, opacity: 0.85 }}
                  />
                </div>

                {/* Row 1: Base content — avatar + info | status badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '56px', height: '56px',
                      borderRadius: '14px', overflow: 'hidden', position: 'relative', flexShrink: 0,
                      border: '1px solid var(--glass-border)',
                      background: (!emp.avatar || imageErrors[emp.id]) ? 'rgba(0,0,0,0.04)' : '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--md-bw-on-surface-variant)', fontWeight: 700, fontSize: '1.1rem',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      {(!emp.avatar || imageErrors[emp.id]) ? (
                        <span>{getAvatarFallback(emp.name).initials}</span>
                      ) : (
                        <img src={emp.avatar} alt={emp.name} style={{
                            width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0,
                            transform: `translate(${emp.photoX || 0}px, ${emp.photoY || 0}px) scale(${emp.photoZoom || 1})`,
                            transformOrigin: 'center', userSelect: 'none', pointerEvents: 'none'
                          }}
                          onError={() => setImageErrors(prev => ({...prev, [emp.id]: true}))}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--md-bw-on-surface)', whiteSpace: 'nowrap' }}>{emp.name}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--md-bw-on-surface-variant)', fontWeight: 500, whiteSpace: 'nowrap' }}>{emp.role}</span>
                      <span style={{ fontSize: '11px', color: 'var(--md-bw-on-surface-variant)', opacity: 0.75, whiteSpace: 'nowrap' }}>{emp.department}</span>
                    </div>
                  </div>
                  
                  <span style={{ 
                    height: '20px', padding: '0 8px', fontSize: '10px', fontWeight: 600, borderRadius: '10px',
                    display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginTop: '2px',
                    background: emp.status === 'Active' ? 'rgba(40, 167, 69, 0.1)' : (emp.status === 'On Leave' ? 'rgba(240, 173, 78, 0.1)' : 'rgba(220, 53, 69, 0.1)'),
                    color: emp.status === 'Active' ? '#28a745' : (emp.status === 'On Leave' ? '#f0ad4e' : '#dc3545'),
                    border: emp.status === 'Active' ? '1px solid rgba(40, 167, 69, 0.15)' : (emp.status === 'On Leave' ? '1px solid rgba(240, 173, 78, 0.15)' : '1px solid rgba(220, 53, 69, 0.15)')
                  }}>
                    <span className={`pulse-dot ${emp.status === 'Active' ? 'pulse-dot-green' : (emp.status === 'On Leave' ? 'pulse-dot-orange' : 'pulse-dot-red')}`}></span>
                    {emp.status}
                  </span>
                </div>

                {/* Row 2: Expand button — between base and expanded, stays fixed position */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0 0', height: isExpanded ? '28px' : '20px', transition: 'height 0.3s ease' }}>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardId(prev => prev === emp.id ? null : emp.id);
                  }} style={{
                    width: '20px', height: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer',
                    color: 'var(--md-bw-on-surface-variant)',
                    transition: 'background 0.2s ease',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--md-surface-variant)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <ChevronDown size={13} style={{
                      transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }} />
                  </button>
                </div>

                {/* Row 3: Expanded content — slides down naturally */}
                <div style={{
                  maxHeight: isExpanded ? '320px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease 0.05s',
                }}>
                  <div style={{
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '10px',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    fontSize: '12px', color: 'var(--md-bw-on-surface-variant)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={11} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span style={{ overflowWrap: 'break-word', minWidth: 0 }}>{emp.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', opacity: 0.85 }}>
                      <span>Born: {emp.dob ? formatDate(emp.dob) : 'N/A'}</span>
                      <span>Joined: {emp.joiningDate ? formatDate(emp.joiningDate) : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>ID: {emp.id}</span>
                    </div>
                    <div style={{
                      display: 'flex', gap: '8px',
                      borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '2px',
                    }}>
                      <button className="btn btn-mac-blue" style={{ flex: 1, height: '30px', minHeight: '30px', padding: '0', fontSize: '11px', borderRadius: '6px !important', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={(e) => {
                        e.stopPropagation(); setEditingEmployee(emp); setNewEmpId(emp.id); setNewName(emp.name); setNewRole(emp.role); setNewDept(emp.department); setNewEmail(emp.email); setNewStatus(emp.status); setNewDob(emp.dob || ''); setNewJoiningDate(emp.joiningDate || ''); setNewCvFileName(emp.cvFileName || ''); setNewNidFileName(emp.nidFileName || ''); setNewAvatar(emp.avatar || ''); setPhotoX(emp.photoX || 0); setPhotoY(emp.photoY || 0); setPhotoZoom(emp.photoZoom || 1); setIsCustomDept(false); setCustomDept(''); setShowAddForm(true);
                      }}>
                        <Edit size={11} /> Edit
                      </button>
                      <button className="btn btn-mac-red" style={{ flex: 1, height: '30px', minHeight: '30px', padding: '0', fontSize: '11px', borderRadius: '6px !important', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.name); }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Employee Detail Modal */}
      {viewingEmployee && (
        <div className="dialog-scrim" onClick={() => setViewingEmployee(null)}>
          <div className="m3-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden',
                border: '2px solid var(--md-bw-primary)', marginBottom: '16px',
                background: (!viewingEmployee.avatar || imageErrors[viewingEmployee.id]) ? 'var(--md-bw-surface-variant)' : '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--md-bw-on-surface-variant)', fontWeight: 700, fontSize: '1.6rem', position: 'relative'
              }}>
                {(!viewingEmployee.avatar || imageErrors[viewingEmployee.id]) ? (
                  <span>{getAvatarFallback(viewingEmployee.name).initials}</span>
                ) : (
                  <img src={viewingEmployee.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, transform: `translate(${viewingEmployee.photoX || 0}px, ${viewingEmployee.photoY || 0}px) scale(${viewingEmployee.photoZoom || 1})`, transformOrigin: 'center' }} onError={() => setImageErrors(prev => ({...prev, [viewingEmployee.id]: true}))} />
                )}
              </div>
              <h3 className="headline-small" style={{ margin: 0, color: 'var(--md-bw-on-surface)', textAlign: 'center' }}>{viewingEmployee.name}</h3>
              <span className="body-large" style={{ color: 'var(--md-bw-on-surface-variant)', textAlign: 'center' }}>{viewingEmployee.role}</span>
            </div>
            
            <ul className="m3-list" style={{ marginBottom: '24px' }}>
              <li className="list-item two-line" style={{ padding: '0 16px' }}>
                <div className="list-content">
                  <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>ID</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.id}</span>
                </div>
              </li>
              <li className="list-item two-line" style={{ padding: '0 16px' }}>
                <div className="list-content">
                  <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Status</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.status}</span>
                </div>
              </li>
              <li className="list-item two-line" style={{ padding: '0 16px' }}>
                <div className="list-content">
                  <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Department</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.department}</span>
                </div>
              </li>
              <li className="list-item two-line" style={{ padding: '0 16px' }}>
                <div className="list-content">
                  <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Email</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)', wordBreak: 'break-all' }}>{viewingEmployee.email}</span>
                </div>
              </li>
              <li className="list-item two-line" style={{ padding: '0 16px' }}>
                <div className="list-content">
                  <span className="label-small" style={{ color: 'var(--md-bw-on-surface-variant)', textTransform: 'uppercase' }}>Joined</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.joiningDate ? formatDate(viewingEmployee.joiningDate) : 'N/A'}</span>
                </div>
              </li>
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px' }}>
              <button className="btn btn-text" onClick={() => setViewingEmployee(null)}>Close</button>
              <button className="btn btn-tonal" onClick={() => {
                setViewingEmployee(null);
                setEditingEmployee(viewingEmployee);
                setNewEmpId(viewingEmployee.id);
                setNewName(viewingEmployee.name);
                setNewRole(viewingEmployee.role);
                setNewDept(viewingEmployee.department);
                setNewEmail(viewingEmployee.email);
                setNewStatus(viewingEmployee.status);
                setNewDob(viewingEmployee.dob || '');
                setNewJoiningDate(viewingEmployee.joiningDate || '');
                setNewCvFileName(viewingEmployee.cvFileName || '');
                setNewNidFileName(viewingEmployee.nidFileName || '');
                setNewAvatar(viewingEmployee.avatar || '');
                setPhotoX(viewingEmployee.photoX || 0);
                setPhotoY(viewingEmployee.photoY || 0);
                setPhotoZoom(viewingEmployee.photoZoom || 1);
                setIsCustomDept(false);
                setCustomDept('');
                setShowAddForm(true);
              }}>Edit Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal/Overlay */}
      {showAddForm && (
        <div className="dialog-scrim visible" onClick={() => handleCloseForm()}>
          <div className="m3-dialog" onClick={e => e.stopPropagation()} style={{
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--md-bw-on-surface)' }}>
                {editingEmployee ? <Edit size={20} style={{ color: 'var(--md-bw-on-surface)' }} /> : <UserPlus size={20} style={{ color: 'var(--md-bw-on-surface)' }} />}
                {editingEmployee ? 'Edit Employee Profile' : 'New Employee Record'}
              </h3>
              <button
                onClick={handleCloseForm}
                style={{ background: 'transparent', border: 'none', color: 'var(--md-bw-on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* HD Profile Photo Upload & Reposition Frame */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                border: '1px dashed var(--glass-border)', 
                padding: '16px', 
                borderRadius: '16px', 
                background: 'rgba(0,0,0,0.01)' 
              }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 700 }}>Profile Photo & Repositioner</label>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {/* Panning Preview Frame */}
                  <div 
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1.5px solid var(--glass-border)',
                      background: '#f3f4f6',
                      cursor: dragStart ? 'grabbing' : 'grab',
                      touchAction: 'none',
                      userSelect: 'none'
                    }}
                  >
                    {newAvatar ? (
                      <img
                        src={newAvatar}
                        alt="Upload preview"
                        onPointerDown={handlePointerDown}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          transform: `translate(${photoX}px, ${photoY}px) scale(${photoZoom})`,
                          transformOrigin: 'center',
                          userSelect: 'none',
                          pointerEvents: 'auto'
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--md-bw-on-surface-variant)', 
                        fontSize: '0.75rem', 
                        textAlign: 'center', 
                        padding: '8px',
                        userSelect: 'none',
                        opacity: 0.7
                      }}>
                        No Image
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center', height: '34px', minHeight: '34px' }}
                      onClick={() => document.getElementById('photo-file-input').click()}
                    >
                      {newAvatar ? 'Change Photo' : 'Upload HD Photo'}
                    </button>
                    <input
                      id="photo-file-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0]
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setNewAvatar(event.target.result) // HD Base64 source
                            setPhotoX(0)
                            setPhotoY(0)
                            setPhotoZoom(1)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--md-bw-on-surface-variant)', opacity: 0.65 }}>
                      *Drag image inside the frame to adjust framing.
                    </span>
                  </div>
                </div>

                {newAvatar && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--md-bw-on-surface-variant)' }}>
                      <span>Zoom Scale:</span>
                      <span>{Math.round(photoZoom * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.02" 
                      value={photoZoom} 
                      onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>

              {/* Employee ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Employee ID (Auto-generated, editable)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-101"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value.trim().toUpperCase())}
                  style={{ fontWeight: 700 }}
                />
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HR Associate"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>

              {/* Department Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Department</label>
                <select
                  value={isCustomDept ? 'NEW' : newDept}
                  onChange={(e) => {
                    if (e.target.value === 'NEW') {
                      setIsCustomDept(true)
                    } else {
                      setIsCustomDept(false)
                      setNewDept(e.target.value)
                    }
                  }}
                >
                  {activeDepts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="NEW">+ Add New Department...</option>
                </select>

                {/* Custom Department Name Entry */}
                {isCustomDept && (
                  <input
                    type="text"
                    required
                    placeholder="Enter new department name..."
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      marginTop: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                )}
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@hrpulse.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>
                  Login Password {editingEmployee ? '(leave blank to keep current)' : ''}
                </label>
                <input
                  type="text"
                  placeholder={editingEmployee ? 'Leave blank to keep current' : 'Set employee login password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {/* DOB & Joining Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Joining Date</label>
                  <input
                    type="date"
                    value={newJoiningDate}
                    onChange={(e) => setNewJoiningDate(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Custom CV and Passport/NID upload fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Upload CV</label>
                  <div style={{ position: 'relative' }}>
                    <button 
                      type="button" 
                      className="btn btn-mac-green" 
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px', 
                        fontSize: '0.8rem', 
                        borderRadius: '10px', 
                        justifyContent: 'center',
                        height: '38px',
                        minHeight: '38px'
                      }} 
                      onClick={() => document.getElementById('cv-file-input').click()}
                    >
                      {newCvFileName ? '📄 ' + (newCvFileName.length > 12 ? newCvFileName.substring(0, 10) + '...' : newCvFileName) : 'Upload CV'}
                    </button>
                    <input
                      id="cv-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewCvFileName(e.target.files[0].name)
                        }
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Passport/NID</label>
                  <div style={{ position: 'relative' }}>
                    <button 
                      type="button" 
                      className="btn btn-mac-green" 
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px', 
                        fontSize: '0.8rem', 
                        borderRadius: '10px', 
                        justifyContent: 'center',
                        height: '38px',
                        minHeight: '38px'
                      }} 
                      onClick={() => document.getElementById('nid-file-input').click()}
                    >
                      {newNidFileName ? '🪪 ' + (newNidFileName.length > 12 ? newNidFileName.substring(0, 10) + '...' : newNidFileName) : 'Upload ID'}
                    </button>
                    <input
                      id="nid-file-input"
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewNidFileName(e.target.files[0].name)
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--md-bw-on-surface-variant)', fontWeight: 600 }}>Employment Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-mac-red"
                  style={{ flex: 1, height: '38px', minHeight: '38px', padding: '0 16px', fontSize: '12px', borderRadius: '8px !important', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handleCloseForm}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-mac-blue"
                  style={{ flex: 1, height: '38px', minHeight: '38px', padding: '0 16px', fontSize: '12px', borderRadius: '8px !important', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={14} /> {editingEmployee ? 'Save Changes' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Ads Placement */}
      <AdSlot type="horizontal" style={{ marginTop: '32px' }} />
    </div>
  )
}
