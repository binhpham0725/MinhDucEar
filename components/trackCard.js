/**
 * MinhDucEar - Track Card Component (hluv-magazine-architecture standard)
 * Renders a single track row for use in Favorites, History, Search Results, and Playlists.
 */

import { sanitize, formatTime } from '../utils/helpers.js';

/**
 * Create a track row DOM element.
 *
 * @param {Object} track  - Track data
 * @param {number} index  - Display index (1-based)
 * @param {Object} opts   - Options & callbacks
 *   @param {string}   opts.mode        - 'favorites' | 'history' | 'search' | 'playlist' (default: 'favorites')
 *   @param {Function} opts.onPlay      - (track) called when row or play button is clicked
 *   @param {Function} opts.onRemove    - (track, rowEl) called when remove/un-fav button is clicked
 *   @param {Function} opts.onAddQueue  - (track) called when add-to-queue button is clicked
 * @returns {HTMLElement}
 */
export function createTrackRow(track, index = 1, opts = {}) {
  const { mode = 'favorites', onPlay, onRemove, onAddQueue } = opts;

  const row = document.createElement('div');
  row.className = 'track-row flex items-center justify-between p-3 rounded-xl bg-[#15151e]/80 hover:bg-[#1c1c28] border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer group select-none shadow';

  const cover = track.cover_url || track.cover || `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg`;
  const duration = track.duration_str || (track.duration ? formatTime(track.duration) : '03:30');

  const showRemoveBtn = mode === 'favorites' || mode === 'playlist';

  row.innerHTML = `
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <span class="font-pixel text-[9px] text-gray-500 w-5 text-center shrink-0">${index}</span>
      <img src="${sanitize(cover)}" class="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
           onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100';">
      <div class="min-w-0 flex-1">
        <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-pink-400 transition-colors truncate">${sanitize(track.title)}</h4>
        <p class="text-[10px] text-gray-400 truncate mt-0.5">${sanitize(track.artist || 'Nghệ sĩ')}</p>
      </div>
    </div>
    <div class="flex items-center gap-3 shrink-0 ml-3">
      <span class="font-mono text-[9px] text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded border border-pink-400/30 hidden sm:inline-block">${sanitize(track.format || 'FLAC 96k')}</span>
      <span class="font-mono text-[10px] text-gray-400 hidden sm:inline-block">${sanitize(duration)}</span>
      <button type="button" class="btn-track-play w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500 text-pink-300 hover:text-black flex items-center justify-center transition-colors cursor-pointer" title="Phát bài này">▶</button>
      ${showRemoveBtn ? `<button type="button" class="btn-track-remove p-2 text-pink-500 hover:text-gray-400 hover:scale-125 transition-all cursor-pointer" title="Xóa khỏi danh sách">♥</button>` : ''}
    </div>
  `;

  // Row click → play
  row.addEventListener('click', (e) => {
    if (e.target.closest('.btn-track-remove') || e.target.closest('.btn-track-play')) return;
    if (typeof onPlay === 'function') onPlay(track);
  });

  // Play button
  const playBtn = row.querySelector('.btn-track-play');
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onPlay === 'function') onPlay(track);
    });
  }

  // Remove / unfav button
  const removeBtn = row.querySelector('.btn-track-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onRemove === 'function') onRemove(track, row);
    });
  }

  return row;
}
