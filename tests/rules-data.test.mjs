import test from 'node:test';
import assert from 'node:assert/strict';
import { EFFECTS, RULES_METADATA, SLOTS, SPELLS } from '../rules-data.js';

test('full-caster slot progression reaches the correct level-20 array', () => {
  assert.deepEqual(SLOTS[20], [4, 3, 3, 3, 3, 2, 2, 1, 1]);
});

test('5e and 5.5e Cleric spell lists remain separated', () => {
  for (const spell of ['Aura of Life', 'Sunbeam', 'Sunburst']) {
    assert.equal(Object.values(SPELLS[2014]).flat().includes(spell), false, `${spell} should not be on the 5e base Cleric list`);
    assert.equal(Object.values(SPELLS[2024]).flat().includes(spell), true, `${spell} should be on the 5.5e Cleric list`);
  }
});

test('edition-specific healing and damage formulas are preserved', () => {
  assert.equal(EFFECTS['Cure Wounds'].f2014, '1d8+WIS');
  assert.equal(EFFECTS['Cure Wounds'].f2024, '2d8+WIS');
  assert.equal(EFFECTS['Inflict Wounds'].f2014, '3d10');
  assert.equal(EFFECTS['Inflict Wounds'].f2024, '2d10');
  assert.equal(EFFECTS['Prayer of Healing'].f2014, '2d8+WIS');
  assert.equal(EFFECTS['Prayer of Healing'].f2024, '2d8');
  assert.equal(EFFECTS['Mass Cure Wounds'].f2014, '3d8+WIS');
  assert.equal(EFFECTS['Mass Cure Wounds'].f2024, '5d8+WIS');
  assert.equal(EFFECTS['Flame Strike'].f2014, '8d6');
  assert.equal(EFFECTS['Flame Strike'].f2024, '10d6');
});

test('attack, saving throw, concentration, trigger, and damage-type differences remain explicit', () => {
  assert.equal(EFFECTS['Inflict Wounds'].resolution2014, 'melee spell attack');
  assert.equal(EFFECTS['Inflict Wounds'].resolution2024, 'Constitution saving throw');
  assert.equal(EFFECTS['Spiritual Weapon'].concentration2014, false);
  assert.equal(EFFECTS['Spiritual Weapon'].concentration2024, true);
  assert.match(EFFECTS['Spirit Guardians'].note2014, /starts its turn/i);
  assert.match(EFFECTS['Spirit Guardians'].note2024, /ends its turn/i);
  assert.match(EFFECTS['Blade Barrier'].note2014, /Slashing/i);
  assert.match(EFFECTS['Blade Barrier'].note2024, /Force/i);
});

test('high-impact fixed and resurrection effects retain their essential riders', () => {
  assert.equal(EFFECTS['Guardian of Faith'].amount, 20);
  assert.match(EFFECTS['Guardian of Faith'].note, /10 on a successful save/i);
  assert.match(EFFECTS['Guardian of Faith'].note, /60 total damage/i);
  assert.equal(EFFECTS['Mass Heal'].amount, 700);
  assert.match(EFFECTS['Raise Dead'].note, /10-day limit/i);
  assert.match(EFFECTS['Resurrection'].note, /century limit/i);
  assert.match(EFFECTS['True Resurrection'].note, /200-year limit/i);
});

test('rules metadata uses current public labels and non-future review dates', () => {
  assert.match(RULES_METADATA[2014].label, /5e \(2014\)/);
  assert.match(RULES_METADATA[2024].label, /5\.5e \(2024\)/);
  for (const metadata of Object.values(RULES_METADATA)) {
    assert.equal(metadata.verified, '2026-07-21');
    assert.match(metadata.source, /^https:\/\/www\.dndbeyond\.com\/sources\/dnd\//);
  }
});
