import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, UserPlus, X, Edit, Check, AlertCircle, FileSpreadsheet, Cpu, Users } from 'lucide-react'
import { useModal } from '../services/useModal.js'
import AdSlot from './AdSlot.jsx'
import { formatDate } from '../services/date.js'

export default function Employees({ employees, setEmployees, addLog, driveConnected, addAuditLog, pendingProfileEdits, setPendingProfileEdits, addToast, selectedEmployeeId, setSelectedEmployeeId }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [viewingEmployee, setViewingEmployee] = useState(null)
  const [imageErrors, setImageErrors] = useState({})
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
    setNewAvatar('')
    setPhotoX(0)
    setPhotoY(0)
    setPhotoZoom(1)
    setShowAddForm(true)
  }

  const handleSaveEmployee = (e) => {
    e.preventDefault()
    if (!newEmpId || !newName || !newRole || !newEmail) return

    const finalDept = isCustomDept ? customDept.trim() : newDept
    if (!finalDept) return

    // Prevent duplicate ID for new employees
    if (!editingEmployee && employees.some(emp => emp.id === newEmpId)) {
      alert(`An employee with ID "${newEmpId}" already exists. Please choose a unique ID.`)
      return
    }

    if (editingEmployee) {
      // Update employee list
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        id: newEmpId, // Allow ID editing
        name: newName,
        role: newRole,
        department: finalDept,
        status: newStatus,
        email: newEmail,
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
        id: newEmpId, // Use the user's manual or auto-generated ID
        name: newName,
        role: newRole,
        department: finalDept,
        status: newStatus,
        email: newEmail,
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
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
                reader.onload = (event) => {
                  const csvText = event.target.result;
                  try {
                    const lines = csvText.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
                    const imported = [];
                    for (let i = 1; i < lines.length; i++) {
                      if (!lines[i].trim()) continue;
                      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
                      const emp = {};
                      headers.forEach((header, index) => {
                        emp[header] = cols[index] || '';
                      });
                      if (emp.id && emp.name) {
                        emp.avatar = emp.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`;
                        emp.updated_at = new Date().toISOString();
                        imported.push(emp);
                      }
                    }
                    if (imported.length > 0) {
                      setEmployees(prev => {
                        const existingIds = new Set(prev.map(e => e.id));
                        const filteredImport = imported.filter(e => !existingIds.has(e.id));
                        return [...prev, ...filteredImport];
                      });
                      addToast(`Successfully imported ${imported.length} employees from CSV.`, 'success');
                    } else {
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
          <button className="btn btn-outlined" onClick={() => {
            const mockEmps = [];
            for (let i = 1; i <= 100; i++) {
              const id = `emp-mock-${1000 + i}`;
              mockEmps.push({
                id,
                name: `Mock Employee ${i}`,
                role: i % 3 === 0 ? 'Developer' : i % 3 === 1 ? 'Designer' : 'Manager',
                department: i % 2 === 0 ? 'Engineering' : 'Product',
                email: `mock.emp.${i}@company.com`,
                status: 'Active',
                salary: 5000 + (i * 50),
                avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
                updated_at: new Date().toISOString()
              });
            }
            setEmployees(prev => {
              const existingIds = new Set(prev.map(e => e.id));
              const filteredMock = mockEmps.filter(e => !existingIds.has(e.id));
              return [...prev, ...filteredMock];
            });
            addToast('Successfully generated 100 mock employees.', 'success');
          }}>
            <Cpu size={18} className="btn-icon-start" style={{ marginRight: '8px' }} />
            Mock
          </button>
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
        <div className="m3-card m3-card-outlined" style={{ padding: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '1.2rem' }}>
            <AlertCircle size={20} />
            Pending Profile Update Requests ({pendingProfileEdits.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingProfileEdits.map(editReq => {
              const emp = employees.find(e => e.id === editReq.employeeId)
              return (
                <div key={editReq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{emp?.name || 'Unknown Employee'} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>({editReq.employeeId})</span></div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                      {Object.entries(editReq.changes).map(([key, val]) => (
                        val ? (
                          <span key={key} style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>{key}: </strong> 
                            <span style={{ color: 'var(--text-primary)' }}>{val}</span>
                          </span>
                        ) : null
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleApproveProfileEdit(editReq.id)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                      <Check size={14} style={{ display: 'inline', marginRight: '4px' }} /> Approve
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleRejectProfileEdit(editReq.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.1)', border: 'none' }}>
                      <X size={14} style={{ display: 'inline', marginRight: '4px' }} /> Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
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
      <div className="employee-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="m3-card m3-card-outlined" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer' }} onClick={() => setViewingEmployee(emp)}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', position: 'relative',
                border: '1px solid var(--md-bw-outline)', flexShrink: 0,
                background: (!emp.avatar || imageErrors[emp.id]) ? 'var(--md-bw-surface-variant)' : '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--md-bw-on-surface-variant)', fontWeight: 700, fontSize: '1.4rem'
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 className="title-medium" style={{ margin: 0, color: 'var(--md-bw-on-surface)' }}>{emp.name}</h4>
                <span className="body-medium" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{emp.role}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="body-small" style={{ color: 'var(--md-bw-on-surface-variant)' }}>{emp.id}</span>
                  <span className={`m3-chip m3-chip-assist ${emp.status === 'Active' ? 'solid' : 'outlined'}`} style={{ 
                    height: '24px', padding: '0 8px', fontSize: '11px',
                    backgroundColor: emp.status === 'Active' ? 'var(--md-bw-on-surface)' : 'transparent',
                    color: emp.status === 'Active' ? 'var(--md-bw-surface)' : 'var(--md-bw-on-surface-variant)',
                    border: emp.status === 'Active' ? 'none' : '1px solid var(--md-bw-outline)'
                  }}>{emp.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--md-bw-outline)' }}>
              <button className="icon-btn" onClick={(e) => {
                e.stopPropagation(); setEditingEmployee(emp); setNewEmpId(emp.id); setNewName(emp.name); setNewRole(emp.role); setNewDept(emp.department); setNewEmail(emp.email); setNewStatus(emp.status); setNewDob(emp.dob || ''); setNewJoiningDate(emp.joiningDate || ''); setNewCvFileName(emp.cvFileName || ''); setNewNidFileName(emp.nidFileName || ''); setNewAvatar(emp.avatar || ''); setPhotoX(emp.photoX || 0); setPhotoY(emp.photoY || 0); setPhotoZoom(emp.photoZoom || 1); setIsCustomDept(false); setCustomDept(''); setShowAddForm(true);
              }}>
                <Edit size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              </button>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.name); }}>
                <Trash2 size={20} style={{ color: 'var(--md-bw-on-surface-variant)' }} />
              </button>
            </div>
          </div>
        ))}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => handleCloseForm()}>
          <div className="glass-card animate-fade-in" onClick={e => e.stopPropagation()} style={{
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
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingEmployee ? <Edit size={20} style={{ color: 'var(--text-primary)' }} /> : <UserPlus size={20} style={{ color: 'var(--text-primary)' }} />}
                {editingEmployee ? 'Edit Employee Profile' : 'New Employee Record'}
              </h3>
              <button
                onClick={handleCloseForm}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
                border: '1px dashed var(--border-color)', 
                padding: '16px', 
                borderRadius: '16px', 
                background: 'rgba(0,0,0,0.01)' 
              }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Profile Photo & Repositioner</label>
                
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
                      border: '2px solid var(--border-color)',
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
                        color: 'var(--text-muted)', 
                        fontSize: '0.75rem', 
                        textAlign: 'center', 
                        padding: '8px',
                        userSelect: 'none'
                      }}>
                        No Image
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      *Drag image inside the frame to adjust framing.
                    </span>
                  </div>
                </div>

                {newAvatar && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Employee ID (Auto-generated, editable)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-101"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value.trim().toUpperCase())}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HR Associate"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Department Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</label>
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
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@hrpulse.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* DOB & Joining Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Joining Date</label>
                  <input
                    type="date"
                    value={newJoiningDate}
                    onChange={(e) => setNewJoiningDate(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              {/* Custom CV and Passport/NID upload fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Upload CV</label>
                  <div style={{ position: 'relative' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px', 
                        fontSize: '0.8rem', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border-color)', 
                        justifyContent: 'center' 
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Passport/NID</label>
                  <div style={{ position: 'relative' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px', 
                        fontSize: '0.8rem', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border-color)', 
                        justifyContent: 'center' 
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Employment Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleCloseForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {editingEmployee ? 'Save Changes' : 'Save Record'}
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
