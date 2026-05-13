param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$RemoteHost = "ubuntu@wingxtra.com",
    [string]$SshKey = "$env:USERPROFILE\.ssh\wingxtra_delivery_oracle_ed25519",
    [string]$RemoteDir = "/opt/wingxtra-store",
    [string]$ImageName = "wingxtra-store",
    [string]$ContainerName = "wingxtra-store-web",
    [int]$HostPort = 8090,
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

$archive = Join-Path $env:TEMP ("wingxtra-store-production-" + (Get-Date -Format "yyyyMMddHHmmss") + ".tar.gz")
if (Test-Path -LiteralPath $archive) {
    Remove-Item -LiteralPath $archive -Force
}

$tarArgs = @(
    "--exclude=.git",
    "--exclude=.env",
    "--exclude=.env.local",
    "--exclude=.env.production",
    "--exclude=node_modules",
    "--exclude=dist",
    "--exclude=*.tsbuildinfo",
    "--exclude=.tmp-*",
    "-czf",
    $archive,
    "-C",
    $RepoRoot,
    "."
)

Write-Host ">> Creating deploy archive without secrets or build output"
& tar @tarArgs
if ($LASTEXITCODE -ne 0) {
    throw "tar failed with exit code $LASTEXITCODE"
}

$archiveEntries = & tar -tzf $archive
$blockedEntries = $archiveEntries | Where-Object {
    $_ -match '(^|/)\.env$' -or
    $_ -match 'node_modules' -or
    $_ -match '(^|/)dist(/|$)'
}
if ($blockedEntries) {
    $blockedEntries | ForEach-Object { Write-Error "Blocked deploy archive entry: $_" }
    throw "Deploy archive contains protected files. Refusing to continue."
}

$remoteArchive = "/tmp/" + [IO.Path]::GetFileName($archive)
Write-Host ">> Uploading archive to ${RemoteHost}:$remoteArchive"
& scp -i $SshKey -o StrictHostKeyChecking=accept-new $archive "${RemoteHost}:${remoteArchive}"
if ($LASTEXITCODE -ne 0) {
    throw "scp failed with exit code $LASTEXITCODE"
}

$remoteScript = @'
set -euo pipefail
APP_DIR='__REMOTE_DIR__'
ARCHIVE='__REMOTE_ARCHIVE__'
IMAGE='__IMAGE_NAME__'
CONTAINER='__CONTAINER_NAME__'
HOST_PORT='__HOST_PORT__'

sudo mkdir -p "$APP_DIR"
if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: $APP_DIR/.env is missing. Create it from .env.production.example before deploying." >&2
  exit 20
fi

ENV_SIZE_BEFORE=$(sudo stat -c%s "$APP_DIR/.env")
if [ "$ENV_SIZE_BEFORE" -lt 100 ]; then
  echo "ERROR: production .env looks too small ($ENV_SIZE_BEFORE bytes)." >&2
  exit 21
fi

TS=$(date +%Y%m%d%H%M%S)
if [ -d "$APP_DIR" ] && [ "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
  sudo cp -a "$APP_DIR" "$APP_DIR.predeploy-$TS"
fi

sudo tar -xzf "$ARCHIVE" -C "$APP_DIR"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: .env disappeared after extraction." >&2
  exit 22
fi

ENV_SIZE_AFTER=$(sudo stat -c%s "$APP_DIR/.env")
if [ "$ENV_SIZE_AFTER" != "$ENV_SIZE_BEFORE" ]; then
  echo "ERROR: .env changed during deploy." >&2
  exit 23
fi

sudo chmod 600 "$APP_DIR/.env"
cd "$APP_DIR"

TMP_ENV="/tmp/wingxtra-store-env-$$"
sudo cat "$APP_DIR/.env" > "$TMP_ENV"
chmod 600 "$TMP_ENV"

set -a
. "$TMP_ENV"
set +a

sudo docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_SUPABASE_ANON_KEY="$VITE_SUPABASE_SUPABASE_ANON_KEY" \
  --build-arg VITE_PAYSTACK_PUBLIC_KEY="$VITE_PAYSTACK_PUBLIC_KEY" \
  --build-arg VITE_SITE_URL="${VITE_SITE_URL:-https://shop.wingxtra.com}" \
  --build-arg VITE_RATE_GHS_TO_NGN="${VITE_RATE_GHS_TO_NGN:-120}" \
  --build-arg VITE_RATE_GHS_TO_USD="${VITE_RATE_GHS_TO_USD:-0.08}" \
  -t "$IMAGE:latest" .
sudo docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
sudo docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --env-file "$APP_DIR/.env" \
  -p "127.0.0.1:$HOST_PORT:80" \
  "$IMAGE:latest"

rm -f "$TMP_ENV"

for attempt in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$HOST_PORT/health" >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" = "20" ]; then
    echo "ERROR: store health check failed." >&2
    sudo docker logs --tail=120 "$CONTAINER" >&2
    exit 24
  fi
  echo "Waiting for store health ($attempt/20)..."
  sleep 2
done

curl -fsS -H "Host: shop.wingxtra.com" "http://127.0.0.1:$HOST_PORT/health"
sudo docker ps --filter "name=$CONTAINER"
'@

$remoteScript = $remoteScript.
    Replace('__REMOTE_DIR__', $RemoteDir).
    Replace('__REMOTE_ARCHIVE__', $remoteArchive).
    Replace('__IMAGE_NAME__', $ImageName).
    Replace('__CONTAINER_NAME__', $ContainerName).
    Replace('__HOST_PORT__', [string]$HostPort)

Write-Host ">> Running remote deployment"
$remoteScript | & ssh -i $SshKey -o StrictHostKeyChecking=accept-new $RemoteHost "bash -s"
if ($LASTEXITCODE -ne 0) {
    throw "remote deployment failed with exit code $LASTEXITCODE"
}

Write-Host "Deployment complete. Nginx and DNS can now point shop.wingxtra.com to 127.0.0.1:$HostPort on the VPS."
