# Le prompt à donner à Claude Code

Copiez tout le bloc ci-dessous dans une session Claude Code ouverte sur le projet que
vous voulez suivre. Il fait produire un fichier `atlas.md` qu'Atlas sait lire, et met à
jour `CLAUDE.md` et `plan.md` si le projet en a.

Relancez-le quand le projet a bougé : il met à jour ce qui existe au lieu de le réécrire.

---

```
Lis ce dépôt, puis tiens à jour son suivi pour Atlas.

## Ce que tu produis

1. `atlas.md` à la racine — la description fonctionnelle du projet, dans le format
   donné plus bas. S'il existe déjà, mets-le à jour : garde ce qui est encore vrai,
   corrige ce qui a changé, ajoute ce qui manque, retire ce qui n'existe plus.
2. `plan.md` — les phases du projet avec leur statut, s'il existe. Sinon, crée-le
   seulement si le projet a une feuille de route identifiable.
3. `CLAUDE.md` — les conventions, les interdits et le workflow attendu, s'il existe.
   Ne le crée pas de toi-même : c'est au propriétaire du projet d'en décider.

## Comment tu remplis atlas.md

    # Atlas — <nom du projet>

    <Une ou deux phrases : ce que le projet fait, pour qui.>

    ## Domaine · <Nom du domaine>
    <Le rôle de ce domaine, en une ligne.>

    ### <Nom de la fonctionnalité> — en cours
    <Ce qu'elle fait, en une phrase.>
    - `chemin/reel/du/fichier.ts`
    - `autre/chemin.ts`
    > Une chose à savoir sur cette fonctionnalité.
    > Une autre, s'il y a lieu.

    ## Suivi
    | Indicateur | Actuel | Cible | Avancement |
    | --- | --- | --- | --- |
    | <ce que vous mesurez> | <valeur> | <cible ou —> | <0 à 100>% |

    ## Fait
    - <Ce que le projet fait déjà, une ligne par point.>

    ## À faire
    - <Ce qu'il reste à faire.>

### Les statuts

Quatre, et seulement quatre, après un tiret cadratin dans le titre de la fonctionnalité :

- `en ligne` — c'est fait et ça tourne ;
- `en cours` — commencé, pas fini ;
- `gelée` — construit puis mis de côté, ou bloqué par une décision ;
- `idée` — pas commencé, pas encore tranché.

Les emoji ✅ 🚧 ⏳ 💡 sont acceptés à la place.

## Les règles de suivi

- **N'invente aucun statut.** Si rien dans le dépôt ne dit où en est une fonctionnalité,
  écris `idée` plutôt que de supposer. Une incertitude se signale, elle ne se comble pas.
- **Ne cite que des chemins qui existent.** Vérifie chaque fichier listé. Un chemin faux
  vaut moins que pas de chemin du tout — Atlas les confronte à l'arborescence réelle et
  affichera l'écart.
- **Couvre tout le dépôt.** Chaque fichier suivi par git devrait être cité par au moins
  une fonctionnalité. Les fichiers d'outillage et de configuration comptent : ils
  méritent une fonctionnalité qui dit à quoi ils servent.
- **Une fonctionnalité répond à une question.** Deux fichiers qui répondent à la même
  question vont ensemble ; deux questions distinctes se séparent. Ne découpe pas par
  dossier, découpe par intention.
- **Décris ce qui est, pas ce qui est prévu.** Le futur va dans `À faire` et dans les
  phases de `plan.md`, jamais dans une fonctionnalité `en ligne`.
- **Les notes disent ce qu'un lecteur ne devinerait pas** : une contrainte, un piège, une
  décision et sa raison. Pas de paraphrase du nom de la fonctionnalité.
- **Écris en français**, en phrases entières, sans jargon inutile.

## Avant de finir

- Relis `atlas.md` : chaque chemin cité existe-t-il vraiment ?
- Compte les fichiers du dépôt que rien ne cite, et dis-le moi.
- Fais-moi un récapitulatif court : ce que tu as ajouté, corrigé, retiré.
```

---

## Ce qu'Atlas en fait

Une fois `atlas.md` présent sur la branche décrite, Atlas le lit comme il lit déjà
`CLAUDE.md`, `plan.md` et `README.md`, et s'en sert pour :

- **l'arbre des fonctionnalités** — domaines, statuts et fichiers viennent alors du dépôt
  et non d'une description figée dans le code ;
- **la feuille de suivi** — le tableau `## Suivi` remplace les indicateurs écrits à la main ;
- **le croisement des deux arbres** — chaque fichier du dépôt dit quelles fonctionnalités
  il sert, et Atlas compte ceux que personne ne décrit ;
- **les écarts** — un chemin cité mais absent du dépôt est signalé nommément.

Sans `atlas.md`, Atlas continue de fonctionner sur la description figée : le fichier
améliore le suivi, il n'est pas exigé.
