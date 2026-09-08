// AfroRhythm - Unified Audio Player Engine
// Handles both the Modal Player and the Persistent Footer Player Bar
// Reports plays/history to backend/api/track.php

(function () {
    'use strict';

    const playerStyles = `
        body.afro-player-page {
            padding-bottom: 108px;
        }

        body.afro-player-page .content-area,
        body.afro-player-page #page-content-wrapper,
        body.afro-player-page .page-content,
        body.afro-player-page .container-fluid.page-content {
            padding-bottom: 120px !important;
        }

        #persistentPlayer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            min-height: 96px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 14px 26px;
            background: linear-gradient(180deg, rgba(18, 26, 21, 0.94), rgba(8, 12, 10, 0.98));
            backdrop-filter: blur(24px) saturate(140%);
            border-top: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 -18px 38px rgba(0,0,0,0.42);
            z-index: 1100;
            transition: background 0.25s ease, box-shadow 0.25s ease;
        }

        #persistentPlayer.player-active {
            box-shadow: 0 -20px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(250, 204, 21, 0.08) inset;
        }

        #persistentPlayer .now-playing-info,
        #persistentPlayer .now-playing-details,
        #persistentPlayer .now-playing-controls-wrapper {
            min-width: 0;
        }

        #persistentPlayer .now-playing-info {
            display: flex;
            align-items: center;
            gap: 15px;
            min-width: 240px;
            max-width: 320px;
            flex: 0 1 320px;
        }

        #persistentPlayer .now-playing-cover {
            width: 62px;
            height: 62px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(13, 110, 90, 0.9), rgba(251, 191, 36, 0.38));
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 20px;
            box-shadow: 0 14px 22px rgba(0,0,0,0.28);
            overflow: hidden;
            flex-shrink: 0;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        #persistentPlayer .now-playing-cover:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 26px rgba(0,0,0,0.35);
        }

        #persistentPlayer .now-playing-details {
            cursor: pointer;
        }

        #persistentPlayer .now-playing-details h5 {
            margin: 0;
            font-size: 0.98rem;
            font-weight: 700;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #persistentPlayer .now-playing-details p {
            margin: 4px 0 0;
            font-size: 0.85rem;
            color: rgba(255,255,255,0.66);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #persistentPlayer .now-playing-details:hover h5,
        #persistentPlayer .now-playing-details:hover p {
            color: #ffffff;
        }

        #persistentPlayer .now-playing-controls-wrapper {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        #persistentPlayer .now-playing-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        #persistentPlayer .control-btn {
            width: 42px;
            height: 42px;
            background: rgba(255,255,255,0.04);
            border: none;
            color: #fff;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            padding: 0;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        #persistentPlayer .control-btn:hover {
            color: #fbbf24;
            background: rgba(255,255,255,0.1);
            transform: translateY(-1px) scale(1.03);
        }

        #persistentPlayer .control-btn.play-btn {
            width: 52px;
            height: 52px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: #0b0f0c;
            box-shadow: 0 10px 20px rgba(245, 158, 11, 0.28);
        }

        #persistentPlayer .control-btn.play-btn:hover {
            background: linear-gradient(135deg, #fde047, #fbbf24);
            box-shadow: 0 16px 26px rgba(245, 158, 11, 0.34);
        }

        #persistentPlayer .progress-container {
            width: min(100%, 520px);
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 10px;
        }

        #persistentPlayer .time {
            font-size: 0.72rem;
            color: rgba(255,255,255,0.58);
            min-width: 38px;
            font-variant-numeric: tabular-nums;
        }

        #persistentPlayer .progress-bar {
            flex: 1;
            background: rgba(255,255,255,0.12);
            height: 5px;
            border-radius: 999px;
            cursor: pointer;
            position: relative;
            overflow: visible;
            transition: height 0.15s ease, background 0.2s ease;
        }

        #persistentPlayer .progress-bar:hover,
        #persistentPlayer .progress-bar.is-dragging {
            height: 7px;
            background: rgba(255,255,255,0.18);
        }

        #persistentPlayer .progress-fill {
            background: linear-gradient(90deg, #fbbf24, #34d399);
            height: 100%;
            width: 0%;
            border-radius: inherit;
            position: relative;
            transition: width 0.1s linear;
        }

        #persistentPlayer .progress-fill::after {
            content: '';
            position: absolute;
            right: -7px;
            top: 50%;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid rgba(11, 15, 12, 0.85);
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            transform: translateY(-50%) scale(0);
            transition: transform 0.18s ease;
        }

        #persistentPlayer .progress-bar:hover .progress-fill::after,
        #persistentPlayer .progress-bar.is-dragging .progress-fill::after {
            transform: translateY(-50%) scale(1);
        }

        #persistentPlayer .now-playing-extra {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 0 0 auto;
        }

        #persistentPlayer .volume-control {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #persistentPlayer .volume-btn {
            background: none;
            border: none;
            color: rgba(255,255,255,0.82);
            padding: 0;
            cursor: pointer;
        }

        #persistentPlayer .volume-slider {
            width: 110px;
            height: 4px;
            border-radius: 999px;
            background: rgba(255,255,255,0.12);
            position: relative;
            cursor: pointer;
            overflow: visible;
            display: block !important;
        }

        #persistentPlayer .volume-level {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #34d399, #fbbf24);
            position: relative;
        }

        #persistentPlayer .volume-level::after {
            content: '';
            position: absolute;
            right: -6px;
            top: 50%;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #fff;
            transform: translateY(-50%) scale(0);
            transition: transform 0.18s ease;
        }

        #persistentPlayer .volume-slider:hover .volume-level::after,
        #persistentPlayer .volume-slider.is-dragging .volume-level::after {
            transform: translateY(-50%) scale(1);
        }

        @media (max-width: 991px) {
            #persistentPlayer .now-playing-extra {
                display: none;
            }
        }

        @media (max-width: 768px) {
            body.afro-player-page {
                padding-bottom: 92px;
            }

            #persistentPlayer {
                min-height: 84px;
                padding: 12px 14px;
                gap: 12px;
            }

            #persistentPlayer .now-playing-info {
                min-width: 0;
                max-width: 45%;
            }

            #persistentPlayer .now-playing-cover {
                width: 52px;
                height: 52px;
            }

            #persistentPlayer .progress-container {
                display: none;
            }
        }

        .afro-modal-progress {
            height: 5px;
            cursor: pointer;
            background: rgba(255,255,255,0.12);
            border-radius: 999px;
            position: relative;
            overflow: visible;
            transition: height 0.15s ease, background 0.2s ease;
        }

        .afro-modal-progress:hover,
        .afro-modal-progress.is-dragging {
            height: 7px;
            background: rgba(255,255,255,0.18);
        }

        .afro-modal-progress-fill {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #fbbf24, #34d399);
            border-radius: inherit;
            position: relative;
            transition: width 0.1s linear;
        }

        .afro-modal-progress-fill::after {
            content: '';
            position: absolute;
            right: -7px;
            top: 50%;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid rgba(13, 18, 16, 0.92);
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            transform: translateY(-50%) scale(0);
            transition: transform 0.18s ease;
        }

        .afro-modal-progress:hover .afro-modal-progress-fill::after,
        .afro-modal-progress.is-dragging .afro-modal-progress-fill::after {
            transform: translateY(-50%) scale(1);
        }

        #playPauseBtn.playing {
            transform: scale(1.04);
            box-shadow: 0 14px 26px rgba(251, 191, 36, 0.28);
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = playerStyles;
    document.head.appendChild(styleEl);

    // Player State
    let audio = null;
    let currentSong = null;
    let allSongs = [];
    let currentIndex = -1;
    let isPlaying = false;
    let isSeeking = false;
    let activeSeekBar = null;

    // Fetch songs from backend to populate the playlist
    async function fetchSongs() {
        try {
            const res = await fetch('backend/api/songs.php');
            const json = await res.json();
            if (json.success && json.data) {
                allSongs = json.data.map(s => ({
                    id: s.id,
                    title: s.title || 'Unknown',
                    artist: s.artist_name || 'Unknown Artist',
                    filePath: s.file_path ? s.file_path.replace(/^\/+/, '') : '',
                    coverArt: s.cover_art ? s.cover_art.replace(/^\/+/, '') : 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
                }));
            }
        } catch (err) {
            console.error('Failed to load songs:', err);
        }
    }

    function getPersistentPlayerHTML() {
        return `
            <div class="now-playing" id="persistentPlayer">
                <div class="now-playing-info">
                    <div class="now-playing-cover" id="nowPlayingCoverFooter">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="now-playing-details">
                        <h5 id="nowPlayingTitleFooter">Not Playing</h5>
                        <p id="nowPlayingArtistFooter">Select a song to start</p>
                    </div>
                </div>
                <div class="now-playing-controls-wrapper">
                    <div class="now-playing-controls">
                        <button class="control-btn" id="prevBtnFooter"><i class="fas fa-step-backward"></i></button>
                        <button class="control-btn play-btn" id="playPauseBtnFooter"><i class="fas fa-play"></i></button>
                        <button class="control-btn" id="nextBtnFooter"><i class="fas fa-step-forward"></i></button>
                    </div>
                    <div class="progress-container">
                        <span class="time" id="currentTimeFooter">0:00</span>
                        <div class="progress-bar" id="progressBarFooter">
                            <div class="progress-fill" id="progressFillFooter" style="width: 0%"></div>
                        </div>
                        <span class="time" id="totalTimeFooter">0:00</span>
                    </div>
                </div>
                <div class="now-playing-extra">
                    <div class="volume-control">
                        <button class="volume-btn" type="button"><i class="fas fa-volume-up"></i></button>
                        <div class="volume-slider">
                            <div class="volume-level" style="width: 80%"></div>
                        </div>
                    </div>
                    <button class="control-btn" type="button" title="Open Player" id="openPlayerBtnFooter"><i class="fas fa-expand"></i></button>
                </div>
            </div>
        `;
    }

    function createPersistentPlayer() {
        const existingPlayer = document.getElementById('persistentPlayer');
        const footerHTML = getPersistentPlayerHTML();

        if (existingPlayer) {
            existingPlayer.outerHTML = footerHTML;
            document.body.classList.add('afro-player-page');
            return;
        }

        document.body.insertAdjacentHTML('beforeend', footerHTML);
        document.body.classList.add('afro-player-page');
    }

    // Initialize Audio Engine
    function initAudio() {
        if (audio) return;
        audio = new Audio();
        audio.volume = 0.8;
        updateVolumeUI();

        audio.addEventListener('play', () => {
            isPlaying = true;
            updateGlobalUIState();
        });

        audio.addEventListener('pause', () => {
            isPlaying = false;
            updateGlobalUIState();
        });

        audio.addEventListener('timeupdate', () => {
            updateProgress();
        });

        audio.addEventListener('loadedmetadata', () => {
            updateProgress();
        });

        audio.addEventListener('volumechange', () => {
            updateVolumeUI();
        });

        audio.addEventListener('ended', () => {
            playNext();
        });

        audio.addEventListener('error', (e) => {
            console.error('Playback error:', e);
            // Don't alert here unless necessary, maybe show a toast
        });
    }

    // Sync UI across all player components (Modal + Persistent)
    function updateGlobalUIState() {
        const playPauseIcons = [
            document.getElementById('playPauseIcon'),      // Modal
            document.querySelector('#playPauseBtnFooter i') // Footer
        ];

        playPauseIcons.forEach(icon => {
            if (icon) {
                if (isPlaying) {
                    icon.className = 'fas fa-pause';
                } else {
                    icon.className = 'fas fa-play';
                }
            }
        });
        
        // Modal specific
        const modalPlayBtn = document.getElementById('playPauseBtn');
        if (modalPlayBtn) {
           modalPlayBtn.classList.toggle('playing', isPlaying);
        }

        const persistentPlayer = document.getElementById('persistentPlayer');
        if (persistentPlayer) {
            persistentPlayer.classList.toggle('player-active', Boolean(currentSong));
        }
    }

    function updateMetadataUI(song) {
        if (!song) return;

        // Modal Elements
        const modalTitle = document.getElementById('playingSongTitle');
        const modalArtist = document.getElementById('playingSongGenre');
        const modalArt = document.getElementById('playingAlbumArt');
        
        // Footer Elements
        const footerTitle = document.getElementById('nowPlayingTitleFooter');
        const footerArtist = document.getElementById('nowPlayingArtistFooter');
        const footerArt = document.getElementById('nowPlayingCoverFooter');

        // Update Modal
        if (modalTitle) modalTitle.textContent = song.title;
        if (modalArtist) modalArtist.textContent = song.artist;
        if (modalArt) modalArt.src = song.coverArt;

        // Update Footer
        if (footerTitle) footerTitle.textContent = song.title;
        if (footerArtist) footerArtist.textContent = song.artist;
        if (footerArt) {
           if (song.coverArt) {
               footerArt.style.backgroundImage = `url('${song.coverArt}')`;
               footerArt.style.backgroundSize = 'cover';
               footerArt.style.backgroundPosition = 'center';
               footerArt.innerHTML = ''; 
           } else {
               footerArt.innerHTML = '<i class="fas fa-music"></i>';
               footerArt.style.backgroundImage = 'none';
           }
        }
        
        // Also update the static dashboard "Now Playing" if it exists
        const staticTitle = document.getElementById('nowPlayingTitle');
        const staticArtist = document.getElementById('nowPlayingArtist');
        if (staticTitle) staticTitle.textContent = song.title;
        if (staticArtist) staticArtist.textContent = song.artist;

        const persistentPlayer = document.getElementById('persistentPlayer');
        if (persistentPlayer) {
            persistentPlayer.classList.add('player-active');
        }
    }

    function updateProgress() {
        if (!audio) return;

        if (!audio.duration || Number.isNaN(audio.duration)) {
            const modalCurrent = document.getElementById('currentTime');
            const modalTotal = document.getElementById('totalTime');
            const footerCurrent = document.getElementById('currentTimeFooter');
            const footerTotal = document.getElementById('totalTimeFooter');
            if (modalCurrent) modalCurrent.textContent = formatTime(audio.currentTime || 0);
            if (modalTotal) modalTotal.textContent = '0:00';
            if (footerCurrent) footerCurrent.textContent = formatTime(audio.currentTime || 0);
            if (footerTotal) footerTotal.textContent = '0:00';
            return;
        }

        const percent = (audio.currentTime / audio.duration) * 100;
        const currentTimeStr = formatTime(audio.currentTime);
        const totalTimeStr = formatTime(audio.duration);

        // Modal Progress
        const modalFill = document.getElementById('progressFill');
        const modalCurrent = document.getElementById('currentTime');
        const modalTotal = document.getElementById('totalTime');
        if (modalFill) modalFill.style.width = `${percent}%`;
        if (modalCurrent) modalCurrent.textContent = currentTimeStr;
        if (modalTotal) modalTotal.textContent = totalTimeStr;

        // Footer Progress
        const footerFill = document.getElementById('progressFillFooter');
        const footerCurrent = document.getElementById('currentTimeFooter');
        const footerTotal = document.getElementById('totalTimeFooter');
        if (footerFill) footerFill.style.width = `${percent}%`;
        if (footerCurrent) footerCurrent.textContent = currentTimeStr;
        if (footerTotal) footerTotal.textContent = totalTimeStr;
    }

    function updateVolumeUI() {
        const sliderFill = document.querySelector('#persistentPlayer .volume-level');
        const sliderWrap = document.querySelector('#persistentPlayer .volume-slider');
        const volumeIcon = document.querySelector('#persistentPlayer .volume-btn i');
        const volumeValue = audio ? audio.volume : 0.8;

        if (sliderFill) {
            sliderFill.style.width = `${Math.round(volumeValue * 100)}%`;
        }

        if (sliderWrap) {
            sliderWrap.setAttribute('aria-valuenow', String(Math.round(volumeValue * 100)));
        }

        if (volumeIcon) {
            if (volumeValue === 0) volumeIcon.className = 'fas fa-volume-mute';
            else if (volumeValue < 0.5) volumeIcon.className = 'fas fa-volume-down';
            else volumeIcon.className = 'fas fa-volume-up';
        }
    }

    function formatTime(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    }

    function seekFromClientX(bar, clientX) {
        if (!bar) return;
        const rect = bar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        window.afroPlayer.seek(pct);
    }

    function setSeekDragging(bar, dragging) {
        if (bar) {
            bar.classList.toggle('is-dragging', dragging);
        }
    }

    function attachSeekBar(bar) {
        if (!bar) return;

        bar.addEventListener('pointerdown', (e) => {
            isSeeking = true;
            activeSeekBar = bar;
            setSeekDragging(bar, true);
            seekFromClientX(bar, e.clientX);
        });
    }

    function setVolumeFromClientX(slider, clientX) {
        if (!slider) return;
        const rect = slider.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        window.afroPlayer.setVolume(Math.round(pct * 100));
    }

    function attachVolumeSlider(slider) {
        if (!slider) return;

        slider.addEventListener('pointerdown', (e) => {
            slider.classList.add('is-dragging');
            setVolumeFromClientX(slider, e.clientX);
        });
    }

    function openPlayerModal() {
        const modalEl = document.getElementById('audioPlayerModal');
        if (!modalEl) return;
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }

    // Core Controls
    async function playSong(song) {
        if (!song) return;
        initAudio();
        
        currentSong = song;
        currentIndex = allSongs.findIndex(s => s.id === song.id);

        // Report to backend
        try {
            fetch('backend/api/track.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'play', id: song.id }),
                headers: { 'Content-Type': 'application/json' }
            });
            fetch('backend/api/track.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'history', id: song.id }),
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) { console.error("Track error:", e); }

        updateMetadataUI(song);
        
        audio.src = song.filePath;
        audio.load();
        audio.play().catch(err => {
            console.error('Playback error:', err);
            // toast error?
        });
    }

    function toggle() {
        if (!audio || !currentSong) {
            // If nothing loaded, play first song
            if (allSongs.length > 0) {
                playSong(allSongs[0]);
            }
            return;
        }
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }

    function playNext() {
        if (allSongs.length === 0) return;
        let nextIdx = (currentIndex + 1) % allSongs.length;
        playSong(allSongs[nextIdx]);
    }

    function playPrevious() {
        if (allSongs.length === 0) return;
        let prevIdx = (currentIndex - 1 + allSongs.length) % allSongs.length;
        playSong(allSongs[prevIdx]);
    }

    // Export to Window
    window.afroPlayer = {
        playById: function(id) {
            const song = allSongs.find(s => s.id == id);
            if (song) playSong(song);
            else console.error('Song not found in afroPlayer list:', id);
        },
        playSongInModal: function(id) {
            this.playById(id);
            // Show bootstrap modal
            const modalEl = document.getElementById('audioPlayerModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        },
        toggle: toggle,
        next: playNext,
        prev: playPrevious,
        setVolume: function(v) {
            if (audio) audio.volume = v / 100;
        },
        seek: function(pct) {
            if (audio && audio.duration) {
                audio.currentTime = pct * audio.duration;
            }
        }
    };

    // Legacy compatibility for fan.js
    window.playSongInModal = window.afroPlayer.playSongInModal.bind(window.afroPlayer);
    window.afroPlayById = window.afroPlayer.playById.bind(window.afroPlayer);

    // Bootstrap Modal Creation
    function getPlayerModalHTML() {
        return `
            <div class="modal fade" id="audioPlayerModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="background: linear-gradient(180deg, rgba(18, 21, 26, 0.96), rgba(10, 13, 16, 0.98)); backdrop-filter: blur(24px); color: #f8f9fa; border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; box-shadow: 0 30px 60px -18px rgba(0, 0, 0, 0.58);">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title fs-6 text-muted fw-bold" id="modalPlayerHeader" data-translate="Now Playing">Now Playing</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="text-center mb-4">
                                <img id="playingAlbumArt" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%232a2a3e' stroke='%23444' stroke-width='2'/%3E%3C/svg%3E" 
                                     alt="Album Art" 
                                     style="width: 240px; height: 240px; border-radius: 20px; object-fit: cover; box-shadow: 0 15px 30px rgba(0,0,0,0.3);">
                            </div>
                            <div class="text-center mb-4">
                                <h4 id="playingSongTitle" class="mb-1 text-white truncate px-3" style="font-weight: 800; font-size: 1.5rem;">Song Title</h4>
                                <p id="playingSongGenre" class="mb-0 text-primary truncate px-3" style="font-weight: 600; font-size: 1rem; opacity: 0.8;">Artist</p>
                            </div>
                            
                            <!-- Progress -->
                            <div class="mb-4 px-2">
                                <div class="d-flex justify-content-between mb-2 text-muted" style="font-size: 0.75rem; font-weight: 600;">
                                    <span id="currentTime">0:00</span>
                                    <span id="totalTime">0:00</span>
                                </div>
                                <div class="afro-modal-progress" id="progressBar">
                                    <div class="afro-modal-progress-fill" id="progressFill"></div>
                                </div>
                            </div>

                            <!-- Controls -->
                            <div class="d-flex justify-content-center align-items-center gap-4 mb-4">
                                <button class="btn btn-link text-white p-0 opacity-75 hover-opacity-100" id="prevBtn" style="font-size: 1.25rem;">
                                    <i class="fas fa-step-backward"></i>
                                </button>
                                <button class="btn btn-primary d-flex align-items-center justify-content-center" id="playPauseBtn" 
                                        style="width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, #FF6B35, #2E8B57); border: none; box-shadow: 0 10px 20px rgba(255, 107, 53, 0.3); transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                                    <i class="fas fa-play fa-lg" id="playPauseIcon" style="margin-left: 3px;"></i>
                                </button>
                                <button class="btn btn-link text-white p-0 opacity-75 hover-opacity-100" id="nextBtn" style="font-size: 1.25rem;">
                                    <i class="fas fa-step-forward"></i>
                                </button>
                            </div>

                            <!-- Volume -->
                            <div class="d-flex align-items-center gap-3 px-3">
                                <i class="fas fa-volume-down text-muted"></i>
                                <input type="range" class="form-range flex-grow-1" id="volumeSlider" min="0" max="100" value="80" 
                                       style="height: 4px; accent-color: #2E8B57;">
                                <i class="fas fa-volume-up text-muted"></i>
                            </div>
                        </div>
                        <div class="modal-footer border-0 pt-0 pb-4 justify-content-center gap-3">
                            <button type="button" class="btn btn-dark btn-sm rounded-pill px-3" id="downloadBtn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                                <i class="fas fa-download me-2"></i> Download
                            </button>
                            <button type="button" class="btn btn-dark btn-sm rounded-pill px-3" data-bs-dismiss="modal" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                                <i class="fas fa-compress-alt me-2 text-muted"></i> Minimize
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function createPlayerModal() {
        const existingModal = document.getElementById('audioPlayerModal');
        const modalHTML = getPlayerModalHTML();

        if (existingModal) {
            existingModal.outerHTML = modalHTML;
            return;
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function setupEventListeners() {
        attachSeekBar(document.getElementById('progressBar'));
        attachSeekBar(document.getElementById('progressBarFooter'));
        attachVolumeSlider(document.querySelector('#persistentPlayer .volume-slider'));

        // Modal Controls
        document.body.addEventListener('click', (e) => {
           if (e.target.closest('#playPauseBtn')) toggle();
           if (e.target.closest('#prevBtn')) playPrevious();
           if (e.target.closest('#nextBtn')) playNext();
           if (e.target.closest('#nowPlayingCoverFooter, .now-playing-details')) openPlayerModal();
        });

        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.oninput = (e) => window.afroPlayer.setVolume(e.target.value);
        }

        // Footer Controls
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('#prevBtnFooter')) playPrevious();
            if (e.target.closest('#playPauseBtnFooter')) toggle();
            if (e.target.closest('#nextBtnFooter')) playNext();
            if (e.target.closest('#openPlayerBtnFooter')) openPlayerModal();
        });

        document.addEventListener('pointermove', (e) => {
            if (isSeeking && activeSeekBar) {
                seekFromClientX(activeSeekBar, e.clientX);
            }

            const draggingVolumeSlider = document.querySelector('#persistentPlayer .volume-slider.is-dragging');
            if (draggingVolumeSlider) {
                setVolumeFromClientX(draggingVolumeSlider, e.clientX);
            }
        });

        document.addEventListener('pointerup', () => {
            if (activeSeekBar) {
                setSeekDragging(activeSeekBar, false);
            }
            isSeeking = false;
            activeSeekBar = null;

            const draggingVolumeSlider = document.querySelector('#persistentPlayer .volume-slider.is-dragging');
            if (draggingVolumeSlider) {
                draggingVolumeSlider.classList.remove('is-dragging');
            }
        });
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', async () => {
        await fetchSongs();
        createPersistentPlayer();
        createPlayerModal();
        setupEventListeners();
        updateVolumeUI();
    });

})();
