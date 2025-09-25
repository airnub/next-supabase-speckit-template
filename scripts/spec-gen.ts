import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

type FrontMatter = Record<string, string | number | boolean>;
interface DocumentSubsection { title?: string; body?: string }
interface DocumentSection {
  number?: number | string;
  title?: string;
  body?: string;
  subsections?: DocumentSubsection[];
}
interface DocumentSpec {
  front_matter?: FrontMatter;
  heading?: string;
  intro?: string;
  sections?: DocumentSection[];
  closing?: string;
  output_file?: string;
}
interface VerificationLinks {
  docs?: string[];
  tests?: string[];
  code?: string[];
}
interface AcceptanceCriterion {
  id: string;
  text: string;
  verification?: VerificationLinks;
}
interface Srs {
  meta?: {
    version?: string;
    app_title?: string;
    repo_name?: string;
    prefix?: string;
    owners?: string[];
    summary?: string;
    tags?: string[];
  };
  preservation_policy?: string;
  security?: any;
  internationalization?: any;
  performance?: any;
  pwa_offline?: any;
  integrations?: any;
  observability?: any;
  manual_qa?: {
    command?: string;
    expectations?: string[];
  };
  agent_prompt?: string;
  acceptance_criteria?: AcceptanceCriterion[];
  milestones?: { id: string; title: string }[];
  documents?: {
    spec?: DocumentSpec;
    brief?: DocumentSpec;
    plan?: DocumentSpec;
  };
  documents_extra_tokens?: Record<string, string>;
}

const root = process.cwd();
const specsOutputDir = path.join(root, 'docs/specs/generated');
const configPath = path.join(root, '.speckit/spec.yaml');

if (!fs.existsSync(configPath)) {
  console.error('Spec generation aborted: missing .speckit/spec.yaml');
  process.exit(1);
}

const specConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
const srsPath = path.join(root, specConfig?.source?.srs || '');
if (!srsPath || !fs.existsSync(srsPath)) {
  console.error('Spec generation aborted: unable to resolve SRS at %s', srsPath || '<undefined>');
  process.exit(1);
}

const srs = yaml.load(fs.readFileSync(srsPath, 'utf8')) as Srs;

