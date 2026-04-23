import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {},
  onlineUsers: new Set(),
  loadingConversations: false,
  loadingMessages: false,

  fetchConversations: async (userId) => {
    set({ loadingConversations: true });
    const { data } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations(*, conversation_members(user_id, profiles:user_id(id, username, avatar_url, status)))')
      .eq('user_id', userId);
    const convs = data?.map(d => d.conversations).filter(Boolean) || [];
    set({ conversations: convs, loadingConversations: false });
  },

  setActiveConversation: (conv) => set({ activeConversation: conv, messages: [] }),

  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true });
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(id, username, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);
    set({ messages: data || [], loadingMessages: false });
  },

  sendMessage: async (message) => {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select('*, profiles:sender_id(id, username, avatar_url)')
      .single();
    if (!error) set((s) => ({ messages: [...s.messages, data] }));
    return { data, error };
  },

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),

  createConversation: async (type, memberIds, groupName = null, createdBy) => {
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ type, group_name: groupName, created_by: createdBy })
      .select()
      .single();
    
    if (convError) {
      console.error('Conversation creation error:', convError.message);
      return null;
    }

    if (conv) {
      const members = memberIds.map(uid => ({ conversation_id: conv.id, user_id: uid }));
      const { error: memberError } = await supabase.from('conversation_members').insert(members);
      
      if (memberError) {
        console.error('Member creation error:', memberError.message);
        return null;
      }
      
      // Fetch full hydrated conversation
      const { data: fullConv } = await supabase
        .from('conversations')
        .select('*, conversation_members(user_id, profiles:user_id(id, username, avatar_url, status))')
        .eq('id', conv.id)
        .single();
      return fullConv;
    }
    return null;
  },

  findOrCreateConversation: async (currentUserId, targetUserId) => {
    // Check for existing private conversation
    const { data: existing } = await supabase
      .rpc('get_private_conversation', { user_a: currentUserId, user_b: targetUserId });
    
    let convId = existing?.[0]?.id;

    if (!convId) {
      // Fallback: manual check
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUserId);
      
      const myConvs = memberships?.map(m => m.conversation_id) || [];
      
      const { data: shared } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', myConvs)
        .limit(1);

      if (shared?.[0]) convId = shared[0].conversation_id;
    }

    if (convId) {
      const { data: fullConv } = await supabase
        .from('conversations')
        .select('*, conversation_members(user_id, profiles:user_id(id, username, avatar_url, status))')
        .eq('id', convId)
        .single();
      return fullConv;
    }

    // Create new if none found
    const newConv = await get().createConversation('private', [currentUserId, targetUserId], null, currentUserId);
    if (newConv) {
      set((s) => ({ conversations: [newConv, ...s.conversations] }));
    }
    return newConv;
  },

  setTyping: (conversationId, userId, isTyping) => {
    set((s) => {
      const t = { ...s.typingUsers };
      if (isTyping) { t[conversationId] = [...(t[conversationId] || []), userId]; }
      else { t[conversationId] = (t[conversationId] || []).filter(id => id !== userId); }
      return { typingUsers: t };
    });
  },

  setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
}));
