'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { formatCount, timeAgo, getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  MapPin, LinkIcon, Calendar, UserPlus, UserMinus, Settings,
  MoreHorizontal, Shield, Heart, MessageCircle, Repeat2, Image as ImageIcon,
  Play, Users, Edit3, Camera, X
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { username } = useParams();
  const { profile: myProfile, updateProfile } = useAuthStore();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const isMe = username === 'me' || username === myProfile?.username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let profileData;
      if (isMe) {
        profileData = myProfile;
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('username', username).single();
        profileData = data;
      }
      setUser(profileData);

      if (profileData) {
        const { data: userPosts } = await supabase.from('posts')
          .select('*, profiles:user_id(id, username, avatar_url), post_likes(user_id), post_comments(id)')
          .eq('user_id', profileData.id).order('created_at', { ascending: false }).limit(20);
        setPosts(userPosts || []);

        if (!isMe && myProfile) {
          const { data: follow } = await supabase.from('follows')
            .select('id').eq('follower_id', myProfile.id).eq('following_id', profileData.id).single();
          setIsFollowing(!!follow);
        }
      }
      setLoading(false);
    };
    load();
  }, [username, isMe, myProfile]);

  const handleFollow = async () => {
    if (!myProfile || !user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', myProfile.id).eq('following_id', user.id);
      setIsFollowing(false);
      toast.success('Unfollowed');
    } else {
      await supabase.from('follows').insert({ follower_id: myProfile.id, following_id: user.id });
      setIsFollowing(true);
      toast.success('Following!');
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile(editForm);
    setEditing(false);
    toast.success('Profile updated');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const path = `avatars/${myProfile.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const { data } = await supabase.storage.from('media').upload(path, file);
    if (data) {
      const { data: url } = supabase.storage.from('media').getPublicUrl(data.path);
      await updateProfile({ avatar_url: url.publicUrl });
      toast.success('Avatar updated');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>;
  if (!user) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}><h2>User not found</h2></div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Cover */}
      <div style={{ height: 200, background: 'var(--gradient-primary)', position: 'relative', borderRadius: '0 0 24px 24px', overflow: 'hidden' }}>
        {user.cover_url && <img src={user.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>

      {/* Avatar & Info */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40 }}>
          <div style={{ position: 'relative' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="avatar avatar-xl" style={{ border: '4px solid var(--bg-primary)', width: 96, height: 96 }} />
            ) : (
              <div className="avatar avatar-xl avatar-placeholder" style={{ border: '4px solid var(--bg-primary)', width: 96, height: 96, fontSize: 28 }}>{getInitials(user.username)}</div>
            )}
            {isMe && (
              <label style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-primary)' }}>
                <Camera size={12} color="white" />
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </label>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            {isMe ? (
              <button className="btn btn-secondary" onClick={() => { setEditing(!editing); setEditForm({ display_name: user.display_name, bio: user.bio, website: user.website, location: user.location }); }}>
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <>
                <button className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`} onClick={handleFollow}>
                  {isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                </button>
                <Link href="/messages" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                  <MessageCircle size={14} /> Message
                </Link>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user.display_name || user.username}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{user.username} {user.is_verified && <Shield size={14} style={{ color: 'var(--primary)', verticalAlign: -2 }} />}</p>
          {user.bio && <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5 }}>{user.bio}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, color: 'var(--text-muted)', fontSize: 13 }}>
            {user.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {user.location}</span>}
            {user.website && <a href={user.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)' }}><LinkIcon size={14} /> {user.website}</a>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 14 }}>
            <span><strong>{formatCount(user.following_count)}</strong> <span style={{ color: 'var(--text-muted)' }}>Following</span></span>
            <span><strong>{formatCount(user.follower_count)}</strong> <span style={{ color: 'var(--text-muted)' }}>Followers</span></span>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18 }}>Edit Profile</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditing(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input" placeholder="Display name" value={editForm.display_name || ''} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })} />
              <textarea className="input textarea" placeholder="Bio" value={editForm.bio || ''} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
              <input className="input" placeholder="Website" value={editForm.website || ''} onChange={e => setEditForm({ ...editForm, website: e.target.value })} />
              <input className="input" placeholder="Location" value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
              <button className="btn btn-primary" onClick={handleSaveProfile} style={{ height: 42 }}>Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ margin: '20px 24px 0' }}>
        <button className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>Posts</button>
        <button className={`tab ${tab === 'media' ? 'active' : ''}`} onClick={() => setTab('media')}>Media</button>
        <button className={`tab ${tab === 'likes' ? 'active' : ''}`} onClick={() => setTab('likes')}>Likes</button>
      </div>

      {/* Posts */}
      <div style={{ padding: '16px 24px' }}>
        {posts.length > 0 ? posts.map(post => (
          <div key={post.id} className="card" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 8 }}>{post.content}</p>
            {post.media_urls?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: post.media_urls.length > 1 ? '1fr 1fr' : '1fr', gap: 4, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                {post.media_urls.map((url, i) => <img key={i} src={url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={14} /> {post.post_likes?.length || 0}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14} /> {post.post_comments?.length || 0}</span>
              <span style={{ fontSize: 12 }}>{timeAgo(post.created_at)}</span>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p>No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
