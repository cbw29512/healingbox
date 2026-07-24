'use strict';

const REFERENCE_URL = 'https://cbw29512.github.io/DungeonCards/dm-forge/cleric-spell-references.json';
const references = new Map();
let loadState = 'loading';
let lastMarkup = '';
let automaticSummary = '';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

const normalizeName = (value) => String(value || '')
  .replace(/[’‘]/g, "'")
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const currentRuleset = () => {
  const trackerText = document.querySelector('.topbar')?.textContent || '';
  return trackerText.includes('5.5e (2024)') ? '2024' : '2014';
};

const referenceKey = (ruleset, name) => `${ruleset}:${normalizeName(name)}`;

const selectedSpellName = () => {
  const select = document.querySelector('#scrollSpell');
  if (!select) return '';
  if (select.value === 'Other Cleric Spell…') {
    return document.querySelector('#customSpell')?.value.trim() || 'Custom cleric spell';
  }
  return select.value;
};

const captureAutomaticSummary = () => {
  const preview = document.querySelector('#spellPreview');
  if (!preview || preview.childElementCount > 0) return;
  const text = preview.textContent.trim();
  if (text) automaticSummary = text;
};

const renderReference = () => {
  const dialog = document.querySelector('#scrollDialog');
  const preview = document.querySelector('#spellPreview');
  if (!dialog?.open || !preview) return;

  captureAutomaticSummary();
  const ruleset = currentRuleset();
  const spellName = selectedSpellName();
  const custom = document.querySelector('#scrollSpell')?.value === 'Other Cleric Spell…';
  const reference = references.get(referenceKey(ruleset, spellName));

  let detail = '';
  if (custom) {
    detail = `<div class="spell-reference-effect"><b>Custom spell</b><p>The box records this name and note, but the DM must provide the complete effect, target, save or attack, duration, and concentration rules.</p></div>`;
  } else if (reference) {
    const concentration = /concentration/i.test(reference.duration);
    detail = `
      <div class="spell-reference-facts">
        <div><span>Casting time</span><strong>${esc(reference.castingTime)}</strong></div>
        <div><span>Range</span><strong>${esc(reference.range)}</strong></div>
        <div><span>Duration</span><strong>${esc(reference.duration)}</strong></div>
        <div><span>Components</span><strong>${esc(reference.components)}</strong></div>
      </div>
      <div class="spell-reference-tags">
        <span>${esc(reference.school || 'Spell')}</span>
        <span>${concentration ? 'Concentration required' : 'No concentration listed'}</span>
        <span>Exact ${esc(reference.level)}-level charge</span>
      </div>
      <div class="spell-reference-effect"><b>What happens when the box casts it</b><p>${esc(reference.description)}</p></div>
      <div class="spell-reference-source">${esc(reference.sourceReference)} · ${esc(reference.license)} · <a href="${esc(reference.sourceUrl)}" target="_blank" rel="noopener">Open licensed source</a></div>`;
  } else if (loadState === 'loading') {
    detail = `<div class="spell-reference-effect"><b>Loading the combat reference…</b><p>The automatic roll information below is ready now. The complete licensed spell record is still loading.</p></div>`;
  } else {
    detail = `<div class="spell-reference-effect"><b>Reference unavailable</b><p>The automatic result is still usable, but the shared SRD catalog could not be reached. Open Rules &amp; Cards from the DM Forge navigation for the full reference.</p></div>`;
  }

  const markup = `
    <article class="spell-reference-card" data-reference-key="${esc(referenceKey(ruleset, spellName))}">
      <header>
        <div><span>Cleric in a Box activation</span><strong>Free action · campaign artifact rule</strong></div>
        <span class="spell-reference-ruleset">${ruleset === '2024' ? '5.5e (2024)' : '5e (2014)'}</span>
      </header>
      <div class="spell-reference-automatic"><b>Automatic box result</b><p>${esc(automaticSummary || 'No automatic damage or healing roll. Use the complete effect below.')}</p></div>
      ${detail}
      <footer><b>No upcasting.</b> Spend only the exact-level divine charge shown. Targets, saves, attacks, duration, concentration, and ongoing effects still resolve as described.</footer>
    </article>`;

  if (markup === lastMarkup && preview.innerHTML === markup) return;
  lastMarkup = markup;
  preview.innerHTML = markup;
};

const scheduleRender = () => {
  window.setTimeout(() => {
    captureAutomaticSummary();
    renderReference();
  }, 0);
};

const loadReferences = async () => {
  try {
    const response = await fetch(REFERENCE_URL, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.spells)) throw new Error('Unsupported cleric spell reference schema.');
    payload.spells.forEach((spell) => references.set(referenceKey(spell.ruleset, spell.name), spell));
    loadState = 'ready';
  } catch (error) {
    console.error('[ClericBoxSpellReference] Could not load the shared SRD spell catalog', error);
    loadState = 'failed';
  }
  scheduleRender();
};

const bindReferenceEnhancement = () => {
  const dialog = document.querySelector('#scrollDialog');
  const select = document.querySelector('#scrollSpell');
  const custom = document.querySelector('#customSpell');
  const preview = document.querySelector('#spellPreview');
  if (!dialog || !select || !custom || !preview) return;

  select.addEventListener('change', scheduleRender);
  custom.addEventListener('input', scheduleRender);

  new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === 'attributes' && mutation.attributeName === 'open')) {
      automaticSummary = '';
      scheduleRender();
    }
  }).observe(dialog, { attributes: true });

  new MutationObserver(() => {
    if (preview.childElementCount === 0 && preview.textContent.trim()) scheduleRender();
  }).observe(preview, { childList: true, subtree: true, characterData: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindReferenceEnhancement, { once: true });
} else {
  bindReferenceEnhancement();
}

loadReferences();
