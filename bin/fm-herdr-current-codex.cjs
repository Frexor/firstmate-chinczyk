#!/usr/bin/env node
// Print the native PID and session ID only when Herdr confirms this Codex pane.
const { execFileSync } = require('node:child_process');

function verify(pane, info, env) {
  const { HERDR_ENV, HERDR_PANE_ID, HERDR_SESSION, HERDR_SOCKET_PATH, CODEX_SESSION_ID } = env;
  if (HERDR_ENV !== '1' || !HERDR_PANE_ID || !HERDR_SESSION || !HERDR_SOCKET_PATH || !CODEX_SESSION_ID) return null;
  if (pane?.pane_id !== HERDR_PANE_ID || pane.agent !== 'codex' ||
      pane.agent_session?.agent !== 'codex' || pane.agent_session?.kind !== 'id' ||
      pane.agent_session?.source !== 'herdr:codex' ||
      pane.agent_session?.value !== CODEX_SESSION_ID ||
      info?.pane_id !== HERDR_PANE_ID) return null;
  const agents = info.foreground_processes?.filter(p =>
    /(^|[\\/])codex(?:\.exe|\.js)?$/i.test(p.argv?.[0] ?? '') ||
    p.argv?.some(arg => /[\\/]@openai[\\/]codex[\\/]bin[\\/]codex\.js$/i.test(arg)));
  if (agents?.length !== 1 || !Number.isSafeInteger(agents[0].pid) || agents[0].pid < 1) return null;
  return `${agents[0].pid} ${CODEX_SESSION_ID}`;
}

function read(args) {
  try {
    return JSON.parse(execFileSync('herdr', args, { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    process.exit(1);
  }
}

if (require.main === module) {
  const pane = read(['pane', 'current', '--current']).result?.pane;
  const info = read(['pane', 'process-info', '--current']).result?.process_info;
  const proof = verify(pane, info, process.env);
  if (!proof) process.exit(1);
  console.log(proof);
}

module.exports = { verify };
