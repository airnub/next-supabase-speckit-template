# {{APP_TITLE}} — Orchestration Plan

Sequenced plan aligning implementation milestones with CI and catalog deliverables.

---

## Documents of Record
- SRS: `srs/app.yaml`
- Generated outputs: `docs/specs/generated/*.md`
- Catalog bundle: `.speckit/catalog/next-supabase/`


---

## Stack & Performance Guardrails
- Next.js 15 App Router, TypeScript strict mode.
- Supabase Postgres + Storage with RLS; Supabase Auth for identity.
- Performance budgets enforced: TTFB ≤ 200ms, LCP ≤ 2500ms, INP ≤ 200ms.
- Caching strategy: edge-cache, stale-while-revalidate.
- Use `next/image` with AVIF/WebP defaults and `ImageResponse` for OG generation.


---

## Security & RLS Checklist
- Keep Supabase RLS policies in sync with `srs/app.yaml` (see spec section 2).
- Wrap server actions with `createServerClient` to respect Supabase Auth sessions.
- Vault secrets provision service role keys and third-party credentials.
- Admin console requires `role() = "admin"` and runs on protected routes.


---

## Internationalization & Content
- Locales: en, ga with default en.
- Use `next-intl` provider in `app/[locale]/layout.tsx` with server dictionaries.
- Persist locale preference in Supabase profile; fallback to Accept-Language.


---

## PWA & Offline Operations
- Partitions: auth, content, assets.
- Precache service worker assets and tag caches by Supabase user id.
- Background refresh rotates Supabase session tokens every 60 minutes.


---

## Integrations & Notifications
- **social:** github, google
- **webhooks:** stripe, slack
- **analytics:** posthog
- **Notification transports:** email_resend, slack_dm, webpush.
  - Preferences: Stored in notification_preferences with quiet hours and channel opt-in
- Slack + Stripe webhooks land in Supabase edge functions; follow RLS-safe patterns.


---

## Catalog & CI Gates
- Catalog bundle lives at `.speckit/catalog/next-supabase/`.
- Run `pnpm catalog:publish` after regenerating docs to sync manifest + templates.
- CI requires label `catalog:allowed` for catalog edits and `mode-change` for `.speckit/spec.yaml` or SRS updates.
- `speckit-verify` workflow blocks drift between SRS and generated docs.


---

## Manual QA
Execute:
```bash
rm -rf /tmp/speckit-template-next-supabase \
  && speckit template use https://github.com/airnub/speckit-template-next-supabase /tmp/speckit-template-next-supabase \
  && cd /tmp/speckit-template-next-supabase \
  && pnpm docs:gen && pnpm rtm:build
```
Expectations:
- Prompts for {{REPO_NAME}}, {{APP_TITLE}}, Supabase URL + anon key during init
- `postInit` runs pnpm install + docs generation
- `docs/specs/generated/**` exist with placeholders replaced


---

## Milestones
- **M1-spec-docs** — Spec/Brief/Plan generation wired
- **M2-rtm-tests** — RTM + tagged tests in place
- **M3-catalog** — Catalog published under .speckit/catalog/next-supabase
- **M4-ci-gates** — CI label + drift gates enforced

Close out by running `pnpm catalog:publish` and verifying workflows (`speckit-verify`, `catalog-gate`, `mode-policy-gate`, `tests`).
