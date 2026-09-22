import type { Domain } from '../data/types';

/**
 * Déplacement dans l'arbre au clavier.
 *
 * L'arbre a trois niveaux — projet, domaine, feuille — et les flèches suivent
 * cette hiérarchie : haut et bas parcourent le niveau courant, droite descend,
 * gauche remonte. La fonction ne décide que de la sélection ; c'est l'appelant
 * qui pose le focus et fait défiler.
 */

export interface Selection {
  domain: string | null;
  feat: string | null;
}

/** Touches dont la vue doit empêcher le comportement par défaut. */
export const HANDLED = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Escape',
];

function clampIndex(index: number, length: number): number {
  if (length === 0) return -1;
  return Math.max(0, Math.min(index, length - 1));
}

/**
 * Sélection suivante, ou null quand la touche ne change rien — auquel cas la
 * vue laisse le navigateur faire son travail habituel.
 */
export function nextSelection(
  domains: Domain[],
  current: Selection,
  key: string,
): Selection | null {
  if (!domains.length) return null;

  const dIndex = domains.findIndex((d) => d.key === current.domain);
  const domain = dIndex >= 0 ? domains[dIndex] : null;
  const features = domain?.features ?? [];
  const fIndex = features.findIndex((f) => f.name === current.feat);

  switch (key) {
    case 'Escape':
      if (current.feat) return { domain: current.domain, feat: null };
      if (current.domain) return { domain: null, feat: null };
      return null;

    case 'ArrowRight':
      // Descendre d'un niveau : du projet au premier domaine, d'un domaine à
      // sa première feuille.
      if (!domain) return { domain: domains[0].key, feat: null };
      if (!current.feat && features.length) {
        return { domain: domain.key, feat: features[0].name };
      }
      return null;

    case 'ArrowLeft':
      if (current.feat) return { domain: current.domain, feat: null };
      if (current.domain) return { domain: null, feat: null };
      return null;

    case 'ArrowDown':
    case 'ArrowUp': {
      const step = key === 'ArrowDown' ? 1 : -1;

      if (!domain) {
        // Depuis le projet, on entre par le premier ou le dernier domaine.
        const start = step === 1 ? 0 : domains.length - 1;
        return { domain: domains[start].key, feat: null };
      }

      if (current.feat) {
        const next = fIndex + step;
        if (next >= 0 && next < features.length) {
          return { domain: domain.key, feat: features[next].name };
        }
        // Au bout d'un domaine, on passe au domaine voisin plutôt que de buter.
        const nextDomain = domains[dIndex + step];
        if (!nextDomain) return null;
        const list = nextDomain.features;
        if (!list.length) return { domain: nextDomain.key, feat: null };
        return {
          domain: nextDomain.key,
          feat: step === 1 ? list[0].name : list[list.length - 1].name,
        };
      }

      const nextDomain = domains[clampIndex(dIndex + step, domains.length)];
      if (!nextDomain || nextDomain.key === domain.key) return null;
      return { domain: nextDomain.key, feat: null };
    }

    case 'Home':
      return { domain: domains[0].key, feat: null };

    case 'End': {
      const last = domains[domains.length - 1];
      return { domain: last.key, feat: null };
    }

    default:
      return null;
  }
}

/** Identifiant stable d'un nœud, pour retrouver son bouton et lui donner le focus. */
export function nodeId(selection: Selection): string {
  if (selection.feat && selection.domain) {
    return 'noeud:' + selection.domain + '/' + selection.feat;
  }
  if (selection.domain) return 'noeud:' + selection.domain;
  return 'noeud:projet';
}
