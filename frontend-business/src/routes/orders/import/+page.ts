import { redirect } from '@sveltejs/kit';

/** Redirige vers la page des commandes (page d'import cachée). */
export function load() {
	throw redirect(302, '/orders');
}
