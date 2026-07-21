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
  for (const file of ['app-v3.js', 'rules-data.js']) {
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

test('primary local assets exist and the page launches the versioned app', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const asset of ['style.css', 'app-v3.js', 'rules-data.js']) {
    assert.equal(existsSync(join(root, asset)), true, `Missing ${asset}`);
  }
  assert.equal(html.includes('type="module" src="app-v3.js"'), true);
  assert.equal(html.includes('id="settingsDialog"'), true);
});
