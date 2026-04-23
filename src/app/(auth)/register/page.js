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

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
