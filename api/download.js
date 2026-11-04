import { Readable } from 'stream';

/**
 * MinhDucEar - Vercel Serverless Function: Download Audio API
 * Integration with https://api.vevioz.com/
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
    const veviozEmbedUrl = `https://api.vevioz.com/${youtubeId}?mode=single&format=mp3&theme=dark`;

    // API JSON prepare response
    if (action === 'prepare') {
      return res.status(200).json({
        success: true,
        ready: true,
        is_vercel: true,
        title,
        artist,
        filename: cleanFilename,
        vevioz_url: veviozEmbedUrl
      });
    }

    // If client requested HTML or directly visited via browser navigation:
    // Render the beautiful embedded Vevioz Downloader page rather than raw JSON!
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tải nhạc: ${title} - ${artist} | MinhDucEar</title>
  <link rel="icon" type="image/svg+xml" href="/assets/images/logo.svg">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background-color: #0c0c12;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      width: 100%;
      max-width: 460px;
      background: #14141d;
      border: 1px solid rgba(84, 216, 232, 0.35);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 0 50px rgba(84, 216, 232, 0.25);
      text-align: center;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .header h2 {
      margin: 0;
      color: #54d8e8;
      font-size: 15px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 800;
    }
    .song-info {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 16px;
      text-align: left;
    }
    .song-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .song-artist {
      font-size: 11px;
      color: #94a3b8;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 9px;
      font-weight: 700;
      color: #54d8e8;
      background: rgba(84, 216, 232, 0.15);
      border: 1px solid rgba(84, 216, 232, 0.35);
      padding: 2px 8px;
      border-radius: 4px;
    }
    iframe {
      width: 100%;
      height: 340px;
      border: 0;
      border-radius: 12px;
      background: #000;
    }
    .footer {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .btn-back {
      color: #54d8e8;
      text-decoration: none;
      font-size: 11px;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid rgba(84, 216, 232, 0.3);
      transition: all 0.2s;
    }
    .btn-back:hover {
      background: rgba(84, 216, 232, 0.15);
      border-color: #54d8e8;
    }
    .note {
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span>📥</span>
      <h2>VEVIOZ AUDIO DOWNLOADER</h2>
    </div>

    <div class="song-info">
      <p class="song-title">${title}</p>
      <p class="song-artist">${artist}</p>
      <span class="badge">HQ MP3 320KBPS</span>
    </div>

    <iframe
      id="vevioz-api"
      src="${veviozEmbedUrl}"
      title="Vevioz Downloader"
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin"
      allow="clipboard-write"
      sandbox="allow-scripts allow-forms allow-downloads allow-same-origin allow-popups allow-popups-to-escape-sandbox">
    </iframe>

    <div class="footer">
      <span class="note">Tải tự động vào hàng đợi trình duyệt</span>
      <a href="/" class="btn-back">← Về trang chủ</a>
    </div>
  </div>

  <script>
    window.addEventListener("message", function(e) {
      if (e.origin !== "https://api.vevioz.com") return;
      if (e.data?.type === "vevioz-api-download" && typeof e.data.url === "string") {
        const download = new URL(e.data.url, "https://api.vevioz.com");
        if (download.origin === "https://api.vevioz.com" && download.pathname.indexOf("/api/v1/files/") === 0) {
          window.location.assign(download.href);
        }
      }
    });
  </script>
</body>
</html>`);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi xử lý tải bài hát'
    });
  }
}
