# Senrio Sale (Senior-Sale2)

Senrio Sale is a mobile-first marketplace for college students — a campus-restricted marketplace built as a Progressive Web App (PWA). This repository contains scaffold files, database schema, and a minimal frontend to help you get a working MVP quickly using free tiers (Supabase + Vercel/Netlify).

## Quick start (developer)
1. Create a Supabase project.
2. Run the SQL in `db/schema.sql` and `db/rls_policies.sql` in Supabase SQL Editor.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a `.env.local` file in `web/` or to your deployment platform.
4. Run the frontend locally:
   - cd web
   - npm install
   - npm run dev

## Project layout
- `web/` — React + Vite PWA scaffold and example pages (Auth + Feed).
- `db/` — SQL schema and RLS policy files for Supabase.
- `docs/` — architecture and design notes.

## Next steps
- Provision Supabase storage buckets and update policies so that only authenticated users can upload images.
- Implement a sign-up hook or trigger to create a `profiles` entry when a user verifies their email.
- Create lightweight moderation/admin UI for reviewing reports.

---

For more details and guidance, see `docs/ARCHITECTURE.md` and the SQL files in `db/`.
