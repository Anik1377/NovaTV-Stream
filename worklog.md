---
Task ID: 1
Agent: main
Task: Fix critical bugs and verify movie streaming website

Work Log:
- Reviewed entire existing codebase (10+ components, 8 API routes)
- Found and fixed 3 critical bugs:
  1. `VideoPlayer.tsx` line 1: `'client'` → `'use client'`
  2. `VideoPlayer.tsx` line 3: Missing `useEffect` import (used on line 35)
  3. `MovieCard.tsx` line 1: `'client'` → `'use client'`
- Started dev server and confirmed all API routes respond with 200
- Verified with Agent Browser:
  - Homepage: Hero carousel, genre pills, 5 content rows (Trending, Popular Movies, Popular TV, Top Rated, Coming Soon)
  - Movie Detail: Poster, metadata, genres, Play Movie button, cast, director, similar movies
  - Movie Player: Fullscreen iframe from vidsrc.sbs/embed/movie/{id}, close button, fullscreen toggle
  - TV Detail: Poster, metadata, season dropdown, episode list with thumbnails/ratings, cast, similar shows
  - TV Player: Episode player with S01E01 format title, correct iframe URL
  - Search: Debounced search returning combined movies + TV shows, sorted by popularity
  - Genre View: Filtered content with All/Movies/TV Shows tabs

Stage Summary:
- All features working end-to-end
- TMDB API integration confirmed with user's API key
- Video embeds working via vidsrc.sbs for both movies and TV shows
- No runtime errors observed

---
Task ID: 2
Agent: main
Task: Add select provider options for video streaming

Work Log:
- Created `/src/lib/providers.ts` with 7 provider definitions (VidSrc, VidSrc ICU, VidSrc Pro, Embed.su, 2Embed, MultiEmbed, MoviesAPI)
- Added `selectedProvider` and `setSelectedProvider` to Zustand store (`/src/store/app-store.ts`), default: `vidsrc-sbs`
- Created `ProviderSelector` component — animated bottom sheet with provider cards, active state tracking, staggered animations
- Updated `VideoPlayer` — added in-player provider switcher dropdown in top bar, `key={currentSrc}` for iframe reload on provider switch, provider-aware loading/error states
- Updated `MovieDetail` — Play Movie button opens provider selector, Source button shows current provider, provider selection persists
- Updated `TvDetail` — Play S01E01 button and episode clicks open provider selector, Source button shows current provider
- Fixed typo in VideoPlayer.tsx (extra `n` character in className)
- Fixed missing closing `}` in TvDetail.tsx comment
- Lint passes clean
- Verified with Agent Browser:
  - Movie detail: Play Movie → provider bottom sheet opens with 7 providers
  - Selected VidSrc Pro → player opened with correct embed URL
  - TV detail: Provider selector appears on episode click and Play button
  - Provider preference persists across movie/TV navigation

Stage Summary:
- 7 streaming providers available: VidSrc, VidSrc ICU, VidSrc Pro, Embed.su, 2Embed, MultiEmbed, MoviesAPI
- Provider selection UX: bottom sheet on detail pages, dropdown inside player
- Provider preference remembered across navigation via Zustand store
- Clean OTT-quality UI with provider icons, descriptions, and active state indicators
