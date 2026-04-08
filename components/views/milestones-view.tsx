'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react'
import { type Task, milestones, team } from '@/lib/store'

type MilestonesViewProps = {
  tasks: Task[]
}

export function MilestonesView({ tasks }: MilestonesViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(milestones[0].id)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-[900px] mx-auto px-8 py-6">
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: 24 }}>
          Key objectives on the critical path to $1B
        </p>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{ left: 15, background: 'var(--border-default)' }}
          />

          {milestones.map((ms, idx) => {
            const isExpanded = expandedId === ms.id
            const isComplete = ms.progress === 100
            const isCurrent = ms.progress > 0 && ms.progress < 100
            const relatedTasks = tasks.filter((t) => t.milestoneId === ms.id)

            return (
              <motion.div
                key={ms.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="relative pl-10 pb-6"
              >
                {/* Node */}
                <div className="absolute left-0 top-3" style={{ width: 30, display: 'flex', justifyContent: 'center' }}>
                  {isComplete ? (
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  ) : isCurrent ? (
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: 'var(--accent)' }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                    </div>
                  ) : (
                    <div
                      className="w-3 h-3 rounded-full border-2"
                      style={{ borderColor: 'var(--text-ghost)', background: 'var(--bg-app)' }}
                    />
                  )}
                </div>

                {/* Card */}
                <div
                  className="rounded-xl border cursor-pointer overflow-hidden transition-shadow"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: isCurrent ? 'var(--accent)' : 'var(--border-default)',
                    boxShadow: isCurrent ? '0 0 0 1px var(--accent), var(--shadow-sm)' : 'var(--shadow-sm)',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : ms.id)}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-quaternary)' }}>
                          {ms.date}
                        </span>
                        <h3 style={{
                          fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2,
                        }}>
                          {ms.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{
                          fontSize: '14px', fontWeight: 700,
                          color: isComplete ? 'var(--success)' : 'var(--text-primary)',
                        }}>
                          {ms.progress}%
                        </span>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
                          <ChevronDown size={16} style={{ color: 'var(--text-quaternary)' }} />
                        </motion.div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: isComplete ? 'var(--success)' : 'var(--accent)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${ms.progress}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                              {ms.description}
                            </p>

                            {relatedTasks.length > 0 && (
                              <div className="mt-4">
                                <div style={{
                                  fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)',
                                  marginBottom: 8, letterSpacing: '0.02em',
                                }}>
                                  Related Tasks
                                </div>
                                <div className="space-y-1">
                                  {relatedTasks.map((task) => {
                                    const owner = team.find((m) => m.id === task.owner)
                                    const statusIcn = task.status === 'done'
                                      ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                                      : task.status === 'progress'
                                      ? <Clock size={14} style={{ color: 'var(--accent)' }} />
                                      : task.status === 'blocked'
                                      ? <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                                      : <Circle size={14} style={{ color: 'var(--text-ghost)' }} />

                                    return (
                                      <div
                                        key={task.id}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
                                        style={{ background: 'var(--bg-muted)' }}
                                      >
                                        {statusIcn}
                                        {owner && (
                                          <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{
                                              background: owner.gradient,
                                              fontSize: '8px', fontWeight: 600, color: 'white',
                                            }}
                                          >
                                            {owner.initials}
                                          </div>
                                        )}
                                        <span className="flex-1 truncate" style={{
                                          fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
                                        }}>
                                          {task.title}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Stakeholder avatars */}
                            <div className="flex items-center gap-2 mt-4">
                              <div className="flex -space-x-1.5">
                                {ms.stakeholders.map((stakeholderId) => {
                                  const member = team.find((m) => m.id === stakeholderId)
                                  if (!member) return null
                                  return (
                                    <div
                                      key={stakeholderId}
                                      className="w-6 h-6 rounded-full flex items-center justify-center"
                                      style={{
                                        background: member.gradient,
                                        border: '2px solid var(--bg-surface)',
                                        fontSize: '8px', fontWeight: 600, color: 'white',
                                      }}
                                    >
                                      {member.initials}
                                    </div>
                                  )
                                })}
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                                {ms.stakeholders.length} stakeholders
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
