/**
 * MinhDucEar - Vercel Serverless Function: Playlists & Favorites API
 * Handles favorites, playlists, and album bookmarks on Vercel
 */

const cacheStore = {
  favorites: new Map(),
  albums: new Map(),
  playlists: new Map()
};

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
    if (action === 'favorites_list') {
      const userKey = String(userId);
      let userFavs = (cacheStore.favorites.get(userKey) || []).filter(f => f && f.title && f.title !== 'Bài hát' && (f.youtube_id || (f.id && f.id !== 'yt_')));
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
      let userFavs = (cacheStore.favorites.get(userKey) || []).filter(f => f && f.title && f.title !== 'Bài hát' && (f.youtube_id || (f.id && f.id !== 'yt_')));

      const existIdx = userFavs.findIndex(f => (ytId && f.youtube_id && f.youtube_id === ytId) || (trackId && trackId !== 'yt_' && f.id == trackId) || (title && f.title && f.title.toLowerCase() === title.toLowerCase()));

      let isFavorite = false;
      const validTrackId = (trackId && trackId !== 'yt_') ? trackId : ('yt_' + ytId);

      if (existIdx > -1) {
        userFavs.splice(existIdx, 1);
        isFavorite = false;
      } else {
        userFavs.unshift({
          id: validTrackId,
          db_id: (trackId && trackId !== 'yt_') ? trackId : null,
          youtube_id: ytId,
          title: title || 'Bản nhạc',
          artist: artist,
          cover_url: coverUrl,
          duration,
          format: 'YT AUDIO 320k',
          created_at: new Date().toISOString()
        });
        isFavorite = true;
      }

      cacheStore.favorites.set(userKey, userFavs);

      return res.status(200).json({
        success: true,
        is_favorite: isFavorite,
        track_id: validTrackId,
        message: isFavorite ? 'Đã thêm bài hát vào yêu thích!' : 'Đã xóa bài hát khỏi yêu thích!'
      });
    }

    if (action === 'favorite_remove') {
      const body = req.body || {};
      const trackId = url.searchParams.get('track_id') || body.track_id || '';
      const ytId = url.searchParams.get('youtube_id') || body.youtube_id || '';

      const userKey = String(userId);
      let userFavs = cacheStore.favorites.get(userKey) || [];
      userFavs = userFavs.filter(f => f.id != trackId && (!ytId || f.youtube_id !== ytId));
      cacheStore.favorites.set(userKey, userFavs);

      return res.status(200).json({
        success: true,
        is_favorite: false,
        track_id: trackId,
        message: 'Đã xóa khỏi danh sách yêu thích!'
      });
    }

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
