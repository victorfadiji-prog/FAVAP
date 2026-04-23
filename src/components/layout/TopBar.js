'use client';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Search, Bell, Sun, Moon, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TopBar() {
  const { theme, toggleTheme, toggleMobileNav } = useUIStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header style={{
      height: 'var(--topbar-height)', background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      position: 'sticky', top: 0, zIndex: 15,
    }}>
      <button
        className="btn btn-ghost btn-icon hide-desktop"
        onClick={toggleMobileNav}
        style={{ display: 'flex' }}
      >
        <Menu size={20} />
      </button>

      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Search users, posts, videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: 40, background: 'var(--bg-elevated)', border: 'none', height: 40 }}
          id="global-search"
        />
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} data-tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'} id="theme-toggle">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="btn btn-ghost btn-icon" onClick={() => router.push('/notifications')} style={{ position: 'relative' }} id="notifications-btn">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  );
}
