# 🚀 COMMENT CONVERTIR LES FICHES HAS EN WORD ?

## 3 méthodes simples au choix

---

## ⭐ MÉTHODE 1 : WORD (LE PLUS SIMPLE - RECOMMANDÉ)

**Temps : 2 minutes par fiche**

### Étape par étape :

1. **Ouvrir Microsoft Word**

2. **Fichier → Ouvrir**

3. **Naviguer vers le dossier :**
   ```
   /home/user/ehpad-connect/docs/has-certification/fiches-imperatifs/
   ```

4. **Sélectionner un fichier** (ex: `3.1-1-identification-resident.md`)

5. **Word convertit automatiquement le Markdown** ✨

6. **Appliquer les couleurs Belle Viste :**

   | Élément | Police | Taille | Gras | Couleur RGB |
   |---------|--------|--------|------|-------------|
   | Titre H1 | Arial | 18pt | ✓ | R=46, G=83, B=57 (Vert Sapin) |
   | Titre H2 | Arial | 14pt | ✓ | R=139, G=157, B=131 (Vert Sauge) |
   | Tableaux (en-tête) | Arial | 11pt | ✓ | Fond: R=200, G=230, B=201 (Vert Menthe) |

7. **Enregistrer** : Fichier → Enregistrer sous → `.docx`

8. **Répéter pour les 7 autres fiches**

---

## 🔥 MÉTHODE 2 : PANDOC (TOUT CONVERTIR EN 1 CLIC)

**Temps : 30 secondes pour les 8 fiches**

### Installation de Pandoc :

**Sur Linux (votre système actuel) :**
```bash
sudo apt-get install pandoc
```

**Sur macOS :**
```bash
brew install pandoc
```

**Sur Windows :**
- Télécharger : https://pandoc.org/installing.html
- OU via Chocolatey : `choco install pandoc`

### Conversion automatique :

**Linux / macOS :**
```bash
cd /home/user/ehpad-connect/docs/has-certification
chmod +x convert-has-to-word.sh
./convert-has-to-word.sh
```

**Windows (PowerShell) :**
```powershell
cd C:\Users\...\ehpad-connect\docs\has-certification
.\convert-has-to-word.ps1
```

**Résultat :** Les 8 fichiers Word seront dans :
```
docs/has-certification/fiches-imperatifs/word-output/
```

---

## 💡 MÉTHODE 3 : GOOGLE DOCS (SI VOUS N'AVEZ PAS WORD)

### Étapes :

1. **Aller sur Google Drive** : https://drive.google.com

2. **Nouveau → Import de fichier**

3. **Sélectionner une fiche** (ex: `3.1-1-identification-resident.md`)

4. **Google Docs convertit le Markdown**

5. **Appliquer les couleurs** (voir tableau Méthode 1)

6. **Fichier → Télécharger → Microsoft Word (.docx)**

7. **Répéter pour les autres fiches**

---

## 🎨 GUIDE RAPIDE : APPLIQUER LES COULEURS DANS WORD

### Comment changer la couleur d'un titre :

1. **Sélectionner le texte** du titre

2. **Cliquer sur la flèche** à côté de l'icône "Couleur de police" (A avec barre colorée)

3. **"Autres couleurs..."**

4. **Onglet "Personnalisées"**

5. **Entrer les valeurs RGB :**
   - **Vert Sapin** (titres H1) : R=**46**, G=**83**, B=**57**
   - **Vert Sauge** (titres H2) : R=**139**, G=**157**, B=**131**

6. **OK**

### Pour les tableaux :

1. **Sélectionner le tableau**

2. **Création de tableau → Styles de tableau**

3. **Créer un nouveau style** ou modifier un existant

4. **Bordures** : Vert Sauge (R=139, G=157, B=131)

5. **Ligne d'en-tête → Remplissage** : Vert Menthe (R=200, G=230, B=201)

---

## 📁 RAPPEL : OÙ SONT LES FICHIERS ?

**Fiches Markdown (source) :**
```
/home/user/ehpad-connect/docs/has-certification/fiches-imperatifs/
├── 3.1-1-identification-resident.md
├── 3.2-1-evaluation-etat-sante.md
├── 3.3-1-prise-en-charge-douleur.md
├── 3.4-1-fin-de-vie.md
├── 3.5-1-nutrition-hydratation.md
├── 3.7-1-infections-associees-aux-soins.md
├── 3.8-1-isolement-contention.md
└── 3.9-1-parcours-resident.md
```

**Fiches Word (après conversion avec Pandoc) :**
```
/home/user/ehpad-connect/docs/has-certification/fiches-imperatifs/word-output/
├── 3.1-1-identification-resident.docx
├── 3.2-1-evaluation-etat-sante.docx
├── ... (8 fichiers au total)
```

---

## ✅ CHECKLIST APRÈS CONVERSION

Pour chaque fichier Word, vérifier :

- [ ] Titres H1 en **Vert Sapin** (#2E5339)
- [ ] Titres H2 en **Vert Sauge** (#8B9D83)
- [ ] Tableaux avec bordures **Vert Sauge** et fond d'en-tête **Vert Menthe**
- [ ] Police **Arial** partout
- [ ] Émojis conservés (🔴🟠🟡)
- [ ] Tableaux bien formatés
- [ ] Ajout du logo Belle Viste (si disponible)
- [ ] En-tête : "EHPAD Belle Viste - Saint-Gély-du-Fesc"
- [ ] Pied de page : "Certification HAS novembre 2024"

---

## 🆘 EN CAS DE PROBLÈME

### "Pandoc n'est pas reconnu" (Windows)
→ Installer Pandoc : https://pandoc.org/installing.html
→ Redémarrer le terminal après installation

### "Permission denied" (Linux/macOS)
→ Rendre le script exécutable : `chmod +x convert-has-to-word.sh`

### "Les tableaux ne s'affichent pas bien"
→ Ouvrir le fichier .docx dans Word et ajuster manuellement

### "Je n'arrive pas à trouver les couleurs RGB dans Word"
→ Couleur de police → Autres couleurs... → Onglet "Personnalisées" → Modèle de couleurs : "RVB"

---

## 💪 RÉCAPITULATIF

| Méthode | Difficulté | Temps | Résultat |
|---------|------------|-------|----------|
| **Word direct** | ⭐ Facile | 2 min/fiche | Bon, mise en forme manuelle |
| **Pandoc** | ⭐⭐ Moyen | 30 sec total | Très bon, rapide |
| **Google Docs** | ⭐ Facile | 3 min/fiche | Bon, nécessite compte Google |

**Ma recommandation :**
- **Vous êtes à l'aise avec la ligne de commande** → Utilisez **Pandoc** (méthode 2)
- **Vous préférez l'interface graphique** → Utilisez **Word** (méthode 1)

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Convertir les 8 fiches en Word (avec la méthode de votre choix)
2. ✅ Appliquer la charte graphique Belle Viste
3. ✅ Personnaliser avec les noms des référents Belle Viste
4. ✅ Imprimer ou partager avec l'équipe
5. ✅ Commencer les actions prioritaires (6 semaines avant certification)

---

**Besoin d'aide ?** N'hésitez pas à demander ! 😊
