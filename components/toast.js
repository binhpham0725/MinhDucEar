/**
 * MinhDucEar - Toast Component (hluv-magazine-architecture standard)
 * Retro pixel-style notification system.
 */

let _container = null;

function getContainer() {
  if (!_container) {
    _container = document.getElementById('toast-container');
  }
  return _container;
}

/**
 * Show a toast message.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration - ms before auto-dismiss (0 = permanent)
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = getContainer();
  if (!container) return;

  const colorMap = {
    success: 'bg-green-600/90 border-green-400',
    error: 'bg-red-600/90 border-red-400',
    warning: 'bg-yellow-600/90 border-yellow-400',
    info: 'bg-violet-700/90 border-violet-400'
  };
  const iconMap = {
    success: '✔',
    error: '✖',
    warning: '⚠',
    info: '♪'
  };

  const colors = colorMap[type] || colorMap.info;
  const icon = iconMap[type] || iconMap.info;

  const el = document.createElement('div');
  el.className = `flex items-center gap-2 px-4 py-2.5 rounded-lg border backdrop-blur-sm text-white font-pixel text-[10px] shadow-2xl transition-all duration-300 opacity-0 translate-y-2 ${colors}`;
  el.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    el.classList.remove('opacity-0', 'translate-y-2');
    el.classList.add('opacity-100', 'translate-y-0');
  });

  if (duration > 0) {
    setTimeout(() => dismissToast(el), duration);
  }

  return el;
}

function dismissToast(el) {
  el.classList.add('opacity-0', 'translate-y-2');
  setTimeout(() => el.remove(), 300);
}
