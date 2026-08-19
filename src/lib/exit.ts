import { useEffect, useState } from 'react'

/**
 * Keeps a popover mounted long enough to play its closing animation.
 *
 * `{open && <menu/>}` is the usual pattern and it is why closing feels abrupt:
 * React tears the node out on the same tick the state flips, so there is
 * nothing left on screen for an exit animation to run on. This holds the node
 * for `ms` after `open` goes false and reports `closing` so the call site can
 * swap in the reverse animation.
 */
export function useExitAnimation(open: boolean, ms = 220) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) { setMounted(true); return }
    if (!mounted) return
    const t = setTimeout(() => setMounted(false), ms)
    return () => clearTimeout(t)
  }, [open, ms, mounted])

  return { mounted, closing: mounted && !open }
}
