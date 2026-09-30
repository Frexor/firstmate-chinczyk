param([Parameter(Mandatory)][string]$Target, [Parameter(Mandatory)][string]$Link)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Target -PathType Container)) { exit 1 }
if (Test-Path -LiteralPath $Link) { exit 1 }
New-Item -ItemType Junction -Path $Link -Target $Target | Out-Null
