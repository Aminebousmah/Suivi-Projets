# Atlas — visualisation de projets GitHub

Application qui montre un projet GitHub sous six angles, croise ce qu'on en dit avec ce qu'il contient, et se décrit elle-même avec ce fichier.

## Domaine · Coque et navigation
La barre de dépôts, l'en-tête, les onglets de vue et l'état partagé.

### Barre de dépôts — en ligne
Bascule entre les dépôts décrits, chacun avec sa palette et sa typographie.
- `src/App.tsx`
- `src/data/themes.ts`
> Changer de dépôt remet la sélection à zéro
> La source de la palette est affichée à droite de la barre

### Onglets de vue — en ligne
Les six vues, numérotées, avec l'accroche de la vue active sous l'en-tête.
- `src/data/labels.ts — VIEWS, BLURBS`
- `src/App.tsx`

### État dans l'URL — en ligne
Dépôt, vue, mode, domaine, fonctionnalité et zoom sérialisés en paramètres.
- `src/lib/url.ts`
- `src/lib/useAtlasState.ts`
> Les valeurs par défaut ne sont pas écrites dans l'URL
> Un paramètre inconnu retombe sur le défaut au lieu de casser la page
> Une sélection qui n'existe plus après changement de dépôt est purgée

### Historique navigateur — en ligne
Précédent et suivant rejouent la sélection ; le titre d'onglet suit le dépôt.
- `src/lib/useAtlasState.ts — popstate`
- `src/App.tsx`

### Barrière d'erreur — en ligne
Une vue qui plante laisse l'en-tête, les onglets et les autres vues utilisables.
- `src/components/ErrorBoundary.tsx`
- `src/components/__tests__/ErrorBoundary.test.tsx`
> Changer d'onglet suffit à sortir de l'erreur : la barrière est remontée à chaque vue
> Un bouton ramène à la fiche projet

### Point d'entrée de l'application — en ligne
La page servie, le montage de React, le fond et le liseré de focus.
- `index.html`
- `src/main.tsx`
- `src/index.css`
- `public/favicon.svg`
> index.html charge les trois polices depuis Google Fonts et rien d'autre
> index.css ne porte que le strict minimum : fond, liens, boutons, focus — tout le reste vient du thème
> Le liseré de focus lit une variable CSS que App met à jour selon le dépôt affiché

### Navigation au clavier — en ligne
L'arbre se parcourt aux flèches, Échap dégage d'un cran, Origine et Fin sautent aux extrémités.
- `src/lib/keyboard.ts`
- `src/views/ArchView.tsx`
> La tabulation mène à l'arbre : sans ce point d'entrée, il ne se pilotait qu'après un clic dedans
> Le focus suit la sélection et le nœud choisi est amené dans la vue
> Le liseré de focus prend la couleur d'accent du dépôt

### Écrans étroits — en ligne
Sous 720 px, le panneau passe sous le contenu et les colonnes secondaires s'effacent.
- `src/lib/useMediaQuery.ts`
> Les styles en ligne hérités de la maquette ne peuvent pas être adaptés par une règle CSS
> Sous 1100 px, le panneau de l'arbre passe dessous ; sous 720 px, les colonnes secondaires s'effacent
> En étroit, dépôts et onglets défilent sur une ligne au lieu de s'empiler
> Vérifié à 390 px comme à 1440 px : aucun débordement horizontal

## Domaine · Les six vues
Ce que chaque onglet montre du projet décrit.

### Fiche projet — en ligne
Ce que le projet fait, ce qu'il reste à faire, la pile poste par poste, la feuille de suivi.
- `src/views/SheetView.tsx`

### Graphe des fonctionnalités — en ligne
Arbre projet → domaine → fonctionnalité, tracé en courbes de Bézier, avec quatre paliers de zoom.
- `src/views/ArchView.tsx`
- `src/views/arch/GraphCanvas.tsx`
- `src/lib/graph.ts — buildMap`
> Tout est dessiné d'un coup : on navigue au zoom et au défilement
> La feuille sélectionnée épaissit son arête
> Le panneau de droite suit la sélection

### Vue liste — en ligne
Les mêmes domaines en cartes, puis le tableau des fonctionnalités du domaine ouvert.
- `src/views/arch/DomainCards.tsx`
- `src/views/arch/FeatureTable.tsx`

