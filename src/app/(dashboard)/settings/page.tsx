'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Save, User, School, Shield } from 'lucide-react'
import { getRoleLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase.from('profiles').select('*').eq('id', user?.id).single().then(({ data }) => {
        setProfile(data)
        setForm({ full_name: data?.full_name ?? '', phone: data?.phone ?? '' })
        setLoading(false)
      })
    })
  }, [])

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update(form).eq('id', user?.id)
    if (error) toast.error('Update failed')
    else toast.success('Profile updated')
    setSaving(false)
  }

  async function changePassword() {
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.newPw.length < 6) { toast.error('Min 6 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    if (error) toast.error(error.message)
    else { toast.success('Password changed'); setPwForm({ current: '', newPw: '', confirm: '' }) }
  }

  if (loading) return <div className="card p-12 text-center text-gray-400">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-[#1e3a5f]" />
          </div>
          <h3 className="font-semibold text-gray-800">Profile Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input value={profile?.email ?? ''} disabled className="input bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <input value={getRoleLabel(profile?.role ?? '')} disabled className="input bg-gray-50 text-gray-500" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* School Info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
            <School className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <h3 className="font-semibold text-gray-800">School Information</h3>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: 'School Name', value: 'Geethanjali Vidya Nilayam' },
            { label: 'Location', value: 'Peddawaltair, Visakhapatnam, Andhra Pradesh' },
            { label: 'Board', value: 'Andhra Pradesh State Board' },
            { label: 'Academic Year', value: '2024-25' },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{item.label}</span>
              <span className="font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Change Password</h3>
        </div>
        <div className="space-y-4">
          {[{ l: 'New Password', k: 'newPw', v: pwForm.newPw }, { l: 'Confirm Password', k: 'confirm', v: pwForm.confirm }].map(f => (
            <div key={f.k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.l}</label>
              <input type="password" value={f.v}
                onChange={e => setPwForm(p => ({ ...p, [f.k]: e.target.value }))}
                className="input max-w-sm" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button onClick={changePassword} className="btn-primary">Update Password</button>
        </div>
      </div>
    </div>
  )
}
