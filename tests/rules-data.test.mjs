import test from 'node:test';
import assert from 'node:assert/strict';
import { EFFECTS, SLOTS, SPELLS } from '../rules-data.js';

test('full-caster slot progression reaches the correct level-20 array', () => {
  assert.deepEqual(SLOTS[20], [4, 3, 3, 3, 3, 2, 2, 1, 1]);
});

test('2014 and 2024 Cleric spell lists remain separated', () => {
  for (const spell of ['Aura of Life', 'Sunbeam', 'Sunburst']) {
    assert.equal(Object.values(SPELLS[2014]).flat().includes(spell), false, `${spell} should not be on the 2014 base Cleric list`);
    assert.equal(Object.values(SPELLS[2024]).flat().includes(spell), true, `${spell} should be on the 2024 Cleric list`);
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
});
