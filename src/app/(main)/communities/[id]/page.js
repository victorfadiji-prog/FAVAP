'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCommunityStore } from '@/stores/useCommunityStore';
import { supabase } from '@/lib/supabase';
import { getInitials, timeAgo } from '@/lib/utils';
import { 
  Hash, Volume2, Users, Settings, Plus, Send, 
  MoreVertical, Shield, Crown, LogOut, ArrowLeft,
  X, Image as ImageIcon, Smile, Mic, MicOff, Video,
  Paperclip, Trash2, Edit2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

function ServerSettingsModal({ server, onClose }) {
  const [name, setName] = useState(server.name);
  const [desc, setDesc] = useState(server.description || '');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setUpdating(true);
    const { error } = await supabase.from('servers').update({ name, description: desc }).eq('id', server.id);
    if (!error) { toast.success('Server updated'); onClose(); window.location.reload(); }
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this server?')) return;
    const { error } = await supabase.from('servers').delete().eq('id', server.id);
    if (!error) { toast.success('Server deleted'); router.push('/communities'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 20 }}>Server Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>SERVER NAME</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>DESCRIPTION</label>
            <textarea className="input textarea" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={updating} style={{ flex: 1 }}>Save Changes</button>
            <button className="btn btn-danger" onClick={handleDelete} style={{ flex: 1 }}>Delete Server</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateChannelModal({ serverId, onClose, onCreated }) {
  const { createChannel } = useCommunityStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const { error } = await createChannel({
      server_id: serverId,
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      type,
      position: 10
    });
    if (error) toast.error('Failed to create channel');
    else { toast.success('Channel created!'); onCreated(); }
    setCreating(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h2 style={{ marginBottom: 20 }}>Create Channel</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${type === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setType('text')} style={{ flex: 1 }}><Hash size={18} /> Text</button>
            <button className={`btn ${type === 'voice' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setType('voice')} style={{ flex: 1 }}><Volume2 size={18} /> Voice</button>
          </div>
          <input className="input" placeholder="channel-name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name.trim()}>Create Channel</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ServerDetailPage() {
  const { id: serverId } = useParams();
  const { profile } = useAuthStore();
  const { 
    activeServer, channels, activeChannel, members, channelMessages,
    fetchServer, setActiveChannel, fetchChannelMessages, sendChannelMessage, joinServer
  } = useCommunityStore();
  
  const [text, setText] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const isMember = members?.some(m => m.user_id === profile?.id);
  const isAdmin = activeServer?.owner_id === profile?.id;

  useEffect(() => { if (serverId) fetchServer(serverId); }, [serverId, fetchServer]);

  useEffect(() => {
    if (channels?.length > 0 && !activeChannel) {
      setActiveChannel(channels.find(c => c.name === 'general') || channels[0]);
    }
  }, [channels, activeChannel, setActiveChannel]);

  useEffect(() => {
    if (activeChannel?.id && activeChannel.type === 'text') fetchChannelMessages(activeChannel.id);
  }, [activeChannel?.id, fetchChannelMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [channelMessages]);

  useEffect(() => {
    if (!serverId) return;
    // Broader listener for all server messages
    const channel = supabase.channel(`server:${serverId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_messages' },
        async (payload) => {
          if (payload.new.channel_id === activeChannel?.id) {
            const { data } = await supabase.from('channel_messages').select('*, profiles:user_id(id, username, avatar_url)').eq('id', payload.new.id).single();
            if (data && data.user_id !== profile?.id) {
              useCommunityStore.setState(s => ({ channelMessages: [...s.channelMessages, data] }));
            }
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [serverId, activeChannel?.id, profile?.id]);

  const handleSend = async (content = text, type = 'text', mediaUrl = null, fileName = null) => {
    if (!content.trim() && !mediaUrl) return;
    await sendChannelMessage({
      channel_id: activeChannel.id, user_id: profile.id, 
      content: content.trim(), type, media_url: mediaUrl, file_name: fileName
    });
    setText('');
    setShowEmoji(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const loadingToast = toast.loading('Uploading...');
    try {
      const ext = file.name.split('.').pop();
      const path = `channels/${activeChannel.id}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('media').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
      await handleSend('', file.type.startsWith('image') ? 'image' : 'file', urlData.publicUrl, file.name);
      toast.success('Sent!', { id: loadingToast });
    } catch (err) {
      toast.error('Upload failed', { id: loadingToast });
    }
  };

  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSelectFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image')) setPreview(URL.createObjectURL(file));
    else setPreview({ name: file.name, type: 'file' });
  };

  const handleSendWithAttachment = async () => {
    if (!text.trim() && !selectedFile) return;
    
    let mediaUrl = null;
    let fileName = null;
    let type = 'text';

    if (selectedFile) {
      const loadingToast = toast.loading('Uploading attachment...');
      try {
        const ext = selectedFile.name.split('.').pop();
        const path = `channels/${activeChannel.id}/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from('media').upload(path, selectedFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
        mediaUrl = urlData.publicUrl;
        fileName = selectedFile.name;
        type = selectedFile.type.startsWith('image') ? 'image' : 'file';
        toast.success('Uploaded!', { id: loadingToast });
      } catch (err) {
        toast.error('Upload failed', { id: loadingToast });
        return;
      }
    }

    await handleSend(text, type, mediaUrl, fileName);
    setPreview(null);
    setSelectedFile(null);
  };

  const handleJoin = async () => {
    const { error } = await joinServer(serverId, profile.id);
    if (!error) { toast.success('Joined server!'); fetchServer(serverId); }
    else toast.error('Failed to join');
  };

  if (!activeServer) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--topbar-height))', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => isAdmin && setShowSettings(true)}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>{activeServer.name}</h2>
          {isAdmin ? <Settings size={18} /> : <MoreVertical size={18} />}
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>CHANNELS</span>
            {isAdmin && <Plus size={16} style={{ cursor: 'pointer' }} onClick={() => setShowCreateChannel(true)} />}
          </div>
          {channels.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', textAlign: 'left', background: activeChannel?.id === ch.id ? 'var(--bg-elevated)' : 'transparent', color: activeChannel?.id === ch.id ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: 2 }}>
              {ch.type === 'text' ? <Hash size={18} /> : <Volume2 size={18} />} {ch.name}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(profile?.username)}</div>}
            <span className="online-dot" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{profile?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Online</div>
          </div>
          <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }}><Mic size={16} /></button>
          <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }}><Settings size={16} /></button>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', position: 'relative' }}>
        <div style={{ height: 56, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 20px', background: 'var(--bg-secondary)', gap: 12 }}>
          {activeChannel?.type === 'text' ? <Hash size={24} color="var(--text-muted)" /> : <Volume2 size={24} color="var(--text-muted)" />}
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{activeChannel?.name}</h3>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-icon" onClick={() => setShowMembers(!showMembers)}><Users size={20} color={showMembers ? 'var(--primary)' : 'inherit'} /></button>
        </div>

        {!isMember ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, textAlign: 'center', padding: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={40} color="var(--primary)" /></div>
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>You are not a member of this server</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>Join this community to start chatting and see all channels!</p>
            </div>
            <button className="btn btn-primary" onClick={handleJoin} style={{ padding: '12px 40px', fontSize: 16 }}>Join Server</button>
          </div>
        ) : activeChannel?.type === 'text' ? (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {channelMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 16 }}>
                  {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="avatar" alt="" /> : <div className="avatar avatar-placeholder">{getInitials(msg.profiles?.username)}</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{msg.profiles?.username}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(msg.created_at)}</span>
                    </div>
                    {msg.type === 'image' && <img src={msg.media_url} alt="" style={{ maxWidth: 400, borderRadius: 8, marginBottom: 8, cursor: 'zoom-in' }} />}
                    {msg.type === 'file' && <a href={msg.media_url} target="_blank" rel="noopener" style={{ display: 'flex', gap: 8, background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', color: 'inherit', width: 'fit-content' }}><Paperclip size={18} /> {msg.file_name}</a>}
                    {msg.content && <div style={{ fontSize: 15, lineHeight: 1.5 }}>{msg.content}</div>}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '0 20px 20px', position: 'relative' }}>
              <AnimatePresence>
                {preview && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '12px 12px 0 0', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {typeof preview === 'string' ? (
                      <img src={preview} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} alt="" />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Paperclip size={24} /></div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedFile?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ready to send</div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={() => { setPreview(null); setSelectedFile(null); }}><X size={18} /></button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {showEmoji && <div style={{ position: 'absolute', bottom: '100%', right: 20, zIndex: 100 }}><EmojiPicker onEmojiClick={e => setText(t => t + e.emoji)} theme="dark" /></div>}
              
              <div style={{ background: 'var(--bg-elevated)', borderRadius: preview ? '0 0 8px 8px' : 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-ghost btn-icon" onClick={() => fileInputRef.current?.click()}><Plus size={20} /></button>
                <input className="input" style={{ background: 'transparent', border: 'none', flex: 1, padding: 0 }} placeholder={`Message #${activeChannel?.name}`} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendWithAttachment()} />
                <button className="btn btn-ghost btn-icon" onClick={() => setShowEmoji(!showEmoji)}><Smile size={20} /></button>
                <button className="btn btn-primary btn-icon" onClick={handleSendWithAttachment} disabled={!text.trim() && !selectedFile} style={{ width: 36, height: 36 }}><Send size={18} /></button>
              </div>
              <input type="file" ref={fileInputRef} hidden onChange={handleSelectFile} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 32 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px var(--primary-light)' }}><Volume2 size={60} color="white" /></div>
            <div style={{ textAlign: 'center' }}><h2 style={{ fontSize: 24 }}>{activeChannel?.name}</h2><p style={{ color: 'var(--text-muted)' }}>Connected to voice...</p></div>
            <div style={{ display: 'flex', gap: 16 }}>
              <button className="btn btn-secondary btn-icon" style={{ width: 56, height: 56, borderRadius: '50%' }}><Mic size={24} /></button>
              <button className="btn btn-secondary btn-icon" style={{ width: 56, height: 56, borderRadius: '50%' }}><Video size={24} /></button>
              <button className="btn btn-danger" style={{ padding: '0 32px', borderRadius: 28 }}>Leave</button>
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar */}
      <AnimatePresence>
        {showMembers && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 16px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>MEMBERS — {members?.length}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6 }}>
                    <div style={{ position: 'relative' }}>
                      {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(m.profiles?.username)}</div>}
                      <span className="online-dot" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: m.role === 'owner' ? 'var(--primary)' : 'inherit' }}>{m.profiles?.username} {m.role === 'owner' && <Crown size={12} />}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCreateChannel && <CreateChannelModal serverId={serverId} onClose={() => setShowCreateChannel(false)} onCreated={() => { setShowCreateChannel(false); fetchServer(serverId); }} />}
      {showSettings && <ServerSettingsModal server={activeServer} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
