import type { Person, Task } from '../types'
import { formatDayLabel, toISODate } from '../utils/date'
import { getAssignedPersonIds } from '../utils/tasks'

type PlannerGridProps = {
  persons: Person[]
  allPersons: Person[]
  tasks: Task[]
  weekDays: Date[]
  todayIso: string
  isCompleted: (personId: string, taskId: string, isoDate: string) => boolean
  onToggle: (personId: string, taskId: string, isoDate: string) => void
}

export function PlannerGrid({ persons, allPersons, tasks, weekDays, todayIso, isCompleted, onToggle }: PlannerGridProps) {
  if (!tasks.length) {
    return <p className="planner-empty">Er zijn geen actieve taken voor deze week.</p>
  }

  return (
    <div className="planner-grid">
      {persons.map((person) => (
        <section className={`planner-person theme-${person.theme}`} key={person.id}>
          <header className="planner-person__header">
            <div className="planner-person__avatar">
              {person.photoUrl ? (
                <img src={person.photoUrl} alt={`Foto van ${person.name}`} />
              ) : (
                <span className="planner-person__dot" aria-hidden="true" />
              )}
            </div>
            <h2>{person.name}</h2>
          </header>
          <div className="planner-table" role="grid" aria-label={`Takenoverzicht voor ${person.name}`}>
            <div className="planner-row planner-row--header" role="row">
              <span className="planner-cell planner-cell--task" role="columnheader">
                Taak
              </span>
              {weekDays.map((day) => {
                const isoDate = toISODate(day)
                const isToday = isoDate === todayIso
                const classes = ['planner-cell', 'planner-cell--day']
                if (isToday) {
                  classes.push('planner-cell--today')
                }
                return (
                  <span className={classes.join(' ')} role="columnheader" key={day.toISOString()}>
                    {formatDayLabel(day)}
                  </span>
                )
              })}
            </div>
            {tasks.map((task) => (
              <div className="planner-row" role="row" key={task.id}>
                <span className="planner-cell planner-cell--task" role="rowheader">
                  {task.name}
                  <span className="planner-task-meta">
                    {task.schedule.assignment === 'alternate' ? 'Om de beurt' : 'Samen'}
                  </span>
                </span>
                {weekDays.map((day, dayIndex) => {
                  const isoDate = toISODate(day)
                  const isToday = isoDate === todayIso
                  const assignedIds = getAssignedPersonIds(task, allPersons, dayIndex)
                  const isActiveDay = assignedIds.length > 0
                  const isAssignedToPerson = assignedIds.includes(person.id)
                  const done = isAssignedToPerson ? isCompleted(person.id, task.id, isoDate) : false

                  if (!isActiveDay) {
                    return (
                      <span
                        className={`planner-cell planner-cell--inactive ${isToday ? 'planner-cell--today' : ''}`}
                        role="gridcell"
                        key={`${task.id}-${isoDate}`}
                      >
                        –
                      </span>
                    )
                  }

                  if (!isAssignedToPerson) {
                    return (
                      <span
                        className={`planner-cell planner-cell--off-duty ${isToday ? 'planner-cell--today' : ''}`}
                        role="gridcell"
                        key={`${task.id}-${isoDate}`}
                        aria-label={`${task.name} op ${formatDayLabel(day)} is niet toegewezen aan ${person.name}`}
                      >
                        Vrij
                      </span>
                    )
                  }

                  return (
                    <button
                      type="button"
                      className={`planner-cell planner-toggle ${done ? 'planner-toggle--done' : ''} ${isToday ? 'planner-cell--today' : ''}`}
                      key={`${task.id}-${isoDate}`}
                      role="gridcell"
                      aria-label={`${task.name} op ${formatDayLabel(day)} voor ${person.name}`}
                      onClick={() => onToggle(person.id, task.id, isoDate)}
                    >
                      {done ? '✓' : ''}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
