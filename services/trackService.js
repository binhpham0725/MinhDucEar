/**
 * MinhDucEar - Track Service (hluv-magazine-architecture standard)
 * All track/search/stream data access goes through this module.
 */

import { fetchJson, postForm } from './api.js';
import { API_ENDPOINTS } from '../config/constants.js';

const BASE = API_ENDPOINTS.TRACKS;

export const trackService = {
  /**
   * Load explore tracks (trending / recommended)
   */
  async getExploreTracks({ page = 1, category = 'all', userId = null } = {}) {
    const params = new URLSearchParams({ action: 'explore', page, category });
    if (userId) params.append('user_id', userId);
    return fetchJson(`${BASE}?${params}`);
  },

  /**
   * Search tracks by query and category
   */
  async search(query, { category = 'all', page = 1, userId = null } = {}) {
    const params = new URLSearchParams({ action: 'search', q: query, category, page });
    if (userId) params.append('user_id', userId);
    return fetchJson(`${BASE}?${params}`);
  },

  /**
   * Get stream URL for a track (YouTube or database)
   */
  async getStreamUrl(trackId) {
    const data = await fetchJson(`${API_ENDPOINTS.STREAM}?id=${encodeURIComponent(trackId)}`);
    return data?.url || null;
  },

  /**
   * Get track details by ID
   */
  async getById(trackId) {
    return fetchJson(`${BASE}?action=get&id=${encodeURIComponent(trackId)}`);
  },

  /**
   * Increment track play count
   */
  async incrementPlay(trackId) {
    return postForm(BASE, { action: 'increment_play', track_id: trackId });
  }
};
