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

/** URL de l'API en production quand la config runtime est absente ou vide (ex. déploiement statique Vercel). */
const PRODUCTION_API_BASE = 'https://api.arrivo.pro';
const PRODUCTION_SIGNALR = `${PRODUCTION_API_BASE}/hubs/tracking`;

function isProductionOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  const origin = window.location?.origin ?? '';
  return origin !== '' && !origin.startsWith('http://localhost') && !origin.startsWith('http://127.0.0.1');
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

  const runtime = window.__RUNTIME_CONFIG__;
  const hasValidApiUrl = runtime && (runtime.API_BASE_URL?.trim().length ?? 0) > 0;

  if (runtime && hasValidApiUrl) {
    return runtime;
  }

  // En production (origin non localhost), ne jamais utiliser localhost
  if (isProductionOrigin()) {
    if (runtime && !hasValidApiUrl) {
      console.warn('[Config] API_BASE_URL manquant dans la config runtime, utilisation de', PRODUCTION_API_BASE);
    } else {
      console.warn('[Config] Configuration runtime non disponible, utilisation de', PRODUCTION_API_BASE);
    }
    return {
      API_BASE_URL: PRODUCTION_API_BASE,
      SIGNALR_URL: PRODUCTION_SIGNALR,
      DEFAULT_TENANT_ID: runtime?.DEFAULT_TENANT_ID ?? '',
      TENANT_BOOTSTRAP: runtime?.TENANT_BOOTSTRAP ?? 'true'
    };
  }

  // Fallback local (build prod servi en local)
  return {
    API_BASE_URL: 'http://localhost:5257',
    SIGNALR_URL: 'http://localhost:5257/hubs/tracking',
    DEFAULT_TENANT_ID: runtime?.DEFAULT_TENANT_ID ?? '',
    TENANT_BOOTSTRAP: runtime?.TENANT_BOOTSTRAP ?? 'true'
  };
}
