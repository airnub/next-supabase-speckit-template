# Requirements Traceability Matrix

Source: srs/app.yaml

| Requirement | Description | Docs | Tests | Code |
|---|---|---|---|---|
| REQ-CATALOG-001 | Catalog bundle under .speckit/catalog/next-supabase ships manifest, templates, and provenance with label gate. | docs/specs/generated/orchestration-plan-latest.md | tests/spec-artifacts.spec.ts | scripts/catalog/publish.ts<br>.github/workflows/catalog-gate.yml |
| REQ-PWA-001 | PWA install flow partitions auth/content/assets caches and respects Supabase profile opt-in. | docs/specs/generated/spec-latest.md<br>docs/specs/generated/orchestration-plan-latest.md | tests/spec-artifacts.spec.ts | public/sw.ts (consumer responsibility) |
| REQ-RLS-001 | Profiles are readable and writable only by the owning Supabase user via enforced RLS. | docs/specs/generated/spec-latest.md | tests/spec-artifacts.spec.ts | srs/app.yaml<br>supabase/migrations/ (expected in downstream repos) |
| REQ-RLS-002 | Audit log visibility is restricted to admin role via RLS and admin console guardrails. | docs/specs/generated/spec-latest.md | tests/spec-artifacts.spec.ts | srs/app.yaml |
| REQ-SPEC-001 | Spec, Coding Agent Brief, and Orchestration Plan regenerate deterministically from srs/app.yaml. | docs/specs/generated/spec-latest.md<br>docs/specs/generated/coding-agent-brief-latest.md<br>docs/specs/generated/orchestration-plan-latest.md | tests/spec-artifacts.spec.ts | scripts/spec-gen.ts<br>scripts/rtm/build-rtm.ts |
