# Les prompts à donner à Claude Code

Deux prompts, à coller dans une session Claude Code ouverte **dans le dossier du projet,
sur ton PC** :

1. **La mise en place**, une fois par projet. Elle crée ou complète `atlas.md`, `plan.md`
   et `CLAUDE.md` sans bousculer ce qui existe, et installe dans `CLAUDE.md` une section
   « Suivi du projet » : à chaque tâche qui touche au code, Claude Code tiendra lui-même
   ces fichiers à jour.
2. **Le point de suivi**, quand tu veux remettre les compteurs à zéro — après une grosse
   série de changements, ou une fois par semaine.

Atlas lit ces fichiers **sur GitHub** : ils ne comptent qu'une fois commités et poussés.

---

## 1. Mise en place — une fois par projet

```
Tu travailles dans le dossier local de ce projet. Tu vas mettre en place son suivi pour
Atlas, un outil qui visualise le projet à partir de trois fichiers : atlas.md, plan.md et
CLAUDE.md. Commence par lire, n'écris rien avant d'avoir tout lu.

## 1. Lis le projet tel qu'il est

- CLAUDE.md, à la racine ou dans .claude/ ;
- plan.md, à la racine ou dans docs/ — ou, à défaut, l'endroit où vivent les phases du
  projet : une section de CLAUDE.md, du README, un fichier de docs/ ;
- README.md et le dossier docs/ s'il existe ;
- la liste des fichiers suivis : `git ls-files` ;
- les derniers commits : `git log --oneline -20`.

Ce projet a déjà sa structure et ses habitudes. Respecte-les : ne réorganise rien, ne
renomme pas les sections existantes, garde la langue, le ton et les emoji des fichiers,
et ne déplace pas un fichier qui a déjà sa place — un plan rangé dans docs/plan.md y reste.

## 2. atlas.md, à la racine — à créer, ou à mettre à jour

La description fonctionnelle du projet. S'il existe déjà, garde ce qui est encore vrai,
corrige ce qui a changé, ajoute ce qui manque, retire ce qui n'existe plus. Le format,
qu'Atlas lit tel quel :

    # Atlas — <nom du projet>

    <Une ou deux phrases : ce que le projet fait, pour qui.>

    ## Domaine · <Nom du domaine>
    <Le rôle de ce domaine, en une ligne.>

    ### <Nom de la fonctionnalité> — en cours
    <Ce qu'elle fait, en une phrase.>
    - `chemin/reel/du/fichier.py`
    - `un/dossier/entier/`
    > Une chose qu'un lecteur ne devinerait pas : contrainte, piège, décision et sa raison.

    ## Suivi
    | Indicateur | Actuel | Cible | Avancement |
    | --- | --- | --- | --- |
    | Phases terminées | 3 / 5 | 5 | 60% |

    ## Fait
    - <Ce que le projet fait déjà, une ligne par point.>

    ## À faire
    - <Ce qu'il reste à faire.>

    ## Direction artistique
    | Rôle | Couleur | Usage |
    | --- | --- | --- |
    | Fond | `#FFF4E5` | fond de page |
    | Surface | `#FFFFFF` | cartes |
    | Encre | `#2F1C11` | texte principal |
    | Encre douce | `#6B4F3A` | texte secondaire |
    | En-tête | `#3B2416` | bandeau du haut |
    | Accent | `#F3BBC8` | onglet actif, liens |
    | Marque | `#1746D1` | couleur de marque |
    | Succès | `#0F6B4F` | ce qui est fait |
    | Police des titres | DynaPuff | |

Les statuts, après un tiret cadratin dans le titre de la fonctionnalité — quatre, pas un
de plus :

- `en ligne` — c'est fait et ça tourne ;
- `en cours` — commencé, pas fini ;
- `gelée` — construit puis mis de côté, ou bloqué par une décision ;
- `idée` — pas commencé, pas encore tranché.

Pour « Suivi », choisis des indicateurs que le projet permet de mesurer : phases
terminées, tests au vert, pages, dashboards, couverture des données… Pas d'indicateur
inventé pour remplir le tableau.

