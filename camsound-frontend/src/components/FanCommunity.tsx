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
        setPosts([
          { _id: '1', content: 'Just discovered this new Makossa track — absolutely fire! 🔥', userId: { name: 'Jean-Pierre' }, createdAt: new Date(Date.now() - 120000).toISOString() },
          { _id: '2', content: 'Who else is streaming the new Afrobeat releases? The summer vibes are real!', userId: { name: 'Amina' }, createdAt: new Date(Date.now() - 300000).toISOString() },
          { _id: '3', content: 'Top 5 Cameroonian artists to follow in 2026 — my personal list:', userId: { name: 'Nkuvo' }, createdAt: new Date(Date.now() - 900000).toISOString() },
        ]);
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
      // Refresh
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
      <div className="fan-community-layout">
        {/* Main Feed */}
        <div className="fan-community-main">
          <div className="fan-section-header">
            <h2 className="fan-page-title">👥 Community</h2>
            <p className="fan-page-subtitle">Connect with fellow music lovers</p>
          </div>

          {/* Composer */}
          <div className="fan-composer">
            <div className="fan-composer-header">
              <div className="fan-composer-avatar">
                <span>{user?.name?.charAt(0) ?? 'U'}</span>
              </div>
              <span className="fan-composer-prompt">Share something with the community...</span>
            </div>
            <form onSubmit={handlePost}>
              {/* Song selector */}
              <select
                className="fan-composer-song-select"
                value={selectedSongId}
                onChange={e => setSelectedSongId(e.target.value)}
              >
                <option value="">— Select a song to discuss —</option>
                {songs.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.title}{s.artistId?.name ? ` — ${s.artistId.name}` : ''}
                  </option>
                ))}
              </select>

              <textarea
                className="fan-composer-textarea"
                rows={3}
                placeholder="What's on your mind? Share a thought, recommendation, or reaction..."
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                required
              />
              <div className="fan-composer-actions">
                {submitMsg && <span className="fan-submit-msg">{submitMsg}</span>}
                <button
                  type="submit"
                  className="fan-composer-submit"
                  disabled={submitting || !postContent.trim()}
                >
                  {submitting
                    ? <><i className="fas fa-spinner fa-spin" /> Posting...</>
                    : <><i className="fas fa-paper-plane" /> Post</>}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Tabs */}
          <div className="fan-community-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`fan-community-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >{tab}</button>
            ))}
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="fan-loading"><i className="fas fa-spinner fa-spin" /><span>Loading activity...</span></div>
          ) : (
            <div className="fan-posts-feed">
              {posts.map(post => (
                <div key={post._id} className="fan-post-card">
                  <div className="fan-post-header">
                    <div className="fan-post-avatar">
                      <span>{post.userId?.name?.charAt(0) ?? 'U'}</span>
                    </div>
                    <div className="fan-post-meta">
                      <div className="fan-post-author">{post.userId?.name ?? 'Anonymous'}</div>
                      {post.createdAt && (
                        <div className="fan-post-time">{formatTime(post.createdAt)}</div>
                      )}
                    </div>
                  </div>
                  <div className="fan-post-body">{post.content}</div>
                  <div className="fan-post-actions">
                    <button className="fan-post-action-btn" onClick={() => handleLike(post)} disabled={!getSongId(post)}>
                      <i className="far fa-heart" /> {getSongId(post) && likedSongIds.has(getSongId(post)!) ? 'Unlike song' : 'Like song'}
                    </button>
                    <button className="fan-post-action-btn" onClick={() => setReplyingTo(replyingTo === post._id ? null : post._id)} disabled={!getSongId(post)}>
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
                      />
                      <button type="submit" className="fan-post-action-btn" disabled={!replyContent.trim()}>Send</button>
                    </form>
                  )}
                </div>
              ))}
              {posts.length === 0 && (
                <div className="fan-empty-state">
                  <i className="fas fa-comments" />
                  <h4>No posts yet</h4>
                  <p>Be the first to share something!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — Trending Topics */}
        <div className="fan-community-sidebar">
          <div className="fan-trending-card">
            <h4 className="fan-trending-title">
              <i className="fas fa-fire" /> Trending Topics
            </h4>
            <ul className="fan-trending-list">
              {TRENDING_TOPICS.map((t, i) => (
                <li key={t.label} className="fan-trending-item">
                  <span className="fan-trending-rank">#{i + 1}</span>
                  <span className="fan-trending-label">{t.label}</span>
                  <span className="fan-trending-count">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FanCommunity;
