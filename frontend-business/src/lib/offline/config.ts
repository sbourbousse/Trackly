/**
 * Configuration centralisée pour le mode offline/démo
 * 
 * Pour activer le mode offline, définir la variable d'environnement:
 * PUBLIC_OFFLINE_MODE=true
 * 
 * Ou utiliser setOfflineModeReactive() depuis le store offline.svelte.ts
 */

import { offlineState } from '../stores/offline.svelte';

export interface OfflineConfig {
  mockDelay: number; // Délai en ms pour simuler la latence réseau
}

/**
 * Vérifie si le mode offline est activé
 * Cette fonction lit l'état réactif du store
 */
export function isOfflineMode(): boolean {
  // En SvelteKit, utiliser import.meta.env côté client
  if (typeof window === 'undefined') {
    return false; // Côté serveur, toujours désactiver
  }

  return offlineState.isOffline;
}

/**
 * Active ou désactive le mode offline dynamiquement
 * @deprecated Utiliser setOfflineModeReactive() depuis offline.svelte.ts à la place
 */
export function setOfflineMode(enabled: boolean): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('trackly_offline_mode', enabled ? 'true' : 'false');
    offlineState.isOffline = enabled;
    console.log(`[Offline] Mode ${enabled ? 'activé' : 'désactivé'}`);
  }
}

/**
 * Configuration du mode offline
 */
export const offlineConfig: OfflineConfig = {
  mockDelay: 300 // 300ms de délai pour simuler le réseau
};
