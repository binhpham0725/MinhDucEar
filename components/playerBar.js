/**
 * MinhDucEar - Player Bar Component (hluv-magazine-architecture standard)
 * Manages the fixed bottom player bar: cover, metadata, controls, seekbar, volume.
 */

import { formatTime } from '../utils/helpers.js';
import { sanitize } from '../utils/helpers.js';

const IDS = {
  COVER: 'mini-player-cover',
  TITLE: 'mini-player-title',
  ARTIST: 'mini-player-artist',
  TIME_CURRENT: 'time-current',
  TIME_TOTAL: 'time-total',
  SEEK_BAR: 'seek-bar',
  SEEK_PROGRESS: 'seek-bar-inner',
  VOLUME_BAR: 'volume-bar-inner',
  BTN_PLAY: 'btn-play-pause',
  BTN_PREV: 'btn-prev',
  BTN_NEXT: 'btn-next',
  BTN_SHUFFLE: 'btn-shuffle',
  BTN_REPEAT: 'btn-repeat',
  FAV_INDICATOR: 'player-bar-fav-indicator'
};

/**
 * Update the cover/title/artist metadata area of the player bar.
 */
export function updatePlayerMeta(track) {
  if (!track) return;
  const cover = document.getElementById(IDS.COVER);
  const title = document.getElementById(IDS.TITLE);
  const artist = document.getElementById(IDS.ARTIST);

  if (cover) {
    const src = track.cover_url || track.cover || `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg`;
    if (cover.src !== src) cover.src = src;
  }
  if (title) title.textContent = track.title || '—';
  if (artist) artist.textContent = track.artist || '—';
}

/**
 * Update seekbar and time labels.
 * @param {number} currentTime  - in seconds
 * @param {number} duration     - in seconds
 */
export function updateSeekBar(currentTime, duration) {
  const progress = document.getElementById(IDS.SEEK_PROGRESS);
  const current = document.getElementById(IDS.TIME_CURRENT);
  const total = document.getElementById(IDS.TIME_TOTAL);

  const pct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  if (progress) progress.style.width = `${pct}%`;
  if (current) current.textContent = formatTime(currentTime);
  if (total) total.textContent = formatTime(duration);
}

/**
 * Update play/pause button icon.
 * @param {boolean} isPlaying
 */
export function updatePlayButton(isPlaying) {
  const btn = document.getElementById(IDS.BTN_PLAY);
  if (!btn) return;
  if (isPlaying) {
    btn.innerHTML = `<svg class="w-5 h-5 pixel-icon text-primary" fill="none" viewBox="0 0 16 16"><rect fill="currentColor" height="12" width="3" x="3" y="2"></rect><rect fill="currentColor" height="12" width="3" x="10" y="2"></rect></svg>`;
    btn.setAttribute('aria-label', 'Tạm dừng');
    btn.setAttribute('title', 'Tạm dừng');
  } else {
    btn.innerHTML = `<svg class="w-5 h-5 pixel-icon text-primary" fill="none" viewBox="0 0 16 16"><polygon fill="currentColor" points="4,2 14,8 4,14"></polygon></svg>`;
    btn.setAttribute('aria-label', 'Phát');
    btn.setAttribute('title', 'Phát');
  }
}

/**
 * Update the volume bar visual width.
 * @param {number} fraction  0.0 – 1.0
 */
export function updateVolumeBar(fraction) {
  const bar = document.getElementById(IDS.VOLUME_BAR);
  if (bar) bar.style.width = `${Math.floor(fraction * 100)}%`;
}
