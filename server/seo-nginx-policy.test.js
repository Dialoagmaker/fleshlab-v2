import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NOINDEX_EXACT_PATHS, NOINDEX_PATH_PREFIXES, TRACKING_QUERY_KEYS } from '../src/lib/seoConfig.js';
import { parseCanonicalAliasesFromHtml, renderSeoNginxPolicy } from './seo-nginx-policy.js';
import { STATIC_PUBLIC_PATHS, renderSitemapXml } from './sitemap.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nginxAvailable = spawnSync('nginx', ['-v'], { stdio: 'ignore' }).status === 0;

test('generated Nginx policy derives from the existing application classifier', () => {
  const policy = renderSeoNginxPolicy();
  assert.equal((policy.match(/~\*\^/g) || []).length, NOINDEX_EXACT_PATHS.length + NOINDEX_PATH_PREFIXES.length + 2);
  assert.match(policy, /map \$fleshlab_seo_request_uri \$fleshlab_seo_query_noindex/);
  assert.match(policy, /map \$fleshlab_seo_canonical_path \$fleshlab_seo_canonical/);
  assert.doesNotMatch(policy, /PUBLIC_INDEXABLE/);
});

test('canonical aliases are generated from the existing HTML normalization map', () => {
  assert.deepEqual(parseCanonicalAliasesFromHtml(`
    <script>
      var canonicalMap = {
        '/sample-alias': '/sample-target',
      };
    </script>
  `), { '/sample-alias': '/sample-target' });
  assert.throws(() => parseCanonicalAliasesFromHtml('<html></html>'), /canonicalMap/);
});

