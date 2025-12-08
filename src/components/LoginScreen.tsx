import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Person } from '../types'
import type { CloudSyncState } from '../hooks/useCloudSync'

type LoginScreenProps = {
  persons: Person[]
  onSelectPerson: (personId: string) => void
  onAdminLogin: (code: string) => void
  adminError?: string
  cloudStatus: CloudSyncState
  hasHousehold: boolean
}

const formatCloudLabel = (state: CloudSyncState, hasHousehold: boolean) => {
  if (state.status === 'disabled') {
    return 'Cloudsync niet geconfigureerd.'
  }
  if (!hasHousehold) {
    return 'Meld je als ouder aan om apparaten te koppelen.'
  }
  if (state.status === 'syncing') {
    return 'Gegevens worden gesynchroniseerd...'
  }
  if (state.status === 'error') {
    return state.errorMessage ?? 'Synchronisatie mislukt.'
  }
  if (state.lastSyncedAt) {
    return `Laatste sync: ${new Date(state.lastSyncedAt).toLocaleTimeString('nl-NL')}`
  }
  return 'Cloudsync actief.'
}

export function LoginScreen({ persons, onSelectPerson, onAdminLogin, adminError, cloudStatus, hasHousehold }: LoginScreenProps) {
  const [code, setCode] = useState('')
  const cloudLabel = formatCloudLabel(cloudStatus, hasHousehold)
  const cloudTone = cloudStatus.status === 'error' ? 'login-cloud--error' : cloudStatus.status === 'syncing' ? 'login-cloud--syncing' : 'login-cloud--ok'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onAdminLogin(code)
  }

  return (
    <div className="login-screen">
      <section className="login-card">
        <header>
          <h1>Welkom bij de Weekplanner</h1>
          <p className="login-subtitle">Kies wie je bent om verder te gaan.</p>
        </header>

        <div className="login-section">
          <h2>Kinderen</h2>
          {persons.length ? (
            <div className="login-buttons">
              {persons.map((person) => (
                <button type="button" key={person.id} className={`login-button theme-${person.theme}`} onClick={() => onSelectPerson(person.id)}>
                  <span className="login-button__avatar">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" />
                    ) : (
                      <span className="login-button__dot" aria-hidden="true" />
                    )}
                  </span>
                  <span>{person.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="login-empty">Er zijn nog geen personen toegevoegd. Meld u aan als ouder om te starten.</p>
          )}
        </div>

        <div className="login-section login-section--divider">
          <h2>Ouders</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="admin-code">Toegangscode</label>
            <input
              id="admin-code"
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Bijvoorbeeld: ouder"
              autoComplete="current-password"
              required
            />
            {adminError && <p className="login-error" role="alert">{adminError}</p>}
            <button type="submit">Inloggen als ouder</button>
          </form>
          <p className={`login-cloud ${cloudTone}`}>
            {cloudLabel}
          </p>
        </div>
      </section>
    </div>
  )
}
