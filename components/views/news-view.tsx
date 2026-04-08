'use client'

import { motion } from 'framer-motion'
import { Sparkles, ExternalLink } from 'lucide-react'
import { newsItems } from '@/lib/store'

export function NewsView() {
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
          ATLAS-curated regulatory and market intelligence
        </p>

        {/* Featured articles */}
        {newsItems.filter((n) => n.featured).map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="mb-4 rounded-xl border overflow-hidden cursor-pointer transition-shadow"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{ fontSize: '11px', fontWeight: 600, background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  Featured
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                  {item.source} &middot; {item.timeAgo}
                </span>
              </div>
              <h2 style={{
                fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35,
              }}>
                {item.title}
              </h2>
              <p style={{
                fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: 1.6, marginTop: 8,
              }}>
                {item.summary}
              </p>
              {item.atlasNote && (
                <div
                  className="mt-4 px-4 py-3 rounded-lg border"
                  style={{
                    background: 'var(--accent-light)',
                    borderColor: 'var(--accent)',
                    borderLeftWidth: 3,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}>
                      ATLAS ANALYSIS
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.atlasNote}
                  </p>
                </div>
              )}
              <div className="flex gap-1.5 mt-4">
                {item.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md" style={{
                    fontSize: '11px', fontWeight: 500,
                    background: 'var(--bg-badge)', color: 'var(--text-tertiary)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Section divider */}
        <div className="flex items-center gap-3 my-6">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}>
            Recent
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
        </div>

        {/* Regular items */}
        <div className="space-y-3">
          {newsItems.filter((n) => !n.featured).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 + idx * 0.03 }}
              className="rounded-xl border p-5 cursor-pointer transition-shadow"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                      {item.source} &middot; {item.timeAgo}
                    </span>
                    {item.relevance === 'high' && (
                      <span
                        className="px-1.5 py-0.5 rounded-md"
                        style={{ fontSize: '10px', fontWeight: 600, background: 'var(--warning-light)', color: 'var(--warning)' }}
                      >
                        High Relevance
                      </span>
                    )}
                  </div>
                  <h3 style={{
                    fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5, marginTop: 4,
                  }}>
                    {item.summary}
                  </p>
                  <div className="flex gap-1.5 mt-3">
                    {item.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md" style={{
                        fontSize: '11px', fontWeight: 500,
                        background: 'var(--bg-badge)', color: 'var(--text-tertiary)',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ExternalLink size={14} style={{ color: 'var(--text-ghost)', flexShrink: 0, marginTop: 4 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
