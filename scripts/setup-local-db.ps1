$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Node.js is required. Install a supported Node.js LTS release first.' }
$securePassword = Read-Host 'Enter the PostgreSQL postgres password you chose during installation (hidden)' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $env:TINO_SETUP_POSTGRES_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    & $nodePath (Join-Path $PSScriptRoot 'setup-local-db.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Database setup did not finish. No credentials were printed. Check the message above.' }
} finally {
    Remove-Item Env:TINO_SETUP_POSTGRES_PASSWORD -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $securePassword.Dispose()
}
