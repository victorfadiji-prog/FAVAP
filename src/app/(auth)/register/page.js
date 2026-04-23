'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const result = await signUp(form.email, form.password, form.username);
    if (result?.error) {
      toast.error(result.error.message || String(result.error));
    } else {
      toast.success('Account created! Please check your email to verify.');
      router.push('/login');
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card"
      style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative', zIndex: 1 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles size={28} style={{ color: 'var(--primary)' }} />
          <h1 className="gradient-text" style={{ fontSize: 32, margin: 0 }}>FAVAP</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create your account</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Username" value={form.username} onChange={update('username')} style={{ paddingLeft: 40 }} required id="register-username" />
        </div>
        <div style={{ position: 'relative' }}>
          <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="email" className="input" placeholder="Email address" value={form.email} onChange={update('email')} style={{ paddingLeft: 40 }} required id="register-email" />
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type={showPw ? 'text' : 'password'}
            className="input"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={update('password')}
            style={{ paddingLeft: 40, paddingRight: 40 }}
            required
            id="register-password"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type={showPw ? 'text' : 'password'} className="input" placeholder="Confirm password" value={form.confirmPassword} onChange={update('confirmPassword')} style={{ paddingLeft: 40 }} required id="register-confirm" />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: 44, fontSize: 15 }} id="register-submit">
          {loading ? <span className="spinner" /> : <><UserPlus size={18} /> Create Account</>}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn btn-secondary"
          onClick={() => useAuthStore.getState().signInWithOAuth('google')}
          style={{ height: 42 }}
          id="register-google"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
