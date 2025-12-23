import type { Person, Task, CompletionMap, Session } from '../types'

export interface StorageProvider {
  initialize(): Promise<void>
  // Persons
  getPersons(defaults?: Person[]): Promise<Person[]>
  setPersons(persons: Person[]): Promise<void>
  // Tasks
  getTasks(defaults?: Task[]): Promise<Task[]>
  setTasks(tasks: Task[]): Promise<void>
  // Settings
  getCompletions(defaults?: CompletionMap): Promise<CompletionMap>
  setCompletions(completions: CompletionMap): Promise<void>
  getWeekTaskConfig(defaults?: Record<string, string[]>): Promise<Record<string, string[]>>
  setWeekTaskConfig(config: Record<string, string[]>): Promise<void>
  getSession(defaults?: Session | null): Promise<Session | null>
  setSession(session: Session | null): Promise<void>
  getAdminCode(defaults?: string): Promise<string>
  setAdminCode(code: string): Promise<void>
}
