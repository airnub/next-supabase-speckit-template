# AgentOps Spec‑Trace Template (v0.2)

> **Vision**: A tiny, opinionated starter that makes **coding‑agent work auditable, repeatable, and enterprise‑ready** by turning specs into machine‑addressable IDs, enforcing **PR traceability**, and auto‑publishing **evidence** (tests, reports, docs).  
> **Problem**: Copy‑pasted prompts and drifting docs waste time. Commits show *what* changed, not *why* nor *whether ACs passed*.  
> **Solution**: One YAML SRS → generate your familiar **Specification**, **Coding Agent Brief**, **Orchestration Plan**, require an **Agent Task Envelope** on PRs, block merges until AC‑tagged tests pass, publish Allure reports and an RTM, and record the *why* with ADRs.

This version adds **profiles** (`minimal`, `webapp`, `game`), **feature flags** (advanced sections default **off**), and **custom sections** you can inject without editing generator code.

## Quickstart
```bash
corepack enable
pnpm i

pnpm docs:gen                  # generate with SRS defaults
pnpm docs:gen --profile minimal
pnpm docs:gen --profile game --features '{"private_groups":true}'

pnpm rtm:build                 # build placeholder RTM
pnpm docs:serve                # serve MkDocs locally
```
## Profiles, Features & Custom Sections
- Set `meta.profile` to `minimal` (default), `webapp`, or `game` in `docs/specs/spec.v*.yaml`.
- Override features via `meta.features` or `--features '{"housebot":true}'`.
- Add domain docs using `meta.custom_sections` (`after` anchors + `partial` Markdown files).

## What you get
- Single source of truth: `docs/specs/spec.v*.yaml` → generates **Spec/Brief/Plan**.
- PR traceability: required **Agent Task Envelope** + Git **trailers** (`Spec-ID:`).
- Evidence: tag Playwright tests; optional **Allure**; **RTM** compiled from SRS⇄tests⇄PR metadata.
- One‑click agent run: Action **Run Agent** or `pnpm agent:run` (always uses latest Brief & Plan).
- Docs site: MkDocs Material publishing Spec/Brief/Plan/RTM/ADRs.

**License**: MIT
