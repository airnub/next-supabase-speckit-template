import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

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
  acceptance_criteria?: AcceptanceCriterion[];
}

const root = process.cwd();
const configPath = path.join(root, '.speckit/spec.yaml');
if (!fs.existsSync(configPath)) {
  console.error('RTM build aborted: missing .speckit/spec.yaml');
  process.exit(1);
}

const specConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
const srsPath = path.join(root, specConfig?.source?.srs || '');
if (!srsPath || !fs.existsSync(srsPath)) {
  console.error('RTM build aborted: unable to resolve SRS at %s', srsPath || '<undefined>');
  process.exit(1);
}

const srs = yaml.load(fs.readFileSync(srsPath, 'utf8')) as Srs;
const acceptance = Array.isArray(srs.acceptance_criteria) ? srs.acceptance_criteria : [];
if (!acceptance.length) {
  throw new Error('RTM build aborted: acceptance_criteria missing in srs/app.yaml');
}

const sortedAcceptance = [...acceptance].sort((a, b) => a.id.localeCompare(b.id));
const rows = sortedAcceptance.map((criterion) => {
  const verification = criterion.verification || {};
  const docs = (verification.docs || []).join('<br>');
  const tests = (verification.tests || []).join('<br>');
  const code = (verification.code || []).join('<br>');
  return `| ${criterion.id} | ${criterion.text.replace(/\n/g, ' ')} | ${docs} | ${tests} | ${code} |`;
}).join('\n');

const header = '# Requirements Traceability Matrix\n\n';
const source = `Source: ${path.relative(root, srsPath)}\n\n`;
const tableHeader = '| Requirement | Description | Docs | Tests | Code |\n|---|---|---|---|---|\n';
const md = header + source + tableHeader + rows + '\n';

const outputDir = path.join(root, 'docs/specs/generated');
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'rtm-latest.md');
fs.writeFileSync(outputPath, md);
console.log('Wrote %s', path.relative(root, outputPath));
