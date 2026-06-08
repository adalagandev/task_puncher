# SessionEnd hook: auto-write the rule-9 "where I left off" note to PLAN.md when a session
# ends, so closing a session stops being a manual prompt every time (TP-029). SessionEnd (not
# Stop) is the right event — Stop fires after every assistant turn and would spam the log.
# Mirrors pr-review.ps1: a fast dispatcher hands off to a detached worker that runs a local
# headless `claude -p` to summarize the transcript, then splices the note into PLAN.md.
[CmdletBinding()]
param(
  [switch]$Worker,            # internal: set on the detached background pass
  [switch]$DryRun,            # print the note instead of writing PLAN.md (for testing)
  [string]$TranscriptPath,    # path to the session transcript JSONL
  [string]$RepoDir
)

$ErrorActionPreference = 'Stop'
# Script lives in <repo>\.claude\hooks, so the repo root is two levels up.
$repo = if ($RepoDir) { $RepoDir } else { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
$log  = Join-Path $repo '.claude\session-end-note.log'
function Write-Log($m) { "$(Get-Date -Format o)  $m" | Out-File -FilePath $log -Append -Encoding utf8 }

if (-not $Worker) {
  # Dispatcher: runs synchronously as the session closes, so it must stay fast and never throw.
  # It reads the hook's stdin JSON for the transcript path, then hands off to a detached worker
  # so the slow LLM summary can't delay the session exit.
  try {
    $raw = [Console]::In.ReadToEnd()
    $data = $raw | ConvertFrom-Json
    $tp = $data.transcript_path
    if (-not $tp -or -not (Test-Path $tp)) { exit 0 }
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $repo `
      -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath,
        '-Worker', '-TranscriptPath', $tp, '-RepoDir', $repo)
  } catch { try { Write-Log "Dispatcher: $_" } catch { } }  # log but never let a hiccup block exit
  exit 0
}

# Worker: detached, does the slow work. Everything is wrapped so a failure only lands in the
# log, never anywhere the user's workflow can see it.
try {
  Set-Location $repo
  if (-not $TranscriptPath -or -not (Test-Path $TranscriptPath)) { Write-Log "No transcript at '$TranscriptPath'."; exit 0 }

  # Extract just the user + assistant text from the JSONL transcript (one message per line);
  # tool_use/tool_result blocks are skipped so the summary input stays lean.
  $sb = New-Object System.Text.StringBuilder
  foreach ($line in [System.IO.File]::ReadLines($TranscriptPath)) {
    if (-not $line.Trim()) { continue }
    try { $rec = $line | ConvertFrom-Json } catch { continue }
    $msg = $rec.message
    if (-not $msg) { continue }
    $role = $msg.role
    if ($role -ne 'user' -and $role -ne 'assistant') { continue }
    $text = ''
    if ($msg.content -is [string]) { $text = $msg.content }
    else { foreach ($block in $msg.content) { if ($block.type -eq 'text' -and $block.text) { $text += $block.text + "`n" } } }
    $text = $text.Trim()
    if (-not $text) { continue }
    [void]$sb.AppendLine("[$role] $text")
  }
  $convo = $sb.ToString()

  # Guard: skip trivial sessions (e.g. a bare /clear with no real work) so the log stays meaningful.
  if ($convo.Length -lt 500) { Write-Log "Session too small ($($convo.Length) chars); no note written."; exit 0 }
  # Keep the tail if the session is very long — the most recent work is what "where I left off" needs.
  if ($convo.Length -gt 80000) { $convo = $convo.Substring($convo.Length - 80000) }

  $claude = Get-Command claude -ErrorAction SilentlyContinue
  if (-not $claude) { Write-Log 'claude CLI not on PATH; skipping.'; exit 0 }

  $today = (Get-Date).ToString('yyyy-MM-dd')
  $instruction = @"
You are a text summarizer. The full session transcript is piped to you on stdin. Based ONLY on
that transcript, output EXACTLY ONE markdown bullet for this repo's PLAN.md rule-9 "where I left
off" log — and nothing else. Do NOT use any tools, do NOT run commands, do NOT read files, and
do NOT ask any questions; everything you need is already on stdin. Use this shape:

- **$today (session end)** — <what was accomplished this session; the state at session end
  (current branch, whether commits/PRs were pushed/merged, any open PRs); and the concrete
  next steps for the following session>.

Keep it to 2-5 sentences in the same terse, specific voice as the existing log entries: name
ticket IDs (e.g. TP-029) and PR numbers where relevant, and bold key phrases with **...**.
Output only the bullet — no preamble, no closing remarks, no code fence.
"@

  # Force UTF-8 on the pipe to/from the node CLI; PS 5.1 otherwise decodes claude's stdout with
  # the OEM codepage and turns em-dashes etc. into mojibake. No `2>&1` — merging a native exe's
  # stderr on PS 5.1 wraps lines in error records and can corrupt the output.
  $prevOut = [Console]::OutputEncoding; $prevIn = [Console]::InputEncoding
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  [Console]::InputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
  # Run from a neutral dir so this repo's own hooks — including THIS SessionEnd hook — don't fire
  # on the headless call, which would otherwise recurse.
  Push-Location $env:TEMP
  $note = ($convo | & $claude.Source -p $instruction --model sonnet | Out-String)
  Pop-Location
  [Console]::OutputEncoding = $prevOut; [Console]::InputEncoding = $prevIn

  $note = $note.Trim()
  if (-not $note) { Write-Log 'Empty note from claude; nothing written.'; exit 0 }
  if ($note -notmatch '^\s*-\s') { $note = "- $note" }   # ensure it *starts* as a bullet ($note is trimmed)
  $note = ($note -replace "`r`n", "`n") -replace "`n", "`r`n"  # normalize to the file's CRLF

  if ($DryRun) { Write-Log "DRY RUN - note follows:`n$note"; Write-Output $note; exit 0 }

  # Splice the note in right after the "newest first" marker so it becomes the top (newest) entry.
  $planPath = Join-Path $repo 'PLAN.md'
  $plan = [System.IO.File]::ReadAllText($planPath, [System.Text.Encoding]::UTF8)
  $marker = 'Where I left off (rule 9), newest first.'
  $idx = $plan.IndexOf($marker)
  $nlIdx = if ($idx -ge 0) { $plan.IndexOf("`n", $idx) } else { -1 }
  if ($idx -lt 0 -or $nlIdx -lt 0) {
    # Marker missing, or it's the final line with no trailing newline — append after the end
    # (guards the off-by-one where IndexOf returns -1 and we'd otherwise prepend at position 0).
    if ($idx -lt 0) { Write-Log 'Marker not found in PLAN.md; appending to end instead.' }
    $plan = $plan.TrimEnd() + "`r`n$note`r`n"
  } else {
    $insertAt = $nlIdx + 1   # just after the marker line
    $plan = $plan.Substring(0, $insertAt) + "$note`r`n" + $plan.Substring($insertAt)
  }
  # Write UTF-8 *without* BOM so PLAN.md doesn't grow a stray leading glyph.
  [System.IO.File]::WriteAllText($planPath, $plan, (New-Object System.Text.UTF8Encoding($false)))
  Write-Log 'Appended session-end note to PLAN.md.'
} catch {
  Write-Log "ERROR: $_"
}
