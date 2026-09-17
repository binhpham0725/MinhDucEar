/**
 * MinhDucEar - Stats Service (hluv-magazine-architecture standard)
 * Handles listening time heartbeat pings and retrieval of statistics.
 */

import { fetchJson, postForm } from './api.js';
import { API_ENDPOINTS } from '../config/constants.js';

const BASE = API_ENDPOINTS.STATS;

export const statsService = {
  /**
   * Flush accumulated listening seconds to the server
   */
  async flushListeningTime(userId, seconds, trackId = null) {
    if (!userId || !seconds || seconds <= 0) return null;
    const body = { action: 'ping', user_id: userId, seconds };
    if (trackId) body.track_id = trackId;
    return postForm(BASE, body);
  },

  /**
   * Load user statistics (lifetime, weekly, daily breakdown)
   */
  async getStats(userId) {
    return fetchJson(`${BASE}?action=get&user_id=${encodeURIComponent(userId)}`);
  },

  /**
   * Get 7-day listening chart data
   */
  async getWeeklyChart(userId) {
    return fetchJson(`${BASE}?action=weekly&user_id=${encodeURIComponent(userId)}`);
  }
};
