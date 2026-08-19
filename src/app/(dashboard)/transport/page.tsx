'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Bus, MapPin, Trash2, Route, BadgeCheck, Pencil, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { toPayload, validate, dbErrorMessage, required, positive, type Rule } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/nav'
import { PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows, Segmented } from '@/components/ui'

const EMPTY_ROUTE = { route_number: '', route_name: '', stops: '' }
const EMPTY_VEHICLE = { vehicle_number: '', vehicle_type: 'bus', capacity: 40, route_id: '', driver_id: '' }
const EMPTY_DRIVER = { full_name: '', phone: '', licence_number: '', licence_expiry: '', notes: '' }

const ROUTE_RULES: Record<string, Rule[]> = {
  route_number: [required('Route number')],
  route_name:   [required('Route name')],
}
const VEHICLE_RULES: Record<string, Rule[]> = {
  vehicle_number: [required('Vehicle number')],
  capacity:       [required('Capacity'), positive('Capacity')],
}
const DRIVER_RULES: Record<string, Rule[]> = {
  full_name: [required('Driver name')],
}

type Tab = 'routes' | 'vehicles' | 'drivers'

/** Everything that differs between the three tabs, in one place. */
const TABS = {
  routes:   { table: 'transport_routes',   empty: EMPTY_ROUTE,   rules: ROUTE_RULES,   noun: 'route' },
  vehicles: { table: 'transport_vehicles', empty: EMPTY_VEHICLE, rules: VEHICLE_RULES, noun: 'vehicle' },
  drivers:  { table: 'transport_drivers',  empty: EMPTY_DRIVER,  rules: DRIVER_RULES,  noun: 'driver' },
} as const

