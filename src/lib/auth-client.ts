import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const authClient = {
  useSession: () => {
    const [session, setSession] = useState<{ user: any } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const supabase = createClient();
      
      const formatUser = (user: any) => {
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || 'User',
          role: user.user_metadata?.role || 'Employee',
          department: user.user_metadata?.department || 'Engineering',
          designation: user.user_metadata?.designation || 'Employee'
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
