# Script de conversion automatique des fiches HAS en Word
# Usage: .\convert-has-to-word.ps1

Write-Host "🔄 Conversion des fiches HAS Markdown → Word" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Vérifier que pandoc est installé
if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Pandoc n'est pas installé." -ForegroundColor Red
    Write-Host "📥 Installation nécessaire :" -ForegroundColor Yellow
    Write-Host "   - Télécharger depuis : https://pandoc.org/installing.html" -ForegroundColor Yellow
    Write-Host "   - OU via Chocolatey : choco install pandoc" -ForegroundColor Yellow
    exit 1
}

# Dossier source
$SourceDir = "docs\has-certification\fiches-imperatifs"

# Créer dossier de sortie
$OutputDir = "$SourceDir\word-output"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Compteur
$count = 0

# Conversion de tous les fichiers .md
Write-Host ""
Write-Host "📁 Conversion en cours..." -ForegroundColor Yellow
Write-Host ""

Get-ChildItem "$SourceDir\*.md" | ForEach-Object {
    $filename = $_.BaseName
    Write-Host "  ✓ Conversion : $filename.md → $filename.docx" -ForegroundColor Green

    pandoc $_.FullName -o "$OutputDir\$filename.docx"

    $count++
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Conversion terminée !" -ForegroundColor Green
Write-Host "📊 $count fichiers convertis" -ForegroundColor Green
Write-Host "📂 Fichiers Word dans : $OutputDir\" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. Ouvrir les fichiers .docx dans Word" -ForegroundColor White
Write-Host "   2. Appliquer la charte graphique Belle Viste" -ForegroundColor White
Write-Host "   3. Personnaliser avec les noms des référents" -ForegroundColor White
Write-Host ""
