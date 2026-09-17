/**
 * MinhDucEar - Album Service (hluv-magazine-architecture standard)
 */

import { fetchJson, postForm } from './api.js';
import { API_ENDPOINTS } from '../config/constants.js';

const BASE = API_ENDPOINTS.TRACKS;
const PLAYLISTS = API_ENDPOINTS.PLAYLISTS;

export const albumService = {
  /**
   * Get paginated album list
   */
  async getAlbums({ page = 1, userId = null } = {}) {
    const params = new URLSearchParams({ action: 'albums', page });
    if (userId) params.append('user_id', userId);
    return fetchJson(`${BASE}?${params}`);
  },

  /**
   * Get album detail with track list
   */
  async getAlbumDetail(albumId, { userId = null } = {}) {
    const params = new URLSearchParams({ action: 'album_detail', album_id: albumId });
    if (userId) params.append('user_id', userId);
    return fetchJson(`${BASE}?${params}`);
  },

  /**
   * Get user's favorite albums list
   */
  async getFavoriteAlbums(userId) {
    const params = new URLSearchParams({ action: 'favorite_albums_list', user_id: userId });
    return fetchJson(`${PLAYLISTS}?${params}`);
  },

  /**
   * Toggle favorite status of an album
   */
  async toggleFavorite(albumId, userId) {
    return postForm(PLAYLISTS, {
      action: 'album_favorite_toggle',
      album_id: albumId,
      user_id: userId
    });
  }
};
