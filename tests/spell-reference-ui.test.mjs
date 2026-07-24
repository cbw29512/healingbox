import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, script, css] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../spell-reference.js', import.meta.url), 'utf8'),
  readFile(new URL('../spell-reference.css', import.meta.url), 'utf8')
]);

test('the scroll dialog loads the shared cast-ready reference enhancer', () => {
  assert.match(html, /spell-reference\.css/);
  assert.match(html, /type="module" src="spell-reference\.js"/);
});

test('the enhancer uses the licensed DungeonCards cleric spell export', () => {
  assert.match(script, /cleric-spell-references\.json/);
  assert.match(script, /schemaVersion !== 1/);
  assert.match(script, /castingTime/);
  assert.match(script, /range/);
  assert.match(script, /duration/);
  assert.match(script, /components/);
  assert.match(script, /description/);
  assert.match(script, /sourceReference/);
  assert.match(script, /CC BY 4\.0|license/);
});

test('the preview explains the artifact override and exact-level limit', () => {
  assert.match(script, /Free action · campaign artifact rule/);
  assert.match(script, /No upcasting/);
  assert.match(script, /Targets, saves, attacks, duration, concentration, and ongoing effects/);
  assert.match(css, /spell-reference-facts/);
  assert.match(css, /spell-reference-effect/);
});