function ensure(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Spec generation aborted: ${message}`);
  }
}

ensure(srs, 'SRS file empty or invalid');
const preservationPolicy = (srs.preservation_policy || '').trim();
ensure(preservationPolicy.length > 0, 'preservation_policy is required to enforce guardrails');

const security = srs.security || {};
ensure(security.rls && Array.isArray(security.rls.tables) && security.rls.tables.length > 0, 'security.rls.tables must be defined');
ensure(Array.isArray(security.vault?.secrets) && security.vault.secrets.length > 0, 'security.vault.secrets must list Vault keys');

const intl = srs.internationalization || {};
ensure(Array.isArray(intl.locales) && intl.locales.length > 0, 'internationalization.locales must be provided');

const performance = srs.performance || {};
ensure(performance.budgets, 'performance.budgets must be defined');

const pwa = srs.pwa_offline || {};
ensure(Array.isArray(pwa.partitions) && pwa.partitions.length > 0, 'pwa_offline.partitions must be provided');

const integrations = srs.integrations || {};
ensure(integrations.providers, 'integrations.providers must be defined');

const observability = srs.observability || {};
const manualQa = srs.manual_qa || {};
ensure(typeof manualQa.command === 'string' && manualQa.command.trim().length > 0, 'manual_qa.command must document QA steps');

const acceptance = Array.isArray(srs.acceptance_criteria) ? srs.acceptance_criteria : [];
ensure(acceptance.length > 0, 'acceptance_criteria must enumerate REQ-* items');

const meta = srs.meta || {};
const owners = Array.isArray(meta.owners) ? meta.owners : [];
const firstOwner = owners[0] || 'platform@yourco.example';

const docSpec = srs.documents?.spec;
const docBrief = srs.documents?.brief;
const docPlan = srs.documents?.plan;
ensure(docSpec, 'documents.spec must be defined');
ensure(docBrief, 'documents.brief must be defined');
ensure(docPlan, 'documents.plan must be defined');

const repoNameValue = (meta.repo_name && typeof meta.repo_name === 'string') ? meta.repo_name : 'next-supabase-speckit-template';
const repoSlugSource = repoNameValue.includes('{') ? 'next-supabase' : repoNameValue;
const repoSlug = repoSlugSource.split('/').pop() || repoSlugSource;
const safeSlug = repoSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
const version = (meta.version && typeof meta.version === 'string' && meta.version.length > 0) ? meta.version : '0.0.1';

function fmtList(items: string[], bullet: string = '-') {
  return items.map((item) => `${bullet} ${item}`).join('\n');
}

function renderTable(headers: string[], rows: string[][]) {
  const headerRow = `| ${headers.join(' | ')} |`;
  const dividerRow = `|${headers.map(() => '---').join('|')}|`;
  const bodyRows = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return `${headerRow}\n${dividerRow}\n${bodyRows}`;
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function formatCapabilities(capabilities: unknown): string {
  if (!Array.isArray(capabilities) || !capabilities.length) return '';
  return capabilities.map((cap) => `    - ${cap}`).join('\n');
}

const architectureOverviewParts: string[] = [];
if (meta.summary) {
  architectureOverviewParts.push(meta.summary.trim());
}
architectureOverviewParts.push(
  '- **Runtime:** Next.js 15 App Router with React Server Components by default; deploy on Vercel edge functions.',
  '- **Data Layer:** Supabase Postgres + Storage with the RLS policies enumerated below; Supabase Auth for identity.',
  '- **Secrets:** Supabase Vault issues service-role credentials and third-party API keys for edge functions.',
  '- **Internationalization:** `next-intl` with locales ' + (Array.isArray(intl.locales) ? intl.locales.join(', ') : 'en') + '.',
  '- **Offline:** Installable PWA with partitioned caches for auth, content, and assets.',
  '- **Documentation:** `.speckit/spec.yaml` → `srs/app.yaml` is the single source; `pnpm docs:gen` regenerates this spec, brief, and plan.');
const architectureOverview = architectureOverviewParts.join('\n');

const rolesMarkdown = (Array.isArray(security.roles) ? security.roles : []).map((role: any) => {
  const id = stringify(role.id);
  const description = stringify(role.description);
  const caps = formatCapabilities(role.capabilities);
  const details = [`- **${id}** — ${description}`];
  if (caps) {
    details.push(caps);
  }
  return details.join('\n');
}).join('\n');

const authFlows = Array.isArray(security.auth_flows) ? security.auth_flows.join(', ') : '';

const rlsRows = (security.rls?.tables || []).map((table: any) => {
  const tableName = stringify(table.name);
  return (Array.isArray(table.policies) ? table.policies : []).map((policy: any) => {
    return [
      tableName,
      stringify(policy.id),
      stringify(policy.name || ''),
      stringify(policy.action || ''),
      stringify(policy.using || ''),
      stringify(policy.with_check || ''),
      stringify(policy.notes || ''),
    ];
  });
}).flat();

ensure(rlsRows.length > 0, 'security.rls.tables must include at least one policy');

const rlsTable = renderTable(
  ['Table', 'Policy', 'Name', 'Actions', 'Using', 'With Check', 'Notes'],
  rlsRows
);

const vaultSecretsList = fmtList(security.vault?.secrets || []);
const securityNotesList = Array.isArray(security.security_notes) ? fmtList(security.security_notes) : '';

const securitySection = [
  `- **Auth flows:** ${authFlows}.`,
  rolesMarkdown,
  '',
  '**Row Level Security Policies:**',
  rlsTable,
  '',
  '**Vault Secrets:**',
  vaultSecretsList,
  '',
  securityNotesList,
].filter(Boolean).join('\n');

const intlSectionParts = [
  `- **Locales:** ${Array.isArray(intl.locales) ? intl.locales.join(', ') : ''} (default ${intl.default_locale || 'en'}).`,
  `- **Framework:** ${intl.framework || 'next-intl'} with routing strategy ${intl.routing_strategy || 'subpath routing'}.`,
  `- **Translation pipeline:** ${intl.translation_pipeline || 'Documented in srs/app.yaml'}.`,
  `- **Locale detection:** ${intl.locale_detection || 'Detect via Accept-Language; persist to Supabase profile.'}.`,
  `- **Formatting:** ${intl.formatting || 'Intl.DateTimeFormat respecting profile timezone.'}.`,
];
const intlSection = intlSectionParts.join('\n');

const budgets = performance.budgets || {};
const budgetRows = Object.entries(budgets).map(([metric, value]) => [metric.toUpperCase(), stringify(value)]);
const caching = Array.isArray(performance.caching) ? performance.caching.join(', ') : '';
const images = Array.isArray(performance.images) ? performance.images.join(', ') : '';
const metricsNotes = performance.metrics?.collection ? `- **Metrics collection:** ${performance.metrics.collection}.` : '';
const alertNotes = Array.isArray(performance.metrics?.alerts)
  ? performance.metrics.alerts.map((alert: string) => `  - ${alert}`).join('\n')
  : '';
const dbNotes = performance.database ? [
  `- **Connection pooling:** ${performance.database.connection_pooling || ''}.`,
  performance.database.indexes && Array.isArray(performance.database.indexes)
    ? performance.database.indexes.map((idx: string) => `  - Index: ${idx}`).join('\n')
    : '',
].filter(Boolean).join('\n') : '';
const perfGotchas = Array.isArray(performance.security_performance_gotchas)
  ? performance.security_performance_gotchas.map((item: string) => `- ${item}`).join('\n')
  : '';
const performanceSection = [
  '**Performance Budgets:**',
  renderTable(['Metric', 'Target'], budgetRows),
  '',
  `- **Caching strategies:** ${caching}.`,
  `- **Images:** ${images}.`,
  metricsNotes,
  alertNotes ? `- **Alerts:**\n${alertNotes}` : '',
  dbNotes,
  perfGotchas ? '**Security/Performance Gotchas:**\n' + perfGotchas : '',
].filter(Boolean).join('\n');

const partitionKeys = Array.isArray(pwa.partitions) ? pwa.partitions.join(', ') : '';
const offlineStrategies = pwa.offline_strategy ? Object.entries(pwa.offline_strategy).map(([key, value]) => `- **${key}:** ${value}`).join('\n') : '';
const pushTransports = Array.isArray(pwa.push_notifications) ? pwa.push_notifications.join(', ') : '';
const swNotes = Array.isArray(pwa.service_worker?.notes) ? pwa.service_worker.notes.map((note: string) => `- ${note}`).join('\n') : '';
const pwaSection = [
  `- **Partitions:** ${partitionKeys}.`,
  offlineStrategies,
  `- **Push notifications:** ${pushTransports}.`,
  `- **Manifest:** start_url ${pwa.manifest?.start_url || '/'}; theme ${pwa.manifest?.theme_color || '#000000'}.`,
  `- **Service worker:** ${pwa.service_worker?.file || 'public/sw.ts'}.`,
  swNotes,
].filter(Boolean).join('\n');

const integrationProviders = integrations.providers || {};
const providerLines = Object.entries(integrationProviders).map(([key, value]) => `- **${key}:** ${(Array.isArray(value) ? value.join(', ') : value)}`);
const integrationFunctions = Array.isArray(integrations.supabase_functions)
  ? integrations.supabase_functions.map((fn: any) => `- **${fn.name}** — ${fn.description} (triggers: ${(fn.triggers || []).join(', ')})`).join('\n')
  : '';
const notificationLines = integrations.notifications?.transports
  ? `- **Notification transports:** ${(integrations.notifications.transports || []).join(', ')}.`
  : '';
const notificationPrefs = integrations.notifications?.preferences
  ? `  - Preferences: ${integrations.notifications.preferences}`
  : '';
const ogDefaults = integrations.og_image
  ? `- **OG Image:** Generated via ${integrations.og_image.generator}; defaults title "${integrations.og_image.defaults?.title}".`
  : '';
const integrationsSection = [
  providerLines.join('\n'),
  integrationFunctions ? '**Supabase Functions:**\n' + integrationFunctions : '',
  notificationLines,
  notificationPrefs,
  ogDefaults,
  `- **Admin console:** ${integrations.admin_console || 'minimal'}.`,
].filter(Boolean).join('\n');

const observabilitySection = [
  `- **Logging:** ${observability.logging || 'Structured logs via pino.'}`,
  `- **Tracing:** ${observability.tracing || 'OpenTelemetry via @vercel/otel.'}`,
  `- **Incident response:** ${observability.incident_response || 'Runbooks under docs/ops/ with PagerDuty escalation.'}`,
].join('\n');

const commandBlock = manualQa.command!.trim();
const manualExpectations = Array.isArray(manualQa.expectations)
  ? manualQa.expectations.map((item) => `- ${item}`).join('\n')
  : '- Manual QA expectations not documented';

const devWorkflowSection = [
  '- `pnpm docs:gen` regenerates Spec/Brief/Plan from `srs/app.yaml`.',
  '- `pnpm rtm:build` updates `docs/specs/generated/rtm-latest.md`.',
  '- `pnpm catalog:publish` refreshes `.speckit/catalog/next-supabase/`.',
  '- `pnpm test:acceptance` runs Playwright tests tagged with `@REQ-*`.',
  '- Manual QA command:\n```bash\n' + commandBlock + '\n```',
  'Expectations:\n' + manualExpectations,
].join('\n');

const acceptanceList = acceptance.map((item) => {
  const lines = [`- **${item.id}** — ${item.text}`];
  const ver = item.verification || {};
  if (ver.docs && ver.docs.length) {
    lines.push(`  - Docs: ${ver.docs.join(', ')}`);
  }
  if (ver.tests && ver.tests.length) {
    lines.push(`  - Tests: ${ver.tests.join(', ')}`);
  }
  if (ver.code && ver.code.length) {
    lines.push(`  - Code: ${ver.code.join(', ')}`);
  }
  return lines.join('\n');
}).join('\n');

const acceptanceChecklist = acceptance.map((item) => `- [ ] ${item.id} — ${item.text}`).join('\n');

function loadTemplateVars(): Record<string, any> {
  const varsPath = path.join(root, 'template.vars.json');
  if (!fs.existsSync(varsPath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(varsPath, 'utf8'));
    return parsed;
  } catch (err) {
    console.warn('Warning: unable to parse template.vars.json – %s', (err as Error).message);
    return {};
  }
}

const templateVars = loadTemplateVars();
const environmentKeys = Object.keys(templateVars);
const environmentSectionLines: string[] = [];
if (environmentKeys.length) {
  environmentSectionLines.push('- Template variables prompt for:');
  environmentSectionLines.push(...environmentKeys.map((key) => `  - ${key}`));
}
if (security.vault?.secrets) {
  environmentSectionLines.push('- Supabase Vault stores:');
  environmentSectionLines.push(...security.vault.secrets.map((secret: string) => `  - ${secret}`));
}
environmentSectionLines.push('- Store Supabase client keys in `.env.local`; never commit service role keys.');
const environmentSection = environmentSectionLines.join('\n');

const stackSection = [
  '- Next.js 15 App Router, TypeScript strict mode.',
  '- Supabase Postgres + Storage with RLS; Supabase Auth for identity.',
  `- Performance budgets enforced: TTFB ≤ ${budgets.ttfb_ms ?? '200'}ms, LCP ≤ ${budgets.lcp_ms ?? '2500'}ms, INP ≤ ${budgets.inp_ms ?? '200'}ms.`,
  `- Caching strategy: ${caching}.`,
  '- Use `next/image` with AVIF/WebP defaults and `ImageResponse` for OG generation.',
].join('\n');

const securitySummaryBullets = [
  '- Keep Supabase RLS policies in sync with `srs/app.yaml` (see spec section 2).',
  '- Wrap server actions with `createServerClient` to respect Supabase Auth sessions.',
  '- Vault secrets provision service role keys and third-party credentials.',
  '- Admin console requires `role() = \"admin\"` and runs on protected routes.',
].join('\n');

