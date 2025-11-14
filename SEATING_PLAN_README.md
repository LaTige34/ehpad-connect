# Application de Gestion des Plans de Table - EHPAD Belle Viste

## Vue d'ensemble

Cette application complète permet de créer, gérer et générer des plans de table pour la salle de restauration de l'EHPAD Belle Viste (70 lits). Elle a été conçue pour minimiser les risques d'erreur d'administration de médicaments tout en offrant une interface moderne et intuitive.

## Fonctionnalités principales

### 1. Gestion des Résidents

**Localisation**: `/frontend/src/pages/seating/ResidentManagement.js`

- **CRUD complet** des résidents (Créer, Lire, Modifier, Supprimer)
- **Informations stockées**:
  - Nom, prénom, numéro de chambre
  - Photo (upload supporté)
  - Régime alimentaire avec codes couleurs:
    - 🟢 **Vert** (Normal)
    - 🔴 **Rouge** (Texture modifiée/mixée)
    - 🟠 **Orange** (Diabétique)
    - 🔵 **Bleu** (Sans sel)
  - Précautions médicales:
    - ⚠️ Risque de fausse route
    - 💊 Administration médicamenteuse spécifique
    - 🥤 Hydratation renforcée
    - 🚫 Allergies alimentaires
  - Détails des allergies et notes médicales
  - Statut actif/inactif

**Fonctionnalités**:
- Recherche par nom ou numéro de chambre
- Filtrage par type de régime
- Statistiques en temps réel
- Pagination
- Soft delete (suppression réversible)

### 2. Gestion des Tables

**Localisation**: `/backend/src/controllers/diningTable.controller.js`

- Configuration des tables de la salle de restauration
- Propriétés:
  - Numéro de table
  - Capacité (nombre de places)
  - Forme (ronde, carrée, rectangulaire)
  - Position dans la salle (pour visualisation)
  - Notes spécifiques
- Création en masse de tables
- Activation/désactivation

### 3. Création de Plans de Table

**Localisation**: `/frontend/src/pages/seating/SeatingPlanEditor.js`

Interface en 4 étapes:

#### Étape 1: Informations générales
- Nom du plan (ex: "Plan de table - Janvier 2025")
- Description
- Date d'application
- Consignes temporaires

#### Étape 2: Configuration des tables
- Visualisation des tables disponibles
- Vérification de la capacité

#### Étape 3: Assignation des résidents
- **Drag & drop** (à implémenter avec react-beautiful-dnd)
- Vue en temps réel des tables et de leur occupation
- Liste des résidents non assignés
- Ajout d'invités temporaires
- Codes couleurs selon le régime alimentaire
- Respect de la capacité des tables

#### Étape 4: Révision
- Aperçu complet du plan
- Statistiques (résidents assignés, invités, non assignés)
- Vérification avant sauvegarde

### 4. Gestion des Plans de Table

**Localisation**: `/frontend/src/pages/seating/SeatingPlanList.js`

- Liste de tous les plans de table
- **États**:
  - 📝 **Brouillon** (draft) - En cours d'édition
  - ✅ **Actif** (active) - Plan actuellement utilisé
  - 📦 **Archivé** (archived) - Plans passés
