import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Homework } from '../types'
import { format, parseISO, isToday, isPast, startOfDay } from 'date-fns'

function isOverdue(dueDate: string) {
  return isPast(startOfDay(parseISO(dueDate))) && !isToday(parseISO(dueDate))
}

function dateLabel(dueDate: string) {
  if (isOverdue(dueDate)) return 'OVERDUE'
  if (isToday(parseISO(dueDate))) return 'TODAY'
  return null
}

export default function Dashboard() {
  const { data: allHomework = [], isLoading } = useQuery<Homework[]>({
    queryKey: ['homework'],
    queryFn: () => api.get('/homework').then(r => r.data),
    refetchInterval: 60_000,
  })

  // Only show: overdue and due today — exclude Done
  const dashboardItems = allHomework.filter(h => {
    if (h.status === 'DONE') return false
    const d = parseISO(h.dueDate)
    return isOverdue(h.dueDate) || isToday(d)
  })

  const overdueItems = dashboardItems.filter(h => isOverdue(h.dueDate))
  const todayItems   = dashboardItems.filter(h => isToday(parseISO(h.dueDate)))

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      {/* Banner — only shown when something urgent exists */}
      {!isLoading && dashboardItems.length > 0 && (
        <div className="notif-banner">
          <div className="notif-banner-title">⚠️ Homework requiring attention</div>
          {dashboardItems.map(hw => (
            <div key={hw.id} className="notif-item">
              <span className="color-dot" style={{ background: hw.courseColor || '#94a3b8' }} />
              <span style={isOverdue(hw.dueDate) ? { fontWeight: 700, color: '#b91c1c' } : {}}>
                {hw.title}
              </span>
              {' '}— {hw.courseName}
              <span
                className="badge"
                style={isOverdue(hw.dueDate)
                  ? { background: '#fca5a5', color: '#7f1d1d', marginLeft: 6 }
                  : { marginLeft: 6 }}
              >
                {dateLabel(hw.dueDate)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            Upcoming homework
            {dashboardItems.length > 0 && (
              <span className="badge" style={{ marginLeft: 8, background: '#fca5a5', color: '#7f1d1d' }}>
                {dashboardItems.length} urgent
              </span>
            )}
          </h2>
          <Link to="/homework" className="btn btn-ghost btn-sm">View all</Link>
        </div>

        {isLoading ? (
          <p className="empty">Loading…</p>
        ) : dashboardItems.length === 0 ? (
          <p className="empty">No overdue or due-today homework 🎉</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Due date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Overdue — bold red */}
                {overdueItems.map(hw => (
                  <tr key={hw.id} className="due-soon-row">
                    <td>
                      <span style={{ fontWeight: 700, color: '#b91c1c' }}>{hw.title}</span>
                      <span className="badge" style={{ marginLeft: 6, background: '#fca5a5', color: '#7f1d1d' }}>! Overdue</span>
                    </td>
                    <td>
                      <span className="color-dot" style={{ background: hw.courseColor || '#94a3b8' }} />
                      {hw.courseName}
                    </td>
                    <td style={{ color: '#b91c1c', fontWeight: 700 }}>
                      {format(parseISO(hw.dueDate), 'MMM d, yyyy')}
                    </td>
                    <td><span className={`status status-${hw.status}`}>{hw.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
                {/* Due today */}
                {todayItems.map(hw => (
                  <tr key={hw.id} className="due-soon-row">
                    <td>{hw.title}</td>
                    <td>
                      <span className="color-dot" style={{ background: hw.courseColor || '#94a3b8' }} />
                      {hw.courseName}
                    </td>
                    <td>
                      {format(parseISO(hw.dueDate), 'MMM d, yyyy')}
                      <span className="badge" style={{ marginLeft: 6 }}>TODAY</span>
                    </td>
                    <td><span className={`status status-${hw.status}`}>{hw.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
