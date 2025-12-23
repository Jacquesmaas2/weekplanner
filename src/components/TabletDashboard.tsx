import { useEffect, useMemo, useRef, useState } from 'react'
import type { Person, Task } from '../types'
import type { CompletionEntry } from '../utils/completion'
import { formatDayLabel, toISODate } from '../utils/date'
import { getAssignedPersonIds } from '../utils/tasks'
import { fetchMotivationalContent, type Quote, type NewsItem } from '../services/content'

type TabletDashboardProps = {
  persons: Person[]
  tasks: Task[]
  weekDays: Date[]
  todayIso: string
  isCompleted: (personId: string, taskId: string, isoDate: string) => boolean
  entries: CompletionEntry[]
}

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
  const [currentQuote, setCurrentQuote] = useState<Quote>({ text: 'Laden...', author: '' })
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoadingContent, setIsLoadingContent] = useState(true)

  // Scaling to guarantee one-screen fit
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const recomputeScale = () => {
    const c = containerRef.current
    const v = viewRef.current
    if (!c || !v) return
    const cw = c.clientWidth
    const ch = c.clientHeight
    const vw = v.scrollWidth
    const vh = v.scrollHeight
    const s = Math.min(cw / Math.max(vw, 1), ch / Math.max(vh, 1))
    setScale(s < 1 ? s : 1)
  }
  useEffect(() => {
    recomputeScale()
    const onResize = () => recomputeScale()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [currentView, persons.length, tasks.length, isLoadingContent])

  // Build the ordered list of views based on number of persons
  const views = useMemo(() => {
    const base: Array<typeof currentView> = ['overview']
    persons.forEach((_, index) => base.push(`person-${index}` as typeof currentView))
    base.push('stats', 'quote')
    return base
  }, [persons.length])

  // Touch handling for swipe navigation
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 50 // px

  const goToView = (view: typeof currentView) => {
    setCurrentView(view)
    if (view === 'quote') {
      setIsLoadingContent(true)
    }
  }

  const goNext = () => {
    const idx = views.indexOf(currentView)
    const next = views[(idx + 1) % views.length]
    goToView(next)
  }

  const goPrev = () => {
    const idx = views.indexOf(currentView)
    const prev = views[(idx - 1 + views.length) % views.length]
    goToView(prev)
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const t = e.changedTouches[0]
    touchStartX.current = t.clientX
    touchStartY.current = t.clientY
  }

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX.current
    const dy = t.clientY - touchStartY.current

    // Horizontal swipe with sufficient distance and dominant over vertical movement
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        goNext()
      } else {
        goPrev()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

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

  // Fetch fresh content when entering quote view
  useEffect(() => {
    if (currentView === 'quote' && isLoadingContent) {
      const loadContent = async () => {
        try {
          const content = await fetchMotivationalContent()
          setCurrentQuote(content.quote)
          setNews(content.news)
        } catch (error) {
          console.error('Failed to load content:', error)
        } finally {
          setIsLoadingContent(false)
        }
      }
      void loadContent()
    }
  }, [currentView, isLoadingContent])

  // Auto-rotate views – always advance from the current view
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = views.indexOf(currentView)
      const next = views[(idx + 1) % views.length]
      goToView(next)
    }, ROTATION_INTERVAL)
    return () => clearInterval(interval)
  }, [views, currentView])

  const renderPersonView = (personIndex: number) => {
    if (personIndex >= persons.length || !today) return null
    const person = persons[personIndex]
    const isoDate = toISODate(today)

    const personTasks = tasks.filter((task) => {
      const assignedIds = getAssignedPersonIds(task, persons, today)
      return assignedIds.includes(person.id)
    })

    return (
      <div className="tablet-view tablet-view--person" ref={viewRef}>
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
    <div className="tablet-view tablet-view--overview" ref={viewRef}>
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
      <div className="tablet-view tablet-view--stats" ref={viewRef}>
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
    <div className="tablet-view tablet-view--quote" ref={viewRef}>
      <div 
        className="tablet-quote-content"
        style={currentQuote.imageUrl ? { backgroundImage: `url(${currentQuote.imageUrl})` } : undefined}
      >
        <div className="tablet-quote-emoji">💫</div>
        <div className="tablet-quote-text">
          {currentQuote.text}
        </div>
        {currentQuote.author && (
          <div className="tablet-quote-author">
            — {currentQuote.author}
          </div>
        )}
      </div>
      
      {news.length > 0 && (
        <div className="tablet-news-section">
          <h3 className="tablet-news-title">📰 Nieuws</h3>
          <div className="tablet-news-list">
            {news.map((item, index) => (
              <div key={index} className="tablet-news-item">
                <div className="tablet-news-item-title">{item.title}</div>
                <div className="tablet-news-item-source">{item.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="tablet-dashboard">
      <div
        className="tablet-container"
        ref={containerRef}
        style={{ transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: 'top center' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
