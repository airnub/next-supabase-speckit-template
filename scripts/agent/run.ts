import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const genDir = path.join(root, 'docs/specs/generated');
const brief = fs.readdirSync(genDir).find(f => f.startsWith('coding-agent-brief-v'));
const plan  = fs.readdirSync(genDir).find(f => f.startsWith('orchestration-plan-v'));
if(!brief || !plan){ console.error('Run `pnpm docs:gen` first.'); process.exit(1); }
const briefV = brief.match(/v([0-9]+\.[0-9]+\.[0-9]+)/)![1];
const resolved = `# Resolved Coding Agent Prompt (v${briefV})\n\n`+
  `<!-- Generated: do not edit by hand -->\n\n`+
  `## Brief\n\n${fs.readFileSync(path.join(genDir, brief),'utf8')}\n\n`+
  `## Orchestration Plan\n\n${fs.readFileSync(path.join(genDir, plan),'utf8')}\n`;
const dir = path.join(root, '.agent', 'runs', String(Date.now()));
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'prompt.md'), resolved);
console.log('Wrote', path.relative(root, path.join(dir, 'prompt.md')));
