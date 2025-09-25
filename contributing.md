# Contributing

Welcome! This repository is a **Spec‑Driven Development (SDD)** template for **Next.js + Supabase** teams. It ships the documentation/automation stack (spec → docs → RTM → tests → catalog). Your contributions should **preserve opinionated, platform‑specific details** and keep the template aligned with **Speckit** conventions.

> ✳︎ Read first: **[AGENTS.md](./AGENTS.md)** (Preservation Policy & run prompt) and **[Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md)** (file paths, CI labels, and policy rules).

---

## Table of contents
- [Project expectations](#project-expectations)
- [Getting started](#getting-started)
- [Spec‑driven workflow](#spec-driven-workflow)
- [Local verification checklist](#local-verification-checklist)
- [Tests & traceability](#tests--traceability)
- [CI & policy gates](#ci--policy-gates)
- [Commit style](#commit-style)
- [PR process](#pr-process)
- [Security](#security)

---

## Project expectations
- **Preservation Policy**: do **not** generalize or strip platform specifics (Next.js/Supabase, **RLS**, **Vault**, i18n, perf/security gotchas, ADRs, CI gates). See **AGENTS.md**.
- **Single source of truth**: `.speckit/spec.yaml` → `srs/app.yaml`. Generated docs live in `docs/specs/generated/**`.
- **Determinism**: generation is idempotent (second run should produce no diffs).
- **Catalog**: `.speckit/catalog/**` is a **read‑only** import bundle, changed only via labeled PRs.

---

## Getting started

**Prereqs**
- Node 20+
- pnpm 9+ (`corepack enable`)

**Bootstrap**
```bash
corepack enable
pnpm install
pnpm docs:gen
pnpm rtm:build
pnpm docs:serve   # dev docs site
```

---

## Spec‑driven workflow

1. Edit **SRS** in `srs/app.yaml` (requirements, RLS/Vault, i18n, perf budgets, integrations, AC with `REQ-*`, milestones).
2. If the **dialect** changes, update `.speckit/spec.yaml` (requires `mode-change` label on PR).
3. Generate docs:
   ```bash
   pnpm docs:gen
   ```
4. Build the RTM:
   ```bash
   pnpm rtm:build
   ```
5. Verify **no drift** (see checklist below) and commit changes.

---

## Local verification checklist
- [ ] `pnpm docs:gen` runs clean; re‑run twice → **no diffs** under `docs/specs/generated/**`.
- [ ] `pnpm rtm:build` produces `docs/specs/generated/rtm-latest.md`.
- [ ] If you touched `.speckit/catalog/**`, you will add the **`catalog:allowed`** label to the PR.
- [ ] If you touched `.speckit/spec.yaml`, `.spectral.yaml`, `policy/**`, or **dialect/modes**, you will add the **`mode-change`** label to the PR.
- [ ] Tests pass locally (`pnpm test:acceptance`) and scenarios reference `@REQ-*` IDs.

---

## Tests & traceability
- Write Playwright specs in `tests/**` and tag scenarios with the relevant `@REQ-...` ID.
- Ensure each requirement in the SRS appears in the RTM and is covered by docs/tests/code.

---

## CI & policy gates
The repo mirrors **Speckit** conventions to prevent drift:
- **speckit-verify** — fails if generated docs drift from the SRS or provenance files shrink.
- **catalog-gate** — requires `catalog:allowed` label to change `.speckit/catalog/**`.
- **mode-policy-gate** — requires `mode-change` label for mode/dialect/policy file edits.
- **tests** — runs Playwright (`@REQ-*` tags); optional aXe/Lighthouse behind flags.

See **[Drift Guardrails](./docs/internal/DRIFT-GUARDRAILS.md)** to add/update workflows, CODEOWNERS, and label rules.

---

## Commit style
Use **Conventional Commits** (enforced by CI hooks where configured):

```
feat(rtms): map REQ-AUTH-002 to new Playwright scenario
fix(docs): correct OG image strategy section in coding-agent-brief
chore(ci): add labeler rule for catalog path
```

- Keep PRs focused; prefer small, reviewable changes.

---

## PR process
1. Open a PR with a clear title/description.
2. Fill out **PULL_REQUEST_TEMPLATE** checkboxes (drift, RTM, labels, tests).
3. Attach artifacts: links to CI runs; if applicable, a screenshot of docs/RTM output.
4. Keep catalog edits in a **separate commit** with the `catalog:allowed` label.
5. For dialect/policy changes, include rationale and add `mode-change`.

---

## Security
- **No secrets in Git**. Use environment examples (`.env.example`) only.
- Prefer **Supabase Vault** for secret storage in app code that consumes this template.
- Report security concerns via private channels; do not open public issues with sensitive details.

Thanks for helping keep this template predictable, opinionated, and Speckit‑compatible!