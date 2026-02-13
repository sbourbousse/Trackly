/**
 * Configuration runtime injectée au démarrage du container
 * Le fichier runtime-config.js est généré par generate-runtime-config.js
 */
export interface RuntimeConfig {
  API_BASE_URL: string;
  SIGNALR_URL: string;
  DEFAULT_TENANT_ID: string;
  TENANT_BOOTSTRAP: string;
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

/**
 * Obtient la configuration runtime avec des fallbacks appropriés
 */
export function getRuntimeConfig(): RuntimeConfig {
  // En développement, utiliser les variables d'environnement Vite
  if (import.meta.env.DEV) {
    return {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5257',
      SIGNALR_URL: import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5257/hubs/tracking',
      DEFAULT_TENANT_ID: import.meta.env.VITE_DEFAULT_TENANT_ID || '',
      TENANT_BOOTSTRAP: import.meta.env.VITE_TENANT_BOOTSTRAP || ''
    };
  }

  // En production, utiliser la configuration runtime
  if (window.__RUNTIME_CONFIG__) {
    return window.__RUNTIME_CONFIG__;
  }

  // Fallback: URL Railway si aucune config n'est disponible
  console.warn('[Config] Configuration runtime non disponible, utilisation de Railway');
  return {
    API_BASE_URL: 'https://trackly-backend-production.up.railway.app',
    SIGNALR_URL: 'https://trackly-backend-production.up.railway.app/hubs/tracking',
    DEFAULT_TENANT_ID: '',
    TENANT_BOOTSTRAP: 'true'
  };
}
