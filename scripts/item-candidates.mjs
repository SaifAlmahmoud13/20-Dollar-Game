#!/usr/bin/env node
// Step 1 of item pictures: collect up to 6 cut-out candidates (transparent background,
// real photos first) for every theme item into .cache/item-candidates.json.
// Step 2 is choosing one per item by eye (scripts/item-picks.json), step 3 building
// the sprite sheets (scripts/item-images.mjs).
//
//   PIXABAY_API_KEY=... NODE_USE_ENV_PROXY=1 node scripts/item-candidates.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_THEMES } from '../src/data/index.js';
import { SKIP_THEMES } from './item-overrides.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, '.cache', 'item-candidates.json');
const key = process.env.PIXABAY_API_KEY;
if (!key) throw new Error('Set PIXABAY_API_KEY');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastCall = 0;
async function search(q, imageType) {
  const wait = lastCall + 700 - Date.now(); // Pixabay allows 100 requests a minute
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const params = new URLSearchParams({ key, q: q.slice(0, 100), image_type: imageType, colors: 'transparent', safesearch: 'true', per_page: '20' });
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://pixabay.com/api/?${params}`);
    if (res.status === 429 && attempt < 5) {
      await sleep(20000);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} searching "${q}"`);
    return (await res.json()).hits;
  }
}

const slim = (h) => ({ id: h.id, preview: h.previewURL, web: h.webformatURL, user: h.user, page: h.pageURL });

const out = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : {};
const themes = ALL_THEMES.filter((t) => !SKIP_THEMES.has(t.id));
const names = [...new Set(themes.flatMap((t) => t.items.map((i) => i.name)))].filter((n) => !out[n]);
console.log(`Collecting candidates for ${names.length} items…`);
let done = 0;
for (const name of names) {
  const q = name.replace(/[&"']/g, ' ');
  try {
    let hits = (await search(q, 'photo')).slice(0, 6);
    if (hits.length < 6) {
      const seen = new Set(hits.map((h) => h.id));
      hits = hits.concat((await search(q, 'all')).filter((h) => !seen.has(h.id))).slice(0, 6);
    }
    out[name] = hits.map(slim);
  } catch (err) {
    console.log(`  ! ${name}: ${err.message}`);
  }
  if (++done % 50 === 0) {
    await writeFile(OUT, JSON.stringify(out));
    console.log(`  ${done}/${names.length}`);
  }
}
await writeFile(OUT, JSON.stringify(out));
console.log('Done.');
