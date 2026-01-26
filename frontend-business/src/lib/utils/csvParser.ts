export type ParsedCsvRow = {
	customerName: string;
	address: string;
	[key: string]: string;
};

/**
 * Parse un fichier CSV et retourne les lignes parsées
 */
export function parseCsv(file: File): Promise<ParsedCsvRow[]> {
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
				
				// Détecter le séparateur (virgule ou point-virgule)
				const firstLine = lines[0];
				const separator = firstLine.includes(';') ? ';' : ',';
				
				// Parser la première ligne comme en-têtes
				const headers = firstLine.split(separator).map(h => h.trim().toLowerCase());
				
				// Normaliser les noms de colonnes (supprimer les accents, espaces, etc.)
				const normalizedHeaders = headers.map(h => 
					h.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
						.replace(/\s+/g, '')
						.replace(/['"]/g, '')
				);
				
				// Trouver les index des colonnes importantes
				const customerNameIndex = normalizedHeaders.findIndex(h => 
					h.includes('client') || h.includes('customer') || h.includes('nom') || h.includes('name')
				);
				const addressIndex = normalizedHeaders.findIndex(h => 
					h.includes('adresse') || h.includes('address') || h.includes('adr')
				);
				
				if (customerNameIndex === -1 || addressIndex === -1) {
					reject(new Error(
						`Colonnes requises non trouvées. Trouvé: ${headers.join(', ')}. ` +
						`Recherche: client/customer/nom et adresse/address`
					));
					return;
				}
				
				// Parser les lignes de données
				const rows: ParsedCsvRow[] = [];
				for (let i = 1; i < lines.length; i++) {
					const line = lines[i].trim();
					if (!line) continue;
					
					const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
					
					if (values.length < Math.max(customerNameIndex, addressIndex) + 1) {
						continue; // Ignorer les lignes incomplètes
					}
					
					const customerName = values[customerNameIndex]?.trim();
					const address = values[addressIndex]?.trim();
					
					if (customerName && address) {
						rows.push({
							customerName,
							address,
							// Garder toutes les colonnes pour affichage
							...Object.fromEntries(
								headers.map((header, idx) => [header, values[idx] || ''])
							)
						});
					}
				}
				
				if (rows.length === 0) {
					reject(new Error('Aucune donnée valide trouvée dans le CSV'));
					return;
				}
				
				resolve(rows);
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
