'use client'

import { useEffect } from 'react'
import { haptic, type Haptic } from '@/lib/haptics'
import PillCursor from './PillCursor'

/** What a given control should feel like when pressed. */
const FEEL: [string, Haptic][] = [
  ['[data-haptic="error"]',              'error'],
  ['[data-haptic="success"]',            'success'],
  ['.btn-danger',                        'warn'],
  ['.btn-primary, .btn-accent',           'press'],
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

export default function Interactions() {
  useGlobalHaptics()
  return <PillCursor />
}
