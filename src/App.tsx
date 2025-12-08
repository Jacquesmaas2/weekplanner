import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { AdminPanel } from './components/AdminPanel'
import { LoginScreen } from './components/LoginScreen'
import { PlannerGrid } from './components/PlannerGrid'
import { StatsPanel } from './components/StatsPanel'
import { HighlightsPanel, type DaySummary, type WeeklySummary } from './components/HighlightsPanel'
import { buildDefaultPersons, buildDefaultTasks } from './data/defaults'
import { useLocalStorageState } from './hooks/useLocalStorage'
import type { CompletionMap, HouseholdConfig, Person, PersonTheme, Session, Task } from './types'
import { createCompletionKey, mapToEntries, parseCompletionKey } from './utils/completion'
import {
  addDays,
  formatDayLabel,
  formatWeekRange,
  getWeekDays,
  startOfWeek,
  toISODate,
} from './utils/date'
import { useCloudSync } from './hooks/useCloudSync'
import { createDefaultTaskSchedule, isTaskActiveForPersonOnDay, normalizeTask, normalizeTasks } from './utils/tasks'

type PanelKey = 'planner' | 'stats' | 'admin'

const PERSON_THEMES: PersonTheme[] = ['indigo', 'pink', 'sky', 'orange', 'green', 'violet', 'teal', 'amber']

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const pickTheme = (existing: Person[]): PersonTheme => {
  const used = existing.map((person) => person.theme)
  const available = PERSON_THEMES.find((theme) => !used.includes(theme))
  if (available) {
    return available
  }
  return PERSON_THEMES[existing.length % PERSON_THEMES.length]
}

