/**
 * MinhDucEar - Lyrics Modal Component (hluv-magazine-architecture standard)
 * Handles the lyrics modal open/close and synchronized karaoke scrolling.
 */

import { sanitize } from '../utils/helpers.js';

const MODAL_ID = 'lyrics-modal';
const CONTAINER_ID = 'lyrics-lines-container';
const TITLE_ID = 'lyrics-modal-title';
const ARTIST_ID = 'lyrics-modal-artist';
const CLOSE_BTN_ID = 'btn-lyrics-close';

let _currentLines = [];
let _activeIndex = -1;

/**
 * Open the lyrics modal and display content.
 * @param {Object} track  - {title, artist}
 * @param {Array}  lines  - Array of {time, text} from lyricsService.parseLrc(), or null for plain text
 * @param {string} plain  - Fallback plain text if no LRC lines
 */
export function openLyricsModal(track, lines = [], plain = '') {
  const modal = document.getElementById(MODAL_ID);
  const container = document.getElementById(CONTAINER_ID);
  const titleEl = document.getElementById(TITLE_ID);
  const artistEl = document.getElementById(ARTIST_ID);
  if (!modal || !container) return;

  if (titleEl) titleEl.textContent = track?.title || '—';
  if (artistEl) artistEl.textContent = track?.artist || '—';

  _currentLines = lines;
  _activeIndex = -1;
  container.innerHTML = '';

  if (lines && lines.length > 0) {
    lines.forEach((line, i) => {
      const p = document.createElement('p');
      p.className = 'lyrics-line text-center text-gray-400 font-silkscreen text-sm py-1.5 transition-all duration-300 cursor-default';
      p.dataset.index = i;
      p.textContent = line.text;
      container.appendChild(p);
    });
  } else {
    const p = document.createElement('p');
    p.className = 'text-center text-gray-400 font-silkscreen text-sm whitespace-pre-line';
    p.textContent = plain || 'Không tìm thấy lời bài hát.';
    container.appendChild(p);
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

/**
 * Close the lyrics modal.
 */
export function closeLyricsModal() {
  const modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  _currentLines = [];
  _activeIndex = -1;
}

/**
 * Sync lyrics highlight to the given playback time.
 * Call this from the player's 1-second tick.
 * @param {number} currentTime  - playback time in seconds
 */
export function syncLyrics(currentTime) {
  if (!_currentLines || _currentLines.length === 0) return;
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;

  let newIndex = -1;
  for (let i = _currentLines.length - 1; i >= 0; i--) {
    if (currentTime >= _currentLines[i].time) {
      newIndex = i;
      break;
    }
  }

  if (newIndex === _activeIndex) return;
  _activeIndex = newIndex;

  const lines = container.querySelectorAll('.lyrics-line');
  lines.forEach((el, i) => {
    if (i === newIndex) {
      el.classList.add('text-white', 'text-base', 'scale-105');
      el.classList.remove('text-gray-400', 'text-sm');
      // Scroll into view
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      el.classList.remove('text-white', 'text-base', 'scale-105');
      el.classList.add('text-gray-400', 'text-sm');
    }
  });
}

/**
 * Bind the close button (call once on DOMContentLoaded).
 */
export function bindLyricsModalClose() {
  const btn = document.getElementById(CLOSE_BTN_ID);
  if (btn) btn.addEventListener('click', closeLyricsModal);

  // Also close on backdrop click
  const modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLyricsModal();
    });
  }
}
