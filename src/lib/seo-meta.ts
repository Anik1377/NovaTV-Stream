/**
 * seo-meta.ts — Client-side SEO meta tag & JSON-LD utilities for SPA navigation.
 *
 * Googlebot executes JavaScript and reads the DOM after render, so dynamically
 * updating <title>, <meta>, and injecting JSON-LD in the client is effective
 * for search-engine discoverability on SPA routes.
 *
 * Usage (from a React component's useEffect):
 *   updatePageMeta({ title: 'Inception', description: '…', image: '…', type: 'movie' });
 *   injectJsonLd({ '@type': 'Movie', name: 'Inception', … }, 'movie-27205');
 *   // on unmount / navigation away:
 *   removeJsonLd('movie-27205');
 *   resetPageMeta();
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SITE_NAME = 'StreamVault';
const SITE_URL = 'https://stvault.vercel.app';
const DEFAULT_TITLE = `${SITE_NAME} - Watch Movies & TV Shows Online Free`;
const DEFAULT_DESCRIPTION =
  'StreamVault is your free streaming hub for movies, TV shows, anime, live TV channels, manga, and games. Watch trending content from Netflix, Prime, Disney+, and more — all in one place.';

/** Attribute used to mark every meta tag we inject so we can clean them up. */
const DATA_ATTR = 'data-sv-seo';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Set (or create) a <meta> element identified by its `name` or `property`. */
function setMeta(
  attr: 'name' | 'property',
  key: string,
  value: string,
): void {
  // First try to find an existing one (could be one we injected before, or a
  // static one from the server-rendered layout).
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;

  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute(DATA_ATTR, ''); // mark as ours
    document.head.appendChild(el);
  } else {
    // Tag already existed — mark it as ours so removeInjectedTags() can reach it.
    el.setAttribute(DATA_ATTR, '');
  }

  el.setAttribute('content', value);
}

/** Remove all <meta> tags we previously injected. */
function removeInjectedTags(): void {
  document.head
    .querySelectorAll(`meta[${DATA_ATTR}]`)
    .forEach((el) => el.remove());
}

