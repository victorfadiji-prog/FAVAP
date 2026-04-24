'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFeedStore } from '@/stores/useFeedStore';
import { supabase } from '@/lib/supabase';
import { timeAgo, formatCount, getInitials } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Repeat2, Share, MoreHorizontal,
  Image as ImageIcon, Video, Smile, Send, TrendingUp,
  Hash, Trash2, Bookmark, X, Newspaper, Download, Check, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function CommentModal({ post, currentUserId, onClose }) {
  const { addComment } = useFeedStore();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.post_comments || []);

  const handleComment = async () => {
    if (!comment.trim()) return;
    const { data, error } = await addComment(post.id, currentUserId, comment.trim());
    if (!error) {
      setComments([...comments, data]);
      setComment('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18 }}>Comments</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {comments.length > 0 ? comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 12 }}>
              {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(c.profiles?.username)}</div>}
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '0 16px 16px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{c.profiles?.username}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.4 }}>{c.content}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 4 }}>{timeAgo(c.created_at)}</div>
              </div>
            </div>
          )) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <MessageCircle size={48} opacity={0.2} />
              <p>No comments yet. Be the first to join the conversation!</p>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input className="input" placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleComment()} style={{ height: 44, borderRadius: 22, padding: '0 20px' }} />
            <button className="btn btn-primary btn-icon" onClick={handleComment} disabled={!comment.trim()} style={{ width: 44, height: 44, borderRadius: '50%' }}><Send size={20} /></button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LikedByModal({ postId, onClose }) {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('post_likes').select('*, profiles:user_id(*)').eq('post_id', postId)
      .then(({ data }) => { setLikes(data || []); setLoading(false); });
  }, [postId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18 }}>Liked by</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? <div className="spinner" /> : likes.length > 0 ? likes.map(l => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {l.profiles?.avatar_url ? <img src={l.profiles.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(l.profiles?.username)}</div>}
              <span style={{ fontWeight: 600 }}>{l.profiles?.username}</span>
            </div>
          )) : <p style={{ color: 'var(--text-muted)' }}>No likes yet</p>}
        </div>
      </motion.div>
    </div>
  );
}

