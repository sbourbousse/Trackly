/**
 * Store réactif pour le mode offline/démo
 */

import { browser } from '$app/environment';

export let offlineState = $state({
	isOffline: false
});

/**
 * Initialise le mode offline depuis localStorage
 */
export function initOfflineMode(): void {
	if (!browser) return;
	
	// Vérifier d'abord la variable d'environnement
	const envValue = import.meta.env.PUBLIC_OFFLINE_MODE;
	if (envValue === 'true' || envValue === '1') {
		offlineState.isOffline = true;
		console.log('[Offline] 🔌 Mode offline ACTIVÉ via env');
		return;
	}
	
	// Vérifier le localStorage
	if (window.localStorage) {
		const stored = localStorage.getItem('trackly_offline_mode');
		offlineState.isOffline = stored === 'true';
		if (offlineState.isOffline) {
			console.log('[Offline] 🔌 Mode offline ACTIVÉ via localStorage');
		}
	}
}

/**
 * Active ou désactive le mode offline dynamiquement
 */
export function setOfflineModeReactive(enabled: boolean): void {
	if (!browser) return;
	
	offlineState.isOffline = enabled;
	
	if (window.localStorage) {
		localStorage.setItem('trackly_offline_mode', enabled ? 'true' : 'false');
		console.log(`[Offline] Mode ${enabled ? 'activé' : 'désactivé'}`);
	}
}

// Initialiser au chargement
if (browser) {
	initOfflineMode();
}
