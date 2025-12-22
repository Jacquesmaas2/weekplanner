import type { Person, Task, CompletionMap, Session } from '../types'

const STORAGE_VERSION = '1.0'
const STORAGE_PREFIX = 'weekplanner_v1_'

// Storage keys
const KEYS = {
  persons: `${STORAGE_PREFIX}persons`,
  tasks: `${STORAGE_PREFIX}tasks`,
  completions: `${STORAGE_PREFIX}completions`,
  weekTaskConfig: `${STORAGE_PREFIX}weekTaskConfig`,
  session: `${STORAGE_PREFIX}session`,
  adminCode: `${STORAGE_PREFIX}adminCode`,
  version: `${STORAGE_PREFIX}version`,
} as const

// Generic storage functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) {
      return defaultValue
    }
    return JSON.parse(stored) as T
  } catch (error) {
    console.error(`Error reading ${key}:`, error)
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing ${key}:`, error)
    throw error
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing ${key}:`, error)
  }
}

// Initialize storage version
export function initializeStorage(): void {
  const currentVersion = localStorage.getItem(KEYS.version)
  if (!currentVersion) {
    localStorage.setItem(KEYS.version, STORAGE_VERSION)
  }
}

// Persons storage
export function getPersons(defaultValue: Person[] = []): Person[] {
  return getItem(KEYS.persons, defaultValue)
}

export function setPersons(persons: Person[]): void {
  setItem(KEYS.persons, persons)
}

// Tasks storage
export function getTasks(defaultValue: Task[] = []): Task[] {
  return getItem(KEYS.tasks, defaultValue)
}

export function setTasks(tasks: Task[]): void {
  setItem(KEYS.tasks, tasks)
}

// Completions storage
export function getCompletions(defaultValue: CompletionMap = {}): CompletionMap {
  return getItem(KEYS.completions, defaultValue)
}

export function setCompletions(completions: CompletionMap): void {
  setItem(KEYS.completions, completions)
}

// Week task config storage
export function getWeekTaskConfig(defaultValue: Record<string, string[]> = {}): Record<string, string[]> {
  return getItem(KEYS.weekTaskConfig, defaultValue)
}

export function setWeekTaskConfig(config: Record<string, string[]>): void {
  setItem(KEYS.weekTaskConfig, config)
}

// Session storage
export function getSession(defaultValue: Session | null = null): Session | null {
  return getItem(KEYS.session, defaultValue)
}

export function setSession(session: Session | null): void {
  if (session === null) {
    removeItem(KEYS.session)
  } else {
    setItem(KEYS.session, session)
  }
}

// Admin code storage
export function getAdminCode(defaultValue: string = 'ouder'): string {
  return getItem(KEYS.adminCode, defaultValue)
}

export function setAdminCode(code: string): void {
  setItem(KEYS.adminCode, code)
}

// Clear all storage
export function clearAllStorage(): void {
  Object.values(KEYS).forEach(key => {
    removeItem(key)
  })
}
