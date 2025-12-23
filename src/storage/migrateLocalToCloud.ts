import * as local from './localStorage'
import { sqliteProvider } from './sqlite'
import type { Person, Task, CompletionMap, Session } from '../types'

export type MigrationSummary = {
  persons: number
  tasks: number
  completionsKeys: number
  weekConfigs: number
  sessionPresent: boolean
  adminCodeSet: boolean
}

function isSqliteConfigured() {
  return Boolean(import.meta.env.VITE_LIBSQL_URL && import.meta.env.VITE_LIBSQL_TOKEN)
}

export async function migrateLocalToCloud(): Promise<MigrationSummary> {
  if (!isSqliteConfigured()) {
    throw new Error('SQLite/Turso not configured. Set VITE_LIBSQL_URL and VITE_LIBSQL_TOKEN in .env.')
  }

  await sqliteProvider.initialize()

  const persons: Person[] = local.getPersons([])
  const tasks: Task[] = local.getTasks([])
  const completions: CompletionMap = local.getCompletions({})
  const weekTaskConfig: Record<string, string[]> = local.getWeekTaskConfig({})
  const session: Session | null = local.getSession(null)
  const adminCode: string = local.getAdminCode('ouder')

  await sqliteProvider.setPersons(persons)
  await sqliteProvider.setTasks(tasks)
  await sqliteProvider.setCompletions(completions)
  await sqliteProvider.setWeekTaskConfig(weekTaskConfig)
  await sqliteProvider.setSession(session)
  await sqliteProvider.setAdminCode(adminCode)

  return {
    persons: persons.length,
    tasks: tasks.length,
    completionsKeys: Object.keys(completions).length,
    weekConfigs: Object.keys(weekTaskConfig).length,
    sessionPresent: session !== null,
    adminCodeSet: typeof adminCode === 'string' && adminCode.length > 0,
  }
}
