# Atlas

Application de visualisation de projets GitHub : pour chaque dépôt suivi, elle montre
ce que le projet fait, l'arbre de ses fonctionnalités, et l'avancement des phases — le
tout relu en direct sur GitHub.

**En ligne : https://aminebousmah.github.io/Suivi-Projets/**

## Utiliser Atlas

1. **Saisir un jeton GitHub** dans l'onglet 06 « Dépôt réel » : un jeton *fine-grained*,
   en lecture seule (*Contents : Read-only*), sur les dépôts à suivre. Il reste dans le
   navigateur et n'est envoyé qu'à `api.github.com`.
2. **Choisir les dépôts** avec le bouton « ＋ Dépôts » de la barre du haut : cocher pour
   ajouter un dépôt du compte, décocher pour le masquer. Le choix est retenu par le
   navigateur.
3. **Décrire chaque projet** avec son `atlas.md` : le prompt de mise en place
   d'[`ATLAS-PROMPT.md`](ATLAS-PROMPT.md), collé dans une session Claude Code ouverte
   dans le dossier du projet, l'écrit et installe dans son `CLAUDE.md` la consigne de le
   tenir à jour.

Atlas relit le dépôt affiché au retour sur l'onglet et toutes les deux minutes : une
fonctionnalité, un statut ou une couleur poussés apparaissent sans rien toucher.

## Ce qu'Atlas lit dans un dépôt

| Fichier | Où | Ce qu'il en tire |
| --- | --- | --- |
| `atlas.md` | racine | l'arbre des fonctionnalités et leurs statuts, la feuille de suivi, ce qui est fait et ce qui reste, la direction artistique |
| `plan.md` | racine, puis `docs/` | les phases et leur statut, les cases à cocher |
| `CLAUDE.md` | racine, puis `.claude/` | les règles actives et les interdits |
| `README.md` | racine | le résumé du projet |

Sans `atlas.md`, l'onglet Fonctionnalités montre l'arborescence réelle du dépôt. Un
fichier absent est signalé, jamais une panne. Chaque vue dit d'où vient ce qu'elle
affiche : « lu dans le dépôt », « description figée », ou « lecture impossible » avec la
cause.

## Les six vues

| | Vue | Ce qu'elle montre |
| --- | --- | --- |
| 01 | Fiche projet | ce que le projet fait, ce qui reste, la pile technique, la feuille de suivi |
| 02 | Fonctionnalités | l'arbre en graphe ou en liste, décrit par `atlas.md` ou tiré du dépôt |
| 03 | Sessions | les fichiers de session Claude Code déposés dans la page, lus sans en sortir |
| 04 | Contexte Claude | les fichiers de contexte, les règles actives, les interdits |
| 05 | Avancement | les phases de `plan.md` avec leur statut réel |
| 06 | Dépôt réel | métadonnées, commits, et croisement entre fichiers cités et arborescence |

Toute la navigation vit dans l'URL : chaque sélection est un lien partageable. L'arbre se
parcourt au clavier, et la mise en page se replie jusqu'à 390 px de large.

## Développer

```bash
npm install
npm run dev      # serveur de développement
npm run build    # typecheck puis build de production dans dist/
npm run test     # vitest
npm run lint     # oxlint
```

```
src/
  App.tsx        la coque : barre de dépôts, en-tête, onglets
  data/          le modèle : types, thèmes, dépôts décrits, libellés
  lib/           la logique pure et ses tests : graphe, URL, client GitHub, lecteurs
  views/         une vue par onglet ; arch/ porte les morceaux de l'arbre
  components/    ce que les vues partagent : primitives, bandeau, sélecteur de dépôts
design/          la maquette d'origine, référence visuelle
```

Les conventions et les interdits du projet sont dans [`CLAUDE.md`](CLAUDE.md), les phases
dans [`plan.md`](plan.md), et la description fonctionnelle complète — chaque
fonctionnalité et ses fichiers — dans [`atlas.md`](atlas.md). Un test refuse tout fichier
du dépôt qu'aucune fonctionnalité ne cite.

## Thèmes

Chaque projet s'affiche dans sa propre charte. Atlas la lit dans la section « Direction
artistique » de son `atlas.md` et en construit le thème, en choisissant lui-même les
encres lisibles. À défaut, il reprend la palette relevée dans `src/data/themes.ts`, puis
un thème neutre. Aucun composant ne code une couleur en dur.

## Publication

`.github/workflows/pages.yml` publie le site sur GitHub Pages à chaque fusion dans
`main`, une fois lint, tests et build passés : rien n'est publié sur une base rouge.
`npm run build:pages` reproduit en local le build servi sous `/Suivi-Projets/`.

Deux réglages se font une fois côté GitHub : **Settings → Pages → Source : GitHub
Actions**, et `main` autorisée dans **Settings → Environments → github-pages**.
