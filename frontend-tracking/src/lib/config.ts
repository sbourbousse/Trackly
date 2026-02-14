export interface RuntimeConfig {
  API_URL: string;
  SIGNALR_URL: string;
}

export function getRuntimeConfig(): RuntimeConfig {
  // En production, utilise les variables d'environnement
  if (typeof window !== 'undefined') {
    // Essaye de récupérer depuis les variables d'environnement Next.js
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const signalrUrl = process.env.NEXT_PUBLIC_SIGNALR_URL;
    
    if (apiUrl && signalrUrl) {
      return {
        API_URL: apiUrl,
        SIGNALR_URL: signalrUrl,
      };
    }
  }
  
  // Détection environnement (prod vs dev)
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // Fallback: Railway en prod, localhost en dev
  return {
    API_URL: isDev ? 'http://localhost:5257' : 'https://backend-production-050e.up.railway.app',
    SIGNALR_URL: isDev ? 'http://localhost:5257/hubs/tracking' : 'https://backend-production-050e.up.railway.app/hubs/tracking',
  };
}