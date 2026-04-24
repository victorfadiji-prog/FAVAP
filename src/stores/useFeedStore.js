import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useFeedStore = create((set, get) => ({
  posts: [],
  loading: false,
  hasMore: true,

  fetchPosts: async (page = 0) => {
    set({ loading: true });
    const limit = 20;
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, avatar_url), post_likes(user_id), post_comments(id, content, created_at, profiles:user_id(username, avatar_url)), saved_posts(user_id)')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    
    if (error) {
      console.error('Error fetching posts:', error);
      set({ loading: false });
      return;
    }

    set((s) => ({
      posts: page === 0 ? data : [...s.posts, ...data],
      hasMore: (data?.length || 0) === limit,
      loading: false,
    }));
  },

  createPost: async (post) => {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select('*, profiles:user_id(id, username, avatar_url)')
      .single();
    if (error) {
      console.error('Error creating post:', error);
      return { data: null, error };
    }
    set((s) => ({ posts: [data, ...s.posts] }));
    return { data, error };
  },

  toggleLike: async (postId, userId) => {
    const { posts } = get();
    const post = posts.find(p => p.id === postId);
    const liked = post?.post_likes?.some(l => l.user_id === userId);
    
    // Optimistic update
    const newPosts = posts.map(p => {
      if (p.id === postId) {
        const likes = liked ? p.post_likes.filter(l => l.user_id !== userId) : [...(p.post_likes || []), { user_id: userId }];
        return { ...p, post_likes: likes };
      }
      return p;
    });
    set({ posts: newPosts });

    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    }
  },

  toggleSave: async (postId, userId) => {
    const { posts } = get();
    const post = posts.find(p => p.id === postId);
    const saved = post?.saved_posts?.some(s => s.user_id === userId);

    // Optimistic update
    const newPosts = posts.map(p => {
      if (p.id === postId) {
        const s = saved ? p.saved_posts.filter(sv => sv.user_id !== userId) : [...(p.saved_posts || []), { user_id: userId }];
        return { ...p, saved_posts: s };
      }
      return p;
    });
    set({ posts: newPosts });

    if (saved) {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId });
    }
  },

  deletePost: async (postId) => {
    await supabase.from('posts').delete().eq('id', postId);
    set((s) => ({ posts: s.posts.filter(p => p.id !== postId) }));
  },

  addComment: async (postId, userId, content) => {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: userId, content })
      .select('*, profiles:user_id(username, avatar_url)')
      .single();
    
    if (!error) {
      set(s => ({
        posts: s.posts.map(p => p.id === postId ? { ...p, post_comments: [...(p.post_comments || []), data] } : p)
      }));
    }
    return { data, error };
  }
}));
