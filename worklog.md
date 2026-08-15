---
Task ID: 1
Agent: Main Agent
Task: Migrate auth system from Prisma/bcryptjs to Supabase Auth

Work Log:
- Updated Prisma schema: made passwordHash optional, changed User.id from @default(cuid()) to @id (Supabase provides the ID)
- Rewrote src/lib/auth.ts: getSessionUser() now uses Supabase auth.getUser() instead of custom session cookie
- Rewrote src/app/api/auth/login/route.ts: uses supabase.auth.signInWithPassword()
- Rewrote src/app/api/auth/register/route.ts: uses supabase.auth.signUp() with user_metadata
- Rewrote src/app/api/auth/logout/route.ts: uses supabase.auth.signOut()
- Rewrote src/app/api/auth/me/route.ts: uses supabase.auth.getUser() with local user sync
- Created src/app/api/auth/google/route.ts: Google OAuth endpoint
- Updated src/app/api/profile/route.ts: profile updates also sync to Supabase user_metadata
- Updated src/app/api/profile/history/route.ts: uses new getSessionUser() (no req param)
- Updated src/store/auth-store.ts: added emailConfirmationRequired support, createdAt field
- Updated src/components/auth/AuthModal.tsx: added Google OAuth button with official Google colors, email confirmation message
- Made all Supabase helper files null-safe (return null when env vars missing)
- Verified via agent-browser: auth modal renders, login/register modes toggle, Google button visible, mobile profile tab works

Stage Summary:
- Auth system fully migrated to Supabase Auth (email/password + Google OAuth)
- Local Prisma User records created/synced on login for watch history compatibility
- Profile data (name, bio, avatar) stored in both Supabase user_metadata and local DB
- Zero console errors, clean lint, dev server stable
---
Task ID: 2-a
Agent: Main
Task: Fix Disney+ SVG logo

Work Log:
- Replaced broken custom Disney+ SVG with proper Simple Icons version

Stage Summary:
- Disney+ logo now uses standard Simple Icons format compatible with CSS masking
---
Task ID: 2-b
Agent: Main
Task: Add Asian Cinema page, fix OTT provider region, 50/50 Indian content integration

Work Log:
- Changed watch_region from 'IN' to 'US' in src/app/api/tmdb/providers/route.ts so OTT platforms (Hulu, Max, Peacock) return US content
- Verified home API already uses watch_region: 'US' for providers
- Created src/components/asian/AsianPage.tsx: full-featured Asian Cinema browsing page with Korean, Japanese, Chinese, Thai, Pakistani, Bangladeshi language sections, horizontal rows + grid view, lazy loading, media type tabs
- Added 'asian' to ViewType union in src/store/app-store.ts
- Added showAsian() action to app store
- Added AsianPage import and view rendering in src/app/page.tsx
- Added MobileBackHome for asian view
- Removed 'indian' category from EXTRA_CATEGORIES in page.tsx
- Removed mergeWithFiftyFifty/mergeWithRatio import (now handled server-side)
- Removed isIndian logic from category rendering in page.tsx
- Added Globe icon and showAsian to MobileTabBar: asian item in More drawer, active state handling
- Added Globe icon, showAsian, and asian nav item to Sidebar with rose color theme
- Added 'asian' to isSpecialView and showHamburger arrays in Sidebar
- Modified src/app/api/home/route.ts: added Indian movie/TV discover fetches, shuffleArray and mergeFiftyFifty helpers, merged popular movies/TV 50/50 global+Indian
- Removed 'indian' entry from CATEGORY_MAP in src/app/api/home/categories/route.ts

Stage Summary:
- OTT provider content now loads from US region for full platform availability
- Asian Cinema page added as dedicated section with 6 language filters and lazy loading
- Indian content integrated 50/50 into Popular Movies/TV rows server-side (randomized shuffle)
- Separate 'Indian Hits' category removed since Indian content is now blended into main popular rows
- Clean lint, all views (home, anime, asian, sidebar, mobile tab bar) properly wired---
Task ID: 1
Agent: main
Task: Fix Bangladeshi tab to only show Dhallywood films

Work Log:
- Identified root cause: AsianPage used `with_original_language=bn` which returns ALL Bengali content (India + Bangladesh)
- Added `with_origin_country` support to `/api/tmdb/discover` route
- Added `min_votes` parameter to discover route for smaller film industries
- Updated Bangladeshi language config: `originCountry: 'BD'` to filter only Dhallywood films
- Also added `originCountry: 'PK'` for Pakistani content for consistency
- Set `minVotes: '0'` for both BD and PK since these industries have fewer TMDB votes
- Verified API returns 2,029 Dhallywood results with no Indian Bengali films mixed in

Stage Summary:
- Bangladeshi tab now correctly shows only Dhallywood (Bangladeshi) films
- No more Indian Bengali/Tollywood films appearing in the Bangladeshi section
- Pakistani tab also improved with country filter

---
Task ID: 2
Agent: main
Task: Add movie title logos + studio logos to hero carousel

Work Log:
- Created /api/tmdb/hero-logos endpoint that fetches TMDB images (logos) + details (production_companies) in batches of 4
- Logo selection logic: prefer English logos, then any language, sort by aspect ratio (wider = better title treatment)
- Studio logos: up to 4 production companies with logo_path, displayed at w92 size
- Updated Hero component to fetch logo data on mount for top 8 trending movies
- Title section: shows <img> of title logo if available, otherwise falls back to <h1> text
- Studio logos section: horizontal row of grayscale studio logos between title and tagline, with hover brightness effect
- Verified via browser: Spider-Man: Brand New Day shows stylized logo + Marvel Studios/Columbia Pictures/Pascal Pictures studio logos

Stage Summary:
- New file: src/app/api/tmdb/hero-logos/route.ts
- Modified: src/components/movie/Hero.tsx
- Hero carousel now shows official title treatment logos when available, text fallback otherwise
- Studio/production company logos displayed below title in grayscale row
