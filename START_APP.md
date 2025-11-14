# 🚀 Guide de Démarrage - Application Plans de Table EHPAD

## Étapes pour lancer l'application

### 1️⃣ IMPORTANT : Démarrer PostgreSQL

L'application nécessite une base de données PostgreSQL. Vous avez 2 options :

#### Option A : Utiliser Docker Compose (recommandé)
```bash
cd /home/user/ehpad-connect
docker-compose up -d postgres
```

#### Option B : Utiliser PostgreSQL local
Si vous avez PostgreSQL installé localement :
```bash
# Créer la base de données
createdb ehpad_connect

# Ou via psql
psql -U postgres -c "CREATE DATABASE ehpad_connect;"
```

### 2️⃣ Démarrer le Backend

Ouvrir un terminal et exécuter :

```bash
cd /home/user/ehpad-connect/backend
npm run dev
```

Le serveur backend démarrera sur **http://localhost:3000**

Vous devriez voir :
```
Serveur démarré sur le port 3000
```

### 3️⃣ Démarrer le Frontend

Ouvrir un **NOUVEAU terminal** et exécuter :

```bash
cd /home/user/ehpad-connect/frontend
npm start
```

Le frontend démarrera sur **http://localhost:3001** (ou un autre port si 3000 est occupé)

Votre navigateur s'ouvrira automatiquement !

### 4️⃣ Accéder à l'application

L'application s'ouvrira automatiquement dans votre navigateur à l'adresse :
**http://localhost:3001**

## 📍 Accéder aux fonctionnalités Plans de Table

Une fois connecté, vous pourrez accéder aux pages suivantes (vous devrez peut-être les ajouter à la navigation) :

- **Gestion des résidents** : `/seating/residents`
- **Liste des plans de table** : `/seating/plans`
- **Créer un plan de table** : `/seating/plan/new`

## 🔐 Connexion

Utilisez vos identifiants existants ou créez un compte administrateur via l'API.

## ⚠️ Dépannage

### Erreur "Cannot connect to database"
- Vérifiez que PostgreSQL est démarré
- Vérifiez les paramètres dans `/backend/.env`

### Port 3000 déjà utilisé
Modifiez le PORT dans `/backend/.env` :
```
PORT=3001
```

### Erreur CORS
Vérifiez que le frontend et le backend utilisent les bons ports.

## 🎨 Prochaines étapes

1. **Créer des tables** via l'API ou l'interface
2. **Ajouter des résidents**
3. **Créer votre premier plan de table**
4. **Activer le plan et télécharger le PDF**

## 📦 Scripts rapides

### Tout arrêter
```bash
# Arrêter le backend : Ctrl+C dans le terminal backend
# Arrêter le frontend : Ctrl+C dans le terminal frontend
# Arrêter PostgreSQL (si Docker)
docker-compose stop
```

### Tout redémarrer
```bash
# Terminal 1
cd /home/user/ehpad-connect/backend && npm run dev

# Terminal 2
cd /home/user/ehpad-connect/frontend && npm start
```

Bonne utilisation ! 🎉
