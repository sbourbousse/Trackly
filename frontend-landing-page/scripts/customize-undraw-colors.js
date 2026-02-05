/**
 * Script de personnalisation des couleurs des illustrations unDraw
 * 
 * Ce script remplace automatiquement les couleurs par défaut des illustrations
 * unDraw par les couleurs de la charte Trackly.
 * 
 * Usage : node scripts/customize-undraw-colors.js
 */

const fs = require('fs');
const path = require('path');

// Configuration des couleurs
const colorMappings = [
  {
    from: '#6c63ff', // Couleur violette par défaut unDraw
    to: '#0d9488',   // Teal Trackly (teal-600)
    name: 'Primary (Teal)'
  },
  {
    from: '#6C63FF', // Variante majuscule
    to: '#0d9488',
    name: 'Primary (Teal) - uppercase'
  }
];

// Répertoire des illustrations
const publicDir = path.join(__dirname, '..', 'public');

console.log('🎨 Personnalisation des illustrations unDraw pour Trackly\n');
console.log(`📁 Répertoire : ${publicDir}\n`);

// Lire tous les fichiers undraw_*.svg
let files;
try {
  files = fs.readdirSync(publicDir)
    .filter(file => file.startsWith('undraw_') && file.endsWith('.svg'));
} catch (error) {
  console.error('❌ Erreur lors de la lecture du répertoire public :', error.message);
  process.exit(1);
}

if (files.length === 0) {
  console.log('⚠️  Aucune illustration unDraw trouvée dans le répertoire public.');
  process.exit(0);
}

console.log(`✅ ${files.length} illustration(s) trouvée(s) :\n`);
files.forEach(file => console.log(`   - ${file}`));
console.log('');

// Traiter chaque fichier
let modifiedCount = 0;
let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileReplacements = 0;
    
    // Appliquer chaque mapping de couleur
    colorMappings.forEach(mapping => {
      const regex = new RegExp(mapping.from, 'g');
      const matches = content.match(regex);
      
      if (matches) {
        content = content.replace(regex, mapping.to);
        fileReplacements += matches.length;
      }
    });
    
    if (fileReplacements > 0) {
      // Sauvegarder le fichier modifié
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${file} : ${fileReplacements} occurrence(s) modifiée(s)`);
      modifiedCount++;
      totalReplacements += fileReplacements;
    } else {
      console.log(`ℹ️  ${file} : aucune modification nécessaire`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${file} :`, error.message);
  }
});

// Résumé
console.log('\n' + '='.repeat(60));
console.log(`🎉 Personnalisation terminée !`);
console.log(`   - ${modifiedCount}/${files.length} fichier(s) modifié(s)`);
console.log(`   - ${totalReplacements} remplacement(s) de couleur effectué(s)`);
console.log('='.repeat(60));

// Suggestions
if (modifiedCount > 0) {
  console.log('\n💡 Prochaines étapes :');
  console.log('   1. Vérifiez les illustrations dans votre navigateur');
  console.log('   2. Optimisez les SVG avec https://jakearchibald.github.io/svgomg/');
  console.log('   3. Commitez les modifications si le résultat vous convient');
}
