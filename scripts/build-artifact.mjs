#!/usr/bin/env node
// Builds the game as a claude.ai Artifact: one HTML page with the app's JS and CSS
// inlined (the viewer adds its own <html>/<head>/<body>), plus the theme photos
// published next to it.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'dist-artifact');

// The page can't reach the Anthropic API from the viewer, so AI goes through the
// viewer's own `sample` capability instead (publish with capabilities: {sample: {}}).
execSync('npx vite build --base ./ --outDir dist-artifact --emptyOutDir', {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, VITE_AI: 'viewer' },
});

const html = readFileSync(path.join(OUT, 'index.html'), 'utf8');
const scriptSrc = html.match(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/)[1];
const cssHref = html.match(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/)[1];
const js = readFileSync(path.join(OUT, scriptSrc), 'utf8').replaceAll('</script', '<\\/script');
const css = readFileSync(path.join(OUT, cssHref), 'utf8').replaceAll('</style', '<\\/style');

const page = `<title>$20 Challenge</title>
<meta name="theme-color" content="#000000">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync(path.join(OUT, 'artifact.html'), page);
console.log(`dist-artifact/artifact.html: ${(page.length / 1024).toFixed(0)} KB`);
