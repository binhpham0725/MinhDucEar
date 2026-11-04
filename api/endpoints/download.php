<?php
/**
 * Direct Audio Download Service
 * Supports downloading songs from MySQL audio_blob or YouTube Music (HQ MP3 / M4A)
 * MinhDucEar Platform
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'download';
$rawId = $_GET['id'] ?? $_POST['id'] ?? '';
$youtubeId = trim($_GET['youtube_id'] ?? $_POST['youtube_id'] ?? '');
$title = trim($_GET['title'] ?? $_POST['title'] ?? '');
$artist = trim($_GET['artist'] ?? $_POST['artist'] ?? '');

if (empty($youtubeId) && is_string($rawId) && strpos($rawId, 'yt_') === 0) {
    $youtubeId = substr($rawId, 3);
}

// Clean YouTube ID to prevent command injection
if (!empty($youtubeId)) {
    $youtubeId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $youtubeId);
}

$db = Database::getInstance();
$pdo = $db->getConnection();

// Check database if title or artist is empty
if ($pdo && (empty($title) || empty($artist))) {
    try {
        if (!empty($youtubeId)) {
            $stmt = $pdo->prepare("SELECT title, artist, audio_blob, audio_mime FROM tracks WHERE youtube_id = ? LIMIT 1");
            $stmt->execute([$youtubeId]);
            $dbTrack = $stmt->fetch();
            if ($dbTrack) {
                if (empty($title)) $title = $dbTrack['title'] ?? '';
                if (empty($artist)) $artist = $dbTrack['artist'] ?? '';
            }
        } elseif (is_numeric($rawId) && (int)$rawId > 0) {
            $stmt = $pdo->prepare("SELECT title, artist, audio_blob, audio_mime, youtube_id FROM tracks WHERE id = ? LIMIT 1");
            $stmt->execute([(int)$rawId]);
            $dbTrack = $stmt->fetch();
            if ($dbTrack) {
                if (empty($title)) $title = $dbTrack['title'] ?? '';
                if (empty($artist)) $artist = $dbTrack['artist'] ?? '';
                if (empty($youtubeId) && !empty($dbTrack['youtube_id'])) {
                    $youtubeId = $dbTrack['youtube_id'];
                }
            }
        }
    } catch (Exception $e) {}
}

if (empty($title)) $title = 'Bai_Hat';
if (empty($artist)) $artist = 'MinhDucEar';

$uploadDir = __DIR__ . '/../../uploads/tracks';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
}

// Function to generate clean filename
function getDownloadFilename($artist, $title, $ext = 'mp3') {
    $name = trim("{$artist} - {$title}");
    // Remove characters forbidden in filenames: \ / : * ? " < > |
    $clean = preg_replace('/[\\\\\/:\*\?"<>\|]/', '', $name);
    $clean = trim(preg_replace('/\s+/', ' ', $clean));
    if (empty($clean)) $clean = 'Track_' . date('Ymd_His');
    return $clean . '.' . $ext;
}

// -------------------------------------------------------------------------
// 1. Check if track has audio_blob in MySQL database
// -------------------------------------------------------------------------
if ($pdo && is_numeric($rawId) && (int)$rawId > 0) {
    try {
        $stmtBlob = $pdo->prepare("SELECT audio_blob, audio_mime, audio_size FROM tracks WHERE id = ?");
        $stmtBlob->execute([(int)$rawId]);
        $rowBlob = $stmtBlob->fetch();
        if ($rowBlob && !empty($rowBlob['audio_blob'])) {
            $blobData = $rowBlob['audio_blob'];
            $mime = $rowBlob['audio_mime'] ?: 'audio/mpeg';
            $ext = (strpos($mime, 'mp4') !== false || strpos($mime, 'm4a') !== false) ? 'm4a' : 'mp3';
            $filename = getDownloadFilename($artist, $title, $ext);

            if ($action === 'prepare') {
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'success' => true,
                    'ready' => true,
                    'source' => 'database',
                    'title' => $title,
                    'artist' => $artist,
                    'filename' => $filename,
                    'file_size' => strlen($blobData),
                    'download_url' => "api/endpoints/download.php?id=" . urlencode($rawId) . "&title=" . urlencode($title) . "&artist=" . urlencode($artist)
                ]);
                exit;
            }

            // Stream DB Blob directly as download
            header('Content-Type: ' . $mime);
            header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
            header('Content-Length: ' . strlen($blobData));
            header('Cache-Control: public, max-age=86400');
            echo $blobData;
            exit;
        }
    } catch (Exception $e) {}
}

// -------------------------------------------------------------------------
// 2. YouTube Music Track Handler
// -------------------------------------------------------------------------
if (empty($youtubeId)) {
    if ($action === 'prepare') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'Không tìm thấy ID bài hát để tải về'
        ]);
        exit;
    }
    http_response_code(400);
    die('Thiếu thông tin bài hát (youtube_id hoặc track id)');
}

$cachedMp3 = "{$uploadDir}/{$youtubeId}.mp3";
$cachedM4a = "{$uploadDir}/{$youtubeId}.m4a";

// If already cached on server, we can immediately serve it!
if (file_exists($cachedMp3) && filesize($cachedMp3) > 10000) {
    $filename = getDownloadFilename($artist, $title, 'mp3');
    if ($action === 'prepare') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'ready' => true,
            'cached' => true,
            'title' => $title,
            'artist' => $artist,
            'filename' => $filename,
            'file_size' => filesize($cachedMp3),
            'download_url' => "api/endpoints/download.php?youtube_id=" . urlencode($youtubeId) . "&title=" . urlencode($title) . "&artist=" . urlencode($artist)
        ]);
        exit;
    }

    // Direct download
    header('Content-Type: audio/mpeg');
    header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
    header('Content-Length: ' . filesize($cachedMp3));
    header('Cache-Control: public, max-age=86400');
    @readfile($cachedMp3);
    exit;
} elseif (file_exists($cachedM4a) && filesize($cachedM4a) > 10000) {
    $filename = getDownloadFilename($artist, $title, 'm4a');
    if ($action === 'prepare') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'ready' => true,
            'cached' => true,
            'title' => $title,
            'artist' => $artist,
            'filename' => $filename,
            'file_size' => filesize($cachedM4a),
            'download_url' => "api/endpoints/download.php?youtube_id=" . urlencode($youtubeId) . "&title=" . urlencode($title) . "&artist=" . urlencode($artist)
        ]);
        exit;
    }

    header('Content-Type: audio/mp4');
    header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
    header('Content-Length: ' . filesize($cachedM4a));
    header('Cache-Control: public, max-age=86400');
    @readfile($cachedM4a);
    exit;
}

// -------------------------------------------------------------------------
// 3. Process Download & Conversion via yt-dlp + FFmpeg
// -------------------------------------------------------------------------
// Check runtime paths
$pythonPath = 'python';
$possiblePythons = [
    'C:\\Python314\\python.exe',
    'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python314\\python.exe',
    'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
    'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
    'C:\\Program Files\\Python312\\python.exe',
    'C:\\Program Files\\Python311\\python.exe'
];
foreach ($possiblePythons as $p) {
    if (file_exists($p)) {
        $pythonPath = "\"{$p}\"";
        break;
    }
}

$nodePath = 'C:\\Program Files\\nodejs\\node.exe';
$ffmpegPath = 'C:\\Program Files (x86)\\EaseUS\\Fixo\\ffmpeg.exe';
if (!file_exists($ffmpegPath)) {
    $ffmpegAlt = 'C:\\Program Files (x86)\\pcsuite\\VClaw\\resources\\bin\\ffmpeg.exe';
    if (file_exists($ffmpegAlt)) $ffmpegPath = $ffmpegAlt;
}

$ytUrl = "https://www.youtube.com/watch?v={$youtubeId}";
$outputTemplate = "{$uploadDir}/{$youtubeId}.%(ext)s";

// Build command with ffmpeg mp3 extraction
$jsArg = file_exists($nodePath) ? "--js-runtimes \"node:{$nodePath}\"" : "";
$ffmpegArg = file_exists($ffmpegPath) ? "--ffmpeg-location \"{$ffmpegPath}\"" : "";

// Attempt 1: Full MP3 conversion with FFmpeg
$cmdMp3 = "{$pythonPath} -m yt_dlp {$jsArg} {$ffmpegArg} -x --audio-format mp3 --audio-quality 0 -o \"{$outputTemplate}\" \"{$ytUrl}\" 2>&1";
@exec($cmdMp3, $outputLog, $returnCode);

if (file_exists($cachedMp3) && filesize($cachedMp3) > 10000) {
    $filename = getDownloadFilename($artist, $title, 'mp3');
    if ($action === 'prepare') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'ready' => true,
            'title' => $title,
            'artist' => $artist,
            'filename' => $filename,
            'file_size' => filesize($cachedMp3),
            'download_url' => "api/endpoints/download.php?youtube_id=" . urlencode($youtubeId) . "&title=" . urlencode($title) . "&artist=" . urlencode($artist)
        ]);
        exit;
    }

    header('Content-Type: audio/mpeg');
    header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
    header('Content-Length: ' . filesize($cachedMp3));
    header('Cache-Control: public, max-age=86400');
    @readfile($cachedMp3);
    exit;
}

// Attempt 2: Direct M4A download without ffmpeg conversion
$cmdM4a = "{$pythonPath} -m yt_dlp {$jsArg} -f \"ba[ext=m4a]/ba\" -o \"{$outputTemplate}\" \"{$ytUrl}\" 2>&1";
@exec($cmdM4a, $outputLog2, $returnCode2);

if (file_exists($cachedM4a) && filesize($cachedM4a) > 10000) {
    $filename = getDownloadFilename($artist, $title, 'm4a');
    if ($action === 'prepare') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'ready' => true,
            'title' => $title,
            'artist' => $artist,
            'filename' => $filename,
            'file_size' => filesize($cachedM4a),
            'download_url' => "api/endpoints/download.php?youtube_id=" . urlencode($youtubeId) . "&title=" . urlencode($title) . "&artist=" . urlencode($artist)
        ]);
        exit;
    }

    header('Content-Type: audio/mp4');
    header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
    header('Content-Length: ' . filesize($cachedM4a));
    header('Cache-Control: public, max-age=86400');
    @readfile($cachedM4a);
    exit;
}

// Attempt 3: Direct Stream URL resolution as fallback
$cmdUrl = "{$pythonPath} -m yt_dlp {$jsArg} -f \"ba\" -g \"{$ytUrl}\" 2>&1";
@exec($cmdUrl, $streamUrls, $code3);
$directStreamUrl = '';
foreach ($streamUrls as $line) {
    if (strpos($line, 'http') === 0) {
        $directStreamUrl = trim($line);
        break;
    }
}

if (!empty($directStreamUrl)) {
    if ($action === 'prepare') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'ready' => true,
            'fallback_stream' => true,
            'title' => $title,
            'artist' => $artist,
            'filename' => getDownloadFilename($artist, $title, 'm4a'),
            'download_url' => $directStreamUrl
        ]);
        exit;
    }

    // Stream remote file directly through PHP with Content-Disposition
    $filename = getDownloadFilename($artist, $title, 'm4a');
    header('Content-Type: audio/mp4');
    header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
    @readfile($directStreamUrl);
    exit;
}

// If all failed
if ($action === 'prepare') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Không thể tải bài hát này từ YouTube Music lúc này. Vui lòng thử lại sau.'
    ]);
    exit;
}

http_response_code(500);
die('Không thể tải bài hát này từ YouTube Music lúc này.');
