# Speckit Governance (Distribution Template)

- `.speckit/spec.yaml` is the **spec pointer** for this template. It declares the `speckit.v1` dialect and routes every generation run to `srs/app.yaml`.
- `.speckit/catalog/**` contains the **published import bundle** (manifest, templates, generation-manifest). Treat it as **read-only** in PRs; edits require the `catalog:allowed` label.
- Do **not** place implementation source or generated docs here. Consumers run generation locally and commit docs under `docs/specs/**`.

This repository is published as a **public Speckit template**. Consumers can import it directly by GitHub URL or surface it inside a local catalog entry.

- Remote import: `speckit template use https://github.com/airnub/speckit-template-next-supabase <target-dir>`.
- Local catalog: copy this repo under `.speckit/templates/app/next-supabase` inside another project.

> Files under `.speckit/**` are **governance only**. The actual template content lives at the repository root. **Do not add implementation files** to `.speckit/**`.

Speckit templates in consumer repos belong under `.speckit/templates/**`. Remote templates like this one may provide `template.json` and `template.vars.json` at the root so the CLI can prompt for variables and run `postInit` commands automatically.
