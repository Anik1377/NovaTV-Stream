import type { MetadataRoute } from 'next'

const SITE_URL = 'https://stvault.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
}
