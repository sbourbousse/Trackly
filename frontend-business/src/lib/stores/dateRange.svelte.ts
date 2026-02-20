/**
 * Store "plage de travail" : plage de dates, plage horaire (créneaux rapides ou manuelle),
 * et type de filtre (création vs date commande).
 * Les heures ne s'appliquent qu'au cas "un seul jour" ou au créneau "nuit" en multi-jours.
 */
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateRange } from 'bits-ui';

export type DateFilterType = 'CreatedAt' | 'OrderDate';

/** Créneaux rapides : matin 6h-14h, après-midi 14h-22h, nuit 22h-6h (lendemain), journée = toute la journée. */
export type TimePreset = 'matin' | 'aprem' | 'nuit' | 'journee';

const defaultStart = today(getLocalTimeZone());
const defaultEnd = defaultStart;

const STORAGE_KEY = 'trackly-date-range';

/** Valeurs plage horaire pour chaque créneau (nuit : fin à 6h = lendemain). */
export const TIME_PRESET_RANGES: Record<TimePreset, { start: string; end: string } | null> = {
	matin: { start: '06:00', end: '14:00' },
	aprem: { start: '14:00', end: '22:00' },
	nuit: { start: '22:00', end: '06:00' },
	journee: null
};

function parseCalendarDate(s: string | null): CalendarDate | undefined {
	if (!s) return undefined;
	const [y, m, d] = s.split('-').map(Number);
	if (!y || !m || !d) return undefined;
	return new CalendarDate(y, m, d);
}

function getDefaultState() {
	return {
		dateRange: { start: defaultStart, end: defaultEnd } as DateRange,
		timeRange: null as { start: string; end: string } | null,
		timePreset: 'journee' as TimePreset,
		useManualTime: false,
		dateFilter: 'OrderDate' as DateFilterType
	};
}

export let dateRangeState = $state(getDefaultState());

/** Objet réactif : ready = true une fois la période restaurée depuis localStorage (côté client). Évite d'afficher brièvement la valeur par défaut. */
export const dateRangeUI = $state({ ready: false });

/** Index du raccourci sélectionné dans PRESETS (pour mettre en évidence dans la sidebar) */
export const selectedPresetState = $state({ index: null as number | null });

