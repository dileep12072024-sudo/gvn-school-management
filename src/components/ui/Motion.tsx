'use client'

import { useEffect, useRef, useState, type ElementType } from 'react'
import { cn } from '@/lib/utils'

/**
 * Pulls an element toward the cursor as it approaches.
 *
 * Writes --dx/--dy and lets CSS do the transform, same contract as Tilt3D.
 * Mouse only: on a touch screen there is no "approach", only a tap, and a
 * magnet with no cursor to chase just leaves the button sitting off-centre.
 */
export function Magnetic({
  children, className, strength = 0.32, radius = 90, as: Tag = 'div', ...rest
}: {
  children: React.ReactNode
  className?: string
  /** Fraction of the cursor's offset the element travels. */
  strength?: number
  /** How far outside the element the pull starts, in px. */
  radius?: number
  as?: 'div' | 'span'
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) / 2 + radius

      if (near) {
        el.style.setProperty('--dx', `${(dx * strength).toFixed(1)}px`)
        el.style.setProperty('--dy', `${(dy * strength).toFixed(1)}px`)
        setOn(true)
      } else if (on) {
        el.style.setProperty('--dx', '0px')
        el.style.setProperty('--dy', '0px')
        setOn(false)
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [on, strength, radius])

  return (
    <Tag ref={ref as any} className={cn('magnetic', on && 'magnetic-on', className)} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Plays an entrance the first time the element scrolls into view.
 *
 * One observer per element is wasteful at scale but there are at most a dozen
 * of these on any page here, and a shared observer would need a registry to
 * map entries back to setState. Revisit if a page ever reveals a long list.
 */
export function Reveal({
  children, className, index = 0, as: Tag = 'div', ...rest
}: {
  children: React.ReactNode
  className?: string
  /** Stagger position within its group. */
  index?: number
  as?: 'div' | 'section' | 'article'
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // No IntersectionObserver (or motion turned down) means show it, not hide
    // it forever — failing closed here would blank the page.
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return }

    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as any}
      className={cn('reveal', shown && 'reveal-in', className)}
      style={{ '--i': index } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  )
}
