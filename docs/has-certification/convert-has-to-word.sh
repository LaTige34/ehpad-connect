#!/bin/bash

# Script de conversion automatique des fiches HAS en Word
# Usage: ./convert-has-to-word.sh

echo "🔄 Conversion des fiches HAS Markdown → Word"
echo "=============================================="

# Vérifier que pandoc est installé
if ! command -v pandoc &> /dev/null
then
    echo "❌ Pandoc n'est pas installé."
    echo "📥 Installation nécessaire :"
    echo "   - Linux : sudo apt-get install pandoc"
    echo "   - macOS : brew install pandoc"
    echo "   - Windows : télécharger depuis https://pandoc.org/installing.html"
    exit 1
fi

# Dossier source
SOURCE_DIR="docs/has-certification/fiches-imperatifs"

# Créer dossier de sortie
OUTPUT_DIR="$SOURCE_DIR/word-output"
mkdir -p "$OUTPUT_DIR"

# Compteur
count=0

# Conversion de tous les fichiers .md
echo ""
echo "📁 Conversion en cours..."
echo ""

for file in "$SOURCE_DIR"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .md)
        echo "  ✓ Conversion : $filename.md → $filename.docx"

        pandoc "$file" -o "$OUTPUT_DIR/$filename.docx"

        ((count++))
    fi
done

echo ""
echo "=============================================="
echo "✅ Conversion terminée !"
echo "📊 $count fichiers convertis"
echo "📂 Fichiers Word dans : $OUTPUT_DIR/"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Ouvrir les fichiers .docx dans Word"
echo "   2. Appliquer la charte graphique Belle Viste"
echo "   3. Personnaliser avec les noms des référents"
echo ""
