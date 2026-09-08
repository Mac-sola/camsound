// AfroRhythm - Simple Bottom Music Player (HTML5 audio)
// Features: play/pause, seek, time, volume, cover, title, artist
// Streams files provided by backend/api/songs.php and reports plays/history to backend/api/track.php

(function () {
    // CSS
    const css = `
    .afro-player{position:fixed;left:0;right:0;bottom:0;background:rgba(18,18,28,0.98);color:#fff;z-index:9999;display:flex;align-items:center;padding:8px 12px;gap:12px;border-top:1px solid rgba(255,255,255,0.03)}
    .afro-player .cover{width:56px;height:56px;border-radius:6px;flex:0 0 56px;overflow:hidden;background:#222;display:flex;align-items:center;justify-content:center}
    .afro-player .cover img{width:100%;height:100%;object-fit:cover}
    .afro-player .meta{flex:1;min-width:0}
    .afro-player .meta .title{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .afro-player .meta .artist{font-size:12px;color:#bdbdbd;margin-top:2px}
    .afro-player .progress-wrap{margin-top:8px;display:flex;align-items:center;gap:8px}
    .afro-player .progress{height:6px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;cursor:pointer;flex:1}
    .afro-player .progress .bar{height:100%;background:linear-gradient(90deg,#FF6B35,#2E8B57);width:0%}
    .afro-player .time{font-size:12px;color:#bdbdbd;min-width:86px;text-align:right}
    .afro-player .controls{display:flex;align-items:center;gap:6px;margin-left:12px}
    .afro-player .btn{background:none;border:none;color:inherit;font-size:18px;cursor:pointer;padding:8px;border-radius:6px}
    .afro-player .volume{width:96px}
    .afro-player .loading{font-size:14px;color:#ffc107;margin-left:6px}
    @media (max-width:600px){ .afro-player{padding:8px} .afro-player .cover{width:44px;height:44px} .afro-player .time{display:none} .afro-player .volume{display:none} }
    `;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    // Build player DOM
    const player = document.createElement('div'); player.className = 'afro-player';
    player.innerHTML = `
        <div class="cover"><img src="https://via.placeholder.com/200?text=Cover" alt="cover"></div>
        <div class="meta">
            <div class="title">No track loaded</div>
            <div class="artist">—</div>
            <div class="progress-wrap">
                <div class="progress" title="Seek"><div class="bar"></div></div>
                <div class="time">0:00 / 0:00</div>
            </div>
        </div>
        <div class="controls">
            <button class="btn prev" title="Previous">⟨⟨</button>
            <button class="btn play" title="Play">▶</button>
            <button class="btn next" title="Next">⟩⟩</button>
            <input type="range" class="volume" min="0" max="1" step="0.01" value="0.8" title="Volume">
            <div class="loading" style="display:none">Loading…</div>
        </div>
    `;
    document.body.appendChild(player);

    // Elements
    const coverImg = player.querySelector('.cover img');
    const titleEl = player.querySelector('.title');
    const artistEl = player.querySelector('.artist');
    const playBtn = player.querySelector('.play');
    const prevBtn = player.querySelector('.prev');
    const nextBtn = player.querySelector('.next');
    const progress = player.querySelector('.progress');
    const bar = player.querySelector('.bar');
    const timeEl = player.querySelector('.time');
    const volumeEl = player.querySelector('.volume');
    const loadingEl = player.querySelector('.loading');

    // Audio state
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    let tracks = [];
    let current = 0;
    let hasReportedPlay = false;
    let tracksReadyPromise = null;

    // Fetch tracks from backend
    async function fetchTracks() {
        try {
            const res = await fetch('backend/api/songs.php');
            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'Failed to load songs');
            tracks = (json.data || []).map(t => ({
                id: t.id,
                title: t.title || 'Unknown',
                artist: t.artist_name || t.artist || 'Unknown artist',
                src: (t.file_path || t.file_path_local || '').replace(/^\/+/, '') || null,
                cover: t.cover_art || null
            })).filter(t => t.src);
            return tracks;
        } catch (err) {
            console.warn('Player fetchTracks error', err);
            return [];
        }
    }

    function formatTime(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60).toString().padStart(2, '0'); return m + ':' + sec; }

    function setTrack(idx) {
        if (!tracks.length) return;
        current = (idx + tracks.length) % tracks.length;
        const t = tracks[current];
        titleEl.textContent = t.title;
        artistEl.textContent = t.artist;
        coverImg.src = t.cover || 'https://via.placeholder.com/200?text=Cover';
        hasReportedPlay = false;
        audio.src = t.src;
        audio.load();
        bar.style.width = '0%';
        timeEl.textContent = '0:00 / 0:00';
    }

    // Server-side user id (from session).
    let serverUserId = null;

    // Play reporting: increment play count once per track play
    async function reportPlay(trackId) {
        try {
            const payload = { action: 'play', id: trackId };
            if (serverUserId) payload.user_id = serverUserId;
            else {
                const user = (window.afro && window.afro.user) ? window.afro.user : null;
                if (user && user.id) payload.user_id = user.id;
            }
            await fetch('backend/api/track.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch (e) { console.warn('reportPlay failed', e); }
    }

    // Save listening history (called when playback starts)
    async function saveHistory(trackId) {
        try {
            const payload = { action: 'history', id: trackId };
            if (serverUserId) {
                payload.user_id = serverUserId;
            } else {
                const user = (window.afro && window.afro.user) ? window.afro.user : null;
                if (!user || !user.id) return; payload.user_id = user.id;
            }
            await fetch('backend/api/track.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch (e) { console.warn('saveHistory failed', e); }
    }

    // Controls
    playBtn.addEventListener('click', () => { if (audio.paused) audio.play(); else audio.pause(); });
    prevBtn.addEventListener('click', () => { setTrack(current - 1); audio.play(); });
    nextBtn.addEventListener('click', () => { setTrack(current + 1); audio.play(); });
    volumeEl.addEventListener('input', (e) => { audio.volume = parseFloat(e.target.value); });
    audio.volume = parseFloat(volumeEl.value);

    // Progress and seeking
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        bar.style.width = pct + '%';
        timeEl.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
    });

    progress.addEventListener('click', (e) => {
        if (!audio.duration) return;
        const rect = progress.getBoundingClientRect();
        const x = e.clientX - rect.left; const pct = x / rect.width; audio.currentTime = pct * audio.duration;
    });

    // Loading indicator
    audio.addEventListener('waiting', () => { loadingEl.style.display = 'inline'; });
    audio.addEventListener('canplay', () => { loadingEl.style.display = 'none'; });
    audio.addEventListener('playing', () => { playBtn.textContent = '❚❚'; if (!hasReportedPlay) { hasReportedPlay = true; const t = tracks[current]; reportPlay(t.id); saveHistory(t.id); } });
    audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });
    audio.addEventListener('ended', () => { setTrack(current + 1); audio.play(); });
    audio.addEventListener('error', (e) => {
        console.error('Audio playback error', e);
        loadingEl.style.display = 'none';
        window.afro.showNotification('Error playing audio: ' + (audio.error ? audio.error.message : 'Unknown error'), 'error');
    });

    async function ensureTracksReady() {
        if (tracks.length) return tracks;
        if (!tracksReadyPromise) {
            tracksReadyPromise = fetchTracks();
        }
        const list = await tracksReadyPromise;
        if (list && list.length && !audio.src) {
            setTrack(0);
        }
        return list;
    }

    // Expose a function to play a specific track id (for song list clicks)
    window.afroPlayById = async function (trackId) {
        await ensureTracksReady();
        const idx = tracks.findIndex(t => t.id == trackId);
        if (idx === -1) {
            console.warn('Track not found in player list', trackId);
            return;
        }
        setTrack(idx);
        audio.play();
    };

    // Init: fetch current session user and tracks
    (async function init() {
        try {
            const me = await fetch('backend/api/session.php', { credentials: 'same-origin' });
            const mj = await me.json();
            if (mj.success && mj.data && mj.data.user) {
                serverUserId = mj.data.user.id;
            }
        } catch (e) {
            console.warn('Player init user fetch failed', e);
        }

        tracksReadyPromise = fetchTracks();
        const list = await tracksReadyPromise;
        if (!list || !list.length) { titleEl.textContent = 'No playable tracks found'; artistEl.textContent = ''; return; }
        setTrack(0);
    })();

})();
