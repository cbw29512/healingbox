import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../dmforge-adapter.js', import.meta.url), 'utf8');

// Room fixtures retain the adapter's persisted schema; no game rules are simulated.
function harness(room = null) {
  const nodes = new Map([['campaign', { value: 'Audit' }]]);
  const listeners = new Map();
  const scheduled = [];
  const errors = [];
  const calls = { ensure: 0, room: 0, fail: false };
  const remember = node => nodes.set(node.id, node);
  nodes.set('app', { parentNode: { insertBefore: remember } });
  const emit = () => listeners.get('dmforge:store-changed')?.();
  const root = {
    localStorage: { getItem: () => JSON.stringify(room) },
    addEventListener: (type, listener) => listeners.set(type, listener),
    setInterval: callback => scheduled.push(callback),
    setTimeout: callback => scheduled.push(callback),
    DMForgeStore: {
      getActiveCampaign: () => ({ name: 'Audit' }),
      ensureCampaign: () => {
        calls.ensure += 1;
        if (calls.fail) throw new Error('Store unavailable');
        assert.ok(calls.ensure < 10, 'store events must not recurse');
        emit();
      },
      setActiveCampaign: emit,
      syncHealingRoom: () => {
        calls.room += 1;
        assert.ok(calls.room < 10, 'room updates must not recurse');
        emit();
      },
    },
  };
  const document = {
    getElementById: id => nodes.get(id) || null,
    createElement: () => ({}),
    head: { append: remember },
    addEventListener: () => {},
  };
  try {
    vm.runInNewContext(source, {
      ...root, document, URLSearchParams,
      location: { search: room ? '?host=AUDIT1' : '' },
      console: { error: (...args) => errors.push(args) },
    });
    return { sync: scheduled[0], nodes, calls, errors };
  } catch (error) {
    console.error('[adapter-test] Could not initialize fixture', error);
    throw error;
  }
}

test('campaign creation ignores its own synchronous store-change event', () => {
  const h = harness();
  h.sync();
  assert.equal(h.calls.ensure, 1);
  assert.equal(h.errors.length, 0);
  h.sync();
  assert.equal(h.calls.ensure, 2);
});

test('room sync writes once per changed summary and refreshes remaining charges', () => {
  const room = { campaign: 'Audit', level: 1, ruleset: '2014', charges: [{ spent: false }, { spent: false }] };
  const h = harness(room);
  h.sync();
  h.sync();
  assert.equal(h.calls.room, 1);
  room.charges[0].spent = true;
  h.sync();
  assert.equal(h.calls.room, 2);
  assert.match(h.nodes.get('dmforgeHealingContext').innerHTML, /1 charges remaining/);
  assert.equal(h.errors.length, 0);
});

test('a failed store write logs clearly and releases the synchronization guard', () => {
  const h = harness();
  h.calls.fail = true;
  h.sync();
  assert.equal(h.errors.length, 1);
  assert.match(h.errors[0][0], /Campaign synchronization failed/);
  h.calls.fail = false;
  h.sync();
  assert.equal(h.calls.ensure, 2);
});
