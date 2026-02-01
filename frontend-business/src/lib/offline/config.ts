/**
 * Configuration centralisée pour le mode offline/démo
 * 
 * Pour activer le mode offline, définir la variable d'environnement:
 * PUBLIC_OFFLINE_MODE=true
 * 
 * Ou modifier directement la valeur par défaut ci-dessous pour le développement
 */

export interface OfflineConfig {
  mockDelay: number; // Délai en ms pour simuler la latence réseau
}

// Track if we've already logged the offline mode status
let hasLoggedOfflineStatus = false;

/**
 * Log offline mode status (only once)
 */
function logOfflineStatus(): void {
  if (!hasLoggedOfflineStatus) {
    console.log('[Offline] 🔌 Mode offline ACTIVÉ - Utilisation des données de démonstration');
    hasLoggedOfflineStatus = true;
  }
}

/**
 * Vérifie si le mode offline est activé
 * Cette fonction doit être appelée à chaque fois pour éviter les problèmes SSR
 */
export function isOfflineMode(): boolean {
  // En SvelteKit, utiliser import.meta.env côté client
  if (typeof window === 'undefined') {
    return false; // Côté serveur, toujours désactiver
  }

  // Vérifier d'abord la variable d'environnement
  const envValue = import.meta.env.PUBLIC_OFFLINE_MODE;
  if (envValue === 'true' || envValue === '1') {
    logOfflineStatus();
    return true;
  }
  
  // Fallback: vérifier le localStorage pour permettre le toggle dynamique
  if (window.localStorage) {
    const stored = localStorage.getItem('trackly_offline_mode');
    if (stored === 'true') {
      logOfflineStatus();
      return true;
    }
  }
  
  return false;
}

/**
 * Active ou désactive le mode offline dynamiquement
 */
export function setOfflineMode(enabled: boolean): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('trackly_offline_mode', enabled ? 'true' : 'false');
    console.log(`[Offline] Mode ${enabled ? 'activé' : 'désactivé'}`);
  }
}

/**
 * Configuration du mode offline
 */
export const offlineConfig: OfflineConfig = {
  mockDelay: 300 // 300ms de délai pour simuler le réseau
};
