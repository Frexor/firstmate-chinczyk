#!/usr/bin/env bash
set -eu

case "$(uname -s)" in
  MINGW*|MSYS*) ;;
  *) echo 'skip: live: Windows Git Bash required'; exit 0 ;;
esac

FM_TEST_SKIP_ORPHAN_REAP=1
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
fm_live_gate default-on FM_HERDR_WINDOWS_SESSION_LIVE herdr node
[ "${HERDR_ENV:-}" = 1 ] || { echo 'skip: live: no Herdr pane'; exit 0; }

proof=$(node "$ROOT/bin/fm-herdr-current-codex.cjs") || fail 'Herdr did not verify this Codex session'
pid=${proof%% *}
. "$ROOT/bin/fm-session-lock-lib.sh"
[ "$(fm_session_lock_anchor_pid)" = "$pid" ] || fail 'session anchor differs from the verified pane process'
[ "$("$ROOT/bin/fm-harness.sh")" = codex ] || fail 'harness detection differs from the verified pane'
pass 'Windows Herdr Codex session and process verified without a model turn'