function App() {
  const [activePanel, setActivePanel] = useState<PanelKey>('planner')
  const [referenceDate, setReferenceDate] = useState(() => new Date())
  const [persons, setPersons] = useLocalStorageState<Person[]>('weekplanner_persons', buildDefaultPersons())
  const [tasks, setTasks] = useLocalStorageState<Task[]>('weekplanner_tasks', buildDefaultTasks())
  const [completions, setCompletions] = useLocalStorageState<CompletionMap>('weekplanner_completions', {})
  const [weekTaskConfig, setWeekTaskConfig] = useLocalStorageState<Record<string, string[]>>(
    'weekplanner_week_tasks',
    {},
  )
  const [session, setSession] = useLocalStorageState<Session | null>('weekplanner_session', null)
  const [adminCode, setAdminCode] = useLocalStorageState<string>('weekplanner_admin_code', 'ouder')
  const [householdConfig, setHouseholdConfig] = useLocalStorageState<HouseholdConfig | null>(
    'weekplanner_household',
    null,
  )
  const [adminLoginError, setAdminLoginError] = useState<string | undefined>()

  useEffect(() => {
    setTasks((current) => {
      const normalized = normalizeTasks(current, persons)
      const changed = normalized.some((task, index) => task !== current[index])
      return changed ? normalized : current
    })
  }, [persons, setTasks])

  useEffect(() => {
    if (session?.role === 'user') {
      const exists = persons.some((person) => person.id === session.personId)
      if (!exists) {
        setSession(null)
      }
    }
  }, [persons, session, setSession])

  const handleSelectPersonForLogin = (personId: string) => {
    setSession({ role: 'user', personId })
    setActivePanel('planner')
    setAdminLoginError(undefined)
  }

  const handleAdminLogin = (code: string) => {
    if (code.trim() === adminCode) {
      setSession({ role: 'admin' })
      setActivePanel('planner')
      setAdminLoginError(undefined)
    } else {
      setAdminLoginError('Onjuiste toegangscode.')
    }
  }

  const handleLogout = () => {
    setSession(null)
    setAdminLoginError(undefined)
    setActivePanel('planner')
  }

  const handleUpdateAdminCode = (code: string) => {
    setAdminCode(code)
  }

  const weekStart = useMemo(() => startOfWeek(referenceDate), [referenceDate])
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const completionEntries = useMemo(() => mapToEntries(completions), [completions])
  const weekKey = useMemo(() => toISODate(weekStart), [weekStart])

  const activeTaskIdsRaw = weekTaskConfig[weekKey]
  const activeTaskIds = useMemo(() => {
    if (!activeTaskIdsRaw) {
      return undefined
    }
    const knownIds = new Set(tasks.map((task) => task.id))
    const filtered = activeTaskIdsRaw.filter((id) => knownIds.has(id))
    return filtered.length ? filtered : undefined
  }, [activeTaskIdsRaw, tasks])
  const visibleTasks = useMemo(() => {
    if (!activeTaskIds) {
      return tasks
    }
    const set = new Set(activeTaskIds)
    return tasks.filter((task) => set.has(task.id))
  }, [tasks, activeTaskIds])

  const isAdmin = session?.role === 'admin'
  const currentPerson = session?.role === 'user' ? persons.find((person) => person.id === session.personId) : undefined

  const viewPersons = useMemo(() => {
    if (isAdmin) {
      return persons
    }
    if (session?.role === 'user') {
      return currentPerson ? [currentPerson] : []
    }
    return persons
  }, [isAdmin, persons, session, currentPerson])

  const isCompleted = useCallback(
    (personId: string, taskId: string, isoDate: string) => {
      const key = createCompletionKey(personId, taskId, isoDate)
      return Boolean(completions[key])
    },
    [completions],
  )

  const todayIso = toISODate(new Date())

  const dailySummaries = useMemo<DaySummary[]>(() => {
    return weekDays.map((day, dayIndex) => {
      const isoDate = toISODate(day)
      let completedCount = 0
      let total = 0
      viewPersons.forEach((person) => {
        visibleTasks.forEach((task) => {
          if (isTaskActiveForPersonOnDay(task, person.id, persons, dayIndex)) {
            total += 1
            if (isCompleted(person.id, task.id, isoDate)) {
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
  }, [weekDays, visibleTasks, viewPersons, isCompleted, todayIso, persons])

  const weeklySummary = useMemo<WeeklySummary>(() => {
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

  const snapshot = useMemo(
    () => ({ persons, tasks, completions, weekTaskConfig, adminCode }),
    [persons, tasks, completions, weekTaskConfig, adminCode],
  )

  const applyRemoteSnapshot = useCallback(
    (remote: { persons: Person[]; tasks: Task[]; completions: CompletionMap; weekTaskConfig: Record<string, string[]>; adminCode: string }) => {
      setPersons(remote.persons)
      setTasks(normalizeTasks(remote.tasks, remote.persons))
      setCompletions(remote.completions)
      setWeekTaskConfig(remote.weekTaskConfig)
      setAdminCode(remote.adminCode)
    },
    [setPersons, setTasks, setCompletions, setWeekTaskConfig, setAdminCode],
  )

  const householdId = householdConfig?.householdId ?? null

  const cloudState = useCloudSync(householdId, snapshot, applyRemoteSnapshot)

  const cloudError = cloudState.status === 'error' ? cloudState.errorMessage ?? 'Cloud synchronisatie mislukt.' : null

  if (!session) {
    return (
      <LoginScreen
        persons={persons}
        onSelectPerson={handleSelectPersonForLogin}
        onAdminLogin={handleAdminLogin}
        adminError={adminLoginError}
        cloudStatus={cloudState}
        hasHousehold={Boolean(householdId)}
      />
    )
  }

  const toggleCompletion = (personId: string, taskId: string, isoDate: string) => {
    setCompletions((current) => {
      const key = createCompletionKey(personId, taskId, isoDate)
      const next: CompletionMap = { ...current }
      if (next[key]) {
        delete next[key]
      } else {
        next[key] = true
      }
      return next
    })
  }

  const handleAddPerson = (name: string) => {
    setPersons((current) => [
      ...current,
      {
        id: generateId(),
        name,
        theme: pickTheme(current),
        photoUrl: undefined,
      },
    ])
  }

  const handleRemovePerson = (personId: string) => {
    setPersons((current) => current.filter((person) => person.id !== personId))
    setCompletions((current) => {
      const next: CompletionMap = {}
      Object.keys(current).forEach((key) => {
        const entry = parseCompletionKey(key)
        if (entry.personId !== personId) {
          next[key] = true
        }
      })
      return next
    })
  }

  const handleUpdatePersonPhoto = (personId: string, photoUrl: string | null) => {
    setPersons((current) =>
      current.map((person) =>
        person.id === personId
          ? {
              ...person,
              photoUrl: photoUrl ?? undefined,
            }
          : person,
      ),
    )
  }

  const handleAddTask = (name: string) => {
    const newTask: Task = {
      id: generateId(),
      name,
      schedule: createDefaultTaskSchedule(persons),
    }

    setTasks((current) => [...current, newTask])
    setWeekTaskConfig((current) => {
      if (!Object.keys(current).length) {
        return current
      }
      const next: Record<string, string[]> = {}
      Object.entries(current).forEach(([key, value]) => {
        if (value.includes(newTask.id)) {
          next[key] = value
        } else {
          next[key] = [...value, newTask.id]
        }
      })
      return next
    })
  }

  const handleUpdateTaskSchedule = (taskId: string, schedule: Task['schedule']) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task
        }
        const updated = normalizeTask({ ...task, schedule }, persons)
        return updated
      }),
    )
  }

  const handleToggleTaskForWeek = (taskId: string) => {
    setWeekTaskConfig((current) => {
      const currentWeek = current[weekKey] ?? tasks.map((task) => task.id)
      const set = new Set(currentWeek)
      if (set.has(taskId)) {
        set.delete(taskId)
      } else {
        set.add(taskId)
      }
      if (set.size === tasks.length) {
        const nextConfig = { ...current }
        delete nextConfig[weekKey]
        return nextConfig
      }
      return {
        ...current,
        [weekKey]: Array.from(set),
      }
    })
  }

  const handleRemoveTask = (taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
    setCompletions((current) => {
      const next: CompletionMap = {}
      Object.keys(current).forEach((key) => {
        const entry = parseCompletionKey(key)
        if (entry.taskId !== taskId) {
          next[key] = true
        }
      })
      return next
    })
    setWeekTaskConfig((current) => {
      const next: Record<string, string[]> = {}
      Object.entries(current).forEach(([key, value]) => {
        next[key] = value.filter((id) => id !== taskId)
      })
      return next
    })
  }

  const goToPreviousWeek = () => setReferenceDate((current) => addDays(startOfWeek(current), -7))
  const goToNextWeek = () => setReferenceDate((current) => addDays(startOfWeek(current), 7))
  const goToToday = () => setReferenceDate(new Date())

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Weekplanner</h1>
          <p className="app-subtitle">
            {isAdmin ? 'Ouders beheren overzicht en beloningen' : currentPerson ? `Jouw week, ${currentPerson.name}` : 'Jouw week'}
          </p>
        </div>
        <div className="app-header__controls">
          {isAdmin && (
            <nav className="app-tabs" aria-label="Weergave kiezen">
              <button
                type="button"
                className={activePanel === 'planner' ? 'app-tab app-tab--active' : 'app-tab'}
                onClick={() => setActivePanel('planner')}
              >
                Planner
              </button>
              <button
                type="button"
                className={activePanel === 'stats' ? 'app-tab app-tab--active' : 'app-tab'}
                onClick={() => setActivePanel('stats')}
              >
                Statistieken
              </button>
              <button
                type="button"
                className={activePanel === 'admin' ? 'app-tab app-tab--active' : 'app-tab'}
                onClick={() => setActivePanel('admin')}
              >
                Beheer
              </button>
            </nav>
          )}
          <div className="app-account">
            <span className="app-account__label">
              {isAdmin ? 'Ouder' : currentPerson ? currentPerson.name : 'Gebruiker'}
            </span>
            <button type="button" onClick={handleLogout}>
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <section className="week-controls">
        <div className="week-controls__info">
          <span className="week-label">Week van {formatWeekRange(weekStart)}</span>
        </div>
        <div className="week-controls__buttons">
          <button type="button" onClick={goToPreviousWeek}>
            Vorige week
          </button>
          <button type="button" onClick={goToToday}>
            Deze week
          </button>
          <button type="button" onClick={goToNextWeek}>
            Volgende week
          </button>
        </div>
      </section>

      <main>
        {(activePanel === 'planner' || !isAdmin) && (
          <>
            <HighlightsPanel
              audiencePersons={viewPersons}
              dailySummaries={dailySummaries}
              weeklySummary={weeklySummary}
            />
            <PlannerGrid
              persons={viewPersons}
              allPersons={persons}
              tasks={visibleTasks}
              weekDays={weekDays}
              todayIso={todayIso}
              isCompleted={isCompleted}
              onToggle={toggleCompletion}
            />
          </>
        )}
        {isAdmin && activePanel === 'stats' && (
          <StatsPanel
            persons={persons}
            tasks={tasks}
            entries={completionEntries}
            referenceDate={referenceDate}
            weekTaskConfig={weekTaskConfig}
          />
        )}
        {isAdmin && activePanel === 'admin' && (
          <AdminPanel
            key={householdId ?? 'none'}
            persons={persons}
            tasks={tasks}
            activeTaskIds={activeTaskIds}
            onAddPerson={handleAddPerson}
            onRemovePerson={handleRemovePerson}
            onUpdatePersonPhoto={handleUpdatePersonPhoto}
            onAddTask={handleAddTask}
            onUpdateTaskSchedule={handleUpdateTaskSchedule}
            onToggleTaskForWeek={handleToggleTaskForWeek}
            onRemoveTask={handleRemoveTask}
            currentWeekLabel={formatWeekRange(weekStart)}
            adminCode={adminCode}
            onUpdateAdminCode={handleUpdateAdminCode}
            householdId={householdId}
            onUpdateHouseholdId={(id) => setHouseholdConfig(id ? { householdId: id } : null)}
            cloudState={cloudState}
            cloudError={cloudError}
          />
        )}
      </main>
    </div>
  )
}

export default App
