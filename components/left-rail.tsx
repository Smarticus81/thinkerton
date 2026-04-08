'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ListTodo, Milestone, Workflow,
  Lightbulb, Newspaper, Users, TrendingUp,
  FileBox, Sun, Moon, Sparkles, ChevronDown,
  PanelRightOpen, PanelRightClose
} from 'lucide-react'
import { team } from '@/lib/store'
import type { TeamMember } from '@/lib/store'

export type ViewId = 'dashboard' | 'tasks' | 'milestones' | 'workflows' | 'brainstorm' | 'news' | 'team' | 'vc-pipeline' | 'artifacts'

type LeftRailProps = {
  activeView: ViewId
  onViewChange: (v: ViewId) => void
  onAtlasToggle: () => void
  atlasOpen: boolean
  currentUser: TeamMember
  onUserChange: (u: TeamMember) => void
}

const mainNav: { id: ViewId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'tasks', icon: ListTodo, label: 'Tasks' },
  { id: 'milestones', icon: Milestone, label: 'Milestones' },
  { id: 'workflows', icon: Workflow, label: 'Process Design' },
  { id: 'brainstorm', icon: Lightbulb, label: 'Brainstorm' },
  { id: 'news', icon: Newspaper, label: 'Intelligence' },
]

const secondaryNav: { id: ViewId; icon: typeof Users; label: string }[] = [
  { id: 'team', icon: Users, label: 'Team' },
  { id: 'vc-pipeline', icon: TrendingUp, label: 'VC Pipeline' },
  { id: 'artifacts', icon: FileBox, label: 'Artifacts' },
]

export function LeftRail({ activeView, onViewChange, onAtlasToggle, atlasOpen, currentUser, onUserChange }: LeftRailProps) {
  const [showUserPicker, setShowUserPicker] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="hidden md:flex flex-col flex-shrink-0 relative z-30 border-r"
      style={{
        width: 240,
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent)', color: '#FFFFFF' }}
        >
          <Sparkles size={16} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Thinkerton
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>
            Command Center
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pt-4">
        <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-quaternary)', letterSpacing: '0.04em', padding: '0 8px', marginBottom: 6 }}>
          WORKSPACE
        </div>
        <nav className="space-y-0.5">
          {mainNav.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                style={{
                  background: isActive ? 'var(--bg-surface-active)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: '13.5px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div className="my-4 mx-2 h-px" style={{ background: 'var(--border-default)' }} />

        <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-quaternary)', letterSpacing: '0.04em', padding: '0 8px', marginBottom: 6 }}>
          MANAGE
        </div>
        <nav className="space-y-0.5">
          {secondaryNav.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                style={{
                  background: isActive ? 'var(--bg-surface-active)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: '13.5px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* ATLAS Toggle */}
        <div className="mt-4 mx-2">
          <button
            onClick={onAtlasToggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{
              background: atlasOpen ? 'var(--accent-light)' : 'var(--bg-muted)',
              color: atlasOpen ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (!atlasOpen) e.currentTarget.style.background = 'var(--bg-surface-hover)'
            }}
            onMouseLeave={(e) => {
              if (!atlasOpen) e.currentTarget.style.background = 'var(--bg-muted)'
            }}
          >
            {atlasOpen ? <PanelRightClose size={18} strokeWidth={1.5} /> : <PanelRightOpen size={18} strokeWidth={1.5} />}
            ATLAS AI
            <div
              className="ml-auto w-2 h-2 rounded-full"
              style={{ background: 'var(--success)' }}
            />
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t px-3 py-3" style={{ borderColor: 'var(--border-default)' }}>
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-2 mb-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        {/* User selector */}
        <div className="relative">
          <button
            onClick={() => setShowUserPicker(!showUserPicker)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors"
            style={{ background: showUserPicker ? 'var(--bg-surface-active)' : 'transparent' }}
            onMouseEnter={(e) => {
              if (!showUserPicker) e.currentTarget.style.background = 'var(--bg-surface-hover)'
            }}
            onMouseLeave={(e) => {
              if (!showUserPicker) e.currentTarget.style.background = 'transparent'
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: currentUser.gradient,
                fontSize: '11px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              {currentUser.initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {currentUser.name}
              </div>
              <div className="truncate" style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>
                {currentUser.role}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-quaternary)' }} />
          </button>

          <AnimatePresence>
            {showUserPicker && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-1 p-1.5 rounded-lg border z-50"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {team.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => { onUserChange(member); setShowUserPicker(false) }}
                    className="flex items-center gap-3 w-full px-2.5 py-2 rounded-md transition-colors"
                    style={{
                      background: currentUser.id === member.id ? 'var(--bg-surface-active)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentUser.id !== member.id) e.currentTarget.style.background = 'var(--bg-surface-hover)'
                    }}
                    onMouseLeave={(e) => {
                      if (currentUser.id !== member.id) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: member.gradient,
                        fontSize: '9px',
                        fontWeight: 600,
                        color: 'white',
                      }}
                    >
                      {member.initials}
                    </div>
                    <div className="text-left">
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-quaternary)' }}>
                        {member.role}
                      </div>
                    </div>
                    {currentUser.id === member.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
