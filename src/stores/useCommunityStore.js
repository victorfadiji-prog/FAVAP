import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useCommunityStore = create((set, get) => ({
  servers: [],
  activeServer: null,
  activeChannel: null,
  channels: [],
  members: [],
  channelMessages: [],
  loading: false,

  fetchServers: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('server_members')
      .select('server_id, servers(*)')
      .eq('user_id', userId);
    set({ servers: data?.map(d => d.servers).filter(Boolean) || [], loading: false });
  },

  fetchServer: async (serverId) => {
    set({ loading: true });
    const { data: server } = await supabase.from('servers').select('*').eq('id', serverId).single();
    const { data: channels } = await supabase.from('server_channels').select('*').eq('server_id', serverId).order('position');
    const { data: members } = await supabase
      .from('server_members')
      .select('*, profiles:user_id(id, username, avatar_url, status)')
      .eq('server_id', serverId);
    set({ activeServer: server, channels: channels || [], members: members || [], loading: false });
  },

  setActiveChannel: (channel) => set({ activeChannel: channel, channelMessages: [] }),

  fetchChannelMessages: async (channelId) => {
    const { data } = await supabase
      .from('channel_messages')
      .select('*, profiles:user_id(id, username, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);
    set({ channelMessages: data || [] });
  },

  sendChannelMessage: async (msg) => {
    const { data } = await supabase
      .from('channel_messages')
      .insert(msg)
      .select('*, profiles:user_id(id, username, avatar_url)')
      .single();
    if (data) set((s) => ({ channelMessages: [...s.channelMessages, data] }));
  },

  createServer: async (server) => {
    const { data, error } = await supabase.from('servers').insert(server).select().single();
    if (data) {
      await supabase.from('server_members').insert({ server_id: data.id, user_id: server.owner_id, role: 'owner' });
      await supabase.from('server_channels').insert([
        { server_id: data.id, name: 'general', type: 'text', position: 0 },
        { server_id: data.id, name: 'voice-chat', type: 'voice', position: 1 },
      ]);
    }
    return { data, error };
  },

  joinServer: async (serverId, userId) => {
    const { data, error } = await supabase.from('server_members').insert({ server_id: serverId, user_id: userId, role: 'member' }).select().single();
    if (!error) {
      // Update local state if needed or just refetch
      const { fetchServers } = get();
      await fetchServers(userId);
    }
    return { data, error };
  },

  createChannel: async (channel) => {
    const { data, error } = await supabase.from('server_channels').insert(channel).select().single();
    if (data) {
      set(s => ({ channels: [...s.channels, data] }));
    }
    return { data, error };
  },

  leaveServer: async (serverId, userId) => {
    const { error } = await supabase.from('server_members').delete().eq('server_id', serverId).eq('user_id', userId);
    if (!error) {
      set(s => ({ servers: s.servers.filter(sv => sv.id !== serverId) }));
    }
    return { error };
  }
}));
