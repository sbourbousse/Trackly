const STORAGE_KEY = 'trackly-theme';

export type Theme = 'light' | 'dark';

export let themeState = $state({ value: 'light' as Theme, initialized: false });

export function setTheme(value: Theme) {
	themeState.value = value;
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', value === 'dark');
		localStorage.setItem(STORAGE_KEY, value);
	}
}

export function toggleTheme() {
	setTheme(themeState.value === 'dark' ? 'light' : 'dark');
}

/** À appeler côté client pour synchroniser le store avec le DOM (script dans app.html a déjà mis la classe). */
export function initTheme() {
	if (typeof window === 'undefined') return;
	const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
	if (stored === 'dark' || stored === 'light') {
		themeState.value = stored;
	} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		themeState.value = 'dark';
	} else {
		themeState.value = 'light';
	}
	document.documentElement.classList.toggle('dark', themeState.value === 'dark');
	themeState.initialized = true;
}
