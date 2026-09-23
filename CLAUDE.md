# Atlas — contexte projet

Application de visualisation de projets GitHub : pour chaque dépôt décrit, elle montre ce que le projet fait, l'arbre de ses fonctionnalités, les sessions Claude Code, le contexte lu avant d'agir, l'avancement, et le dépôt réel.

Le projet est né d'une maquette Claude Design, conservée intacte sous `design/`. C'est la référence visuelle : quand le rendu diverge, c'est le code qui a tort.

Un seul écart est assumé : dans la vue Fonctionnalités, la maquette partageait l'écran en deux moitiés égales, et le graphe débordait de la sienne dès le zoom par défaut. Le panneau de détail y a donc une largeur fixe et reste collé en haut de l'écran ; l'arbre prend le reste. Ne pas revenir aux deux moitiés.

## Architecture

- `src/App.tsx` — coque : barre de dépôts, en-tête, onglets. Ne calcule rien.
- `src/data/` — le modèle et son contenu : types, thèmes, description des dépôts, libellés.
- `src/lib/` — toute la logique pure, avec ses tests : graphe, état d'URL, client GitHub, croisement de chemins, lecture des fichiers de contexte.
- `src/views/` — une vue par onglet, six au total ; `src/views/arch/` porte les morceaux de l'arbre.
- `src/components/` — ce que les vues partagent : primitives, bandeau de provenance, barrière d'erreur.
- `design/` — la maquette d'origine. Référence, pas du code applicatif.

## Conventions de code

- Toute couleur passe par le thème du dépôt affiché : aucun hex dans un composant. La barre d'application, commune à tous les dépôts, a ses couleurs dans `CHROME`.
- Une encre posée sur un ton du thème se choisit par le contraste (`readableOn`), jamais au cas par cas.
- La logique pure va dans `src/lib` et arrive avec ses tests ; les composants ne calculent pas.
- L'état de navigation vit dans l'URL, pas dans un state React parallèle.
- Une affirmation sur un dépôt doit être vérifiable : donnée citée, ou lecture GitHub.
- Les messages, libellés et commentaires sont en français, messages d'erreur compris.
- Un message d'erreur dit quoi faire, pas seulement ce qui a échoué.
- Une fonctionnalité décrit une question à laquelle un fichier répond ; deux fichiers qui répondent à la même question vont ensemble, deux questions distinctes se séparent.
- Tout fichier suivi par git est cité par au moins une fonctionnalité — un test le vérifie et nomme les oubliés.
- Le cache est une optimisation, jamais une source : un stockage refusé, plein ou corrompu n'empêche rien.

## À ne jamais faire

- Inventer un statut de fonctionnalité qu'aucune source ne porte.
- Envoyer le jeton GitHub ailleurs qu'à `api.github.com`.
- Modifier les fichiers de `design/` : c'est la référence, pas du code applicatif.
- Ajouter une dépendance sans usage réel dans le code.
- Faire échouer une lecture parce qu'un fichier facultatif manque : une absence est une information, pas une panne.
- Conserver les fichiers de session déposés d'une visite à l'autre : ce sont des conversations entières, gardées seulement le temps qu'on les regarde.
- Laisser une requête sans délai maximal : une seule requête pendante gèle la vue entière.

## Workflow attendu

1. Lire ce fichier et `plan.md` avant toute action sur le code.
2. Pour une nouvelle fonctionnalité : un plan court de 3 à 7 étapes avant d'écrire du code.
3. Tests, typecheck et lint au vert avant de committer.
4. Mini-récap et liste des fichiers touchés à la fin de chaque tâche.

## Commandes

```bash
npm run dev      # serveur de développement
npm run build    # typecheck puis build de production
npm run test     # vitest
npm run lint     # oxlint
```
