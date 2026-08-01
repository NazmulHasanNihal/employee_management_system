import { executeServerQuery, executeServerMutation, executeServerBatch } from "@/app/actions/db";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Lightweight reactive query store.
 *
 * Each `useQuery` call registers its path + args and subscribes to refetch
 * events. `useUtils().invalidate()` triggers a refetch of every mounted
 * query (or a subtree when a dotted prefix is passed), replacing the old
 * no-op invalidation so mutations actually refresh the UI.
 *
 * `trpc.useQueries([...])` batches several independent queries into ONE
 * server-action round-trip (via `executeServerBatch`), eliminating the
 * request waterfall on complex dashboards.
 */

interface QueryEntry {
  path: string;
  args: unknown[];
  refetch: () => void;
  refetchAll: () => void;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}
const globalQueryCache = new Map<string, CacheEntry>();

const registry = new Set<QueryEntry>();

function invalidate(prefix?: string) {
  for (const entry of registry) {
    if (!prefix || entry.path === prefix || entry.path.startsWith(prefix + ".")) {
      entry.refetch();
    }
  }
}

/**
 * Batch multiple queries into a single server-action round-trip.
 * Returns `{ data: unknown[], isLoading, error }` aligned by index with `queries`.
 */
export function useQueries(queries: { path: string; args?: unknown }[]) {
  const [data, setData] = useState<unknown[]>(() => queries.map(() => null));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const key = JSON.stringify(queries.map((q) => [q.path, q.args ?? null]));

  const run = useCallback(() => {
    setData((prev) => {
      // Only set loading if we have absolutely no data yet
      if (prev.every((d) => d === null)) setIsLoading(true);
      return prev;
    });
    executeServerBatch(queries)
      .then((res) => {
        setData(res.map((r) => (r.ok ? r.data : null)));
        setError(res.some((r) => !r.ok) ? res.find((r) => !r.ok)?.error : null);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run]);

  return { data, isLoading, error };
}

const createDummyHook = (path: string[]) => {
  return {
    useQuery: (...args: any[]) => {
      const fullPath = path.join(".");
      const input = args[0];
      const options = args[1] || {};
      const argsString = JSON.stringify(input ?? null);
      const cacheKey = `${fullPath}-${argsString}`;
      
      const cached = globalQueryCache.get(cacheKey);
      const initialData = options.initialData !== undefined ? options.initialData : (cached ? cached.data : null);

      if (options.initialData !== undefined) {
        globalQueryCache.set(cacheKey, { data: options.initialData, timestamp: Date.now() });
      }

      const [data, setData] = useState<any>(initialData);
      const [isLoading, setIsLoading] = useState(initialData === null && options.enabled !== false);
      const [error, setError] = useState<any>(null);

      const run = useCallback(() => {
        if (options.enabled === false) return;
        setData((prev: any) => {
          if (prev === null) setIsLoading(true);
          return prev;
        });
        executeServerQuery(fullPath, input)
          .then((res) => {
            setData(res);
            globalQueryCache.set(cacheKey, { data: res, timestamp: Date.now() });
            setIsLoading(false);
          })
          .catch((err) => {
            setError(err);
            setIsLoading(false);
          });
      }, [fullPath, argsString, options.enabled]);

      useEffect(() => {
        let isMounted = true;
        
        if (options.enabled === false) {
          setIsLoading(false);
          return;
        }

        // If we have initialData, it's already fresh from RSC, no need to background fetch on mount
        if (options.initialData !== undefined) {
          setIsLoading(false);
          return;
        }

        setData((prev: any) => {
          if (prev === null) setIsLoading(true);
          return prev;
        });

        executeServerQuery(fullPath, input)
          .then((res) => {
            if (isMounted) {
              setData(res);
              globalQueryCache.set(cacheKey, { data: res, timestamp: Date.now() });
              setIsLoading(false);
            }
          })
          .catch((err) => {
            if (isMounted) {
              setError(err);
              setIsLoading(false);
            }
          });
        return () => {
          isMounted = false;
        };
      }, [fullPath, argsString, options.enabled]);

      // Register for invalidation. Use a ref so `run` stays stable.
      const entryRef = useRef<QueryEntry | null>(null);
      if (!entryRef.current) {
        entryRef.current = {
          path: fullPath,
          args: args,
          refetch: run,
          refetchAll: () => invalidate(),
        };
      }
      useEffect(() => {
        const entry = entryRef.current!;
        entry.refetch = run;
        registry.add(entry);
        return () => {
          registry.delete(entry);
        };
      }, [run]);

      return { data, isLoading, error };
    },

    useMutation: (opts: any = {}) => {
      const fullPath = path.join(".");
      const [isPending, setIsPending] = useState(false);
      const [error, setError] = useState<any>(null);
      const [data, setData] = useState<any>(null);
      const optsRef = useRef(opts);
      optsRef.current = opts;

      const mutate = useCallback((input: any) => {
        const { onSuccess, onError } = optsRef.current;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          import('@/lib/offline-sync').then(({ queueOfflineMutation }) => {
            queueOfflineMutation(fullPath, input);
            const res = { success: true, offline: true, message: 'Queued for sync' };
            setData(res);
            if (onSuccess) onSuccess(res);
          });
          return;
        }

        setIsPending(true);
        setError(null);
        executeServerMutation(fullPath, input)
          .then((res) => {
            setData(res);
            setIsPending(false);
            if (onSuccess) onSuccess(res);
          })
          .catch((err) => {
            if (err instanceof TypeError && err.message.includes('fetch')) {
              import('@/lib/offline-sync').then(({ queueOfflineMutation }) => {
                queueOfflineMutation(fullPath, input);
                const res = { success: true, offline: true, message: 'Queued for sync' };
                setData(res);
                setIsPending(false);
                if (onSuccess) onSuccess(res);
              });
            } else {
              setError(err);
              setIsPending(false);
              if (onError) onError(err);
            }
          });
      }, [fullPath]);

      const mutateAsync = useCallback(async (input: any) => {
        const { onSuccess, onError } = optsRef.current;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const { queueOfflineMutation } = await import('@/lib/offline-sync');
          await queueOfflineMutation(fullPath, input);
          const res = { success: true, offline: true, message: 'Queued for sync' };
          setData(res);
          if (onSuccess) onSuccess(res);
          return res;
        }

        setIsPending(true);
        setError(null);
        try {
          const res = await executeServerMutation(fullPath, input);
          setData(res);
          setIsPending(false);
          if (onSuccess) onSuccess(res);
          return res;
        } catch (err) {
          if (err instanceof TypeError && (err as any).message.includes('fetch')) {
            const { queueOfflineMutation } = await import('@/lib/offline-sync');
            await queueOfflineMutation(fullPath, input);
            const res = { success: true, offline: true, message: 'Queued for sync' };
            setData(res);
            setIsPending(false);
            if (onSuccess) onSuccess(res);
            return res;
          }
          setError(err);
          setIsPending(false);
          if (onError) onError(err);
          throw err;
        }
      }, [fullPath]);

      return { mutate, mutateAsync, isPending, error, data, isLoading: isPending };
    },
  };
};

const proxyHandler: ProxyHandler<any> = {
  get: function (target: any, prop: string | symbol): any {
    if (typeof prop === "string") {
      if (prop === "useQuery" || prop === "useMutation") {
        return createDummyHook(target.path)[prop as "useQuery" | "useMutation"];
      }
      if (prop === "useUtils") {
        return () => {
          const createUtilsProxy = (segments: string[] = []): any => {
            return new Proxy({}, {
              get: (_target, p: string | symbol) => {
                if (typeof p !== 'string') return undefined;
                if (p === 'invalidate') {
                  return () => {
                    const prefix = segments.length > 0 ? segments.join('.') : undefined;
                    invalidate(prefix);
                    return Promise.resolve();
                  };
                }
                // Keep nesting deeper
                return createUtilsProxy([...segments, p]);
              }
            });
          };
          return createUtilsProxy();
        };
      }
      if (prop === "useQueries") {
        return useQueries;
      }
      return new Proxy({ path: [...(target.path || []), prop] }, proxyHandler);
    }
    return Reflect.get(target, prop);
  },
};

export const trpc = new Proxy({ path: [] }, proxyHandler);
