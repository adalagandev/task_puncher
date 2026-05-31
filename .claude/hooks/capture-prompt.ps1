# UserPromptSubmit hook: append each submitted prompt to prompt_history.csv
$ErrorActionPreference = 'Stop'

$raw = [Console]::In.ReadToEnd()
try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$prompt = $data.prompt
if ($null -eq $prompt -or $prompt -eq '') { exit 0 }

$csv = Join-Path $PSScriptRoot '..\..\prompt_history.csv'
$ts  = (Get-Date).ToString('o')
$sid = $data.session_id

function Esc($s) { '"' + (([string]$s) -replace '"', '""') + '"' }

if (-not (Test-Path $csv)) {
  Add-Content -Path $csv -Value 'timestamp,session_id,prompt' -Encoding utf8
}

$line = (Esc $ts) + ',' + (Esc $sid) + ',' + (Esc $prompt)
Add-Content -Path $csv -Value $line -Encoding utf8
exit 0
