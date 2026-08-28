import type { MetadataRoute } from 'next'

const SITE_URL = 'https://stvault.vercel.app'
const TMDB_API = process.env.TMDB_API_KEY

interface TmdbItem {
  id: number
  title?: string
  name?: string
  media_type?: string
}

async function fetchTrending(): Promise<TmdbItem[]> {
  if (!TMDB_API) return []
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API}`,
      { next: { revalidate: 86400 } }, // cache for 24h
    )
    const data = await res.json()
    return (data.results || []).slice(0, 50)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
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

  // Dynamic: trending movies & TV shows
  const trending = await fetchTrending()
  const dynamicPages: MetadataRoute.Sitemap = trending.map((item) => ({
    url: `${SITE_URL}/?movie=${item.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...dynamicPages]
}