### Panneau de détail — en ligne
Ce que porte la sélection : rôle, statut, chemins cités, ce qu'ils donnent dans le dépôt, et la règle d'or.
- `src/views/arch/DetailPanel.tsx`
> Il parle de fonctionnalité ou de fichier selon l'arbre affiché
> Un chemin cité mais absent du dépôt y est encadré comme un avertissement
> Colonne de largeur fixe et collante : le détail reste visible en bas du graphe

### Sessions — en ligne
Vos fichiers de session déposés dans la page, lus et appariés en demandes et réponses.
- `src/views/SessionsView.tsx`
- `src/lib/sessions.ts`
> Un navigateur ne lit pas ~/.claude/projects/ : les fichiers sont déposés, jamais envoyés ailleurs
> Un résultat d'outil revenu sous le rôle « user » n'est pas pris pour une demande
> Le raisonnement interne n'est pas affiché
> Une ligne illisible est comptée et ignorée
> Sans fichier déposé, la description écrite reste affichée

### Contexte Claude — en ligne
Fichiers lus avant d'agir, règles actives, interdits, décisions ouvertes.
- `src/views/ContextView.tsx`

### Avancement — en ligne
Les phases du projet avec leur statut.
- `src/views/ProgressView.tsx`

### Dépôt réel — en ligne
Métadonnées GitHub, derniers commits, fichiers de contexte lus, et écarts entre les fichiers cités et l'arborescence.
- `src/views/GitHubView.tsx`
- `src/lib/useGitHub.ts`

### Primitives d'interface — en ligne
Le bouton de ligne qui s'éclaire au survol, et le sur-titre mono qui coiffe chaque section.
- `src/components/ui.tsx`
> Les styles en ligne hérités de la maquette ne savent pas exprimer un survol : le bouton le porte lui-même
> C'est l'équivalent du style-hover du prototype

### Bandeau de provenance — en ligne
Chaque vue dit si ce qu'elle affiche vient du dépôt ou de la description figée.
- `src/components/SourceBadge.tsx`
> Une vue lue dans le dépôt cite le fichier d'où elle vient
> Le dépôt ne remplace que ce qu'il porte vraiment : une section absente laisse la description en place
> Tant que le dépôt n'est pas lu, le bandeau porte le bouton qui le lit

## Domaine · Modèle et données
Ce qui décrit un dépôt, et d'où viennent les couleurs.

### Types du modèle — en ligne
Theme, RepoData, Domain, Feature, Session, Phase — le contrat que toute source devra respecter.
- `src/data/types.ts`

### Description des dépôts — en cours
Domaines, fonctionnalités, sessions, phases et feuille de suivi de chaque dépôt.
- `src/data/repos.ts`
> Écrit à la main, repris de la maquette
> C'est ce fichier que la vue Dépôt réel confronte à GitHub

### Encre lisible sur chaque ton — en ligne
Choisit, parmi les couleurs du thème, l'encre qui contraste le plus avec un fond donné.
- `src/lib/color.ts`
- `src/lib/__tests__/color.test.ts`
> Choisie à la main, dépôt par dépôt, l'encre avait produit un texte noir sur fond noir
> Un test vérifie, pour chaque ton de chaque thème, un contraste d'au moins 3:1

### Thèmes par dépôt — en ligne
Palette, tons de domaine, pastilles de statut et typographie, dérivés des tokens du dépôt décrit.
- `src/data/themes.ts`

### Lecture du fichier de suivi — en ligne
Lit atlas.md dans le dépôt et en tire domaines, fonctionnalités, statuts, fichiers et feuille de suivi.
- `src/lib/atlasFile.ts`
- `src/lib/__tests__/atlasFile.test.ts`
- `src/lib/__tests__/fixtures/atlas.md`
> C'est la seule source qui porte du sens : ni l'arborescence ni git ne disent à quoi sert un fichier
> Quand le dépôt fournit ce fichier, la description figée n'est plus qu'un repli
> Un fichier hors format n'est pas une panne : il est simplement laissé de côté