const intlSummaryBullets = [
  `- Locales: ${Array.isArray(intl.locales) ? intl.locales.join(', ') : ''} with default ${intl.default_locale || 'en'}.`,
  '- Use `next-intl` provider in `app/[locale]/layout.tsx` with server dictionaries.',
  '- Persist locale preference in Supabase profile; fallback to Accept-Language.',
].join('\n');

const pwaSummaryBullets = [
  `- Partitions: ${partitionKeys}.`,
  '- Precache service worker assets and tag caches by Supabase user id.',
  '- Background refresh rotates Supabase session tokens every 60 minutes.',
].join('\n');

const integrationsSummaryBullets = [
  providerLines.join('\n'),
  notificationLines,
  notificationPrefs,
  '- Slack + Stripe webhooks land in Supabase edge functions; follow RLS-safe patterns.',
].filter(Boolean).join('\n');

const catalogSection = [
  '- Catalog bundle lives at `.speckit/catalog/next-supabase/`.',
  '- Run `pnpm catalog:publish` after regenerating docs to sync manifest + templates.',
  '- CI requires label `catalog:allowed` for catalog edits and `mode-change` for `.speckit/spec.yaml` or SRS updates.',
  '- `speckit-verify` workflow blocks drift between SRS and generated docs.',
].join('\n');

