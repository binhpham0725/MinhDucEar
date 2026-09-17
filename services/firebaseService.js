/**
 * MinhDucEar - Google Firebase Service
 * Handles Cloud Firestore Database & Firebase Authentication using Firebase v10 Modular SDK.
 */

import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.js';

let app = null;
let auth = null;
let db = null;
let isInitialized = false;

// Dynamic loader for Firebase Modular SDK from CDN
async function loadFirebaseModules() {
  if (isInitialized) return { app, auth, db };

  try {
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { 
      getAuth, 
      signInWithPopup, 
      signInWithRedirect,
      getRedirectResult,
      GoogleAuthProvider, 
      signInWithCredential,
      signInWithEmailAndPassword, 
      createUserWithEmailAndPassword, 
      signOut, 
      onAuthStateChanged,
      updateProfile 
    } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const { 
      getFirestore, 
      collection, 
      doc, 
      getDoc, 
      getDocs, 
      setDoc, 
      addDoc, 
      updateDoc, 
      deleteDoc, 
      query, 
      where, 
      orderBy, 
      limit,
      serverTimestamp,
      arrayUnion,
      arrayRemove 
    } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isInitialized = true;

    return {
      app,
      auth,
      db,
      authMethods: {
        signInWithPopup,
        signInWithRedirect,
        getRedirectResult,
        GoogleAuthProvider,
        signInWithCredential,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        signOut,
        onAuthStateChanged,
        updateProfile
      },
      firestoreMethods: {
        collection,
        doc,
        getDoc,
        getDocs,
        setDoc,
        addDoc,
        updateDoc,
        deleteDoc,
        query,
        where,
        orderBy,
        limit,
        serverTimestamp,
        arrayUnion,
        arrayRemove
      }
    };
  } catch (err) {
    console.warn('[Firebase] Failed to initialize Firebase SDK:', err);
    return null;
  }
}

