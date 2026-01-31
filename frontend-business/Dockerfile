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

# Le serveur SvelteKit (build/server/index.js) importe des packages comme 'clsx' au runtime :
# ils doivent être présents dans node_modules.
COPY --from=build /app/package.json /app/package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copier le build (serveur + client statique)
COPY --from=build /app/build ./build

RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port (Railway injecte PORT)
EXPOSE 8080
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", "build/index.js"]
