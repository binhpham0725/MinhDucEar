/**
 * MinhDucEar - Helper Utilities (hluv-magazine-architecture standard)
 */

/**
 * Format seconds → MM:SS or H:MM:SS
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
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
 * Debounce a function
 */
export function debounce(fn, delay = 350) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Sanitize a string for safe HTML display
 */
export function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

/**
 * Format a listening duration in seconds to a human-readable string
 * e.g., 3665 → "1 giờ 1 phút"
 */
export function formatListeningDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 phút';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
}

/**
 * Parse LRC timestamp "mm:ss.xx" → seconds (float)
 */
export function parseLrcTime(timeStr) {
  const match = timeStr.match(/^(\d+):(\d+)(?:\.(\d+))?$/);
  if (!match) return 0;
  const m = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const ms = match[3] ? parseInt(match[3].substring(0, 3).padEnd(3, '0'), 10) : 0;
  return m * 60 + s + ms / 1000;
}

/**
 * Resolve an API relative path to an absolute URL
 * (handles LiveServer port 5500 and file:// protocols)
 */
export function resolveApiUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (window.location.port === '5500' || window.location.protocol === 'file:') {
    return 'http://localhost/MinhDucEar/' + path.replace(/^\//, '');
  }
  return path;
}

/**
 * Generate a random ID string
 */
export function randomId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}
