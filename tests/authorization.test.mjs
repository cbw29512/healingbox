import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(root, 'script.js');
const script = readFileSync(scriptPath, 'utf8');

test('script.js parses successfully', () => {
  const result = spawnSync(process.execPath, ['--check', scriptPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('administrative actions are authorized by host origin, never display name', () => {
  assert.equal(script.includes("applyAction(data.action,actor,connection,'remote')"), true);
  assert.equal(script.includes("applyAction(action,'DM',null,'host')"), true);
  assert.equal(script.includes("source!=='host'"), true);
  assert.equal(script.includes("actor!=='DM'"), false);
  assert.equal(script.includes("data.name||'Player'"), false);
});

test('player action messages cannot claim a name or role', () => {
  assert.equal(script.includes("hostConn.send({type:'action',action})"), true);
  assert.equal(script.includes("hostConn.send({type:'action',action,name:displayName})"), false);
});

test('primary local assets exist', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const asset of ['style.css', 'script.js']) {
    assert.equal(html.includes(asset), true, `index.html does not reference ${asset}`);
    assert.equal(existsSync(join(root, asset)), true, `Missing ${asset}`);
  }
});
