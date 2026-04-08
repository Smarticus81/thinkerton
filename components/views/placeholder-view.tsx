'use client'

import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'

type PlaceholderViewProps = {
  title: string
  subtitle: string
}

export function PlaceholderView({ title, subtitle }: PlaceholderViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col items-center justify-center"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-muted)' }}
      >
        <Construction size={24} style={{ color: 'var(--text-quaternary)' }} />
      </div>
      <div style={{
        fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)',
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '14px', color: 'var(--text-quaternary)', marginTop: 6,
      }}>
        {subtitle}
      </div>
    </motion.div>
  )
}
