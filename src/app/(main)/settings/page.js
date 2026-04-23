'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { 
  User, Bell, Shield, Palette, LogOut, Camera, Globe, 
  Mail, Save, Moon, Sun, Smartphone, Type, 
  Layout, Eye, Lock, UserX, Key, BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Switch = ({ enabled, onChange }) => (
  <button 
    onClick={() => onChange(!enabled)}
    style={{ 
      width: 44, height: 24, borderRadius: 12, 
      background: enabled ? 'var(--primary)' : 'var(--bg-elevated)', 
      position: 'relative', border: '1px solid var(--border-color)',
      cursor: 'pointer', transition: 'background 0.3s' 
    }}
  >
    <div style={{ 
      position: 'absolute', top: 2, left: enabled ? 22 : 2, 
      width: 18, height: 18, borderRadius: '50%', background: 'white', 
      transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </button>
);

export default function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    website: profile?.website || '',
    location: profile?.location || '',
  });

  const [notifSettings, setNotifSettings] = useState(profile?.notification_settings || {
    email: true, push: true, mentions: true, messages: true, likes: true, sounds: true
  });

  const [privacySettings, setPrivacySettings] = useState(profile?.privacy_settings || {
    profile_visibility: 'public', show_last_seen: true, allow_mentions: 'everyone'
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        location: profile.location || '',
      });
      if (profile.notification_settings) setNotifSettings(profile.notification_settings);
      if (profile.privacy_settings) setPrivacySettings(profile.privacy_settings);
    }
  }, [profile]);

  const handleSave = async (data) => {
    setLoading(true);
    const { error } = await updateProfile(data);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Settings updated!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 32, fontWeight: 800 }}>Settings</h1>

      <div style={{ display: 'flex', gap: 40 }}>
        {/* Navigation */}
        <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 12, border: 'none',
                  background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 500,
                  textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
          <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-color)' }} />
          <button
            onClick={() => confirm('Are you sure you want to sign out?') && signOut()}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 12, border: 'none', background: 'transparent',
              color: 'var(--error)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="card"
              style={{ padding: 32 }}
            >
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <User size={20} color="var(--primary)" /> Public Profile
                  </h2>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username}`} 
                        alt="" 
                        style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-secondary)' }} 
                      />
                      <button className="btn btn-primary btn-icon" style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32 }}>
                        <Camera size={14} />
                      </button>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 18 }}>{profile?.username}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Avatar and display name are visible to everyone.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Display Name</label>
                      <input className="input" value={profileForm.display_name} onChange={e => setProfileForm({...profileForm, display_name: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Bio</label>
                      <textarea className="input textarea" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} style={{ minHeight: 80 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Website</label>
                        <input className="input" value={profileForm.website} onChange={e => setProfileForm({...profileForm, website: e.target.value})} placeholder="https://" />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Location</label>
                        <input className="input" value={profileForm.location} onChange={e => setProfileForm({...profileForm, location: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => handleSave(profileForm)} disabled={loading}>
                      {loading ? <span className="spinner" /> : <><Save size={18} /> Save Changes</>}
                    </button>
                  </div>
                </div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Palette size={20} color="var(--primary)" /> Appearance
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Theme */}
                    <section>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Theme Mode</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <button 
                          onClick={() => theme !== 'light' && toggleTheme()}
                          style={{ 
                            padding: 20, borderRadius: 16, border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            background: '#fff', cursor: 'pointer', textAlign: 'center'
                          }}
                        >
                          <Sun size={24} color={theme === 'light' ? 'var(--primary)' : '#666'} />
                          <div style={{ marginTop: 8, fontWeight: 600, color: '#333' }}>Light</div>
                        </button>
                        <button 
                          onClick={() => theme !== 'dark' && toggleTheme()}
                          style={{ 
                            padding: 20, borderRadius: 16, border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            background: '#1a1a1a', cursor: 'pointer', textAlign: 'center'
                          }}
                        >
                          <Moon size={24} color={theme === 'dark' ? 'var(--primary)' : '#999'} />
                          <div style={{ marginTop: 8, fontWeight: 600, color: '#fff' }}>Dark</div>
                        </button>
                      </div>
                    </section>

                    {/* Font Size */}
                    <section>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Font Size</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px' }}>
                        <Type size={14} color="var(--text-muted)" />
                        <input type="range" min="0" max="2" defaultValue="1" style={{ flex: 1, accentColor: 'var(--primary)' }} />
                        <Type size={22} color="var(--text-muted)" />
                      </div>
                    </section>

                    {/* Accent Color */}
                    <section>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Accent Color</h3>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {['#6C5CE7', '#E84393', '#00B894', '#0984E3', '#FAB1A0'].map(color => (
                          <button key={color} style={{ width: 32, height: 32, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer' }} />
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bell size={20} color="var(--primary)" /> Notifications
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <section>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Main Channels</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                          { id: 'email', label: 'Email Notifications', desc: 'Receive daily digests and activity alerts', icon: Mail },
                          { id: 'push', label: 'Push Notifications', desc: 'Alerts on your desktop and mobile devices', icon: Smartphone },
                          { id: 'sounds', label: 'Alert Sounds', desc: 'Play sounds for incoming messages', icon: Bell }
                        ].map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <item.icon size={20} color="var(--text-secondary)" style={{ marginTop: 2 }} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
                              </div>
                            </div>
                            <Switch enabled={notifSettings[item.id]} onChange={v => setNotifSettings({...notifSettings, [item.id]: v})} />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Activity Alerts</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                          { id: 'mentions', label: 'Mentions & Replies', desc: 'When someone tags you in a post' },
                          { id: 'messages', label: 'Direct Messages', desc: 'When you receive a new chat message' },
                          { id: 'likes', label: 'Likes & Reactions', desc: 'When someone likes your content' }
                        ].map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
                            </div>
                            <Switch enabled={notifSettings[item.id]} onChange={v => setNotifSettings({...notifSettings, [item.id]: v})} />
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => handleSave({ notification_settings: notifSettings })} disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {/* PRIVACY TAB */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={20} color="var(--primary)" /> Privacy & Security
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <section>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Account Privacy</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <Lock size={20} color="var(--text-secondary)" style={{ marginTop: 2 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 15 }}>Private Account</div>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Only approved followers can see your posts</div>
                            </div>
                          </div>
                          <Switch 
                            enabled={privacySettings.profile_visibility === 'private'} 
                            onChange={v => setPrivacySettings({...privacySettings, profile_visibility: v ? 'private' : 'public'})} 
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <Eye size={20} color="var(--text-secondary)" style={{ marginTop: 2 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 15 }}>Show Activity Status</div>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Allow others to see when you are online</div>
                            </div>
                          </div>
                          <Switch enabled={privacySettings.show_last_seen} onChange={v => setPrivacySettings({...privacySettings, show_last_seen: v})} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>Security</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: 12, padding: '12px 20px' }}>
                          <Key size={18} /> Change Password
                        </button>
                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: 12, padding: '12px 20px' }}>
                          <Smartphone size={18} /> Two-Factor Authentication
                        </button>
                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', gap: 12, padding: '12px 20px', color: 'var(--error)' }}>
                          <UserX size={18} /> Manage Blocked Users
                        </button>
                      </div>
                    </section>
                  </div>
                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => handleSave({ privacy_settings: privacySettings })} disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Update Privacy'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
