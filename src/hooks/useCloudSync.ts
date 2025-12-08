import { useCallback, useEffect, useRef, useState } from 'react'
import type { CompletionMap, Person, Task } from '../types'
import { fetchCloudState, isCloudSyncConfigured, upsertCloudState } from '../services/cloudSync'

export type CloudSyncState = {
  status: 'disabled' | 'idle' | 'syncing' | 'error'
  lastSyncedAt: number | null
  errorMessage?: string
}

const SYNC_DEBOUNCE_MS = 2500

export type HouseholdSnapshot = {
  persons: Person[]
  tasks: Task[]
  completions: CompletionMap
  weekTaskConfig: Record<string, string[]>
  adminCode: string
}

export const useCloudSync = (
  householdId: string | null,
  snapshot: HouseholdSnapshot,
  applyRemoteSnapshot: (remote: HouseholdSnapshot) => void,
) => {
  const [state, setState] = useState<CloudSyncState>(() => ({
    status: isCloudSyncConfigured ? 'idle' : 'disabled',
    lastSyncedAt: null,
    errorMessage: undefined,
  }))

  const pendingSnapshot = useRef<HouseholdSnapshot | null>(null)
  const syncTimeout = useRef<number | undefined>(undefined)
  const isMounted = useRef(true)

  const clearPendingSync = () => {
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current)
      syncTimeout.current = undefined
    }
    pendingSnapshot.current = null
  }

  useEffect(() => () => {
    isMounted.current = false
    clearPendingSync()
  }, [])

  const scheduleSync = useCallback(
    (latest: HouseholdSnapshot) => {
      if (!isCloudSyncConfigured || !householdId) {
        return
      }
      pendingSnapshot.current = latest
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current)
      }
      syncTimeout.current = window.setTimeout(async () => {
        if (!pendingSnapshot.current) {
          return
        }
        setState((current) => ({ ...current, status: 'syncing', errorMessage: undefined }))
        try {
          const payload = {
            ...pendingSnapshot.current,
            updatedAt: Date.now(),
          }
          await upsertCloudState(householdId, payload)
          if (!isMounted.current) {
            return
          }
          setState({ status: 'idle', lastSyncedAt: payload.updatedAt, errorMessage: undefined })
        } catch (error) {
          console.error(error)
          if (!isMounted.current) {
            return
          }
          setState((current) => ({
            ...current,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Opslaan mislukt.',
          }))
        } finally {
          clearPendingSync()
        }
      }, SYNC_DEBOUNCE_MS)
    },
    [householdId],
  )

  const loadInitial = useCallback(async () => {
    if (!isCloudSyncConfigured || !householdId) {
      return
    }
    setState((current) => ({ ...current, status: 'syncing', errorMessage: undefined }))
    try {
      const remote = await fetchCloudState(householdId)
      if (remote) {
        applyRemoteSnapshot({
          persons: remote.persons,
          tasks: remote.tasks,
          completions: remote.completions,
          weekTaskConfig: remote.weekTaskConfig,
          adminCode: remote.adminCode,
        })
        if (isMounted.current) {
          setState({ status: 'idle', lastSyncedAt: remote.updatedAt, errorMessage: undefined })
        }
      } else if (isMounted.current) {
        setState({ status: 'idle', lastSyncedAt: null, errorMessage: undefined })
      }
    } catch (error) {
      console.error(error)
      if (isMounted.current) {
        setState({
          status: 'error',
          lastSyncedAt: null,
          errorMessage: error instanceof Error ? error.message : 'Ophalen mislukt.',
        })
      }
    }
  }, [householdId, applyRemoteSnapshot])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (!isCloudSyncConfigured || !householdId) {
      return
    }
    scheduleSync(snapshot)
  }, [snapshot, scheduleSync, householdId])

  return state
}
