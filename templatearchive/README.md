# Template Archive

A private, installable PWA for your templates, snippets and notes. Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), hosted on Vercel.

## Status
Built and checked locally: TypeScript, ESLint, 17 unit tests, production build, and a signed-out smoke test (every private page and `/api/export` redirect to `/login`).
**Not yet verified against a real Supabase project or Vercel**: login, row-level security, saving and copying templates, import/export, PWA install, offline page. Follow the checklist at the bottom.

## Setup
1. **Supabase**: create a free project. In *Authentication > Providers > Email*, turn OFF "Enable sign ups". In *Authentication > Users*, add your user (email + password).
2. In the SQL editor run `supabase/migrations/0001_init.sql`, then register yourself as the only allowed user:
   `insert into public.app_admins (user_id) select id from auth.users where email = 'YOU@EXAMPLE.COM';`
3. Copy `.env.example` to `.env.local` and fill in the project URL and **anon** key (Project Settings > API). Never use or commit the service_role key; this app does not need it.
4. `npm install && npm run dev`, open http://localhost:3000 and sign in.
5. **Vercel**: import the GitHub repo, add the same two environment variables, deploy.

## Security model
- Public sign-up is disabled; only users listed in `app_admins` get access (row-level security on every table; the `anon` role has no table access).
- Every page, server action and the export route calls `requireOwner()`, which validates the session with Supabase and checks `app_admins`. Middleware redirects signed-out visitors. The browser never talks to Supabase directly; sessions live in HTTP-only cookies.
- Server-side validation with zod; content is rendered as text (React escapes it), never as HTML, so no HTML sanitiser is needed.
- Security headers and a CSP are set in `next.config.ts`. Limitation: the CSP allows inline scripts (needed by Next.js); a nonce-based CSP is a future improvement.
- Login rate limiting is provided by Supabase Auth's built-in limits, not by app code. Check them in your Supabase dashboard.
- Recovery: reset the password from the Supabase dashboard (Authentication > Users). To change the admin, edit `app_admins` in the SQL editor.

## PWA and offline
`public/sw.js` caches only the offline page and icons. Private pages and data are never cached, so templates are **not readable offline** and nothing private stays on the device after logout. Logout also clears any caches. Offline reading of private content and offline editing are deliberately not implemented.

## Data
Admin > Export and import downloads/uploads one JSON file. Import only adds templates whose id is not already present; it never overwrites. Free Supabase projects pause after a week of inactivity and have no automatic backups, so export regularly. CSV is not offered.

## Costs (as found Oct 2026; re-check before relying on them)
Supabase Free: 500 MB database, 50,000 monthly active users, pauses after 1 week of inactivity. Vercel Hobby and GitHub: verify current terms yourself; not checked here. No paid services are used.

## Custom domain later
Add the domain in Vercel and follow its DNS instructions (HTTPS is automatic). In Supabase, if you add redirect-based auth later, update the Site URL and redirect URLs. No code or environment variable changes are needed because the app uses relative URLs.

## Known gaps
No search highlighting, no CSV, no attachments, no logo upload or appearance settings beyond light/dark, no keyboard shortcut other than `/` for search, zod 3 has an open advisory (mitigated by size limits, upgrade to zod 4 later), the nested postcss advisory is build-time only. Login rate limiting is not tested.

## Manual verification checklist
Sign in and out; sign-in with a non-admin user is refused; create, edit, copy (paste elsewhere and compare), duplicate, delete a template; search and filters; categories and tags; dashboard settings; export then import; run `supabase/tests/rls_check.sql`; install the PWA; go offline and confirm the offline page; confirm in browser dev tools that Cache Storage holds no private pages.
