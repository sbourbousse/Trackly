# Guide d'intégration - Frontend Tracking

## Prérequis

- Node.js 18+ installé
- Backend Trackly en cours d'exécution
- Ports disponibles : 3003 (frontend)

## Installation

```bash
cd frontend-tracking
npm install
```

## Configuration

### 1. Variables d'environnement

Créer un fichier `.env.local` :

```bash
# URL de l'API backend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. CORS Backend

Assurez-vous que le backend autorise les requêtes depuis `http://localhost:3003` :

```csharp
// backend/Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowTracking", policy =>
    {
        policy.WithOrigins("http://localhost:3004", "https://trackly.app")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

app.UseCors("AllowTracking");
```

## Lancement

### Mode développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3004

### Mode production

```bash
npm run build
npm start
```

## Utilisation

### URL de suivi

Format : `http://localhost:3003/track/{deliveryId}`

Exemple : `http://localhost:3004/track/550e8400-e29b-41d4-a716-446655440000`

### Partage aux clients

1. **Par SMS** :
   ```
   Votre colis est en cours de livraison !
   Suivez-le ici : https://trackly.app/track/{id}
   ```

2. **Par email** :
   ```html
   <a href="https://trackly.app/track/{id}">
     Suivre ma livraison
   </a>
   ```

3. **QR Code** :
   Générer un QR code pointant vers l'URL de suivi

## Intégration avec le Business Dashboard

### Génération du lien de suivi

Dans le business dashboard, ajouter un bouton pour copier le lien :

```typescript
// frontend-business/src/routes/deliveries/[id]/+page.svelte
const trackingUrl = `https://trackly.app/track/${delivery.id}`;

function copyTrackingLink() {
  navigator.clipboard.writeText(trackingUrl);
  // Toast: "Lien copié !"
}
```

### Envoi du lien par SMS (à implémenter)

```typescript
// Via Twilio ou autre service SMS
async function sendTrackingLink(deliveryId: string, customerPhone: string) {
  const trackingUrl = `https://trackly.app/track/${deliveryId}`;
  await smsService.send(customerPhone, 
    `Votre colis arrive ! Suivez-le : ${trackingUrl}`
  );
}
```

## Personnalisation

### Logo

Le logo actuel est un placeholder (lettre "T" dans un carré teal).

Pour ajouter un vrai logo :

1. Ajouter le fichier dans `public/logo.svg`
2. Modifier `components/TrackingHeader.tsx` :

```tsx
<img src="/logo.svg" alt="Trackly" className="w-10 h-10" />
```

### Informations de contact

Les numéros de téléphone et emails sont actuellement hardcodés.

Pour les rendre dynamiques :

1. Ajouter les champs dans `DeliveryDetailResponse` (backend)
2. Les passer depuis la page vers `ActionButtons`

```tsx
<ActionButtons
  driverPhone={delivery.driverPhone}
  businessPhone={delivery.businessPhone}
  businessEmail={delivery.businessEmail}
  businessWhatsApp={delivery.businessWhatsApp}
/>
```

### Géocodage

Pour afficher la vraie position sur la carte, intégrer une API de géocodage :

**Option 1 : Nominatim (gratuit)**

```typescript
async function geocodeAddress(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return DEFAULT_CENTER;
}
```

**Option 2 : Google Maps Geocoding API** (payant mais précis)

```typescript
async function geocodeAddress(address: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    return [lat, lng];
  }
  return DEFAULT_CENTER;
}
```

### Tracking GPS en temps réel

Pour afficher la position du livreur en temps réel :

1. Connecter SignalR dans la page de suivi
2. Afficher un marker mobile sur la carte

```typescript
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl(`${API_BASE_URL}/hubs/tracking`)
  .build();

connection.on('LocationUpdated', (driverId, lat, lng) => {
  // Mettre à jour la position du marker sur la carte
});

await connection.start();
await connection.invoke('StartTracking', deliveryId);
```

## Déploiement

### Vercel (recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

Configurer les variables d'environnement dans le dashboard Vercel.

### Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Créer un nouveau projet
railway init

# Déployer
railway up
```

### Docker

Créer un `Dockerfile` :

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3004
ENV PORT 3004
CMD ["node", "server.js"]
```

Build et run :

```bash
docker build -t trackly-tracking .
docker run -p 3004:3004 -e NEXT_PUBLIC_API_URL=https://api.trackly.app trackly-tracking
```

## Monitoring

### Analytics (à ajouter)

Intégrer Google Analytics ou Plausible :

```tsx
// app/layout.tsx
import Script from 'next/script';

<Script src="https://plausible.io/js/script.js" data-domain="trackly.app" />
```

### Error Tracking (à ajouter)

Intégrer Sentry :

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.config.js
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Troubleshooting

### La carte ne s'affiche pas

- Vérifier que `DeliveryMap` est chargé avec `dynamic` et `ssr: false`
- Vérifier les erreurs dans la console (API Leaflet)

### Erreur CORS

- Vérifier la configuration CORS du backend
- Vérifier la variable `NEXT_PUBLIC_API_URL`

### Erreur 404 sur l'API

- Vérifier que le backend est lancé
- Vérifier l'URL de l'API dans `.env.local`

### Les boutons d'action ne fonctionnent pas

- Vérifier les numéros de téléphone (format international : +33...)
- Tester sur un appareil mobile (les liens `tel:` ne fonctionnent pas sur desktop)

## Support

Pour toute question ou problème, consulter :
- Documentation principale : `docs/README.md`
- Architecture : `docs/ARCHITECTURE.md`
- Issues GitHub : `https://github.com/trackly/trackly/issues`
