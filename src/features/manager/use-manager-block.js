import { useCallback, useEffect, useMemo, useState } from 'react';

const initialBlocks = (keys) =>
  keys.reduce((acc, key) => ({ ...acc, [key]: { loading: true, error: null, data: null } }), {});

/**
 * Charge plusieurs blocs en parallèle avec `Promise.allSettled` : un bloc en
 * échec n'entraîne pas les autres. Chaque bloc conserve sa propre entrée
 * `loading` / `error` / `data`, et les réponses précédentes restent visibles
 * pendant un rechargement (pas de « clignotement » au changement de période).
 * Les réponses obsolètes sont ignorées (annulation) au changement de période.
 *
 * @param {Record<string, (query: object) => Promise<object>>} loaders
 * @param {object} query — référence stable (useMemo côté appelant)
 * @param {boolean} [enabled=true] — passe à `false` pour ne pas lancer les
 *   requêtes (période personnalisée incomplète) : les blocs restent en attente.
 * @returns {{ blocks: Record<string, {loading: boolean, error: string|null, data: object|null}>, reload: () => void }}
 */
export function useManagerBlocks(loaders, query, enabled = true) {
  const keys = useMemo(() => Object.keys(loaders), [loaders]);
  const [nonce, setNonce] = useState(0);
  const [blocks, setBlocks] = useState(() => initialBlocks(keys));

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setBlocks(initialBlocks(keys));
      return () => {
        active = false;
      };
    }

    setBlocks((current) =>
      keys.reduce((acc, key) => ({ ...acc, [key]: { ...current[key], loading: true, error: null } }), {})
    );

    Promise.allSettled(keys.map((key) => loaders[key](query))).then((results) => {
      if (!active) return;
      setBlocks((current) =>
        results.reduce((acc, result, index) => {
          const key = keys[index];
          if (result.status === 'fulfilled') {
            return { ...acc, [key]: { loading: false, error: null, data: result.value?.data ?? null } };
          }
          return {
            ...acc,
            [key]: {
              loading: false,
              error: result.reason?.message || 'Impossible de charger ce bloc.',
              data: current[key]?.data ?? null,
            },
          };
        }, {})
      );
    });

    return () => {
      active = false;
    };
  }, [loaders, keys, query, nonce, enabled]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { blocks, reload };
}

/**
 * Variante mono-bloc : même contrat, pour un bloc isolé.
 * @param {(query: object) => Promise<object>} loader
 * @param {object} query
 */
export function useManagerBlock(loader, query) {
  const loaders = useMemo(() => ({ block: loader }), [loader]);
  const { blocks, reload } = useManagerBlocks(loaders, query);
  return { ...blocks.block, reload };
}

export default useManagerBlocks;