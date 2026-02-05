# Guide de personnalisation des illustrations unDraw

## 🎨 Couleurs Trackly

Les illustrations unDraw doivent utiliser les couleurs de la charte Trackly :

- **Couleur principale (Teal)** : `#0d9488` (teal-600)
- **Couleur secondaire (Stone)** : `#78716c` (stone-500)

## 📦 Illustrations actuelles

Les illustrations suivantes sont utilisées dans la landing page :

| Fichier | Section | Description |
|---------|---------|-------------|
| `undraw_on-the-way.svg` | Hero, Par métier | Livreur en route |
| `undraw_order-delivered.svg` | Hero | Client recevant sa commande |
| `undraw_data-reports.svg` | Hero | Dashboard business |
| `undraw_order-confirmed.svg` | Par métier | Commande confirmée |
| `undraw_delivery-address.svg` | Par métier | Adresse de livraison |
| `undraw_analysis.svg` | Trust | Analyse et statistiques |

## 🔧 Comment personnaliser les couleurs

### Méthode 1 : Via le site unDraw

1. Aller sur [undraw.co](https://undraw.co/)
2. Rechercher l'illustration souhaitée
3. Changer la couleur primaire en `#0d9488` (teal Trackly)
4. Télécharger l'illustration en SVG
5. Remplacer le fichier dans `public/`

### Méthode 2 : Édition manuelle du SVG

Pour chaque fichier SVG, remplacer la couleur existante par le teal Trackly :

```bash
# Exemple : remplacer #6c63ff par #0d9488 dans tous les SVG
# (à adapter selon votre éditeur de texte ou IDE)
```

**Étapes :**

1. Ouvrir le fichier SVG dans un éditeur de texte
2. Rechercher `#6c63ff` (couleur actuelle)
3. Remplacer par `#0d9488` (teal Trackly)
4. Sauvegarder le fichier

### Méthode 3 : Script automatisé

Créer un script Node.js pour automatiser le remplacement :

```javascript
// customize-undraw-colors.js
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const oldColor = '#6c63ff';
const newColor = '#0d9488';

// Lire tous les fichiers undraw_*.svg
const files = fs.readdirSync(publicDir)
  .filter(file => file.startsWith('undraw_') && file.endsWith('.svg'));

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer la couleur
  content = content.replace(new RegExp(oldColor, 'gi'), newColor);
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file} personnalisé`);
});

console.log(`\n🎉 ${files.length} illustrations personnalisées !`);
```

**Exécution :**

```bash
node customize-undraw-colors.js
```

## 📝 Bonnes pratiques

1. **Toujours télécharger en SVG** pour une qualité optimale et un poids léger
2. **Conserver les noms de fichiers originaux** pour faciliter les mises à jour
3. **Optimiser les SVG** avec [SVGOMG](https://jakearchibald.github.io/svgomg/) après personnalisation
4. **Tester l'accessibilité** : vérifier que les illustrations ont des `alt` descriptifs

## 🔍 Trouver de nouvelles illustrations

Pour ajouter de nouvelles illustrations à la landing page :

1. Rechercher sur [undraw.co](https://undraw.co/) avec des mots-clés en anglais :
   - "delivery" → livraison
   - "tracking" → suivi
   - "dashboard" → tableau de bord
   - "mobile app" → application mobile
   - "logistics" → logistique

2. Télécharger avec la couleur `#0d9488`
3. Placer dans `public/`
4. Ajouter dans le composant concerné

## 📍 Composants utilisant les illustrations

- `components/landing/Hero.tsx` : Illustration principale en 3 cartes
- `components/landing/ProblemSolution.tsx` : Illustrations par métier
- `components/landing/Trust.tsx` : Illustration de confiance
- `components/landing/CtaFinal.tsx` : Illustration CTA (à venir)
