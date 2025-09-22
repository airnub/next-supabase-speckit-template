# {{APP_TITLE}}

**Repo:** `{{REPO_NAME}}`

**Spec‑Driven Development (SDD) for Next.js + Supabase.** Generate **Specification / Coding Agent Brief / Orchestration Plan** from a single SRS YAML, run coding agents with one click, and prove acceptance with tagged tests, Allure reports, and a Requirements Traceability Matrix (RTM).

[![Spec Trace CI](https://img.shields.io/badge/ci-spec--trace-blue)](#)
[![Run Agent](https://img.shields.io/badge/action-run%20agent-brightgreen)](#)
[![Playwright](https://img.shields.io/badge/tests-playwright-informational)](#)
[![Docs](https://img.shields.io/badge/docs-docusaurus-lightgrey)](#)

## Quickstart
```bash
corepack enable
pnpm i
pnpm docs:gen
pnpm rtm:build

pnpm -C docs/website i
pnpm docs:serve   # dev server
# or
pnpm docs:build   # static build in docs/website/build
```
