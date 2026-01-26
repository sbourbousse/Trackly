# Documentation Trackly

Bienvenue dans la documentation complète du projet Trackly, une solution SaaS de gestion de livraisons pour TPE et artisans.

## Structure de la Documentation

### 📚 Documentation Métier

La documentation métier se trouve dans le dossier [`metier/`](./metier/README.md) et couvre :

- **[Modèle de Données](./metier/modele-donnees.md)** - Entités, relations et diagrammes ERD
- **[Relations entre Entités](./metier/relations-entites.md)** - Détails des relations et cardinalités
- **[Workflows Métier](./metier/workflows.md)** - Processus métier et diagrammes de séquence
- **[États et Transitions](./metier/etats-transitions.md)** - Machines à états des entités
- **[Règles Métier](./metier/regles-metier.md)** - Contraintes et règles de gestion
- **[Architecture Métier](./metier/architecture-metier.md)** - Organisation par domaines
- **[Glossaire](./metier/glossaire.md)** - Termes et concepts métier

### 🏗️ Documentation Technique

- **[Architecture Map](./architecture-map.md)** - Vue d'ensemble de l'architecture technique
- **[Project Context](./project-context.md)** - Contexte et vision du projet
- **[Business Logic - Deletions](./business-logic-deletions.md)** - Logique de suppression (soft delete)

### 📝 Documentation Projet

- **[Current Sprint](./current-sprint.md)** - Tâches en cours
- **[Decision Log](./decision-log.md)** - Historique des décisions techniques
- **[Project Log](./project-log.md)** - Journal de développement

## Navigation Rapide

### Pour comprendre le modèle de données

1. Commencez par [Modèle de Données](./metier/modele-donnees.md) pour voir les entités principales
2. Consultez [Relations entre Entités](./metier/relations-entites.md) pour comprendre les liens
3. Lisez [Glossaire](./metier/glossaire.md) pour les définitions

### Pour comprendre les workflows

1. [Workflows Métier](./metier/workflows.md) - Processus complets avec diagrammes
2. [États et Transitions](./metier/etats-transitions.md) - Machines à états
3. [Règles Métier](./metier/regles-metier.md) - Contraintes et validations

### Pour comprendre l'architecture

1. [Architecture Map](./architecture-map.md) - Vue technique globale
2. [Architecture Métier](./metier/architecture-metier.md) - Organisation par domaines
3. [Project Context](./project-context.md) - Vision et objectifs

## Diagrammes Mermaid

Tous les diagrammes utilisent [Mermaid](https://mermaid.js.org/) et peuvent être visualisés dans :
- GitHub (rendu automatique)
- VS Code (extension Mermaid Preview)
- Outils en ligne (mermaid.live)

## Contribution

Pour mettre à jour la documentation :

1. Les diagrammes Mermaid doivent être valides (tester sur mermaid.live)
2. Maintenir la cohérence entre les différents documents
3. Mettre à jour les références croisées si nécessaire
