/* ── MovieBox.ph API Client ──
 * Proxies requests to the upstream MovieBox API (h5-api.aoneroom.com)
 * with auto-managed guest JWT tokens.
 */

const API_BASE = 'https://h5-api.aoneroom.com/wefeed-h5api-bff';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  Referer: 'https://moviebox.ph/',
  Origin: 'https://moviebox.ph',
  'X-Client-Info': '{"timezone":"Asia/Dhaka"}',
  'X-Request-Lang': 'en',
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
};

const PLAYER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'X-Client-Info': '{"timezone":"Asia/Dhaka"}',
  'X-Source': '',
  'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
};

/* ── In-memory token cache (survives hot reload in dev) ── */
let _bearerToken: string | null = null;
let _tokenFetchedAt = 0;
const TOKEN_TTL = 50 * 60 * 1000; // 50 min

async function getBearerToken(): Promise<string> {
  if (_bearerToken && Date.now() - _tokenFetchedAt < TOKEN_TTL) {
    return _bearerToken;
  }
  try {
    const resp = await fetch(`${API_BASE}/home?host=moviebox.ph`, {
      headers: DEFAULT_HEADERS,
      redirect: 'follow',
    });
    // Try x-user header for token
    const xUser = resp.headers.get('x-user');
    if (xUser) {
      const parsed = JSON.parse(xUser);
      if (parsed.token) {
        _bearerToken = parsed.token;
        _tokenFetchedAt = Date.now();
        return _bearerToken;
      }
    }
    // Fallback: set-cookie
    const cookie = resp.headers.get('set-cookie') || '';
    const m = cookie.match(/token=([^;]+)/);
    if (m) {
      _bearerToken = m[1];
      _tokenFetchedAt = Date.now();
      return _bearerToken;
    }
  } catch (e) {
    console.error('[MovieBox] Failed to fetch token:', e);
  }
  return _bearerToken || '';
}

async function refreshIfNeeded(response: Response) {
  const xUser = response.headers.get('x-user');
  if (xUser) {
    try {
      const parsed = JSON.parse(xUser);
      if (parsed.token) {
        _bearerToken = parsed.token;
        _tokenFetchedAt = Date.now();
      }
    } catch {
      /* ignore */
    }
  }
}

export async function movieboxFetch(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<{ data: unknown; status: number }> {
  const token = await getBearerToken();
  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const resp = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: 'follow',
  });

  await refreshIfNeeded(resp);

  if (!resp.ok) {
    return { data: { error: `Upstream error: ${resp.status}` }, status: resp.status };
  }

  const data = await resp.json();
  return { data, status: resp.status };
}

/* ── Stream domain discovery ── */
async function getPlayerDomain(): Promise<string> {
  const { data } = await movieboxFetch('/media-player/get-domain');
  return (data as any)?.data || 'https://netfilm.world';
}

/* ── Public API functions ── */

export async function getMovieboxHome() {
  const { data } = await movieboxFetch('/home?host=moviebox.ph');
  const raw = (data as any)?.data || {};
  const sections: Array<{
    section: string;
    count: number;
    items: Array<{
      name: string;
      poster_url: string;
      slug: string;
      subject_id: string;
      badge?: string;
      rating?: string;
    }>;
  }> = [];

  for (const op of raw.operatingList || []) {
    const opType = op.type;
    const title = op.title || 'Featured';

    if (opType === 'BANNER') {
      const items = (op.banner?.items || [])
        .filter((item: any) => item.title && !item.title.includes('Communities'))
        .map((item: any) => ({
          name: item.title || item.subject?.title,
          poster_url: item.image?.url || item.subject?.cover?.url,
          slug: item.detailPath || item.subject?.detailPath,
          subject_id: item.subject?.subjectId,
          badge: item.subject?.corner,
        }));
      if (items.length) sections.push({ section: 'Banner', count: items.length, items });
    } else if (['SUBJECTS_MOVIE', 'SUBJECTS_TV', 'SUBJECTS_ANIMATION'].includes(opType)) {
      const items = (op.subjects || []).map((sub: any) => ({
        name: sub.title,
        poster_url: sub.cover?.url,
        slug: sub.detailPath,
        subject_id: sub.subjectId,
        badge: sub.corner,
        rating: sub.imdbRatingValue,
      }));
      if (items.length) sections.push({ section: title, count: items.length, items });
    }
  }
  return { status: 'success', sections };
}

export async function getMovieboxCategory(
  tabId: number,
  page = 1,
  perPage = 24,
  sort = 'RECOMMEND',
) {
  const { data } = await movieboxFetch('/subject/filter', {
    method: 'POST',
    body: {
      tabId,
      filter: { sort, genre: 'ALL', country: 'ALL', year: 'ALL', language: 'ALL' },
      page,
      perPage,
    },
  });

  const inner = (data as any)?.data || {};
  const rawItems = inner.items || inner.subjects || [];
  const items = rawItems.map((sub: any) => ({
    name: sub.title,
    poster_url: sub.cover?.url,
    slug: sub.detailPath,
    subject_id: sub.subjectId,
    badge: sub.corner,
    rating: sub.imdbRatingValue,
    year: sub.releaseDate?.substring(0, 4) || null,
  }));

  const total = inner.pager?.totalCount || inner.total || items.length;
  return { page, per_page: perPage, total, items };
}

