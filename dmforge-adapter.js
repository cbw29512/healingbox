(function connectHealingBoxToDMForge(root) {
  'use strict';

  const hubUrl = '/monstercardforge/campaigns.html';
  let lastRoomSnapshot = '';

  function ensureStyles() {
    if (document.getElementById('dmforgeHealingContextStyles')) return;
    const link = document.createElement('link');
    link.id = 'dmforgeHealingContextStyles';
    link.rel = 'stylesheet';
    link.href = 'dmforge-adapter.css';
    document.head.append(link);
  }

  function readRoom(code) {
    try {
      return JSON.parse(root.localStorage?.getItem(`cleric-box-${code}`) || 'null');
    } catch (error) {
      console.error('[HealingBoxAdapter] Could not read room state', error);
      return null;
    }
  }

  function roomCode() {
    return (new URLSearchParams(location.search).get('host') || '').toUpperCase();
  }

  function requestedCampaign() {
    return new URLSearchParams(location.search).get('campaign')?.trim().slice(0, 100) || '';
  }

  function prefillCampaign() {
    const input = document.getElementById('campaign');
    if (!input) return;
    const requested = requestedCampaign();
    const active = root.DMForgeStore?.getActiveCampaign();
    const name = requested || active?.name;
    if (name && (!input.value || input.value === 'My Campaign')) input.value = name;
  }

  function renderContext(roomState = null) {
    const store = root.DMForgeStore;
    if (!store) return;
    ensureStyles();
    let bar = document.getElementById('dmforgeHealingContext');
    if (!bar) {
      bar = document.createElement('section');
      bar.id = 'dmforgeHealingContext';
      bar.className = 'shared-healing-context no-print';
      const app = document.getElementById('app');
      app?.parentNode?.insertBefore(bar, app);
    }
    const active = store.getActiveCampaign();
    const localName = roomState?.campaign || requestedCampaign() || document.getElementById('campaign')?.value || active?.name || 'My Campaign';
    const mismatch = active && active.name.toLocaleLowerCase() !== String(localName).toLocaleLowerCase();
    bar.innerHTML = `<div><b>DM Forge Campaign:</b> ${escapeHtml(active?.name || localName)}${roomState ? `<span>${escapeHtml(localName)} · Room ${escapeHtml(roomCode())} · ${roomState.charges.filter((charge) => !charge.spent).length} charges remaining</span>` : '<span>Create this artifact inside the active shared campaign.</span>'}</div><div>${mismatch ? '<button type="button" class="btn ghost" id="makeHealingCampaignActive">Use This Campaign Everywhere</button>' : ''}<a class="btn ghost" href="${hubUrl}">Campaign Hub</a></div>`;
    const button = document.getElementById('makeHealingCampaignActive');
    if (button) button.onclick = () => {
      store.ensureCampaign(localName, { source: 'cleric-in-a-box', ruleset: roomState?.ruleset });
      store.setActiveCampaign(localName);
      renderContext(roomState);
    };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function sync() {
    const store = root.DMForgeStore;
    if (!store) return;
    prefillCampaign();
    const code = roomCode();
    const roomState = code ? readRoom(code) : null;
    if (code && roomState) {
      const snapshot = JSON.stringify({
        campaign: roomState.campaign,
        level: roomState.level,
        ruleset: roomState.ruleset,
        remaining: roomState.charges?.filter((charge) => !charge.spent).length
      });
      if (snapshot !== lastRoomSnapshot) {
        store.syncHealingRoom(code, roomState);
        lastRoomSnapshot = snapshot;
      }
      renderContext(roomState);
      return;
    }
    const name = requestedCampaign() || store.getActiveCampaign()?.name || document.getElementById('campaign')?.value || 'My Campaign';
    store.ensureCampaign(name, { source: 'cleric-in-a-box' });
    if (!store.getActiveCampaign()) store.setActiveCampaign(name);
    renderContext();
  }

  document.addEventListener('input', (event) => {
    if (event.target?.id === 'campaign') root.setTimeout(sync, 200);
  }, true);
  root.addEventListener('storage', (event) => {
    if (event.key === root.DMForgeStore?.STORAGE_KEY || event.key?.startsWith('cleric-box-')) sync();
  });
  root.addEventListener('dmforge:store-changed', sync);
  root.setInterval(sync, 2000);
  root.setTimeout(sync, 0);
})(globalThis);
