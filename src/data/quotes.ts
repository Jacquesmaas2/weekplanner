// Motivational quotes for kids
export const MOTIVATIONAL_QUOTES = [
  { text: 'Elke vinkje is een stapje naar succes!', author: '✨' },
  { text: 'Samen kunnen we alles aan.', author: '💪' },
  { text: 'Vandaag is een goede dag voor vinkjes!', author: '☀️' },
  { text: 'Klein beginnen, groot eindigen.', author: '🚀' },
  { text: 'Jullie doen het geweldig!', author: '🌟' },
  { text: 'Elke taak die je doet, maakt je sterker.', author: '💎' },
  { text: 'Blijf doorgaan, je bent er bijna!', author: '🎯' },
  { text: 'Topteam aan het werk!', author: '🏆' },
  { text: 'Vandaag telt, pak die taken!', author: '⭐' },
  { text: 'Geweldig werk, volhouden!', author: '🎉' },
]

export const getRandomQuote = () => {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
}
