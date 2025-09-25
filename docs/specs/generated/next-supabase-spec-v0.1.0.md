---
id: next-supabase-spec
title: {{APP_TITLE}} Platform Specification
sidebar_label: Platform Spec
slug: /specs/next-supabase-spec
description: Authoritative Next.js + Supabase platform spec with RLS, Vault, PWA, and catalog publishing.
---
# {{APP_TITLE}} — Platform Specification

_Source: srs/app.yaml · Generated from Speckit SRS · Owners: platform@yourco.example_

This document is the canonical contract for the Next.js + Supabase template. It preserves every
opinionated decision—Supabase RLS predicates, Vault secret inventory, next-intl locales, PWA cache
partitions, performance budgets, CI label gates, and catalog expectations.

---

## 1) Architecture Overview
Opinionated Next.js 15 + Supabase template wired for RLS, Vault, next-intl, PWA offline partitions,
automated docs, and catalog publishing for Speckit consumers.
- **Runtime:** Next.js 15 App Router with React Server Components by default; deploy on Vercel edge functions.
- **Data Layer:** Supabase Postgres + Storage with the RLS policies enumerated below; Supabase Auth for identity.
- **Secrets:** Supabase Vault issues service-role credentials and third-party API keys for edge functions.
- **Internationalization:** `next-intl` with locales en, ga.
- **Offline:** Installable PWA with partitioned caches for auth, content, and assets.
- **Documentation:** `.speckit/spec.yaml` → `srs/app.yaml` is the single source; `pnpm docs:gen` regenerates this spec, brief, and plan.


---

## 2) Security & Supabase Policies
- **Auth flows:** password, magic_link, oauth.
- **anon** — Unauthenticated visitor; limited to marketing pages, installable PWA shell, offline cache warmup
    - access_public_content
    - bootstrap_offline_cache
- **user** — Authenticated Supabase user with profile row and notification preferences
    - manage_profile
    - submit_content
    - manage_notification_preferences
    - install_pwa
- **admin** — Operations persona with Supabase group role = 'admin' and elevated console
    - read_audit_log
    - manage_integrations
    - impersonate_user_session
**Row Level Security Policies:**
| Table | Policy | Name | Actions | Using | With Check | Notes |
|---|---|---|---|---|---|---|
| profiles | REQ-RLS-001 | Owner access | select, update | auth.uid() = id | auth.uid() = id | Admins bypass via Postgres role `service_role` running in Vault-backed edge functions |
| audit_log | REQ-RLS-002 | Admin only | select | role() = 'admin' |  | Inserts happen via security definer functions only |
| notification_preferences | REQ-RLS-003 | Owner managed | select, update | auth.uid() = user_id | auth.uid() = user_id | Admins can view aggregated metrics via materialized view |
| service_worker_cache_states | REQ-RLS-004 | User partition | select, insert, update | auth.uid() = user_id | auth.uid() = user_id | Anon sessions map to Supabase anonymous user IDs |
**Vault Secrets:**
- MARKET_DATA_API_KEY
- STRIPE_WEBHOOK_SECRET
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- SLACK_SIGNING_SECRET
- SUPABASE_JWT_SECRET
- Edge functions call Supabase using service role from Vault; never embed in client bundles.
- All Next.js server actions enforce `createServerClient` with `supabaseClient.auth.getUser()` guards.
- Admin console routes behind middleware verifying `role() = 'admin'` via RLS-friendly RPC.


---

## 3) Internationalization
- **Locales:** en, ga (default en).
- **Framework:** next-intl with routing strategy Domain default + `/ga` subpath for Irish locale.
- **Translation pipeline:** Source strings live in `/messages/en.json`; localized exports via Phrase CLI with lint step.
- **Locale detection:** Detect via `accept-language`, fallback to stored profile locale, persist in Supabase profile row.
- **Formatting:** Use `Intl.DateTimeFormat` with timezone from profile; default to `America/New_York`..


---

## 4) Performance & Operational Budgets
**Performance Budgets:**
| Metric | Target |
|---|---|
| TTFB_MS | 200 |
| LCP_MS | 2500 |
| CLS | 0.1 |
| INP_MS | 200 |
- **Caching strategies:** edge-cache, stale-while-revalidate.
- **Images:** next/image.
- **Metrics collection:** Vercel Web Vitals, Supabase logs piped to Logflare, OTel traces via `@vercel/otel`.
- **Alerts:**
  - PagerDuty alert when LCP p95 > 3s for 3 consecutive deploys
  - Slack alert when audit_log > 50 WARN entries per hour
- **Connection pooling:** Use PgBouncer transaction mode; min 4 / max 10 connections.
  - Index: profiles locale + updated_at
  - Index: audit_log event_type + created_at desc
