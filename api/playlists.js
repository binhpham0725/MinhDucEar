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

async function deleteFirestoreFavorite(uid, trackKey, meta = {}) {
  try {
    const cleanUid = cleanId(uid);
    const uids = [cleanUid];
    if (cleanUid.includes('hirasakai0725')) {
      uids.push('goog_115424860304779353235', '6400');
    }

    const rawKey = String(trackKey || '');
    const cleanK = cleanId(rawKey);
    const ytId = (meta.youtube_id || rawKey).trim().toLowerCase();
    const title = (meta.title || '').trim().toLowerCase();

    for (const targetUid of uids) {
      try {
        // Direct deletes for known path variations
        const paths = [
          `users/${targetUid}/favorites/${cleanK}`,
          `users/${targetUid}/favorites/${rawKey}`,
          `users/${targetUid}/favorites/${cleanK.toLowerCase()}`
        ];
        if (ytId) {
          paths.push(`users/${targetUid}/favorites/${ytId}`);
          paths.push(`users/${targetUid}/favorites/yt_${ytId}`);
        }
        await Promise.all(paths.map(p => 
          fetch(`${FIRESTORE_BASE_URL}/${p}?key=${FIREBASE_CONFIG.apiKey}`, { method: 'DELETE' }).catch(() => {})
        ));

        // Also query list to delete any doc matching title or youtube_id
        const listUrl = `${FIRESTORE_BASE_URL}/users/${targetUid}/favorites?key=${FIREBASE_CONFIG.apiKey}&pageSize=100`;
        const res = await fetch(listUrl);
        if (res.ok) {
          const d = await res.json();
          if (Array.isArray(d.documents)) {
            const matches = d.documents.filter(docItem => {
              const f = docItem.fields || {};
              const docYt = String(f.youtube_id?.stringValue || '').trim().toLowerCase();
              const docTitle = String(f.title?.stringValue || '').trim().toLowerCase();
              const docName = docItem.name.split('/').pop().toLowerCase();
              return (ytId && (docYt === ytId || docName === ytId || docName === cleanK)) || (title && docTitle === title);
            });
            await Promise.all(matches.map(m => 
              fetch(`https://firestore.googleapis.com/v1/${m.name}?key=${FIREBASE_CONFIG.apiKey}`, { method: 'DELETE' }).catch(() => {})
            ));
          }
        }
      } catch (_) {}
    }
  } catch (e) {
    console.warn('[Firestore] deleteFavorite error:', e);
  }
}

async function getFirestorePlaylists(uid) {
  try {
    const cleanUid = cleanId(uid);
    const url = `${FIRESTORE_BASE_URL}/playlists?key=${FIREBASE_CONFIG.apiKey}&pageSize=100`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.documents)) return [];

    const results = [];
    data.documents.forEach(d => {
      const f = fromFirestoreFields(d.fields);
      const owner = String(f.owner_uid || '').trim().toLowerCase();
      const pUserId = String(f.user_id || '').trim();
      const pEmail = String(f.email || '').trim().toLowerCase();

      const isUserMatch = (
        cleanUid !== 'guest' && (
          owner === cleanUid ||
          (cleanUid.includes('hirasakai0725') && (owner === '0ef96678-0d16-4a11-b7be-aa9823d017e6' || owner.includes('hirasakai0725') || pUserId === '7' || pEmail.includes('hirasakai0725'))) ||
          owner === '0ef96678-0d16-4a11-b7be-aa9823d017e6'
        )
      );

      if (isUserMatch || (cleanUid === 'guest' && f.is_public !== false)) {
        const trList = Array.isArray(f.tracks) ? f.tracks : [];
        const tCount = Number(f.tracks_count || f.total_tracks || trList.length || 0);
        results.push({
          id: f.id || d.name.split('/').pop(),
          uuid: f.uuid || d.name.split('/').pop(),
          name: f.name || 'Playlist',
          description: f.description || '',
          cover_url: f.cover_url || f.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
          total_tracks: tCount,
          tracks_count: tCount,
          tracks: trList,
          is_public: f.is_public !== false,
          created_at: f.created_at || ''
        });
      }
    });

    if (cleanUid !== 'guest') {
      try {
        const subUrl = `${FIRESTORE_BASE_URL}/users/${cleanUid}/playlists?key=${FIREBASE_CONFIG.apiKey}&pageSize=50`;
        const subRes = await fetch(subUrl);
        if (subRes.ok) {
          const subData = await subRes.json();
          if (Array.isArray(subData.documents)) {
            subData.documents.forEach(d => {
              const f = fromFirestoreFields(d.fields);
              const exists = results.some(r => r.name.toLowerCase() === (f.name || '').toLowerCase() || String(r.id) === String(f.id));
              if (!exists) {
                const trList = Array.isArray(f.tracks) ? f.tracks : [];
                const tCount = Number(f.tracks_count || f.total_tracks || trList.length || 0);
                results.push({
                  id: f.id || d.name.split('/').pop(),
                  uuid: f.uuid || d.name.split('/').pop(),
                  name: f.name || 'Playlist',
                  description: f.description || '',
                  cover_url: f.cover_url || f.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
                  total_tracks: tCount,
                  tracks_count: tCount,
                  tracks: trList,
                  is_public: true,
                  created_at: f.created_at || ''
                });
              }
            });
          }
        }
      } catch (_) {}
    }

    return results;
  } catch (e) {
    return [];
  }
}

