import { useEffect, useMemo, useState } from 'react'
import type { CompletionMap, Person, Task } from '../types'
import { formatDayLabel, formatWeekRange, getWeekDays, startOfWeek, toISODate } from '../utils/date'
import { getAssignedPersonIds, isTaskActiveForPersonOnDay } from '../utils/tasks'
import { createCompletionKey } from '../utils/completion'
import type { DaySummary } from './HighlightsPanel'
import { getRandomQuote } from '../data/quotes'
import starBuddy from '../assets/accolade-star.svg'
import rocketBuddy from '../assets/accolade-rocket.svg'
import smileBuddy from '../assets/accolade-smile.svg'
import snailBuddy from '../assets/accolade-snail.svg'

type TabletViewProps = {
  persons: Person[]
  tasks: Task[]
  completions: CompletionMap
  weekTaskConfig: Record<string, string[]>
  onToggle: (personId: string, taskId: string, isoDate: string) => void
}

type ContentSlide = 
  | { type: 'planner'; personId: string }
  | { type: 'summary' }
  | { type: 'quote' }
  | { type: 'fun-fact' }

const SLIDE_DURATION = 15000 // 15 seconds per slide
const RATING_IMAGES = {
  star: starBuddy,
  rocket: rocketBuddy,
  smile: smileBuddy,
  snail: snailBuddy,
}

