/**
 * Store "plage de travail" : plage de dates, plage horaire (créneaux rapides ou manuelle),
 * et type de filtre (création vs date commande). Les heures s'appliquent à toute plage de jours.
 */
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateRange } from 'bits-ui';

export type DateFilterType = 'CreatedAt' | 'OrderDate';

/** Créneaux rapides : matin 6h-14h, après-midi 14h-22h, nuit 22h-6h (lendemain), journée = toute la journée. */
export type TimePreset = 'matin' | 'aprem' | 'nuit' | 'journee';

const defaultStart = today(getLocalTimeZone());
const defaultEnd = defaultStart;

/** Valeurs plage horaire pour chaque créneau (nuit : fin à 6h = lendemain). */
export const TIME_PRESET_RANGES: Record<TimePreset, { start: string; end: string } | null> = {
	matin: { start: '06:00', end: '14:00' },
	aprem: { start: '14:00', end: '22:00' },
	nuit: { start: '22:00', end: '06:00' },
	journee: null
};

export let dateRangeState = $state({
	/** Plage de dates (sélection calendrier). */
	dateRange: { start: defaultStart, end: defaultEnd } as DateRange,
	/** Plage horaire. S'applique à toute plage de jours. Nuit = 22h → 6h lendemain. Null = journée entière. */
	timeRange: null as { start: string; end: string } | null,
	/** Créneau rapide sélectionné (désactivé si useManualTime). */
	timePreset: 'journee' as TimePreset,
	/** Si true, affiche les selects heure de début/fin au lieu du select créneau. */
	useManualTime: false,
	/** Type de filtre pour l'API (date de création ou date commande). */
	dateFilter: 'CreatedAt' as DateFilterType
});

export const dateRangeActions = {
	setDateRange(value: DateRange) {
		dateRangeState.dateRange = value;
		const start = value.start;
		const end = value.end;
		if (!start || !end) return;
		// Conserver la plage horaire pour toute plage de jours (plus de reset sur multi-jours)
		if (!dateRangeState.timeRange && !dateRangeState.useManualTime) {
			const presetRange = TIME_PRESET_RANGES[dateRangeState.timePreset];
			dateRangeState.timeRange = presetRange ?? { start: '00:00', end: '23:59' };
		}
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
	}
};

/** Retourne true si la plage sélectionnée est un seul jour. */
export function isSingleDay(): boolean {
	const { start, end } = dateRangeState.dateRange;
	if (!start || !end) return false;
	return start.year === end.year && start.month === end.month && start.day === end.day;
}

/** Payload pour les requêtes GET list (orders/deliveries). dateFrom/dateTo en ISO date ou datetime si plage horaire. Nuit = fin à 6h le lendemain du dernier jour. */
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
			...(start && { dateFrom: start.toString() }),
			...(end && { dateTo: end.toString() }),
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
