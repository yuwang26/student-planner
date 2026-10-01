export interface User {
  id: string
  email: string
  full_name?: string
  notification_prefs: NotificationPrefs
  created_at: string
}

export interface NotificationPrefs {
  email: boolean
  sms: boolean
  browser_push: boolean
  mobile_push: boolean
  lead_time_hours: number
}

export interface Course {
  id: string
  user_id: string
  name: string
  code?: string
  color?: string
}

export interface Homework {
  id: string
  course_id: string
  title: string
  description?: string
  due_date: string
  estimated_hours: number
  priority: 1 | 2 | 3
  status: 'pending' | 'in_progress' | 'done'
}

export interface StudyBlock {
  id: string
  homework_id: string
  start_time: string
  end_time: string
}

export interface StudyPlan {
  id: string
  generated_at: string
  blocks: StudyBlock[]
}
