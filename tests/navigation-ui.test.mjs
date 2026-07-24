import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');

test('Cleric in a Box has a clear return path into DM Forge', () => {
  assert.equal(html.includes('aria-label="DM Forge navigation"'), true);
  assert.equal(html.includes('https://cbw29512.github.io/monstercardforge/'), true);
  assert.equal(html.includes('Campaign Hub'), true);
  assert.equal(html.includes('Rules &amp; Cards'), true);
  assert.equal(html.includes('Session Console'), true);
});

test('Cleric in a Box uses equal-size responsive charge cards', () => {
  assert.equal(css.includes('grid-auto-rows:1fr'), true);
  assert.equal(css.includes('.charge-card{height:100%;min-height:190px'), true);
  assert.equal(css.includes('.charge-card .actions{display:grid;grid-template-columns:1fr 1fr'), true);
  assert.equal(html.includes('DM creates the box'), true);
  assert.equal(html.includes('Players join'), true);
  assert.equal(html.includes('Use one charge'), true);
});