/** Map the generic `type` to an Open Graph type string. */
function ogType(type?: 'movie' | 'tv' | 'website'): string {
  if (type === 'movie') return 'video.movie';
  if (type === 'tv') return 'video.tv_show';
  return 'website';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PageMetaOptions {
  /** Page title (will be formatted as "{title} | StreamVault"). */
  title: string;
  /** Meta description (also used for OG & Twitter). */
  description: string;
  /** Absolute URL to an OG/Twitter image. Falls back to the site icon. */
  image?: string;
  /** Canonical URL for this page. Falls back to `window.location.href`. */
  url?: string;
  /** Helps pick the right OG `type` and JSON-LD schema shape. */
  type?: 'movie' | 'tv' | 'website';
}

/**
 * Update the document's SEO-related meta tags for the current view.
 *
 * This mutates `document.title` and creates/updates the following <meta> tags:
 *   - `<meta name="description">`
 *   - OG: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
 *   - Twitter: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
 *
 * Previous calls' injected tags are cleaned up automatically so the head never
 * accumulates stale entries.
 */
export function updatePageMeta(opts: PageMetaOptions): void {
  // 1. Clean up any tags we injected on a *previous* call.
  removeInjectedTags();

  // 2. Set the document title.
  document.title = `${opts.title} | ${SITE_NAME}`;

  // 3. Resolve values with sensible defaults.
  const url = opts.url || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const image = opts.image || `${SITE_URL}/icon-512.png`;
  const type = opts.type ?? 'website';

  // 4. <meta name="description">
  setMeta('name', 'description', opts.description);

  // 5. Open Graph tags
  setMeta('property', 'og:title', `${opts.title} | ${SITE_NAME}`);
  setMeta('property', 'og:description', opts.description);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:image:width', '1200');
  setMeta('property', 'og:image:height', '630');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', ogType(type));
  setMeta('property', 'og:site_name', SITE_NAME);

  // 6. Twitter Card tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', `${opts.title} | ${SITE_NAME}`);
  setMeta('name', 'twitter:description', opts.description);
  setMeta('name', 'twitter:image', image);

  // 7. Update the canonical link if one exists (created by Next.js layout).
  const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (canonical) {
    canonical.href = url;
  }
}

/**
 * Inject a JSON-LD `<script>` block into the document head.
 *
 * @param data  The structured-data object (should already include `@context` & `@type`).
 * @param id    A unique identifier so the block can be removed later (e.g. `'movie-27205'`).
 */
export function injectJsonLd(data: object, id: string): void {
  // Remove any previous block with the same id first (idempotent).
  removeJsonLd(id);

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = `jsonld-${id}`;
  script.setAttribute(DATA_ATTR, '');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Remove a JSON-LD block that was injected with the given id.
 */
export function removeJsonLd(id: string): void {
  const el = document.getElementById(`jsonld-${id}`);
  if (el) el.remove();
}

/**
 * Reset the document's meta tags back to the site-wide defaults.
 *
 * Call this when navigating away from a content detail page back to a
 * generic view (home, search, genre browse, etc.).
 */
export function resetPageMeta(): void {
  // Remove all injected meta & JSON-LD tags.
  removeInjectedTags();
  document.head
    .querySelectorAll(`script[${DATA_ATTR}]`)
    .forEach((el) => el.remove());

  // Restore the default title.
  document.title = DEFAULT_TITLE;

  // Restore the canonical to root.
  const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (canonical) {
    canonical.href = `${SITE_URL}/`;
  }
}

// ---------------------------------------------------------------------------
// Convenience: build Movie JSON-LD
// ---------------------------------------------------------------------------

export interface MovieJsonLdProps {
  title: string;
  overview: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  tmdbId: number;
  genres: string[];
  rating?: number;
  runtime?: number;
  directors?: string[];
  actors?: string[];
}

/**
 * Build a Schema.org `Movie` JSON-LD object ready for `injectJsonLd()`.
 */
export function buildMovieJsonLd(props: MovieJsonLdProps): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: props.title,
    description: props.overview,
    url: `${SITE_URL}/?movie=${props.tmdbId}`,
    image: props.posterUrl || `${SITE_URL}/icon-512.png`,
    datePublished: props.releaseDate || undefined,
    genre: props.genres,
    ...(props.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: props.rating, bestRating: 10, worstRating: 0, ratingCount: 1 } } : {}),
    ...(props.runtime ? { duration: `PT${props.runtime}M` } : {}),
    ...(props.directors?.length ? { director: props.directors.map((n) => ({ '@type': 'Person', name: n })) } : {}),
    ...(props.actors?.length ? { actor: props.actors.map((n) => ({ '@type': 'Person', name: n })) } : {}),
  };
}

// ---------------------------------------------------------------------------
// Convenience: build TV Series JSON-LD
// ---------------------------------------------------------------------------

export interface TvShowJsonLdProps {
  title: string;
  overview: string;
  firstAirDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  tmdbId: number;
  genres: string[];
  rating?: number;
  numberOfSeasons?: number;
  creators?: string[];
}

/**
 * Build a Schema.org `TVSeries` JSON-LD object ready for `injectJsonLd()`.
 */
export function buildTvShowJsonLd(props: TvShowJsonLdProps): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: props.title,
    description: props.overview,
    url: `${SITE_URL}/?tv=${props.tmdbId}`,
    image: props.posterUrl || `${SITE_URL}/icon-512.png`,
    datePublished: props.firstAirDate || undefined,
    genre: props.genres,
    ...(props.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: props.rating, bestRating: 10, worstRating: 0, ratingCount: 1 } } : {}),
    ...(props.numberOfSeasons ? { numberOfSeasons: props.numberOfSeasons } : {}),
    ...(props.creators?.length ? { creator: props.creators.map((n) => ({ '@type': 'Person', name: n })) } : {}),
  };
}
