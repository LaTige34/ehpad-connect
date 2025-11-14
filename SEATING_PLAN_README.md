# Plan de Table EHPAD Belle Vista - Documentation

## Vue d'ensemble

Ce document décrit le plan de table interactif pour la salle de restauration de l'EHPAD Belle Vista (Tisanerie). Le plan a été conçu pour répondre aux besoins spécifiques du personnel soignant et garantir la sécurité des résidents.

## Caractéristiques principales

### 1. Structure du plan

- **Format** : A3 Paysage (optimisé pour impression)
- **Zones** : 3 zones distinctes
  - Zone Porte Cuisine (gauche)
  - Zone Centrale
  - Zone Porte Plonge (droite)

### 2. Types de tables

#### Tables Rectangulaires (Service 1 - Beige)
- Couleur : `#D4C4B0` (beige/taupe clair)
- **4 emplacements** pour noms de résidents (2 de chaque côté)
- Distribution :
  - 7 tables dans la zone Porte Cuisine et centrale
  - Dimensions : 120px × 80px

#### Tables Carrées (Service 1 - Beige)
- Couleur : `#D4C4B0` (beige/taupe clair)
- **2 emplacements** pour noms de résidents (1 de chaque côté)
- Distribution :
  - 3 tables dans la zone Porte Cuisine
  - 4 tables dans la zone centrale
- Dimensions : 70px × 70px

#### Tables Rondes (Service 2 - Rose/Mauve)
- Couleur : `#D4B5C4` (rose/mauve clair)
- **5 emplacements** répartis autour du cercle
- Distribution :
  - 5 tables dans la zone Porte Plonge
  - Tailles variées : petites (40px), moyennes (48-50px), grandes (52px)

### 3. Légende avec symboles médicaux

Le plan inclut une légende complète avec les symboles suivants :

| Symbole | Signification |
|---------|---------------|
| ♿ | Résidents en fauteuils et qu'il faut remonter |
| 🍴 | Résidents ayant besoin d'aide alimentaire |
| 💧 | Eau gélifiée |
| 🍽️ | Résidents ayant besoin d'une serviette |
| 🟤 Beige | 1er service |
| 🟪 Rose | 2e service |

### 4. Consignes de sécurité

- ✅ Identification claire et rapide des résidents
- ✅ Prévention des erreurs médicamenteuses
- ✅ Lecture facile pour IDE en service
- ✅ Zones blanches pour écriture manuscrite

## Utilisation

### Accès au plan

1. Se connecter à l'application EHPAD Connect
2. Accéder au menu latéral
3. Cliquer sur **"Plan de Table"** (icône restaurant 🍴)

### Fonctionnalités disponibles

#### 1. Impression
```
Bouton : "Imprimer"
Action : Ouvre la boîte de dialogue d'impression du navigateur
Recommandation : Sélectionner format A3 Paysage pour une meilleure qualité
```

#### 2. Téléchargement SVG
```
Bouton : "Télécharger SVG"
Format : Fichier vectoriel éditable
Avantage : Peut être modifié avec des logiciels comme Inkscape ou Illustrator
Nom du fichier : plan_salle_restauration_belle_vista.svg
```

#### 3. Téléchargement PNG
```
Bouton : "Télécharger PNG"
Format : Image haute résolution (2800px × 2000px)
Avantage : Facile à partager et afficher sur écrans
Nom du fichier : plan_salle_restauration_belle_vista.png
```

## Architecture technique

### Structure des fichiers

```
frontend/src/
├── components/seating/
│   └── SeatingPlanTable.js          # Composant SVG du plan de table
├── pages/seating/
│   └── SeatingPlanPage.js           # Page principale avec actions
└── layouts/
    └── MainLayout.js                 # Navigation mise à jour
```

### Composants React

#### SeatingPlanTable.js
Composant responsable du rendu SVG du plan avec :
- Composant `RectangularTable` : Tables rectangulaires avec 4 emplacements
- Composant `SquareTable` : Tables carrées avec 2 emplacements
- Composant `RoundTable` : Tables rondes avec 5 emplacements
- Légende intégrée avec symboles

#### SeatingPlanPage.js
Page principale offrant :
- Affichage du plan
- Boutons d'action (Imprimer, Télécharger)
- Informations de sécurité
- Instructions d'utilisation

### Technologies utilisées

- **React** 18.2.0
- **Material-UI** 5.12.1
- **SVG** pour le rendu vectoriel
- **Canvas API** pour l'export PNG

## Personnalisation

### Modification des couleurs

Les couleurs sont définies dans `SeatingPlanTable.js` :

```javascript
const service1Color = '#D4C4B0'; // Beige/taupe clair
const service2Color = '#D4B5C4'; // Rose/mauve clair
const headerColor = '#EDE4D8';   // Beige/crème pour le bandeau
```

### Ajout de tables

Pour ajouter une nouvelle table, utiliser les composants existants :

```jsx
<RectangularTable x={100} y={200} width={120} height={80} color={service1Color} seats={4} />
<SquareTable x={300} y={200} size={70} color={service1Color} seats={2} />
<RoundTable x={500} y={250} radius={45} color={service2Color} seats={5} />
```

### Modification de la disposition

Les positions (x, y) sont définies en pixels dans le système de coordonnées SVG.
Le viewBox est défini à `0 0 1400 1000`.

## Cas d'usage

### Scénario 1 : Impression quotidienne
1. Accéder au plan de table
2. Cliquer sur "Imprimer"
3. Sélectionner A3 Paysage
4. Inscrire les noms des résidents dans les zones blanches
5. Afficher dans la salle de restauration

### Scénario 2 : Partage digital
1. Accéder au plan de table
2. Cliquer sur "Télécharger PNG"
3. Partager le fichier par email ou messagerie interne
4. Afficher sur tablettes ou écrans dans la salle

### Scénario 3 : Modification du plan
1. Accéder au plan de table
2. Cliquer sur "Télécharger SVG"
3. Ouvrir avec un logiciel d'édition vectorielle
4. Modifier les positions ou ajouter des éléments
5. Réimporter dans l'application si nécessaire

## Maintenance

### Mise à jour des symboles

Les symboles peuvent être modifiés dans la section légende de `SeatingPlanTable.js` :

```jsx
<text x="50" y="770" style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px' }}>♿</text>
```

### Ajout de nouvelles zones

Pour ajouter une nouvelle zone :
1. Définir les coordonnées (x, y) de départ
2. Ajouter un titre de zone avec `<text>`
3. Placer les tables avec les composants appropriés
4. Mettre à jour la documentation

## Support et contact

Pour toute question ou demande d'amélioration :
- Créer une issue dans le repository
- Contacter l'équipe de développement
- Consulter la documentation complète de l'application

## Licence

Ce composant fait partie de l'application EHPAD Connect.
Tous droits réservés © 2025 EHPAD Belle Vista

---

**Version** : 1.0.0
**Date** : 14 novembre 2025
**Auteur** : Équipe de développement EHPAD Connect
