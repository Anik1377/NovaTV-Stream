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
