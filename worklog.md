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
