import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

interface Acceptance { id: string; gwt: string }
interface Requirement { id: string; title: string; priority?: string; rationale?: string; acceptance: Acceptance[] }
type KnownProfile = 'minimal'|'webapp'|'game';
interface Meta {
  title: string; version: string; repo?: string; prefix?: string; org?: string;
  profile?: string;
  features?: Record<string, boolean>;
}
interface SRS { meta: Meta; requirements: Requirement[] }

const argv = process.argv.slice(2);
const getArg = (k: string) => { const i = argv.indexOf(k); return i!==-1 ? argv[i+1] : undefined; };
const profileOverride = getArg('--profile');
const featuresOverride = (()=>{ try { return JSON.parse(getArg('--features')||'{}') } catch { return {} } })();

const root = process.cwd();
const specsDir = path.join(root,'docs/specs');
const srsFile = fs.readdirSync(specsDir).find(f=>/^spec\.v[0-9]+\.[0-9]+\.[0-9]+\.yaml$/.test(f));
if(!srsFile){ console.error('No docs/specs/spec.v*.yaml found'); process.exit(1); }
const srs: SRS = yaml.load(fs.readFileSync(path.join(specsDir, srsFile),'utf8')) as any;

const varsPath = path.join(root, 'template.vars.json');
let vars: Record<string,string> = {};
if (fs.existsSync(varsPath)) { try { vars = JSON.parse(fs.readFileSync(varsPath,'utf8')) } catch {} }
const REPO_NAME = vars.REPO_NAME && !vars.REPO_NAME.includes('{{') ? vars.REPO_NAME : path.basename(root);
const APP_TITLE = vars.APP_TITLE && !vars.APP_TITLE.includes('{{') ? vars.APP_TITLE : (srs.meta.title && !String(srs.meta.title).includes('{{') ? String(srs.meta.title) : REPO_NAME.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
const APP_PREFIX = (vars.APP_PREFIX && !vars.APP_PREFIX.includes('{{')) ? vars.APP_PREFIX : (srs.meta.prefix && !String(srs.meta.prefix).includes('{{') ? String(srs.meta.prefix) : 'APP');
const VERSION = srs.meta.version;
const DATE = new Date().toISOString().slice(0,10);

const PROFILE_DEFAULTS: Record<KnownProfile, Record<string, boolean>> = {
  minimal: { private_groups:false, settlement_scoring:false, housebot:false, market_data_provider:false, notifications:true, admin_console:true },
  webapp:  { private_groups:false, settlement_scoring:false, housebot:false, market_data_provider:false, notifications:true, admin_console:true },
  game:    { private_groups:false, settlement_scoring:true,  housebot:true,  market_data_provider:false, notifications:true, admin_console:true }
}
const isKnownProfile = (value: string): value is KnownProfile => Object.prototype.hasOwnProperty.call(PROFILE_DEFAULTS, value);
const profile = profileOverride || srs.meta.profile || 'minimal';
const profileDefaults = typeof profile === 'string' && isKnownProfile(profile) ? PROFILE_DEFAULTS[profile] : {};
const mergedFeatures = { ...profileDefaults, ...(srs.meta.features||{}), ...featuresOverride };

function mdH1(s:string){ return `# ${s}\n\n`; }
function mdH2(s:string){ return `## ${s}\n\n`; }
function traceFooter(prefix:string){ return `\n> **Traceability Hooks**  \n> • Tag tests: @${prefix}-REQ-###  \n> • PR Agent Task Envelope: spec_ids, tests_added, adr_ids  \n> • See RTM: docs/rtm.md  \n> • (Optional) Allure report + OTel trace ID\n`; }

const outDir = path.join(specsDir,'generated'); fs.mkdirSync(outDir,{recursive:true});

function renderAcceptance(srs:SRS){
  let md = '';
  for(const r of (srs.requirements||[])){
    md += `\n### ${r.id} — ${r.title}\n\n`;
    for(const a of (r.acceptance||[])){ md += `- ${a.id}\n\n\`\`\`\n${(a.gwt||'').trim()}\n\`\`\`\n\n`; }
  }
  return md;
}

function renderSpec(){
  const base = `${APP_PREFIX.toLowerCase()}-spec-v${VERSION}.md`; // short file
  let md = '';
  md += mdH1(`${APP_TITLE} — Specification (v${VERSION})`);
  md += `_Source: docs/specs/${srsFile} · Generated ${DATE}_\n\n`;
  const sections: {title:string; enabled:boolean; body:string}[] = [];
  const add = (title:string,enabled:boolean,body:string)=>sections.push({title,enabled,body});
  add('Scope & Documents of Record', true, `- This doc mirrors the SRS; Spec is human-first.`);
  add('Core Capabilities', true, `- Describe the core user tasks and system capabilities.`);
  add('Domain Entities & Coverage', true, `- Summarize key entities.`);
  add('Business Rules (authoritative)', true, `- Define constraints and invariants.`);
  add('Algorithms / Scoring', !!mergedFeatures['settlement_scoring'], `- Scoring/settlement formulas if applicable.`);
  add('Automation Services (Bot/Worker)', !!mergedFeatures['housebot'], `- Background workers or heuristics.`);
  add('Identity & Privacy', true, `- Anonymity, login, PII handling.`);
  add('Integrations — Outbound & Inbound', true, `- Webhooks, outbound posts, inbound adapters.`);
  add('Internationalization', true, `- Language strategy.`);
  add('Timezones', true, `- Server/client TZ handling.`);
  add('Offline & Cache Isolation', true, `- PWA strategy, per-user caches.`);
  add('Social Previews (OG) / Link Cards', true, `- Dynamic OG image strategy.`);
  add('External Data Providers (swappable)', !!mergedFeatures['market_data_provider'], `- DI contract for providers.`);
  add('UX & Accessibility', true, `- Accessibility checklist.`);
  add('Data Model', true, `- High-level schema.`);
  add('Notifications', !!mergedFeatures['notifications'], `- Transports and preferences.`);
  add('Admin Console', !!mergedFeatures['admin_console'], `- Admin user journeys.`);
  add('Non‑Functional & Security', true, `- Performance, RLS/ACL, audit.`);
  add('Acceptance Criteria (from SRS)', true, renderAcceptance(srs));
  add('Disclaimer', true, `This document is informational and may evolve.`);

  for(const sect of sections){ if(sect.enabled){ md += mdH2(sect.title) + sect.body + '\n'; } }
  md += traceFooter(APP_PREFIX);
  fs.writeFileSync(path.join(outDir, base), md);
  fs.writeFileSync(path.join(outDir, 'spec-latest.md'), md);
}

function renderPlan(){
  const name = `orchestration-plan-v${VERSION}.md`;
  let md = '';
  md += mdH1(`${APP_TITLE} — Orchestration Plan (v${VERSION})`);
  md += `_Source: docs/specs/${srsFile} · Generated ${new Date().toISOString().slice(0,10)}_\n\n`;
  const add = (title:string,enabled:boolean,body:string)=>{ if(enabled){ md += mdH2(title)+body+'\n'; } };
  add('Documents of Record',true,'- Spec, Plan, Brief generated from SRS.');
  add('Tech Stack & Conventions',true,'- Next.js / Supabase / your stack here.');
  add('Directory Layout',true,'- Repo tree and module boundaries.');
  add('Environment & Secrets',true,'- Env vars, vault usage, scoping.');
  add('Data Model',true,'- Entities and migrations strategy.');
  add('Auth Strategy',true,'- Anonymous to account (if used).');
  add('Core Flows',true,'- Primary user journeys.');
  add('Rules / Algorithms (canonical)', !!mergedFeatures['settlement_scoring'], '- Verification of formulas.');
  add('Automation Services (workers/cron)', !!mergedFeatures['housebot'], '- Runtimes and scheduling.');
  add('Notifications & Preferences', !!mergedFeatures['notifications'], '- Channels and DND.');
  add('PWA Offline (User‑Scoped)', true, '- Cache isolation strategy.');
  add('Private Areas / Groups', !!mergedFeatures['private_groups'], '- Visibility and membership.');
  add('Admin Console', !!mergedFeatures['admin_console'], '- Roles and capabilities.');
  add('Integrations (Outbound + Inbound)', true, '- Webhooks and adapters.');
  add('External Providers (swappable)', !!mergedFeatures['market_data_provider'], '- DI contracts and mocks.');
  add('OG Images & Social Copy', true, '- Dynamic images and meta.');
  add('Accessibility Checklist (PR Gate)', true, '- WCAG checks per PR.');
  add('CI/CD & Quality Gates', true, '- Lint, test, RTM, Docusaurus.');
  add('Labels & PR Template', true, '- Agent Task Envelope.');
  add('Milestones (strict order)', true, '- Ordered implementation sequence.');
  add('Non‑Negotiables', true, '- Security and quality bars.');
  add('Agent Run Prompt', true, 'Copy‑paste prompt to kick off autonomous runs.');
  md += traceFooter(APP_PREFIX);
  fs.writeFileSync(path.join(outDir, name), md);
  fs.writeFileSync(path.join(outDir, 'orchestration-plan-latest.md'), md);
}

function renderBrief(){
  const name = `coding-agent-brief-v${VERSION}.md`;
  let md = '';
  md += mdH1(`${APP_TITLE} — Coding Agent Brief (v${VERSION})`);
  md += `_Source: docs/specs/${srsFile} · Generated ${new Date().toISOString().slice(0,10)}_\n\n`;
  const add = (title:string,body:string)=>{ md += mdH2(title)+body+'\n'; };
  add('Ground Rules','- Follow Spec and Plan; write tagged tests; use PR envelope.');
  add('Environment & Secrets','- Required variables and scopes.');
  let wb = '### Milestones\n\n';
  for (const r of (srs.requirements || [])) {
    const tail = (String(r.id ?? '')).split('-').pop()?.trim() ?? '';
    const rid = /^\d+$/.test(tail) ? tail : 'XXX';
    // use rid here...
  }
  // Typescript template - Python won't execute; this is just emitted content.
  wb = `\n` + (srs.requirements||[]).map((r:any)=>{
    const tail = String(r.id||'').split('-').pop();
    const rid = /\d+/.test(tail||'') ? tail : 'XXX';
    return `- ${r.id}: ${r.title}\n  - Checklist: write test tagged @${APP_PREFIX}-REQ-${rid} ; update PR envelope ; attach evidence\n`;
  }).join('');
  add('Work Breakdown (Milestones + AC)', wb);
  add('Data Model & Security','- High‑level schema and RLS/ACL.');
  if(mergedFeatures['settlement_scoring']) add('Rules/Algorithms & Helpers','- Helpers for formulas with unit tests.');
  if(mergedFeatures['admin_console']) add('Admin Console','- Admin journeys to implement.');
  add('Security & Abuse Controls','- Rate limits, CSRF, audit.');
  add('Tests & CI Gates','- Unit/e2e tagged by requirement; CI must pass.');
  add('Deliverables & DoD','- PR with envelope; tests; docs regen; ADRs as needed.');
  add('Copy‑Paste Prompt','> (Place your canonical agent prompt here)');
  md += traceFooter(APP_PREFIX);
  fs.writeFileSync(path.join(outDir, name), md);
  fs.writeFileSync(path.join(outDir, 'coding-agent-brief-latest.md'), md);
}

renderSpec();
renderPlan();
renderBrief();
