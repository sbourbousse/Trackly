# Correction du Mode Démo

## Problème Initial

Lorsque l'utilisateur cliquait sur le bouton "Mode demo" dans la page de connexion, le système effectuait simplement une redirection vers `/dashboard` sans configurer correctement le mode démo. Résultat :
- Un `tenantId` réel (ou aucun) était utilisé au lieu du `DEMO_TENANT_ID`
- Aucune donnée de démonstration n'était chargée
- Le mode offline n'était pas activé
- Le banner de démo n'apparaissait pas

## Solution Implémentée

### 1. Nouveau Store Réactif pour le Mode Offline

**Fichier créé :** `frontend-business/src/lib/stores/offline.svelte.ts`

Ce store réactif Svelte 5 permet de :
- Gérer l'état du mode offline de manière réactive
- Initialiser automatiquement le mode depuis `localStorage` ou les variables d'environnement
- Permettre l'activation/désactivation dynamique du mode offline

```typescript
export let offlineState = $state({
	isOffline: false
});

export function setOfflineModeReactive(enabled: boolean): void {
	offlineState.isOffline = enabled;
	localStorage.setItem('trackly_offline_mode', enabled ? 'true' : 'false');
}
```

### 2. Fonction de Gestion du Mode Démo

**Fichier modifié :** `frontend-business/src/routes/login/+page.svelte`

Ajout de la fonction `handleDemoMode()` qui :
1. Active le mode offline/démo via le store réactif
2. Configure le `DEMO_TENANT_ID` dans le localStorage
3. Configure un token de démo
4. Authentifie l'utilisateur avec des données de démo
5. Redirige vers le dashboard

```typescript
async function handleDemoMode() {
	loading = true;
	try {
		// Activer le mode offline/démo
		setOfflineModeReactive(true);

		// Configurer les données de démo
		const demoToken = 'demo-token-' + Date.now();
		localStorage.setItem('trackly_auth_token', demoToken);
		localStorage.setItem('trackly_tenant_id', DEMO_TENANT_ID);

		// Authentifier avec les données de démo
		authActions.setTenantId(DEMO_TENANT_ID);
		authActions.setToken(demoToken);
		authActions.login({
			id: 'demo-user-001',
			name: 'Utilisateur Démo',
			email: 'demo@trackly.com',
			plan: 'Starter'
		});

		console.log('[Demo] Mode démo activé avec tenantId:', DEMO_TENANT_ID);

		// Rediriger vers le dashboard
		await goto('/dashboard');
	} catch (err) {
		error = err instanceof Error ? err.message : "Erreur lors de l'activation du mode démo";
	} finally {
		loading = false;
	}
}
```

### 3. Modification du Bouton "Mode demo"

**Avant :**
```html
<Button type="button" variant="link" href="/dashboard" class="h-auto p-0 text-sm">
	Mode demo
</Button>
```

**Après :**
```html
<Button 
	type="button" 
	variant="link" 
	onclick={handleDemoMode} 
	class="h-auto p-0 text-sm"
	disabled={loading}
>
	Mode demo
</Button>
```

Le bouton appelle maintenant la fonction `handleDemoMode()` au lieu de faire une simple redirection.

### 4. DemoBanner Réactif

**Fichier modifié :** `frontend-business/src/lib/components/DemoBanner.svelte`

Le composant utilise maintenant le store réactif au lieu d'une fonction non-réactive :

**Avant :**
```typescript
let showBanner = $derived(isOfflineMode());
```

**Après :**
```typescript
import { offlineState } from '../stores/offline.svelte';
let showBanner = $derived(offlineState.isOffline);
```

Cela permet au banner de s'afficher immédiatement quand le mode démo est activé, sans nécessiter de rechargement de page.

### 5. Mise à Jour de la Configuration Offline

**Fichier modifié :** `frontend-business/src/lib/offline/config.ts`

La fonction `isOfflineMode()` lit maintenant l'état depuis le store réactif pour maintenir la cohérence dans toute l'application.

## Résultat

Maintenant, lorsque l'utilisateur clique sur "Mode demo" :

1. ✅ Le mode offline est activé
2. ✅ Le `DEMO_TENANT_ID` (`'demo-tenant-fake-001'`) est configuré
3. ✅ Un token de démo est généré et stocké
4. ✅ L'utilisateur est authentifié avec les données de démo
5. ✅ Le banner de démo s'affiche en haut de la page
6. ✅ Toutes les API utilisent les données de démonstration fictives
7. ✅ Aucune donnée réelle n'est accessible en mode démo

## Données de Démo Disponibles

En mode démo, l'utilisateur a accès à :

- **Livreurs fictifs** : 3 livreurs (Alice Martin, Bob Bernard, Carla Dubois)
- **Clients fictifs** : 8 entreprises avec adresses à Montpellier
- **Commandes fictives** : 8 commandes réparties entre J-7 et J+7 avec des statuts cohérents :
  - Commandes passées (J-7 à J-1) : statut "Delivered" (livrées)
  - Commandes d'aujourd'hui (J) : statut "InDelivery" (en cours de livraison)
  - Commandes futures (J+1 à J+7) : statut "Pending" (en attente)
- **Livraisons fictives** : Associées aux commandes avec statuts cohérents :
  - Livraisons passées : statut "Completed" avec date de complétion
  - Livraisons d'aujourd'hui : statut "InProgress"
  - Livraisons futures : statut "Pending"
- **Tournées fictives** : Plusieurs tournées générées dynamiquement selon les dates des commandes
  - Tournées passées : statut "Completed"
  - Tournée d'aujourd'hui : statut "Active"
  - Tournées futures : statut "Pending"
- **Tenant ID** : `demo-tenant-fake-001` (isolé des vraies données)

### Cohérence Temporelle

Les données de démo sont générées dynamiquement en fonction de la date actuelle :
- Les dates sont réparties entre **J-7 (il y a 7 jours)** et **J+7 (dans 7 jours)**
- Les heures de commande sont aléatoires entre 8h et 18h
- Les statuts correspondent logiquement aux dates (terminé pour le passé, en cours pour aujourd'hui, planifié pour le futur)
- Les dates de complétion des livraisons sont cohérentes (2 à 8 heures après la création)

## Tests Recommandés

1. Cliquer sur "Mode demo" depuis la page de connexion
2. Vérifier que le banner orange apparaît en haut du dashboard
3. Vérifier que les commandes affichées sont fictives
4. Vérifier dans la console que le tenantId est `demo-tenant-fake-001`
5. Vérifier qu'aucune donnée réelle n'est accessible

## Notes Techniques

- Le mode démo persiste dans le `localStorage` jusqu'à ce qu'il soit désactivé
- Le banner est affiché sur toutes les pages en mode démo
- Les appels API sont interceptés et retournent des données fictives
- La latence réseau est simulée avec un délai de 300ms
