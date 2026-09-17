/**
 * MinhDucEar - Validators (hluv-magazine-architecture standard)
 */

export const Validators = {
  /**
   * Check if email is valid
   */
  isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  },

  /**
   * Check password strength (min 6 chars)
   */
  isPasswordValid(value) {
    return typeof value === 'string' && value.length >= 6;
  },

  /**
   * Check that a required text field is not empty
   */
  isRequired(value) {
    return String(value ?? '').trim().length > 0;
  },

  /**
   * Validate search query (not empty, min 1 char)
   */
  isSearchQuery(value) {
    return typeof value === 'string' && value.trim().length >= 1;
  },

  /**
   * Check playlist name validity (1-80 chars)
   */
  isPlaylistName(value) {
    const s = String(value ?? '').trim();
    return s.length >= 1 && s.length <= 80;
  },

  /**
   * Validate a YouTube video ID format (11 chars, alphanumeric + dash + underscore)
   */
  isYoutubeId(value) {
    return /^[a-zA-Z0-9_-]{11}$/.test(String(value ?? ''));
  }
};
