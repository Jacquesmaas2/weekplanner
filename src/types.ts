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
}

export interface Task {
  id: string
  name: string
}

export type CompletionMap = Record<string, boolean>
