'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Bus, MapPin, User, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TransportPage() {
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicles'>('routes')
  const [showModal, setShowModal] = useState(false)
  const supabase = createClientComponentClient()

  const emptyRoute = { route_name: '', route_number: '', stops: '' }
  const emptyVehicle = { vehicle_number: '', vehicle_type: 'bus', capacity: 40, route_id: '' }
  const [routeForm, setRouteForm] = useState(emptyRoute)
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: r }, { data: v }] = await Promise.all([
      supabase.from('transport_routes').select('*').order('route_number'),
      supabase.from('transport_vehicles').select('*, transport_routes(route_name)').order('vehicle_number'),
    ])
    setRoutes(r ?? [])
    setVehicles((v ?? []).map((x: any) => ({ ...x, route_name: x.transport_routes?.route_name })))
  }

  async function saveRoute() {
    const { error } = await supabase.from('transport_routes').insert({
      ...routeForm,
      stops: routeForm.stops.split(',').map(s => s.trim()).filter(Boolean)
    })
    if (error) { toast.error('Failed'); return }
    toast.success('Route added'); setShowModal(false); setRouteForm(emptyRoute); fetchAll()
  }

  async function saveVehicle() {
    const { error } = await supabase.from('transport_vehicles').insert(vehicleForm)
    if (error) { toast.error('Failed'); return }
    toast.success('Vehicle added'); setShowModal(false); setVehicleForm(emptyVehicle); fetchAll()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transport</h2>
          <p className="text-sm text-gray-500">Routes, vehicles and student allocation</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add {activeTab === 'routes' ? 'Route' : 'Vehicle'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
              <p className="text-sm text-gray-500">Active Routes</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border border-[#fde68a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fff8e7] rounded-xl flex items-center justify-center">
              <Bus className="w-5 h-5 text-[#b45309]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              <p className="text-sm text-gray-500">Vehicles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['routes', 'vehicles'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white shadow text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'
            }`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'routes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.length === 0 ? (
            <div className="col-span-3 card p-12 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No routes added yet</p>
            </div>
          ) : routes.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-[#1e3a5f] text-lg">{r.route_number}</p>
                  <p className="font-semibold text-gray-800">{r.route_name}</p>
                </div>
                <span className="badge bg-blue-50 text-blue-700">{(r.stops ?? []).length} stops</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(r.stops ?? []).map((stop: string, i: number) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    {stop}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{['Vehicle No.', 'Type', 'Capacity', 'Route', 'Driver'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell font-semibold text-[#1e3a5f]">{v.vehicle_number}</td>
                  <td className="table-cell capitalize">{v.vehicle_type}</td>
                  <td className="table-cell">{v.capacity}</td>
                  <td className="table-cell">{v.route_name ?? '—'}</td>
                  <td className="table-cell">{v.driver_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">Add {activeTab === 'routes' ? 'Route' : 'Vehicle'}</h3>
            </div>
            {activeTab === 'routes' ? (
              <div className="p-6 space-y-4">
                {[{ l: 'Route Number', k: 'route_number' }, { l: 'Route Name', k: 'route_name' }].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.l}</label>
                    <input value={(routeForm as any)[f.k]} onChange={e => setRouteForm(p => ({ ...p, [f.k]: e.target.value }))} className="input" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stops (comma separated)</label>
                  <textarea value={routeForm.stops} onChange={e => setRouteForm(p => ({ ...p, stops: e.target.value }))}
                    className="input h-20 resize-none" placeholder="Stop 1, Stop 2, Stop 3" />
                </div>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Number</label>
                  <input value={vehicleForm.vehicle_number} onChange={e => setVehicleForm(p => ({ ...p, vehicle_number: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={vehicleForm.vehicle_type} onChange={e => setVehicleForm(p => ({ ...p, vehicle_type: e.target.value }))} className="input">
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
                  <input type="number" value={vehicleForm.capacity} onChange={e => setVehicleForm(p => ({ ...p, capacity: Number(e.target.value) }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Route</label>
                  <select value={vehicleForm.route_id} onChange={e => setVehicleForm(p => ({ ...p, route_id: e.target.value }))} className="input">
                    <option value="">Select route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={activeTab === 'routes' ? saveRoute : saveVehicle} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
