import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { statsService, songsService, artistsService, notificationsService, subscriptionsService, paymentsService, withdrawalsService, artistsExtendedService, commentsService, notificationSettingsService } from '../services/api';
import { useSearchParams } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';

const ARTIST_NAV = [
  { label: 'Dashboard Overview', icon: 'fa-tachometer-alt', view: 'dashboard' },
  { label: 'Profile Management', icon: 'fa-user', view: 'profile' },
  { label: 'Music Uploads', icon: 'fa-music', view: 'music' },
  { label: 'Performance & Analytics', icon: 'fa-chart-line', view: 'analytics' },
  { label: 'Social Interaction', icon: 'fa-comments', view: 'social' },
  { label: 'Revenue & Royalties', icon: 'fa-dollar-sign', view: 'revenue' },
  { label: 'Subscription Plan', icon: 'fa-crown', view: 'subscription' },
  { label: 'Notifications', icon: 'fa-bell', view: 'notifications' },
];

const ArtistDashboard: React.FC = () => {
  const { playSong, currentSong, isPlaying } = useAudio();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', genre: '', bio: '', location: '', website: '', instagramUrl: '', twitterUrl: '', facebookUrl: '', youtubeUrl: '' });
  // New state for inline field validation errors
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; songFile?: string; coverArt?: string }>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMomoNumber, setWithdrawalMomoNumber] = useState('');
  const [withdrawalMessage, setWithdrawalMessage] = useState('');
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  const [artistComments, setArtistComments] = useState<any[]>([]);
  const [commentSongFilter, setCommentSongFilter] = useState('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState({ notif_new_followers: true, notif_comments: true, notif_stream_milestones: true, notif_revenue_updates: true, notif_marketing: false });
  const [notificationPrefsMessage, setNotificationPrefsMessage] = useState('');
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [showBilling, setShowBilling] = useState(false);
  const [revenueBalance, setRevenueBalance] = useState(0);
  const [streamingTrend, setStreamingTrend] = useState<number[]>([]);
  const [editingSong, setEditingSong] = useState<any>(null);
  const [deletingSong, setDeletingSong] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', genre: '' });

  // Upload form
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Afrobeat');
  const [songFile, setSongFile] = useState<File | null>(null);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [selectedSongLabel, setSelectedSongLabel] = useState('Accepted audio formats: MP3, WAV, OGG, FLAC — max 50MB');
  const [selectedCoverLabel, setSelectedCoverLabel] = useState('Optional cover art: JPG, PNG, WEBP, GIF — max 5MB');
  const [uploading, setUploading] = useState(false);
  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'info'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const successResetTimer = useRef<number | null>(null);

  const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
  const MAX_COVER_SIZE = 5 * 1024 * 1024;
  const audioExtensions = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
  const imageExtensions = /\.(jpe?g|png|webp|gif)$/i;

  const resetUploadNotice = () => {
    if (uploadStatus !== 'idle' && uploadStatus !== 'info') {
      setUploadStatus('idle');
      setUploadMessage('');
      setUploadProgress(0);
    }
    // Clear field errors when user interacts again
    setFieldErrors({});
  };

  const validateAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !audioExtensions.test(file.name)) {
      return 'Please select a valid audio file (MP3, WAV, OGG, FLAC).';
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return 'Audio file must be smaller than 50MB.';
    }
    return null;
  };

  const validateCoverArtFile = (file: File) => {
    if (!file.type.startsWith('image/') && !imageExtensions.test(file.name)) {
      return 'Cover art must be a PNG, JPG, WEBP, or GIF image.';
    }
    if (file.size > MAX_COVER_SIZE) {
      return 'Cover art must be smaller than 5MB.';
    }
    return null;
  };

  const handleSongFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSongFile(null);
      setSelectedSongLabel('Accepted audio formats: MP3, WAV, OGG, FLAC — max 50MB');
      resetUploadNotice();
      return;
    }

    const error = validateAudioFile(file);
    if (error) {
      setUploadStatus('error');
      setUploadMessage(error);
      setSongFile(null);
      setSelectedSongLabel('Invalid audio file selected');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setSongFile(file);
    setSelectedSongLabel(`${file.name} • ${Math.round(file.size / 1024)} KB`);
    resetUploadNotice();
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setCoverArt(null);
      setSelectedCoverLabel('Optional cover art: JPG, PNG, WEBP, GIF — max 5MB');
      resetUploadNotice();
      return;
    }

    const error = validateCoverArtFile(file);
    if (error) {
      setUploadStatus('error');
      setUploadMessage(error);
      setCoverArt(null);
      setSelectedCoverLabel('Invalid cover art selected');
      if (coverRef.current) coverRef.current.value = '';
      return;
    }

    setCoverArt(file);
    setSelectedCoverLabel(`${file.name} • ${Math.round(file.size / 1024)} KB`);
    resetUploadNotice();
  };

  useEffect(() => {
    return () => {
      if (successResetTimer.current) {
        window.clearTimeout(successResetTimer.current);
      }
    };
  }, []);

  // Initialize activeView from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveView(tabParam);
    }
  }, [searchParams]);
  const fetchProfile = async () => {
    setProfileError('');
    try {
      const res = await artistsService.getArtistMe();
      if (res.data.success) {
        setProfile(res.data.data);
        setProfileForm({
          name: res.data.data.name || '',
          genre: res.data.data.genre || '',
          bio: res.data.data.bio || '',
          location: res.data.data.location || '',
          website: res.data.data.website || '',
          instagramUrl: res.data.data.instagramUrl || '',
          twitterUrl: res.data.data.twitterUrl || '',
          facebookUrl: res.data.data.facebookUrl || '',
          youtubeUrl: res.data.data.youtubeUrl || '',
        });
      }
    } catch (error: any) {
      setProfileError(error.response?.data?.message || 'Unable to load your artist profile.');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await statsService.getArtistStats();
      if (res.data.success) setStats(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchProfile();
  }, []);
  const fetchPlans = async () => { try { const res = await subscriptionsService.getPlans(); if (res.data.success) setPlans(res.data.data); } catch {} };
  const fetchWithdrawals = async () => { try { const res = await withdrawalsService.getWithdrawals(); if (res.data.success) setWithdrawals(res.data.data); } catch {} };
  const fetchNotifications = async () => { try { const res = await notificationsService.getNotifications(); if (res.data.success) { setNotifications(res.data.data); } } catch {} };
  const fetchArtistComments = async () => {
    try {
      const res = await commentsService.getRecentActivity();
      if (res.data.success) {
        const ownArtistId = profile?._id;
        const filtered = res.data.data.filter((comment: any) => {
          const songArtist = comment.songId?.artistId;
          const songArtistId = typeof songArtist === 'string' ? songArtist : songArtist?._id;
          return !ownArtistId || songArtistId === ownArtistId;
        });
        setArtistComments(filtered);
      }
    } catch {}
  };

  const fetchNotificationPrefs = async () => {
    try {
      const res = await notificationSettingsService.getSettings();
      if (res.data.success && res.data.data) setNotificationPrefs(prev => ({ ...prev, ...res.data.data }));
    } catch {}
  };

  const fetchBillingHistory = async () => {
    try {
      const res = await paymentsService.getPayments();
      if (res.data.success) setBillingHistory(res.data.data || []);
    } catch {}
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileSaving(true);
    setProfileMessage('');
    try {
      const res = await artistsService.updateArtist(profile._id, profileForm);
      if (res.data.success) {
        setProfile(res.data.data);
        setProfileMessage('Profile saved successfully.');
      }
    } catch (error: any) {
      setProfileMessage(error.response?.data?.message || 'Unable to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSubscribe = async (plan: any) => {
    if (!plan) return;
    setSubscriptionMessage(`Processing payment for ${plan.name}...`);
    setIsSubscribing(true);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    try {
      const paymentRes = await paymentsService.createPayment({
        amount: plan.price,
        currency: 'XAF',
        paymentMethod: 'MoMo',
      });

      if (!paymentRes.data.success) {
        throw new Error(paymentRes.data.message || 'Payment initiation failed');
      }

      const subRes = await subscriptionsService.createSubscription({
        planName: plan.name,
        amount: plan.price,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
      });

      if (!subRes.data.success) {
        throw new Error(subRes.data.message || 'Subscription creation failed');
      }

      setSubscriptionMessage(`Subscribed to ${plan.name}. Payment is pending review.`);
    } catch (error: any) {
      setSubscriptionMessage(error.response?.data?.message || error.message || 'Subscription failed.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!withdrawalAmount || !withdrawalMomoNumber) {
      setWithdrawalMessage('Please enter both an amount and a mobile money number.');
      return;
    }
    if (Number(withdrawalAmount) < 5000) {
      setWithdrawalMessage('Minimum withdrawal is 5,000 FCFA.');
      return;
    }

    setIsRequestingWithdrawal(true);
    setWithdrawalMessage('');

    try {
      const res = await withdrawalsService.requestWithdrawal({
        amount: Number(withdrawalAmount),
        momoNumber: withdrawalMomoNumber,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || 'Withdrawal request failed');
      }

      setWithdrawalAmount('');
      setWithdrawalMomoNumber('');
      setWithdrawalMessage('Withdrawal request submitted successfully.');
      await fetchWithdrawals();
    } catch (error: any) {
      setWithdrawalMessage(error.response?.data?.message || error.message || 'Withdrawal request failed.');
    } finally {
      setIsRequestingWithdrawal(false);
    }
  };

  useEffect(() => {
    if (activeView === 'profile') fetchProfile();
    else if (activeView === 'subscription') fetchPlans();
    else if (activeView === 'revenue') fetchWithdrawals();
    else if (activeView === 'notifications') { fetchNotifications(); fetchNotificationPrefs(); }
    else if (activeView === 'social') fetchArtistComments();
  }, [activeView]);

  const handleReply = async (comment: any) => {
    if (!replyText.trim() || !comment.songId?._id) return;
    try {
      await commentsService.postComment(comment.songId._id, replyText.trim(), comment._id);
      setReplyText('');
      setReplyingTo(null);
      await fetchArtistComments();
    } catch {}
  };

  const exportArtistStats = () => {
    const rows = [['Track', 'Genre', 'Plays', 'Likes', 'Estimated Royalties'], ...(stats?.topSongs || []).map((song: any) => [song.title, song.genre || '', song.plays || 0, song.likes || 0, ((song.plays || 0) * 1.5).toFixed(2)])];
    const csv = rows.map(row => row.map((value: string | number) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = 'artist-stats.csv';
    link.click();
  };

  // Calculate revenue balance from stats and withdrawals
  useEffect(() => {
    const royaltyRate = 1.5; // XAF per play
    const totalRoyalties = (stats?.totalPlays || 0) * royaltyRate;
    const withdrawnAmount = withdrawals
      .filter((w: any) => w.status === 'completed')
      .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
    setRevenueBalance(totalRoyalties - withdrawnAmount);
  }, [stats, withdrawals]);

  // Calculate streaming trend data (simulated 30-day distribution)
  useEffect(() => {
    const totalPlays = stats?.totalPlays || 0;
    if (totalPlays === 0) {
      setStreamingTrend([]);
      return;
    }
    // Generate a realistic trend with some variation
    const trend: number[] = [];
    let remaining = totalPlays;
    for (let i = 0; i < 30; i++) {
      const dailyPlays = Math.max(0, Math.floor((remaining / (30 - i)) * (0.8 + Math.random() * 0.4)));
      trend.push(dailyPlays);
      remaining -= dailyPlays;
    }
    // Ensure total matches
    const trendTotal = trend.reduce((a, b) => a + b, 0);
    if (trendTotal !== totalPlays) {
      trend[0] += totalPlays - trendTotal;
    }
    setStreamingTrend(trend);
  }, [stats?.totalPlays]);

  const handleEditSong = (song: any) => {
    setEditingSong(song);
    setEditForm({ title: song.title, genre: song.genre || 'Afrobeat' });
  };

  const handleSaveEdit = async () => {
    if (!editingSong) return;
    try {
      const res = await songsService.updateSong(editingSong._id, editForm);
      if (res.data.success) {
        setEditingSong(null);
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update song');
    }
  };

  const handleDeleteSong = async (song: any) => {
    if (!confirm(`Are you sure you want to delete "${song.title}"?`)) return;
    setDeletingSong(song);
    try {
      const res = await songsService.deleteSong(song._id);
      if (res.data.success) {
        fetchStats();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete song');
    } finally {
      setDeletingSong(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleTrimmed = title.trim();

    // Reset previous errors and status
    setFieldErrors({});
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadProgress(0);

    const errors: { title?: string; songFile?: string; coverArt?: string } = {};

    if (!titleTrimmed) {
      errors.title = 'Please enter a track title.';
    }
    if (!songFile) {
      errors.songFile = 'Please select an audio file to upload.';
    } else {
      const audioError = validateAudioFile(songFile);
      if (audioError) errors.songFile = audioError;
    }
    if (coverArt) {
      const coverError = validateCoverArtFile(coverArt);
      if (coverError) errors.coverArt = coverError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setUploadStatus('error');
      setUploadMessage('Please fix the highlighted errors.');
      return;
    }

    // All validations passed – start upload
    setUploading(true);
    setUploadStatus('loading');
    setUploadMessage(`Uploading ${titleTrimmed}...`);

    const fd = new FormData();
    fd.append('upload_type', 'song');
    fd.append('title', titleTrimmed);
    fd.append('genre', genre);
    fd.append('song_file', songFile!);
    if (coverArt) {
      fd.append('cover_art', coverArt);
    }

    try {
      const res = await songsService.createSong(fd, {
        onUploadProgress: (event) => {
          const total = event.total ?? 0;
          const loaded = event.loaded ?? 0;
          if (total > 0) {
            const percent = Math.min(100, Math.round((loaded / total) * 100));
            setUploadProgress(percent);
            setUploadMessage(`Uploading ${titleTrimmed}... ${percent}%`);
          }
        },
      });
      if (res.data.success) {
        // Success handling – show toast and reset form
        setToastMessage('✅ Track uploaded successfully and is pending moderation.');
        setShowToast(true);
        // Auto‑dismiss toast after 4 seconds
        setTimeout(() => setShowToast(false), 4000);

        // Reset form fields
        setTitle('');
        setSongFile(null);
        setCoverArt(null);
        setUploadProgress(100);
        setSelectedSongLabel('Accepted audio formats: MP3, WAV, OGG, FLAC — max 50MB');
        setSelectedCoverLabel('Optional cover art: JPG, PNG, WEBP, GIF — max 5MB');
        if (fileRef.current) fileRef.current.value = '';
        if (coverRef.current) coverRef.current.value = '';

        // Reset upload UI after short delay
        successResetTimer.current = window.setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
          setUploadProgress(0);
          successResetTimer.current = null;
        }, 5000);
      } else {
        setUploadStatus('error');
        setUploadMessage(res.data.message || 'Upload failed.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      console.error('Artist upload error:', err);
      setUploadStatus('error');
      setUploadMessage(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const DashOverview = () => (
    <div>
      {/* Artist Profile Header */}
      <div className="hero-welcome">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="hero-avatar-ring">
              {profile?.image ? (
                <img src={profile.image} alt={profile.name} />
              ) : (
                <div className="avatar-placeholder" style={{ background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.8rem' }}>
                  {profile?.name?.charAt(0) ?? 'A'}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
                <i className="fas fa-check-circle" /> VERIFIED ARTIST HUB
              </div>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                {profile?.name || 'Artist Portal'}
              </h2>
              <p style={{ margin: '6px 0 0 0', color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem' }}>
                Manage your music releases, track analytics, and connect with your fanbase
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('profile')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              background: 'var(--accent-color)', color: '#000', borderRadius: 20, fontWeight: 700,
              fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(250, 204, 21, 0.35)'
            }}
          >
            <i className="fas fa-edit" /> Edit Profile
          </button>
          <button className="btn-camsound-outline" onClick={exportArtistStats} title="Export artist statistics">
            <i className="fas fa-download" /> Export
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        {[
          { label: 'Total Plays', value: loading ? '...' : stats?.totalPlays?.toLocaleString() ?? 0, icon: 'fa-headphones', color: 'var(--accent-color)' },
          { label: 'Total Tracks', value: loading ? '...' : stats?.totalSongs ?? 0, icon: 'fa-compact-disc', color: '#10b981' },
          { label: 'Followers', value: loading ? '...' : stats?.followers ?? 0, icon: 'fa-users', color: '#c084fc' },
          { label: 'Pending Revenue', value: 'XAF 0', icon: 'fa-wallet', color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="stat-card-premium">
            <div className="stat-card-icon" style={{ color: s.color, borderColor: `${s.color}35`, background: `${s.color}15` }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Tracks */}
      <div className="stat-card-premium" style={{ padding: 28, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-chart-line" style={{ color: 'var(--accent-color)' }} /> Your Top Performing Tracks
          </h2>
          <button
            onClick={() => setActiveView('music')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            All Tracks <i className="fas fa-arrow-right" />
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.5)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }} />
          </div>
        ) : !stats?.topSongs?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.5)' }}>
            <i className="fas fa-music" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12, opacity: 0.4, color: 'var(--accent-color)' }} />
            <p>You haven't uploaded any tracks yet.</p>
            <button
              onClick={() => setActiveView('music')}
              style={{ marginTop: 16, padding: '10px 24px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: 20, fontWeight: 700, cursor: 'pointer' }}
            >
              <i className="fas fa-upload" style={{ marginRight: 8 }} /> Upload Your First Track
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.topSongs.map((song: any, idx: number) => (
              <div key={song._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-color)', width: 24, textAlign: 'center' }}>{idx + 1}</span>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#121814', overflow: 'hidden', flexShrink: 0 }}>
                  {song.coverArt ? <img src={song.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}><i className="fas fa-music" /></div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{song.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{song.plays?.toLocaleString()} plays</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderUploadView = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="upload-form-card">
          <div className="upload-form-title">
            <i className="fas fa-upload" />Upload New Track
          </div>

          {/* Inline validation feedback */}
          {uploadStatus === 'error' && uploadMessage && (
            <div className="upload-message error" aria-live="polite">
              <i className="fas fa-exclamation-circle" /> <span>{uploadMessage}</span>
            </div>
          )}

          {/* Toast notification for success */}
          {showToast && (
            <div className="toast" role="alert" aria-live="polite">
              {toastMessage}
            </div>
          )}

          {(uploading || uploadStatus === 'loading') && (
            <div className="upload-progress" aria-hidden="true">
              <div className="upload-progress-track">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="upload-progress-meta">{uploadProgress ? `${uploadProgress}% uploaded` : 'Preparing upload...'}</div>
            </div>
          )}

          <form onSubmit={handleUpload} noValidate>
            <div className="form-field">
              <label htmlFor="track-title">Track Title</label>
              <input
                id="track-title"
                name="trackTitle"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. African Giant"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  resetUploadNotice();
                }}
                disabled={uploading}
                aria-invalid={!!fieldErrors.title}
                aria-describedby={fieldErrors.title ? 'title-error' : undefined}
              />
              {fieldErrors.title && (
                <div id="title-error" className="field-error" role="alert">
                  {fieldErrors.title}
                </div>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="genre">Genre</label>
              <select id="genre" name="genre" value={genre} onChange={e => setGenre(e.target.value)}>
                {['Afrobeat','Makossa','Bikutsi','Assiko','Hip Hop','R&B','Ndombolo','Highlife'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="audio-file">Audio File</label>
              <input
                ref={fileRef}
                id="audio-file"
                name="songFile"
                type="file"
                accept="audio/*,audio/mpeg,audio/wav,audio/ogg,audio/flac"
                onChange={handleSongFileChange}
                disabled={uploading}
                aria-invalid={!!fieldErrors.songFile}
                aria-describedby={fieldErrors.songFile ? 'songfile-error' : undefined}
              />
              {fieldErrors.songFile && (
                <div id="songfile-error" className="field-error" role="alert">
                  {fieldErrors.songFile}
                </div>
              )}
              <div className="upload-file-hint">{selectedSongLabel}</div>
            </div>
            <div className="form-field">
              <label htmlFor="cover-art">Cover Art (Optional)</label>
              <input
                ref={coverRef}
                id="cover-art"
                name="coverArt"
                type="file"
                accept="image/*"
                onChange={handleCoverArtChange}
                disabled={uploading}
                aria-invalid={!!fieldErrors.coverArt}
                aria-describedby={fieldErrors.coverArt ? 'coverart-error' : undefined}
              />
              {fieldErrors.coverArt && (
                <div id="coverart-error" className="field-error" role="alert">
                  {fieldErrors.coverArt}
                </div>
              )}
              <div className="upload-file-hint">{selectedCoverLabel}</div>
            </div>
            <button type="submit" className="btn-camsound-yellow" style={{ width: '100%', marginTop: 8, justifyContent: 'center', borderRadius: 10 }} disabled={uploading}>
              {uploading ? <><i className="fas fa-spinner fa-spin" /> Uploading...</> : <><i className="fas fa-upload" /> Publish Track</>}
            </button>
          </form>
        </div>

        {/* Uploaded tracks */}
        <div className="section-card" style={{ alignSelf: 'start' }}>
          <div className="section-header"><h2>My Tracks</h2></div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : !stats?.topSongs?.length ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-music" style={{ fontSize: '2rem', opacity: 0.4, display: 'block', marginBottom: 12 }} />
              <p>No tracks uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.topSongs.map((song: any) => (
                <div key={song._id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                  <button
                    onClick={() => playSong(song)}
                    style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: currentSong?._id === song._id ? 'var(--accent-color)' : 'var(--text-muted)' }}
                    title="Play"
                  >
                    {currentSong?._id === song._id && isPlaying ? <i className="fas fa-pause" /> : <i className="fas fa-play" />}
                  </button>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{song.genre}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(250,204,21,0.1)', color: 'var(--accent-color)', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>
                    {song.status || 'active'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleEditSong(song)}
                      style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 6, color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem' }}
                      title="Edit"
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      onClick={() => handleDeleteSong(song)}
                      disabled={deletingSong?._id === song._id}
                      style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', opacity: deletingSong?._id === song._id ? 0.5 : 1 }}
                      title="Delete"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );



  return (
    <Layout
      navItems={ARTIST_NAV}
      activeView={activeView}
      onNavClick={(view) => {
        setActiveView(view);
        setSearchParams({ tab: view });
      }}
      showSearch={false}
    >
      <div key={activeView} className="view-fade-in">
        {activeView === 'dashboard' && <DashOverview />}
        {activeView === 'music' && renderUploadView()}
      {/* Profile Management */}
      {activeView === 'profile' && !profile && (
        <div className="section-card">
          <div className="section-header"><h2>Profile Management</h2></div>
          <p style={{ color: 'var(--text-muted)' }}>{profileError || 'Loading artist profile...'}</p>
          {profileError && <button className="btn-camsound-outline" onClick={fetchProfile}>Try Again</button>}
        </div>
      )}
      {activeView === 'profile' && profile && (
        <div className="section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Profile Management</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {(profile.verification === 'approved' || profile.status === 'verified') ? (
                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i className="fas fa-check-circle" /> Verified Artist
                </span>
              ) : profile.verification === 'pending' ? (
                <span style={{ background: 'rgba(250,204,21,0.15)', color: 'var(--accent-color)', padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i className="fas fa-clock" /> Verification Pending Review
                </span>
              ) : (
                <button
                  className="btn-camsound-outline"
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                  onClick={async () => {
                    setProfileMessage('');
                    try {
                      const res = await artistsExtendedService.requestVerification();
                      if (res.data.success) {
                        setProfileMessage('✅ ' + res.data.message);
                        fetchProfile();
                      }
                    } catch (err: any) {
                      setProfileMessage('❌ ' + (err.response?.data?.message || 'Verification request failed.'));
                    }
                  }}
                >
                  <i className="fas fa-shield-alt" style={{ marginRight: 6 }} /> Request Artist Verification
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: 'var(--text-muted)', position: 'relative' }}>
                {profile.name?.charAt(0) || 'A'}
                {(profile.verification === 'approved' || profile.status === 'verified') && (
                  <i className="fas fa-check-circle" style={{ position: 'absolute', bottom: 8, right: 8, fontSize: '1.6rem', color: '#4ade80', background: 'var(--bg-primary)', borderRadius: '50%' }} />
                )}
              </div>
              <button className="btn-camsound-outline" style={{ width: '100%' }}>Change Avatar</button>
            </div>
            <div>
              {profileMessage && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: profileMessage.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: profileMessage.startsWith('✅') ? '#4ade80' : '#f87171', fontSize: '0.9rem' }}>
                  {profileMessage}
                </div>
              )}
              <div className="form-field">
                <label>Artist Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="search-input-db"
                />
              </div>
              <div className="form-field">
                <label>Genre</label>
                <input
                  type="text"
                  value={profileForm.genre}
                  onChange={e => setProfileForm(prev => ({ ...prev, genre: e.target.value }))}
                  className="search-input-db"
                />
              </div>
              <div className="form-field">
                <label>Bio</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="search-input-db"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-field">
                  <label>Location</label>
                  <input type="text" placeholder="Douala, Cameroon" value={profileForm.location} onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))} className="search-input-db" />
                </div>
                <div className="form-field">
                  <label>Website</label>
                  <input type="url" placeholder="https://yourwebsite.com" value={profileForm.website} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} className="search-input-db" />
                </div>
              </div>
              <h4 style={{ marginTop: 16, marginBottom: 12, color: 'var(--text-white)' }}>Social Media Handles</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-field">
                  <label><i className="fab fa-instagram" style={{ marginRight: 6, color: '#e1306c' }} />Instagram URL</label>
                  <input type="url" placeholder="https://instagram.com/artist" value={profileForm.instagramUrl} onChange={e => setProfileForm(p => ({ ...p, instagramUrl: e.target.value }))} className="search-input-db" />
                </div>
                <div className="form-field">
                  <label><i className="fab fa-twitter" style={{ marginRight: 6, color: '#1da1f2' }} />Twitter / X URL</label>
                  <input type="url" placeholder="https://x.com/artist" value={profileForm.twitterUrl} onChange={e => setProfileForm(p => ({ ...p, twitterUrl: e.target.value }))} className="search-input-db" />
                </div>
                <div className="form-field">
                  <label><i className="fab fa-facebook" style={{ marginRight: 6, color: '#4267b2' }} />Facebook URL</label>
                  <input type="url" placeholder="https://facebook.com/artist" value={profileForm.facebookUrl} onChange={e => setProfileForm(p => ({ ...p, facebookUrl: e.target.value }))} className="search-input-db" />
                </div>
                <div className="form-field">
                  <label><i className="fab fa-youtube" style={{ marginRight: 6, color: '#ff0000' }} />YouTube URL</label>
                  <input type="url" placeholder="https://youtube.com/@artist" value={profileForm.youtubeUrl} onChange={e => setProfileForm(p => ({ ...p, youtubeUrl: e.target.value }))} className="search-input-db" />
                </div>
              </div>
              <button className="btn-camsound-yellow" style={{ marginTop: 16 }} onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Profile & Links'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance & Analytics */}
      {activeView === 'analytics' && (
        <div>
          <div className="section-card" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h2>📈 Streaming Performance & Analytics</h2>
            </div>
            <div className="stats-cards-grid" style={{ marginBottom: 24 }}>
              <div className="stat-dash-card">
                <div className="stat-dash-icon"><i className="fas fa-headphones" /></div>
                <div>
                  <div className="stat-dash-label">Total Plays</div>
                  <div className="stat-dash-value">{(stats?.totalPlays || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-dash-card">
                <div className="stat-dash-icon green"><i className="fas fa-heart" /></div>
                <div>
                  <div className="stat-dash-label">Total Likes</div>
                  <div className="stat-dash-value">{(stats?.totalLikes || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-dash-card">
                <div className="stat-dash-icon blue"><i className="fas fa-download" /></div>
                <div>
                  <div className="stat-dash-label">Total Downloads</div>
                  <div className="stat-dash-value">{(stats?.totalDownloads || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-dash-card">
                <div className="stat-dash-icon"><i className="fas fa-users" /></div>
                <div>
                  <div className="stat-dash-label">Followers</div>
                  <div className="stat-dash-value">{(stats?.followers || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 30-Day Stream Trend Chart */}
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#fff' }}>Streaming Trend (Last 30 Days)</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Daily playback count evolution</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(250,204,21,0.15)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>
                    ● Streams
                  </span>
                </div>
              </div>

              {/* Responsive SVG Spark/Area Line Chart */}
              <div style={{ width: '100%', height: 180, position: 'relative' }}>
                <svg viewBox="0 0 700 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="700" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                  <line x1="0" y1="80" x2="700" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                  <line x1="0" y1="130" x2="700" y2="130" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />

                  {streamingTrend.length > 0 ? (() => {
                    const maxPlays = Math.max(...streamingTrend, 1);
                    const points = streamingTrend.map((plays, i) => {
                      const x = (i / (streamingTrend.length - 1)) * 700;
                      const y = 150 - (plays / maxPlays) * 120;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    const areaPath = `M 0,150 L ${points.replace(/ /g, ' L ')} L 700,150 Z`;
                    const linePath = `M ${points.replace(/ /g, ' L ')}`;

                    return (
                      <>
                        <path d={areaPath} fill="rgba(250, 204, 21, 0.2)" />
                        <path d={linePath} fill="none" stroke="var(--accent-color)" strokeWidth="3" strokeLinecap="round" />
                        {streamingTrend.filter((_, i) => i % 7 === 0 || i === streamingTrend.length - 1).map((plays, i) => {
                          const idx = i === 0 ? 0 : (i * 7);
                          const x = (idx / (streamingTrend.length - 1)) * 700;
                          const y = 150 - (plays / maxPlays) * 120;
                          return <circle key={idx} cx={x} cy={y} r="5" fill="#FACC15" stroke="#0B0F0C" strokeWidth="2" />;
                        })}
                      </>
                    );
                  })() : (
                    <text x="350" y="80" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="0.9rem">
                      No streaming data available yet
                    </text>
                  )}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>30 Days Ago</span>
                  <span>2 Weeks Ago</span>
                  <span>1 Week Ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Top Songs Breakdown Table */}
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#fff' }}>Track Performance Breakdown</h3>
              {!stats?.topSongs?.length ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Upload your tracks to see individual stream breakdowns.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 12px' }}>Track</th>
                        <th style={{ padding: '10px 12px' }}>Genre</th>
                        <th style={{ padding: '10px 12px' }}>Total Plays</th>
                        <th style={{ padding: '10px 12px' }}>Likes</th>
                        <th style={{ padding: '10px 12px' }}>Estimated Royalties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topSongs.map((song: any) => (
                        <tr key={song._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className="fas fa-music" style={{ color: 'var(--accent-color)' }} />
                            {song.title}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{song.genre || 'Afrobeat'}</td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>{(song.plays || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px', color: '#4ade80' }}>{(song.likes || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px', color: 'var(--accent-color)', fontWeight: 700 }}>
                            XAF {((song.plays || 0) * 1.5).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Interaction */}
      {activeView === 'social' && (
        <div className="section-card">
          <div className="section-header"><h2>Fan Interaction</h2></div>
          <p style={{ color: 'var(--text-muted)' }}>You have {stats?.followers || 0} followers.</p>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: 'var(--text-white)', marginBottom: 16 }}>Recent Comments & Feedback</h3>
            <select className="search-input-db" value={commentSongFilter} onChange={e => setCommentSongFilter(e.target.value)} style={{ marginBottom: 16 }}>
              <option value="all">All songs</option>
              {[...new Map(artistComments.filter(c => c.songId?._id).map(c => [c.songId._id, c.songId])).values()].map((song: any) => <option key={song._id} value={song._id}>{song.title}</option>)}
            </select>
            {artistComments.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                <i className="fas fa-comments" style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: 12 }} />
                <p>No comments on your songs yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {artistComments.filter((c: any) => commentSongFilter === 'all' || c.songId?._id === commentSongFilter).map((c: any) => (
                  <div key={c._id} style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-white)' }}>{c.userId?.name || 'Anonymous Fan'}</div>
                    <div style={{ fontSize: '0.9rem', marginTop: 4 }}>{c.content}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      On song: {c.songId?.title || 'Unknown'} • {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button className="btn-camsound-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={async () => { if (c.songId?._id) { await commentsService.pinComment(c.songId._id, c._id, !c.isPinned); fetchArtistComments(); } }}>
                        <i className="fas fa-thumbtack" /> {c.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button className="btn-camsound-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={async () => { if (c.songId?._id) { await commentsService.deleteComment(c.songId._id, c._id); fetchArtistComments(); } }}>
                        <i className="fas fa-trash" /> Delete
                      </button>
                      <button className="btn-camsound-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)}>
                        <i className="fas fa-reply" /> Reply
                      </button>
                    </div>
                    {replyingTo === c._id && <form onSubmit={e => { e.preventDefault(); void handleReply(c); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input className="search-input-db" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." />
                      <button className="btn-camsound-yellow" type="submit" disabled={!replyText.trim()}>Send</button>
                    </form>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue & Royalties */}
      {activeView === 'revenue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="section-card">
            <div className="section-header"><h2>Available Balance</h2></div>
            <h1 style={{ color: 'var(--accent-color)', fontSize: '2.5rem', margin: '0 0 8px' }}>XAF {revenueBalance.toLocaleString()}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 20px' }}>Available for withdrawal</p>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(250,204,21,0.08)', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 20 }}>Min: 5,000 FCFA • Max: 10,000 FCFA/day • Processed on 15th</div>
            <div className="form-field">
              <label>Withdrawal Amount</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                className="search-input-db"
                value={withdrawalAmount}
                onChange={e => setWithdrawalAmount(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Mobile Money Number</label>
              <input
                type="text"
                placeholder="e.g. 670000000"
                className="search-input-db"
                value={withdrawalMomoNumber}
                onChange={e => setWithdrawalMomoNumber(e.target.value)}
              />
            </div>
            <button className="btn-camsound-yellow" style={{ width: '100%' }} onClick={handleRequestWithdrawal} disabled={isRequestingWithdrawal}>
              {isRequestingWithdrawal ? 'Submitting...' : 'Request Withdrawal'}
            </button>
            {withdrawalMessage && (
              <p style={{ marginTop: 12, color: withdrawalMessage.includes('successfully') ? '#27ae60' : 'var(--text-muted)' }}>
                {withdrawalMessage}
              </p>
            )}
          </div>
          <div className="section-card">
            <div className="section-header"><h2>Withdrawal History</h2></div>
            {withdrawals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No withdrawals yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {withdrawals.map(w => (
                  <div key={w._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>XAF {w.amount}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(w.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: w.status === 'completed' ? '#51cf66' : 'var(--text-muted)' }}>{w.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Plan */}
      {activeView === 'subscription' && (
        <div className="section-card">
          <div className="section-header"><h2>Artist Subscription Plans</h2><button className="btn-camsound-outline" onClick={() => { setShowBilling(true); fetchBillingHistory(); }}><i className="fas fa-receipt" /> Manage Billing</button></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {plans.map(p => (
              <div key={p._id} style={{ padding: 24, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 12px' }}>{p.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: 24 }}>XAF {p.price}</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 24, minHeight: 60 }}>{p.description}</div>
                <button
                  className="btn-camsound-outline"
                  style={{ width: '100%' }}
                  onClick={() => handleSubscribe(p)}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Processing...' : 'Subscribe'}
                </button>
                {isSubscribing && <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simulated payment in progress.</p>}
              </div>
            ))}
            {plans.length === 0 && <p>Loading plans...</p>}
          </div>
          {subscriptionMessage && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(39, 174, 96, 0.08)', color: '#27ae60' }}>
              {subscriptionMessage}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {activeView === 'notifications' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Notifications</h2>
            {notifications.length > 0 && (
              <button className="btn-camsound-outline" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={async () => { await notificationsService.markAllRead(); fetchNotifications(); }}>
                Mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-bell-slash" style={{ fontSize: '2.5rem', opacity: 0.4, display: 'block', marginBottom: 12 }} />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map(n => (
                <div key={n._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: n.isRead ? 'var(--bg-tertiary)' : 'rgba(250,204,21,0.06)', border: '1px solid', borderColor: n.isRead ? 'var(--border-color)' : 'rgba(250,204,21,0.2)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <i className="fas fa-info-circle" style={{ color: n.isRead ? 'var(--text-muted)' : 'var(--accent-color)' }} />
                    <span style={{ fontSize: '0.9rem', color: n.isRead ? 'var(--text-light)' : 'var(--text-white)', fontWeight: n.isRead ? 400 : 600 }}>{n.message}</span>
                  </div>
                  {!n.isRead && <button className="view-all-btn" onClick={async () => { await notificationsService.markRead(n._id); fetchNotifications(); }}>Mark read</button>}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 14px' }}>Notification Preferences</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {[
                ['notif_new_followers', 'New Followers'], ['notif_comments', 'Comments'], ['notif_stream_milestones', 'Stream Milestones'], ['notif_revenue_updates', 'Revenue Updates'], ['notif_marketing', 'Marketing']
              ].map(([key, label]) => <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 8 }}><input type="checkbox" checked={!!(notificationPrefs as any)[key]} onChange={e => setNotificationPrefs(p => ({ ...p, [key]: e.target.checked }))} />{label}</label>)}
            </div>
            <button className="btn-camsound-outline" style={{ marginTop: 14 }} onClick={async () => { try { await notificationSettingsService.updateSettings(notificationPrefs); setNotificationPrefsMessage('Preferences saved.'); } catch { setNotificationPrefsMessage('Unable to save preferences.'); } setTimeout(() => setNotificationPrefsMessage(''), 3000); }}>Save Notification Settings</button>
            {notificationPrefsMessage && <span style={{ marginLeft: 12, color: 'var(--accent-color)', fontSize: '0.85rem' }}>{notificationPrefsMessage}</span>}
          </div>
        </div>
      )}

      {showBilling && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="section-card" style={{ width: '100%', maxWidth: 620, maxHeight: '85vh', overflow: 'auto' }}>
            <div className="section-header"><h2>Billing History</h2><button className="btn-camsound-outline" onClick={() => setShowBilling(false)} aria-label="Close billing history"><i className="fas fa-times" /></button></div>
            <p style={{ color: 'var(--text-muted)' }}>Current payment method: Mobile Money</p>
            {billingHistory.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No billing records yet.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{billingHistory.map(payment => <div key={payment._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}><span>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}</span><strong>XAF {payment.amount || 0}</strong><span>{payment.status || 'pending'}</span></div>)}</div>}
          </div>
        </div>
      )}

      {/* Edit Song Modal */}
      {editingSong && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px', color: '#fff' }}>Edit Track</h3>
            <div className="form-field" style={{ marginBottom: 16 }}>
              <label>Track Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="search-input-db"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 20 }}>
              <label>Genre</label>
              <select
                value={editForm.genre}
                onChange={e => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                className="search-input-db"
              >
                {['Afrobeat','Makossa','Bikutsi','Assiko','Hip Hop','R&B','Ndombolo','Highlife'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setEditingSong(null)}
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ flex: 1, padding: '10px', background: 'var(--accent-color)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default ArtistDashboard;

