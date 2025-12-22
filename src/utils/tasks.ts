import type { Person, Task, TaskSchedule } from '../types'

const ensureDays = (days?: boolean[]): boolean[] => {
  if (!Array.isArray(days)) {
    return Array.from({ length: 7 }, () => true)
  }
  if (days.length >= 7) {
    return days.slice(0, 7)
  }
  const next = days.slice()
  while (next.length < 7) {
    next.push(true)
  }
  return next
}

export const createDefaultTaskSchedule = (persons: Person[]): TaskSchedule => ({
  days: Array.from({ length: 7 }, () => true),
  assignment: 'all',
  startPersonId: persons[0]?.id,
  personId: persons[0]?.id,
})

export const normalizeTask = (task: Task, persons: Person[]): Task => {
  const schedule = task.schedule ?? createDefaultTaskSchedule(persons)
  const normalized: TaskSchedule = {
    days: ensureDays(schedule.days),
    assignment: schedule.assignment === 'alternate' || schedule.assignment === 'person' ? schedule.assignment : 'all',
    startPersonId: schedule.startPersonId,
    personId: schedule.personId,
  }

  if (normalized.assignment === 'alternate') {
    const validStart = persons.some((person) => person.id === normalized.startPersonId)
    if (!validStart) {
      normalized.startPersonId = persons[0]?.id
    }
    normalized.personId = undefined
  } else if (normalized.assignment === 'person') {
    const validPerson = persons.some((person) => person.id === normalized.personId)
    if (!validPerson) {
      normalized.personId = persons[0]?.id
    }
    if (!normalized.personId) {
      normalized.assignment = 'all'
    }
  } else {
    normalized.startPersonId = persons[0]?.id
    normalized.personId = undefined
  }

  const current = task.schedule
  const daysEqual = Array.isArray(current?.days)
    ? current!.days.length === normalized.days.length && current!.days.every((value, index) => value === normalized.days[index])
    : false
  const assignmentEqual = current?.assignment === normalized.assignment
  const startEqual = current?.startPersonId === normalized.startPersonId
  const personEqual = current?.personId === normalized.personId

  if (task.schedule && daysEqual && assignmentEqual && startEqual && personEqual) {
    return task
  }

  return {
    ...task,
    schedule: {
      days: normalized.days.slice(),
      assignment: normalized.assignment,
      startPersonId: normalized.startPersonId,
      personId: normalized.personId,
    },
  }
}

export const normalizeTasks = (tasks: Task[], persons: Person[]): Task[] =>
  tasks.map((task) => normalizeTask(task, persons))

export const getDayIndex = (date: Date): number => {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

export const getAssignedPersonIds = (task: Task, allPersons: Person[], date: Date): string[] => {
  const schedule = task.schedule ?? createDefaultTaskSchedule(allPersons)
  const { days, assignment, startPersonId, personId } = schedule
  const dayIndex = getDayIndex(date)
  if (!days[dayIndex]) {
    return []
  }
  if (assignment === 'all') {
    return allPersons.map((person) => person.id)
  }
  if (assignment === 'person') {
    return personId ? [personId] : []
  }
  if (!allPersons.length) {
    return []
  }
  const startIndex = startPersonId
    ? allPersons.findIndex((person) => person.id === startPersonId)
    : 0
  const rotation = startIndex >= 0
    ? [...allPersons.slice(startIndex), ...allPersons.slice(0, startIndex)]
    : allPersons
  // Calculate days since epoch (Jan 1, 2024) to ensure consistent rotation across weeks
  const epoch = new Date(2024, 0, 1)
  const daysSinceEpoch = Math.floor((date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24))
  const rotatedPerson = rotation[daysSinceEpoch % rotation.length]
  return rotatedPerson ? [rotatedPerson.id] : []
}

export const isTaskActiveForPersonOnDay = (
  task: Task,
  personId: string,
  allPersons: Person[],
  date: Date,
): boolean => {
  const assigned = getAssignedPersonIds(task, allPersons, date)
  return assigned.includes(personId)
}

export const hasAnyAssignmentOnDay = (task: Task, allPersons: Person[], date: Date): boolean => {
  const assigned = getAssignedPersonIds(task, allPersons, date)
  return assigned.length > 0
}
