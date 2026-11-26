<#
  Gives the development backend (everlasting-hills-church-backend) the same
  settings as the live API (ehc-backend-api): every environment variable,
  Secret Manager reference, service account, memory and CPU. Run it once, and
  again whenever a setting is added to the live API.

  Without these the container stops at start-up (missing DATABASE_URL and the
  rest), which Cloud Run reports as "failed to start and listen on the port".

  It also:
    - forces CRON_ENABLED=false (the live API's Cloud Scheduler jobs do that
      work against the same database), and
    - adds the develop website's address to CORS_EXTRA_ORIGINS so its browser
      calls are allowed.

  No value is ever printed. The copied settings sit in a temp file only while
  gcloud reads them, then it is deleted.

  Usage (after `gcloud auth login`):
    powershell -ExecutionPolicy Bypass -File ehc-backend\scripts\copy-env-to-dev-backend.ps1 `
      -DevFrontendUrl https://<develop-site>.run.app
#>
param(
  [Parameter(Mandatory = $true)][string]$DevFrontendUrl,
  [string]$Project = "everlasting-hills",
  [string]$Region = "europe-west1",
  [string]$From = "ehc-backend-api",
  [string]$To = "everlasting-hills-church-backend"
)
$ErrorActionPreference = "Stop"

$json = gcloud run services describe $From --region $Region --project $Project --format=json
if ($LASTEXITCODE -ne 0) { throw "Could not read $From in $Project/$Region. Check the project and region." }
$svc = $json | Out-String | ConvertFrom-Json
$spec = $svc.spec.template.spec
$container = $spec.containers[0]

$plain = [ordered]@{}
$secrets = @()
foreach ($e in @($container.env)) {
  if (-not $e) { continue }
  if ($e.valueFrom -and $e.valueFrom.secretKeyRef) {
    $secrets += "$($e.name)=$($e.valueFrom.secretKeyRef.name):$($e.valueFrom.secretKeyRef.key)"
  } elseif ($e.name -ne "PORT") {
    $plain[$e.name] = [string]$e.value
  }
}

$plain["CRON_ENABLED"] = "false"
$origins = @()
if ($plain.Contains("CORS_EXTRA_ORIGINS")) { $origins += ($plain["CORS_EXTRA_ORIGINS"] -split ",") | ForEach-Object { $_.Trim() } | Where-Object { $_ } }
$origins += $DevFrontendUrl.TrimEnd("/")
$plain["CORS_EXTRA_ORIGINS"] = (($origins | Select-Object -Unique) -join ",")

# JSON is valid YAML, and keeps multi-line values (keys, JSON blobs) intact.
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("dev-backend-env-" + [guid]::NewGuid() + ".yaml")
try {
  [IO.File]::WriteAllText($tmp, ($plain | ConvertTo-Json -Depth 3), (New-Object Text.UTF8Encoding($false)))

  $gcArgs = @("run", "services", "update", $To, "--region", $Region, "--project", $Project, "--env-vars-file", $tmp)
  if ($secrets.Count -gt 0) { $gcArgs += @("--set-secrets", ($secrets -join ",")) }
  if ($spec.serviceAccountName) { $gcArgs += @("--service-account", $spec.serviceAccountName) }
  $limits = $container.resources.limits
  if ($limits -and $limits.memory) { $gcArgs += @("--memory", $limits.memory) }
  if ($limits -and $limits.cpu) { $gcArgs += @("--cpu", $limits.cpu) }

  Write-Host "Copying $($plain.Count) settings and $($secrets.Count) secret references from $From to $To..."
  & gcloud @gcArgs
  if ($LASTEXITCODE -ne 0) { throw "gcloud could not update $To (see the message above)." }
} finally {
  Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}

$url = gcloud run services describe $To --region $Region --project $Project --format="value(status.url)"
Write-Host ""
Write-Host "Done. Development backend: $url"
Write-Host "Set the develop website's build trigger variable _NEXT_PUBLIC_API_BASE_URL to that address."
