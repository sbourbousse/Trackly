# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copier le reste du code
COPY . .

# Build l'application
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les fichiers buildés (adapter-node génère un serveur standalone)
COPY --from=build --chown=nodejs:nodejs /app/build ./build

# Passer à l'utilisateur non-root
USER nodejs

# Exposer le port (Railway utilisera la variable PORT)
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Commande de démarrage
CMD ["node", "build/index.js"]
