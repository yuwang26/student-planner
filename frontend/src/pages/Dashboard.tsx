import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Homework } from '../types'
import { format, parseISO, isToday, isPast, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns'

function isOverdue(dueDate: string) {
  return isPast(startOfDay(parseISO(dueDate))) && !isToday(parseISO(dueDate))
}

export default function Dashboard() {
  const { data: allHomework = [], isLoading } = useQuery<Homework[]>({
    queryKey: ['homework'],
    queryFn: () => api.get('/homework').then(r => r.data),
    refetchInterval: 60_000,
  })

  const now = new Date()

  const overdueItems  = allHomework.filter(h => h.status !== 'DONE' && isOverdue(h.dueDate))
  const todayItems    = allHomework.filter(h => h.status !== 'DONE' && isToday(parseISO(h.dueDate)))
  // This week = tomorrow through 7 days from now, excluding today and overdue
  const upcomingItems = allHomework.filter(h => {
    if (h.status === 'DONE') return false
    const d = parseISO(h.dueDate)
    return isWithinInterval(d, { start: startOfDay(addDays(now, 1)), end: endOfDay(addDays(now, 7)) })
  }).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())

  const HomeworkTable = ({ items, emptyText }: { items: Homework[], emptyText: string }) => (
    items.length === 0 ? (
      <p className="empty">{emptyText}</p>
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
            {items.map(hw => (
              <tr key={hw.id} className="due-soon-row">
                <td>
                  <span style={isOverdue(hw.dueDate) ? { fontWeight: 700, color: '#b91c1c' } : {}}>
                    {hw.title}
                  </span>
                </td>
                <td>
                  <span className="color-dot" style={{ background: hw.courseColor || '#94a3b8' }} />
                  {hw.courseName}
                </td>
                <td style={isOverdue(hw.dueDate) ? { color: '#b91c1c', fontWeight: 700 } : {}}>
                  {format(parseISO(hw.dueDate), 'MMM d, yyyy')}
                </td>
                <td><span className={`status status-${hw.status}`}>{hw.status.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  )

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      {/* Overdue card */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#b91c1c' }}>
            🚨 Overdue
            {overdueItems.length > 0 && (
              <span className="badge" style={{ marginLeft: 8, background: '#fca5a5', color: '#7f1d1d' }}>
                {overdueItems.length}
              </span>
            )}
          </h2>
          <Link to="/homework" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        {isLoading ? (
          <p className="empty">Loading…</p>
        ) : (
          <HomeworkTable items={overdueItems} emptyText="No overdue homework 🎉" />
        )}
      </div>

      {/* Due today card */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            📅 Due Today
            {todayItems.length > 0 && (
              <span className="badge" style={{ marginLeft: 8, background: '#bfdbfe', color: '#1e40af' }}>
                {todayItems.length}
              </span>
            )}
          </h2>
        </div>
        {isLoading ? (
          <p className="empty">Loading…</p>
        ) : (
          <HomeworkTable items={todayItems} emptyText="Nothing due today 🎉" />
        )}
      </div>

      {/* Upcoming this week card */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            📆 Upcoming This Week
            {upcomingItems.length > 0 && (
              <span className="badge" style={{ marginLeft: 8, background: '#d1fae5', color: '#065f46' }}>
                {upcomingItems.length}
              </span>
            )}
          </h2>
          <Link to="/homework" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        {isLoading ? (
          <p className="empty">Loading…</p>
        ) : (
          <HomeworkTable items={upcomingItems} emptyText="Nothing else due this week 🎉" />
        )}
      </div>
    </div>
  )
}
