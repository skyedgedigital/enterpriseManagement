import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  loadAllCollection,
  searchCollection,
  type SearchCollectionKey,
} from "@/lib/searchCollection";

const DEBOUNCE_MS = 1000;

export function useDebouncedCollectionSearch<T extends { id: string }>(
  key: SearchCollectionKey,
) {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState<T[]>([]);
  const [searchHits, setSearchHits] = useState<T[] | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setError(null);
    void loadAllCollection<T>(key)
      .then((rows) => {
        if (cancelled) return;
        setAllItems(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load list";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (cancelled) return;
        setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      requestIdRef.current += 1;
      setSearchHits(null);
      setSearchLoading(false);
      setError(null);
      return;
    }

    setSearchLoading(true);
    const timeoutId = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      void searchCollection<T>(key, trimmed)
        .then((rows) => {
          if (requestId !== requestIdRef.current) return;
          setSearchHits(rows);
          setError(null);
        })
        .catch((err: unknown) => {
          if (requestId !== requestIdRef.current) return;
          setSearchHits([]);
          const message = err instanceof Error ? err.message : "Search failed";
          setError(message);
          toast.error(message);
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return;
          setSearchLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [key, query]);

  const items = useMemo(
    () => (query.trim() && searchHits !== null ? searchHits : allItems),
    [allItems, query, searchHits],
  );

  const removeResult = useCallback((id: string) => {
    setAllItems((prev) => prev.filter((row) => row.id !== id));
    setSearchHits((prev) => (prev ? prev.filter((row) => row.id !== id) : prev));
  }, []);

  const patchResult = useCallback((id: string, patch: Partial<T>) => {
    const apply = (row: T) => (row.id === id ? { ...row, ...patch } : row);
    setAllItems((prev) => prev.map(apply));
    setSearchHits((prev) => (prev ? prev.map(apply) : prev));
  }, []);

  const reloadAll = useCallback(async () => {
    try {
      const rows = await loadAllCollection<T>(key);
      setAllItems(rows);
      const trimmed = queryRef.current.trim();
      if (trimmed) {
        const hits = await searchCollection<T>(key, trimmed);
        setSearchHits(hits);
      } else {
        setSearchHits(null);
      }
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reload list";
      setError(message);
      toast.error(message);
    }
  }, [key]);

  return {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    error,
    removeResult,
    patchResult,
    reloadAll,
  };
}
