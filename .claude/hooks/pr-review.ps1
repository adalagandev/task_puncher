# Local auto code-review for PRs opened with `gh pr create` inside a Claude Code session.
# Wired as a PostToolUse(Bash) hook: when the just-run command is a `gh pr create`, a
# detached worker runs the committed code-reviewer rubric through a local headless
# `claude -p` and posts the result as a PR comment. Uses on-machine Claude credentials,
# so no Anthropic key ever goes to GitHub.
[CmdletBinding()]
param(
  [switch]$Worker,        # internal: set on the detached background pass
  [switch]$DryRun,        # print the review instead of posting it (for testing)
  [int]$PrNumber = 0,
  [string]$RepoDir
)

$ErrorActionPreference = 'Stop'
# Script lives in <repo>\.claude\hooks, so the repo root is two levels up.
$repo = if ($RepoDir) { $RepoDir } else { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
$log  = Join-Path $repo '.claude\pr-review.log'
function Write-Log($m) { "$(Get-Date -Format o)  $m" | Out-File -FilePath $log -Append -Encoding utf8 }

if (-not $Worker) {
  # Dispatcher: runs synchronously inside the hook, so it must stay fast and never fail
  # the user's command. It only reacts to `gh pr create`, then hands off to a detached
  # worker so the slow review can't stall the session.
  try {
    $raw = [Console]::In.ReadToEnd()
    if ($raw -notmatch 'gh\s+pr\s+create') { exit 0 }
    $pr = 0
    if ($raw -match 'pull/(\d+)') { $pr = [int]$Matches[1] }  # PR number from gh's output URL
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $repo `
      -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath,
        '-Worker', '-PrNumber', $pr, '-RepoDir', $repo)
  } catch { }
  exit 0
}

# Worker: detached, does the actual (slow) review work. Everything is wrapped so a failure
# only lands in the log, never anywhere the user's workflow can see it.
try {
  Set-Location $repo
  if ($PrNumber -le 0) { $PrNumber = [int](& gh pr view --json number --jq '.number') }
  $base = (& gh pr view $PrNumber --json baseRefName --jq '.baseRefName')
  if (-not $base) { $base = 'main' }
  Write-Log "Reviewing PR #$PrNumber (base $base)"

  & git fetch origin $base --quiet
  $diff = (& git diff "origin/$base...HEAD" | Out-String)
  if (-not $diff.Trim()) { Write-Log 'Empty diff; nothing to review.'; exit 0 }

  $claude = Get-Command claude -ErrorAction SilentlyContinue
  if (-not $claude) { Write-Log 'claude CLI not on PATH; skipping.'; exit 0 }

  # Reuse the committed reviewer rubric as the system prompt (strip its YAML frontmatter).
  $rubric = (Get-Content (Join-Path $repo '.claude\agents\code-reviewer.md') -Raw) -replace '(?s)^---.*?---\s*', ''
  $instruction = 'Review ONLY the unified diff provided on stdin. Do not run any commands or read other files. Output the review in the format described in your instructions.'

  # Force UTF-8 on the pipe to/from the node CLI; PS 5.1 otherwise decodes claude's stdout
  # with the OEM codepage and turns em-dashes etc. into mojibake. No `2>&1` — merging a
  # native exe's stderr on PS 5.1 wraps lines in error records and can corrupt the output.
  $prevOut = [Console]::OutputEncoding; $prevIn = [Console]::InputEncoding
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  [Console]::InputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
  # Run from a neutral dir so this project's own hooks don't fire on the headless call.
  Push-Location $env:TEMP
  $review = ($diff | & $claude.Source -p $instruction --model sonnet --append-system-prompt $rubric | Out-String)
  Pop-Location
  [Console]::OutputEncoding = $prevOut; [Console]::InputEncoding = $prevIn
  if (-not $review.Trim()) { Write-Log 'Empty review output; not posting.'; exit 0 }

  $body = "**Automated local code review** (code-reviewer, sonnet) - generated locally on this machine, not in CI.`n`n$review"
  if ($DryRun) { Write-Log "DRY RUN - review follows:`n$body"; Write-Output $body; exit 0 }

  # Write UTF-8 *without* BOM — Out-File -Encoding utf8 on PS 5.1 prepends a BOM that shows
  # up as a stray glyph at the top of the posted comment.
  $tmp = Join-Path $env:TEMP "pr-review-$PrNumber.md"
  [System.IO.File]::WriteAllText($tmp, $body, (New-Object System.Text.UTF8Encoding($false)))
  & gh pr comment $PrNumber --body-file $tmp
  Remove-Item $tmp -ErrorAction SilentlyContinue
  Write-Log "Posted review to PR #$PrNumber"
} catch {
  Write-Log "ERROR: $_"
}
