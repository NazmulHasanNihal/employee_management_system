import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const authClient = {
  useSession: () => {
    interface SessionUser {
      id: string;
      email?: string;
      name: string;
      role: string;
      department: string;
      designation: string;
    }
    const [session, setSession] = useState<{ user: SessionUser | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const supabase = createClient();
      
      const formatUser = (user: unknown): SessionUser | null => {
        if (!user || typeof user !== 'object') return null;
        const u = user as Record<string, unknown>;
        return {
          id: String(u.id || ''),
          email: u.email as string | undefined,
          name: ((u.user_metadata as Record<string, unknown> | undefined)?.name as string | undefined) || 'User',
          role: ((u.user_metadata as Record<string, unknown> | undefined)?.role as string | undefined) || 'Employee',
          department: ((u.user_metadata as Record<string, unknown> | undefined)?.department as string | undefined) || 'Engineering',
          designation: ((u.user_metadata as Record<string, unknown> | undefined)?.designation as string | undefined) || 'Employee'
        };
      };

      const fetchSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setSession({ user: formatUser(data.session.user) });
        } else {
          setSession(null);
        }
        setIsLoading(false);
      };

      fetchSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession?.user) {
          setSession({ user: formatUser(newSession.user) });
        } else {
          setSession(null);
        }
      });

      return () => subscription.unsubscribe();
    }, []);

    return { data: session, isLoading, error: null };
  },
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
};
