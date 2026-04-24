'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { timeAgo, getInitials } from '@/lib/utils';
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, Play, Users, Check, CheckCheck, Settings, X, Mail, Smartphone, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const typeIcons = { like: Heart, comment: MessageCircle, follow: UserPlus, repost: Repeat2, mention: MessageCircle, message: MessageCircle, subscribe: Play, server_invite: Users };
const typeColors = { like: 'var(--accent)', comment: 'var(--primary)', follow: 'var(--success)', repost: 'var(--warning)', mention: 'var(--primary)', message: 'var(--primary)', subscribe: 'var(--accent)', server_invite: 'var(--success)' };

export default function NotificationsPage() {
  const { profile, updateProfile } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [notifSettings, setNotifSettings] = useState(profile?.notification_settings || {
    email: true, push: true, mentions: true, messages: true, likes: true, sounds: true
  });

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:actor_id(id, username, avatar_url)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);
    };
    load();

    // Realtime notifications
    const channel = supabase.channel(`notifs:${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, async (payload) => {
        const { data } = await supabase.from('notifications').select('*, actor:actor_id(id, username, avatar_url)').eq('id', payload.new.id).single();
        if (data) {
          setNotifications(prev => [data, ...prev]);
          if (profile.notification_settings?.sounds !== false) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ maxWidth: 650, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={24} style={{ color: 'var(--primary)' }} /> Notifications
          {unread > 0 && <span className="badge badge-accent" style={{ fontSize: 12 }}>{unread}</span>}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowSettings(true)}><Settings size={20} /></button>
          {unread > 0 && (
            <button className="btn btn-ghost" onClick={markAllRead} style={{ fontSize: 13 }}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18 }}>Notification Settings</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowSettings(false)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { id: 'messages', label: 'Direct Messages', icon: MessageCircle },
                  { id: 'mentions', label: 'Mentions & Replies', icon: Bell },
                  { id: 'likes', label: 'Likes & Reactions', icon: Heart },
                  { id: 'sounds', label: 'Sound Alerts', icon: Volume2 }
                ].map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <item.icon size={18} color="var(--text-secondary)" />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <input type="checkbox" checked={notifSettings[item.id]} onChange={async (e) => {
                      const updated = { ...notifSettings, [item.id]: e.target.checked };
                      setNotifSettings(updated);
                      await updateProfile({ notification_settings: updated });
                    }} style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => setShowSettings(false)} style={{ width: '100%', marginTop: 24 }}>Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        [...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 6 }} /><div className="skeleton" style={{ height: 12, width: '40%' }} /></div>
          </div>
        ))
      ) : notifications.length > 0 ? (
        notifications.map(n => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <div key={n.id} style={{
              display: 'flex', gap: 12, padding: '14px 12px', borderRadius: 12,
              background: n.is_read ? 'transparent' : 'var(--primary-light)',
              marginBottom: 4, transition: 'background 0.2s',
            }}>
              <div style={{ position: 'relative' }}>
                {n.actor?.avatar_url ? <img src={n.actor.avatar_url} alt="" className="avatar" /> : <div className="avatar avatar-placeholder">{getInitials(n.actor?.username)}</div>}
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: typeColors[n.type], display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-primary)' }}>
                  <Icon size={10} color="white" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, lineHeight: 1.4 }}>
                  <Link href={`/profile/${n.actor?.username}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{n.actor?.username}</Link>
                  {' '}<span style={{ color: 'var(--text-secondary)' }}>{n.content || `${n.type}ed your ${n.entity_type || 'content'}`}</span>
                </p>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(n.created_at)}</span>
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <Bell size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <h3 style={{ marginBottom: 4 }}>No notifications</h3>
          <p style={{ fontSize: 14 }}>You&apos;re all caught up!</p>
        </div>
      )}
    </div>
  );
}
