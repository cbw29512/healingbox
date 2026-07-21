'use strict';

import { SLOTS } from './rules-data.js';

function tier(level) {
  return level === 1 ? 'healing' : level <= 3 ? 'greater' : level <= 6 ? 'superior' : 'supreme';
}

function clampLevel(value) {
  return Math.max(1, Math.min(20, Number(value) || 1));
}

function chargesFor(level) {
  const charges = [];
  (SLOTS[level] || SLOTS[1]).forEach((quantity, index) => {
    const spellLevel = index + 1;
    for (let number = 1; number <= quantity; number += 1) {
      charges.push({
        id: `L${spellLevel}-${number}`,
        level: spellLevel,
        number,
        potion: tier(spellLevel),
        spent: false,
        usedAs: null,
        result: null,
        actor: null,
        time: null
      });
    }
  });
  return charges;
}

function migrateHostedRoom() {
  const room = (new URLSearchParams(location.search).get('host') || '').toUpperCase();
  if (!room) return;
  const key = `cleric-box-${room}`;

  try {
    const old = JSON.parse(localStorage.getItem(key) || 'null');
    if (!old || (old.version >= 2 && Array.isArray(old.charges))) return;

    const level = clampLevel(old.level ?? old.partyLevel);
    const migrated = {
      version: 2,
      campaign: old.campaign || old.campaignName || 'My Campaign',
      deity: old.deity || old.deityName || 'DM-controlled deity',
      ruleset: Number(old.ruleset) === 2024 ? 2024 : 2014,
      level,
      charges: chargesFor(level),
      log: Array.isArray(old.log) ? old.log : [],
      createdAt: Number(old.createdAt) || Date.now()
    };
    localStorage.setItem(key, JSON.stringify(migrated));
  } catch (error) {
    console.error('[ClericBoxMigration] Could not migrate hosted room', error);
  }
}

migrateHostedRoom();
await import('./app-v3.js');
