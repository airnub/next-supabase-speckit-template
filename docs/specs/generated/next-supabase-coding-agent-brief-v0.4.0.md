# {{APP_TITLE}} — Coding Agent Brief

Generated from srs/app.yaml. Follow every guardrail; treat this brief as binding.

---

## Mission
Deliver the Next.js + Supabase template without losing platform-specific intent. Use Supabase clients
with enforced RLS, wire Vault-backed secrets, and honor the manual QA scenario.


---

## Preservation Policy
1. **Do not strip or generalize** platform-specific content. Keep Next.js + Supabase architecture decisions,
   **RLS policies**, **Vault** usage, i18n choices, performance/security gotchas, and ADRs **intact** in files
   and generated docs.
2. When applying `template.vars.json`, **only** interpolate placeholders. Do **not** remove sections or
   “sanitize” wording.
3. Generation/adapters must **not mutate** template content. If a step would drop details, **stop and fail**
   with an actionable message.
4. The published catalog under `.speckit/catalog/**` is the exact bundle Speckit imports; treat it as
   **read-only** (PR label required to change).


---

## Acceptance Criteria Checklist
- [ ] REQ-SPEC-001 — Spec, Coding Agent Brief, and Orchestration Plan regenerate deterministically from srs/app.yaml.
- [ ] REQ-RLS-001 — Profiles are readable and writable only by the owning Supabase user via enforced RLS.
- [ ] REQ-RLS-002 — Audit log visibility is restricted to admin role via RLS and admin console guardrails.
- [ ] REQ-PWA-001 — PWA install flow partitions auth/content/assets caches and respects Supabase profile opt-in.
- [ ] REQ-CATALOG-001 — Catalog bundle under .speckit/catalog/next-supabase ships manifest, templates, and provenance with label gate.


---

## Environment & Secrets
- Template variables prompt for:
  - REPO_NAME
  - APP_TITLE
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - APP_PREFIX
  - VERSION
  - ORG_NAME
- Supabase Vault stores:
  - MARKET_DATA_API_KEY
  - STRIPE_WEBHOOK_SECRET
  - SUPABASE_SERVICE_ROLE_KEY
  - RESEND_API_KEY
  - SLACK_SIGNING_SECRET
  - SUPABASE_JWT_SECRET
- Store Supabase client keys in `.env.local`; never commit service role keys.


---

## Deliverables
- Regenerate Spec, Brief, Plan (`pnpm docs:gen`) and RTM (`pnpm rtm:build`).
- Update catalog bundle via `pnpm catalog:publish` when specs change.
- Ensure Playwright tests tagged with `@REQ-*` verify docs + catalog integrity.


---

## Agent Prompt (copy-paste)
# Coding Agent Prompt — **next‑supabase‑speckit‑template**

> **Goal:** Turn this repository into a **publishable, community‑importable Speckit template** that preserves all opinionated, platform‑specific decisions (Next.js + Supabase, **RLS**, **Vault**, i18n, performance/security gotchas, ADRs, CI gates). **Do not genericize or discard any platform detail.**

This prompt is designed to be pasted into your coding agent. It is **idempotent**: repeated runs must converge with no spurious diffs.

---

## 0) Guardrails & Non‑Negotiables

1. **Preservation Policy**

   * Keep platform‑specific content **verbatim** across files and generated docs.
   * Variable interpolation may replace placeholders only; **no redaction** or “sanitization.”
   * If any generation/adaptor step would lose detail, **halt and fail** with a clear error.
   * Treat `.speckit/catalog/**` as **read‑only** in PRs (label gate required).
2. **Single Source of Truth**

   * `.speckit/spec.yaml` declares a dialect and points at `srs/app.yaml`.
   * All docs under `docs/specs/generated/**` are deterministically produced from the SRS.
3. **Evidence & Traceability**
   
   * Build an **RTM** mapping `REQ-*` → docs/tests/code.
   * Tests in `tests/**` are tagged with the relevant `@REQ-...` IDs.
4. **CI Gates**
   
   * `speckit-verify` (drift between SRS and generated docs fails the build).
   * Label gates: `catalog:allowed` for `.speckit/catalog/**`; `mode-change` for mode/dialect/policy edits.

---

## 1) Repository Snapshot (assumptions)

