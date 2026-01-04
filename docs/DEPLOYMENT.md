# Deployment guide

## Supabase (backend)
1. Create a new Supabase project (free tier).
2. Go to SQL Editor and run the SQL files in `db/` in this order:
   - `db/schema.sql`
   - `db/rls_policies.sql`
   - `db/auth_triggers.sql`
   - `db/assign_university.sql`
3. Create a Storage bucket (e.g. `public`) and set access rules according to your needs.
4. In Settings → API copy the `URL` and `anon` key.

## Frontend (Vercel / Netlify)
1. Create a new Git repository and push this project.
2. Connect Vercel or Netlify to your GitHub repo.
3. In the project settings, add the two environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — the default build command is `npm run build` and publish folder is `web/dist`.

### Quick Netlify CI
This repo includes a GitHub Action (`.github/workflows/deploy_netlify.yml`) that builds and deploys `web/dist` to Netlify when you push to `main`.
You need to add two repository secrets in GitHub:
- `NETLIFY_AUTH_TOKEN` — create a Personal Access Token in Netlify
- `NETLIFY_SITE_ID` — your site id (from site settings)

## PWA setup
- `web/manifest.json` is included and small icons are provided under `web/public/icons`.
- A basic service worker `web/src/sw.js` is included and registered automatically on load.

## Storage and images
- Create a bucket (e.g., `public`) in Supabase Storage and set read rules so images can be served publicly (or adjust URLs to require signed URLs).
- The app resizes images client-side before uploading to keep bandwidth low.

## Admin / moderation setup
- To grant admin rights to a user for a university, run the SQL (replace `profile_id` and `university_id` with the appropriate UUIDs):

```
INSERT INTO admins (profile_id, university_id, role) VALUES ('profile-uuid','university-uuid','admin');
```

- Use the Supabase SQL Editor or CLI to run admin and moderation RPC functions (`admin_remove_item`, `admin_set_user_banned`, `admin_update_report`). These functions enforce authorization server-side.

## Required SQL order
Run these SQL files in Supabase SQL Editor in this order:
1. `db/schema.sql`
2. `db/rls_policies.sql`
3. `db/auth_triggers.sql`
4. `db/assign_university.sql`
5. `db/search.sql`
6. `db/groups_and_moderation.sql`
7. `db/insert_item_rate_limit.sql`

This will prepare the DB for production use.

## Notes
- For migrations or administrative DB tasks you may need the Supabase Service Role key; keep it secret and never expose it to the client.
- For image uploads, use Supabase Storage SDK from client and store path references in `items.image_path`.