const milestonesSection = (Array.isArray(srs.milestones) ? srs.milestones : []).map((m) => `- **${m.id}** — ${m.title}`).join('\n');

const tokens: Record<string, string> = {
  '{{meta.owners | first}}': firstOwner,
  '{{ARCHITECTURE_OVERVIEW}}': architectureOverview,
  '{{SECURITY_SECTION}}': securitySection,
  '{{I18N_SECTION}}': intlSection,
  '{{PERFORMANCE_SECTION}}': performanceSection,
  '{{PWA_SECTION}}': pwaSection,
  '{{INTEGRATIONS_SECTION}}': integrationsSection,
  '{{OBSERVABILITY_SECTION}}': observabilitySection,
  '{{DEV_WORKFLOW_SECTION}}': devWorkflowSection,
  '{{ACCEPTANCE_CRITERIA_LIST}}': acceptanceList,
  '{{PRESERVATION_POLICY}}': preservationPolicy,
  '{{ACCEPTANCE_CRITERIA_CHECKLIST}}': acceptanceChecklist,
  '{{ENVIRONMENT_SECTION}}': environmentSection,
  '{{AGENT_PROMPT}}': (srs.agent_prompt || '').trim(),
  '{{STACK_SECTION}}': stackSection,
  '{{SECURITY_SUMMARY_BULLETS}}': securitySummaryBullets,
  '{{I18N_SUMMARY_BULLETS}}': intlSummaryBullets,
  '{{PWA_SUMMARY_BULLETS}}': pwaSummaryBullets,
  '{{INTEGRATIONS_SUMMARY_BULLETS}}': integrationsSummaryBullets,
  '{{CATALOG_SECTION}}': catalogSection,
  '{{MANUAL_QA_COMMAND}}': commandBlock,
  '{{MANUAL_QA_EXPECTATIONS}}': manualExpectations,
  '{{MILESTONES_SECTION}}': milestonesSection,
};

