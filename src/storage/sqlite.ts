import { createClient } from '@libsql/client-wasm'
import type { Person, Task, CompletionMap, Session } from '../types'
import type { StorageProvider } from './provider'

const url = import.meta.env.VITE_LIBSQL_URL as string | undefined
const authToken = import.meta.env.VITE_LIBSQL_TOKEN as string | undefined

let client: Awaited<ReturnType<typeof createClient>> | undefined

async function getClient() {
  if (!url || !authToken) {
    throw new Error('SQLite not configured')
  }
  if (!client) {
    client = createClient({ url, authToken })
  }
  return client
}

async function exec(sql: string, params?: Record<string, unknown>) {
  const c = await getClient()
  const args = params ? Object.values(params) : undefined
  return c.execute(sql, args as any)
}

function toJSON<T>(rowValue: unknown, fallback: T): T {
  try {
    if (typeof rowValue !== 'string') return fallback
    return JSON.parse(rowValue) as T
  } catch {
    return fallback
  }
}

export const sqliteProvider: StorageProvider = {
  async initialize() {
    if (!url || !authToken) return
    await exec(`CREATE TABLE IF NOT EXISTS persons (id TEXT PRIMARY KEY, json TEXT NOT NULL)`)
    await exec(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, json TEXT NOT NULL)`)
    await exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`)
  },

  async getPersons(defaults: Person[] = []) {
    if (!url || !authToken) return defaults
    const res = await exec('SELECT json FROM persons')
    if (!res.rows.length) return defaults
    return res.rows.map(r => toJSON<Person>(r.json, defaults[0]!))
  },
  
  async setPersons(persons: Person[]) {
    await exec('DELETE FROM persons')
    for (const p of persons) {
      await exec('INSERT INTO persons (id, json) VALUES (?, ?)', { id: p.id, json: JSON.stringify(p) })
    }
  },

  async getTasks(defaults: Task[] = []) {
    if (!url || !authToken) return defaults
    const res = await exec('SELECT json FROM tasks')
    if (!res.rows.length) return defaults
    return res.rows.map(r => toJSON<Task>(r.json, defaults[0]!))
  },
  
  async setTasks(tasks: Task[]) {
    await exec('DELETE FROM tasks')
    for (const t of tasks) {
      await exec('INSERT INTO tasks (id, json) VALUES (?, ?)', { id: t.id, json: JSON.stringify(t) })
    }
  },

  async getCompletions(defaults: CompletionMap = {}) {
    if (!url || !authToken) return defaults
    const res = await exec('SELECT value FROM settings WHERE key = ?', { key: 'completions' })
    if (!res.rows.length) return defaults
    return toJSON<CompletionMap>(res.rows[0].value, defaults)
  },
  
  async setCompletions(completions: CompletionMap) {
    await exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', { key: 'completions', value: JSON.stringify(completions) })
  },

  async getWeekTaskConfig(defaults: Record<string, string[]> = {}) {
    if (!url || !authToken) return defaults
    const res = await exec('SELECT value FROM settings WHERE key = ?', { key: 'weekTaskConfig' })
    if (!res.rows.length) return defaults
    return toJSON<Record<string, string[]>>(res.rows[0].value, defaults)
  },
  
  async setWeekTaskConfig(config: Record<string, string[]>) {
    await exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', { key: 'weekTaskConfig', value: JSON.stringify(config) })
  },

  async getSession(defaults: Session | null = null) {
    if (!url || !authToken) return defaults
    const res = await exec('SELECT value FROM settings WHERE key = ?', { key: 'session' })
    if (!res.rows.length) return defaults
    return toJSON<Session | null>(res.rows[0].value, defaults)
  },
  
  async setSession(session: Session | null) {
    await exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', { key: 'session', value: JSON.stringify(session) })
  },

  async getAdminCode(defaults: string = 'ouder') {
    if (!url || !authToken) return defaults
    const res = await exec('SELECT value FROM settings WHERE key = ?', { key: 'adminCode' })
    if (!res.rows.length) return defaults
    return toJSON<string>(res.rows[0].value, defaults)
  },
  
  async setAdminCode(code: string) {
    await exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', { key: 'adminCode', value: JSON.stringify(code) })
  },
}
