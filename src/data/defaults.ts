import type { Person, Task } from '../types'

const BASE_PERSONS: Person[] = [
  { id: 'ruben', name: 'Ruben', theme: 'indigo' },
  { id: 'lise', name: 'Lise', theme: 'pink' },
]

const BASE_TASKS: Task[] = [
  { id: 'lunch', name: 'Lunch klaarmaken' },
  { id: 'bag', name: 'Tas klaarmaken' },
  { id: 'shoes', name: 'Schoenen in de bijkeuken' },
  { id: 'coat', name: 'Jas aan de kapstok' },
  { id: 'clothes', name: 'Kleren opruimen en uitkiezen' },
  { id: 'dishwasher', name: 'Afwasmachine inruimen' },
  { id: 'table', name: 'Tafel dekken' },
]

export const buildDefaultPersons = (): Person[] =>
  BASE_PERSONS.map((person) => ({ ...person }))

export const buildDefaultTasks = (): Task[] =>
  BASE_TASKS.map((task) => ({ ...task }))
