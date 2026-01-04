# Senrio Sale — Architecture Overview

## Overview
Senrio Sale is a mobile-first marketplace for college students. The MVP uses a serverless-friendly architecture centered on Supabase (open-source Firebase alternative) and a React PWA for the frontend.

## Components
- Frontend (PWA): React + Vite, Tailwind CSS for fast, mobile-first UI.
- Auth + Database + Storage: Supabase (Auth, Postgres, Storage).
- CI/CD: GitHub Actions for build and lint; Deploy frontend to Vercel/Netlify (free tier); backend uses Supabase project.

## Data flow
1. User signs up with a `.edu` email via Supabase Auth (email link verification).
2. After verification, a `profiles` row is created (manually or via a trigger). Profiles contain `university_id` linking the user to their university.
3. When posting, items are uploaded to Supabase Storage and metadata inserted into `items` table with the `university_id` set to the poster's university.
4. Feed queries only return items where `items.university_id = profiles.university_id` (enforced with RLS for security).

## Security & Access control
- Use Postgres Row-Level Security (RLS) to guarantee that users only access their university's data.
- Enforce `.edu` signups in frontend and verify server-side by matching email domain against the `universities` table.
- Reports and moderation tools are available to remove content.

## Groups & Moderation
- Groups can be `public` or `private`. Public groups are discoverable and their posts are visible to all members of the university. Private groups require join requests and accepted members to view posts.
- Posts may be targeted to groups using `items.group_id`; RLS policies enforce visibility (public groups or members only). Group membership is stored in `group_memberships`.
- Moderation: admins (per-university) and group moderators can remove posts and accept join requests. Reports are stored in `reports` and handled by the admin dashboard.
- Admin functions (remove item, ban user, update report status) are implemented as safe SQL functions that check `auth.uid()` and admin membership.

## Why this stack?
- Supabase gives a free tier good for early testing and includes all necessary building blocks: auth, storage, relational DB, functions.
- PWA avoids App Store friction and is installable on phones.

---

Next steps:
- Create the DB schema and RLS policies in `db/schema.sql` and `db/rls_policies.sql`.
- Add a minimal React + Vite scaffold in `web/` that integrates Supabase auth and displays the university-restricted feed.
