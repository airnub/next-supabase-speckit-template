# {{APP_TITLE}}

**Repo:** `{{REPO_NAME}}`

**Spec‑Driven Development (SDD) for Next.js + Supabase.** This template enables **Spec Driven Development (SDD)**: turn a single SRS into a **Specification**, **Coding Agent Brief**, and **Orchestration Plan**; run coding agents with one click; and prove acceptance with tagged tests and a Requirements Traceability Matrix (RTM). You get the **documentation + automation stack**—bring your Next.js app to consume it.

[![CI: speckit-verify](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/speckit-verify.yml/badge.svg)](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/speckit-verify.yml)
[![CI: tests](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/tests.yml/badge.svg)](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/tests.yml)
[![CI: catalog gate](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/catalog-gate.yml/badge.svg)](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/catalog-gate.yml)
[![CI: mode policy gate](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/mode-policy-gate.yml/badge.svg)](https://github.com/airnub/speckit-template-next-supabase/actions/workflows/mode-policy-gate.yml)
[![Powered by Speckit](https://img.shields.io/badge/powered%20by-speckit-blueviolet)](https://github.com/airnub/speckit)

> 🔒 **Preservation Policy:** This template **preserves all opinionated, platform‑specific details** (Next.js + Supabase wiring, **RLS**, **Vault**, i18n, performance/security gotchas, ADRs, CI gates). See **[AGENTS.md](./AGENTS.md)** and **[Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md)**.

---

## Link hub

- **[Agent front door](./AGENTS.md)** — preservation policy, prompts, one‑click/local runs.
- **[Spec + generated docs](./docs/specs/generated/spec-latest.md)** — source of truth; brief + plan are siblings.
- **[Requirements Traceability Matrix](./docs/specs/generated/rtm-latest.md)** — `REQ-*` coverage map.
- **[Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md)** — maintainer checklist for drift, catalog, and mode policy gates.

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
pnpm test:acceptance   # Playwright + requirement tags
pnpm docs:serve        # docs dev server
# or
pnpm docs:build        # static build at docs/website/build
```

- This manages the **documentation + verification** toolchain.
- When you add an app under `apps/`, target it via `pnpm --filter apps/<name> <command>`.

> The repo is a **pnpm workspace**. Running `pnpm install` at the root installs everything (including `docs/website`).

---

## Bring your own Next.js app

```bash
pnpm create next-app apps/web --use-pnpm --typescript --eslint
```

- Replace `web` with your app name.
- Add Supabase deps (e.g., `@supabase/supabase-js`, auth helpers) and envs.
- Expose scripts like `dev`, `lint`, `test` in `apps/<name>/package.json`.
- Update **SRS** + **tests** to match what you build.

Run `pnpm speckit:verify` to confirm docs match the SRS before pushing.

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

## Smoke test

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

---

## License

MIT — see `LICENSE`.

<!-- SEO: include explicit spelling for people searching -->
<!-- Spec Driven Development (SDD), Spec‑Driven Development (SDD) -->

