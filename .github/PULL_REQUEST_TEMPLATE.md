# Pull Request — Spec‑Driven Development (SDD)

> Please fill this out. CI will check your SRS, regenerate docs, build the docs site, and verify tests.

## Title

`[SDD] <short summary>`

## What & Why

* **What changed:**
* **Why:**

## Scope — Requirements impacted

List all requirement IDs touched by this PR.

* `{{APP_PREFIX}}-REQ-___`
* `{{APP_PREFIX}}-REQ-___`

### Agent Task Envelope (required)

Paste as **valid JSON**. This is parsed by tooling/CI to update the RTM and evidence links.

```json
{
  "agent_task_id": "",
  "spec_ids": ["{{APP_PREFIX}}-REQ-001"],
  "tests_added": ["tests/<file>.spec.ts#@{{APP_PREFIX}}-REQ-001"],
  "evidence": [".playwright-report/index.html", "allure-report/index.html"],
  "adr_ids": ["ADR-0001"],
  "notes": ""
}
```

> **Commit trailers** (add to each commit that implements a requirement):
>
> ```
> Spec-ID: {{APP_PREFIX}}-REQ-001
> ADR-ID: ADR-0001
> ```

## Acceptance Evidence

* **Spec section(s):** `docs/specs/generated/spec-latest.md`
* **Brief section(s):** `docs/specs/generated/coding-agent-brief-latest.md`
* **Plan section(s):** `docs/specs/generated/orchestration-plan-latest.md`
* **Screenshots / recordings:** (attach)
* **Logs / reports:** (e.g., Allure, Playwright HTML)

## Checklist

* [ ] I ran `pnpm lint:spec` (SRS lints clean)
* [ ] I ran `pnpm docs:gen` and committed any doc updates
* [ ] I ran `pnpm rtm:build` and included `docs/rtm.md` changes (if any)
* [ ] I added/updated tests tagged with `@{{APP_PREFIX}}-REQ-###`
* [ ] I verified local docs build: `pnpm -C docs/site build` (CI will also build)
* [ ] I included **Agent Task Envelope** JSON above (valid JSON)
* [ ] No secrets or credentials are committed

## Breaking changes?

* [ ] No
* [ ] Yes — describe migration/rollout:

## Deployment notes

* Feature flag / profile / env changes:
* Rollback plan:

## Additional context

(links to issues, discussions, ADRs, designs)
