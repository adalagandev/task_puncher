# SessionStart hook: inject whats_up_claude.md into Claude's context at the start of
# every session, so the working rules load automatically instead of relying on Claude
# remembering to read them (deterministic harness execution, not a probabilistic step).
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$rules = Join-Path $root 'whats_up_claude.md'
if (-not (Test-Path $rules)) { exit 0 }

# Emit the file body as additionalContext; ConvertTo-Json escapes newlines/quotes so the
# multi-line markdown survives intact as a single JSON string. ReadAllText returns a plain
# string (no provider note-properties) and decodes UTF-8 correctly, which Get-Content -Raw
# does not on Windows PowerShell 5.1.
$content = [System.IO.File]::ReadAllText($rules, [System.Text.Encoding]::UTF8)
$payload = @{
  hookSpecificOutput = @{
    hookEventName     = 'SessionStart'
    additionalContext = $content
  }
}
$payload | ConvertTo-Json -Depth 5 -Compress
exit 0
