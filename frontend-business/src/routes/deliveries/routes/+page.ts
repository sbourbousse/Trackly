import { redirect } from '@sveltejs/kit';

/** Redirige vers la page fusionnée Livraisons & tournées, onglet Tournées. */
export function load() {
	throw redirect(302, '/deliveries?tab=routes');
}
