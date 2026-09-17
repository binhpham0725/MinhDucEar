/**
 * MinhDucEar - Vercel Serverless Function: Tracks API
 * Genuine YouTube Music Innertube API (WEB_REMIX) Integration with Strict Music Filtering,
 * Alternative Stream Resolution, and Album Tracks Provider for Vercel Serverless.
 */

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

    return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
  } catch (error) {
    console.error('[API Handler Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
