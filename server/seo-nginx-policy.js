import {
  NOINDEX_EXACT_PATHS,
  NOINDEX_PATH_PREFIXES,
  PRODUCTION_DOMAIN,
  TRACKING_QUERY_KEYS,
} from '../src/lib/seoConfig.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizedPathPattern(path) {
  return [...String(path)].map(character => {
    if (character === '/') return '(?:/|%2f)+';
    const literal = escapeRegex(character);
    const encoded = Buffer.from(character).toString('hex').match(/.{2}/g)?.map(byte => `%${byte}`).join('');
    return encoded ? `(?:${literal}|${encoded})` : literal;
  }).join('');
}

function exactPathPattern(path) {
  return `~*^${normalizedPathPattern(path)}(?:/|%2f)*$ 1;`;
}

function prefixPathPattern(path) {
  return `~*^${normalizedPathPattern(path)} 1;`;
}

function quoteNginxString(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

export function parseCanonicalAliasesFromHtml(html) {
  const match = String(html).match(/var\s+canonicalMap\s*=\s*\{([\s\S]*?)\n\s*\};/);
  if (!match) throw new Error('Could not find the existing canonicalMap in index.html');

  const aliases = {};
  for (const [index, line] of match[1].split('\n').entries()) {
    const entry = line.trim();
    if (!entry) continue;
    const pair = entry.match(/^(['"])([^'"]+)\1\s*:\s*(['"])([^'"]*)\3,?$/);
    if (!pair || !pair[2].startsWith('/') || !pair[4].startsWith('/')) {
      throw new Error(`Invalid canonicalMap entry at line ${index + 1}`);
    }
    aliases[pair[2]] = pair[4];
  }
  return aliases;
}

export function renderSeoNginxPolicy({ canonicalAliases = {} } = {}) {
  const productionHost = new URL(PRODUCTION_DOMAIN).hostname;
  const productionHostPattern = `~*^(?:www\\.)?${escapeRegex(productionHost)}(?::443)?$ 1;`;
  const trackingKeyPattern = TRACKING_QUERY_KEYS.map(normalizedPathPattern).join('|');
  const canonicalOrigin = PRODUCTION_DOMAIN.replace(/\/$/, '');
  const exactPaths = NOINDEX_EXACT_PATHS.map(exactPathPattern).join('\n  ');
  const prefixPaths = NOINDEX_PATH_PREFIXES.map(prefixPathPattern).join('\n  ');
  const canonicalAliasRows = Object.entries(canonicalAliases)
    .map(([source, target]) => `  ${quoteNginxString(source)} ${quoteNginxString(target)};`)
    .join('\n');

  return `# Generated from src/lib/seoConfig.js. Do not edit by hand.
map $http_x_forwarded_host $fleshlab_seo_request_host {
  default $http_x_forwarded_host;
  "" $host;
}

map $fleshlab_seo_request_host $fleshlab_seo_is_production {
  default 0;
  ${productionHostPattern}
}

map $http_x_fleshlab_original_uri $fleshlab_seo_request_uri {
  default $http_x_fleshlab_original_uri;
  "" $request_uri;
}

map $fleshlab_seo_request_uri $fleshlab_seo_request_path {
  ~^([^?]*) $1;
}

map $fleshlab_seo_request_path $fleshlab_seo_path_noindex {
  default 0;
  ${exactPaths}
  ${prefixPaths}
}

map $fleshlab_seo_request_uri $fleshlab_seo_query_noindex {
  default 1;
  ~*^[^?]*(?:\\?(?:(?:${trackingKeyPattern})=[^&]*(?:&(?:${trackingKeyPattern})=[^&]*)*)?)?$ 0;
}

map "$fleshlab_seo_is_production:$fleshlab_seo_path_noindex:$fleshlab_seo_query_noindex" $fleshlab_seo_robots {
  default "noindex,nofollow";
  "1:0:0" "index,follow";
  "1:1:0" "noindex,follow";
  "1:0:1" "noindex,follow";
  "1:1:1" "noindex,follow";
}

map $fleshlab_seo_request_path $fleshlab_seo_canonical_alias_path {
  default $fleshlab_seo_request_path;
${canonicalAliasRows}
}

map $fleshlab_seo_canonical_alias_path $fleshlab_seo_canonical_path {
  default $fleshlab_seo_canonical_alias_path;
  ~^(.+?)/+$ $1;
}

map $fleshlab_seo_canonical_path $fleshlab_seo_canonical {
  default "${canonicalOrigin}$fleshlab_seo_canonical_path";
}
`;
}
