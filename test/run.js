#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const OUTPUT_DIR = path.join(__dirname, 'output');
const CLI = path.join(ROOT, 'dist', 'main.js');

function run(label, file, args) {
  process.stdout.write(`  ${label} ... `);
  try {
    execFileSync(file, args, { cwd: ROOT, stdio: 'pipe' });
    console.log('ok');
  } catch (err) {
    console.log('FAIL');
    if (err.stdout) process.stderr.write(err.stdout.toString());
    if (err.stderr) process.stderr.write(err.stderr.toString());
    process.exit(1);
  }
}

if (!fs.existsSync(CLI)) {
  console.error(`error: ${CLI} not found. Run "npm run build" first.`);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const fixtures = fs
  .readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

if (fixtures.length === 0) {
  console.error(`error: no fixtures found in ${FIXTURES_DIR}`);
  process.exit(1);
}

let failed = 0;
for (const fixture of fixtures) {
  console.log(`\n[${fixture}]`);
  const input = path.join(FIXTURES_DIR, fixture);
  const output = path.join(
    OUTPUT_DIR,
    fixture.replace(/\.ya?ml$/, '.ts'),
  );

  try {
    run('generate', process.execPath, [CLI, '--input', input, '--output', output]);
    run('typecheck', path.join(ROOT, 'node_modules', '.bin', 'tsc'), [
      '--noEmit',
      '--strict',
      '--target',
      'es2020',
      '--module',
      'commonjs',
      output,
    ]);
  } catch {
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} fixture(s) failed`);
  process.exit(1);
}
console.log(`\nall ${fixtures.length} fixture(s) passed`);
