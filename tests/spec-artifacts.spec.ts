import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs', 'specs', 'generated');
const catalogManifestPath = path.join(root, '.speckit', 'catalog', 'next-supabase', 'manifest.json');

function readDoc(name: string) {
  const fullPath = path.join(docsDir, name);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing generated doc: ${name}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

test('@REQ-SPEC-001 spec + brief + plan render from SRS', async () => {
  const spec = readDoc('spec-latest.md');
  const brief = readDoc('coding-agent-brief-latest.md');
  const plan = readDoc('orchestration-plan-latest.md');

  expect(spec).toContain('Platform Specification');
  expect(brief).toContain('Coding Agent Brief');
  expect(plan).toContain('Orchestration Plan');
  expect(spec).toContain('Generated from Speckit SRS');
});

test('@REQ-RLS-001 profiles RLS policy documented', async () => {
  const spec = readDoc('spec-latest.md');
  expect(spec).toContain("auth.uid() = id");
});

test('@REQ-RLS-002 audit log admin-only policy documented', async () => {
  const spec = readDoc('spec-latest.md');
  expect(spec).toContain("role() = 'admin'");
});

test('@REQ-PWA-001 offline partitions called out', async () => {
  const spec = readDoc('spec-latest.md');
  expect(spec).toContain('**Partitions:** auth, content, assets.');
});

test('@REQ-CATALOG-001 catalog manifest wired for next-supabase bundle', async () => {
  expect(fs.existsSync(catalogManifestPath)).toBeTruthy();
  const manifest = JSON.parse(fs.readFileSync(catalogManifestPath, 'utf8'));
  expect(manifest.name).toBe('next-supabase');
  expect(manifest.dialect?.id).toBe('speckit.v1');
});
