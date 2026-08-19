/**
 * Haptic feedback.
 *
 * The only web API for this is `navigator.vibrate`, which Android Chrome and
 * Firefox implement and **iOS Safari does not** — Apple has never shipped it.
 * There is no polyfill: the audio and switch-element tricks either need a
 * direct user gesture on a specific control or do nothing at all. So on iPhone
 * these calls are silent no-ops, and the visual press animation is the whole
 * of the feedback. Everything here is built to degrade to exactly that.
 *
 * Patterns are deliberately short. Anything over ~30ms on a phone reads as a
 * buzz rather than a tick, and buzzing on every tap is how an app gets its
 * vibration permission revoked in the user's settings.
 */

export type Haptic = 'tap' | 'press' | 'select' | 'success' | 'warn' | 'error'

const PATTERNS: Record<Haptic, number | number[]> = {
  tap:     8,
  press:   12,
  select:  [5, 20, 5],
  success: [10, 40, 18],
  warn:    [14, 60, 14],
  error:   [18, 50, 18, 50, 26],
}

let enabled: boolean | null = null

/** Cached because matchMedia and feature detection both cost more than a bool. */
function usable() {
  if (enabled !== null) return enabled
  enabled =
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return enabled
}

export function haptic(kind: Haptic = 'tap') {
  if (!usable()) return
  try {
    navigator.vibrate(PATTERNS[kind])
  } catch {
    // Some browsers throw if the document has never been interacted with.
    // A missing tick is not worth breaking the click handler over.
  }
}

/** Cancels anything mid-pattern — used when a view unmounts under a long buzz. */
export function hapticStop() {
  if (usable()) navigator.vibrate(0)
}
