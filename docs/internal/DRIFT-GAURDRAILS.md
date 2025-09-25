# Speckit → Template Drift Guardrails

> Goal: ensure **next‑supabase‑speckit‑template** can never drift from the conventions enforced and documented in **airnub/speckit**. This is a **copy‑paste implementation checklist** with file stubs, workflow names, and policy rules to add to the template.

---

## A. Source‑of‑Truth & Adapters

**Add/ensure**
- `.speckit/spec.yaml` — declare `dialect.id` + `dialect.version`; point to `srs/app.yaml`.
- `srs/app.yaml` — model your golden sections (RLS, Vault, i18n, PWA/offline, perf budgets, integrations, AC with `REQ-*`, milestones). This is the spine the docs/RTM build from.
- `docs/specs/generated/generation-manifest.json` — append‑only provenance including dialect + template + tool versions. Fail builds if this file is missing or shrinks.

**Scripts**
```json
{
  "scripts": {
    "docs:gen": "node scripts/docs-gen.mjs",   
    "rtm:build": "node scripts/rtm-build.mjs",
    "speckit:gen": "speckit gen --write",
    "speckit:check": "speckit gen --check"
  }
}
```

---

## B. Catalog: publishable, read‑only bundle

**Structure**
```
.speckit/
  catalog/
    next-supabase/
      manifest.json
      templates/**                # rendered import bundle (specs + prompts)
      generation-manifest.json    # append‑only
```

**Rules**
- Treat `.speckit/catalog/**` as **read‑only**. PRs editing it must carry `catalog:allowed`.
- Provide a **publish script** that (re)generates + stages the bundle:

```json
{
  "scripts": {
    "catalog:publish": "node scripts/catalog-publish.mjs"
  }
}
```

**CODEOWNERS**
```
.speckit/catalog/**   @maintainers
.speckit/spec.yaml    @maintainers
policy/**             @maintainers
```

---

## C. CI Workflows (GitHub Actions)

Add the following under `.github/workflows/`:

1) **speckit-verify.yml** — drift & determinism
```yaml
name: speckit-verify
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable && pnpm i --frozen-lockfile
      - run: pnpm docs:gen && pnpm rtm:build
      - run: git diff --exit-code docs/specs || (echo "Generated docs drift from SRS" && exit 1)
      - run: test -f docs/specs/generated/generation-manifest.json || (echo "Missing generation-manifest" && exit 1)
```

2) **catalog-gate.yml** — label gate for catalog edits
```yaml
name: catalog-gate
on: [pull_request]
jobs:
  gate:
    if: contains(join(github.event.pull_request.changed_files.*.filename, '\n'), '.speckit/catalog/')
    runs-on: ubuntu-latest
    steps:
      - name: Require catalog:allowed label
        uses: mheap/github-action-required-labels@v5
        with:
          mode: minimum
          count: 1
          labels: catalog:allowed
```

3) **mode-policy-gate.yml** — protect mode/dialect/policy surfaces
```yaml
name: mode-policy-gate
on: [pull_request]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - name: Require mode-change when key files touched
        uses: mheap/github-action-required-labels@v5
        with:
          mode: minimum
          count: 1
          labels: mode-change
        env:
          FILES_CHANGED: ${{ toJson(github.event.pull_request.changed_files) }}
```
> Configure the action’s built‑in path filter or pair with `dorny/paths-filter@v3` to trigger only when these paths change: `.speckit/spec.yaml`, `template.json`, `policy/**`, `.spectral.yaml`, `.speckit/catalog/**`.

4) **tests.yml** — Playwright + optional a11y/perf
```yaml
name: tests
on: [pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable && pnpm i --frozen-lockfile
      - run: pnpm test:acceptance   # Playwright, tagged with @REQ-*
      - if: ${{ vars.RUN_AXE == 'true' }}
        run: pnpm test:axe
      - if: ${{ vars.RUN_LIGHTHOUSE == 'true' }}
        run: pnpm test:lighthouse
```

---

## D. Policies & Linters (prevent silent drift)

**Spectral rules** — extend `.spectral.yaml`:
- Enforce non‑empty `acceptance_criteria[]` with `id` starting `REQ-`.
- Require `security.rls.tables[]` and at least one `vault.secrets[]`.
- Fail if `internationalization.default_locale` missing.

