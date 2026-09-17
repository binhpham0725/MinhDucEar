/**
 * Helper: Format seconds into MM:SS format
 */
function gmdate_min_sec(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '03:30';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * MinhDucEar Pro - Player Engine
 * Real Music Playback (YouTube Music & Database Audio Streams)
 * Interactive Cyberpunk Vinyl & EQ Animation, Google Sign-In & Cloud Sync
 */

class MinhDucAudioEngine {
  constructor() {
    this.isPlaying = false;
    this.volume = 0.8;
    this.currentTrack = null;
    this.currentTrackIndex = -1;
    this.displayedTrackId = null;
    this.isTransitioningTrack = false;
    this.currentTime = 0;
    this.duration = 0;
    this.timerInterval = null;
    this.audioEl = document.getElementById('real-audio-player');
    this.ytPlayer = null;
    this.ytReady = false;
    this.currentSource = 'youtube'; // 'youtube' | 'audio'
    this.isSeeking = false;
    this.isMuted = false;
    try {
      this.currentUser = JSON.parse(localStorage.getItem('minhduc_current_user') || 'null');
      this.syncStats = JSON.parse(localStorage.getItem('minhduc_sync_stats') || 'null');
    } catch (e) {
      this.currentUser = null;
      this.syncStats = null;
    }
    this.isPlaylistEditMode = false;
    this.currentPlaylists = [];
    this.pendingDeletePlaylist = null;
    this.currentSearchCategory = "all";
    this.searchQuery = "";
    this.searchResults = [];
    this.pendingAddToPlaylistTrack = null;
    this.featuredAlbums = [];
    this.featuredAlbumIndex = 0;
    this.featuredAlbumTimer = null;
    this.isShuffle = false;
    this.repeatMode = 'off'; // 'off' | 'all' | 'one'
    this.isHeroHovered = false;

    // Floating Synced Lyrics (Karaoke) state
    this.isFloatingLyricsOpen = false;
    this.currentLyrics = [];
    this.currentLyricsTrackId = null;
    this.activeLyricIndex = -1;

    // Live listening statistics tracking
    this.liveListeningSeconds = 0;
    this.pendingSyncSeconds = 0;
    this.initialLifetimeSeconds = 0;
    this.initialWeeklySeconds = 0;
    this.initialTodaySeconds = 0;
    this.chartMaxMinutes = 30;
    this.sevenDaysChartData = null;
    this.lastActiveTrack = null;
    this.activeFavTab = 'songs'; // 'songs' | 'albums'
    this.isRightMediaPlayerOpen = false;
    this.rightLyrics = [];
    this.activeRightLyricIndex = -1;
    this.currentLyricsTrackKey = null;

    // Real curated tracklist (No synthesized demo loops)
    this.tracks = [
      {
        id: 'yt_p4tTkC9uRvU',
        title: "Farewell of Voyager Star (远航星的告别)",
        artist: "鸣潮先约电台 / Tarokiki / Emi Evans",
        album: "Resonance Chronicles",
        duration: 254,
        format: "FLAC 192kHz 24-bit",
        cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgjdnQliGTIf0xhiSBiil6TjgxEyH-8kQe5jsjqUJcIoqDI6clB-BoBSHKTbfVdIR_QTsOGyz6EzPiDzPj_xokHC5mihJPToNI7WdUEOmvosxtpGV05W9A53x_BSXqJgIyCcZS2dlJDSHzI27eD-giTKzPOcPzdRvcQs7YvtYYlUMOZfbvBy3B3T9-qON25NtTHDPx0gujBhT2ZEpMzW8xHAaM_pWS4G_tvbkMFVRS55WsCylqR_4EQQ",
        badge: "FLAC 24/192",
        source_type: "youtube",
        youtube_id: "p4tTkC9uRvU"
      },
      {
        id: 'yt_4xDzrJKXOOY',
        title: "Midnight Cyber Resonance (Synthwave Chill)",
        artist: "Emily & Synthwave Orchestra",
        album: "Neon Pulse 2088",
        duration: 222,
        format: "FLAC 24b/96k",
        cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuBW7YpaBTLlX_unVrvCPKWyGgYjEWgRxvke5rASbhq_kp8bX3Ln5aFsSpEoEUyot0g6E4LbwGe49Oc_Sm0yv4n2A-FuzejDqMP7VcolTtBwSHrbIG079p8YdtQrAiOsTSc8xmFO--ctMJfLeDJCMdwx9mXh0VWbbGwI8ZhX7fP7CuWL5yY-bq3XprUZJx_ILW3pM3RhILmAlkjbRb03ywm-PoxBexYk89zDGYLPSugIcxRkWBLXrPnHAw",
        badge: "24b/96k",
        source_type: "youtube",
        youtube_id: "4xDzrJKXOOY"
      },
      {
        id: 'yt_jfKfPfyJRdk',
        title: "Lofi Hip Hop - Beats to Relax/Study to",
        artist: "Lofi Girl / ChilledCow",
        album: "Cosmic Study Session",
        duration: 180,
        format: "MASTER SQ 96k",
        cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVa2msyTolydVJp5JAiFOWRrsMGOCglj3DIF-5SSoZStPQNTWG1Zb9VnUMsP3-sh2OarpHEBolCmvMUwONzK2xFANOwPglEtqtBMY-pJXVqrlCZdFVfIb6JeLAAU0AUdzq85LnGv-mLEaF30KVwgTefpoTKvIwo61aqSwVJFhH_XgzSmxLWZcIrvFiSOCPIwDq8a6JsN-4I3v8tnc5kUo20OV0YZakJPxQPPQ6F2QlV5HWUdvAlqVzEA",
        badge: "LO-FI BEATS",
        source_type: "youtube",
        youtube_id: "jfKfPfyJRdk"
      },
      {
        id: 'yt_5qap5aO4i9A',
        title: "Lofi Hip Hop Radio - Beats to Sleep/Chill to",
        artist: "Lofi Girl",
        album: "Midnight Dreamscapes",
        duration: 210,
        format: "FLAC 96k",
        cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuANK028RCNQkaFbYpXj_3Wx2Sy92pt35RUqhOQsieW6qbi-d44bjuasKepQIxXNYjRzEzrR1Zn3UwojRhoH83Wa8_lq2gNMoX2McoK2lWS0v0JHk7XXH7xFY9gOCBIZr5t4Rv68_Y8Zg6AeUgCOYMZRDdc08mjOTcw_oFwqmqHVyT48SflkLemHhcu2HEqIkmxk2iRwUsoTt8CJS-Z72H2CoGLRDx0nufCuXmK1oCmdHMerHm_jaPXk5g",
        badge: "DSD 2.8M",
        source_type: "youtube",
        youtube_id: "5qap5aO4i9A"
      },
      {
        id: 'yt_MVPTGNGiI-4',
        title: "Tokyo Rain Corridor (Synthwave / Retrowave)",
        artist: "Kavinsky / Lorn / The Midnight",
        album: "Retro City Lights",
        duration: 285,
        format: "FLAC 96k",
        cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEpIG2nZINKF7X9Pbv4xBIYr4mE6Epsuns4xkxcWqeEu7qcpyKqV8AjVKSH3KLyk1jaFQDBW0q01vY3MUze_LzH-KgTv7ZMeZOWsCIpsZrijeZQTVUKNAfz2ILsnQShmS0LpsiJtdF1uW7YpicciRSSrFBRlOnbDBlcYe2Y9kfxAzfAnNmMIuwRBVDpHqAyt2kQTshrAuUwy0fQTitUpqZF8vcLsKNsWBMXG94emnqHFwUWU1yslVU0Q",
        badge: "RETRO 96k",
        source_type: "youtube",
        youtube_id: "MVPTGNGiI-4"
      }
    ];

    this.init();
  }

  init() {
    // 1. Purge legacy global keys that leaked history & favorites between accounts
    try {
      localStorage.removeItem('minhduc_recent_history');
      localStorage.removeItem('minhduc_local_favorites');
      localStorage.removeItem('minhduc_fav_albums');
    } catch (e) {}

    this.initTheme();
    this.initYouTube();
    this.initAudioElement();
    this.bindControls();
    this.bindSearch();
    this.bindSidebarNavigation();
    this.bindAuth();
    if (typeof this.bindPlaylistActions === 'function') this.bindPlaylistActions();
    if (typeof this.checkAuthStatus === 'function') this.checkAuthStatus();
    this.bindHeroEvents();
    this.bindHomeMoodChips();
    this.bindMusicTasteModal();
    this.loadFeaturedAlbums();
    if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
    this.loadInitialFeed();
    this.loadWeeklyStats();
    this.renderSidebarRecentTracks();
    this.updateUI();

    // Flush pending listening time on window unload or hidden visibility
    window.addEventListener('beforeunload', () => {
      if (this.pendingSyncSeconds > 0) {
        this.flushListeningTime(true);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.pendingSyncSeconds > 0) {
        this.flushListeningTime(true);
      }
    });
  }

  // Theme Management (Dark / Light Mode)
  initTheme() {
    const urlParams = new URLSearchParams(window.location.search);
    const savedTheme = urlParams.get('theme') || localStorage.getItem('minhduc_theme') || 'dark';
    this.applyTheme(savedTheme);

    const toggleBtn = document.getElementById('btn-theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isCurrentLight = document.documentElement.classList.contains('light');
        const nextTheme = isCurrentLight ? 'dark' : 'light';
        this.applyTheme(nextTheme);

        // Visual feedback micro-animation
        toggleBtn.classList.add('scale-95');
        setTimeout(() => toggleBtn.classList.remove('scale-95'), 150);
      });
    }

    // Support any elements with data-action="toggle-theme"
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isCurrentLight = document.documentElement.classList.contains('light');
        this.applyTheme(isCurrentLight ? 'dark' : 'light');
      });
    });

    // Keyboard shortcut: Alt + T or Ctrl + Shift + D
    document.addEventListener('keydown', (e) => {
      if ((e.altKey && (e.key === 't' || e.key === 'T')) || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault();
        const isCurrentLight = document.documentElement.classList.contains('light');
        this.applyTheme(isCurrentLight ? 'dark' : 'light');
      }
    });
  }

  applyTheme(theme) {
    const isLight = (theme === 'light');
    if (isLight) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }

    try {
      localStorage.setItem('minhduc_theme', isLight ? 'light' : 'dark');
    } catch (e) {}

    // Update header toggle icons
    const iconMoon = document.getElementById('theme-icon-moon');
    const iconSun = document.getElementById('theme-icon-sun');
    if (iconMoon && iconSun) {
      if (isLight) {
        iconMoon.classList.add('hidden');
        iconSun.classList.remove('hidden');
      } else {
        iconMoon.classList.remove('hidden');
        iconSun.classList.add('hidden');
      }
    }

    // Update button title & aria
    const toggleBtn = document.getElementById('btn-theme-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('title', isLight ? 'Chế độ Sáng đang bật (Bấm để chuyển sang Tối)' : 'Chế độ Tối đang bật (Bấm để chuyển sang Sáng)');
      toggleBtn.setAttribute('aria-label', isLight ? 'Chế độ Sáng' : 'Chế độ Tối');
    }

    // Also update any mood button if present
    const moodIconMoon = document.getElementById('mood-icon-moon');
    const moodIconSun = document.getElementById('mood-icon-sun');
    const moodText = document.getElementById('mood-text');
    if (moodIconMoon && moodIconSun) {
      if (isLight) {
        moodIconMoon.classList.add('hidden');
        moodIconSun.classList.remove('hidden');
        if (moodText) moodText.textContent = 'Ngày mới';
      } else {
        moodIconMoon.classList.remove('hidden');
        moodIconSun.classList.add('hidden');
        if (moodText) moodText.textContent = 'Đêm muộn';
      }
    }

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: isLight ? 'light' : 'dark' } }));
  }

  resolveApiUrl(path) {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (window.location.port === '5500' || window.location.protocol === 'file:') {
      return 'http://localhost/MinhDucEar/' + path.replace(/^\//, '');
    }
    return path;
  }

  async safeFetchJson(url, options = {}) {
    const fullUrl = this.resolveApiUrl(url);
    try {
      const res = await fetch(fullUrl, options);
      if (!res.ok) {
        if (fullUrl !== url) {
          try {
            const resFb = await fetch(url, options);
            if (!resFb.ok) return null;
            const textFb = await resFb.text();
            return textFb ? JSON.parse(textFb) : null;
          } catch (e2) {
            return null;
          }
        }
        return null;
      }
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (err) {
      if (fullUrl !== url) {
        try {
          const resFb = await fetch(url, options);
          if (!resFb.ok) return null;
          const textFb = await resFb.text();
          return textFb ? JSON.parse(textFb) : null;
        } catch (e3) {
          return null;
        }
      }
      return null;
    }
  }

  // 1. YouTube IFrame API Initialization
  initYouTube() {
    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return false;
      if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') return true;

      const initialVideoId = (this.tracks[this.currentTrackIndex] && this.tracks[this.currentTrackIndex].youtube_id)
        ? this.tracks[this.currentTrackIndex].youtube_id
        : 'p4tTkC9uRvU';

      try {
        this.ytPlayer = new YT.Player('yt-player', {
          height: '100%',
          width: '100%',
          videoId: initialVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1
          },
          events: {
            onReady: (e) => {
              this.ytReady = true;
              try {
                e.target.setVolume(Math.floor(this.volume * 100));
                e.target.unMute();
              } catch (err) {}
              if (this.pendingVideoId && this.ytPlayer.loadVideoById) {
                const vid = this.pendingVideoId;
                this.pendingVideoId = null;
                this.ytPlayer.loadVideoById(vid);
                this.ytPlayer.unMute();
                this.ytPlayer.playVideo();
              }
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) {
                this.clearPlaybackWatchdog();
                this.isPlaying = true;
                const realDur = Math.floor(this.ytPlayer.getDuration());
                if (realDur > 0) {
                  this.duration = realDur;
                  if (this.currentTrack) this.currentTrack.duration = realDur;
                  const t = this.tracks[this.currentTrackIndex];
                  if (t) t.duration = realDur;
                  this.updateTimelineUI();
                }
                this.startTimer();
                this.updateUI();
              } else if (e.data === YT.PlayerState.PAUSED) {
                this.isPlaying = false;
                if (this.pendingSyncSeconds > 0) {
                  this.flushListeningTime();
                }
                this.stopTimer();
                this.updateUI();
              } else if (e.data === YT.PlayerState.ENDED) {
                this.clearPlaybackWatchdog();
                this.onTrackEnded();
              }
            },
            onError: (e) => {
              console.warn('[MinhDucEar] YouTube Player error code:', e.data);
              this.handlePlaybackError(e.data);
            }
          }
        });
        return true;
      } catch (err) {
        console.error('[MinhDucEar] Error instantiating YT.Player:', err);
        return false;
      }
    };

    window.onYouTubeIframeAPIReady = () => {
      setupPlayer();
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      let checkAttempts = 0;
      const checkInterval = setInterval(() => {
        checkAttempts++;
        if (setupPlayer() || checkAttempts > 30) {
          clearInterval(checkInterval);
        }
      }, 300);
    }
  }

  handlePlaybackError(errorCode) {
    this.clearPlaybackWatchdog();
    const track = this.currentTrack || this.tracks[this.currentTrackIndex];
    const trackTitle = track ? track.title : 'Bài hát';
    
    let reason = 'Không thể phát';
    if (errorCode === 100) reason = 'Video không tồn tại hoặc đã bị xóa';
    else if (errorCode === 101 || errorCode === 150) reason = 'Bị giới hạn nhúng bản quyền YouTube';
    else if (errorCode === 2) reason = 'ID video không hợp lệ';
    else if (errorCode === 5) reason = 'Lỗi trình phát HTML5';

    console.warn(`[Playback Error] ${trackTitle}: ${reason} (Mã lỗi ${errorCode})`);
    
    // 1. Intelligent Self-Healing: Search and swap to a working YouTube alternative
    this._failedRetries = this._failedRetries || {};
    const trackKey = (track && (track.id || track.youtube_id)) || trackTitle;

    if (track && track.source_type === 'youtube' && !this._failedRetries[trackKey]) {
      this._failedRetries[trackKey] = true;
      if (typeof this.showToast === 'function') {
        this.showToast(`🔄 "${trackTitle}": ${reason}. Đang tự động tìm luồng phát thay thế...`, 'warning');
      }

      const isPagesDir = window.location.pathname.includes('/pages/');
      const apiUrl = (isPagesDir ? '../' : '') + 'api/endpoints/tracks.php';
      const params = new URLSearchParams({
        action: 'resolve_alternative',
        track_id: track.id || '',
        exclude_id: track.youtube_id || '',
        title: track.title || '',
        artist: track.artist || ''
      });

      fetch(`${apiUrl}?${params.toString()}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.success && data.youtube_id && data.youtube_id !== track.youtube_id) {
            console.info(`[Self-Healing] Successfully resolved alternative YouTube ID: ${data.youtube_id} for "${trackTitle}"`);
            track.youtube_id = data.youtube_id;
            if (data.cover_url) {
              track.cover = data.cover_url;
              track.cover_url = data.cover_url;
            }

            this.currentSource = 'youtube';
            if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
              this.ytPlayer.loadVideoById(data.youtube_id);
              this.ytPlayer.unMute();
              this.ytPlayer.setVolume(Math.floor(this.volume * 100));
              this.ytPlayer.playVideo();
              this.isPlaying = true;
              this.startPlaybackWatchdog(track);
              this.startTimer();
              this.updateUI();
              if (typeof this.showToast === 'function') {
                this.showToast(`✨ Đã kết nối luồng phát chuẩn xác từ YouTube Music!`, 'success');
              }
              return;
            }
          }
          // If no alternative found, advance to next track
          this.autoSkipToNext(trackTitle, reason);
        })
        .catch(err => {
          console.warn('[Self-Healing Error]', err);
          this.autoSkipToNext(trackTitle, reason);
        });
      return;
    }

    // 2. If already retried or unrecoverable, skip to next song smoothly without hanging
    this.autoSkipToNext(trackTitle, reason);
  }

  autoSkipToNext(trackTitle, reason) {
    if (typeof this.showToast === 'function') {
      this.showToast(`⚠️ ${trackTitle}: ${reason}. Tự động chuyển bài tiếp theo...`, 'warning');
    }
    setTimeout(() => {
      this.next();
    }, 1200);
  }

  startPlaybackWatchdog(track) {
    this.clearPlaybackWatchdog();
    this.playbackWatchdogTimer = setTimeout(() => {
      if (this.isPlaying && this.currentSource === 'youtube' && this.ytPlayer) {
        try {
          const state = typeof this.ytPlayer.getPlayerState === 'function' ? this.ytPlayer.getPlayerState() : -1;
          if (state === -1 || state === 5) {
            console.warn('[Playback Watchdog] Retrying playVideo()...');
            this.ytPlayer.unMute();
            this.ytPlayer.playVideo();
          }
        } catch (e) {}
      }
    }, 4500);
  }

  clearPlaybackWatchdog() {
    if (this.playbackWatchdogTimer) {
      clearTimeout(this.playbackWatchdogTimer);
      this.playbackWatchdogTimer = null;
    }
  }

  // 2. HTML5 Audio Element Setup
  initAudioElement() {
    if (!this.audioEl) {
      this.audioEl = document.createElement('audio');
      this.audioEl.id = 'real-audio-player';
      document.body.appendChild(this.audioEl);
    }
    this.audioEl.volume = this.volume;

    this.audioEl.addEventListener('loadedmetadata', () => {
      if (this.audioEl.duration && !isNaN(this.audioEl.duration) && this.audioEl.duration > 0) {
        this.duration = Math.floor(this.audioEl.duration);
        if (this.currentTrack) this.currentTrack.duration = this.duration;
        const t = this.tracks[this.currentTrackIndex];
        if (t) t.duration = this.duration;
        this.updateTimelineUI();
      }
    });

    this.audioEl.addEventListener('timeupdate', () => {
      if (this.currentSource === 'audio' && !this.isSeeking) {
        this.currentTime = Math.floor(this.audioEl.currentTime);
        this.updateTimelineUI();
      }
    });

    this.audioEl.addEventListener('ended', () => {
      if (this.currentSource === 'audio') {
        this.onTrackEnded();
      }
    });

    this.audioEl.addEventListener('play', () => {
      if (this.currentSource === 'audio') {
        this.isPlaying = true;
        this.updateUI();
      }
    });

    this.audioEl.addEventListener('pause', () => {
      if (this.currentSource === 'audio') {
        if (this.pendingSyncSeconds > 0) {
          this.flushListeningTime();
        }
        this.isPlaying = false;
        this.updateUI();
      }
    });
  }

  // 3. Play / Pause Control
  togglePlay() {
    if (!this.currentTrack) {
      if (this.tracks && this.tracks.length > 0) {
        this.playTrack(0);
      }
      return;
    }
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.currentTrack) {
      if (this.tracks && this.tracks.length > 0) {
        this.playTrack(0);
      }
      return;
    }
    const track = this.currentTrack || this.tracks[this.currentTrackIndex];
    if (!track) return;

    if (track.source_type === 'youtube' && track.youtube_id) {
      this.currentSource = 'youtube';
      if (this.audioEl) this.audioEl.pause();

      if (this.ytPlayer && this.ytReady && this.ytPlayer.playVideo) {
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(Math.floor(this.volume * 100));
        this.ytPlayer.playVideo();
      }
    } else if (track.source_type === 'database' || track.audio_url) {
      this.currentSource = 'audio';
      if (this.ytPlayer && this.ytPlayer.pauseVideo) this.ytPlayer.pauseVideo();

      const url = track.audio_url || `api/endpoints/stream.php?id=${track.id}`;
      if (this.audioEl.src !== url) {
        this.audioEl.src = url;
      }
      this.audioEl.play().catch(e => console.log('Audio autoplay prevented:', e));
    }

    this.isPlaying = true;
    if (track) this.recordHistory(track);
    this.startPlaybackWatchdog(track);
    this.startTimer();
    this.updateUI();
  }

  pause() {
    this.isPlaying = false;
    this.clearPlaybackWatchdog();
    if (this.pendingSyncSeconds > 0) {
      this.flushListeningTime();
    }
    if (this.currentSource === 'youtube' && this.ytPlayer && this.ytPlayer.pauseVideo) {
      this.ytPlayer.pauseVideo();
    }
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.stopTimer();
    this.updateUI();
  }

  
  loadTrack(track, autoPlay = true) {
    if (!track) return;
    const formatted = {
      id: track.id || ('yt_' + (track.youtube_id || Math.random().toString(36).substr(2, 9))),
      title: track.title,
      artist: track.artist || 'Nghệ sĩ',
      album: track.album || 'YouTube Music',
      duration: track.duration || 210,
      format: track.format || 'YT AUDIO 320k',
      cover: track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg'),
      source_type: track.source_type || 'youtube',
      youtube_id: track.youtube_id
    };

    const exIdx = this.tracks.findIndex(t => (t.youtube_id && t.youtube_id === formatted.youtube_id) || t.id === formatted.id);
    if (exIdx === -1) {
      this.tracks.unshift(formatted);
      this.currentTrackIndex = 0;
    } else {
      this.currentTrackIndex = exIdx;
    }

    this.currentTrack = this.tracks[this.currentTrackIndex];
    if (autoPlay) {
      this.playTrack(this.currentTrackIndex);
    } else {
      this.updateUI();
    }
  }

  playTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;
    if (this.pendingSyncSeconds > 0) {
      this.flushListeningTime();
    }
    this.currentTrackIndex = index;
    const track = this.tracks[index];
    this.currentTrack = track;
    this.lastActiveTrack = track;
    this.currentTime = 0;
    this.duration = track.duration || 210;

    if (track.source_type === 'youtube' && track.youtube_id) {
      this.currentSource = 'youtube';
      if (this.audioEl) this.audioEl.pause();

      if (this.ytPlayer && this.ytReady && this.ytPlayer.loadVideoById) {
        this.ytPlayer.loadVideoById(track.youtube_id);
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(Math.floor(this.volume * 100));
        this.ytPlayer.playVideo();
      } else {
        this.pendingVideoId = track.youtube_id;
      }
    } else {
      this.currentSource = 'audio';
      if (this.ytPlayer && this.ytPlayer.pauseVideo) this.ytPlayer.pauseVideo();

      const url = track.audio_url || `api/endpoints/stream.php?id=${track.id}`;
      if (this.audioEl.src !== url) {
        this.audioEl.src = url;
      }
      this.audioEl.currentTime = 0;
      this.audioEl.play().catch(e => console.log('Playback error:', e));
    }

    this.isPlaying = true;
    this.recordHistory(track);
    this.startPlaybackWatchdog(track);
    this.startTimer();
    this.updateUI();
  }

  onTrackEnded() {
    if (this.pendingSyncSeconds > 0) {
      this.flushListeningTime();
    }
    if (this.repeatMode === 'one') {
      this.seek(0);
      this.play();
    } else if (this.repeatMode === 'off' && !this.isShuffle && this.currentTrackIndex === this.tracks.length - 1) {
      this.pause();
      this.seek(0);
    } else {
      this.next();
    }
  }

  next() {
    if (!this.tracks || this.tracks.length === 0) return;
    if (!this.currentTrack) {
      this.playTrack(0);
      return;
    }
    if (this.repeatMode === 'one') {
      this.seek(0);
      this.play();
      return;
    }
    let nextIdx;
    if (this.isShuffle && this.tracks.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * this.tracks.length);
      } while (nextIdx === this.currentTrackIndex);
    } else {
      nextIdx = (this.currentTrackIndex + 1) % this.tracks.length;
    }
    this.playTrack(nextIdx);
  }

  prev() {
    if (!this.tracks || this.tracks.length === 0) return;
    if (!this.currentTrack) {
      this.playTrack(0);
      return;
    }
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }
    const prevIdx = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.playTrack(prevIdx);
  }

  // 4. Robust Timeline Seeking (Fixed: Actually jumps audio position & plays immediately)
  seek(fraction) {
    const track = this.currentTrack || this.tracks[this.currentTrackIndex];

    // Accurately determine real duration, especially for long YouTube videos or audio streams
    let totalDur = 254;
    if (this.duration && this.duration > 0) {
      totalDur = this.duration;
    } else if (track && track.duration && track.duration > 0) {
      totalDur = track.duration;
    }

    const targetSeconds = Math.max(0, Math.min(totalDur, Math.floor(totalDur * fraction)));
    this.currentTime = targetSeconds;

    if (this.currentSource === 'youtube') {
      if (this.ytPlayer && this.ytReady && this.ytPlayer.seekTo) {
        this.ytPlayer.seekTo(targetSeconds, true);
        this.ytPlayer.unMute();
        this.ytPlayer.playVideo();
        this.isPlaying = true;
      }
    } else if (this.currentSource === 'audio') {
      if (this.audioEl) {
        this.audioEl.currentTime = targetSeconds;
        this.audioEl.play();
        this.isPlaying = true;
      }
    }

    this.startTimer();
    this.updateUI();
  }

  setVolume(fraction) {
    this.volume = Math.max(0, Math.min(1, fraction));
    if (this.ytPlayer && this.ytReady && this.ytPlayer.setVolume) {
      this.ytPlayer.setVolume(Math.floor(this.volume * 100));
    }
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
    const volEl = document.getElementById('volume-bar-inner');
    if (volEl) volEl.style.width = `${Math.floor(this.volume * 100)}%`;
  }

  // 5. Timer & Progress Synchronization
  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      let isPlayingAudio = false;
      if (this.currentSource === 'youtube' && this.ytPlayer && this.ytReady && this.ytPlayer.getPlayerState) {
        const state = this.ytPlayer.getPlayerState();
        if (state === 1) { // PLAYING
          isPlayingAudio = true;
          if (!this.isSeeking) {
            this.currentTime = Math.floor(this.ytPlayer.getCurrentTime());
          }
          const realDur = Math.floor(this.ytPlayer.getDuration());
          if (realDur > 0) {
            this.duration = realDur;
            if (this.currentTrack) this.currentTrack.duration = realDur;
            const t = this.tracks[this.currentTrackIndex];
            if (t) t.duration = realDur;
          }
          if (!this.isSeeking) {
            this.updateTimelineUI();
          }
        }
      } else if (this.currentSource === 'audio' && this.audioEl && !this.audioEl.paused) {
        isPlayingAudio = true;
        if (!this.isSeeking) {
          this.currentTime = Math.floor(this.audioEl.currentTime);
        }
        if (this.audioEl.duration && !isNaN(this.audioEl.duration) && this.audioEl.duration > 0) {
          this.duration = Math.floor(this.audioEl.duration);
          if (this.currentTrack) this.currentTrack.duration = this.duration;
          const t = this.tracks[this.currentTrackIndex];
          if (t) t.duration = this.duration;
        }
        if (!this.isSeeking) {
          this.updateTimelineUI();
        }
      }

      // Tick live listening time statistics whenever music is playing
      if (isPlayingAudio) {
        this.tickListeningTime();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Real-time listening statistics ticking
  tickListeningTime() {
    this.liveListeningSeconds++;
    this.pendingSyncSeconds++;

    const currentTrack = this.currentTrack || (this.tracks ? this.tracks[this.currentTrackIndex] : null);
    if (currentTrack) {
      this.lastActiveTrack = currentTrack;
    }

    const lifetimeSeconds = this.initialLifetimeSeconds + this.liveListeningSeconds;
    const weeklySeconds = this.initialWeeklySeconds + this.liveListeningSeconds;

    // 1. Header listening hours (honest lifetime listening hours)
    const headerHoursEl = document.getElementById('header-listening-hours');
    if (headerHoursEl) {
      const hrs = (lifetimeSeconds / 3600).toFixed(2);
      headerHoursEl.textContent = `${hrs} hrs`;
    }

    // 2. Sidebar weekly total badge
    const weeklyTotalBadge = document.getElementById('sidebar-stat-weekly-total');
    if (weeklyTotalBadge) {
      const wHrs = (weeklySeconds / 3600).toFixed(2);
      weeklyTotalBadge.textContent = `TỔNG: ${wHrs} HRS`;
    }

    // 3. Sidebar weekly hours with live ticking seconds
    const weeklyHoursEl = document.getElementById('sidebar-stat-weekly-hours');
    if (weeklyHoursEl) {
      const wH = Math.floor(weeklySeconds / 3600);
      const wM = Math.floor((weeklySeconds % 3600) / 60);
      const wS = weeklySeconds % 60;
      weeklyHoursEl.innerHTML = `${wH}<span class="text-secondary text-[11px]">h</span> ${wM}<span class="text-secondary text-[11px]">m</span> <span class="text-[10px] text-gray-400 font-mono font-normal">${wS.toString().padStart(2, '0')}s</span>`;
    }

    // 4. Daily average
    const dailyAvgEl = document.getElementById('sidebar-stat-daily-avg');
    if (dailyAvgEl) {
      const avgHrs = (weeklySeconds / 3600 / 7).toFixed(2);
      dailyAvgEl.textContent = `TB: ${avgHrs}h/ngày`;
    }

    // 5. Update Today's bar in 7-day chart
    this.updateBarChartToday();

    // 6. Auto sync to database every 10 seconds
    if (this.pendingSyncSeconds >= 10) {
      this.flushListeningTime();
    }
  }

  // Update today's bar in the 7-day weekly bar chart
  updateBarChartToday() {
    if (!this.sevenDaysChartData || !Array.isArray(this.sevenDaysChartData)) return;
    const todayCode = (new Date().getDay() || 7);
    const todayIdx = this.sevenDaysChartData.findIndex(d => d.day_code === todayCode);
    if (todayIdx === -1) return;

    const todaySec = this.initialTodaySeconds + this.liveListeningSeconds;
    this.sevenDaysChartData[todayIdx].seconds = todaySec;
    this.sevenDaysChartData[todayIdx].minutes = Math.round((todaySec / 60) * 10) / 10;
    this.sevenDaysChartData[todayIdx].hours = Math.round((todaySec / 3600) * 100) / 100;

    const maxMins = Math.max(...this.sevenDaysChartData.map(d => d.minutes || 0), 10);
    const colEl = document.getElementById(`chart-col-${todayCode}`);
    if (colEl) {
      const barWrap = colEl.querySelector('div');
      if (barWrap) {
        const heightPct = Math.min(100, Math.max(10, Math.round(((this.sevenDaysChartData[todayIdx].minutes || 0) / maxMins) * 100)));
        barWrap.innerHTML = `
          <div class="w-full max-w-[14px] rounded-[1px] transition-all duration-300 bg-secondary shadow-[0_0_8px_rgba(84,216,232,0.6)]" 
               style="height: ${heightPct}%;" 
               title="${this.sevenDaysChartData[todayIdx].day_name || 'Hôm nay'}: ${this.sevenDaysChartData[todayIdx].minutes} phút (${this.sevenDaysChartData[todayIdx].hours}h)">
          </div>
        `;
      }
    }
  }

  // Flush accumulated listening seconds to MySQL
  async flushListeningTime(isBeacon = false) {
    if (this.pendingSyncSeconds <= 0) return;
    const durationToFlush = this.pendingSyncSeconds;
    const track = this.lastActiveTrack || this.currentTrack || (this.tracks ? this.tracks[this.currentTrackIndex] : null);
    if (!track) return;

    this.pendingSyncSeconds = 0;

    const payload = {
      user_id: this.currentUser ? this.currentUser.id : null,
      track_id: track.id || 0,
      youtube_id: track.youtube_id || '',
      title: track.title || '',
      artist: track.artist || '',
      duration: durationToFlush
    };

    const endpoint = 'api/endpoints/stats.php?action=record_listen';

    if (isBeacon && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (!resData || !resData.success) {
        this.pendingSyncSeconds += durationToFlush;
      }
    } catch (err) {
      console.warn('Flush listening time error:', err);
      this.pendingSyncSeconds += durationToFlush;
    }
  }

  formatTime(seconds, forceHours = false) {
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return forceHours ? '0:00:00' : '00:00';
    }
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    if (h > 0 || forceHours) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // 6. UI Updates (Visual Vinyl, Timeline, Buttons, Cover Art, EQ)
  updateTimelineUI() {
    const curTimeEl = document.getElementById('player-current-time');
    const totTimeEl = document.getElementById('player-total-time');
    const seekProgEl = document.getElementById('player-seek-progress');
    const seekThumbEl = document.getElementById('player-seek-thumb');

    if (!this.currentTrack) {
      if (curTimeEl) curTimeEl.textContent = '00:00';
      if (totTimeEl) totTimeEl.textContent = '00:00';
      if (seekProgEl) seekProgEl.style.width = '0%';
      if (seekThumbEl) seekThumbEl.style.left = '0%';
      return;
    }

    const totalSecs = (this.duration && this.duration > 0) ? this.duration : (this.currentTrack.duration || 210);
    const curSecs = Math.max(0, Math.min(totalSecs, this.currentTime || 0));
    const pct = totalSecs > 0 ? Math.max(0, Math.min(100, (curSecs / totalSecs) * 100)) : 0;

    if (curTimeEl) curTimeEl.textContent = this.formatTime(curSecs, curSecs >= 3600);
    if (totTimeEl) totTimeEl.textContent = this.formatTime(totalSecs);
    if (seekProgEl) seekProgEl.style.width = `${pct}%`;
    if (seekThumbEl) {
      seekThumbEl.style.left = `calc(${pct}% - ${(pct / 100) * 18}px)`;
    }

    // Synchronize floating lyrics with current playback time
    this.syncFloatingLyrics(curSecs);

    // Synchronize right sidebar media player progress & lyrics
    const rightCurTime = document.getElementById('right-player-curtime');
    const rightDuration = document.getElementById('right-player-duration');
    const rightProgress = document.getElementById('right-player-progress');
    if (rightCurTime) rightCurTime.textContent = this.formatTime(curSecs);
    if (rightDuration) rightDuration.textContent = this.formatTime(totalSecs);
    if (rightProgress) {
      rightProgress.style.width = `${pct}%`;
    }
    this.syncRightLyrics(curSecs);

    // Synchronize mobile drawer seekbar & time
    const mobCurTime = document.getElementById('mobile-drawer-cur-time');
    const mobTotalTime = document.getElementById('mobile-drawer-total-time');
    const mobProgress = document.getElementById('mobile-drawer-seek-progress');
    if (mobCurTime) mobCurTime.textContent = this.formatTime(curSecs);
    if (mobTotalTime) mobTotalTime.textContent = this.formatTime(totalSecs);
    if (mobProgress) mobProgress.style.width = `${pct}%`;

  }


  updateUI() {
    const titleEl = document.getElementById('footer-track-title');
    const artistEl = document.getElementById('footer-track-artist');
    const badgeEl = document.getElementById('footer-track-badge');
    const badgeWrap = document.getElementById('footer-badge-wrap');
    const infoWrap = document.getElementById('footer-track-info-wrap');
    const vinylImg = document.getElementById('footer-vinyl-img');
    const vinylContainer = document.getElementById('footer-vinyl');
    const btnPlay = document.getElementById('btn-master-play');

    if (!this.currentTrack) {
      // Idle state: No track chosen yet
      this.displayedTrackId = null;
      if (titleEl) titleEl.textContent = '';
      if (artistEl) artistEl.textContent = '';
      if (infoWrap) {
        infoWrap.classList.add('opacity-0', '-translate-x-2');
        infoWrap.classList.remove('opacity-100', 'translate-x-0', 'track-info-switching');
      }
      if (vinylImg) {
        vinylImg.src = '';
        vinylImg.classList.add('opacity-0', 'scale-75');
        vinylImg.classList.remove('opacity-100', 'scale-100', 'vinyl-img-switching');
      }
      if (vinylContainer) {
        vinylContainer.classList.remove('vinyl-running');
        vinylContainer.classList.add('vinyl-paused');
      }
      if (badgeWrap) {
        badgeWrap.classList.add('opacity-0');
        badgeWrap.classList.remove('opacity-100');
      }
      if (btnPlay) {
        const isLight = document.documentElement.classList.contains('light');
        const iconColor = isLight ? 'text-black' : 'text-[#381385]';
        btnPlay.innerHTML = `<svg class="w-5 h-5 pixel-icon ${iconColor}" fill="none" viewBox="0 0 16 16"><polygon fill="currentColor" points="4,2 14,8 4,14"></polygon></svg>`;
      }
      const heroPlayBtn = document.getElementById('hero-play-btn');
      if (heroPlayBtn) {
        const heroSpan = document.getElementById('hero-play-text') || heroPlayBtn.querySelector('span');
        if (heroSpan) heroSpan.textContent = 'phát ngay';
      }
      const eqBars = document.querySelectorAll('.eq-bar-anim');
      eqBars.forEach((bar, idx) => {
        bar.style.height = `${(idx % 3 + 1) * 4}px`;
      });
      this.updateTimelineUI();
      return;
    }

    const track = this.currentTrack;
    const coverUrl = track.cover || track.cover_url || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg');
    const badgeText = track.badge || track.format || "YT AUDIO 320k";

    // Check track identity for transition animation
    const currentTrackId = track.id || track.youtube_id || track.title;
    if (this.displayedTrackId !== currentTrackId) {
      const isFirstEntrance = (this.displayedTrackId === null);
      this.displayedTrackId = currentTrackId;

      if (isFirstEntrance) {
        // First selection entrance: smoothly fade and scale in
        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = track.artist;
        if (badgeEl) badgeEl.textContent = badgeText;
        if (vinylImg && coverUrl) vinylImg.src = coverUrl;

        requestAnimationFrame(() => {
          if (infoWrap) {
            infoWrap.classList.remove('opacity-0', '-translate-x-2', 'track-info-switching');
            infoWrap.classList.add('opacity-100', 'translate-x-0');
          }
          if (vinylImg) {
            vinylImg.classList.remove('opacity-0', 'scale-75', 'vinyl-img-switching');
            vinylImg.classList.add('opacity-100', 'scale-100');
          }
          if (badgeWrap) {
            badgeWrap.classList.remove('opacity-0');
            badgeWrap.classList.add('opacity-100');
          }
        });
      } else {
        // Track switching transition: crossfade exit -> update -> smooth enter
        if (!this.isTransitioningTrack) {
          this.isTransitioningTrack = true;
          if (infoWrap) infoWrap.classList.add('track-info-switching');
          if (vinylImg) vinylImg.classList.add('vinyl-img-switching');

          setTimeout(() => {
            if (titleEl) titleEl.textContent = track.title;
            if (artistEl) artistEl.textContent = track.artist;
            if (badgeEl) badgeEl.textContent = badgeText;
            if (vinylImg && coverUrl) vinylImg.src = coverUrl;

            requestAnimationFrame(() => {
              if (infoWrap) {
                infoWrap.classList.remove('opacity-0', '-translate-x-2', 'track-info-switching');
                infoWrap.classList.add('opacity-100', 'translate-x-0');
              }
              if (vinylImg) {
                vinylImg.classList.remove('opacity-0', 'scale-75', 'vinyl-img-switching');
                vinylImg.classList.add('opacity-100', 'scale-100');
              }
              if (badgeWrap) {
                badgeWrap.classList.remove('opacity-0');
                badgeWrap.classList.add('opacity-100');
              }
              if (this.isFloatingLyricsOpen && this.currentTrack) {
                this.loadTrackLyrics(this.currentTrack);
              }
              this.isTransitioningTrack = false;
            });
          }, 160);
        }
      }
    } else {
      // Same track: update badge text if needed
      if (badgeEl) badgeEl.textContent = badgeText;
      if (infoWrap && infoWrap.classList.contains('opacity-0')) {
        infoWrap.classList.remove('opacity-0', '-translate-x-2');
        infoWrap.classList.add('opacity-100', 'translate-x-0');
      }
      if (vinylImg && vinylImg.classList.contains('opacity-0')) {
        vinylImg.classList.remove('opacity-0', 'scale-75');
        vinylImg.classList.add('opacity-100', 'scale-100');
      }
      if (badgeWrap && badgeWrap.classList.contains('opacity-0')) {
        badgeWrap.classList.remove('opacity-0');
        badgeWrap.classList.add('opacity-100');
      }
    }

    // Vinyl spinning state (1/3 slow spin)
    if (vinylContainer) {
      if (this.isPlaying) {
        vinylContainer.classList.remove('vinyl-paused');
        vinylContainer.classList.add('vinyl-running');
      } else {
        vinylContainer.classList.remove('vinyl-running');
        vinylContainer.classList.add('vinyl-paused');
      }
    }

    // Play/Pause master button in footer
    const btnPlayEl = document.getElementById('btn-master-play');
    if (btnPlayEl) {
      const isLight = document.documentElement.classList.contains('light');
      const iconColor = isLight ? 'text-black' : 'text-[#381385]';
      if (this.isPlaying) {
        btnPlayEl.innerHTML = `<svg class="w-5 h-5 pixel-icon ${iconColor}" fill="none" viewBox="0 0 16 16"><rect fill="currentColor" height="12" width="3" x="3" y="2"></rect><rect fill="currentColor" height="12" width="3" x="10" y="2"></rect></svg>`;
      } else {
        btnPlayEl.innerHTML = `<svg class="w-5 h-5 pixel-icon ${iconColor}" fill="none" viewBox="0 0 16 16"><polygon fill="currentColor" points="4,2 14,8 4,14"></polygon></svg>`;
      }
    }

    // Hero section play button sync
    const heroPlayBtn = document.getElementById('hero-play-btn');
    if (heroPlayBtn) {
      const heroSpan = document.getElementById('hero-play-text') || heroPlayBtn.querySelector('span');
      if (heroSpan) {
        heroSpan.textContent = this.isPlaying ? 'tạm dừng' : 'phát ngay';
      }
    }

    // Equalizer bars animation
    const eqBars = document.querySelectorAll('.eq-bar-anim');
    eqBars.forEach((bar, idx) => {
      if (this.isPlaying) {
        const heights = [6, 12, 18, 24, 16, 20, 10, 26];
        const h = heights[(idx + Math.floor(this.currentTime)) % heights.length];
        bar.style.height = `${h}px`;
      } else {
        bar.style.height = `${(idx % 3 + 1) * 6}px`;
      }
    });

    this.updateTimelineUI();
    this.updateControllerFavoriteUI();
    this.updateRightMediaPlayer();
    this.updateMobilePlayerUI();

    // Always fetch lyrics for current track so mobile drawer and right sidebar are in sync
    if (this.currentTrack) {
      const trkKey = this.currentTrack.id || this.currentTrack.youtube_id || this.currentTrack.title;
      if (this.currentLyricsTrackKey !== trkKey) {
        this.currentLyricsTrackKey = trkKey;
        this.fetchLyricsForRightPlayer(this.currentTrack);
      }
    }
  }

  showToast(msg, type = 'info') {
    let toast = document.getElementById('minhduc-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'minhduc-global-toast';
      toast.className = 'fixed bottom-24 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-silkscreen shadow-2xl flex items-center gap-2 transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-none';
      document.body.appendChild(toast);
    }
    const bgClass = type === 'success'
      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
      : type === 'error'
      ? 'bg-red-950/90 text-red-300 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
      : 'bg-[#181824]/95 text-secondary border border-secondary/50 shadow-[0_0_20px_rgba(84,216,232,0.3)]';
    toast.className = `fixed bottom-24 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-silkscreen flex items-center gap-2 transition-all duration-300 transform translate-y-0 opacity-100 ${bgClass}`;
    toast.innerHTML = `<span>${type === 'success' ? '✔' : type === 'error' ? '✖' : '♥'}</span> <span>${msg}</span>`;
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      if (toast) {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-4', 'opacity-0');
      }
    }, 2800);
  }

  isTrackFavorite(track) {
    if (!track) return false;
    const trId = track.db_id || track.id || '';
    const ytId = track.youtube_id || (typeof trId === 'string' && trId.startsWith('yt_') ? trId.substring(3) : '');
    const title = (track.title || '').trim().toLowerCase();

    // 1. Check syncStats if available
    if (this.currentUser && this.syncStats && Array.isArray(this.syncStats.favorites)) {
      if (track.db_id && this.syncStats.favorites.includes(Number(track.db_id))) return true;
      if (typeof trId === 'number' && this.syncStats.favorites.includes(trId)) return true;
    }

    // 2. Check currentFavoritesList memory cache
    if (Array.isArray(this.currentFavoritesList) && this.currentFavoritesList.length > 0) {
      const match = this.currentFavoritesList.some(f => {
        if (ytId && f.youtube_id && f.youtube_id === ytId) return true;
        if (track.db_id && (f.db_id === track.db_id || f.id === track.db_id)) return true;
        if (trId && (f.id === trId || f.db_id === trId)) return true;
        if (title && f.title && f.title.trim().toLowerCase() === title) return true;
        return false;
      });
      if (match) return true;
    }

    // 3. Check localStorage for current user / guest
    try {
      const key = this.getFavoritesStorageKey();
      const localFavs = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(localFavs)) {
        return localFavs.some(f => {
          if (ytId && f.youtube_id && f.youtube_id === ytId) return true;
          if (track.db_id && (f.db_id === track.db_id || f.id === track.db_id)) return true;
          if (trId && (f.id === trId || f.db_id === trId)) return true;
          if (title && f.title && f.title.trim().toLowerCase() === title) return true;
          return false;
        });
      }
    } catch (e) {}

    return false;
  }

  updateControllerFavoriteUI() {
    const btnFav = document.getElementById('btn-favorite');
    if (!btnFav) return;
    const track = this.currentTrack;
    const isFav = track ? this.isTrackFavorite(track) : false;

    if (isFav) {
      btnFav.className = 'text-pink-500 hover:scale-110 p-1 transition-transform hover:text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]';
      btnFav.title = 'Đã yêu thích (Nhấn để hủy yêu thích)';
      btnFav.innerHTML = `
        <svg class="w-4 h-4 pixel-icon fill-current" viewBox="0 0 16 16">
          <rect fill="currentColor" height="3" width="4" x="2" y="2"></rect>
          <rect fill="currentColor" height="3" width="4" x="10" y="2"></rect>
          <rect fill="currentColor" height="4" width="14" x="1" y="4"></rect>
          <rect fill="currentColor" height="3" width="10" x="3" y="8"></rect>
          <rect fill="currentColor" height="2" width="6" x="5" y="11"></rect>
          <rect fill="currentColor" height="2" width="2" x="7" y="13"></rect>
        </svg>
      `;
    } else {
      btnFav.className = 'text-tertiary hover:scale-110 p-1 transition-transform hover:text-pink-400';
      btnFav.title = 'Thêm vào yêu thích / Add to favorites';
      btnFav.innerHTML = `
        <svg class="w-4 h-4 pixel-icon" fill="none" viewBox="0 0 16 16">
          <rect fill="currentColor" height="3" width="4" x="2" y="2"></rect>
          <rect fill="currentColor" height="3" width="4" x="10" y="2"></rect>
          <rect fill="currentColor" height="4" width="14" x="1" y="4"></rect>
          <rect fill="currentColor" height="3" width="10" x="3" y="8"></rect>
          <rect fill="currentColor" height="2" width="6" x="5" y="11"></rect>
          <rect fill="currentColor" height="2" width="2" x="7" y="13"></rect>
        </svg>
      `;
    }
  }

  async toggleCurrentTrackFavorite() {
    const track = this.currentTrack;
    if (!track) {
      this.showToast('Chưa có bài hát nào đang phát!', 'info');
      return;
    }
    const btnFav = document.getElementById('btn-favorite');
    await this.toggleFavorite(track, btnFav);
    this.updateControllerFavoriteUI();
  }

  // 7. Event Handlers & Button Binding
  bindControls() {
    // Master play button
    const btnPlay = document.getElementById('btn-master-play');
    if (btnPlay) btnPlay.addEventListener('click', () => this.togglePlay());

    // Next / Prev buttons
    const btnNext = document.getElementById('btn-next');
    if (btnNext) btnNext.addEventListener('click', () => this.next());

    const btnPrev = document.getElementById('btn-prev');
    if (btnPrev) btnPrev.addEventListener('click', () => this.prev());

    // Bottom bar favorite button
    const btnFav = document.getElementById('btn-favorite');
    if (btnFav) {
      btnFav.addEventListener('click', () => this.toggleCurrentTrackFavorite());
    }

    // Bottom-left track info click to toggle Right Media Player
    const footerTrackInfo = document.getElementById('footer-track-info-container');
    if (footerTrackInfo) {
      footerTrackInfo.addEventListener('click', (e) => {
        // Prevent toggle if clicking internal buttons/links
        if (e.target.closest('button') || e.target.closest('a')) return;
        if (window.innerWidth < 1024 && window.bootstrap) {
          const offcanvasEl = document.getElementById('mobile-player-offcanvas');
          if (offcanvasEl) {
            bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl).show();
            this.updateMobilePlayerUI();
            return;
          }
        }
        this.toggleRightMediaPlayer();
      });
    }

    // Right media player controls
    const btnCloseRightPlayer = document.getElementById('btn-close-right-player');
    if (btnCloseRightPlayer) {
      btnCloseRightPlayer.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleRightMediaPlayer(false);
      });
    }

    const rightCoverPlayBtn = document.getElementById('right-player-cover-play-btn');
    if (rightCoverPlayBtn) {
      rightCoverPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    const rightFavBtn = document.getElementById('right-player-fav-btn');
    if (rightFavBtn) {
      rightFavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCurrentTrackFavorite();
      });
    }

    const rightProgressbar = document.getElementById('right-player-progressbar');
    if (rightProgressbar) {
      rightProgressbar.addEventListener('click', (e) => {
        const rect = rightProgressbar.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.seek(frac);
      });
    }

    // Seekbar scrubbing
    const seekbar = document.getElementById('player-seekbar');
    if (seekbar) {
      let isDragging = false;
      let lastFraction = 0;

      const updateScrubUI = (e) => {
        const rect = seekbar.getBoundingClientRect();
        lastFraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const totalDur = (this.duration && this.duration > 0) ? this.duration : 254;
        this.currentTime = Math.floor(totalDur * lastFraction);
        this.updateTimelineUI();
      };

      seekbar.addEventListener('click', (e) => {
        const rect = seekbar.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.seek(fraction);
      });
      
      seekbar.addEventListener('mousedown', (e) => {
        isDragging = true;
        this.isSeeking = true;
        updateScrubUI(e);
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging) {
          updateScrubUI(e);
        }
      });
      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          this.isSeeking = false;
          this.seek(lastFraction);
        }
      });
    }

    // Shuffle toggle button
    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        this.isShuffle = !this.isShuffle;
        btnShuffle.classList.toggle('text-secondary', this.isShuffle);
        btnShuffle.classList.toggle('text-on-surface-variant', !this.isShuffle);
        this.showToast(this.isShuffle ? 'Bật phát ngẫu nhiên / Shuffle ON' : 'Tắt phát ngẫu nhiên / Shuffle OFF');
      });
    }

    // Repeat mode button (off -> all -> one -> off)
    const btnRepeat = document.getElementById('btn-repeat');
    if (btnRepeat) {
      btnRepeat.addEventListener('click', () => {
        if (this.repeatMode === 'off') {
          this.repeatMode = 'all';
          btnRepeat.classList.add('text-secondary');
          btnRepeat.classList.remove('text-on-surface-variant');
          btnRepeat.title = 'Lặp lại danh sách / Repeat All';
          this.showToast('Lặp lại toàn bộ danh sách');
        } else if (this.repeatMode === 'all') {
          this.repeatMode = 'one';
          btnRepeat.classList.add('text-secondary');
          btnRepeat.classList.remove('text-on-surface-variant');
          btnRepeat.title = 'Lặp lại 1 bài / Repeat One';
          this.showToast('Lặp lại bài hát hiện tại');
        } else {
          this.repeatMode = 'off';
          btnRepeat.classList.remove('text-secondary');
          btnRepeat.classList.add('text-on-surface-variant');
          btnRepeat.title = 'Lặp lại: Tắt';
          this.showToast('Tắt lặp lại / Repeat OFF');
        }
      });
    }

    // Add to playlist button in footer
    const btnFooterAddPl = document.getElementById('btn-footer-add-to-playlist');
    if (btnFooterAddPl) {
      btnFooterAddPl.addEventListener('click', () => {
        const cur = this.currentTrack;
        if (cur) {
          this.openAddToPlaylistModal(cur);
        } else {
          this.showToast('Không có bài hát nào đang phát!');
        }
      });
    }

    // Floating Synced Lyrics toggle button
    const btnFooterLyrics = document.getElementById('btn-footer-lyrics');
    if (btnFooterLyrics) {
      btnFooterLyrics.addEventListener('click', () => {
        this.toggleFloatingLyrics();
      });
    }

    // Close button inside floating lyrics panel
    const btnCloseFloatingLyrics = document.getElementById('btn-close-floating-lyrics');
    if (btnCloseFloatingLyrics) {
      btnCloseFloatingLyrics.addEventListener('click', () => {
        this.toggleFloatingLyrics(false);
      });
    }

    // Volume bar with click and drag scrubbing
    const volBar = document.getElementById('player-volume-bar');
    if (volBar) {
      let isVolDragging = false;
      const updateVolFromEvent = (e) => {
        const rect = volBar.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.setVolume(fraction);
      };
      volBar.addEventListener('click', updateVolFromEvent);
      volBar.addEventListener('mousedown', (e) => {
        isVolDragging = true;
        updateVolFromEvent(e);
      });
      window.addEventListener('mousemove', (e) => {
        if (isVolDragging) updateVolFromEvent(e);
      });
      window.addEventListener('mouseup', () => {
        if (isVolDragging) isVolDragging = false;
      });
    }

    // Fullscreen toggle (Like pressing F11)
    const btnFullscreen = document.getElementById('btn-fullscreen-toggle');
    if (btnFullscreen) {
      const toggleFullscreen = () => {
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log('Exit fullscreen error:', err));
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
      };

      btnFullscreen.addEventListener('click', toggleFullscreen);

      const updateFullscreenUI = () => {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        const iconExpand = document.getElementById('fullscreen-icon-expand');
        const iconCompress = document.getElementById('fullscreen-icon-compress');
        btnFullscreen.title = isFs ? 'Thoát toàn màn hình / Exit Fullscreen (Esc/F11)' : 'Toàn màn hình / Fullscreen (F11)';
        if (iconExpand && iconCompress) {
          if (isFs) {
            iconExpand.classList.add('hidden');
            iconCompress.classList.remove('hidden');
          } else {
            iconExpand.classList.remove('hidden');
            iconCompress.classList.add('hidden');
          }
        }
      };

      document.addEventListener('fullscreenchange', updateFullscreenUI);
      document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
      document.addEventListener('mozfullscreenchange', updateFullscreenUI);
      document.addEventListener('MSFullscreenChange', updateFullscreenUI);

      // Keyboard shortcut 'f' or 'F' to toggle fullscreen (when not typing in an input)
      document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable)) {
          return;
        }
        if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'f' || e.key === 'F')) {
          e.preventDefault();
          toggleFullscreen();
        }
      });
    }

    // Made For You card clicks
    document.querySelectorAll('.music-card-item').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-track-index') || '1', 10);
        this.playTrack((idx - 1) % this.tracks.length);
      });
    });

    // Theme Toggle persistence
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        setTimeout(() => this.updateUI(), 50);
      });
    }
  }

// 8. Dynamic Search & Category Filters (Real YouTube Music)
  bindSearch() {
    const globalInput = document.getElementById('global-search-input');
    const quickDropdown = document.getElementById('search-quick-dropdown');
    const viewInput = document.getElementById('view-search-input');
    const viewSubmit = document.getElementById('btn-view-search-submit');
    const backHomeBtn = document.getElementById('btn-search-back-home');
    const sidebarSearchBtn = document.getElementById('sidebar-nav-search');

    let quickDebounce = null;
    let viewDebounce = null;

    // A. Global Search Bar (Header)
    const globalSearchBtn = document.getElementById('global-search-btn');
    if (globalSearchBtn && globalInput) {
      globalSearchBtn.addEventListener('click', () => {
        const q = globalInput.value.trim();
        if (q) {
          clearTimeout(quickDebounce);
          if (quickDropdown) quickDropdown.classList.add('hidden');
          this.searchQuery = q;
          if (viewInput) viewInput.value = q;
          this.switchView('search');
          this.performSearch(q, this.currentSearchCategory || 'all');
        } else {
          globalInput.focus();
        }
      });
    }

    if (globalInput) {
      globalInput.addEventListener('input', () => {
        clearTimeout(quickDebounce);
        const q = globalInput.value.trim();
        if (!q) {
          if (quickDropdown) quickDropdown.classList.add('hidden');
          return;
        }

        quickDebounce = setTimeout(async () => {
          if (!quickDropdown) return;
          quickDropdown.innerHTML = '<div class="p-3 text-center text-xs font-silkscreen text-gray-400 flex items-center justify-center gap-2"><span class="w-2 h-2 rounded-full bg-secondary animate-ping"></span> Đang tìm kiếm YouTube Music...</div>';
          quickDropdown.classList.remove('hidden');

          try {
            const res = await fetch(`api/endpoints/tracks.php?action=search&q=${encodeURIComponent(q)}&limit=6`);
            const data = await res.json();
            if (data.success && data.tracks && data.tracks.length > 0) {
              quickDropdown.innerHTML = '';
              data.tracks.forEach(track => {
                const row = document.createElement('div');
                row.className = 'flex items-center gap-3 p-2 hover:bg-surface-container-high rounded-lg cursor-pointer transition-colors group select-none';
                row.innerHTML = `
                  <img src="${track.cover_url || 'https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg'}" class="w-9 h-9 rounded object-cover shrink-0 border border-white/10">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">${this.escapeHtml(track.title)}</div>
                    <div class="text-[10px] text-gray-400 truncate">${this.escapeHtml(track.artist)}</div>
                  </div>
                  <span class="font-silkscreen text-[7px] text-secondary border border-secondary/40 px-1 py-0.5 rounded shrink-0">YT 320k</span>
                `;
                row.addEventListener('click', () => {
                  this.playTrackDirect(track);
                  quickDropdown.classList.add('hidden');
                });
                quickDropdown.appendChild(row);
              });

              // Footer row to see full results
              const seeAll = document.createElement('div');
              seeAll.className = 'pt-2 mt-1 border-t border-white/10 text-center';
              seeAll.innerHTML = `<button type="button" class="text-[11px] font-silkscreen text-secondary hover:underline cursor-pointer">Xem tất cả kết quả cho "${this.escapeHtml(q)}" →</button>`;
              seeAll.addEventListener('click', () => {
                quickDropdown.classList.add('hidden');
                this.searchQuery = q;
                if (viewInput) viewInput.value = q;
                this.switchView('search');
                this.performSearch(q, this.currentSearchCategory || 'all');
              });
              quickDropdown.appendChild(seeAll);
            } else {
              quickDropdown.innerHTML = '<div class="p-3 text-center text-xs font-silkscreen text-gray-400">Không tìm thấy bài hát nào.</div>';
            }
          } catch (e) {
            quickDropdown.innerHTML = '<div class="p-3 text-center text-xs font-silkscreen text-red-400">Lỗi tìm kiếm.</div>';
          }
        }, 300);
      });

      globalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(quickDebounce);
          if (quickDropdown) quickDropdown.classList.add('hidden');
          const q = globalInput.value.trim();
          this.searchQuery = q;
          if (viewInput) viewInput.value = q;
          this.switchView('search');
          this.performSearch(q, this.currentSearchCategory || 'all');
        } else if (e.key === 'Escape') {
          if (quickDropdown) quickDropdown.classList.add('hidden');
        }
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (quickDropdown && globalInput && !globalInput.contains(e.target) && !quickDropdown.contains(e.target)) {
        quickDropdown.classList.add('hidden');
      }
    });

    // Global shortcut Ctrl+K or Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (globalInput) {
          globalInput.focus();
          globalInput.select();
        }
      }
    });

    // B. View Search Controls
    if (viewInput) {
      viewInput.addEventListener('input', () => {
        clearTimeout(viewDebounce);
        viewDebounce = setTimeout(() => {
          this.searchQuery = viewInput.value.trim();
          this.performSearch(this.searchQuery, this.currentSearchCategory || 'all');
        }, 350);
      });

      viewInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(viewDebounce);
          this.searchQuery = viewInput.value.trim();
          this.performSearch(this.searchQuery, this.currentSearchCategory || 'all');
        }
      });
    }

    if (viewSubmit) {
      viewSubmit.addEventListener('click', () => {
        if (viewInput) {
          this.searchQuery = viewInput.value.trim();
          this.performSearch(this.searchQuery, this.currentSearchCategory || 'all');
        }
      });
    }

    if (backHomeBtn) {
      backHomeBtn.addEventListener('click', () => {
        this.switchView('home');
      });
    }

    if (sidebarSearchBtn) {
      sidebarSearchBtn.addEventListener('click', () => {
        this.switchView('search');
        if (viewInput) viewInput.focus();
      });
    }

    // C. Category Filter Pills
    document.querySelectorAll('#search-category-pills .search-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.getAttribute('data-category') || 'all';
        this.currentSearchCategory = cat;

        // Update pills active styling
        document.querySelectorAll('#search-category-pills .search-filter-pill').forEach(p => {
          if (p === pill) {
            p.className = 'search-filter-pill px-3 py-1.5 rounded-lg text-xs font-silkscreen transition-all shrink-0 bg-secondary text-on-secondary font-bold shadow-[0_0_10px_rgba(84,216,232,0.4)] cursor-pointer';
          } else {
            p.className = 'search-filter-pill px-3 py-1.5 rounded-lg text-xs font-silkscreen transition-all shrink-0 bg-surface-container-high text-gray-400 hover:text-white hover:bg-surface-container-highest cursor-pointer';
          }
        });

        this.performSearch(this.searchQuery || '', cat);
      });
    });

    // D. Add to Playlist Modal Events
    this.bindAddToPlaylistModal();
    // Offcanvas Mobile Player Show Event - Refresh UI & Lyrics instantly
    const mobPlayerOffcanvas = document.getElementById('mobile-player-offcanvas');
    if (mobPlayerOffcanvas) {
      mobPlayerOffcanvas.addEventListener('show.bs.offcanvas', () => {
        this.updateMobilePlayerUI();
        const curTrk = this.currentTrack || (this.tracks && this.tracks[this.currentTrackIndex]);
        if (curTrk) {
          const k = curTrk.id || curTrk.youtube_id || curTrk.title;
          if (this.currentLyricsTrackKey !== k || !this.rightLyrics || this.rightLyrics.length === 0) {
            this.currentLyricsTrackKey = k;
            this.fetchLyricsForRightPlayer(curTrk);
          } else {
            this.renderRightLrcLines();
            this.syncRightLyrics(this.currentTime || 0);
          }
        }
      });
    }


    // E. Mobile Navigation & Dock Events
    document.querySelectorAll('.mobile-dock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (view) this.switchView(view);
      });
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) {
          this.switchView(view);
          const offcanvasEl = document.getElementById('mobile-nav-offcanvas');
          if (offcanvasEl && window.bootstrap) {
            bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide();
          }
        }
      });
    });

    const mobileUserBtn = document.getElementById('mobile-sidebar-user-profile-btn');
    if (mobileUserBtn) {
      mobileUserBtn.addEventListener('click', () => {
        this.switchView('account');
        const offcanvasEl = document.getElementById('mobile-nav-offcanvas');
        if (offcanvasEl && window.bootstrap) {
          bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide();
        }
      });
    }

    // F. Mobile Bottom Bar Quick Controls
    const mobileMiniPlay = document.getElementById('mobile-mini-play-btn');
    if (mobileMiniPlay) mobileMiniPlay.addEventListener('click', () => this.togglePlay());

    const mobileMiniNext = document.getElementById('mobile-mini-next-btn');
    if (mobileMiniNext) mobileMiniNext.addEventListener('click', () => this.next());

    // G. Mobile Player Offcanvas Controls
    const mobPlayBtn = document.getElementById('mobile-drawer-play-btn');
    if (mobPlayBtn) mobPlayBtn.addEventListener('click', () => this.togglePlay());

    const mobPrevBtn = document.getElementById('mobile-drawer-prev-btn');
    if (mobPrevBtn) mobPrevBtn.addEventListener('click', () => this.prev());

    const mobNextBtn = document.getElementById('mobile-drawer-next-btn');
    if (mobNextBtn) mobNextBtn.addEventListener('click', () => this.next());

    const mobShuffleBtn = document.getElementById('mobile-drawer-shuffle-btn');
    if (mobShuffleBtn) mobShuffleBtn.addEventListener('click', () => this.toggleShuffle());

    const mobFavBtn = document.getElementById('mobile-drawer-fav-btn');
    if (mobFavBtn) mobFavBtn.addEventListener('click', () => this.toggleCurrentTrackFavorite());

    const mobSeekbar = document.getElementById('mobile-drawer-seekbar');
    if (mobSeekbar) {
      mobSeekbar.addEventListener('click', (e) => {
        const rect = mobSeekbar.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.seek(frac);
      });
    }

  }

  // Perform full search via backend (8 tracks initially + Infinite Scroll strictly matching keyword)
  async performSearch(query = '', category = 'all') {
    const grid = document.getElementById('search-results-grid');
    const queryText = document.getElementById('search-query-text');
    const countBadge = document.getElementById('search-count-badge');
    const sentinel = document.getElementById('search-scroll-sentinel');
    const spinner = document.getElementById('search-sentinel-spinner');
    const loadMoreBtn = document.getElementById('btn-search-load-more');

    this.searchQuery = query;
    this.currentSearchCategory = category;
    this.searchOffset = 0;
    this.isSearchLoading = true;
    this.noMoreSearchResults = false;
    this.searchSeenIds = new Set();

    if (sentinel) sentinel.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');

    if (queryText) {
      queryText.textContent = query ? `"${query}" [${category.toUpperCase()}]` : `[${category.toUpperCase()}]`;
    }

    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full py-12 flex flex-col items-center justify-center gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
          <span class="font-silkscreen text-xs text-gray-400">Đang tìm kiếm YouTube Music...</span>
        </div>
      `;
    }

    try {
      const res = await fetch(`api/endpoints/tracks.php?action=search&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&limit=8&offset=0`);
      const data = await res.json();

      this.isSearchLoading = false;

      if (data.success && data.tracks && data.tracks.length > 0) {
        this.searchResults = data.tracks;
        data.tracks.forEach(t => {
          const tid = t.youtube_id || t.id;
          if (tid) this.searchSeenIds.add(tid);
        });

        if (countBadge) countBadge.textContent = `${data.tracks.length} BÀI HÁT`;
        this.renderSearchResults(data.tracks, false);

        this.noMoreSearchResults = (data.has_more === false);
        if (loadMoreBtn && !this.noMoreSearchResults) {
          loadMoreBtn.classList.remove('hidden');
        }
      } else {
        this.searchResults = [];
        this.noMoreSearchResults = true;
        if (grid) {
          grid.innerHTML = `
            <div class="col-span-full py-12 text-center">
              <p class="font-silkscreen text-xs text-gray-400 mb-2">Không tìm thấy bài hát nào cho từ khóa "${this.escapeHtml(query)}".</p>
              <button type="button" class="px-3 py-1.5 rounded bg-surface-container-high text-xs text-secondary font-silkscreen cursor-pointer" onclick="minhDucPlayer.performSearch('', 'all')">
                Khám phá nhạc thịnh hành
              </button>
            </div>
          `;
        }
        if (countBadge) countBadge.textContent = '0 BÀI HÁT';
      }
    } catch (err) {
      this.isSearchLoading = false;
      if (grid) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-xs font-silkscreen text-red-400">Lỗi kết nối máy chủ khi tìm kiếm!</div>`;
      }
    }
  }

  // Infinite Scroll: Load more search results strictly for the current keyword
  async loadMoreSearchResults() {
    if (this.isSearchLoading || this.noMoreSearchResults) return;
    this.isSearchLoading = true;

    // Safety timeout: release loading flag after 8s so user is never stuck
    const timeoutId = setTimeout(() => {
      if (this.isSearchLoading) {
        this.isSearchLoading = false;
        const sp = document.getElementById('search-sentinel-spinner');
        if (sp) sp.classList.add('hidden');
        const btn = document.getElementById('btn-search-load-more');
        if (btn && !this.noMoreSearchResults) btn.classList.remove('hidden');
      }
    }, 8000);

    const sentinel = document.getElementById('search-scroll-sentinel');
    const spinner = document.getElementById('search-sentinel-spinner');
    const loadMoreBtn = document.getElementById('btn-search-load-more');
    const sentinelText = document.getElementById('search-sentinel-text');
    const countBadge = document.getElementById('search-count-badge');

    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
    if (sentinel) sentinel.classList.remove('hidden');

    this.searchOffset += 8;
    const excludeList = Array.from(this.searchSeenIds || []).slice(-40).join(',');

    try {
      const res = await fetch(`api/endpoints/tracks.php?action=search&q=${encodeURIComponent(this.searchQuery || '')}&category=${encodeURIComponent(this.currentSearchCategory || 'all')}&limit=8&offset=${this.searchOffset}&exclude=${encodeURIComponent(excludeList)}`);
      const data = await res.json();

      clearTimeout(timeoutId);
      this.isSearchLoading = false;
      if (spinner) spinner.classList.add('hidden');

      if (data.success && data.tracks && data.tracks.length > 0) {
        // Strict 2-layer deduplication against searchSeenIds
        const uniqueTracks = data.tracks.filter(t => {
          const tid = t.youtube_id || t.id;
          if (!tid || (this.searchSeenIds && this.searchSeenIds.has(tid))) return false;
          if (this.searchSeenIds) this.searchSeenIds.add(tid);
          return true;
        });

        if (uniqueTracks.length > 0) {
          this.searchResults = (this.searchResults || []).concat(uniqueTracks);
          if (countBadge) countBadge.textContent = `${this.searchResults.length} BÀI HÁT`;
          this.renderSearchResults(uniqueTracks, true);
        }

        if (data.has_more === false) {
          this.noMoreSearchResults = true;
          if (sentinelText) sentinelText.textContent = 'Đã tải hết toàn bộ kết quả phù hợp!';
          if (spinner) spinner.classList.remove('hidden');
          setTimeout(() => { if (spinner) spinner.classList.add('hidden'); }, 3000);
        } else if (loadMoreBtn) {
          loadMoreBtn.classList.remove('hidden');
        }
      } else {
        this.noMoreSearchResults = true;
        if (sentinelText) sentinelText.textContent = 'Đã tải hết toàn bộ kết quả phù hợp!';
        if (spinner) spinner.classList.remove('hidden');
        setTimeout(() => { if (spinner) spinner.classList.add('hidden'); }, 3000);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      this.isSearchLoading = false;
      if (spinner) spinner.classList.add('hidden');
      if (loadMoreBtn && !this.noMoreSearchResults) loadMoreBtn.classList.remove('hidden');
    }
  }

  // Render search result cards
  renderSearchResults(tracks, append = false) {
    const grid = document.getElementById('search-results-grid');
    if (!grid) return;
    if (!append) grid.innerHTML = '';

    tracks.forEach((track, idx) => {
      const tid = track.youtube_id || track.id;
      if (tid && this.searchSeenIds) this.searchSeenIds.add(tid);

      const card = document.createElement('div');
      card.className = 'music-card-item group bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-secondary/60 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(84,216,232,0.15)] cursor-pointer select-none';

      const coverImg = track.cover_url || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg');
      const duration = track.duration_str || (track.duration ? gmdate_min_sec(track.duration) : '03:40');

      card.innerHTML = `
        <div class="w-full aspect-square rounded-lg overflow-hidden relative mb-2.5">
          <img alt="${this.escapeHtml(track.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${coverImg}">
          <div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/90 font-mono text-[9px] font-semibold text-secondary border border-secondary/60 rounded shadow">
            ${track.format || 'YT 320k'}
          </div>
          <div class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 font-mono text-[8px] text-gray-300 rounded">
            ${duration}
          </div>
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" class="btn-card-play w-10 h-10 bg-secondary text-black flex items-center justify-center rounded-full shadow-lg transform group-hover:scale-110 transition-transform hover:brightness-110" title="Phát ngay">
              <svg class="w-5 h-5 ml-0.5 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"></polygon></svg>
            </button>
          </div>
        </div>
        <div class="flex flex-col min-w-0">
          <h3 class="text-xs sm:text-sm font-semibold text-white tracking-wide truncate group-hover:text-secondary transition-colors mb-0.5" title="${this.escapeHtml(track.title)}">
            ${this.escapeHtml(track.title)}
          </h3>
          <p class="text-[11px] text-gray-400 truncate mb-2" title="${this.escapeHtml(track.artist)}">
            ${this.escapeHtml(track.artist)}
          </p>
          <div class="flex items-center justify-between pt-1.5 border-t border-white/5">
            <span class="font-mono text-[9px] text-secondary bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/30 font-semibold">YOUTUBE</span>
            <div class="flex items-center gap-1">
              <!-- Nút Thêm vào Playlist -->
              <button type="button" class="btn-card-add-pl p-1 text-gray-400 hover:text-white rounded transition-colors" title="Thêm vào Playlist">
                <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              </button>
              <!-- Nút Yêu thích -->
              <button type="button" class="btn-card-fav p-1 text-gray-400 hover:text-red-400 rounded transition-colors" title="Yêu thích">
                <svg class="w-3.5 h-3.5 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      // Click card or play button plays directly
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-card-add-pl') || e.target.closest('.btn-card-fav')) return;
        this.playTrackDirect(track);
      });

      // Bind Add to Playlist
      const addPlBtn = card.querySelector('.btn-card-add-pl');
      if (addPlBtn) {
        addPlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openAddToPlaylistModal(track);
        });
      }

      // Bind Favorite
      const favBtn = card.querySelector('.btn-card-fav');
      if (favBtn) {
        favBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            const trId = track.db_id || track.id;
            const res = await fetch(`api/endpoints/playlists.php?action=favorite_toggle&track_id=${trId}`, { method: 'POST' });
            const result = await res.json();
            if (result.success) {
              favBtn.classList.toggle('text-red-500', result.is_favorite);
              favBtn.classList.toggle('text-gray-400', !result.is_favorite);
              this.showInpageAlert(result.message, 'success');
            }
          } catch (err) {}
        });
      }

      grid.appendChild(card);
    });
  }

  // Play any track directly (YouTube or DB) - 100% Guaranteed sync with audio & UI
  playTrackDirect(track) {
    if (!track) return;

    if (this.pendingSyncSeconds > 0) {
      this.flushListeningTime();
    }

    const formattedTrack = {
      id: track.id || ('yt_' + (track.youtube_id || Math.random().toString(36).substr(2, 9))),
      title: track.title,
      artist: track.artist || 'YouTube Music',
      album: track.album || 'YouTube Music',
      duration: track.duration || 210,
      format: track.format || 'YT AUDIO 320k',
      cover: track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg'),
      source_type: track.source_type || 'youtube',
      youtube_id: track.youtube_id
    };

    this.currentTrack = formattedTrack;
    this.lastActiveTrack = formattedTrack;
    this.currentTime = 0;
    this.duration = formattedTrack.duration || 210;

    const exIdx = this.tracks.findIndex(t => (t.youtube_id && t.youtube_id === formattedTrack.youtube_id) || t.id === formattedTrack.id);
    if (exIdx === -1) {
      this.tracks.unshift(formattedTrack);
      this.currentTrackIndex = 0;
    } else {
      this.currentTrackIndex = exIdx;
    }

    if (formattedTrack.source_type === 'youtube' && formattedTrack.youtube_id) {
      this.currentSource = 'youtube';
      if (this.audioEl) this.audioEl.pause();

      if (this.ytPlayer && this.ytReady && this.ytPlayer.loadVideoById) {
        this.ytPlayer.loadVideoById(formattedTrack.youtube_id);
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(Math.floor(this.volume * 100));
        this.ytPlayer.playVideo();
      } else {
        this.pendingVideoId = formattedTrack.youtube_id;
      }
    } else {
      this.currentSource = 'audio';
      if (this.ytPlayer && this.ytPlayer.pauseVideo) this.ytPlayer.pauseVideo();
      const url = formattedTrack.audio_url || `api/endpoints/stream.php?id=${formattedTrack.id}`;
      this.audioEl.src = url;
      this.audioEl.currentTime = 0;
      this.audioEl.play().catch(e => console.log('Playback error:', e));
    }

    this.isPlaying = true;
    this.recordHistory(formattedTrack);
    this.startPlaybackWatchdog(formattedTrack);
    this.startTimer();
    this.updateUI();
  }

  // Modal: Add to Playlist logic
  bindAddToPlaylistModal() {
    const modal = document.getElementById('modal-add-to-playlist');
    const closeBtn = document.getElementById('btn-close-add-to-pl');
    const cancelBtn = document.getElementById('btn-cancel-add-to-pl');

    const closeModal = () => {
      if (modal) modal.classList.add('hidden');
      this.pendingAddToPlaylistTrack = null;
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  }

  // ─── Floating Synced Lyrics (Single-Line Karaoke Pill) ────────────────────

  toggleFloatingLyrics(forceState = null) {
    const panel = document.getElementById('floating-lyrics-panel');
    const btn = document.getElementById('btn-footer-lyrics');
    const dot = document.getElementById('lyrics-indicator-dot');
    if (!panel) return;

    if (forceState !== null) {
      this.isFloatingLyricsOpen = forceState;
    } else {
      this.isFloatingLyricsOpen = !this.isFloatingLyricsOpen;
    }

    if (this.isFloatingLyricsOpen) {
      panel.classList.remove('translate-y-4', 'opacity-0', 'pointer-events-none');
      panel.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

      if (btn) {
        btn.classList.add('text-secondary', 'drop-shadow-[0_0_8px_rgba(84,216,232,0.8)]');
        btn.classList.remove('text-on-surface-variant');
      }
      if (dot) dot.classList.remove('hidden');

      if (this.currentTrack) {
        this.loadTrackLyrics(this.currentTrack);
      } else {
        this.setFloatingLyricsText('Chưa chọn bài hát nào để hiển thị lời.');
      }
    } else {
      panel.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      panel.classList.add('translate-y-4', 'opacity-0', 'pointer-events-none');

      if (btn) {
        btn.classList.remove('text-secondary', 'drop-shadow-[0_0_8px_rgba(84,216,232,0.8)]');
        btn.classList.add('text-on-surface-variant');
      }
      if (dot) dot.classList.add('hidden');
    }
  }

  setFloatingLyricsText(text, isAnimated = true) {
    const lineEl = document.getElementById('floating-lyrics-single-line');
    if (!lineEl) return;
    if (!isAnimated || lineEl.textContent === text) {
      lineEl.textContent = text;
      return;
    }
    lineEl.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
      lineEl.textContent = text;
      lineEl.classList.remove('opacity-0', 'scale-95');
      lineEl.classList.add('opacity-100', 'scale-100');
    }, 120);
  }

  async loadTrackLyrics(track) {
    if (!track) return;
    const trackId = track.id || track.db_id || track.youtube_id || track.title;
    if (this.currentLyricsTrackId === trackId && this.currentLyrics && this.currentLyrics.length > 0) {
      this.syncFloatingLyrics(this.currentTime || 0);
      return;
    }

    this.currentLyricsTrackId = trackId;
    this.currentLyrics = [];
    this.activeLyricIndex = -1;

    this.setFloatingLyricsText('Đang đồng bộ lời bài hát từ Musixmatch & LRCLIB...', false);

    try {
      const qTitle = encodeURIComponent(track.title || '');
      const qArtist = encodeURIComponent(track.artist || '');
      const qId = track.db_id || (typeof track.id === 'number' ? track.id : 0);
      const qDur = track.duration || 0;

      const res = await this.safeFetchJson(`api/endpoints/lyrics.php?title=${qTitle}&artist=${qArtist}&id=${qId}&duration=${qDur}`);
      if (!res || !res.success || !res.lyrics) {
        this.currentLyrics = [{ time: 0, text: track.title || 'YouTube Music' }];
        this.setFloatingLyricsText(track.title || 'YouTube Music');
        return;
      }

      const rawLyrics = res.lyrics;
      let parsedLines = this.parseLrcString(rawLyrics);
      const isOldFiller = parsedLines.some(l => l.text.includes('Âm thanh mở đầu') || l.text.includes('MinhDucEar - Trải nghiệm'));
      if (isOldFiller) {
        parsedLines = [{ time: 0, text: track.title || parsedLines[0]?.text || '' }];
      }

      if (parsedLines && parsedLines.length > 0) {
        this.currentLyrics = parsedLines;
        this.syncFloatingLyrics(this.currentTime || 0);
      } else {
        this.currentLyrics = [{ time: 0, text: track.title || 'YouTube Music' }];
        this.setFloatingLyricsText(track.title || 'YouTube Music');
      }
    } catch (err) {
      this.currentLyrics = [{ time: 0, text: track.title || 'YouTube Music' }];
      this.setFloatingLyricsText(track.title || 'YouTube Music');
    }
  }

  parseLrcString(lrcString) {
    if (!lrcString) return [];
    const lines = [];
    const regex = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\](.*)/g;
    let match;
    while ((match = regex.exec(lrcString)) !== null) {
      const m = parseInt(match[1], 10);
      const s = parseFloat(match[2]);
      const text = match[3].trim();
      const time = m * 60 + s;
      if (text) {
        lines.push({ time, text });
      }
    }
    return lines.sort((a, b) => a.time - b.time);
  }

  syncFloatingLyrics(currentTime) {
    if (!this.isFloatingLyricsOpen || !this.currentLyrics || this.currentLyrics.length === 0) return;

    let newIndex = -1;
    for (let i = this.currentLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= this.currentLyrics[i].time) {
        newIndex = i;
        break;
      }
    }

    if (newIndex === -1) {
      if (this.activeLyricIndex !== -2) {
        this.activeLyricIndex = -2;
        const introText = this.currentTrack ? `♪ ${this.currentTrack.title} - ${this.currentTrack.artist || 'YouTube Music'} ♪` : '♪ [Dạo nhạc...] ♪';
        this.setFloatingLyricsText(introText);
      }
      return;
    }

    if (newIndex === this.activeLyricIndex) return;
    this.activeLyricIndex = newIndex;

    const currentLine = this.currentLyrics[newIndex];
    if (currentLine && currentLine.text) {
      this.setFloatingLyricsText(currentLine.text);
    }
  }

  seekToSeconds(seconds) {
    this.currentTime = seconds;
    if (this.currentSource === 'youtube') {
      if (this.ytPlayer && this.ytReady && this.ytPlayer.seekTo) {
        this.ytPlayer.seekTo(seconds, true);
        this.ytPlayer.playVideo();
        this.isPlaying = true;
      }
    } else if (this.currentSource === 'audio' && this.audioEl) {
      this.audioEl.currentTime = seconds;
      this.audioEl.play();
      this.isPlaying = true;
    }
    this.startTimer();
    this.updateUI();
  }


  // =========================================================================
  // RIGHT SIDEBAR MEDIA PLAYER CONTROLLER (Cover Art, Song Info, Synced Lyrics)
  // =========================================================================
  toggleRightMediaPlayer(forceOpen = null) {
    if (forceOpen !== null) {
      this.isRightMediaPlayerOpen = forceOpen;
    } else {
      this.isRightMediaPlayerOpen = !this.isRightMediaPlayerOpen;
    }

    const normalContent = document.getElementById('sidebar-normal-content');
    const mediaPlayer = document.getElementById('sidebar-media-player');

    // If opening, ensure user is on 'home' view where the right sidebar lives
    if (this.isRightMediaPlayerOpen) {
      const homeView = document.getElementById('view-home');
      if (homeView && homeView.classList.contains('hidden')) {
        this.switchView('home');
      }
    }

    if (normalContent && mediaPlayer) {
      if (this.isRightMediaPlayerOpen) {
        normalContent.classList.add('hidden');
        mediaPlayer.classList.remove('hidden');
        mediaPlayer.classList.add('flex');
        this.updateRightMediaPlayer();
      } else {
        mediaPlayer.classList.add('hidden');
        mediaPlayer.classList.remove('flex');
        normalContent.classList.remove('hidden');
      }
    }
  }

  updateRightMediaPlayer() {
    const mediaPlayer = document.getElementById('sidebar-media-player');
    if (!mediaPlayer || mediaPlayer.classList.contains('hidden')) return;

    const track = this.currentTrack || (this.tracks && this.tracks[this.currentTrackIndex]);
    if (!track) return;

    const coverImg = document.getElementById('right-player-cover');
    const titleEl = document.getElementById('right-player-title');
    const artistEl = document.getElementById('right-player-artist');
    const badgeEl = document.getElementById('right-player-badge');
    const favBtn = document.getElementById('right-player-fav-btn');
    const playIcon = document.getElementById('right-player-cover-play-icon');

    const coverUrl = track.cover || track.cover_url || (track.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400');
    const badgeText = track.badge || track.format || "YT AUDIO 320k";

    if (coverImg && coverUrl && coverImg.src !== coverUrl) {
      coverImg.src = coverUrl;
    }
    if (titleEl) {
      titleEl.textContent = track.title || 'Đang phát bài hát';
      titleEl.title = track.title || '';
    }
    if (artistEl) {
      artistEl.textContent = track.artist || 'MinhDuc Audio';
    }
    if (badgeEl) {
      badgeEl.textContent = badgeText;
    }

    if (favBtn) {
      const isFav = this.isTrackFavorite(track);
      favBtn.classList.toggle('text-red-500', isFav);
      favBtn.classList.toggle('text-tertiary', !isFav);
    }

    if (playIcon) {
      if (this.isPlaying) {
        playIcon.innerHTML = `<rect x="6" y="4" width="4" height="16" fill="currentColor"></rect><rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>`;
      } else {
        playIcon.innerHTML = `<polygon points="6,4 20,12 6,20" fill="currentColor"></polygon>`;
      }
    }

    // Check if we need to fetch lyrics for this track
    const trackKey = track.id || track.youtube_id || track.title;
    if (this.currentLyricsTrackKey !== trackKey) {
      this.currentLyricsTrackKey = trackKey;
      this.fetchLyricsForRightPlayer(track);
    }
  }

  // ─── Right Media Player Lyrics Fetcher ─────────────────────────────────────
  async fetchLyricsForRightPlayer(track) {
    if (!track) return;
    const container = document.getElementById('right-player-lyrics-container');
    const statusEl = document.getElementById('right-player-lyrics-status');
    if (!container) return;

    this.rightLyrics = [];
    this.activeRightLyricIndex = -1;

    container.innerHTML = `
      <div class="py-8 text-center flex flex-col items-center justify-center gap-2 text-gray-500 font-silkscreen text-[9px]">
        <span class="animate-spin text-secondary text-base">⏳</span>
        <span>Đang tải lời bài hát...</span>
      </div>
    `;

    try {
      const params = new URLSearchParams();
      if (track.db_id || track.id) params.append('id', track.db_id || track.id);
      if (track.title) params.append('title', track.title);
      if (track.artist) params.append('artist', track.artist);

      const res = await fetch(`api/endpoints/lyrics.php?${params.toString()}`);
      const data = await res.json();

      if (data && data.success && data.lyrics) {
        const rawLyrics = data.lyrics;
        let parsedLines = this.parseLrcString(rawLyrics);

        const isOldFiller = parsedLines.some(l => l.text.includes('Âm thanh mở đầu') || l.text.includes('MinhDucEar - Trải nghiệm'));
        if (isOldFiller) {
          parsedLines = [{ time: 0, text: track.title || parsedLines[0]?.text || '' }];
        }

        if (parsedLines && parsedLines.length > 0) {
          this.rightLyrics = parsedLines;
          if (statusEl) {
            statusEl.textContent = '';
            statusEl.style.display = 'none';
          }
          this.renderRightLrcLines();
          this.syncRightLyrics(this.currentTime || 0);
        } else {
          if (statusEl) {
            statusEl.textContent = '';
            statusEl.style.display = 'none';
          }
          const paragraphs = rawLyrics.split('\n').filter(l => l.trim() !== '');
          if (paragraphs.length > 0) {
            container.innerHTML = `
              <div class="space-y-2 py-2 px-1 text-gray-300 font-silkscreen text-xs leading-relaxed text-center">
                ${paragraphs.map(line => `<p class="hover:text-white transition-colors py-0.5">${this.escapeHtml(line)}</p>`).join('')}
              </div>
            `;
          } else {
            this.rightLyrics = [{ time: 0, text: track.title || 'YouTube Music' }];
            this.renderRightLrcLines();
            this.syncRightLyrics(this.currentTime || 0);
          }
        }
      } else {
        if (statusEl) {
          statusEl.textContent = '';
          statusEl.style.display = 'none';
        }
        // Songs without lyrics: display only 1 line with the track title
        this.rightLyrics = [{ time: 0, text: track.title || 'YouTube Music' }];
        this.renderRightLrcLines();
        this.syncRightLyrics(this.currentTime || 0);
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.display = 'none';
      }
      // Fallback: display only 1 line with track title
      this.rightLyrics = [{ time: 0, text: track.title || 'YouTube Music' }];
      this.renderRightLrcLines();
      this.syncRightLyrics(this.currentTime || 0);
    }
  }

  renderRightLrcLines() {

    const mobContainer = document.getElementById('mobile-drawer-lyrics-container');
    if (mobContainer) {
      if (!this.rightLyrics || this.rightLyrics.length === 0) {
        mobContainer.innerHTML = '<div class="py-8 text-center text-gray-500 font-silkscreen text-[9px]">Không có nội dung lời bài hát.</div>';
      } else {
        mobContainer.innerHTML = this.rightLyrics.map((item, idx) => `
          <p class="right-lyric-line mobile-lyric-line select-none cursor-pointer text-xs sm:text-sm py-1.5 px-3 rounded-xl transition-all"
             data-index="${idx}"
             data-time="${item.time}">
            ${this.escapeHtml(item.text)}
          </p>
        `).join('');

        mobContainer.querySelectorAll('.mobile-lyric-line').forEach(el => {
          el.addEventListener('click', () => {
            const time = parseFloat(el.dataset.time);
            if (!isNaN(time)) {
              this.seekToSeconds(time);
            }
          });
        });
      }
    }

    const container = document.getElementById('right-player-lyrics-container');
    if (!container) return;

    if (!this.rightLyrics || this.rightLyrics.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-gray-500 font-silkscreen text-[9px]">Không có nội dung lời bài hát.</div>
      `;
      return;
    }

    container.innerHTML = this.rightLyrics.map((item, idx) => `
      <p class="right-lyric-line select-none cursor-pointer"
         data-index="${idx}"
         data-time="${item.time}">
        ${this.escapeHtml(item.text)}
      </p>
    `).join('');

    container.querySelectorAll('.right-lyric-line').forEach(el => {
      el.addEventListener('click', () => {
        const time = parseFloat(el.dataset.time);
        if (!isNaN(time)) {
          this.seekToSeconds(time);
        }
      });
    });
  }

  syncRightLyrics(currentTime) {
    if (!this.rightLyrics || this.rightLyrics.length === 0) return;
    const container = document.getElementById('right-player-lyrics-container');
    if (!container) return;

    let newIndex = -1;
    for (let i = this.rightLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= this.rightLyrics[i].time) {
        newIndex = i;
        break;
      }
    }

    if (newIndex === this.activeRightLyricIndex) return;
    this.activeRightLyricIndex = newIndex;

    const lines = container.querySelectorAll('.right-lyric-line');
    lines.forEach((lineEl, idx) => {
      if (idx === newIndex) {
        lineEl.className = 'right-lyric-line active-lyric select-none cursor-pointer';
        
        const parentHeight = container.clientHeight;
        const lineTop = lineEl.offsetTop;
        const lineHeight = lineEl.clientHeight;
        const targetScroll = lineTop - (parentHeight / 2) + (lineHeight / 2);
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      } else {
        lineEl.className = 'right-lyric-line select-none cursor-pointer';
      }
    });
  }

  openAddToPlaylistModal(track) {

    const modal = document.getElementById('modal-add-to-playlist');
    const thumb = document.getElementById('add-to-pl-thumb');
    const title = document.getElementById('add-to-pl-title');
    const artist = document.getElementById('add-to-pl-artist');
    const list = document.getElementById('add-to-pl-list');

    if (!modal || !list) return;

    this.pendingAddToPlaylistTrack = track;
    if (thumb) thumb.src = track.cover_url || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg');
    if (title) title.textContent = track.title || 'YouTube Track';
    if (artist) artist.textContent = track.artist || 'YouTube Music';

    list.innerHTML = '';

    if (!this.currentPlaylists || this.currentPlaylists.length === 0) {
      list.innerHTML = '<div class="p-3 text-center text-xs font-silkscreen text-gray-400">Bạn chưa có playlist nào. Hãy tạo playlist ở thanh bên trái!</div>';
    } else {
      this.currentPlaylists.forEach(pl => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest cursor-pointer border border-outline-variant/30 text-xs transition-colors group';
        item.innerHTML = `
          <span class="font-bold text-on-surface group-hover:text-secondary transition-colors truncate">${this.escapeHtml(pl.name)}</span>
          <span class="font-silkscreen text-[8px] text-gray-400 shrink-0">${pl.total_tracks || 0} bài</span>
        `;
        item.addEventListener('click', async () => {
          try {
            const res = await fetch('api/endpoints/tracks.php?action=add_to_playlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playlist_id: pl.id,
                track_id: track.db_id || track.id,
                youtube_id: track.youtube_id,
                title: track.title,
                artist: track.artist,
                cover_url: track.cover_url,
                duration: track.duration
              })
            });
            const result = await res.json();
            if (result.success) {
              modal.classList.add('hidden');
              this.loadSidebarPlaylists();
              this.showInpageAlert(`Đã thêm vào playlist "${pl.name}" thành công!`, 'success');
            } else {
              alert(result.message || 'Lỗi thêm bài hát!');
            }
          } catch (err) {
            alert('Lỗi kết nối máy chủ!');
          }
        });
        list.appendChild(item);
      });
    }

    modal.classList.remove('hidden');
  }


  // =========================================================================
  // SIDEBAR NAVIGATION & VIEWS CONTROLLER (Trang chủ, Khám phá, Tìm kiếm, Yêu thích, Vừa phát, Album)
  // =========================================================================

  // Helper: Format relative time for recently played history
  getRelativeTime(timestamp) {
    if (!timestamp) return 'Gần đây';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
  }

  getHistoryStorageKey() {
    if (this.currentUser && this.currentUser.id) {
      return `minhduc_history_user_${this.currentUser.id}`;
    }
    return 'minhduc_history_guest';
  }

  getFavoritesStorageKey() {
    if (this.currentUser && this.currentUser.id) {
      return `minhduc_favs_user_${this.currentUser.id}`;
    }
    return 'minhduc_favs_guest';
  }

  getFavoriteAlbumsStorageKey() {
    if (this.currentUser && this.currentUser.id) {
      return `minhduc_fav_albums_user_${this.currentUser.id}`;
    }
    return 'minhduc_fav_albums_guest';
  }

  getFavoriteAlbums() {
    try {
      const key = this.getFavoriteAlbumsStorageKey();
      let albums = JSON.parse(localStorage.getItem(key) || 'null');
      if (albums === null) {
        albums = [];
        localStorage.setItem(key, JSON.stringify(albums));
      }
      return Array.isArray(albums) ? albums : [];
    } catch (e) {
      return [];
    }
  }

  isAlbumFavorited(album) {
    if (!album) return false;
    const normTitle = (album.title || '').toLowerCase().trim();
    const favAlbums = this.getFavoriteAlbums();
    return favAlbums.some(a => (a.title || '').toLowerCase().trim() === normTitle);
  }

  // Record track to recently played history
  recordHistory(track) {
    if (!track || (!track.title && !track.youtube_id)) return;
    try {
      const key = this.getHistoryStorageKey();
      let history = JSON.parse(localStorage.getItem(key) || '[]');
      // Deduplicate by youtube_id or title
      history = history.filter(item => {
        if (track.youtube_id && item.youtube_id) {
          return item.youtube_id !== track.youtube_id;
        }
        return item.title !== track.title;
      });
      // Add to front
      history.unshift({
        id: track.id || ('yt_' + (track.youtube_id || Math.random().toString(36).substr(2, 9))),
        db_id: track.db_id,
        title: track.title,
        artist: track.artist || 'Nghệ sĩ',
        album: track.album || 'YouTube Music',
        duration: track.duration || 210,
        format: track.format || 'YT 320k',
        cover_url: track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg'),
        youtube_id: track.youtube_id,
        played_at: Date.now(),
        playedAt: Date.now()
      });
      // Keep up to 60 tracks
      if (history.length > 60) history = history.slice(0, 60);
      localStorage.setItem(key, JSON.stringify(history));

      // Refresh sidebar recent history
      this.renderSidebarRecentTracks();

      // If user is logged in, record to MySQL database for this specific user
      if (this.currentUser && this.currentUser.id) {
        // Prevent duplicate history_record requests on rapid clicks (within 5 seconds)
        const now = Date.now();
        const trIdKey = track.youtube_id || track.db_id || track.id || track.title;
        if (this._lastRecordedTrKey === trIdKey && (now - (this._lastRecordedTime || 0)) < 5000) {
          return;
        }
        this._lastRecordedTrKey = trIdKey;
        this._lastRecordedTime = now;

        const formData = new FormData();
        formData.append('track_id', track.db_id || track.id || '');
        formData.append('youtube_id', track.youtube_id || '');
        formData.append('title', track.title || '');
        formData.append('artist', track.artist || '');
        formData.append('cover_url', track.cover_url || track.cover || '');
        formData.append('duration', track.duration || 210);
        fetch('api/endpoints/tracks.php?action=history_record', {
          method: 'POST',
          body: formData
        }).then(res => res.json()).then(res => {
          if (res.success && res.track_id) {
            track.db_id = res.track_id;
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }

  // Bind all 6 sidebar navigation buttons + brand logo
  bindSidebarNavigation() {
    const brandLogo = document.getElementById('header-brand-logo');
    if (brandLogo) {
      const goHome = (e) => {
        if (e) e.preventDefault();
        this.switchView('home');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      };
      brandLogo.addEventListener('click', goHome);
      brandLogo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          goHome(e);
        }
      });
    }

    const navHome = document.getElementById('nav-btn-home');
    const navExplore = document.getElementById('sidebar-nav-explore');
    const navSearch = document.getElementById('sidebar-nav-search');
    const navFavorites = document.getElementById('sidebar-nav-favorites');
    const navHistory = document.getElementById('sidebar-nav-history');
    const navAlbums = document.getElementById('sidebar-nav-albums');

    if (navHome) {
      navHome.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('home');
      });
    }

    if (navExplore) {
      navExplore.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('explore');
      });
    }

    // Home "ĐỀ XUẤT CHO BẠN" Header -> "xem thêm" button opens Explore
    const btnSeeMoreExplore = document.getElementById('btn-home-see-more-explore');
    if (btnSeeMoreExplore) {
      btnSeeMoreExplore.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('explore');
      });
    }

    if (navSearch) {
      navSearch.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('search');
        const viewInput = document.getElementById('view-search-input');
        if (viewInput) viewInput.focus();
      });
    }

    if (navFavorites) {
      navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('favorites');
      });
    }

    if (navHistory) {
      navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('history');
      });
    }

    if (navAlbums) {
      navAlbums.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('albums');
      });
    }

    // Bind In-page buttons for Explore View
    const exploreRefresh = document.getElementById('btn-explore-refresh');
    if (exploreRefresh) {
      exploreRefresh.addEventListener('click', () => this.loadExploreView(true));
    }

    // Bind trending cards in Explore View
    document.querySelectorAll('.explore-trend-card').forEach(card => {
      card.addEventListener('click', () => {
        const query = card.getAttribute('data-explore-query') || '';
        if (query) {
          this.switchView('search');
          const viewInput = document.getElementById('view-search-input');
          if (viewInput) viewInput.value = query;
          this.performSearch(query, 'all');
        }
      });
    });

    // Bind artist buttons in Explore View
    document.querySelectorAll('.explore-artist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const artist = btn.getAttribute('data-artist') || '';
        if (artist) {
          this.switchView('search');
          const viewInput = document.getElementById('view-search-input');
          if (viewInput) viewInput.value = artist;
          this.performSearch(artist, 'all');
        }
      });
    });

    // Bind Favorites actions & Toggle Switch (Bài hát vs Album)
    const btnFavTabSongs = document.getElementById('btn-fav-tab-songs');
    if (btnFavTabSongs) {
      btnFavTabSongs.addEventListener('click', () => this.switchFavoriteTab('songs'));
    }
    const btnFavTabAlbums = document.getElementById('btn-fav-tab-albums');
    if (btnFavTabAlbums) {
      btnFavTabAlbums.addEventListener('click', () => this.switchFavoriteTab('albums'));
    }

    const btnFavPlayAll = document.getElementById('btn-fav-play-all');
    if (btnFavPlayAll) {
      btnFavPlayAll.addEventListener('click', () => this.playAllFavorites());
    }
    const btnFavRefresh = document.getElementById('btn-fav-refresh');
    if (btnFavRefresh) {
      btnFavRefresh.addEventListener('click', () => {
        if (this.activeFavTab === 'albums') {
          this.loadFavoriteAlbums();
        } else {
          this.loadFavoritesView(true);
        }
      });
    }

    // Bind History actions
    const btnHistPlayAll = document.getElementById('btn-history-play-all');
    if (btnHistPlayAll) {
      btnHistPlayAll.addEventListener('click', () => this.playAllHistory());
    }
    const btnHistClear = document.getElementById('btn-history-clear');
    if (btnHistClear) {
      btnHistClear.addEventListener('click', () => this.clearHistory());
    }

    // Bind Album Play Buttons
    document.querySelectorAll('.btn-album-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const query = btn.getAttribute('data-album-query') || '';
        this.playAlbumDirect(query);
      });
    });
    document.querySelectorAll('.album-card').forEach(card => {
      card.addEventListener('click', () => {
        const btn = card.querySelector('.btn-album-play');
        if (btn) {
          const query = btn.getAttribute('data-album-query') || '';
          this.playAlbumDirect(query);
        }
      });
    });
    // Manual Load More Button for Search View
    const btnSearchLoadMore = document.getElementById('btn-search-load-more');
    if (btnSearchLoadMore) {
      btnSearchLoadMore.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadMoreSearchResults();
      });
    }

    // Dual-trigger Infinite Scroll on Search View: Scroll Event + IntersectionObserver
    const viewSearchEl = document.getElementById('view-search');
    if (viewSearchEl) {
      viewSearchEl.addEventListener('scroll', () => {
        if (this.isSearchLoading || this.noMoreSearchResults) return;
        if (viewSearchEl.scrollTop + viewSearchEl.clientHeight >= viewSearchEl.scrollHeight - 350) {
          this.loadMoreSearchResults();
        }
      });

      const searchSentinel = document.getElementById('search-scroll-sentinel');
      if (searchSentinel && 'IntersectionObserver' in window) {
        const searchObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.isSearchLoading && !this.noMoreSearchResults && !viewSearchEl.classList.contains('hidden')) {
              this.loadMoreSearchResults();
            }
          });
        }, { root: viewSearchEl, rootMargin: '250px', threshold: 0.1 });
        searchObserver.observe(searchSentinel);
      }
    }

    // Dual-trigger Infinite Scroll on Explore View: Scroll Event + IntersectionObserver
    const viewExploreEl = document.getElementById('view-explore');
    if (viewExploreEl) {
      viewExploreEl.addEventListener('scroll', () => {
        if (this.isExploreLoading || this.noMoreExploreResults) return;
        if (viewExploreEl.scrollTop + viewExploreEl.clientHeight >= viewExploreEl.scrollHeight - 350) {
          this.loadMoreExploreResults();
        }
      });

      const exploreSentinel = document.getElementById('explore-scroll-sentinel');
      if (exploreSentinel && 'IntersectionObserver' in window) {
        const exploreObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.isExploreLoading && !this.noMoreExploreResults && !viewExploreEl.classList.contains('hidden')) {
              this.loadMoreExploreResults();
            }
          });
        }, { root: viewExploreEl, rootMargin: '250px', threshold: 0.1 });
        exploreObserver.observe(exploreSentinel);
      }
    }

    // Infinite Scroll on Favorites View
    const viewFavoritesEl = document.getElementById('view-favorites');
    if (viewFavoritesEl) {
      viewFavoritesEl.addEventListener('scroll', () => {
        if (this.isFavLoading || this.noMoreFavs) return;
        if (viewFavoritesEl.scrollTop + viewFavoritesEl.clientHeight >= viewFavoritesEl.scrollHeight - 350) {
          this.loadMoreFavorites();
        }
      });
    }

    // Infinite Scroll on History View
    const viewHistoryEl = document.getElementById('view-history');
    if (viewHistoryEl) {
      viewHistoryEl.addEventListener('scroll', () => {
        if (this.isHistoryLoading || this.noMoreHistory) return;
        if (viewHistoryEl.scrollTop + viewHistoryEl.clientHeight >= viewHistoryEl.scrollHeight - 350) {
          this.loadMoreHistory();
        }
      });
    }

    // Infinite Scroll on Albums View
    const viewAlbumsEl = document.getElementById('view-albums');
    if (viewAlbumsEl) {
      viewAlbumsEl.addEventListener('scroll', () => {
        if (this.isAlbumLoading || this.noMoreAlbums) return;
        if (viewAlbumsEl.scrollTop + viewAlbumsEl.clientHeight >= viewAlbumsEl.scrollHeight - 350) {
          this.loadMoreAlbums();
        }
      });
    }

  }

  // Central SPA View Switcher
  switchView(viewName) {
    const views = {
      home: document.getElementById('view-home'),
      explore: document.getElementById('view-explore'),
      search: document.getElementById('view-search'),
      favorites: document.getElementById('view-favorites'),
      history: document.getElementById('view-history'),
      albums: document.getElementById('view-albums'),
      album_detail: document.getElementById('view-album-detail'),
      account: document.getElementById('view-account')
    };

    const navItems = {
      home: document.getElementById('nav-btn-home'),
      explore: document.getElementById('sidebar-nav-explore'),
      search: document.getElementById('sidebar-nav-search'),
      favorites: document.getElementById('sidebar-nav-favorites'),
      history: document.getElementById('sidebar-nav-history'),
      albums: document.getElementById('sidebar-nav-albums')
    };

    // 1. Hide all views
    Object.values(views).forEach(v => {
      if (v) v.classList.add('hidden');
    });

    if (viewName !== 'album_detail') {
      this.previousView = this.currentView || 'home';
      this.isShowingPlaylistDetail = false;
      if (typeof this.highlightActiveSidebarPlaylist === 'function') {
        this.highlightActiveSidebarPlaylist(null);
      }
    }
    this.currentView = viewName;

    // Update mobile dock buttons active state
    document.querySelectorAll('.mobile-dock-btn').forEach(btn => {
      const v = btn.getAttribute('data-view');
      if (v === viewName) {
        btn.classList.add('text-secondary', 'font-bold', 'active');
        btn.classList.remove('text-gray-400');
      } else if (v) {
        btn.classList.remove('text-secondary', 'font-bold', 'active');
        btn.classList.add('text-gray-400');
      }
    });


    // 2. Reset styling on all sidebar navigation buttons
    Object.entries(navItems).forEach(([key, nav]) => {
      if (!nav) return;
      nav.classList.remove(
        'bg-primary-container', 'text-on-primary', 'font-bold',
        'shadow-[0_0_12px_rgba(167,139,250,0.3)]', 'pixel-btn'
      );
      nav.classList.add(
        'text-on-surface-variant', 'hover:bg-surface-container-high',
        'hover:text-on-surface', 'font-medium'
      );
    });

    // 3. Highlight selected button (or parent section)
    const effectiveNavKey = (viewName === 'album_detail' && !this.isShowingPlaylistDetail)
      ? 'albums'
      : (viewName === 'album_detail' ? null : viewName);
    if (effectiveNavKey && navItems[effectiveNavKey]) {
      const activeNav = navItems[effectiveNavKey];
      activeNav.classList.remove(
        'text-on-surface-variant', 'hover:bg-surface-container-high',
        'hover:text-on-surface', 'font-medium'
      );
      activeNav.classList.add(
        'bg-primary-container', 'text-on-primary', 'font-bold',
        'shadow-[0_0_12px_rgba(167,139,250,0.3)]', 'pixel-btn'
      );
    }

    // 4. Show selected view and load its data
    if (views[viewName]) {
      views[viewName].classList.remove('hidden');
    }

    if (viewName === 'home') {
      // Home view active
    } else if (viewName === 'explore') {
      this.loadExploreView();
    } else if (viewName === 'search') {
      const searchInput = document.getElementById('view-search-input');
      if (searchInput && !searchInput.value) {
        this.performSearch('', this.currentSearchCategory || 'all');
      }
    } else if (viewName === 'favorites') {
      this.loadFavoritesView();
    } else if (viewName === 'history') {
      this.loadHistoryView();
    } else if (viewName === 'albums') {
      this.loadAlbumsView();
    } else if (viewName === 'account') {
      this.clearInpageAlert();
      this.renderInpageAccountView();
    }
  }

  // -------------------------------------------------------------
  // VIEW LOGIC: KHÁM PHÁ (EXPLORE - 12 tracks initially + Fast Infinite Scroll)
  // -------------------------------------------------------------
  async loadExploreView(force = false) {
    const container = document.getElementById('explore-tracks-grid');
    const badge = document.getElementById('explore-count-badge');
    const sentinel = document.getElementById('explore-scroll-sentinel');
    if (!container) return;

    if (!force && container.children.length > 3) return; // Already loaded

    this.exploreOffset = 0;
    this.isExploreLoading = true;
    this.noMoreExploreResults = false;
    this.exploreTracksList = [];
    this.exploreSeenIds = new Set();

    if (sentinel) sentinel.classList.add('hidden');

    container.innerHTML = `
      <div class="col-span-full py-12 flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
        <span class="font-silkscreen text-xs text-gray-400">Đang tải 12 bản nhạc đề xuất YouTube...</span>
      </div>
    `;

    try {
      const res = await fetch('api/endpoints/tracks.php?action=explore&limit=12&offset=0');
      const data = await res.json();
      this.isExploreLoading = false;

      if (data.success && data.tracks && data.tracks.length > 0) {
        this.exploreTracksList = data.tracks;
        data.tracks.forEach(t => {
          const tid = t.youtube_id || t.id;
          if (tid) this.exploreSeenIds.add(tid);
        });
        if (badge) badge.textContent = `${data.tracks.length} BÀI HÁT ĐỀ XUẤT`;
        container.innerHTML = '';
        this.renderExploreCards(data.tracks, false);
      } else {
        container.innerHTML = '<div class="col-span-full py-12 text-center text-xs font-silkscreen text-gray-400">Không tải được nhạc khám phá. Hãy thử làm mới.</div>';
      }
    } catch (e) {
      this.isExploreLoading = false;
      container.innerHTML = '<div class="col-span-full py-12 text-center text-xs font-silkscreen text-red-400">Lỗi kết nối máy chủ!</div>';
    }
  }

  // Infinite Scroll: Fast load next 12 explore tracks on scroll
  async loadMoreExploreResults() {
    if (this.isExploreLoading || this.noMoreExploreResults) return;
    this.isExploreLoading = true;

    // Safety timeout: reset flag after 8s so user is never locked out
    const timeoutId = setTimeout(() => {
      if (this.isExploreLoading) {
        this.isExploreLoading = false;
        const s = document.getElementById('explore-scroll-sentinel');
        if (s) s.classList.add('hidden');
      }
    }, 8000);

    const sentinel = document.getElementById('explore-scroll-sentinel');
    const badge = document.getElementById('explore-count-badge');
    if (sentinel) sentinel.classList.remove('hidden');

    this.exploreOffset += 12;
    const excludeList = Array.from(this.exploreSeenIds || []).slice(-40).join(',');

    try {
      const res = await fetch(`api/endpoints/tracks.php?action=explore&limit=12&offset=${this.exploreOffset}&exclude=${encodeURIComponent(excludeList)}`);
      const data = await res.json();

      clearTimeout(timeoutId);
      this.isExploreLoading = false;
      if (sentinel) sentinel.classList.add('hidden');

      if (data.success && data.tracks && data.tracks.length > 0) {
        // Strict 2-layer deduplication against exploreSeenIds
        const uniqueTracks = data.tracks.filter(t => {
          const tid = t.youtube_id || t.id;
          if (!tid || (this.exploreSeenIds && this.exploreSeenIds.has(tid))) return false;
          if (this.exploreSeenIds) this.exploreSeenIds.add(tid);
          return true;
        });

        if (uniqueTracks.length > 0) {
          this.exploreTracksList = (this.exploreTracksList || []).concat(uniqueTracks);
          if (badge) badge.textContent = `${this.exploreTracksList.length} BÀI HÁT ĐỀ XUẤT`;
          this.renderExploreCards(uniqueTracks, true);
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      this.isExploreLoading = false;
      if (sentinel) sentinel.classList.add('hidden');
    }
  }

  // Render cards for explore view
  renderExploreCards(tracks, append = false) {
    const container = document.getElementById('explore-tracks-grid');
    if (!container) return;
    if (!append) container.innerHTML = '';

    tracks.forEach(track => {
      const tid = track.youtube_id || track.id;
      if (tid && this.exploreSeenIds) this.exploreSeenIds.add(tid);
      const card = document.createElement('div');
      card.className = 'music-card-item group bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-secondary/60 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(84,216,232,0.15)] cursor-pointer select-none';
      const coverImg = track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg');
      const duration = track.duration_str || (track.duration ? gmdate_min_sec(track.duration) : '03:45');

      card.innerHTML = `
        <div class="w-full aspect-square rounded-lg overflow-hidden relative mb-2.5">
          <img alt="${this.escapeHtml(track.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${coverImg}">
          <div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/90 font-mono text-[9px] font-semibold text-secondary border border-secondary/60 rounded shadow">
            ${track.format || 'YT 320k'}
          </div>
          <div class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 font-mono text-[8px] text-gray-300 rounded">
            ${duration}
          </div>
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" class="btn-card-play w-10 h-10 bg-secondary text-black flex items-center justify-center rounded-full shadow-lg transform group-hover:scale-110 transition-transform hover:brightness-110" title="Phát ngay">
              <svg class="w-5 h-5 ml-0.5 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"></polygon></svg>
            </button>
          </div>
        </div>
        <div class="flex flex-col min-w-0">
          <h4 class="text-xs sm:text-sm font-semibold text-white tracking-wide truncate group-hover:text-secondary transition-colors mb-0.5" title="${this.escapeHtml(track.title)}">
            ${this.escapeHtml(track.title)}
          </h4>
          <p class="text-[11px] text-gray-400 truncate mb-2" title="${this.escapeHtml(track.artist)}">
            ${this.escapeHtml(track.artist)}
          </p>
          <div class="flex items-center justify-between pt-1.5 border-t border-white/5">
            <span class="font-mono text-[8px] text-secondary bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/30 font-semibold">EXPLORE</span>
            <div class="flex items-center gap-1">
              <button type="button" class="btn-card-add-pl p-1 text-gray-400 hover:text-white rounded transition-colors" title="Thêm vào Playlist">
                <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              </button>
              <button type="button" class="btn-card-fav p-1 text-gray-400 hover:text-red-400 rounded transition-colors" title="Yêu thích">
                <svg class="w-3.5 h-3.5 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-card-add-pl') || e.target.closest('.btn-card-fav')) return;
        this.playTrackDirect(track);
      });

      const addPlBtn = card.querySelector('.btn-card-add-pl');
      if (addPlBtn) {
        addPlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openAddToPlaylistModal(track);
        });
      }

      const favBtn = card.querySelector('.btn-card-fav');
      if (favBtn) {
        favBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          this.toggleFavorite(track, favBtn);
        });
      }

      container.appendChild(card);
    });
  }

  // -------------------------------------------------------------
  // VIEW LOGIC: YÊU THÍCH (FAVORITES - SONGS & ALBUMS TOGGLE)
  // -------------------------------------------------------------
  switchFavoriteTab(tab = 'songs') {
    this.activeFavTab = tab;
    const btnSongs = document.getElementById('btn-fav-tab-songs');
    const btnAlbums = document.getElementById('btn-fav-tab-albums');
    const titleEl = document.getElementById('fav-view-title');
    const descEl = document.getElementById('fav-view-desc');
    const tracksContainer = document.getElementById('fav-tracks-container');
    const albumsContainer = document.getElementById('fav-albums-container');
    const playAllBtn = document.getElementById('btn-fav-play-all');
    const sentinel = document.getElementById('favorites-scroll-sentinel');

    if (tab === 'albums') {
      if (btnAlbums) {
        btnAlbums.className = 'px-3 py-1.5 rounded-lg font-pixel text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)] font-bold';
      }
      if (btnSongs) {
        btnSongs.className = 'px-3 py-1.5 rounded-lg font-pixel text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/5 font-normal';
      }

      if (titleEl) titleEl.textContent = 'ALBUM YÊU THÍCH / FAVORITE ALBUMS';
      if (descEl) descEl.textContent = 'Kho lưu trữ những Album bạn đã đánh dấu trái tim yêu thích';

      if (playAllBtn) playAllBtn.classList.add('hidden');
      if (tracksContainer) tracksContainer.classList.add('hidden');
      if (sentinel) sentinel.classList.add('hidden');
      if (albumsContainer) albumsContainer.classList.remove('hidden');

      this.loadFavoriteAlbums();
    } else {
      if (btnSongs) {
        btnSongs.className = 'px-3 py-1.5 rounded-lg font-pixel text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)] font-bold';
      }
      if (btnAlbums) {
        btnAlbums.className = 'px-3 py-1.5 rounded-lg font-pixel text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/5 font-normal';
      }

      if (titleEl) titleEl.textContent = 'BÀI HÁT YÊU THÍCH / FAVORITES';
      if (descEl) descEl.textContent = 'Kho lưu trữ những bài hát bạn đã đánh dấu trái tim yêu thích';

      if (playAllBtn) playAllBtn.classList.remove('hidden');
      if (albumsContainer) albumsContainer.classList.add('hidden');
      if (tracksContainer) tracksContainer.classList.remove('hidden');

      this.loadFavoritesView(true);
    }
  }

  // Load and render favorite albums
  async loadFavoriteAlbums() {
    const container = document.getElementById('fav-albums-container');
    const badge = document.getElementById('fav-count-badge');
    if (!container) return;

    container.innerHTML = `
      <div class="col-span-full py-12 flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"></div>
        <span class="font-silkscreen text-xs text-gray-400">Đang tải danh sách Album yêu thích...</span>
      </div>
    `;

    let albums = [];

    // Try database if logged in
    if (this.currentUser && this.currentUser.id) {
      try {
        const res = await fetch(`api/endpoints/playlists.php?action=favorite_albums_list&user_id=${this.currentUser.id}`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.albums)) {
          albums = data.albums;
        }
      } catch (e) {}
    }

    // Merge with local storage favorite albums
    const localAlbums = this.getFavoriteAlbums();
    const seen = new Set(albums.map(a => (a.title || '').toLowerCase().trim()));
    localAlbums.forEach(la => {
      const norm = (la.title || '').toLowerCase().trim();
      if (norm && !seen.has(norm)) {
        albums.push(la);
        seen.add(norm);
      }
    });

    if (badge) badge.textContent = `${albums.length} ALBUM`;

    if (albums.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center flex flex-col items-center justify-center gap-3 bg-black/20 rounded-2xl border border-white/5 p-6">
          <div class="w-16 h-16 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30 flex items-center justify-center text-2xl animate-bounce">
            💿
          </div>
          <h4 class="font-pixel text-xs text-white uppercase tracking-wide mt-2">CHƯA CÓ ALBUM YÊU THÍCH</h4>
          <p class="font-silkscreen text-[9px] text-gray-400 max-w-sm leading-relaxed">
            Nhấn vào biểu tượng trái tim [♥] trên các Album yêu thích trong mục Album để lưu vào đây!
          </p>
          <button type="button" class="mt-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs pixel-btn cursor-pointer" onclick="minhDucPlayer.switchView('albums')">
            KHÁM PHÁ DANH MỤC ALBUM →
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    albums.forEach(alb => {
      const card = document.createElement('div');
      card.className = 'album-card group bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-pink-500/60 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer relative';
      const cover = alb.cover || alb.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';

      card.innerHTML = `
        <div class="w-full aspect-square rounded-lg overflow-hidden relative mb-2.5 bg-black/60">
          <img src="${cover}" alt="${this.escapeHtml(alb.title)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute top-2 left-2 px-1.5 py-0.5 bg-black/90 font-mono text-[8px] font-semibold text-pink-400 border border-pink-400/60 rounded">
            ${alb.badge || 'FLAC 96k'}
          </div>
          <!-- Remove from favorite button -->
          <button type="button" class="btn-fav-album-remove absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-pink-600 text-pink-400 hover:text-white flex items-center justify-center border border-pink-500/50 transition-all cursor-pointer z-10" title="Bỏ yêu thích album này">
            ♥
          </button>
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button type="button" class="btn-album-play w-11 h-11 bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center rounded-full shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer" data-album-query="${this.escapeHtml(alb.query || alb.title)}">
              <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"></polygon></svg>
            </button>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-bold text-white group-hover:text-pink-400 transition-colors truncate">${this.escapeHtml(alb.title)}</h4>
          <p class="text-xs text-gray-400 truncate mt-0.5">${this.escapeHtml(alb.artist || 'Nghệ sĩ')}</p>
          <div class="flex items-center justify-between pt-2 mt-2 border-t border-white/10 font-silkscreen text-[9px] text-outline">
            <span>${alb.year || '2026'} • ${alb.tracks_count || 'ALBUM'}</span>
            <span class="text-pink-400 font-bold">♥ YÊU THÍCH</span>
          </div>
        </div>
      `;

      card.onclick = (e) => {
        if (e.target.closest('.btn-album-play') || e.target.closest('.btn-fav-album-remove')) return;
        this.openAlbumDetail(alb);
      };

      const playBtn = card.querySelector('.btn-album-play');
      if (playBtn) {
        playBtn.onclick = (e) => {
          e.stopPropagation();
          this.playAlbumDirect(alb.query || alb.title);
        };
      }

      const removeBtn = card.querySelector('.btn-fav-album-remove');
      if (removeBtn) {
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          this.toggleAlbumFavorite(alb);
          this.loadFavoriteAlbums();
        };
      }

      container.appendChild(card);
    });
  }

  async loadFavoritesView(force = false) {
    if (this.activeFavTab === 'albums') {
      return this.loadFavoriteAlbums();
    }
    const container = document.getElementById('fav-tracks-container');
    const albumsContainer = document.getElementById('fav-albums-container');
    const playAllBtn = document.getElementById('btn-fav-play-all');
    const titleEl = document.getElementById('fav-view-title');
    const descEl = document.getElementById('fav-view-desc');
    const badge = document.getElementById('fav-count-badge');
    const sentinel = document.getElementById('favorites-scroll-sentinel');

    if (albumsContainer) albumsContainer.classList.add('hidden');
    if (container) container.classList.remove('hidden');
    if (playAllBtn) playAllBtn.classList.remove('hidden');
    if (titleEl) titleEl.textContent = 'BÀI HÁT YÊU THÍCH / FAVORITES';
    if (descEl) descEl.textContent = 'Kho lưu trữ những bài hát bạn đã đánh dấu trái tim yêu thích';

    if (!container) return;

    this.favOffset = 0;
    this.favLimit = 10;
    this.isFavLoading = false;
    this.noMoreFavs = false;
    if (sentinel) sentinel.classList.add('hidden');

    container.innerHTML = `
      <div class="py-12 flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"></div>
        <span class="font-silkscreen text-xs text-gray-400">Đang tải danh sách bài hát yêu thích...</span>
      </div>
    `;

    let favList = [];
    try {
      const userParam = (this.currentUser && this.currentUser.id) ? `&user_id=${this.currentUser.id}` : '';
      const res = await fetch(`api/endpoints/playlists.php?action=favorites_list&limit=${this.favLimit}&offset=0${userParam}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.favorites)) {
        favList = data.favorites;
        if (data.has_more === false) {
          this.noMoreFavs = true;
        }
      }
    } catch (e) {}

    // Synchronize with local storage favorites
    const favKey = this.getFavoritesStorageKey();
    const localFavs = JSON.parse(localStorage.getItem(favKey) || '[]');
    const seen = new Set(favList.map(f => f.youtube_id || f.title));
    localFavs.forEach(lf => {
      if (!seen.has(lf.youtube_id || lf.title)) {
        favList.push(lf);
        seen.add(lf.youtube_id || lf.title);
      }
    });

    this.currentFavoritesList = favList;
    if (badge) badge.textContent = `${favList.length} BÀI HÁT`;

    if (favList.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center flex flex-col items-center justify-center gap-3 bg-black/20 rounded-2xl border border-white/5 p-6">
          <div class="w-16 h-16 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30 flex items-center justify-center text-2xl animate-bounce">
            ♥
          </div>
          <h4 class="font-pixel text-xs text-white uppercase tracking-wide mt-2">CHƯA CÓ BÀI HÁT YÊU THÍCH</h4>
          <p class="font-silkscreen text-[9px] text-gray-400 max-w-sm leading-relaxed">
            Hãy nhấn vào biểu tượng trái tim [♥] khi nghe nhạc từ Trang chủ hoặc Tìm kiếm để lưu các bản nhạc tuyệt vời vào đây!
          </p>
          <button type="button" class="mt-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs pixel-btn cursor-pointer" onclick="minhDucPlayer.switchView('explore')">
            KHÁM PHÁ NHẠC NGAY →
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    this.renderFavoritesBatch(favList, false);
  }

  // Render a batch of favorites rows
  renderFavoritesBatch(tracks, append = false) {
    const container = document.getElementById('fav-tracks-container');
    if (!container) return;

    tracks.forEach((track, idx) => {
      const displayIdx = append ? (container.children.length + 1) : (idx + 1);
      const row = document.createElement('div');
      row.className = 'fav-track-row flex items-center justify-between p-3 rounded-xl bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer group select-none shadow';
      const cover = track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg');
      const duration = track.duration_str || (track.duration ? gmdate_min_sec(track.duration) : '03:30');

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="font-pixel text-[9px] text-gray-500 w-5 text-center shrink-0">${displayIdx}</span>
          <img src="${cover}" class="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
          <div class="min-w-0 flex-1">
            <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-pink-400 transition-colors truncate">${this.escapeHtml(track.title)}</h4>
            <p class="text-[10px] text-gray-400 truncate mt-0.5">${this.escapeHtml(track.artist || 'Nghệ sĩ')}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0 ml-3">
          <span class="font-mono text-[9px] text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded border border-pink-400/30 hidden sm:inline-block">${track.format || 'FLAC 96k'}</span>
          <span class="font-mono text-[10px] text-gray-400 hidden sm:inline-block">${duration}</span>
          <!-- Play button -->
          <button type="button" class="btn-fav-item-play w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500 text-pink-300 hover:text-black flex items-center justify-center transition-colors cursor-pointer" title="Phát bài này">
            ▶
          </button>
          <!-- Dedicated Unfavorite button: removes track immediately -->
          <button type="button" class="btn-fav-item-remove p-2 text-pink-500 hover:text-gray-400 hover:scale-125 transition-all cursor-pointer" title="Xóa khỏi danh sách yêu thích">
            ♥
          </button>
        </div>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-fav-item-remove')) return;
        this.playTrackDirect(track);
      });

      const removeBtn = row.querySelector('.btn-fav-item-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeFavoriteTrack(track, row);
        });
      }

      container.appendChild(row);
    });
  }

  // Remove track from favorites permanently & animate out
  async removeFavoriteTrack(track, rowElement) {
    if (!track) return;
    const trId = track.db_id || track.id || '';
    const ytId = track.youtube_id || (typeof trId === 'string' && trId.startsWith('yt_') ? trId.substring(3) : '');
    const title = track.title || '';

    // 1. Send explicit deletion request to server
    try {
      const formData = new FormData();
      formData.append('track_id', trId);
      formData.append('youtube_id', ytId);
      await fetch('api/endpoints/playlists.php?action=favorite_remove', {
        method: 'POST',
        body: formData
      });
    } catch (err) {}

    // 2. Clean from LocalStorage
    try {
      const favKey = this.getFavoritesStorageKey();
      let localFavs = JSON.parse(localStorage.getItem(favKey) || '[]');
      localFavs = localFavs.filter(f => (ytId ? f.youtube_id !== ytId : true) && f.title !== title);
      localStorage.setItem(favKey, JSON.stringify(localFavs));
    } catch (e) {}

    // 3. Remove from internal state and update counter badge
    if (Array.isArray(this.currentFavoritesList)) {
      this.currentFavoritesList = this.currentFavoritesList.filter(f => (ytId ? f.youtube_id !== ytId : true) && f.title !== title);
      const badge = document.getElementById('fav-count-badge');
      if (badge) badge.textContent = `${this.currentFavoritesList.length} BÀI HÁT`;
    }
    if (this.syncStats && Array.isArray(this.syncStats.favorites) && track.db_id) {
      this.syncStats.favorites = this.syncStats.favorites.filter(id => id !== Number(track.db_id));
    }
    this.updateControllerFavoriteUI();

    // 4. Smooth remove animation
    if (rowElement) {
      rowElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      rowElement.style.opacity = '0';
      rowElement.style.transform = 'translateX(30px)';
      setTimeout(() => {
        rowElement.remove();
        const container = document.getElementById('fav-tracks-container');
        if (container && (!this.currentFavoritesList || this.currentFavoritesList.length === 0)) {
          this.loadFavoritesView(true);
        }
      }, 300);
    }
  }

  // Infinite Scroll: Load more favorites
  async loadMoreFavorites() {
    if (this.isFavLoading || this.noMoreFavs) return;
    this.isFavLoading = true;
    const sentinel = document.getElementById('favorites-scroll-sentinel');
    if (sentinel) sentinel.classList.remove('hidden');

    this.favOffset += this.favLimit;

    try {
      const userParam = (this.currentUser && this.currentUser.id) ? `&user_id=${this.currentUser.id}` : '';
      const res = await fetch(`api/endpoints/playlists.php?action=favorites_list&limit=${this.favLimit}&offset=${this.favOffset}${userParam}`);
      const data = await res.json();
      this.isFavLoading = false;
      if (sentinel) sentinel.classList.add('hidden');

      if (data.success && Array.isArray(data.favorites) && data.favorites.length > 0) {
        this.renderFavoritesBatch(data.favorites, true);
        if (data.has_more === false) {
          this.noMoreFavs = true;
        }
      } else {
        this.noMoreFavs = true;
      }
    } catch (err) {
      this.isFavLoading = false;
      if (sentinel) sentinel.classList.add('hidden');
    }
  }

  // Play entire favorites queue
  playAllFavorites() {
    if (!this.currentFavoritesList || this.currentFavoritesList.length === 0) {
      alert('Danh sách yêu thích trống!');
      return;
    }
    this.queue = [...this.currentFavoritesList];
    this.queueIndex = 0;
    this.playTrackDirect(this.queue[0]);
  }
  // -------------------------------------------------------------
  // VIEW LOGIC: VỪA PHÁT (RECENTLY PLAYED HISTORY)
  // -------------------------------------------------------------
  async loadHistoryView() {
    const container = document.getElementById('history-tracks-container');
    const badge = document.getElementById('history-count-badge');
    const sentinel = document.getElementById('history-scroll-sentinel');
    if (!container) return;

    this.historyOffset = 0;
    this.historyLimit = 10;
    this.isHistoryLoading = false;
    this.noMoreHistory = false;
    if (sentinel) sentinel.classList.add('hidden');

    const key = this.getHistoryStorageKey();
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {}

    // If logged in, also fetch server history from MySQL history table
    if (this.currentUser && this.currentUser.id) {
      try {
        const res = await fetch('api/endpoints/tracks.php?action=history_list&limit=50');
        const d = await res.json();
        if (d.success && Array.isArray(d.history) && d.history.length > 0) {
          const dbHistory = d.history.map(t => ({
            id: t.id || ('yt_' + t.youtube_id),
            db_id: t.id,
            title: t.title,
            artist: t.artist || 'Nghệ sĩ',
            album: t.album || 'YouTube Music',
            duration: t.duration || 210,
            format: t.format || 'YT 320k',
            cover_url: t.cover_url || ('https://i.ytimg.com/vi/' + t.youtube_id + '/hqdefault.jpg'),
            youtube_id: t.youtube_id,
            playedAt: t.playedAt || Date.now()
          }));
          // Merge local unpushed with db
          const seen = new Set();
          const merged = [];
          [...history, ...dbHistory].forEach(item => {
            const id = item.youtube_id || item.title;
            if (!seen.has(id)) {
              seen.add(id);
              merged.push(item);
            }
          });
          history = merged;
          localStorage.setItem(key, JSON.stringify(history));
        }
      } catch (err) {
        console.warn('Could not fetch server history:', err);
      }
    }

    this.allHistoryList = history;
    this.currentHistoryList = history;
    if (badge) badge.textContent = `${history.length} BÀI HÁT`;

    if (history.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center flex flex-col items-center justify-center gap-3 bg-black/20 rounded-2xl border border-white/5 p-6">
          <div class="w-16 h-16 rounded-full bg-secondary/10 text-secondary border border-secondary/30 flex items-center justify-center text-2xl">
            🕒
          </div>
          <h4 class="font-pixel text-xs text-white uppercase tracking-wide mt-2">CHƯA CÓ LỊCH SỬ PHÁT NHẠC</h4>
          <p class="font-silkscreen text-[9px] text-gray-400 max-w-sm leading-relaxed">
            Các bài hát bạn thưởng thức sẽ tự động được ghi nhận tại đây kèm mốc thời gian chi tiết!
          </p>
          <button type="button" class="mt-2 px-4 py-2 rounded-lg bg-secondary text-black font-bold text-xs pixel-btn cursor-pointer" onclick="minhDucPlayer.switchView('home')">
            NGHE NHẠC NGAY →
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    const initialBatch = history.slice(0, this.historyLimit);
    this.renderHistoryBatch(initialBatch, false);
    if (initialBatch.length >= history.length) {
      this.noMoreHistory = true;
    }
  }

  // Render a batch of history rows
  renderHistoryBatch(tracks, append = false) {
    const container = document.getElementById('history-tracks-container');
    if (!container) return;

    tracks.forEach((track, idx) => {
      const displayIdx = append ? (container.children.length + 1) : (idx + 1);
      const row = document.createElement('div');
      row.className = 'history-track-row flex items-center justify-between p-3 rounded-xl bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-secondary/50 transition-all cursor-pointer group select-none shadow';
      const cover = track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg');
      const timeAgo = this.getRelativeTime(track.playedAt);

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="font-pixel text-[9px] text-gray-500 w-5 text-center shrink-0">${displayIdx}</span>
          <img src="${cover}" class="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
          <div class="min-w-0 flex-1">
            <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-secondary transition-colors truncate">${this.escapeHtml(track.title)}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <p class="text-[10px] text-gray-400 truncate">${this.escapeHtml(track.artist || 'Nghệ sĩ')}</p>
              <span class="font-silkscreen text-[8px] text-outline">• ${timeAgo}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0 ml-3">
          <span class="font-mono text-[9px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/30 hidden sm:inline-block">${track.format || 'YT 320k'}</span>
          <button type="button" class="btn-hist-play w-8 h-8 rounded-full bg-secondary/20 hover:bg-secondary text-secondary hover:text-black flex items-center justify-center transition-colors cursor-pointer" title="Phát lại">
            ▶
          </button>
        </div>
      `;

      row.addEventListener('click', () => {
        this.playTrackDirect(track);
      });

      container.appendChild(row);
    });
  }

  // Infinite Scroll: Load next batch of history
  loadMoreHistory() {
    if (this.isHistoryLoading || this.noMoreHistory) return;
    if (!this.allHistoryList || this.allHistoryList.length <= this.historyLimit) return;

    this.isHistoryLoading = true;
    const sentinel = document.getElementById('history-scroll-sentinel');
    if (sentinel) sentinel.classList.remove('hidden');

    this.historyOffset += this.historyLimit;
    const nextBatch = this.allHistoryList.slice(this.historyOffset, this.historyOffset + this.historyLimit);

    setTimeout(() => {
      this.isHistoryLoading = false;
      if (sentinel) sentinel.classList.add('hidden');

      if (nextBatch.length > 0) {
        this.renderHistoryBatch(nextBatch, true);
        if (this.historyOffset + nextBatch.length >= this.allHistoryList.length) {
          this.noMoreHistory = true;
        }
      } else {
        this.noMoreHistory = true;
      }
    }, 200);
  }

  // Play all history queue
  playAllHistory() {
    if (!this.currentHistoryList || this.currentHistoryList.length === 0) {
      alert('Lịch sử phát nhạc trống!');
      return;
    }
    this.queue = [...this.currentHistoryList];
    this.queueIndex = 0;
    this.playTrackDirect(this.queue[0]);
  }

  // Clear listening history
  async clearHistory() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử nghe nhạc không?')) {
      const key = this.getHistoryStorageKey();
      localStorage.removeItem(key);
      localStorage.removeItem('minhduc_recent_history');
      if (this.currentUser) {
        try {
          await fetch('api/endpoints/tracks.php?action=history_clear', { method: 'POST' });
        } catch (e) {}
      }
      this.allHistoryList = [];
      this.currentHistoryList = [];
      this.loadHistoryView();
    }
  }
  // -------------------------------------------------------------
  // VIEW LOGIC: ALBUMS & ALBUM DETAIL
  // -------------------------------------------------------------
  async loadAlbumsView(force = false) {
    const currentUserId = this.currentUser ? this.currentUser.id : null;
    const isAuthChanged = (this.lastLoadedAlbumUserId !== currentUserId);

    // Update Header Badge and Description based on login state
    const badge = document.getElementById('albums-view-badge');
    const desc = document.getElementById('albums-view-desc');

    if (this.currentUser) {
      if (badge) {
        badge.textContent = 'CÁ NHÂN HÓA GOOGLE';
        badge.className = 'font-pixel text-[8px] px-2 py-0.5 rounded bg-primary text-on-primary border border-primary shadow-[0_0_10px_rgba(167,139,250,0.4)]';
      }
      if (desc) {
        desc.textContent = `Tuyển tập Album cá nhân hóa theo gu nghe nhạc của ${this.currentUser.display_name || 'bạn'}`;
      }
    } else {
      if (badge) {
        badge.textContent = '8 ALBUMS AUDIOPHILE';
        badge.className = 'font-pixel text-[8px] px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/40';
      }
      if (desc) {
        desc.textContent = 'Tuyển tập Album âm thanh chuẩn FLAC, DSD & Master Audio đặc sắc';
      }
    }

    if (isAuthChanged || force || !this.renderedAlbumTitles) {
      this.lastLoadedAlbumUserId = currentUserId;
      this.renderedAlbumTitles = new Set();
      this.renderedAlbumIds = new Set();
      this.isAlbumLoading = true;
      this.noMoreAlbums = false;
      this.albumOffset = 0;

      const grid = document.getElementById('albums-grid-container');
      const sentinel = document.getElementById('albums-scroll-sentinel');
      if (sentinel) sentinel.classList.add('hidden');

      if (grid) {
        grid.innerHTML = `
          <div class="col-span-full py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <span class="font-silkscreen text-xs text-gray-400">Đang tải danh mục Album ${this.currentUser ? 'cá nhân hóa Google...' : 'Audiophile...'}</span>
          </div>
        `;
      }

      try {
        const res = await fetch('api/endpoints/tracks.php?action=more_albums&offset=0&limit=8');
        const data = await res.json();
        this.isAlbumLoading = false;

        if (data.success && Array.isArray(data.albums) && data.albums.length > 0) {
          if (grid) grid.innerHTML = '';
          data.albums.forEach(alb => {
            const normTitle = (alb.title || '').toLowerCase().trim();
            if (normTitle) this.renderedAlbumTitles.add(normTitle);
            if (alb.id) this.renderedAlbumIds.add(alb.id);
          });
          this.renderAlbumCards(data.albums, false);
          this.albumOffset = data.albums.length;
          this.noMoreAlbums = !data.has_more;
        } else {
          if (grid) grid.innerHTML = '<div class="col-span-full py-12 text-center text-xs font-silkscreen text-gray-400">Không tải được album. Hãy thử tải lại.</div>';
        }
      } catch (err) {
        this.isAlbumLoading = false;
        if (grid) grid.innerHTML = '<div class="col-span-full py-12 text-center text-xs font-silkscreen text-red-400">Lỗi kết nối máy chủ!</div>';
      }
      return;
    }

    // If already loaded and auth has not changed
    this.isAlbumLoading = false;
    const sentinel = document.getElementById('albums-scroll-sentinel');
    if (sentinel) sentinel.classList.add('hidden');
    this.bindAlbumCardsEvents();
  }

  // Bind click & play events on album cards in grid
  bindAlbumCardsEvents() {
    document.querySelectorAll('#albums-grid-container .album-card').forEach(card => {
      const albumData = {
        id: card.getAttribute('data-album-id') || '',
        title: card.getAttribute('data-album-title') || card.querySelector('h4')?.textContent?.trim() || '',
        artist: card.getAttribute('data-album-artist') || card.querySelector('p')?.textContent?.trim() || '',
        cover: card.getAttribute('data-album-cover') || card.querySelector('img')?.src || '',
        year: card.getAttribute('data-album-year') || '2026',
        badge: card.getAttribute('data-album-badge') || 'FLAC 192k 24-bit',
        tag: card.getAttribute('data-album-tag') || 'AUDIOPHILE',
        tracks_count: card.querySelector('.font-silkscreen span')?.textContent?.trim() || '8 TRACKS',
        query: card.getAttribute('data-album-query') || card.querySelector('.btn-album-play')?.getAttribute('data-album-query') || '',
        description: card.getAttribute('data-album-desc') || 'Tuyển tập âm thanh Audiophile chất lượng cao.'
      };

      card.onclick = (e) => {
        if (e.target.closest('.btn-album-play')) return;
        this.openAlbumDetail(albumData);
      };

      const playBtn = card.querySelector('.btn-album-play');
      if (playBtn) {
        playBtn.onclick = (e) => {
          e.stopPropagation();
          const query = playBtn.getAttribute('data-album-query') || albumData.query || albumData.title;
          this.playAlbumDirect(query);
        };
      }
    });
  }

  // Infinite Scroll: Load more albums from catalog (Strictly non-repeating)
  async loadMoreAlbums() {
    if (this.isAlbumLoading || this.noMoreAlbums) return;
    this.isAlbumLoading = true;

    // Safety timeout: reset flag after 8s so user is never locked out
    const timeoutId = setTimeout(() => {
      if (this.isAlbumLoading) {
        this.isAlbumLoading = false;
        const s = document.getElementById('albums-scroll-sentinel');
        if (s) s.classList.add('hidden');
      }
    }, 8000);

    const sentinel = document.getElementById('albums-scroll-sentinel');
    if (sentinel) sentinel.classList.remove('hidden');

    try {
      const excludeList = Array.from(this.renderedAlbumTitles || []).slice(-30).join(',');
      const res = await fetch(`api/endpoints/tracks.php?action=more_albums&offset=${this.albumOffset}&limit=4&exclude=${encodeURIComponent(excludeList)}`);
      const data = await res.json();

      clearTimeout(timeoutId);
      this.isAlbumLoading = false;
      if (sentinel) sentinel.classList.add('hidden');

      if (data.success && Array.isArray(data.albums) && data.albums.length > 0) {
        const uniqueAlbums = data.albums.filter(alb => {
          const normTitle = (alb.title || '').toLowerCase().trim();
          if (!normTitle) return false;
          if (this.renderedAlbumTitles && this.renderedAlbumTitles.has(normTitle)) return false;
          if (alb.id && this.renderedAlbumIds && this.renderedAlbumIds.has(alb.id)) return false;

          if (this.renderedAlbumTitles) this.renderedAlbumTitles.add(normTitle);
          if (alb.id && this.renderedAlbumIds) this.renderedAlbumIds.add(alb.id);
          return true;
        });

        if (uniqueAlbums.length > 0) {
          this.renderAlbumCards(uniqueAlbums, true);
        }
        this.albumOffset += data.albums.length;
        if (!data.has_more) {
          this.noMoreAlbums = true;
        }
      } else {
        this.noMoreAlbums = true;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      this.isAlbumLoading = false;
      if (sentinel) sentinel.classList.add('hidden');
    }
  }

  renderAlbumCards(albums, append = false) {
    const grid = document.getElementById('albums-grid-container');
    if (!grid) return;

    albums.forEach(alb => {
      const card = document.createElement('div');
      card.className = 'album-card group bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-primary/60 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer relative';
      card.setAttribute('data-album-title', alb.title);
      card.setAttribute('data-album-artist', alb.artist);
      card.setAttribute('data-album-cover', alb.cover);
      card.setAttribute('data-album-year', alb.year || '2026');
      card.setAttribute('data-album-badge', alb.badge || 'FLAC 192k 24-bit');
      card.setAttribute('data-album-tag', alb.tag || 'HI-RES');
      card.setAttribute('data-album-query', alb.query || alb.title);
      card.setAttribute('data-album-desc', alb.description || 'Tuyển tập Audiophile cao cấp.');

      const isFav = this.isAlbumFavorited(alb);
      const favHeartClass = isFav ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400';
      const favHeartChar = isFav ? '♥' : '♡';

      card.innerHTML = `
        <div class="w-full aspect-square rounded-lg overflow-hidden relative mb-2.5 bg-black/60">
          <img src="${alb.cover}" alt="${this.escapeHtml(alb.title)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute top-2 left-2 px-1.5 py-0.5 bg-black/90 font-mono text-[8px] font-semibold text-primary border border-primary/60 rounded">
            ${alb.badge || 'FLAC 96k'}
          </div>
          <!-- Favorite button on album card -->
          <button type="button" class="btn-card-album-fav absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-black text-xs ${favHeartClass} flex items-center justify-center border border-white/20 transition-all cursor-pointer z-10" title="Yêu thích album này">
            ${favHeartChar}
          </button>
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button type="button" class="btn-album-play w-11 h-11 bg-primary text-on-primary flex items-center justify-center rounded-full shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer" data-album-query="${this.escapeHtml(alb.query)}">
              <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"></polygon></svg>
            </button>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">${this.escapeHtml(alb.title)}</h4>
          <p class="text-xs text-gray-400 truncate mt-0.5">${this.escapeHtml(alb.artist)}</p>
          <div class="flex items-center justify-between pt-2 mt-2 border-t border-white/10 font-silkscreen text-[9px] text-outline">
            <span>${alb.year || '2026'} • ${alb.tracks_count || '10 TRACKS'}</span>
            <span class="text-secondary">${alb.tag || 'HI-RES'}</span>
          </div>
        </div>
      `;

      card.onclick = (e) => {
        if (e.target.closest('.btn-album-play') || e.target.closest('.btn-card-album-fav')) return;
        this.openAlbumDetail(alb);
      };

      const playBtn = card.querySelector('.btn-album-play');
      if (playBtn) {
        playBtn.onclick = (e) => {
          e.stopPropagation();
          this.playAlbumDirect(alb.query || alb.title);
        };
      }

      const cardFavBtn = card.querySelector('.btn-card-album-fav');
      if (cardFavBtn) {
        cardFavBtn.onclick = (e) => {
          e.stopPropagation();
          this.toggleAlbumFavorite(alb, cardFavBtn);
        };
      }

      grid.appendChild(card);
    });
  }

  // Open Dedicated Album Page (Trang riêng của album)
  async openAlbumDetail(album) {
    if (!album) return;
    this.currentAlbum = album;
    this.currentPlaylistDetail = null;
    this.isShowingPlaylistDetail = false;
    this.switchView('album_detail');

    if (typeof this.highlightActiveSidebarPlaylist === 'function') {
      this.highlightActiveSidebarPlaylist(null);
    }

    // Populate metadata
    const coverEl = document.getElementById('album-detail-cover');
    const titleEl = document.getElementById('album-detail-title');
    const artistEl = document.getElementById('album-detail-artist');
    const descEl = document.getElementById('album-detail-desc');
    const formatEl = document.getElementById('album-detail-format');
    const tagEl = document.getElementById('album-detail-tag');
    const yearEl = document.getElementById('album-detail-year');
    const countEl = document.getElementById('album-detail-track-count');
    const breadcrumbEl = document.getElementById('album-detail-breadcrumb');
    const breadcrumbCat = document.getElementById('album-detail-breadcrumb-cat');
    const categoryBadge = document.getElementById('album-detail-category-badge');
    const sectionTitle = document.getElementById('album-detail-section-title');
    const playText = document.getElementById('album-detail-play-text');
    const backText = document.getElementById('album-detail-back-text');
    const tracklistEl = document.getElementById('album-detail-tracks-list');
    const favBtn = document.getElementById('btn-album-detail-fav');
    const backBtn = document.getElementById('btn-album-detail-back');
    const playAlbumBtn = document.getElementById('btn-album-detail-play');

    if (coverEl) coverEl.src = album.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
    if (titleEl) titleEl.textContent = album.title || 'Album Tuyển Tập';
    if (artistEl) artistEl.textContent = album.artist || 'Audiophile Artist';
    if (descEl) descEl.textContent = album.description || album.desc || 'Tuyển tập nhạc phẩm chất lượng cao chuẩn Audiophile Master Audio.';
    if (formatEl) formatEl.textContent = album.badge || 'FLAC 192k 24-bit';
    if (tagEl) tagEl.textContent = album.tag || 'RESONANCE';
    if (yearEl) yearEl.textContent = album.year || '2026';
    if (countEl) countEl.textContent = album.tracks_count || '10 TRACKS';
    if (breadcrumbEl) breadcrumbEl.textContent = (album.title || 'ALBUM').toUpperCase();
    if (breadcrumbCat) breadcrumbCat.textContent = 'DANH MỤC ALBUM';
    if (categoryBadge) categoryBadge.textContent = 'ALBUM CHÍNH THỨC';
    if (sectionTitle) sectionTitle.textContent = 'DANH SÁCH BÀI HÁT TRONG ALBUM';
    if (playText) playText.textContent = 'PHÁT TOÀN BỘ ALBUM';
    if (backText) backText.textContent = '← QUAY LẠI';
    if (favBtn) favBtn.style.display = '';

    // Scroll view to top
    const viewContainer = document.getElementById('view-album-detail');
    if (viewContainer) viewContainer.scrollTop = 0;

    // Back button
    if (backBtn) {
      backBtn.onclick = () => this.switchView(this.previousView || 'albums');
    }

    // Play entire album button
    if (playAlbumBtn) {
      playAlbumBtn.onclick = () => {
        if (this.currentAlbumTracks && this.currentAlbumTracks.length > 0) {
          this.tracks = [...this.currentAlbumTracks];
          this.currentTrackIndex = 0;
          this.loadTrack(this.tracks[0], true);
          this.showToast(`▶ Đang phát toàn bộ album "${album.title}" (${this.currentAlbumTracks.length} bài)`, 'success');
        }
      };
    }

    // Check Album Favorite state in LocalStorage
    this.updateAlbumFavoriteUI(album);
    if (favBtn) {
      favBtn.onclick = () => this.toggleAlbumFavorite(album);
    }

    // Show loading spinner in tracklist container
    if (tracklistEl) {
      tracklistEl.innerHTML = `
        <div class="py-12 flex flex-col items-center justify-center gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span class="font-silkscreen text-xs text-gray-400">Đang tải danh sách bài hát từ Album...</span>
        </div>
      `;
    }

    // Fetch tracks for this album
    try {
      const q = album.query || (album.title + ' ' + album.artist);
      const res = await fetch(`api/endpoints/tracks.php?action=album_tracks&query=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();

      if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
        this.currentAlbumTracks = data.tracks;
        if (countEl) countEl.textContent = `${data.tracks.length} TRACKS`;
        this.renderAlbumTracklist(data.tracks);
      } else {
        if (tracklistEl) {
          tracklistEl.innerHTML = `<div class="py-8 text-center text-xs font-silkscreen text-gray-400">Không tìm thấy bài hát trong album này.</div>`;
        }
      }
    } catch (e) {
      if (tracklistEl) {
        tracklistEl.innerHTML = `<div class="py-8 text-center text-xs font-silkscreen text-red-400">Lỗi kết nối khi tải danh sách bài hát album!</div>`;
      }
    }
  }

  // Open Dedicated Playlist Page (Bung ra giao diện chi tiết playlist giống như album)
  async openPlaylistDetail(playlist) {
    if (!playlist) return;
    this.currentPlaylistDetail = playlist;
    this.currentAlbum = null;
    this.isShowingPlaylistDetail = true;
    this.switchView('album_detail');

    // Highlight active playlist item in sidebar
    if (typeof this.highlightActiveSidebarPlaylist === 'function') {
      this.highlightActiveSidebarPlaylist(playlist.id);
    }

    // Populate metadata
    const coverEl = document.getElementById('album-detail-cover');
    const titleEl = document.getElementById('album-detail-title');
    const artistEl = document.getElementById('album-detail-artist');
    const descEl = document.getElementById('album-detail-desc');
    const formatEl = document.getElementById('album-detail-format');
    const tagEl = document.getElementById('album-detail-tag');
    const yearEl = document.getElementById('album-detail-year');
    const countEl = document.getElementById('album-detail-track-count');
    const breadcrumbEl = document.getElementById('album-detail-breadcrumb');
    const breadcrumbCat = document.getElementById('album-detail-breadcrumb-cat');
    const categoryBadge = document.getElementById('album-detail-category-badge');
    const sectionTitle = document.getElementById('album-detail-section-title');
    const playText = document.getElementById('album-detail-play-text');
    const backText = document.getElementById('album-detail-back-text');
    const tracklistEl = document.getElementById('album-detail-tracks-list');
    const favBtn = document.getElementById('btn-album-detail-fav');
    const backBtn = document.getElementById('btn-album-detail-back');
    const playAlbumBtn = document.getElementById('btn-album-detail-play');

    const plName = playlist.name || playlist.title || 'Playlist';
    const plCover = playlist.cover_url || playlist.cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400';
    const plDesc = playlist.description || 'Tuyển tập danh sách phát chất lượng cao trên MinhDucEar.';
    const plArtist = playlist.is_curated ? 'YouTube Music • Tuyển chọn' : 'Danh sách phát cá nhân';
    const plCount = playlist.total_tracks ? `${playlist.total_tracks} TRACKS` : 'PLAYLIST';

    if (coverEl) coverEl.src = plCover;
    if (titleEl) titleEl.textContent = plName;
    if (artistEl) artistEl.textContent = plArtist;
    if (descEl) descEl.textContent = plDesc;
    if (formatEl) formatEl.textContent = 'HQ AUDIO';
    if (tagEl) tagEl.textContent = playlist.is_curated ? 'CURATED' : 'PLAYLIST';
    if (yearEl) yearEl.textContent = '2026';
    if (countEl) countEl.textContent = plCount;
    if (breadcrumbEl) breadcrumbEl.textContent = plName.toUpperCase();
    if (breadcrumbCat) breadcrumbCat.textContent = 'DANH SÁCH PHÁT';
    if (categoryBadge) categoryBadge.textContent = playlist.is_curated ? 'PLAYLIST TUYỂN CHỌN' : 'PLAYLIST CỦA BẠN';
    if (sectionTitle) sectionTitle.textContent = 'DANH SÁCH BÀI HÁT TRONG PLAYLIST';
    if (playText) playText.textContent = 'PHÁT TOÀN BỘ PLAYLIST';
    if (backText) backText.textContent = '← QUAY LẠI';
    if (favBtn) favBtn.style.display = 'none';

    // Scroll view to top
    const viewContainer = document.getElementById('view-album-detail');
    if (viewContainer) viewContainer.scrollTop = 0;

    // Back button
    if (backBtn) {
      backBtn.onclick = () => this.switchView(this.previousView || 'home');
    }

    // Play entire playlist button
    if (playAlbumBtn) {
      playAlbumBtn.onclick = () => {
        if (this.currentAlbumTracks && this.currentAlbumTracks.length > 0) {
          this.tracks = [...this.currentAlbumTracks];
          this.currentTrackIndex = 0;
          this.loadTrack(this.tracks[0], true);
          this.showToast(`▶ Đang phát toàn bộ "${plName}" (${this.currentAlbumTracks.length} bài hát)`, 'success');
        }
      };
    }

    // Show loading spinner
    if (tracklistEl) {
      tracklistEl.innerHTML = `
        <div class="py-12 flex flex-col items-center justify-center gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
          <span class="font-silkscreen text-xs text-gray-400">Đang nạp danh sách bài hát từ Playlist...</span>
        </div>
      `;
    }

    // Fetch tracks for this playlist
    try {
      const isPagesDir = window.location.pathname.includes('/pages/');
      const apiUrl = (isPagesDir ? '../' : '') + `api/endpoints/playlists.php?action=playlist_tracks&id=${playlist.id}`;
      let tracks = [];
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          tracks = data.tracks;
        }
      } catch (fetchErr) {}

      // Fallback for Vercel / serverless environment
      if (tracks.length === 0) {
        try {
          const fbUrl = (isPagesDir ? '../' : '') + `api/tracks?action=album_tracks&query=${encodeURIComponent(plName)}`;
          const fbRes = await fetch(fbUrl);
          const fbData = await fbRes.json();
          if (fbData && fbData.success && Array.isArray(fbData.tracks) && fbData.tracks.length > 0) {
            tracks = fbData.tracks;
          }
        } catch (e2) {}
      }

      if (tracks.length > 0) {
        this.currentAlbumTracks = tracks;
        if (countEl) countEl.textContent = `${tracks.length} TRACKS`;
        this.renderAlbumTracklist(tracks);
      } else {
        if (tracklistEl) {
          tracklistEl.innerHTML = `
            <div class="py-12 text-center flex flex-col items-center gap-2">
              <div class="font-silkscreen text-xs text-gray-400">Playlist "${this.escapeHtml(plName)}" hiện chưa có bài hát nào.</div>
              <p class="text-[11px] text-gray-500">Bạn có thể thêm bài hát vào playlist này bằng nút "+" trên thanh điều khiển phát nhạc!</p>
            </div>
          `;
        }
      }
    } catch (err) {
      if (tracklistEl) {
        tracklistEl.innerHTML = `<div class="py-8 text-center text-xs font-silkscreen text-red-400">Lỗi kết nối khi nạp danh sách bài hát playlist!</div>`;
      }
    }
  }

  highlightActiveSidebarPlaylist(activeId) {
    const links = document.querySelectorAll('#sidebar-playlists-container a');
    links.forEach(link => {
      const pId = link.getAttribute('data-playlist-id');
      if (activeId !== null && activeId !== undefined && String(pId) === String(activeId)) {
        link.classList.add('bg-surface-container-high', 'text-on-surface', 'ring-1', 'ring-secondary/40');
      } else {
        link.classList.remove('bg-surface-container-high', 'text-on-surface', 'ring-1', 'ring-secondary/40');
      }
    });
  }

  // Render tracklist inside album/playlist detail view
  renderAlbumTracklist(tracks) {
    const container = document.getElementById('album-detail-tracks-list');
    if (!container) return;

    container.innerHTML = '';
    tracks.forEach((track, idx) => {
      const row = document.createElement('div');
      row.className = 'album-track-row flex items-center justify-between p-3 rounded-xl bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-primary/50 transition-all cursor-pointer group select-none shadow';
      const cover = track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + track.youtube_id + '/hqdefault.jpg');
      const duration = track.duration_str || (track.duration ? gmdate_min_sec(track.duration) : '03:30');

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="font-pixel text-[9px] text-gray-500 w-6 text-center shrink-0">${idx + 1}</span>
          <img src="${cover}" class="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
          <div class="min-w-0 flex-1">
            <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-primary transition-colors truncate">${this.escapeHtml(track.title)}</h4>
            <p class="text-[10px] text-gray-400 truncate mt-0.5">${this.escapeHtml(track.artist || 'Nghệ sĩ')}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0 ml-3">
          <span class="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/30 hidden sm:inline-block">${track.format || 'FLAC 96k'}</span>
          <span class="font-mono text-[10px] text-gray-400 hidden sm:inline-block">${duration}</span>
          <!-- Play Track -->
          <button type="button" class="btn-album-track-play w-8 h-8 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-black flex items-center justify-center transition-colors cursor-pointer" title="Phát bài này">
            ▶
          </button>
          <!-- Favorite Track -->
          <button type="button" class="btn-album-track-fav p-2 text-gray-400 hover:text-pink-500 hover:scale-125 transition-all cursor-pointer" title="Yêu thích">
            ♥
          </button>
        </div>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-album-track-fav') || e.target.closest('.btn-album-track-play')) return;
        this.tracks = [...tracks];
        this.currentTrackIndex = idx;
        this.loadTrack(track, true);
      });

      const playTrackBtn = row.querySelector('.btn-album-track-play');
      if (playTrackBtn) {
        playTrackBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.tracks = [...tracks];
          this.currentTrackIndex = idx;
          this.loadTrack(track, true);
        });
      }

      const favBtn = row.querySelector('.btn-album-track-fav');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleFavorite(track, favBtn);
        });
      }

      container.appendChild(row);
    });
  }

  // Toggle favorite status for an album
  async toggleAlbumFavorite(album, buttonEl = null) {
    if (!album) return;
    try {
      const key = this.getFavoriteAlbumsStorageKey();
      let favAlbums = this.getFavoriteAlbums();
      const normTitle = (album.title || '').toLowerCase().trim();
      const idx = favAlbums.findIndex(a => (a.title || '').toLowerCase().trim() === normTitle);
      let isNowFav = false;

      if (idx > -1) {
        favAlbums.splice(idx, 1);
        isNowFav = false;
        this.showToast('Đã xóa album khỏi Yêu thích!', 'info');
      } else {
        favAlbums.unshift({
          id: album.id || '',
          title: album.title,
          artist: album.artist || 'Nghệ sĩ',
          cover: album.cover || album.cover_url || '',
          query: album.query || album.title,
          year: album.year || '2026',
          badge: album.badge || 'FLAC 96k',
          tag: album.tag || 'HI-RES'
        });
        isNowFav = true;
        this.showToast('Đã lưu album vào Yêu thích!', 'success');
      }
      localStorage.setItem(key, JSON.stringify(favAlbums));

      // Sync to MySQL if user is logged in
      if (this.currentUser && this.currentUser.id) {
        fetch('api/endpoints/playlists.php?action=album_favorite_toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: this.currentUser.id,
            album_id: album.id || 0,
            title: album.title,
            artist: album.artist,
            cover: album.cover || album.cover_url || '',
            year: album.year || '2026',
            badge: album.badge || 'FLAC 96k'
          })
        }).catch(() => {});
      }

      // Update UI if on album detail page
      this.updateAlbumFavoriteUI(album);

      // If buttonEl is passed
      if (buttonEl) {
        if (isNowFav) {
          buttonEl.classList.add('text-pink-500');
          buttonEl.classList.remove('text-gray-400');
          buttonEl.textContent = '♥';
        } else {
          buttonEl.classList.remove('text-pink-500');
          buttonEl.classList.add('text-gray-400');
          buttonEl.textContent = '♡';
        }
      }

      // If currently on favorite albums tab, refresh it
      if (this.activeFavTab === 'albums') {
        const albumsContainer = document.getElementById('fav-albums-container');
        if (albumsContainer && !albumsContainer.classList.contains('hidden')) {
          this.loadFavoriteAlbums();
        }
      }
    } catch(e) {
      console.warn('Toggle album favorite error:', e);
    }
  }

  // Update album favorite button UI
  updateAlbumFavoriteUI(album) {
    const favBtn = document.getElementById('btn-album-detail-fav');
    const favIcon = document.getElementById('album-detail-fav-icon');
    const favText = document.getElementById('album-detail-fav-text');
    if (!favBtn || !favIcon || !favText) return;

    try {
      const isFav = this.isAlbumFavorited(album);
      if (isFav) {
        favIcon.textContent = '♥';
        favText.textContent = 'ĐÃ YÊU THÍCH';
        favBtn.classList.add('bg-pink-600/30', 'text-pink-300', 'border-pink-400');
        favBtn.classList.remove('text-pink-400');
      } else {
        favIcon.textContent = '♡';
        favText.textContent = 'YÊU THÍCH ALBUM';
        favBtn.classList.remove('bg-pink-600/30', 'text-pink-300', 'border-pink-400');
        favBtn.classList.add('text-pink-400');
      }
    } catch(e) {}
  }

  // Play album tracks directly
  async playAlbumDirect(query) {
    if (!query) return;
    this.showInpageAlert(`Đang tải bài hát từ Album: "${query}"...`, 'success');
    try {
      const res = await fetch(`api/endpoints/tracks.php?action=album_tracks&query=${encodeURIComponent(query)}&limit=12`);
      const data = await res.json();
      if (data.success && data.tracks && data.tracks.length > 0) {
        this.queue = data.tracks;
        this.queueIndex = 0;
        this.playTrackDirect(data.tracks[0]);
      } else {
        alert('Không thể tải bài hát trong album này!');
      }
    } catch (e) {
      alert('Lỗi kết nối khi tải album!');
    }
  }
  // Toggle favorite helper for cards & rows (MySQL + LocalStorage Sync)
  async toggleFavorite(track, btn) {
    if (!track) return;
    const trId = track.db_id || track.id || '';
    const ytId = track.youtube_id || (typeof trId === 'string' && trId.startsWith('yt_') ? trId.substring(3) : '');
    const title = track.title || '';
    const artist = track.artist || '';
    const coverUrl = track.cover_url || track.cover || ('https://i.ytimg.com/vi/' + ytId + '/hqdefault.jpg');
    const duration = track.duration || 210;

    let isFavResult = false;
    let apiSuccess = false;

    // 1. If logged in, sync with MySQL database
    if (this.currentUser && this.currentUser.id) {
      try {
        const formData = new FormData();
        formData.append('track_id', trId);
        formData.append('youtube_id', ytId);
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('cover_url', coverUrl);
        formData.append('duration', duration);

        const res = await fetch('api/endpoints/playlists.php?action=favorite_toggle', {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        if (result.success) {
          isFavResult = result.is_favorite;
          apiSuccess = true;
          if (result.track_id) {
            track.db_id = result.track_id;
          }
          if (this.syncStats && Array.isArray(this.syncStats.favorites) && track.db_id) {
            if (isFavResult) {
              if (!this.syncStats.favorites.includes(Number(track.db_id))) {
                this.syncStats.favorites.push(Number(track.db_id));
              }
            } else {
              this.syncStats.favorites = this.syncStats.favorites.filter(id => id !== Number(track.db_id));
            }
          }
        }
      } catch (err) {}
    }

    // 2. Synchronize with LocalStorage for current user / guest
    const favKey = this.getFavoritesStorageKey();
    try {
      let localFavs = JSON.parse(localStorage.getItem(favKey) || '[]');
      const existsIdx = localFavs.findIndex(f => (f.youtube_id && ytId && f.youtube_id === ytId) || (title && f.title === title));

      if (apiSuccess) {
        if (isFavResult) {
          if (existsIdx === -1) {
            localFavs.unshift({
              id: track.db_id || trId || ('yt_' + ytId),
              db_id: track.db_id,
              youtube_id: ytId,
              title: title,
              artist: artist,
              cover_url: coverUrl,
              duration: duration,
              format: track.format || 'YT AUDIO 320k'
            });
          }
        } else {
          if (existsIdx > -1) {
            localFavs.splice(existsIdx, 1);
          }
        }
      } else {
        // Guest mode or offline: local toggle
        if (existsIdx > -1) {
          localFavs.splice(existsIdx, 1);
          isFavResult = false;
        } else {
          localFavs.unshift({
            id: track.db_id || trId || ('yt_' + ytId),
            db_id: track.db_id,
            youtube_id: ytId,
            title: title,
            artist: artist,
            cover_url: coverUrl,
            duration: duration,
            format: track.format || 'YT AUDIO 320k'
          });
          isFavResult = true;
        }
      }
      localStorage.setItem(favKey, JSON.stringify(localFavs));
      this.currentFavoritesList = localFavs;
    } catch (e) {}

    // 3. Update button appearance if it's a row/card heart
    if (btn && btn.id !== 'btn-favorite') {
      btn.classList.toggle('text-red-500', isFavResult);
      btn.classList.toggle('text-pink-500', isFavResult);
      btn.classList.toggle('text-gray-400', !isFavResult);
    }

    // 4. Update the footer player controller favorite button
    this.updateControllerFavoriteUI();

    // 5. User feedback
    this.showToast(isFavResult ? 'Đã thêm vào bài hát yêu thích ♥' : 'Đã xóa khỏi danh sách yêu thích');

    // 6. If favorites view is currently open, refresh it
    const viewFav = document.getElementById('view-favorites');
    if (viewFav && !viewFav.classList.contains('hidden')) {
      this.loadFavoritesView(true);
    }
  }


    showInpageAlert(msg, type = 'error') {
    const box = document.getElementById('inpage-account-alert');
    if (!box) return;
    box.className = type === 'success'
      ? 'mb-4 p-3 rounded-lg text-xs font-silkscreen border bg-emerald-950/70 text-emerald-300 border-emerald-800/80 shadow-md'
      : 'mb-4 p-3 rounded-lg text-xs font-silkscreen border bg-red-950/70 text-red-300 border-red-800/80 shadow-md';
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  clearInpageAlert() {
    const box = document.getElementById('inpage-account-alert');
    if (box) box.classList.add('hidden');
  }

  showGoogleModalAlert(msg, type = 'error') {
    const box = document.getElementById('google-modal-alert');
    if (!box) return;
    box.className = type === 'success'
      ? 'mb-3 p-2.5 rounded text-xs font-silkscreen border bg-emerald-950/70 text-emerald-300 border-emerald-800/80 shadow-md'
      : 'mb-3 p-2.5 rounded text-xs font-silkscreen border bg-red-950/70 text-red-300 border-red-800/80 shadow-md';
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  renderInpageAccountView() {
    const loggedInView = document.getElementById('inpage-logged-in-view');
    const loggedOutView = document.getElementById('inpage-logged-out-view');
    if (!loggedInView || !loggedOutView) return;

    if (this.currentUser) {
      loggedInView.classList.remove('hidden');
      loggedOutView.classList.add('hidden');

      // Overview Header
      const nameEl = document.getElementById('inpage-display-name-text');
      const roleEl = document.getElementById('inpage-role-badge');
      const emailEl = document.getElementById('inpage-email-text');
      const avatarEl = document.getElementById('inpage-avatar-preview');
      const googlePill = document.getElementById('inpage-google-pill');

      if (nameEl) nameEl.textContent = this.currentUser.display_name || this.currentUser.username;
      if (roleEl) roleEl.textContent = this.currentUser.role || 'AUDIOPHILE';
      if (emailEl) emailEl.textContent = this.currentUser.email || 'Chưa cập nhật email';
      if (avatarEl) avatarEl.src = this.currentUser.google_picture || this.currentUser.avatar_url || 'assets/images/avatars/default.png';

      // Inputs
      const inputName = document.getElementById('inpage-input-display-name');
      const inputEmail = document.getElementById('inpage-input-email');
      const inputAvatar = document.getElementById('inpage-input-avatar-url');
      if (inputName) inputName.value = this.currentUser.display_name || '';
      if (inputEmail) inputEmail.value = this.currentUser.email || '';
      if (inputAvatar) inputAvatar.value = this.currentUser.avatar_url || '';

      // Google Box
      const boxConnected = document.getElementById('inpage-google-connected-box');
      const boxUnlinked = document.getElementById('inpage-google-unlinked-box');
      const linkedEmail = document.getElementById('inpage-linked-google-email');
      const syncTime = document.getElementById('inpage-sync-last-time');

      if (this.currentUser.google_id) {
        if (googlePill) googlePill.classList.remove('hidden');
        if (boxConnected) boxConnected.classList.remove('hidden');
        if (boxUnlinked) boxUnlinked.classList.add('hidden');
        if (linkedEmail) linkedEmail.textContent = this.currentUser.email || 'Tài khoản Google đã kết nối';
        if (syncTime) syncTime.textContent = this.currentUser.synced_at || 'Vừa xong';
      } else {
        if (googlePill) googlePill.classList.add('hidden');
        if (boxConnected) boxConnected.classList.add('hidden');
        if (boxUnlinked) boxUnlinked.classList.remove('hidden');
      }

      // Live Stats from Database
      if (this.syncStats) {
        const f = document.getElementById('inpage-stat-favs');
        const p = document.getElementById('inpage-stat-playlists');
        const t = document.getElementById('inpage-stat-tracks');
        if (f) f.textContent = this.syncStats.favorites_count || 0;
        if (p) p.textContent = this.syncStats.playlists_count || 0;
        if (t) t.textContent = this.syncStats.synced_tracks_count || 0;
      }
    } else {
      loggedInView.classList.add('hidden');
      loggedOutView.classList.remove('hidden');
    }
  }

// --- DYNAMIC PLAYLISTS & CRUD MANAGEMENT ---
  bindPlaylistActions() {
    // 1. Button Thêm Playlist (+)
    const btnAdd = document.getElementById('btn-playlist-add');
    const modalCreate = document.getElementById('modal-playlist-create');
    const btnCloseCreate = document.getElementById('btn-close-playlist-create');
    const btnCancelCreate = document.getElementById('btn-cancel-playlist-create');
    const formCreate = document.getElementById('form-playlist-create');

    if (btnAdd && modalCreate) {
      btnAdd.addEventListener('click', () => {
        document.getElementById('input-create-pl-name').value = '';
        document.getElementById('input-create-pl-desc').value = '';
        document.getElementById('input-create-pl-cover').value = '';
        this.clearModalAlert('alert-playlist-create');
        modalCreate.classList.remove('hidden');
        document.getElementById('input-create-pl-name').focus();
      });
    }

    const closeCreateModal = () => {
      if (modalCreate) modalCreate.classList.add('hidden');
    };
    if (btnCloseCreate) btnCloseCreate.addEventListener('click', closeCreateModal);
    if (btnCancelCreate) btnCancelCreate.addEventListener('click', closeCreateModal);

    if (formCreate) {
      formCreate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('input-create-pl-name')?.value.trim();
        const description = document.getElementById('input-create-pl-desc')?.value.trim();
        const cover_url = document.getElementById('input-create-pl-cover')?.value.trim();

        if (!name) {
          return this.showModalAlert('alert-playlist-create', 'Vui lòng nhập tên playlist!');
        }

        try {
          const isPagesDir = window.location.pathname.includes('/pages/');
          const apiUrl = (isPagesDir ? '../' : '') + 'api/endpoints/playlists.php?action=playlist_create';
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, cover_url })
          });
          const result = await res.json();
          if (result && result.success) {
            closeCreateModal();
            this.loadSidebarPlaylists();
            if (typeof this.showToast === 'function') {
              this.showToast(`Đã tạo playlist "${name}" thành công!`, 'success');
            } else {
              this.showInpageAlert('Tạo playlist mới thành công!', 'success');
            }
          } else {
            this.showModalAlert('alert-playlist-create', (result && result.message) || 'Lỗi tạo playlist!');
          }
        } catch (err) {
          this.showModalAlert('alert-playlist-create', 'Lỗi kết nối máy chủ!');
        }
      });
    }

    // 2. Button Quản lý / Sửa Playlist (✏️)
    const btnManage = document.getElementById('btn-playlist-manage');
    const editBadge = document.getElementById('playlist-edit-mode-badge');

    if (btnManage) {
      btnManage.addEventListener('click', () => {
        this.isPlaylistEditMode = !this.isPlaylistEditMode;

        if (this.isPlaylistEditMode) {
          btnManage.classList.add('bg-amber-400/20', 'text-amber-400', 'border-amber-400/60');
          btnManage.classList.remove('text-on-surface-variant');
          btnManage.setAttribute('title', 'Đang ở chế độ sửa (Bấm lại để hoàn tất)');
          if (editBadge) editBadge.classList.remove('hidden');
        } else {
          btnManage.classList.remove('bg-amber-400/20', 'text-amber-400', 'border-amber-400/60');
          btnManage.classList.add('text-on-surface-variant');
          btnManage.setAttribute('title', 'Chỉnh sửa & Quản lý playlist (✏️)');
          if (editBadge) editBadge.classList.add('hidden');
        }

        this.renderSidebarPlaylists();
      });
    }

    // 3. Modal Sửa Playlist
    const modalEdit = document.getElementById('modal-playlist-edit');
    const btnCloseEdit = document.getElementById('btn-close-playlist-edit');
    const btnCancelEdit = document.getElementById('btn-cancel-playlist-edit');
    const formEdit = document.getElementById('form-playlist-edit');

    const closeEditModal = () => {
      if (modalEdit) modalEdit.classList.add('hidden');
    };
    if (btnCloseEdit) btnCloseEdit.addEventListener('click', closeEditModal);
    if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeEditModal);

    if (formEdit) {
      formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('input-edit-pl-id')?.value;
        const name = document.getElementById('input-edit-pl-name')?.value.trim();
        const description = document.getElementById('input-edit-pl-desc')?.value.trim();
        const cover_url = document.getElementById('input-edit-pl-cover')?.value.trim();

        if (!name) {
          return this.showModalAlert('alert-playlist-edit', 'Tên playlist không được để trống!');
        }

        try {
          const isPagesDir = window.location.pathname.includes('/pages/');
          const apiUrl = (isPagesDir ? '../' : '') + 'api/endpoints/playlists.php?action=playlist_update';
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, description, cover_url })
          });
          const result = await res.json();
          if (result && result.success) {
            closeEditModal();
            this.loadSidebarPlaylists();
            if (typeof this.showToast === 'function') {
              this.showToast(`Đã cập nhật playlist "${name}" thành công!`, 'success');
            } else {
              this.showInpageAlert('Cập nhật playlist thành công!', 'success');
            }
          } else {
            this.showModalAlert('alert-playlist-edit', (result && result.message) || 'Lỗi cập nhật!');
          }
        } catch (err) {
          this.showModalAlert('alert-playlist-edit', 'Lỗi kết nối máy chủ!');
        }
      });
    }

    // 4. Modal Xác nhận Xóa Playlist
    const modalDelete = document.getElementById('modal-playlist-delete-confirm');
    const btnCancelDelete = document.getElementById('btn-cancel-playlist-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-playlist-delete');

    const closeDeleteModal = () => {
      if (modalDelete) modalDelete.classList.add('hidden');
      this.pendingDeletePlaylist = null;
    };
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', async () => {
        if (!this.pendingDeletePlaylist) return;
        try {
          const isPagesDir = window.location.pathname.includes('/pages/');
          const apiUrl = (isPagesDir ? '../' : '') + 'api/endpoints/playlists.php?action=playlist_delete';
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: this.pendingDeletePlaylist.id })
          });
          const result = await res.json();
          if (result && result.success) {
            closeDeleteModal();
            this.loadSidebarPlaylists();
            if (typeof this.showToast === 'function') {
              this.showToast('Đã xóa playlist thành công!', 'success');
            } else {
              this.showInpageAlert('Đã xóa playlist thành công!', 'success');
            }
          } else {
            alert((result && result.message) || 'Lỗi xóa playlist!');
          }
        } catch (err) {
          alert('Lỗi kết nối máy chủ!');
        }
      });
    }
  }

  showModalAlert(elemId, msg, type = 'error') {
    const box = document.getElementById(elemId);
    if (!box) return;
    box.className = type === 'success'
      ? 'mb-3 p-2.5 rounded-lg text-xs font-silkscreen border bg-emerald-950/70 text-emerald-300 border-emerald-800/80 shadow-md'
      : 'mb-3 p-2.5 rounded-lg text-xs font-silkscreen border bg-red-950/70 text-red-300 border-red-800/80 shadow-md';
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  clearModalAlert(elemId) {
    const box = document.getElementById(elemId);
    if (box) box.classList.add('hidden');
  }

  async loadSidebarPlaylists() {
    try {
      const isGuest = !this.currentUser || this.currentUser.role === 'GUEST' || this.currentUser.is_guest;

      let serverPlaylists = [];
      if (!isGuest && this.currentUser?.id) {
        const isPagesDir = window.location.pathname.includes('/pages/');
        const apiUrl = (isPagesDir ? '../' : '') + 'api/endpoints/playlists.php?action=playlists_list';
        try {
          const res = await fetch(apiUrl);
          const data = await res.json();
          if (data && data.success && Array.isArray(data.playlists)) {
            serverPlaylists = data.playlists;
          }
        } catch(e) {}

        if (serverPlaylists.length === 0 && window.__firebaseService && this.currentUser?.uid) {
          try {
            const fbPlaylists = await window.__firebaseService.getUserPlaylists(this.currentUser.uid);
            if (fbPlaylists && fbPlaylists.length > 0) {
              serverPlaylists = fbPlaylists;
            }
          } catch(e) {}
        }
      }

      // Guest only sees locally created playlists (or empty if none created yet)
      let localPlaylists = [];
      try {
        localPlaylists = JSON.parse(localStorage.getItem('minhduc_local_playlists') || '[]');
      } catch(e) {}

      const existingNames = new Set(serverPlaylists.map(p => (p.name || '').toLowerCase()));
      const filteredLocal = localPlaylists.filter(lp => !existingNames.has((lp.name || '').toLowerCase()));

      this.currentPlaylists = isGuest ? filteredLocal : [...filteredLocal, ...serverPlaylists];
      this.renderSidebarPlaylists();
    } catch (err) {
      console.warn('Error loading playlists:', err);
    }
  }

  renderSidebarPlaylists() {
    const container = document.getElementById('sidebar-playlists-container');
    if (!container) return;
    container.innerHTML = '';

    if (!this.currentPlaylists || this.currentPlaylists.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'px-3 py-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/30 text-center flex flex-col items-center gap-2 my-1';
      empty.innerHTML = `
        <span class="text-[10px] text-gray-400 font-silkscreen tracking-wider">CHƯA CÓ PLAYLIST</span>
        <button type="button" class="btn-sidebar-create-empty px-2.5 py-1 rounded bg-secondary/15 hover:bg-secondary/25 text-secondary text-[9px] font-silkscreen border border-secondary/40 transition-all hover:scale-105 cursor-pointer flex items-center gap-1">
          <span>+ TẠO PLAYLIST</span>
        </button>
      `;
      const btnFirst = empty.querySelector('.btn-sidebar-create-empty');
      if (btnFirst) {
        btnFirst.addEventListener('click', () => {
          const btnAdd = document.getElementById('btn-playlist-add');
          if (btnAdd) btnAdd.click();
        });
      }
      container.appendChild(empty);
      return;
    }

    this.currentPlaylists.forEach((pl) => {
      if (!this.isPlaylistEditMode) {
        // Normal View: Click to expand playlist detail view (Bung ra chi tiết playlist)
        const item = document.createElement('a');
        item.className = 'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface text-[12px] cursor-pointer group transition-colors';
        item.setAttribute('data-playlist-id', pl.id);
        if (this.isShowingPlaylistDetail && this.currentPlaylistDetail && String(this.currentPlaylistDetail.id) === String(pl.id)) {
          item.classList.add('bg-surface-container-high', 'text-on-surface', 'ring-1', 'ring-secondary/40');
        }
        item.title = pl.description ? `${pl.name} - ${pl.description}` : pl.name;
        item.innerHTML = `
          <span class="truncate font-medium group-hover:text-primary transition-colors flex items-center gap-1.5 min-w-0">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
            <span class="truncate">${this.escapeHtml(pl.name)}</span>
          </span>
          <span class="font-mono text-[9px] font-semibold text-secondary px-1.5 py-0.5 rounded bg-secondary/10 border border-secondary/30 shrink-0 ml-1.5 leading-none">${pl.total_tracks || 0}</span>
        `;
        item.addEventListener('click', () => {
          this.openPlaylistDetail(pl);
        });
        container.appendChild(item);
      } else {
        // Edit Mode: Shows Edit and Delete Buttons
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-container-high/50 border border-outline-variant/30 text-[12px] group gap-1 transition-all';
        
        const isCurated = !!pl.is_curated;
        item.innerHTML = `
          <span class="truncate font-medium text-on-surface flex-1 text-[11px]" title="${this.escapeHtml(pl.name)}">
            ${this.escapeHtml(pl.name)}
          </span>
          <div class="flex items-center gap-1 shrink-0">
            ${isCurated ? `
              <span class="text-[8px] font-mono px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/30">MẶC ĐỊNH</span>
            ` : `
              <!-- Nút sửa -->
              <button type="button" class="btn-pl-edit w-5 h-5 flex items-center justify-center rounded bg-primary/20 hover:bg-primary/40 text-primary border border-primary/40 transition-colors cursor-pointer" title="Chỉnh sửa playlist này">
                <svg class="w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <!-- Nút xóa -->
              <button type="button" class="btn-pl-delete w-5 h-5 flex items-center justify-center rounded bg-red-950/50 hover:bg-red-900 text-red-400 border border-red-800/50 transition-colors cursor-pointer" title="Xóa playlist này">
                <svg class="w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            `}
          </div>
        `;

        if (!isCurated) {
          // Bind Sửa
          const editBtn = item.querySelector('.btn-pl-edit');
          if (editBtn) {
            editBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.openEditPlaylistModal(pl);
            });
          }

          // Bind Xóa
          const delBtn = item.querySelector('.btn-pl-delete');
          if (delBtn) {
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.openDeletePlaylistModal(pl);
            });
          }
        }

        container.appendChild(item);
      }
    });
  }

  openEditPlaylistModal(pl) {
    const modal = document.getElementById('modal-playlist-edit');
    if (!modal) return;
    document.getElementById('input-edit-pl-id').value = pl.id;
    document.getElementById('input-edit-pl-name').value = pl.name || '';
    document.getElementById('input-edit-pl-desc').value = pl.description || '';
    document.getElementById('input-edit-pl-cover').value = pl.cover_url || '';
    this.clearModalAlert('alert-playlist-edit');
    modal.classList.remove('hidden');
    document.getElementById('input-edit-pl-name').focus();
  }

  openDeletePlaylistModal(pl) {
    const modal = document.getElementById('modal-playlist-delete-confirm');
    if (!modal) return;
    this.pendingDeletePlaylist = pl;
    const nameEl = document.getElementById('delete-confirm-pl-name');
    if (nameEl) nameEl.textContent = pl.name;
    modal.classList.remove('hidden');
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  async playPlaylistTracks(playlistId, playlistName) {
    try {
      const isPagesDir = window.location.pathname.includes('/pages/');
      const apiUrl = (isPagesDir ? '../' : '') + `api/endpoints/playlists.php?action=playlist_tracks&id=${playlistId}`;
      let tracks = [];
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          tracks = data.tracks;
        }
      } catch (e) {}

      // Fallback for Vercel / serverless environment
      if (tracks.length === 0) {
        try {
          const fbUrl = (isPagesDir ? '../' : '') + `api/tracks?action=album_tracks&query=${encodeURIComponent(playlistName)}`;
          const fbRes = await fetch(fbUrl);
          const fbData = await fbRes.json();
          if (fbData && fbData.success && Array.isArray(fbData.tracks) && fbData.tracks.length > 0) {
            tracks = fbData.tracks;
          }
        } catch (e2) {}
      }

      if (tracks.length > 0) {
        this.tracks = tracks;
        this.currentTrackIndex = 0;
        this.loadTrack(this.tracks[0], true);
        this.switchView('home');
        if (typeof this.showToast === 'function') {
          this.showToast(`▶ Đang phát "${playlistName}" (${tracks.length} bài hát)`, 'success');
        }
      } else {
        if (typeof this.showToast === 'function') {
          this.showToast(`Playlist "${playlistName}" hiện chưa có bài hát nào!`, 'info');
        }
      }
    } catch (err) {
      console.warn('Error playing playlist:', err);
    }
  }

  async playFavorites() {
    try {
      const userParam = (this.currentUser && this.currentUser.id) ? `?action=favorites_list&user_id=${this.currentUser.id}` : '?action=favorites_list';
      const res = await fetch(`api/endpoints/playlists.php${userParam}`);
      const data = await res.json();
      if (data.success && data.favorites && data.favorites.length > 0) {
        this.queue = data.favorites;
        this.queueIndex = 0;
        this.loadTrack(this.queue[0], true);
        this.switchView('home');
      }
    } catch (err) {
      console.log('Error playing favorites:', err);
    }
  }

  // 9. Auth, Real Google Login & YouTube Music Sync
  bindAuth() {
    const sidebarProfileBtn = document.getElementById('sidebar-user-profile-btn');
    const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
    const headerProfileBtn = document.getElementById('header-user-profile-btn');
    const btnBackHome = document.getElementById('btn-account-back-home');
    const navHome = document.getElementById('nav-btn-home');
    const navFavorites = document.getElementById('sidebar-nav-favorites');

    const googleModal = document.getElementById('google-signin-modal');
    const btnCloseGoogleModal = document.getElementById('btn-close-google-modal');
    const formRealGoogle = document.getElementById('form-real-google-login');

    const openAccountView = () => this.switchView('account');
    const openHomeView = () => this.switchView('home');

    if (sidebarProfileBtn) sidebarProfileBtn.addEventListener('click', openAccountView);
    if (sidebarSettingsBtn) sidebarSettingsBtn.addEventListener('click', (e) => { e.stopPropagation(); openAccountView(); });
    if (headerProfileBtn) headerProfileBtn.addEventListener('click', openAccountView);
    if (btnBackHome) btnBackHome.addEventListener('click', openHomeView);
    // Navigation is handled uniformly by bindSidebarNavigation()

    // --- Google Modal Dialog Controls ---
    const openGoogleModal = () => {
      if (googleModal) {
        googleModal.classList.remove('hidden');
        const alertEl = document.getElementById('google-modal-alert');
        if (alertEl) alertEl.classList.add('hidden');
        this.initGoogleGsi();
      }
    };

    const closeGoogleModal = () => {
      if (googleModal) googleModal.classList.add('hidden');
    };

    if (btnCloseGoogleModal) btnCloseGoogleModal.addEventListener('click', closeGoogleModal);
    if (googleModal) {
      googleModal.addEventListener('click', (e) => {
        if (e.target === googleModal) closeGoogleModal();
      });
    }

    // Trigger Google Modal Dialog when clicking "Đăng nhập với Google"
    const btnInpageGoogleLogin = document.getElementById('inpage-btn-google-login');
    if (btnInpageGoogleLogin) {
      btnInpageGoogleLogin.addEventListener('click', openGoogleModal);
    }

    const btnInpageLinkGoogle = document.getElementById('inpage-btn-link-google-now');
    if (btnInpageLinkGoogle) {
      btnInpageLinkGoogle.addEventListener('click', openGoogleModal);
    }
    this.initGoogleGsi();

    // --- Submit Real Google Account Form ---
    if (formRealGoogle) {
      formRealGoogle.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('input-real-google-email')?.value.trim();
        const name = document.getElementById('input-real-google-name')?.value.trim();
        if (!email || !email.includes('@')) {
          this.showGoogleModalAlert('Vui lòng nhập địa chỉ email Google hợp lệ!', 'danger');
          return;
        }
        await this.performGoogleLogin(email, name);
      });
    }

    // --- Tab Switching in In-Page Logged-In View ---
    const tabInfo = document.getElementById('inpage-tab-info');
    const tabGoogle = document.getElementById('inpage-tab-google');
    const tabPassword = document.getElementById('inpage-tab-password');

    const paneInfo = document.getElementById('inpage-pane-info');
    const paneGoogle = document.getElementById('inpage-pane-google');
    const panePassword = document.getElementById('inpage-pane-password');

    if (tabInfo && tabGoogle && tabPassword && paneInfo && paneGoogle && panePassword) {
      tabInfo.addEventListener('click', () => {
        tabInfo.className = 'py-2 rounded-lg bg-primary-container text-on-primary font-bold transition-all shadow-sm';
        tabGoogle.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
        tabPassword.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
        paneInfo.classList.remove('hidden');
        paneGoogle.classList.add('hidden');
        panePassword.classList.add('hidden');
        this.clearInpageAlert();
      });

      tabGoogle.addEventListener('click', () => {
        tabGoogle.className = 'py-2 rounded-lg bg-secondary-container text-on-secondary font-bold transition-all shadow-sm';
        tabInfo.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
        tabPassword.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
        paneGoogle.classList.remove('hidden');
        paneInfo.classList.add('hidden');
        panePassword.classList.add('hidden');
        this.clearInpageAlert();
      });

      tabPassword.addEventListener('click', () => {
        tabPassword.className = 'py-2 rounded-lg bg-primary-container text-on-primary font-bold transition-all shadow-sm';
        tabInfo.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
        tabGoogle.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
        panePassword.classList.remove('hidden');
        paneInfo.classList.add('hidden');
        paneGoogle.classList.add('hidden');
        this.clearInpageAlert();
      });
    }

    // --- Form 1: Save Profile Info ---
    if (paneInfo) {
      paneInfo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const display_name = document.getElementById('inpage-input-display-name')?.value.trim();
        const email = document.getElementById('inpage-input-email')?.value.trim();
        const avatar_url = document.getElementById('inpage-input-avatar-url')?.value.trim();

        if (!display_name) return this.showInpageAlert('Tên hiển thị không được để trống!');

        try {
          const res = await fetch('api/endpoints/auth.php?action=update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name, email, avatar_url })
          });
          const result = await res.json();
          if (result.success) {
            this.currentUser = result.user;
            this.updateSidebarProfileUI();
            this.renderInpageAccountView();
            this.showInpageAlert('Cập nhật thông tin tài khoản thành công!', 'success');
          } else {
            this.showInpageAlert(result.message || 'Cập nhật thất bại!');
          }
        } catch (err) {
          this.showInpageAlert('Lỗi kết nối máy chủ!');
        }
      });
    }

    // --- Real YouTube Music Synchronization ---
    const btnSyncYouTube = document.getElementById('inpage-btn-sync-youtube-now');
    if (btnSyncYouTube) {
      btnSyncYouTube.addEventListener('click', async () => {
        this.showInpageAlert('Đang kết nối YouTube Music và đồng bộ hóa thư viện âm nhạc thật...', 'success');
        try {
          const res = await fetch('api/endpoints/auth.php?action=sync_youtube', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const result = await res.json();
          if (result.success) {
            this.syncStats = result.sync_stats;
            if (this.currentUser) this.currentUser.synced_at = result.synced_at;
            this.renderInpageAccountView();
            this.loadSidebarPlaylists();
            this.showInpageAlert(result.message, 'success');
          } else {
            this.showInpageAlert(result.message || 'Đồng bộ thất bại!');
          }
        } catch (err) {
          this.showInpageAlert('Lỗi khi đồng bộ hóa YouTube Music!');
        }
      });
    }

    const btnUnlinkGoogle = document.getElementById('inpage-btn-unlink-google');
    if (btnUnlinkGoogle) {
      btnUnlinkGoogle.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản Google?')) return;
        try {
          const res = await fetch('api/endpoints/auth.php?action=unlink_google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const result = await res.json();
          if (result.success) {
            this.currentUser = result.user;
            this.updateSidebarProfileUI();
            this.renderInpageAccountView();
            this.showInpageAlert('Đã hủy liên kết Google!', 'success');
          } else {
            this.showInpageAlert(result.message || 'Hủy liên kết thất bại!');
          }
        } catch (err) {
          this.showInpageAlert('Lỗi kết nối máy chủ!');
        }
      });
    }

    // --- Button Sync YouTube Music Now ---
    const btnSyncYt = document.getElementById('inpage-btn-sync-youtube-now');
    if (btnSyncYt) {
      btnSyncYt.addEventListener('click', async () => {
        btnSyncYt.disabled = true;
        btnSyncYt.classList.add('opacity-50');
        this.showInpageAlert('Đang làm mới & đồng bộ thư viện nhạc YouTube vào tài khoản Google...', 'success');
        try {
          const res = await fetch('api/endpoints/auth.php?action=sync_youtube', { method: 'POST' });
          const result = await res.json();
          if (result.success) {
            this.syncStats = result.sync_stats;
            const syncTime = document.getElementById('inpage-sync-last-time');
            if (syncTime) syncTime.textContent = result.synced_at || 'Vừa xong';
            this.renderInpageAccountView();
            this.loadSidebarPlaylists();
            this.loadFeaturedAlbums();
            if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
            this.loadInitialFeed();
            this.showInpageAlert(result.message || 'Đã đồng bộ hóa kho nhạc Google thành công!', 'success');
          } else {
            this.showInpageAlert(result.message || 'Đồng bộ thất bại!');
          }
        } catch (e) {
          this.showInpageAlert('Lỗi kết nối máy chủ khi đồng bộ!');
        } finally {
          btnSyncYt.disabled = false;
          btnSyncYt.classList.remove('opacity-50');
        }
      });
    }

    // --- Form 3: Change Password ---
    if (panePassword) {
      panePassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const old_password = document.getElementById('inpage-pwd-old')?.value;
        const new_password = document.getElementById('inpage-pwd-new')?.value;
        const confirm_password = document.getElementById('inpage-pwd-confirm')?.value;

        if (!new_password || new_password.length < 6) {
          return this.showInpageAlert('Mật khẩu mới phải có tối thiểu 6 ký tự!');
        }
        if (new_password !== confirm_password) {
          return this.showInpageAlert('Mật khẩu xác nhận không khớp!');
        }

        try {
          const res = await fetch('api/endpoints/auth.php?action=change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password, new_password })
          });
          const result = await res.json();
          if (result.success) {
            document.getElementById('inpage-pwd-old').value = '';
            document.getElementById('inpage-pwd-new').value = '';
            document.getElementById('inpage-pwd-confirm').value = '';
            this.showInpageAlert('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.', 'success');
          } else {
            this.showInpageAlert(result.message || 'Đổi mật khẩu thất bại!');
          }
        } catch (err) {
          this.showInpageAlert('Lỗi khi đổi mật khẩu!');
        }
      });
    }

    // --- Logout Action ---
    const btnLogout = document.getElementById('inpage-btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) return;
        try {
          await this.safeFetchJson('api/endpoints/auth.php?action=logout', { method: 'POST' });
        } catch (err) {}
        this.currentUser = null;
        this.syncStats = null;
        try {
          localStorage.removeItem('minhduc_current_user');
          localStorage.removeItem('minhduc_sync_stats');
          localStorage.removeItem('minhduc_recent_history');
          localStorage.removeItem('minhduc_local_favorites');
          localStorage.removeItem('minhduc_history_guest');
          localStorage.removeItem('minhduc_favs_guest');
        } catch (e) {}
        this.allHistoryList = [];
        this.currentHistoryList = [];
        this.currentFavoritesList = [];
        this.updateControllerFavoriteUI();
        this.updateSidebarProfileUI();
        this.renderInpageAccountView();
        this.loadSidebarPlaylists();
        this.loadFeaturedAlbums();
        if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
        if (typeof this.loadHistoryView === 'function') this.loadHistoryView();
        if (typeof this.loadFavoritesView === 'function') this.loadFavoritesView(true);
        this.showInpageAlert('Đã đăng xuất tài khoản.', 'success');
      });
    }

    // Tabs: Login / Register in Logged-Out View
    const tabAuthLogin = document.getElementById('inpage-auth-tab-login');
    const tabAuthReg = document.getElementById('inpage-auth-tab-register');
    const formAuthLogin = document.getElementById('inpage-form-login');
    const formAuthReg = document.getElementById('inpage-form-register');

    if (tabAuthLogin && tabAuthReg && formAuthLogin && formAuthReg) {
      tabAuthLogin.addEventListener('click', () => {
        tabAuthLogin.className = 'flex-1 py-2.5 font-silkscreen text-xs text-primary border-b-2 border-primary font-bold transition-all';
        tabAuthReg.className = 'flex-1 py-2.5 font-silkscreen text-xs text-gray-400 hover:text-white transition-all';
        formAuthLogin.classList.remove('hidden');
        formAuthReg.classList.add('hidden');
        this.clearInpageAlert();
      });

      tabAuthReg.addEventListener('click', () => {
        tabAuthReg.className = 'flex-1 py-2.5 font-silkscreen text-xs text-secondary border-b-2 border-secondary font-bold transition-all';
        tabAuthLogin.className = 'flex-1 py-2.5 font-silkscreen text-xs text-gray-400 hover:text-white transition-all';
        formAuthReg.classList.remove('hidden');
        formAuthLogin.classList.add('hidden');
        this.clearInpageAlert();
      });
    }

    if (formAuthLogin) {
      formAuthLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('inpage-login-username')?.value.trim();
        const p = document.getElementById('inpage-login-password')?.value.trim();
        if (!u || !p) return this.showInpageAlert('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');

        try {
          const res = await fetch('api/endpoints/auth.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
          });
          const result = await res.json();
          if (result.success) {
            this.currentUser = result.user;
            this.syncStats = result.sync_stats;
            this.updateSidebarProfileUI();
            this.renderInpageAccountView();
            this.loadSidebarPlaylists();
            this.loadFeaturedAlbums();
            if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
            this.showInpageAlert('Đăng nhập thành công!', 'success');
          } else {
            this.showInpageAlert(result.message || 'Đăng nhập thất bại!');
          }
        } catch (err) {
          this.showInpageAlert('Lỗi kết nối máy chủ!');
        }
      });
    }

    if (formAuthReg) {
      formAuthReg.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('inpage-reg-username')?.value.trim();
        const display_name = document.getElementById('inpage-reg-display-name')?.value.trim();
        const email = document.getElementById('inpage-reg-email')?.value.trim();
        const password = document.getElementById('inpage-reg-password')?.value.trim();

        if (!username || !display_name || !email || !password) {
          return this.showInpageAlert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
        }

        try {
          const res = await fetch('api/endpoints/auth.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, display_name, email, password })
          });
          const result = await res.json();
          if (result.success) {
            this.currentUser = result.user;
            this.syncStats = result.sync_stats;
            this.updateSidebarProfileUI();
            this.renderInpageAccountView();
            this.loadSidebarPlaylists();
            this.showInpageAlert('Đăng ký tài khoản thành công!', 'success');
          } else {
            this.showInpageAlert(result.message || 'Đăng ký thất bại!');
          }
        } catch (err) {
          this.showInpageAlert('Lỗi kết nối máy chủ!');
        }
      });
    }

    // Initial load of sidebar playlists
    this.loadSidebarPlaylists();
  }

  async checkAuthStatus() {
    try {
      const data = await this.safeFetchJson('api/endpoints/auth.php?action=status');
      if (data && data.authenticated && data.user) {
        this.currentUser = data.user;
        this.syncStats = data.sync_stats;
        try {
          localStorage.setItem('minhduc_current_user', JSON.stringify(this.currentUser));
          if (this.syncStats) localStorage.setItem('minhduc_sync_stats', JSON.stringify(this.syncStats));
        } catch (e) {}
        this.updateSidebarProfileUI();
        this.renderInpageAccountView();
        this.loadSidebarPlaylists();
        this.loadFeaturedAlbums();
        if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
        this.loadWeeklyStats();
        this.renderSidebarRecentTracks();
        this.loadInitialFeed();
        return;
      }
    } catch (e) {
      console.log('checkAuthStatus notice:', e);
    }

    // Check if user was previously saved in localStorage (preserves login on Vercel / offline)
    try {
      const savedUserStr = localStorage.getItem('minhduc_current_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && (savedUser.email || savedUser.username)) {
          this.currentUser = savedUser;
          const savedStats = localStorage.getItem('minhduc_sync_stats');
          if (savedStats) {
            try { this.syncStats = JSON.parse(savedStats); } catch (e) {}
          }
          this.updateSidebarProfileUI();
          this.renderInpageAccountView();
          this.loadSidebarPlaylists();
          this.loadFeaturedAlbums();
          if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
          this.loadWeeklyStats();
          this.renderSidebarRecentTracks();
          this.loadInitialFeed();
          return;
        }
      }
    } catch (e) {
      console.warn('localStorage user restore notice:', e);
    }

    // Default to Guest only if genuinely no stored user session
    this.currentUser = null;
    this.syncStats = null;
    this.allHistoryList = [];
    this.currentHistoryList = [];
    this.currentFavoritesList = [];
    this.updateControllerFavoriteUI();
    this.updateSidebarProfileUI();
    this.renderInpageAccountView();
    this.loadSidebarPlaylists();
    this.loadWeeklyStats();
    this.renderSidebarRecentTracks();
    this.loadFeaturedAlbums();
    if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
    if (typeof this.loadHistoryView === 'function') this.loadHistoryView();
    if (typeof this.loadFavoritesView === 'function') this.loadFavoritesView(true);
    this.loadInitialFeed();

    // Listen for Firebase auth changes (handles redirect login after page reload)
    if (window.__firebaseService && typeof window.__firebaseService.onAuthChange === 'function') {
      window.__firebaseService.onAuthChange(async (fbUser) => {
        if (fbUser && fbUser.email && !this.currentUser) {
          // Firebase user signed in (e.g. after redirect) but PHP session not set yet
          await this.performGoogleLogin(
            fbUser.email,
            fbUser.displayName || fbUser.email.split('@')[0],
            fbUser.photoURL,
            fbUser.uid
          );
        }
      });
    }
  }

  updateSidebarProfileUI() {
    try {
      const avatarImg = document.getElementById('sidebar-avatar-img');
      const avatarSvg = document.getElementById('sidebar-avatar-svg');
      const displayName = document.getElementById('sidebar-display-name');
      const displayRole = document.getElementById('sidebar-display-role');
      const greetingEl = document.getElementById('home-greeting-name');

      if (this.currentUser) {
        const name = this.currentUser.display_name || this.currentUser.username || 'Audiophile';
        if (displayName) displayName.textContent = name;
        if (displayRole) displayRole.textContent = this.currentUser.role || 'AUDIOPHILE';
        if (greetingEl) greetingEl.textContent = `Xin chào, ${name}`;
        const pic = this.currentUser.avatar_url || this.currentUser.google_picture;
        if (pic && avatarImg && avatarSvg) {
          avatarImg.src = pic;
          avatarImg.classList.remove('hidden');
          avatarSvg.classList.add('hidden');
        }
      } else {
        if (displayName) displayName.textContent = 'Khách (Guest)';
        if (displayRole) displayRole.textContent = 'CHƯA ĐĂNG NHẬP';
        if (greetingEl) greetingEl.textContent = 'Xin chào, Khách';
        if (avatarImg && avatarSvg) {
          avatarImg.src = '';
          avatarImg.classList.add('hidden');
          avatarSvg.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.log('updateSidebarProfileUI error:', e);
    }
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async performGoogleLogin(email, name = '', picture = null, googleId = null) {
    if (!email || !email.includes('@')) {
      this.showGoogleModalAlert('Vui lòng nhập địa chỉ email Google hợp lệ!', 'danger');
      return false;
    }
    const displayName = name || email.split('@')[0];
    this.showGoogleModalAlert(`Đang đăng nhập tài khoản ${email} & đồng bộ...`, 'info');
    const pic = picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVF6ggMmL9CnND9kKg8BU6E6tRiffz5-ZeSirpXvvr1ra_17MAMrOBcG9FqAkcDkkTUKTcSNKUlNl_n7yGHLRUXaYyS4oJG0V0wnya8IJ91kxA6cijNYYe8f3sumGifyZsgsBRiOOEagEFaFeq1_eeFJT1IYtYNJyPiUzkoFsLGRiBvqH5ckRkcP7rHZplCCUsv0bI7r4bcuJHwdoijK0SD-oVLjPB5m2PdidQFUkb-G8Qduv13SEVRA';
    const gid = googleId || ('goog_' + this.hashCode(email));

    try {
      const isPagesDir = window.location.pathname.includes('/pages/');
      const apiUrl = (isPagesDir ? '../' : '') + 'api/endpoints/auth.php?action=google_login';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: displayName,
          google_id: gid,
          picture: pic
        })
      });
      const result = await res.json();
      if (result && result.success && result.user) {
        this.currentUser = result.user;
        this.currentUser.is_google = true;
        this.syncStats = result.sync_stats || this.syncStats;
        localStorage.setItem('minhduc_current_user', JSON.stringify(this.currentUser));
        this.updateSidebarProfileUI();
        this.renderInpageAccountView();
        this.loadSidebarPlaylists();
        if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
        const modal = document.getElementById('google-signin-modal');
        if (modal) modal.classList.add('hidden');
        if (typeof this.showToast === 'function') {
          this.showToast(`Xin chào, ${this.currentUser.display_name || this.currentUser.name}! Đã đăng nhập Google thành công.`, 'success');
        }
        return true;
      }
    } catch(err) {
      console.warn('Backend google_login fetch notice:', err);
    }

    // Client-side fallback (Vercel Edge / offline)
    this.currentUser = {
      id: (this.hashCode(email) % 10000) || 101,
      email: email,
      name: displayName,
      display_name: displayName,
      username: email.split('@')[0],
      google_id: gid,
      role: 'AUDIOPHILE',
      is_google: true,
      avatar_url: pic,
      google_picture: pic,
      listening_hours: 0.0,
      synced_at: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem('minhduc_current_user', JSON.stringify(this.currentUser));
    this.updateSidebarProfileUI();
    this.renderInpageAccountView();
    this.loadSidebarPlaylists();
    const modal = document.getElementById('google-signin-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof this.showToast === 'function') {
      this.showToast(`Xin chào, ${this.currentUser.display_name}! Đã đăng nhập Google thành công.`, 'success');
    }
    return true;
  }

  initGoogleGsi() {
    const slot = document.getElementById('google-gsi-button-slot');
    if (!slot) return;

    const clientId = window.__GOOGLE_CLIENT_ID__ || '682003556218-uinu1m45sorg1r7hqtchpv33l6c8l6vl.apps.googleusercontent.com';

    // 1. If Google Identity Services (GSI) SDK is loaded, render official Google OAuth button
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => this.handleGoogleCredentialResponse(response)
        });
        slot.innerHTML = '';
        window.google.accounts.id.renderButton(slot, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: 'signin_with',
          width: 280
        });
        return;
      } catch (err) {
        console.warn('Google GSI setup notice:', err);
      }
    }

    // 2. Fallback if GSI script is still loading from CDN
    slot.innerHTML = `
      <div class="text-xs text-gray-400 py-2 flex items-center justify-center gap-2">
        <svg class="w-4 h-4 animate-spin text-secondary" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Đang nạp Google OAuth...</span>
      </div>
    `;

    // Retry when GSI library finishes loading
    let retries = 0;
    const retryInterval = setInterval(() => {
      retries++;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(retryInterval);
        this.initGoogleGsi();
      } else if (retries > 10) {
        clearInterval(retryInterval);
      }
    }, 500);
  }

  async handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;
    this.showGoogleModalAlert('Đang xác thực mã Google Token & đồng bộ...', 'success');
    try {
      // 1. Safely decode Google JWT payload directly in the browser
      let googleUser = null;
      try {
        const parts = response.credential.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const payload = JSON.parse(jsonPayload);
          if (payload && payload.email) {
            googleUser = {
              id: payload.sub ? ('goog_' + payload.sub.slice(-6)) : 101,
              username: payload.email.split('@')[0],
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              display_name: payload.name || payload.email.split('@')[0],
              role: 'AUDIOPHILE',
              google_id: payload.sub || ('goog_' + Date.now()),
              avatar_url: payload.picture || 'assets/images/avatars/default.png',
              google_picture: payload.picture || 'assets/images/avatars/default.png',
              is_google: true,
              listening_hours: 0.0,
              synced_at: new Date().toLocaleString('vi-VN')
            };
          }
        }
      } catch (jwtErr) {
        console.warn('Google JWT parsing notice:', jwtErr);
      }

      // 2. Safely contact backend
      const result = await this.safeFetchJson('api/endpoints/auth.php?action=google_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      if (result && result.success && result.user) {
        this.currentUser = result.user;
        this.syncStats = result.sync_stats || {
          favorites_count: 0,
          playlists_count: 3,
          synced_tracks_count: 18,
          favorites: []
        };
      } else if (googleUser) {
        this.currentUser = googleUser;
        this.syncStats = {
          favorites_count: 0,
          playlists_count: 3,
          synced_tracks_count: 18,
          favorites: []
        };
      } else {
        return this.showGoogleModalAlert(result?.message || 'Không thể xác thực thông tin tài khoản Google!');
      }

      // Persist session to localStorage
      try {
        localStorage.setItem('minhduc_current_user', JSON.stringify(this.currentUser));
        localStorage.setItem('minhduc_sync_stats', JSON.stringify(this.syncStats));
      } catch (e) {}

      this.updateSidebarProfileUI();
      this.renderInpageAccountView();
      if (typeof this.loadSidebarPlaylists === 'function') this.loadSidebarPlaylists();
      if (typeof this.loadFeaturedAlbums === 'function') this.loadFeaturedAlbums();
      if (typeof this.loadAlbumsView === 'function') this.loadAlbumsView(true);
      if (typeof this.loadInitialFeed === 'function') this.loadInitialFeed();

      const modal = document.getElementById('google-signin-modal');
      if (modal) modal.classList.add('hidden');
      this.showInpageAlert(`Đăng nhập Google thành công! Chào mừng ${this.currentUser.display_name || this.currentUser.name}!`, 'success');
    } catch (err) {
      console.error('Google credential login error:', err);
      this.showGoogleModalAlert(err && err.message ? 'Lỗi: ' + err.message : 'Lỗi kết nối máy chủ!');
    }
  }

  // Bind YouTube Music Quick Mood Filter Pills on Home
  bindHomeMoodChips() {
    const chips = document.querySelectorAll('#home-mood-chips .home-mood-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const mood = chip.getAttribute('data-mood') || 'all';
        chips.forEach(c => {
          if (c === chip) {
            c.className = 'home-mood-chip px-3.5 py-1.5 rounded-full text-xs font-silkscreen transition-all shrink-0 bg-secondary text-black font-bold shadow-[0_0_12px_rgba(84,216,232,0.4)] cursor-pointer flex items-center gap-1.5';
          } else {
            c.className = 'home-mood-chip px-3.5 py-1.5 rounded-full text-xs font-silkscreen transition-all shrink-0 bg-surface-container-high text-gray-300 hover:text-white hover:bg-surface-container-highest cursor-pointer flex items-center gap-1.5';
          }
        });

        const titleEl = document.getElementById('home-made-for-you-title');
        if (titleEl) {
          const moodLabels = {
            all: 'ĐỀ XUẤT CHO BẠN / MADE FOR YOU',
            supermix: '🔀 MY SUPERMIX / BẢN PHỐI CÁ NHÂN',
            chill: '☕ THƯ GIÃN / CHILL & RELAX',
            energy: '⚡ NĂNG LƯỢNG / WORKOUT & BOOST',
            mood: '🌧️ TÂM TRẠNG / BALLAD & SOUL',
            focus: '🎯 TẬP TRUNG / DEEP FOCUS & STUDY',
            vpop: '🔥 THỊNH HÀNH / TOP HITS V-POP',
            retro: '📼 HOÀI NIỆM / RETRO & NOSTALGIA',
            audiophile: '🎧 AUDIOPHILE / HI-RES STUDIO'
          };
          titleEl.innerHTML = `<span class="w-2 h-2 bg-secondary"></span>${moodLabels[mood] || 'ĐỀ XUẤT ÂM NHẠC'}`;
        }

        this.loadInitialFeed(mood);
      });
    });
  }

  // Bind Music Taste Modal (Personalized for user account)
  bindMusicTasteModal() {
    const modal = document.getElementById('modal-music-taste');
    const btnOpen = document.getElementById('btn-open-taste-modal');
    const btnClose = document.getElementById('btn-close-taste-modal');
    const btnCancel = document.getElementById('btn-cancel-taste');
    const btnSave = document.getElementById('btn-save-taste-submit');
    const pills = document.querySelectorAll('.taste-chip');
    const inputArtists = document.getElementById('input-taste-artists');
    const alertMsg = document.getElementById('alert-taste-msg');

    if (!modal) return;

    const openModal = async () => {
      modal.classList.remove('hidden');
      if (alertMsg) alertMsg.classList.add('hidden');
      try {
        const res = await fetch('api/endpoints/auth.php?action=me');
        const d = await res.json();
        if (d.user && d.user.music_taste) {
          const tastes = d.user.music_taste.split(',').map(s => s.trim().toLowerCase());
          pills.forEach(p => {
            const v = p.getAttribute('data-val');
            if (tastes.includes(v)) {
              p.classList.add('bg-secondary', 'text-black', 'font-bold', 'border-secondary');
              p.classList.remove('text-gray-300', 'border-white/20');
            } else {
              p.classList.remove('bg-secondary', 'text-black', 'font-bold', 'border-secondary');
              p.classList.add('text-gray-300', 'border-white/20');
            }
          });
          const customArtists = tastes.filter(t => !['lofi', 'synthwave', 'chillhop', 'ballad', 'acoustic', 'anime', 'vpop', 'edm', 'jazz', 'usuk'].includes(t));
          if (customArtists.length > 0 && inputArtists) {
            inputArtists.value = customArtists.join(', ');
          }
        }
      } catch (e) {}
    };

    const closeModal = () => modal.classList.add('hidden');

    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    pills.forEach(p => {
      p.addEventListener('click', () => {
        const isSelected = p.classList.contains('bg-secondary');
        if (isSelected) {
          p.classList.remove('bg-secondary', 'text-black', 'font-bold', 'border-secondary');
          p.classList.add('text-gray-300', 'border-white/20');
        } else {
          p.classList.add('bg-secondary', 'text-black', 'font-bold', 'border-secondary');
          p.classList.remove('text-gray-300', 'border-white/20');
        }
      });
    });

    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const selectedGenres = Array.from(document.querySelectorAll('.taste-chip.bg-secondary'))
          .map(p => p.getAttribute('data-val'));
        const artists = inputArtists ? inputArtists.value.trim() : '';

        if (selectedGenres.length === 0 && !artists) {
          alert('Vui lòng chọn ít nhất 1 thể loại hoặc nhập nghệ sĩ yêu thích!');
          return;
        }

        btnSave.disabled = true;
        btnSave.innerHTML = `<div class="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full"></div> ĐANG ĐỒNG BỘ...`;

        try {
          const res = await fetch('api/endpoints/auth.php?action=save_taste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              music_taste: selectedGenres.join(', '),
              favorite_artists: artists
            })
          });
          const data = await res.json();
          if (data.success) {
            closeModal();
            this.showToast('✅ Đã cập nhật gu âm nhạc theo tài khoản thành công!');
            this.loadInitialFeed('all');
            this.loadFeaturedAlbums();
          } else {
            alert(data.message || 'Có lỗi xảy ra khi lưu gu âm nhạc.');
          }
        } catch (err) {
          alert('Lỗi kết nối máy chủ khi lưu.');
        } finally {
          btnSave.disabled = false;
          btnSave.innerHTML = `<span>🔄</span><span>LƯU & CẬP NHẬT THEO TÀI KHOẢN</span>`;
        }
      });
    }
  }

  // 10. Load Initial Real Feed from Backend (100% Real YouTube Music & Mood Filter)
  async loadInitialFeed(moodCategory = 'all') {
    try {
      const madeForYouGrid = document.getElementById('home-made-for-you-grid');
      if (moodCategory !== 'all' && moodCategory !== 'supermix' && madeForYouGrid) {
        madeForYouGrid.innerHTML = `
          <div class="col-span-full py-8 flex flex-col items-center justify-center gap-2">
            <div class="w-6 h-6 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
            <span class="font-silkscreen text-[11px] text-gray-400">Đang cập nhật thể loại YouTube Music...</span>
          </div>
        `;
      }

      const res = await fetch(`api/endpoints/tracks.php?action=initial_feed&category=${encodeURIComponent(moodCategory)}`);
      const data = await res.json();
      if (data.success && data.tracks && data.tracks.length > 0) {
        // If loading initial/all or supermix, update base player tracks
        if (moodCategory === 'all' || moodCategory === 'supermix' || !this.tracks || this.tracks.length <= 4) {
          this.tracks = data.tracks.map(t => ({
            id: t.id || ('yt_' + t.youtube_id),
            db_id: t.db_id || t.id,
            title: t.title,
            artist: t.artist,
            album: t.album || 'YouTube Music',
            duration: t.duration || 210,
            format: t.format || 'YT AUDIO 320k',
            cover: t.cover_url || ('https://i.ytimg.com/vi/' + t.youtube_id + '/hqdefault.jpg'),
            cover_url: t.cover_url || ('https://i.ytimg.com/vi/' + t.youtube_id + '/hqdefault.jpg'),
            source_type: 'youtube',
            youtube_id: t.youtube_id,
            badge: 'YOUTUBE 320k'
          }));

          if (this.currentTrack) {
            this.updateUI();
          }
        }

        // Dynamically update featured albums from initial feed
        if (data.featured_albums && Array.isArray(data.featured_albums) && data.featured_albums.length > 0) {
          this.featuredAlbums = data.featured_albums;
          this.featuredAlbumIndex = 0;
          this.renderFeaturedAlbum(0, false);
          this.startFeaturedAlbumCarousel();
        }

        // Dynamically render "ĐỀ XUẤT CHO BẠN / MADE FOR YOU" cards with genuine YouTube songs (8 cards in 2 rows)
        const madeForYouList = (data.made_for_you && data.made_for_you.length > 0) 
          ? data.made_for_you 
          : this.tracks.slice(0, 8);

        if (madeForYouGrid && madeForYouList.length > 0) {
          madeForYouGrid.innerHTML = '';
          const pillQualities = ['YT AUDIO', 'HQ AUDIO', 'STEREO', 'YT AUDIO', 'HQ AUDIO', 'STEREO'];
          const pillColors = [
            'text-secondary border-secondary/60 shadow-[0_0_8px_rgba(84,216,232,0.3)]',
            'text-tertiary border-tertiary/60 shadow-[0_0_8px_rgba(255,175,211,0.3)]',
            'text-primary border-primary/60 shadow-[0_0_8px_rgba(206,189,255,0.3)]',
            'text-secondary border-secondary/60 shadow-[0_0_8px_rgba(84,216,232,0.3)]',
            'text-tertiary border-tertiary/60 shadow-[0_0_8px_rgba(255,175,211,0.3)]',
            'text-primary border-primary/60 shadow-[0_0_8px_rgba(206,189,255,0.3)]'
          ];
          const tagLabels = ['[TREND]', '[HOT HIT]', '[VPOP]', '[RECOMMEND]', '[BALLAD]', '[TOP HIT]', '[REMIX]', '[VIRAL]'];

          madeForYouList.slice(0, 8).forEach((t, idx) => {
            const card = document.createElement('div');
            card.className = 'music-card-item group bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-[#a78bfa]/50 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer';
            card.setAttribute('data-track-index', idx + 1);
            const ytId = t.youtube_id || '';
            let coverUrl = t.cover_url || t.cover || '';
            if (!coverUrl || coverUrl.indexOf('googleusercontent') !== -1 || coverUrl.indexOf('sqp=') !== -1) {
              coverUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : 'assets/images/default-album.png';
            }
            const qualityText = pillQualities[idx % pillQualities.length];
            const qualityColor = pillColors[idx % pillColors.length];
            const isSynced = t.is_synced === 1 || t.badge === 'GOOGLE SYNC';
            const tagText = isSynced ? '[ĐỒNG BỘ]' : (t.tag || tagLabels[idx % tagLabels.length]);
            const formatText = t.format || 'YT AUDIO 320k';

            card.innerHTML = `
              <div class="w-full aspect-square rounded-lg overflow-hidden relative mb-2.5">
                <img alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${coverUrl}" data-yt-id="${ytId}" onerror="this.onerror=null; if(this.dataset.ytId){this.src='https://i.ytimg.com/vi/'+this.dataset.ytId+'/hqdefault.jpg';}else{this.src='assets/images/default-album.png';}">
                <div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/90 font-mono text-[9px] font-semibold ${qualityColor} rounded">${qualityText}</div>
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div class="w-10 h-10 bg-[#a78bfa] text-black flex items-center justify-center rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                    <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"></polygon></svg>
                  </div>
                </div>
              </div>
              <div class="flex flex-col min-w-0">
                <h3 class="text-sm font-semibold text-white tracking-wide truncate group-hover:text-[#a78bfa] transition-colors mb-0.5" title="${this.escapeHtml(t.title)}">${this.escapeHtml(t.title)}</h3>
                <p class="text-xs text-gray-400 truncate mb-2" title="${this.escapeHtml(t.artist || 'YouTube Music')}">${this.escapeHtml(t.artist || 'YouTube Music')}</p>
                <div class="flex items-center gap-1.5 pt-1.5 border-t border-white/5">
                  <span class="font-mono text-[10px] text-[#a78bfa] bg-[#a78bfa]/10 px-1.5 py-0.5 rounded border border-[#a78bfa]/30 font-semibold">${tagText}</span>
                  <span class="font-mono text-[10px] text-gray-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">${this.escapeHtml(formatText)}</span>
                </div>
              </div>
            `;

            card.addEventListener('click', (e) => {
              e.preventDefault();
              this.playTrackDirect({
                id: t.id || ('yt_' + t.youtube_id),
                db_id: t.db_id,
                youtube_id: t.youtube_id,
                title: t.title,
                artist: t.artist,
                album: t.album || 'YouTube Music',
                cover_url: coverUrl,
                cover: coverUrl,
                duration: t.duration || 210,
                format: t.format || 'YT AUDIO 320k'
              });
            });

            madeForYouGrid.appendChild(card);
          });
        }
      }
    } catch (err) {
      console.warn('Load initial feed error:', err);
    }
  }

  // 11. Featured Albums Carousel (YouTube Trending for Guest / Google Personalized for Logged In)
  async loadFeaturedAlbums() {
    try {
      const res = await fetch('api/endpoints/tracks.php?action=featured_albums');
      const data = await res.json();
      if (data.success && Array.isArray(data.albums) && data.albums.length > 0) {
        this.featuredAlbums = data.albums;
        this.featuredAlbumIndex = 0;
        this.renderFeaturedAlbum(0, false);
        this.startFeaturedAlbumCarousel();
      }
    } catch (e) {
      console.log('Featured albums load error:', e);
    }
  }

  renderFeaturedAlbum(index, withTransition = true) {
    if (!this.featuredAlbums || this.featuredAlbums.length === 0) return;
    const album = this.featuredAlbums[index % this.featuredAlbums.length];
    if (!album) return;

    const heroCover = document.getElementById('hero-track-cover');
    const heroTitle = document.getElementById('hero-track-title');
    const heroArtist = document.getElementById('hero-track-artist');
    const heroFormat = document.getElementById('hero-track-format');
    const heroBadge = document.getElementById('hero-album-badge');
    const heroRank = document.getElementById('hero-trending-rank');
    const heroIndicators = document.querySelectorAll('.hero-album-dot');

    if (withTransition) {
      if (heroCover) {
        heroCover.style.opacity = '0.2';
        heroCover.style.transform = 'scale(0.95)';
      }
      if (heroTitle) heroTitle.style.opacity = '0.3';
      if (heroArtist) heroArtist.style.opacity = '0.3';
    }

    setTimeout(() => {
      if (heroCover && album.cover) {
        heroCover.src = album.cover;
        heroCover.style.opacity = '1';
        heroCover.style.transform = 'scale(1)';
      }
      if (heroTitle) {
        heroTitle.textContent = album.title;
        heroTitle.title = album.title;
        heroTitle.style.opacity = '1';
      }
      if (heroArtist) {
        heroArtist.textContent = album.artist;
        heroArtist.title = album.artist;
        heroArtist.style.opacity = '1';
      }
      if (heroFormat) heroFormat.textContent = album.badge || 'FLAC 192kHz 24-bit';
      if (heroBadge) heroBadge.textContent = album.cover_badge || album.rank || 'TOP 1 TRENDING';
      if (heroRank) heroRank.textContent = album.rank || 'TOP 1 TRENDING';

      // Update indicators
      heroIndicators.forEach((dot, dIdx) => {
        if (dIdx === (index % this.featuredAlbums.length)) {
          dot.className = 'hero-album-dot w-6 h-2 rounded bg-secondary transition-all cursor-pointer shadow-[0_0_8px_rgba(84,216,232,0.6)]';
        } else {
          dot.className = 'hero-album-dot w-2 h-2 rounded bg-white/20 hover:bg-white/50 transition-all cursor-pointer';
        }
      });
    }, withTransition ? 200 : 0);
  }

  startFeaturedAlbumCarousel() {
    if (this.featuredAlbumTimer) {
      clearInterval(this.featuredAlbumTimer);
      this.featuredAlbumTimer = null;
    }
    if (!this.featuredAlbums || this.featuredAlbums.length <= 1) return;

    this.featuredAlbumTimer = setInterval(() => {
      if (this.isHeroHovered) return; // Pause on hover
      this.featuredAlbumIndex = (this.featuredAlbumIndex + 1) % this.featuredAlbums.length;
      this.renderFeaturedAlbum(this.featuredAlbumIndex, true);
    }, 5000);
  }

  bindHeroEvents() {
    const heroBanner = document.getElementById('hero-section-banner');
    if (heroBanner) {
      heroBanner.addEventListener('mouseenter', () => { this.isHeroHovered = true; });
      heroBanner.addEventListener('mouseleave', () => { this.isHeroHovered = false; });
    }

    // Indicators click
    document.querySelectorAll('.hero-album-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
        this.featuredAlbumIndex = idx;
        this.renderFeaturedAlbum(idx, true);
        this.startFeaturedAlbumCarousel();
      });
    });

    // Play album button
    const heroPlayBtn = document.getElementById('hero-play-btn');
    if (heroPlayBtn) {
      heroPlayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentAlb = (this.featuredAlbums && this.featuredAlbums.length > 0)
          ? (this.featuredAlbums[this.featuredAlbumIndex] || this.featuredAlbums[0])
          : null;
        if (currentAlb) {
          this.playAlbumDirect(currentAlb.query || currentAlb.title);
        } else {
          this.togglePlay();
        }
      });
    }

    // Save album button
    const heroSaveBtn = document.getElementById('hero-save-album-btn');
    if (heroSaveBtn) {
      heroSaveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentAlb = (this.featuredAlbums && this.featuredAlbums.length > 0)
          ? (this.featuredAlbums[this.featuredAlbumIndex] || this.featuredAlbums[0])
          : null;
        if (currentAlb) {
          this.toggleAlbumFavorite(currentAlb);
          this.showInpageAlert(`Đã lưu album "${currentAlb.title}" vào danh sách yêu thích!`, 'success');
        }
      });
    }

    // Cover container click
    const heroCoverCont = document.getElementById('hero-cover-container');
    if (heroCoverCont) {
      heroCoverCont.addEventListener('click', (e) => {
        e.preventDefault();
        const currentAlb = (this.featuredAlbums && this.featuredAlbums.length > 0)
          ? (this.featuredAlbums[this.featuredAlbumIndex] || this.featuredAlbums[0])
          : null;
        if (currentAlb) this.openAlbumDetail(currentAlb);
      });
    }

    // Title click
    const heroTitle = document.getElementById('hero-track-title');
    if (heroTitle) {
      heroTitle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentAlb = (this.featuredAlbums && this.featuredAlbums.length > 0)
          ? (this.featuredAlbums[this.featuredAlbumIndex] || this.featuredAlbums[0])
          : null;
        if (currentAlb) this.openAlbumDetail(currentAlb);
      });
    }
  }

  // 12. Helper to get user ID or guest key
  getUserId() {
    return (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'guest';
  }

  // 13. YouTube Music Quick Mood Filter Chips (Tất cả, My Supermix, Thư giãn, Năng lượng, Tâm trạng, ...)
  bindHomeMoodChips() {
    const chipContainer = document.getElementById('home-mood-chips');
    if (!chipContainer) return;

    chipContainer.querySelectorAll('.home-mood-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const mood = chip.getAttribute('data-mood') || 'all';

        // Update active chip styling
        chipContainer.querySelectorAll('.home-mood-chip').forEach(c => {
          if (c === chip) {
            c.className = 'home-mood-chip px-3.5 py-1.5 rounded-full text-xs font-silkscreen transition-all shrink-0 bg-secondary text-black font-bold shadow-[0_0_12px_rgba(84,216,232,0.4)] cursor-pointer flex items-center gap-1.5';
          } else {
            c.className = 'home-mood-chip px-3.5 py-1.5 rounded-full text-xs font-silkscreen transition-all shrink-0 bg-surface-container-high text-gray-300 hover:text-white hover:bg-surface-container-highest cursor-pointer flex items-center gap-1.5';
          }
        });

        // Update Section title with selected mood
        const moodTitle = document.getElementById('home-made-for-you-title');
        if (moodTitle) {
          const chipSpan = chip.querySelector('span:last-child');
          const chipText = chipSpan ? chipSpan.textContent : mood;
          moodTitle.innerHTML = `<span class="w-2 h-2 bg-secondary"></span>ĐỀ XUẤT CHO BẠN: ${chipText.toUpperCase()} / MADE FOR YOU`;
        }

        // Fetch genuine songs for this mood
        this.loadInitialFeed(mood);
      });
    });
  }

  // 14. Music Taste Modal (Tùy chỉnh gu âm nhạc tài khoản Google)
  bindMusicTasteModal() {
    const openBtn = document.getElementById('btn-open-taste-modal');
    const modal = document.getElementById('modal-music-taste');
    const closeBtn = document.getElementById('btn-close-taste-modal');
    const cancelBtn = document.getElementById('btn-cancel-taste');
    const saveBtn = document.getElementById('btn-save-taste-submit');
    const artistInput = document.getElementById('input-taste-artists');
    const genrePills = document.querySelectorAll('#taste-genre-pills .taste-chip');
    const alertBox = document.getElementById('alert-taste-msg');

    const closeModal = () => {
      if (modal) modal.classList.add('hidden');
    };

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        if (!modal) return;
        modal.classList.remove('hidden');
        if (alertBox) alertBox.classList.add('hidden');

        // Prepopulate currently selected genres & artists
        let currentTasteStr = '';
        if (this.currentUser && this.currentUser.music_taste) {
          currentTasteStr = this.currentUser.music_taste;
        } else {
          currentTasteStr = localStorage.getItem('minhduc_taste_' + this.getUserId()) || 'lofi,synthwave,chill';
        }

        const tags = currentTasteStr.toLowerCase().split(',').map(s => s.trim());
        genrePills.forEach(pill => {
          const val = (pill.getAttribute('data-val') || '').toLowerCase();
          const isSelected = tags.some(t => t.includes(val) || val.includes(t));
          pill.classList.toggle('bg-secondary', isSelected);
          pill.classList.toggle('text-black', isSelected);
          pill.classList.toggle('font-bold', isSelected);
          pill.classList.toggle('border-secondary', isSelected);
          pill.classList.toggle('text-gray-300', !isSelected);
          pill.classList.toggle('border-white/20', !isSelected);
        });

        // Prepopulate custom artists if stored
        if (artistInput) {
          const knownGenres = ['lofi', 'synthwave', 'chillhop', 'ballad', 'acoustic', 'anime', 'vpop', 'edm', 'jazz', 'usuk', 'chill'];
          const artists = tags.filter(t => !knownGenres.includes(t));
          artistInput.value = artists.join(', ');
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Toggle genre selection
    genrePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const isSelected = pill.classList.contains('bg-secondary');
        pill.classList.toggle('bg-secondary', !isSelected);
        pill.classList.toggle('text-black', !isSelected);
        pill.classList.toggle('font-bold', !isSelected);
        pill.classList.toggle('border-secondary', !isSelected);
        pill.classList.toggle('text-gray-300', isSelected);
        pill.classList.toggle('border-white/20', isSelected);
      });
    });

    // Submit save taste
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const selectedGenres = [];
        document.querySelectorAll('#taste-genre-pills .taste-chip.bg-secondary').forEach(p => {
          const val = p.getAttribute('data-val');
          if (val) selectedGenres.push(val);
        });

        const artists = artistInput ? artistInput.value.trim() : '';
        const combined = [...selectedGenres];
        if (artists) combined.push(artists);
        const tasteStr = combined.join(', ');

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full"></span><span>Đang lưu...</span>';

        try {
          if (this.currentUser && this.currentUser.id) {
            const res = await fetch('api/endpoints/auth.php?action=save_taste', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                music_taste: selectedGenres.join(','),
                favorite_artists: artists
              })
            });
            const data = await res.json();
            if (data.success) {
              if (this.currentUser) this.currentUser.music_taste = tasteStr;
            }
          }

          localStorage.setItem('minhduc_taste_' + this.getUserId(), tasteStr);
          this.showToast('Đã lưu gu âm nhạc cá nhân thành công!', 'success');

          // Refresh feed according to new personal taste
          this.loadInitialFeed('supermix');

          setTimeout(() => {
            closeModal();
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span>🔄</span><span>LƯU & CẬP NHẬT THEO TÀI KHOẢN</span>';
          }, 400);
        } catch (e) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<span>🔄</span><span>LƯU & CẬP NHẬT THEO TÀI KHOẢN</span>';
          this.showToast('Lỗi lưu gu âm nhạc!', 'error');
        }
      });
    }
  }

  // 15. Real Weekly Stats, 7-Day Chart & Top 3 Tracks (from MySQL database)
  // 15. Real Weekly Stats, 7-Day Chart & Top 3 Tracks (from MySQL database)
  async loadWeeklyStats() {
    try {
      const url = this.currentUser && this.currentUser.id 
        ? `api/endpoints/stats.php?action=weekly_stats&user_id=${this.currentUser.id}` 
        : 'api/endpoints/stats.php?action=weekly_stats';
      const res = await fetch(url);
      const data = await res.json();
      if (!data || !data.success) return;

      // Capture base values from database
      this.initialLifetimeSeconds = (data.summary && data.summary.total_lifetime_seconds) || (data.lifetime_hours ? Math.round(data.lifetime_hours * 3600) : 0);
      this.initialWeeklySeconds = (data.summary && data.summary.weekly_seconds) || (data.weekly_hours ? Math.round(data.weekly_hours * 3600) : 0);
      this.liveListeningSeconds = 0;
      this.pendingSyncSeconds = 0;

      if (Array.isArray(data.seven_days_chart)) {
        this.sevenDaysChartData = JSON.parse(JSON.stringify(data.seven_days_chart));
        const todayCode = (new Date().getDay() || 7);
        const todayData = data.seven_days_chart.find(d => d.day_code === todayCode);
        this.initialTodaySeconds = todayData ? (todayData.seconds || 0) : 0;
      }

      // 1. Header listening hours (honest lifetime listening time)
      const headerHoursEl = document.getElementById('header-listening-hours');
      if (headerHoursEl) {
        headerHoursEl.textContent = `${(this.initialLifetimeSeconds / 3600).toFixed(2)} hrs`;
      }

      // 2. Sidebar weekly total badge
      const weeklyTotalBadge = document.getElementById('sidebar-stat-weekly-total');
      if (weeklyTotalBadge) {
        weeklyTotalBadge.textContent = `TỔNG: ${(this.initialWeeklySeconds / 3600).toFixed(2)} HRS`;
      }

      // 3. Sidebar weekly hours (Xh Ym Zs)
      const weeklyHoursEl = document.getElementById('sidebar-stat-weekly-hours');
      if (weeklyHoursEl) {
        const wH = Math.floor(this.initialWeeklySeconds / 3600);
        const wM = Math.floor((this.initialWeeklySeconds % 3600) / 60);
        const wS = this.initialWeeklySeconds % 60;
        weeklyHoursEl.innerHTML = `${wH}<span class="text-secondary text-[11px]">h</span> ${wM}<span class="text-secondary text-[11px]">m</span> <span class="text-[10px] text-gray-400 font-mono font-normal">${wS.toString().padStart(2, '0')}s</span>`;
      }

      // 4. Trend badge
      const trendEl = document.getElementById('sidebar-stat-weekly-trend');
      if (trendEl) {
        trendEl.textContent = data.trend || '--';
      }

      // 5. Daily average
      const dailyAvgEl = document.getElementById('sidebar-stat-daily-avg');
      if (dailyAvgEl) {
        const avgHrs = (this.initialWeeklySeconds / 3600 / 7).toFixed(2);
        dailyAvgEl.textContent = `TB: ${avgHrs}h/ngày`;
      }

      // 6. 7-Day Bar Chart
      if (Array.isArray(data.seven_days_chart)) {
        const maxMins = Math.max(...data.seven_days_chart.map(d => d.minutes || 0), 10);
        data.seven_days_chart.forEach((d, idx) => {
          const colEl = document.getElementById(`chart-col-${idx + 1}`);
          if (colEl) {
            const barWrap = colEl.querySelector('div');
            if (barWrap) {
              const heightPct = Math.min(100, Math.max(10, Math.round(((d.minutes || 0) / maxMins) * 100)));
              const isToday = (idx + 1) === (new Date().getDay() || 7);
              const barColor = isToday 
                ? 'bg-secondary shadow-[0_0_8px_rgba(84,216,232,0.6)]' 
                : ((d.minutes > 0) ? 'bg-primary-container/80' : 'bg-secondary/30');

              barWrap.innerHTML = `
                <div class="w-full max-w-[14px] rounded-[1px] transition-all duration-500 ${barColor}" 
                     style="height: ${heightPct}%;" 
                     title="${d.label || d.day_name}: ${d.minutes} phút (${d.hours}h)">
                </div>
              `;
            }
          }
        });
      }

      // 7. Top 3 Most Played Tracks this week (Honest data from MySQL history)
      const topListEl = document.getElementById('sidebar-top-tracks-list');
      if (topListEl) {
        if (Array.isArray(data.top_tracks) && data.top_tracks.length > 0) {
          topListEl.innerHTML = '';
          data.top_tracks.slice(0, 3).forEach((tr, idx) => {
            const rankNum = idx + 1;
            const rankColor = rankNum === 1 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' : (rankNum === 2 ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' : 'text-gray-400 bg-white/5 border-white/10');
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between p-1.5 rounded-lg bg-surface-container-high/60 hover:bg-surface-container-highest cursor-pointer transition-colors border border-white/5 group';
            row.innerHTML = `
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-4 h-4 rounded font-silkscreen text-[9px] flex items-center justify-center font-bold border ${rankColor} shrink-0">${rankNum}</span>
                <div class="min-w-0 flex flex-col">
                  <span class="text-[11px] font-bold text-white group-hover:text-secondary truncate leading-tight">${this.escapeHtml(tr.title)}</span>
                  <span class="text-[9px] text-gray-400 truncate leading-tight">${this.escapeHtml(tr.artist || 'YouTube Music')}</span>
                </div>
              </div>
              <span class="font-silkscreen text-[8px] text-secondary font-bold px-1.5 py-0.5 rounded bg-secondary/10 border border-secondary/30 shrink-0 ml-1">${tr.plays_count || 1} PLAYS</span>
            `;
            row.addEventListener('click', () => {
              this.playTrackDirect({
                id: tr.id,
                youtube_id: tr.youtube_id,
                title: tr.title,
                artist: tr.artist,
                cover_url: tr.cover_url || ('https://i.ytimg.com/vi/' + tr.youtube_id + '/hqdefault.jpg'),
                duration: tr.duration || 210,
                format: tr.format || 'YT AUDIO 320k'
              });
            });
            topListEl.appendChild(row);
          });
        } else {
          topListEl.innerHTML = `
            <div class="py-2.5 text-center font-silkscreen text-[8px] text-gray-500 flex flex-col items-center gap-1">
              <span>🎵 Chưa có lượt phát tuần này</span>
              <span class="text-[7px] text-gray-600">Nghe nhạc để cập nhật bảng xếp hạng</span>
            </div>
          `;
        }
      }
    } catch (e) {
      console.warn('Load weekly stats error:', e);
    }
  }

  // 16. Render Recent Listening History in Right Sidebar
  renderSidebarRecentTracks() {
    const listEl = document.getElementById('sidebar-recent-tracks-list');
    const countBadge = document.getElementById('sidebar-recent-count');
    if (!listEl) return;

    try {
      const storageKey = this.getHistoryStorageKey();
      const history = JSON.parse(localStorage.getItem(storageKey) || '[]');

      if (countBadge) {
        countBadge.textContent = `LOG (${history.length})`;
      }

      if (!history || history.length === 0) {
        listEl.innerHTML = '<div class="py-3 text-center font-silkscreen text-[8px] text-gray-500">Chưa có lịch sử phát</div>';
        return;
      }

      listEl.innerHTML = '';
      history.slice(0, 10).forEach(tr => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-1.5 rounded-lg bg-surface-container-high/40 hover:bg-surface-container-high cursor-pointer transition-colors border border-white/5 group';
        const cover = tr.cover_url || tr.cover || (tr.youtube_id ? `https://i.ytimg.com/vi/${tr.youtube_id}/hqdefault.jpg` : 'assets/images/default-album.png');
        const relTime = this.getRelativeTime(tr.played_at || tr.playedAt);

        row.innerHTML = `
          <div class="flex items-center gap-2 min-w-0">
            <img src="${cover}" class="w-7 h-7 rounded object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform" onerror="this.onerror=null; this.src='assets/images/default-album.png';">
            <div class="min-w-0 flex flex-col">
              <span class="text-[11px] font-semibold text-white group-hover:text-secondary truncate leading-tight">${this.escapeHtml(tr.title)}</span>
              <span class="text-[9px] text-gray-400 truncate leading-tight">${this.escapeHtml(tr.artist || 'YouTube Music')}</span>
            </div>
          </div>
          <span class="font-silkscreen text-[8px] text-gray-500 shrink-0 ml-1 font-mono">${relTime}</span>
        `;

        row.addEventListener('click', () => {
          this.playTrackDirect({
            id: tr.id,
            youtube_id: tr.youtube_id,
            title: tr.title,
            artist: tr.artist,
            cover_url: cover,
            duration: tr.duration || 210,
            format: tr.format || 'YT AUDIO 320k'
          });
        });

        listEl.appendChild(row);
      });
    } catch (e) {
      console.warn('Render sidebar recent error:', e);
    }
  }
}

// Global initialization
function initMinhDucPlayer() {
  if (!window.minhDucPlayer) {
    window.minhDucPlayer = new MinhDucAudioEngine();
    window.player = window.minhDucPlayer;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMinhDucPlayer);
} else {
  initMinhDucPlayer();
}

