'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Upload, Download, Trash2, FolderOpen, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const DOC_TYPES = ['circular', 'syllabus', 'portfolio', 'other']
const TYPE_COLORS: Record<string, string> = {
  circular: 'bg-blue-100 text-blue-700',
  syllabus: 'bg-green-100 text-green-700',
  portfolio: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const supabase = createClientComponentClient()

  const emptyForm = { title: '', document_type: 'circular', file: null as File | null }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase.from('documents')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    setDocuments((data ?? []).map((d: any) => ({ ...d, uploader_name: d.profiles?.full_name })))
    setLoading(false)
  }

  async function handleUpload() {
    if (!form.file || !form.title) { toast.error('Title and file required'); return }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = form.file.name.split('.').pop()
    const path = `documents/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('school-docs').upload(path, form.file)
    if (uploadError) { toast.error('Upload failed'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('school-docs').getPublicUrl(path)
    const { error } = await supabase.from('documents').insert({
      title: form.title, document_type: form.document_type,
      file_url: publicUrl, uploaded_by: user?.id,
      target_roles: ['organiser', 'principal', 'vice_principal', 'teacher', 'parent', 'student']
    })
    if (error) { toast.error('Save failed'); setUploading(false); return }
    toast.success('Document uploaded')
    setShowModal(false); setForm(emptyForm); fetchDocs()
    setUploading(false)
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete document?')) return
    await supabase.from('documents').delete().eq('id', id)
    toast.success('Deleted'); fetchDocs()
  }

  const filtered = documents.filter(d => typeFilter === 'all' || d.document_type === typeFilter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-500">Circulars, syllabus, portfolios & more</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...DOC_TYPES].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              typeFilter === t ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>{t}</button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card p-5 h-32 animate-pulse bg-gray-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No documents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="card p-5 flex flex-col gap-3 group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#1e3a5f]" />
                </div>
                <button onClick={() => deleteDoc(doc.id)}
                  className="p-1 hover:bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{doc.title}</p>
                <p className="text-xs text-gray-400 mt-1">By {doc.uploader_name ?? 'Admin'}</p>
                <p className="text-xs text-gray-400">{formatDate(doc.created_at)}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`badge ${TYPE_COLORS[doc.document_type]}`}>{doc.document_type}</span>
                <a href={doc.file_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline font-medium">
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h3 className="font-bold text-lg">Upload Document</h3></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={form.document_type} onChange={e => setForm(p => ({ ...p, document_type: e.target.value }))} className="input">
                  {DOC_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">File</label>
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
                  onChange={e => setForm(p => ({ ...p, file: e.target.files?.[0] ?? null }))}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1e3a5f] file:text-white hover:file:bg-[#152a45]" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="btn-primary flex items-center gap-2">
                {uploading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