### Le prompt de suivi — en ligne
Le texte à coller dans une session Claude Code pour qu'un projet produise et tienne à jour son atlas.md.
- `ATLAS-PROMPT.md`
> Il donne la grammaire du fichier et les règles de suivi : ne rien inventer, ne citer que des chemins réels, couvrir tout le dépôt
> Relancé plus tard, il met à jour au lieu de réécrire

### Le suivi d'Atlas lui-même — en ligne
Atlas décrit son propre arbre avec le format qu'il propose aux autres.
- `atlas.md`
- `src/lib/__tests__/atlasSelf.test.ts`
> Un test compare ce fichier à la description figée : toute dérive entre les deux est signalée
> C'est aussi la démonstration que le format tient sur un vrai projet

### Libellés et vues — en ligne
Statuts en français, définition des six vues, accroches.
- `src/data/labels.ts`

### Arbre déduit du dépôt — en ligne
L'arborescence réelle devient des groupes et des fichiers, regroupés par dossier.
- `src/lib/tree.ts`
> Un dossier trop gros pour se lire d'un coup d'œil est éclaté en ses sous-dossiers
> Aucun statut n'est attribué : rien dans une arborescence n'en porte
> Chaque feuille porte son poids, et ce que les derniers commits y ont fait
> Les dossiers d'outillage et les dossiers cachés sont écartés

### Élément sans statut — en ligne
Le modèle accepte un élément qui n'a pas d'état d'avancement, et l'affichage s'y adapte.
- `src/data/types.ts — Feature.status`
- `src/lib/graph.ts`
> La légende des états disparaît quand rien n'en porte
> L'aperçu par branche annonce alors un décompte, pas un avancement

## Domaine · Pont GitHub
La lecture du dépôt réel et sa confrontation à la description.

### Client REST — en ligne
Métadonnées, arborescence récursive et derniers commits, jeton facultatif.
- `src/lib/github.ts`
> Chaque statut HTTP est traduit en message actionnable
> Sans jeton : dépôts publics seulement, soixante requêtes par heure

### Croisement des deux arbres — en ligne
Rapproche les fichiers cités par les fonctionnalités et ceux du dépôt, dans les deux sens.
- `src/lib/coverage.ts`
> Un fichier du dépôt dit quelles fonctionnalités il sert
> Une fonctionnalité dit où ses chemins atterrissent vraiment
> Chaque dossier annonce sa part décrite, et la vue Dépôt réel celle du projet
> Un fichier que rien ne cite n'est ni mort ni superflu : il est seulement non décrit

### Croisement des chemins — en ligne
Confronte chaque fichier cité à l'arborescence : exact, partiel, dossier, motif, déplacé ou absent.
- `src/lib/verify.ts`
> Les déclarations sont écrites pour un lecteur humain : préfixe src/ omis, annotation après un tiret
> Un fichier retrouvé ailleurs est signalé comme déplacé, pas comme présent

### Jeton en local — en ligne
Saisi dans la vue, gardé dans le navigateur, effaçable d'un bouton.
- `src/lib/useGitHub.ts — readToken, writeToken`
> Jamais envoyé ailleurs qu'à api.github.com
> Le stockage refusé en navigation privée ne bloque pas la vue

### Lecture des fichiers de contexte — en ligne
Lit CLAUDE.md, plan.md et README.md dans le dépôt et en tire règles, interdits, phases et cases à cocher.
- `src/lib/context.ts`
- `src/lib/github.ts — fetchTextFile`
> Aucun schéma n'est supposé : ce qui n'est pas reconnu est laissé de côté, jamais deviné
> Un fichier absent est une information affichée, pas une panne
> Les titres pris dans un bloc de code sont ignorés

### Cache des réponses — en ligne
Garde les réponses GitHub et les revalide par ETag : une réponse inchangée ne coûte rien au quota.
- `src/lib/cache.ts`
- `src/lib/github.ts — request`
> Cinq minutes de fraîcheur pendant lesquelles aucune requête n'est émise
> Au-delà, requête conditionnelle : GitHub répond 304 sans décompter le quota
> Le stockage plein fait place nette en sacrifiant les entrées les plus anciennes
> Un stockage refusé n'empêche rien : le cache est une optimisation, pas une source

### Quota et provenance affichés — en ligne
Le compteur de quota, l'heure de remise à zéro, et l'origine de chaque réponse du chargement.
- `src/views/GitHubView.tsx`
- `src/lib/useGitHub.ts — describeOrigins`

