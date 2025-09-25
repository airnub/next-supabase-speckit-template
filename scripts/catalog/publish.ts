import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';

const root = process.cwd();
const catalogRoot = path.join(root, '.speckit', 'catalog', 'next-supabase');
const templatesRoot = path.join(catalogRoot, 'templates');

const configPath = path.join(root, '.speckit', 'spec.yaml');
if (!fs.existsSync(configPath)) {
  throw new Error('Catalog publish aborted: missing .speckit/spec.yaml');
}
const specConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
const srsPath = path.join(root, specConfig?.source?.srs || '');
if (!srsPath || !fs.existsSync(srsPath)) {
  throw new Error(`Catalog publish aborted: unable to resolve SRS at ${srsPath || '<undefined>'}`);
}

const srs = yaml.load(fs.readFileSync(srsPath, 'utf8')) as any;
const metaVersion = (srs?.meta?.version && typeof srs.meta.version === 'string') ? srs.meta.version : '0.1.0';

const requiredDocs = [
  ['docs/specs/generated/spec-latest.md', 'docs/specs/generated/spec-latest.md'],
  ['docs/specs/generated/coding-agent-brief-latest.md', 'docs/specs/generated/coding-agent-brief-latest.md'],
  ['docs/specs/generated/orchestration-plan-latest.md', 'docs/specs/generated/orchestration-plan-latest.md'],
  ['docs/specs/generated/rtm-latest.md', 'docs/specs/generated/rtm-latest.md'],
];

for (const [relative] of requiredDocs) {
  const abs = path.join(root, relative);
  if (!fs.existsSync(abs)) {
    throw new Error(`Catalog publish aborted: missing generated artifact ${relative}. Run pnpm docs:gen && pnpm rtm:build first.`);
  }
}

fs.mkdirSync(templatesRoot, { recursive: true });

const copyMatrix: Array<[string, string]> = [
  ['.speckit/spec.yaml', 'config/spec.yaml'],
  ['srs/app.yaml', 'srs/app.yaml'],
  ['template.json', 'template.json'],
  ['template.vars.json', 'template.vars.json'],
  ['AGENTS.md', 'AGENTS.md'],
  ...requiredDocs,
];

for (const [srcRel, destRel] of copyMatrix) {
  const srcPath = path.join(root, srcRel);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Catalog publish aborted: missing ${srcRel}`);
  }
  const destPath = path.join(templatesRoot, destRel);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

const manifestPath = path.join(catalogRoot, 'manifest.json');
const manifest = {
  name: 'next-supabase',
  version: metaVersion,
  dialect: specConfig?.source?.dialect || { id: 'speckit.v1', version: '1.0.0' },
  provenance: {
    repo: 'airnub/speckit-template-next-supabase',
    generator: 'speckit',
  },
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const generationManifestPath = path.join(catalogRoot, 'generation-manifest.json');
let generationManifest: Array<Record<string, string>> = [];
if (fs.existsSync(generationManifestPath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(generationManifestPath, 'utf8'));
    if (Array.isArray(parsed)) {
      generationManifest = parsed;
    }
  } catch (err) {
    console.warn('Warning: unable to parse generation-manifest.json – %s', (err as Error).message);
  }
}
const currentCommit = execSync('git rev-parse HEAD').toString().trim();
let commitRef = currentCommit;
try {
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    commitRef = 'WORKTREE';
  }
} catch (err) {
  console.warn('Warning: unable to detect git status – %s', (err as Error).message);
}
const existingEntry = generationManifest.find((entry) => entry.commit === commitRef);
if (!existingEntry) {
  generationManifest.push({
    commit: commitRef,
    generated_at: new Date().toISOString(),
    version: metaVersion,
    srs: path.relative(root, srsPath),
  });
}
fs.writeFileSync(generationManifestPath, JSON.stringify(generationManifest, null, 2) + '\n');

console.log('Catalog bundle updated at %s', path.relative(root, catalogRoot));
