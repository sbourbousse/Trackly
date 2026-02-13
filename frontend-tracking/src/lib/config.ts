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
  
  // Fallback pour le développement
  return {
    API_URL: 'http://localhost:5257',
    SIGNALR_URL: 'http://localhost:5257/hubs/tracking',
  };
}