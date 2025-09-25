# Drift Guardrails — speckit-template-next-supabase

> **Purpose:** keep the published Next.js + Supabase template aligned with the SRS, generated docs, and catalog bundle. Use this maintainer checklist verbatim when cutting releases or reviewing PRs so we never dilute the RLS, Vault, i18n, PWA/offline, and perf/security constraints baked into the spec.

---

## 1. Drift detection (spec ⇆ generated docs)

- [ ] Run `pnpm install` (once per checkout) and then `pnpm docs:gen` + `pnpm rtm:build`.
- [ ] Verify `.speckit/spec.yaml` still points to `srs/app.yaml` with the expected dialect metadata.
- [ ] Inspect `docs/specs/generated/spec-latest.md`, `coding-agent-brief-latest.md`, and `orchestration-plan-latest.md` for the preserved RLS tables, Supabase Vault secrets, `next-intl` locale list, PWA/offline partitions, perf budgets (TTFB/LCP), OG image automation, notifications, and provider DI notes.
- [ ] Confirm `docs/specs/generated/rtm-latest.md` covers every `REQ-*` with matching Playwright tags or other evidence.
- [ ] Run `pnpm speckit:verify` (or check the `speckit-verify` workflow) and ensure the job passes without regenerating files.

## 2. Catalog gate (read-only bundle)

- [ ] Treat `.speckit/catalog/next-supabase/**` as read-only in PRs. If a change is unavoidable, apply the `catalog:allowed` label and rerun `pnpm catalog:publish` to rebuild the bundle from the current workspace.
- [ ] Confirm `.speckit/catalog/next-supabase/manifest.json` lists `airnub/speckit-template-next-supabase` as provenance and matches the SRS version.
- [ ] Ensure `generation-manifest.json` only grows (append new entries; never rewrite history).
- [ ] If testing an import, run:
  ```bash
  rm -rf /tmp/speckit-template-next-supabase \
    && speckit template use https://github.com/airnub/speckit-template-next-supabase /tmp/speckit-template-next-supabase \
    && cd /tmp/speckit-template-next-supabase \
    && pnpm docs:gen && pnpm rtm:build
  ```

## 3. Mode policy gate (dialect, policies, spec wiring)

- [ ] Require the `mode-change` label on PRs touching `.speckit/spec.yaml`, `srs/app.yaml`, `template.json`, policy files, or dialect metadata.
- [ ] Double-check Spectral/OPA policies continue to enforce non-empty `acceptance_criteria[]`, Supabase RLS tables, Vault secrets, and locale requirements.
- [ ] Keep AGENTS.md and `docs/specs/generated/coding-agent-brief-latest.md` in sync so the embedded Agent Prompt reflects the current guardrails.

## 4. Review & release checklist

- [ ] Confirm PRs document how RLS policies, Vault secret wiring, admin/observer roles, and i18n locales are affected.
- [ ] Require green checks for `speckit-verify`, Playwright (`pnpm test:acceptance`), and any optional aXe/Lighthouse jobs.
- [ ] Ensure `template.json` still runs `pnpm install`, `pnpm docs:gen`, `pnpm rtm:build` in `postInit`, and `template.vars.json` exposes `REPO_NAME`, `APP_TITLE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- [ ] Tag releases only after re-running `pnpm catalog:publish` and committing the updated `.speckit/catalog/next-supabase/**` bundle under the `catalog:allowed` label.
- [ ] Update downstream docs (README, AGENTS.md, generated spec pack) if any acceptance criteria, milestones, or Next.js/Supabase integration notes change.

---

Keep this checklist close to PR templates, CODEOWNERS, and labeler rules so every reviewer can trace changes back to the source SRS and preserve the opinionated Next.js + Supabase stance.
