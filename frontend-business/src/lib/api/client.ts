import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

const baseUrl = env.PUBLIC_API_BASE_URL || 'http://localhost:5257';

// Récupère ou récupère le TenantId depuis le backend
let cachedTenantId: string | null = null;

const getTenantId = async (): Promise<string | null> => {
	if (!browser) return null;
	
	// Utilise le cache si disponible
	if (cachedTenantId) return cachedTenantId;
	
	// Vérifie le localStorage
	const stored = localStorage.getItem('trackly_tenant_id');
	if (stored) {
		cachedTenantId = stored;
		return stored;
	}
	
	// Récupère depuis l'env si disponible
	const envTenantId = env.PUBLIC_DEFAULT_TENANT_ID;
	if (envTenantId) {
		cachedTenantId = envTenantId;
		localStorage.setItem('trackly_tenant_id', envTenantId);
		return envTenantId;
	}
	
	// En développement, récupère depuis l'API
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
	
	console.log('[API]', init.method || 'GET', url, tenantId ? `(Tenant: ${tenantId.slice(0, 8)}...)` : '(No Tenant)');

	try {
		const response = await fetch(url, {
			headers,
			...init
		});

		if (!response.ok) {
			const details = await response.text();
			console.error('[API Error]', response.status, response.statusText, details);
			throw new ApiError(`Erreur API: ${response.status} ${response.statusText}`, response.status, details);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		const data = await response.json();
		console.log('[API Success]', path, Array.isArray(data) ? `${data.length} items` : 'data');
		return data as T;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		console.error('[API Fetch Error]', error);
		throw new ApiError('Erreur de connexion au serveur', 0, error instanceof Error ? error.message : String(error));
	}
};
