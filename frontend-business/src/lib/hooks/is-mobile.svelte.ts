import { MediaQuery } from "svelte/reactivity";

/** Breakpoint en px en dessous duquel la sidebar passe en mode mobile (sheet). 1024 = lg. */
const DEFAULT_MOBILE_BREAKPOINT = 1024;

export class IsMobile extends MediaQuery {
	constructor(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
		super(`max-width: ${breakpoint - 1}px`);
	}
}