### Activité git — en ligne
Ce que les derniers commits ont touché, obtenu en une seule requête de comparaison de plage.
- `src/lib/activity.ts`
- `src/lib/github.ts — fetchCompare`
> Une requête par fichier coûterait autant de requêtes que de fichiers
> L'activité reste un constat daté : elle ne devient jamais un statut
> Si la comparaison échoue, l'arbre reste affichable sans les constats

### Délai maximal et repli — en ligne
Une requête qui ne répond pas est abandonnée ; un fichier de contexte illisible n'empêche pas d'afficher le dépôt.
- `src/lib/github.ts — TIMEOUT_MS`
- `src/lib/useGitHub.ts`
> Sans délai maximal, une seule requête pendante gelait la vue entière
> Hors ligne ou quota épuisé, une donnée périmée est servie plutôt qu'une page vide
> Un fichier non lu est distingué d'un fichier absent

## Domaine · Qualité et outillage
Ce qui empêche la régression silencieuse.

### Tests du graphe et du clavier — en ligne
Positionnement, arêtes, sélection, agrégats d'état par branche, et déplacement dans l'arbre.
- `src/lib/__tests__/graph.test.ts`
- `src/lib/__tests__/keyboard.test.ts`

### Tests de l'état d'URL — en ligne
Aller-retour, paramètres inconnus, purge de la sélection invalide.
- `src/lib/__tests__/url.test.ts`

### Tests du croisement — en ligne
Chaque forme de correspondance de chemin, le décompte par domaine, et le rapprochement des deux arbres.
- `src/lib/__tests__/verify.test.ts`
- `src/lib/__tests__/coverage.test.ts`
- `src/lib/__tests__/selfCoverage.test.ts`
> Un test échoue dès qu'un fichier du dépôt n'est cité par aucune fonctionnalité : la description ne peut plus prendre du retard en silence

### Tests du pont GitHub — en ligne
Fenêtre de fraîcheur, revalidation par ETag, quota épuisé, repli hors ligne et délai maximal.
- `src/lib/__tests__/github.test.ts`
- `src/lib/__tests__/cache.test.ts`
> fetch est simulé : aucun de ces tests ne touche le réseau
> Le stockage plein et le stockage refusé ont chacun leur cas

### Tests de lecture — en ligne
Analyse des Markdown de contexte, des fichiers de session et de l'arborescence du dépôt.
- `src/lib/__tests__/context.test.ts`
- `src/lib/__tests__/sessions.test.ts`
- `src/lib/__tests__/tree.test.ts`
- `src/lib/__tests__/fixtures/`
> Les fixtures reproduisent un CLAUDE.md et un plan.md réalistes, blocs de code et marqueurs de statut compris
> Elles servent à éprouver ce que la lecture doit ignorer autant que ce qu'elle doit trouver

### Maquette de référence — en ligne
Le prototype Claude Design d'origine, gardé intact comme source de vérité visuelle.
- `design/Project Atlas.dc.html`
- `design/github.md`
- `design/support.js`
> support.js est le moteur du prototype, conservé pour que la maquette reste ouvrable
> Ces fichiers ne sont jamais modifiés : quand le rendu diverge, c'est le code qui a tort

### Dépendances et lint — en ligne
Ce que le projet installe, les commandes qu'il expose, et les règles qui le relisent.
- `package.json`
- `package-lock.json`
- `.oxlintrc.json`
- `.gitignore`
> Six commandes : dev, build, build:pages, preview, test, lint
> design/ et dist/ sont exclus du lint : la maquette est une référence, pas du code applicatif
> Aucune dépendance n'est ajoutée sans usage réel dans le code

### Typage — la chaîne de projets — en ligne
Le fichier racine ne type aucun fichier : il enchaîne les trois périmètres que tsc -b construit.
- `tsconfig.json`
> files est vide, references pointe vers app, node et test
> npm run build lance tsc -b avant Vite : un type faux arrête la publication
> Chaque périmètre garde son propre cache sous node_modules/.tmp

