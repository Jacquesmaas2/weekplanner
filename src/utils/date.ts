const WEEK_START_MONDAY = 1

const DAY_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']

export const startOfWeek = (value: Date): Date => {
  const date = new Date(value)
  const day = date.getDay()
  const diff = (day === 0 ? 6 : day - WEEK_START_MONDAY)
  date.setDate(date.getDate() - diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export const startOfMonth = (value: Date): Date => {
  const date = new Date(value)
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

export const endOfMonth = (value: Date): Date => {
  const date = startOfMonth(value)
  date.setMonth(date.getMonth() + 1)
  date.setDate(0)
  date.setHours(23, 59, 59, 999)
  return date
}

export const startOfYear = (value: Date): Date => {
  const date = new Date(value.getFullYear(), 0, 1)
  date.setHours(0, 0, 0, 0)
  return date
}

export const endOfYear = (value: Date): Date => {
  const date = new Date(value.getFullYear(), 11, 31, 23, 59, 59, 999)
  return date
}

export const endOfDay = (value: Date): Date => {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

export const addDays = (value: Date, amount: number): Date => {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

export const getWeekDays = (weekStart: Date): Date[] =>
  Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

export const formatDayLabel = (value: Date): string => {
  const dayLabel = DAY_LABELS[value.getDay()]
  return `${dayLabel} ${value.getDate()}`
}

export const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = addDays(weekStart, 6)
  const monthStart = weekStart.toLocaleString('nl-NL', { month: 'long' })
  const monthEnd = weekEnd.toLocaleString('nl-NL', { month: 'long' })

  if (monthStart === monthEnd) {
    return `${weekStart.getDate()} - ${weekEnd.getDate()} ${monthStart}`
  }

  return `${weekStart.getDate()} ${monthStart} - ${weekEnd.getDate()} ${monthEnd}`
}

export const toISODate = (value: Date): string => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export const isWithinRange = (isoDate: string, start: Date, end: Date): boolean => {
  const date = new Date(isoDate)
  return date >= start && date <= end
}

export const inclusiveDayCount = (start: Date, end: Date): number => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  const diff = endDate.getTime() - startDate.getTime()
  return diff >= 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) + 1 : 0
}

export const clampRangeEndToToday = (end: Date): Date => {
  const todayEnd = endOfDay(new Date())
  return end > todayEnd ? todayEnd : end
}
