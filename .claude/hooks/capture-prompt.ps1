# UserPromptSubmit hook: append each submitted prompt to the active prompt log.
# Self-rolling per rule 12: writes to the highest-numbered prompt_history*.csv and
# rolls to the next index once the active file reaches 100 records, so the rollover
# is automatic instead of a manual chore.
$ErrorActionPreference = 'Stop'

$raw = [Console]::In.ReadToEnd()
try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$prompt = $data.prompt
if ($null -eq $prompt -or $prompt -eq '') { exit 0 }

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$rollThreshold = 100

# prompt_history.csv is index 1; prompt_history_N.csv is index N. Build the file path
# for a given index so naming stays consistent across the base and numbered files.
function Path-ForIndex([int]$i) {
  if ($i -le 1) { return (Join-Path $root 'prompt_history.csv') }
  return (Join-Path $root ("prompt_history_{0}.csv" -f $i))
}

# Count data rows by matching the leading quoted ISO timestamp, so prompts that
# contain embedded newlines don't inflate the count (and the header is skipped).
function Count-Records([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  $n = 0
  foreach ($line in [System.IO.File]::ReadLines($path)) {
    if ($line -match '^"\d{4}-\d\d-\d\d') { $n++ }
  }
  return $n
}

# The active log is the highest existing index; default to 1 when none exist yet.
$maxIdx = 1
foreach ($f in (Get-ChildItem -LiteralPath $root -Filter 'prompt_history*.csv' -ErrorAction SilentlyContinue)) {
  $idx = 0
  if ($f.Name -eq 'prompt_history.csv') { $idx = 1 }
  elseif ($f.Name -match '^prompt_history_(\d+)\.csv$') { $idx = [int]$Matches[1] }
  if ($idx -gt $maxIdx) { $maxIdx = $idx }
}

# Roll to the next file once the active one is full (rule 12).
$csv = Path-ForIndex $maxIdx
if ((Count-Records $csv) -ge $rollThreshold) {
  $csv = Path-ForIndex ($maxIdx + 1)
}

$ts  = (Get-Date).ToString('o')
$sid = $data.session_id

function Esc($s) { '"' + (([string]$s) -replace '"', '""') + '"' }

if (-not (Test-Path $csv)) {
  Add-Content -Path $csv -Value 'timestamp,session_id,prompt' -Encoding utf8
}

$line = (Esc $ts) + ',' + (Esc $sid) + ',' + (Esc $prompt)
Add-Content -Path $csv -Value $line -Encoding utf8
exit 0
