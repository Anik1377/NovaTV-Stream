import type { MetadataRoute } from 'next'

const SITE_URL = 'https://stvault.vercel.app'
const TMDB_API = process.env.TMDB_API_KEY

interface TmdbItem {
  id: number
  title?: string
  name?: string
  media_type?: string
}

async function tmdbFetch(endpoint: string): Promise<TmdbItem[]> {
  if (!TMDB_API) return []
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3${endpoint}?api_key=${TMDB_API}`,
      { next: { revalidate: 86400 } },
    )
    const data = await res.json()
    return (data.results || []).slice(0, 30)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static section pages
  const sections: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/?v=movies`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/?v=tv`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/?v=anime`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/?v=livetv`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/?v=asian`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/?v=desi`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/?v=read`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/?v=games`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/?v=showreels`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/?v=people`, changeFrequency: 'weekly', priority: 0.5 },
  ]

  // Fetch multiple TMDB endpoints in parallel for maximum coverage
  const [trending, popularMovies, popularTv, topRated, upcoming, anime] = await Promise.all([
    tmdbFetch('/trending/all/week'),
    tmdbFetch('/movie/popular'),
    tmdbFetch('/tv/popular'),
    tmdbFetch('/movie/top_rated'),
    tmdbFetch('/movie/upcoming'),
    tmdbFetch('/trending/tv/week'),
  ])

  // Deduplicate by ID
  const seen = new Set<number>()
  const allItems: TmdbItem[] = []
  for (const list of [trending, popularMovies, popularTv, topRated, upcoming, anime]) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        allItems.push(item)
      }
    }
  }

  // Convert to sitemap entries with proper URL format
  const dynamicPages: MetadataRoute.Sitemap = allItems.map((item) => {
    const isTv = item.media_type === 'tv' || (!!item.name && !item.title)
    return {
      url: `${SITE_URL}/?${isTv ? 'tv' : 'movie'}=${item.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  return [...sections, ...dynamicPages]
}
