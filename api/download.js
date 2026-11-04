/**
 * MinhDucEar - Vercel Serverless Function: Download Audio API
 * Provides audio download resolution for YouTube Music & Database tracks on Vercel
 */

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
    const dirpyUrl = `https://dirpy.com/studio?url=https://www.youtube.com/watch?v=${youtubeId}`;
    const ytmp3Url = `https://ytmp3.nu/?url=https://www.youtube.com/watch?v=${youtubeId}`;

    if (action === 'prepare') {
      return res.status(200).json({
        success: true,
        ready: true,
        is_vercel: true,
        title,
        artist,
        filename: cleanFilename,
        download_url: dirpyUrl,
        dirpy_url: dirpyUrl,
        ytmp3_url: ytmp3Url
      });
    }

    // Direct redirect to clean converter
    return res.redirect(302, dirpyUrl);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi xử lý tải bài hát'
    });
  }
}
