import { useState, useRef, useEffect } from 'react'
import { Monitor, Plus, Search, AlertTriangle, PenTool, TrendingDown, Upload, FileSignature, ArrowLeft } from 'lucide-react'
import AdSlot from './AdSlot'
import { useModal } from '../services/useModal.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '../services/date.js'

export default function Assets({ employees, assets, setAssets, assetRequests, setAssetRequests, addLog, addToast, currentUser, simulatedRole }) {
  const [activeView, setActiveView] = useState('dashboard')

  // Search & Filter
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  // Alerts
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const expiring = (assets || []).filter(a => {
      if (!a.warrantyExpiry) return false
      const exp = new Date(a.warrantyExpiry)
      return exp > today && exp <= thirtyDaysFromNow
    })
    setAlerts(expiring)
  }, [assets])

  // --- Add Asset State ---
  const [showAddModal, setShowAddModal] = useState(false)
  useModal(() => setShowAddModal(false))
  const [newAsset, setNewAsset] = useState({ name: '', category: 'Laptop', serialNumber: '', purchaseDate: '', purchasePrice: '', warrantyExpiry: '', usefulLife: 36, condition: 'New' })

  const handleAddAsset = (e) => {
    e.preventDefault()
    const asset = {
      ...newAsset,
      id: `AST-${Date.now()}`,
      purchasePrice: parseFloat(newAsset.purchasePrice) || 0,
      usefulLife: parseInt(newAsset.usefulLife) || 36,
      status: 'Available',
      assignedTo: null,
      assignmentDate: null,
      maintenanceLogs: []
    }
    setAssets(prev => [asset, ...prev])
    setShowAddModal(false)
    addToast('Asset added to inventory', 'success')
    setNewAsset({ name: '', category: 'Laptop', serialNumber: '', purchaseDate: '', purchasePrice: '', warrantyExpiry: '', usefulLife: 36, condition: 'New' })
  }

  // --- CSV Import ---
  const fileInputRef = useRef(null)

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleImportCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const rows = text.split('\n')
      const headers = rows[0].split(',').map(h => h.trim())
      const importedAssets = []

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row.trim()) continue
        const cols = row.split(',').map(c => c.trim())
        if (cols.length >= 6) {
          importedAssets.push({
            id: `AST-${Date.now()}-${i}`,
            name: cols[0],
            category: cols[1],
            serialNumber: cols[2],
            purchaseDate: cols[3],
            purchasePrice: parseFloat(cols[4]) || 0,
            warrantyExpiry: cols[5],
            usefulLife: parseInt(cols[6]) || 36,
            status: 'Available',
            assignedTo: null,
            assignmentDate: null,
            condition: 'New',
            maintenanceLogs: []
          })
        }
      }

      if (importedAssets.length > 0) {
        setAssets(prev => [...importedAssets, ...prev])
        addToast(`Successfully imported ${importedAssets.length} assets`, 'success')
      } else {
        addToast('No valid data found in CSV.', 'error')
      }
      e.target.value = null
    }
    reader.readAsText(file)
  }

  // --- Assignment Logic ---
  const [showAssignModal, setShowAssignModal] = useState(false)
  useModal(() => setShowAssignModal(false))
  const [assignTarget, setAssignTarget] = useState(null)
  const [assignForm, setAssignForm] = useState({ employeeId: '', notes: 'Good condition' })

  const handleAssignAsset = (e) => {
    e.preventDefault()
    if (!assignForm.employeeId) return addToast('Select an employee', 'warning')

    setAssets(prev => prev.map(a => {
      if (a.id === assignTarget.id) {
        return {
          ...a,
          status: 'Assigned',
          assignedTo: assignForm.employeeId,
          assignmentDate: new Date().toISOString().split('T')[0],
          condition: assignForm.notes
        }
      }
      return a
    }))

    setShowAssignModal(false)
    addToast('Asset assigned successfully', 'success')

    generateAgreementPDF(assignTarget, employees.find(emp => emp.id === assignForm.employeeId), assignForm.notes)
  }

  const generateAgreementPDF = (asset, employee, notes = 'Good condition') => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(22)
      doc.text('Asset Assignment Agreement', 20, 20)

      doc.setFontSize(12)
      doc.text(`Date: ${formatDate(new Date().toISOString().split('T')[0])}`, 20, 30)
      doc.text(`Employee Name: ${employee.name} (${employee.department})`, 20, 40)
      doc.text('This document confirms the assignment of the following company property:', 20, 55)

      autoTable(doc, {
        startY: 60,
        head: [['Asset ID', 'Name', 'Category', 'Serial Number', 'Condition']],
        body: [
          [asset.id, asset.name, asset.category, asset.serialNumber, notes]
        ]
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 90) + 20

      doc.text('Terms and Conditions:', 20, finalY)
      doc.setFontSize(10)
      doc.text('1. The asset remains the property of HR Pulse Ltd.', 20, finalY + 10)
      doc.text('2. The employee agrees to keep the asset in good condition.', 20, finalY + 20)
      doc.text('3. The employee must return the asset upon termination of employment.', 20, finalY + 30)

      doc.text('Employee Signature: _______________________', 20, finalY + 60)
      doc.text('Date: ________________', 120, finalY + 60)

      doc.text('HR Signature: _______________________', 20, finalY + 80)
      doc.text('Date: ________________', 120, finalY + 80)

      doc.save(`Asset_Agreement_${employee.id}_${asset.id}.pdf`)
      addToast('Agreement PDF generated', 'info')
    } catch (e) {
      console.error(e)
      addToast('Error generating PDF', 'error')
    }
  }

  const handleReturnAsset = (id) => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'Available', assignedTo: null, assignmentDate: null }
      }
      return a
    }))
    addToast('Asset returned to inventory', 'success')
  }

  // --- Requests Logic ---
  const handleRequestAction = (reqId, action) => {
    setAssetRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: action } : r))
    addToast(`Request ${action.toLowerCase()}`, 'info')
  }

  // --- Maintenance & Depreciation ---
  const [selectedAssetForMaint, setSelectedAssetForMaint] = useState(null)
  const [maintForm, setMaintForm] = useState({ date: '', issue: '', cost: '', vendor: '' })

  const handleAddMaintenance = (e) => {
    e.preventDefault()
    setAssets(prev => prev.map(a => {
      if (a.id === selectedAssetForMaint.id) {
        return {
          ...a,
          status: 'Under Repair',
          maintenanceLogs: [...(a.maintenanceLogs || []), { id: `maint-${Date.now()}`, date: maintForm.date, issue: maintForm.issue, cost: parseFloat(maintForm.cost) || 0, vendor: maintForm.vendor, status: 'In Progress' }]
        }
      }
      return a
    }))
    setMaintForm({ date: '', issue: '', cost: '', vendor: '' })
    setSelectedAssetForMaint(null)
    addToast('Maintenance log added, asset marked as Under Repair', 'success')
  }

  const calculateBookValue = (asset) => {
    if (!asset.purchasePrice || !asset.purchaseDate || !asset.usefulLife) return asset.purchasePrice || 0
    const purchaseDate = new Date(asset.purchaseDate)
    const today = new Date()
    const monthsElapsed = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth())
    if (monthsElapsed >= asset.usefulLife) return 0

    const monthlyDepreciation = asset.purchasePrice / asset.usefulLife
    const bookValue = asset.purchasePrice - (monthlyDepreciation * monthsElapsed)
    return Math.max(0, bookValue).toFixed(2)
  }

  // Derived data
  const filteredAssets = (assets || []).filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.serialNumber.toLowerCase().includes(search.toLowerCase())
    const matchesCat = filterCategory === 'All' ? true : a.category === filterCategory
    return matchesSearch && matchesCat
  })

  const stats = {
    total: (assets || []).length,
    available: (assets || []).filter(a => a.status === 'Available').length,
    assigned: (assets || []).filter(a => a.status === 'Assigned').length,
    underRepair: (assets || []).filter(a => a.status === 'Under Repair').length
  }

  const renderView = () => {
    switch (activeView) {
      case 'inventory':
        return <div>Inventory view</div>
      case 'assignments':
        return <div>Assignments view</div>
      case 'requests':
        return <div>Requests view</div>
      case 'maintenance':
        return <div>Maintenance view</div>
      case 'dashboard':
      default:
        return <div>Dashboard view</div>
    }
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header">
        <h1 className="page-title">
          <Monitor size={28} className="page-title-icon" />
          Asset Management
        </h1>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          <button className={`tab-btn ${activeView === 'dashboard' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'dashboard' ? 'var(--bg-secondary)' : 'transparent', color: activeView === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveView('dashboard')}>Dashboard</button>
          <button className={`tab-btn ${activeView === 'inventory' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'inventory' ? 'var(--bg-secondary)' : 'transparent', color: activeView === 'inventory' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveView('inventory')}>Inventory</button>
          <button className={`tab-btn ${activeView === 'assignments' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'assignments' ? 'var(--bg-secondary)' : 'transparent', color: activeView === 'assignments' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveView('assignments')}>Assignments</button>
          <button className={`tab-btn ${activeView === 'requests' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'requests' ? 'var(--bg-secondary)' : 'transparent', color: activeView === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', position: 'relative' }} onClick={() => setActiveView('requests')}>
            Requests
            {assetRequests?.filter(r => r.status === 'Pending').length > 0 && (
              <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--accent-danger)', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px' }}>{assetRequests.filter(r => r.status === 'Pending').length}</div>
            )}
          </button>
          <button className={`tab-btn ${activeView === 'maintenance' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeView === 'maintenance' ? 'var(--bg-secondary)' : 'transparent', color: activeView === 'maintenance' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveView('maintenance')}>Maintenance</button>
        </div>
      </div>

      {/* Back to Dashboard breadcrumb */}
      {activeView !== 'dashboard' && (
        <div style={{ marginBottom: '16px' }}>
          <button className="btn-text" onClick={() => setActiveView('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent-primary)', padding: '4px 0' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      )}

      {/* Warranty alert banner - only on dashboard */}
      {activeView === 'dashboard' && alerts.length > 0 && (
        <div style={{ background: 'var(--accent-warning)', color: '#fff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Alert:</strong> {alerts.length} asset(s) have warranties expiring within the next 30 days!
          </div>
        </div>
      )}

      {renderView()}

      {/* --- ADD ASSET MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-card fade-in" style={{ maxWidth: '600px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Add New Asset</h2>
            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Asset Name</label>
                  <input type="text" className="form-input" required value={newAsset.name} onChange={e => setNewAsset(p => ({...p, name: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={newAsset.category} onChange={e => setNewAsset(p => ({...p, category: e.target.value}))}>
                    <option>Laptop</option>
                    <option>Phone</option>
                    <option>Monitor</option>
                    <option>Peripherals</option>
                    <option>Access Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Serial Number / IMEI</label>
                  <input type="text" className="form-input" required value={newAsset.serialNumber} onChange={e => setNewAsset(p => ({...p, serialNumber: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input type="date" className="form-input" required value={newAsset.purchaseDate} onChange={e => setNewAsset(p => ({...p, purchaseDate: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Purchase Price ($)</label>
                  <input type="number" className="form-input" required value={newAsset.purchasePrice} onChange={e => setNewAsset(p => ({...p, purchasePrice: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Useful Life (Months)</label>
                  <input type="number" className="form-input" required value={newAsset.usefulLife} onChange={e => setNewAsset(p => ({...p, usefulLife: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Warranty Expiry</label>
                  <input type="date" className="form-input" required value={newAsset.warrantyExpiry} onChange={e => setNewAsset(p => ({...p, warrantyExpiry: e.target.value}))} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-tonal" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-filled">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN ASSET MODAL --- */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content glass-card fade-in" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Assign Asset: {assignTarget?.name}</h2>
            <form onSubmit={handleAssignAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Select Employee</label>
                <select className="form-input" required value={assignForm.employeeId} onChange={e => setAssignForm(p => ({...p, employeeId: e.target.value}))}>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Condition Notes</label>
                <input type="text" className="form-input" value={assignForm.notes} onChange={e => setAssignForm(p => ({...p, notes: e.target.value}))} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Upon assignment, an Agreement PDF will be automatically generated.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-tonal" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn-filled">Assign & Generate PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AdSlot />
    </div>
  )
}
