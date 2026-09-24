import { useCallback, useEffect, useRef, useState } from 'react';
import type { AtlasState, DomainsOf } from './url';
import { buildSearch, parseState, reduceState, staticDomains } from './url';

/**
 * L'URL est la seule source de vérité de la navigation : chaque sélection est
 * partageable, et les boutons précédent/suivant du navigateur la rejouent.
 */
export function useAtlasState(
  domainsOf: DomainsOf = staticDomains,
): [AtlasState, (patch: Partial<AtlasState>) => void] {
  const [state, setState] = useState<AtlasState>(() => parseState(window.location.search));
  // Les domaines affichés changent quand atlas.md arrive : la sélection se
  // vérifie contre les derniers connus, sans recréer `navigate`.
  const known = useRef(domainsOf);
  useEffect(() => {
    known.current = domainsOf;
  });

  useEffect(() => {
    const onPop = () => setState(parseState(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((patch: Partial<AtlasState>) => {
    setState((prev) => {
      const next = reduceState(prev, patch, known.current);
      const search = buildSearch(next);
      if (search !== window.location.search) {
        window.history.pushState(null, '', search || window.location.pathname);
      }
      return next;
    });
  }, []);

  return [state, navigate];
}
