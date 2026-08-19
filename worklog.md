---
Task ID: 2
Agent: main
Task: Fix mobile nav bugging after scrolling down

Work Log:
- Identified root cause: global CSS `*` rule had `transform` in `transition-property`, causing 300ms transform transitions on ALL elements including those inside framer-motion's `motion.div` (key={view}), leading to cascading animation conflicts
- Removed `transform` from the global wildcard CSS transition in `globals.css`
- Added `.transition-transform-smooth` utility class for elements that explicitly need transform transitions
- Changed `window.scrollTo({ behavior: 'smooth' })` to instant scroll in MobileTabBar handlers — smooth scroll was competing with the `motion.div` y-offset animation
- Simplified `motion.div` animation from `y:8 → 0` to opacity-only fade (removed vertical shift that caused layout jank)
- Added `will-change-transform` to MobileTabBar `nav` element for GPU compositing during scroll
- Added explicit `transition-transform duration-150 ease-out` to tab buttons for clean `active:scale-95` feedback
- Verified with Agent Browser: tab switches from scrolled positions work instantly without jank

Stage Summary:
- 3 files changed: `globals.css`, `MobileTabBar.tsx`, `page.tsx`
- Core fix: removed `transform` from global `*` transition-property (was causing framer-motion conflicts)
- Scroll changed from smooth to instant (eliminates competing animations)
- View transition simplified to opacity-only (no layout shift)
- Mobile tab bar gets `will-change-transform` for GPU-optimized rendering

---
Task ID: 1
Agent: main
Task: Add adult content section with real video streaming from internet APIs

Work Log:
- Researched adult content APIs via web search (TMDB, ThePornDB, Stash-box, RapidAPI, IAFD)
- Discovered ThePornDB and Stash-box require API keys/auth
- Found XVideos is freely accessible from server, has parseable HTML with video data
- Built XVideos HTML scraper with cheerio parsing video IDs, thumbnails, titles, durations, views, embed URLs
- Initially built mini-service on port 3031 but moved to direct Next.js API route due to connection issues
- Created /api/tmdb/adult route with trending, search, and category support
- Created /api/tmdb/adult/categories endpoint with 26 curated categories
- Completely rebuilt AdultPage component with: auth wall, settings gate, trending/search/category tabs, video grid with thumbnails, HD badges, duration, views, and embed iframe player
- Updated Sidebar to conditionally show 18+ tab only when user has adultEnabled
- Updated MobileTabBar to conditionally show 18+ tab only when user has adultEnabled
- Verified all endpoints: trending (47 videos), search (27 results), categories (26)
- Passed lint check, committed and pushed to GitHub

Stage Summary:
- XVideos chosen as the best free, no-auth adult content source
- Full scraping pipeline: HTML fetch → cheerio parse → clean JSON API
- Embed player uses https://www.xvideos.com/embedframe/{id} pattern
- Adult section is gated behind: 1) sign in, 2) profile setting toggle
- Adult tab only visible in navigation when enabled
