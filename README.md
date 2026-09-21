# Atlas

Application de visualisation de projets GitHub : pour chaque dépôt suivi, elle montre
ce que le projet fait, l'arbre de ses fonctionnalités, l'historique des sessions Claude
Code, le contexte que Claude lit avant d'agir, et l'avancement des phases.

Deux dépôts sont câblés : **Sole-Citron** (site éditorial Astro) et **Eleven-Fields**
(dashboard Streamlit). Chacun porte sa propre direction artistique, dérivée de ses
tokens CSS.

## Démarrage

```bash
npm install
npm run dev      # serveur de dev Vite
npm run build    # typecheck + build de production dans dist/
npm run preview  # sert le build
npm run lint     # oxlint
```

## Architecture

```
src/
  App.tsx             état global (dépôt, vue, mode, sélection, zoom) + en-tête et navigation
  data/
    types.ts          types du modèle : Theme, RepoData, Domain, Feature, Session…
    themes.ts         palettes et typographies, une par dépôt
    repos.ts          contenu de chaque dépôt : domaines, fonctionnalités, sessions, phases
    labels.ts         libellés de statut, définition des cinq vues, accroches
  lib/
    graph.ts          logique pure : positionnement du graphe radial, agrégats d'état par domaine
  views/
    SheetView.tsx     01 Fiche projet — ce que le projet fait, pile technique, feuille de suivi
    ArchView.tsx      02 Fonctionnalités — graphe ou liste, plus le panneau de détail
    SessionsView.tsx  03 Sessions — prompts, réponses, fichiers touchés, mémoires écrites
    ContextView.tsx   04 Contexte Claude — fichiers lus, règles actives, interdits, décisions ouvertes
    ProgressView.tsx  05 Avancement — les phases de plan.md avec leur statut réel
  components/
    ui.tsx            primitives partagées (bouton à survol, sur-titre mono)
design/               maquette Claude Design d'origine, source de vérité visuelle
```

## Direction artistique

Tout le style vient de `src/data/themes.ts` : un thème par dépôt, avec sa palette, ses
tons de domaine, ses pastilles de statut et sa typographie. Les composants ne codent
aucune couleur en dur — ils lisent le thème actif.

Polices : DM Serif Display, Manrope et JetBrains Mono, chargées depuis Google Fonts
dans `index.html`.

## Données

Le contenu de `src/data/repos.ts` est repris tel quel de la maquette : il décrit l'état
réel des deux dépôts à la date de la maquette, mais il est figé dans le code.
L'étape suivante est de le brancher sur les vraies sources — arborescence du dépôt,
`CLAUDE.md`, `plan.md`, `README.md` — et sur l'historique de sessions qui vit dans
`~/.claude/projects/`, hors dépôt.

Voir `design/github.md` pour la correspondance entre chaque écran et ses fichiers source.
