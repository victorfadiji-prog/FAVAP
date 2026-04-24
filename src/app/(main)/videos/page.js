'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useVideoStore } from '@/stores/useVideoStore';
import { supabase } from '@/lib/supabase';
import { 
  Play, Heart, MessageCircle, Share2, MoreHorizontal,
  Clock, Search, TrendingUp, Sparkles, Plus,
  Bookmark, X, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, formatCount, getInitials } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

function VideoCommentModal({ video, currentUserId, onClose }) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('video_comments').select('*, profiles:user_id(*)').eq('video_id', video.id).order('created_at', { ascending: true })
      .then(({ data }) => { setComments(data || []); setLoading(false); });
  }, [video.id]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    const { data, error } = await supabase.from('video_comments').insert({ video_id: video.id, user_id: currentUserId, content: comment.trim() }).select('*, profiles:user_id(*)').single();
    if (!error) { setComments([...comments, data]); setComment(''); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, height: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18 }}>Comments</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? <div className="spinner" /> : comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 12 }}>
              {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(c.profiles?.username)}</div>}
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '0 12px 12px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{c.profiles?.username}</div>
                  <div style={{ fontSize: 13 }}>{c.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
          <input className="input" placeholder="Write a comment..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
          <button className="btn btn-primary btn-icon" onClick={handleComment} style={{ width: 44, height: 44, borderRadius: '50%' }}><Send size={20} /></button>
        </div>
      </motion.div>
    </div>
  );
}

function VideoCard({ video, currentUserId }) {
  const { toggleLike, toggleSave } = useVideoStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const liked = video.video_likes?.some(l => l.user_id === currentUserId);
  const saved = video.video_saves?.some(s => s.user_id === currentUserId);
  const author = video.profiles;

  const formatDuration = (s) => {
    if (!s) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Link href={`/videos/${video.id}`} style={{ display: 'block', position: 'relative', aspectRatio: '16/9', background: '#000', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        ) : (
          <div style={{ 
            height: '100%', 
            background: `linear-gradient(135deg, var(--primary), var(--accent))`, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 20,
            textAlign: 'center'
          }}>
            <Play size={48} color="white" fill="white" style={{ opacity: 0.5, marginBottom: 12 }} />
            <div style={{ color: 'white', fontSize: 14, fontWeight: 700, opacity: 0.9 }}>{video.title}</div>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.8)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)' }}><Clock size={12} /> {formatDuration(video.duration)}</div>
        {isHovered && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}><div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }}><Play size={28} fill="white" color="white" /></div></div>}
      </Link>
      
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <Link href={`/profile/${author?.username}`}>
            {author?.avatar_url ? <img src={author.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(author?.username)}</div>}
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{video.title}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{author?.username} · {formatCount(video.views || 0)} views · {timeAgo(video.created_at)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <button className="btn btn-ghost" onClick={(e) => { e.preventDefault(); toggleLike(video.id, currentUserId); }} style={{ gap: 6, padding: '4px 8px', fontSize: 13, color: liked ? 'var(--accent)' : 'inherit' }}><Heart size={18} fill={liked ? 'var(--accent)' : 'none'} /> {formatCount(video.video_likes?.length || 0)}</button>
          <button className="btn btn-ghost" onClick={(e) => { e.preventDefault(); setShowComments(true); }} style={{ gap: 6, padding: '4px 8px', fontSize: 13 }}><MessageCircle size={18} /> {formatCount(video.video_comments?.length || 0)}</button>
          <button className="btn btn-ghost" onClick={(e) => { e.preventDefault(); toggleSave(video.id, currentUserId); }} style={{ gap: 6, padding: '4px 8px', fontSize: 13, color: saved ? 'var(--primary)' : 'inherit' }}><Bookmark size={18} fill={saved ? 'var(--primary)' : 'none'} /></button>
          <button className="btn btn-ghost" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(`${window.location.origin}/videos/${video.id}`); toast.success('Link copied!'); }} style={{ gap: 6, padding: '4px 8px', fontSize: 13, marginLeft: 'auto' }}><Share2 size={18} /></button>
        </div>
      </div>
      <AnimatePresence>{showComments && <VideoCommentModal video={video} currentUserId={currentUserId} onClose={() => setShowComments(false)} />}</AnimatePresence>
    </motion.div>
  );
}

export default function VideosPage() {
  const { profile } = useAuthStore();
  const { videos, loading, fetchVideos } = useVideoStore();
  const [search, setSearch] = useState('');
  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  const filtered = videos.filter(v => v.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div><h1 style={{ fontSize: 32, fontWeight: 800 }}>Explore Videos</h1><p style={{ color: 'var(--text-muted)' }}>Watch the latest trends</p></div>
        <Link href="/videos/upload" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: 24, height: 48 }}><Plus size={20} /> Upload</Link>
      </div>
      <div className="card" style={{ padding: 12, marginBottom: 32 }}><input className="input" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 24, height: 48, paddingLeft: 20 }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="card skeleton" style={{ height: 320, borderRadius: 16 }} />) : filtered.length > 0 ? filtered.map(v => <VideoCard key={v.id} video={v} currentUserId={profile?.id} />) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', opacity: 0.5 }}><Sparkles size={64} style={{ marginBottom: 16 }} /><h3>No videos found</h3></div>
        )}
      </div>
    </div>
  );
}
