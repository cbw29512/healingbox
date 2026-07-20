// ============================================================
// CLERIC IN A BOX — healing math engine
// ============================================================
// All numbers here are homebrew approximations, not official
// rules text. Tune the ASSUMPTIONS block to match your table.
// ============================================================

const ASSUMPTIONS = {
  // Wisdom modifier the box assumes at each tier (typical 16 WIS
  // at level 1, +2 ASIs into WIS by level 8). Edit to taste.
  modByLevel(level) {
    if (level >= 8) return 5;
    if (level >= 4) return 4;
    return 3;
  },
  // Standard full-caster slot progression, levels 1-20.
  // Index 0 = 1st-level slots ... index 8 = 9th-level slots.
  slotTable: {
    1:  [2,0,0,0,0,0,0,0,0],
    2:  [3,0,0,0,0,0,0,0,0],
    3:  [4,2,0,0,0,0,0,0,0],
    4:  [4,3,0,0,0,0,0,0,0],
    5:  [4,3,2,0,0,0,0,0,0],
    6:  [4,3,3,0,0,0,0,0,0],
    7:  [4,3,3,1,0,0,0,0,0],
    8:  [4,3,3,2,0,0,0,0,0],
    9:  [4,3,3,3,1,0,0,0,0],
    10: [4,3,3,3,2,0,0,0,0],
    11: [4,3,3,3,2,1,0,0,0],
    12: [4,3,3,3,2,1,0,0,0],
    13: [4,3,3,3,2,1,1,0,0],
    14: [4,3,3,3,2,1,1,0,0],
    15: [4,3,3,3,2,1,1,1,0],
    16: [4,3,3,3,2,1,1,1,0],
    17: [4,3,3,3,2,1,1,1,1],
    18: [4,3,3,3,3,1,1,1,1],
    19: [4,3,3,3,3,2,1,1,1],
    20: [4,3,3,3,3,2,2,1,1],
  },
  // Cure Wounds die size + count per slot level, by edition.
  // 2014: 1d8 base, +1d8 per slot level above 1st.
  // 2024: 2d8 base, +2d8 per slot level above 1st (dice doubled).
  cureWoundsAvgPerDie: 4.5,
  cureWoundsDiceAtSlot1: { 2014: 1, 2024: 2 },
  // Heal spell takes over from 6th-level slots up: flat 70 hp,
  // +10 per slot level above 6th. Unchanged between editions
  // (the 2024 PHB doubled dice-based heals, but Heal's healing
  // isn't dice-based, so it's assumed unchanged here — flag this
  // for your table if you rule otherwise).
  healBase: 70,
  healPerSlotAboveSix: 10,
};

function healingForSlot(slotLevel, charLevel, edition) {
  const mod = ASSUMPTIONS.modByLevel(charLevel);
  if (slotLevel >= 6) {
    return ASSUMPTIONS.healBase + ASSUMPTIONS.healPerSlotAboveSix * (slotLevel - 6);
  }
  const diceAt1 = ASSUMPTIONS.cureWoundsDiceAtSlot1[edition];
  const totalDice = diceAt1 * slotLevel;
  return totalDice * ASSUMPTIONS.cureWoundsAvgPerDie + mod;
}

function computeBox(charLevel, edition) {
  const slots = ASSUMPTIONS.slotTable[charLevel];
  let totalSlots = 0;
  let totalHealing = 0;
  const breakdown = [];

  slots.forEach((count, idx) => {
    const slotLevel = idx + 1;
    if (count <= 0) return;
    const perCast = healingForSlot(slotLevel, charLevel, edition);
    totalSlots += count;
    totalHealing += count * perCast;
    breakdown.push({ slotLevel, count, perCast: Math.round(perCast) });
  });

  const avgPotion = totalSlots > 0 ? totalHealing / totalSlots : 0;

  return {
    charLevel,
    edition,
    totalPotions: totalSlots,
    potionSize: Math.round(avgPotion),
    totalHealing: Math.round(totalHealing),
    breakdown,
  };
}

// ============================================================
// DOM wiring
// ============================================================

function renderResults(result) {
  document.getElementById('potion-count').textContent = result.totalPotions;
  document.getElementById('potion-size').textContent = result.potionSize;
  document.getElementById('pool-total').textContent = result.totalHealing;

  const list = document.getElementById('breakdown-list');
  list.innerHTML = '';
  result.breakdown.forEach(row => {
    const li = document.createElement('li');
    const label = row.slotLevel >= 6 && row.perCast >= ASSUMPTIONS.healBase
      ? `${row.count} slot${row.count > 1 ? 's' : ''} of 6th+ level (cast as Heal)`
      : `${row.count} slot${row.count > 1 ? 's' : ''} of level ${row.slotLevel}`;
    li.innerHTML = `<span>${label}</span><span>~${row.perCast} hp each</span>`;
    list.appendChild(li);
  });
}

function scrollCostNote(level) {
  const el = document.getElementById('scroll-cost-note');
  el.textContent = `At party level ${level}, drawing a specific spell scroll costs a number of potions equal to that spell's level (e.g. a 3rd-level spell scroll costs 3 potions from the day's allowance).`;
}

let currentEdition = '2014';

function update() {
  const level = parseInt(document.getElementById('level-dial').value, 10);
  const result = computeBox(level, currentEdition === '2024' ? 2024 : 2014);
  renderResults(result);
  scrollCostNote(level);
  document.getElementById('level-readout').textContent = level;
}

function setEdition(edition) {
  currentEdition = edition;
  document.querySelectorAll('.ribbon-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.edition === edition);
  });
  document.getElementById('edition-readout').textContent =
    edition === '2024' ? 'Revised Rules (2024)' : 'Original Rules (2014)';
  update();
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('level-dial').addEventListener('input', update);
  document.querySelectorAll('.ribbon-tab').forEach(tab => {
    tab.addEventListener('click', () => setEdition(tab.dataset.edition));
  });
  setEdition('2014');
});
