import { useState, useRef, useEffect } from 'react'
import { Monitor, Plus, Search, AlertTriangle, PenTool, TrendingDown, Upload, FileSignature, Wrench, Package, CheckCircle, BadgeCheck, MessageSquare } from 'lucide-react'
import AdSlot from './AdSlot'
import { useModal } from '../services/useModal.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '../services/date.js'

function AssetDashboard({ stats, setActiveView, assets }) {
  const quickActions = [
    { id: 'inventory', label: 'View Inventory', icon: <Package size={24} />, desc: 'Browse all assets' },
    { id: 'assignments', label: 'Assign Assets', icon: <FileSignature size={24} />, desc: 'Manage assignments' },
    { id: 'requests', label: 'Pending Requests', icon: <MessageSquare size={24} />, desc: 'Approve or reject' },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={24} />, desc: 'Log repairs & depreciation' },
  ]

  const categories = [
    { label: 'Laptops', key: 'Laptop' },
    { label: 'Phones', key: 'Phone' },
    { label: 'Monitors', key: 'Monitor' },
    { label: 'Peripherals', key: 'Peripherals' },
    { label: 'Access Cards', key: 'Access Card' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="stats-grid">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="dash-stat-icon">
            <Monitor size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Assets</div>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="dash-stat-icon" style={{ background: 'rgba(52,199,89,0.15)' }}>
            <CheckCircle size={24} color="#34c759" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.available}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Available</div>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="dash-stat-icon" style={{ background: 'rgba(0,122,255,0.15)' }}>
            <BadgeCheck size={24} color="#007aff" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assigned</div>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="dash-stat-icon" style={{ background: 'rgba(255,149,0,0.15)' }}>
            <Wrench size={24} color="#ff9500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.underRepair}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Under Repair</div>
          </div>
        </div>
      </div>

      <div className="actions-grid">
        {quickActions.map(action => (
          <button key={action.id} className="btn btn-tonal flex flex-col items-center gap-2 p-5 text-center cursor-pointer" onClick={() => setActiveView(action.id)}>
            {action.icon}
            <div className="font-semibold">{action.label}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{action.desc}</div>
          </button>
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="mt-0 mb-4 text-sm">Category Breakdown</h3>
        <div className="flex flex-col gap-2.5">
          {categories.map(cat => {
            const count = assets.filter(a => a.category === cat.key).length
            const max = Math.max(assets.length, 1)
            const pct = (count / max) * 100
            return (
              <div key={cat.key} className="flex items-center gap-3">
                <span className="text-sm w-[100px]">{cat.label}</span>
                <div className="flex-1 h-2 rounded bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full rounded opacity-70" style={{ width: `${pct}%`, background: 'var(--accent-primary)' }} />
                </div>
                <span className="text-sm font-semibold min-w-[24px] text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AssetInventory({ filteredAssets, search, setSearch, filterCategory, setFilterCategory, alerts, showAddModal, setShowAddModal, newAsset, setNewAsset, handleAddAsset, triggerFileInput, fileInputRef, handleImportCSV, addToast }) {
  const [detailAsset, setDetailAsset] = useState(null)

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-card p-5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1 min-w-[280px]">
          <div className="search-bar flex-1">
            <div className="tf-icon-leading">
              <Search size={18} />
            </div>
            <input type="text" placeholder="Search by name or serial..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search assets" />
          </div>
          <div className="select-wrapper">
            <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} aria-label="Filter by category">
              <option value="All">All Categories</option>
              <option value="Laptop">Laptops</option>
              <option value="Phone">Phones</option>
              <option value="Monitor">Monitors</option>
              <option value="Peripherals">Peripherals</option>
              <option value="Access Card">Access Cards</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-tonal" onClick={triggerFileInput} aria-label="Import CSV"><Upload size={16} className="btn-icon-start" /> Import CSV</button>
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button className="btn btn-filled" onClick={() => setShowAddModal(true)} aria-label="Add asset"><Plus size={16} className="btn-icon-start" /> Add Asset</button>
        </div>
      </div>

      <div className="table-container">
        <table role="table" className="table-responsive w-full table-striped">
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
              <tr key={asset.id} onClick={() => setDetailAsset(asset)} className="cursor-pointer">
                <td data-label="ID / Serial">
                  <div className="font-semibold">{asset.id}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>SN: {asset.serialNumber}</div>
                </td>
                <td data-label="Name">{asset.name}</td>
                <td data-label="Category">{asset.category}</td>
                <td data-label="Purchase">
                  <div>${asset.purchasePrice}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{asset.purchaseDate}</div>
                </td>
                <td data-label="Warranty">
                  <div className="flex items-center gap-1.5">
                    {asset.warrantyExpiry}
                    {alerts.find(a => a.id === asset.id) && <AlertTriangle size={14} color="var(--accent-warning)" />}
                  </div>
                </td>
                <td data-label="Status">
                  <span className={`badge ${
                    asset.status === 'Available' ? 'badge-success' :
                    asset.status === 'Assigned' ? 'badge-info' :
                    asset.status === 'Under Repair' ? 'badge-warning' : 'badge-danger'
                  }`} role="status">{asset.status}</span>
                </td>
              </tr>
            ))}
            {filteredAssets.length === 0 && (
              <tr><td colSpan="6" className="text-center p-6" style={{ color: 'var(--text-secondary)' }}>No assets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detailAsset && (
        <DetailModal asset={detailAsset} onClose={() => setDetailAsset(null)} />
      )}
    </div>
  )
}

function DetailModal({ asset, onClose }) {
  useModal(onClose)
  const calculateBookValue = (asset) => {
    if (asset.purchasePrice === undefined || asset.purchasePrice === null || !asset.purchaseDate || !asset.usefulLife) return asset.purchasePrice || 0
    const purchaseDate = new Date(asset.purchaseDate)
    const today = new Date()
    const monthsElapsed = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth())
    if (monthsElapsed >= asset.usefulLife) return 0
    const monthlyDepreciation = asset.purchasePrice / asset.usefulLife
    const bookValue = asset.purchasePrice - (monthlyDepreciation * monthsElapsed)
    return Math.max(0, bookValue).toFixed(2)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card max-w-[600px] w-full" onClick={e => e.stopPropagation()}>
        <h2 className="mt-0">{asset.name}</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Asset ID</div><div className="font-semibold">{asset.id}</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Serial Number</div><div className="font-semibold">{asset.serialNumber}</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Category</div><div>{asset.category}</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Status</div><span className={`badge ${asset.status === 'Available' ? 'badge-success' : asset.status === 'Assigned' ? 'badge-info' : 'badge-warning'}`}>{asset.status}</span></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Purchase Price</div><div>${asset.purchasePrice}</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Book Value</div><div className="font-semibold" style={{ color: 'var(--accent-success)' }}>${calculateBookValue(asset)}</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Purchase Date</div><div>{asset.purchaseDate}</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Warranty Expiry</div><div>{asset.warrantyExpiry}</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Useful Life</div><div>{asset.usefulLife} months</div></div>
          <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Condition</div><div>{asset.condition}</div></div>
        </div>
        {asset.maintenanceLogs?.length > 0 && (
          <div>
            <h3 className="my-4 text-sm">Maintenance History</h3>
            {asset.maintenanceLogs.map(log => (
              <div key={log.id} className="px-3 py-2 rounded-lg mb-1.5 text-sm" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex justify-between">
                  <span>{log.date} - {log.vendor}</span>
                  <span style={{ color: 'var(--accent-danger)' }}>${log.cost}</span>
                </div>
                <div className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>{log.issue}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-5">
          <button className="btn btn-tonal" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function AssetAssignments({ assets, employees, assignForm, setAssignForm, setAssignTarget, assignTarget, showAssignModal, setShowAssignModal, handleAssignAsset, handleReturnAsset, generateAgreementPDF }) {
  const [filterStatus, setFilterStatus] = useState('All')
  const assignableAssets = assets.filter(a => filterStatus === 'All' ? (a.status === 'Available' || a.status === 'Assigned') : a.status === filterStatus)

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-card px-5 py-3 flex gap-2" role="tablist">
        {['All', 'Available', 'Assigned'].map(s => (
          <button key={s} className={`btn ${s === filterStatus ? 'btn-filled' : 'btn-tonal'} btn-sm`} role="tab" aria-selected={s === filterStatus} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="table-container">
        <table role="table" className="table-responsive w-full table-striped">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Status / Assignee</th>
              <th>Assignment Date</th>
              <th>Condition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignableAssets.map(asset => {
              const emp = asset.assignedTo ? employees.find(e => e.id === asset.assignedTo) : null
              return (
                <tr key={asset.id}>
                  <td data-label="Asset">
                    <div className="font-semibold">{asset.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{asset.id}</div>
                  </td>
                  <td data-label="Status / Assignee">
                    {asset.status === 'Assigned' && emp ? (
                      <div className="flex items-center gap-2">
                        {emp.avatar ? <img src={emp.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full" style={{ background: 'var(--bg-tertiary)' }} />}
                        <div>
                          <div className="font-semibold">{emp.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{emp.department}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="badge badge-success">Available</span>
                    )}
                  </td>
                  <td data-label="Assignment Date">{asset.assignmentDate || '-'}</td>
                  <td data-label="Condition">{asset.condition || '-'}</td>
                  <td data-label="Actions">
                    {asset.status === 'Available' ? (
                      <button className="btn btn-filled btn-sm" aria-label="Assign asset" onClick={() => { setAssignTarget(asset); setShowAssignModal(true) }}>Assign</button>
                    ) : (
                      <div className="flex gap-2">
                        <button className="btn btn-tonal btn-sm" aria-label="Generate PDF" onClick={() => generateAgreementPDF(asset, emp, asset.condition)}><FileSignature size={14} /> PDF</button>
                        <button className="btn btn-tonal btn-sm" aria-label="Return asset" style={{ color: 'var(--accent-warning)' }} onClick={() => handleReturnAsset(asset.id)}>Return</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAssignModal && (
        <AssignAssetModal showAssignModal={showAssignModal} setShowAssignModal={setShowAssignModal} assignTarget={assignTarget} assignForm={assignForm} setAssignForm={setAssignForm} handleAssignAsset={handleAssignAsset} employees={employees} />
      )}
    </div>
  )
}

function AssignAssetModal({ showAssignModal, setShowAssignModal, assignTarget, assignForm, setAssignForm, handleAssignAsset, employees }) {
  useModal(() => setShowAssignModal(false))

  return (
    <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
      <div className="modal-content glass-card max-w-[500px] w-full" onClick={e => e.stopPropagation()}>
        <h2 className="mt-0">Assign Asset: {assignTarget?.name}</h2>
        <form onSubmit={handleAssignAsset} className="flex flex-col gap-4">
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
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Agreement PDF will be auto-generated on assignment.</p>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-tonal" onClick={() => setShowAssignModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-filled">Assign & Generate PDF</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssetRequests({ assetRequests, employees, handleRequestAction }) {
  return (
    <div className="flex flex-col gap-4">
      {assetRequests.length === 0 ? (
        <div className="glass-card p-10 text-center" style={{ color: 'var(--text-secondary)' }}>No pending asset requests.</div>
      ) : (
        assetRequests.map(req => {
          const emp = employees.find(e => e.id === req.employeeId) || { name: 'Unknown' }
          return (
            <div key={req.id} className="glass-card p-5 flex justify-between items-center flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-semibold">{emp.name}</span>
                  <span>requested a</span>
                  <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>{req.category}</span>
                  <span className={`badge ${req.urgency === 'High' ? 'badge-danger' : req.urgency === 'Medium' ? 'badge-warning' : 'badge-info'}`}>{req.urgency}</span>
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>"{req.justification}"</div>
              </div>
              {req.status === 'Pending' ? (
                <div className="flex gap-3 flex-wrap">
                  <button className="btn btn-filled btn-sm" onClick={() => handleRequestAction(req.id, 'Approved')}>Approve & Assign</button>
                  <button className="btn btn-tonal btn-sm" style={{ color: 'var(--accent-danger)' }} onClick={() => handleRequestAction(req.id, 'Rejected')}>Reject</button>
                </div>
              ) : (
                <span className={`badge ${req.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>{req.status}</span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function AssetMaintenance({ assets, selectedAssetForMaint, setSelectedAssetForMaint, maintForm, setMaintForm, handleAddMaintenance, calculateBookValue }) {
  return (
    <div className="maintenance-grid">
      <div className="glass-card p-5">
        <h3 className="mt-0 mb-4">Select Asset</h3>
        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
          {assets.map(asset => (
            <div key={asset.id}
              className={`${selectedAssetForMaint?.id === asset.id ? 'card-filled' : 'card-outlined'} p-3 cursor-pointer`}
              onClick={() => setSelectedAssetForMaint(asset)}>
              <div className="flex justify-between">
                <div className="font-semibold">{asset.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{asset.id}</div>
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className={`badge ${asset.status === 'Under Repair' ? 'badge-warning' : asset.status === 'Assigned' ? 'badge-info' : 'badge-success'}`}>{asset.status}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Purchased: {asset.purchaseDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {selectedAssetForMaint ? (
          <>
            <div className="glass-card p-5">
              <h3 className="mt-0 mb-4 flex items-center gap-2 text-sm">
                <TrendingDown size={20} color="var(--accent-primary)" /> Depreciation & Value
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Purchase Price</div><div className="text-xl font-bold">${selectedAssetForMaint.purchasePrice}</div></div>
                <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Book Value</div><div className="text-xl font-bold" style={{ color: 'var(--accent-success)' }}>${calculateBookValue(selectedAssetForMaint)}</div></div>
                <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Useful Life</div><div>{selectedAssetForMaint.usefulLife} months</div></div>
                <div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Condition</div><div>{selectedAssetForMaint.condition}</div></div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="mt-0 mb-4 flex items-center gap-2 text-sm">
                <PenTool size={20} color="var(--accent-warning)" /> Log Maintenance
              </h3>
              <form onSubmit={handleAddMaintenance} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required className="form-input" value={maintForm.date} onChange={e => setMaintForm(p => ({...p, date: e.target.value}))} aria-label="Maintenance date" />
                  <input type="number" required placeholder="Repair Cost ($)" className="form-input" value={maintForm.cost} onChange={e => setMaintForm(p => ({...p, cost: e.target.value}))} aria-label="Repair cost" />
                </div>
                <input type="text" required placeholder="Vendor / Service Center" className="form-input" value={maintForm.vendor} onChange={e => setMaintForm(p => ({...p, vendor: e.target.value}))} aria-label="Vendor" />
                <textarea required rows={3} placeholder="Describe the issue..." className="form-input" value={maintForm.issue} onChange={e => setMaintForm(p => ({...p, issue: e.target.value}))} aria-label="Issue description" />
                <button type="submit" className="btn btn-filled self-start" aria-label="Log repair">Log Repair</button>
              </form>

              {selectedAssetForMaint.maintenanceLogs?.length > 0 && (
                <div className="mt-6">
                  <h4 className="mt-0 mb-3 text-sm">Repair History</h4>
                  {selectedAssetForMaint.maintenanceLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-lg mb-2 text-sm" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex justify-between font-semibold">
                        <span>{log.date} - {log.vendor}</span>
                        <span style={{ color: 'var(--accent-danger)' }}>${log.cost}</span>
                      </div>
                      <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>{log.issue}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass-card p-10 text-center h-full flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
            Select an asset to view depreciation and maintenance.
          </div>
        )}
      </div>
    </div>
  )
}

function AddAssetModal({ showAddModal, setShowAddModal, newAsset, setNewAsset, handleAddAsset }) {
  useModal(() => setShowAddModal(false))

  return (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal-content glass-card max-w-[600px] w-full" onClick={e => e.stopPropagation()}>
        <h2 className="mt-0">Add New Asset</h2>
        <form onSubmit={handleAddAsset} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Asset Name</label>
              <input type="text" className="form-input" required value={newAsset.name} onChange={e => setNewAsset(p => ({...p, name: e.target.value}))} aria-label="Asset name" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-input" value={newAsset.category} onChange={e => setNewAsset(p => ({...p, category: e.target.value}))} aria-label="Asset category">
                <option>Laptop</option><option>Phone</option><option>Monitor</option><option>Peripherals</option><option>Access Card</option>
              </select>
            </div>
            <div className="form-group">
              <label>Serial Number / IMEI</label>
              <input type="text" className="form-input" required value={newAsset.serialNumber} onChange={e => setNewAsset(p => ({...p, serialNumber: e.target.value}))} aria-label="Serial number" />
            </div>
            <div className="form-group">
              <label>Purchase Date</label>
              <input type="date" className="form-input" required value={newAsset.purchaseDate} onChange={e => setNewAsset(p => ({...p, purchaseDate: e.target.value}))} aria-label="Purchase date" />
            </div>
            <div className="form-group">
              <label>Purchase Price ($)</label>
              <input type="number" className="form-input" required value={newAsset.purchasePrice} onChange={e => setNewAsset(p => ({...p, purchasePrice: e.target.value}))} aria-label="Purchase price" />
            </div>
            <div className="form-group">
              <label>Useful Life (Months)</label>
              <input type="number" className="form-input" required value={newAsset.usefulLife} onChange={e => setNewAsset(p => ({...p, usefulLife: e.target.value}))} aria-label="Useful life" />
            </div>
            <div className="form-group">
              <label>Warranty Expiry</label>
              <input type="date" className="form-input" required value={newAsset.warrantyExpiry} onChange={e => setNewAsset(p => ({...p, warrantyExpiry: e.target.value}))} aria-label="Warranty expiry" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-tonal" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-filled">Save Asset</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Assets({ employees, assets, setAssets, assetRequests, setAssetRequests, addLog, addToast, currentUser, simulatedRole }) {
  const [activeView, setActiveView] = useState('dashboard')

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

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
    addLog('Asset "' + newAsset.name + '" added to inventory')
    setNewAsset({ name: '', category: 'Laptop', serialNumber: '', purchaseDate: '', purchasePrice: '', warrantyExpiry: '', usefulLife: 36, condition: 'New' })
  }

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
    addLog('Asset "' + assignTarget.name + '" assigned to ' + (employees.find(emp => emp.id === assignForm.employeeId)?.name || 'unknown'))

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
    const asset = assets.find(a => a.id === id)
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'Available', assignedTo: null, assignmentDate: null }
      }
      return a
    }))
    addToast('Asset returned to inventory', 'success')
    if (asset) addLog('Asset "' + asset.name + '" returned to inventory')
  }

  const handleRequestAction = (reqId, action) => {
    setAssetRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: action } : r))
    addToast(`Request ${action.toLowerCase()}`, 'info')
    addLog('Asset request ' + action.toLowerCase())
  }

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
    addLog('Maintenance logged for "' + selectedAssetForMaint.name + '"')
  }

  const calculateBookValue = (asset) => {
    if (asset.purchasePrice === undefined || asset.purchasePrice === null || !asset.purchaseDate || !asset.usefulLife) return asset.purchasePrice || 0
    const purchaseDate = new Date(asset.purchaseDate)
    const today = new Date()
    const monthsElapsed = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth())
    if (monthsElapsed >= asset.usefulLife) return 0

    const monthlyDepreciation = asset.purchasePrice / asset.usefulLife
    const bookValue = asset.purchasePrice - (monthlyDepreciation * monthsElapsed)
    return Math.max(0, bookValue).toFixed(2)
  }

  const stats = {
    total: assets?.length || 0,
    available: assets?.filter(a => a.status === 'Available').length || 0,
    assigned: assets?.filter(a => a.status === 'Assigned').length || 0,
    underRepair: assets?.filter(a => a.status === 'Under Repair').length || 0,
  }

  const filteredAssets = (assets || []).filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.serialNumber.toLowerCase().includes(search.toLowerCase())
    const matchesCat = filterCategory === 'All' ? true : a.category === filterCategory
    return matchesSearch && matchesCat
  })

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AssetDashboard stats={stats} setActiveView={setActiveView} assets={assets || []} />
      case 'inventory':
        return <AssetInventory filteredAssets={filteredAssets} search={search} setSearch={setSearch} filterCategory={filterCategory} setFilterCategory={setFilterCategory} alerts={alerts} showAddModal={showAddModal} setShowAddModal={setShowAddModal} newAsset={newAsset} setNewAsset={setNewAsset} handleAddAsset={handleAddAsset} triggerFileInput={triggerFileInput} fileInputRef={fileInputRef} handleImportCSV={handleImportCSV} addToast={addToast} />
      case 'assignments':
        return <AssetAssignments assets={assets} employees={employees} assignForm={assignForm} setAssignForm={setAssignForm} setAssignTarget={setAssignTarget} assignTarget={assignTarget} showAssignModal={showAssignModal} setShowAssignModal={setShowAssignModal} handleAssignAsset={handleAssignAsset} handleReturnAsset={handleReturnAsset} generateAgreementPDF={generateAgreementPDF} />
      case 'requests':
        return <AssetRequests assetRequests={assetRequests} employees={employees} handleRequestAction={handleRequestAction} />
      case 'maintenance':
        return <AssetMaintenance assets={assets} selectedAssetForMaint={selectedAssetForMaint} setSelectedAssetForMaint={setSelectedAssetForMaint} maintForm={maintForm} setMaintForm={setMaintForm} handleAddMaintenance={handleAddMaintenance} calculateBookValue={calculateBookValue} />
      default:
        return <AssetDashboard stats={stats} setActiveView={setActiveView} assets={assets || []} />
    }
  }

  return (
    <div className="fade-in pb-10">
      <div className="page-header">
        <h1 className="page-title">
          <Monitor size={28} className="page-title-icon" />
          Asset Management
        </h1>
        <div className="flex gap-3 overflow-x-auto pb-2" role="tablist">
          <button className={`tab-btn ${activeView === 'dashboard' ? 'active' : ''}`} role="tab" aria-selected={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')}>Dashboard</button>
          <button className={`tab-btn ${activeView === 'inventory' ? 'active' : ''}`} role="tab" aria-selected={activeView === 'inventory'} onClick={() => setActiveView('inventory')}>Inventory</button>
          <button className={`tab-btn ${activeView === 'assignments' ? 'active' : ''}`} role="tab" aria-selected={activeView === 'assignments'} onClick={() => setActiveView('assignments')}>Assignments</button>
          <button className={`tab-btn ${activeView === 'requests' ? 'active' : ''}`} role="tab" aria-selected={activeView === 'requests'} style={{ position: 'relative' }} onClick={() => setActiveView('requests')}>
            Requests
            {assetRequests?.filter(r => r.status === 'Pending').length > 0 && (
              <span className="badge-count-sm">{assetRequests.filter(r => r.status === 'Pending').length}</span>
            )}
          </button>
          <button className={`tab-btn ${activeView === 'maintenance' ? 'active' : ''}`} role="tab" aria-selected={activeView === 'maintenance'} onClick={() => setActiveView('maintenance')}>Maintenance</button>
        </div>
      </div>

      {alerts.length > 0 && activeView === 'dashboard' && (
        <div className="glass-card p-3 mb-6 flex items-center gap-3" style={{ background: 'var(--accent-warning)', color: '#fff' }}>
          <AlertTriangle size={20} />
          <span><strong>Alert:</strong> {alerts.length} asset(s) have warranties expiring within 30 days</span>
        </div>
      )}

      {renderView()}

      {showAddModal && (
        <AddAssetModal showAddModal={showAddModal} setShowAddModal={setShowAddModal} newAsset={newAsset} setNewAsset={setNewAsset} handleAddAsset={handleAddAsset} />
      )}

      <AdSlot />
    </div>
  )
}
