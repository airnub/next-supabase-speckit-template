# Next Supabase Speckit Template — Specification (v0.0.1)

_Source: docs/specs/spec.v0.0.1.yaml · Generated 2025-09-23_

## Scope & Documents of Record

- This doc mirrors the SRS; Spec is human-first.
## Core Capabilities

- Describe the core user tasks and system capabilities.
## Domain Entities & Coverage

- Summarize key entities.
## Business Rules (authoritative)

- Define constraints and invariants.
## Identity & Privacy

- Anonymity, login, PII handling.
## Integrations — Outbound & Inbound

- Webhooks, outbound posts, inbound adapters.
## Internationalization

- Language strategy.
## Timezones

- Server/client TZ handling.
## Offline & Cache Isolation

- PWA strategy, per-user caches.
## Social Previews (OG) / Link Cards

- Dynamic OG image strategy.
## UX & Accessibility

- Accessibility checklist.
## Data Model

- High-level schema.
## Notifications

- Transports and preferences.
## Admin Console

- Admin user journeys.
## Non‑Functional & Security

- Performance, RLS/ACL, audit.
## Acceptance Criteria (from SRS)


### REQ-001 — Anonymous first action

- AT-001

```
Given a first-time visitor
When they perform the primary action
Then the system records it without signup
```


### REQ-002 — Email magic-link sign-in

- AT-002

```
Given a registered user
When they request a magic link
Then they can sign in and see their dashboard
```


## Disclaimer

This document is informational and may evolve.

> **Traceability Hooks**  
> • Tag tests: @APP-REQ-###  
> • PR Agent Task Envelope: spec_ids, tests_added, adr_ids  
> • See RTM: docs/rtm.md  
> • (Optional) Allure report + OTel trace ID
