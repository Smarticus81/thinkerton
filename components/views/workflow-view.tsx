'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, GripVertical, ArrowRight, Circle, Diamond, Square, Hexagon } from 'lucide-react'
import { type ProcessMap, type ProcessNode } from '@/lib/store'

type WorkflowViewProps = {
  processMaps: ProcessMap[]
  onUpdateProcessMaps: (updater: (prev: ProcessMap[]) => ProcessMap[]) => void
}

const nodeTypes: { id: ProcessNode['type']; label: string; Icon: typeof Circle; defaultColor: string }[] = [
  { id: 'start', label: 'Start', Icon: Circle, defaultColor: 'var(--success)' },
  { id: 'process', label: 'Process', Icon: Square, defaultColor: 'var(--accent)' },
  { id: 'decision', label: 'Decision', Icon: Diamond, defaultColor: 'var(--warning)' },
  { id: 'end', label: 'End', Icon: Hexagon, defaultColor: 'var(--success)' },
]

export function WorkflowView({ processMaps, onUpdateProcessMaps }: WorkflowViewProps) {
  const [activeMapId, setActiveMapId] = useState<string>(processMaps[0]?.id || '')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showNewMap, setShowNewMap] = useState(false)
  const [newMapTitle, setNewMapTitle] = useState('')
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)

  const activeMap = processMaps.find(m => m.id === activeMapId)

  const updateActiveMap = useCallback((updater: (map: ProcessMap) => ProcessMap) => {
    onUpdateProcessMaps(prev => prev.map(m => m.id === activeMapId ? updater(m) : m))
  }, [activeMapId, onUpdateProcessMaps])

  const handleAddNode = useCallback((type: ProcessNode['type']) => {
    const typeConfig = nodeTypes.find(t => t.id === type)!
    const newNode: ProcessNode = {
      id: `pn-${Date.now()}`,
      label: `New ${typeConfig.label}`,
      description: '',
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      type,
      connections: [],
      color: typeConfig.defaultColor,
    }
    updateActiveMap(map => ({
      ...map,
      nodes: [...map.nodes, newNode],
      updatedAt: Date.now(),
    }))
  }, [updateActiveMap])

  const handleDeleteNode = useCallback((nodeId: string) => {
    updateActiveMap(map => ({
      ...map,
      nodes: map.nodes
        .filter(n => n.id !== nodeId)
        .map(n => ({ ...n, connections: n.connections.filter(c => c !== nodeId) })),
      updatedAt: Date.now(),
    }))
    setEditingNode(null)
  }, [updateActiveMap])

  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (connecting) {
      // Complete connection
      if (connecting !== nodeId) {
        updateActiveMap(map => ({
          ...map,
          nodes: map.nodes.map(n =>
            n.id === connecting && !n.connections.includes(nodeId)
              ? { ...n, connections: [...n.connections, nodeId] }
              : n
          ),
          updatedAt: Date.now(),
        }))
      }
      setConnecting(null)
    } else {
      setDragging(nodeId)
    }
    e.stopPropagation()
  }, [connecting, updateActiveMap])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    updateActiveMap(map => ({
      ...map,
      nodes: map.nodes.map(n => n.id === dragging ? { ...n, x, y } : n),
    }))
  }, [dragging, updateActiveMap])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleCreateMap = useCallback(() => {
    if (!newMapTitle.trim()) return
    const newMap: ProcessMap = {
      id: `pm-${Date.now()}`,
      title: newMapTitle.trim(),
      description: '',
      nodes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    onUpdateProcessMaps(prev => [...prev, newMap])
    setActiveMapId(newMap.id)
    setNewMapTitle('')
    setShowNewMap(false)
  }, [newMapTitle, onUpdateProcessMaps])

  const handleDeleteMap = useCallback((mapId: string) => {
    onUpdateProcessMaps(prev => prev.filter(m => m.id !== mapId))
    if (activeMapId === mapId) {
      setActiveMapId(processMaps.find(m => m.id !== mapId)?.id || '')
    }
  }, [activeMapId, processMaps, onUpdateProcessMaps])

  const handleStartEdit = useCallback((node: ProcessNode) => {
    setEditingNode(node.id)
    setEditLabel(node.label)
    setEditDescription(node.description)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingNode) return
    updateActiveMap(map => ({
      ...map,
      nodes: map.nodes.map(n =>
        n.id === editingNode ? { ...n, label: editLabel, description: editDescription } : n
      ),
      updatedAt: Date.now(),
    }))
    setEditingNode(null)
  }, [editingNode, editLabel, editDescription, updateActiveMap])

  const handleRemoveConnection = useCallback((fromId: string, toId: string) => {
    updateActiveMap(map => ({
      ...map,
      nodes: map.nodes.map(n =>
        n.id === fromId ? { ...n, connections: n.connections.filter(c => c !== toId) } : n
      ),
      updatedAt: Date.now(),
    }))
  }, [updateActiveMap])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col"
    >
      {/* Toolbar */}
      <div className="px-6 py-3 flex items-center justify-between flex-shrink-0 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {processMaps.map(map => (
            <div key={map.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setActiveMapId(map.id)}
                className="px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  background: activeMapId === map.id ? 'var(--accent-light)' : 'var(--bg-surface)',
                  borderColor: activeMapId === map.id ? 'var(--accent)' : 'var(--border-default)',
                  color: activeMapId === map.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: activeMapId === map.id ? 600 : 400,
                }}
              >
                {map.title}
              </button>
              {processMaps.length > 1 && activeMapId === map.id && (
                <button
                  onClick={() => { if (confirm('Delete this process map?')) handleDeleteMap(map.id) }}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: 'var(--text-quaternary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-quaternary)'}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowNewMap(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors flex-shrink-0"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)', fontSize: '12px' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={12} /> New
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-4">
          <span style={{ fontSize: '11px', color: 'var(--text-quaternary)', marginRight: 4 }}>Add:</span>
          {nodeTypes.map(nt => (
            <button
              key={nt.id}
              onClick={() => handleAddNode(nt.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-md border transition-colors"
              style={{ borderColor: 'var(--border-default)', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <nt.Icon size={10} /> {nt.label}
            </button>
          ))}
          {connecting && (
            <span className="px-2 py-1 rounded-md text-xs" style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontWeight: 600 }}>
              Click a target node...
              <button onClick={() => setConnecting(null)} className="ml-1" style={{ color: 'var(--warning)' }}>Cancel</button>
            </span>
          )}
        </div>
      </div>

      {/* New map input */}
      <AnimatePresence>
        {showNewMap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-3 overflow-hidden border-b"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className="flex gap-2">
              <input
                value={newMapTitle}
                onChange={(e) => setNewMapTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateMap() }}
                placeholder="Process name..."
                autoFocus
                className="flex-1 border rounded-lg"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 12px', fontSize: '13px', color: 'var(--text-primary)' }}
              />
              <button onClick={handleCreateMap} className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--accent)', color: 'white', fontSize: '13px', fontWeight: 600 }}>Create</button>
              <button onClick={() => setShowNewMap(false)} className="px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)', fontSize: '13px' }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" onClick={() => { setConnecting(null); setEditingNode(null) }}>
        {activeMap && activeMap.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Empty canvas
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-quaternary)' }}>
              Use the toolbar above to add process nodes, then drag to arrange and connect them.
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          <pattern id="grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="var(--text-ghost)" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {activeMap && (
            <>
              {/* Edges */}
              {activeMap.nodes.flatMap(node =>
                node.connections.map(targetId => {
                  const target = activeMap.nodes.find(n => n.id === targetId)
                  if (!target) return null
                  const dx = target.x - node.x
                  const path = `M ${node.x} ${node.y} C ${node.x + dx * 0.5} ${node.y}, ${target.x - dx * 0.5} ${target.y}, ${target.x} ${target.y}`

                  return (
                    <g key={`${node.id}-${targetId}`} className="cursor-pointer" onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Remove this connection?')) handleRemoveConnection(node.id, targetId)
                    }}>
                      <path d={path} fill="none" stroke="var(--border-default)" strokeWidth={2} />
                      <path d={path} fill="none" stroke="transparent" strokeWidth={12} />
                      {/* Arrow indicator */}
                      <circle r={3} fill="var(--accent)" opacity={0.6}>
                        <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
                        <animate attributeName="opacity" values="0;0.6;0.6;0" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )
                })
              ).filter(Boolean)}

              {/* Nodes */}
              {activeMap.nodes.map(node => {
                const isHovered = hoveredNode === node.id
                const typeConfig = nodeTypes.find(t => t.id === node.type)!
                const w = 160
                const h = 60

                return (
                  <g
                    key={node.id}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onMouseDown={(e) => handleMouseDown(node.id, e)}
                    onDoubleClick={(e) => { e.stopPropagation(); handleStartEdit(node) }}
                    style={{ cursor: dragging === node.id ? 'grabbing' : 'grab' }}
                  >
                    <rect
                      x={node.x - w / 2}
                      y={node.y - h / 2}
                      width={w}
                      height={h}
                      rx={node.type === 'decision' ? 4 : 10}
                      fill="var(--bg-surface)"
                      stroke={isHovered ? node.color : 'var(--border-default)'}
                      strokeWidth={isHovered ? 2 : 1}
                      style={{ transition: 'stroke 0.15s ease' }}
                    />
                    {/* Type indicator */}
                    <circle cx={node.x - w / 2 + 16} cy={node.y} r={5} fill={node.color} />
                    <text
                      x={node.x - w / 2 + 28}
                      y={node.y - 6}
                      fill="var(--text-primary)"
                      style={{ fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
                    >
                      {node.label.length > 18 ? node.label.slice(0, 18) + '...' : node.label}
                    </text>
                    <text
                      x={node.x - w / 2 + 28}
                      y={node.y + 10}
                      fill="var(--text-quaternary)"
                      style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 500, textTransform: 'capitalize' }}
                    >
                      {node.type}
                    </text>

                    {/* Connect button (right side) */}
                    {isHovered && (
                      <g
                        onClick={(e) => { e.stopPropagation(); setConnecting(node.id) }}
                        style={{ cursor: 'crosshair' }}
                      >
                        <circle cx={node.x + w / 2} cy={node.y} r={8} fill="var(--accent)" opacity={0.9} />
                        <text x={node.x + w / 2} y={node.y + 4} textAnchor="middle" fill="white" style={{ fontSize: '10px', fontWeight: 700 }}>+</text>
                      </g>
                    )}
                  </g>
                )
              })}
            </>
          )}
        </svg>

        {/* Node edit panel */}
        <AnimatePresence>
          {editingNode && activeMap && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="absolute top-4 right-4 w-72 rounded-xl border p-4 z-30"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Edit Node</span>
                <button onClick={() => setEditingNode(null)} style={{ color: 'var(--text-quaternary)' }}><X size={14} /></button>
              </div>
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Node label..."
                className="w-full border rounded-lg mb-2"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 10px', fontSize: '13px', color: 'var(--text-primary)' }}
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description..."
                rows={2}
                className="w-full border rounded-lg resize-none mb-3"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', padding: '6px 10px', fontSize: '13px', color: 'var(--text-primary)' }}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="flex-1 py-1.5 rounded-lg" style={{ background: 'var(--accent)', color: 'white', fontSize: '12px', fontWeight: 600 }}>Save</button>
                <button
                  onClick={() => handleDeleteNode(editingNode)}
                  className="py-1.5 px-3 rounded-lg border"
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)', fontSize: '12px', fontWeight: 500 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
