/**
 * MinhDucEar - Vercel Serverless Function: Playlists & Favorites API
 * Powered by Google Cloud Firestore (minhducear-f055d)
 * Handles favorites, playlists, and album bookmarks on Vercel
 */

const FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'minhducear-f055d',
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA_dQjex_0sZj4h2rZl4Fb0Gk_aumJ-c0'
};

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

const cacheStore = {
  favorites: new Map(),
  albums: new Map(),
  playlists: new Map()
};

function cleanId(str) {
  return String(str || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'object' && item !== null) {
              return { mapValue: { fields: toFirestoreFields(item) } };
            }
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

function fromFirestoreFields(fields = {}) {
  const obj = {};
  for (const [key, valObj] of Object.entries(fields)) {
    if ('stringValue' in valObj) obj[key] = valObj.stringValue;
    else if ('integerValue' in valObj) obj[key] = parseInt(valObj.integerValue, 10);
    else if ('doubleValue' in valObj) obj[key] = parseFloat(valObj.doubleValue);
    else if ('booleanValue' in valObj) obj[key] = valObj.booleanValue;
    else if ('nullValue' in valObj) obj[key] = null;
    else if ('timestampValue' in valObj) obj[key] = valObj.timestampValue;
    else if ('arrayValue' in valObj) {
      obj[key] = (valObj.arrayValue.values || []).map(v => {
        if ('mapValue' in v) return fromFirestoreFields(v.mapValue.fields);
        return Object.values(v)[0];
      });
    } else if ('mapValue' in valObj) {
      obj[key] = fromFirestoreFields(valObj.mapValue.fields || {});
    }
  }
  return obj;
}

async function getFirestoreFavorites(uid) {
  try {
    const cleanUid = cleanId(uid);
    const url = `${FIRESTORE_BASE_URL}/users/${cleanUid}/favorites?key=${FIREBASE_CONFIG.apiKey}&pageSize=100`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.documents) return [];
    return data.documents.map(d => fromFirestoreFields(d.fields));
  } catch (e) {
    return null;
  }
}

