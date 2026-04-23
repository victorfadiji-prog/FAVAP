'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Newspaper, MessageCircle, Play, Users, User, ChevronUp, ChevronDown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const items = [
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/messages', icon: MessageCircle, label: 'Chat' },
  { href: '/videos', icon: Play, label: 'Videos' },
  { href: '/communities', icon: Users, label: 'Groups' },
  { href: '/profile/me', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  return (
    <>
      {/* Toggle Button */}
      <button 
        className="hide-desktop"
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed', bottom: isVisible ? 72 : 16, right: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', boxShadow: 'var(--shadow-lg)', zIndex: 60,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          cursor: 'pointer'
        }}
      >
        {isVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="hide-desktop"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              height: 64, background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
            }}
          >
            {items.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  textDecoration: 'none', fontSize: 10, fontWeight: active ? 600 : 400,
                  transition: 'color 0.2s',
                }}>
                  <Icon size={20} />
                  {label}
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
