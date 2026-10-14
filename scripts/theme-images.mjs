#!/usr/bin/env node
// Downloads one photo per theme into public/themes/<id>.webp and records credits
// in src/data/theme-images.js.
//
//   node scripts/theme-images.mjs                 # fetch themes that have no photo yet
//   node scripts/theme-images.mjs --only pizza,castle --force
//
// Node's fetch only uses HTTPS_PROXY with NODE_USE_ENV_PROXY=1 (set by the npm script).
// Source: Pixabay when PIXABAY_API_KEY is set (free key at pixabay.com/api/docs),
// Pexels when PEXELS_API_KEY is set, otherwise Wikimedia Commons (no key, but slow).

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { ALL_THEMES } from '../src/data/index.js';
import QUERIES from './image-queries.js';
import CURRENT from '../src/data/theme-images.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(ROOT, 'public', 'themes');
const MANIFEST = path.join(ROOT, 'src', 'data', 'theme-images.js');
const SIZE = 480;
const USER_AGENT = '20-Dollar-Game/0.1 (https://github.com/SaifAlmahmoud13/20-Dollar-Game; theme image fetcher)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Stay under API rate limits (Wikimedia is strict with shared addresses) and honour Retry-After.
async function politeFetch(url, headers = {}) {
  for (let attempt = 0; ; attempt++) {
    await sleep(SOURCE === 'Wikimedia Commons' ? 1200 : 400);
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers } });
    } catch (err) {
      if (attempt >= 3) throw err;
      continue; // dropped connection: try again
    }
    if (res.status !== 429 || attempt >= 12) return res;
    const wait = Number(res.headers.get('retry-after')) || 30;
    console.log(`    rate limited, waiting ${wait}s…`);
    await sleep(wait * 1000);
  }
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyArg = args[args.indexOf('--only') + 1];
const only = args.includes('--only') && onlyArg ? new Set(onlyArg.split(',')) : null;
const pixabayKey = process.env.PIXABAY_API_KEY;
const pexelsKey = process.env.PEXELS_API_KEY;
const SOURCE = pixabayKey ? 'Pixabay' : pexelsKey ? 'Pexels' : 'Wikimedia Commons';

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function getJSON(url, headers = {}) {
  const res = await politeFetch(url, headers);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function searchPixabay(q) {
  const params = new URLSearchParams({
    key: pixabayKey,
    q: q.slice(0, 100),
    image_type: 'photo',
    safesearch: 'true',
    per_page: '10',
  });
  const data = await getJSON(`https://pixabay.com/api/?${params}`);
  return data.hits.map((h) => ({
    url: h.largeImageURL,
    credit: { source: 'Pixabay', author: h.user, license: 'Pixabay Content License', page: h.pageURL },
  }));
}

async function searchPexels(q) {
  const url = `https://api.pexels.com/v1/search?${new URLSearchParams({ query: q, per_page: '10', orientation: 'square' })}`;
  const data = await getJSON(url, { Authorization: pexelsKey });
  return data.photos.map((p) => ({
    url: p.src.large,
    credit: { source: 'Pexels', author: p.photographer, license: 'Pexels License', page: p.url },
  }));
}

async function searchWikimedia(q) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '15',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
  });
  const data = await getJSON(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  return pages
    .map((p) => p.imageinfo?.[0])
    // Originals come from upload.wikimedia.org; skip huge files to keep downloads quick.
    .filter((info) => info && info.width >= 480 && info.height >= 360 && info.size < 12_000_000)
    .filter((info) => {
      const license = info.extmetadata?.LicenseShortName?.value ?? '';
      return license && !/fair use|non-free/i.test(license);
    })
    .map((info) => ({
      url: info.url,
      credit: {
        source: 'Wikimedia Commons',
        author: stripHtml(info.extmetadata?.Artist?.value) || 'Unknown',
        license: info.extmetadata.LicenseShortName.value,
        page: info.descriptionurl,
      },
    }));
}

async function fetchTheme(theme) {
  const entry = QUERIES[theme.id] ?? theme.name;
  const { q, pick = 0 } = typeof entry === 'string' ? { q: entry } : entry;
  const search = { Pixabay: searchPixabay, Pexels: searchPexels, 'Wikimedia Commons': searchWikimedia }[SOURCE];
  const results = await search(q);
  const chosen = results[pick] ?? results[0];
  if (!chosen) throw new Error(`no results for "${q}"`);
  const res = await politeFetch(chosen.url);
  if (!res.ok) throw new Error(`${res.status} downloading ${chosen.url}`);
  const input = Buffer.from(await res.arrayBuffer());
  await sharp(input)
    .resize(SIZE, SIZE, { fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: 72 })
    .toFile(path.join(OUT_DIR, `${theme.id}.webp`));
  return { query: q, ...chosen.credit };
}

async function saveManifest(manifest) {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(
    MANIFEST,
    `// Generated by scripts/theme-images.mjs. Photo credits for public/themes/<id>.webp.\nexport default ${JSON.stringify(sorted, null, 2)};\n`,
  );
  return sorted;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = { ...CURRENT };
  const todo = ALL_THEMES.filter((t) => (only ? only.has(t.id) : true) && (force || !manifest[t.id]));
  console.log(`Fetching ${todo.length} theme photos from ${SOURCE}…`);

  const failures = [];
  const queue = [...todo];
  const worker = async () => {
    for (let theme = queue.shift(); theme; theme = queue.shift()) {
      try {
        manifest[theme.id] = await fetchTheme(theme);
        await saveManifest(manifest); // keep progress if the run is interrupted
        console.log(`  ✓ ${theme.id}`);
      } catch (err) {
        failures.push(theme.id);
        console.log(`  ✗ ${theme.id}: ${err.message}${err.cause ? ` (${err.cause.code ?? err.cause.message})` : ''}`);
      }
    }
  };
  await worker();

  const sorted = await saveManifest(manifest);
  console.log(`Done. ${Object.keys(sorted).length} themes have photos.`);
  if (failures.length) {
    console.log(`Failed: ${failures.join(', ')}`);
    process.exitCode = 1;
  }
}

main();
