'use client'

import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { anyApi } from 'convex/server'
import { LeftRail, type ViewId } from '@/components/left-rail'
import { AtlasPanel } from '@/components/atlas-panel'
import { DashboardView } from '@/components/views/dashboard-view'
import { TasksView } from '@/components/views/tasks-view'
import { MilestonesView } from '@/components/views/milestones-view'
import { WorkflowView } from '@/components/views/workflow-view'
import { BrainstormView } from '@/components/views/brainstorm-view'
import { NewsView } from '@/components/views/news-view'
import { TeamView } from '@/components/views/team-view'
import { PlaceholderView } from '@/components/views/placeholder-view'
import { MobileNav } from '@/components/mobile-nav'
import {
  team,
  milestones,
  initialSessions,
  initialMessages,
  initialProcessMaps,
  type Task,
  type TeamMember,
  type ChatMessage,
  type BrainstormSession,
  type ProcessMap,
} from '@/lib/store'

export default function ThinkPage() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard')
  const [atlasOpen, setAtlasOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState<TeamMember>(team[0])
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [sessions, setSessions] = useState<BrainstormSession[]>(initialSessions)
  const [processMaps, setProcessMaps] = useState<ProcessMap[]>(initialProcessMaps)
  const [isStreaming, setIsStreaming] = useState(false)

  const tasks = (useQuery(anyApi.tasks.list, {}) as Task[] | undefined) ?? []
  const createTask = useMutation(anyApi.tasks.create)
  const updateTask = useMutation(anyApi.tasks.update)
  const removeTask = useMutation(anyApi.tasks.remove)
  const clearAllTasks = useMutation(anyApi.tasks.clearAll)

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    void updateTask({ id, updates })
  }, [updateTask])

  const handleCreateTask = useCallback((task: Task) => {
    void createTask({ task })
  }, [createTask])

  const handleDeleteTask = useCallback((id: string) => {
    void removeTask({ id })
  }, [removeTask])

  const handleClearAllTasks = useCallback(() => {
    void clearAllTasks({})
  }, [clearAllTasks])

  const taskActions = useMemo(() => ({
    onCreate: handleCreateTask,
    onUpdate: handleUpdateTask,
    onDelete: handleDeleteTask,
    onClearAll: handleClearAllTasks,
  }), [handleCreateTask, handleUpdateTask, handleDeleteTask, handleClearAllTasks])

  // For streaming: update existing message or add new one
  const handleSendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const existingIdx = prev.findIndex(m => m.id === msg.id)
      if (existingIdx >= 0) {
        // Update existing message (streaming update)
        const updated = [...prev]
        updated[existingIdx] = msg
        return updated
      }
      return [...prev, msg]
    })
  }, [])

  const handleUpdateSessions = useCallback((updater: BrainstormSession[] | ((prev: BrainstormSession[]) => BrainstormSession[])) => {
    if (typeof updater === 'function') {
      setSessions(updater)
    } else {
      setSessions(updater)
    }
  }, [])

  const handleUpdateProcessMaps = useCallback((updater: ProcessMap[] | ((prev: ProcessMap[]) => ProcessMap[])) => {
    if (typeof updater === 'function') {
      setProcessMaps(updater)
    } else {
      setProcessMaps(updater)
    }
  }, [])

  const viewLabels: Record<ViewId, string> = {
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    milestones: 'Milestones',
    workflows: 'Process Design',
    brainstorm: 'Brainstorm',
    news: 'Intelligence',
    team: 'Team',
    'vc-pipeline': 'VC Pipeline',
    artifacts: 'Artifacts',
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView key="dashboard" tasks={tasks} onExpandTask={() => {}} />
      case 'tasks':
        return <TasksView key="tasks" tasks={tasks} onUpdateTask={handleUpdateTask} onCreateTask={handleCreateTask} onDeleteTask={handleDeleteTask} currentUserId={currentUser.id} />
      case 'milestones':
        return <MilestonesView key="milestones" tasks={tasks} />
      case 'workflows':
        return <WorkflowView key="workflows" processMaps={processMaps} onUpdateProcessMaps={handleUpdateProcessMaps} />
      case 'brainstorm':
        return <BrainstormView key="brainstorm" sessions={sessions} onUpdateSessions={handleUpdateSessions} />
      case 'news':
        return <NewsView key="news" />
      case 'team':
        return <TeamView key="team" tasks={tasks} />
      case 'vc-pipeline':
        return <PlaceholderView key="vc" title="VC Pipeline" subtitle="Investor tracking coming soon" />
      case 'artifacts':
        return <PlaceholderView key="artifacts" title="Artifacts" subtitle="Document store coming soon" />
      default:
        return <DashboardView key="dashboard" tasks={tasks} onExpandTask={() => {}} />
    }
  }

  return (
    <div className="h-dvh flex flex-col md:flex-row overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <LeftRail
        activeView={activeView}
        onViewChange={setActiveView}
        onAtlasToggle={() => setAtlasOpen(!atlasOpen)}
        atlasOpen={atlasOpen}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-8 h-14 border-b flex-shrink-0"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {viewLabels[activeView]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1 rounded-md"
              style={{ background: 'var(--bg-muted)', fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)' }}
            >
              Day 1
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </div>
      </main>

      <AtlasPanel
        isOpen={atlasOpen}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
        isStreaming={isStreaming}
        setIsStreaming={setIsStreaming}
        tasks={tasks}
        milestones={milestones}
        taskActions={taskActions}
      />

      <MobileNav
        activeView={activeView}
        onViewChange={setActiveView}
        onAtlasToggle={() => setAtlasOpen(!atlasOpen)}
      />

      {atlasOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg-app)' }}>
          <button
            onClick={() => setAtlasOpen(false)}
            className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-surface-active)', color: 'var(--text-tertiary)', fontSize: '14px' }}
          >
            {'×'}
          </button>
          <div className="flex-1 flex flex-col">
            <AtlasPanel
              isOpen={true}
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUser={currentUser}
              isStreaming={isStreaming}
              setIsStreaming={setIsStreaming}
              tasks={tasks}
              milestones={milestones}
              taskActions={taskActions}
            />
          </div>
        </div>
      )}
    </div>
  )
}
