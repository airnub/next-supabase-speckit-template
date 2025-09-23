import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const root = process.cwd();
const specsDir = path.join(root,'docs/specs');
const specVersionRegex = /^spec\.v(\d+)\.(\d+)\.(\d+)\.yaml$/;
const specFiles = fs.readdirSync(specsDir).filter(f=>specVersionRegex.test(f));
if(!specFiles.length){ console.error('No SRS found'); process.exit(1); }
const parseVersion = (filename: string) => {
  const match = filename.match(specVersionRegex);
  if(!match){ return { major: 0, minor: 0, patch: 0 }; }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
};
const srsFile = specFiles.sort((a,b)=>{
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if(vb.major !== va.major){ return vb.major - va.major; }
  if(vb.minor !== va.minor){ return vb.minor - va.minor; }
  if(vb.patch !== va.patch){ return vb.patch - va.patch; }
  return 0;
})[0];
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
