// Builds the self-hosted site: wraps index.html (the page as published to claude.ai)
// in a full HTML document and writes it, plus static files, to public/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'index.html'), 'utf8');
const split = src.indexOf('<div class="app">');
if (split < 0) throw new Error('index.html: could not find <div class="app">');
const head = src.slice(0, split).replace(/<meta name="claude:[^>]*>\s*/g, '');
const body = src.slice(split);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Switchyard: build flowcharts, nested process phases, circuit schematics and chemical structures in your browser.">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]{display:none!important}</style>
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;

const out = join(root, 'public');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
for (const f of readdirSync(join(root, 'static'))) copyFileSync(join(root, 'static', f), join(out, f));
console.log(`Built public/index.html (${(html.length / 1024).toFixed(1)} KB)`);
