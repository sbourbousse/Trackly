#!/usr/bin/env node

/**
 * Génère le fichier runtime-config.js à partir des variables d'environnement
 * Ce script est exécuté au démarrage du container pour injecter la configuration runtime
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire les variables d'environnement
const config = {
  API_BASE_URL: process.env.VITE_API_BASE_URL || '',
  SIGNALR_URL: process.env.VITE_SIGNALR_URL || '',
  DEFAULT_TENANT_ID: process.env.VITE_DEFAULT_TENANT_ID || '',
  TENANT_BOOTSTRAP: process.env.VITE_TENANT_BOOTSTRAP || ''
};

// Générer le contenu du fichier JavaScript
const content = `// Configuration runtime générée automatiquement
// Ce fichier est créé au démarrage du container avec les variables d'environnement
window.__RUNTIME_CONFIG__ = ${JSON.stringify(config, null, 2)};
`;

// Écrire le fichier dans dist/
const outputPath = join(__dirname, 'dist', 'runtime-config.js');
writeFileSync(outputPath, content, 'utf8');

console.log('[runtime-config] Configuration générée avec succès');
console.log('[runtime-config] API_BASE_URL:', config.API_BASE_URL || '(non définie)');
console.log('[runtime-config] SIGNALR_URL:', config.SIGNALR_URL || '(non définie)');