export async function searchMoviebox(query: string, page = 1) {
  const { data } = await movieboxFetch('/subject/search', {
    method: 'POST',
    body: { keyword: query, page, perPage: 20 },
  });

  const inner = (data as any)?.data || {};
  const raw = inner.items || inner.list || [];
  const items = raw.map((sub: any) => ({
    name: sub.title,
    poster_url: sub.cover?.url,
    slug: sub.detailPath,
    subject_id: sub.subjectId,
  }));

  const total = inner.pager?.totalCount || inner.total || items.length;
  return { query, page, total, items };
}

export async function suggestMoviebox(query: string) {
  const { data } = await movieboxFetch('/subject/search-suggest', {
    method: 'POST',
    body: { keyword: query, perPage: 10 },
  });

  const inner = (data as any)?.data || {};
  const raw = inner.items || inner.list || [];
  const suggestions = raw.map((item: any) => {
    const sub = item.subject || {};
    return {
      title: sub.title || item.word || item.title,
      slug: sub.detailPath || item.detailPath,
      subject_id: sub.subjectId || item.subjectId,
      poster_url: sub.cover?.url,
    };
  });
  return { suggestions };
}

export async function getMovieboxDetail(slug: string) {
  const { data, status } = await movieboxFetch(`/detail?detailPath=${encodeURIComponent(slug)}`);
  return { data: (data as any)?.data, status };
}

export interface StreamSource {
  resolution: string;
  format: string;
  url: string;
  size?: number;
  duration?: number;
  codec?: string;
}

export interface StreamResult {
  subject_id: string;
  se: number;
  ep: number;
  has_resource: boolean;
  sources: StreamSource[];
  hls: any[];
  dash: any[];
  free_episodes?: number;
  limited?: boolean;
  note?: string | null;
}

export async function getMovieboxStream(
  subjectId: string,
  detailPath: string,
  se = 1,
  ep = 1,
): Promise<StreamResult> {
  // Step 1: get player domain
  let domain: string;
  try {
    domain = await getPlayerDomain();
  } catch {
    domain = 'https://netfilm.world';
  }
  domain = domain.replace(/\/+$/, '');

  // Step 2: build referer
  const playerReferer = `${domain}/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail&detailSe=${se}&detailEp=${ep}&lang=en`;
  const playUrl = `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}&se=${se}&ep=${ep}&detailPath=${encodeURIComponent(detailPath)}`;

  const resp = await fetch(playUrl, {
    headers: { ...PLAYER_HEADERS, Referer: playerReferer },
    redirect: 'follow',
  });

  const json = await resp.json();
  const d = json.data || {};

  const streams: StreamSource[] = (d.streams || []).map((s: any) => ({
    resolution: `${s.resolutions}p`,
    format: s.format,
    url: s.url,
    size: s.size,
    duration: s.duration,
    codec: s.codecName,
  }));

  return {
    subject_id: subjectId,
    se,
    ep,
    has_resource: !!d.hasResource,
    sources: streams,
    hls: d.hls || [],
    dash: d.dash || [],
    free_episodes: d.freeNum,
    limited: d.limited || false,
    note: d.hasResource ? null : 'No stream found for this episode.',
  };
}

export interface Caption {
  url: string;
  language: string;
  label?: string;
}

export async function getMovieboxCaptions(
  subjectId: string,
  detailPath: string,
  se = 1,
  ep = 1,
): Promise<{ subject_id: string; se: number; ep: number; count: number; captions: Caption[] }> {
  // First get stream info to find stream ID
  let domain: string;
  try {
    domain = await getPlayerDomain();
  } catch {
    domain = 'https://netfilm.world';
  }
  domain = domain.replace(/\/+$/, '');

  const playerReferer = `${domain}/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail&detailSe=${se}&detailEp=${ep}&lang=en`;
  const playUrl = `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}&se=${se}&ep=${ep}&detailPath=${encodeURIComponent(detailPath)}`;

  const playResp = await fetch(playUrl, {
    headers: { ...PLAYER_HEADERS, Referer: playerReferer },
    redirect: 'follow',
  });
  const playJson = await playResp.json();
  const playData = playJson.data || {};

  const streams = playData.streams || [];
  const dash = playData.dash || [];

  let streamId: string | null = null;
  let streamFormat = 'MP4';
  if (streams.length) {
    streamId = streams[0].id;
    streamFormat = streams[0].format || 'MP4';
  } else if (dash.length) {
    streamId = dash[0].id;
    streamFormat = dash[0].format || 'DASH';
  }

  if (!streamId) {
    return { subject_id: subjectId, se, ep, count: 0, captions: [] };
  }

  const capUrl = `${API_BASE}/subject/caption?format=${streamFormat}&id=${streamId}&subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath)}`;
  const { data } = await movieboxFetch(capUrl);

  const inner = (data as any)?.data;
  const captions: Caption[] = Array.isArray(inner?.captions)
    ? inner.captions.map((c: any) => ({ url: c.url, language: c.language, label: c.label }))
    : [];

  return { subject_id: subjectId, se, ep, count: captions.length, captions };
}
