'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowUp, Sparkles } from 'lucide-react'
import { type BrainstormSession, type BrainstormIdea, team } from '@/lib/store'

type BrainstormViewProps = {
  sessions: BrainstormSession[]
  onUpdateSessions: (updater: (prev: BrainstormSession[]) => BrainstormSession[]) => void
}

export function BrainstormView({ sessions, onUpdateSessions }: BrainstormViewProps) {
  const [activeSession, setActiveSession] = useState<string>(sessions[0]?.id || '')
  const [newIdeaText, setNewIdeaText] = useState('')
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState('')

  const currentSession = sessions.find((s) => s.id === activeSession)

  const handleVote = useCallback((sessionId: string, ideaId: string) => {
    onUpdateSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s
        return {
          ...s,
          ideas: s.ideas.map((idea) =>
            idea.id === ideaId ? { ...idea, votes: idea.votes + 1 } : idea
          ),
        }
      })
    )
  }, [onUpdateSessions])

  const handleAddIdea = useCallback(() => {
    if (!newIdeaText.trim() || !activeSession) return
    const newIdea: BrainstormIdea = {
      id: `idea-${Date.now()}`,
      text: newIdeaText.trim(),
      author: team[0].id,
      votes: 0,
      timestamp: Date.now(),
    }
    onUpdateSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession) return s
        return { ...s, ideas: [...s.ideas, newIdea] }
      })
    )
    setNewIdeaText('')
  }, [newIdeaText, activeSession, onUpdateSessions])

  const handleNewSession = useCallback(() => {
    if (!newSessionTitle.trim()) return
    const newSession: BrainstormSession = {
      id: `session-${Date.now()}`,
      title: newSessionTitle.trim(),
      ideas: [],
      status: 'active',
      createdAt: Date.now(),
    }
    onUpdateSessions((prev) => [...prev, newSession])
    setActiveSession(newSession.id)
    setNewSessionTitle('')
    setShowNewSession(false)
  }, [newSessionTitle, onUpdateSessions])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col"
    >
      <div className="px-8 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Collaborative ideation space
          </p>
          <button
            onClick={() => setShowNewSession(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
          >
            <Plus size={14} /> New Session
          </button>
        </div>
      </div>

      {/* Session tabs */}
      <div className="px-8 pb-4 flex gap-2 flex-shrink-0 overflow-x-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            className="px-4 py-2 rounded-lg border flex items-center gap-2 transition-all flex-shrink-0"
            style={{
              background: activeSession === session.id ? 'var(--accent-light)' : 'var(--bg-surface)',
              borderColor: activeSession === session.id ? 'var(--accent)' : 'var(--border-default)',
              color: activeSession === session.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: activeSession === session.id ? 600 : 400,
            }}
          >
            {session.title}
            <span
              className="px-1.5 py-0.5 rounded-md"
              style={{
                fontSize: '11px', fontWeight: 600,
                background: activeSession === session.id ? 'var(--accent)' : 'var(--bg-badge)',
                color: activeSession === session.id ? 'white' : 'var(--text-quaternary)',
              }}
            >
              {session.ideas.length}
            </span>
          </button>
        ))}
      </div>

      {/* New session input */}
      <AnimatePresence>
        {showNewSession && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-8 pb-4 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNewSession() }}
                placeholder="Session title..."
                autoFocus
                className="flex-1 border rounded-lg"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-default)',
                  padding: '8px 14px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleNewSession}
                className="px-4 py-2 rounded-lg"
                style={{ background: 'var(--accent)', color: 'white', fontSize: '13px', fontWeight: 600 }}
              >
                Create
              </button>
              <button
                onClick={() => setShowNewSession(false)}
                className="px-3 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ideas grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {currentSession && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentSession.ideas
              .sort((a, b) => b.votes - a.votes)
              .map((idea, idx) => {
                const author = team.find((m) => m.id === idea.author)

                return (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    layout
                    className="rounded-xl border p-5"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: idea.isAtlas ? 'var(--accent)' : 'var(--border-default)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {idea.isAtlas && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>
                          ATLAS Suggestion
                        </span>
                      </div>
                    )}
                    <p style={{
                      fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)',
                    }}>
                      {idea.text}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                      <div className="flex items-center gap-2">
                        {author && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              background: author.gradient,
                              fontSize: '9px', fontWeight: 600, color: 'white',
                            }}
                          >
                            {author.initials}
                          </div>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                          {author?.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleVote(currentSession.id, idea.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors"
                        style={{
                          background: idea.votes > 0 ? 'var(--accent-light)' : 'var(--bg-surface)',
                          borderColor: idea.votes > 0 ? 'var(--accent)' : 'var(--border-default)',
                          color: idea.votes > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <ArrowUp size={12} />
                        <span className={idea.votes > 0 ? 'spring-pop' : ''}>{idea.votes}</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}

            {/* Add idea card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border-2 border-dashed flex flex-col"
              style={{ borderColor: 'var(--border-default)', minHeight: 140 }}
            >
              <textarea
                value={newIdeaText}
                onChange={(e) => setNewIdeaText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddIdea() }
                }}
                placeholder="Drop an idea..."
                className="flex-1 w-full resize-none p-5 rounded-t-xl"
                style={{
                  background: 'transparent',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  minHeight: 80,
                  border: 'none',
                  outline: 'none',
                }}
              />
              <div className="px-4 pb-3 flex justify-end">
                <button
                  onClick={handleAddIdea}
                  className="px-3.5 py-1.5 rounded-lg transition-opacity"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                    opacity: newIdeaText.trim() ? 1 : 0.4,
                  }}
                >
                  Add Idea
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
