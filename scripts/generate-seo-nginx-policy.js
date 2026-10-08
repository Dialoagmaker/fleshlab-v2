import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCanonicalAliasesFromHtml, renderSeoNginxPolicy } from '../server/seo-nginx-policy.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.resolve(process.argv[2] || path.join(repositoryRoot, 'seo-policy.generated.conf'));
const indexHtml = await fs.readFile(path.join(repositoryRoot, 'index.html'), 'utf8');
const canonicalAliases = parseCanonicalAliasesFromHtml(indexHtml);
await fs.writeFile(destination, renderSeoNginxPolicy({ canonicalAliases }), { mode: 0o644 });
