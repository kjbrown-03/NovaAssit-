<#
.SYNOPSIS
  Lance un scan HawkScan sur l'application Nova Assist tournant en local.

.DESCRIPTION
  HawkScan attaque une application *en marche* : il faut donc démarrer le site
  avant, dans un autre terminal :

      npm run build ; npm run start        # recommandé (proche de la prod)
      npm run dev                          # possible, mais plus lent et bruyant

  Puis, dans ce terminal :

      $env:HAWK_API_KEY = "hawk.xxxxxxxx"  # clé créée sur app.stackhawk.com
      $env:HAWK_APP_ID  = "<uuid de l'application StackHawk>"
      npm run scan:local

  Le scan passe par l'image Docker officielle : rien à installer côté npm, et
  l'image est mise en cache après le premier `docker pull` (~1 Go, à faire une
  fois, de préférence sur une connexion correcte).

.PARAMETER Port
  Port sur lequel le site écoute. 3000 par défaut.
#>
param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

if (-not $env:HAWK_API_KEY) {
  throw "HAWK_API_KEY absent. Créez une clé sur app.stackhawk.com puis : `$env:HAWK_API_KEY = 'hawk.xxx'"
}
if (-not $env:HAWK_APP_ID) {
  throw "HAWK_APP_ID absent. Copiez l'applicationId de l'application StackHawk puis : `$env:HAWK_APP_ID = '<uuid>'"
}

# On vérifie que le site répond avant de lancer un conteneur pour rien.
try {
  Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 10 | Out-Null
} catch {
  throw "Rien ne répond sur http://localhost:$Port — démarrez le site (npm run start) dans un autre terminal."
}

# Depuis le conteneur, la machine hôte s'appelle host.docker.internal :
# « localhost » y désignerait le conteneur lui-même.
$hote = "http://host.docker.internal:$Port"
$racine = (Resolve-Path "$PSScriptRoot\..").Path

Write-Host "Scan de $hote (config : stackhawk.yml)" -ForegroundColor Cyan

docker run --rm `
  -v "${racine}:/hawk:rw" `
  -e API_KEY=$env:HAWK_API_KEY `
  -e HAWK_APP_ID=$env:HAWK_APP_ID `
  -e HAWK_ENV="Development" `
  -e HAWK_HOST=$hote `
  --add-host=host.docker.internal:host-gateway `
  -t stackhawk/hawkscan:latest

exit $LASTEXITCODE
