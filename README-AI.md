# AI Guardrails Pack (SDD Template)

This pack adds safe-by-default AI workflows. Enable them via `.env`.
- PR Review (off) — AI review on PRs or `/review` comment.
- Auto-merge (off) — merges on `/merge` from maintainers.
- Weekly Repo Review (off) — opens a PR with a summary report.

## Enable
1) Copy `.env.template` → `.env`
2) Flip flags to `true` (only what you need)
3) Set secrets: `AI_API_KEY` (+ optional `AI_API_BASE`, `AI_MODEL`)
4) Push a PR and watch the checks.

## Files
- Workflows: `.github/workflows/*.yml`
- Actions: `.github/actions/*`
- Prompts: `.github/prompts/*`

