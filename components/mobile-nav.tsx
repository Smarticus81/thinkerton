'use client'

import { LayoutDashboard, ListTodo, Lightbulb, Newspaper, Users, Sparkles } from 'lucide-react'
import type { ViewId } from './left-rail'

type MobileNavProps = {
  activeView: ViewId
  onViewChange: (v: ViewId) => void
  onAtlasToggle: () => void
}

const items: { id: ViewId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'tasks', icon: ListTodo, label: 'Tasks' },
  { id: 'brainstorm', icon: Lightbulb, label: 'Ideas' },
  { id: 'news', icon: Newspaper, label: 'News' },
  { id: 'team', icon: Users, label: 'Team' },
]

export function MobileNav({ activeView, onViewChange, onAtlasToggle }: MobileNavProps) {
  return (
    <nav
      className="md:hidden flex items-center justify-around flex-shrink-0 relative z-30"
      style={{
        height: 64,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map((item) => {
        const isActive = activeView === item.id
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="flex flex-col items-center gap-1 py-2 px-3"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-quaternary)' }}
          >
            <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
          </button>
        )
      })}

      <button
        onClick={onAtlasToggle}
        className="absolute -top-6 right-4 w-12 h-12 rounded-full flex items-center justify-center border"
        style={{
          background: 'var(--accent)',
          borderColor: 'var(--bg-surface)',
          borderWidth: 3,
          boxShadow: 'var(--shadow-lg)',
          color: 'white',
        }}
      >
        <Sparkles size={20} />
      </button>
    </nav>
  )
}
