import React, { useState, useEffect } from 'react';
import { commentsService, favoritesService, songsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Post {
  _id: string;
  content: string;
  userId?: { name?: string; avatar?: string };
  createdAt?: string;
  songId?: { _id?: string; title?: string };
}

interface Song {
  _id: string;
  title: string;
  artistId?: { name?: string };
}

const TABS = ['All', 'Discussions', 'Spotlight'] as const;
type Tab = typeof TABS[number];

const TRENDING_TOPICS = [
  { label: 'New Makossa Drop', count: 134 },
  { label: 'Top Camer Artists 2026', count: 98 },
  { label: 'Afrobeat Summer Playlist', count: 82 },
  { label: 'Best Bikutsi Beats', count: 71 },
  { label: 'Yaoundé Underground', count: 55 },
];

const FanCommunity: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedSongId, setSelectedSongId] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());

  // Load recent community activity
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await commentsService.getRecentActivity();
        setPosts(res.data?.data ?? res.data ?? []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load songs for composer dropdown
  useEffect(() => {
    songsService.getSongs({ limit: 30 }).then(res => {
      setSongs(res.data?.data ?? res.data ?? []);
    }).catch(() => {});
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setSubmitting(true);
    setSubmitMsg('');
    try {
      if (!selectedSongId) {
        setSubmitMsg('Select a song before posting.');
        return;
      }
      await commentsService.postComment(selectedSongId, postContent.trim());
      setPostContent('');
      setSelectedSongId('');
      setSubmitMsg('Post shared! ✅');
      const res = await commentsService.getRecentActivity();
      setPosts(res.data?.data ?? res.data ?? []);
    } catch {
      setSubmitMsg('Unable to share post. Please try again.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitMsg(''), 3000);
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const getSongId = (post: Post) => post.songId?._id;

  const handleLike = async (post: Post) => {
    const songId = getSongId(post);
    if (!songId) return;
    const isLiked = likedSongIds.has(songId);
    try {
      if (isLiked) await favoritesService.unlikeSong(songId);
      else await favoritesService.likeSong(songId);
      setLikedSongIds(current => {
        const next = new Set(current);
        if (isLiked) next.delete(songId); else next.add(songId);
        return next;
      });
    } catch {
      setSubmitMsg('Unable to update favorite. Please try again.');
    }
  };

  const handleReply = async (post: Post) => {
    const songId = getSongId(post);
    if (!songId || !replyContent.trim()) return;
    try {
      await commentsService.postComment(songId, replyContent.trim(), post._id);
      setReplyContent('');
      setReplyingTo(null);
      const res = await commentsService.getRecentActivity();
      setPosts(res.data?.data ?? res.data ?? []);
    } catch {
      setSubmitMsg('Unable to post reply. Please try again.');
    }
  };

  return (
    <div className="fan-community-container">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 20, color: '#4ade80', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
          <i className="fas fa-users" /> FAN LOUNGE
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Community Hub
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
          Connect with fans, discuss track drops, and explore what's trending
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Main Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Composer */}
          <div className="stat-card-premium" style={{ padding: 24, flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="hero-avatar-ring" style={{ padding: 2 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {user?.name?.charAt(0) ?? 'U'}
                </div>
              </div>
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Share a thought with the community</span>
            </div>
            <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select
                value={selectedSongId}
                onChange={e => setSelectedSongId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(18, 26, 22, 0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', outline: 'none', fontSize: '0.88rem' }}
              >
                <option value="">— Select a song to discuss —</option>
                {songs.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.title}{s.artistId?.name ? ` — ${s.artistId.name}` : ''}
                  </option>
                ))}
              </select>

              <textarea
                rows={3}
                placeholder="What's on your mind? Share a recommendation or review..."
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', outline: 'none', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {submitMsg && <span style={{ fontSize: '0.85rem', color: submitMsg.includes('✅') ? '#10b981' : '#ef4444', fontWeight: 600 }}>{submitMsg}</span>}
                <button
                  type="submit"
                  disabled={submitting || !postContent.trim()}
                  style={{
                    marginLeft: 'auto', padding: '8px 20px', background: 'var(--accent-color)', color: '#000',
                    border: 'none', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    opacity: submitting || !postContent.trim() ? 0.5 : 1
                  }}
                >
                  {submitting
                    ? <><i className="fas fa-spinner fa-spin" /> Posting...</>
                    : <><i className="fas fa-paper-plane" /> Post</>}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Tabs */}
          <div style={{ display: 'flex', gap: 10 }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 18px', borderRadius: 20, fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer',
                  background: activeTab === tab ? 'var(--accent-color)' : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab ? '#000' : '#fff'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="fan-loading"><i className="fas fa-spinner fa-spin" /><span>Loading activity...</span></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {posts.map(post => (
                <div key={post._id} className="stat-card-premium" style={{ padding: 20, flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#facc15', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {post.userId?.name?.charAt(0) ?? 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{post.userId?.name ?? 'Anonymous Fan'}</div>
                      {post.createdAt && (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{formatTime(post.createdAt)}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginBottom: 12 }}>{post.content}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                    <button
                      onClick={() => handleLike(post)}
                      disabled={!getSongId(post)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <i className="far fa-heart" style={{ color: getSongId(post) && likedSongIds.has(getSongId(post)!) ? '#ef4444' : 'inherit' }} />
                      {getSongId(post) && likedSongIds.has(getSongId(post)!) ? 'Liked' : 'Like'}
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === post._id ? null : post._id)}
                      disabled={!getSongId(post)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <i className="far fa-comment" /> Reply
                    </button>
                  </div>
                  {replyingTo === post._id && (
                    <form
                      onSubmit={event => { event.preventDefault(); void handleReply(post); }}
                      style={{ display: 'flex', gap: 8, marginTop: 10 }}
                    >
                      <input
                        value={replyContent}
                        onChange={event => setReplyContent(event.target.value)}
                        placeholder="Write a reply..."
                        aria-label="Reply content"
                        required
                        style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                      />
                      <button type="submit" disabled={!replyContent.trim()} style={{ padding: '8px 16px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Send</button>
                    </form>
                  )}
                </div>
              ))}
              {posts.length === 0 && (
                <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <i className="fas fa-comments" style={{ color: 'var(--accent-color)', opacity: 0.4 }} />
                  <h4 style={{ color: '#fff' }}>No posts yet</h4>
                  <p>Be the first to share something with the community!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — Trending Topics */}
        <div className="stat-card-premium" style={{ padding: 24, flexDirection: 'column', alignItems: 'stretch' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-fire" style={{ color: '#f97316' }} /> Trending Topics
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TRENDING_TOPICS.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '0.85rem' }}>#{i + 1}</span>
                  <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>{t.label}</span>
                </div>
                <span className="glass-badge" style={{ fontSize: '0.72rem' }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FanCommunity;

