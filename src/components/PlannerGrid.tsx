import type { Person, Task } from '../types'
import { formatDayLabel, toISODate } from '../utils/date'

type PlannerGridProps = {
  persons: Person[]
  tasks: Task[]
  weekDays: Date[]
  isCompleted: (personId: string, taskId: string, isoDate: string) => boolean
  onToggle: (personId: string, taskId: string, isoDate: string) => void
}

export function PlannerGrid({ persons, tasks, weekDays, isCompleted, onToggle }: PlannerGridProps) {
  if (!tasks.length) {
    return <p className="planner-empty">Er zijn geen actieve taken voor deze week.</p>
  }

  return (
    <div className="planner-grid">
      {persons.map((person) => (
        <section className={`planner-person theme-${person.theme}`} key={person.id}>
          <header className="planner-person__header">
            <div className="planner-person__dot" />
            <h2>{person.name}</h2>
          </header>
          <div className="planner-table" role="grid" aria-label={`Takenoverzicht voor ${person.name}`}>
            <div className="planner-row planner-row--header" role="row">
              <span className="planner-cell planner-cell--task" role="columnheader">
                Taak
              </span>
              {weekDays.map((day) => (
                <span className="planner-cell planner-cell--day" role="columnheader" key={day.toISOString()}>
                  {formatDayLabel(day)}
                </span>
              ))}
            </div>
            {tasks.map((task) => (
              <div className="planner-row" role="row" key={task.id}>
                <span className="planner-cell planner-cell--task" role="rowheader">
                  {task.name}
                </span>
                {weekDays.map((day) => {
                  const isoDate = toISODate(day)
                  const done = isCompleted(person.id, task.id, isoDate)
                  return (
                    <button
                      type="button"
                      className={`planner-cell planner-toggle ${done ? 'planner-toggle--done' : ''}`}
                      key={`${task.id}-${isoDate}`}
                      role="gridcell"
                      aria-pressed={done ? 'true' : 'false'}
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
