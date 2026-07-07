# 聚会卡堂 一键开服脚本：启动游戏服务器 + 公网隧道，生成可分享链接
$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ''
Write-Host '  ================ 聚会卡堂 · 开服 ================' -ForegroundColor Yellow

# 1. 清理旧进程
Get-Process bore -ErrorAction SilentlyContinue | Stop-Process -Force
$old = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($old) { Stop-Process -Id $old.OwningProcess -Force -ErrorAction SilentlyContinue; Start-Sleep 1 }

# 2. 启动游戏服务器
Start-Process node -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Minimized
Start-Sleep 2
Write-Host '  [1/2] 游戏服务器已启动 (端口 3000)' -ForegroundColor Green

# 3. 启动公网隧道 (bore.pub 免费)
$log = Join-Path $env:TEMP 'katong_bore.log'
Remove-Item $log -Force
Start-Process "$root\tools\bore\bore.exe" -ArgumentList 'local','3000','--to','bore.pub' `
  -RedirectStandardOutput $log -WindowStyle Hidden
$url = $null
for ($i = 0; $i -lt 25; $i++) {
  Start-Sleep 1
  $m = Select-String -Path $log -Pattern 'bore\.pub:(\d+)'
  if ($m) { $url = 'http://bore.pub:' + $m.Matches[0].Groups[1].Value; break }
}

# 4. 局域网地址
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.1[6-9].*' -or $_.IPAddress -like '172.2*.*'
} | Select-Object -First 1).IPAddress

Write-Host ''
if ($url) {
  Write-Host '  [2/2] 公网隧道已连接！' -ForegroundColor Green
  Write-Host ''
  Write-Host '  ★ 公网链接（发给任何地方的朋友，手机浏览器直接打开）：' -ForegroundColor Cyan
  Write-Host "        $url" -ForegroundColor Yellow
  Write-Host ''
  Write-Host '    注意：每次开服端口会变化，重新分享新链接即可。' -ForegroundColor DarkGray
} else {
  Write-Host '  [2/2] 公网隧道连接失败（bore.pub 暂时不可用），可稍后重试' -ForegroundColor Red
}
if ($ip) {
  Write-Host ''
  Write-Host '  ★ 局域网链接（同一 WiFi 的朋友用这个，更快更稳）：' -ForegroundColor Cyan
  Write-Host "        http://${ip}:3000" -ForegroundColor Yellow
}
Write-Host ''
Write-Host '  本机游玩:  http://localhost:3000'
Write-Host '  ------------------------------------------------'
Write-Host '  保持此窗口开启，关闭窗口即停服。' -ForegroundColor DarkGray
Write-Host ''
Read-Host '  按回车键停止服务器并退出'

# 停服清理
Get-Process bore -ErrorAction SilentlyContinue | Stop-Process -Force
$srv = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($srv) { Stop-Process -Id $srv.OwningProcess -Force -ErrorAction SilentlyContinue }
Write-Host '  已停服，再见！'
Start-Sleep 1
