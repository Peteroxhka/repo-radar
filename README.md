# Repo Radar

GitHub open-source discovery feed + community features. A responsive static app hosted on GitHub Pages, backed by Supabase.

## Included

- Original discovery feed (collector still updates it every six hours)
- Modern responsive layout; dark, light, and cosmic themes; theme saved on the device
- Language switcher: English, Russian, Spanish, French, German, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi and Turkish. English fallback is used for untranslated strings. **Not all languages in the world are translated yet.**
- Supabase Auth: GitHub OAuth or email/password signup, email confirmation, account sign-out
- Public profile username; custom uploaded avatar for email accounts; GitHub OAuth users see their GitHub avatar
- Private one-to-one messages and file attachments (25 MB limit; allowlisted formats; no calls)
- Row Level Security for private messages and private Supabase Storage bucket

## IMPORTANT: complete Supabase setup before enabling community features

1. Open the Supabase project referenced in `config.js` (its URL and publishable key are browser-safe). Back up the database.
2. Run `supabase/migrations/20261112_community.sql` in the **Supabase SQL Editor** with a privileged project administrator. This creates profiles, messages, storage buckets and RLS. It does not delete the existing `repo_radar.repos` feed.
3. In Supabase **Settings → API → Exposed schemas**, add `repo_radar` if it isn't already exposed.
4. In **Authentication → Providers**, enable Email and GitHub. For GitHub OAuth, create a GitHub OAuth App with its callback URL set to the **Supabase Auth callback** provided by Supabase (usually `https://<project-ref>.supabase.co/auth/v1/callback`). Store the OAuth client secret only in Supabase; do **not** commit it. Set the site's origin and full GitHub Pages URL as allowed redirects in **Authentication → URL Configuration**.
5. On GitHub Pages, make sure **Settings → Pages → Source = GitHub Actions**. The existing `pages.yml` publishes `main` automatically.
6. Test with two separate accounts: email signup, GitHub sign-in, avatar upload, messages in both directions, a 25-MB-or-smaller document attachment, and verify a third account cannot read either user's messages or attachments.
7. Keep GitHub Actions secret `SUPABASE_SERVICE_KEY` for the existing `Collect repositories` job. Never use the service key in client-side files.

**Limitations**: Uploads are limited to 25 MB and allowlisted file formats. The storage policy is designed to prevent casual cross-user access; for production-scale moderation or malware checks, introduce a dedicated scanning and abuse-reporting workflow. Messages are protected by Supabase RLS but are **not end-to-end encrypted**. Localizations need native-speaker review. Passwords are handled by Supabase Auth, not stored by Repo Radar.

## Existing discovery feed

The `Collect repositories` workflow fetches GitHub Search data into `repo_radar.repos` every six hours, filtering unlicensed or unsuitable repos. The frontend reads this data with the public Supabase publishable key. This is kept as-is.
