import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Course } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface FormState { name: string; description: string; color: string }
const empty: FormState = { name: '', description: '', color: COLORS[0] }

export default function CoursesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; course?: Course } | null>(null)
  const [form, setForm] = useState<FormState>(empty)

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then(r => r.data),
  })

  const openCreate = () => { setForm(empty); setModal({ mode: 'create' }) }
  const openEdit = (c: Course) => {
    setForm({ name: c.name, description: c.description || '', color: c.color || COLORS[0] })
    setModal({ mode: 'edit', course: c })
  }

  const save = useMutation({
    mutationFn: () => modal?.mode === 'edit' && modal.course
      ? api.put(`/courses/${modal.course.id}`, form)
      : api.post('/courses', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); setModal(null) },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/courses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })

  return (
    <div>
      <h1 className="page-title">Courses</h1>
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: 14, color: '#6b7280' }}>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add course</button>
        </div>
        {isLoading ? <p className="empty">Loading…</p> : courses.length === 0 ? (
          <p className="empty">No courses yet. Add your first course!</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Description</th><th>Homework</th><th></th></tr></thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className="color-dot" style={{ background: c.color || '#94a3b8' }} />
                      <strong>{c.name}</strong>
                    </td>
                    <td style={{ color: '#6b7280' }}>{c.description || '—'}</td>
                    <td>{c.homeworkCount}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => confirm(`Delete "${c.name}"?`) && del.mutate(c.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{modal.mode === 'create' ? 'Add course' : 'Edit course'}</h2>
            <div className="form-group">
              <label>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                      outline: form.color === c ? '3px solid #1f2937' : '2px solid transparent', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => save.mutate()} disabled={!form.name.trim() || save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