### Typage — le code applicatif — en ligne
Ce qui part dans le navigateur : strict, DOM, JSX, et rien d'inutilisé.
- `tsconfig.app.json`
> Seul périmètre à connaître le navigateur : lib DOM et jsx react-jsx
> noUnusedLocals et noUnusedParameters : une variable oubliée arrête le build
> verbatimModuleSyntax : un import de type s'écrit import type
> Les tests en sont exclus — ils importent node:fs, que ce périmètre ne doit pas connaître

### Typage — les fichiers de configuration — en ligne
vite.config.ts, exécuté par Node et jamais par le navigateur.
- `tsconfig.node.json`
> types node et module nodenext, aucune lib DOM
> Un seul fichier dans ce périmètre, mais il lit process.env pour le chemin de publication

### Typage — les tests — en ligne
Le périmètre applicatif, élargi à Node et aux matchers de rendu.
- `tsconfig.test.json`
> Il étend tsconfig.app.json au lieu de répéter ses règles
> types node pour git ls-files et node:fs, jest-dom pour toBeInTheDocument
> exclude est vidé : ce que le périmètre applicatif écarte, celui-ci le reprend

### Contexte du dépôt — en ligne
Ce que Claude Code lit avant d'agir, la feuille de route, et le mode d'emploi du projet.
- `CLAUDE.md`
- `plan.md`
- `README.md`
> Ce sont exactement les fichiers que la vue Contexte Claude relit dans le dépôt
> Atlas se décrit donc avec les mêmes fichiers qu'il sait lire ailleurs
> plan.md porte les phases et leurs cases à cocher, reprises telles quelles par la vue Avancement

### Tests de rendu — en ligne
Chaque vue, la navigation, l'arbre au clavier et les bascules d'affichage, éprouvés en jsdom.
- `src/views/__tests__/render.test.tsx`
- `src/views/__tests__/github.render.test.tsx`
- `src/setupTests.ts`
> Ils remplacent les vérifications manuelles au navigateur
> jsdom n'est monté que pour ces tests : la logique pure s'en passe
> C'est ce test qui a montré que l'arbre n'était pas atteignable au clavier
> GitHub y est simulé : la vue Dépôt réel est éprouvée sans toucher au réseau

### Publication du build — en ligne
GitHub Pages à chaque poussée sur main, à condition que lint, tests et build passent.
- `.github/workflows/pages.yml`
- `vite.config.ts — base, manualChunks`
> Pages sert le site sous /<dépôt>/ : le build de publication reçoit PAGES_BASE
> Une étape reste manuelle : Settings, Pages, source « GitHub Actions »
> Rien n'est publié sur une base rouge
> React est livré à part : une mise à jour d'Atlas ne le fait pas retélécharger
## Suivi

| Indicateur | Actuel | Cible | Avancement |
| --- | --- | --- | --- |
| Vues livrées | 6 / 6 | 6 | 100% |
| Tests au vert | 261 | — | 100% |
| Erreurs de build | 0 | 0 | 100% |
| Dépôts décrits | 3 | 3 | 100% |
| Fichiers du dépôt décrits | tous | tous | 100% |
| Données lues depuis le dépôt | large | complet | 95% |
| Application publiée | workflow prêt | en ligne | 80% |

## Fait

- Montre un projet GitHub sous six angles : fiche, fonctionnalités, sessions, contexte, avancement, dépôt réel.
- Dessine l'arbre des fonctionnalités en graphe explorable, du projet au fichier, au clavier comme à la souris.
- Porte une direction artistique par dépôt, dérivée des tokens CSS du projet décrit.
- Inscrit toute la navigation dans l'URL : chaque sélection est un permalien.
- Lit le dépôt réel : arborescence, commits, activité git, fichiers de contexte et atlas.md.
- Croise les deux arbres : ce qu'un fichier sert, où une fonctionnalité atterrit, ce que personne ne décrit.
- Garde les réponses GitHub en cache et les revalide par ETag, pour épargner le quota.
- Lit les fichiers de session Claude Code déposés dans la page, sans qu'ils en sortent.
- Se lit aussi bien sur un téléphone que sur un grand écran, sans débordement.

## À faire

- Activer GitHub Pages dans les réglages du dépôt, puis fusionner la branche dans main pour publier.
- Ouvrir Atlas à n'importe quel dépôt saisi par l'utilisateur, plutôt qu'aux trois décrits ici.
- Rapprocher les sessions du croisement : dire quelles fonctionnalités une session a fait avancer.
