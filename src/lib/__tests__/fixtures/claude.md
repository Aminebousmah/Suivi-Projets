# Sole Citron — contexte projet

Site éditorial consacré au citron, construit avec Astro 5.

## Direction artistique

Palette et typographie vivent dans `src/styles/tokens.css`.

## Conventions de code

- Composants `.astro` par défaut, `client:load` seulement en cas d'interactivité réelle.
- Modifier les **tokens** ou les configs plutôt que les composants.
- Titre de 12 mots maximum, un mot-clé possible en *italique*.
- Jamais de hex codé en dur dans un composant.

## À ne jamais faire

- Commit, push ou PR de manière autonome.
- Trailer `Co-Authored-By: Claude` dans les commits.
- CSS inline, sauf valeurs dynamiques liées aux props.

## Workflow attendu

1. Lire ce fichier en premier, avant toute action sur le code.
2. Pour une nouvelle feature : un plan court de 3 à 7 étapes.
3. Mini-récap et liste des fichiers touchés à la fin de chaque tâche.

## Exemple à ne pas confondre

```md
## Règles
- Cette règle est dans un bloc de code et ne doit pas être lue.
```
