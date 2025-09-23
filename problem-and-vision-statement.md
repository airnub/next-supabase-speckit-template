# Project Vision & Problem Statement — Next + Supabase SDD Template

## 1) Problem Statement
Modern app teams (and solo builders) increasingly rely on coding agents, rapid prototyping, and multi‑repo setups. In practice, three persistent problems emerge:

1. **Traceability soup** — Specs, agent prompts, and orchestration plans drift apart across repos. Commits and PR messages alone rarely provide a reliable, auditable link from requirements → code → tests → artifacts.
2. **Document bloat & duplication** — Each new repo spawns more docs: game/app specs, agent briefs, orchestration playbooks, audit logs, changelogs, replay kits, prompt logs, etc. Valuable ideas become hard to find, keep consistent, or apply across projects.
3. **Manual agent orchestration** — Humans copy/paste agent prompts, re-run workflows by hand, and try to keep agents pointed at the right documents. This is fragile, slow, and error‑prone.
4. **Fork friction & cost surprises** — Template repos that “do everything” can surprise newcomers with CI/model costs, or lock them into app‑specific decisions that don’t fit their context.

The result is **lost time**, **lower confidence in releases**, and **difficulty scaling** SDD (Spec‑Driven Development) across many Next.js + Supabase projects.

---

## 2) Vision
A **spec‑driven, traceable, agent‑ready** template that:

- Uses a **single source of truth** (SRS YAML) to generate the three Documents of Record we actually use:
  - **Specification** (human‑first, authoritative requirements & rules)
  - **Coding Agent Brief** (machine‑ready work breakdown & acceptance)
  - **Orchestration Plan** (how we build, test, ship, and govern)
- Builds **traceability by default** with light, enforceable ceremony:
  - Requirement IDs (e.g., `APP-REQ-001`)
  - Tagged tests (`@APP-REQ-001`)
  - PR **Agent Task Envelope** JSON + commit **trailers** (`Spec-ID:`, `ADR-ID:`)
  - A compiled **RTM (Requirements Traceability Matrix)** for visibility
- Enables **agent autonomy without copy/paste**:
  - `AGENTS.md` front door that always points at the latest Spec/Brief/Plan
  - A script to **resolve** the Brief + Plan into a single prompt artifact for any agent run
- Keeps the repo **app‑agnostic** & **fork‑friendly**:
  - Placeholders in SRS meta (`{{APP_TITLE}}`, `{{REPO_NAME}}`, `{{APP_PREFIX}}`, `{{ORG_NAME}}`)
  - Optional sections via **profiles** & **feature flags** (e.g., `game`, `webapp`; `housebot`, `settlement_scoring`, `market_data_provider`, `private_groups`, etc.)
  - A docs site (Docusaurus) fed directly from the `docs/` folder, no lock‑in
- Adds **safe AI guardrails**:
  - PR review, auto‑merge, and weekly repo review **off by default**, gated via `.env` flags to prevent surprise costs
  - Provider‑agnostic prompts + composite actions so forks can bring their own AI endpoints/keys

This template aims to scale from a single developer to **enterprise teams** (devs/testers/product/security) without changing the core model.

---

## 3) Design Principles
1. **Single Source of Truth** — One SRS YAML drives Spec/Brief/Plan and the RTM.
2. **Human & Machine Ready** — Outputs are readable **and** agent‑friendly.
3. **Traceability by Default** — IDs, tags, commit trailers, and PR envelopes are required where it matters.
4. **Lowest Necessary Ceremony** — Minimal rules, maximum leverage; automate checks in CI.
5. **App‑agnostic by Construction** — Placeholders everywhere; optional domains via flags.
6. **Safety by Default** — Expensive AI flows are opt‑in via `.env`.
7. **Evidence‑Focused** — Acceptance is proven by tests and artifacts (Allure/Playwright/links), not opinions.

---

## 4) Core Components

