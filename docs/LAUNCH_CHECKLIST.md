# Launch checklist — minimal items before sharing a public link

1. Supabase project provisioned and SQL migrated (see `docs/DEPLOYMENT.md`).
2. Create Storage bucket `public` and set public read if you want images to be served without signed URLs.
3. Add initial universities (insert rows into `universities`) for the campuses you will launch on.
4. Add at least one admin account (insert row into `admins`) using a profile ID and university ID.
5. Set GitHub repo secrets for Netlify deploy: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.
6. Push `main` to trigger build & deploy. Confirm the site is live and environment variables are set.
7. Test: sign up with a `.edu` email, verify it, create a post, test group creation and join flows, and test report flow.
8. Add privacy policy and terms and ensure contact email is configured.
9. Monitor Supabase usage and set alerts for usage thresholds.

---

For small closed betas: invite by email and restrict launch to known student groups. Use the admin dashboard to manage reports and ban users if necessary.
