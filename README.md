# Atlas

Application de visualisation de projets GitHub : pour chaque dépôt suivi, elle montre
ce que le projet fait, l'arbre de ses fonctionnalités, l'historique des sessions Claude
Code, le contexte que Claude lit avant d'agir, et l'avancement des phases.

Trois dépôts sont décrits : **Sole-Citron** (site éditorial Astro), **Eleven-Fields**
(dashboard Streamlit) et **Atlas** lui-même. Chacun porte sa propre direction
artistique, dérivée de ses tokens CSS.

## Démarrage

```bash
npm install
npm run dev      # serveur de dev Vite
npm run build    # typecheck + build de production dans dist/
npm run preview  # sert le build
npm run test     # vitest
npm run lint     # oxlint
```

## Architecture

```
src/
  App.tsx             en-tête, barre de dépôts, onglets ; l'état vient de l'URL
  data/
    types.ts          types du modèle : Theme, RepoData, Domain, Feature, Session…
    themes.ts         palettes et typographies, une par dépôt
    repos.ts          contenu de chaque dépôt : domaines, fonctionnalités, sessions, phases
    labels.ts         libellés de statut, définition des cinq vues, accroches
  lib/
    graph.ts          logique pure : positionnement du graphe, agrégats d'état par domaine
    url.ts            lecture, écriture et réduction de l'état de navigation
    useAtlasState.ts  état de navigation adossé à l'historique du navigateur
    github.ts         client REST GitHub : métadonnées, arborescence, commits
    verify.ts         croisement des fichiers déclarés avec l'arborescence réelle
    useGitHub.ts      chargement du dépôt réel et jeton gardé dans le navigateur
    __tests__/        53 tests Vitest sur ces quatre modules
  views/
    SheetView.tsx     01 Fiche projet — ce que le projet fait, pile technique, feuille de suivi
    ArchView.tsx      02 Fonctionnalités — graphe ou liste, plus le panneau de détail
    SessionsView.tsx  03 Sessions — prompts, réponses, fichiers touchés, mémoires écrites
    ContextView.tsx   04 Contexte Claude — fichiers lus, règles actives, interdits, décisions ouvertes
    ProgressView.tsx  05 Avancement — les phases de plan.md avec leur statut réel
    GitHubView.tsx    06 Dépôt réel — métadonnées GitHub, commits, écarts de fichiers
  components/
    ui.tsx            primitives partagées (bouton à survol, sur-titre mono)
design/               maquette Claude Design d'origine, source de vérité visuelle
```

## Navigation et permaliens

L'état de navigation — dépôt, vue, mode, domaine, fonctionnalité, zoom — vit dans la
query string, pas dans un state React parallèle. Chaque sélection est donc un lien
partageable, et les boutons précédent et suivant du navigateur la rejouent. Les valeurs
par défaut ne sont pas écrites dans l'URL, et un paramètre inconnu retombe sur le défaut
au lieu de casser la page.

```
?repo=eleven&view=arch&domain=player&feat=Radar+contextualis%C3%A9+par+poste&zoom=0.85
```

## Vue « Dépôt réel »

Les cinq premières vues décrivent le projet tel qu'il a été documenté. La sixième
interroge l'API GitHub et confronte cette description au dépôt : métadonnées, derniers
commits, et surtout le croisement entre les fichiers cités par chaque fonctionnalité et
l'arborescence réelle. Un chemin peut être retrouvé exactement, sous un autre préfixe,
comme dossier, via un motif, déplacé ailleurs — ou déclaré absent.

Le jeton personnel GitHub est facultatif : sans lui, seuls les dépôts publics répondent,
dans la limite de soixante requêtes par heure. Il est gardé dans le `localStorage` du
navigateur, n'est envoyé qu'à `api.github.com`, et un bouton l'efface.

## Direction artistique

Tout le style vient de `src/data/themes.ts` : un thème par dépôt, avec sa palette, ses
tons de domaine, ses pastilles de statut et sa typographie. Les composants ne codent
aucune couleur en dur — ils lisent le thème actif.

Polices : DM Serif Display, Manrope et JetBrains Mono, chargées depuis Google Fonts
dans `index.html`.

## Données

Le contenu de `src/data/repos.ts` est écrit à la main : pour Sole-Citron et
Eleven-Fields il est repris de la maquette, pour Atlas il décrit ce dépôt. C'est une
description figée, pas une lecture du code — d'où la vue « Dépôt réel », qui sert
justement à mesurer l'écart.

Reste à brancher : les domaines et fonctionnalités déduits de l'arborescence, les phases
lues dans `plan.md`, les règles lues dans `CLAUDE.md`, et l'historique de sessions qui
vit dans `~/.claude/projects/`, hors dépôt.

Voir `design/github.md` pour la correspondance entre chaque écran et ses fichiers source.
