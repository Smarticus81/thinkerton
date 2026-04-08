'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { type Task, type Milestone, milestones, team } from '@/lib/store'

type DashboardProps = {
  tasks: Task[]
  onExpandTask: (id: string) => void
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) { setDisplay(value); return }
    mounted.current = true
    const start = performance.now()
    const duration = 600
    const animate = (now: number) => {
      const elapsed = now - start - delay
      if (elapsed < 0) { requestAnimationFrame(animate); return }
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, delay])

  return <>{display}</>
}

const statusIcon = (s: Task['status']) => {
  switch (s) {
    case 'done': return <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
    case 'progress': return <Clock size={14} style={{ color: 'var(--accent)' }} />
    case 'blocked': return <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
    case 'review': return <Circle size={14} style={{ color: 'var(--warning)' }} />
    default: return <Circle size={14} style={{ color: 'var(--text-quaternary)' }} />
  }
}

const statusLabel = (s: Task['status']) => {
  switch (s) {
    case 'done': return 'Done'
    case 'progress': return 'In Progress'
    case 'blocked': return 'Blocked'
    case 'review': return 'In Review'
    default: return 'To Do'
  }
}

const priorityLabel = (p: Task['priority']) => {
  switch (p) {
    case 'critical': return { text: 'Critical', bg: 'var(--danger-light)', color: 'var(--danger)' }
    case 'high': return { text: 'High', bg: 'var(--warning-light)', color: 'var(--warning)' }
    case 'medium': return { text: 'Medium', bg: 'var(--bg-badge)', color: 'var(--text-tertiary)' }
    default: return { text: 'Low', bg: 'var(--bg-badge)', color: 'var(--text-quaternary)' }
  }
}

export function DashboardView({ tasks }: DashboardProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const totalTasks = tasks.length
  const inProgress = tasks.filter((t) => t.status === 'progress').length
  const critical = tasks.filter((t) => t.priority === 'critical').length
  const blocked = tasks.filter((t) => t.status === 'blocked').length
  const done = tasks.filter((t) => t.status === 'done').length
  const completionRate = Math.round((done / totalTasks) * 100)

  const metrics = [
    { label: 'Total Tasks', value: totalTasks, icon: <Circle size={16} style={{ color: 'var(--accent)' }} />, bg: 'var(--accent-light)' },
    { label: 'In Progress', value: inProgress, icon: <Clock size={16} style={{ color: 'var(--accent)' }} />, bg: 'var(--accent-light)' },
    { label: 'Critical', value: critical, icon: <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />, bg: 'var(--danger-light)' },
    { label: 'Blocked', value: blocked, icon: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />, bg: 'var(--warning-light)' },
    { label: 'Completed', value: done, icon: <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />, bg: 'var(--success-light)' },
  ]

  const activeMilestones = milestones.filter(m => m.progress > 0 && m.progress < 100)
  const activeTasks = tasks.filter(t => t.status !== 'done')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {metrics.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="rounded-xl border p-4"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: metric.bg }}
                >
                  {metric.icon}
                </div>
              </div>
              <div style={{
                fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)',
                lineHeight: 1, letterSpacing: '-0.02em',
              }}>
                <AnimatedNumber value={metric.value} delay={idx * 40} />
              </div>
              <div style={{
                fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', marginTop: 4,
              }}>
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left column: Active Tasks */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Active Tasks
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                {activeTasks.length} items
              </span>
            </div>

            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
            >
              {activeTasks.map((task, idx) => {
                const owner = team.find((m) => m.id === task.owner)
                const priority = priorityLabel(task.priority)
                const isExpanded = expandedCard === task.id

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: idx < activeTasks.length - 1 ? '1px solid var(--border-default)' : 'none',
                    }}
                    onClick={() => setExpandedCard(isExpanded ? null : task.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {statusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <div className="truncate" style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {task.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="px-2 py-0.5 rounded-md"
                          style={{ fontSize: '11px', fontWeight: 500, background: priority.bg, color: priority.color }}
                        >
                          {priority.text}
                        </span>
                        {owner && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              background: owner.gradient,
                              fontSize: '9px', fontWeight: 600, color: 'white',
                            }}
                          >
                            {owner.initials}
                          </div>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text-quaternary)', minWidth: 70 }}>
                          {task.dueDate}
                        </span>
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
                          <div className="px-4 pb-4 pt-1 ml-8">
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                              {task.description}
                            </p>
                            {task.tags.length > 0 && (
                              <div className="flex gap-1.5 mt-3">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-md"
                                    style={{
                                      fontSize: '11px', fontWeight: 500,
                                      background: 'var(--bg-badge)', color: 'var(--text-tertiary)',
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Right column: Milestones + Completion */}
          <div className="space-y-6">
            {/* Completion */}
            <div
              className="rounded-xl border p-5"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
            >
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                Sprint Progress
              </h3>
              <div className="flex items-end gap-3 mb-3">
                <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  <AnimatedNumber value={completionRate} />%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-quaternary)', paddingBottom: 4 }}>
                  complete
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--accent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex justify-between mt-3">
                <span style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>{done} done</span>
                <span style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>{totalTasks - done} remaining</span>
              </div>
            </div>

            {/* Milestones */}
            <div
              className="rounded-xl border p-5"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
            >
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                Milestones
              </h3>
              <div className="space-y-4">
                {milestones.slice(0, 4).map((ms) => (
                  <div key={ms.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {ms.title}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: ms.progress === 100 ? 'var(--success)' : 'var(--text-quaternary)' }}>
                        {ms.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${ms.progress}%`,
                          background: ms.progress === 100 ? 'var(--success)' : 'var(--accent)',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-quaternary)', marginTop: 4 }}>
                      {ms.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Activity */}
            <div
              className="rounded-xl border p-5"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
            >
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                Team Load
              </h3>
              <div className="space-y-3">
                {team.map((member) => {
                  const memberTasks = tasks.filter(t => t.owner === member.id && t.status !== 'done')
                  return (
                    <div key={member.id} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: member.gradient,
                          fontSize: '9px', fontWeight: 600, color: 'white',
                        }}
                      >
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {member.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {memberTasks.length}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>
                          active
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
