# GUIDE DE CONVERSION MARKDOWN → WORD
## Fiches HAS avec Charte Graphique Belle Viste

---

## 🎯 OBJECTIF

Convertir les 8 fiches HAS au format Markdown (.md) en documents Word (.docx) professionnels avec application de la charte graphique Belle Viste.

---

## 🎨 RAPPEL CHARTE GRAPHIQUE

- **Vert Sapin** : `#2E5339` (RGB: 46, 83, 57)
- **Vert Sauge** : `#8B9D83` (RGB: 139, 157, 131)
- **Vert Menthe** : `#C8E6C9` (RGB: 200, 230, 201)
- **Police** : Arial

---

## 📋 MÉTHODE 1 : PANDOC (Recommandée - Automatisée)

### Installation

**Windows :**
```bash
# Télécharger depuis https://pandoc.org/installing.html
# Ou via Chocolatey :
choco install pandoc
```

**macOS :**
```bash
brew install pandoc
```

**Linux :**
```bash
sudo apt-get install pandoc
```

### Conversion basique (toutes les fiches)

```bash
cd docs/has-certification/fiches-imperatifs

# Conversion une par une
pandoc 3.1-1-identification-resident.md -o 3.1-1-identification-resident.docx
pandoc 3.2-1-evaluation-etat-sante.md -o 3.2-1-evaluation-etat-sante.docx
pandoc 3.3-1-prise-en-charge-douleur.md -o 3.3-1-prise-en-charge-douleur.docx
pandoc 3.4-1-fin-de-vie.md -o 3.4-1-fin-de-vie.docx
pandoc 3.5-1-nutrition-hydratation.md -o 3.5-1-nutrition-hydratation.docx
pandoc 3.7-1-infections-associees-aux-soins.md -o 3.7-1-infections-associees-aux-soins.docx
pandoc 3.8-1-isolement-contention.md -o 3.8-1-isolement-contention.docx
pandoc 3.9-1-parcours-resident.md -o 3.9-1-parcours-resident.docx
```

### Conversion en masse (boucle)

**Windows (PowerShell) :**
```powershell
Get-ChildItem *.md | ForEach-Object {
    pandoc $_.Name -o ($_.BaseName + ".docx")
}
```

**macOS / Linux (Bash) :**
```bash
for file in *.md; do
    pandoc "$file" -o "${file%.md}.docx"
done
```

### Conversion avec template personnalisé

1. **Créer un template Word avec la charte graphique :**
   - Ouvrir Word
   - Créer un document avec styles personnalisés (Titre 1, Titre 2, Tableau, etc.)
   - Appliquer les couleurs Belle Viste
   - Enregistrer comme `template-belle-viste.docx`

2. **Utiliser le template :**
```bash
pandoc 3.1-1-identification-resident.md \
  --reference-doc=template-belle-viste.docx \
  -o 3.1-1-identification-resident.docx
```

---

## 📋 MÉTHODE 2 : MICROSOFT WORD (Manuelle)

### Étapes

1. **Ouvrir le fichier Markdown dans Word**
   - Word > Ouvrir > Sélectionner le fichier `.md`
   - Word convertit automatiquement le Markdown

2. **Appliquer la charte graphique manuellement :**

   **Titres H1 :**
   - Sélectionner tous les titres H1
   - Police : Arial, Taille : 18pt, Gras
   - Couleur : Vert Sapin #2E5339 (Autres couleurs > RGB: 46, 83, 57)

   **Titres H2 :**
   - Sélectionner tous les titres H2
   - Police : Arial, Taille : 14pt, Gras
   - Couleur : Vert Sauge #8B9D83 (RGB: 139, 157, 131)

   **Tableaux :**
   - Sélectionner le tableau
   - Création > Styles de tableau > Créer un style personnalisé
   - En-tête : Fond Vert Menthe #C8E6C9 (RGB: 200, 230, 201)
   - Bordures : Vert Sauge #8B9D83, 1pt

   **Bordures de page :**
   - Mise en page > Bordures de page
   - Style : Ligne continue, Couleur : Vert Sapin #2E5339, Largeur : 2pt

   **En-tête et pied de page :**
   - Insertion > En-tête > Vide
   - Ajouter : Logo Belle Viste (si disponible) + "EHPAD Belle Viste - Saint-Gély-du-Fesc"
   - Pied de page : "Certification HAS novembre 2024 - Version 1.0 - Page X/Y"

3. **Enregistrer au format .docx**

---

## 📋 MÉTHODE 3 : GOOGLE DOCS (Collaborative)

### Étapes

1. **Importer dans Google Docs :**
   - Google Drive > Nouveau > Import de fichier
   - Sélectionner le fichier `.md`
   - Google Docs convertit le Markdown

2. **Appliquer la charte graphique :**
   - Même logique que Word (voir Méthode 2)
   - Utiliser l'outil "Couleur de texte" et "Couleur de surbrillance"

3. **Exporter en Word :**
   - Fichier > Télécharger > Microsoft Word (.docx)

---

## 📋 MÉTHODE 4 : TYPORA (Éditeur Markdown)

### Installation

