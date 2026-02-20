import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { clearAuthCache } from '$lib/api/client';
import { clearAuthCookie } from '$lib/auth-cookie';
import { authActions } from '$lib/stores/auth.svelte';
import { settingsActions } from '$lib/stores/settings.svelte';
import { ordersActions } from '$lib/stores/orders.svelte';
import { deliveriesActions } from '$lib/stores/deliveries.svelte';
import { dateRangeActions } from '$lib/stores/dateRange.svelte';
import { mapFilters } from '$lib/stores/mapFilters.svelte';
import { setOfflineModeReactive } from '$lib/stores/offline.svelte';
import { clearQueryCache } from '$lib/stores/queryCache.svelte';
import { clearGeocodeCache } from '$lib/utils/geocoding';

interface User {
	id: string;
	name: string;
	email: string;
}

interface Tenant {
	id: string;
	name: string;
}

// Load from localStorage if available
function loadFromStorage(): { user: User | null; tenant: Tenant | null } {
	if (!browser) return { user: null, tenant: null };
	try {
		const userStr = localStorage.getItem('trackly_user');
		const tenantStr = localStorage.getItem('trackly_tenant');
		return {
			user: userStr ? JSON.parse(userStr) : null,
			tenant: tenantStr ? JSON.parse(tenantStr) : null
		};
	} catch {
		return { user: null, tenant: null };
	}
}

const stored = loadFromStorage();
/** Objet réactif exporté : on ne fait que muter .user et .tenant (pas de réassignation) pour respecter Svelte 5. */
export const userStateReactive = $state<{ user: User | null; tenant: Tenant | null }>({
	user: stored.user,
	tenant: stored.tenant
});

// Save to localStorage when changed
function saveToStorage() {
	if (!browser) return;
	const u = userStateReactive.user;
	const t = userStateReactive.tenant;
	if (u) {
		localStorage.setItem('trackly_user', JSON.stringify(u));
	} else {
		localStorage.removeItem('trackly_user');
	}
	if (t) {
		localStorage.setItem('trackly_tenant', JSON.stringify(t));
	} else {
		localStorage.removeItem('trackly_tenant');
	}
}

export const userState = {
	get user() {
		return userStateReactive.user;
	},
	get tenant() {
		return userStateReactive.tenant;
	},
	get isAuthenticated() {
		return !!userStateReactive.user && !!localStorage.getItem('trackly_auth_token');
	},
	setUser(u: User | null) {
		userStateReactive.user = u;
		saveToStorage();
	},
	setTenant(t: Tenant | null) {
		userStateReactive.tenant = t;
		saveToStorage();
	},
	logout() {
		userStateReactive.user = null;
		userStateReactive.tenant = null;
		if (browser) {
			clearQueryCache();
			setOfflineModeReactive(false);
			localStorage.removeItem('trackly_auth_token');
			localStorage.removeItem('trackly_user');
			localStorage.removeItem('trackly_tenant');
			localStorage.removeItem('trackly_tenant_id');
			localStorage.removeItem('trackly-settings');
			localStorage.removeItem('trackly-date-range');
			localStorage.removeItem('trackly_map_filters');
			sessionStorage.removeItem('trackly_auth_token');
			sessionStorage.removeItem('trackly_tenant_id');
			clearAuthCookie();
			clearAuthCache();
			clearGeocodeCache();
			settingsActions.reset();
			ordersActions.reset();
			deliveriesActions.reset();
			dateRangeActions.reset();
			mapFilters.reset();
		}
		authActions.logout();
		goto('/login');
	}
};
