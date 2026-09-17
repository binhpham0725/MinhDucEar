/**
 * MinhDucEar - Application Constants (hluv-magazine-architecture standard)
 */

export const API_ENDPOINTS = {
  TRACKS: 'api/endpoints/tracks.php',
  PLAYLISTS: 'api/endpoints/playlists.php',
  STATS: 'api/endpoints/stats.php',
  AUTH: 'api/endpoints/auth.php',
  LYRICS: 'api/endpoints/lyrics.php',
  STREAM: 'api/endpoints/stream.php'
};

export const STORAGE_KEYS = {
  THEME: 'minhduc_theme',
  VOLUME: 'minhduc_volume',
  USER: 'minhduc_user',
  TOKEN: 'minhduc_auth_token',
  CURRENT_TRACK: 'minhduc_current_track',
  QUEUE: 'minhduc_queue',
  REPEAT_MODE: 'minhduc_repeat_mode',
  SHUFFLE_MODE: 'minhduc_shuffle_mode',
  FAV_TRACKS_GUEST: 'minhduc_fav_tracks_guest',
  FAV_ALBUMS_GUEST: 'minhduc_fav_albums_guest',
  HISTORY_GUEST: 'minhduc_history_guest'
};

export const PLAYER_CONFIG = {
  DEFAULT_VOLUME: 0.8,
  PING_INTERVAL_MS: 10000,
  AUTO_PLAY_NEXT: true,
  SEARCH_DEBOUNCE_MS: 350
};

export const VIEWS = {
  EXPLORE: 'view-explore',
  SEARCH: 'view-search',
  ALBUMS: 'view-albums',
  FAVORITES: 'view-favorites',
  HISTORY: 'view-history',
  PLAYLISTS: 'view-playlists',
  ARTISTS: 'view-artists',
  ACCOUNT: 'view-account'
};
