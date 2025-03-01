# EHPAD Connect

Application de gestion des plannings et documents RH pour EHPAD avec intégration Octime Expresso et signature électronique.

## 📋 Fonctionnalités

- **Accès sécurisé** aux plannings et documents RH
- **Synchronisation automatique** avec Octime Expresso
- **Signature électronique** des documents et plannings
- **Transmission automatique** des documents signés par email
- **Interface responsive** adaptée à un usage mobile

## 🛠 Architecture

### Frontend
- React.js avec Redux pour la gestion d'état
- React Native pour l'application mobile
- PWA (Progressive Web App) pour le fonctionnement hors-ligne

### Backend
- Node.js avec Express.js
- Architecture microservices
- API RESTful

### Base de données
- PostgreSQL pour les données relationnelles
- MongoDB pour les métadonnées documentaires

## 🔧 Installation

### Prérequis
- Node.js (v16+)
- Docker et Docker Compose
- PostgreSQL
- MongoDB

### Configuration de développement

```bash
# Cloner le dépôt
git clone https://github.com/LaTige34/ehpad-connect.git
cd ehpad-connect

# Installation des dépendances backend
cd backend
npm install

# Installation des dépendances frontend
cd ../frontend
npm install
```

## 🚀 Démarrage

### Mode développement

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

## 📝 Licence

Ce projet est sous licence [MIT](LICENSE).
