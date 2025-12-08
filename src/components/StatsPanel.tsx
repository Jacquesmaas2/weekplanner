import type { Person, Task } from '../types'
import type { CompletionEntry } from '../utils/completion'
import {
  addDays,
  clampRangeEndToToday,
  endOfMonth,
  endOfYear,
  inclusiveDayCount,
  isWithinRange,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toISODate,
} from '../utils/date'

type PeriodStats = {
  label: string
  completed: number
  totalPossible: number
  completionRate: number
  perPerson: Array<{
    person: Person
    completed: number
    total: number
    rate: number
  }>
  perTask: Array<{
    task: Task
    completed: number
  }>
}

type StatsPanelProps = {
  persons: Person[]
  tasks: Task[]
  entries: CompletionEntry[]
  referenceDate: Date
  weekTaskConfig: Record<string, string[]>
}

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`

const progressClass = (rate: number) => {
  const clamped = Math.min(Math.max(rate, 0), 1)
  const bucket = Math.round(clamped * 20)
  return `stats-progress__bar stats-progress__bar--${bucket}`
}

const computePeriodStats = (
  persons: Person[],
  tasks: Task[],
  entries: CompletionEntry[],
  start: Date,
  end: Date,
  label: string,
  weekTaskConfig: Record<string, string[]>,
): PeriodStats => {
  const cappedEnd = clampRangeEndToToday(end)

  if (tasks.length === 0) {
    return {
      label,
      completed: 0,
      totalPossible: 0,
      completionRate: 0,
      perPerson: persons.map((person) => ({ person, completed: 0, total: 0, rate: 0 })),
      perTask: [],
    }
  }

  if (cappedEnd < start) {
    return {
      label,
      completed: 0,
      totalPossible: 0,
      completionRate: 0,
      perPerson: persons.map((person) => ({ person, completed: 0, total: 0, rate: 0 })),
      perTask: [],
    }
  }

  const defaultTaskIds = tasks.map((task) => task.id)
  const taskLookup = new Map(tasks.map((task) => [task.id, task]))
  const dayCount = inclusiveDayCount(start, cappedEnd)
  const entriesInRange = entries.filter((entry) => isWithinRange(entry.isoDate, start, cappedEnd))

  let totalPossible = 0
  const perPersonTotals = new Map<string, number>()
  const perTaskCompletion = new Map<string, number>()

  for (let index = 0; index < dayCount; index += 1) {
    const currentDay = addDays(start, index)
    const weekKey = toISODate(startOfWeek(currentDay))
    const configured = weekTaskConfig[weekKey]
    const activeIdsSource = configured && configured.length ? configured : defaultTaskIds
    const activeIds = activeIdsSource.filter((id) => taskLookup.has(id))
    const effectiveIds = activeIds.length ? activeIds : defaultTaskIds
    totalPossible += effectiveIds.length * persons.length
    persons.forEach((person) => {
      perPersonTotals.set(person.id, (perPersonTotals.get(person.id) ?? 0) + effectiveIds.length)
    })
  }

  entriesInRange.forEach((entry) => {
    perTaskCompletion.set(entry.taskId, (perTaskCompletion.get(entry.taskId) ?? 0) + 1)
  })

  const completed = entriesInRange.length
  const completionRate = totalPossible > 0 ? completed / totalPossible : 0

  const perPerson = persons.map((person) => {
    const personCompleted = entriesInRange.filter((entry) => entry.personId === person.id).length
    const total = perPersonTotals.get(person.id) ?? 0
    return {
      person,
      completed: personCompleted,
      total,
      rate: total > 0 ? personCompleted / total : 0,
    }
  })

  const perTask = tasks.map((task) => ({
    task,
    completed: perTaskCompletion.get(task.id) ?? 0,
  }))

  return {
    label,
    completed,
    totalPossible,
    completionRate,
    perPerson,
    perTask,
  }
}

export function StatsPanel({ persons, tasks, entries, referenceDate, weekTaskConfig }: StatsPanelProps) {
  const weekStart = startOfWeek(referenceDate)
  const weekEnd = addDays(weekStart, 6)
  const monthStart = startOfMonth(referenceDate)
  const monthEnd = endOfMonth(referenceDate)
  const yearStart = startOfYear(referenceDate)
  const yearEnd = endOfYear(referenceDate)

  const periods = [
    computePeriodStats(persons, tasks, entries, weekStart, weekEnd, 'Deze week', weekTaskConfig),
    computePeriodStats(persons, tasks, entries, monthStart, monthEnd, 'Deze maand', weekTaskConfig),
    computePeriodStats(persons, tasks, entries, yearStart, yearEnd, 'Dit jaar', weekTaskConfig),
  ]

  return (
    <div className="stats-grid">
      {periods.map((period) => (
        <section className="stats-card" key={period.label}>
          <header className="stats-card__header">
            <h3>{period.label}</h3>
            <p className="stats-card__headline">
              {period.completed} van {period.totalPossible} taken voltooid
            </p>
            <p className="stats-card__rate">{formatPercent(period.completionRate)} voltooid</p>
          </header>
          <div className="stats-card__body">
            <div className="stats-section">
              <h4>Per persoon</h4>
              <ul>
                {period.perPerson.map(({ person, completed, total, rate }) => (
                  <li key={person.id} className={`theme-${person.theme}`}>
                    <div className="stats-person">
                      <span className="stats-person__dot" />
                      <span className="stats-person__name">{person.name}</span>
                      <span className="stats-person__value">
                        {completed}
                        {total ? ` / ${total}` : ''}
                      </span>
                    </div>
                    <div className="stats-progress" aria-hidden="true">
                      <div className={progressClass(rate)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="stats-section">
              <h4>Populaire taken</h4>
              <ul>
                {period.perTask
                  .slice()
                  .sort((a, b) => b.completed - a.completed)
                  .map(({ task, completed }) => (
                    <li key={task.id} className="stats-task">
                      <span>{task.name}</span>
                      <span className="stats-task__count">{completed}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
