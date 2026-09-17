/**
 * MinhDucEar - Playlist Service (hluv-magazine-architecture standard)
 */

import { fetchJson, postForm } from './api.js';
import { API_ENDPOINTS } from '../config/constants.js';

const BASE = API_ENDPOINTS.PLAYLISTS;

export const playlistService = {
  /**
   * Get all playlists for a user
   */
  async getPlaylists(userId) {
    return fetchJson(`${BASE}?action=list&user_id=${encodeURIComponent(userId)}`);
  },

  /**
   * Get single playlist with tracks
   */
  async getPlaylistDetail(playlistId, userId) {
    return fetchJson(`${BASE}?action=get&playlist_id=${playlistId}&user_id=${encodeURIComponent(userId)}`);
  },

  /**
   * Create a new playlist
   */
  async createPlaylist(name, userId) {
    return postForm(BASE, { action: 'create', name, user_id: userId });
  },

  /**
   * Delete a playlist
   */
  async deletePlaylist(playlistId, userId) {
    return postForm(BASE, { action: 'delete', playlist_id: playlistId, user_id: userId });
  },

  /**
   * Add a track to a playlist
   */
  async addTrack(playlistId, track, userId) {
    return postForm(BASE, {
      action: 'add_track',
      playlist_id: playlistId,
      user_id: userId,
      track_id: track.id,
      youtube_id: track.youtube_id || '',
      title: track.title,
      artist: track.artist,
      cover_url: track.cover || track.cover_url || ''
    });
  },

  /**
   * Remove a track from a playlist
   */
  async removeTrack(playlistId, trackId, userId) {
    return postForm(BASE, {
      action: 'remove_track',
      playlist_id: playlistId,
      track_id: trackId,
      user_id: userId
    });
  },

  /**
   * Get user's favorite tracks list
   */
  async getFavoriteTracks(userId) {
    return fetchJson(`${BASE}?action=favorites&user_id=${encodeURIComponent(userId)}`);
  },

  /**
   * Toggle favorite status of a track
   */
  async toggleFavoriteTrack(trackId, userId) {
    return postForm(BASE, { action: 'favorite_toggle', track_id: trackId, user_id: userId });
  },

  /**
   * Get user's listening history
   */
  async getHistory(userId, { limit = 50 } = {}) {
    return fetchJson(`${BASE}?action=history&user_id=${encodeURIComponent(userId)}&limit=${limit}`);
  },

  /**
   * Record a track to history
   */
  async recordHistory(track, userId) {
    return postForm(BASE, {
      action: 'record_history',
      user_id: userId,
      track_id: track.id,
      youtube_id: track.youtube_id || '',
      title: track.title,
      artist: track.artist,
      cover_url: track.cover || track.cover_url || ''
    });
  }
};
