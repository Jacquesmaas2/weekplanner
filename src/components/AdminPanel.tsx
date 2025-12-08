import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Person, Task } from '../types'

type AdminPanelProps = {
  persons: Person[]
  tasks: Task[]
  activeTaskIds?: string[]
  currentWeekLabel: string
  adminCode: string
  onAddPerson: (name: string) => void
  onRemovePerson: (id: string) => void
  onAddTask: (name: string) => void
  onToggleTaskForWeek: (id: string) => void
  onRemoveTask: (id: string) => void
  onUpdateAdminCode: (code: string) => void
}

export function AdminPanel({
  persons,
  tasks,
  activeTaskIds,
  currentWeekLabel,
  adminCode,
  onAddPerson,
  onRemovePerson,
  onAddTask,
  onToggleTaskForWeek,
  onRemoveTask,
  onUpdateAdminCode,
}: AdminPanelProps) {
  const [personName, setPersonName] = useState('')
  const [taskName, setTaskName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [codeMessage, setCodeMessage] = useState<string | null>(null)

  const activeSet = new Set(activeTaskIds ?? tasks.map((task) => task.id))

  const handlePersonSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = personName.trim()
    if (!trimmed) {
      return
    }
    onAddPerson(trimmed)
    setPersonName('')
  }

  const handleTaskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = taskName.trim()
    if (!trimmed) {
      return
    }
    onAddTask(trimmed)
    setTaskName('')
  }

  const handleAdminCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = newCode.trim()
    const trimmedConfirm = confirmCode.trim()
    if (!trimmed) {
      setCodeMessage('Voer een nieuwe toegangscode in.')
      return
    }
    if (trimmed !== trimmedConfirm) {
      setCodeMessage('De bevestiging komt niet overeen.')
      return
    }
    if (trimmed === adminCode) {
      setCodeMessage('Deze code is al in gebruik.')
      return
    }
    onUpdateAdminCode(trimmed)
    setCodeMessage('Toegangscode bijgewerkt.')
    setNewCode('')
    setConfirmCode('')
  }

  return (
    <div className="admin-panel">
      <section className="admin-section">
        <h3>Personen beheren</h3>
        <form className="admin-form" onSubmit={handlePersonSubmit}>
          <label htmlFor="person-name">Nieuwe persoon</label>
          <div className="admin-form__row">
            <input
              id="person-name"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Naam"
            />
            <button type="submit">Toevoegen</button>
          </div>
        </form>
        <ul className="admin-list">
          {persons.map((person) => (
            <li key={person.id}>
              <span className={`admin-person theme-${person.theme}`}>
                <span className="admin-person__dot" />
                {person.name}
              </span>
              <button
                type="button"
                className="admin-remove"
                onClick={() => onRemovePerson(person.id)}
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="admin-section">
        <div className="admin-section__header">
          <h3>Taken voor {currentWeekLabel}</h3>
          <p className="admin-section__note">Schakel taken aan of uit voor deze week.</p>
        </div>
        <form className="admin-form" onSubmit={handleTaskSubmit}>
          <label htmlFor="task-name">Nieuwe taak</label>
          <div className="admin-form__row">
            <input
              id="task-name"
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
              placeholder="Bijvoorbeeld: Planten water geven"
            />
            <button type="submit">Toevoegen</button>
          </div>
        </form>
        <ul className="admin-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.name}</span>
              <div className="admin-task__actions">
                <button type="button" onClick={() => onToggleTaskForWeek(task.id)}>
                  {activeSet.has(task.id) ? 'Actief deze week' : 'Uitgeschakeld'}
                </button>
                <button type="button" className="admin-remove" onClick={() => onRemoveTask(task.id)}>
                  Verwijderen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="admin-section">
        <h3>Beveiliging</h3>
        <form className="admin-form" onSubmit={handleAdminCodeSubmit}>
          <label htmlFor="admin-new-code">Nieuwe toegangscode</label>
          <input
            id="admin-new-code"
            type="password"
            value={newCode}
            onChange={(event) => {
              setNewCode(event.target.value)
              setCodeMessage(null)
            }}
            placeholder="Minimaal 4 tekens"
            minLength={4}
            required
          />
          <label htmlFor="admin-confirm-code">Bevestig toegangscode</label>
          <input
            id="admin-confirm-code"
            type="password"
            value={confirmCode}
            onChange={(event) => {
              setConfirmCode(event.target.value)
              setCodeMessage(null)
            }}
            placeholder="Herhaal de code"
            minLength={4}
            required
          />
          {codeMessage && (
            <p className={`admin-message ${codeMessage.includes('bijgewerkt') ? 'admin-message--success' : ''}`} role="status">
              {codeMessage}
            </p>
          )}
          <button type="submit">Toegangscode opslaan</button>
        </form>
      </section>
    </div>
  )
}
