/**
 * MinhDucEar - Vercel Serverless Function: Lyrics API
 * Fetches real-time synchronized karaoke lyrics (LRC format) via LRCLIB & Musixmatch.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const title = (url.searchParams.get('title') || '').trim();
  const artist = (url.searchParams.get('artist') || '').trim();
  const duration = parseInt(url.searchParams.get('duration') || '0', 10);

  if (!title) {
    return res.status(400).json({ success: false, message: 'Thiếu tham số title' });
  }

  try {
    // 1. Try LRCLIB exact match with duration
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist
    });
    if (duration > 0) {
      params.set('duration', duration.toString());
    }

    let lrcRes = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: { 'User-Agent': 'MinhDucEar/2.0 (web-app)' }
    });

    if (lrcRes.ok) {
      const data = await lrcRes.json();
      if (data.syncedLyrics) {
        return res.status(200).json({
          success: true,
          lyrics: data.syncedLyrics,
          is_synced: true,
          source: 'LRCLIB'
        });
      }
      if (data.plainLyrics) {
        return res.status(200).json({
          success: true,
          lyrics: data.plainLyrics,
          is_synced: false,
          source: 'LRCLIB (Plain)'
        });
      }
    }

    // 2. Search fallback on LRCLIB
    const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(title + ' ' + artist)}`, {
      headers: { 'User-Agent': 'MinhDucEar/2.0 (web-app)' }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (Array.isArray(searchData) && searchData.length > 0) {
        const bestMatch = searchData.find(item => item.syncedLyrics) || searchData[0];
        if (bestMatch?.syncedLyrics) {
          return res.status(200).json({
            success: true,
            lyrics: bestMatch.syncedLyrics,
            is_synced: true,
            source: 'LRCLIB Search'
          });
        }
        if (bestMatch?.plainLyrics) {
          return res.status(200).json({
            success: true,
            lyrics: bestMatch.plainLyrics,
            is_synced: false,
            source: 'LRCLIB Search (Plain)'
          });
        }
      }
    }

    return res.status(200).json({
      success: false,
      message: 'Chưa có lời bài hát cho bài này',
      lyrics: null,
      is_synced: false
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