**Security/Performance Gotchas:**
- Never disable HTTP/2 server push on PWA assets; rely on Next.js asset manifest.
- Ensure Supabase row level checks stay index-supported to avoid full table scans.


---

## 5) PWA Offline Strategy
- **Partitions:** auth, content, assets.
- **auth:** Cache Supabase session tokens using `IndexedDB` via Supabase Auth helpers; refresh in background
- **content:** Use App Router `revalidateTag` with Service Worker fallback to per-user caches
- **assets:** Precache Next.js build assets via Workbox `precacheAndRoute` with SWR
- **Push notifications:** webpush.
- **Manifest:** start_url /; theme #0A0A0A.
- **Service worker:** public/sw.ts.
- Gate install prompt behind user gesture and Supabase profile `pwa_opt_in` flag.
- Service worker isolates caches per Supabase user id using cache keys `{{APP_PREFIX}}-auth-${userId}`.


---

## 6) Integrations & Notifications
- **social:** github, google
- **webhooks:** stripe, slack
- **analytics:** posthog
**Supabase Functions:**
- **syncStripeCustomer** — Ensures Stripe metadata stays in sync with Supabase profile (triggers: stripe.webhook.customer.updated)
- **sendSlackAlert** — Posts to Slack when audit severity >= ERROR (triggers: database.audit_log.insert)
- **Notification transports:** email_resend, slack_dm, webpush.
  - Preferences: Stored in notification_preferences with quiet hours and channel opt-in
- **OG Image:** Generated via @vercel/og; defaults title "{{APP_TITLE}}".
- **Admin console:** minimal.


---

## 7) Observability & Incident Response
- **Logging:** Structured JSON logs via `pino` streamed to Vercel + Supabase Logflare
- **Tracing:** `@vercel/otel` instrumentation with Supabase function spans exported to Honeycomb
- **Incident response:** Runbooks stored in `docs/ops/`, escalate via PagerDuty rotation


---

## 8) Developer Workflow & Manual QA
- `pnpm docs:gen` regenerates Spec/Brief/Plan from `srs/app.yaml`.
- `pnpm rtm:build` updates `docs/specs/generated/rtm-latest.md`.
- `pnpm catalog:publish` refreshes `.speckit/catalog/next-supabase/`.
- `pnpm test:acceptance` runs Playwright tests tagged with `@REQ-*`.
- Manual QA command:
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

## 9) Acceptance Criteria
- **REQ-SPEC-001** — Spec, Coding Agent Brief, and Orchestration Plan regenerate deterministically from srs/app.yaml.
  - Docs: docs/specs/generated/spec-latest.md, docs/specs/generated/coding-agent-brief-latest.md, docs/specs/generated/orchestration-plan-latest.md
  - Tests: tests/spec-artifacts.spec.ts
  - Code: scripts/spec-gen.ts, scripts/rtm/build-rtm.ts
- **REQ-RLS-001** — Profiles are readable and writable only by the owning Supabase user via enforced RLS.
  - Docs: docs/specs/generated/spec-latest.md
  - Tests: tests/spec-artifacts.spec.ts
  - Code: srs/app.yaml, supabase/migrations/ (expected in downstream repos)
- **REQ-RLS-002** — Audit log visibility is restricted to admin role via RLS and admin console guardrails.
  - Docs: docs/specs/generated/spec-latest.md
  - Tests: tests/spec-artifacts.spec.ts
  - Code: srs/app.yaml
- **REQ-PWA-001** — PWA install flow partitions auth/content/assets caches and respects Supabase profile opt-in.
  - Docs: docs/specs/generated/spec-latest.md, docs/specs/generated/orchestration-plan-latest.md
  - Tests: tests/spec-artifacts.spec.ts
  - Code: public/sw.ts (consumer responsibility)
- **REQ-CATALOG-001** — Catalog bundle under .speckit/catalog/next-supabase ships manifest, templates, and provenance with label gate.
  - Docs: docs/specs/generated/orchestration-plan-latest.md
  - Tests: tests/spec-artifacts.spec.ts
  - Code: scripts/catalog/publish.ts, .github/workflows/catalog-gate.yml


---

## 10) Preservation Policy
1. **Do not strip or generalize** platform-specific content. Keep Next.js + Supabase architecture decisions,
   **RLS policies**, **Vault** usage, i18n choices, performance/security gotchas, and ADRs **intact** in files
   and generated docs.
2. When applying `template.vars.json`, **only** interpolate placeholders. Do **not** remove sections or
   “sanitize” wording.
3. Generation/adapters must **not mutate** template content. If a step would drop details, **stop and fail**
   with an actionable message.
4. The published catalog under `.speckit/catalog/**` is the exact bundle Speckit imports; treat it as
   **read-only** (PR label required to change).

_Deterministic output:_ run `pnpm docs:gen` twice; expect no diffs. Validate RTM via `pnpm rtm:build`.
