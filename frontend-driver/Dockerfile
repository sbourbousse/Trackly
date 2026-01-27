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

# Stage 2: Runtime avec serve statique
FROM node:20-alpine AS runtime
WORKDIR /app

# Installer serve globalement
RUN npm install -g serve

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les fichiers buildés
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/static ./static

# Passer à l'utilisateur non-root
USER nodejs

# Exposer le port (Railway utilisera la variable PORT)
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Commande de démarrage
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