if (srs.documents_extra_tokens) {
  Object.assign(tokens, srs.documents_extra_tokens);
}

function applyTokens(text?: string): string {
  if (!text) return '';
  let output = text;
  for (const [token, value] of Object.entries(tokens)) {
    output = output.split(token).join(value);
  }
  return output.replace(/\s+$/g, '') + '\n';
}

function renderFrontMatter(frontMatter?: FrontMatter) {
  if (!frontMatter || Object.keys(frontMatter).length === 0) {
    return '';
  }
  const lines = Object.entries(frontMatter).map(([key, value]) => `${key}: ${value}`);
  return ['---', ...lines, '---', ''].join('\n');
}

function renderSections(sections?: DocumentSection[]) {
  if (!sections || !sections.length) return '';
  return sections.map((section) => {
    const number = section.number !== undefined && section.number !== null && String(section.number).length > 0
      ? `## ${section.number}) ${applyTokens(section.title || '').trim()}`
      : `## ${applyTokens(section.title || '').trim()}`;
    const body = applyTokens(section.body || '').trimEnd();
    const subsections = (section.subsections || []).map((sub) => {
      const title = applyTokens(sub.title || '').trim();
      const subBody = applyTokens(sub.body || '').trimEnd();
      return title ? `\n### ${title}\n\n${subBody}\n` : `\n${subBody}\n`;
    }).join('');
    return [`---`, '', number, body ? `${body}\n` : '', subsections].join('\n');
  }).join('\n');
}

