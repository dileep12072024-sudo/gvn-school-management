'use client'

import { useEffect, useState, useMemo } from 'react'
import { Save, User, School, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { getRoleLabel, validate, dbErrorMessage, required, maxLen, phone as phoneRule, type Rule } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/ui'

const PROFILE_RULES: Record<string, Rule[]> = {
  full_name: [required('Full name'), maxLen(120, 'Full name')],
  phone:     [phoneRule],
}

const SCHOOL = [
  ['School', 'Geethanjali Vidya Nilayam'],
  ['Location', 'Peddawaltair, Visakhapatnam, Andhra Pradesh'],
  ['Board', 'Andhra Pradesh State Board'],
  ['Academic year', '2024–25'],
]

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-white"
          style={{
            background: 'linear-gradient(180deg, var(--primary-lift), var(--primary) 60%, var(--primary-deep))',
            boxShadow: '0 2px 0 var(--primary-deep), inset 0 1px 0 rgba(255,255,255,.25)',
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-bold" style={{ color: 'var(--ink)' }}>{title}</h3>
      </div>
      {children}
    </section>
  )
}

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [form, setForm] = useState<Record<string, any>>({ full_name: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' })
  }, [profile])

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function saveProfile() {
    const errs = validate(form, PROFILE_RULES)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const { error } = await supabase.from('profiles')
      .update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null })
      .eq('id', profile!.id)
    setSaving(false)

    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Profile updated')
    refreshProfile()
  }

  async function changePassword() {
    const errs: Record<string, string> = {}
    if (!pw.current) errs.current = 'Enter your current password'
    if (pw.next.length < 8) errs.next = 'Use at least 8 characters'
    if (pw.next !== pw.confirm) errs.confirm = 'Passwords do not match'
    if (pw.current && pw.next && pw.current === pw.next) errs.next = 'Choose a password you have not used here before'
    if (Object.keys(errs).length) { setPwErrors(errs); return }

    setChanging(true)
    // Reauthenticate before changing the password. Supabase lets an *active
    // session* set a new password with no proof of the old one, so a laptop
    // left unlocked is a silent account takeover. Signing in again with the
    // stated current password is the check; it also refreshes the session,
    // and it fails harmlessly if the password is wrong.
    const { error: reauth } = await supabase.auth.signInWithPassword({
      email: profile!.email,
      password: pw.current,
    })
    if (reauth) {
      setChanging(false)
      setPwErrors({ current: 'That is not your current password' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: pw.next })
    setChanging(false)

    if (error) { toast.error(error.message); return }
    toast.success('Password changed')
    setPw({ current: '', next: '', confirm: '' })
    setPwErrors({})
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader icon={User} title="Settings" subtitle="Your account and school details" />

      <Section icon={User} title="Profile">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="full_name" className="label">Full name</label>
            <input
              id="full_name" value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={`input ${errors.full_name ? 'input-error' : ''}`}
            />
            {errors.full_name && <p className="field-error">{errors.full_name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" value={profile?.email ?? ''} disabled className="input" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <input
              id="phone" value={form.phone} onChange={e => set('phone', e.target.value)}
              className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="9876543210"
            />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="role" className="label">Role</label>
            <input id="role" value={getRoleLabel(profile?.role ?? '')} disabled className="input" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={saveProfile} disabled={saving} className="btn btn-primary">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </Section>

      <Section icon={Shield} title="Password">
        <div className="space-y-4">
          <div>
            <label htmlFor="current_pw" className="label">Current password</label>
            <input
              id="current_pw" type="password" autoComplete="current-password" value={pw.current}
              onChange={e => { setPw(p => ({ ...p, current: e.target.value })); setPwErrors({}) }}
              className={`input max-w-sm ${pwErrors.current ? 'input-error' : ''}`}
            />
            {pwErrors.current && <p className="field-error">{pwErrors.current}</p>}
          </div>
          <div>
            <label htmlFor="new_pw" className="label">New password</label>
            <input
              id="new_pw" type="password" autoComplete="new-password" value={pw.next}
              onChange={e => { setPw(p => ({ ...p, next: e.target.value })); setPwErrors({}) }}
              className={`input max-w-sm ${pwErrors.next ? 'input-error' : ''}`}
            />
            {pwErrors.next && <p className="field-error">{pwErrors.next}</p>}
          </div>
          <div>
            <label htmlFor="confirm_pw" className="label">Confirm password</label>
            <input
              id="confirm_pw" type="password" autoComplete="new-password" value={pw.confirm}
              onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setPwErrors({}) }}
              className={`input max-w-sm ${pwErrors.confirm ? 'input-error' : ''}`}
            />
            {pwErrors.confirm && <p className="field-error">{pwErrors.confirm}</p>}
          </div>
        </div>
        <div className="mt-5">
          <button onClick={changePassword} disabled={changing} className="btn btn-primary">
            {changing ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </Section>

      <Section icon={School} title="School">
        <dl className="text-sm">
          {SCHOOL.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid var(--edge)' }}>
              <dt style={{ color: 'var(--ink-faint)' }}>{k}</dt>
              <dd className="text-right font-semibold" style={{ color: 'var(--ink)' }}>{v}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  )
}
