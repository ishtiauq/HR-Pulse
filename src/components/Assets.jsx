import { useState, useRef, useEffect } from 'react'
import { Monitor, Plus, Search, AlertTriangle, PenTool, TrendingDown, Upload, FileSignature } from 'lucide-react'
import { useModal } from '../services/useModal.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '../services/date.js'

export default function Assets({ employees, assets, setAssets, assetRequests, setAssetRequests, addLog, addToast, currentUser }) {
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory', 'assignments', 'requests', 'maintenance'
  
  // Search & Filter
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  
  // Alerts
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // Generate alerts for warranties expiring in 30 days
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
      // Naive CSV parser for mockup
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
      e.target.value = null // reset
    }
    reader.readAsText(file)
  }

  // --- Assignment Logic ---
  const [showAssignModal, setShowAssignModal] = useState(false)
  useModal(() => setShowAssignModal(false))
  const [assignTarget, setAssignTarget] = useState(null) // asset object
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
    
    // Auto Generate PDF
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
      
      const tableResult = autoTable(doc, {
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

  // Derived filtered data
  const filteredAssets = (assets || []).filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.serialNumber.toLowerCase().includes(search.toLowerCase())
    const matchesCat = filterCategory === 'All' ? true : a.category === filterCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header">
        <h1 className="page-title">
          <Monitor size={28} className="page-title-icon" />
          Asset Management
        </h1>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'inventory' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'inventory' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('inventory')}>Inventory</button>
          <button className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'assignments' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'assignments' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('assignments')}>Assignments</button>
          <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'requests' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', position: 'relative' }} onClick={() => setActiveTab('requests')}>
            Requests
            {assetRequests?.filter(r => r.status === 'Pending').length > 0 && (
              <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--accent-danger)', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px' }}>{assetRequests.filter(r => r.status === 'Pending').length}</div>
            )}
          </button>
          <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'maintenance' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'maintenance' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ background: 'var(--accent-warning)', color: '#fff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Alert:</strong> {alerts.length} asset(s) have warranties expiring within the next 30 days!
          </div>
        </div>
      )}

      {/* --- INVENTORY TAB --- */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                <input type="text" placeholder="Search by name or serial..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                <option value="All">All Categories</option>
                <option value="Laptop">Laptops</option>
                <option value="Phone">Phones</option>
                <option value="Monitor">Monitors</option>
                <option value="Peripherals">Peripherals</option>
                <option value="Access Card">Access Cards</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={triggerFileInput} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} /> Import CSV
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" style={{ display: 'none' }} />
              
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Add Asset
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="table-responsive w-full table-striped">
              <thead>
                <tr>
                  <th>ID / Serial</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Purchase Info</th>
                  <th>Warranty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{asset.id}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SN: {asset.serialNumber}</div>
                    </td>
                    <td>{asset.name}</td>
                    <td>{asset.category}</td>
                    <td>
                      <div>${asset.purchasePrice}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{asset.purchaseDate}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {asset.warrantyExpiry}
                        {alerts.find(a => a.id === asset.id) && <AlertTriangle size={14} color="var(--accent-warning)" />}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        asset.status === 'Available' ? 'badge-success' :
                        asset.status === 'Assigned' ? 'badge-info' :
                        asset.status === 'Under Repair' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>No assets found in inventory.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ASSIGNMENTS TAB --- */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="table-container">
            <table className="w-full table-striped">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Status / Assigned To</th>
                  <th>Assignment Date</th>
                  <th>Condition</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.filter(a => a.status === 'Available' || a.status === 'Assigned').map(asset => {
                  const emp = asset.assignedTo ? employees.find(e => e.id === asset.assignedTo) : null
                  return (
                    <tr key={asset.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{asset.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{asset.id}</div>
                      </td>
                      <td>
                        {asset.status === 'Assigned' && emp ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {emp.avatar ? <img src={emp.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}/> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-tertiary)' }}></div>}
                            <div>
                              <div style={{ fontWeight: 600 }}>{emp.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.department}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-success">Available</span>
                        )}
                      </td>
                      <td>{asset.assignmentDate || '-'}</td>
                      <td>{asset.condition || '-'}</td>
                      <td>
                        {asset.status === 'Available' ? (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => { setAssignTarget(asset); setShowAssignModal(true); }}>Assign</button>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => generateAgreementPDF(asset, emp, asset.condition)}>
                              <FileSignature size={14} style={{ display: 'inline', marginRight: 4 }} /> PDF
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--accent-warning)' }} onClick={() => handleReturnAsset(asset.id)}>Return</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- REQUESTS TAB --- */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {assetRequests.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No pending asset requests.</div>
          ) : (
            assetRequests.map(req => {
              const emp = employees.find(e => e.id === req.employeeId) || { name: 'Unknown' }
              return (
                <div key={req.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{emp.name}</span> requested a <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{req.category}</span>
                      <span className={`badge ${req.urgency === 'High' ? 'badge-danger' : req.urgency === 'Medium' ? 'badge-warning' : 'badge-info'}`}>{req.urgency} Urgency</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>"{req.justification}"</div>
                  </div>
                  {req.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-secondary" style={{ color: 'var(--accent-success)' }} onClick={() => handleRequestAction(req.id, 'Approved')}>Approve & Assign</button>
                      <button className="btn btn-secondary" style={{ color: 'var(--accent-danger)' }} onClick={() => handleRequestAction(req.id, 'Rejected')}>Reject</button>
                    </div>
                  ) : (
                    <span className={`badge ${req.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>{req.status}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* --- MAINTENANCE TAB --- */}
      {activeTab === 'maintenance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Select Asset</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
              {assets.map(asset => (
                <div 
                  key={asset.id} 
                  style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${selectedAssetForMaint?.id === asset.id ? 'var(--accent-primary)' : 'var(--border-color)'}`, cursor: 'pointer', background: selectedAssetForMaint?.id === asset.id ? 'var(--bg-secondary)' : 'transparent' }}
                  onClick={() => setSelectedAssetForMaint(asset)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600 }}>{asset.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{asset.id}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8rem' }}>
                    <span className={`badge ${asset.status === 'Under Repair' ? 'badge-warning' : ''}`}>{asset.status}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Purchased: {asset.purchaseDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedAssetForMaint ? (
              <>
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingDown size={20} color="var(--accent-primary)"/> Depreciation & Value
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Purchase Price</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>${selectedAssetForMaint.purchasePrice}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Book Value</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-success)' }}>${calculateBookValue(selectedAssetForMaint)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Useful Life</div>
                      <div>{selectedAssetForMaint.usefulLife} Months</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Condition</div>
                      <div>{selectedAssetForMaint.condition}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PenTool size={20} color="var(--accent-warning)"/> Log Maintenance
                  </h3>
                  <form onSubmit={handleAddMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input type="date" required className="form-input" value={maintForm.date} onChange={e => setMaintForm(p => ({...p, date: e.target.value}))} />
                      <input type="number" required placeholder="Repair Cost ($)" className="form-input" value={maintForm.cost} onChange={e => setMaintForm(p => ({...p, cost: e.target.value}))} />
                    </div>
                    <input type="text" required placeholder="Vendor / Service Center" className="form-input" value={maintForm.vendor} onChange={e => setMaintForm(p => ({...p, vendor: e.target.value}))} />
                    <textarea required rows={3} placeholder="Describe the issue..." className="form-input" value={maintForm.issue} onChange={e => setMaintForm(p => ({...p, issue: e.target.value}))} />
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Log Repair</button>
                  </form>
                  
                  {selectedAssetForMaint.maintenanceLogs?.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>Repair History</h4>
                      {selectedAssetForMaint.maintenanceLogs.map(log => (
                        <div key={log.id} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>{log.date} - {log.vendor}</span>
                            <span style={{ color: 'var(--accent-danger)' }}>${log.cost}</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{log.issue}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Select an asset from the list to view its depreciation and maintenance logs.
              </div>
            )}
          </div>
        </div>
      )}

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
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Asset</button>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign & Generate PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
