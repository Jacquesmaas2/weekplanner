export type PersonTheme =
  | 'indigo'
  | 'pink'
  | 'sky'
  | 'orange'
  | 'green'
  | 'violet'
  | 'teal'
  | 'amber'

export interface Person {
  id: string
  name: string
  theme: PersonTheme
  photoUrl?: string
}

export type TaskAssignment = 'all' | 'alternate'

export interface TaskSchedule {
  days: boolean[]
  assignment: TaskAssignment
  startPersonId?: string
}

export interface Task {
  id: string
  name: string
  schedule: TaskSchedule
}

export type CompletionMap = Record<string, boolean>

export type Session =
  | { role: 'admin' }
  | { role: 'user'; personId: string }

export interface HouseholdConfig {
  householdId: string
}
