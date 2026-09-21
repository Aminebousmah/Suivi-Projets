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

## Phase 4 — Données vivantes 🚧

Déduire les domaines et les fonctionnalités de l'arborescence réelle, et brancher les sessions sur l'historique local de Claude Code.

- [ ] Domaines déduits de l'arborescence
- [ ] Sessions lues depuis ~/.claude/projects/
- [ ] Statuts croisés avec l'activité git

## Phase 5 — Finition 💡

Navigation au clavier dans le graphe, mise en page mobile du panneau latéral, tests de rendu par vue, publication du build.
