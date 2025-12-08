import type { Person, Task } from '../types'
import { createDefaultTaskSchedule } from '../utils/tasks'

const BASE_PERSONS: Person[] = [
  { id: 'ruben', name: 'Ruben', theme: 'indigo' },
  { id: 'lise', name: 'Lise', theme: 'pink' },
]

const BASE_TASKS: Task[] = [
  { id: 'lunch', name: 'Lunch klaarmaken', schedule: createDefaultTaskSchedule(BASE_PERSONS) },
  { id: 'bag', name: 'Tas klaarmaken', schedule: createDefaultTaskSchedule(BASE_PERSONS) },
  { id: 'shoes', name: 'Schoenen in de bijkeuken', schedule: createDefaultTaskSchedule(BASE_PERSONS) },
  { id: 'coat', name: 'Jas aan de kapstok', schedule: createDefaultTaskSchedule(BASE_PERSONS) },
  { id: 'clothes', name: 'Kleren opruimen en uitkiezen', schedule: createDefaultTaskSchedule(BASE_PERSONS) },
  { id: 'dishwasher', name: 'Afwasmachine inruimen', schedule: createDefaultTaskSchedule(BASE_PERSONS) },
  { id: 'table', name: 'Tafel dekken', schedule: createDefaultTaskSchedule(BASE_PERSONS) },
]

export const buildDefaultPersons = (): Person[] =>
  BASE_PERSONS.map((person) => ({ ...person }))

export const buildDefaultTasks = (): Task[] =>
  BASE_TASKS.map((task) => ({ ...task, schedule: { ...task.schedule, days: [...task.schedule.days] } }))
