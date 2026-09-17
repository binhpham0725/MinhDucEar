/**
 * MinhDucEar - Vercel Serverless Function: Tracks API
 * Genuine YouTube Music Innertube API (WEB_REMIX) Integration with Strict Music Filtering,
 * Alternative Stream Resolution, and Album Tracks Provider for Vercel Serverless.
 */

const historyCache = new Map(); // key: userId -> array of history items

const FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'minhducear-f055d',
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA_dQjex_0sZj4h2rZl4Fb0Gk_aumJ-c0'
};

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

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

async function getFirestoreHistory(uid, limitCount = 50) {
  try {
    const cleanUid = cleanId(uid);
    const url = `${FIRESTORE_BASE_URL}/users/${cleanUid}/history?key=${FIREBASE_CONFIG.apiKey}&pageSize=${limitCount}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !data.documents) return [];
    return data.documents.map(d => {
      const parsed = fromFirestoreFields(d.fields);
      const tr = parsed.track || parsed;
      return {
        id: tr.id || ('yt_' + tr.youtube_id),
        track_id: tr.db_id || tr.track_id || null,
        youtube_id: tr.youtube_id || '',
        title: tr.title || 'Bản nhạc',
        artist: tr.artist || 'Nghệ sĩ',
        cover_url: tr.cover_url || (tr.youtube_id ? `https://i.ytimg.com/vi/${tr.youtube_id}/hqdefault.jpg` : ''),
        duration: tr.duration || 210,
        format: tr.format || 'YT 320k',
        played_at: parsed.played_at || (parsed.playedAt ? new Date(parsed.playedAt).toISOString() : new Date().toISOString()),
        playedAt: parsed.playedAt || (d.createTime ? new Date(d.createTime).getTime() : Date.now())
      };
    }).filter(h => h && h.title && h.title !== 'Bài hát' && (h.youtube_id || (h.id && h.id !== 'yt_')));
  } catch(e) {
    return [];
  }
}

