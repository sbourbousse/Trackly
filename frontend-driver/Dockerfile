# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copier le reste du code
COPY . .

# Build l'application (sans variables d'environnement - elles seront injectées au runtime)
RUN npm run build

# Stage 2: Runtime avec serve statique
FROM node:20-alpine AS runtime
WORKDIR /app

# Installer serve globalement
RUN npm install -g serve

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les fichiers buildés et le script de génération de config
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/static ./static
COPY --from=build --chown=nodejs:nodejs /app/generate-runtime-config.js ./generate-runtime-config.js
COPY --from=build --chown=nodejs:nodejs /app/package.json ./package.json

# Passer à l'utilisateur non-root
USER nodejs

# Exposer le port (Railway utilisera la variable PORT)
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Script de démarrage qui génère runtime-config.js puis lance serve
CMD ["sh", "-c", "node generate-runtime-config.js && serve -s dist -l ${PORT:-8080}"]
