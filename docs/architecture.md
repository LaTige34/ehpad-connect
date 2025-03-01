# Architecture technique EHPAD Connect

## Vue d'ensemble

EHPAD Connect utilise une architecture moderne en microservices, privilégiant la scalabilité et la maintenabilité.

## Composants principaux

### Frontend
- **Application Web** : React.js avec Redux pour la gestion d'état
- **Application Mobile** : React Native pour iOS et Android
- **Progressive Web App (PWA)** avec service workers pour le fonctionnement hors-ligne

### Backend
- **API Gateway** : point d'entrée unique pour tous les services
- **Service d'authentification** : gestion des utilisateurs, sessions, et permissions
- **Service de gestion des plannings** : synchronisation avec Octime Expresso
- **Service de gestion documentaire** : stockage et archivage des documents
- **Service de signature électronique** : traitement des signatures et horodatage
- **Service de notifications** : gestion des alertes et emails

### Base de données
- **PostgreSQL** : données utilisateurs, plannings, et métadonnées
- **MongoDB** : métadonnées documentaires
- **Redis** : cache et sessions
- **Stockage d'objets S3** : documents et archives

### Intégrations externes
- **Octime Expresso** : synchronisation des plannings
- **Service de signature électronique** : Yousign, DocuSign, ou Universign
- **Serveur SMTP** : envoi des notifications par email

## Sécurité

- Authentification avec JWT (JSON Web Tokens)
- Chiffrement SSL/TLS pour toutes les communications
- Chiffrement AES-256 pour les données sensibles au repos
- Rate limiting et protection contre les attaques DDOS

## Déploiement

- Conteneurisation avec Docker
- Orchestration avec Kubernetes
- CI/CD avec GitLab CI ou GitHub Actions
- Hébergement sur infrastructure certifiée HDS (Hébergement de Données de Santé)
