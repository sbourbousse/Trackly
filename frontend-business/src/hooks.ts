import type { Handle } from '@sveltejs/kit';

// Routes publiques (pas besoin d'authentification)
const publicRoutes = ['/login', '/register', '/auth/callback', '/logout'];

export const handle: Handle = async ({ event, resolve }) => {
	const { url } = event;
	const path = url.pathname;

	// Vérifier si c'est une route publique
	const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

	// Vérifier le token d'authentification
	const authToken = event.cookies.get('trackly_auth_token') || 
		event.request.headers.get('authorization')?.replace('Bearer ', '');

	// Si pas authentifié et route privée, rediriger vers login
	if (!isPublicRoute && !authToken && path !== '/') {
		return new Response(null, {
			status: 302,
			headers: { location: '/login' }
		});
	}

	// Si authentifié et sur login, rediriger vers dashboard
	if (authToken && path === '/login') {
		return new Response(null, {
			status: 302,
			headers: { location: '/dashboard' }
		});
	}

	return resolve(event);
};
