// Prints the CHANGELOG.md section for a version, for use as GitHub release notes.
//   node .github/scripts/release-notes.mjs 2.0.0
import { readFileSync } from 'node:fs';

const version = process.argv[2];
if (!version) {
  console.error('usage: release-notes.mjs <version>');
  process.exit(2);
}

const lines = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8').split('\n');
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
if (start === -1) {
  console.error(`CHANGELOG.md has no "## [${version}]" section`);
  process.exit(1);
}
const end = lines.findIndex((l, i) => i > start && l.startsWith('## ['));
const body = lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
// Relative links in the changelog would break on the release page.
const repo = 'https://github.com/iamanvesh/mapbox-gl-draw-circle/blob/master/';
console.log(body.replace(/\]\((?!https?:|#)([^)]+)\)/g, `](${repo}$1)`));