- **Actions**:
  - Activer un plan (désactive automatiquement l'ancien)
  - Archiver un plan
  - Dupliquer un plan existant
  - Télécharger le PDF
  - Supprimer (sauf plans actifs)
- Filtrage par statut
- Pagination

### 5. Génération de PDF

**Localisation**: `/backend/src/services/seatingPlanPdf.service.js`

Le PDF généré respecte les spécifications suivantes:

#### Format et Design
- **Format**: A3 paysage (420mm x 297mm)
- **Marges**: 50pt de chaque côté
- **Charte graphique EHPAD Belle Viste**:
  - Vert Sauge (#8B9D83) - En-têtes
  - Vert Sapin (#2E5339) - Titres
  - Vert Menthe (#C8E6C9) - Zones de mise en évidence

#### Contenu
1. **En-tête**:
   - Logo/Nom EHPAD Belle Viste
   - Titre "Plan de Table - Salle de Restauration"
   - Nom du plan et date d'application
   - Date de dernière mise à jour

2. **Légende**:
   - Codes couleurs des régimes alimentaires
   - Signification des pictogrammes de précaution

3. **Disposition des tables**:
   - Tables organisées en grille (3 par ligne)
   - Pour chaque table:
     - Numéro de table
     - Occupation (X/Y places)
     - Liste des résidents avec:
       - Nom (en MAJUSCULES) et prénom
       - Numéro de chambre
       - Fond coloré selon le régime
       - Pictogrammes de précaution
     - Liste des invités (fond jaune)

4. **Consignes temporaires** (si présentes)
   - Zone dédiée en bas de page

5. **Pied de page**:
   - Informations EHPAD
   - QR Code pour accès numérique (optionnel)

#### Fonctionnalités PDF
- Multi-pages automatique si nécessaire
- Polices lisibles (Arial minimum 14pt pour les noms)
- Haute résolution pour impression
- Génération à la demande
- Téléchargement direct depuis l'interface

## Architecture Technique

### Backend

#### Modèles de données (Sequelize/PostgreSQL)

1. **Resident** (`/backend/src/models/Resident.js`)
```javascript
{
  id, firstName, lastName, roomNumber, photoUrl,
  dietType, chokingRisk, medicationAdministration,
  enhancedHydration, foodAllergies, allergyDetails,
  medicalNotes, active, createdBy, updatedBy
}
```

2. **DiningTable** (`/backend/src/models/DiningTable.js`)
```javascript
{
  id, tableNumber, capacity, shape,
  positionX, positionY, notes, active
}
```

3. **SeatingPlan** (`/backend/src/models/SeatingPlan.js`)
```javascript
{
  id, name, description, effectiveDate, status,
  seatingArrangement, guests, temporaryInstructions,
  createdBy, updatedBy, activatedBy, activatedAt
}
```

#### API Endpoints

**Résidents** (`/api/residents`)
- `GET /` - Liste des résidents (avec pagination et filtres)
- `GET /:id` - Détails d'un résident
- `POST /` - Créer un résident
- `PUT /:id` - Modifier un résident
- `DELETE /:id` - Supprimer un résident (soft delete)
- `POST /:id/restore` - Restaurer un résident
- `POST /:id/photo` - Upload photo
- `GET /stats` - Statistiques

**Tables** (`/api/dining-tables`)
- `GET /` - Liste des tables
- `GET /:id` - Détails d'une table
- `POST /` - Créer une table
- `POST /bulk` - Création en masse
- `PUT /:id` - Modifier une table
- `DELETE /:id` - Supprimer une table

**Plans de table** (`/api/seating-plans`)
- `GET /` - Liste des plans (avec pagination et filtres)
- `GET /:id` - Détails d'un plan
- `GET /active/current` - Plan actif
- `POST /` - Créer un plan
- `PUT /:id` - Modifier un plan
- `POST /:id/activate` - Activer un plan
- `POST /:id/archive` - Archiver un plan
- `POST /:id/duplicate` - Dupliquer un plan
- `DELETE /:id` - Supprimer un plan
- `GET /:id/pdf` - Générer et télécharger le PDF

### Frontend (React + Material-UI)

#### Services
- `residentService.js` - Communication API résidents
- `diningTableService.js` - Communication API tables
- `seatingPlanService.js` - Communication API plans de table

#### Composants
- `ResidentManagement.js` - Gestion des résidents
- `SeatingPlanEditor.js` - Création de plans de table
- `SeatingPlanList.js` - Liste et gestion des plans

## Installation et Configuration

### Prérequis
- Node.js 16+
- PostgreSQL 14+
- npm ou yarn

### Installation

1. **Backend**:
```bash
cd backend
npm install
```

2. **Frontend**:
```bash
cd frontend
npm install
```

### Configuration

1. **Variables d'environnement** (`.env`):
```env
# Base de données
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=ehpad_connect
PGPORT=5432

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Application
PORT=3000
APP_URL=http://localhost:3000

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

2. **Création des tables**:
```sql
-- Les migrations Sequelize créeront automatiquement:
-- - residents
-- - dining_tables
-- - seating_plans
```

3. **Dossiers uploads**:
```bash
mkdir -p backend/uploads/residents
mkdir -p backend/uploads/temp
chmod 755 backend/uploads
```

### Lancement

1. **Backend**:
```bash
cd backend
npm run dev
```

2. **Frontend**:
```bash
cd frontend
npm start
```

L'application sera accessible sur `http://localhost:3000`

## Utilisation

### Workflow recommandé

1. **Configuration initiale**:
   - Créer les tables de la salle de restauration
   - Ajouter tous les résidents avec leurs informations

2. **Création d'un plan de table**:
   - Aller dans "Plans de table" → "Nouveau Plan"
   - Remplir les informations générales
   - Vérifier les tables disponibles
   - Assigner les résidents aux tables
   - Ajouter des invités si nécessaire
   - Réviser et enregistrer

3. **Activation**:
   - Dans la liste des plans, activer le plan souhaité
   - L'ancien plan actif sera automatiquement archivé

4. **Utilisation quotidienne**:
   - Télécharger le PDF du plan actif
   - Imprimer au format A3
   - Afficher dans la salle de restauration

5. **Mises à jour**:
   - Dupliquer un plan existant pour créer une variante
   - Modifier les assignations si nécessaire
   - Activer le nouveau plan

## Sécurité et Permissions

### Rôles utilisateurs

- **Admin**: Accès complet (CRUD résidents, tables, plans)
- **Manager**: Accès complet (CRUD résidents, tables, plans)
- **Employee**: Lecture seule (consultation des plans et résidents)

### Authentification
- JWT avec Bearer token
- Session de 24h par défaut
- Middleware d'authentification sur toutes les routes protégées

## Améliorations futures

### Fonctionnalités suggérées
1. **Drag & Drop avancé**:
   - Implémenter `react-beautiful-dnd` ou `@dnd-kit`
   - Interface visuelle de placement des résidents

2. **Historique**:
   - Suivi des modifications de plans
   - Logs d'activation/désactivation

3. **Notifications**:
   - Alertes lors du changement de plan actif
   - Rappels de mise à jour mensuelle

4. **Rapports**:
   - Statistiques d'occupation des tables
   - Analyse des régimes alimentaires
   - Export Excel des plans

5. **Intégration**:
   - Synchronisation avec système de gestion des repas
   - Export vers systèmes tiers

6. **Optimisation**:
   - Suggestions automatiques de placement
   - Contraintes (ex: séparer certains résidents)
   - Optimisation selon les précautions médicales

## Support et Maintenance

### Logs
Les logs applicatifs sont disponibles dans:
- Backend: Console et fichiers Winston
- Erreurs: Stockées dans les logs système

### Dépannage

**Problème**: PDF ne se génère pas
- Vérifier que le dossier `uploads/temp` existe et est accessible en écriture
- Vérifier l'installation du package `qrcode`

**Problème**: Photos de résidents non uploadées
- Vérifier les permissions du dossier `uploads/residents`
- Vérifier la limite de taille dans multer (5MB par défaut)

**Problème**: Plan ne s'active pas
- Un seul plan peut être actif à la fois
- Vérifier que le plan n'est pas archivé

## Charte Graphique

### Couleurs principales
- **Vert Sauge**: `#8B9D83` - En-têtes, navigation
- **Vert Sapin**: `#2E5339` - Titres importants
- **Vert Menthe**: `#C8E6C9` - Régime normal, highlights

### Codes couleurs régimes
- **Vert Menthe**: `#C8E6C9` - Normal
- **Rouge**: `#FF6B6B` - Texture modifiée/mixée
- **Orange**: `#FFA726` - Diabétique
- **Bleu**: `#64B5F6` - Sans sel

### Pictogrammes
- ⚠️ Risque de fausse route
- 💊 Administration médicamenteuse
- 🥤 Hydratation renforcée
- 🚫 Allergies alimentaires
- 👤 Invité

## License

Propriété de EHPAD Belle Viste - Tous droits réservés

## Contact

Pour toute question ou support, contacter l'équipe de développement.

---

**Version**: 1.0.0
**Date de création**: 2025-01-14
**Auteur**: Claude Code Assistant
