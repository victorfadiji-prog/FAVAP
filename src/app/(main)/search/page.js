'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getInitials, formatCount, timeAgo } from '@/lib/utils';
import { Search as SearchIcon, Users, Newspaper, Play, Hash } from 'lucide-react';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState('all');
  const [results, setResults] = useState({ users: [], posts: [], videos: [], servers: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (q) { setQuery(q); doSearch(q); } }, [q]);

  const doSearch = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    const [users, posts, videos, servers] = await Promise.all([
      supabase.from('profiles').select('*').or(`username.ilike.%${term}%,display_name.ilike.%${term}%,bio.ilike.%${term}%`).limit(10),
      supabase.from('posts').select('*, profiles:user_id(id, username, avatar_url)').ilike('content', `%${term}%`).limit(10),
      supabase.from('videos').select('*, profiles:user_id(id, username, avatar_url)').or(`title.ilike.%${term}%,description.ilike.%${term}%`).in('status', ['published', 'active']).limit(10),
      supabase.from('servers').select('*').or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`).eq('is_public', true).limit(10),
    ]);
    setResults({ users: users.data || [], posts: posts.data || [], videos: videos.data || [], servers: servers.data || [] });
    setLoading(false);
  };

  const handleSearch = (e) => { e.preventDefault(); doSearch(query); };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: 20 }}>
        <SearchIcon size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" placeholder="Search everything..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 44, height: 48, fontSize: 16 }} autoFocus />
      </form>

      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {['all','users','posts','videos','servers'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>}

      {(tab === 'all' || tab === 'users') && results.users.map(u => (
        <Link key={u.id} href={`/profile/${u.username}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
          {u.avatar_url ? <img src={u.avatar_url} alt="" className="avatar" /> : <div className="avatar avatar-placeholder">{getInitials(u.username)}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{u.display_name || u.username}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{u.username}</div>
            {u.bio && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</p>}
          </div>
        </Link>
      ))}

      {(tab === 'all' || tab === 'posts') && results.posts.map(p => (
        <div key={p.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} alt="" className="avatar avatar-sm" /> : <div className="avatar avatar-sm avatar-placeholder">{getInitials(p.profiles?.username)}</div>}
            <span style={{ fontWeight: 600, fontSize: 13 }}>{p.profiles?.username}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(p.created_at)}</span>
          </div>
          <p style={{ fontSize: 14 }}>{p.content?.slice(0, 200)}</p>
        </div>
      ))}

      {(tab === 'all' || tab === 'videos') && results.videos.map(v => (
        <Link key={v.id} href={`/videos/${v.id}`} className="card" style={{ display: 'flex', gap: 12, marginBottom: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
          <div style={{ width: 140, height: 80, borderRadius: 8, background: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Play size={24} style={{ color: 'var(--text-muted)' }} />}
          </div>
          <div><h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{v.title}</h4><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.profiles?.username} · {formatCount(v.view_count)} views</p></div>
        </Link>
      ))}

      {(tab === 'all' || tab === 'servers') && results.servers.map(s => (
        <Link key={s.id} href={`/communities/${s.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.category || 'Community'} · {formatCount(s.member_count)} members</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>}><SearchContent /></Suspense>;
}
