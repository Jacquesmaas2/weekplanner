import { useEffect, useState } from 'react'

export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) {
        return defaultValue
      }
      return JSON.parse(stored) as T
    } catch (error) {
      console.warn(`Kon waarde voor ${key} niet lezen uit localStorage.`, error)
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.warn(`Kon waarde voor ${key} niet bewaren in localStorage.`, error)
    }
  }, [key, state])

  return [state, setState] as const
}
