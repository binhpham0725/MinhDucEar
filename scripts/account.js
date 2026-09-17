/**
 * MinhDucEar - Account Page Controller (scripts/account.js)
 * (hluv-magazine-architecture standard)
 *
 * Orchestrates the Account page: loads profile, handles sync actions, updates UI.
 * All data access is routed through authService and statsService.
 */

import { authService } from '../services/authService.js';
import { statsService } from '../services/statsService.js';
import { showToast } from '../components/toast.js';
import { formatListeningDuration } from '../utils/helpers.js';
import { MESSAGES } from '../config/messages.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = authService.getCurrentUser();

  if (!user) {
    // Not logged in – handled by account.php server-side redirect or inline message
    return;
  }

  // Load listening stats and populate the stats cards
  const stats = await statsService.getStats(user.id);
  if (stats) {
    const lifetimeEl = document.getElementById('stat-lifetime-listening');
    const weeklyEl = document.getElementById('stat-weekly-listening');
    if (lifetimeEl) lifetimeEl.textContent = formatListeningDuration(stats.lifetime_seconds || 0);
    if (weeklyEl) weeklyEl.textContent = formatListeningDuration(stats.weekly_seconds || 0);
  }

  console.info('[MinhDucEar] account.js controller loaded. User:', user.username);
});
