import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const archive = path.join(root, '_arsip/nextjs-2026-11-02');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const expected = Array.from({ length: 17 }, (_, index) => `L${String(index + 1).padStart(2, '0')}`);
const plan = read('docs/rencana-agen.md');
const sections = [...plan.matchAll(/^## (L\d{2}):[^\n]*\n([\s\S]*?)(?=^## L\d{2}:|$(?![\s\S]))/gm)];
assert.deepEqual(sections.map((match) => match[1]), expected, 'Spesifikasi harus memuat L01–L17 tepat sekali');
const dependencies = new Map();
for (const [, id, body] of sections) {
  for (const field of ['depends', 'input', 'paths', 'accept', 'verify', 'evidence']) {
    assert.ok(body.includes(`**${field}:**`), `${id}: field ${field} hilang`);
  }
  const declared = body.match(/\*\*depends:\*\*\s*`\[([^\]]*)\]`/);
  assert.ok(declared, `${id}: depends harus berupa daftar eksplisit`);
  const deps = [...declared[1].matchAll(/L\d{2}/g)].map((match) => match[0]);
  for (const dep of deps) assert.ok(expected.includes(dep) && dep !== id, `${id}: dependensi tidak sah ${dep}`);
  dependencies.set(id, deps);
  assert.ok(body.includes(`docs/bukti/${id}.md`), `${id}: evidence tidak sesuai ID`);
  const filters = [...body.matchAll(/--filter=([A-Za-z]+Test)/g)].map((match) => match[1]);
  assert.ok(filters.length > 0, `${id}: tidak ada verifikasi PHPUnit spesifik`);
  for (const filter of filters) assert.ok(body.includes(`${filter}.php`) || id === 'L01', `${id}: test ${filter} di luar paths`);
}
const visiting = new Set();
const visited = new Set();
function visit(id) {
  assert.ok(!visiting.has(id), `Siklus dependensi pada ${id}`);
  if (visited.has(id)) return;
  visiting.add(id);
  dependencies.get(id).forEach(visit);
  visiting.delete(id);
  visited.add(id);
}
expected.forEach(visit);
assert.ok(dependencies.get('L03').includes('L02'), 'L02 wajib sebelum migrasi');
assert.ok(dependencies.get('L11').includes('L10'), 'Generator kontrol wajib sebelum antrean');
assert.ok(!dependencies.get('L16').includes('L17'), 'Opsional tidak boleh memblokir rilis inti');
console.log('PASS: 17 spesifikasi lengkap, referensi uji dan dependensi tanpa siklus');

const status = [...read('docs/status-tugas.md').matchAll(/^\| (L\d{2}) \|[^\n]*?\| (todo|doing|blocked|done) \|/gm)];
assert.deepEqual(status.map((match) => match[1]), expected, 'Ledger status tidak sesuai rencana');
const frRows = [...read('docs/peta-bagian.md').matchAll(/^\| FR-(\d{2}) \|/gm)];
assert.equal(new Set(frRows.map((match) => match[1])).size, 14, 'Peta harus mencakup FR-01–14');
const routes = read('docs/api-contract.md').split(/\r?\n/).filter((line) => /^\| (GET|POST|PATCH|PUT|DELETE) `/.test(line));
const names = routes.map((line) => line.split('|')[2].trim());
assert.equal(new Set(names).size, names.length, 'Nama route rencana ganda');
for (const route of routes) assert.ok(expected.some((id) => route.endsWith(` ${id} |`)), `Pemilik route tidak sah: ${route}`);
console.log(`PASS: ledger 17 tugas, 14 FR, ${routes.length} route rencana unik dengan pemilik`);

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
const docs = filesIn(path.join(root, 'docs')).filter((file) => file.endsWith('.md') && !file.startsWith(path.join(root, 'docs/rancangan') + path.sep));
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
    if (fragment && target.endsWith('.md')) assert.ok(anchors(readFileSync(target, 'utf8')).has(decodeURIComponent(fragment)), `Anchor tidak ditemukan: ${href}`);
    linkCount++;
  }
}
console.log(`PASS: ${linkCount} tautan lokal pada ${docs.length} dokumen aktif`);

const manifest = JSON.parse(readFileSync(path.join(archive, 'inventaris-kode.json'), 'utf8'));
for (const file of manifest.files) {
  const target = path.join(archive, file.path);
  assert.ok(existsSync(target), `Berkas arsip hilang: ${file.path}`);
  assert.equal(statSync(target).size, file.bytes, `Ukuran arsip berubah: ${file.path}`);
  assert.equal(createHash('sha256').update(readFileSync(target)).digest('hex'), file.sha256, `Isi arsip berubah: ${file.path}`);
}
const protectedRoot = path.join(root, 'docs/rancangan');
const protectedFiles = filesIn(protectedRoot);
const archivedProtected = filesIn(path.join(archive, 'docs/rancangan'));
assert.equal(protectedFiles.length, archivedProtected.length, 'Inventaris salinan read-only berubah');
for (const file of protectedFiles) {
  assert.deepEqual(readFileSync(file), readFileSync(path.join(archive, 'docs/rancangan', path.relative(protectedRoot, file))), `Salinan read-only berubah: ${file}`);
}
const duplicateProofs = path.join(archive, 'bukti-lama');
if (existsSync(duplicateProofs)) {
  for (const file of filesIn(duplicateProofs)) {
    assert.deepEqual(readFileSync(file), readFileSync(path.join(archive, 'docs', path.relative(duplicateProofs, file))), 'Bukti lama tidak sama dengan snapshot');
  }
}
console.log(`PASS: ${manifest.files.length} checksum arsip; ${protectedFiles.length} dokumen read-only tetap identik`);
console.log('Tidak menjalankan aplikasi, mengakses env, atau menghubungi database.');
