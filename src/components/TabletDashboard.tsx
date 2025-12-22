import { useEffect, useMemo, useState } from 'react'
import type { Person, Task } from '../types'
import type { CompletionEntry } from '../utils/completion'
import { formatDayLabel, toISODate } from '../utils/date'
import { getAssignedPersonIds } from '../utils/tasks'

type TabletDashboardProps = {
  persons: Person[]
  tasks: Task[]
  weekDays: Date[]
  todayIso: string
  isCompleted: (personId: string, taskId: string, isoDate: string) => boolean
  entries: CompletionEntry[]
}

const MOTIVATIONAL_QUOTES = [
  '🌟 Elke taak die je afmaakt, maakt je sterker!',
  '🎯 Kleine stapjes leiden tot grote overwinningen!',
  '💪 Jullie zijn een super team!',
  '⭐ Wat een toppers zijn jullie!',
  '🏆 Samen maken we er een geweldige week van!',
  '🎨 Jullie doen het fantastisch!',
  '🚀 Doorgaan zo, jullie zijn ontzettend goed bezig!',
  '❤️ Trots op jullie inzet!',
]

const ROTATION_INTERVAL = 15000 // 15 seconds

export function TabletDashboard({
  persons,
  tasks,
  weekDays,
  todayIso,
  isCompleted,
  entries,
}: TabletDashboardProps) {
  const [currentView, setCurrentView] = useState<'overview' | 'person-0' | 'person-1' | 'stats' | 'quote'>('overview')
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)

  const today = useMemo(() => weekDays.find((day) => toISODate(day) === todayIso), [weekDays, todayIso])
  const todayLabel = today ? formatDayLabel(today) : 'Vandaag'

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    let totalTasks = 0
    let completedTasks = 0

    persons.forEach((person) => {
      weekDays.forEach((day) => {
        const isoDate = toISODate(day)
        tasks.forEach((task) => {
          const assignedIds = getAssignedPersonIds(task, persons, day)
          if (assignedIds.includes(person.id)) {
            totalTasks++
            if (isCompleted(person.id, task.id, isoDate)) {
              completedTasks++
            }
          }
        })
      })
    })

    return {
      total: totalTasks,
      completed: completedTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    }
  }, [persons, weekDays, tasks, isCompleted])

  // Calculate person stats for today
  const personStatsToday = useMemo(() => {
    if (!today) return []
    const isoDate = toISODate(today)

    return persons.map((person) => {
      let completed = 0
      let total = 0

      tasks.forEach((task) => {
        const assignedIds = getAssignedPersonIds(task, persons, today)
        if (assignedIds.includes(person.id)) {
          total++
          if (isCompleted(person.id, task.id, isoDate)) {
            completed++
          }
        }
      })

      return {
        person,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })
  }, [today, persons, tasks, isCompleted])

  // Auto-rotate views
  useEffect(() => {
    const views: typeof currentView[] = ['overview']
    persons.forEach((_, index) => {
      views.push(`person-${index}` as typeof currentView)
    })
    views.push('stats', 'quote')

    let currentIndex = 0
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % views.length
      setCurrentView(views[currentIndex])
      
      // Rotate quote when on quote view
      if (views[currentIndex] === 'quote') {
        setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)
      }
    }, ROTATION_INTERVAL)

    return () => clearInterval(interval)
  }, [persons.length])

  const renderPersonView = (personIndex: number) => {
    if (personIndex >= persons.length || !today) return null
    const person = persons[personIndex]
    const isoDate = toISODate(today)

    const personTasks = tasks.filter((task) => {
      const assignedIds = getAssignedPersonIds(task, persons, today)
      return assignedIds.includes(person.id)
    })

    return (
      <div className="tablet-view tablet-view--person">
        <div className={`tablet-person-header theme-${person.theme}`}>
          <div className="tablet-person-avatar">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} />
            ) : (
              <span className="tablet-person-dot" />
            )}
          </div>
          <h1>{person.name}</h1>
        </div>

        <div className="tablet-date">
          <span className="tablet-date-label">{todayLabel}</span>
        </div>

        <div className="tablet-tasks">
          {personTasks.length > 0 ? (
            personTasks.map((task) => {
              const done = isCompleted(person.id, task.id, isoDate)
              return (
                <div key={task.id} className={`tablet-task ${done ? 'tablet-task--done' : ''}`}>
                  <div className="tablet-task-check">
                    {done ? '✓' : '○'}
                  </div>
                  <div className="tablet-task-name">{task.name}</div>
                </div>
              )
            })
          ) : (
            <div className="tablet-empty">Geen taken voor vandaag 🎉</div>
          )}
        </div>

        <div className="tablet-progress">
          <div className="tablet-progress-label">
            Vandaag: {personStatsToday[personIndex]?.completed || 0} van {personStatsToday[personIndex]?.total || 0}
          </div>
          <div className="tablet-progress-bar">
            <div 
              className="tablet-progress-fill"
              style={{ width: `${personStatsToday[personIndex]?.percentage || 0}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="tablet-view tablet-view--overview">
      <h1 className="tablet-title">Vandaag: {todayLabel}</h1>
      
      <div className="tablet-overview-grid">
        {persons.map((person, index) => {
          const stats = personStatsToday[index]
          if (!stats) return null

          return (
            <div key={person.id} className={`tablet-person-card theme-${person.theme}`}>
              <div className="tablet-person-card-avatar">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={person.name} />
                ) : (
                  <span className="tablet-person-card-dot" />
                )}
              </div>
              <div className="tablet-person-card-name">{person.name}</div>
              <div className="tablet-person-card-stats">
                <div className="tablet-person-card-number">{stats.completed}/{stats.total}</div>
                <div className="tablet-person-card-progress">
                  <div 
                    className="tablet-person-card-progress-fill"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="tablet-week-summary">
        <h2>Deze week</h2>
        <div className="tablet-week-stats">
          <div className="tablet-week-stat">
            <div className="tablet-week-stat-value">{weeklyStats.completed}</div>
            <div className="tablet-week-stat-label">Afgerond</div>
          </div>
          <div className="tablet-week-stat">
            <div className="tablet-week-stat-value">{weeklyStats.percentage}%</div>
            <div className="tablet-week-stat-label">Voltooid</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStats = () => {
    // Calculate fun facts
    const totalCompletionsEver = entries.length
    const thisWeekEntries = entries.filter((entry) => {
      return weekDays.some((day) => toISODate(day) === entry.isoDate)
    })
    
    const personCompletions = persons.map((person) => ({
      person,
      count: thisWeekEntries.filter((e) => e.personId === person.id).length,
    }))
    
    const topPerformer = personCompletions.reduce((max, current) => 
      current.count > max.count ? current : max
    , personCompletions[0])

    return (
      <div className="tablet-view tablet-view--stats">
        <h1 className="tablet-title">📊 Deze week tot nu toe</h1>
        
        <div className="tablet-stats-grid">
          <div className="tablet-stat-card">
            <div className="tablet-stat-emoji">🏆</div>
            <div className="tablet-stat-value">{topPerformer?.person.name || '-'}</div>
            <div className="tablet-stat-label">Topper van de week</div>
            <div className="tablet-stat-subtext">{topPerformer?.count || 0} taken</div>
          </div>

          <div className="tablet-stat-card">
            <div className="tablet-stat-emoji">✅</div>
            <div className="tablet-stat-value">{thisWeekEntries.length}</div>
            <div className="tablet-stat-label">Taken afgerond</div>
            <div className="tablet-stat-subtext">deze week</div>
          </div>

          <div className="tablet-stat-card">
            <div className="tablet-stat-emoji">🎯</div>
            <div className="tablet-stat-value">{weeklyStats.percentage}%</div>
            <div className="tablet-stat-label">Score</div>
            <div className="tablet-stat-subtext">van alle taken</div>
          </div>

          <div className="tablet-stat-card">
            <div className="tablet-stat-emoji">🌟</div>
            <div className="tablet-stat-value">{totalCompletionsEver}</div>
            <div className="tablet-stat-label">Totaal ooit</div>
            <div className="tablet-stat-subtext">super!</div>
          </div>
        </div>
      </div>
    )
  }

  const renderQuote = () => (
    <div className="tablet-view tablet-view--quote">
      <div className="tablet-quote-content">
        <div className="tablet-quote-text">
          {MOTIVATIONAL_QUOTES[currentQuoteIndex]}
        </div>
      </div>
    </div>
  )

  return (
    <div className="tablet-dashboard">
      <div className="tablet-container">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'person-0' && renderPersonView(0)}
        {currentView === 'person-1' && renderPersonView(1)}
        {currentView === 'stats' && renderStats()}
        {currentView === 'quote' && renderQuote()}
      </div>
      
      <div className="tablet-dots">
        {['overview', ...persons.map((_, i) => `person-${i}`), 'stats', 'quote'].map((view) => (
          <span
            key={view}
            className={`tablet-dot ${currentView === view ? 'tablet-dot--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
