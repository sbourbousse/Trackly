import { getRuntimeConfig } from '../config';
import { offlineConfig } from '../offline/config';
import { mockTenantApi } from '../offline/mockApi';

function getBaseUrl(): string {
  const config = getRuntimeConfig();
  const url = config.API_BASE_URL?.trim() || '';
  if (url) return url;
  return typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('http://localhost')
    ? 'https://api.arrivo.pro'
    : 'http://localhost:5257';
}

const baseUrl = getBaseUrl();
const config = getRuntimeConfig();

console.info('[Driver] Configuration:');
console.info('[Driver] - API_BASE_URL:', config.API_BASE_URL || '(fallback)');
console.info('[Driver] - baseUrl used:', baseUrl);
console.info('[Driver] - Mode offline:', offlineConfig.enabled ? 'ACTIVÉ' : 'désactivé');

// Récupère ou récupère le TenantId depuis le backend
let cachedTenantId: string | null = null;

/**
 * Définit le tenant ID manuellement (utilisé après connexion du driver)
 */
export const setTenantId = (tenantId: string): void => {
	cachedTenantId = tenantId;
	localStorage.setItem('trackly_tenant_id', tenantId);
	console.log('[API] Tenant ID défini:', tenantId);
};

/**
 * Récupère le tenant ID d'un driver depuis l'API
 */
export const getDriverTenantId = async (driverId: string): Promise<string | null> => {
	// Mode offline: utiliser les mocks
	if (offlineConfig.enabled) {
		const data = await mockTenantApi.getDriverTenantId(driverId);
		setTenantId(data.tenantId);
		return data.tenantId;
	}

	try {
		const response = await fetch(`${baseUrl}/api/drivers/${driverId}/tenant`);
		if (response.ok) {
			const data = await response.json() as { tenantId: string };
			setTenantId(data.tenantId);
			return data.tenantId;
		}
	} catch (error) {
		console.warn('[API] Impossible de récupérer le tenant ID du driver:', error);
	}
	return null;
};

export const getTenantId = async (): Promise<string | null> => {
	// Mode offline: utiliser les mocks
	if (offlineConfig.enabled) {
		if (!cachedTenantId) {
			cachedTenantId = await mockTenantApi.getTenantId();
			localStorage.setItem('trackly_tenant_id', cachedTenantId);
		}
		return cachedTenantId;
	}

	// Utilise le cache si disponible
	if (cachedTenantId) return cachedTenantId;
	
	// Vérifie le localStorage
	const stored = localStorage.getItem('trackly_tenant_id');
	if (stored) {
		cachedTenantId = stored;
		return stored;
	}
	
	// Récupère depuis l'env si disponible
	const config = getRuntimeConfig();
	const envTenantId = config.DEFAULT_TENANT_ID;
	if (envTenantId) {
		cachedTenantId = envTenantId;
		localStorage.setItem('trackly_tenant_id', envTenantId);
		return envTenantId;
	}
	
	// En développement ou bootstrap explicite, récupère depuis l'API
	const allowBootstrap = import.meta.env.DEV || config.TENANT_BOOTSTRAP === 'true';
	if (allowBootstrap) {
		try {
			const response = await fetch(`${baseUrl}/api/tenants/default`);
			if (response.ok) {
				const data = await response.json() as { id: string };
				cachedTenantId = data.id;
				localStorage.setItem('trackly_tenant_id', data.id);
				return data.id;
			}
		} catch (error) {
			console.warn('[API] Impossible de récupérer le tenant par défaut:', error);
		}
	}
	
	return null;
};

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public details?: string
	) {
		super(message);
	}
}

export const apiFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
	const tenantId = await getTenantId();
	
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(init.headers as Record<string, string> || {})
	};

	// Ajoute le header TenantId si disponible
	if (tenantId) {
		headers['X-Tenant-Id'] = tenantId;
	}

	const url = `${baseUrl}${path}`;

	try {
		const response = await fetch(url, {
			headers,
			...init
		});

		if (!response.ok) {
			const details = await response.text();
			throw new ApiError(`Erreur API: ${response.status} ${response.statusText}`, response.status, details);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError('Erreur de connexion au serveur', 0, error instanceof Error ? error.message : String(error));
	}
};
