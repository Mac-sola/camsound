import React, { useEffect, useState } from 'react';
import { commentsService, songsService } from '../services/api';

const FanCommunity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'discussions' | 'spotlight'>('all');
  const [newPost, setNewPost] = useState('');
  const [songId, setSongId] = useState('');
  const [songs, setSongs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  const fetchPosts = async () => {
    try {
      const res = await commentsService.getRecentActivity();
      if (res.data.success) setPosts(res.data.data);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
    songsService.getSongs({ limit: 100 }).then(res => {
      if (res.data.success) setSongs(res.data.data);
    }).catch(() => setSongs([]));
  }, []);

  const handlePost = async () => {
    if (!newPost.trim() || !songId) return;
    await commentsService.postComment(songId, newPost.trim());
    setNewPost('');
    setSongId('');
    fetchPosts();
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'spotlight') return post.userId?.type === 'artist';
    return true;
  });

  return (
    <div className="section-card">
      <div className="section-header"><h2>Community Hub</h2></div>
      <div className="community-composer" style={{ marginBottom: 20 }}>
        <div className="composer-avatar"><i className="fas fa-user" /></div>
        <div style={{ flex: 1, display: 'grid', gap: 10 }}>
          <select className="search-input-db" value={songId} onChange={e => setSongId(e.target.value)}>
            <option value="">Select a track to discuss</option>
            {songs.map(song => <option key={song._id} value={song._id}>{song.title} - {song.artistId?.name || 'Unknown Artist'}</option>)}
          </select>
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Share your thoughts about this track..."
            className="composer-input"
            rows={3}
          />
          <button onClick={handlePost} className="composer-submit" disabled={!newPost.trim() || !songId}>
            <i className="fas fa-paper-plane" style={{ marginRight: 6 }} />Post
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'discussions', label: 'Discussions' },
          { key: 'spotlight', label: 'Spotlight' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={activeTab === tab.key ? 'btn-camsound-yellow' : 'btn-camsound-outline'} style={{ padding: '6px 14px' }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filteredPosts.map(post => (
          <div key={post._id} style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <i className="fas fa-comment-dots" style={{ color: 'var(--accent-color)' }} />
              <strong>{post.userId?.name || 'Community Member'}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{post.songId?.title || 'Unknown Track'}</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-light)' }}>{post.content}</p>
          </div>
        ))}
        {filteredPosts.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No posts in this section.</div>}
      </div>
    </div>
  );
};

export default FanCommunity;
