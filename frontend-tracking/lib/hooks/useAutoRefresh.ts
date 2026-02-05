/**
 * Hook pour rafraîchir automatiquement les données toutes les 30 secondes
 */

import { useEffect, useState, useCallback } from 'react';

export function useAutoRefresh<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number = 30000 // 30 secondes par défaut
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  // Premier chargement
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Rafraîchissement automatique
  useEffect(() => {
    const intervalId = setInterval(refresh, intervalMs);
    return () => clearInterval(intervalId);
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}
