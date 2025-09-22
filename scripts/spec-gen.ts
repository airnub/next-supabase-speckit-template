import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

interface Acceptance { id: string; gwt: string }
interface Requirement { id: string; title: string; priority?: string; rationale?: string; acceptance: Acceptance[] }
interface CustomSection { id: string; title: string; doc: ('spec'|'plan'|'brief')[]|('spec'|'plan'|'brief'); after: string; partial?: string; content?: string }
interface Meta {
  title: string; version: string; repo?: string; prefix?: string; org?: string;
  profile?: 'minimal'|'webapp'|'game';
  features?: Record<string, boolean>;
  custom_sections?: CustomSection[];
}
interface SRS { meta: Meta; requirements: Requirement[] }

const argv = process.argv.slice(2);
const getArg = (k: string) => { const i = argv.indexOf(k); return i!==-1 ? argv[i+1] : undefined; };
const profileOverride = getArg('--profile') as Meta['profile'];
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
const APP_TITLE = vars.APP_TITLE && !vars.APP_TITLE.includes('{{') ? vars.APP_TITLE : (srs.meta.title || REPO_NAME.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
const APP_PREFIX = vars.APP_PREFIX || srs.meta.prefix || 'APP';
const VERSION = srs.meta.version;
const DATE = new Date().toISOString().slice(0,10);

const PROFILE_DEFAULTS: Record<NonNullable<Meta['profile']>, Record<string, boolean>> = {
  minimal: { private_groups:false, settlement_scoring:false, housebot:false, market_data_provider:false, notifications:true, admin_console:true },
  webapp:  { private_groups:false, settlement_scoring:false, housebot:false, market_data_provider:false, notifications:true, admin_console:true },
  game:    { private_groups:false, settlement_scoring:true,  housebot:true,  market_data_provider:false, notifications:true, admin_console:true }
}
const profile = profileOverride || srs.meta.profile || 'minimal';
const mergedFeatures = { ...PROFILE_DEFAULTS[profile], ...(srs.meta.features||{}), ...featuresOverride };

type Sect = {anchor:string; title:string; body:string; enabled:boolean};
const ANCHORS = ['scope_dor','core_capabilities','domain_entities','business_rules','algorithms_scoring','automation_services','identity_privacy','integrations','i18n','timezones','offline_cache','og_previews','external_providers','ux_a11y','data_model','notifications','admin_console','nonfunctional_security','acceptance_criteria','disclaimer'] as const;

function specSections(): Sect[] {
  const sections: Sect[] = [];
  const add = (anchor:string,title:string,enabled:boolean,body:string)=>sections.push({anchor,title,enabled,body});
  add('scope_dor', 'Scope & Documents of Record', true, `_Source: docs/specs/${srsFile} · Generated ${DATE}_`);
  add('core_capabilities','Core Capabilities', true, `- Describe the core user tasks and system capabilities.`);
  add('domain_entities','Domain Entities & Coverage', true, `- Summarize key entities.`);
  add('business_rules','Business Rules (authoritative)', true, `- Define constraints and invariants.`);
  add('algorithms_scoring','Algorithms / Scoring', !!mergedFeatures['settlement_scoring'], `- Scoring/settlement formulas if applicable.`);
  add('automation_services','Automation Services (Bot/Worker)', !!mergedFeatures['housebot'], `- Background workers or heuristics.`);
  add('identity_privacy','Identity & Privacy', true, `- Anonymity, login, PII handling.`);
  add('integrations','Integrations — Outbound & Inbound', true, `- Webhooks, outbound posts, inbound adapters.`);
  add('i18n','Internationalization', true, `- Language strategy.`);
  add('timezones','Timezones', true, `- Server/client TZ handling.`);
  add('offline_cache','Offline & Cache Isolation', true, `- PWA strategy, per-user caches.`);
  add('og_previews','Social Previews (OG) / Link Cards', true, `- Dynamic OG image strategy.`);
  add('external_providers','External Data Providers (swappable)', !!mergedFeatures['market_data_provider'], `- DI contract for providers.`);
  add('ux_a11y','UX & Accessibility', true, `- Accessibility checklist.`);
  add('data_model','Data Model', true, `- High-level schema.`);
  add('notifications','Notifications', !!mergedFeatures['notifications'], `- Transports and preferences.`);
  add('admin_console','Admin Console', !!mergedFeatures['admin_console'], `- Admin user journeys.`);
  add('nonfunctional_security','Non‑Functional & Security', true, `- Performance, RLS/ACL, audit.`);
  add('acceptance_criteria','Acceptance Criteria (from SRS)', true, renderAcceptance());
  add('disclaimer','Disclaimer', true, `This document is informational and may evolve.`);
  return sections;
}

function renderAcceptance(){
  let md = '';
  for(const r of srs.requirements){
    md += `\n### ${r.id} — ${r.title}\n\n`;
    for(const a of r.acceptance){ md += `- ${a.id}\n\n\`\`\`\n${a.gwt.trim()}\n\`\`\`\n\n`; }
  }
  return md;
}

function getCustomSections(doc: 'spec'|'plan'|'brief'){
  const list = (srs.meta.custom_sections||[]).flatMap(cs => {
    const docs = Array.isArray(cs.doc) ? cs.doc : [cs.doc];
    if (!docs.includes(doc)) return [];
    const body = cs.partial && fs.existsSync(path.join(root, cs.partial))
      ? fs.readFileSync(path.join(root, cs.partial),'utf8')
      : (cs.content || '');
    return [{...cs, body}];
  });
  return list;
}

const outDir = path.join(specsDir,'generated'); fs.mkdirSync(outDir,{recursive:true});
function mdH1(s:string){ return `# ${s}\n\n`; }
function mdH2(s:string){ return `## ${s}\n\n`; }
function traceFooter(){ return `\n> **Traceability Hooks**  \n> • Tag tests: @${APP_PREFIX}-REQ-###  \n> • PR Agent Task Envelope: spec_ids, tests_added, adr_ids  \n> • See RTM: docs/rtm.md  \n> • (Optional) Allure report + OTel trace ID\n`; }
function kebab(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}

function renderSpec(){
  const name = `${kebab(REPO_NAME)}-spec-v${VERSION}.md`;
  let md = '';
  md += mdH1(`${APP_TITLE} — Specification (v${VERSION})`);
  md += `_Source: docs/specs/${srsFile} · Generated ${DATE}_\n\n`;
  const sections = specSections();
  const customs = getCustomSections('spec');
  for(const sect of sections){
    if(!sect.enabled) continue;
    md += mdH2(sect.title) + sect.body + '\n';
    for(const cs of customs.filter(c=>c.after===sect.anchor)){
      md += mdH2(cs.title) + (cs as any).body + '\n';
    }
  }
  md += traceFooter();
  fs.writeFileSync(path.join(outDir, name), md);
}

function renderPlan(){
  const name = `orchestration-plan-v${VERSION}.md`;
  let md = '';
  md += mdH1(`${APP_TITLE} — Orchestration Plan (v${VERSION})`);
  md += `_Source: docs/specs/${srsFile} · Generated ${DATE}_\n\n`;
  const customs = getCustomSections('plan');
  const add = (anchor:string,title:string,enabled:boolean,body:string)=>{
    if(!enabled) return;
    md += mdH2(title) + body + '\n';
    for(const cs of customs.filter(c=>c.after===anchor)){
      md += mdH2(cs.title) + (cs as any).body + '\n';
    }
  }
  add('scope_dor','Documents of Record',true,'- Spec, Plan, Brief generated from SRS.');
  add('tech_stack','Tech Stack & Conventions',true,'- Next.js / your stack here.');
  add('dir_layout','Directory Layout',true,'- Repo tree and module boundaries.');
  add('env_secrets','Environment & Secrets',true,'- Env vars, vault usage, scoping.');
  add('data_model','Data Model',true,'- Entities and migrations strategy.');
  add('auth','Auth Strategy',true,'- Anonymous to account (if used).');
  add('core_flows','Core Flows',true,'- Primary user journeys.');
  add('rules_algorithms','Rules / Algorithms (canonical)', !!mergedFeatures['settlement_scoring'], '- Verification of formulas.');
  add('automation_services','Automation Services (workers/cron)', !!mergedFeatures['housebot'], '- Runtimes and scheduling.');
  add('notifications','Notifications & Preferences', !!mergedFeatures['notifications'], '- Channels and DND.');
  add('pwa_offline','PWA Offline (User‑Scoped)', true, '- Cache isolation strategy.');
  add('private_groups','Private Areas / Groups', !!mergedFeatures['private_groups'], '- Visibility and membership.');
  add('admin_console','Admin Console', !!mergedFeatures['admin_console'], '- Roles and capabilities.');
  add('integrations','Integrations (Outbound + Inbound)', true, '- Webhooks and adapters.');
  add('external_providers','External Providers (swappable)', !!mergedFeatures['market_data_provider'], '- DI contracts and mocks.');
  add('og_images','OG Images & Social Copy', true, '- Dynamic images and meta.');
  add('a11y_gate','Accessibility Checklist (PR Gate)', true, '- WCAG checks per PR.');
  add('ci_cd','CI/CD & Quality Gates', true, '- Lint, test, RTM, Allure, pages.');
  add('labels_pr','Labels & PR Template', true, '- Agent Task Envelope.');
  add('milestones','Milestones (strict order)', true, '- Ordered implementation sequence.');
  add('non_negotiables','Non‑Negotiables', true, '- Security and quality bars.');
  add('agent_prompt','Agent Run Prompt', true, 'Copy‑paste prompt to kick off autonomous runs.');
  md += traceFooter();
  fs.writeFileSync(path.join(outDir, name), md);
}

function renderBrief(){
  const name = `coding-agent-brief-v${VERSION}.md`;
  let md = '';
  md += mdH1(`${APP_TITLE} — Coding Agent Brief (v${VERSION})`);
  md += `_Source: docs/specs/${srsFile} · Generated ${DATE}_\n\n`;
  const customs = getCustomSections('brief');
  const add = (anchor:string,title:string,body:string)=>{
    md += mdH2(title) + body + '\n';
    for(const cs of customs.filter(c=>c.after===anchor)){
      md += mdH2(cs.title) + (cs as any).body + '\n';
    }
  }
  add('ground_rules','Ground Rules','- Follow Spec and Plan; write tagged tests; use PR envelope.');
  add('env_secrets','Environment & Secrets','- Required variables and scopes.');
  let wb = '### Milestones\n\n';
  for(const r of srs.requirements){
    const rid = r.id.split('-').pop();
    wb += `- ${r.id}: ${r.title}\n  - Checklist: write test tagged @${APP_PREFIX}-REQ-${rid} ; update PR envelope ; attach evidence\n`;
  }
  add('work_breakdown','Work Breakdown (Milestones + AC)', wb);
  add('data_rls','Data Model & Security','- High‑level schema and RLS/ACL.');
  if(mergedFeatures['settlement_scoring']) add('rules_helpers','Rules/Algorithms & Helpers','- Helpers for formulas with unit tests.');
  if(mergedFeatures['admin_console']) add('admin_console','Admin Console','- Admin journeys to implement.');
  add('security_abuse','Security & Abuse Controls','- Rate limits, CSRF, audit.');
  add('tests_ci','Tests & CI Gates','- Unit/e2e tagged by requirement; CI must pass.');
  add('deliverables','Deliverables & DoD','- PR with envelope; tests; docs regen; ADRs as needed.');
  add('agent_prompt','Copy‑Paste Prompt','> (Place your canonical agent prompt here)');
  md += traceFooter();
  fs.writeFileSync(path.join(outDir, name), md);
}

function renderAgentsFrontDoor(){
  const md = `# Agents — Front Door\n\n`+
    `- **Spec:** docs/specs/generated/${kebab(REPO_NAME)}-spec-v${VERSION}.md\n`+
    `- **Coding Agent Brief:** docs/specs/generated/coding-agent-brief-v${VERSION}.md\n`+
    `- **Orchestration Plan:** docs/specs/generated/orchestration-plan-v${VERSION}.md\n\n`+
    `## Run the Coding Agent\n- **One‑click:** GitHub → Actions → *Run Agent*\n- **Local:** pnpm agent:run (artifacts in .agent/runs)\n`;
  fs.writeFileSync(path.join(root,'AGENTS.md'), md);
}

function mdH1(s:string){ return `# ${s}\n\n`; }
function mdH2(s:string){ return `## ${s}\n\n`; }
function kebab(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}

renderSpec(); renderPlan(); renderBrief(); renderAgentsFrontDoor();

const outCfg = { profile: (profileOverride||srs.meta.profile||'minimal'), features: mergedFeatures, vars: { REPO_NAME, APP_TITLE, APP_PREFIX, VERSION, DATE } };
fs.mkdirSync(path.join(root,'.agent'), { recursive: true });
fs.writeFileSync(path.join(root,'.agent','.last-gen.json'), JSON.stringify(outCfg,null,2));
console.log('Generated Spec/Plan/Brief + AGENTS.md with profile=%s', outCfg.profile);
