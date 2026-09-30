#!/usr/bin/env bash
set -eu

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
node - "$ROOT/bin/fm-herdr-current-codex.cjs" <<'JS'
const assert = require('node:assert/strict');
const { verify } = require(process.argv[2]);
const env = {
  HERDR_ENV: '1', HERDR_PANE_ID: 'w1:p1', HERDR_SESSION: 'firstmate',
  HERDR_SOCKET_PATH: '/tmp/herdr.sock', CODEX_SESSION_ID: 'session-1'
};
const pane = {
  pane_id: 'w1:p1', agent: 'codex',
  agent_session: { agent: 'codex', kind: 'id', source: 'herdr:codex', value: 'session-1' }
};
const info = {
  pane_id: 'w1:p1',
  foreground_processes: [{ pid: 123, argv: ['node', '/npm/@openai/codex/bin/codex.js'] }]
};
assert.equal(verify(pane, info, env), '123 session-1');
assert.equal(verify({ ...pane, pane_id: 'w1:p2' }, info, env), null);
assert.equal(verify({ ...pane, agent_session: { ...pane.agent_session, value: 'other' } }, info, env), null);
assert.equal(verify(pane, { ...info, foreground_processes: [{ pid: 123, argv: ['node', 'unrelated.js'] }] }, env), null);
assert.equal(verify(pane, info, { ...env, HERDR_ENV: '0' }), null);
console.log('Herdr Codex session proof: pass');
JS
