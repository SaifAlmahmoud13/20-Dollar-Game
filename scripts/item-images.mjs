#!/usr/bin/env node
// Step 3 of item pictures: packs the chosen picture of every theme item (scripts/item-picks.json)
// into one sprite sheet per theme, public/items/<theme>-<hash>.webp, indexed in src/data/item-images.js.
// Items with no pick keep their emoji.
//
//   PIXABAY_API_KEY=... NODE_USE_ENV_PROXY=1 node scripts/item-images.mjs [--only pizza,theme-park]
//
// Originals are kept in .cache/item-src so rebuilding doesn't download them again.

import { mkdir, writeFile, readFile, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ALL_THEMES } from '../src/data/index.js';
import { SKIP_THEMES } from './item-overrides.js';
import CURRENT from '../src/data/item-images.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(ROOT, 'public', 'items');
const SRC_DIR = path.join(ROOT, '.cache', 'item-src');
const MANIFEST = path.join(ROOT, 'src', 'data', 'item-images.js');
const CREDITS = path.join(ROOT, 'scripts', 'item-credits.json');
const PICKS = JSON.parse(await readFile(path.join(ROOT, 'scripts', 'item-picks.json'), 'utf8'));
const CANDIDATES_FILE = path.join(ROOT, '.cache', 'item-candidates.json');
const CANDIDATES = existsSync(CANDIDATES_FILE) ? JSON.parse(await readFile(CANDIDATES_FILE, 'utf8')) : {};
const CELL = 128;
const COLS = 6;
const key = process.env.PIXABAY_API_KEY;

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pixabay's image links expire, so a stale one is looked up again by the picture's id.
async function freshURL(id) {
  if (!key) throw new Error('Set PIXABAY_API_KEY to download pictures');
  await sleep(700);
  const res = await fetch(`https://pixabay.com/api/?${new URLSearchParams({ key, id: String(id) })}`);
  if (!res.ok) throw new Error(`${res.status} looking up picture ${id}`);
  return (await res.json()).hits[0]?.webformatURL;
}

async function original(pick, name) {
  const file = path.join(SRC_DIR, `${pick.id}.png`);
  if (existsSync(file)) return readFile(file);
  const known = CANDIDATES[name]?.find((c) => c.id === pick.id)?.web;
  let res = known ? await fetch(known).catch(() => null) : null;
  if (!res?.ok) res = await fetch(await freshURL(pick.id));
  if (!res.ok) throw new Error(`${res.status} downloading picture ${pick.id}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buffer);
  return buffer;
}

const cells = new Map(); // picture id -> trimmed 128px cell, so shared items are only processed once
async function cell(pick, name) {
  if (!cells.has(pick.id)) {
    const input = await original(pick, name);
    const buffer = await sharp(input)
      .ensureAlpha()
      .trim({ threshold: 1 })
      .resize(CELL, CELL, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    cells.set(pick.id, buffer);
  }
  return cells.get(pick.id);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(SRC_DIR, { recursive: true });
  const manifest = only ? { ...CURRENT } : {};
  const credits = {};
  const themes = ALL_THEMES.filter((t) => !SKIP_THEMES.has(t.id) && (!only || only.has(t.id)));
  console.log(`Building item pictures for ${themes.length} themes…`);

  for (const theme of themes) {
    const found = [];
    for (const item of theme.items) {
      const pick = PICKS[item.name];
      if (!pick) continue;
      try {
        found.push({ name: item.name, pick, buffer: await cell(pick, item.name) });
      } catch (err) {
        console.log(`    ! ${item.name}: ${err.message}`);
      }
    }
    delete manifest[theme.id];
    if (!found.length) {
      console.log(`  - ${theme.id}: no pictures`);
      continue;
    }
    const rows = Math.ceil(found.length / COLS);
    const cols = Math.min(COLS, found.length);
    const webp = await sharp({ create: { width: cols * CELL, height: rows * CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(found.map((f, i) => ({ input: f.buffer, left: (i % cols) * CELL, top: Math.floor(i / cols) * CELL })))
      .webp({ quality: 72, alphaQuality: 80 })
      .toBuffer();
    // The file name changes with the content, so phones never mix an old sheet with a new layout.
    const file = `${theme.id}-${createHash('sha256').update(webp).digest('hex').slice(0, 8)}.webp`;
    await writeFile(path.join(OUT_DIR, file), webp);
    manifest[theme.id] = { file, cols, rows, items: Object.fromEntries(found.map((f, i) => [f.name, i])) };
    console.log(`  ✓ ${theme.id}: ${found.length}/${theme.items.length}`);
  }

  for (const [name, pick] of Object.entries(PICKS)) if (pick) credits[name] = { author: pick.user, page: pick.page, license: 'Pixabay Content License' };
  const used = new Set(Object.values(manifest).map((m) => m.file));
  for (const f of await readdir(OUT_DIR)) if (!used.has(f)) await unlink(path.join(OUT_DIR, f));
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, `// Generated by scripts/item-images.mjs: sprite sheet layout for public/items/<theme>-<hash>.webp.\nexport default ${JSON.stringify(sorted)};\n`);
  await writeFile(CREDITS, JSON.stringify(credits, null, 1));
  console.log('Done.');
}

main();