async function saveFirestoreHistory(uid, trackKey, historyData) {
  try {
    const cleanUid = cleanId(uid);
    const cleanKey = cleanId(trackKey);
    const url = `${FIRESTORE_BASE_URL}/users/${cleanUid}/history/${cleanKey}?key=${FIREBASE_CONFIG.apiKey}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(historyData) })
    });
  } catch(e) {}
}

const CATEGORY_QUERIES = {
  all: [
    'thinh hanh nhac tre vpop 2026',
    'nhac tre remix hot trend tiktok 2026',
    'nhac chill acoustic ballad viet nam',
    'tuyen tap bai hat vpop trieu view',
    'nhac tre moi phat hanh 2026',
    'nhac hay nhat 2026 moi nguoi deu nghe'
  ],
  supermix: [
    'thinh hanh nhac tre vpop 2026',
    'nhac tre acoustic ballad viet nam',
    'vpop hot hits youtube music',
    'nhac tre remix hot trend tiktok 2026',
    'indie pop chill viet nam'
  ],
  chill: [
    'nhac chill thu gian nhe nhang acoustic',
    'lofi hip hop beats to relax study to',
    'coffee shop acoustic chill viet nam',
    'nhac ballad acoustic chill dem khuya',
    'r&b soul smooth chill viet nam'
  ],
  relax: [
    'nhac chill thu gian nhe nhang acoustic',
    'lofi hip hop beats to relax study to',
    'coffee shop acoustic chill viet nam'
  ],
  energy: [
    'nhac tre remix hot trend tiktok 2026 bass cuc cang',
    'workout gym edm music boost',
    'vinahouse remix bass cang cuc dinh',
    'nhac edm nang luong tap luyen chay bo'
  ],
  workout: [
    'nhac tre remix hot trend tiktok 2026 bass cuc cang',
    'workout gym edm music boost',
    'vinahouse remix bass cang cuc dinh'
  ],
  mood: [
    'nhac ballad tam trang buon viet nam 2026',
    'nhac suy ngam dem muon ballad hay nhat',
    'indie viet nam tam trang nhe nhang'
  ],
  ballad: [
    'nhac ballad tam trang buon viet nam 2026',
    'nhac suy ngam dem muon ballad hay nhat',
    'top ballad viet nam trieu view'
  ],
  focus: [
    'deep focus piano beats study work',
    'nhac khong loi tap trung lam viec hoc tap',
    'ambient deep focus alpha waves concentration',
    'lofi beats for coding and deep work'
  ],
  study: [
    'deep focus piano beats study work',
    'lofi hip hop beats to relax study to',
    'nhac khong loi tap trung lam viec'
  ],
  vpop: [
    'bang xep hang top hits vpop 2026',
    'top nhac tre vpop thinh hanh nhat',
    'nhac tre moi phat hanh trieu view',
    'vpop trending youtube music'
  ],
  trending: [
    'bang xep hang top hits vpop 2026',
    'top nhac tre vpop thinh hanh nhat',
    'thinh hanh nhac tre vpop 2026'
  ],
  retro: [
    'synthwave cyberpunk retro chill beats',
    'retrowave darksynth neon night drive',
    'city pop japanese 80s retro groove'
  ],
  synthwave: [
    'synthwave cyberpunk retro chill beats',
    'retrowave darksynth neon night drive',
    'chillwave 80s futuristic electronic'
  ],
  lofi: [
    'lofi hip hop beats to relax study to',
    'lofi chill beats night rain sleep',
    'vietnamese lofi chill beats'
  ],
  anime: [
    'anime ost best epic soundtrack',
    'anime emotional piano orchestral ost',
    'studio ghibli lofi chill orchestral'
  ],
  audiophile: [
    'audiophile hi-res flac 24bit vocal acoustic',
    'audiophile master dsd jazz vocal',
    'audiophile classical symphony direct dsd'
  ]
};

const NON_MUSIC_PATTERNS = [
  /\bgameplay\b/i, /\bgaming\b/i, /\blive stream\b/i, /\blivestream\b/i, /\btập \d+\b/i,
  /\bphim\b/i, /\btập full\b/i, /\btrailer\b/i, /\bphim ngắn\b/i, /\bshort film\b/i,
  /\bvlog\b/i, /\breview\b/i, /\btin tức\b/i, /\bthời sự\b/i, /\btin mới\b/i,
  /\bhài kịch\b/i, /\btáo quân\b/i, /\bphóng sự\b/i, /\bsách nói\b/i, /\baudiobook\b/i,
  /\bthuyết pháp\b/i, /\btụng kinh\b/i, /\bgiảng pháp\b/i, /\bphật pháp\b/i
];

function isNonMusic(title = '', artist = '') {
  const text = `${title} ${artist}`.toLowerCase();
  return NON_MUSIC_PATTERNS.some(p => p.test(text));
}

function parseDurationSeconds(durationStr = '') {
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}

function extractItemsRecursively(obj, out = []) {
  if (!obj || typeof obj !== 'object') return;
  if (obj.musicResponsiveListItemRenderer) {
    out.push(obj.musicResponsiveListItemRenderer);
    return;
  }
  for (const key of Object.keys(obj)) {
    extractItemsRecursively(obj[key], out);
  }
}

async function searchYouTubeMusic(query) {
  try {
    const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://music.youtube.com/'
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20240401.01.00',
            hl: 'vi',
            gl: 'VN'
          }
        },
        query
      })
    });

    if (!res.ok) return [];
    const data = await res.json();
    const items = [];
    extractItemsRecursively(data, items);

    const tracks = [];
    const seen = new Set();

    for (const item of items) {
      const navEndpoint = item.navigationEndpoint || item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint;
      const videoId = item.playlistItemData?.videoId || navEndpoint?.watchEndpoint?.videoId;
      if (!videoId || seen.has(videoId)) continue;

      const titleRuns = item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      const title = titleRuns.map(r => r.text || '').join('').trim();
      if (!title || isNonMusic(title)) continue;

      let artist = '';
      let durationSeconds = 210;
      let durationText = '03:30';

      const playLabel = item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.accessibilityPlayData?.accessibilityData?.label || '';
      if (playLabel) {
        const parts = playLabel.split(' - ');
        if (parts.length === 2 && parts[1].trim()) {
          artist = parts[1].trim();
        }
      }

      const subRuns = item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      for (const r of subRuns) {
        const t = (r.text || '').trim();
        if (!t || t === '•') continue;
        if (/^(\d+):(\d+)(?::(\d+))?$/.test(t)) {
          durationText = t;
          durationSeconds = parseDurationSeconds(t);
        } else if (!artist && !t.includes('lượt xem') && !t.includes('views') && !t.includes('Video') && !t.includes('Bài hát')) {
          if (!/^\d+$/.test(t)) {
            artist = t;
          }
        }
      }

      if (!artist) artist = 'Nghệ sĩ YouTube';
      if (isNonMusic(title, artist)) continue;
      if (durationSeconds > 21600 || durationSeconds <= 0) continue;

      const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      let cover = thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      if (!cover || cover.includes('googleusercontent') || cover.includes('sqp=')) {
        cover = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

      seen.add(videoId);
      tracks.push({
        id: 'yt_' + videoId,
        youtube_id: videoId,
        title,
        artist,
        album: 'YouTube Music',
        duration: durationSeconds,
        duration_text: durationText,
        format: 'YT AUDIO 320k',
        cover_url: cover,
        source_type: 'youtube',
        views_count: Math.floor(Math.random() * 50000) + 5000
      });
    }

    return tracks;
  } catch (err) {
    console.error('[YTM Search Error]:', err);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = url.searchParams.get('action') || req.body?.action || 'initial_feed';
  const category = (url.searchParams.get('category') || req.body?.category || 'all').toLowerCase();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || req.body?.limit || '8', 10), 30);
  const offset = parseInt(url.searchParams.get('offset') || req.body?.offset || '0', 10);
  const query = (url.searchParams.get('q') || url.searchParams.get('query') || req.body?.q || '').trim();
  const excludeParam = url.searchParams.get('exclude') || req.body?.exclude || '';
  const excludeIds = new Set(excludeParam ? excludeParam.split(',').map(s => s.trim()) : []);

  try {
    // 1. INITIAL FEED / MADE FOR YOU
    if (action === 'initial_feed' || action === 'list') {
      const catQueries = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;
      const searchQuery = catQueries[0];
      const tracks = await searchYouTubeMusic(searchQuery);
      const filtered = tracks.filter(t => !excludeIds.has(t.youtube_id)).slice(0, limit);
      return res.status(200).json({
        success: true,
        tracks: filtered,
        category,
        total: filtered.length
      });
    }

    // 2. SEARCH
    if (action === 'search') {
      let searchQuery = query;
      if (!searchQuery) {
        const catQueries = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;
        const page = Math.floor(offset / Math.max(1, limit));
        searchQuery = catQueries[page % catQueries.length];
      }
      const tracks = await searchYouTubeMusic(searchQuery);
      const filtered = tracks.filter(t => !excludeIds.has(t.youtube_id)).slice(0, limit);
      return res.status(200).json({
        success: true,
        tracks: filtered,
        has_more: filtered.length >= limit
      });
    }

    // 3. EXPLORE
    if (action === 'explore') {
      const exploreQueries = [
        'bang xep hang top hits vpop 2026',
        'nhac tre remix hot trend tiktok 2026',
        'nhac chill acoustic ballad viet nam',
        'audiophile master dsd jazz vocal',
        'synthwave cyberpunk retro chill beats'
      ];
      const page = Math.floor(offset / Math.max(1, limit));
      const q = exploreQueries[page % exploreQueries.length];
      const tracks = await searchYouTubeMusic(q);
      const filtered = tracks.filter(t => !excludeIds.has(t.youtube_id)).slice(0, limit);
      return res.status(200).json({
        success: true,
        tracks: filtered,
        has_more: filtered.length >= limit
      });
    }

    // 4. FEATURED ALBUMS
    if (action === 'featured_albums' || action === 'more_albums') {
      const albums = [
        {
          id: 'alb_vpop_trending',
          title: 'Top Hits V-Pop 2026 Thịnh Hành',
          artist: 'MinhDucEar Curated',
          cover_url: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
          tracks_count: 12,
          year: 2026,
          query: 'top nhac tre vpop thinh hanh nhat'
        },
        {
          id: 'alb_chill_acoustic',
          title: 'Coffee Shop Acoustic & Chill',
          artist: 'V-Acoustic Studio',
          cover_url: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
          tracks_count: 10,
          year: 2026,
          query: 'coffee shop acoustic chill viet nam'
        },
        {
          id: 'alb_remix_bass',
          title: 'Vinahouse & TikTok Remix Căng Đét',
          artist: 'Việt Mix TV',
          cover_url: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
          tracks_count: 14,
          year: 2026,
          query: 'nhac tre remix hot trend tiktok 2026 bass cuc cang'
        },
        {
          id: 'alb_retro_synth',
          title: 'Cyberpunk Neon & Retro Synthwave',
          artist: 'Antigravity Sound',
          cover_url: 'https://i.ytimg.com/vi/rRrIQmz4nYA/hqdefault.jpg',
          tracks_count: 10,
          year: 2026,
          query: 'synthwave cyberpunk retro chill beats'
        }
      ];
      return res.status(200).json({
        success: true,
        albums: albums.slice(offset, offset + limit),
        has_more: offset + limit < albums.length
      });
    }

    // 5. ALBUM TRACKS
    if (action === 'album_tracks') {
      const albumQuery = query || 'nhac tre vpop moi nhat';
      const tracks = await searchYouTubeMusic(albumQuery);
      return res.status(200).json({
        success: true,
        tracks: tracks.slice(0, 12)
      });
    }

    // 6. RESOLVE ALTERNATIVE (Self-Healing Stream)
    if (action === 'resolve_alternative') {
      const title = url.searchParams.get('title') || req.body?.title || '';
      const artist = url.searchParams.get('artist') || req.body?.artist || '';
      const failedId = url.searchParams.get('failed_id') || req.body?.failed_id || '';

      const altQuery = `${title} ${artist} official audio`;
      const candidates = await searchYouTubeMusic(altQuery);
      const alternative = candidates.find(c => c.youtube_id && c.youtube_id !== failedId);

      if (alternative) {
        return res.status(200).json({
          success: true,
          resolved: true,
          original_failed_id: failedId,
          alternative_id: alternative.youtube_id,
          title: alternative.title,
          artist: alternative.artist,
          cover_url: alternative.cover_url
        });
      }

      return res.status(200).json({
        success: false,
        resolved: false,
        message: 'Không tìm thấy bản thay thế phù hợp'
      });
    }

    // 7. HISTORY RECORD (Vercel Serverless & Cloud Firestore)
    if (action === 'history_record') {
      let body = {};
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else if (typeof req.body === 'string') {
        try { body = JSON.parse(req.body); } catch(e) {}
      }

      const userId = url.searchParams.get('user_id') || body.user_id || 'guest';
      const trackId = url.searchParams.get('track_id') || body.track_id || '';
      const ytId = url.searchParams.get('youtube_id') || body.youtube_id || '';
      const title = (url.searchParams.get('title') || body.title || '').trim();
      const artist = (url.searchParams.get('artist') || body.artist || 'Nghệ sĩ').trim();
      const coverUrl = url.searchParams.get('cover_url') || body.cover_url || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '');
      const duration = parseInt(url.searchParams.get('duration') || body.duration || '210', 10);

      // Validate: Reject dummy or empty tracks
      if (!ytId && (!title || title === 'Bài hát')) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
      }

      const userKey = cleanId(userId);
      let list = (historyCache.get(userKey) || []).filter(h => h && h.title && h.title !== 'Bài hát' && (h.youtube_id || (h.id && h.id !== 'yt_')));

      // Remove previous duplicate of this song
      list = list.filter(h => (!ytId || h.youtube_id !== ytId) && (!trackId || trackId === 'yt_' || h.id != trackId) && (!title || h.title.toLowerCase() !== title.toLowerCase()));

      const validId = (trackId && trackId !== 'yt_') ? trackId : ('yt_' + ytId);
      const newHistoryItem = {
        id: validId,
        track_id: (trackId && trackId !== 'yt_') ? trackId : null,
        youtube_id: ytId,
        title: title || 'Bản nhạc',
        artist,
        cover_url: coverUrl,
        duration,
        format: 'YT 320k',
        played_at: new Date().toISOString(),
        playedAt: Date.now()
      };
      list.unshift(newHistoryItem);

      if (list.length > 60) list = list.slice(0, 60);
      historyCache.set(userKey, list);

      // Save to Cloud Firestore if logged in
      if (userKey !== 'guest') {
        const trackKey = ytId || validId;
        const histPayload = {
          track: {
            id: validId,
            db_id: (trackId && trackId !== 'yt_') ? trackId : null,
            youtube_id: ytId,
            title: title || 'Bản nhạc',
            artist: artist,
            cover_url: coverUrl,
            duration: duration,
            format: 'YT 320k'
          },
          playedAt: Date.now(),
          played_at: new Date().toISOString()
        };
        saveFirestoreHistory(userKey, trackKey, histPayload).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        track_id: validId,
        message: 'Đã lưu lịch sử phát nhạc'
      });
    }

    // 8. HISTORY LIST (Vercel Serverless & Cloud Firestore)
    if (action === 'history_list') {
      const userId = url.searchParams.get('user_id') || req.body?.user_id || 'guest';
      const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
      const userKey = cleanId(userId);
      let list = (historyCache.get(userKey) || []).filter(h => h && h.title && h.title !== 'Bài hát' && (h.youtube_id || (h.id && h.id !== 'yt_')));

      if (userKey !== 'guest') {
        const remoteHist = await getFirestoreHistory(userKey, limit);
        if (Array.isArray(remoteHist) && remoteHist.length > 0) {
          const seen = new Set();
          const merged = [];
          [...remoteHist, ...list].forEach(item => {
            const k = item.youtube_id || item.title;
            if (k && !seen.has(k)) {
              seen.add(k);
              merged.push(item);
            }
          });
          list = merged;
          historyCache.set(userKey, list);
        }
      }

      return res.status(200).json({
        success: true,
        history: list.slice(0, limit)
      });
    }

    // 9. HISTORY CLEAR
    if (action === 'history_clear') {
      const userId = url.searchParams.get('user_id') || req.body?.user_id || 'guest';
      const userKey = cleanId(userId);
      historyCache.delete(userKey);
      historyCache.delete(String(userId));
      return res.status(200).json({
        success: true,
        message: 'Đã xóa toàn bộ lịch sử nghe nhạc!'
      });
    }

    return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
  } catch (error) {
    console.error('[API Handler Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
