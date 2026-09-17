/**
 * MinhDucEar - Storage Utility (hluv-magazine-architecture standard)
 */

import { STORAGE_KEYS } from '../config/constants.js';

export const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[Storage] Error reading ${key}:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[Storage] Error writing ${key}:`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[Storage] Error removing ${key}:`, e);
      return false;
    }
  },

  getRaw(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  setRaw(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  // User-isolated key helpers
  getCurrentUser() {
    return this.get(STORAGE_KEYS.USER, null);
  },

  getFavTracksKey(user = null) {
    const u = user || this.getCurrentUser();
    return u && u.id ? `minhduc_fav_tracks_user_${u.id}` : STORAGE_KEYS.FAV_TRACKS_GUEST;
  },

  getFavAlbumsKey(user = null) {
    const u = user || this.getCurrentUser();
    return u && u.id ? `minhduc_fav_albums_user_${u.id}` : STORAGE_KEYS.FAV_ALBUMS_GUEST;
  },

  getHistoryKey(user = null) {
    const u = user || this.getCurrentUser();
    return u && u.id ? `minhduc_history_user_${u.id}` : STORAGE_KEYS.HISTORY_GUEST;
  }
};