### 4.1 Source of Truth: SRS YAML (`docs/specs/spec.vX.Y.Z.yaml`)
- **Meta** fields use placeholders:
  ```yaml
  meta:
    title: "{{APP_TITLE}}"
    version: "0.0.1"
    repo: "{{REPO_NAME}}"
    prefix: "{{APP_PREFIX}}"
    org: "{{ORG_NAME}}"
    profile: minimal | webapp | game
    features:
      private_groups: false
      settlement_scoring: false
      housebot: false
      market_data_provider: false
      notifications: true
      admin_console: true
    custom_sections: []
  ```
- **Requirements** with acceptance criteria:
  ```yaml
  - id: {{APP_PREFIX}}-REQ-001
    title: "Anonymous first action"
    priority: must
    acceptance:
      - id: AT-001
        gwt: |
          Given ...
          When ...
          Then ...
  ```
- Profiles/feature flags synthesize optional sections for Spec/Plan/Brief.

### 4.2 Generators (`scripts/spec-gen.ts`)
- Emits **versioned** docs and **stable aliases**:
  - `docs/specs/generated/app-spec-v0.0.1.md` → `spec-latest.md`
  - `coding-agent-brief-v0.0.1.md` → `coding-agent-brief-latest.md`
  - `orchestration-plan-v0.0.1.md` → `orchestration-plan-latest.md`
- Optionally refreshes a committed `AGENTS.md` front door that always points to the `*-latest.md` files.
- Uses **Spectral** to lint SRS structure and IDs.

### 4.3 Traceability Model
- **IDs:** `{{APP_PREFIX}}-REQ-###` (requirement), `AT-###` (acceptance test case), `ADR-####` (decisions)
- **Commit trailers:**
  ```
  Spec-ID: APP-REQ-001
  ADR-ID: ADR-0001
  ```
- **Tests:** tag with `@APP-REQ-###` to enable automated RTM linking.
- **PR Agent Task Envelope (JSON)** required in PR template for machine parsing:
  ```json
  { "agent_task_id":"", "spec_ids":[], "tests_added":[], "evidence":[], "adr_ids":[], "notes":"" }
  ```
- **RTM Builder:** compiles requirement ↔ acceptance ↔ tests/artifacts status into `docs/rtm.md`.

### 4.4 Agent Orchestration
- `AGENTS.md` → human front door to Spec/Brief/Plan.
- `pnpm agent:run` → builds a **resolved prompt** (Brief + Plan) in `.agent/runs/<ts>/prompt.md` so you never copy/paste.
- GitHub Action: **Run Agent** (manual dispatch) to generate and attach prompt artifact.

### 4.5 Documentation Site (Docusaurus)
- Lives at `docs/site/`, configured to read **root** `docs/`.
- CI builds the site and (optionally) deploys to GitHub Pages.
- Keeps docs discoverable without locking content into a custom format.

### 4.6 CI / Quality Gates
- **Spec Trace** workflow: lints SRS, regenerates docs, builds RTM, builds docs site, runs Playwright.
- **Deploy Docs** workflow: publishes `docs/site/build` to GitHub Pages.
- **PR Template**: enforces the Agent Task Envelope and visible acceptance evidence.

### 4.7 AI Guardrails (Off by Default)
- **PR Review** (`/review` or PR events): calls a provider‑agnostic endpoint with a capped diff to control token usage.
- **Auto‑merge** (`/merge`): optional, for trusted maintainers.
- **Weekly Repo Review**: optional report PR to keep quality improving.
- **Gating** via `.env`:
  ```env
  ENABLE_PR_REVIEW_WORKFLOW=false
  ENABLE_AUTO_MERGE_WORKFLOW=false
  ENABLE_AI_REPO_REVIEW_WORKFLOW=false
  ```
- Secrets: `AI_API_KEY` (required when enabled), optional `AI_API_BASE`, `AI_MODEL`.

---

