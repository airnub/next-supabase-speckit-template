# Pull Request — next‑supabase‑speckit‑template

> Please complete all sections. CI will check spec/docs drift, run tests, and enforce label gates.

## Title

`[type] <short summary>`  
_Use Conventional Commits for the first word (feat, fix, docs, chore, ci, test, refactor, perf)._

---

## What & Why
- **What changed:**
- **Why:**
- **User impact / template impact:**

---

## Scope — Requirements impacted
List all requirement IDs touched by this PR (from the SRS / RTM).

- `REQ-____`
- `REQ-____`

> If adding new requirements, update `srs/app.yaml` and re‑generate docs/RTM.

---

## Evidence
Provide links or screenshots:
- **Docs generation:** link to CI step or paste `git diff` status showing no drift
- **RTM:** link to `docs/specs/generated/rtm-latest.md` in the PR artifacts
- **Tests:** CI run URL (Playwright); optional aXe/Lighthouse reports

---

## Checklists

### Local verification
- [ ] Ran `pnpm docs:gen` **twice** with **no diffs** under `docs/specs/generated/**`
- [ ] Ran `pnpm rtm:build` and verified `docs/specs/generated/rtm-latest.md`
- [ ] Ran `pnpm test:acceptance` and scenarios are tagged with `@REQ-*`

### Labels & policy gates
- [ ] **No** changes under `.speckit/catalog/**`  
  **OR** I added the **`catalog:allowed`** label for catalog edits.
- [ ] **No** changes to `.speckit/spec.yaml`, `.spectral.yaml`, or `policy/**`  
  **OR** I added the **`mode-change`** label and explained the rationale.

### Preservation Policy
- [ ] I did **not** remove or dilute platform‑specific details (Next.js/Supabase, RLS, Vault, i18n, perf/security gotchas, ADRs, CI gates).
- [ ] Variable interpolation only replaced placeholders; it did **not** delete opinionated sections.

---

## Docs updated?
- [ ] `docs/specs/generated/spec-latest.md`
- [ ] `docs/specs/generated/coding-agent-brief-latest.md`
- [ ] `docs/specs/generated/orchestration-plan-latest.md`

> If any are missing, run `pnpm docs:gen` and commit.

---

## Breaking changes?
- [ ] No breaking changes
- [ ] Breaking changes (describe migration plan):

**Migration notes:**

---

## Additional notes
- Links to related issues/PRs:
- Follow‑ups / out of scope:

---

### References
- **AGENTS:** `AGENTS.md` (Preservation Policy & run prompt)
- **Guardrails:** `docs/internal/DRIFT-GUARDRAILS.md`
