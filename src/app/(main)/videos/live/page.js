'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { 
  Camera, CameraOff, Mic, MicOff, Settings, 
  X, Users, Heart, Share2, MessageCircle, 
  Send, Zap, Radio 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LiveStreamPage() {
  const { profile } = useAuthStore();
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startPreview();
    return () => stopStream();
  }, []);

  const startPreview = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(media);
      if (videoRef.current) videoRef.current.srcObject = media;
    } catch (err) {
      toast.error("Could not access camera/microphone");
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerRef.current);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(t => t.enabled = !cameraOn);
      setCameraOn(!cameraOn);
    }
  };

  const handleGoLive = () => {
    setIsLive(true);
    setDuration(0);
    setViewers(Math.floor(Math.random() * 10) + 1);
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
      // Simulate viewer fluctuation
      setViewers(v => Math.max(1, v + (Math.random() > 0.5 ? 1 : -1)));
    }, 1000);
    toast.success("You are now LIVE!");
    
    // Simulate incoming chat
    setTimeout(() => {
      addSystemMessage("FAVAP System: Your stream is being promoted to followers.");
    }, 2000);
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), type: 'system', text }]);
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      user: profile?.username || 'You', 
      text: chatInput,
      avatar: profile?.avatar_url
    }]);
    setChatInput('');
  };

  const formatDuration = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ height: 'calc(100vh - var(--topbar-height))', display: 'flex', background: '#000', overflow: 'hidden' }}>
      {/* Main Video Section */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted={true} 
          playsInline 
          style={{ 
            width: '100%', height: '100%', objectFit: 'contain', 
            opacity: cameraOn ? 1 : 0, transition: 'opacity 0.3s' 
          }} 
        />
        
        {!cameraOn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CameraOff size={48} style={{ color: 'var(--primary)' }} />
            </div>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>Camera is turned off</p>
          </div>
        )}

        {/* Overlay Controls */}
        <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', gap: 12 }}>
          {isLive && (
            <div style={{ 
              background: '#ef4444', color: 'white', padding: '4px 12px', 
              borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
              fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
              Live
            </div>
          )}
          <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: 6, fontSize: 13, backdropFilter: 'blur(8px)' }}>
            {formatDuration(duration)}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: 6, fontSize: 13, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} /> {viewers}
          </div>
        </div>

        <div style={{ position: 'absolute', top: 24, right: 24 }}>
          <Link href="/videos" className="btn btn-ghost" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: 40, height: 40, padding: 0 }}>
            <X size={20} />
          </Link>
        </div>

        {/* Bottom Controls */}
        <div style={{ 
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', 
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '16px 32px', borderRadius: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button 
            onClick={toggleMic}
            style={{ 
              background: micOn ? 'rgba(255,255,255,0.1)' : '#ef4444', 
              border: 'none', width: 48, height: 48, borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'white', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          
          {!isLive ? (
            <button 
              onClick={handleGoLive}
              style={{ 
                background: 'var(--gradient-primary)', border: 'none', 
                height: 52, padding: '0 32px', borderRadius: 26,
                color: 'white', fontWeight: 700, fontSize: 16,
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(108, 92, 231, 0.4)'
              }}
            >
              <Zap size={20} fill="white" /> Go Live
            </button>
          ) : (
            <button 
              onClick={() => { if(confirm('End live stream?')) setIsLive(false); }}
              style={{ 
                background: '#ef4444', border: 'none', 
                height: 52, padding: '0 32px', borderRadius: 26,
                color: 'white', fontWeight: 700, fontSize: 16,
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer'
              }}
            >
              <Radio size={20} /> End Stream
            </button>
          )}

          <button 
            onClick={toggleCamera}
            style={{ 
              background: cameraOn ? 'rgba(255,255,255,0.1)' : '#ef4444', 
              border: 'none', width: 48, height: 48, borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'white', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {cameraOn ? <Camera size={22} /> : <CameraOff size={22} />}
          </button>
          
          <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div style={{ width: 360, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageCircle size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Live Chat</h3>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 14 }}>Welcome to the chat!</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ 
                  background: msg.type === 'system' ? 'var(--primary-light)' : 'transparent',
                  padding: msg.type === 'system' ? '8px 12px' : 0,
                  borderRadius: 8,
                  border: msg.type === 'system' ? '1px solid var(--primary)' : 'none'
                }}
              >
                {msg.type === 'system' ? (
                  <p style={{ fontSize: 12, margin: 0, color: 'var(--primary)', fontWeight: 500 }}>{msg.text}</p>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <img src={msg.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.user}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, marginRight: 8 }}>{msg.user}</span>
                      <p style={{ fontSize: 14, margin: '2px 0 0', lineHeight: 1.4 }}>{msg.text}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
            <input 
              className="input" 
              placeholder="Say something..." 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              style={{ background: 'var(--bg-elevated)', border: 'none', height: 42 }}
            />
            <button className="btn btn-primary btn-icon" style={{ width: 42, height: 42, flexShrink: 0 }}>
              <Send size={18} />
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }}><Heart size={16} style={{ color: '#ef4444' }} /></button>
              <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }}><Smile size={16} style={{ color: 'var(--warning)' }} /></button>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 12, gap: 4, height: 32 }}><Share2 size={14} /> Share</button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