- Télécharger depuis https://typora.io/
- Version payante (14 jours d'essai gratuit)

### Conversion

1. Ouvrir le fichier `.md` dans Typora
2. Fichier > Exporter > Word (.docx)
3. Appliquer la charte graphique dans Word (voir Méthode 2)

---

## 🎨 PERSONNALISATION AVANCÉE (PANDOC + TEMPLATE)

### Créer un template Word personnalisé

1. **Créer un document Word vide**

2. **Définir les styles :**

   **Style Titre 1 :**
   - Clic droit sur "Titre 1" > Modifier
   - Police : Arial, 18pt, Gras, Vert Sapin #2E5339
   - Espacement : Avant 12pt, Après 6pt

   **Style Titre 2 :**
   - Clic droit sur "Titre 2" > Modifier
   - Police : Arial, 14pt, Gras, Vert Sauge #8B9D83
   - Espacement : Avant 10pt, Après 6pt

   **Style Tableau :**
   - Insérer un tableau > Création > Styles de tableau
   - Créer un style "Tableau Belle Viste"
   - En-tête : Fond Vert Menthe, Police gras
   - Bordures : Vert Sauge, 1pt

   **Style Normal :**
   - Police : Arial, 11pt, Noir

3. **Ajouter en-tête/pied de page :**
   - En-tête : Logo + "EHPAD Belle Viste - Saint-Gély-du-Fesc"
   - Pied de page : "Certification HAS novembre 2024 - Page X"

4. **Enregistrer comme `template-belle-viste.docx`**

5. **Utiliser le template avec Pandoc :**
```bash
pandoc 3.1-1-identification-resident.md \
  --reference-doc=../template-belle-viste.docx \
  -o 3.1-1-identification-resident.docx
```

---

## 📦 SCRIPT DE CONVERSION EN MASSE

### Bash (Linux/macOS)

Créer un fichier `convert-all.sh` :

```bash
#!/bin/bash

# Dossier des fiches Markdown
SOURCE_DIR="fiches-imperatifs"

# Template Word (optionnel)
TEMPLATE="template-belle-viste.docx"

# Créer dossier de sortie
mkdir -p "$SOURCE_DIR/word-output"

# Conversion
for file in "$SOURCE_DIR"/*.md; do
    filename=$(basename "$file" .md)
    echo "Conversion de $filename..."

    if [ -f "$TEMPLATE" ]; then
        pandoc "$file" \
          --reference-doc="$TEMPLATE" \
          -o "$SOURCE_DIR/word-output/$filename.docx"
    else
        pandoc "$file" -o "$SOURCE_DIR/word-output/$filename.docx"
    fi
done

echo "Conversion terminée ! Fichiers dans $SOURCE_DIR/word-output/"
```

Exécution :
```bash
chmod +x convert-all.sh
./convert-all.sh
```

### PowerShell (Windows)

Créer un fichier `convert-all.ps1` :

```powershell
# Dossier des fiches Markdown
$SourceDir = "fiches-imperatifs"

# Template Word (optionnel)
$Template = "template-belle-viste.docx"

# Créer dossier de sortie
New-Item -ItemType Directory -Force -Path "$SourceDir\word-output"

# Conversion
Get-ChildItem "$SourceDir\*.md" | ForEach-Object {
    $filename = $_.BaseName
    Write-Host "Conversion de $filename..."

    if (Test-Path $Template) {
        pandoc $_.FullName `
          --reference-doc=$Template `
          -o "$SourceDir\word-output\$filename.docx"
    } else {
        pandoc $_.FullName -o "$SourceDir\word-output\$filename.docx"
    }
}

Write-Host "Conversion terminée ! Fichiers dans $SourceDir\word-output\"
```

Exécution :
```powershell
.\convert-all.ps1
```

---

## ✅ CHECKLIST POST-CONVERSION

Après conversion, vérifier pour chaque fichier Word :

- [ ] Titres H1 en Vert Sapin #2E5339
- [ ] Titres H2 en Vert Sauge #8B9D83
- [ ] Tableaux avec bordures Vert Sauge et en-têtes Vert Menthe
- [ ] Bordures de page en Vert Sapin
- [ ] En-tête avec logo et nom établissement
- [ ] Pied de page avec "Certification HAS novembre 2024"
- [ ] Police Arial partout
- [ ] Émojis conservés (🔴🟠🟡 dans tableaux d'actions)
- [ ] Tableaux bien formatés
- [ ] Numérotation des sections correcte
- [ ] Pas d'erreurs de conversion (caractères étranges)

---

## 🚀 RECOMMANDATION FINALE

**Pour un résultat optimal :**

1. **Utiliser Pandoc avec template personnalisé** (Méthode 1 + personnalisation)
   - Créer une fois le template Word avec tous les styles
   - Convertir toutes les fiches en un clic
   - Garantit l'homogénéité

2. **Retouches finales dans Word**
   - Vérifier les tableaux
   - Ajuster les espacements
   - Ajouter logo et signatures si nécessaire

3. **Validation finale**
   - Imprimer ou exporter en PDF
   - Vérifier la qualité visuelle
   - Partager avec l'équipe

---

## 📞 SUPPORT

En cas de difficulté :
- Documentation Pandoc : https://pandoc.org/MANUAL.html
- Tutoriels conversion Markdown→Word : YouTube

---

*Guide créé le 29 octobre 2024*
*Version 1.0*
