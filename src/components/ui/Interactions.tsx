'use client'

import { useEffect, useRef } from 'react'
import { haptic, type Haptic } from '@/lib/haptics'

/** What a given control should feel like when pressed. */
const FEEL: [string, Haptic][] = [
  ['[data-haptic="error"]',              'error'],
  ['[data-haptic="success"]',            'success'],
  ['.btn-danger',                        'warn'],
  ['.btn-primary, .btn-brass',           'press'],
  ['input[type="checkbox"], input[type="radio"], select, option', 'select'],
  ['a, button, [role="button"], .table-row, label, summary',      'tap'],
]

/**
 * One delegated listener for the whole app.
 *
 * The alternative — an onPointerDown on every button in every page — is the
 * same behaviour spread over forty files, and it silently misses anything
 * added later. Delegation on the document catches all of it, including
 * controls rendered inside portals and toasts.
 */
function useGlobalHaptics() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (!el?.closest) return
      if (el.closest('[data-haptic="off"]')) return
      for (const [selector, kind] of FEEL) {
        const hit = el.closest(selector)
        if (hit && !(hit as HTMLButtonElement).disabled) { haptic(kind); return }
      }
    }
    document.addEventListener('pointerdown', onDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])
}

/**
 * A brass ring that chases the cursor and swells over anything clickable.
 *
 * The native cursor stays visible — hiding it is the single fastest way to
 * make a site feel broken when the JS hasn't hydrated yet. This only ever
 * adds a layer on top.
 *
 * Position is written straight to style in a rAF loop rather than through
 * React state: at 60fps a setState here would re-render the tree 60 times a
 * second for a decoration.
 */
function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // `hover` is the honest question — "is there a cursor to decorate?".
    // `pointer: fine` says no on setups that still have a mouse.
    const fine = window.matchMedia('(hover: hover)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || calm) return

    const r = ring.current, d = dot.current
    if (!r || !d) return

    let tx = innerWidth / 2, ty = innerHeight / 2   // target
    let cx = tx, cy = ty                            // current (lagging)
    let scale = 1, targetScale = 1
    let raf = 0
    let seen = false

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = e.clientX; ty = e.clientY
      if (!seen) { cx = tx; cy = ty; seen = true; r.style.opacity = '1'; d.style.opacity = '1' }

      const el = e.target as Element | null
      const over = !!el?.closest?.('a, button, [role="button"], input, select, textarea, .table-row, .tilt')
      targetScale = over ? 1.9 : 1
      r.dataset.over = over ? 'y' : 'n'
    }

    const onDown = () => { targetScale *= 0.7 }
    const onUp = () => { targetScale = r.dataset.over === 'y' ? 1.9 : 1 }
    const onLeave = () => { r.style.opacity = '0'; d.style.opacity = '0'; seen = false }

    const tick = () => {
      // Ring lags the pointer; the dot tracks it exactly. The gap between the
      // two is what reads as weight.
      cx += (tx - cx) * 0.18
      cy += (ty - cy) * 0.18
      scale += (targetScale - scale) * 0.2
      r.style.transform = `translate3d(${cx - 18}px, ${cy - 18}px, 0) scale(${scale.toFixed(3)})`
      d.style.transform = `translate3d(${tx - 3}px, ${ty - 3}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  )
}

export default function Interactions() {
  useGlobalHaptics()
  return <Cursor />
}
