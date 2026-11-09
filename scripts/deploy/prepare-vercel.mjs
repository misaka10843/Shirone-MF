import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';

// Package the already-built Astro site using Vercel's Build Output API.
const root = process.cwd();
const source = resolve(root, 'dist');
const output = resolve(root, '.vercel/output');
if (!existsSync(join(source, 'index.html')) || !existsSync(join(source, 'pagefind'))) {
 throw new Error('Run pnpm build first; index.html and the Pagefind index are required.');
}
if (output !== join(root, '.vercel', 'output')) throw new Error('Unexpected output path');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(source, join(output, 'static'), { recursive: true });
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const routes = [];
// Legacy paths become HTTP redirects on Vercel, while their portable HTML
// redirects remain in static output for other hosts.
const contentRoot = resolve(root, process.env.CONTENT_DIR || '../blog-content');
const legacyFile = join(contentRoot, 'legacy-redirects.json');
if (existsSync(legacyFile)) {
 for (const [from, to] of Object.entries(JSON.parse(readFileSync(legacyFile, 'utf8')))) {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//')) throw new Error('Invalid legacy redirect target');
  const encoded = from.split('/').map(encodeURIComponent).join('/');
  routes.push({ src: '^/' + escapeRegex(encoded) + '/?$', status: 301, headers: { Location: to } });
 }
}
for (const name of readdirSync(source, { recursive: true })) {
 const posix = name.split(sep).join('/');
 if (!posix.endsWith('/index.html') && posix !== 'index.html') continue;
 const slug = posix === 'index.html' ? '' : posix.slice(0, -'/index.html'.length);
 const encoded = slug.split('/').map(encodeURIComponent).join('/');
 routes.push({ src: '^/' + escapeRegex(encoded) + (slug ? '/?' : '') + '$', dest: '/' + posix });
}
routes.push({ handle: 'filesystem' });
routes.push({ src: '/.*', dest: '/404.html', status: 404 });
writeFileSync(join(output, 'config.json'), JSON.stringify({ version: 3, routes }, null, 2) + '\n');
console.log(`Prepared Vercel static output with ${routes.length} routing rules.`);
