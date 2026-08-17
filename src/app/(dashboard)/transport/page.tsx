'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Bus, MapPin, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { toPayload, validate, dbErrorMessage, required, positive, type Rule } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isAdmin } from '@/lib/nav'
import { PageHeader, StatCard, Modal, TableShell, EmptyState, SkeletonRows } from '@/components/ui'

const EMPTY_ROUTE = { route_number: '', route_name: '', stops: '' }
const EMPTY_VEHICLE = { vehicle_number: '', vehicle_type: 'bus', capacity: 40, route_id: '', driver_id: '' }

const ROUTE_RULES: Record<string, Rule[]> = {
  route_number: [required('Route number')],
  route_name:   [required('Route name')],
}
const VEHICLE_RULES: Record<string, Rule[]> = {
  vehicle_number: [required('Vehicle number')],
  capacity:       [required('Capacity'), positive('Capacity')],
}

type Tab = 'routes' | 'vehicles'

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
  const [form, setForm] = useState<Record<string, any>>(EMPTY_ROUTE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<{ table: string; row: any; label: string } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [r, v, d] = await Promise.all([
      supabase.from('transport_routes').select('id, route_number, route_name, stops').order('route_number'),
      supabase.from('transport_vehicles')
        .select('id, vehicle_number, vehicle_type, capacity, route_id, driver_id, transport_routes(route_name), profiles(full_name)')
        .order('vehicle_number'),
      supabase.from('profiles').select('id, full_name').in('role', ['teacher', 'organiser']).order('full_name'),
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
    setForm(tab === 'routes' ? EMPTY_ROUTE : EMPTY_VEHICLE)
    setErrors({})
    setShowModal(true)
  }

  async function handleSave() {
    const isRoute = tab === 'routes'
    const errs = validate(form, isRoute ? ROUTE_RULES : VEHICLE_RULES)
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted fields'); return }

    setSaving(true)
    let payload: Record<string, any>
    if (isRoute) {
      payload = {
        ...toPayload(form, EMPTY_ROUTE),
        // stops is TEXT[] — the textarea holds a comma-separated list.
        stops: String(form.stops ?? '').split(',').map(s => s.trim()).filter(Boolean),
      }
    } else {
      payload = { ...toPayload(form, EMPTY_VEHICLE), capacity: Number(form.capacity) }
    }

    const { error } = await supabase.from(isRoute ? 'transport_routes' : 'transport_vehicles').insert(payload)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success(isRoute ? 'Route added' : 'Vehicle added')
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
        subtitle="Routes, vehicles and stops"
        actions={canManage && (
          <button onClick={openAdd} className="btn btn-brass">
            <Plus className="h-4 w-4" /> Add {tab === 'routes' ? 'route' : 'vehicle'}
          </button>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Routes" value={routes.length} icon={MapPin} tone="navy" />
        <StatCard label="Vehicles" value={vehicles.length} icon={Bus} tone="brass" />
        <StatCard
          label="Total seats"
          value={vehicles.reduce((s, v) => s + (v.capacity ?? 0), 0)}
          icon={Bus}
          tone="green"
        />
      </div>

      <div className="panel-flat inline-flex gap-1 p-1.5">
        {(['routes', 'vehicles'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`btn btn-sm capitalize ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t}
          </button>
        ))}
      </div>

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
                    <p className="text-lg font-bold" style={{ color: 'var(--navy)' }}>{r.route_number}</p>
                    <p className="truncate font-semibold" style={{ color: 'var(--ink)' }}>{r.route_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="badge" style={{ background: '#e5ecf4', color: '#1e3a5f' }}>
                      {(r.stops ?? []).length} stops
                    </span>
                    {canManage && (
                      <button
                        onClick={() => setDeleting({ table: 'transport_routes', row: r, label: r.route_name })}
                        className="btn btn-ghost btn-icon" aria-label="Delete route"
                      >
                        <Trash2 className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                      </button>
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
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brass)' }} />
                      {stop}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        <TableShell columns={['Vehicle', 'Type', 'Capacity', 'Route', 'Driver', canManage ? '' : '']}>
          {loading ? (
            <SkeletonRows cols={6} />
          ) : vehicles.length === 0 ? (
            <EmptyState icon={Bus} title="No vehicles" hint="Add a vehicle and assign it to a route." colSpan={6} />
          ) : vehicles.map(v => (
            <tr key={v.id} className="table-row" style={{ borderTop: '1px solid var(--edge)' }}>
              <td className="table-cell font-bold" style={{ color: 'var(--navy)' }}>{v.vehicle_number}</td>
              <td className="table-cell capitalize">{v.vehicle_type}</td>
              <td className="table-cell tabular-nums">{v.capacity}</td>
              <td className="table-cell">{v.transport_routes?.route_name ?? '—'}</td>
              <td className="table-cell">{v.profiles?.full_name ?? '—'}</td>
              <td className="table-cell">
                {canManage && (
                  <button
                    onClick={() => setDeleting({ table: 'transport_vehicles', row: v, label: v.vehicle_number })}
                    className="btn btn-ghost btn-icon" aria-label="Delete vehicle"
                  >
                    <Trash2 className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={tab === 'routes' ? 'Add route' : 'Add vehicle'}
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
        ) : (
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
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
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
          Delete “<strong>{deleting?.label}</strong>”? Student allocations pointing at it are removed too.
        </p>
      </Modal>
    </div>
  )
}
