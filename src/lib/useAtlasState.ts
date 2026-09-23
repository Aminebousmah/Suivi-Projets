import { useCallback, useEffect, useState } from 'react';
import type { AtlasState } from './url';
import { buildSearch, parseState, reduceState } from './url';

/**
 * L'URL est la seule source de vérité de la navigation : chaque sélection est
 * partageable, et les boutons précédent/suivant du navigateur la rejouent.
 */
export function useAtlasState(): [AtlasState, (patch: Partial<AtlasState>) => void] {
  const [state, setState] = useState<AtlasState>(() => parseState(window.location.search));

  useEffect(() => {
    const onPop = () => setState(parseState(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((patch: Partial<AtlasState>) => {
    setState((prev) => {
      const next = reduceState(prev, patch);
      const search = buildSearch(next);
      if (search !== window.location.search) {
        window.history.pushState(null, '', search || window.location.pathname);
      }
      return next;
    });
  }, []);

  return [state, navigate];
}
