'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export default function ThemeInitializer() {
  const { theme } = useUIStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}