class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
  }

  async init() {
    if (!isFirebaseConfigured()) {
      console.info('[Firebase] Config placeholder detected. Running in Guest/Offline mode.');
      return false;
    }
    const modules = await loadFirebaseModules();
    if (!modules) return false;

    // Listen for auth changes
    modules.authMethods.onAuthStateChanged(modules.auth, (user) => {
      this.currentUser = user;
      this.authListeners.forEach(cb => {
        try { cb(user); } catch (e) { console.error(e); }
      });
    });

    // Handle redirect result (from signInWithRedirect on mobile/blocked popup)
    try {
      const redirectResult = await modules.authMethods.getRedirectResult(modules.auth);
      if (redirectResult && redirectResult.user) {
        await this.saveUserProfile(redirectResult.user);
        console.info('[Firebase] Redirect sign-in success:', redirectResult.user.email);
      }
    } catch (redirectErr) {
      console.warn('[Firebase] getRedirectResult error:', redirectErr.code);
    }

    return true;
  }

  onAuthChange(callback) {
    this.authListeners.push(callback);
    if (this.currentUser !== null) {
      callback(this.currentUser);
    }
  }

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async signInWithGoogle() {
    const modules = await loadFirebaseModules();
    if (!modules) throw new Error('Firebase chưa sẵn sàng');
    const provider = new modules.authMethods.GoogleAuthProvider();

    // On mobile browsers, skip popup entirely and use redirect directly
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
      await modules.authMethods.signInWithRedirect(modules.auth, provider);
      return null;
    }

    // Desktop: try popup first, fall back to redirect on any technical failure
    try {
      const result = await modules.authMethods.signInWithPopup(modules.auth, provider);
      if (result.user) await this.saveUserProfile(result.user);
      return result.user;
    } catch (popupErr) {
      // Only rethrow if user explicitly closed/cancelled — everything else → redirect
      const userCancelledCodes = [
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request'
      ];
      if (userCancelledCodes.includes(popupErr.code)) {
        throw popupErr;
      }
      // Blocked, unsupported, unauthorized domain, etc. → use redirect
      console.warn('[Firebase] Popup failed, switching to redirect:', popupErr.code);
      await modules.authMethods.signInWithRedirect(modules.auth, provider);
      return null;
    }
  }

  async signInWithGoogleCredential(idToken) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !idToken) return null;
      const { GoogleAuthProvider, signInWithCredential } = modules.authMethods;
      if (signInWithCredential && GoogleAuthProvider && GoogleAuthProvider.credential) {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(modules.auth, credential);
        if (result && result.user) {
          this.currentUser = result.user;
          await this.saveUserProfile(result.user);
          return result.user;
        }
      }
    } catch (e) {
      console.warn('[Firebase] signInWithGoogleCredential notice:', e);
      return null;
    }
  }

  async signInWithEmail(email, password) {
    const modules = await loadFirebaseModules();
    if (!modules) throw new Error('Firebase chưa sẵn sàng');
    const result = await modules.authMethods.signInWithEmailAndPassword(modules.auth, email, password);
    return result.user;
  }

  async registerWithEmail(email, password, displayName) {
    const modules = await loadFirebaseModules();
    if (!modules) throw new Error('Firebase chưa sẵn sàng');
    const result = await modules.authMethods.createUserWithEmailAndPassword(modules.auth, email, password);
    if (displayName) {
      await modules.authMethods.updateProfile(result.user, { displayName });
    }
    await this.saveUserProfile(result.user, displayName);
    return result.user;
  }

  async signOut() {
    const modules = await loadFirebaseModules();
    if (modules) {
      await modules.authMethods.signOut(modules.auth);
    }
    this.currentUser = null;
  }

  async saveUserProfile(user, customName = '') {
    const modules = await loadFirebaseModules();
    if (!modules || !user) return;
    const { doc, setDoc, serverTimestamp } = modules.firestoreMethods;
    const uid = user.uid || (user.email ? user.email.toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'user_' + Date.now());
    const userRef = doc(modules.db, 'users', uid);
    const dName = customName || user.displayName || user.display_name || user.name || (user.email ? user.email.split('@')[0] : 'Người dùng MinhDucEar');
    const pUrl = user.photoURL || user.avatar_url || user.picture || 'assets/images/avatars/default.png';
    const isGoogle = Boolean(user.is_google || (user.providerData && user.providerData.some(p => p.providerId === 'google.com')));

    await setDoc(userRef, {
      uid: uid,
      username: user.username || (user.email ? user.email.split('@')[0] : 'audiophile'),
      email: user.email || '',
      displayName: dName,
      display_name: dName,
      name: dName,
      photoURL: pUrl,
      avatar_url: pUrl,
      role: user.role || 'AUDIOPHILE',
      is_google: isGoogle,
      google_id: user.google_id || (isGoogle ? uid : ''),
      listening_hours: Number(user.listening_hours || user.listeningHours || 0.0),
      listeningHours: Number(user.listening_hours || user.listeningHours || 0.0),
      total_listening_seconds: Number(user.total_listening_seconds || 0),
      synced_at: new Date().toLocaleString('vi-VN'),
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  }

  async getUserProfile(uid) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid) return null;
    const { doc, getDoc } = modules.firestoreMethods;
    try {
      const snap = await getDoc(doc(modules.db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.warn('[Firebase] Could not get user profile:', e);
      return null;
    }
  }

  // -------------------------------------------------------------
  // PLAYLISTS (Cloud Firestore)
  // -------------------------------------------------------------
  async getCuratedPlaylists() {
    const modules = await loadFirebaseModules();
    if (!modules) return null;
    const { collection, getDocs } = modules.firestoreMethods;
    try {
      const snap = await getDocs(collection(modules.db, 'curated_playlists'));
      if (snap.empty) return null;
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[Firebase] Could not fetch curated playlists:', e);
      return null;
    }
  }

  async getUserPlaylists(uid) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid) return [];
    const { collection, getDocs, query, orderBy } = modules.firestoreMethods;
    try {
      const q = query(collection(modules.db, `users/${uid}/playlists`), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[Firebase] Could not fetch user playlists:', e);
      return [];
    }
  }

  async createPlaylist(uid, { name, description = '', coverUrl = '', tracks = [] }) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid) throw new Error('Yêu cầu đăng nhập để tạo playlist trên Cloud');
    const { collection, addDoc, serverTimestamp } = modules.firestoreMethods;
    const docRef = await addDoc(collection(modules.db, `users/${uid}/playlists`), {
      name,
      description,
      coverUrl: coverUrl || 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
      tracks,
      tracksCount: tracks.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, name, description, coverUrl, tracks, tracksCount: tracks.length };
  }

  async deletePlaylist(uid, playlistId) {
    const modules = await loadFirebaseModules();
    if (!modules || !playlistId) return false;
    const { doc, deleteDoc } = modules.firestoreMethods;
    const cleanUid = uid ? String(uid).replace(/[\/\.]/g, '_') : '';
    const plIdStr = String(playlistId);

    const deletePromises = [
      deleteDoc(doc(modules.db, 'playlists', plIdStr)).catch(() => {}),
      deleteDoc(doc(modules.db, 'playlists', 'pl_' + plIdStr)).catch(() => {})
    ];

    if (cleanUid) {
      deletePromises.push(deleteDoc(doc(modules.db, `users/${cleanUid}/playlists`, plIdStr)).catch(() => {}));
    }

    await Promise.all(deletePromises);
    return true;
  }

  async addTrackToPlaylist(uid, playlistId, track) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid) return false;
    const { doc, updateDoc, arrayUnion, serverTimestamp } = modules.firestoreMethods;
    const plRef = doc(modules.db, `users/${uid}/playlists`, playlistId);
    await updateDoc(plRef, {
      tracks: arrayUnion(track),
      updatedAt: serverTimestamp()
    });
    return true;
  }

  // -------------------------------------------------------------
  // FAVORITES (Cloud Firestore)
  // -------------------------------------------------------------
  async getFavorites(uid) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !uid) return [];
      const cleanUid = String(uid).replace(/[\/\.]/g, '_');
      const { collection, getDocs, query, orderBy } = modules.firestoreMethods;
      let snap;
      try {
        const q = query(collection(modules.db, `users/${cleanUid}/favorites`), orderBy('addedAt', 'desc'));
        snap = await getDocs(q);
      } catch (orderErr) {
        // Fallback without orderBy if composite index is not yet built
        snap = await getDocs(collection(modules.db, `users/${cleanUid}/favorites`));
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[Firebase] Could not fetch favorites:', e);
      return [];
    }
  }

  async removeFavorite(uid, track) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !uid || !track) return false;
      const cleanUid = String(uid).replace(/[\/\.]/g, '_');
      const { collection, getDocs, deleteDoc } = modules.firestoreMethods;

      const ytId = (track.youtube_id || (typeof track.id === 'string' && track.id.startsWith('yt_') ? track.id.substring(3) : '')).trim().toLowerCase();
      const rawTitle = (track.title || '').trim().toLowerCase();
      const trkId = String(track.id || track.db_id || '').trim().toLowerCase();

      const uidsToClear = [cleanUid];
      if (cleanUid.includes('hirasakai0725')) {
        uidsToClear.push('goog_115424860304779353235', '6400');
      }

      for (const targetUid of uidsToClear) {
        try {
          const snap = await getDocs(collection(modules.db, `users/${targetUid}/favorites`));
          const deletes = [];
          snap.docs.forEach(d => {
            const data = d.data();
            const docIdLower = d.id.toLowerCase();
            const docYtId = String(data.youtube_id || '').trim().toLowerCase();
            const docTitle = String(data.title || '').trim().toLowerCase();
            const docTrkId = String(data.id || data.db_id || '').trim().toLowerCase();

            const matches = 
              (ytId && (docYtId === ytId || docIdLower === ytId || docIdLower === 'yt_' + ytId)) ||
              (rawTitle && docTitle === rawTitle) ||
              (trkId && (docTrkId === trkId || docIdLower === trkId));

            if (matches) {
              deletes.push(deleteDoc(d.ref));
            }
          });
          await Promise.all(deletes);
        } catch (_) {}
      }
      return { success: true, isFavorite: false };
    } catch (e) {
      console.warn('[Firebase] removeFavorite error:', e);
      return false;
    }
  }

  async toggleFavorite(uid, track) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !uid || !track) return false;
      const cleanUid = String(uid).replace(/[\/\.]/g, '_');
      const { collection, doc, getDocs, setDoc, serverTimestamp } = modules.firestoreMethods;

      const ytId = (track.youtube_id || (typeof track.id === 'string' && track.id.startsWith('yt_') ? track.id.substring(3) : '')).trim().toLowerCase();
      const rawTitle = (track.title || '').trim().toLowerCase();

      // Check if it already exists
      const snap = await getDocs(collection(modules.db, `users/${cleanUid}/favorites`));
      let alreadyFavorited = false;
      snap.docs.forEach(d => {
        const data = d.data();
        const docYtId = String(data.youtube_id || '').trim().toLowerCase();
        const docTitle = String(data.title || '').trim().toLowerCase();
        const docIdLower = d.id.toLowerCase();
        if ((ytId && (docYtId === ytId || docIdLower === ytId)) || (rawTitle && docTitle === rawTitle)) {
          alreadyFavorited = true;
        }
      });

      if (alreadyFavorited) {
        await this.removeFavorite(uid, track);
        return { isFavorite: false };
      } else {
        const rawKey = track.youtube_id || track.id || ('track_' + Date.now());
        const trackKey = String(rawKey).replace(/[\/\.]/g, '_');
        const favRef = doc(modules.db, `users/${cleanUid}/favorites`, trackKey);
        const payload = {
          id: track.id || track.db_id || ('yt_' + (track.youtube_id || '')),
          db_id: track.db_id || track.id || null,
          youtube_id: track.youtube_id || '',
          title: track.title || 'Unknown Title',
          artist: track.artist || 'Unknown Artist',
          cover_url: track.cover_url || track.cover || '',
          duration: track.duration || 210,
          format: track.format || 'YT AUDIO 320k',
          addedAt: serverTimestamp()
        };
        await setDoc(favRef, payload);
        return { isFavorite: true };
      }
    } catch (err) {
      console.warn('[Firebase] toggleFavorite error:', err);
      return false;
    }
  }

  async saveFavorite(uid, track) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !uid || !track) return false;
      const cleanUid = String(uid).replace(/[\/\.]/g, '_');
      const rawKey = track.youtube_id || track.id || ('track_' + Date.now());
      const trackKey = String(rawKey).replace(/[\/\.]/g, '_');
      const { doc, setDoc, serverTimestamp } = modules.firestoreMethods;
      const favRef = doc(modules.db, `users/${cleanUid}/favorites`, trackKey);
      const payload = {
        id: track.id || track.db_id || ('yt_' + track.youtube_id),
        db_id: track.db_id || track.id || null,
        youtube_id: track.youtube_id || '',
        title: track.title || 'Unknown Title',
        artist: track.artist || 'Unknown Artist',
        cover_url: track.cover_url || track.cover || '',
        duration: track.duration || 210,
        format: track.format || 'YT AUDIO 320k',
        addedAt: serverTimestamp()
      };
      await setDoc(favRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.warn('[Firebase] saveFavorite error:', err);
      return false;
    }
  }

  // -------------------------------------------------------------
  // LISTENING HISTORY (Cloud Firestore)
  // -------------------------------------------------------------
  async recordHistory(uid, track, durationPlayed = 0) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !uid || !track) return;
      const cleanUid = String(uid).replace(/[\/\.]/g, '_');
      const { collection, addDoc, serverTimestamp } = modules.firestoreMethods;
      const cleanTrack = {
        id: track.id || track.db_id || ('yt_' + track.youtube_id),
        db_id: track.db_id || track.id || null,
        youtube_id: track.youtube_id || '',
        title: track.title || 'Unknown Title',
        artist: track.artist || 'Unknown Artist',
        cover_url: track.cover_url || track.cover || '',
        duration: track.duration || 210,
        format: track.format || 'YT 320k'
      };
      await addDoc(collection(modules.db, `users/${cleanUid}/history`), {
        track: cleanTrack,
        durationPlayed,
        playedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[Firebase] Could not record history:', e);
    }
  }

  async getHistory(uid, maxLimit = 50) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !uid) return [];
      const cleanUid = String(uid).replace(/[\/\.]/g, '_');
      const { collection, getDocs, query, orderBy, limit } = modules.firestoreMethods;
      let snap;
      try {
        const q = query(collection(modules.db, `users/${cleanUid}/history`), orderBy('playedAt', 'desc'), limit(maxLimit));
        snap = await getDocs(q);
      } catch (orderErr) {
        snap = await getDocs(collection(modules.db, `users/${cleanUid}/history`));
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[Firebase] Could not fetch history:', e);
      return [];
    }
  }

  async clearHistory(uid) {
    try {
      const modules = await loadFirebaseModules();
      if (!modules || !uid) return false;
      const cleanUid = String(uid).replace(/[\/\.]/g, '_');
      const { collection, getDocs, deleteDoc } = modules.firestoreMethods;

      const uidsToClear = [cleanUid];
      if (cleanUid.includes('hirasakai0725')) {
        uidsToClear.push('goog_115424860304779353235', '6400');
      }

      for (const targetUid of uidsToClear) {
        try {
          const snap = await getDocs(collection(modules.db, `users/${targetUid}/history`));
          const deletes = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletes);
        } catch (_) {}
      }
      return true;
    } catch (e) {
      console.warn('[Firebase] clearHistory error:', e);
      return false;
    }
  }

  // -------------------------------------------------------------
  // MUSIC TASTE
  // -------------------------------------------------------------
  async saveTaste(uid, genreData) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid) return;
    const { doc, setDoc, serverTimestamp } = modules.firestoreMethods;
    try {
      await setDoc(doc(modules.db, `users/${uid}/taste`, 'profile'), {
        genres: genreData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firebase] Could not save taste:', e);
    }
  }

  async getTaste(uid) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid) return null;
    const { doc, getDoc } = modules.firestoreMethods;
    try {
      const snap = await getDoc(doc(modules.db, `users/${uid}/taste`, 'profile'));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      return null;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
