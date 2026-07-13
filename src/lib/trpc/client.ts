import { executeServerQuery, executeServerMutation } from "@/app/actions/db";
import { useState, useEffect } from 'react';

const createDummyHook = (path: string[]) => {
  return {
    useQuery: (...args: any[]) => {
      const fullPath = path.join('.');
      
      const [data, setData] = useState<any>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<any>(null);

      useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        executeServerQuery(fullPath, args[0])
          .then(res => {
            if (isMounted) {
              setData(res);
              setIsLoading(false);
            }
          })
          .catch(err => {
            if (isMounted) {
              setError(err);
              setIsLoading(false);
            }
          });
        return () => { isMounted = false; };
      }, [fullPath, JSON.stringify(args)]);

      return { data, isLoading, error };
    },

    useMutation: ({ onSuccess }: any = {}) => {
      const fullPath = path.join('.');
      return {
        mutate: (input: any) => {
          executeServerMutation(fullPath, input).then(res => {
            if (onSuccess) onSuccess(res);
          });
        },
        mutateAsync: async (input: any) => {
          const res = await executeServerMutation(fullPath, input);
          if (onSuccess) onSuccess(res);
          return res;
        }
      };
    }
  };
};

const proxyHandler: ProxyHandler<any> = {
  get: function(target: any, prop: string | symbol): any {
    if (typeof prop === 'string') {
      if (prop === 'useQuery' || prop === 'useMutation') {
        return createDummyHook(target.path)[prop as 'useQuery' | 'useMutation'];
      }
      if (prop === 'useUtils') {
        return () => ({
           invalidate: () => Promise.resolve(),
           dashboard: { getStats: { invalidate: () => Promise.resolve() } },
           registry: { getAll: { invalidate: () => Promise.resolve() } },
           // Fallback recursive proxy for deep invalidates
           ...new Proxy({}, {
              get: () => new Proxy({}, { get: () => () => Promise.resolve() })
           })
        });
      }
      return new Proxy({ path: [...(target.path || []), prop] }, proxyHandler);
    }
    return Reflect.get(target, prop);
  }
};

export const trpc = new Proxy({ path: [] }, proxyHandler);
