import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

assert.ok(existsSync(path.join(root, 'docs/RANCANGANFINAL.md')), 'RANCANGAN FINAL tidak ditemukan');

const expected = ['T1', 'T2', 'T3', 'T4', 'T5'];
const status = [...read('docs/status-tugas.md').matchAll(/^\| (T\d) \|[^\n]*?\| (todo|doing|blocked|done) \|/gm)];
assert.deepEqual(status.map((match) => match[1]), expected, 'Papan status harus memuat T1–T5 tepat sekali');
console.log('PASS: papan status T1–T5');

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : [target];
  });
}
function anchors(text) {
  return new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1]
    .toLowerCase().replace(/[`*_]/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-')));
}

const rancangan = path.join(root, 'docs/rancangan') + path.sep;
const docs = filesIn(path.join(root, 'docs')).filter((file) => file.endsWith('.md') && !file.startsWith(rancangan));
docs.push(...['README.md', 'AGENTS.md', 'DESIGN.md'].map((file) => path.join(root, file)));
let linkCount = 0;
for (const file of docs) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    const href = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    const [rawTarget, fragment] = href.split('#');
    const target = rawTarget ? path.resolve(path.dirname(file), decodeURIComponent(rawTarget)) : file;
    assert.ok(existsSync(target), `${path.relative(root, file)}: tautan hilang ${href}`);
    if (fragment && target.endsWith('.md')) {
      assert.ok(anchors(readFileSync(target, 'utf8')).has(decodeURIComponent(fragment)), `Anchor tidak ditemukan: ${href}`);
    }
    linkCount++;
  }
}
console.log(`PASS: ${linkCount} tautan lokal pada ${docs.length} dokumen aktif`);
