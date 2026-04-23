'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import {
  Sparkles, Newspaper, MessageCircle, Play, Users,
  Search, Bell, User, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/videos', icon: Play, label: 'Videos' },
  { href: '/communities', icon: Users, label: 'Communities' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className="hide-mobile"
      style={{
        width: sidebarOpen ? 'var(--sidebar-width)' : 72,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={20} color="white" />
        </div>
        {sidebarOpen && <span className="gradient-text" style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit' }}>FAVAP</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: sidebarOpen ? '10px 14px' : '10px',
                borderRadius: 'var(--radius)',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                background: active ? 'var(--primary-light)' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                transition: 'all 0.2s ease',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
              }}
            >
              <Icon size={20} />
              {sidebarOpen && label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-color)' }}>
        <Link
          href={`/profile/${profile?.username || 'me'}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 'var(--radius)', textDecoration: 'none', color: 'var(--text-primary)',
            transition: 'background 0.2s', justifyContent: sidebarOpen ? 'flex-start' : 'center',
          }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="avatar avatar-sm" />
          ) : (
            <div className="avatar avatar-sm avatar-placeholder"><User size={14} /></div>
          )}
          {sidebarOpen && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.display_name || profile?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{profile?.username}</div>
            </div>
          )}
        </Link>
        <button
          onClick={signOut}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: sidebarOpen ? 'flex-start' : 'center', marginTop: 4, color: 'var(--error)', fontSize: 13, padding: '8px 14px' }}
        >
          <LogOut size={16} />
          {sidebarOpen && 'Sign out'}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute', right: -14, top: 80,
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 10,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
}
