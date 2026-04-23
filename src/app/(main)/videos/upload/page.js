'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useVideoStore } from '@/stores/useVideoStore';
import { supabase } from '@/lib/supabase';
import { Upload, Film, Image as ImageIcon, X, ArrowLeft, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function UploadVideoPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { uploadVideo } = useVideoStore();
  const [form, setForm] = useState({ title: '', description: '', category: 'general', tags: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) { 
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video too large (max 100MB)');
        return;
      }
      setVideoFile(file); 
      const url = URL.createObjectURL(file);
      setVideoPreview(url); 

      // Extract duration and handle as integer to avoid DB type errors
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setDuration(Math.floor(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.src = url;
    }
  };

  const handleThumbSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setThumbFile(file); setThumbPreview(URL.createObjectURL(file)); }
  };

  const handleUpload = async () => {
    if (!videoFile || !form.title.trim()) { toast.error('Title and video are required'); return; }
    setUploading(true);
    setProgress(5);
    setUploadStatus('Analyzing video...');

    try {
      const vExt = videoFile.name.split('.').pop();
      const vPath = `videos/${profile.id}/${Date.now()}.${vExt}`;
      
      setUploadStatus('Uploading video...');
      setProgress(10);

      const { data: vData, error: vErr } = await supabase.storage.from('media').upload(vPath, videoFile, {
        cacheControl: '3600',
        upsert: true
      });

      if (vErr) throw vErr;
      setProgress(60);
      const { data: vUrl } = supabase.storage.from('media').getPublicUrl(vData.path);

      let thumbUrl = null;
      if (thumbFile) {
        setUploadStatus('Uploading thumbnail...');
        setProgress(70);
        const tExt = thumbFile.name.split('.').pop();
        const tPath = `thumbnails/${profile.id}/${Date.now()}.${tExt}`;
        const { data: tData } = await supabase.storage.from('media').upload(tPath, thumbFile);
        if (tData) { 
          const { data: tUrlData } = supabase.storage.from('media').getPublicUrl(tData.path); 
          thumbUrl = tUrlData.publicUrl; 
        }
      }

      setUploadStatus('Publishing...');
      setProgress(90);
      
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error: dbErr } = await uploadVideo({
        user_id: profile.id,
        title: form.title.trim(),
        description: form.description.trim(),
        video_url: vUrl.publicUrl,
        thumbnail_url: thumbUrl,
        category: form.category,
        duration: Math.floor(duration), // Ensure integer
        tags,
        status: 'published',
      });

      if (dbErr) throw dbErr;

      setProgress(100);
      toast.success('Video shared!');
      router.push('/videos');

    } catch (err) {
      console.error('Upload error:', err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatDuration = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/videos" className="btn btn-ghost btn-icon"><ArrowLeft size={20} /></Link>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Upload Video</h1>
      </div>

      <div className="card" style={{ padding: 32 }}>
        {!videoPreview ? (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: 20, padding: 60, cursor: 'pointer', background: 'var(--bg-elevated)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Film size={32} style={{ color: 'var(--primary)' }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Select Video File</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>MP4, WebM (Max 100MB)</span>
            <input type="file" accept="video/*" hidden onChange={handleVideoSelect} />
          </label>
        ) : (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
            <video src={videoPreview} controls style={{ width: '100%', maxHeight: 400 }} />
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} /> {formatDuration(duration)}
              </div>
              <button onClick={() => { setVideoFile(null); setVideoPreview(null); }} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ height: 48, fontSize: 16 }} />
          <textarea className="input textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 100 }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ height: 48 }}>
              <option value="general">General</option>
              <option value="music">Music</option>
              <option value="gaming">Gaming</option>
              <option value="entertainment">Entertainment</option>
            </select>
            <input className="input" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} style={{ height: 48 }} />
          </div>
        </div>

        {uploading && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span>{uploadStatus}</span>
              <span style={{ fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: 'var(--primary)' }} />
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !videoFile || !form.title.trim()} style={{ width: '100%', height: 56, fontSize: 16, fontWeight: 700, marginTop: 32 }}>
          {uploading ? <span className="spinner" /> : <><Upload size={20} /> Publish Video</>}
        </button>
      </div>
    </div>
  );
}
