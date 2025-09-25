# {{APP_TITLE}}

**Repo:** `{{REPO_NAME}}`

**Spec‑Driven Development (SDD) for Next.js + Supabase.** Generate a **Specification**, **Coding Agent Brief**, and **Orchestration Plan** from a single SRS YAML; run coding agents with one click; and prove acceptance with tagged tests and an RTM (Requirements Traceability Matrix). This template ships the **documentation + automation stack**—you bring the Next.js app that consumes it.

[![Spec Trace CI](https://img.shields.io/badge/ci-spec--trace-blue)](#ci--drift-protection)
[![Run Agent](https://img.shields.io/badge/action-run%20agent-brightgreen)](#agents--one-click)
[![Playwright](https://img.shields.io/badge/tests-playwright-informational)](#tests--rtm)
[![Docs](https://img.shields.io/badge/docs-docusaurus-lightgrey)](#docs--site)

> 🔒 **Preservation Policy:** This template **preserves all opinionated, platform‑specific details** (Next.js + Supabase wiring, **RLS**, **Vault**, i18n, performance/security gotchas, ADRs, CI gates). See **[AGENTS.md](./AGENTS.md)** and **[Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md)**.

---

## Link hub

- [Agent front door](./AGENTS.md) — preservation policy, prompts, and run commands.
- [Spec + generated docs](./docs/specs/generated/spec-latest.md) — source of truth with orchestration + brief siblings.
- [Requirements Traceability Matrix](./docs/specs/generated/rtm-latest.md) — `REQ-*` coverage map.
- [Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md) — maintainer checklist for drift, catalog, and mode policy gates.

---

## What’s inside

- **Single source of truth** at `.speckit/spec.yaml` → `srs/app.yaml`
- **Generated docs** (deterministic):
  - `docs/specs/generated/spec-latest.md`
  - `docs/specs/generated/coding-agent-brief-latest.md`
  - `docs/specs/generated/orchestration-plan-latest.md`
  - `docs/specs/generated/rtm-latest.md` (traceability)
- **Playwright** acceptance harness with `@REQ-*` tags
- **Docusaurus** site in `docs/website` (sourced from generated specs)
- **Agent runner & scripts** under `scripts/`
- **Speckit catalog** scaffolding under `.speckit/catalog/**` (label‑gated, read‑only)

### What’s intentionally _not_ included
- A Next.js / Supabase app under `apps/`. The workspace is ready (`apps/*`), but app code is **yours**, so your product architecture stays opinionated.

> See **Bring your own Next.js app** below.

---

## Repo structure (high‑level)

```
.speckit/
  spec.yaml                 # dialect + SRS pointer
  catalog/
    next-supabase/          # importable bundle (manifest + templates + provenance)
srs/
  app.yaml                  # your SRS (golden source)
docs/
  specs/generated/          # spec/brief/plan/rtm (generated)
  website/                  # Docusaurus site
scripts/                    # docs/rtm/catalog helpers
tests/                      # Playwright specs tagged with @REQ-*
AGENTS.md                   # agent front door + preservation policy
```

---

## Quickstart (docs + tooling)

```bash
corepack enable
pnpm install
pnpm docs:gen
pnpm rtm:build
pnpm catalog:publish   # refresh .speckit/catalog bundle
pnpm test:acceptance  # Playwright + requirement tags
pnpm docs:serve   # docs dev server
# or
pnpm docs:build   # static build at docs/website/build
```

- This manages the **documentation + verification** toolchain.
- When you add an app under `apps/`, target it via `pnpm --filter apps/<name> <command>`.

> The repo is a **pnpm workspace**. Running `pnpm install` at the root installs everything (including `docs/website`).

---

## Bring your own Next.js app

```bash
pnpm create next-app apps/web --use-pnpm --typescript --eslint
```
Run `pnpm speckit:verify` to confirm docs match the SRS before pushing.

These commands manage the documentation and verification toolchain only.

## CI & Policy Gates

- `speckit-verify` ensures `pnpm docs:gen` + `pnpm rtm:build` leave no git diff.
- `tests.yml` runs `pnpm test:acceptance` with Playwright tagged by `@REQ-*`.
- `catalog-gate.yml` blocks merges touching `.speckit/catalog/**` without the `catalog:allowed` label.
- `mode-policy-gate.yml` requires the `mode-change` label for `.speckit/spec.yaml`, `srs/app.yaml`, or template policy edits.

Once you've scaffolded an app, run its scripts with `pnpm --filter apps/<name> <command>` alongside the workflows above.
- Replace `web` with your app name.
- Add Supabase deps (e.g., `@supabase/supabase-js`, auth helpers) and envs.
- Expose scripts like `dev`, `lint`, `test` in `apps/<name>/package.json`.
- Update **SRS** + **tests** to match what you build.

---

## Use with Speckit

### Local (as a repo template)
```bash
speckit template use https://github.com/airnub/speckit-template-next-supabase ./starter
```
- You’ll be prompted for variables from `template.vars.json`.
- `postInit` (from `template.json`) runs: `pnpm install`, `pnpm docs:gen`, `pnpm rtm:build`.
- You can also copy this under another project’s `.speckit/templates/app/next-supabase` to appear in Speckit’s picker.

### Manual QA (import flow)
```bash
rm -rf /tmp/speckit-template-next-supabase \
 && speckit template use https://github.com/airnub/speckit-template-next-supabase /tmp/speckit-template-next-supabase \
 && cd /tmp/speckit-template-next-supabase \
 && pnpm docs:gen && pnpm rtm:build
```
- Confirm prompts for: `REPO_NAME`, `APP_TITLE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Verify generated docs under `docs/specs/generated/**` and placeholders replaced.

---

## Agents — one‑click

See **[AGENTS.md](./AGENTS.md)** for:
- One‑click GitHub Action and local run (`pnpm agent:run`)
- The **Agent Run Prompt** (copy‑paste)
- The **Preservation Policy** (do **not** genericize platform specifics)

---

## CI & Drift Protection

This template mirrors **Speckit’s conventions** to prevent drift:

- **`speckit-verify.yml`** — fails if generated docs drift from SRS
- **`catalog-gate.yml`** — requires `catalog:allowed` label to change `.speckit/catalog/**`
- **`mode-policy-gate.yml`** — requires `mode-change` label for mode/dialect/policy edits
- **`tests.yml`** — runs Playwright (`@REQ-*` tags); optional aXe/Lighthouse behind flags

See **[Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md)** for file paths, CODEOWNERS, labeler rules, and starter workflow YAML.

---

## Drift Guardrails

Review **[docs/internal/DRIFT-GUARDRAILS.md](./docs/internal/DRIFT-GUARDRAILS.md)** before merging changes that touch the spec, generated docs, or catalog bundle. It’s a copy‑paste maintainer checklist covering drift detection, catalog label gates, mode policy gates, and review sign‑offs so the Next.js + Supabase wiring never drifts from the published template.

---

## Tests & RTM

- Write Playwright specs in `tests/**` and tag scenarios with the matching `@REQ-...` ID.
- Build traceability with:
  ```bash
  pnpm rtm:build
  ```
- Latest RTM lands at `docs/specs/generated/rtm-latest.md`.

---

## Docs & Site

- Generate docs from SRS:
  ```bash
  pnpm docs:gen
  ```
- Serve locally: `pnpm docs:serve` → http://localhost:3000
- Static build: `pnpm docs:build` → `docs/website/build`

---

## Variables (templating)

`template.vars.json` drives prompts on import. Required defaults:

- `REPO_NAME` — repository slug
- `APP_TITLE` — human‑readable app name
- `SUPABASE_URL` — your project URL
- `SUPABASE_ANON_KEY` — public anon key

> Add more as your **SRS** grows; never remove platform‑specific sections during interpolation.

---

## Publishing a Speckit Catalog

Create an importable bundle (read‑only, label‑gated):

```
.speckit/catalog/next-supabase/
  manifest.json
  templates/**
  generation-manifest.json
```

Recommended script:
```bash
pnpm catalog:publish
```

- PRs that change `.speckit/catalog/**` must include the **`catalog:allowed`** label.

---

## Contributing

- Follow the **Preservation Policy** in [AGENTS.md](./AGENTS.md).
- Before opening a PR:
  - `pnpm docs:gen && pnpm rtm:build` (no diffs expected)
  - If touching `.speckit/catalog/**` add the `catalog:allowed` label
  - If touching `.speckit/spec.yaml`, `.spectral.yaml`, `policy/**`, add the `mode-change` label
- See **[Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md)** for the maintainer checklist.

---

## FAQ

**Why ship a doc+automation template without an app?**  
To keep the **platform‑specific architecture** and **specs** first‑class and reusable. You can slot any Next.js app under `apps/` and keep the same SDD flow.

**Does Speckit strip platform details?**  
No. Import copies files **as‑is** (with variable interpolation), runs `postInit`, and preserves your opinionated content. Adapters normalize dialects **without mutating templates**.

---

## License

Run the bundled flow and confirm outputs match the generated docs:

```bash
rm -rf /tmp/speckit-template-next-supabase \
  && speckit template use https://github.com/airnub/speckit-template-next-supabase /tmp/speckit-template-next-supabase \
  && cd /tmp/speckit-template-next-supabase \
  && pnpm docs:gen && pnpm rtm:build
```

You should observe:

- Prompts for `REPO_NAME`, `APP_TITLE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- `postInit` runs `pnpm install`, `pnpm docs:gen`, and `pnpm rtm:build`.
- `docs/specs/generated/` contains the regenerated Spec, Brief, Plan, and RTM with placeholders replaced.

MIT — see `LICENSE`.
