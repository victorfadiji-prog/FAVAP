import { create } from 'zustand';

export const useUIStore = create((set) => ({
  theme: typeof window !== 'undefined' ? localStorage.getItem('favap-theme') || 'dark' : 'dark',
  sidebarOpen: true,
  activeModal: null,
  mobileNav: false,

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favap-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },

  toggleTheme: () => {
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('favap-theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
      }
      return { theme: next };
    });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
  toggleMobileNav: () => set((s) => ({ mobileNav: !s.mobileNav })),
}));
