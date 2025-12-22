import Dexie, { type EntityTable } from 'dexie'
import type { Person, Task } from '../types'

interface AppSettings {
  key: string
  value: unknown
}

class WeekPlannerDB extends Dexie {
  persons!: EntityTable<Person, 'id'>
  tasks!: EntityTable<Task, 'id'>
  settings!: EntityTable<AppSettings, 'key'>

  constructor() {
    super('WeekPlannerDB')
    
    this.version(1).stores({
      persons: 'id, name',
      tasks: 'id, name',
      settings: 'key',
    })
  }
}

export const db = new WeekPlannerDB()

// Helper functions for settings storage
export const getSettings = async <T>(key: string, defaultValue: T): Promise<T> => {
  const setting = await db.settings.get(key)
  return setting ? (setting.value as T) : defaultValue
}

export const setSettings = async <T>(key: string, value: T): Promise<void> => {
  await db.settings.put({ key, value })
}

// Migration helper to move data from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    // Check if migration already done
    const migrated = await getSettings('migrated_from_localstorage', false)
    if (migrated) {
      return
    }

    // Migrate persons
    const personsJson = localStorage.getItem('weekplanner_persons')
    if (personsJson) {
      const persons = JSON.parse(personsJson) as Person[]
      await db.persons.bulkPut(persons)
      localStorage.removeItem('weekplanner_persons')
    }

    // Migrate tasks
    const tasksJson = localStorage.getItem('weekplanner_tasks')
    if (tasksJson) {
      const tasks = JSON.parse(tasksJson) as Task[]
      await db.tasks.bulkPut(tasks)
      localStorage.removeItem('weekplanner_tasks')
    }

    // Migrate completions
    const completionsJson = localStorage.getItem('weekplanner_completions')
    if (completionsJson) {
      const completions = JSON.parse(completionsJson)
      await setSettings('completions', completions)
      localStorage.removeItem('weekplanner_completions')
    }

    // Migrate weekTaskConfig
    const weekTaskConfigJson = localStorage.getItem('weekplanner_week_tasks')
    if (weekTaskConfigJson) {
      const weekTaskConfig = JSON.parse(weekTaskConfigJson)
      await setSettings('weekTaskConfig', weekTaskConfig)
      localStorage.removeItem('weekplanner_week_tasks')
    }

    // Migrate session
    const sessionJson = localStorage.getItem('weekplanner_session')
    if (sessionJson) {
      const session = JSON.parse(sessionJson)
      await setSettings('session', session)
      localStorage.removeItem('weekplanner_session')
    }

    // Migrate adminCode
    const adminCodeJson = localStorage.getItem('weekplanner_admin_code')
    if (adminCodeJson) {
      const adminCode = JSON.parse(adminCodeJson)
      await setSettings('adminCode', adminCode)
      localStorage.removeItem('weekplanner_admin_code')
    }

    // Migrate household config
    const householdJson = localStorage.getItem('weekplanner_household')
    if (householdJson) {
      const household = JSON.parse(householdJson)
      await setSettings('household', household)
      localStorage.removeItem('weekplanner_household')
    }

    // Mark migration as complete
    await setSettings('migrated_from_localstorage', true)
  } catch (error) {
    console.error('Migration from localStorage failed:', error)
  }
}

// Initialize database and run migration
export const initializeDatabase = async () => {
  await migrateFromLocalStorage()
  
  // Check if this is first run (no data at all)
  const initialized = await getSettings('database_initialized', false)
  if (!initialized) {
    // Database is empty, mark as initialized but don't add defaults
    // Let the app handle populating defaults through the UI
    await setSettings('database_initialized', true)
  }
}
