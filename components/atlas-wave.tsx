'use client'

import { useEffect, useRef } from 'react'

type AtlasWaveProps = {
  size?: number
  isStreaming?: boolean
  className?: string
}

export function AtlasWave({ size = 40, isStreaming = false, className = '' }: AtlasWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const streamingRef = useRef(isStreaming)

  useEffect(() => {
    streamingRef.current = isStreaming
  }, [isStreaming])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const waves = [
      { freq: 0.015, amp: 4, phase: 0, opacity: 0.9 },
      { freq: 0.025, amp: 3, phase: Math.PI / 3, opacity: 0.6 },
      { freq: 0.035, amp: 2, phase: (2 * Math.PI) / 3, opacity: 0.35 },
    ]

    let time = 0
    const animate = () => {
      ctx.clearRect(0, 0, size, size)

      const streaming = streamingRef.current
      const ampMult = streaming ? 2.5 : 0.6
      const freqAdd = streaming ? 0.01 : 0
      const speed = streaming ? 1.5 : 0.6

      waves.forEach((wave) => {
        const grad = ctx.createLinearGradient(0, 0, size, 0)
        grad.addColorStop(0, `hsla(225, 100%, 65%, ${wave.opacity})`)
        grad.addColorStop(1, `hsla(270, 90%, 70%, ${wave.opacity})`)

        ctx.beginPath()
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5

        for (let x = 0; x < size; x++) {
          const normalizedX = x / size
          const envelope = Math.sin(normalizedX * Math.PI)
          const y =
            size / 2 +
            Math.sin(x * (wave.freq + freqAdd) * 10 + time * speed + wave.phase) *
              wave.amp *
              ampMult *
              envelope
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      time += 0.03
      animRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [size])

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  )
}
