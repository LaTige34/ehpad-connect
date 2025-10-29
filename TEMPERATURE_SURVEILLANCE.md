# Surveillance de Température - Produits Thermosensibles

## Description

Module de surveillance de température pour les produits thermosensibles stockés dans les réfrigérateurs de la salle de soins (IDE), conforme aux recommandations HAS (Haute Autorité de Santé).

## Conformité HAS

Cette fonctionnalité répond aux exigences du référentiel HAS pour la conservation des produits thermosensibles :

- **Température réglementaire** : +2°C à +8°C
- **Fréquence des relevés** : 2 fois par jour minimum (matin et soir)
- **Traçabilité complète** : Date, heure, température, agent, observations
- **Gestion des anomalies** : Alertes automatiques et actions correctives
- **Archivage** : Fiches mensuelles en PDF pour conservation légale (3 ans minimum)

## Fonctionnalités

### 1. Saisie des relevés de température

- Formulaire de saisie simplifié
- Validation automatique de la conformité HAS
- Alertes visuelles en cas de dépassement
- Détection automatique de la période (matin/soir/nuit)
- Champs observations et actions correctives

### 2. Suivi et statistiques

- Visualisation mensuelle des relevés
- Statistiques : température moyenne, min/max, taux de conformité
- Tableau détaillé de tous les relevés
- Alertes visuelles pour les anomalies
- Validation des relevés non conformes par un responsable

### 3. Génération de fiches PDF

- Fiches mensuelles conformes au référentiel HAS
- Statistiques complètes du mois
- Tableau détaillé des relevés
- Recommandations HAS
- Espace pour signature de validation

### 4. Gestion des anomalies

- Détection automatique des dépassements
  - **Critique** : < 0°C ou > 10°C
  - **Alerte** : 0-2°C ou 8-10°C
  - **Conforme** : 2-8°C
- Notifications automatiques aux responsables
- Suivi des actions correctives
- Validation obligatoire par un manager

## Architecture technique

### Backend (Node.js/Express)

```
backend/
├── src/
│   ├── models/
│   │   └── TemperatureLog.js          # Modèle de données Sequelize
│   ├── services/
│   │   ├── temperature.service.js      # Logique métier
│   │   └── pdf.service.js             # Génération PDF (méthode ajoutée)
│   ├── controllers/
│   │   └── temperature.controller.js   # Contrôleur API
│   └── routes/
│       └── temperature.routes.js       # Routes API
```

### Frontend (React)

```
frontend/
├── src/
│   ├── services/
│   │   └── temperatureService.js       # Service API
│   ├── components/
│   │   ├── TemperatureLogForm.js       # Formulaire de saisie
│   │   └── TemperatureMonitoring.js    # Visualisation et suivi
│   └── pages/
│       └── temperature/
│           └── TemperaturePage.js      # Page principale
```

### Base de données (PostgreSQL)

Table `temperature_logs` :
- `id` : Identifiant unique
- `refrigeratorId` : Identifiant du réfrigérateur
- `location` : Localisation (ex: Salle de soins - IDE)
- `measurementDate` : Date du relevé
- `measurementTime` : Heure du relevé
- `period` : Période (matin/soir/nuit)
- `temperature` : Température mesurée
- `isWithinRange` : Conformité aux normes HAS
- `alertLevel` : Niveau d'alerte (none/warning/critical)
- `observations` : Observations
- `correctiveActions` : Actions correctives
- `recordedById` : Agent ayant effectué le relevé
- `validatedById` : Responsable ayant validé (si anomalie)
- `validatedAt` : Date de validation
- `metadata` : Métadonnées additionnelles
- `createdAt`, `updatedAt`, `deletedAt` : Horodatage

## API REST

### Endpoints disponibles

#### Relevés de température

```
POST   /api/temperature                              # Créer un relevé
GET    /api/temperature                              # Liste des relevés (avec filtres)
GET    /api/temperature/:id                          # Détail d'un relevé
PUT    /api/temperature/:id                          # Modifier un relevé
DELETE /api/temperature/:id                          # Supprimer un relevé
```

#### Statistiques et monitoring

```
GET    /api/temperature/stats/:refrigeratorId/:year/:month    # Statistiques mensuelles
GET    /api/temperature/anomalies                             # Anomalies récentes
GET    /api/temperature/refrigerators                         # Liste des réfrigérateurs
GET    /api/temperature/check-missing/:refrigeratorId         # Relevés manquants
```

