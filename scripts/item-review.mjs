#!/usr/bin/env node
// Step 2 helper: review sheets for choosing item pictures by eye.
//   node scripts/item-review.mjs <outDir> [rowsPerSheet] [startSheet]
// Writes sheet-NNN.png (each row: item name + its candidates numbered 0-5) and
// sheet-NNN.json (the item names in row order).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ALL_THEMES } from '../src/data/index.js';
import { SKIP_THEMES } from './item-overrides.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [outDir, perSheetArg, startArg] = process.argv.slice(2);
const PER = Number(perSheetArg) || 20;
const START = Number(startArg) || 0;
const picks = existsSync(path.join(ROOT, 'scripts', 'item-picks.json')) ? JSON.parse(await readFile(path.join(ROOT, 'scripts', 'item-picks.json'), 'utf8')) : {};
const T = 78, LW = 170;
const cands = JSON.parse(await readFile(path.join(ROOT, '.cache', 'item-candidates.json'), 'utf8'));
await mkdir(outDir, { recursive: true });

// Each item once, in theme order so neighbours give context.
const seen = new Set();
const rows = [];
for (const t of ALL_THEMES) {
  if (SKIP_THEMES.has(t.id)) continue;
  for (const it of t.items) if (!seen.has(it.name) && cands[it.name]?.length && !(it.name in picks)) seen.add(it.name) && rows.push({ theme: t.name, name: it.name, c: cands[it.name] });
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
async function thumb(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await sharp(Buffer.from(await res.arrayBuffer())).resize(T - 4, T - 4, { fit: 'contain', background: '#3a5a3a' }).flatten({ background: '#3a5a3a' }).png().toBuffer();
    } catch {}
  }
  return null;
}

for (let s = START; (s - START) * PER < rows.length; s++) {
  const chunk = rows.slice((s - START) * PER, (s - START + 1) * PER);
  const comps = [];
  await Promise.all(
    chunk.map(async (r, k) => {
      const y = k * T;
      comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${LW}" height="${T}"><rect width="100%" height="100%" fill="${k % 2 ? '#111' : '#1c1c1c'}"/><text x="6" y="30" font-size="15" font-weight="bold" font-family="sans-serif" fill="white">${esc(r.name.slice(0, 20))}</text><text x="6" y="50" font-size="11" font-family="sans-serif" fill="#aaa">${esc(r.theme.slice(0, 26))}</text><text x="6" y="68" font-size="11" font-family="sans-serif" fill="#f39200">row ${k}</text></svg>`), left: 0, top: y });
      const imgs = await Promise.all(r.c.map((c) => thumb(c.preview)));
      imgs.forEach((img, i) => {
        if (!img) return;
        comps.push({ input: img, left: LW + i * T + 2, top: y + 2 });
        comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="100%" height="100%" fill="#f39200"/><text x="4" y="13" font-size="12" font-family="sans-serif" fill="black">${i}</text></svg>`), left: LW + i * T + 2, top: y + 2 });
      });
    }),
  );
  const n = String(s).padStart(3, '0');
  await sharp({ create: { width: LW + 6 * T, height: chunk.length * T, channels: 3, background: '#222' } }).composite(comps).png().toFile(path.join(outDir, `sheet-${n}.png`));
  await writeFile(path.join(outDir, `sheet-${n}.json`), JSON.stringify(chunk.map((r) => r.name)));
  console.log(`sheet-${n}: ${chunk.length} items`);
}
