'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle2, Clock, AlertTriangle, Circle, Search, Plus, Trash2, X } from 'lucide-react'
import { type Task, type TaskStatus, type TaskPriority, team } from '@/lib/store'

type TasksViewProps = {
  tasks: Task[]
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onCreateTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  currentUserId: string
}

type FilterType = 'all' | 'mine' | 'todo' | 'progress' | 'blocked' | 'done'

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'todo', label: 'To Do' },
  { id: 'progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'done', label: 'Done' },
]

const statusOptions: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'var(--text-quaternary)' },
  { id: 'progress', label: 'In Progress', color: 'var(--accent)' },
  { id: 'review', label: 'Review', color: 'var(--warning)' },
  { id: 'done', label: 'Done', color: 'var(--success)' },
  { id: 'blocked', label: 'Blocked', color: 'var(--danger)' },
]

const priorityOptions: { id: TaskPriority; label: string; bg: string; color: string }[] = [
  { id: 'critical', label: 'Critical', bg: 'var(--danger-light)', color: 'var(--danger)' },
  { id: 'high', label: 'High', bg: 'var(--warning-light)', color: 'var(--warning)' },
  { id: 'medium', label: 'Medium', bg: 'var(--bg-badge)', color: 'var(--text-tertiary)' },
  { id: 'low', label: 'Low', bg: 'var(--bg-badge)', color: 'var(--text-quaternary)' },
]

const priorityBadge = (p: Task['priority']) => priorityOptions.find(o => o.id === p) || priorityOptions[2]

const statusIcon = (s: TaskStatus) => {
  switch (s) {
    case 'done': return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
    case 'progress': return <Clock size={16} style={{ color: 'var(--accent)' }} />
    case 'blocked': return <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
    case 'review': return <Circle size={16} style={{ color: 'var(--warning)' }} />
    default: return <Circle size={16} style={{ color: 'var(--text-ghost)' }} />
  }
}

function getTimeHorizon(dueDate: string): string {
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Overdue'
  if (diffDays <= 7) return 'This Week'
  if (diffDays <= 14) return 'Next Week'
  return 'Later'
}

