/**
 * MinhDucEar - Lyrics Service (hluv-magazine-architecture standard)
 */

import { fetchJson } from './api.js';
import { API_ENDPOINTS } from '../config/constants.js';
import { parseLrcTime } from '../utils/helpers.js';

const BASE = API_ENDPOINTS.LYRICS;

export const lyricsService = {
  /**
   * Fetch raw lyrics for a track
   * Returns { lyrics, type } where type is 'lrc' or 'plain'
   */
  async getLyrics(trackId, { title = '', artist = '' } = {}) {
    const params = new URLSearchParams({ action: 'get', track_id: trackId });
    if (title) params.append('title', title);
    if (artist) params.append('artist', artist);
    return fetchJson(`${BASE}?${params}`);
  },

  /**
   * Parse an LRC string into an array of { time, text } objects
   * sorted by ascending time.
   */
  parseLrc(lrcString) {
    const lines = [];
    const regex = /\[(\d+:\d+(?:\.\d+)?)\](.*)/g;
    let match;
    while ((match = regex.exec(lrcString)) !== null) {
      const time = parseLrcTime(match[1]);
      const text = match[2].trim();
      if (text) lines.push({ time, text });
    }
    return lines.sort((a, b) => a.time - b.time);
  }
};
