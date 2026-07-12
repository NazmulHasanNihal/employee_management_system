import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { prisma } from '@/lib/prisma';
import type { Session, User } from 'better-auth';

export interface CustomUser {
  id: string;
  name?: string | null;
  email?: string;
  role?: string | null;
  department?: string | null;
  designation?: string | null;
  xp?: number;
  rpgLevel?: number;
  tenantId?: string | null;
}

interface Context {
  session: { session: Session; user: CustomUser } | null;
  user?: CustomUser;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  const dbUser = await prisma.user.findUnique({ 
    where: { id: ctx.session.user.id },
    select: { name: true, role: true, department: true, designation: true, xp: true, rpgLevel: true, tenantId: true, email: true }
  });

  const customUser: CustomUser = {
    id: ctx.session.user.id,
    name: dbUser?.name ?? ctx.session.user.name,
    email: dbUser?.email ?? ctx.session.user.email,
    role: dbUser?.role ?? 'Employee',
    department: dbUser?.department ?? '',
    designation: dbUser?.designation ?? '',
    xp: dbUser?.xp ?? 0,
    rpgLevel: dbUser?.rpgLevel ?? 1,
    tenantId: dbUser?.tenantId ?? null
  };

  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
        user: customUser
      },
      user: customUser
    },
  });
});

const auditMiddleware = t.middleware(async ({ ctx, type, path, next }) => {
  const result = await next();
  if (type === 'mutation' && ctx.user) {
    try {
      await prisma.auditLog.create({
        data: {
          actor: ctx.user.id,
          action: path,
          target: "Payload hidden",
          prevHash: 'system',
          hash: 'hash',
        }
      });
    } catch (e) {
      console.error("Audit log failed", e);
    }
  }
  return result;
});

export const protectedProcedure = t.procedure.use(isAuthed).use(auditMiddleware);

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'Admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin);

const isHR = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== 'Admin' && ctx.user.role !== 'HR Manager')) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

export const hrProcedure = t.procedure.use(isAuthed).use(isHR);
