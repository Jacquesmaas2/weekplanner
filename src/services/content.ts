// Service for fetching motivational quotes and news from the internet

export interface Quote {
  text: string
  author: string
  source?: string
  imageUrl?: string
}

export interface NewsItem {
  title: string
  description: string
  url: string
  source: string
}

// Fallback quotes in case API fails
const FALLBACK_QUOTES: Quote[] = [
  { text: 'Kleine stapjes elke dag leiden tot grote veranderingen!', author: 'Weekplanner' },
  { text: 'Samen bereiken we meer dan alleen.', author: 'Weekplanner' },
  { text: 'Elke taak die je afrondt, is een overwinning!', author: 'Weekplanner' },
  { text: 'Teamwork makes the dream work!', author: 'Weekplanner' },
  { text: 'Blijf volhouden, je bent geweldig bezig!', author: 'Weekplanner' },
]

/**
 * Fetch a random motivational quote from the internet
 * Uses quotable.io API (free, no API key required)
 */
export async function fetchMotivationalQuote(): Promise<Quote> {
  try {
    // Try quotable.io first
    const response = await fetch('https://api.quotable.io/random?tags=inspirational|motivational|success|happiness', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch quote')
    }
    
    const data = await response.json()
    
    // Add beautiful background from Unsplash (nature, inspiration)
    const imageUrl = `https://source.unsplash.com/1920x1080/?nature,inspiration,peaceful&sig=${Date.now()}`
    
    return {
      text: data.content,
      author: data.author,
      source: 'quotable.io',
      imageUrl,
    }
  } catch (error) {
    console.warn('Failed to fetch quote from API, using fallback:', error)
    // Return random fallback quote
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
  }
}

/**
 * Fetch Dutch/local news headlines
 * Uses free RSS to JSON services for Dutch news
 */
export async function fetchLocalNews(): Promise<NewsItem[]> {
  try {
    // Use RSS2JSON service to fetch NOS news (Dutch public broadcaster)
    const rssUrl = 'https://feeds.nos.nl/nosnieuwsalgemeen'
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=5`
    
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000),
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch news')
    }
    
    const data = await response.json()
    
    if (data.status !== 'ok' || !data.items) {
      throw new Error('Invalid news response')
    }
    
    return data.items.slice(0, 3).map((item: any) => ({
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || '',
      url: item.link,
      source: 'NOS Nieuws',
    }))
  } catch (error) {
    console.warn('Failed to fetch news:', error)
    return []
  }
}

/**
 * Fetch motivational content including quotes and optionally news
 */
export async function fetchMotivationalContent(): Promise<{
  quote: Quote
  news: NewsItem[]
}> {
  const [quote, news] = await Promise.all([
    fetchMotivationalQuote(),
    fetchLocalNews(),
  ])
  
  return { quote, news }
}
