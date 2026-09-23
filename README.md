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

Le build sépare React du code de l'application : environ 50 kB compressés pour Atlas,
68 kB pour React, que le navigateur garde en cache d'une version à l'autre.

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
    github.ts         client REST GitHub : métadonnées, arborescence, commits, fichiers
    cache.ts          cache des réponses, fenêtre de fraîcheur et purge du stockage plein
    verify.ts         croisement des fichiers déclarés avec l'arborescence réelle
    context.ts        lecture de CLAUDE.md, plan.md et README.md : règles, interdits, phases
    tree.ts           l'arborescence réelle regroupée en dossiers et fichiers
    coverage.ts       croisement des deux arbres : ce qu'un fichier sert, ce que rien ne décrit
    activity.ts       ce que les derniers commits ont touché, en constats datés
    sessions.ts       lecture des fichiers .jsonl de session Claude Code
    atlasFile.ts      lecture d'atlas.md : domaines, statuts, fichiers, feuille de suivi
    keyboard.ts       déplacement dans l'arbre au clavier
    useMediaQuery.ts  ce que les composants savent de la place disponible
    color.ts          l'encre la plus lisible sur un fond donné
    useGitHub.ts      chargement du dépôt réel et jeton gardé dans le navigateur
    __tests__/        261 tests Vitest, logique pure et rendu compris
  views/
    SheetView.tsx     01 Fiche projet — ce que le projet fait, pile technique, feuille de suivi
    ArchView.tsx      02 Fonctionnalités — graphe ou liste, plus le panneau de détail
    SessionsView.tsx  03 Sessions — prompts, réponses, fichiers touchés, mémoires écrites
    ContextView.tsx   04 Contexte Claude — fichiers lus, règles actives, interdits, décisions ouvertes
    ProgressView.tsx  05 Avancement — les phases de plan.md avec leur statut réel
    GitHubView.tsx    06 Dépôt réel — métadonnées GitHub, commits, écarts de fichiers
    arch/             les morceaux de l'arbre : canvas, cartes, tableau, panneau
    __tests__/        tests de rendu : ce qu'un lecteur voit, vue par vue
  components/
    ui.tsx            primitives partagées (bouton à survol, sur-titre mono)
    SourceBadge.tsx   bandeau de provenance : dépôt lu, ou description figée — et le bouton qui le lit
    ErrorBoundary.tsx une vue qui plante n'emporte pas l'application
CLAUDE.md             contexte, conventions et interdits du projet
plan.md               les phases, avec leur statut et leurs cases à cocher
atlas.md              le suivi d'Atlas, dans le format qu'il propose aux autres
ATLAS-PROMPT.md       le prompt à coller dans une session Claude Code
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

## Lire le dépôt depuis n'importe quelle vue

Tant que le dépôt n'est pas lu, chaque vue qui pourrait en profiter le dit — « description
figée » — et porte le bouton **Lire le dépôt**. Plus besoin de passer par l'onglet 06 ; après
un échec, le même bouton relance.

## Vue « Dépôt réel »

Les cinq premières vues décrivent le projet tel qu'il a été documenté. La sixième
interroge l'API GitHub et confronte cette description au dépôt : métadonnées, derniers
commits, et surtout le croisement entre les fichiers cités par chaque fonctionnalité et
l'arborescence réelle. Un chemin peut être retrouvé exactement, sous un autre préfixe,
comme dossier, via un motif, déplacé ailleurs — ou déclaré absent.

Le jeton personnel GitHub est facultatif : sans lui, seuls les dépôts publics répondent,
dans la limite de soixante requêtes par heure. Il est gardé dans le `localStorage` du
navigateur, n'est envoyé qu'à `api.github.com`, et un bouton l'efface.

## Clavier et écrans étroits

L'arbre se parcourt entièrement au clavier : la tabulation y mène, les flèches
descendent (→), remontent (←) et parcourent un niveau (↑ ↓) en enjambant la frontière
entre deux branches, `Échap` dégage d'un cran, `Origine` et `Fin` sautent aux extrémités.
Le focus suit la sélection et le nœud choisi est amené dans la vue. Le liseré de focus
prend la couleur d'accent du dépôt affiché — aucune couleur n'est codée en dur.

