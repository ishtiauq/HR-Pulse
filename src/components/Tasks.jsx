import { useState } from 'react'
import { Plus, Search, LayoutGrid, List, MoreVertical, Calendar as CalendarIcon, Edit, Trash2, CheckSquare, ChevronDown, MessageSquare, Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Select, SelectItem } from "@/components/ui/select"

export default function Tasks({ tasks = [], setTasks, employees = [], currentUser, addToast, simulatedRole, addLog, addNotification }) {
  const [view, setView] = useState('kanban')
  const [search, setSearch] = useState('')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [activeTab, setActiveTab] = useState('details')
  const [updateText, setUpdateText] = useState('')
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  
  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    assigneeIds: [],
    dueDate: '',
    tags: [],
    updates: [],
    createdBy: currentUser?.id
  })

  const COLUMNS = ['To Do', 'In Progress', 'Review', 'Done']

  const getPriorityColor = (prio) => {
    switch(prio) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'Low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const filteredTasks = tasks.filter(t => {
    const assignees = t.assigneeIds || []
    const matchesAssignee = filterAssignee === 'all' || 
                            (filterAssignee === 'unassigned' && assignees.length === 0) || 
                            assignees.includes(filterAssignee);
    const searchLower = search.toLowerCase();
    const assignedEmployees = employees.filter(e => assignees.includes(e.id));
    const matchesSearch = t.title.toLowerCase().includes(searchLower) || 
                          t.description.toLowerCase().includes(searchLower) ||
                          assignedEmployees.some(emp => emp.name.toLowerCase().includes(searchLower));
    return matchesAssignee && matchesSearch;
  })

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, status) => {
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      addLog(`Moved task to ${status}`, `Task ID: ${taskId}`)
    }
  }

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) {
      addToast('Task title is required', 'error')
      return
    }

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskForm } : t))
      addToast('Task updated successfully', 'success')
      addLog('Updated Task', `Title: ${taskForm.title}`)
    } else {
      const newTask = {
        ...taskForm,
        id: `task-${Date.now()}`
      }
      setTasks(prev => [newTask, ...prev])
      addToast('Task created successfully', 'success')
      addLog('Created Task', `Title: ${taskForm.title}`)
    }
    closeModal()
  }

  const handleDeleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id))
      addToast('Task deleted', 'success')
    }
  }

  const openModal = (task = null) => {
    setActiveTab('details')
    setUpdateText('')
    setShowAssigneesDropdown(false)
    if (task) {
      setEditingTask(task)
      setTaskForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeIds: task.assigneeIds || [],
        dueDate: task.dueDate || '',
        tags: task.tags || [],
        updates: task.updates || [],
        createdBy: task.createdBy || currentUser?.id
      })
    } else {
      setEditingTask(null)
      setTaskForm({
        title: '',
        description: '',
        status: 'To Do',
        priority: 'Medium',
        assigneeIds: [],
        dueDate: '',
        tags: [],
        updates: [],
        createdBy: currentUser?.id
      })
    }
    setShowTaskModal(true)
  }

  const handleAddUpdate = () => {
    if (!updateText.trim()) return
    const newUpdate = {
      id: `upd-${Date.now()}`,
      text: updateText,
      authorId: currentUser?.id,
      timestamp: new Date().toISOString()
    }
    
    if (editingTask) {
      setTasks(prev => prev.map(t => {
        if (t.id === editingTask.id) {
          const updatedTask = { ...t, updates: [...(t.updates || []), newUpdate] }
          if (t.createdBy && t.createdBy !== currentUser?.id) {
             if (addNotification) addNotification(`${currentUser?.name || 'Someone'} added an update to task: "${t.title}"`)
          }
          t.assigneeIds?.forEach(assigneeId => {
             if (assigneeId !== currentUser?.id) {
                if (addNotification) addNotification(`${currentUser?.name || 'Someone'} updated task: "${t.title}"`)
             }
          })
          return updatedTask
        }
        return t
      }))
      setTaskForm(prev => ({ ...prev, updates: [...prev.updates, newUpdate] }))
      addLog('Task Update Added', `Task ID: ${editingTask.id}`)
    }
    setUpdateText('')
  }

  const closeModal = () => {
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const getAssignees = (ids) => {
    if (!ids) return []
    return employees.filter(e => ids.includes(e.id))
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col pb-4 border-b border-border mb-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
          <CheckSquare size={20} className="text-primary" /> Tasks
        </h1>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-4 items-center w-full justify-between">
        <div className="relative flex-auto min-w-[250px] lg:max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks or assignees..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background w-full"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 sm:flex-none min-w-[140px]">
            <Select value={filterAssignee} onChange={setFilterAssignee}>
              <SelectItem id="all">All Assignees</SelectItem>
              <SelectItem id="unassigned">Unassigned</SelectItem>
              {employees.map(e => <SelectItem key={e.id} id={e.id}>{e.name}</SelectItem>)}
            </Select>
          </div>
          
          <div className="flex-1 sm:flex-none flex items-center bg-background rounded-lg border border-border p-1 justify-center sm:justify-start">
            <Button 
              variant={view === 'kanban' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setView('kanban')}
              className="px-3 flex-1 sm:flex-none"
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Board
            </Button>
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setView('list')}
              className="px-3 flex-1 sm:flex-none"
            >
              <List className="h-4 w-4 mr-2" /> List
            </Button>
          </div>
          
          <Button onClick={() => openModal()} className="shadow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board View */}
      {view === 'kanban' && (
        <div className="flex overflow-x-auto pb-4 gap-6 w-full items-start">
          {COLUMNS.map(col => (
            <div 
              key={col} 
              className="flex flex-col gap-3 min-w-[260px] w-[260px] bg-muted/30 rounded-xl p-3 border border-border/50 h-fit"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  {col} 
                  <span className="bg-background text-xs px-2 py-0.5 rounded-full border border-border">
                    {filteredTasks.filter(t => t.status === col).length}
                  </span>
                </h3>
              </div>
              
              <div className="flex flex-col gap-3 h-full overflow-y-auto">
                {filteredTasks.filter(t => t.status === col).map(task => {
                  const assignees = getAssignees(task.assigneeIds)
                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      title="Drag to move"
                      className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all group flex flex-col shrink-0 h-max"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => openModal(task)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => setTaskToDelete(task.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
                      
                      {task.updates && task.updates.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <MessageSquare className="h-3 w-3" />
                          <span>{task.updates.length}</span>
                        </div>
                      )}
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded border border-border/50">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                        </div>
                        {assignees.length > 0 && (
                          <div className="flex -space-x-2">
                            {assignees.slice(0, 3).map((a, i) => (
                              <img key={a.id} src={a.avatar} alt={a.name} className="h-6 w-6 rounded-full object-cover border border-card relative" style={{ zIndex: 3 - i }} title={a.name} />
                            ))}
                            {assignees.length > 3 && (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border border-card relative z-0">
                                +{assignees.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filteredTasks.filter(t => t.status === col).length === 0 && (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3">Task Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">No tasks found.</td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const assignees = getAssignees(task.assigneeIds)
                    return (
                      <tr key={task.id} className="border-b border-border hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{task.title}</td>
                        <td className="px-4 py-3">
                          <Select value={task.status} onChange={(val) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: val } : t))}>
                            {COLUMNS.map(c => <SelectItem key={c} id={c}>{c}</SelectItem>)}
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {assignees.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {assignees.slice(0, 3).map((a, i) => (
                                  <img key={a.id} src={a.avatar} alt={a.name} className="h-6 w-6 rounded-full object-cover border border-card relative" style={{ zIndex: 3 - i }} title={a.name} />
                                ))}
                                {assignees.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border border-card relative z-0">
                                    +{assignees.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm truncate max-w-[120px]" title={assignees.map(a => a.name).join(', ')}>{assignees.map(a => a.name).join(', ')}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => openModal(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setTaskToDelete(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the task.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              handleDeleteTask(taskToDelete);
              setTaskToDelete(null);
            }} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Modal */}
      <Dialog open={showTaskModal} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{editingTask ? 'Task Details' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          
          {editingTask ? (
            <div className="w-full flex flex-col gap-4">
              <div className="flex bg-muted/50 p-1 rounded-lg w-full">
                <button
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'details' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
                <button
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'updates' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab('updates')}
                >
                  Updates 
                  {taskForm.updates.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{taskForm.updates.length}</span>}
                </button>
              </div>
              
              {activeTab === 'details' && (
              <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Task Title *</label>
              <Input 
                value={taskForm.title} 
                onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
                placeholder="e.g. Update user roles"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={taskForm.description} 
                onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                placeholder="Details about the task..."
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <Input 
                value={(taskForm.tags || []).join(', ')} 
                onChange={e => setTaskForm({...taskForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                placeholder="e.g. Frontend, Urgent, Bug"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={taskForm.status} onChange={val => setTaskForm({...taskForm, status: val})}>
                  {COLUMNS.map(c => <SelectItem key={c} id={c}>{c}</SelectItem>)}
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={taskForm.priority} onChange={val => setTaskForm({...taskForm, priority: val})}>
                  <SelectItem id="High">High</SelectItem>
                  <SelectItem id="Medium">Medium</SelectItem>
                  <SelectItem id="Low">Low</SelectItem>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Assignees</label>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between font-normal bg-background"
                    onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                  >
                    {taskForm.assigneeIds.length > 0 
                      ? `${taskForm.assigneeIds.length} Assignee(s)` 
                      : "Select Assignees..."}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                  {showAssigneesDropdown && (
                    <div className="absolute z-50 w-[200px] mt-1 bg-popover border border-border rounded-md shadow-md text-popover-foreground">
                      <div className="px-2 py-1.5 text-sm font-semibold">Select Employees</div>
                      <div className="h-px bg-border my-1" />
                      <div className="max-h-[200px] overflow-y-auto p-1 flex flex-col">
                        {employees.map(emp => (
                          <label key={emp.id} className="flex items-center gap-2 text-sm p-2 hover:bg-accent rounded-sm cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={taskForm.assigneeIds.includes(emp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTaskForm({...taskForm, assigneeIds: [...taskForm.assigneeIds, emp.id]})
                                } else {
                                  setTaskForm({...taskForm, assigneeIds: taskForm.assigneeIds.filter(id => id !== emp.id)})
                                }
                              }}
                              className="rounded border-border accent-primary h-4 w-4"
                            />
                            <img src={emp.avatar} alt={emp.name} className="h-5 w-5 rounded-full object-cover" />
                            {emp.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input 
                  type="date" 
                  value={taskForm.dueDate} 
                  onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} 
                />
              </div>
            </div>
            </div>
              )}
              
              {activeTab === 'updates' && (
              <div className="flex flex-col gap-4 py-2 h-[50vh]">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {taskForm.updates.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground mt-8">No updates yet. Be the first to add one!</div>
                  ) : (
                    taskForm.updates.map(update => {
                      const author = getAssignees([update.authorId])[0]
                      return (
                        <div key={update.id} className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                          <img src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.name||'U'}`} alt="Avatar" className="h-8 w-8 rounded-full object-cover shrink-0" />
                          <div className="grid gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{author?.name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{new Date(update.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm">{update.text}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="flex items-end gap-2 pt-2 border-t border-border mt-auto">
                  <div className="grid gap-1 flex-1">
                    <Input 
                      placeholder="Type your update here..." 
                      value={updateText}
                      onChange={e => setUpdateText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddUpdate()
                      }}
                    />
                  </div>
                  <Button onClick={handleAddUpdate} size="icon"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Task Title *</label>
                <Input 
                  value={taskForm.title} 
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
                  placeholder="e.g. Update user roles"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={taskForm.description} 
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Details about the task..."
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input 
                  value={(taskForm.tags || []).join(', ')} 
                  onChange={e => setTaskForm({...taskForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                  placeholder="e.g. Frontend, Urgent, Bug"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={taskForm.status} onChange={val => setTaskForm({...taskForm, status: val})}>
                    {COLUMNS.map(c => <SelectItem key={c} id={c}>{c}</SelectItem>)}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={taskForm.priority} onChange={val => setTaskForm({...taskForm, priority: val})}>
                    <SelectItem id="High">High</SelectItem>
                    <SelectItem id="Medium">Medium</SelectItem>
                    <SelectItem id="Low">Low</SelectItem>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Assignees</label>
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-between font-normal bg-background"
                      onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                    >
                      {taskForm.assigneeIds.length > 0 
                        ? `${taskForm.assigneeIds.length} Assignee(s)` 
                        : "Select Assignees..."}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                    {showAssigneesDropdown && (
                      <div className="absolute z-50 w-[200px] mt-1 bg-popover border border-border rounded-md shadow-md text-popover-foreground">
                        <div className="px-2 py-1.5 text-sm font-semibold">Select Employees</div>
                        <div className="h-px bg-border my-1" />
                        <div className="max-h-[200px] overflow-y-auto p-1 flex flex-col">
                          {employees.map(emp => (
                            <label key={emp.id} className="flex items-center gap-2 text-sm p-2 hover:bg-accent rounded-sm cursor-pointer transition-colors">
                              <input 
                                type="checkbox" 
                                checked={taskForm.assigneeIds.includes(emp.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTaskForm({...taskForm, assigneeIds: [...taskForm.assigneeIds, emp.id]})
                                  } else {
                                    setTaskForm({...taskForm, assigneeIds: taskForm.assigneeIds.filter(id => id !== emp.id)})
                                  }
                                }}
                                className="rounded border-border accent-primary h-4 w-4"
                              />
                              <img src={emp.avatar} alt={emp.name} className="h-5 w-5 rounded-full object-cover" />
                              {emp.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input 
                    type="date" 
                    value={taskForm.dueDate} 
                    onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            {(!editingTask || activeTab === 'details') && (
              <Button onClick={handleSaveTask}>Save Task</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
