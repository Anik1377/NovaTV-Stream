/**
 * Server component that fetches trending content at request/build time
 * and renders a <noscript> block with links.
 *
 * Google's official guidance for AJAX/SPA sites:
 * "We recommend using the <noscript> element to provide links
 *  to the pages that would be generated via JavaScript."
 *
 * This block is invisible to users but Googlebot reads every link in it.
 */
import { tmdbFetch } from '@/lib/tmdb';

interface LinkItem {
  url: string;
  title: string;
}

async function fetchPopularItems(): Promise<LinkItem[]> {
  try {
    const [moviesRes, tvRes, trendingRes] = await Promise.all([
      tmdbFetch<{ results: { id: number; title?: string; name?: string }[] }>(
        '/movie/popular', { region: 'US' },
      ),
      tmdbFetch<{ results: { id: number; title?: string; name?: string }[] }>(
        '/tv/popular', { region: 'US' },
      ),
      tmdbFetch<{ results: { id: number; title?: string; name?: string }[] }>(
        '/trending/all/week',
      ),
    ]);

    const items: LinkItem[] = [];
    const seen = new Set<number>();

    for (const r of [moviesRes, tvRes, trendingRes]) {
      for (const item of r.results || []) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        const title = item.title || item.name || 'Unknown';
        const isTv = !!item.name && !item.title;
        items.push({
          url: `https://stvault.vercel.app/?${isTv ? 'tv' : 'movie'}=${item.id}`,
          title,
        });
      }
    }

    return items.slice(0, 100);
  } catch {
    return [];
  }
}

export async function NoscriptLinks() {
  const items = await fetchPopularItems();

  const sections = [
    { url: 'https://stvault.vercel.app/?v=movies', title: 'Popular Movies' },
    { url: 'https://stvault.vercel.app/?v=tv', title: 'Popular TV Shows' },
    { url: 'https://stvault.vercel.app/?v=anime', title: 'Anime Streaming' },
    { url: 'https://stvault.vercel.app/?v=livetv', title: 'Live TV Channels' },
    { url: 'https://stvault.vercel.app/?v=asian', title: 'Asian Dramas' },
    { url: 'https://stvault.vercel.app/?v=desi', title: 'Desi Cinema' },
    { url: 'https://stvault.vercel.app/?v=read', title: 'Manga & Comics' },
    { url: 'https://stvault.vercel.app/?v=games', title: 'Browser Games' },
    { url: 'https://stvault.vercel.app/?v=showreels', title: 'Showreels' },
    { url: 'https://stvault.vercel.app/?v=people', title: 'Celebrities' },
  ];

  return (
    <noscript>
      <div style={{ display: 'none' }}>
        <h2>StreamVault - Free Streaming Directory</h2>
        <nav aria-label="Site sections">
          <ul>
            {sections.map((s) => (
              <li key={s.url}>
                <a href={s.url}>{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        {items.length > 0 && (
          <nav aria-label="Popular movies and TV shows">
            <ul>
              {items.map((item) => (
                <li key={item.url}>
                  <a href={item.url}>Watch {item.title} on StreamVault</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </noscript>
  );
}
