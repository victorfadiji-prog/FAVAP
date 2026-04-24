'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { supabase } from '@/lib/supabase';
import { timeAgo, getInitials } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Image as ImageIcon, Paperclip,
  Smile, MoreVertical, Phone, Video, ArrowLeft,
  Check, CheckCheck, Users, MessageCircle, X, Camera, Mic,
  PhoneOff, MicOff, VideoOff, Maximize2, RefreshCw, AlertCircle, 
  Volume2, Monitor, Signal, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

const formatDuration = (s) => {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const playSound = (type, customUrl = null) => {
  const sounds = {
    message: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
    ringtone: customUrl || 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3',
    ringback: 'https://assets.mixkit.co/active_storage/sfx/1350/1350-preview.mp3',
    end: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
  };
  const audio = new Audio(sounds[type]);
  if (type === 'ringtone' || type === 'ringback') audio.loop = true;
  audio.play().catch(() => {});
  return audio;
};

function CallOverlay({ call, profile, onEnd, onAccept }) {
  const isIncoming = call.receiver_id === profile?.id && call.status === 'ringing';
  const isCaller = call.caller_id === profile?.id;
  const isConnected = call.status === 'accepted';
  const otherUser = isIncoming ? call.caller : call.receiver;
  
  const [timer, setTimer] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(call.type === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connState, setConnState] = useState('new');
  const [facingMode, setFacingMode] = useState('user');
  
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const iceQueue = useRef([]);
  const ringtoneRef = useRef(null);

  useEffect(() => {
    // Ringtone for receiver
    if (isIncoming && !isConnected) {
      ringtoneRef.current = playSound('ringtone', profile?.ringtone_url);
    } 
    // Ringback for caller
    else if (isCaller && !isConnected) {
      ringtoneRef.current = playSound('ringback');
    }
    else {
      ringtoneRef.current?.pause();
      ringtoneRef.current = null;
    }
    return () => {
      ringtoneRef.current?.pause();
      ringtoneRef.current = null;
    };
  }, [isIncoming, isCaller, isConnected, profile?.ringtone_url]);

  useEffect(() => {
    let interval;
    if (isConnected) interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const processIceQueue = useCallback(async () => {
    while (iceQueue.current.length > 0) {
      const candidate = iceQueue.current.shift();
      try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
    }
  }, []);

  const sendSignal = useCallback((data) => {
    channelRef.current?.send({ type: 'broadcast', event: 'signal', payload: { ...data, from: profile.id } });
  }, [profile.id]);

  const setupPeer = useCallback(async (stream) => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => { if (e.candidate) sendSignal({ type: 'candidate', candidate: e.candidate }); };
    pc.ontrack = (e) => { 
      console.log('Got remote track:', e.streams[0]);
      setRemoteStream(e.streams[0]); 
    };
    pc.onconnectionstatechange = () => setConnState(pc.connectionState);

    if (isCaller) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'offer', offer });
    }
  }, [isCaller, sendSignal]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initMedia = useCallback(async (mode = 'user') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: call.type === 'video' ? { facingMode: mode } : false 
      });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      // If we are already connected or we are the caller ringing, start setup
      if (isConnected || (isCaller && call.status === 'ringing')) {
        setupPeer(stream);
      }
    } catch (err) {
      toast.error('Camera/Mic access denied');
    }
  }, [call.type, isConnected, isCaller, call.status, setupPeer]);

  useEffect(() => {
    initMedia(facingMode);
    return () => { localStream?.getTracks().forEach(t => t.stop()); pcRef.current?.close(); };
  }, [initMedia, facingMode]);

  useEffect(() => {
    const channel = supabase.channel(`call_room:${call.id}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        const pc = pcRef.current;
        if (!pc) return;
        try {
          if (payload.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({ type: 'answer', answer });
            await processIceQueue();
          } else if (payload.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            await processIceQueue();
          } else if (payload.type === 'candidate') {
            if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            else iceQueue.current.push(payload.candidate);
          }
        } catch (e) {}
      }).subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [call.id, sendSignal, processIceQueue]);

  const toggleMic = () => { if (localStream) { localStream.getAudioTracks().forEach(t => t.enabled = !micOn); setMicOn(!micOn); } };
  const toggleVideo = () => { if (localStream && call.type === 'video') { localStream.getVideoTracks().forEach(t => t.enabled = !videoOn); setVideoOn(!videoOn); } };
  const switchCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
      setLocalStream(screenStream);
      setIsScreenSharing(true);
      videoTrack.onended = () => { setIsScreenSharing(false); initMedia(facingMode); };
    } catch (e) { toast.error('Screen sharing failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', color: 'white', overflow: 'hidden' }}>
      {/* BACKGROUND / REMOTE VIDEO */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isConnected && call.type === 'video' && remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: -100, background: otherUser?.avatar_url ? `url(${otherUser.avatar_url})` : 'var(--primary)', filter: 'blur(80px) opacity(0.3)', zIndex: -1 }} />
            <motion.div 
              animate={!isConnected ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 24, boxShadow: '0 0 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}
            >
              {otherUser?.avatar_url ? <img src={otherUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : getInitials(otherUser?.username)}
            </motion.div>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{otherUser?.username}</h2>
            <p style={{ opacity: 0.7, fontSize: 16, fontWeight: 500 }}>
              {isConnected ? (connState === 'connected' ? formatDuration(timer) : 'Connecting...') : isIncoming ? 'Incoming video call...' : 'Ringing...'}
            </p>
          </div>
        )}
      </div>

      {/* LOCAL VIDEO PREVIEW (PIP) */}
      {call.type === 'video' && videoOn && (
        <motion.div 
          drag 
          dragConstraints={{ left: 20, right: 20, top: 20, bottom: 20 }} 
          style={{ position: 'absolute', top: 40, right: 20, width: 120, height: 180, background: '#222', borderRadius: 16, overflow: 'hidden', zIndex: 10, border: '2px solid rgba(255,255,255,0.2)', cursor: 'grab', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        >
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
        </motion.div>
      )}

      {/* CONTROLS OVERLAY */}
      <div style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isConnected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20, fontSize: 13, backdropFilter: 'blur(10px)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: connState === 'connected' ? '#22c55e' : '#eab308' }} />
              {connState.toUpperCase()}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '20px 32px', borderRadius: 40, backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {isIncoming && !isConnected ? (
              <>
                <button onClick={onAccept} style={{ width: 72, height: 72, borderRadius: '50%', background: '#22c55e', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <Phone size={32} />
                </button>
                <button onClick={() => onEnd('rejected')} style={{ width: 72, height: 72, borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <PhoneOff size={32} />
                </button>
              </>
            ) : (
              <>
                <button onClick={toggleMic} className="btn-call-action" style={{ background: micOn ? 'rgba(255,255,255,0.1)' : '#ef4444' }}>
                  {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                
                {call.type === 'video' && (
                  <button onClick={toggleVideo} className="btn-call-action" style={{ background: videoOn ? 'rgba(255,255,255,0.1)' : '#ef4444' }}>
                    {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>
                )}

                <button onClick={() => onEnd('ended')} style={{ width: 72, height: 72, borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
                  <PhoneOff size={32} />
                </button>

                {call.type === 'video' && (
                  <>
                    <button onClick={switchCamera} className="btn-call-action"><RefreshCw size={24} /></button>
                    <button onClick={startScreenShare} className="btn-call-action" style={{ background: isScreenSharing ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}><Monitor size={24} /></button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn-call-action {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-call-action:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
      `}</style>
    </motion.div>
  );
}

