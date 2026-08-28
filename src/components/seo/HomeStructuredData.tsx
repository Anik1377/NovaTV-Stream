import { tmdbFetch } from '@/lib/tmdb';

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_average?: number;
  media_type?: string;
}

async function fetchTrending(): Promise<TmdbItem[]> {
  try {
    const data = await tmdbFetch<{ results: TmdbItem[] }>('/trending/all/week');
    return (data.results || []).slice(0, 10);
  } catch {
    return [];
  }
}

const SITE_URL = 'https://stvault.vercel.app';

export async function HomeStructuredData() {
  const trending = await fetchTrending();

  // FAQ Schema — targets "watch [movie] free online" queries
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is StreamVault free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, StreamVault is completely free. You can watch movies, TV shows, anime, live TV channels, read manga, and play browser games without any subscription or payment.',
        },
      },
      {
        '@type': 'Question',
        name: 'What can I watch on StreamVault?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'StreamVault offers Hollywood movies, popular TV series, anime, Korean and Asian dramas, Desi cinema, live TV channels, manga and comics, and browser games — all in one place.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to create an account to watch on StreamVault?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No account is required. You can start watching immediately. However, creating a free account lets you save your watchlist and viewing history.',
        },
      },
    ],
  };

  // ItemList Schema — helps Google understand the content hierarchy
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Trending on StreamVault',
    description: 'Currently trending movies and TV shows on StreamVault',
    numberOfItems: trending.length,
    itemListElement: trending.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.title || item.name || 'Unknown',
      url: `${SITE_URL}/?${item.media_type === 'tv' ? 'tv' : 'movie'}=${item.id}`,
      image: item.poster_path
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
    </>
  );
}
