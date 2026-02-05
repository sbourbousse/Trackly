# Prompt Notion - Structure gestion de projet

Copie-colle ce prompt dans Notion AI pour creer la structure du workspace.

--- PROMPT NOTION AI ---

Je veux creer une structure de gestion de projet dans Notion, orientee execution.
Objectif: avoir une base robuste pour regrouper les taches, comprendre les liens
entre elles, et suivre les livrables de facon claire.

Merci de creer les bases suivantes avec les proprietes et relations indiquees,
en francais, et en respectant le sens des relations.

1) Base "Projets"
- But: piloter les initiatives majeures
- Proprietes:
  - Statut (Select): Idee, Planifie, En cours, En attente, Termine, Abandonne
  - Priorite (Select): Critique, Haute, Moyenne, Basse
  - Horizon (Select): Maintenant, Prochain, Plus tard
  - Owner (Person)
  - Date debut (Date)
  - Date fin cible (Date)
  - KPI / Resultat attendu (Text)
  - Risques (Relation -> Risques)
  - Epics (Relation -> Epics)
  - Taches (Relation -> Taches)
  - Decisions (Relation -> Decisions)

2) Base "Epics"
- But: regrouper les taches par fonctionnalite ou capabilite
- Proprietes:
  - Statut (Select): A faire, En cours, Bloque, Termine
  - Priorite (Select): Critique, Haute, Moyenne, Basse
  - Projet (Relation -> Projets)
  - Taches (Relation -> Taches)
  - Definition of Done (Text)

3) Base "Taches"
- But: execution fine, tickets actionnables
- Proprietes:
  - Type (Select): Feature, Bug, Tech debt, Refacto, Docs, Ops, Research
  - Statut (Select): Backlog, A faire, En cours, Bloque, En revue, Termine
  - Priorite (Select): P0, P1, P2, P3
  - Effort (Select): XS, S, M, L, XL
  - Owner (Person)
  - Date debut (Date)
  - Date fin cible (Date)
  - Projet (Relation -> Projets)
  - Epic (Relation -> Epics)
  - Dependances (Relation -> Taches)
  - Bloque par (Relation -> Taches)
  - Risques (Relation -> Risques)
  - Liens utiles (URL)
  - Definition of Done (Text)

4) Base "Risques"
- But: suivre les risques et actions de mitigation
- Proprietes:
  - Statut (Select): Identifie, Mitigation en cours, Surveille, Ferme
  - Impact (Select): Fort, Moyen, Faible
  - Probabilite (Select): Haute, Moyenne, Basse
  - Mitigation (Text)
  - Projets (Relation -> Projets)
  - Taches (Relation -> Taches)

5) Base "Decisions"
- But: garder les decisions de design et leurs raisons
- Proprietes:
  - Statut (Select): Proposee, Validee, Remplacee
  - Date (Date)
  - Contexte (Text)
  - Decision (Text)
  - Consequences (Text)
  - Projets (Relation -> Projets)

6) Base "Jalons"
- But: marquer les livrables ou deadlines
- Proprietes:
  - Statut (Select): Planifie, En cours, Termine, Rate
  - Date cible (Date)
  - Projet (Relation -> Projets)
  - Taches (Relation -> Taches)

Relations importantes a configurer correctement:
- Un projet peut avoir plusieurs epics et taches
- Une epic regroupe plusieurs taches
- Une tache peut dependre d'autres taches (champ "Dependances")
- La relation "Bloque par" est l'inverse des dependances
- Une tache peut etre liee a un ou plusieurs risques

Vues recommandees:
- Taches: Kanban par statut + liste par priorite
- Epics: tableau par statut
- Projets: timeline par dates
- Risques: tableau par impact

Bonus: cree un template "Tache" avec sections:
- Contexte
- Hypotheses
- Checklist de tests
- Notes techniques

--- FIN PROMPT ---
