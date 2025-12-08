import { FormEvent, useState } from 'react'
import type { Person } from '../types'

type LoginScreenProps = {
  persons: Person[]
  onSelectPerson: (personId: string) => void
  onAdminLogin: (code: string) => void
  adminError?: string
}

export function LoginScreen({ persons, onSelectPerson, onAdminLogin, adminError }: LoginScreenProps) {
  const [code, setCode] = useState('')

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
                  <span className="login-button__dot" />
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
        </div>
      </section>
    </div>
  )
}