## 5) Intended Outcomes
- **No more drift**: Spec, Brief, and Plan are generated and versioned from one SRS.
- **Auditable traceability**: IDs, tags, trailers, and RTM make it clear what shipped and why.
- **Agent speed without chaos**: Agents pull the **latest** Brief & Plan automatically; humans keep context via `AGENTS.md`.
- **Fork‑friendly**: Placeholders + profiles/flags + safe‑by‑default AI mean anyone can adopt the template without surprises.

---

## 6) Who This Is For
- **Solo devs** wanting repeatable, high‑signal workflows with coding agents.
- **Product + Eng teams** who need durable specs, clear acceptance, and cross‑functional clarity.
- **Enterprise programs** requiring governance, audit trails, and scalable conventions.

---

## 7) Scope & Non‑Goals
**In scope**
- Next.js + Supabase focused SDD template with agent‑ready docs
- Traceability model and CI/CD gates
- Docusaurus documentation site
- Optional AI reviews with cost gating

**Out of scope** (for the base template)
- Domain‑specific scoring/settlement logic (flagged optional)
- Data pipelines, embeddings, or vector search workflows
- Strong opinions on deployment/runtime beyond docs and CI

---

## 8) Success Metrics
- Time from requirement to passing acceptance test **decreases**.
- PRs include Agent Task Envelopes and correctly tagged tests **by default**.
- Spec/Brief/Plan **regenerate cleanly** across repos with minimal edits.
- RTM becomes a routine artifact and **remains up to date**.
- Forks can enable AI workflows **without unexpected costs**.

---

## 9) Roadmap (High‑Level)
1. **v0.3** (current): Docusaurus site, stable aliases, SRS validator, RTM builder, `AGENTS.md` front door, Run Agent action, AI guardrails pack (gated).
2. **v0.4**: Optional Allure integration + OTel trace IDs in agent runs; richer RTM (evidence linking by file/line); improved ADR templates.
3. **v0.5**: Pluggable `custom_sections` registry for domain‑specific docs; profile presets for common app shapes.
4. **v1.0**: Enterprise hardening—policy checks, secret scanning hooks, consolidated dashboard, and guide rails for multi‑repo programs.

---

## 10) Contributing & Governance
- Follow the PR template; include the Agent Task Envelope.
- Keep SRS changes tight and re‑generate docs/RTM in the same PR.
- Prefer ADRs for architectural decisions — reference them in PR trailers.
- Use profiles/flags instead of copy‑pasting divergent templates.
- When enabling AI workflows, include a short budget note in the PR.

---

## 11) FAQ
**Q: Why SRS YAML when we already have docs?**  
A: The YAML is the *single generative input*. It lowers duplication and keeps Spec/Brief/Plan consistent.

**Q: Why not rely solely on commit messages?**  
A: Commits alone can’t encode acceptance, tests, and links to docs in a normalized way. Trailers + PR envelopes close that gap.

**Q: Is the template locked to game features?**  
A: No. Optional sections (e.g., `housebot`, `settlement_scoring`) are off by default and controlled via flags/profiles.

**Q: Do I have to use the AI workflows?**  
A: No. They are **off by default**, provider‑agnostic, and fully optional.

**Q: How do I adapt this across many repos?**  
A: Keep the SRS structure, IDs, trailers, and RTM consistent. The generator and CI scale cleanly across repos.

---

## 12) One‑Page Summary (Executive)
- **Problem:** Spec drift, doc bloat, weak traceability, manual agent ops, cost surprises.
- **Solution:** A Next.js + Supabase template that centralizes specs (SRS YAML), generates the three canonical docs, enforces traceability, and automates agent runs.
- **Why now:** Coding agents and multi‑repo programs need clear guardrails to scale.
- **Proof:** CI checks, RTM, PR envelopes, and optional AI reviews provide continuous evidence, not ceremony.
- **Outcome:** Faster delivery, cleaner audits, happier teams — from solo builders to enterprise.