function CreateTaskForm({ onCreateTask, onClose, currentUserId }: { onCreateTask: (task: Task) => void; onClose: () => void; currentUserId: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState(currentUserId)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    onCreateTask({
      id: `t-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      owner,
      status: 'todo',
      priority,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      deliverable: '',
      verified: false,
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden mb-6"
    >
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent), var(--shadow-sm)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>New Task</h3>
          <button onClick={onClose} className="p-1 rounded-md transition-colors" style={{ color: 'var(--text-quaternary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            className="w-full border rounded-lg"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)..."
            rows={2}
            className="w-full border rounded-lg resize-none"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)' }}
          />

          <div className="grid grid-cols-3 gap-3">
            {/* Owner */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Assign to</label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full border rounded-lg"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 8px', fontSize: '13px', color: 'var(--text-primary)' }}
              >
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full border rounded-lg"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 8px', fontSize: '13px', color: 'var(--text-primary)' }}
              >
                {priorityOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded-lg"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 8px', fontSize: '13px', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)..."
            className="w-full border rounded-lg"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)' }}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border-default)', fontSize: '13px', color: 'var(--text-tertiary)' }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'white', fontSize: '13px', fontWeight: 600 }}
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function TasksView({ tasks, onUpdateTask, onCreateTask, onDeleteTask, currentUserId }: TasksViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const filtered = useMemo(() => {
    let result = [...tasks]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)))
    }
    switch (activeFilter) {
      case 'mine': result = result.filter((t) => t.owner === currentUserId); break
      case 'todo': result = result.filter((t) => t.status === 'todo'); break
      case 'progress': result = result.filter((t) => t.status === 'progress'); break
      case 'blocked': result = result.filter((t) => t.status === 'blocked'); break
      case 'done': result = result.filter((t) => t.status === 'done'); break
    }
    return result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [tasks, activeFilter, currentUserId, searchQuery])

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    filtered.forEach((task) => {
      const horizon = getTimeHorizon(task.dueDate)
      if (!groups[horizon]) groups[horizon] = []
      groups[horizon].push(task)
    })
    return groups
  }, [filtered])

  const horizonOrder = ['Overdue', 'This Week', 'Next Week', 'Later']

  const handleVerify = (taskId: string) => {
    setVerifyingId(taskId)
    setTimeout(() => {
      onUpdateTask(taskId, { verified: true })
      setVerifyingId(null)
    }, 400)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* Filter bar & Search */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className="relative px-3.5 py-1.5 rounded-md transition-all"
                style={{
                  fontSize: '13px',
                  fontWeight: activeFilter === filter.id ? 600 : 400,
                  color: activeFilter === filter.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: activeFilter === filter.id ? 'var(--bg-surface)' : 'transparent',
                  boxShadow: activeFilter === filter.id ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-quaternary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8 pr-3 py-1.5 rounded-lg border"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  width: 200,
                }}
              />
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--accent)', color: 'white', fontSize: '13px', fontWeight: 600 }}
            >
              <Plus size={14} /> New Task
            </button>
          </div>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreateForm && (
            <CreateTaskForm
              onCreateTask={onCreateTask}
              onClose={() => setShowCreateForm(false)}
              currentUserId={currentUserId}
            />
          )}
        </AnimatePresence>

        {/* Empty state */}
        {filtered.length === 0 && !showCreateForm && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-muted)' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--text-quaternary)' }} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-quaternary)', marginBottom: 16 }}>
              {tasks.length === 0 ? 'Create your first task to get started.' : 'Try adjusting your filters or search.'}
            </div>
            {tasks.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg"
                style={{ background: 'var(--accent)', color: 'white', fontSize: '13px', fontWeight: 600 }}
              >
                <Plus size={14} /> Create Task
              </button>
            )}
          </div>
        )}

        {/* Task groups */}
        {horizonOrder.map((horizon) => {
          const group = grouped[horizon]
          if (!group || group.length === 0) return null

          return (
            <div key={horizon} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span style={{
                  fontSize: '12px', fontWeight: 600, color: horizon === 'Overdue' ? 'var(--danger)' : 'var(--text-tertiary)',
                  letterSpacing: '0.02em',
                }}>
                  {horizon}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                  {group.length} {group.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <div
                className="rounded-xl border overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
              >
                {group.map((task, idx) => {
                  const isExpanded = expandedTaskId === task.id
                  const owner = team.find((m) => m.id === task.owner)
                  const priority = priorityBadge(task.priority)
                  const isVerifying = verifyingId === task.id

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      layout
                      style={{
                        borderBottom: idx < group.length - 1 ? '1px solid var(--border-default)' : 'none',
                      }}
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {statusIcon(task.status)}
                        {owner && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: owner.gradient, fontSize: '9px', fontWeight: 600, color: 'white' }}
                          >
                            {owner.initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="truncate block" style={{
                            fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)',
                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            opacity: task.status === 'done' ? 0.6 : 1,
                          }}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-md" style={{
                              fontSize: '11px', fontWeight: 500, background: 'var(--bg-badge)', color: 'var(--text-tertiary)',
                            }}>
                              {tag}
                            </span>
                          ))}
                          <span className="px-2 py-0.5 rounded-md" style={{
                            fontSize: '11px', fontWeight: 500, background: priority.bg, color: priority.color,
                          }}>
                            {priority.label}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-quaternary)', minWidth: 70 }}>
                            {task.dueDate}
                          </span>
                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                            <ChevronRight size={14} style={{ color: 'var(--text-quaternary)' }} />
                          </motion.div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1">
                              <div className="ml-8 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                                {/* Editable title */}
                                <input
                                  type="text"
                                  value={task.title}
                                  onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border rounded-lg mb-3"
                                  style={{
                                    background: 'var(--bg-input)', borderColor: 'var(--border-default)',
                                    padding: '8px 12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                                  }}
                                />

                                {/* Editable description */}
                                <textarea
                                  value={task.description}
                                  onChange={(e) => onUpdateTask(task.id, { description: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Add a description..."
                                  rows={2}
                                  className="w-full border rounded-lg resize-none mb-3"
                                  style={{
                                    background: 'var(--bg-input)', borderColor: 'var(--border-default)',
                                    padding: '8px 12px', fontSize: '13px', color: 'var(--text-secondary)',
                                  }}
                                />

                                {/* Editable fields row */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                  <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Assigned to</label>
                                    <select
                                      value={task.owner}
                                      onChange={(e) => { e.stopPropagation(); onUpdateTask(task.id, { owner: e.target.value }) }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full border rounded-lg"
                                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 8px', fontSize: '13px', color: 'var(--text-primary)' }}
                                    >
                                      {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Priority</label>
                                    <select
                                      value={task.priority}
                                      onChange={(e) => { e.stopPropagation(); onUpdateTask(task.id, { priority: e.target.value as TaskPriority }) }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full border rounded-lg"
                                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 8px', fontSize: '13px', color: 'var(--text-primary)' }}
                                    >
                                      {priorityOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Due date</label>
                                    <input
                                      type="date"
                                      value={task.dueDate}
                                      onChange={(e) => { e.stopPropagation(); onUpdateTask(task.id, { dueDate: e.target.value }) }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full border rounded-lg"
                                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 8px', fontSize: '13px', color: 'var(--text-primary)' }}
                                    />
                                  </div>
                                </div>

                                {/* Deliverable */}
                                <div className="mb-3">
                                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Deliverable</label>
                                  <input
                                    type="text"
                                    value={task.deliverable}
                                    onChange={(e) => onUpdateTask(task.id, { deliverable: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Add deliverable..."
                                    className="w-full border rounded-lg"
                                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)' }}
                                  />
                                </div>

                                {/* Status selector */}
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-1.5">
                                    {statusOptions.map((opt) => (
                                      <button
                                        key={opt.id}
                                        onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, { status: opt.id }) }}
                                        className="px-3 py-1.5 rounded-lg transition-all border"
                                        style={{
                                          background: task.status === opt.id ? opt.color : 'var(--bg-surface)',
                                          color: task.status === opt.id ? 'white' : 'var(--text-tertiary)',
                                          borderColor: task.status === opt.id ? opt.color : 'var(--border-default)',
                                          fontSize: '12px',
                                          fontWeight: task.status === opt.id ? 600 : 400,
                                        }}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleVerify(task.id) }}
                                      className="px-3 py-1.5 rounded-lg transition-all border"
                                      style={{
                                        borderColor: task.verified ? 'var(--success)' : 'var(--border-default)',
                                        background: task.verified ? 'var(--success-light)' : 'var(--bg-surface)',
                                        color: task.verified ? 'var(--success)' : 'var(--text-tertiary)',
                                        fontSize: '12px', fontWeight: 500,
                                      }}
                                    >
                                      {task.verified ? 'Verified' : 'Verify'}
                                    </button>
                                    {isVerifying && (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {[...Array(6)].map((_, i) => (
                                          <div
                                            key={i}
                                            className="absolute w-1.5 h-1.5 rounded-sm"
                                            style={{
                                              background: ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--accent)', 'var(--success)', 'var(--warning)'][i],
                                              animation: `confetti-${i + 1} 400ms ease-out forwards`,
                                            }}
                                          />
                                        ))}
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm('Delete this task?')) {
                                          onDeleteTask(task.id)
                                          setExpandedTaskId(null)
                                        }
                                      }}
                                      className="px-2 py-1.5 rounded-lg transition-colors border"
                                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-quaternary)' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
                                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-quaternary)' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
