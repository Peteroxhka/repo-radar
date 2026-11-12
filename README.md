# Repo Radar

GitHub open-source discovery feed + community features. A responsive static app hosted on GitHub Pages, backed by Supabase.

## Included

- Large public GitHub repository catalog, imported incrementally from GitHub's official public-repositories endpoint
- Discovery feed refreshed with popular, recently active projects every six hours
- Responsive catalog with server-side search, language/category filters, infinite scrolling, and manual pagination fallback
- Dark, light, and cosmic themes; theme saved on the device
- Language switcher: English, Russian, Spanish, French, German, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi and Turkish. English fallback is used for untranslated strings. **Not all languages in the world are translated yet.**
- Supabase Auth: GitHub OAuth or email/password signup, email confirmation, account sign-out
- Public profile username; custom uploaded avatar for email accounts; GitHub OAuth users see their GitHub avatar
- Private one-to-one messages and file attachments (25 MB limit; allowlisted formats; no calls)
- Row Level Security for private messages and private Supabase Storage bucket

## IMPORTANT: complete Supabase setup before enabling community features

1. Open the Supabase project referenced in `config.js` (its URL and publishable key are browser-safe). Back up the database.
2. First run `supabase/migrations/20261111_base.sql` (also safe for an existing catalog). Then run `supabase/migrations/20261112_community.sql` in the **Supabase SQL Editor** with a privileged project administrator. This creates profiles, messages, storage buckets and RLS. It does not delete the existing `repo_radar.repos` feed.
3. Run `supabase/migrations/20261112_public_catalog.sql`. It adds metadata columns and a private cursor table for resumable bulk import. It does not delete existing repositories.
4. Run `supabase/migrations/20261112_catalog_api_hardening.sql`. It makes the browser catalog read-only and adds a safe language-list function.
5. Run `supabase/migrations/20261112_private_profile_trigger.sql`, then `supabase/migrations/20261113_chat_reliability.sql`. These are repeatable and preserve data. This repository uses manual SQL Editor scripts in the documented order, not a Supabase CLI migration history (the legacy files share a date prefix).

   In Supabase **Settings → API → Exposed schemas**, add `repo_radar` if it isn't already exposed. Keep `collector_state` inaccessible to `anon` and `authenticated`; only the service role needs it.
6. In **Authentication → Providers**, enable Email and GitHub. For GitHub OAuth, create a GitHub OAuth App with its callback URL set to the **Supabase Auth callback** provided by Supabase (usually `https://<project-ref>.supabase.co/auth/v1/callback`). Store the OAuth client secret only in Supabase; do **not** commit it. Set the site's origin and full GitHub Pages URL as allowed redirects in **Authentication → URL Configuration**.
7. On GitHub Pages, make sure **Settings → Pages → Source = GitHub Actions**. The existing `pages.yml` publishes `main` automatically.
8. In GitHub **Settings → Secrets and variables → Actions**, set `SUPABASE_SERVICE_KEY` to a current secret/service-role key from the exact Supabase project in `config.js`. Never put this key in `config.js` or commit it. The public browser only uses the publishable key.
9. Run **Actions → Collect repositories → Run workflow**. Each run imports up to 25,500 public repositories (850 API pages × 30 items) and saves its cursor. The hourly schedule continues the import automatically; after the first 100,000+ records, it keeps indexing newly created public repositories. The importer uses GitHub's official `GET /repositories?since=<last-repository-id>` endpoint, which lists public repositories in creation order. The built-in `GITHUB_TOKEN` is limited to 1,000 REST requests per hour per repository, so each run reserves headroom and resumes in the next run.
10. Test with two separate accounts: email signup, GitHub sign-in, avatar upload, messages in both directions, a 25-MB-or-smaller document attachment, and verify a third account cannot read either user's messages or attachments.

## Catalog notes

- This is a real metadata index of public GitHub repositories, not a clone of GitHub's code or Git objects. It stores repository IDs, names, descriptions, topics, languages, stars, license identifiers, dates, and basic repository statistics.
- Public GitHub repositories are not automatically open source. A missing `license_spdx` means GitHub did not identify a repository license; check the repository's own terms before reusing its code.
- The public-repository endpoint paginates by repository ID. The importer persists the last ID only after the corresponding rows have been committed, so interrupted runs resume safely. Existing rows are merged by GitHub repository ID.
- The bulk list is ordered by creation date; the separate topic searches refresh popular, recently active projects so the top of the feed remains useful while the historical catalog is growing.
- GitHub API and Supabase limits apply. The importer is deliberately incremental rather than trying to make thousands of unbounded calls in one workflow run.

## Limitations

Uploads are limited to 25 MB and allowlisted file formats. The storage policy is designed to prevent casual cross-user access; for production-scale moderation or malware checks, introduce a dedicated scanning and abuse-reporting workflow. Messages are protected by Supabase RLS but are **not end-to-end encrypted**. Localizations need native-speaker review. Passwords are handled by Supabase Auth, not stored by Repo Radar.

## Catalog API hardening

The browser can only read repository rows. The importer uses the service role for writes. The `list_repo_languages()` SQL function runs as the caller (not SECURITY DEFINER) and supplies the language filter options without loading the whole catalog into the browser.


## Reliability update and PS4 collection

- Unicode repository search preserves Russian, English and technical names such as `owner/repo`, `C++`, and `C#`.
- PS4 tab includes the requested Akela-x project, OpenOrbis, ps4sdk and shadPS4. It links to source repositories and can search the main catalog. The curated list works independently of the importer; no repository code is executed by this section.
- Chat history has an older-messages button and stable timestamp/ID cursors. Refresh merges new messages without discarding loaded history.
- Conversation requests and subscriptions are isolated by session/selection generation. All contacts are loaded, using a distinct-peer RPC after the database update and a paginated fallback before it.
- A new Storage policy allows cleanup of the sender's unsent attachments; already referenced message attachments cannot be deleted through this policy.
- Run `node --test tests/*.test.mjs` and `node --input-type=module --check < app.js`. The Pages workflow runs these checks before deploying.

For an existing deployment, apply the bootstrap if needed, the corrected private-trigger script, and the new chat-reliability SQL in the Supabase SQL Editor. A GitHub push deploys the frontend only; it does not apply database SQL. Verify with two authenticated accounts plus a third account for access isolation.
