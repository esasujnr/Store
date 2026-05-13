param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$RemoteHost = "ubuntu@wingxtra.com",
    [string]$SshKey = "$env:USERPROFILE\.ssh\wingxtra_delivery_oracle_ed25519",
    [string]$RemoteStaticRoot = "/var/www/wingxtra-store",
    [switch]$SkipLocalBuild
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param([string]$Command, [string]$WorkingDirectory = $RepoRoot)
    Push-Location $WorkingDirectory
    try {
        Write-Host ">> $Command"
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code ${LASTEXITCODE}: $Command"
        }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path -LiteralPath $SshKey)) {
    throw "SSH key not found: $SshKey"
}

if (-not $SkipLocalBuild) {
    Invoke-Checked "npm run build"
}

$distPath = Join-Path $RepoRoot "dist"
if (-not (Test-Path -LiteralPath (Join-Path $distPath "index.html"))) {
    throw "dist/index.html not found. Run npm run build or omit -SkipLocalBuild."
}

$archive = Join-Path $env:TEMP ("wingxtra-store-static-" + (Get-Date -Format "yyyyMMddHHmmss") + ".tar.gz")
if (Test-Path -LiteralPath $archive) {
    Remove-Item -LiteralPath $archive -Force
}

Write-Host ">> Creating static deploy archive"
& tar -czf $archive -C $RepoRoot dist
if ($LASTEXITCODE -ne 0) {
    throw "tar failed with exit code $LASTEXITCODE"
}

$archiveEntries = & tar -tzf $archive
$blockedEntries = $archiveEntries | Where-Object {
    $_ -match '(^|/)\.env($|/)' -or
    $_ -match 'node_modules' -or
    $_ -notmatch '^dist/'
}
if ($blockedEntries) {
    $blockedEntries | ForEach-Object { Write-Error "Blocked deploy archive entry: $_" }
    throw "Deploy archive contains unexpected files. Refusing to continue."
}

$remoteArchive = "/tmp/" + [IO.Path]::GetFileName($archive)
Write-Host ">> Uploading static archive to ${RemoteHost}:$remoteArchive"
& scp -i $SshKey -o StrictHostKeyChecking=accept-new $archive "${RemoteHost}:${remoteArchive}"
if ($LASTEXITCODE -ne 0) {
    throw "scp failed with exit code $LASTEXITCODE"
}

$remoteScript = @'
set -euo pipefail
STATIC_ROOT='__REMOTE_STATIC_ROOT__'
ARCHIVE='__REMOTE_ARCHIVE__'
RELEASES="$STATIC_ROOT/releases"
CURRENT="$STATIC_ROOT/current"
TS=$(date +%Y%m%d%H%M%S)
RELEASE="$RELEASES/$TS"

sudo mkdir -p "$RELEASES"
sudo rm -rf "$RELEASE"
sudo mkdir -p "$RELEASE"
sudo tar -xzf "$ARCHIVE" -C "$RELEASE" --strip-components=1

if [ ! -f "$RELEASE/index.html" ]; then
  echo "ERROR: deployed release is missing index.html" >&2
  exit 30
fi

sudo chown -R www-data:www-data "$RELEASE" 2>/dev/null || true

if [ -e "$CURRENT" ] && [ ! -L "$CURRENT" ]; then
  sudo mv "$CURRENT" "$STATIC_ROOT/current.pre-static-$TS"
fi

sudo ln -sfn "$RELEASE" "$CURRENT"
sudo nginx -t
sudo systemctl reload nginx

grep -q "assets/index-" "$CURRENT/index.html"
curl -kfsS --resolve shop.wingxtra.com:443:127.0.0.1 "https://shop.wingxtra.com/healthz" >/dev/null
echo "Static deployment complete: $RELEASE"
'@

$remoteScript = $remoteScript.
    Replace('__REMOTE_STATIC_ROOT__', $RemoteStaticRoot).
    Replace('__REMOTE_ARCHIVE__', $remoteArchive)

Write-Host ">> Publishing static release"
$remoteScript | & ssh -i $SshKey -o StrictHostKeyChecking=accept-new $RemoteHost "bash -s"
if ($LASTEXITCODE -ne 0) {
    throw "static deployment failed with exit code $LASTEXITCODE"
}

Write-Host "Deployment complete. shop.wingxtra.com is serving the latest static release."
