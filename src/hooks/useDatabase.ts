import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, setSettings } from '../db/database'
import type { Person, Task } from '../types'

// Hook for managing persons in IndexedDB
export const usePersonsDB = (defaultValue: Person[]) => {
  const persons = useLiveQuery(() => db.persons.toArray(), [], defaultValue)
  
  const setPersons = async (updater: Person[] | ((current: Person[]) => Person[])) => {
    const current = await db.persons.toArray()
    const next = typeof updater === 'function' ? updater(current) : updater
    
    // Clear and bulk insert for atomic update
    await db.transaction('rw', db.persons, async () => {
      await db.persons.clear()
      await db.persons.bulkAdd(next)
    })
  }

  return [persons, setPersons] as const
}

// Hook for managing tasks in IndexedDB
export const useTasksDB = (defaultValue: Task[]) => {
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], defaultValue)
  
  const setTasks = async (updater: Task[] | ((current: Task[]) => Task[])) => {
    const current = await db.tasks.toArray()
    const next = typeof updater === 'function' ? updater(current) : updater
    
    // Clear and bulk insert for atomic update
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear()
      await db.tasks.bulkAdd(next)
    })
  }

  return [tasks, setTasks] as const
}

// Generic hook for settings stored in IndexedDB
export function useSettingsDB<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load initial value
  useEffect(() => {
    let mounted = true
    
    const loadValue = async () => {
      const stored = await getSettings(key, defaultValue)
      if (mounted) {
        setValue(stored)
        setIsLoaded(true)
      }
    }

    void loadValue()

    return () => {
      mounted = false
    }
  }, [key, defaultValue])

  // Update function
  const updateValue = async (updater: T | ((current: T) => T)) => {
    const current = await getSettings(key, defaultValue)
    const next = typeof updater === 'function' ? (updater as (current: T) => T)(current) : updater
    await setSettings(key, next)
    setValue(next)
  }

  return [value, updateValue, isLoaded] as const
}
