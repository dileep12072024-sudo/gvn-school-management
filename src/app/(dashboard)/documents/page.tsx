'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Upload, Download, Trash2, FolderOpen, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { formatDate, dbErrorMessage } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isStaff, ALL_ROLES } from '@/lib/nav'
import { PageHeader, Modal, EmptyState, Tilt3D } from '@/components/ui'

const DOC_TYPES = ['circular', 'syllabus', 'portfolio', 'other'] as const

const TYPE_TONE: Record<string, { bg: string; fg: string }> = {
  circular:  { bg: '#e5ecf4', fg: '#1e3a5f' },
  syllabus:  { bg: '#dcece3', fg: '#1f5c42' },
  portfolio: { bg: '#f5e6cd', fg: '#8a6224' },
  other:     { bg: '#e8e3d8', fg: '#667790' },
}

const MAX_BYTES = 10 * 1024 * 1024

export default function DocumentsPage() {
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const canManage = isStaff(profile?.role)

  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState<string>('circular')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, document_type, file_url, created_at, uploaded_by, profiles(full_name)')
      .order('created_at', { ascending: false })
    if (error) toast.error(dbErrorMessage(error))
    setDocuments(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleUpload() {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!file) errs.file = 'Pick a file to upload'
    else if (file.size > MAX_BYTES) errs.file = 'File must be 10 MB or smaller'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setUploading(true)
    const ext = file!.name.split('.').pop() ?? 'bin'
    const path = `documents/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage.from('school-docs').upload(path, file!)
    if (uploadError) { toast.error(uploadError.message || 'Upload failed'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('school-docs').getPublicUrl(path)
    const { error } = await supabase.from('documents').insert({
      title: title.trim(),
      document_type: docType,
      file_url: publicUrl,
      uploaded_by: profile?.id ?? null,
      target_roles: ALL_ROLES,
    })
    setUploading(false)

    if (error) {
      // Row insert failed — don't leave the blob orphaned in the bucket.
      await supabase.storage.from('school-docs').remove([path])
      toast.error(dbErrorMessage(error))
      return
    }
    toast.success('Document uploaded')
    setShowModal(false)
    setTitle(''); setDocType('circular'); setFile(null); setErrors({})
    fetchDocs()
  }

  async function handleDelete() {
    if (!deleting) return
    const { error } = await supabase.from('documents').delete().eq('id', deleting.id)
    if (error) { toast.error(dbErrorMessage(error)); return }
    toast.success('Document deleted')
    setDeleting(null)
    fetchDocs()
  }

  const filtered = documents.filter(d => typeFilter === 'all' || d.document_type === typeFilter)

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FolderOpen}
        title="Documents"
        subtitle="Circulars, syllabus and portfolios"
        actions={canManage && (
          <button onClick={() => { setErrors({}); setShowModal(true) }} className="btn btn-brass">
            <Upload className="h-4 w-4" /> Upload
          </button>
        )}
      />

      <div className="flex flex-wrap gap-2">
        {['all', ...DOC_TYPES].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            aria-pressed={typeFilter === t}
            className={`btn btn-sm capitalize ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="panel p-5"><div className="skeleton h-24" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel p-4">
          <EmptyState icon={FolderOpen} title="No documents" hint="Uploaded files appear here." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(doc => {
            const tone = TYPE_TONE[doc.document_type] ?? TYPE_TONE.other
            return (
              <Tilt3D key={doc.id} className="panel flex flex-col gap-3 p-5">
                <div className="layer-1 flex items-start justify-between">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] text-white"
                    style={{
                      background: 'linear-gradient(180deg, var(--navy-lift), var(--navy) 60%, var(--navy-deep))',
                      boxShadow: '0 3px 0 var(--navy-deep), inset 0 1px 0 rgba(255,255,255,.25)',
                    }}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  {canManage && (
                    <button onClick={() => setDeleting(doc)} className="btn btn-ghost btn-icon" aria-label="Delete document">
                      <Trash2 className="h-3.5 w-3.5" style={{ color: '#b8443c' }} />
                    </button>
                  )}
                </div>

                <div className="layer-1 flex-1">
                  <p className="text-sm font-bold leading-snug" style={{ color: 'var(--ink)' }}>{doc.title}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-faint)' }}>
                    {doc.profiles?.full_name ?? 'Office'} · {formatDate(doc.created_at)}
                  </p>
                </div>

                <div className="layer-1 flex items-center justify-between">
                  <span className="badge capitalize" style={{ background: tone.bg, color: tone.fg }}>{doc.document_type}</span>
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                    <Download className="h-3.5 w-3.5" /> Open
                  </a>
                </div>
              </Tilt3D>
            )
          })}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Upload document"
        subtitle="Maximum 10 MB"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              id="title" value={title}
              onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Annual academic calendar"
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="document_type" className="label">Type</label>
            <select id="document_type" value={docType} onChange={e => setDocType(e.target.value)} className="input capitalize">
              {DOC_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="file" className="label">File</label>
            <input
              id="file" type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setErrors(p => ({ ...p, file: '' })) }}
              className="block w-full text-sm file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              style={{ color: 'var(--ink-soft)' }}
            />
            {errors.file && <p className="field-error">{errors.file}</p>}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete document"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          Delete “<strong>{deleting?.title}</strong>”? The record is removed; the stored file stays in the bucket.
        </p>
      </Modal>
    </div>
  )
}
