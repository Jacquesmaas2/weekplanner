import type { StorageProvider } from './provider'
import { sqliteProvider } from './sqlite'
import * as local from './localStorage'
import type { Person, Task, CompletionMap, Session } from '../types'

function isSqliteConfigured() {
  return Boolean(import.meta.env.VITE_LIBSQL_URL && import.meta.env.VITE_LIBSQL_TOKEN)
}

class LocalProviderAdapter implements StorageProvider {
  async initialize() {}
  async getPersons(defaults: Person[] = []) { return local.getPersons(defaults) }
  async setPersons(persons: Person[]) { return local.setPersons(persons) }
  async getTasks(defaults: Task[] = []) { return local.getTasks(defaults) }
  async setTasks(tasks: Task[]) { return local.setTasks(tasks) }
  async getCompletions(defaults: CompletionMap = {}) { return local.getCompletions(defaults) }
  async setCompletions(c: CompletionMap) { return local.setCompletions(c) }
  async getWeekTaskConfig(defaults: Record<string, string[]> = {}) { return local.getWeekTaskConfig(defaults) }
  async setWeekTaskConfig(cfg: Record<string, string[]>) { return local.setWeekTaskConfig(cfg) }
  async getSession(defaults: Session | null = null) { return local.getSession(defaults) }
  async setSession(s: Session | null) { return local.setSession(s) }
  async getAdminCode(defaults: string = 'ouder') { return local.getAdminCode(defaults) }
  async setAdminCode(code: string) { return local.setAdminCode(code) }
}

export async function getProvider(): Promise<StorageProvider> {
  if (isSqliteConfigured()) {
    await sqliteProvider.initialize()
    // migration: if sqlite empty, migrate local -> sqlite
    const persons = await sqliteProvider.getPersons([])
    if (persons.length === 0) {
      const lp = new LocalProviderAdapter()
      const lPersons = await lp.getPersons([])
      const lTasks = await lp.getTasks([])
      const lCompletions = await lp.getCompletions({})
      const lWeek = await lp.getWeekTaskConfig({})
      const lSession = await lp.getSession(null)
      const lCode = await lp.getAdminCode('ouder')
      await sqliteProvider.setPersons(lPersons)
      await sqliteProvider.setTasks(lTasks)
      await sqliteProvider.setCompletions(lCompletions)
      await sqliteProvider.setWeekTaskConfig(lWeek)
      await sqliteProvider.setSession(lSession)
      await sqliteProvider.setAdminCode(lCode)
    }
    return sqliteProvider
  }
  return new LocalProviderAdapter()
}
