import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useVideoStore = create((set, get) => ({
  videos: [],
  currentVideo: null,
  loading: false,

  fetchVideos: async (page = 0) => {
    set({ loading: true });
    const limit = 20;
    const { data, error } = await supabase
      .from('videos')
      .select('*, profiles:user_id(id, username, avatar_url), video_likes(user_id), video_saves(user_id), video_comments(id)')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    
    if (!error) {
      set((s) => ({
        videos: page === 0 ? (data || []) : [...s.videos, ...(data || [])],
        loading: false,
      }));
    } else {
      console.error('Fetch videos error:', error);
      set({ loading: false });
    }
  },

  fetchVideo: async (id) => {
    const { data, error } = await supabase
      .from('videos')
      .select('*, profiles:user_id(id, username, avatar_url), video_comments(*, profiles:user_id(id, username, avatar_url)), video_likes(user_id), video_saves(user_id)')
      .eq('id', id)
      .single();
    
    if (data) {
      set({ currentVideo: data });
      // Safely attempt to increment views
      try {
        await supabase.rpc('increment_views', { video_id: id });
      } catch (e) {
        console.warn('View increment failed:', e);
      }
    }
  },

  uploadVideo: async (videoData) => {
    const { data, error } = await supabase.from('videos').insert(videoData).select('*, profiles:user_id(id, username, avatar_url), video_likes(user_id), video_saves(user_id), video_comments(id)').single();
    if (!error && data) {
      set(s => ({ videos: [data, ...s.videos] }));
    }
    return { data, error };
  },

  toggleLike: async (videoId, userId, isLike = true) => {
    const { videos, currentVideo } = get();
    
    // Find video in list or use currentVideo
    const video = videos.find(v => v.id === videoId) || (currentVideo?.id === videoId ? currentVideo : null);
    if (!video) return;

    // Check existing interaction
    const existing = video.video_likes?.find(l => l.user_id === userId);
    const wasSameType = existing && existing.is_like === isLike;

    // Optimistic update
    const updateLikes = (likes) => {
      if (wasSameType) return likes.filter(l => l.user_id !== userId);
      const otherLikes = (likes || []).filter(l => l.user_id !== userId);
      return [...otherLikes, { user_id: userId, is_like: isLike }];
    };

    if (currentVideo?.id === videoId) {
      set({ currentVideo: { ...currentVideo, video_likes: updateLikes(currentVideo.video_likes) } });
    }

    const newVideos = videos.map(v => {
      if (v.id === videoId) return { ...v, video_likes: updateLikes(v.video_likes) };
      return v;
    });
    set({ videos: newVideos });

    // DB Update
    if (wasSameType) {
      await supabase.from('video_likes').delete().eq('video_id', videoId).eq('user_id', userId);
    } else {
      await supabase.from('video_likes').upsert({ video_id: videoId, user_id: userId, is_like: isLike }, { onConflict: 'video_id,user_id' });
    }
  },

  toggleSave: async (videoId, userId) => {
    const { videos } = get();
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    const saved = video.video_saves?.some(s => s.user_id === userId);

    const newVideos = videos.map(v => {
      if (v.id === videoId) {
        const saves = saved ? v.video_saves.filter(s => s.user_id !== userId) : [...(v.video_saves || []), { user_id: userId }];
        return { ...v, video_saves: saves };
      }
      return v;
    });
    set({ videos: newVideos });

    if (saved) {
      await supabase.from('video_saves').delete().eq('video_id', videoId).eq('user_id', userId);
    } else {
      await supabase.from('video_saves').insert({ video_id: videoId, user_id: userId });
    }
  }
}));
