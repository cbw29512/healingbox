import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(root, 'app-v3.js');
const script = readFileSync(scriptPath, 'utf8');

test('active application modules parse successfully', () => {
  for (const file of ['boot.js', 'app-v3.js', 'rules-data.js', 'dmforge-adapter.js']) {
    const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
});

test('administrative actions are authorized by host origin, never display name', () => {
  assert.match(script, /applyAction\(data\.action, actor, connection, 'remote'\)/);
  assert.match(script, /applyAction\(action, 'DM', null, 'host'\)/);
  assert.match(script, /ADMIN_ACTIONS\.has\(action\.type\) && source !== 'host'/);
  assert.equal(script.includes("actor !== 'DM'"), false);
  assert.equal(script.includes("data.name || 'Player'"), false);
});

test('player action messages cannot claim a name or role', () => {
  assert.match(script, /hostConn\.send\(\{ type: 'action', action \}\)/);
  assert.doesNotMatch(script, /hostConn\.send\(\{ type: 'action', action, (?:name|role):/);
});

test('remote clients can use charges but cannot submit administrative actions', () => {
  assert.match(script, /PLAYER_ACTIONS = new Set\(\['heal', 'scroll'\]\)/);
  assert.match(script, /source === 'remote' && !PLAYER_ACTIONS\.has\(action\.type\)/);
});

test('primary assets exist and the page launches through the canonical migration boot', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const asset of ['style.css', 'boot.js', 'app-v3.js', 'rules-data.js', 'dmforge-adapter.js', 'dmforge-adapter.css']) {
    assert.equal(existsSync(join(root, asset)), true, `Missing ${asset}`);
  }
  assert.equal(html.includes('type="module" src="boot.js"'), true);
  assert.equal(html.includes('type="module" src="app-v3.js"'), false);
  assert.equal(html.includes('src="/monstercardforge/shared/dmforge-store.js"'), true);
  assert.equal(html.includes('src="dmforge-adapter.js"'), true);
  assert.equal(html.includes('id="settingsDialog"'), true);
  const boot = readFileSync(join(root, 'boot.js'), 'utf8');
  assert.equal(boot.includes("import { SLOTS } from './rules-data.js'"), true);
  assert.equal(boot.includes("await import('./app-v3.js')"), true);
});

test('Campaign Hub synchronization exposes only room summaries', () => {
  const adapter = readFileSync(join(root, 'dmforge-adapter.js'), 'utf8');
  assert.equal(adapter.includes('syncHealingRoom'), true);
  assert.equal(adapter.includes('remainingCharges'), false);
  assert.equal(adapter.includes('roomState.log'), false);
  assert.equal(adapter.includes('roomState.deity'), false);
});

test('runtime selects edition-specific formulas, notes, and resolution methods', () => {
  assert.equal(script.includes('effect[`resolution${suffix}`]'), true);
  assert.equal(script.includes('effect[`concentration${suffix}`]'), true);
  assert.equal(script.includes("effect.resolution.includes('spell attack')"), true);
  assert.equal(script.includes("effect.resolution.includes('saving throw')"), true);
});
