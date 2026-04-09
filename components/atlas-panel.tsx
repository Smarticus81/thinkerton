'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Sparkles } from 'lucide-react'
import {
  team,
  type ChatMessage,
  type TeamMember,
  type Task,
  type Milestone,
  type BrainstormSession,
  type ProcessMap,
  type NewsItem,
} from '@/lib/store'

type ToolCall = {
  tool: string
  input: Record<string, unknown>
}

type TaskActions = {
  onCreate: (task: Task) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

type BrainstormActions = {
  onCreateSession: (title: string) => void
  onAddIdea: (sessionId: string, text: string) => void
}

type IntelligenceActions = {
  onAdd: (item: NewsItem) => void
  onRemove: (id: string) => void
  onClear: () => void
}

type AtlasPanelProps = {
  isOpen: boolean
  messages: ChatMessage[]
  onSendMessage: (msg: ChatMessage) => void
  currentUser: TeamMember
  isStreaming: boolean
  setIsStreaming: (v: boolean) => void
  tasks: Task[]
  milestones: Milestone[]
  sessions: BrainstormSession[]
  processMaps: ProcessMap[]
  newsItems: NewsItem[]
  taskActions: TaskActions
  brainstormActions: BrainstormActions
  intelligenceActions: IntelligenceActions
}

const quickPrompts = [
  "Find us 5 potential customers",
  "What's slipping? Hold us accountable",
  "Research our top competitor",
  "Draft a weekly investor update",
]

export function AtlasPanel({ isOpen, messages, onSendMessage, currentUser, isStreaming, setIsStreaming, tasks, milestones, sessions, processMaps, newsItems, taskActions, brainstormActions, intelligenceActions }: AtlasPanelProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const buildContext = useCallback(() => {
    const taskSummary = tasks.map(t => {
      const owner = team.find(m => m.id === t.owner)
      return `- [${t.status.toUpperCase()}] (${t.id}) ${t.title} (${t.priority} priority, assigned to ${owner?.name || 'unassigned'}, due ${t.dueDate})`
    }).join('\n')

    const milestoneSummary = milestones.map(m => {
      return `- (${m.id}) ${m.title}: ${m.progress}% complete, target ${m.date} — ${m.description}`
    }).join('\n')

    const newsSummary = newsItems.map(n => {
      return `- [${n.category.toUpperCase()}] (${n.id}) "${n.title}" — ${n.summary} (Source: ${n.source}, ${n.timeAgo}, relevance: ${n.relevance})${n.atlasNote ? `\n  ATLAS Note: ${n.atlasNote}` : ''}`
    }).join('\n')

    const sessionsSummary = sessions.map(s => {
      const ideaCount = s.ideas.length
      const ideasText = s.ideas.length > 0
        ? s.ideas.map(i => `    - "${i.text}" (by ${i.author}, ${i.votes} votes)`).join('\n')
        : '    (no ideas yet)'
      return `- (${s.id}) "${s.title}" [${s.status}] — ${ideaCount} ideas\n${ideasText}`
    }).join('\n')

    const processMapSummary = processMaps.map(pm => {
      const nodesText = pm.nodes.map(n => `    - [${n.type}] ${n.label}: ${n.description}`).join('\n')
      return `- (${pm.id}) "${pm.title}" — ${pm.description}\n${nodesText}`
    }).join('\n')

    return `## Current Tasks (${tasks.length} total)
${taskSummary || 'No tasks created yet.'}

## Milestones (${milestones.length} total)
${milestoneSummary}

## Intelligence Feed — News & Articles (${newsItems.length} articles)
${newsSummary}

## Brainstorm Sessions (${sessions.length} total)
${sessionsSummary || 'No brainstorm sessions yet.'}

## Process Maps / Workflows (${processMaps.length} total)
${processMapSummary || 'No process maps yet.'}

## Team
${team.map(m => `- **${m.name}** (${m.id}) — ${m.role}`).join('\n')}

## Current User
${currentUser.name} (${currentUser.role})`
  }, [tasks, milestones, sessions, processMaps, currentUser])

  const buildApiMessages = useCallback((newUserText: string) => {
    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = []

    for (const msg of messages) {
      if (msg.sender === 'atlas') {
        apiMessages.push({ role: 'assistant', content: msg.text })
      } else {
        const member = team.find(m => m.id === msg.sender)
        apiMessages.push({ role: 'user', content: `[${member?.name || 'User'}]: ${msg.text}` })
      }
    }

    apiMessages.push({ role: 'user', content: `[${currentUser.name}]: ${newUserText}` })

    return apiMessages
  }, [messages, currentUser])

  const executeToolCalls = useCallback((toolCalls: ToolCall[]) => {
    for (const call of toolCalls) {
      switch (call.tool) {
        case 'create_task': {
          const inp = call.input as {
            title: string
            description: string
            owner: string
            priority: string
            dueDate: string
            tags: string[]
            milestoneId?: string
          }
          const task: Task = {
            id: `t${Date.now()}`,
            title: inp.title,
            description: inp.description,
            owner: inp.owner,
            status: 'todo',
            priority: inp.priority as Task['priority'],
            dueDate: inp.dueDate,
            tags: inp.tags,
            deliverable: '',
            verified: false,
            milestoneId: inp.milestoneId,
          }
          taskActions.onCreate(task)
          break
        }
        case 'update_task': {
          const inp = call.input as { id: string; updates: Partial<Task> }
          taskActions.onUpdate(inp.id, inp.updates)
          break
        }
        case 'delete_task': {
          const inp = call.input as { id: string }
          taskActions.onDelete(inp.id)
          break
        }
        case 'clear_all_tasks': {
          taskActions.onClearAll()
          break
        }
        case 'create_brainstorm_session': {
          const inp = call.input as { title: string }
          brainstormActions.onCreateSession(inp.title)
          break
        }
        case 'add_brainstorm_idea': {
          const inp = call.input as { sessionId: string; text: string }
          brainstormActions.onAddIdea(inp.sessionId, inp.text)
          break
        }
        case 'add_intelligence': {
          const inp = call.input as {
            title: string; summary: string; source: string;
            category: string; tags: string[]; relevance: string;
            atlasNote?: string; featured?: boolean
          }
          intelligenceActions.onAdd({
            id: `n${Date.now()}`,
            title: inp.title,
            summary: inp.summary,
            source: inp.source,
            timeAgo: 'Just now',
            category: inp.category as NewsItem['category'],
            tags: inp.tags,
            relevance: inp.relevance as NewsItem['relevance'],
            atlasNote: inp.atlasNote,
            featured: inp.featured,
          })
          break
        }
        case 'remove_intelligence': {
          const inp = call.input as { id: string }
          intelligenceActions.onRemove(inp.id)
          break
        }
        case 'clear_intelligence': {
          intelligenceActions.onClear()
          break
        }
      }
    }
  }, [taskActions, brainstormActions, intelligenceActions])

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || isStreaming) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser.id,
      text: msg,
      timestamp: Date.now(),
    }
    onSendMessage(userMsg)
    setInput('')
    setIsStreaming(true)

    const atlasId = `msg-${Date.now() + 1}`

    try {
      abortRef.current = new AbortController()

      const response = await fetch('/api/atlas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: buildApiMessages(msg),
          context: buildContext(),
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        onSendMessage({
          id: atlasId,
          sender: 'atlas',
          text: errorData.error || 'Something went wrong. Please try again.',
          timestamp: Date.now(),
        })
        setIsStreaming(false)
        return
      }

      const data = await response.json()

      // Execute any tool calls against Convex
      if (data.toolCalls && data.toolCalls.length > 0) {
        executeToolCalls(data.toolCalls)
      }

      // Show the text response
      onSendMessage({
        id: atlasId,
        sender: 'atlas',
        text: data.text || 'Done.',
        timestamp: Date.now(),
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
      } else {
        onSendMessage({
          id: atlasId,
          sender: 'atlas',
          text: 'I couldn\'t connect right now. Make sure the API key is set in `.env.local` and the dev server is running.',
          timestamp: Date.now(),
        })
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getMember = (id: string) => team.find((m) => m.id === id)

  const formatMessage = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2)
        return <strong key={i} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inner}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex flex-col flex-shrink-0 overflow-hidden relative z-20 border-l"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 h-14 border-b flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-light)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex-1">
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                ATLAS
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>
                AI Co-Founder
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--accent-light)' }}
                >
                  <Sparkles size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  ATLAS — Your AI Co-Founder
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  I drive results. I source customers, research competitors, send emails, manage tasks, and hold the team accountable. Let's build a unicorn.
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isAtlas = msg.sender === 'atlas'
              const member = !isAtlas ? getMember(msg.sender) : null

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={isAtlas ? '' : 'flex flex-col items-end'}
                >
                  {!isAtlas && member && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: member.gradient,
                          fontSize: '8px',
                          fontWeight: 600,
                          color: 'white',
                        }}
                      >
                        {member.initials}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                        {member.name}
                      </span>
                    </div>
                  )}
                  {isAtlas && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>
                        ATLAS
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      background: isAtlas ? 'var(--bg-atlas-msg)' : 'var(--bg-muted)',
                      borderRadius: isAtlas ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                      padding: '12px 16px',
                      maxWidth: '95%',
                      fontSize: '13px',
                      lineHeight: '1.65',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-line',
                      border: isAtlas ? '1px solid var(--border-default)' : 'none',
                    }}
                  >
                    {isAtlas ? formatMessage(msg.text) : msg.text}
                  </div>
                </motion.div>
              )
            })}

            {isStreaming && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 py-2">
                <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>Thinking...</span>
              </motion.div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isStreaming}
                className="px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface)'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ATLAS anything..."
                rows={1}
                disabled={isStreaming}
                className="w-full resize-none border rounded-lg disabled:opacity-60"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-default)',
                  padding: '10px 40px 10px 14px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  minHeight: 42,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isStreaming || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-40"
                style={{
                  background: input.trim() && !isStreaming ? 'var(--accent)' : 'var(--bg-muted)',
                  color: input.trim() && !isStreaming ? 'white' : 'var(--text-quaternary)',
                }}
              >
                <ArrowUp size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
