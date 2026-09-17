<?php
/**
 * Audio Binary Streamer from MySQL Database
 * Streams raw binary audio stored in tracks.audio_blob
 */
require_once __DIR__ . '/../../config/database.php';

$action = $_GET['action'] ?? '';
if ($action === 'fallback') {
    $fallbackUrl = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';
    header('Content-Type: audio/mpeg');
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=86400');
    @readfile($fallbackUrl);
    exit;
}

$id = intval($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(404);
    die('Track not specified');
}

$db = Database::getInstance();
$pdo = $db->getConnection();

if (!$pdo) {
    http_response_code(500);
    die('Database connection error');
}

$stmt = $pdo->prepare("SELECT audio_blob, audio_mime, audio_size FROM tracks WHERE id = ?");
$stmt->execute([$id]);
$track = $stmt->fetch();

if (!$track || empty($track['audio_blob'])) {
    http_response_code(404);
    die('Audio not found in database');
}

$content = $track['audio_blob'];
$mime = $track['audio_mime'] ?: 'audio/mpeg';
$size = strlen($content);

header('Content-Type: ' . $mime);
header('Content-Length: ' . $size);
header('Accept-Ranges: bytes');
header('Cache-Control: public, max-age=31536000');

echo $content;
exit;
