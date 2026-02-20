type CacheRecord<T> = {
	data: T;
	updatedAt: number;
	staleAt: number;
	expiresAt: number;
};

const queryCache = new Map<string, CacheRecord<unknown>>();
const inFlightQueries = new Map<string, Promise<unknown>>();

function stableSerialize(value: unknown): string {
	if (value == null) return String(value);
	if (typeof value !== 'object') return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((v) => stableSerialize(v)).join(',')}]`;
	const entries = Object.entries(value as Record<string, unknown>)
		.filter(([, v]) => v !== undefined)
		.sort(([a], [b]) => a.localeCompare(b));
	return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`).join(',')}}`;
}

/** Génère une clé stable pour le cache à partir d'un scope + payload. */
export function buildQueryCacheKey(scope: string, payload: unknown): string {
	return `${scope}:${stableSerialize(payload)}`;
}

/** Retourne une entrée cache si non expirée, sinon null. */
export function getQueryCache<T>(key: string): CacheRecord<T> | null {
	const record = queryCache.get(key) as CacheRecord<T> | undefined;
	if (!record) return null;
	if (record.expiresAt <= Date.now()) {
		queryCache.delete(key);
		return null;
	}
	return record;
}

/** Enregistre une donnée dans le cache avec TTL et staleTime. */
export function setQueryCache<T>(
	key: string,
	data: T,
	options?: { staleTimeMs?: number; cacheTimeMs?: number }
): CacheRecord<T> {
	const staleTimeMs = options?.staleTimeMs ?? 30_000;
	const cacheTimeMs = options?.cacheTimeMs ?? 5 * 60_000;
	const now = Date.now();
	const record: CacheRecord<T> = {
		data,
		updatedAt: now,
		staleAt: now + staleTimeMs,
		expiresAt: now + cacheTimeMs
	};
	queryCache.set(key, record as CacheRecord<unknown>);
	return record;
}

/** Indique si une entrée cache est encore fraîche (non stale). */
export function isCacheFresh(record: { staleAt: number }): boolean {
	return record.staleAt > Date.now();
}

/** Déduplique les requêtes concurrentes pour une même clé. */
export async function runQueryDeduped<T>(key: string, loader: () => Promise<T>): Promise<T> {
	const existing = inFlightQueries.get(key) as Promise<T> | undefined;
	if (existing) return existing;
	const promise = loader().finally(() => {
		inFlightQueries.delete(key);
	});
	inFlightQueries.set(key, promise as Promise<unknown>);
	return promise;
}

/** Invalide les entrées commençant par un préfixe de clé. */
export function invalidateQueryCachePrefix(prefix: string): void {
	for (const key of queryCache.keys()) {
		if (key.startsWith(prefix)) queryCache.delete(key);
	}
}

/** Vide tout le cache de requêtes (utile au logout). */
export function clearQueryCache(): void {
	queryCache.clear();
	inFlightQueries.clear();
}