function CreatePost() {
  const { profile } = useAuthStore();
  const { createPost } = useFeedStore();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [posting, setPosting] = useState(false);

  const handleMedia = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setMediaFiles(files);
    setMediaPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeMedia = (idx) => {
    setMediaFiles(f => f.filter((_, i) => i !== idx));
    setMediaPreviews(p => p.filter((_, i) => i !== idx));
  };

  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentions, setShowMentions] = useState(false);

  useEffect(() => {
    const lastWord = content.split(' ').pop();
    if (lastWord?.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [content]);

  useEffect(() => {
    if (showMentions && mentionQuery) {
      supabase.from('profiles').select('username, avatar_url').ilike('username', `${mentionQuery}%`).limit(5)
        .then(({ data }) => setMentionResults(data || []));
    }
  }, [mentionQuery, showMentions]);

  const insertMention = (username) => {
    const parts = content.split(' ');
    parts.pop();
    setContent(parts.join(' ') + (parts.length > 0 ? ' ' : '') + '@' + username + ' ');
    setShowMentions(false);
  };

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    setPosting(true);
    let mediaUrls = [];
    for (const file of mediaFiles) {
      const ext = file.name.split('.').pop();
      const path = `posts/${profile.id}/${Date.now()}.${ext}`;
      const { data } = await supabase.storage.from('media').upload(path, file);
      if (data) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
        mediaUrls.push(urlData.publicUrl);
      }
    }
    await createPost({
      user_id: profile.id,
      content: content.trim(),
      media_urls: mediaUrls,
      media_type: mediaFiles[0]?.type?.startsWith('video') ? 'video' : mediaUrls.length > 0 ? 'image' : null,
    });
    setContent('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setPosting(false);
    toast.success('Post published!');
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="avatar" /> : <div className="avatar avatar-placeholder">{getInitials(profile?.username)}</div>}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea className="input textarea" placeholder="What's happening?" value={content} onChange={(e) => setContent(e.target.value)} style={{ border: 'none', background: 'transparent', resize: 'none', minHeight: 60, padding: 0, fontSize: 15 }} />
          {showMentions && mentionResults.length > 0 && (
            <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, padding: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', background: 'var(--bg-elevated)' }}>
              {mentionResults.map(u => (
                <button key={u.username} className="dropdown-item" onClick={() => insertMention(u.username)} style={{ gap: 10, padding: '8px 12px' }}>
                  {u.avatar_url ? <img src={u.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(u.username)}</div>}
                  <span style={{ fontWeight: 600 }}>@{u.username}</span>
                </button>
              ))}
            </div>
          )}
          {mediaPreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: mediaPreviews.length > 1 ? '1fr 1fr' : '1fr', gap: 8, marginTop: 8 }}>
              {mediaPreviews.map((url, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                  <button onClick={() => removeMedia(i)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <label className="btn btn-ghost btn-icon" style={{ cursor: 'pointer' }}><ImageIcon size={18} style={{ color: 'var(--primary)' }} /><input type="file" accept="image/*" multiple hidden onChange={handleMedia} /></label>
              <label className="btn btn-ghost btn-icon" style={{ cursor: 'pointer' }}><Video size={18} style={{ color: 'var(--accent)' }} /><input type="file" accept="video/*" hidden onChange={handleMedia} /></label>
              <button className="btn btn-ghost btn-icon"><Smile size={18} style={{ color: 'var(--warning)' }} /></button>
            </div>
            <button className="btn btn-primary" onClick={handlePost} disabled={posting || (!content.trim() && mediaFiles.length === 0)} style={{ padding: '8px 20px' }}>{posting ? <span className="spinner" /> : <><Send size={16} /> Post</>}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId }) {
  const { toggleLike, toggleSave, deletePost } = useFeedStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  
  const liked = post.post_likes?.some(l => l.user_id === currentUserId);
  const saved = post.saved_posts?.some(s => s.user_id === currentUserId);
  const author = post.profiles;

  const renderContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return <Link key={i} href={`/profile/${username}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>{part}</Link>;
      }
      return part;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href={`/profile/${author?.username}`}>
          {author?.avatar_url ? <img src={author.avatar_url} alt="" className="avatar" /> : <div className="avatar avatar-placeholder">{getInitials(author?.username)}</div>}
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href={`/profile/${author?.username}`} style={{ fontWeight: 700, fontSize: 14, textDecoration: 'none', color: 'var(--text-primary)' }}>{author?.username}</Link>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>· {timeAgo(post.created_at)}</span>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowMenu(!showMenu)} style={{ width: 32, height: 32 }}><MoreHorizontal size={16} /></button>
              {showMenu && (
                <div className="dropdown">
                  {post.user_id === currentUserId && <button className="dropdown-item" onClick={() => { deletePost(post.id); setShowMenu(false); }} style={{ color: 'var(--error)' }}><Trash2 size={16} /> Delete</button>}
                  <button className="dropdown-item" onClick={() => { toggleSave(post.id, currentUserId); setShowMenu(false); }}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Unsave' : 'Save'}</button>
                  <button className="dropdown-item" onClick={() => { setShowLikes(true); setShowMenu(false); }}><Users size={16} /> View Likes</button>
                </div>
              )}
            </div>
          </div>

          {post.content && <p style={{ margin: '12px 0', fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{renderContent(post.content)}</p>}
          {post.media_urls?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: post.media_urls.length > 1 ? '1fr 1fr' : '1fr', gap: 4, marginTop: 8, borderRadius: 16, overflow: 'hidden' }}>
              {post.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', height: post.media_urls.length > 1 ? 180 : 400, objectFit: 'cover' }} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => toggleLike(post.id, currentUserId)} style={{ gap: 6, fontSize: 13, color: liked ? 'var(--accent)' : 'var(--text-secondary)', padding: '8px 12px' }}><Heart size={18} fill={liked ? 'var(--accent)' : 'none'} /></button>
            <button className="btn btn-ghost" onClick={() => setShowLikes(true)} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '8px 4px', marginLeft: -8 }}>{formatCount(post.post_likes?.length || 0)}</button>
            <button className="btn btn-ghost" onClick={() => setShowComments(true)} style={{ gap: 6, fontSize: 13, color: 'var(--text-secondary)', padding: '8px 12px' }}><MessageCircle size={18} /> {formatCount(post.post_comments?.length || 0)}</button>
            <button className="btn btn-ghost" onClick={() => toggleSave(post.id, currentUserId)} style={{ gap: 6, fontSize: 13, color: saved ? 'var(--primary)' : 'var(--text-secondary)', padding: '8px 12px' }}><Bookmark size={18} fill={saved ? 'var(--primary)' : 'none'} /> {saved ? 'Saved' : 'Save'}</button>
            <button className="btn btn-ghost" style={{ gap: 6, fontSize: 13, color: 'var(--text-secondary)', padding: '8px 12px' }}><Share size={18} /></button>
          </div>
        </div>
      </div>
      <AnimatePresence>{showComments && <CommentModal post={post} currentUserId={currentUserId} onClose={() => setShowComments(false)} />}</AnimatePresence>
      <AnimatePresence>{showLikes && <LikedByModal postId={post.id} onClose={() => setShowLikes(false)} />}</AnimatePresence>
    </motion.div>
  );
}

export default function FeedPage() {
  const { profile } = useAuthStore();
  const { posts, loading, fetchPosts } = useFeedStore();
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchPosts();
    
    // Realtime posts
    const channel = supabase.channel('feed_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        const { data } = await supabase.from('posts').select('*, profiles:user_id(id, username, avatar_url), post_likes(user_id), post_comments(id, content, created_at, profiles:user_id(username, avatar_url)), saved_posts(user_id)').eq('id', payload.new.id).single();
        if (data) {
          // Add to store if not already there (avoid duplicates from current user)
          useFeedStore.setState(s => {
            if (s.posts.some(p => p.id === data.id)) return s;
            return { posts: [data, ...s.posts] };
          });
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  }, [page, fetchPosts]);

  return (
    <div style={{ display: 'flex', gap: 24, maxWidth: 1000, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <CreatePost />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map(post => <PostCard key={post.id} post={post} currentUserId={profile?.id} />)}
        </div>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>}
        {!loading && posts.length > 0 && <button className="btn btn-secondary" onClick={loadMore} style={{ width: '100%', marginTop: 8 }}>Show more</button>}
      </div>
      <div className="hide-mobile" style={{ width: 320, flexShrink: 0 }}>
        <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 16px)', padding: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Trending</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Follow accounts to see more here!</p>
        </div>
      </div>
    </div>
  );
}
