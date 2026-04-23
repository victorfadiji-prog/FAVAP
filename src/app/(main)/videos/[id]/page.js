'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useVideoStore } from '@/stores/useVideoStore';
import { formatCount, timeAgo, getInitials } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Share, Bookmark, MessageCircle, Send, UserPlus, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function VideoDetailPage() {
  const { id } = useParams();
  const { profile } = useAuthStore();
  const { currentVideo, fetchVideo, toggleLike, addComment } = useVideoStore();
  const [comment, setComment] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => { if (id) fetchVideo(id); }, [id, fetchVideo]);

  useEffect(() => {
    if (currentVideo && profile) {
      supabase.from('subscriptions').select('id').eq('subscriber_id', profile.id).eq('channel_id', currentVideo.user_id).single()
        .then(({ data }) => setSubscribed(!!data));
    }
  }, [currentVideo, profile]);

  const handleSubscribe = async () => {
    if (!profile || !currentVideo) return;
    if (subscribed) {
      await supabase.from('subscriptions').delete().eq('subscriber_id', profile.id).eq('channel_id', currentVideo.user_id);
      setSubscribed(false);
      toast.success('Unsubscribed');
    } else {
      await supabase.from('subscriptions').insert({ subscriber_id: profile.id, channel_id: currentVideo.user_id });
      setSubscribed(true);
      toast.success('Subscribed!');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await addComment(id, profile.id, comment.trim());
    setComment('');
    toast.success('Comment posted');
  };

  if (!currentVideo) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>;

  const liked = currentVideo.video_likes?.some(l => l.user_id === profile?.id && l.is_like);
  const author = currentVideo.profiles;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 700px', minWidth: 0 }}>
        {/* Video Player */}
        <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
          <video src={currentVideo.video_url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{currentVideo.title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> {formatCount(currentVideo.view_count)} views</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {timeAgo(currentVideo.created_at)}</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href={`/profile/${author?.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              {author?.avatar_url ? <img src={author.avatar_url} alt="" className="avatar" /> : <div className="avatar avatar-placeholder">{getInitials(author?.username)}</div>}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{author?.username}</div>
              </div>
            </Link>
            <button className={`btn ${subscribed ? 'btn-secondary' : 'btn-primary'}`} onClick={handleSubscribe} style={{ fontSize: 13 }}>
              <UserPlus size={14} /> {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-secondary" onClick={() => toggleLike(id, profile?.id)} style={{ fontSize: 13, color: liked ? 'var(--primary)' : undefined }}>
              <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} /> {formatCount(currentVideo.like_count)}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 13 }}><ThumbsDown size={16} /></button>
            <button className="btn btn-secondary" style={{ fontSize: 13 }}><Share size={16} /> Share</button>
            <button className="btn btn-secondary" style={{ fontSize: 13 }}><Bookmark size={16} /> Save</button>
          </div>
        </div>

        {/* Description */}
        {currentVideo.description && (
          <div className="card" style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {currentVideo.description}
          </div>
        )}

        {/* Comments */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={18} /> {currentVideo.video_comments?.length || 0} Comments
          </h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="avatar avatar-sm" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(profile?.username)}</div>}
            <input className="input" placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleComment()} style={{ fontSize: 14 }} />
            <button className="btn btn-primary btn-icon" onClick={handleComment}><Send size={16} /></button>
          </div>
          {currentVideo.video_comments?.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt="" className="avatar avatar-sm" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(c.profiles?.username)}</div>}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.profiles?.username}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 14, marginTop: 4 }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
