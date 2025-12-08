import type { Person, Task } from '../types'
import { formatDayLabel, toISODate } from '../utils/date'

type PlannerGridProps = {
  persons: Person[]
  tasks: Task[]
  weekDays: Date[]
  todayIso: string
  isCompleted: (personId: string, taskId: string, isoDate: string) => boolean
  onToggle: (personId: string, taskId: string, isoDate: string) => void
}

export function PlannerGrid({ persons, tasks, weekDays, todayIso, isCompleted, onToggle }: PlannerGridProps) {
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
                </span>
                {weekDays.map((day) => {
                  const isoDate = toISODate(day)
                  const done = isCompleted(person.id, task.id, isoDate)
                  const isToday = isoDate === todayIso
                  return (
                    <button
                      type="button"
                      className={`planner-cell planner-toggle ${done ? 'planner-toggle--done' : ''} ${isToday ? 'planner-cell--today' : ''}`}
                      key={`${task.id}-${isoDate}`}
                      role="gridcell"
                      aria-selected={done ? 'true' : 'false'}
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