export const dateRangeActions = {
	setDateRange(value: DateRange) {
		dateRangeState.dateRange = value;
		const start = value.start;
		const end = value.end;
		if (!start || !end) return;

		const isMultiDay =
			start.year !== end.year || start.month !== end.month || start.day !== end.day;

		// Multi-jours : on n'applique les heures que pour le créneau "nuit". Sinon journée entière.
		if (isMultiDay) {
			if (dateRangeState.timePreset !== 'nuit') {
				dateRangeState.timeRange = null;
				dateRangeState.timePreset = 'journee';
				dateRangeState.useManualTime = false;
			} else {
				dateRangeState.timeRange = TIME_PRESET_RANGES.nuit;
			}
			return;
		}

		// Un seul jour : conserver le créneau ou journée entière.
		if (dateRangeState.timePreset === 'journee') {
			dateRangeState.timeRange = null;
		} else if (!dateRangeState.timeRange && !dateRangeState.useManualTime) {
			const presetRange = TIME_PRESET_RANGES[dateRangeState.timePreset];
			dateRangeState.timeRange = presetRange ?? { start: '08:00', end: '20:00' };
		}
	},
	/** Sélection "Toute période" : pas de filtre de dates. */
	setAllPeriod() {
		dateRangeState.dateRange = { start: undefined, end: undefined } as DateRange;
		dateRangeState.timeRange = null;
		dateRangeState.timePreset = 'journee';
		dateRangeState.useManualTime = false;
	},
	setTimeRange(value: { start: string; end: string } | null) {
		dateRangeState.timeRange = value;
	},
	setTimePreset(value: TimePreset) {
		dateRangeState.timePreset = value;
		const range = TIME_PRESET_RANGES[value];
		dateRangeState.timeRange = range ?? null;
	},
	setUseManualTime(value: boolean) {
		dateRangeState.useManualTime = value;
		if (value && !dateRangeState.timeRange) {
			dateRangeState.timeRange = { start: '08:00', end: '20:00' };
		}
	},
	setSelectedPresetIndex(value: number | null) {
		selectedPresetState.index = value;
	},
	setDateFilter(value: DateFilterType) {
		dateRangeState.dateFilter = value;
	},
	setDateFrom(value: string | undefined) {
		// Compatibilité : mise à jour manuelle des bornes string (si besoin)
		if (!value) return;
		const [y, m, d] = value.split('-').map(Number);
		if (y && m && d) {
			const start = new CalendarDate(y, m, d);
			dateRangeState.dateRange = {
				...dateRangeState.dateRange,
				start,
				end: dateRangeState.dateRange.end ?? start
			};
		}
	},
	setDateTo(value: string | undefined) {
		if (!value) return;
		const [y, m, d] = value.split('-').map(Number);
		if (y && m && d) {
			const end = new CalendarDate(y, m, d);
			dateRangeState.dateRange = {
				...dateRangeState.dateRange,
				start: dateRangeState.dateRange.start ?? end,
				end
			};
		}
	},
	setRange(dateFrom: string | undefined, dateTo: string | undefined) {
		if (!dateFrom || !dateTo) return;
		const [ys, ms, ds] = dateFrom.split('-').map(Number);
		const [ye, me, de] = dateTo.split('-').map(Number);
		if (ys && ms && ds && ye && me && de) {
			dateRangeState.dateRange = {
				start: new CalendarDate(ys, ms, ds),
				end: new CalendarDate(ye, me, de)
			};
		}
	},
	/** Réinitialise la plage et vide le localStorage. À appeler au logout. */
	reset() {
		dateRangeState.dateRange = getDefaultState().dateRange;
		dateRangeState.timeRange = getDefaultState().timeRange;
		dateRangeState.timePreset = getDefaultState().timePreset;
		dateRangeState.useManualTime = getDefaultState().useManualTime;
		dateRangeState.dateFilter = getDefaultState().dateFilter;
		if (typeof window !== 'undefined') {
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {
				// ignore
			}
		}
		selectedPresetState.index = 2; // Aujourd'hui
		dateRangeUI.ready = true;
	},
	/** Restaure la période depuis localStorage (à appeler au chargement, côté client). */
	restoreFromStorage() {
		if (typeof window === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) {
				selectedPresetState.index = 2; // Aujourd'hui
				dateRangeUI.ready = true;
				return;
			}
			const data = JSON.parse(raw) as {
				dateRange?: { start: string | null; end: string | null };
				timePreset?: TimePreset;
				useManualTime?: boolean;
				timeRange?: { start: string; end: string } | null;
				dateFilter?: DateFilterType;
			};
			const start = parseCalendarDate(data.dateRange?.start ?? null);
			const end = parseCalendarDate(data.dateRange?.end ?? null);
			if (start && end) {
				dateRangeState.dateRange = { start, end };
			} else if (data.dateRange && data.dateRange.start === null && data.dateRange.end === null) {
				dateRangeState.dateRange = { start: undefined, end: undefined } as DateRange;
			}
			if (data.timePreset) dateRangeState.timePreset = data.timePreset;
			if (typeof data.useManualTime === 'boolean') dateRangeState.useManualTime = data.useManualTime;
			if (data.timeRange) dateRangeState.timeRange = data.timeRange;
			else if (data.timeRange === null) dateRangeState.timeRange = null;
			// Toujours filtrer par date commande (plus de choix date création dans l'UI)
			dateRangeState.dateFilter = 'OrderDate';
		} catch {
			// ignore invalid stored data
		}
		dateRangeUI.ready = true;
	},
	/** Enregistre la période courante dans localStorage (appelé par le layout). */
	persistToStorage() {
		if (typeof window === 'undefined') return;
		try {
			const { dateRange, timePreset, useManualTime, timeRange, dateFilter } = dateRangeState;
			const start = dateRange.start?.toString() ?? null;
			const end = dateRange.end?.toString() ?? null;
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					dateRange: { start, end },
					timePreset,
					useManualTime,
					timeRange,
					dateFilter
				})
			);
		} catch {
			// ignore quota / private mode
		}
	}
};

/** Retourne true si la plage sélectionnée est un seul jour. */
export function isSingleDay(): boolean {
	const { start, end } = dateRangeState.dateRange;
	if (!start || !end) return false;
	return start.year === end.year && start.month === end.month && start.day === end.day;
}

