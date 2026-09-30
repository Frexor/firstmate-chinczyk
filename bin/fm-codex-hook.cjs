#!/usr/bin/env node
// Portable transport for tracked Codex hooks. Codex inherits a Windows PATH
// that may omit Git Bash even when Git for Windows is installed.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const events = new Map([
  ['fm-sessionstart-run.sh', 'SessionStart'],
  ['fm-arm-pretool-check.sh', 'PreToolUse'],
  ['fm-cd-pretool-check.sh', 'PreToolUse'],
  ['fm-turnend-guard.sh', 'Stop'],
]);
const script = process.argv[2];
if (!events.has(script)) process.exit(1);

const payload = fs.readFileSync(0, 'utf8');
if (!payload) process.exit(0);

const root = process.cwd();
const hooksPath = path.join(root, '.codex', 'hooks.json');
const scriptPath = path.join(root, 'bin', script);
if (!fs.existsSync(path.join(root, 'AGENTS.md')) ||
    !fs.existsSync(hooksPath) || !fs.existsSync(scriptPath)) process.exit(0);

let hooks;
try {
  hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
} catch {
  process.exit(0);
}
const registered = hooks?.hooks?.[events.get(script)]?.some(group =>
  group.hooks?.some(hook => typeof hook.command === 'string' && hook.command.includes(script)));
if (!registered) process.exit(0);

let bash = 'bash';
if (process.platform === 'win32') {
  const candidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Git', 'bin', 'bash.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'bin', 'bash.exe'),
  ].filter(Boolean);
  bash = candidates.find(candidate => fs.existsSync(candidate)) || bash;
}

const result = spawnSync(bash, [`bin/${script}`], {
  cwd: root,
  input: payload,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
