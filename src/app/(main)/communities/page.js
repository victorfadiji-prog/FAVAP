'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCommunityStore } from '@/stores/useCommunityStore';
import { getInitials, formatCount } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, Users, Search, Globe, Lock, Crown, Sparkles, ArrowRight, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

function CreateServerModal({ onClose }) {
  const { profile } = useAuthStore();
  const { createServer } = useCommunityStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const { data, error } = await createServer({
      name: name.trim(), 
      description: desc.trim(), 
      owner_id: profile.id,
      is_public: isPublic,
      icon_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`,
    });
    if (error) toast.error('Failed to create server');
    else { toast.success('Server created!'); onClose(); }
    setCreating(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Create a Server</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Build your community</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Server Name *</label>
            <input className="input" placeholder="My Awesome Server" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Description</label>
            <textarea className="input textarea" placeholder="What's this server about?" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${isPublic ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsPublic(true)} style={{ flex: 1 }}>
              <Globe size={16} /> Public
            </button>
            <button className={`btn ${!isPublic ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsPublic(false)} style={{ flex: 1 }}>
              <Lock size={16} /> Private
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name.trim()} style={{ height: 44 }}>
            {creating ? <span className="spinner" /> : <><Sparkles size={16} /> Create Server</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ServerCard({ server, isMember, onJoin }) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setJoining(true);
    await onJoin(server.id);
    setJoining(false);
  };

  return (
    <Link href={`/communities/${server.id}`} style={{ textDecoration: 'none' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {server.icon_url ? <img src={server.icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={24} color="white" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{server.name}</h3>
          {server.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{server.description}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <span className="badge badge-primary"><Users size={10} /> {formatCount(server.member_count || 0)} members</span>
            <span className="badge badge-success">{server.is_public ? 'Public' : 'Private'}</span>
          </div>
        </div>
        
        {isMember ? (
          <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        ) : (
          <button className="btn btn-primary btn-icon" onClick={handleJoin} disabled={joining} style={{ borderRadius: '50%', width: 40, height: 40 }}>
            {joining ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <UserPlus size={18} />}
          </button>
        )}
      </motion.div>
    </Link>
  );
}

export default function CommunitiesPage() {
  const { profile } = useAuthStore();
  const { servers, loading, fetchServers, joinServer } = useCommunityStore();
  const [showCreate, setShowCreate] = useState(false);
  const [discover, setDiscover] = useState([]);
  const [tab, setTab] = useState('my');

  useEffect(() => { if (profile) fetchServers(profile.id); }, [profile, fetchServers]);

  useEffect(() => {
    supabase.from('servers').select('*').eq('is_public', true).order('member_count', { ascending: false }).limit(20)
      .then(({ data }) => setDiscover(data || []));
  }, []);

  const handleJoin = async (serverId) => {
    const { error } = await joinServer(serverId, profile.id);
    if (error) toast.error('Failed to join server');
    else {
      toast.success('Joined successfully!');
      setTab('my');
    }
  };

  const displayServers = tab === 'my' ? servers : discover;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Crown size={24} style={{ color: 'var(--primary)' }} /> Communities
        </h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-server-btn">
          <Plus size={16} /> Create Server
        </button>
      </div>

      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <button className={`tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>My Servers</button>
        <button className={`tab ${tab === 'discover' ? 'active' : ''}`} onClick={() => setTab('discover')}>Discover</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 16 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          ))
        ) : displayServers.length > 0 ? (
          displayServers.map(s => (
            <ServerCard 
              key={s.id} 
              server={s} 
              isMember={servers.some(mys => mys.id === s.id)}
              onJoin={handleJoin}
            />
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <Users size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.3 }} />
            <h3 style={{ marginBottom: 4 }}>{tab === 'my' ? 'No servers yet' : 'No servers to discover'}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              {tab === 'my' ? 'Create or join a server to get started!' : 'Be the first to create one!'}
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Server</button>
          </div>
        )}
      </div>

      {showCreate && <CreateServerModal onClose={() => { setShowCreate(false); if (profile) fetchServers(profile.id); }} />}
    </div>
  );
}
