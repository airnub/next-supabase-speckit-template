import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const root = process.cwd();
const specsDir = path.join(root,'docs/specs');
const srsFile = fs.readdirSync(specsDir).find(f=>/^spec\.v[0-9]+\.[0-9]+\.[0-9]+\.yaml$/.test(f));
if(!srsFile){ console.error('No SRS found'); process.exit(1); }
const srs:any = yaml.load(fs.readFileSync(path.join(specsDir, srsFile),'utf8'));
const rows = (srs.requirements||[]).map((r:any)=>{
  const acs = (r.acceptance||[]).map((a:any)=>a.id).join(', ');
  return `| ${r.id} | ${r.title} | ${acs} | unknown |`;
}).join('\n');

const md = `# Requirements Traceability Matrix\n\n`+
`Source: docs/specs/${srsFile}\n\n`+
`| Requirement | Title | Acceptance IDs | Status |\n|---|---|---|---|\n`+rows+`\n`;

fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs','rtm.md'), md);
console.log('Wrote docs/rtm.md');
