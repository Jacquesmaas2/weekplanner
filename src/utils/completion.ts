import type { CompletionMap } from '../types'

const SEPARATOR = '__'

export type CompletionEntry = {
  isoDate: string
  personId: string
  taskId: string
}

export const createCompletionKey = (personId: string, taskId: string, isoDate: string): string =>
  `${isoDate}${SEPARATOR}${personId}${SEPARATOR}${taskId}`

export const parseCompletionKey = (key: string): CompletionEntry => {
  const [isoDate, personId, taskId] = key.split(SEPARATOR)
  return { isoDate, personId, taskId }
}

export const mapToEntries = (map: CompletionMap): CompletionEntry[] =>
  Object.keys(map).map((key) => parseCompletionKey(key))
