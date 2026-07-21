'use strict';

import { EFFECTS, POTIONS, RULES_METADATA, SLOTS, SPELLS } from './rules-data.js';

const ADMIN_ACTIONS = new Set(['rest', 'undo', 'settings']);
const PLAYER_ACTIONS = new Set(['heal', 'scroll']);

let peer = null;
let hostConn = null;
let connections = [];
let isHost = false;
let state = null;
let roomCode = '';
let displayName = 'Player';
let activeChargeId = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function clampNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.trunc(number)));
}

function signed(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function playerName(value) {
  return String(value || 'Player').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40) || 'Player';
}

function ordinal(value) {
  const number = Number(value);
  return `${number}${number === 1 ? 'st' : number === 2 ? 'nd' : number === 3 ? 'rd' : 'th'}`;
}

function tier(level) {
  return level === 1 ? 'healing' : level <= 3 ? 'greater' : level <= 6 ? 'superior' : 'supreme';
}

function normalizeState(raw = {}) {
  const level = clampNumber(raw.level, 1, 20, 1);
  const ruleset = Number(raw.ruleset) === 2024 ? 2024 : 2014;
  const charges = Array.isArray(raw.charges) ? raw.charges : makeCharges(level);
  return {
    version: 3,
    campaign: String(raw.campaign || 'My Campaign').slice(0, 100),
    deity: String(raw.deity || 'The DM’s Deity').slice(0, 100),
    ruleset,
    level,
    wisdomMod: clampNumber(raw.wisdomMod, -5, 10, 5),
    spellSaveDc: clampNumber(raw.spellSaveDc, 1, 40, 17),
    spellAttackBonus: clampNumber(raw.spellAttackBonus, -5, 20, 9),
    charges,
    log: Array.isArray(raw.log) ? raw.log : [],
    createdAt: Number(raw.createdAt) || Date.now()
  };
}

