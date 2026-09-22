# Plan de développement

État : en développement actif. Aucun déploiement pour l'instant.

## Phase 1 — Portage de la maquette ✅

Vite, React 19 et TypeScript strict. Cinq vues fidèles au prototype, deux dépôts décrits, thèmes et données extraits tels quels, logique de graphe isolée dans `src/lib/graph.ts`.

## Phase 2 — Navigation et filet de tests ✅

État de navigation porté dans l'URL avec historique navigateur, et tests Vitest sur le layout du graphe, les agrégats d'état et l'aller-retour d'URL.

## Phase 3 — Pont GitHub ✅

Client REST, vue « Dépôt réel », confrontation des fichiers cités à l'arborescence, lecture des fichiers de contexte, et cache qui épargne le quota.

- [x] Client REST : métadonnées, arborescence, commits
- [x] Croisement des fichiers déclarés avec l'arborescence réelle
- [x] Jeton facultatif gardé dans le navigateur
- [x] Lecture de CLAUDE.md, plan.md et README.md
- [x] Mise en cache des réponses pour épargner le quota

## Phase 4 — Données vivantes ✅

Les domaines se déduisent de l'arborescence réelle, l'activité git décore les fichiers, et les sessions se lisent depuis les fichiers déposés dans la page.

- [x] Domaines déduits de l'arborescence
- [x] Sessions lues depuis ~/.claude/projects/
- [x] Activité git croisée avec l'arborescence

Un navigateur ne lit pas le disque : les fichiers de session sont déposés dans la page, pas lus automatiquement. Et l'activité git ne devient pas un statut — aucune source ne dit qu'un fichier modifié hier est « en cours ».

## Phase 5 — Finition ✅

Navigation au clavier dans le graphe, mise en page adaptée aux écrans étroits, tests de rendu par vue, et publication du build.

- [x] Flèches, Échap, Home et Fin dans l'arbre, avec focus visible
- [x] Panneau latéral et tableaux repliés sous 720 px
- [x] Tests de rendu vue par vue, en jsdom
- [x] Workflow GitHub Pages, publication sur poussée vers `main`

La publication demande une action dans les réglages du dépôt — Settings, Pages, source « GitHub Actions » — que le dépôt seul ne peut pas faire.

## Phase 6 — Croisement des deux arbres ✅

Les fichiers cités par les fonctionnalités et les fichiers du dépôt sont rapprochés, dans les deux sens.

- [x] Un fichier du dépôt dit quelles fonctionnalités il sert
- [x] Une fonctionnalité dit où ses chemins atterrissent vraiment
- [x] Chaque dossier annonce sa part décrite, et la vue Dépôt réel la part du projet
- [x] Les fichiers qu'aucune fonctionnalité ne citait sont décrits : 61 sur 61
- [x] Un test échoue dès qu'un fichier ajouté n'est décrit nulle part

Le rapprochement ne juge rien : un fichier que rien ne cite n'est ni mort ni superflu, il est seulement non décrit.