* Root contains: `.speckit/`, `.github/` (workflows), `docs/`, `tests/`, `scripts/`, `.spectral.yaml`, `template.json`, `template.vars.json`, `AGENTS.md`, `README.md`.
* The workspace is **pnpm** based; docs site under `docs/website`.

> If any item is missing, create it in the steps below.

---

## 2) Tasks (perform in order)

### Task A — Lock the Dialect & SRS

1. Create/ensure `.speckit/spec.yaml` with:

```yaml
# .speckit/spec.yaml
version: 1
source:
  srs: srs/app.yaml
  dialect:
    id: speckit.v1
    version: 1.0.0
# Optional: adapters you support without mutating templates
adapters:
  - owasp.asvs.v4  # normalization only; must not alter template content
```

2. Create/ensure `srs/app.yaml` with a **first‑class model** of your “golden” sections:

```yaml
# srs/app.yaml (skeleton; extend with your details)
meta:
  app_title: "{{APP_TITLE}}"
  repo_name: "{{REPO_NAME}}"
  owners: ["platform@yourco.example"]

security:
  auth_flows: [password, magic_link, oauth]
  roles:
    - id: anon
    - id: user
    - id: admin
  rls:
    tables:
      - name: profiles
        policies:
          - id: REQ-RLS-001
            check: "auth.uid() = id"
      - name: audit_log
        policies:
          - id: REQ-RLS-002
            check: "role() = 'admin'"
  vault:
    secrets: [MARKET_DATA_API_KEY]
  audit_logging: enabled

internationalization:
  locales: [en, ga]
  default_locale: en
  framework: next-intl

performance:
  budgets:
    ttfb_ms: 200
    lcp_ms: 2500
  caching: [edge-cache, stale-while-revalidate]
  images: [next/image]

pwa_offline:
  partitions: [auth, content, assets]
  push_notifications: [webpush]

integrations:
  providers:
    social: [github, google]
    webhooks: [stripe, slack]
  admin_console: minimal

acceptance_criteria:
  - id: REQ-SPEC-001
    text: "Spec, Coding Agent Brief, Orchestration Plan are generated and up to date."
  - id: REQ-RLS-001
    text: "Profiles are readable only by owner (RLS policy in place)."
  - id: REQ-PWA-001
    text: "App installs as PWA; offline partitioning works for core views."

milestones:
  - id: M1-spec-docs
    title: "Spec/Brief/Plan generation wired"
  - id: M2-rtm-tests
    title: "RTM + tagged tests in place"
  - id: M3-catalog
    title: "Catalog published under .speckit/catalog/next-supabase"
```

> Keep adding your real, opinionated decisions (RLS predicates, Vault secrets list, i18n locales, perf targets, provider DI, OG images, notifications, admin scope). These must round‑trip into generated docs.

---

### Task B — Wire Generation (3 artifacts)

1. Ensure `pnpm docs:gen` generates to `docs/specs/generated/**`:

   * `spec-latest.md`
   * `coding-agent-brief-latest.md` (**must embed this Agent Prompt + AC checklist**)
   * `orchestration-plan-latest.md`

2. Make generation **deterministic** (same input → same output; second run has no diffs).

3. Update `AGENTS.md` (already present) to link the above files and restate the **Preservation Policy**.

---

### Task C — Build RTM & Tests

1. `pnpm rtm:build` must produce `docs/specs/generated/rtm-latest.md` mapping all `REQ-*`.
2. In `tests/`, ensure Playwright tests tag scenarios with `@REQ-...` IDs.
3. (Optional) Add **axe** and **Lighthouse** jobs gated behind env flags for PR runs.

---

### Task D — Publish the Catalog (importable by Speckit)

Create the import bundle under `.speckit/catalog/next-supabase/`:

```
.speckit/
  catalog/
    next-supabase/
      manifest.json               # name, version, dialect, provenance
      templates/                  # rendered import bundle (specs, prompts, scaffolds)
      generation-manifest.json    # append-only provenance
```

* Enforce **label gate** on this path (`catalog:allowed`).
* Never post-process this bundle in a way that drops platform details.

Example `manifest.json` starter:

```json
{
  "name": "next-supabase",
  "version": "0.1.0",
  "dialect": { "id": "speckit.v1", "version": "1.0.0" },
  "provenance": { "repo": "airnub/next-supabase-speckit-template", "generator": "speckit" }
}
```