Pour « Direction artistique », relève les couleurs là où le projet les déclare —
variables CSS, config Tailwind, charte dans CLAUDE.md — sans en inventer. Fond, Encre et
Accent sont indispensables : sans eux, Atlas garde son thème par défaut. Ajoute une
ligne « Marque » par couleur de marque (jusqu'à trois), et « Mode : sombre » si
l'interface est sombre. Atlas construit le thème du projet à partir de ce tableau, et
choisit lui-même les encres lisibles.

## 3. plan.md — les phases du projet

- S'il existe (à la racine ou dans docs/) : mets-le à jour sur place, dans son format.
  Vérifie seulement que chaque phase est un titre `##` qui commence par « Phase » et
  porte un statut lisible — ✅, ✓, « (FAIT) », 🚧, « EN COURS », ⏳, 💡 — ou des cases
  à cocher `- [x]` / `- [ ]`. Coche ce que le code montre comme terminé.
- Si les phases vivent ailleurs — une section de CLAUDE.md ou du README : crée plan.md à
  la racine à partir d'elles, puis remplace la section d'origine par une ligne qui renvoie
  à plan.md. Deux copies d'un même plan finissent toujours par se contredire.
- Si le projet n'a aucune feuille de route écrite : crée plan.md avec ce qui est fait —
  une « Phase 0 — Fondations ✅ » aux cases cochées — et ce que le README ou les TODO du
  code annoncent comme à venir. N'invente pas de futur que rien n'annonce : demande-moi.

## 4. CLAUDE.md — les règles du projet

- S'il n'existe pas : crée-le, court, à partir du README et du code — contexte, stack,
  structure, commandes, conventions que le code suit visiblement. N'y mets d'interdits
  que ceux que le projet énonce quelque part.
- S'il existe : ne le réécris pas. Vérifie seulement que les règles sont sous un titre
  qui contient « Conventions », « Règles », « Contraintes » ou « Workflow », et les
  interdits sous « À ne jamais faire » ou « Jamais » — y compris en sous-section, comme
  « Règles pour Claude Code › Jamais ». Si c'est déjà le cas, ne touche à rien.
- Dans les deux cas, ajoute à la fin la section ci-dessous, mot pour mot mais sans le
  retrait, ou mets-la à jour si elle y est déjà. C'est elle qui fera tenir le suivi à
  jour, session après session :

      ## Suivi du projet

      Ce projet est suivi par Atlas, qui lit atlas.md, plan.md et ce fichier sur GitHub.

      À la fin de chaque tâche qui modifie le code :

      - mets à jour atlas.md : le statut des fonctionnalités touchées, les fichiers
        ajoutés, renommés ou supprimés, et une nouvelle fonctionnalité si la tâche en crée
        une ;
      - coche dans plan.md ce qui vient d'être terminé, et change le statut d'une phase
        qui démarre ou s'achève ;
      - si la charte graphique a changé — couleurs, police des titres —, mets à jour
        la section « Direction artistique » d'atlas.md ;
      - si une convention ou un interdit a été décidé pendant la tâche, ajoute-le ici ;
      - termine ton récapitulatif par une ligne « Suivi : … » qui dit ce que tu as mis à
        jour, ou « Suivi : rien à changer ».

      Un statut ne s'invente pas : dans le doute, `idée`, et dis-le moi. Ces fichiers ne
      comptent pour Atlas qu'une fois commités et poussés.

## Les règles de suivi

- **N'invente aucun statut.** Si rien dans le projet ne dit où en est une fonctionnalité,
  écris `idée` et signale-le. Une incertitude se signale, elle ne se comble pas.
- **Ne cite que des chemins qui existent** dans `git ls-files`, entre accents graves —
  sinon `__init__.py` perd ses tirets bas. Atlas confronte chaque chemin au dépôt et
  affiche l'écart.
- **Couvre tout le projet.** Chaque fichier suivi devrait être cité par au moins une
  fonctionnalité, outillage et configuration compris. Un dossier de données ou d'assets
  se cite en entier (`data/`) plutôt que fichier par fichier.
- **Une fonctionnalité répond à une question.** Deux fichiers qui répondent à la même
  question vont ensemble ; deux questions distinctes se séparent. Découpe par intention,
  pas par dossier — même dans un monorepo, où apps/ et packages/ ne sont pas des domaines
  par nature.
- **Décris ce qui est, pas ce qui est prévu.** Le futur va dans « À faire » et dans
  plan.md, jamais dans une fonctionnalité `en ligne`.
- **Écris en français**, en phrases entières, sans jargon inutile.

## Commit et publication

Respecte les règles de commit du projet. Si CLAUDE.md t'interdit de commiter seul, ne le
fais pas : donne-moi la liste des fichiers modifiés et la commande pour les commiter.
Sinon, commite ces fichiers à part, avec le message « Suivi : mise en place pour Atlas »,
et demande-moi avant de pousser.

## Avant de finir

- Vérifie que chaque chemin cité dans atlas.md existe vraiment.
- Compte les fichiers suivis que rien ne cite, et donne-moi le chiffre.
- Fais-moi un récapitulatif court, fichier par fichier : ce que tu as créé, ajouté,
  corrigé, retiré — et ce que tu n'as pas pu trancher.
```

---

## 2. Point de suivi — quand tu veux faire le point

Une fois la mise en place faite, la section « Suivi du projet » de `CLAUDE.md` fait
tenir les fichiers à jour à chaque tâche. Ce prompt-là rattrape ce qui aurait glissé :

```
Fais le point du suivi Atlas de ce projet.

1. Relis atlas.md, plan.md et la section « Suivi du projet » de CLAUDE.md.
2. Regarde ce qui a changé depuis leur dernière mise à jour :
   `git log --oneline $(git log -1 --format=%H -- atlas.md)..HEAD`
   et la liste des fichiers suivis : `git ls-files`.
3. Mets à jour atlas.md et plan.md en conséquence, dans leur format, en suivant les
   règles de la section « Suivi du projet » : aucun statut inventé, aucun chemin qui
   n'existe pas, tout le projet couvert. Vérifie que la section « Direction
   artistique » d'atlas.md reprend les couleurs actuelles du code ; ajoute-la si elle
   manque.
4. Vérifie chaque chemin cité, et dis-moi combien de fichiers ne sont décrits nulle part.
5. Respecte les règles de commit du projet, et fais-moi un récapitulatif court :
   ajouté, corrigé, retiré, et ce qui reste à trancher.
```

---

## Ce qu'Atlas en fait

Atlas lit, sur la branche décrite :

| Fichier | Où Atlas le cherche | Ce qu'il en tire |
| --- | --- | --- |
| `CLAUDE.md` | la racine, puis `.claude/` | les règles actives et les interdits, sous-sections comprises |
| `plan.md` | la racine, puis `docs/` | les phases, leur statut — marqueur, pourcentage ou cases — et les cases à cocher |
| `README.md` | la racine | le résumé du projet |
| `atlas.md` | la racine | l'arbre des fonctionnalités, la feuille de suivi, ce qui est fait et ce qui reste, et les couleurs du projet |

Quand `atlas.md` est là, c'est lui qui décrit l'arbre, et le croisement avec
l'arborescence réelle montre ce que personne ne décrit et ce qui est cité mais absent.
Sans lui, Atlas continue de fonctionner : le fichier améliore le suivi, il n'est pas exigé.

Atlas relit le dépôt tout seul : au retour sur son onglet, et toutes les deux minutes
tant qu'on le regarde. Un changement poussé — une fonctionnalité, un statut, une
couleur — apparaît donc sans rien toucher dans Atlas.

## Ajouter un projet dans Atlas

Le bouton « ＋ Dépôts », à droite des projets dans la barre du haut, liste les dépôts de
ton compte GitHub (un jeton est nécessaire, saisi dans la vue « Dépôt réel »). Coche un
dépôt pour l'ajouter, décoche-le pour le retirer. Le choix est retenu dans ton
navigateur. Un dépôt ajouté est décrit par son seul atlas.md : lance d'abord la mise en
place dans ce projet.
