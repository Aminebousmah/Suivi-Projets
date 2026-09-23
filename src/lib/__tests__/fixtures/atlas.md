# Atlas — Encyclopédie du citron

Site éditorial consacré au citron, en production depuis mars.

## Domaine · Navigation & parcours
L'ossature de circulation : menu, portes, pied de page.

### Les 10 portes thématiques — en ligne
Grille d'entrée vers les dix univers du citron.
- `src/config/nav.ts`
- `src/components/sections/TenDoors.astro`
> La porte Boutique disparaît quand le commerce est coupé.
> Chaque porte porte un numéro et un sous-titre.

### Recherche plein texte — en cours
Modale ouverte au clavier, alimentée par un index statique.
- `src/pages/api/search.json.ts`
- `src/__tests__/search.test.ts`
- un chemin sans accents graves.ts

### Fil d'ariane 💡
Chemin de navigation sur les pages profondes.

## Domaine · Contenu éditorial
Les fiches et les articles.

### Fiche variété — en ligne
Profil gustatif, fenêtres de récolte, usages.
- `src/content/varieties/`

### Comparateur de variétés — gelée
Mettre deux fiches côte à côte.

## Suivi
| Indicateur | Actuel | Cible | Avancement |
| --- | --- | --- | --- |
| Pages générées | 131 | — | 100% |
| Articles publiés | 32 | 53 | 60% |
| Aile marchande | gelée | activée | 0% |
| Sans pourcentage | ? | ? | à voir |

## Fait
- Publie une encyclopédie en dix portes.
- Sert 131 pages statiques générées au build.

## À faire
- Activer l'aile marchande.
- Compléter les mentions légales.
