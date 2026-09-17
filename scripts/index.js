/**
 * MinhDucEar - Index Page Controller (scripts/index.js)
 * (hluv-magazine-architecture standard)
 *
 * This module is the single entry point for the Player SPA.
 * It orchestrates: theme init, user session restore, component binding, view routing,
 * and delegates all data access to the services layer.
 *
 * Usage: loaded by index.php as <script type="module" src="scripts/index.js">
 * (The current monolithic player.js in assets/js/ remains in use as-is during the
 * migration period. This file marks the architecture-layer entry point for future
 * refactoring toward a fully modular ES-module player.)
 */

// ─── Imports ───────────────────────────────────────────────────────────────────
import { STORAGE_KEYS, PLAYER_CONFIG } from '../config/constants.js';
import { Storage } from '../utils/storage.js';
import { debounce } from '../utils/helpers.js';
import { authService } from '../services/authService.js';
import { trackService } from '../services/trackService.js';
import { albumService } from '../services/albumService.js';
import { playlistService } from '../services/playlistService.js';
import { statsService } from '../services/statsService.js';
import { lyricsService } from '../services/lyricsService.js';
import { showToast } from '../components/toast.js';
import { bindLyricsModalClose } from '../components/lyricsModal.js';

import { firebaseService } from '../services/firebaseService.js';

// ─── Bootstrap ─────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  // 1. Initialize Google Firebase
  try {
    const isReady = await firebaseService.init();
    if (isReady) {
      console.info('[MinhDucEar] Google Firebase Cloud Firestore & Auth initialized.');
      window.__firebaseService = firebaseService;
      const playerInst = window.player || window.minhDucPlayer || window.audioEngine;
      if (playerInst && typeof playerInst.onFirebaseReady === 'function') {
        playerInst.onFirebaseReady();
      }
    }
  } catch (err) {
    console.warn('[MinhDucEar] Firebase initialization notice:', err);
  }

  // 2. Restore user session from storage
  const user = authService.getCurrentUser();

  // 3. Bind lyrics modal close behaviour
  bindLyricsModalClose();

  console.info('[MinhDucEar] index.js controller loaded. User:', user?.username || 'guest');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