---

### Task E — Template Manifest & Vars

* **`template.json`**: ensure `postInit` includes `pnpm install`, `pnpm docs:gen`, `pnpm rtm:build`.
* **`template.vars.json`**: include `REPO_NAME`, `APP_TITLE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and any SRS-dependent placeholders.

---

### Task F — CI & Policy Gates

Create/verify workflows in `.github/workflows/`:

1. **`speckit-verify.yml`** — fails if generated docs drift from SRS.
2. **`catalog-gate.yml`** — requires `catalog:allowed` for changes under `.speckit/catalog/**`.
3. **`mode-policy-gate.yml`** — requires `mode-change` for edits to modes/dialect/policy files.
4. **`tests.yml`** — runs Playwright; optionally runs axe/Lighthouse behind flags.

> Keep jobs fast, cache pnpm, and ensure they run on PRs from forks with hardened permissions.

---

### Task G — Manual QA (document in README)

Provide steps (and verify they pass):

```bash
rm -rf /tmp/next-supabase-template \
  && speckit template use https://github.com/airnub/next-supabase-speckit-template /tmp/next-supabase-template \
  && cd /tmp/next-supabase-template \
  && pnpm docs:gen && pnpm rtm:build
```

* Confirm prompts for vars, `postInit` executed, and `docs/specs/generated/**` exist with placeholders replaced.

---

## 3) Acceptance Criteria (must all pass)

* **Source of Truth**: `.speckit/spec.yaml` references `srs/app.yaml` and declares dialect; two consecutive `pnpm docs:gen` runs produce **no diffs**.
* **3 Docs present** with embedded **Agent Prompt + AC checklists** and all platform specifics retained.
* **RTM present** (`docs/specs/generated/rtm-latest.md`) covering all `REQ-*`.
* **Catalog bundle** exists under `.speckit/catalog/next-supabase/**` with `manifest.json` and `generation-manifest.json` (append-only) and is **label-gated**.
* **CI**: `speckit-verify` passes; label gates enforced; tests run; optional a11y/perf jobs toggle via flags.
* **Preservation Policy enforced** via a lightweight check (e.g., ensure key sections in generated docs are non-empty; fail with remediation steps if missing).

---

## 4) Commands Cheat-Sheet

```bash
# one-time
corepack enable && pnpm install

# generate docs from SRS
pnpm docs:gen

# build traceability
pnpm rtm:build

# publish/update catalog bundle (script should compile + stage to .speckit/catalog/next-supabase)
pnpm catalog:publish

# run tests
pnpm test:acceptance
```

> Add `catalog:publish`, `test:acceptance`, etc. to `package.json` if not present.

---

## 5) Failure Handling

* If generation would drop platform detail, **abort** and write an error explaining which section was at risk; never auto-generalize.
* If CI drift occurs, re-run generation and **commit regenerated docs**; investigate SRS/partials for nondeterminism.

---

## 6) Outputs to Attach to the PR (Artifacts)

* `.speckit/spec.yaml` and `srs/app.yaml`
* `docs/specs/generated/{spec-latest.md,coding-agent-brief-latest.md,orchestration-plan-latest.md,rtm-latest.md}`
* `.speckit/catalog/next-supabase/{manifest.json,templates/**,generation-manifest.json}`
* Updated workflows in `.github/workflows/`
* Proof of label gates (screenshot or workflow run link)

---

## 7) Single-Line “Run-Me” Prompt (for buttons/shortcuts)

> Implement & publish the **Next-Supabase Speckit Template**: add `.speckit/spec.yaml` (dialect → `srs/app.yaml`), fully model platform specifics in `srs/app.yaml`, ensure `pnpm docs:gen` yields **Spec/Brief/Orchestration Plan** with AC + embedded Agent Prompt; build **RTM**; publish `.speckit/catalog/next-supabase/**` (manifest, templates, generation-manifest); add `speckit-verify`, catalog label gate, and Mode Policy Gate; keep **all opinionated Next.js/Supabase details** intact; verify Manual QA (`speckit template use …` + postInit).

Submit PR with passing `speckit-verify`, `tests.yml`, and label gates satisfied.
