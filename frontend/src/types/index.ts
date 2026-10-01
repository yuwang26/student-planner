export interface User {
  email: string
  fullName: string | null
}

export interface Course {
  id: number
  name: string
  description: string | null
  color: string | null
  homeworkCount: number
}

export type HomeworkStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'

export interface Homework {
  id: number
  title: string
  description: string | null
  dueDate: string        // ISO date string "YYYY-MM-DD"
  status: HomeworkStatus
  courseId: number
  courseName: string
  courseColor: string | null
  dueSoon: boolean
}
