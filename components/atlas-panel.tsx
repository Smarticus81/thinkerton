'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Sparkles } from 'lucide-react'
import { team, type ChatMessage, type TeamMember, type Task, type Milestone } from '@/lib/store'

type AtlasPanelProps = {
  isOpen: boolean
  messages: ChatMessage[]
  onSendMessage: (msg: ChatMessage) => void
  currentUser: TeamMember
  isStreaming: boolean
  setIsStreaming: (v: boolean) => void
  tasks: Task[]
  milestones: Milestone[]
}

const quickPrompts = [
  "What should we focus on this week?",
  "Help me break down a task",
  "What are our biggest risks?",
  "Suggest next steps",
]

export function AtlasPanel({ isOpen, messages, onSendMessage, currentUser, isStreaming, setIsStreaming, tasks, milestones }: AtlasPanelProps) {
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
      return `- [${t.status.toUpperCase()}] ${t.title} (${t.priority} priority, assigned to ${owner?.name || 'unassigned'}, due ${t.dueDate})`
    }).join('\n')

    const milestoneSummary = milestones.map(m => {
      return `- ${m.title}: ${m.progress}% complete, target ${m.date}`
    }).join('\n')

    return `## Current Tasks (${tasks.length} total)
${taskSummary || 'No tasks created yet.'}

## Milestones
${milestoneSummary}

## Current User
${currentUser.name} (${currentUser.role})`
  }, [tasks, milestones, currentUser])

  const buildApiMessages = useCallback((newUserText: string) => {
    // Convert chat history to API format
    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = []

    for (const msg of messages) {
      if (msg.sender === 'atlas') {
        apiMessages.push({ role: 'assistant', content: msg.text })
      } else {
        const member = team.find(m => m.id === msg.sender)
        apiMessages.push({ role: 'user', content: `[${member?.name || 'User'}]: ${msg.text}` })
      }
    }

    // Add the new message
    apiMessages.push({ role: 'user', content: `[${currentUser.name}]: ${newUserText}` })

    return apiMessages
  }, [messages, currentUser])

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || isStreaming) return

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser.id,
      text: msg,
      timestamp: Date.now(),
    }
    onSendMessage(userMsg)
    setInput('')
    setIsStreaming(true)

    // Create placeholder for streaming response
    const atlasId = `msg-${Date.now() + 1}`
    let fullText = ''

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
        fullText = errorData.error || 'Something went wrong. Please try again.'
        onSendMessage({
          id: atlasId,
          sender: 'atlas',
          text: fullText,
          timestamp: Date.now(),
        })
        setIsStreaming(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()

      // Add initial empty atlas message
      onSendMessage({
        id: atlasId,
        sender: 'atlas',
        text: '',
        timestamp: Date.now(),
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullText += parsed.text
                // Update the message in place by dispatching a special update
                onSendMessage({
                  id: atlasId,
                  sender: 'atlas',
                  text: fullText,
                  timestamp: Date.now(),
                })
              }
              if (parsed.error) {
                fullText = parsed.error
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
      } else {
        if (!fullText) {
          fullText = 'I couldn\'t connect right now. Make sure the API key is set in `.env.local` and the dev server is running.'
          onSendMessage({
            id: atlasId,
            sender: 'atlas',
            text: fullText,
            timestamp: Date.now(),
          })
        }
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
    // Handle **bold** and basic formatting
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
                AI Assistant
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
                  Hey, I'm ATLAS
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  Your AI project assistant. Ask me anything about strategy, tasks, regulatory questions, or what to prioritize next.
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
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