#### Génération PDF

```
GET    /api/temperature/pdf/:refrigeratorId/:year/:month      # Télécharger fiche PDF
```

#### Validation

```
POST   /api/temperature/:id/validate                 # Valider un relevé (admin/manager)
```

### Exemples de requêtes

#### Créer un relevé

```javascript
POST /api/temperature
{
  "refrigeratorId": "IDE-FRIGO-01",
  "location": "Salle de soins - IDE",
  "measurementDate": "2025-10-29",
  "measurementTime": "08:30",
  "period": "matin",
  "temperature": 5.2,
  "observations": "RAS"
}
```

#### Récupérer les statistiques

```javascript
GET /api/temperature/stats/IDE-FRIGO-01/2025/10

Response:
{
  "success": true,
  "data": {
    "stats": {
      "totalLogs": 60,
      "avgTemperature": 5.3,
      "minTemperature": 4.8,
      "maxTemperature": 6.2,
      "conformLogs": 58,
      "nonConformLogs": 2,
      "conformityRate": 96.67
    },
    "logs": [...]
  }
}
```

## Utilisation

### 1. Effectuer un relevé quotidien

1. Accéder à la page "Surveillance de Température"
2. Sélectionner l'onglet "Nouveau relevé"
3. Choisir le réfrigérateur
4. Saisir la température mesurée
5. Ajouter des observations si nécessaire
6. Enregistrer

### 2. Consulter les statistiques

1. Onglet "Suivi et statistiques"
2. Sélectionner le réfrigérateur, l'année et le mois
3. Visualiser les statistiques et le tableau des relevés
4. Télécharger la fiche PDF si nécessaire

### 3. Gérer une anomalie

1. En cas de température hors norme, une alerte s'affiche
2. Saisir les actions correctives dans le formulaire
3. Un responsable doit valider le relevé
4. Une notification est envoyée automatiquement

## Installation et configuration

### 1. Backend

```bash
cd backend
npm install
```

Ajouter les variables d'environnement dans `.env` (si nécessaire).

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Base de données

Les migrations Sequelize créeront automatiquement la table `temperature_logs` au démarrage.

```bash
cd backend
npm run migrate  # ou au démarrage de l'application
```

### 4. Initialisation des associations

Le fichier `backend/src/models/index.js` contient les relations entre `TemperatureLog` et `User`.

## Bonnes pratiques

### Pour les IDE (Infirmiers)

1. **Effectuer 2 relevés par jour** : matin (6h-14h) et soir (14h-22h)
2. **Vérifier la conformité** : température entre +2°C et +8°C
3. **Signaler immédiatement** toute anomalie au responsable
4. **Remplir les observations** pour toute situation particulière
5. **Vérifier la fermeture** de la porte du réfrigérateur

### Pour les responsables

1. **Valider les anomalies** dans les 24h
2. **Télécharger les fiches mensuelles** pour archivage
3. **Analyser les statistiques** pour détecter des tendances
4. **Former le personnel** aux bonnes pratiques
5. **Conserver les fiches PDF** pendant 3 ans minimum

### En cas d'anomalie

1. **Température critique (< 0°C ou > 10°C)** :
   - Alerter immédiatement le responsable
   - Ne pas ouvrir le réfrigérateur
   - Vérifier l'état des produits
   - Appeler la maintenance si nécessaire

2. **Température en alerte (0-2°C ou 8-10°C)** :
   - Vérifier la fermeture de la porte
   - Vérifier le joint de la porte
   - Contrôler à nouveau 1h après
   - Signaler au responsable

## Support et maintenance

Pour toute question ou problème :
- Consulter la documentation technique
- Contacter le service informatique
- Vérifier les logs backend en cas d'erreur

## Conformité légale

Cette fonctionnalité répond aux exigences :
- **HAS** : Haute Autorité de Santé
- **Bonnes pratiques** de pharmacie hospitalière
- **Traçabilité** réglementaire des produits de santé
- **RGPD** : Données personnelles (agents) sécurisées

## Évolutions futures

- Export Excel des relevés
- Graphiques de tendance
- Alertes par email/SMS automatiques
- Intégration avec système de maintenance
- Tableau de bord global multi-réfrigérateurs
- Application mobile pour saisie rapide
