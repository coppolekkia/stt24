import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'writer' | 'viewer' | 'none';
  isAdmin: boolean;
  isWriter: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: 'none',
  isAdmin: false,
  isWriter: false,
  isViewer: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'writer' | 'viewer' | 'none'>('none');

  useEffect(() => {
    let roleChannel: ReturnType<typeof supabase.channel> | null = null;

    const fetchRole = async (uid: string) => {
      const { data, error } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role:', error);
        setRole('none');
      } else {
        setRole(data?.role as any ?? 'none');
      }
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (roleChannel) {
        supabase.removeChannel(roleChannel);
        roleChannel = null;
      }

      if (session?.user) {
        const uid = session.user.id;
        fetchRole(uid);

        roleChannel = supabase
          .channel(`roles:${uid}`)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'roles', filter: `user_id=eq.${uid}` },
            (payload: any) => {
              if (payload.eventType === 'DELETE') {
                setRole('none');
              } else {
                setRole(payload.new?.role ?? 'none');
              }
            }
          )
          .subscribe();
      } else {
        setRole('none');
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      if (roleChannel) supabase.removeChannel(roleChannel);
    };
  }, []);

  const isAdmin = role === 'admin';
  const isWriter = isAdmin || role === 'writer';
  const isViewer = isWriter || role === 'viewer';

  return (
    <AuthContext.Provider value={{ user, loading, role, isAdmin, isWriter, isViewer }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
