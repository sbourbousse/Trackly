export type ParsedCsvRow = {
	customerName: string;
	address: string;
	phoneNumber?: string;
	internalComment?: string;
	orderDate?: string;
	[key: string]: string | undefined;
};

export type CsvColumnMapping = {
	customerName: number;
	address: number;
	phoneNumber: number | null;
	internalComment: number | null;
	orderDate: number | null;
};

/**
 * Détecte automatiquement le mapping des colonnes CSV
 */
export function detectColumnMapping(headers: string[]): CsvColumnMapping {
	const normalized = headers.map(h =>
		h.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/\s+/g, '')
			.replace(/['"]/g, '')
	);

	const findIndex = (patterns: string[]): number => {
		return normalized.findIndex(h => patterns.some(p => h.includes(p)));
	};

	const customerName = findIndex(['client', 'customer', 'nom', 'name', 'contact']);
	const address = findIndex(['adresse', 'address', 'adr', 'rue', 'street']);
	const phoneNumber = findIndex(['telephone', 'tel', 'phone', 'mobile', 'portable', 'contact']);
	const internalComment = findIndex(['commentaire', 'comment', 'note', 'notes', 'remarque', 'info']);
	const orderDate = findIndex(['date', 'orderdate', 'datedecommande', 'created']);

	return {
		customerName,
		address,
		phoneNumber: phoneNumber >= 0 ? phoneNumber : null,
		internalComment: internalComment >= 0 ? internalComment : null,
		orderDate: orderDate >= 0 ? orderDate : null
	};
}

/**
 * Parse un fichier CSV et retourne les lignes parsées avec mapping
 */
export function parseCsv(file: File): Promise<{ rows: ParsedCsvRow[]; mapping: CsvColumnMapping; headers: string[] }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const lines = text.split('\n').filter(line => line.trim());

				if (lines.length === 0) {
					reject(new Error('Le fichier CSV est vide'));
					return;
				}

				// Détecter le séparateur (virgule, point-virgule ou tab)
				const firstLine = lines[0];
				let separator = ',';
				if (firstLine.includes(';')) separator = ';';
				else if (firstLine.includes('\t')) separator = '\t';

				// Parser la première ligne comme en-têtes
				const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));

				// Détecter le mapping automatique
				const mapping = detectColumnMapping(headers);

				if (mapping.customerName === -1 || mapping.address === -1) {
					reject(new Error(
						`Colonnes requises non trouvées. Trouvé: ${headers.join(', ')}. ` +
						`Recherche: client/customer/nom et adresse/address`
					));
					return;
				}

				// Parser les lignes de données
				const rows: ParsedCsvRow[] = [];
				const errors: string[] = [];

				for (let i = 1; i < lines.length; i++) {
					const line = lines[i].trim();
					if (!line) continue;

					const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));

					if (values.length < Math.max(mapping.customerName, mapping.address) + 1) {
						errors.push(`Ligne ${i + 1}: données incomplètes`);
						continue;
					}

					const customerName = values[mapping.customerName]?.trim();
					const address = values[mapping.address]?.trim();

					if (customerName && address) {
						const row: ParsedCsvRow = {
							customerName,
							address,
							// Champs optionnels
							...(mapping.phoneNumber !== null && values[mapping.phoneNumber] && {
								phoneNumber: values[mapping.phoneNumber].trim()
							}),
							...(mapping.internalComment !== null && values[mapping.internalComment] && {
								internalComment: values[mapping.internalComment].trim()
							}),
							...(mapping.orderDate !== null && values[mapping.orderDate] && {
								orderDate: parseDate(values[mapping.orderDate].trim())
							}),
							// Garder toutes les colonnes brutes pour affichage
							...Object.fromEntries(
								headers.map((header, idx) => [header, values[idx] || ''])
							)
						};
						rows.push(row);
					} else {
						errors.push(`Ligne ${i + 1}: nom ou adresse manquant`);
					}
				}

				if (rows.length === 0) {
					reject(new Error('Aucune donnée valide trouvée dans le CSV' + (errors.length ? `. Erreurs: ${errors.slice(0, 5).join(', ')}` : '')));
					return;
				}

				resolve({ rows, mapping, headers });
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => {
			reject(new Error('Erreur lors de la lecture du fichier'));
		};

		reader.readAsText(file, 'UTF-8');
	});
}

/**
 * Parse une date au format français ou ISO
 */
function parseDate(value: string): string | undefined {
	if (!value) return undefined;

	// Format JJ/MM/AAAA ou JJ-MM-AAAA
	const frMatch = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
	if (frMatch) {
		const [, day, month, year] = frMatch;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}

	// Format AAAA-MM-JJ (ISO)
	const isoMatch = value.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}

	// Essayer de parser avec Date
	const d = new Date(value);
	if (!isNaN(d.getTime())) {
		return d.toISOString().split('T')[0];
	}

	return undefined;
}
