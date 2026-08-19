'use client'

import { useEffect, useRef } from 'react'

/**
 * The cursor is the same idea as the segmented control's thumb: one glass
 * pill that travels and reshapes, never a highlight that blinks on and off.
 *
 * Free-floating it is a small capsule riding the pointer. Bring it near
 * anything clickable and it docks — growing to that element's box, taking on
 * its corner radius — then peels off again and shrinks back. Because every
 * frame eases toward the current target rather than replaying a fixed
 * animation, sweeping across a row of buttons reads as one continuous glide
 * that re-aims mid-flight, not a series of restarts.
 *
 * A hairline dot stays pinned to the true pointer position. That is the part
 * that matters once the native cursor is hidden: the pill can be 200px wide
 * and you still know exactly what you are about to click.
 */

/** What the pill is willing to dock onto — anything you can operate. */
const DOCK = [
  'a', 'button', '[role="button"]', '.seg-option', '.table-row',
  'summary', 'label', 'select', 'input', 'textarea',
  // Cards are targets too — a class tile or a stat tile should light up the
  // same way a button does.
  '.tilt',
].join(', ')

const IDLE = 22          // px, the free-floating capsule
const MAX_W = 620        // don't swallow the screen on a full-width row
const MAX_H = 210       // tall enough for a card, short enough to exclude a page section
const CHASE = 0.24       // position ease
const MORPH = 0.19       // size ease — a touch slower, so it stretches

export default function PillCursor() {
  const pill = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const p = pill.current
    const d = dot.current
    if (!p || !d) return
    // No pointer to decorate, or the user asked for calm: leave the native
    // cursor entirely alone.
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2
    // Current box (what is painted) and target box (what it is easing toward).
    let cx = tx, cy = ty, cw = IDLE, ch = IDLE, cr = IDLE / 2
    let nx = tx, ny = ty, nw = IDLE, nh = IDLE, nr = IDLE / 2
    let press = 1
    let seen = false
    let raf = 0

    const free = () => {
      nx = tx; ny = ty; nw = IDLE; nh = IDLE; nr = IDLE / 2
      p.dataset.docked = 'n'
    }

    const aim = (target: Element | null) => {
      const el = target?.closest?.(DOCK) as HTMLElement | null
      if (!el || (el as HTMLButtonElement).disabled) return free()

      const r = el.getBoundingClientRect()
      if (!r.width || r.width > MAX_W || r.height > MAX_H) return free()

      nx = r.left + r.width / 2
      ny = r.top + r.height / 2
      nw = r.width + 8
      nh = r.height + 8
      // Inherit the element's own corner so the pill sits *on* the control
      // rather than floating over it as a foreign shape.
      const own = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 8
      nr = Math.min(own + 4, nh / 2)
      p.dataset.docked = 'y'
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = e.clientX; ty = e.clientY
      if (!seen) {
        seen = true
        cx = tx; cy = ty
        p.style.opacity = '1'; d.style.opacity = '1'
        document.documentElement.classList.add('pill-on')
      }
      aim(e.target as Element | null)
    }

    const onDown = () => { press = 0.9 }
    const onUp = () => { press = 1 }
    const onLeave = () => {
      seen = false
      p.style.opacity = '0'; d.style.opacity = '0'
      document.documentElement.classList.remove('pill-on')
    }
    // A docked rect goes stale the moment the page moves under it.
    const onScroll = () => { if (p.dataset.docked === 'y') free() }

    const tick = () => {
      cx += (nx - cx) * CHASE
      cy += (ny - cy) * CHASE
      cw += (nw * press - cw) * MORPH
      ch += (nh * press - ch) * MORPH
      cr += (nr - cr) * MORPH
      p.style.width = `${cw.toFixed(2)}px`
      p.style.height = `${ch.toFixed(2)}px`
      p.style.borderRadius = `${cr.toFixed(2)}px`
      p.style.transform = `translate3d(${(cx - cw / 2).toFixed(2)}px, ${(cy - ch / 2).toFixed(2)}px, 0)`
      d.style.transform = `translate3d(${tx - 2.5}px, ${ty - 2.5}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll, { capture: true })
      document.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('pill-on')
    }
  }, [])

  return (
    <>
      <div ref={pill} className="pill-cursor" aria-hidden />
      <div ref={dot} className="pill-dot" aria-hidden />
    </>
  )
}
