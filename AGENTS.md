# Agents — Front Door

This file is the **single, safe entry point** to run coding agents for this template. It points to the latest generated docs and encodes guardrails so the template can be published and imported by Speckit **without diluting any opinionated, platform‑specific decisions**.

- **Spec (SRS → public spec):** `docs/specs/generated/spec-latest.md`
- **Coding Agent Brief:** `docs/specs/generated/coding-agent-brief-latest.md`
- **Orchestration Plan:** `docs/specs/generated/orchestration-plan-latest.md`
- **RTM (traceability):** `docs/specs/generated/rtm-latest.md` (if present)

> If any of these are missing, run: `pnpm docs:gen && pnpm rtm:build` to (re)generate from `.speckit/spec.yaml`.

---

## One‑Click & Local Runs

- **One‑click (CI):** GitHub → **Actions** → _Run Agent_
  
  _Artifacts land in_ `.agent/runs/<timestamp>/…`

- **Local:**

  ```bash
  pnpm install
  pnpm agent:run        # main agent entrypoint (writes to .agent/runs)
  ```

---

## Preservation Policy (must follow)

1. **Do not strip or generalize** platform‑specific content. Keep Next.js + Supabase architecture decisions, **RLS policies**, **Vault** usage, i18n choices, performance/security gotchas, and ADRs **intact** in files and generated docs.
2. When applying `template.vars.json`, **only** interpolate placeholders. Do **not** remove sections or “sanitize” wording.
3. Generation/adapters must **not mutate** template content. If a step would drop details, **stop and fail** with an actionable message.
4. The published catalog under `.speckit/catalog/**` is the exact bundle Speckit imports; treat it as **read‑only** (PR label required to change).

---

## Minimal Preconditions (auto‑checked)

- `.speckit/spec.yaml` exists, declares dialect, and points to `srs/app.yaml`.
- `pnpm docs:gen` deterministically produces the three docs above.
- `pnpm rtm:build` succeeds and outputs the latest RTM.
- CI **speckit‑verify** passes (no drift between SRS and generated docs).
- PR label gates are configured:
  - `catalog:allowed` for edits under `.speckit/catalog/**`
  - `mode-change` when mode/dialect/template policy files change

---

## Agent Run Prompt (copy‑paste)

> **Mission:** Implement & publish the **Next‑Supabase Speckit Template** as a community‑importable bundle **without diluting any opinionated details**.
>
> **Non‑negotiable Guardrail — Preservation:** Keep all platform‑specific architecture decisions and implementation notes **verbatim** (Next.js + Supabase wiring, **RLS**, **Vault**, **i18n**, PWA/offline, performance budgets, ADRs, CI gates). Interpolate variables only; do **not** generalize content.
>
> **Inputs you can assume:**
> - Single source of truth at `.speckit/spec.yaml` → `srs/app.yaml`
> - Docs generate to `docs/specs/generated/**` via `pnpm docs:gen`
> - RTM builds via `pnpm rtm:build`
>
> **Do these steps in order:**
> 1. Ensure `.speckit/spec.yaml` exists (dialect + path to `srs/app.yaml`).  
> 2. Verify `srs/app.yaml` includes: security (RLS tables/policies), Supabase **Vault** secrets, auth flows, role model, i18n (`next-intl`), PWA/offline partitions, performance budgets (TTFB/LCP), OG images, notifications, admin surface, **Acceptance Criteria** with `REQ-*` IDs, and milestone order.  
> 3. Run `pnpm docs:gen` and confirm files:
>    - `docs/specs/generated/spec-latest.md`
>    - `docs/specs/generated/coding-agent-brief-latest.md` (must include this prompt and the AC checklist)
>    - `docs/specs/generated/orchestration-plan-latest.md`
> 4. Run `pnpm rtm:build` and ensure `REQ-*` map to tests/code/docs.
> 5. Build and stage a **catalog bundle** at `.speckit/catalog/next-supabase/`:
>    - `manifest.json` (name, version, dialect, provenance)
>    - `templates/**` (rendered import bundle)
>    - `generation-manifest.json` (append‑only)  
>    Mark as **read‑only** in CI (requires `catalog:allowed` to change).
> 6. Add/verify CI:
>    - `speckit-verify`: fail on drift between SRS and generated docs
>    - Label gates: `catalog:allowed`, `mode-change`
>    - Optional: accessibility + performance checks (Playwright + axe/Lighthouse)
> 7. Confirm **Manual QA**:
>    - `speckit template use <repo-url> /tmp/template-check`  
>    - Ensure postInit ran (`pnpm docs:gen && pnpm rtm:build`) and docs exist.
>
> **Outputs to produce:**
> - Up‑to‑date docs (spec/brief/plan) **including** the AC checklist + this Agent Prompt
> - RTM report covering all `REQ-*`
> - Catalog bundle under `.speckit/catalog/next-supabase/**`
> - Passing CI with label gates enforced
>
> **Failure behavior:** If any action would remove or water down platform‑specific content, **abort** with a clear error and remediation steps; do **not** auto‑edit away opinionated material.

---

## Evidence & Artifacts

- **Agent runs:** `.agent/runs/<timestamp>/**`
- **Generated docs:** `docs/specs/generated/**`
- **Traceability (RTM):** `docs/specs/generated/rtm-latest.md`
- **Catalog (import bundle):** `.speckit/catalog/next-supabase/**` (label‑gated)

---

## CI Gates (expected in this template)

- **speckit‑verify:** fail if `docs/specs/**` drift from the SRS
- **Catalog gate:** edits under `.speckit/catalog/**` require `catalog:allowed`
- **Mode policy gate:** dialect/template policy files require `mode-change`
- **Optional quality gates:** Playwright + axe/Lighthouse on PRs

---

## Troubleshooting

- **Docs missing or stale** → `pnpm docs:gen`
- **RTM missing** → `pnpm rtm:build`
- **Catalog not present** → run the template publish script (see `package.json` scripts) to populate `.speckit/catalog/next-supabase/**`
- **CI fails on drift** → re‑run `speckit gen --write` (or `pnpm docs:gen`) and commit regenerated docs

---

## Why these guardrails?

- **Spec‑driven flow:** one spec → generated docs; published bundles importable across repos.
- **RLS by default:** authorization enforced at the DB layer via Supabase RLS.
- **Vault for secrets:** centralize sensitive config in Supabase Vault.
- **i18n foundation:** `next-intl`/Next.js i18n as first‑class.
- **A11y/Perf checks:** optional Playwright + axe/Lighthouse wiring improves quality.

---

### Single‑line “Run me” prompt (for UI buttons)

> **Implement & publish the Next‑Supabase Speckit Template**: add `.speckit/spec.yaml` (dialect → `srs/app.yaml`), model all platform‑specific requirements in `srs/app.yaml`, ensure `pnpm docs:gen` produces **Spec/Brief/Orchestration Plan** with AC + embedded Agent Prompt; build **RTM**; generate `.speckit/catalog/next-supabase/**` (manifest, templates, generation‑manifest); add `speckit-verify`, catalog label gate, and Mode Policy Gate; keep **all opinionated Next.js/Supabase details** intact; verify manual QA (`speckit template use …` + postInit).