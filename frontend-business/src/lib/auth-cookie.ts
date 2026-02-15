/**
 * Cookie d'auth pour que le serveur (SSR + hooks) sache si l'utilisateur est connecté.
 * Synchronisé avec localStorage/sessionStorage au login et supprimé au logout.
 */
const COOKIE_NAME = 'trackly_auth_token';
const MAX_AGE_7_DAYS = 60 * 60 * 24 * 7;

export function setAuthCookie(token: string, remember: boolean): void {
	if (typeof document === 'undefined') return;
	const maxAge = remember ? MAX_AGE_7_DAYS : undefined;
	const parts = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, 'path=/', 'SameSite=Lax'];
	if (maxAge != null) parts.push(`max-age=${maxAge}`);
	document.cookie = parts.join('; ');
}

export function clearAuthCookie(): void {
	if (typeof document === 'undefined') return;
	document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
