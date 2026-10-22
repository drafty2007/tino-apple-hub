$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Open PowerShell using Run as administrator, then run this script again.'
}
$ruleName = 'TinoAppleHub-LocalWifi-3000'
if (-not (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name $ruleName -DisplayName 'TINO APPLE HUB local Wi-Fi preview' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -LocalAddress 172.20.10.2 -RemoteAddress LocalSubnet -InterfaceAlias 'Wi-Fi' -Program (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe') -Profile Any | Out-Null
}
Write-Output 'Phone access allowed on this Wi-Fi subnet. Open http://172.20.10.2:3000 on your phone.'
