import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ user: session.user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    } catch (err) {
      console.error('Auth init error:', err);
      set({ error: err.message, loading: false });
    }
  },

  signUp: async (email, password, username) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username },
        },
      });
      if (error) {
        set({ error: error.message, loading: false });
        return { error };
      }
      // Profile is auto-created by the database trigger handle_new_user()
      // But update username if the trigger default differs
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username,
          email,
          display_name: username,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
        }, { onConflict: 'id' }).select().single();
      }
      set({ loading: false });
      return { data };
    } catch (err) {
      const msg = err.message === 'Failed to fetch'
        ? 'Cannot connect to server. Check your Supabase credentials in .env.local'
        : err.message;
      set({ error: msg, loading: false });
      return { error: { message: msg } };
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, loading: false });
        return { error };
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      set({ user: data.user, profile, loading: false });
      return { data };
    } catch (err) {
      const msg = err.message === 'Failed to fetch'
        ? 'Cannot connect to server. Check your Supabase credentials in .env.local'
        : err.message;
      set({ error: msg, loading: false });
      return { error: { message: msg } };
    }
  },

  signInWithOAuth: async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return { data, error };
    } catch (err) {
      return { error: { message: err.message } };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
    if (!error) set({ profile: data });
    return { data, error };
  },
}));