async function deleteFirestorePlaylist(uid, playlistId, name = '') {
  try {
    const plIdStr = String(playlistId);
    const cleanPlId = cleanId(plIdStr);
    const cleanUid = uid ? cleanId(uid) : '';

    const paths = [
      `playlists/${plIdStr}`,
      `playlists/pl_${plIdStr}`,
      `playlists/${cleanPlId}`
    ];
    if (cleanUid) {
      paths.push(`users/${cleanUid}/playlists/${plIdStr}`);
      paths.push(`users/${cleanUid}/playlists/pl_${plIdStr}`);
      paths.push(`users/${cleanUid}/playlists/${cleanPlId}`);
    }

    await Promise.all(paths.map(p => 
      fetch(`${FIRESTORE_BASE_URL}/${p}?key=${FIREBASE_CONFIG.apiKey}`, { method: 'DELETE' }).catch(() => {})
    ));

    try {
      const listRes = await fetch(`${FIRESTORE_BASE_URL}/playlists?key=${FIREBASE_CONFIG.apiKey}&pageSize=100`);
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData.documents)) {
          const toDelete = listData.documents.filter(d => {
            const f = fromFirestoreFields(d.fields);
            const docId = d.name.split('/').pop().toLowerCase();
            const dName = String(f.name || '').trim().toLowerCase();
            const dId = String(f.id || '').toLowerCase();
            const dUuid = String(f.uuid || '').toLowerCase();
            return docId === cleanPlId || docId === plIdStr.toLowerCase() || dId === plIdStr.toLowerCase() || (dUuid && dUuid === plIdStr.toLowerCase()) || (name && dName === name.trim().toLowerCase());
          });
          await Promise.all(toDelete.map(d => 
            fetch(`https://firestore.googleapis.com/v1/${d.name}?key=${FIREBASE_CONFIG.apiKey}`, { method: 'DELETE' }).catch(() => {})
          ));
        }
      }
    } catch (_) {}
  } catch (e) {
    console.warn('[Firestore] deletePlaylist error:', e);
  }
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
      const userKey = cleanId(userId);
      let userFavs = null;

      // Try fetching from Firestore if user is logged in
      if (userKey !== 'guest') {
        userFavs = await getFirestoreFavorites(userKey);

        // Auto-migration: Check legacy keys only if fetch failed completely (null)
        const legacyKeys = ['6400', '1', 'goog_115424860304779353235'].filter(k => k !== userKey);
        if (userFavs === null) {
          for (const lk of legacyKeys) {
            const legacyFavs = await getFirestoreFavorites(lk);
            if (Array.isArray(legacyFavs) && legacyFavs.length > 0) {
              userFavs = [];
              for (const lf of legacyFavs) {
                const k = lf.youtube_id || lf.id;
                if (k) {
                  await saveFirestoreFavorite(userKey, k, lf);
                  userFavs.push(lf);
                }
              }
              break;
            }
          }
        }
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

      const userKey = cleanId(userId);
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
      const title = url.searchParams.get('title') || body.title || '';

      const userKey = cleanId(userId);
      let userFavs = cacheStore.favorites.get(userKey) || [];
      userFavs = userFavs.filter(f => f.id != trackId && (!ytId || f.youtube_id !== ytId));
      cacheStore.favorites.set(userKey, userFavs);

      if (userKey !== 'guest') {
        const trackKey = ytId || trackId;
        await deleteFirestoreFavorite(userKey, trackKey, { youtube_id: ytId, title });
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
      const userKey = cleanId(userId);
      let userPlaylists = cacheStore.playlists.get(userKey);
      if (!userPlaylists || userPlaylists.length === 0) {
        const dbPlaylists = await getFirestorePlaylists(userKey);
        if (dbPlaylists && dbPlaylists.length > 0) {
          userPlaylists = dbPlaylists;
          cacheStore.playlists.set(userKey, userPlaylists);
        } else {
          userPlaylists = cacheStore.playlists.get(String(userId)) || [];
        }
      }
      return res.status(200).json({
        success: true,
        playlists: userPlaylists
      });
    }

    if (action === 'playlist_create') {
      const name = (req.body?.name || url.searchParams.get('name') || 'Danh sách mới').trim();
      const description = req.body?.description || url.searchParams.get('description') || '';
      const userKey = cleanId(userId);
      let userPlaylists = cacheStore.playlists.get(userKey) || [];

      const newId = 'pl_' + Date.now();
      const newPl = {
        id: newId,
        uuid: newId,
        owner_uid: userKey,
        name,
        description,
        cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
        tracks_count: 0,
        total_tracks: 0,
        tracks: [],
        is_public: true,
        created_at: new Date().toISOString()
      };

      userPlaylists.unshift(newPl);
      cacheStore.playlists.set(userKey, userPlaylists);

      if (userKey !== 'guest') {
        const payload = { fields: toFirestoreFields(newPl) };
        fetch(`${FIRESTORE_BASE_URL}/playlists/${newId}?key=${FIREBASE_CONFIG.apiKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
        fetch(`${FIRESTORE_BASE_URL}/users/${userKey}/playlists/${newId}?key=${FIREBASE_CONFIG.apiKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        playlist: newPl,
        message: 'Tạo playlist thành công!'
      });
    }

    if (action === 'playlist_delete') {
      const plId = url.searchParams.get('id') || req.body?.id || '';
      const name = url.searchParams.get('name') || req.body?.name || '';
      const userKey = cleanId(userId);

      let userPlaylists = cacheStore.playlists.get(userKey) || [];
      userPlaylists = userPlaylists.filter(p => String(p.id) !== String(plId) && (!name || p.name !== name));
      cacheStore.playlists.set(userKey, userPlaylists);

      await deleteFirestorePlaylist(userKey, plId, name);

      return res.status(200).json({
        success: true,
        id: plId,
        message: 'Đã xóa playlist thành công!'
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
