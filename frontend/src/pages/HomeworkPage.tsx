import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Course, Homework, HomeworkStatus } from '../types'
import { format, parseISO } from 'date-fns'

interface FormState {
  title: string
  description: string
  dueDate: string
  courseId: string
  status: HomeworkStatus
}
const empty: FormState = { title: '', description: '', dueDate: '', courseId: '', status: 'PENDING' }

export default function HomeworkPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; hw?: Homework } | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [filterCourse, setFilterCourse] = useState('')

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then(r => r.data),
  })

  const { data: homework = [], isLoading } = useQuery<Homework[]>({
    queryKey: ['homework'],
    queryFn: () => api.get('/homework').then(r => r.data),
  })

  const filtered = filterCourse
    ? homework.filter(h => String(h.courseId) === filterCourse)
    : homework

  const openCreate = () => {
    setForm({ ...empty, courseId: courses[0] ? String(courses[0].id) : '' })
    setModal({ mode: 'create' })
  }
  const openEdit = (hw: Homework) => {
    setForm({ title: hw.title, description: hw.description || '', dueDate: hw.dueDate,
      courseId: String(hw.courseId), status: hw.status })
    setModal({ mode: 'edit', hw })
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, courseId: Number(form.courseId) }
      return modal?.mode === 'edit' && modal.hw
        ? api.put(`/homework/${modal.hw.id}`, payload)
        : api.post('/homework', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] })
      setModal(null)
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/homework/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homework'] }),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: HomeworkStatus }) =>
      api.put(`/homework/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homework'] }),
  })

  return (
    <div>
      <h1 className="page-title">Homework</h1>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
              style={{ width: 'auto', fontSize: 13 }}>
              <option value="">All courses</option>
              {courses.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}
            disabled={courses.length === 0} title={courses.length === 0 ? 'Add a course first' : ''}>
            + Add homework
          </button>
        </div>

        {courses.length === 0 && (
          <p className="empty">Add a course first before adding homework.</p>
        )}

        {isLoading ? <p className="empty">Loading…</p> : filtered.length === 0 && courses.length > 0 ? (
          <p className="empty">No homework yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(hw => (
                  <tr key={hw.id} className={hw.dueSoon && hw.status !== 'DONE' ? 'due-soon-row' : ''}>
                    <td>
                      {hw.title}
                      {hw.dueSoon && hw.status !== 'DONE' && (
                        <span className="badge" style={{ marginLeft: 6 }}>Due soon</span>
                      )}
                    </td>
                    <td>
                      <span className="color-dot" style={{ background: hw.courseColor || '#94a3b8' }} />
                      {hw.courseName}
                    </td>
                    <td>{format(parseISO(hw.dueDate), 'MMM d, yyyy')}</td>
                    <td>
                      <select value={hw.status}
                        onChange={e => setStatus.mutate({ id: hw.id, status: e.target.value as HomeworkStatus })}
                        style={{ width: 'auto', fontSize: 12, padding: '3px 6px' }}>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(hw)}>Edit</button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => confirm(`Delete "${hw.title}"?`) && del.mutate(hw.id)}>
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
            <h2 className="modal-title">{modal.mode === 'create' ? 'Add homework' : 'Edit homework'}</h2>
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Course *</label>
              <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                {courses.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due date *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            {modal.mode === 'edit' && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as HomeworkStatus }))}>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary"
                onClick={() => save.mutate()}
                disabled={!form.title.trim() || !form.dueDate || !form.courseId || save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