test('Nginx initial HTML and response headers follow the existing SEO policy', { skip: !nginxAvailable }, async t => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'fleshlab-seo-nginx-'));
  let server;
  t.after(async () => {
    if (server && server.exitCode == null) server.kill('SIGTERM');
    if (server && server.exitCode == null) await new Promise(resolve => server.once('close', resolve));
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });
  const configPath = path.join(temporaryDirectory, 'nginx.conf');
  const policyPath = path.join(temporaryDirectory, 'seo-policy.conf');
  const applicationNginxPath = path.join(temporaryDirectory, 'application-nginx.conf');
  const portServer = net.createServer();
  await new Promise((resolve, reject) => portServer.listen(0, '127.0.0.1', error => error ? reject(error) : resolve()));
  const port = portServer.address().port;
  await new Promise((resolve, reject) => portServer.close(error => error ? reject(error) : resolve()));
  const indexHtml = await fs.readFile(path.join(repositoryRoot, 'index.html'), 'utf8');
  const canonicalAliases = parseCanonicalAliasesFromHtml(indexHtml);
  await fs.writeFile(policyPath, renderSeoNginxPolicy({ canonicalAliases }));
  const applicationNginx = (await fs.readFile(path.join(repositoryRoot, 'infra/nginx.conf'), 'utf8'))
    .replaceAll('http://api:8787', 'http://127.0.0.1:8787');
  await fs.writeFile(applicationNginxPath, applicationNginx);
  const productionConfigPath = path.join(temporaryDirectory, 'production-nginx.conf');
  await fs.writeFile(productionConfigPath, `
worker_processes 1;
pid ${path.join(temporaryDirectory, 'production.pid')};
error_log ${path.join(temporaryDirectory, 'production-error.log')} notice;
events { worker_connections 128; }
http {
  access_log off;
  include /etc/nginx/mime.types;
  include ${policyPath};
  include ${applicationNginxPath};
}
`);
  const productionSyntax = spawnSync('nginx', ['-t', '-p', `${temporaryDirectory}/`, '-c', productionConfigPath], { encoding: 'utf8' });
  assert.equal(productionSyntax.status, 0, productionSyntax.stderr || productionSyntax.stdout);
  await fs.writeFile(configPath, `
worker_processes 1;
daemon off;
pid ${path.join(temporaryDirectory, 'nginx.pid')};
error_log ${path.join(temporaryDirectory, 'error.log')} notice;
events { worker_connections 128; }
http {
  include /etc/nginx/mime.types;
  include ${policyPath};
  server {
    listen 127.0.0.1:${port};
    root ${repositoryRoot};
    access_log off;
    add_header X-Robots-Tag $fleshlab_seo_robots always;
    sub_filter_once off;
    sub_filter '__FLESHLAB_ROBOTS__' $fleshlab_seo_robots;
    sub_filter '__FLESHLAB_CANONICAL__' $fleshlab_seo_canonical;
    location /v3/ { try_files $uri $uri/ /v3/index.html; }
    location / { try_files $uri $uri/ /index.html; }
  }
}
`);

  const syntax = spawnSync('nginx', ['-t', '-p', `${temporaryDirectory}/`, '-c', configPath], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);
  server = spawn('nginx', ['-p', `${temporaryDirectory}/`, '-c', configPath], { stdio: ['ignore', 'ignore', 'pipe'] });
  let serverError = '';
  server.stderr.setEncoding('utf8');
  server.stderr.on('data', chunk => { serverError += chunk; });
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode != null) break;
    try {
      await fetch(origin, { headers: { 'x-forwarded-host': 'fleshlab.online' } });
      ready = true;
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  assert.equal(ready, true, serverError || 'temporary Nginx did not start');

  const request = async (route, headers = {}) => {
    const response = await fetch(`${origin}${route}`, { headers: { 'x-forwarded-host': 'fleshlab.online', ...headers } });
    return { response, html: await response.text() };
  };
  const publicPage = await request('/v3/videos/sample/?utm_source=fixture');
  assert.equal(publicPage.response.headers.get('x-robots-tag'), 'index,follow');
  assert.match(publicPage.html, /name="robots" content="index,follow"/);
  assert.match(publicPage.html, /rel="canonical" href="https:\/\/fleshlab\.online\/v3\/videos\/sample"/);
  assert.match(publicPage.html, /property="og:url" content="https:\/\/fleshlab\.online\/v3\/videos\/sample"/);

  const rewrittenHome = await request('/v3/', { 'x-fleshlab-original-uri': '/?utm_source=fixture' });
  assert.equal(rewrittenHome.response.headers.get('x-robots-tag'), 'index,follow');
  assert.match(rewrittenHome.html, /rel="canonical" href="https:\/\/fleshlab\.online\/"/);

  for (const [alias, target] of Object.entries(canonicalAliases)) {
    const page = await request(alias);
    const canonical = page.html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, `https://fleshlab.online${target}`);
  }

  const privatePage = await request('/v3/library');
  assert.equal(privatePage.response.headers.get('x-robots-tag'), 'noindex,follow');
  assert.match(privatePage.html, /name="robots" content="noindex,follow"/);

  for (const route of NOINDEX_EXACT_PATHS) {
    const page = await request(route);
    assert.equal(page.response.headers.get('x-robots-tag'), 'noindex,follow', `unexpected robots state for private route`);
  }
  for (const prefix of NOINDEX_PATH_PREFIXES) {
    const page = await request(`${prefix}seo-policy-fixture`);
    assert.equal(page.response.headers.get('x-robots-tag'), 'noindex,follow', `unexpected robots state for private route prefix`);
  }

  const encodedPrivatePage = await request('/v3/%6cibrary');
  assert.equal(encodedPrivatePage.response.headers.get('x-robots-tag'), 'noindex,follow');
  const collapsedPrivatePage = await request('/v3//library');
  assert.equal(collapsedPrivatePage.response.headers.get('x-robots-tag'), 'noindex,follow');

  const unapprovedQuery = await request('/v3/videos/sample?q=fixture');
  assert.equal(unapprovedQuery.response.headers.get('x-robots-tag'), 'noindex,follow');
  const normalizedTrackingQuery = await request('/v3/videos/sample?UTM_SOURCE=fixture');
  assert.equal(normalizedTrackingQuery.response.headers.get('x-robots-tag'), 'index,follow');
  const encodedTrackingQuery = await request('/v3/videos/sample?%75tm_source=fixture');
  assert.equal(encodedTrackingQuery.response.headers.get('x-robots-tag'), 'index,follow');
  const emptyQuery = await request('/v3/videos/sample?');
  assert.equal(emptyQuery.response.headers.get('x-robots-tag'), 'index,follow');
  for (const key of TRACKING_QUERY_KEYS) {
    const page = await request(`/v3/videos/sample?${key.toUpperCase()}=fixture`);
    assert.equal(page.response.headers.get('x-robots-tag'), 'index,follow', `tracking key policy mismatch`);
  }

  const previewHost = await fetch(`${origin}/v3/videos/sample`, { headers: { 'x-forwarded-host': 'preview.invalid' } });
  assert.equal(previewHost.headers.get('x-robots-tag'), 'noindex,nofollow');

  const sitemap = renderSitemapXml(STATIC_PUBLIC_PATHS);
  const sitemapRoutes = [...sitemap.matchAll(/<loc>https:\/\/fleshlab\.online([^<]*)<\/loc>/g)].map(match => match[1]);
  assert.ok(sitemapRoutes.length > 0);
  for (const route of sitemapRoutes) {
    const page = await request(route);
    assert.equal(page.response.headers.get('x-robots-tag'), 'index,follow', `unexpected robots state for sitemap entry`);
    assert.match(page.html, /name="robots" content="index,follow"/);
  }
});
