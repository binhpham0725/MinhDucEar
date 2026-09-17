/**
 * MinhDucEar - Auth Service (hluv-magazine-architecture standard)
 */

import { postForm, fetchJson } from './api.js';
import { API_ENDPOINTS } from '../config/constants.js';
import { Storage } from '../utils/storage.js';
import { STORAGE_KEYS } from '../config/constants.js';

const BASE = API_ENDPOINTS.AUTH;

export const authService = {
  /**
   * Get current user from local storage
   */
  getCurrentUser() {
    return Storage.get(STORAGE_KEYS.USER, null);
  },

  /**
   * Persist user to local storage after login
   */
  setCurrentUser(user) {
    Storage.set(STORAGE_KEYS.USER, user);
  },

  /**
   * Clear user session
   */
  clearSession() {
    Storage.remove(STORAGE_KEYS.USER);
    Storage.remove(STORAGE_KEYS.TOKEN);
  },

  /**
   * Login with email/password
   */
  async login(email, password) {
    const data = await postForm(BASE, { action: 'login', email, password });
    if (data?.success && data?.user) {
      this.setCurrentUser(data.user);
    }
    return data;
  },

  /**
   * Register new account
   */
  async register(username, email, password) {
    return postForm(BASE, { action: 'register', username, email, password });
  },

  /**
   * Logout
   */
  async logout(userId) {
    const data = await postForm(BASE, { action: 'logout', user_id: userId });
    this.clearSession();
    return data;
  },

  /**
   * Sync Google account data
   */
  async syncGoogle(googleUserData) {
    const data = await postForm(BASE, {
      action: 'google_sync',
      google_id: googleUserData.sub || googleUserData.id,
      email: googleUserData.email,
      display_name: googleUserData.name,
      avatar_url: googleUserData.picture || ''
    });
    if (data?.success && data?.user) {
      this.setCurrentUser(data.user);
    }
    return data;
  },

  /**
   * Update profile (display name / avatar)
   */
  async updateProfile(userId, updates) {
    return postForm(BASE, { action: 'update_profile', user_id: userId, ...updates });
  },

  /**
   * Get public user profile
   */
  async getProfile(userId) {
    return fetchJson(`${BASE}?action=profile&user_id=${encodeURIComponent(userId)}`);
  }
};