export default function TransportPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const canManage = isAdmin(profile?.role)

  const [tab, setTab] = useState<Tab>('routes')
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>(EMPTY_ROUTE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<{ table: string; row: any; label: string } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [r, v, d] = await Promise.all([
      supabase.from('transport_routes').select('id, route_number, route_name, stops').order('route_number'),
      supabase.from('transport_vehicles')
        .select('id, vehicle_number, vehicle_type, capacity, route_id, driver_id, transport_routes(route_name), transport_drivers(full_name, phone)')
        .order('vehicle_number'),
      supabase.from('transport_drivers')
        .select('id, full_name, phone, licence_number, licence_expiry, notes')
        .order('full_name'),
    ])
    const err = r.error ?? v.error ?? d.error
    if (err) toast.error(dbErrorMessage(err))
    setRoutes(r.data ?? [])
    setVehicles(v.data ?? [])
    setDrivers(d.data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  function openAdd() {
    setEditing(null)
    setForm(TABS[tab].empty)
    setErrors({})
    setShowModal(true)
  }

  function openEdit(row: any) {
    setEditing(row)
    // Only the keys the form knows about, so an id or a joined relation from
    // the fetch never rides along into the update.
    const shape = TABS[tab].empty as Record<string, any>
    const next: Record<string, any> = {}
    for (const k of Object.keys(shape)) next[k] = row[k] ?? shape[k]
    if (tab === 'routes') next.stops = (row.stops ?? []).join(', ')
    setForm(next)
    setErrors({})
    setShowModal(true)
  }

  async function handleSave() {
    const cfg = TABS[tab]
    const errs = validate(form, cfg.rules)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    const payload: Record<string, any> = toPayload(form, cfg.empty)
    // stops is TEXT[] — the textarea holds a comma-separated list.
    if (tab === 'routes') payload.stops = String(form.stops ?? '').split(',').map(s => s.trim()).filter(Boolean)
    if (tab === 'vehicles') payload.capacity = Number(form.capacity)
    // A blank date input is '' — Postgres wants NULL, not an empty string.
    if (tab === 'drivers' && !payload.licence_expiry) payload.licence_expiry = null

    setSaving(true)
    const { error } = editing
      ? await supabase.from(cfg.table).update(payload).eq('id', editing.id)
      : await supabase.from(cfg.table).insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(editing ? 'Saved' : `${cfg.noun[0].toUpperCase()}${cfg.noun.slice(1)} added`)
    setShowModal(false)
    fetchAll()
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from(deleting.table).delete().eq('id', deleting.row.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Deleted')
    setDeleting(null)
    fetchAll()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Bus}
        title="Transport"
        subtitle="Routes, vehicles, drivers and stops"
        actions={canManage && (
          <button onClick={openAdd} className="btn btn-accent">
            <Plus className="h-4 w-4" /> Add {TABS[tab].noun}
          </button>
        )}
      />

      <div className="stat-grid">
        <StatCard label="Routes" value={routes.length} icon={MapPin} tone="primary" />
        <StatCard label="Vehicles" value={vehicles.length} icon={Bus} tone="accent" />
        <StatCard label="Drivers" value={drivers.length} icon={BadgeCheck} tone="slate" />
        <StatCard
          label="Total seats"
          value={vehicles.reduce((s, v) => s + (v.capacity ?? 0), 0)}
          icon={Bus}
          tone="green"
        />
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'routes', label: 'Routes', icon: Route },
          { value: 'vehicles', label: 'Vehicles', icon: Bus },
          { value: 'drivers', label: 'Drivers', icon: BadgeCheck },
        ]}
      />

      {tab === 'routes' ? (
        loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="panel p-5"><div className="skeleton h-24" /></div>)}
          </div>
        ) : routes.length === 0 ? (
          <div className="panel p-4">
            <EmptyState icon={MapPin} title="No routes" hint="Add a route to start allocating students." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {routes.map(r => (
              <article key={r.id} className="panel p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{r.route_number}</p>
                    <p className="truncate font-semibold" title={r.route_name} style={{ color: 'var(--ink)' }}>{r.route_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="badge" style={{ background: 'var(--tint-navy)', color: 'var(--primary)' }}>
                      {(r.stops ?? []).length} stops
                    </span>
                    {canManage && (
                      <>
                        <button onClick={() => openEdit(r)} className="btn btn-ghost btn-icon" aria-label="Edit route">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleting({ table: 'transport_routes', row: r, label: r.route_name })}
                          className="btn btn-ghost btn-icon" aria-label="Delete route"
                        >
                          <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(r.stops ?? []).map((stop: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                      style={{ background: 'var(--surface-sunk)', color: 'var(--ink-soft)', boxShadow: 'var(--sunk)' }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      {stop}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )
      ) : tab === 'vehicles' ? (
        <TableShell columns={['Vehicle', 'Type', 'Capacity', 'Route', 'Driver', '']}>
          {loading ? (
            <SkeletonRows cols={6} />
          ) : vehicles.length === 0 ? (
            <EmptyState icon={Bus} title="No vehicles" hint="Add a vehicle and assign it to a route." colSpan={6} />
          ) : vehicles.map(v => (
            <tr key={v.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
              <td className="table-cell font-bold" style={{ color: 'var(--primary)' }}>{v.vehicle_number}</td>
              <td className="table-cell capitalize">{v.vehicle_type}</td>
              <td className="table-cell tabular-nums">{v.capacity}</td>
              <td className="table-cell">{v.transport_routes?.route_name ?? '—'}</td>
              <td className="table-cell">{v.transport_drivers?.full_name ?? '—'}</td>
              <td className="table-cell">
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(v)} className="btn btn-ghost btn-icon" aria-label="Edit vehicle">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleting({ table: 'transport_vehicles', row: v, label: v.vehicle_number })}
                      className="btn btn-ghost btn-icon" aria-label="Delete vehicle"
                    >
                      <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      ) : (
        <TableShell columns={['Driver', 'Phone', 'Licence', 'Expires', 'Vehicle', '']}>
          {loading ? (
            <SkeletonRows cols={6} />
          ) : drivers.length === 0 ? (
            <EmptyState icon={BadgeCheck} title="No drivers" hint="Add a driver, then assign them to a vehicle." colSpan={6} />
          ) : drivers.map(d => {
            const vehicle = vehicles.find(v => v.driver_id === d.id)
            return (
              <tr key={d.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
                <td className="table-cell font-semibold" style={{ color: 'var(--primary)' }}>{d.full_name}</td>
                <td className="table-cell">
                  {d.phone
                    ? <a href={`tel:${d.phone}`} className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{d.phone}</a>
                    : '—'}
                </td>
                <td className="table-cell tabular-nums">{d.licence_number || '—'}</td>
                <td className="table-cell tabular-nums">{d.licence_expiry || '—'}</td>
                <td className="table-cell">{vehicle?.vehicle_number ?? '—'}</td>
                <td className="table-cell">
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(d)} className="btn btn-ghost btn-icon" aria-label="Edit driver">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting({ table: 'transport_drivers', row: d, label: d.full_name })}
                        className="btn btn-ghost btn-icon" aria-label="Delete driver"
                      >
                        <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </TableShell>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={`${editing ? 'Edit' : 'Add'} ${TABS[tab].noun}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {tab === 'routes' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="route_number" className="label">Route number</label>
                <input
                  id="route_number" value={form.route_number} onChange={e => set('route_number', e.target.value)}
                  className={`input ${errors.route_number ? 'input-error' : ''}`} placeholder="R-01"
                />
                {errors.route_number && <p className="field-error">{errors.route_number}</p>}
              </div>
              <div>
                <label htmlFor="route_name" className="label">Route name</label>
                <input
                  id="route_name" value={form.route_name} onChange={e => set('route_name', e.target.value)}
                  className={`input ${errors.route_name ? 'input-error' : ''}`} placeholder="Town centre"
                />
                {errors.route_name && <p className="field-error">{errors.route_name}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="stops" className="label">Stops (comma separated)</label>
              <textarea
                id="stops" rows={3} value={form.stops} onChange={e => set('stops', e.target.value)}
                className="input resize-none" placeholder="Main Road, Market, Railway Station"
              />
            </div>
          </div>
        ) : tab === 'vehicles' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicle_number" className="label">Vehicle number</label>
              <input
                id="vehicle_number" value={form.vehicle_number} onChange={e => set('vehicle_number', e.target.value)}
                className={`input ${errors.vehicle_number ? 'input-error' : ''}`} placeholder="AP 09 AB 1234"
              />
              {errors.vehicle_number && <p className="field-error">{errors.vehicle_number}</p>}
            </div>
            <div>
              <label htmlFor="vehicle_type" className="label">Type</label>
              <select id="vehicle_type" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)} className="input capitalize">
                {['bus', 'van', 'auto', 'car'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="capacity" className="label">Capacity</label>
              <input
                id="capacity" type="number" min={1} value={form.capacity}
                onChange={e => set('capacity', e.target.value)}
                className={`input ${errors.capacity ? 'input-error' : ''}`}
              />
              {errors.capacity && <p className="field-error">{errors.capacity}</p>}
            </div>
            <div>
              <label htmlFor="route_id" className="label">Route</label>
              <select id="route_id" value={form.route_id} onChange={e => set('route_id', e.target.value)} className="input">
                <option value="">Unassigned</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.route_number} — {r.route_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="driver_id" className="label">Driver</label>
              <select id="driver_id" value={form.driver_id} onChange={e => set('driver_id', e.target.value)} className="input">
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}{d.phone ? ` — ${d.phone}` : ''}</option>)}
              </select>
              {drivers.length === 0 && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
                  No drivers yet — add one on the Drivers tab.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="full_name" className="label">Driver name</label>
              <input
                id="full_name" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                className={`input ${errors.full_name ? 'input-error' : ''}`} placeholder="K. Ramesh"
              />
              {errors.full_name && <p className="field-error">{errors.full_name}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input
                id="phone" type="tel" inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="input" placeholder="98480 12345"
              />
            </div>
            <div>
              <label htmlFor="licence_number" className="label">Licence number</label>
              <input
                id="licence_number" value={form.licence_number} onChange={e => set('licence_number', e.target.value)}
                className="input" placeholder="AP09 20230001234"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="licence_expiry" className="label">Licence expires</label>
              <input
                id="licence_expiry" type="date" value={form.licence_expiry ?? ''}
                onChange={e => set('licence_expiry', e.target.value)} className="input"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="notes" className="label">Notes</label>
              <textarea
                id="notes" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                className="input resize-none" placeholder="Shift, years of service, badge number…"
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Confirm delete"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Delete “<strong>{deleting?.label}</strong>”?{' '}
          {deleting?.table === 'transport_drivers'
            ? 'Any vehicle they are assigned to becomes unassigned.'
            : 'Student allocations pointing at it are removed too.'}
        </p>
      </Modal>
    </div>
  )
}
