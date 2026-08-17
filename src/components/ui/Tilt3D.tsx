'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

/**
 * Pointer-tracked tilt. Writes --rx/--ry (rotation) and --mx/--my (sheen
 * origin) as CSS custom properties; all the visual work happens in globals.css
 * so this stays one small listener instead of per-frame React renders.
 *
 * Honours prefers-reduced-motion via the CSS, not JS — the transform is simply
 * ignored there.
 */
export default function Tilt3D({
  children,
  className,
  max = 7,
  sheen = true,
  as: Tag = 'div',
  ...rest
}: {
  children: React.ReactNode
  className?: string
  /** Peak rotation in degrees at the card's corners. */
  max?: number
  sheen?: boolean
  as?: 'div' | 'article' | 'section'
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width   // 0..1
    const py = (e.clientY - r.top) / r.height   // 0..1
    el.style.setProperty('--ry', `${(px - 0.5) * 2 * max}deg`)
    el.style.setProperty('--rx', `${(0.5 - py) * 2 * max}deg`)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }, [max])

  const reset = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    setActive(false)
  }, [])

  return (
    <Tag
      ref={ref as any}
      onPointerMove={onMove}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={reset}
      className={cn('tilt', active && 'tilt-active', sheen && 'tilt-sheen', className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
