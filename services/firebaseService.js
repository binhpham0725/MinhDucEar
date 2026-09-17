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
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { 
      getAuth, 
      signInWithPopup, 
      GoogleAuthProvider, 
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

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isInitialized = true;

    return {
      app,
      auth,
      db,
      authMethods: {
        signInWithPopup,
        GoogleAuthProvider,
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
    const result = await modules.authMethods.signInWithPopup(modules.auth, provider);
    
    // Sync/upsert user document in Firestore
    if (result.user) {
      await this.saveUserProfile(result.user);
    }
    return result.user;
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
    const userRef = doc(modules.db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: customName || user.displayName || 'Người dùng MinhDucEar',
      photoURL: user.photoURL || '',
      lastLoginAt: serverTimestamp()
    }, { merge: true });
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
    if (!modules || !uid) return false;
    const { doc, deleteDoc } = modules.firestoreMethods;
    await deleteDoc(doc(modules.db, `users/${uid}/playlists`, playlistId));
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
    const modules = await loadFirebaseModules();
    if (!modules || !uid) return [];
    const { collection, getDocs, query, orderBy } = modules.firestoreMethods;
    try {
      const q = query(collection(modules.db, `users/${uid}/favorites`), orderBy('addedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[Firebase] Could not fetch favorites:', e);
      return [];
    }
  }

  async toggleFavorite(uid, track) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid || !track) return false;
    const trackKey = track.youtube_id || track.id;
    const { doc, getDoc, setDoc, deleteDoc, serverTimestamp } = modules.firestoreMethods;
    const favRef = doc(modules.db, `users/${uid}/favorites`, String(trackKey));
    const snap = await getDoc(favRef);
    if (snap.exists()) {
      await deleteDoc(favRef);
      return { isFavorite: false };
    } else {
      await setDoc(favRef, {
        ...track,
        addedAt: serverTimestamp()
      });
      return { isFavorite: true };
    }
  }

  // -------------------------------------------------------------
  // LISTENING HISTORY (Cloud Firestore)
  // -------------------------------------------------------------
  async recordHistory(uid, track, durationPlayed = 0) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid || !track) return;
    const { collection, addDoc, serverTimestamp } = modules.firestoreMethods;
    try {
      await addDoc(collection(modules.db, `users/${uid}/history`), {
        track,
        durationPlayed,
        playedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[Firebase] Could not record history:', e);
    }
  }

  async getHistory(uid, maxLimit = 50) {
    const modules = await loadFirebaseModules();
    if (!modules || !uid) return [];
    const { collection, getDocs, query, orderBy, limit } = modules.firestoreMethods;
    try {
      const q = query(collection(modules.db, `users/${uid}/history`), orderBy('playedAt', 'desc'), limit(maxLimit));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[Firebase] Could not fetch history:', e);
      return [];
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
