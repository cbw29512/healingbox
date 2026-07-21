import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'style.css'), 'utf8');

test('Cleric in a Box keeps stable public metadata', () => {
  assert.match(html, /<title>Cleric in a Box \| Shared D&D Healing & Scroll Tracker<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{70,180}">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/cbw29512\.github\.io\/healingbox\/">/);
  assert.match(html, /<meta name="robots"/);
  assert.match(html, /<h1>Cleric <span>in a Box<\/span><\/h1>/);
});

test('Cleric in a Box consumes the canonical DM Forge design system', () => {
  assert.equal(html.includes('https://cbw29512.github.io/monstercardforge/shared/design-system.css'), true);
  assert.equal(css.includes('IM Fell English'), false);
  for (const requirement of ['--font-display:', '--font-ui:', '--focus:#087ea4', 'min-height:44px', ':focus-visible', 'prefers-reduced-motion']) {
    assert.equal(css.includes(requirement), true, `Missing ${requirement}`);
  }
});

test('Cleric in a Box sitemap and robots point at the canonical route', () => {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  const robots = readFileSync(join(root, 'robots.txt'), 'utf8');
  assert.equal(sitemap.includes('<loc>https://cbw29512.github.io/healingbox/</loc>'), true);
  assert.equal(robots.includes('https://cbw29512.github.io/healingbox/sitemap.xml'), true);
});

test('artifact copy distinguishes current rules labels from campaign homebrew', () => {
  const app = readFileSync(join(root, 'app-v3.js'), 'utf8');
  assert.equal(app.includes('5e (2014)'), true);
  assert.equal(app.includes('5.5e (2024)'), true);
  assert.equal(app.includes('Unique Artifact · Campaign Rule.'), true);
});
