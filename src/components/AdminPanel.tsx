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
  onUpdatePersonPhoto: (id: string, photoUrl: string | null) => void
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
  onUpdatePersonPhoto,
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
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)

  const activeSet = new Set(activeTaskIds ?? tasks.map((task) => task.id))

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Kon bestand niet laden.'))
      reader.readAsDataURL(file)
    })

  const handlePersonSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = personName.trim()
    if (!trimmed) {
      return
    }
    onAddPerson(trimmed)
    setPersonName('')
    setPhotoMessage(null)
  }

  const handlePhotoUpload = async (fileList: FileList | null, personId: string) => {
    if (!fileList || !fileList.length) {
      return
    }
    const file = fileList[0]
    setPhotoMessage(null)
    if (!file.type.startsWith('image/')) {
      setPhotoMessage('Kies een afbeeldingsbestand (jpg, png, gif).')
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      onUpdatePersonPhoto(personId, dataUrl)
      setPhotoMessage('Foto bijgewerkt!')
    } catch (error) {
      console.error(error)
      setPhotoMessage('Het uploaden is mislukt. Probeer een ander bestand.')
    }
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
                <span className="admin-person__avatar" aria-hidden="true">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt="" />
                  ) : (
                    <span className="admin-person__dot" />
                  )}
                </span>
                {person.name}
              </span>
              <div className="admin-person__controls">
                <label className="admin-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      void handlePhotoUpload(event.target.files, person.id)
                      event.target.value = ''
                    }}
                  />
                  Kies foto
                </label>
                {person.photoUrl && (
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() => {
                      onUpdatePersonPhoto(person.id, null)
                      setPhotoMessage('Foto verwijderd.')
                    }}
                  >
                    Verwijder foto
                  </button>
                )}
              </div>
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
        {photoMessage && (
          <p className="admin-message admin-message--inline" role="status">
            {photoMessage}
          </p>
        )}
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