Les styles étant en ligne, hérités de la maquette, aucune règle CSS ne peut les adapter :
c'est le composant qui sait s'il est à l'étroit, via `useMediaQuery`. Sous 1100 px, le
panneau de l'arbre passe dessous ; sous 720 px, les colonnes secondaires des tableaux
s'effacent, et dépôts comme onglets défilent sur une ligne, l'élément actif ramené dans
l'écran. Vérifié à 390, 1024 et 1440 px : aucun débordement horizontal.

En large, le panneau de détail a une colonne fixe et reste collé en haut de l'écran :
cliquer une feuille au fond du graphe montre son détail sans remonter la page. C'est le
seul écart assumé avec la maquette, qui partageait l'écran en deux moitiés égales.

## État du projet

Les sept phases de `plan.md` sont livrées. Il reste deux gestes, hors du dépôt, pour que
le site soit en ligne : activer GitHub Pages dans les réglages, et fusionner la branche
de travail dans `main`. `plan.md` dit aussi ce qui n'a pas été fait, et pourquoi.

## Publication

`.github/workflows/pages.yml` publie le site sur GitHub Pages à chaque poussée sur
`main`, ou à la demande. Le lint, les tests et le build doivent passer : rien n'est
publié sur une base rouge. Le build de publication reçoit `PAGES_BASE`, car Pages sert
le site sous `/<dépôt>/` et non à la racine — `npm run build:pages` reproduit ce build
en local.

Une étape reste manuelle, côté GitHub : **Settings → Pages → Source : GitHub Actions**.
Tant qu'elle n'est pas faite, le workflow échoue au moment du déploiement.

## Cache et quota

L'API GitHub plafonne à soixante requêtes par heure sans jeton, cinq mille avec. Les
réponses sont donc gardées dans le `localStorage`, à deux niveaux :

1. pendant **cinq minutes**, une réponse est servie sans qu'aucune requête ne parte ;
2. au-delà, la requête est **conditionnelle** : l'ETag est renvoyé à GitHub, qui répond
   `304 Not Modified` — et un `304` ne décompte pas du quota.

La vue « Dépôt réel » affiche le quota restant, l'heure de sa remise à zéro, et d'où
vient chaque réponse du chargement : téléchargée, revalidée sans coût, ou servie depuis
le cache. Un bouton vide le cache.

Le cache est une optimisation, jamais une source : un stockage refusé, plein ou corrompu
n'empêche rien. Quand le stockage sature, les entrées confirmées le plus anciennement
sont sacrifiées. Et quand GitHub ne répond pas — hors ligne, quota épuisé, requête trop
lente — une donnée périmée est servie plutôt qu'une page vide.

Chaque requête a un **délai maximal de quinze secondes** : sans lui, une seule requête
pendante gèle la vue entière. Les fichiers de contexte étant facultatifs, leur échec de
lecture est signalé mais n'empêche pas d'afficher le dépôt.

## L'arbre : décrit, ou réel

La vue Fonctionnalités bascule entre deux lectures du même projet :

- **Décrit** — les domaines et fonctionnalités écrits dans `src/data/repos.ts`, avec leur
  état d'avancement ;
- **Dépôt** — l'arborescence réelle, regroupée par dossier. Un dossier trop gros pour se
  lire d'un coup d'œil est éclaté en ses sous-dossiers ; un dossier démesuré est tronqué
  et le reste résumé.

**L'arbre du dépôt ne porte aucun statut**, et c'est délibéré : rien dans une arborescence
ne dit qu'une chose est en cours ou gelée. Chaque feuille porte des faits — son poids, et
ce que les derniers commits y ont fait. L'activité git est obtenue en **une seule requête**
de comparaison de plage, là où la demander fichier par fichier en coûterait une par
fichier. Elle non plus ne devient jamais un statut : un fichier modifié hier n'est pas
« en cours », un fichier ancien n'est pas « gelé ».

## Le croisement des deux arbres

Les deux lectures se répondent. Chacune sait ce que l'autre ignore :

- **Un fichier du dépôt** nomme les fonctionnalités qui le citent — « Les six vues →
  Graphe des fonctionnalités » — ou dit qu'aucune ne le fait.
- **Une fonctionnalité** montre où ses chemins atterrissent réellement : `exact`,
  `partiel`, `dossier`, `déplacé`, ou `absent` quand le fichier n'existe plus.
- **Chaque dossier** annonce sa part décrite (`1/13 décrit(s)`), et la vue « Dépôt réel »
  celle du projet entier, avec les dossiers classés du moins décrit au plus décrit.