function CallHistoryModal({ profileId, onClose }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('calls').select('*, caller:caller_id(*), receiver:receiver_id(*)').or(`caller_id.eq.${profileId},receiver_id.eq.${profileId}`).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { setCalls(data || []); setLoading(false); });
  }, [profileId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 320, borderRadius: 0, padding: 0 }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Recent Calls</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ overflow: 'auto', flex: 1, padding: 12 }}>
          {loading ? <div className="spinner" /> : calls.map(c => {
            const isOut = c.caller_id === profileId;
            const other = isOut ? c.receiver : c.caller;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: 'var(--bg-secondary)', marginBottom: 8 }}>
                <div className="avatar avatar-sm">{getInitials(other?.username)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{other?.username}</div>
                  <div style={{ fontSize: 11, color: c.status === 'missed' ? '#ef4444' : 'var(--text-muted)' }}>
                    {isOut ? 'Outgoing' : 'Incoming'} · {timeAgo(c.created_at)}
                  </div>
                </div>
                {c.type === 'video' ? <Video size={16} opacity={0.5} /> : <Phone size={16} opacity={0.5} />}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function ConversationList({ onSelect, activeId, onShowHistory }) {
  const { profile } = useAuthStore();
  const { conversations, fetchConversations } = useChatStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  useEffect(() => { if (profile) fetchConversations(profile.id); }, [profile, fetchConversations]);
  useEffect(() => {
    if (userSearch.trim()) {
      supabase.from('profiles').select('*').ilike('username', `%${userSearch}%`).neq('id', profile?.id).limit(5)
        .then(({ data }) => setUsers(data || []));
    } else setUsers([]);
  }, [userSearch, profile]);
  const startChat = async (userId) => {
    const { findOrCreateConversation, setActiveConversation, fetchConversations } = useChatStore.getState();
    const conv = await findOrCreateConversation(profile.id, userId);
    if (conv) { await fetchConversations(profile.id); setActiveConversation(conv); onSelect(conv); setShowNew(false); setUserSearch(''); }
  };
  const getOtherUser = (c) => c.conversation_members?.find(m => m.user_id !== profile?.id)?.profiles || { username: 'User' };
  const filtered = conversations.filter(c => getOtherUser(c).username?.toLowerCase().includes(search.toLowerCase()));
  return (
  return (
    <div className={activeId ? 'hide-mobile' : ''} style={{ width: 360, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', flexShrink: 0 }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Messages</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-icon" onClick={onShowHistory}><History size={20} /></button>
            <button className="btn btn-primary btn-icon" onClick={() => setShowNew(!showNew)} style={{ width: 40, height: 40, borderRadius: '50%' }}><Plus size={20} /></button>
          </div>
        </div>
        <input className="input" placeholder="Search chats" value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'var(--bg-elevated)', border: 'none' }} />
      </div>
      {showNew && (
        <div style={{ padding: 12, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
          <input className="input" placeholder="Find user..." value={userSearch} onChange={e => setUserSearch(e.target.value)} autoFocus style={{ marginBottom: 8 }} />
          {users.map(u => (
            <button key={u.id} className="dropdown-item" onClick={() => startChat(u.id)}>
              {u.avatar_url ? <img src={u.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(u.username)}</div>}
              <span>{u.username}</span>
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.map(c => {
          const other = getOtherUser(c);
          const active = c.id === activeId;
          return (
            <button key={c.id} onClick={() => onSelect(c)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', background: active ? 'var(--bg-elevated)' : 'transparent', borderLeft: active ? '4px solid var(--primary)' : '4px solid transparent' }}>
              {other.avatar_url ? <img src={other.avatar_url} className="avatar" alt="" /> : <div className="avatar avatar-placeholder">{getInitials(other.username)}</div>}
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700 }}>{other.username}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Active now</div></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChatWindow({ conversation, onStartCall, forceEndAllCalls, onBack }) {
  const { profile } = useAuthStore();
  const { messages, fetchMessages, sendMessage, addMessage } = useChatStore();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { if (conversation?.id) fetchMessages(conversation.id); }, [conversation?.id, fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, attachment]);
  
  useEffect(() => {
    if (!conversation?.id) return;
    const channel = supabase.channel(`chat:${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        async (payload) => {
          const { data } = await supabase.from('messages').select('*, profiles:sender_id(*)').eq('id', payload.new.id).single();
          if (data && data.sender_id !== profile?.id) { 
            addMessage(data); 
            if (profile?.notification_settings?.sounds !== false) {
              playSound('message'); 
            }
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation?.id, profile?.id, addMessage]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large (max 50MB)');
      return;
    }

    setAttachment({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file'
    });
  };

  const handleSend = async () => { 
    if (!text.trim() && !attachment) return; 
    
    setUploading(true);
    let mediaUrl = null;
    let messageType = 'text';

    if (attachment) {
      const ext = attachment.file.name.split('.').pop();
      const path = `chats/${conversation.id}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('media').upload(path, attachment.file);
      
      if (error) {
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
      mediaUrl = urlData.publicUrl;
      messageType = attachment.type;
    }

    await sendMessage({ 
      conversation_id: conversation.id, 
      sender_id: profile.id, 
      content: text.trim(), 
      type: messageType,
      media_url: mediaUrl,
      file_name: attachment?.file.name
    }); 

    setText(''); 
    setAttachment(null);
    setShowEmoji(false);
    setUploading(false);
  };

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  if (!conversation) return <div className="hide-mobile" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><h3>Select a chat to start messaging</h3></div>;
  
  const otherUser = conversation.conversation_members?.find(m => m.user_id !== profile?.id)?.profiles || { username: 'User' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', height: '100%', minWidth: 0 }}>
      <div style={{ height: 64, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--bg-secondary)', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button className="btn btn-ghost btn-icon hide-desktop" onClick={onBack} style={{ marginLeft: -8 }}><ArrowLeft size={20} /></button>
        {otherUser?.avatar_url ? <img src={otherUser.avatar_url} className="avatar avatar-sm" alt="" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(otherUser?.username)}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherUser?.username}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Online</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => onStartCall('voice', otherUser)}><Phone size={20} /></button>
          <button className="btn btn-ghost btn-icon" onClick={() => onStartCall('video', otherUser)}><Video size={20} /></button>
          <button className="btn btn-ghost btn-icon hide-mobile" onClick={forceEndAllCalls} title="Reset Calls"><RefreshCw size={18} /></button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => {
          const isMe = msg.sender_id === profile.id;
          return (
            <div key={msg.id} style={{ 
              alignSelf: isMe ? 'flex-end' : 'flex-start', 
              background: isMe ? 'var(--primary)' : 'var(--bg-elevated)', 
              padding: msg.type === 'text' ? '10px 16px' : '4px', 
              borderRadius: 16, 
              color: isMe ? 'white' : 'inherit', 
              maxWidth: '70%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {msg.type === 'image' && (
                <img src={msg.media_url} alt="" style={{ maxWidth: '100%', borderRadius: 12, display: 'block' }} />
              )}
              {msg.type === 'video' && (
                <video src={msg.media_url} controls style={{ maxWidth: '100%', borderRadius: 12, display: 'block' }} />
              )}
              {msg.type === 'file' && (
                <a href={msg.media_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', textDecoration: 'none', color: 'inherit' }}>
                  <Paperclip size={16} />
                  <span style={{ fontSize: 13, textDecoration: 'underline' }}>{msg.file_name || 'Download File'}</span>
                </a>
              )}
              {msg.content && <div style={{ padding: msg.type !== 'text' ? '8px 12px' : 0 }}>{msg.content}</div>}
            </div>
          );
        })}
        {attachment && (
          <div style={{ alignSelf: 'flex-end', opacity: 0.6, position: 'relative' }}>
            {attachment.type === 'image' && <img src={attachment.preview} alt="" style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover' }} />}
            {attachment.type === 'video' && <div style={{ width: 100, height: 100, borderRadius: 12, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={24} color="white" /></div>}
            {attachment.type === 'file' && <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 12 }}><Paperclip size={16} /> {attachment.file.name}</div>}
            <button onClick={() => setAttachment(null)} style={{ position: 'absolute', top: -8, right: -8, background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer' }}>×</button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
        {showEmoji && (
          <div style={{ position: 'absolute', bottom: '80px', left: '20px', zIndex: 100 }}>
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Paperclip size={20} /></button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
          <button className="btn btn-ghost btn-icon" onClick={() => setShowEmoji(!showEmoji)} disabled={uploading}><Smile size={20} /></button>
          <input 
            className="input" 
            placeholder={uploading ? "Uploading..." : "Type a message..."} 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            style={{ background: 'var(--bg-elevated)', border: 'none' }} 
            disabled={uploading}
          />
          <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={uploading || (!text.trim() && !attachment)} style={{ width: 44, height: 44, borderRadius: '50%' }}>
            {uploading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { profile } = useAuthStore();
  const { fetchConversations } = useChatStore();
  const [activeConv, setActiveConv] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const forceEndAllCalls = async () => {
    if (!profile?.id) return;
    await supabase.from('calls').update({ status: 'ended' }).or(`caller_id.eq.${profile.id},receiver_id.eq.${profile.id}`).in('status', ['ringing', 'accepted']);
    setActiveCall(null);
    toast.success('Calls reset');
  };
  
  useEffect(() => {
    if (!profile?.id) return;
    
    // Listen for new conversations where the user is a member
    const convChannel = supabase.channel('conversation_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'conversation_members', 
        filter: `user_id=eq.${profile.id}` 
      }, async () => {
        // Refresh conversation list when a new membership is created
        await fetchConversations(profile.id);
        toast('New conversation started!');
      })
      .subscribe();

    const channel = supabase.channel('global_calls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, async (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.receiver_id === profile.id && payload.new.status === 'ringing') {
          const { data } = await supabase.from('calls').select('*, caller:caller_id(*)').eq('id', payload.new.id).single();
          if (data) { 
            setActiveCall(data); 
          }
        } else if (payload.eventType === 'UPDATE') {
          if (activeCall && payload.new.id === activeCall.id) {
            if (payload.new.status === 'accepted') setActiveCall(prev => ({ ...prev, status: 'accepted' }));
            if (['rejected', 'ended', 'missed'].includes(payload.new.status)) { setActiveCall(null); toast('Call ended'); playSound('end'); }
          } else if (!activeCall && payload.new.caller_id === profile.id && payload.new.status === 'accepted') {
            const { data } = await supabase.from('calls').select('*, receiver:receiver_id(*)').eq('id', payload.new.id).single();
            if (data) setActiveCall(data);
          }
        }
      }).subscribe();
    supabase.from('calls').select('*, caller:caller_id(*), receiver:receiver_id(*)').or(`receiver_id.eq.${profile.id},caller_id.eq.${profile.id}`).in('status', ['ringing', 'accepted']).limit(1)
      .then(({ data }) => { if (data?.[0]) setActiveCall(data[0]); });
    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(convChannel);
    };
  }, [profile?.id, activeCall?.id, fetchConversations]);
  
  const handleStartCall = async (type, targetUser) => {
    if (activeCall) { toast.error('Call in progress'); return; }
    const { data } = await supabase.from('calls').insert({ 
      caller_id: profile.id, 
      receiver_id: targetUser.id, 
      type, 
      status: 'ringing' 
    }).select('*, receiver:receiver_id(*)').single();
    if (data) setActiveCall(data);
  };
  const handleAcceptCall = async () => { if (!activeCall) return; await supabase.from('calls').update({ status: 'accepted' }).eq('id', activeCall.id); setActiveCall(prev => ({ ...prev, status: 'accepted' })); };
  const handleEndCall = async (status) => { if (!activeCall) return; await supabase.from('calls').update({ status }).eq('id', activeCall.id); setActiveCall(null); playSound('end'); };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--topbar-height))', overflow: 'hidden' }}>
      <AnimatePresence>{activeCall && <CallOverlay call={activeCall} profile={profile} onEnd={handleEndCall} onAccept={handleAcceptCall} />}</AnimatePresence>
      <AnimatePresence>{showHistory && <CallHistoryModal profileId={profile.id} onClose={() => setShowHistory(false)} />}</AnimatePresence>
      <ConversationList onSelect={setActiveConv} activeId={activeConv?.id} onShowHistory={() => setShowHistory(true)} />
      <ChatWindow conversation={activeConv} onStartCall={handleStartCall} forceEndAllCalls={forceEndAllCalls} onBack={() => setActiveConv(null)} />
    </div>
  );
}
