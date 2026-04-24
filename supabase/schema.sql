-- ============================================================
-- FAVAP - Complete Database Schema
-- Social Media + Messaging + Video + Communities Platform
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT DEFAULT '',
  website TEXT DEFAULT '',
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'dnd')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "mentions": true, "messages": true, "likes": true, "sounds": true}',
  privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "show_last_seen": true, "allow_mentions": "everyone"}',
  ringtone_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FOLLOWS
CREATE TABLE public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 3. BLOCKS
CREATE TABLE public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 4. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'repost', 'mention', 'message', 'subscribe', 'server_invite')),
  entity_type TEXT CHECK (entity_type IN ('post', 'video', 'message', 'server', 'comment')),
  entity_id UUID,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGING (WhatsApp-like)
-- ============================================================

-- 5. CONVERSATIONS
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT DEFAULT 'private' CHECK (type IN ('private', 'group')),
  group_name TEXT,
  group_avatar TEXT,
  created_by UUID REFERENCES public.profiles(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONVERSATION_MEMBERS
CREATE TABLE public.conversation_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 7. MESSAGES
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'file', 'voice', 'system')),
  media_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOCIAL FEED (X/Twitter-like)
-- ============================================================

-- 8. POSTS
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT CHECK (media_type IN ('image', 'video', 'gif', NULL)),
  hashtags TEXT[] DEFAULT '{}',
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  repost_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POST_LIKES
CREATE TABLE public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 10. POST_COMMENTS
CREATE TABLE public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REPOSTS
CREATE TABLE public.reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================================
-- VIDEO PLATFORM (YouTube-like)
-- ============================================================

-- 12. VIDEOS
CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INT DEFAULT 0,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  dislike_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'processing', 'published', 'unlisted', 'private')),
  is_short BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. VIDEO_LIKES
CREATE TABLE public.video_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_like BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- 14. VIDEO_COMMENTS
CREATE TABLE public.video_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PLAYLISTS
CREATE TABLE public.playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  video_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PLAYLIST_ITEMS
CREATE TABLE public.playlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);

-- 17. WATCH_HISTORY
CREATE TABLE public.watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  progress INT DEFAULT 0
);

-- 18. SUBSCRIPTIONS (YouTube-style channel subscriptions)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id, channel_id)
);

-- ============================================================
-- COMMUNITIES (Discord-like)
-- ============================================================

-- 19. SERVERS
CREATE TABLE public.servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon_url TEXT,
  banner_url TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_count INT DEFAULT 1,
  is_public BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general',
  website_url TEXT,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 0, 9),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. SERVER_MEMBERS
CREATE TABLE public.server_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- 21. SERVER_CHANNELS
CREATE TABLE public.server_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'announcement')),
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. CHANNEL_MESSAGES
CREATE TABLE public.channel_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.server_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  media_url TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'file', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HASHTAGS (for trending)
-- ============================================================

-- 23. HASHTAGS
CREATE TABLE public.hashtags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  post_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consolidating with initial definitions

-- 28. VIDEO SAVES
CREATE TABLE public.video_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS for these new tables
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video likes viewable by all" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own video likes" ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own video likes" ON public.video_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Video comments viewable by all" ON public.video_comments FOR SELECT USING (true);
CREATE POLICY "Users create video comments" ON public.video_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own video comments" ON public.video_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Video saves viewable by owners" ON public.video_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own video saves" ON public.video_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own video saves" ON public.video_saves FOR DELETE USING (auth.uid() = user_id);

-- Update calls for WebRTC signaling
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS signal_data JSONB DEFAULT '{}';

-- Update videos with duration
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration FLOAT DEFAULT 0;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

-- 25. SAVED POSTS
CREATE TABLE public.saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Update posts with download count
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_posts;

-- 24. CALLS (Signaling)
CREATE TABLE public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('voice', 'video')),
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended')),
  room_id TEXT, -- For WebRTC or future scaling
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add calls to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Calls policies
CREATE POLICY "Users see own calls" ON public.calls FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
CREATE POLICY "Users start calls" ON public.calls FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Users manage own calls" ON public.calls FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
CREATE POLICY "Users delete own calls" ON public.calls FOR DELETE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Profiles
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts (public)
CREATE POLICY "Posts viewable by all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);

-- Post likes
CREATE POLICY "Likes viewable by all" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post comments
CREATE POLICY "Comments viewable by all" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "Follows viewable by all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users manage follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Saved posts policies
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users save posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unsave posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Conversations
CREATE POLICY "Users see own conversations" ON public.conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid()));
CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversation members
CREATE POLICY "Members see all conversation members" ON public.conversation_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()));
CREATE POLICY "Insert members" ON public.conversation_members FOR INSERT WITH CHECK (true);

-- Messages
CREATE POLICY "Users see conversation messages" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users send messages" ON public.messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

-- Videos
CREATE POLICY "Published videos viewable by all" ON public.videos FOR SELECT USING (status = 'published' OR auth.uid() = user_id);
CREATE POLICY "Users upload videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own videos" ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- Video likes/comments
CREATE POLICY "Video likes viewable" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Users like videos" ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike" ON public.video_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Video comments viewable" ON public.video_comments FOR SELECT USING (true);
CREATE POLICY "Users comment videos" ON public.video_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Servers
CREATE POLICY "Public servers viewable" ON public.servers FOR SELECT USING (is_public = true OR EXISTS (SELECT 1 FROM public.server_members WHERE server_id = id AND user_id = auth.uid()));
CREATE POLICY "Users create servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners manage servers" ON public.servers FOR UPDATE USING (auth.uid() = owner_id);

-- Server members
CREATE POLICY "Members viewable" ON public.server_members FOR SELECT USING (true);
CREATE POLICY "Join servers" ON public.server_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave servers" ON public.server_members FOR DELETE USING (auth.uid() = user_id);

-- Server channels
CREATE POLICY "Channels viewable by members" ON public.server_channels FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.server_members WHERE server_id = server_channels.server_id AND user_id = auth.uid()));
CREATE POLICY "Admins create channels" ON public.server_channels FOR INSERT WITH CHECK (true);

-- Channel messages
CREATE POLICY "Channel msgs viewable" ON public.channel_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.server_channels sc JOIN public.server_members sm ON sc.server_id = sm.server_id WHERE sc.id = channel_messages.channel_id AND sm.user_id = auth.uid()));
CREATE POLICY "Members send channel msgs" ON public.channel_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System creates notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Other tables
CREATE POLICY "Reposts viewable" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Users repost" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unrepost" ON public.reposts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Playlists viewable" ON public.playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users create playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Playlist items viewable" ON public.playlist_items FOR SELECT USING (true);
CREATE POLICY "Users manage playlist items" ON public.playlist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Watch history private" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users track history" ON public.watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Subscriptions viewable" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Users subscribe" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
CREATE POLICY "Users unsubscribe" ON public.subscriptions FOR DELETE USING (auth.uid() = subscriber_id);
CREATE POLICY "Hashtags viewable" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "System manages hashtags" ON public.hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "Update hashtags" ON public.hashtags FOR UPDATE USING (true);
CREATE POLICY "Blocks private" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users block" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users unblock" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.videos SET view_count = view_count + 1 WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_private_conversation(user_a UUID, user_b UUID)
RETURNS SETOF public.conversations AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM public.conversations c
  JOIN public.conversation_members cm1 ON c.id = cm1.conversation_id
  JOIN public.conversation_members cm2 ON c.id = cm2.conversation_id
  WHERE c.type = 'private'
  AND cm1.user_id = user_a
  AND cm2.user_id = user_b;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid() = owner);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