function makeCharges(level) {
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

function newState(data) {
  const level = clampNumber(data.level, 1, 20, 1);
  return normalizeState({
    campaign: data.campaign,
    deity: data.deity,
    ruleset: data.ruleset,
    level,
    wisdomMod: data.wisdomMod,
    spellSaveDc: data.spellSaveDc,
    spellAttackBonus: data.spellAttackBonus,
    charges: makeCharges(level),
    log: [],
    createdAt: Date.now()
  });
}

function save() {
  if (isHost && roomCode && state) localStorage.setItem(`cleric-box-${roomCode}`, JSON.stringify(state));
}

function load(code) {
  try {
    const stored = JSON.parse(localStorage.getItem(`cleric-box-${code}`) || 'null');
    return stored ? normalizeState(stored) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function randomInt(maximum) {
  if (maximum <= 0) return 0;
  const limit = Math.floor(0x100000000 / maximum) * maximum;
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return values[0] % maximum;
}

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('');
}

function hostId(code) {
  return `cleric-in-a-box-${code.toLowerCase()}`;
}

function setConnection(text, online = false) {
  $('#connectionText').textContent = text;
  $('#dot').className = `dot ${online ? 'online' : ''}`;
}

function toast(message) {
  const element = document.createElement('div');
  element.textContent = message;
  element.setAttribute('role', 'status');
  element.style = 'position:fixed;z-index:100;left:50%;bottom:20px;transform:translateX(-50%);background:#281713;color:#fff4ce;padding:12px 18px;border:1px solid #d4a64c;border-radius:8px;max-width:90vw;box-shadow:0 8px 30px #0008';
  document.body.append(element);
  setTimeout(() => element.remove(), 3200);
}

function log(text) {
  state.log.push({ time: Date.now(), text });
}

function resolveFormula(raw) {
  const modifier = state.wisdomMod;
  return String(raw).replace(/\+WIS/g, modifier === 0 ? '' : signed(modifier));
}

function rollFormula(raw) {
  const formula = resolveFormula(raw);
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error(`Unsupported dice formula: ${formula}`);
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const bonus = Number(match[3] || 0);
  const rolls = Array.from({ length: count }, () => randomInt(sides) + 1);
  return { formula, rolls, bonus, total: rolls.reduce((sum, value) => sum + value, 0) + bonus };
}

function setupView() {
  return `<section class="card setup"><div class="tabs"><button class="btn" id="newTab" type="button">Create Party</button><button class="btn blue" id="joinTab" type="button">Join Party</button></div><div id="newPane"><h2>Bind the Artifact to a Party</h2><div class="form-grid"><label>Campaign<input id="campaign" value="My Campaign"></label><label>Rules<select id="ruleset"><option value="2014">5e (2014)</option><option value="2024">5.5e (2024)</option></select></label><label>Average party level<select id="level">${Array.from({ length: 20 }, (_, index) => `<option>${index + 1}</option>`).join('')}</select></label><label>Granting deity<input id="deity" placeholder="DM-controlled deity"></label><label>Artifact Wisdom modifier<input id="wisdomMod" type="number" min="-5" max="10" value="5"></label><label>Artifact spell save DC<input id="spellSaveDc" type="number" min="1" max="40" value="17"></label><label>Artifact spell attack bonus<input id="spellAttackBonus" type="number" min="-5" max="20" value="9"></label></div><div class="notice">The three artifact spellcasting values are DM-controlled homebrew settings. They are not guessed from party level.</div><button class="btn gold" id="create" type="button" style="width:100%;margin-top:14px">Create the Unique Artifact</button></div><div id="joinPane" class="hidden"><h2>Join the Party Box</h2><div class="form-grid"><label>Your name<input id="joinName" placeholder="Player name"></label><label>Room code<input id="joinCode" maxlength="6" autocomplete="off"></label></div><button class="btn blue" id="join" type="button" style="width:100%;margin-top:14px">Connect to the Box</button></div><div class="notice">The DM’s browser hosts the shared tracker and must remain open during play.</div></section>`;
}

function inventory() {
  const counts = { healing: 0, greater: 0, superior: 0, supreme: 0 };
  state.charges.filter((charge) => !charge.spent).forEach((charge) => { counts[charge.potion] += 1; });
  return counts;
}

function trackerView() {
  const counts = inventory();
  const grouped = {};
  const rulesLabel = RULES_METADATA[state.ruleset]?.label || `${state.ruleset} rules`;
  state.charges.forEach((charge) => { (grouped[charge.level] ??= []).push(charge); });
  return `<div class="topbar"><div><h2 style="margin-bottom:.2rem">${esc(state.campaign)}</h2><div>${esc(rulesLabel)} · Average party level ${state.level}</div><div class="artifact-stats">Artifact WIS ${signed(state.wisdomMod)} · Save DC ${state.spellSaveDc} · Spell attack ${signed(state.spellAttackBonus)}</div></div><div class="room no-print"><span class="room-code">${roomCode}</span><button class="btn ghost" data-copy type="button">Copy player link</button>${isHost ? '<button class="btn ghost" data-settings type="button">Artifact Settings</button><button class="btn gold" data-rest type="button">Long Rest Reset</button>' : ''}</div></div><section class="summary-grid">${Object.entries(POTIONS).map(([key, potion]) => `<div class="summary"><span>${potion.name}</span><strong>${counts[key]}</strong><small>${potion.formula}</small></div>`).join('')}</section>${Object.entries(grouped).map(([level, charges]) => `<section class="level-group"><div class="level-title"><h2>${ordinal(level)}-Level Divine Charges</h2><span>${charges.filter((charge) => !charge.spent).length} remaining</span></div><div class="charge-grid">${charges.map(chargeCard).join('')}</div></section>`).join('')}<section class="card history"><h2>Adventuring-Day History</h2><ul class="log">${state.log.length ? state.log.slice().reverse().map((item) => `<li><time>${new Date(item.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><br>${esc(item.text)}</li>`).join('') : '<li class="empty">Nothing has been used yet.</li>'}</ul>${isHost && state.log.length ? '<button class="btn ghost no-print" data-undo type="button">Undo Last Use</button>' : ''}</section><div class="artifact-law"><b>Unique Artifact · Campaign Rule.</b> The box is semi-sentient and reads its own scrolls as a free action. It cannot be stolen, destroyed, suppressed, banished, or separated from the party. Only the specific deity that granted it—controlled by the DM—can affect it.</div>`;
}

function chargeCard(charge) {
  const potion = POTIONS[charge.potion];
  return `<article class="charge-card ${charge.spent ? 'used' : ''}"><h3>${ordinal(charge.level)}-Level Charge ${charge.number}</h3><div class="charge-meta"><span class="badge">${potion.name}</span><span class="badge">${potion.formula}</span></div>${charge.spent ? `<div class="charge-result">USED<br>${esc(charge.result || 'Charge spent')}</div>` : `<div class="actions no-print"><button class="btn" data-heal="${charge.id}" type="button">Roll Healing</button><button class="btn blue" data-scroll="${charge.id}" type="button">Choose Scroll</button></div>`}</article>`;
}

function render() {
  $('#app').innerHTML = state ? trackerView() : setupView();
  bind();
  setConnection(state ? (isHost ? `Hosting ${roomCode}` : 'Connected to the party') : 'Not connected', Boolean(state));
}

function bind() {
  if (!state) {
    $('#newTab').onclick = () => { $('#newPane').classList.remove('hidden'); $('#joinPane').classList.add('hidden'); };
    $('#joinTab').onclick = () => { $('#joinPane').classList.remove('hidden'); $('#newPane').classList.add('hidden'); };
    $('#create').onclick = createParty;
    $('#join').onclick = joinParty;
    return;
  }
  $$('[data-copy]').forEach((button) => { button.onclick = copyLink; });
  $$('[data-settings]').forEach((button) => { button.onclick = openSettings; });
  $$('[data-rest]').forEach((button) => { button.onclick = () => sendAction({ type: 'rest' }); });
  $$('[data-heal]').forEach((button) => { button.onclick = (event) => sendAction({ type: 'heal', chargeId: event.currentTarget.dataset.heal }); });
  $$('[data-scroll]').forEach((button) => { button.onclick = (event) => openScroll(event.currentTarget.dataset.scroll); });
  $$('[data-undo]').forEach((button) => { button.onclick = () => sendAction({ type: 'undo' }); });
}

function createParty() {
  roomCode = randomCode();
  displayName = 'DM';
  state = newState({
    campaign: $('#campaign').value.trim(), deity: $('#deity').value.trim(), ruleset: $('#ruleset').value, level: $('#level').value,
    wisdomMod: $('#wisdomMod').value, spellSaveDc: $('#spellSaveDc').value, spellAttackBonus: $('#spellAttackBonus').value
  });
  isHost = true;
  save();
  startHost();
}

function startHost() {
  setConnection('Opening the box…');
  peer = new Peer(hostId(roomCode));
  peer.on('open', () => {
    history.replaceState({}, '', `${location.pathname}?host=${roomCode}`);
    setConnection(`Hosting ${roomCode}`, true);
    render();
  });
  peer.on('connection', (connection) => {
    connections.push(connection);
    connection.on('open', () => connection.send({ type: 'state', state, roomCode }));
    connection.on('data', (data) => handleRemote(data, connection));
    connection.on('close', () => { connections = connections.filter((candidate) => candidate !== connection); });
  });
  peer.on('error', (error) => {
    console.error(error);
    if (error.type === 'unavailable-id') {
      roomCode = randomCode();
      save();
      peer.destroy();
      startHost();
    } else setConnection(`Connection error: ${error.type}`, false);
  });
}

function joinParty() {
  displayName = playerName($('#joinName').value);
  roomCode = $('#joinCode').value.trim().toUpperCase();
  if (roomCode.length !== 6) { toast('Enter the six-character room code.'); return; }
  setConnection('Connecting…');
  peer = new Peer();
  peer.on('open', () => {
    hostConn = peer.connect(hostId(roomCode), { reliable: true });
    hostConn.on('open', () => { hostConn.send({ type: 'hello', name: displayName }); setConnection('Connected', true); });
    hostConn.on('data', (data) => {
      if (data.type === 'state') { state = normalizeState(data.state); render(); }
      if (data.type === 'error') toast(data.message);
    });
    hostConn.on('close', () => setConnection('Host disconnected', false));
  });
  peer.on('error', (error) => setConnection(`Connection error: ${error.type}`, false));
}

function handleRemote(data, connection) {
  if (data?.type === 'hello') {
    connection.metadata = { name: playerName(data.name) };
    connection.send({ type: 'state', state, roomCode });
    return;
  }
  if (data?.type === 'action') {
    const actor = connection.metadata?.name || 'Player';
    applyAction(data.action, actor, connection, 'remote');
  }
}

function sendAction(action) {
  if (isHost) applyAction(action, 'DM', null, 'host');
  else if (hostConn?.open) hostConn.send({ type: 'action', action });
  else toast('The DM host is not connected.');
}

function applyAction(action, actor, connection, source) {
  try {
    if (!action || typeof action.type !== 'string') throw new Error('Invalid artifact action.');
    if (ADMIN_ACTIONS.has(action.type) && source !== 'host') throw new Error('Only the hosting DM can perform that action.');
    if (source === 'remote' && !PLAYER_ACTIONS.has(action.type)) throw new Error('That player action is not allowed.');

    if (action.type === 'heal') useHealingCharge(action.chargeId, actor);
    else if (action.type === 'scroll') useScrollCharge(action, actor);
    else if (action.type === 'rest') {
      state.charges = makeCharges(state.level);
      state.log = [];
      log('The party completed a long rest. Every divine charge returned.');
    } else if (action.type === 'undo') undoLast();
    else if (action.type === 'settings') updateSettings(action);
    else throw new Error('Unknown artifact action.');
    broadcast();
  } catch (error) {
    console.error(error);
    if (connection?.open) connection.send({ type: 'error', message: error.message });
    else toast(error.message);
  }
}

function updateSettings(action) {
  state.wisdomMod = clampNumber(action.wisdomMod, -5, 10, state.wisdomMod);
  state.spellSaveDc = clampNumber(action.spellSaveDc, 1, 40, state.spellSaveDc);
  state.spellAttackBonus = clampNumber(action.spellAttackBonus, -5, 20, state.spellAttackBonus);
  log(`DM updated artifact spellcasting: WIS ${signed(state.wisdomMod)}, save DC ${state.spellSaveDc}, spell attack ${signed(state.spellAttackBonus)}.`);
}

function broadcast() {
  save();
  render();
  connections.filter((connection) => connection.open).forEach((connection) => connection.send({ type: 'state', state, roomCode }));
}

function useHealingCharge(chargeId, actor) {
  const charge = state.charges.find((candidate) => candidate.id === chargeId);
  if (!charge || charge.spent) throw new Error('That charge has already been used.');
  const potion = POTIONS[charge.potion];
  const roll = rollFormula(potion.formula);
  charge.spent = true;
  charge.usedAs = 'healing';
  charge.actor = actor;
  charge.time = Date.now();
  charge.result = `${potion.name}: ${roll.rolls.join(' + ')}${roll.bonus ? ` ${roll.bonus > 0 ? '+' : '−'} ${Math.abs(roll.bonus)}` : ''} = ${roll.total} HP healed`;
  log(`${actor} used ${potion.name}. The box rolled ${charge.result.replace(`${potion.name}: `, '')}.`);
}

function spellsFor(level) {
  return SPELLS[state.ruleset]?.[level] || [];
}

function spellEffect(spell) {
  const effect = EFFECTS[spell];
  if (!effect) return { kind: 'utility', note: 'No damage or healing roll. Resolve the spell normally.' };
  const suffix = state.ruleset === 2024 ? '2024' : '2014';
  const formula = effect.formula || effect[`f${suffix}`];
  const note = effect[`note${suffix}`] || effect.note;
  const resolution = effect[`resolution${suffix}`] || effect.resolution || '';
  const concentration = effect[`concentration${suffix}`] ?? effect.concentration ?? false;
  return { ...effect, formula, note, resolution, concentration };
}

function resolutionText(effect) {
  if (!effect.resolution) return '';
  if (effect.resolution.includes('spell attack')) return `${effect.resolution[0].toUpperCase()}${effect.resolution.slice(1)} ${signed(state.spellAttackBonus)}.`;
  if (effect.resolution.includes('saving throw')) return `${effect.resolution[0].toUpperCase()}${effect.resolution.slice(1)} against artifact save DC ${state.spellSaveDc}.`;
  return effect.resolution;
}

function spellPreviewText(spell) {
  if (spell === 'Other Cleric Spell…') return 'Enter the spell name. The box will record it, but no automatic damage or healing roll is available for a custom spell.';
  const effect = spellEffect(spell);
  const resolution = resolutionText(effect);
  if (effect.kind === 'damage') return `The box will roll ${resolveFormula(effect.formula)}. ${effect.note}. ${resolution}`.trim();
  if (effect.kind === 'healing') return `The box will roll ${resolveFormula(effect.formula)}. ${effect.note}.`;
  if (effect.kind === 'fixed') return `The box will report ${effect.amount}. ${effect.note}.`;
  if (effect.kind === 'full') return `The box will report: ${effect.note}.`;
  return effect.note;
}

function openScroll(chargeId) {
  activeChargeId = chargeId;
  const charge = state.charges.find((candidate) => candidate.id === chargeId);
  if (!charge || charge.spent) { toast('That charge has already been used.'); return; }
  $('#scrollTitle').textContent = `Use ${ordinal(charge.level)}-Level Scroll`;
  const spells = [...spellsFor(charge.level), 'Other Cleric Spell…'];
  $('#scrollSpell').innerHTML = spells.map((spell) => `<option>${esc(spell)}</option>`).join('');
  $('#customSpellWrap').classList.add('hidden');
  $('#customSpell').value = '';
  $('#scrollNote').value = '';
  updateSpellPreview();
  $('#scrollSpell').onchange = updateSpellPreview;
  $('#castScroll').onclick = castSelectedScroll;
  $('#scrollDialog').showModal();
}

function updateSpellPreview() {
  const spell = $('#scrollSpell').value;
  $('#customSpellWrap').classList.toggle('hidden', spell !== 'Other Cleric Spell…');
  $('#spellPreview').textContent = spellPreviewText(spell);
}

function castSelectedScroll() {
  const selected = $('#scrollSpell').value;
  const spell = selected === 'Other Cleric Spell…' ? ($('#customSpell').value.trim() || 'Custom cleric spell') : selected;
  sendAction({ type: 'scroll', chargeId: activeChargeId, spell, known: selected !== 'Other Cleric Spell…', note: $('#scrollNote').value.trim() });
  $('#scrollDialog').close();
}

function useScrollCharge(action, actor) {
  const charge = state.charges.find((candidate) => candidate.id === action.chargeId);
  if (!charge || charge.spent) throw new Error('That exact-level charge has already been used.');
  const exactList = spellsFor(charge.level);
  if (action.known && !exactList.includes(action.spell)) throw new Error('That spell is not available at this exact spell level for the selected ruleset.');
  const effect = action.known ? spellEffect(action.spell) : { kind: 'utility', note: 'Custom spell recorded; resolve normally.' };
  let result = '';
  if (effect.kind === 'damage' || effect.kind === 'healing') {
    const roll = rollFormula(effect.formula);
    const label = effect.kind === 'damage' ? 'damage' : 'HP healed';
    const bonusText = roll.bonus ? ` ${roll.bonus > 0 ? '+' : '−'} ${Math.abs(roll.bonus)}` : '';
    result = `${action.spell}: ${roll.rolls.join(' + ')}${bonusText} = ${roll.total} ${label}`;
    if (effect.note) result += ` (${effect.note})`;
    const resolution = resolutionText(effect);
    if (resolution) result += ` — ${resolution}`;
  } else if (effect.kind === 'fixed') result = `${action.spell}: ${effect.amount} — ${effect.note}`;
  else if (effect.kind === 'full') result = `${action.spell}: ${effect.note}`;
  else result = `${action.spell}: ${effect.note || 'No damage or healing roll; resolve normally.'}`;
  if (action.note) result += ` — ${action.note}`;
  charge.spent = true;
  charge.usedAs = 'scroll';
  charge.actor = actor;
  charge.time = Date.now();
  charge.result = result;
  log(`${actor} used a ${ordinal(charge.level)}-level scroll. ${result}`);
}

function undoLast() {
  const spent = state.charges.filter((charge) => charge.spent && charge.time).sort((a, b) => b.time - a.time)[0];
  if (!spent) { toast('Nothing to undo.'); return; }
  const description = spent.result;
  spent.spent = false;
  spent.usedAs = null;
  spent.result = null;
  spent.actor = null;
  spent.time = null;
  log(`DM restored the last-used charge: ${description}`);
}

function openSettings() {
  $('#settingsWisdomMod').value = state.wisdomMod;
  $('#settingsSaveDc').value = state.spellSaveDc;
  $('#settingsAttackBonus').value = state.spellAttackBonus;
  $('#settingsRulesNote').textContent = `${RULES_METADATA[state.ruleset].label} · verified ${RULES_METADATA[state.ruleset].verified}`;
  $('#saveSettings').onclick = saveSettings;
  $('#settingsDialog').showModal();
}

function saveSettings() {
  sendAction({
    type: 'settings',
    wisdomMod: $('#settingsWisdomMod').value,
    spellSaveDc: $('#settingsSaveDc').value,
    spellAttackBonus: $('#settingsAttackBonus').value
  });
  $('#settingsDialog').close();
}

function copyLink() {
  const url = `${location.origin}${location.pathname}?join=${roomCode}`;
  navigator.clipboard?.writeText(url).then(() => toast('Player link copied.')).catch(() => prompt('Copy this player link:', url));
}

window.addEventListener('beforeunload', () => {
  try { peer?.destroy(); } catch (error) { console.error(error); }
});

(function boot() {
  const params = new URLSearchParams(location.search);
  const host = params.get('host');
  const join = params.get('join');
  if (host) {
    roomCode = host.toUpperCase();
    state = load(roomCode);
    if (state) {
      isHost = true;
      displayName = 'DM';
      save();
      startHost();
      render();
      return;
    }
  }
  render();
  if (join) {
    $('#joinTab').click();
    $('#joinCode').value = join.toUpperCase();
  }
})();
