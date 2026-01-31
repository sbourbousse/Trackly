// Désactive le SSR : cette page utilise tracking.svelte.ts qui charge @microsoft/signalr
// (APIs navigateur uniquement). Évite une erreur 500 lors du chargement du module côté serveur.
export const ssr = false;
