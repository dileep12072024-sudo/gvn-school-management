'use client'

import { useLayoutEffect, useRef, type ElementType } from 'react'
import { cn } from '@/lib/utils'

/**
 * A segmented control whose selection is one pill that travels.
 *
 * The usual version paints a background on whichever button is active, so the
 * highlight teleports. Here the highlight is a single element and only its
 * transform and width change, which means the browser can interpolate the
 * whole journey on the compositor — the selection slides, overshoots a
 * hair, and settles.
 *
 * The offsets have to be measured rather than declared because the segments
 * are label-width, not equal-width. Measuring is the only part JS does; the
 * motion itself is CSS.
 */

export type SegOption<T extends string> = {
  value: T
  label: string
  icon?: ElementType
}

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: readonly SegOption<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const btns = useRef(new Map<string, HTMLButtonElement>())

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return

    const place = () => {
      const active = btns.current.get(value)
      if (!active) return
      el.style.setProperty('--x', `${active.offsetLeft}px`)
      el.style.setProperty('--y', `${active.offsetTop}px`)
      el.style.setProperty('--w', `${active.offsetWidth}px`)
      el.style.setProperty('--h', `${active.offsetHeight}px`)
    }
    place()

    // The first placement must not animate — otherwise the pill flies in from
    // the left edge on every mount. One frame later, motion is on for good.
    const raf = requestAnimationFrame(() => { el.dataset.ready = 'y' })

    // Labels reflow on resize and when the webfont swaps in; both move the
    // segments out from under the pill.
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [value])

  return (
    <div
      ref={wrap}
      role="tablist"
      className={cn('segmented inline-flex gap-1 rounded-full p-1', className)}
      style={{
        background: 'var(--surface-sunk)',
        border: '1px solid var(--edge-strong)',
        boxShadow: 'var(--sunk)',
      }}
    >
      <span className="seg-thumb" aria-hidden />
      {options.map(o => {
        const Icon = o.icon
        const on = o.value === value
        return (
          <button
            key={o.value}
            ref={el => { if (el) btns.current.set(o.value, el); else btns.current.delete(o.value) }}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'seg-option inline-flex items-center gap-1.5 rounded-full font-semibold capitalize',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
            )}
            style={{ color: on ? 'var(--primary)' : 'var(--ink-faint)' }}
          >
            {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
