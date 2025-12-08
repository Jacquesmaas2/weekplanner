import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CompletionMap, Person, Task } from '../types'

export type CloudStatePayload = {
  persons: Person[]
  tasks: Task[]
  completions: CompletionMap
  weekTaskConfig: Record<string, string[]>
  adminCode: string
  updatedAt: number
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCloudSyncConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const TABLE_NAME = 'weekplanner_states'

let client: SupabaseClient | null = null

const ensureClient = (): SupabaseClient | null => {
  if (!isCloudSyncConfigured) {
    return null
  }
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: false,
      },
    })
  }
  return client
}

type FetchResult = {
  payload: CloudStatePayload
  updated_at: string
}

export const fetchCloudState = async (householdId: string): Promise<CloudStatePayload | null> => {
  const supabase = ensureClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('payload, updated_at')
    .eq('id', householdId)
    .maybeSingle<FetchResult>()

  if (error) {
    console.error('Failed to fetch cloud state', error)
    throw new Error('Kan de gedeelde gegevens niet ophalen.')
  }

  if (!data?.payload) {
    return null
  }

  return {
    ...data.payload,
    updatedAt: data.payload.updatedAt ?? new Date(data.updated_at).getTime(),
  }
}

export const upsertCloudState = async (householdId: string, payload: CloudStatePayload) => {
  const supabase = ensureClient()
  if (!supabase) {
    return
  }

  const { error } = await supabase.from(TABLE_NAME).upsert({
    id: householdId,
    payload,
    updated_at: new Date(payload.updatedAt).toISOString(),
  })

  if (error) {
    console.error('Failed to save cloud state', error)
    throw new Error('Kan de gedeelde gegevens niet opslaan.')
  }
}