Le rapprochement se fait sur le chemin, jamais sur la déclaration brute, car deux
fonctionnalités qui citent le même fichier partagent un seul résultat. Et il ne juge
rien : **un fichier que rien ne cite n'est ni mort ni superflu — il est seulement non
décrit.** C'est l'inverse des écarts, qui pointent des chemins cités mais absents du
dépôt.

Atlas se décrit lui-même en entier : chaque fichier suivi par git est rattaché à une
fonctionnalité. Un test le vérifie à chaque exécution et nomme les fichiers oubliés, de
sorte que la description ne peut plus prendre du retard en silence.

## Sessions

L'historique des sessions Claude Code vit dans `~/.claude/projects/<projet>/*.jsonl`, sur
la machine et hors dépôt : **un navigateur ne peut pas aller l'y chercher**. La vue
Sessions accepte donc que ces fichiers y soient déposés — ils sont lus dans la page et ne
partent nulle part.

Le format est du JSON Lines qu'aucun contrat ne garantit, la lecture est donc tolérante :
une ligne illisible est comptée et ignorée, le raisonnement interne n'est pas affiché, et
un résultat d'outil revenu sous le rôle « user » n'est pas pris pour une demande — sans
quoi la moitié des « prompts » affichés seraient des sorties de commandes.

## Faire décrire un projet par lui-même

`ATLAS-PROMPT.md` contient un prompt à coller dans une session Claude Code ouverte sur
n'importe quel projet. Il en fait produire un `atlas.md` à la racine : les domaines, leurs
fonctionnalités, le statut de chacune, les fichiers qui l'implémentent, et une feuille de
suivi. Relancé plus tard, il met à jour au lieu de réécrire.

```md
## Domaine · Navigation & parcours
L'ossature de circulation : menu, portes, pied de page.

### Les 10 portes thématiques — en ligne
Grille d'entrée vers les dix univers du citron.
- `src/config/nav.ts`
> La porte Boutique disparaît quand le commerce est coupé.
```

Quand un dépôt fournit ce fichier, **c'est lui qui décrit son arbre** : les domaines, les
statuts, la feuille de suivi et le croisement en viennent, et la description figée de
`src/data/repos.ts` n'est plus qu'un repli. Chaque vue dit laquelle des deux elle affiche.

Le prompt porte aussi les règles de suivi : ne jamais inventer un statut, ne citer que des
chemins qui existent, couvrir tout le dépôt, et n'écrire dans une fonctionnalité que ce
qui est — le reste va dans `À faire`.

Atlas se décrit avec son propre `atlas.md`, et deux tests veillent : l'un refuse que ce
fichier et la description figée divergent, l'autre qu'un fichier du dépôt n'y soit cité
nulle part.

## Lecture des fichiers de contexte

Une fois le dépôt connecté, `CLAUDE.md`, `plan.md` et `README.md` y sont lus et analysés :

- les **règles** et les **interdits** viennent des sections de `CLAUDE.md` qui en parlent,
  les seconds étant reconnus par leur titre ou par leur formulation ;
- les **phases** viennent des titres de `plan.md`, avec leur statut lu dans le titre ou
  juste en dessous — un « ✅ », un « (fait) », un « en cours » ;
- les **cases à cocher** de `plan.md` sont reprises telles quelles.

Ces fichiers sont écrits pour des humains, sans schéma garanti : l'analyse est « au mieux »
et ne devine rien. Ce qui n'est pas reconnu est laissé de côté, un titre pris dans un bloc
de code est ignoré, et un fichier absent est signalé sans faire échouer la lecture. Le
dépôt ne remplace que ce qu'il porte vraiment : un `CLAUDE.md` sans section d'interdits
laisse en place ceux de la description.

Chaque vue concernée affiche d'où vient ce qu'elle montre — « lu dans le dépôt », en
citant le fichier, ou « description figée ».

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

Les règles, les interdits et les phases sont relus dans le dépôt quand il est connecté,
l'arborescence et l'activité git viennent de GitHub, et les sessions des fichiers déposés.
Ce qui reste écrit à la main, ce sont les domaines fonctionnels et leur avancement : c'est
du sens, et aucune source mécanique ne le porte.

Voir `design/github.md` pour la correspondance entre chaque écran et ses fichiers source.
