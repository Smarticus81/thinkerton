'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react'
import { type Task, team } from '@/lib/store'

type TeamViewProps = {
  tasks: Task[]
}

export function TeamView({ tasks }: TeamViewProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-[1000px] mx-auto px-8 py-6">
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: 24 }}>
          {team.length} founding members
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((member, idx) => {
            const memberTasks = tasks.filter((t) => t.owner === member.id)
            const doneTasks = memberTasks.filter((t) => t.status === 'done').length
            const activeTasks = memberTasks.filter((t) => t.status === 'progress').length
            const blockedTasks = memberTasks.filter((t) => t.status === 'blocked').length
            const isExpanded = expandedMember === member.id

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="rounded-xl border overflow-hidden cursor-pointer transition-shadow"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                <div className="p-5">
                  {/* Avatar & name */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: member.gradient,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'white',
                      }}
                    >
                      {member.initials}
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                        {member.role}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>Online</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {[
                      { label: 'Active', value: activeTasks, color: 'var(--accent)' },
                      { label: 'Done', value: doneTasks, color: 'var(--success)' },
                      { label: 'Blocked', value: blockedTasks, color: 'var(--danger)' },
                      { label: 'Total', value: memberTasks.length, color: 'var(--text-primary)' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center py-2 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color, letterSpacing: '-0.02em' }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-quaternary)', marginTop: 1 }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Task list */}
                  <AnimatePresence>
                    {isExpanded && memberTasks.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 space-y-1" style={{ borderTop: '1px solid var(--border-default)' }}>
                          {memberTasks.map((task) => {
                            const icon = task.status === 'done'
                              ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                              : task.status === 'progress'
                              ? <Clock size={14} style={{ color: 'var(--accent)' }} />
                              : task.status === 'blocked'
                              ? <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                              : <Circle size={14} style={{ color: 'var(--text-ghost)' }} />

                            return (
                              <div key={task.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
                                {icon}
                                <span className="truncate flex-1" style={{
                                  fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
                                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                  opacity: task.status === 'done' ? 0.6 : 1,
                                }}>
                                  {task.title}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>
                                  {task.dueDate}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