function renderDocument(doc: DocumentSpec, fallbackName: string, latestName: string) {
  let md = '';
  md += renderFrontMatter(doc.front_matter);
  if (doc.heading) {
    md += applyTokens(doc.heading).trim() + '\n\n';
  }
  if (doc.intro) {
    md += applyTokens(doc.intro).trim() + '\n\n';
  }
  md += renderSections(doc.sections);
  if (doc.closing) {
    md += applyTokens(doc.closing).trim() + '\n';
  }
  md = md.replace(/\s+$/g, '\n');

  const specificName = doc.output_file ? applyTokens(doc.output_file).trim() : `${safeSlug}-` + fallbackName;
  const specificPath = path.join(specsOutputDir, specificName);
  fs.writeFileSync(specificPath, md);
  fs.writeFileSync(path.join(specsOutputDir, latestName), md);
  return specificName;
}

fs.mkdirSync(specsOutputDir, { recursive: true });

const writtenFiles: string[] = [];
writtenFiles.push(renderDocument(docSpec, `spec-v${version}.md`, 'spec-latest.md'));
writtenFiles.push(renderDocument(docBrief, `coding-agent-brief-v${version}.md`, 'coding-agent-brief-latest.md'));
writtenFiles.push(renderDocument(docPlan, `orchestration-plan-v${version}.md`, 'orchestration-plan-latest.md'));

const expected = new Set([
  'spec-latest.md',
  'coding-agent-brief-latest.md',
  'orchestration-plan-latest.md',
  ...writtenFiles,
]);

const removablePrefixes = ['spec', 'coding-agent-brief', 'orchestration-plan'];
for (const file of fs.readdirSync(specsOutputDir)) {
  const shouldConsider = file.endsWith('.md') && removablePrefixes.some((prefix) => file.includes(prefix));
  if (shouldConsider && !expected.has(file)) {
    fs.unlinkSync(path.join(specsOutputDir, file));
  }
}

const missingToken = Object.entries(tokens).find(([, value]) => !value || !value.trim());
if (missingToken) {
  throw new Error(`Spec generation aborted: token ${missingToken[0]} resolved to empty string. Update srs/app.yaml to preserve details.`);
}

console.log('Generated spec, brief, and plan from %s', path.relative(root, srsPath));
