import { Readable } from 'stream';

/**
 * MinhDucEar - Vercel Serverless Function: Download Audio API
 * Integration with https://api.vevioz.com/ and High-Speed Direct Audio Streaming
 */

const AUDIO_INSTANCES = [
  'https://yt.chocolatemoo53.com',
  'https://invidious.lunar.icu',
  'https://inv.vern.cc'
];

async function getDirectAudioStream(youtubeId) {
  for (const instance of AUDIO_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(`${instance}/api/v1/videos/${youtubeId}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      const streams = (data.adaptiveFormats || []).filter(f => f.type && f.type.startsWith('audio/'));
      if (streams.length > 0) {
        // Prefer highest bitrate
        streams.sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));
        return streams[0];
      }
    } catch (e) {
      // Try next instance
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = url.searchParams.get('action') || 'download';
    let youtubeId = (url.searchParams.get('youtube_id') || '').trim();
    const rawId = (url.searchParams.get('id') || '').trim();
    const title = (url.searchParams.get('title') || 'Bai_Hat').trim();
    const artist = (url.searchParams.get('artist') || 'MinhDucEar').trim();

    if (!youtubeId && rawId.startsWith('yt_')) {
      youtubeId = rawId.substring(3);
    }

    if (youtubeId) {
      youtubeId = youtubeId.replace(/[^a-zA-Z0-9_\-]/g, '');
    }

    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu YouTube ID bài hát để tải về'
      });
    }

    const cleanFilename = `${artist} - ${title}.mp3`.replace(/[\\\/:\*\?"<>\|]/g, '');
    const cleanAscii = cleanFilename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_\-\. ]/g, '') || 'track.mp3';
    const veviozEmbedUrl = `https://api.vevioz.com/${youtubeId}?mode=single&format=mp3&theme=dark`;
    const streamUrl = `/api/download?youtube_id=${youtubeId}&action=stream&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;

    if (action === 'prepare') {
      return res.status(200).json({
        success: true,
        ready: true,
        is_vercel: true,
        title,
        artist,
        filename: cleanFilename,
        vevioz_url: veviozEmbedUrl,
        download_url: streamUrl,
        stream_url: streamUrl
      });
    }

    // Direct audio streaming into browser download queue
    const streamInfo = await getDirectAudioStream(youtubeId);
    if (streamInfo && streamInfo.url) {
      try {
        const audioRes = await fetch(streamInfo.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (audioRes.ok) {
          const contentType = streamInfo.type && streamInfo.type.includes('mp4') ? 'audio/mp4' : 'audio/mpeg';
          const contentLength = audioRes.headers.get('content-length');

          res.setHeader('Content-Type', contentType);
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${cleanAscii}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
          );
          if (contentLength) {
            res.setHeader('Content-Length', contentLength);
          }
          res.setHeader('Cache-Control', 'public, max-age=86400');

          return Readable.fromWeb(audioRes.body).pipe(res);
        }
      } catch (streamErr) {
        console.warn('Audio pipe error:', streamErr);
      }
    }

    // If stream cannot be resolved directly, fallback to Vevioz embed
    return res.status(200).json({
      success: true,
      ready: true,
      vevioz_url: veviozEmbedUrl,
      filename: cleanFilename,
      message: 'Vui lòng sử dụng Vevioz Downloader tích hợp'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi xử lý tải bài hát'
    });
  }
}
