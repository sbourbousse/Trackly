/**
 * Libellés de date relative pour tooltips et affichages planificateur.
 * Pensé évolutif : pourra être étendu (switch absolu/relatif, locale, config période).
 */

/**
 * Parse une clé de période (YYYY-MM-DD ou YYYY-MM) en Date à minuit (locale).
 */
export function parsePeriodKey(periodKey: string): Date | null {
	if (!periodKey || typeof periodKey !== 'string') return null;
	const parts = periodKey.trim().split('-');
	if (parts.length >= 2) {
		const y = parseInt(parts[0]!, 10);
		const m = parseInt(parts[1]!, 10) - 1;
		const d = parts.length >= 3 ? parseInt(parts[2]!, 10) : 1;
		if (!Number.isNaN(y) && !Number.isNaN(m)) {
			const date = new Date(y, m, d);
			if (!Number.isNaN(date.getTime())) return date;
		}
	}
	return null;
}

/**
 * Nombre de jours entre deux dates (dates à minuit, différence en jours entiers).
 * diff = today - date : positif = date dans le passé, négatif = date dans le futur.
 */
function daysDiff(date: Date, today: Date): number {
	const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.round((d1.getTime() - d0.getTime()) / 86400000);
}

/**
 * Retourne un libellé relatif pour une date : "Aujourd'hui", "Hier", "Il y a 2 jours", "Demain", etc.
 * diff = today - date : positif = date dans le passé, négatif = date dans le futur.
 */
export function getRelativeDateLabel(periodKey: string, todayRef: Date = new Date()): string {
	const date = parsePeriodKey(periodKey);
	if (!date) return periodKey;

	const today = new Date(todayRef.getFullYear(), todayRef.getMonth(), todayRef.getDate());
	const diff = daysDiff(date, today);

	if (diff === 0) return "Aujourd'hui";
	if (diff === 1) return 'Hier';
	if (diff === -1) return 'Demain';
	if (diff > 1 && diff <= 7) return `Il y a ${diff} jours`;
	if (diff < -1 && diff >= -7) return `Dans ${-diff} jours`;
	if (diff > 7 && diff <= 14) return 'Il y a 2 semaines';
	if (diff < -7 && diff >= -14) return 'Dans 2 semaines';
	if (diff > 14 && diff <= 31) return `Il y a ${Math.round(diff / 7)} semaines`;
	if (diff < -14 && diff >= -31) return `Dans ${Math.round(-diff / 7)} semaines`;

	// Fallback : date formatée
	return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Formate une clé période pour affichage absolu (axe X, tooltip secondaire).
 */
export function formatPeriodKeyAbsolute(periodKey: string, byMonth: boolean): string {
	const date = parsePeriodKey(periodKey);
	if (!date) return periodKey;
	if (byMonth) {
		return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
	}
	return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
