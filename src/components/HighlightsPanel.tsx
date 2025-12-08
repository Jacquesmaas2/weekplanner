import type { Person } from '../types'
import starBuddy from '../assets/accolade-star.svg'
import rocketBuddy from '../assets/accolade-rocket.svg'
import smileBuddy from '../assets/accolade-smile.svg'
import snailBuddy from '../assets/accolade-snail.svg'

export type DaySummary = {
  isoDate: string
  label: string
  completed: number
  total: number
  rate: number
  isToday: boolean
}

export type WeeklySummary = {
  completed: number
  total: number
  rate: number
}

type HighlightsPanelProps = {
  audiencePersons: Person[]
  dailySummaries: DaySummary[]
  weeklySummary: WeeklySummary
}

type RatingDescriptor = {
  threshold: number
  title: string
  message: string
  image: string
  alt: string
}

const RATING_LEVELS: RatingDescriptor[] = [
  {
    threshold: 0.9,
    title: 'Superster',
    message: 'Bijna alles afgevinkt, jullie vliegen door de week!',
    image: starBuddy,
    alt: 'Stralende ster met een glimlach',
  },
  {
    threshold: 0.6,
    title: 'Raketteam',
    message: 'Mooi tempo! Blijf lanceren naar de 100%.',
    image: rocketBuddy,
    alt: 'Een vrolijke raket met gekleurde vlammen',
  },
  {
    threshold: 0.3,
    title: 'Blije crew',
    message: 'De motor draait, een paar taken en je bent er.',
    image: smileBuddy,
    alt: 'Groene bol met grote glimlach',
  },
  {
    threshold: 0,
    title: 'Rustige slak',
    message: 'Begin met één vinkje; elke stap telt.',
    image: snailBuddy,
    alt: 'Een roze slak met vrolijke ogen',
  },
]

const pickRating = (rate: number): RatingDescriptor => {
  const match = RATING_LEVELS.find((level) => rate >= level.threshold)
  return match ?? RATING_LEVELS[RATING_LEVELS.length - 1]
}

const formatRate = (rate: number) => `${Math.round(rate * 100)}%`

const formatAudienceLabel = (persons: Person[]) => {
  if (!persons.length) {
    return 'Iedereen'
  }
  if (persons.length === 1) {
    return persons[0].name
  }
  if (persons.length === 2) {
    return `${persons[0].name} & ${persons[1].name}`
  }
  const [first, second] = persons
  return `${first.name}, ${second.name} en co.`
}

export function HighlightsPanel({ audiencePersons, dailySummaries, weeklySummary }: HighlightsPanelProps) {
  const hasWork = weeklySummary.total > 0
  const todayHighlight = dailySummaries.find((day) => day.isToday && day.total > 0) ?? null
  const todayRating = todayHighlight ? pickRating(todayHighlight.rate) : null
  const todayCard = todayHighlight && todayRating ? { day: todayHighlight, rating: todayRating } : null
  const weeklyRating = pickRating(hasWork ? weeklySummary.rate : 0)
  const audienceLabel = formatAudienceLabel(audiencePersons)

  if (!hasWork) {
    return (
      <section className="highlights">
        <article className="highlights-card highlights-card--info">
          <div className="highlights-card__body">
            <h3>Nog geen taken gepland</h3>
            <p>Voeg een taak toe in het beheerscherm om de eerste ster te verdienen.</p>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="highlights" aria-label="Hoogtepunten van de week">
      <article className="highlights-card highlights-card--accent">
        <figure className="highlight-figure">
          <img src={weeklyRating.image} alt={weeklyRating.alt} />
        </figure>
        <div className="highlights-card__body">
          <h3>{weeklyRating.title}</h3>
          <p className="highlights-card__meta">
            {audienceLabel}: {weeklySummary.completed} / {weeklySummary.total} ({formatRate(weeklySummary.rate)})
          </p>
          <p>{weeklyRating.message}</p>
        </div>
      </article>
      {todayCard && (
        <article className="highlights-card highlights-card--today">
          <figure className="highlight-figure">
            <img src={todayCard.rating.image} alt={todayCard.rating.alt} />
          </figure>
          <div className="highlights-card__body">
            <h3>Vandaag: {todayCard.day.label}</h3>
            <p className="highlights-card__meta">
              {todayCard.day.completed} / {todayCard.day.total} ({formatRate(todayCard.day.rate)})
            </p>
            <p>{todayCard.rating.message}</p>
          </div>
        </article>
      )}

      <div className="highlights-days" aria-label="Beoordeling per dag">
        {dailySummaries.map((day) => {
          const rating = pickRating(day.rate)
          return (
            <article
              key={day.isoDate}
              className={`highlights-mini ${day.isToday ? 'highlights-mini--today' : ''}`}
            >
              <span className="highlights-mini__label">{day.label}</span>
              <img src={rating.image} alt="" aria-hidden="true" />
              <span className="highlights-mini__score">
                {day.completed}/{day.total}
              </span>
              <span className="highlights-mini__title">{rating.title}</span>
            </article>
          )
        })}
      </div>
    </section>
  )
}
