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
    <div className="animate-fade-in flex flex-col gap-8">
      
      {confirmDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="p-6 rounded-xl max-w-[400px]" style={{ background: 'var(--md-bw-surface)' }}>
            <h3 className="mb-3">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete the selected employee(s)?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-text">Cancel</button>
              <button onClick={() => { confirmDelete(); }} className="btn btn-filled">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="headline-small m-0" style={{ color: 'var(--md-bw-on-surface)' }}>
          Employees
        </h1>
        <div className="flex gap-3 flex-wrap">
          <button className="btn btn-outlined" onClick={() => document.getElementById('csv-file-input').click()}>
            <FileSpreadsheet size={18} className="btn-icon-start mr-2" />
            Import CSV
          </button>
          <input 
            id="csv-file-input" 
            type="file" 
            accept=".csv" 
            className="hidden" 
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
            className="btn btn-filled fixed bottom-6 right-6 w-14 h-14 z-[90] flex items-center justify-center p-0"
            aria-label="Add employee"
            onClick={handleOpenAddForm}
            style={{
              borderRadius: '16px',
              backgroundColor: 'var(--md-bw-primary-container)',
              color: 'var(--md-bw-on-primary-container)',
              boxShadow: 'var(--md-shadow-level3)',
            }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        {/* Select All */}
        <label className="flex items-center gap-1.5 cursor-pointer text-[13px] shrink-0" style={{ color: 'var(--md-bw-on-surface-variant)', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={filteredEmployees.length > 0 && selectedIds.size === filteredEmployees.length}
            onChange={toggleSelectAll}
            className="cursor-pointer w-4 h-4 m-0"
            style={{ accentColor: 'var(--md-bw-primary)' }}
          />
          Select All
        </label>

        {/* Search */}
        <div className="search-bar flex-1 max-w-[400px]">
          <div className="tf-icon-leading">
            <Search size={24} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
          </div>
          <input
            type="text"
            placeholder="Search by name, role, email..."
            aria-label="Search employees"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dept Filters */}
        <div role="tablist" aria-label="Filter by department" className="flex gap-2 flex-wrap">
          {filterDepartments.map(dept => (
            <button
              key={dept}
              role="tab"
              aria-selected={deptFilter === dept}
              onClick={() => setDeptFilter(dept)}
              className={`m3-chip m3-chip-filter ${deptFilter === dept ? 'selected' : ''}`}
            >
              {deptFilter === dept && <Check size={18} className="mr-2" />}
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Profile Updates Queue */}
      {pendingProfileEdits && pendingProfileEdits.length > 0 && (
        <div className="macos-card p-[18px] mb-6">
          <h2 className="flex items-center gap-2 m-0 mb-4 text-[15px] font-semibold" style={{ color: 'var(--md-bw-on-surface)' }}>
            <AlertCircle size={18} style={{ color: '#007aff' }} />
            Pending Profile Update Requests ({pendingProfileEdits.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pendingProfileEdits.map(editReq => {
              const emp = employees.find(e => e.id === editReq.employeeId)
              return (
                <div key={editReq.id} className="flex justify-between items-center p-3 px-4 flex-wrap gap-3" style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-[13.5px]" style={{ color: 'var(--md-bw-on-surface)' }}>{emp ? emp.name : 'Unknown Employee'}</strong>
                      <span className="text-[11px] opacity-80" style={{ color: 'var(--md-bw-on-surface-variant)' }}>ID: {editReq.employeeId}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap text-[11.5px]">
                      {Object.entries(editReq.changes).map(([key, val]) => (
                        val ? (
                          <span key={key} className="p-0.5 px-1.5 inline-flex gap-1" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                            <strong style={{ color: 'var(--md-bw-on-surface-variant)' }}>{key}: </strong> 
                            <span style={{ color: 'var(--md-bw-on-surface)' }}>{val}</span>
                          </span>
                        ) : null
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="btn btn-filled" onClick={() => handleApproveProfileEdit(editReq.id)} style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '11.5px', borderRadius: '6px !important' }}>
                      <Check size={12} className="mr-1" /> Approve
                    </button>
                    <button className="btn btn-tonal" onClick={() => handleRejectProfileEdit(editReq.id)} style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '11.5px', borderRadius: '6px !important', color: '#dc3545', border: '1px solid rgba(220, 53, 69, 0.15)' }}>
                      <X size={12} className="mr-1" /> Reject
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
        <div className="flex items-center gap-3 px-4 rounded-xl text-[13px] font-medium" style={{ padding: '10px 16px', background: 'var(--md-bw-primary-container)', color: 'var(--md-bw-on-primary-container)' }}>
          <Check size={16} className="shrink-0" />
          <span className="flex-1">{selectedIds.size} selected</span>
          <button
            className="btn btn-filled inline-flex items-center gap-1 text-[11px]"
            onClick={handleBulkDelete}
            style={{ height: '30px', minHeight: '30px', padding: '0 12px', borderRadius: '6px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Trash2 size={11} /> Delete ({selectedIds.size})
          </button>
          <button
            className="btn btn-filled inline-flex items-center gap-1 text-[11px]"
            onClick={handleDownloadSelected}
            style={{ height: '30px', minHeight: '30px', padding: '0 12px', borderRadius: '6px', background: 'var(--md-bw-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Download size={11} /> Download CSV
          </button>
          <button
            onClick={clearSelection}
            aria-label="Clear selection"
            className="inline-flex items-center opacity-70 text-[11px]"
            style={{ height: '30px', minHeight: '30px', padding: '0 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
            title="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Directory Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center p-12 flex flex-col items-center">
          <Users size={120} className="mb-6 opacity-50" style={{ color: 'var(--md-bw-on-surface-variant)' }} />
          <h3 className="headline-small mb-6" style={{ color: 'var(--md-bw-on-surface-variant)' }}>No employees found</h3>
          <button onClick={() => {setSearchTerm(''); setDeptFilter('All')}} className="btn btn-filled">Clear Filters</button>
        </div>
      ) : (
        <div className="employee-grid w-full" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {filteredEmployees.map(emp => {
            const isExpanded = expandedCardId === emp.id
            return (
            <div key={emp.id}>
              <div className="macos-card employee-card flex flex-col cursor-pointer relative" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewingEmployee(emp); } }} style={{ padding: '14px 16px' }} onClick={() => setViewingEmployee(emp)}>
                
                {/* Checkbox — absolutely positioned so it doesn't steal space from text */}
                <div onClick={(e) => e.stopPropagation()} className="absolute z-[2] flex items-center justify-center w-5 h-5 cursor-pointer" style={{ top: '12px', left: '10px', borderRadius: '4px', background: selectedIds.has(emp.id) ? 'var(--md-bw-primary)' : 'rgba(255,255,255,0.85)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(emp.id)}
                    onChange={(e) => toggleSelect(emp.id, e)}
                    className="cursor-pointer w-3.5 h-3.5 m-0 opacity-85"
                    style={{ accentColor: 'var(--md-bw-primary)' }}
                  />
                </div>

                {/* Row 1: Base content — avatar + info | status badge */}
                <div className="flex items-start justify-between gap-3.5">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-14 h-14 overflow-hidden relative shrink-0 flex items-center justify-center text-[1.1rem] font-bold" style={{ borderRadius: '14px', border: '1px solid var(--glass-border)', background: (!emp.avatar || imageErrors[emp.id]) ? 'rgba(0,0,0,0.04)' : '#f3f4f6', color: 'var(--md-bw-on-surface-variant)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
                      {(!emp.avatar || imageErrors[emp.id]) ? (
                        <span>{getAvatarFallback(emp.name).initials}</span>
                      ) : (
                        <img src={emp.avatar} alt={emp.name} className="absolute top-0 left-0 w-full h-full object-cover" style={{ transform: `translate(${emp.photoX || 0}px, ${emp.photoY || 0}px) scale(${emp.photoZoom || 1})`, transformOrigin: 'center', userSelect: 'none', pointerEvents: 'none' }}
                          onError={() => setImageErrors(prev => ({...prev, [emp.id]: true}))}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <h4 className="m-0 text-[14px] font-semibold whitespace-nowrap" style={{ color: 'var(--md-bw-on-surface)' }}>{emp.name}</h4>
                      <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{emp.role}</span>
                      <span className="text-[11px] opacity-75 whitespace-nowrap" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{emp.department}</span>
                    </div>
                  </div>
                  
                  <span role="status" className="h-5 px-2 text-[10px] font-semibold inline-flex items-center shrink-0 mt-0.5" style={{ borderRadius: '10px', background: emp.status === 'Active' ? 'rgba(40, 167, 69, 0.1)' : (emp.status === 'On Leave' ? 'rgba(240, 173, 78, 0.1)' : 'rgba(220, 53, 69, 0.1)'), color: emp.status === 'Active' ? '#28a745' : (emp.status === 'On Leave' ? '#f0ad4e' : '#dc3545'), border: emp.status === 'Active' ? '1px solid rgba(40, 167, 69, 0.15)' : (emp.status === 'On Leave' ? '1px solid rgba(240, 173, 78, 0.15)' : '1px solid rgba(220, 53, 69, 0.15)') }}>
                    <span className={`pulse-dot ${emp.status === 'Active' ? 'pulse-dot-green' : (emp.status === 'On Leave' ? 'pulse-dot-orange' : 'pulse-dot-red')}`}></span>
                    {emp.status}
                  </span>
                </div>

                {/* Row 2: Expand button — between base and expanded, stays fixed position */}
                <div className="flex justify-end pt-1" style={{ height: isExpanded ? '28px' : '20px', transition: 'height 0.3s ease' }}>
                  <button aria-label={isExpanded ? 'Collapse details' : 'Expand details'} onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardId(prev => prev === emp.id ? null : emp.id);
                  }} className="w-5 h-5 flex items-center justify-center cursor-pointer rounded" style={{ background: 'transparent', border: 'none', color: 'var(--md-bw-on-surface-variant)', transition: 'background 0.2s ease' }}
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
                  <div className="flex flex-col gap-1.5 text-xs pt-2.5" style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--md-bw-on-surface-variant)' }}>
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} className="shrink-0 opacity-70" />
                      <span className="break-words min-w-0">{emp.email}</span>
                    </div>
                    <div className="flex justify-between gap-2 opacity-85">
                      <span>Born: {emp.dob ? formatDate(emp.dob) : 'N/A'}</span>
                      <span>Joined: {emp.joiningDate ? formatDate(emp.joiningDate) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="opacity-70" style={{ fontVariantNumeric: 'tabular-nums' }}>ID: {emp.id}</span>
                    </div>
                    <div className="flex gap-2 pt-2.5 mt-0.5" style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <button className="btn btn-mac-blue flex-1 h-[30px] min-h-[30px] p-0 text-[11px] justify-center inline-flex items-center gap-1" style={{ borderRadius: '6px !important' }} onClick={(e) => {
                        e.stopPropagation(); setEditingEmployee(emp); setNewEmpId(emp.id); setNewName(emp.name); setNewRole(emp.role); setNewDept(emp.department); setNewEmail(emp.email); setNewStatus(emp.status); setNewDob(emp.dob || ''); setNewJoiningDate(emp.joiningDate || ''); setNewCvFileName(emp.cvFileName || ''); setNewNidFileName(emp.nidFileName || ''); setNewAvatar(emp.avatar || ''); setPhotoX(emp.photoX || 0); setPhotoY(emp.photoY || 0); setPhotoZoom(emp.photoZoom || 1); setIsCustomDept(false); setCustomDept(''); setShowAddForm(true);
                      }}>
                        <Edit size={11} /> Edit
                      </button>
                      <button className="btn btn-mac-red flex-1 h-[30px] min-h-[30px] p-0 text-[11px] justify-center inline-flex items-center gap-1" style={{ borderRadius: '6px !important' }} onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.name); }}>
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
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 overflow-hidden mb-4 relative flex items-center justify-center text-[1.6rem] font-bold" style={{ borderRadius: '50%', border: '2px solid var(--md-bw-primary)', background: (!viewingEmployee.avatar || imageErrors[viewingEmployee.id]) ? 'var(--md-bw-surface-variant)' : '#f3f4f6', color: 'var(--md-bw-on-surface-variant)' }}>
                {(!viewingEmployee.avatar || imageErrors[viewingEmployee.id]) ? (
                  <span>{getAvatarFallback(viewingEmployee.name).initials}</span>
                ) : (
                  <img src={viewingEmployee.avatar} alt={viewingEmployee.name} className="absolute top-0 left-0 w-full h-full object-cover" style={{ transform: `translate(${viewingEmployee.photoX || 0}px, ${viewingEmployee.photoY || 0}px) scale(${viewingEmployee.photoZoom || 1})`, transformOrigin: 'center' }} onError={() => setImageErrors(prev => ({...prev, [viewingEmployee.id]: true}))} />
                )}
              </div>
              <h3 className="headline-small m-0 text-center" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.name}</h3>
              <span className="body-large text-center" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{viewingEmployee.role}</span>
            </div>
            
            <ul className="m3-list mb-6">
              <li className="list-item two-line px-4">
                <div className="list-content">
                  <span className="label-small uppercase" style={{ color: 'var(--md-bw-on-surface-variant)' }}>ID</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.id}</span>
                </div>
              </li>
              <li className="list-item two-line px-4">
                <div className="list-content">
                  <span className="label-small uppercase" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Status</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.status}</span>
                </div>
              </li>
              <li className="list-item two-line px-4">
                <div className="list-content">
                  <span className="label-small uppercase" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Department</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.department}</span>
                </div>
              </li>
              <li className="list-item two-line px-4">
                <div className="list-content">
                  <span className="label-small uppercase" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Email</span>
                  <span className="body-large break-all" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.email}</span>
                </div>
              </li>
              <li className="list-item two-line px-4">
                <div className="list-content">
                  <span className="label-small uppercase" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Joined</span>
                  <span className="body-large" style={{ color: 'var(--md-bw-on-surface)' }}>{viewingEmployee.joiningDate ? formatDate(viewingEmployee.joiningDate) : 'N/A'}</span>
                </div>
              </li>
            </ul>

            <div className="flex justify-end gap-2 pt-4">
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
          <div className="m3-dialog flex flex-col gap-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
          }}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl flex items-center gap-2 m-0" style={{ color: 'var(--md-bw-on-surface)' }}>
                {editingEmployee ? <Edit size={20} style={{ color: 'var(--md-bw-on-surface)' }} /> : <UserPlus size={20} style={{ color: 'var(--md-bw-on-surface)' }} />}
                {editingEmployee ? 'Edit Employee Profile' : 'New Employee Record'}
              </h3>
              <button
                onClick={handleCloseForm}
                aria-label="Close form"
                className="flex items-center justify-center p-1 rounded-full"
                style={{ background: 'transparent', border: 'none', color: 'var(--md-bw-on-surface-variant)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="flex flex-col gap-4">
              
              {/* HD Profile Photo Upload & Reposition Frame */}
              <div className="flex flex-col gap-2 p-4 rounded-2xl" style={{ border: '1px dashed var(--glass-border)', background: 'rgba(0,0,0,0.01)' }}>
                <label className="text-[0.85rem] font-bold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Profile Photo & Repositioner</label>
                
                <div className="flex gap-4 items-center">
                  {/* Panning Preview Frame */}
                  <div 
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="overflow-hidden relative"
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '20px',
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
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{
                          transform: `translate(${photoX}px, ${photoY}px) scale(${photoZoom})`,
                          transformOrigin: 'center',
                          userSelect: 'none',
                          pointerEvents: 'auto'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center p-2 opacity-70" style={{ color: 'var(--md-bw-on-surface-variant)', fontSize: '0.75rem', userSelect: 'none' }}>
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
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
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0]
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setNewAvatar(event.target.result)
                            setPhotoX(0)
                            setPhotoY(0)
                            setPhotoZoom(1)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    <span className="text-[0.7rem] opacity-65" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                      *Drag image inside the frame to adjust framing.
                    </span>
                  </div>
                </div>

                {newAvatar && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between text-[0.75rem]" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                      <span>Zoom Scale:</span>
                      <span>{Math.round(photoZoom * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.02" 
                      aria-label="Zoom scale"
                      value={photoZoom} 
                      onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                  </div>
                )}
              </div>

              {/* Employee ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Employee ID (Auto-generated, editable)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-101"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value.trim().toUpperCase())}
                  className="font-bold"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HR Associate"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>

              {/* Department Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Department</label>
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
                    aria-label="New department name"
                    placeholder="Enter new department name..."
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="text-sm px-3.5 py-2.5 rounded-xl mt-2"
                    style={{ border: '1px solid var(--border-color)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none' }}
                  />
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@hrpulse.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>
                  Login Password {editingEmployee ? '(leave blank to keep current)' : ''}
                </label>
                <input
                  type="text"
                  placeholder={editingEmployee ? 'Leave blank to keep current' : 'Set employee login password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* DOB & Joining Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Joining Date</label>
                  <input
                    type="date"
                    value={newJoiningDate}
                    onChange={(e) => setNewJoiningDate(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom CV and Passport/NID upload fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Upload CV</label>
                  <div className="relative">
                    <button 
                      type="button" 
                      className="btn btn-mac-green w-full justify-center" 
                      style={{ 
                        padding: '10px 14px', 
                        fontSize: '0.8rem', 
                        borderRadius: '10px', 
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
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewCvFileName(e.target.files[0].name)
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Passport/NID</label>
                  <div className="relative">
                    <button 
                      type="button" 
                      className="btn btn-mac-green w-full justify-center" 
                      style={{ 
                        padding: '10px 14px', 
                        fontSize: '0.8rem', 
                        borderRadius: '10px', 
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
                      className="hidden"
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
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold" style={{ color: 'var(--md-bw-on-surface-variant)' }}>Employment Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 justify-end">
                <button
                  type="button"
                  className="btn btn-mac-red flex-1 inline-flex items-center justify-center gap-1.5 text-xs"
                  style={{ height: '38px', minHeight: '38px', padding: '0 16px', borderRadius: '8px !important' }}
                  onClick={handleCloseForm}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-mac-blue flex-1 inline-flex items-center justify-center gap-1.5 text-xs"
                  style={{ height: '38px', minHeight: '38px', padding: '0 16px', borderRadius: '8px !important' }}
                >
                  <Check size={14} /> {editingEmployee ? 'Save Changes' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Ads Placement */}
      <AdSlot type="horizontal" className="mt-8" />
    </div>
  )
}
