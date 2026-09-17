/**
 * MinhDucEar - Album Card Component (hluv-magazine-architecture standard)
 * Renders a grid album card element with favorite button and play overlay.
 */

import { sanitize } from '../utils/helpers.js';

/**
 * Create a single album card DOM element.
 *
 * @param {Object} alb - Album data object
 * @param {boolean} isFav - Whether album is already favorited
 * @param {Object} handlers - Event callbacks
 *   @param {Function} handlers.onCardClick  - (alb) Called on card click
 *   @param {Function} handlers.onPlayClick  - (alb) Called on play button click
 *   @param {Function} handlers.onFavClick   - (alb, btnEl) Called on fav button click
 * @returns {HTMLElement}
 */
export function createAlbumCard(alb, isFav = false, handlers = {}) {
  const { onCardClick, onPlayClick, onFavClick } = handlers;

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

  const favHeartClass = isFav ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400';
  const favHeartChar = isFav ? '♥' : '♡';

  card.innerHTML = `
    <div class="w-full aspect-square rounded-lg overflow-hidden relative mb-2.5 bg-black/60">
      <img src="${sanitize(alb.cover)}" alt="${sanitize(alb.title)}"
           onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';"
           class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
      <div class="absolute top-2 left-2 px-1.5 py-0.5 bg-black/90 font-mono text-[8px] font-semibold text-primary border border-primary/60 rounded">
        ${sanitize(alb.badge || 'FLAC 96k')}
      </div>
      <button type="button" class="btn-card-album-fav absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-black text-xs ${favHeartClass} flex items-center justify-center border border-white/20 transition-all cursor-pointer z-10" title="Yêu thích album này">
        ${favHeartChar}
      </button>
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button type="button" class="btn-album-play w-11 h-11 bg-primary text-on-primary flex items-center justify-center rounded-full shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer">
          <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"></polygon></svg>
        </button>
      </div>
    </div>
    <div>
      <h4 class="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">${sanitize(alb.title)}</h4>
      <p class="text-xs text-gray-400 truncate mt-0.5">${sanitize(alb.artist)}</p>
      <div class="flex items-center justify-between pt-2 mt-2 border-t border-white/10 font-silkscreen text-[9px] text-outline">
        <span>${sanitize(alb.year || '2026')} • ${sanitize(String(alb.tracks_count || '10 TRACKS'))}</span>
        <span class="text-secondary">${sanitize(alb.tag || 'HI-RES')}</span>
      </div>
    </div>
  `;

  // Card click — open detail
  card.addEventListener('click', (e) => {
    if (e.target.closest('.btn-album-play') || e.target.closest('.btn-card-album-fav')) return;
    if (typeof onCardClick === 'function') onCardClick(alb);
  });

  // Play button
  const playBtn = card.querySelector('.btn-album-play');
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onPlayClick === 'function') onPlayClick(alb);
    });
  }

  // Fav button
  const favBtn = card.querySelector('.btn-card-album-fav');
  if (favBtn) {
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onFavClick === 'function') onFavClick(alb, favBtn);
    });
  }

  return card;
}

/**
 * Update the visual state of a fav button on an album card.
 */
export function updateAlbumFavButton(btnEl, isFav) {
  if (!btnEl) return;
  btnEl.textContent = isFav ? '♥' : '♡';
  if (isFav) {
    btnEl.classList.remove('text-gray-400', 'hover:text-pink-400');
    btnEl.classList.add('text-pink-500');
  } else {
    btnEl.classList.remove('text-pink-500');
    btnEl.classList.add('text-gray-400', 'hover:text-pink-400');
  }
}