/** Nombre de jours (inclus) dans la plage sélectionnée. 0 si plage invalide. */
export function getDateRangeDayCount(): number {
	const { start, end } = dateRangeState.dateRange;
	if (!start || !end) return 0;
	const startMs = new Date(start.year, start.month - 1, start.day).getTime();
	const endMs = new Date(end.year, end.month - 1, end.day).getTime();
	return Math.max(0, Math.floor((endMs - startMs) / 86400000) + 1);
}

/** Liste des clés jour (yyyy-MM-dd) pour chaque jour de la plage (inclus). Vide si plage invalide. */
export function getDateRangeDayKeys(): string[] {
	const { start, end } = dateRangeState.dateRange;
	if (!start || !end) return [];
	const keys: string[] = [];
	let d = start;
	const endStr = `${end.year}-${String(end.month).padStart(2, '0')}-${String(end.day).padStart(2, '0')}`;
	while (true) {
		const key = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
		keys.push(key);
		if (key === endStr) break;
		d = d.add({ days: 1 });
	}
	return keys;
}

/** Clé jour (yyyy-MM-dd) pour aujourd’hui (fuseau local). */
export function getTodayKey(): string {
	const t = today(getLocalTimeZone());
	return `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
}

/** Tranches 4h pour un jour : 6 clés yyyy-MM-dd-HH (00, 04, 08, 12, 16, 20) et libellés "0h–4h", etc. */
export function getDateRangeFourHourSlotKeys(dayKey: string): { keys: string[]; labels: string[] } {
	const slots = [0, 4, 8, 12, 16, 20];
	const labels = ['0h–4h', '4h–8h', '8h–12h', '12h–16h', '16h–20h', '20h–24h'];
	return {
		keys: slots.map((h) => `${dayKey}-${String(h).padStart(2, '0')}`),
		labels
	};
}

/** Index de la tranche 4h courante (0–5) si dayKey est aujourd’hui, sinon null. */
export function getCurrentFourHourSlotIndex(dayKey: string): number | null {
	if (dayKey !== getTodayKey()) return null;
	const now = new Date();
	const hour = now.getHours();
	const slot = Math.min(5, Math.floor(hour / 4));
	return slot;
}

/** Début du jour (00:00:00) en heure locale, puis ISO UTC pour l'API. Évite le décalage (ex. UTC+1 : "aujourd'hui" = 00h locale → bon créneau UTC). */
function toStartOfDayISO(d: CalendarDate): string {
	const dt = new Date(d.year, d.month - 1, d.day, 0, 0, 0, 0);
	return dt.toISOString();
}

/** Fin du jour (23:59:59.999) en heure locale, puis ISO UTC pour l'API. Inclut tout le dernier jour dans le fuseau de l'utilisateur. */
function toEndOfDayISO(d: CalendarDate): string {
	const dt = new Date(d.year, d.month - 1, d.day, 23, 59, 59, 999);
	return dt.toISOString();
}

/** Payload pour les requêtes GET list (orders/deliveries). dateFrom/dateTo en ISO datetime : dateFrom = début du premier jour, dateTo = fin du dernier jour (23h59) pour inclure toute la période. Nuit = fin à 6h le lendemain du dernier jour. */
export function getListFilters(): {
	dateFrom?: string;
	dateTo?: string;
	dateFilter: DateFilterType;
} {
	const { dateRange, dateFilter, timeRange, timePreset } = dateRangeState;
	const start = dateRange.start;
	const end = dateRange.end;
	if (!start || !end) return { dateFilter };
	if (!timeRange) {
		return {
			...(start && { dateFrom: toStartOfDayISO(start) }),
			...(end && { dateTo: toEndOfDayISO(end) }),
			dateFilter
		};
	}
	const toIso = (d: CalendarDate, time: string) => {
		const dt = new Date(d.year, d.month - 1, d.day, parseInt(time.slice(0, 2), 10), parseInt(time.slice(3, 5) || '0', 10), 0);
		return dt.toISOString();
	};
	const isNuit = timePreset === 'nuit' && timeRange.end <= timeRange.start;
	// Nuit : 22h jour J → 6h jour J+1 ; pour la plage on met dateTo = dernier jour + 1 à 06:00
	if (isNuit) {
		const endDayPlusOne = end.add({ days: 1 });
		return {
			dateFrom: toIso(start, timeRange.start),
			dateTo: toIso(endDayPlusOne, timeRange.end),
			dateFilter
		};
	}
	return {
		dateFrom: toIso(start, timeRange.start),
		dateTo: toIso(end, timeRange.end),
		dateFilter
	};
}
