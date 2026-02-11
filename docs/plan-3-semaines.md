# Plan de développement Trackly — 3 semaines

## Semaine 1 : P0 Bugs + Quick Wins (18-24 février)

### Jour 1-2 : Bugs critiques
- [ ] **BUG1** : Fix tooltips temps relatifs inversés
  - Fichier : `frontend-business/src/lib/components/`
  - Problème : Les tooltips "il y a X min" affichent le temps inversé
  
- [ ] **BUG2** : Fix filtre "Aujourd'hui" affiche 2 jours
  - Fichier : `frontend-business/src/routes/dashboard/` ou stores
  - Problème : Le filtre affiche 2 jours au lieu d'1

### Jour 3-4 : Validation livraison
- [ ] **F011** : Validation livraison (boutons larges)
  - Boutons "Livrée / Non livrée" pleine largeur
  - Feedback haptique/vibration
  - Confirmation visuelle immédiate

### Jour 5 : Quick Win UX
- [ ] **UX1** : Alléger en-têtes tableaux
  - Réduire padding et hauteur des headers

---

## Semaine 2 : Core Features P1 (25 février - 3 mars)

### Jour 1-3 : Import CSV
- [ ] **F008** : Import CSV commandes
  - Upload + preview du fichier
  - Mapping colonnes (nom, adresse, téléphone, commentaire)
  - Validation avant import
  
- [ ] **UX2** : Import CSV avec phone + commentaire
  - Étendre l'import pour supporter tous les champs Order

### Jour 4-5 : Géolocalisation temps réel
- [ ] **F013** : Géolocalisation temps réel (Driver)
  - Background geolocation
  - Envoi position toutes les 5s via SignalR
  - Indicateur connexion visuel

---

## Semaine 3 : Tracking + Polish (4-10 mars)

### Jour 1-3 : Carte tracking
- [x] **F014** : Carte tracking client (Business)
  - Page `/map` avec toggle "Suivi livreurs"
  - Affichage positions en temps réel
  - Filtre par période

- [x] **F007** : Finaliser Frontend Tracking
  - Page `/tracking/[deliveryId]` pour clients
  - Connexion SignalR temps réel
  - ETA estimée calculée

### Jour 4-5 : Polish + Dataset
- [x] **UX3** : Module date pour tournées
  - Sélecteur de date via DateFilterCard (déjà existant)

- [x] **UX4** : Dataset Montpellier démo
  - 20 adresses réelles Montpellier
  - Fichier CSV prêt à importer

---

## Livrables attendus

### Fin semaine 1
- ✅ Bugs P0 corrigés
- ✅ UI validation livraison opérationnelle
- ✅ Tableaux plus compacts

### Fin semaine 2
- ✅ Import CSV fonctionnel
- ✅ Géolocalisation temps réel active

### Fin semaine 3
- ✅ Carte tracking unifiée
- ✅ Frontend Tracking client opérationnel
- ✅ Dataset de démo prêt

---

*Plan créé le 11/02/2026 — @pm*
