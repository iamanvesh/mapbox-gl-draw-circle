#!/usr/bin/env node
// Consumer fixtures: pack the library, install the tarball into each app under apps/ the way a
// user would (fresh `npm install`, no workspace links), build it with that app's own toolchain,
// and for browser apps run smoke.spec.js against the built output.
//
//   node fixtures/run.mjs                 # all fixtures
//   node fixtures/run.mjs react-vite next # some fixtures
//
// Each app's package.json may declare `"fixture": { "serve": "<built dir>" }` to get a browser
// smoke test; apps without it only need `npm run build` to succeed.

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const appsDir = join(here, 'apps');

const selected = process.argv.slice(2);
const apps = readdirSync(appsDir).filter((name) => !selected.length || selected.includes(name));
const unknown = selected.filter((name) => !existsSync(join(appsDir, name)));
if (unknown.length) {
  console.error(`Unknown fixture(s): ${unknown.join(', ')}`);
  process.exit(2);
}

const work = mkdtempSync(join(process.env.RUNNER_TEMP || tmpdir(), 'mgdc-fixtures-'));
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NG_CLI_ANALYTICS: 'false', CI: process.env.CI || '1' };

const run = (cmd, args, cwd, extraEnv = {}) => {
  console.log(`\n$ (${cwd.replace(work, '<work>')}) ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: { ...env, ...extraEnv } });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} exited with ${r.status}`);
};

console.log(`Packing ${repo} into ${work}`);
const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', work], { cwd: repo, env }));
const tarball = join(work, packed[0].filename);

const results = [];
for (const name of apps) {
  const started = Date.now();
  const dir = join(work, name);
  try {
    cpSync(join(appsDir, name), dir, {
      recursive: true,
      filter: (src) => !/node_modules|[\\/]dist$|[\\/]\.next$|[\\/]out$|[\\/]\.angular$/.test(src),
    });
    run('npm', ['install', '--no-audit', '--no-fund', tarball], dir);
    const drawOverride = process.env.FIXTURE_DRAW_VERSION;
    if (drawOverride) run('npm', ['install', '--no-audit', '--no-fund', `@mapbox/mapbox-gl-draw@${drawOverride}`], dir);
    run('npm', ['run', 'build'], dir);

    const { fixture } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    if (fixture?.serve) {
      run('npx', ['playwright', 'test', '--config', join(here, 'playwright.config.js')], here, {
        SMOKE_DIR: join(dir, fixture.serve),
        SMOKE_NAME: name,
      });
    }
    results.push({ name, ok: true, seconds: (Date.now() - started) / 1000 });
  } catch (err) {
    console.error(`\n✘ ${name}: ${err.message}`);
    results.push({ name, ok: false, seconds: (Date.now() - started) / 1000 });
  }
}

console.log('\nFixture results:');
for (const r of results) console.log(`  ${r.ok ? '✓' : '✘'} ${r.name} (${r.seconds.toFixed(0)}s)`);
if (!process.env.KEEP_FIXTURES) rmSync(work, { recursive: true, force: true });
else console.log(`Kept build directories in ${work}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