export function TabletView({ persons, tasks, completions, weekTaskConfig, onToggle }: TabletViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote())
  const [funFact, setFunFact] = useState('')
  
  const weekStart = useMemo(() => startOfWeek(new Date()), [])
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const weekKey = useMemo(() => toISODate(weekStart), [weekStart])
  const todayIso = toISODate(new Date())
  const today = new Date()

  // Get active tasks for this week
  const activeTaskIdsRaw = weekTaskConfig[weekKey]
  const visibleTasks = useMemo(() => {
    if (!activeTaskIdsRaw) return tasks
    const knownIds = new Set(tasks.map((task) => task.id))
    const filtered = activeTaskIdsRaw.filter((id) => knownIds.has(id))
    if (!filtered.length) return tasks
    const set = new Set(filtered)
    return tasks.filter((task) => set.has(task.id))
  }, [activeTaskIdsRaw, tasks, weekTaskConfig])

  // Build slide rotation
  const slides = useMemo<ContentSlide[]>(() => {
    const result: ContentSlide[] = []
    
    // Add planner for each person
    persons.forEach(person => {
      result.push({ type: 'planner', personId: person.id })
    })
    
    // Add summary
    result.push({ type: 'summary' })
    
    // Add quote
    result.push({ type: 'quote' })
    
    // Add fun fact
    result.push({ type: 'fun-fact' })
    
    return result
  }, [persons])

  // Calculate daily summaries
  const dailySummaries = useMemo<DaySummary[]>(() => {
    return weekDays.map((day) => {
      const isoDate = toISODate(day)
      let completedCount = 0
      let total = 0
      persons.forEach((person) => {
        visibleTasks.forEach((task) => {
          if (isTaskActiveForPersonOnDay(task, person.id, persons, day)) {
            total += 1
            const key = createCompletionKey(person.id, task.id, isoDate)
            if (completions[key]) {
              completedCount += 1
            }
          }
        })
      })
      const rate = total > 0 ? completedCount / total : 0
      return {
        isoDate,
        label: formatDayLabel(day),
        completed: completedCount,
        total,
        rate,
        isToday: isoDate === todayIso,
      }
    })
  }, [weekDays, visibleTasks, persons, completions, todayIso])

  const weeklySummary = useMemo(() => {
    const aggregate = dailySummaries.reduce(
      (acc, day) => {
        acc.completed += day.completed
        acc.total += day.total
        return acc
      },
      { completed: 0, total: 0 },
    )
    return {
      completed: aggregate.completed,
      total: aggregate.total,
      rate: aggregate.total > 0 ? aggregate.completed / aggregate.total : 0,
    }
  }, [dailySummaries])

  // Generate fun facts
  useEffect(() => {
    const facts = [
      `Deze week hebben jullie al ${weeklySummary.completed} taken voltooid! 🎯`,
      `Nog ${weeklySummary.total - weeklySummary.completed} taken te gaan deze week. Kom op! 💪`,
      `Jullie zijn ${Math.round(weeklySummary.rate * 100)}% van de week voltooid. Top! ⭐`,
      persons.length > 1 
        ? `${persons.map(p => p.name).join(' en ')} werken samen als een dreamteam! 🌟`
        : `${persons[0]?.name || 'Jij'} doet het fantastisch! 🚀`,
      `Vandaag is ${formatDayLabel(today)} - een perfecte dag voor vinkjes! ☀️`,
      visibleTasks.length > 0
        ? `Er staan ${visibleTasks.length} taken op jullie lijst. Elke taak maakt je sterker! 💎`
        : 'Voeg taken toe om te beginnen! 📝',
    ]
    setFunFact(facts[Math.floor(Math.random() * facts.length)])
  }, [weeklySummary, persons, visibleTasks, today])

  // Auto-rotate slides
  useEffect(() => {
    if (slides.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => {
        const next = (prev + 1) % slides.length
        // Refresh quote when showing quote slide
        if (slides[next].type === 'quote') {
          setCurrentQuote(getRandomQuote())
        }
        return next
      })
    }, SLIDE_DURATION)

    return () => clearInterval(interval)
  }, [slides])

  const currentSlide = slides[currentSlideIndex]

  if (!currentSlide) {
    return (
      <div className="tablet-view">
        <div className="tablet-message">
          <h2>Voeg personen toe om te beginnen!</h2>
        </div>
      </div>
    )
  }

  const getRatingImage = (rate: number) => {
    if (rate >= 0.9) return RATING_IMAGES.star
    if (rate >= 0.6) return RATING_IMAGES.rocket
    if (rate >= 0.3) return RATING_IMAGES.smile
    return RATING_IMAGES.snail
  }

  const getRatingTitle = (rate: number) => {
    if (rate >= 0.9) return 'Superster! ⭐'
    if (rate >= 0.6) return 'Raketteam! 🚀'
    if (rate >= 0.3) return 'Lekker bezig! 😊'
    return 'Begin is er! 🐌'
  }

  const isCompleted = (personId: string, taskId: string, isoDate: string) => {
    const key = createCompletionKey(personId, taskId, isoDate)
    return Boolean(completions[key])
  }

  // Render planner slide
  if (currentSlide.type === 'planner') {
    const person = persons.find(p => p.id === currentSlide.personId)
    if (!person) return null

    const todaySummary = dailySummaries.find(d => d.isToday)
    const personTodayCompleted = todaySummary ? (() => {
      let count = 0
      visibleTasks.forEach(task => {
        if (isTaskActiveForPersonOnDay(task, person.id, persons, today) && isCompleted(person.id, task.id, todayIso)) {
          count++
        }
      })
      return count
    })() : 0
    const personTodayTotal = todaySummary ? (() => {
      let count = 0
      visibleTasks.forEach(task => {
        if (isTaskActiveForPersonOnDay(task, person.id, persons, today)) {
          count++
        }
      })
      return count
    })() : 0
    const personRate = personTodayTotal > 0 ? personTodayCompleted / personTodayTotal : 0

    return (
      <div className="tablet-view">
        <div className={`tablet-planner theme-${person.theme}`}>
          <div className="tablet-header">
            <div className="tablet-person-avatar">
              {person.photoUrl ? (
                <img src={person.photoUrl} alt={person.name} />
              ) : (
                <div className="tablet-person-dot" />
              )}
            </div>
            <div className="tablet-header-text">
              <h1>{person.name}</h1>
              <p className="tablet-subtitle">{formatWeekRange(weekStart)}</p>
            </div>
            <div className="tablet-score">
              <div className="tablet-score-value">{personTodayCompleted}/{personTodayTotal}</div>
              <div className="tablet-score-label">Vandaag</div>
            </div>
          </div>

          <div className="tablet-tasks">
            {visibleTasks.map(task => {
              const assignedIds = getAssignedPersonIds(task, persons, today)
              const isAssigned = assignedIds.includes(person.id)
              const done = isAssigned && isCompleted(person.id, task.id, todayIso)

              if (!isAssigned) return null

              return (
                <button
                  key={task.id}
                  className={`tablet-task ${done ? 'tablet-task--done' : ''}`}
                  onClick={() => onToggle(person.id, task.id, todayIso)}
                  type="button"
                >
                  <div className="tablet-task-check">
                    {done ? '✓' : ''}
                  </div>
                  <span className="tablet-task-name">{task.name}</span>
                </button>
              )
            })}
          </div>

          <div className="tablet-footer">
            <img src={getRatingImage(personRate)} alt="" className="tablet-rating-image" />
            <p className="tablet-rating-text">{getRatingTitle(personRate)}</p>
          </div>
        </div>
      </div>
    )
  }

  // Render summary slide
  if (currentSlide.type === 'summary') {
    return (
      <div className="tablet-view">
        <div className="tablet-summary">
          <h1 className="tablet-summary-title">Week Overzicht</h1>
          <p className="tablet-summary-subtitle">{formatWeekRange(weekStart)}</p>

          <div className="tablet-summary-main">
            <div className="tablet-summary-score">
              <div className="tablet-summary-number">{weeklySummary.completed}</div>
              <div className="tablet-summary-label">Taken voltooid</div>
              <div className="tablet-summary-total">van {weeklySummary.total}</div>
            </div>
            <img src={getRatingImage(weeklySummary.rate)} alt="" className="tablet-summary-image" />
          </div>

          <div className="tablet-summary-progress">
            <div className="tablet-progress-bar">
              <div 
                className="tablet-progress-fill" 
                style={{ width: `${Math.round(weeklySummary.rate * 100)}%` }}
              />
            </div>
            <div className="tablet-progress-text">{Math.round(weeklySummary.rate * 100)}% voltooid</div>
          </div>

          <div className="tablet-week-days">
            {dailySummaries.map(day => (
              <div key={day.isoDate} className={`tablet-day ${day.isToday ? 'tablet-day--today' : ''}`}>
                <div className="tablet-day-label">{day.label}</div>
                <div className="tablet-day-score">{day.completed}/{day.total}</div>
                <img src={getRatingImage(day.rate)} alt="" className="tablet-day-icon" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render quote slide
  if (currentSlide.type === 'quote') {
    return (
      <div className="tablet-view tablet-view--quote">
        <div className="tablet-quote">
          <div className="tablet-quote-mark">"</div>
          <p className="tablet-quote-text">{currentQuote.text}</p>
          <div className="tablet-quote-author">{currentQuote.author}</div>
        </div>
      </div>
    )
  }

  // Render fun fact slide
  if (currentSlide.type === 'fun-fact') {
    return (
      <div className="tablet-view tablet-view--fact">
        <div className="tablet-fact">
          <div className="tablet-fact-icon">💡</div>
          <p className="tablet-fact-text">{funFact}</p>
        </div>
      </div>
    )
  }

  return null
}