async function saveFirestoreFavorite(uid, trackKey, trackData) {
  try {
    const cleanUid = cleanId(uid);
    const cleanKey = cleanId(trackKey);
    const url = `${FIRESTORE_BASE_URL}/users/${cleanUid}/favorites/${cleanKey}?key=${FIREBASE_CONFIG.apiKey}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(trackData) })
    });
  } catch (e) {}
}

async function deleteFirestoreFavorite(uid, trackKey) {
  try {
    const cleanUid = cleanId(uid);
    const cleanKey = cleanId(trackKey);
    const url = `${FIRESTORE_BASE_URL}/users/${cleanUid}/favorites/${cleanKey}?key=${FIREBASE_CONFIG.apiKey}`;
    await fetch(url, { method: 'DELETE' });
  } catch (e) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const action = url.searchParams.get('action') || req.body?.action || 'list';
  const userId = url.searchParams.get('user_id') || req.body?.user_id || 'guest';

  try {
    // -------------------------------------------------------------
    // 1. FAVORITES LIST
    // -------------------------------------------------------------
    if (action === 'favorites_list') {
      const userKey = String(userId);
      let userFavs = null;

      // Try fetching from Firestore if user is logged in
      if (userKey !== 'guest') {
        userFavs = await getFirestoreFavorites(userKey);
      }

      // Fallback to cacheStore
      if (!userFavs) {
        userFavs = cacheStore.favorites.get(userKey) || [];
      }
      userFavs = userFavs.filter(f => f && f.title && f.title !== 'Bài hát' && (f.youtube_id || (f.id && f.id !== 'yt_')));
      cacheStore.favorites.set(userKey, userFavs);

      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const paged = userFavs.slice(offset, offset + limit);

      return res.status(200).json({
        success: true,
        favorites: paged,
        total: userFavs.length,
        offset,
        limit,
        has_more: offset + limit < userFavs.length
      });
    }

    // -------------------------------------------------------------
    // 2. FAVORITE TOGGLE
    // -------------------------------------------------------------
    if (action === 'favorite_toggle') {
      let body = {};
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else if (typeof req.body === 'string') {
        try { body = JSON.parse(req.body); } catch(e) {}
      }

      const trackId = url.searchParams.get('track_id') || body.track_id || '';
      const ytId = url.searchParams.get('youtube_id') || body.youtube_id || '';
      const title = (url.searchParams.get('title') || body.title || '').trim();
      const artist = (url.searchParams.get('artist') || body.artist || 'Nghệ sĩ').trim();
      const coverUrl = url.searchParams.get('cover_url') || body.cover_url || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '');
      const duration = parseInt(url.searchParams.get('duration') || body.duration || '210', 10);

      // Validate: Reject dummy or empty tracks
      if (!ytId && (!title || title === 'Bài hát')) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin bài hát không hợp lệ'
        });
      }

      const userKey = String(userId);
      let userFavs = cacheStore.favorites.get(userKey) || [];
      if (userKey !== 'guest' && userFavs.length === 0) {
        const dbFavs = await getFirestoreFavorites(userKey);
        if (dbFavs) userFavs = dbFavs;
      }
      userFavs = userFavs.filter(f => f && f.title && f.title !== 'Bài hát' && (f.youtube_id || (f.id && f.id !== 'yt_')));

      const existIdx = userFavs.findIndex(f => (ytId && f.youtube_id && f.youtube_id === ytId) || (trackId && trackId !== 'yt_' && f.id == trackId) || (title && f.title && f.title.toLowerCase() === title.toLowerCase()));

      let isFavorite = false;
      const validTrackId = (trackId && trackId !== 'yt_') ? trackId : ('yt_' + ytId);
      const trackKey = ytId || validTrackId;

      if (existIdx > -1) {
        userFavs.splice(existIdx, 1);
        isFavorite = false;
        if (userKey !== 'guest') {
          deleteFirestoreFavorite(userKey, trackKey).catch(() => {});
        }
      } else {
        const newFav = {
          id: validTrackId,
          db_id: (trackId && trackId !== 'yt_') ? trackId : null,
          youtube_id: ytId,
          title: title || 'Bản nhạc',
          artist: artist,
          cover_url: coverUrl,
          duration,
          format: 'YT AUDIO 320k',
          created_at: new Date().toISOString()
        };
        userFavs.unshift(newFav);
        isFavorite = true;
        if (userKey !== 'guest') {
          saveFirestoreFavorite(userKey, trackKey, newFav).catch(() => {});
        }
      }

      cacheStore.favorites.set(userKey, userFavs);

      return res.status(200).json({
        success: true,
        is_favorite: isFavorite,
        track_id: validTrackId,
        message: isFavorite ? 'Đã thêm bài hát vào yêu thích!' : 'Đã xóa bài hát khỏi yêu thích!'
      });
    }

    // -------------------------------------------------------------
    // 3. FAVORITE REMOVE
    // -------------------------------------------------------------
    if (action === 'favorite_remove') {
      const body = req.body || {};
      const trackId = url.searchParams.get('track_id') || body.track_id || '';
      const ytId = url.searchParams.get('youtube_id') || body.youtube_id || '';

      const userKey = String(userId);
      let userFavs = cacheStore.favorites.get(userKey) || [];
      userFavs = userFavs.filter(f => f.id != trackId && (!ytId || f.youtube_id !== ytId));
      cacheStore.favorites.set(userKey, userFavs);

      if (userKey !== 'guest') {
        const trackKey = ytId || trackId;
        deleteFirestoreFavorite(userKey, trackKey).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        is_favorite: false,
        track_id: trackId,
        message: 'Đã xóa khỏi danh sách yêu thích!'
      });
    }

    // -------------------------------------------------------------
    // 4. ALBUM BOOKMARKS
    // -------------------------------------------------------------
    if (action === 'favorite_albums_list') {
      const userAlbums = cacheStore.albums.get(String(userId)) || [];
      return res.status(200).json({
        success: true,
        albums: userAlbums,
        total: userAlbums.length
      });
    }

    if (action === 'album_favorite_toggle') {
      const albumId = url.searchParams.get('album_id') || req.body?.album_id || '';
      const userKey = String(userId);
      let userAlbums = cacheStore.albums.get(userKey) || [];

      const idx = userAlbums.findIndex(a => a.id == albumId || a.uuid == albumId);
      let isFavorite = false;
      if (idx > -1) {
        userAlbums.splice(idx, 1);
        isFavorite = false;
      } else {
        userAlbums.push({ id: albumId, saved_at: new Date().toISOString() });
        isFavorite = true;
      }
      cacheStore.albums.set(userKey, userAlbums);

      return res.status(200).json({
        success: true,
        is_favorite: isFavorite,
        message: isFavorite ? 'Đã lưu album vào thư viện!' : 'Đã bỏ lưu album!'
      });
    }

    // -------------------------------------------------------------
    // 5. PLAYLISTS LIST & CREATE
    // -------------------------------------------------------------
    if (action === 'playlists_list' || action === 'list') {
      const userPlaylists = cacheStore.playlists.get(String(userId)) || [];
      return res.status(200).json({
        success: true,
        playlists: userPlaylists
      });
    }

    if (action === 'playlist_create') {
      const name = (req.body?.name || url.searchParams.get('name') || 'Danh sách mới').trim();
      const description = req.body?.description || url.searchParams.get('description') || '';
      const userKey = String(userId);
      let userPlaylists = cacheStore.playlists.get(userKey) || [];

      const newPl = {
        id: 'pl_' + Date.now(),
        name,
        description,
        cover_url: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
        tracks_count: 0,
        tracks: [],
        created_at: new Date().toISOString()
      };

      userPlaylists.unshift(newPl);
      cacheStore.playlists.set(userKey, userPlaylists);

      return res.status(200).json({
        success: true,
        playlist: newPl,
        message: 'Tạo playlist thành công!'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Action ${action} handled`,
      data: []
    });
  } catch (error) {
    console.error('[Playlists API Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
