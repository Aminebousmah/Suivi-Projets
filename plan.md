# Plan de développement

État : fonctionnellement terminé, onze phases livrées, publié sur GitHub Pages : https://aminebousmah.github.io/Suivi-Projets/

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
- [x] Les fichiers qu'aucune fonctionnalité ne citait sont décrits : 61 sur 61 à l'époque
- [x] Un test échoue dès qu'un fichier ajouté n'est décrit nulle part

Le rapprochement ne juge rien : un fichier que rien ne cite n'est ni mort ni superflu, il est seulement non décrit.

## Phase 7 — Le suivi vient du projet ✅

Un projet peut décrire lui-même son arbre, au lieu de le voir écrit en dur dans Atlas.

- [x] `ATLAS-PROMPT.md` : le prompt à coller dans une session Claude Code
- [x] Lecture d'`atlas.md` : domaines, fonctionnalités, statuts, fichiers, feuille de suivi
- [x] Quand le dépôt fournit ce fichier, il remplace la description figée
- [x] Atlas se décrit avec son propre `atlas.md`, et un test refuse que les deux descriptions divergent

## Phase 8 — Un rendu propre et utilisable ✅

Une passe à l'écran, captures à l'appui, en large comme en étroit.

- [x] L'arbre prend la largeur ; le panneau de détail a une colonne fixe et reste visible en bas du graphe
- [x] En étroit, dépôts et onglets défilent sur une ligne, et l'onglet actif est ramené dans l'écran
- [x] Chaque bandeau « description figée » porte le bouton qui lit le dépôt, sans changer de vue
- [x] L'encre se choisit par le contraste : fini le texte noir sur fond noir
- [x] Une vue qui plante n'emporte plus l'application
- [x] React livré à part, pour qu'une mise à jour d'Atlas ne le fasse pas retélécharger
- [x] Plus aucun hex dans un composant

## Phase 9 — Un suivi taillé pour les vrais projets ✅

Le prompt et le lecteur, confrontés aux CLAUDE.md et plan.md de six projets réels.

- [x] Le prompt parle du dossier local, et respecte la structure qu'un projet a déjà
- [x] La mise en place installe dans CLAUDE.md une section « Suivi du projet », qui fait tenir les fichiers à jour à chaque tâche
- [x] Un second prompt, court, pour faire le point de temps en temps
- [x] Le plan est cherché dans docs/ quand il n'est pas à la racine, CLAUDE.md dans .claude/
- [x] Les consignes rangées en sous-sections sont lues — « Règles pour Claude Code › Jamais »
- [x] ✓, un pourcentage dans le titre ou les cases à cocher disent le statut d'une phase ; « Phase actuelle » n'en est pas une

## Phase 10 — Les projets réels dans Atlas ✅

Futuremoi, bottrading, Clip-Core et Happicture rejoignent la barre de dépôts.

- [x] Un thème se construit à partir de la seule palette d'un projet, encres choisies par le contraste
- [x] Chaque nouveau dépôt ne montre que des faits lus dans ses fichiers, sans domaine ni statut inventé
- [x] Chaque bloc vide dit quel fichier le remplirait, au lieu de disparaître ou de planter
- [x] La sélection se vérifie contre l'arbre affiché, celui d'atlas.md une fois lu : les clés du fichier ne sont plus purgées
- [x] Les « à faire » d'Atlas, recopiés par erreur chez Sole-Citron et Eleven-Fields, en sont retirés

## Phase 11 — En ligne, sous ses propres couleurs ✅

- [x] Publié sur GitHub Pages : Pages activé, `main` branche par défaut et autorisée dans l'environnement `github-pages`
- [x] Atlas quitte le noir et la terracotta, trop proches de Happicture, pour sa palette : Black Forest, Maroon, Vanilla Custard
- [x] Son thème passe par `buildTheme`, comme les quatre derniers dépôts : ses contrastes sont testés
- [x] Une pastille trop pâle pour sa carte, ou pour la barre de dépôts, prend une couleur qui s'y voit

## Ce qui reste, et pourquoi ce n'est pas fait

- **Ouvrir Atlas à un dépôt quelconque** — depuis `atlas.md`, un dépôt décrit lui-même
  ses domaines ; il reste à l'enregistrer dans `src/data/repos.ts` pour son slug, et dans
  `src/data/themes.ts` pour sa palette, que `buildTheme` complète. Accepter un dépôt saisi
  à la volée demanderait de lire cette palette dans son code.
- **Décrire les projets suivis** — Futuremoi, bottrading, Clip-Core et Happicture n'ont
  pas encore d'`atlas.md` : c'est le prompt de mise en place, lancé dans chaque projet,
  qui l'écrit.
- **Rapprocher les sessions du reste** — une session sait quels fichiers elle a touchés,
  et le croisement sait ce que ces fichiers servent : les brancher l'un sur l'autre dirait
  quelles fonctionnalités une session a fait avancer.