**OPA/Conftest** — add `policy/` with:
- `catalog_readonly.rego` — block PRs that change `.speckit/catalog/**` without `catalog:allowed`.
- `mode_change.rego` — require `mode-change` label when `dialect` or policy files change.
- `docs_present.rego` — require existence of the three generated docs and a non‑shrinking `generation-manifest.json`.

Wire with a tiny Action (or run `conftest test` in `speckit-verify`).

---

## E. Template Manifest & Post‑Init

**template.json**
- Ensure `postInit` runs: `pnpm install`, `pnpm docs:gen`, `pnpm rtm:build`.
- Add a post‑init validator to assert `.speckit/spec.yaml` exists and placeholders were interpolated.

**template.vars.json**
- Include: `REPO_NAME`, `APP_TITLE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and any SRS‑referenced variables.

**Post‑init validator**
```bash
node scripts/postinit-validate.mjs   # checks files, placeholders, envs
```

---

## F. Docs & Internal Working Area

- Keep **public, generated** docs under `docs/specs/generated/**`:
  - `spec-latest.md`, `coding-agent-brief-latest.md`, `orchestration-plan-latest.md`, `rtm-latest.md`.
- Keep **internal** working docs under `docs/internal/**` (ADRs, RTM commentary, contributor notes).
- Add `AGENTS.md` at root (present) — links to latest docs + Preservation Policy.

---

## G. Tests & Traceability

- `tests/**` Playwright specs tagged with `@REQ-...` matching SRS IDs.
- `pnpm rtm:build` generates `docs/specs/generated/rtm-latest.md` mapping `REQ-*` → tests/code/docs.
- Optional: Allure report (artifact) or lightweight HTML report in `docs/specs/generated/rtm-report.html`.

---

## H. Repo Hygiene (keep deltas controlled)

- **Husky hooks**: pre‑commit runs `pnpm docs:gen && pnpm rtm:build && git diff --exit-code docs/specs`.
- **Commitlint**: enforce Conventional Commits (matches `speckit` repo style).
- **.editorconfig**, **LICENSE**, **SECURITY.md**, **CODEOWNERS**, **PR template** with a checklist:
  - [ ] `pnpm docs:gen` clean; [ ] RTM built; [ ] Catalog unchanged or `catalog:allowed` label present; [ ] AC passed.
- **Renovate** (optional): restrict to dev tooling; require manual label for runtime deps.

---

## I. Handy Starters (drop‑in)

**.github/labeler.yml** (auto‑label by path)
```yaml
catalog:
  - .speckit/catalog/**
mode-change:
  - .speckit/spec.yaml
  - .spectral.yaml
  - policy/**
docs:
  - docs/**
```

**AGENTS.md** — already added; keep Preservation Policy verbatim.

**Scripts** (package.json)
```json
{
  "scripts": {
    "test:acceptance": "playwright test",
    "test:axe": "node scripts/axe.mjs",
    "test:lighthouse": "node scripts/lh.mjs"
  }
}
```

---

## J. Ongoing Maintenance Checklist

- When `speckit` updates adapters or dialects, bump **dialect.version** in `.speckit/spec.yaml` and re‑generate.
- Every PR touching SRS/dialect: require `mode-change` and regenerate docs + RTM.
- Any catalog tweak: require `catalog:allowed` and include a fresh `generation-manifest.json`.
- Keep AI/analytics **disabled by default** in docs and post‑init (document how to enable in local config).

---

## K. Quick QA Script

```bash
rm -rf /tmp/next-supabase-template \
 && speckit template use https://github.com/airnub/next-supabase-speckit-template /tmp/next-supabase-template \
 && cd /tmp/next-supabase-template \
 && pnpm i && pnpm docs:gen && pnpm rtm:build \
 && test -f docs/specs/generated/spec-latest.md \
 && test -f docs/specs/generated/coding-agent-brief-latest.md \
 && test -f docs/specs/generated/orchestration-plan-latest.md \
 && test -f docs/specs/generated/rtm-latest.md \
 && echo "OK: template matches Speckit conventions"
```

---

## L. What this buys you

- **Spec‑first determinism** (drift detection, read‑only catalog, label gates).
- **Compatibility with dialects/adapters** without ever mutating your opinionated content.
- **Reproducible docs + RTM** that match the golden standard and stay aligned with Speckit’s TUI/CLI behavior over time.

