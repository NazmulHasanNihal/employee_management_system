import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { auth } from '@/lib/auth';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers
      });
      return { session: session as any };
    },
  });

export { handler as GET, handler as POST };
