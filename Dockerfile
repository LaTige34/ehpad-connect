# Étape 1: Construction du frontend
FROM node:16-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Étape 2: Construction du backend
FROM node:16-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Étape 3: Production
FROM node:16-alpine
WORKDIR /app

# Copier le backend
COPY --from=backend-build /app/backend ./
# Copier le frontend build dans le dossier public du backend
COPY --from=frontend-build /app/frontend/build ./public

# Installer seulement les dépendances de production
RUN npm prune --production

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "src/index.js"]
