<?php
/**
 * Lyrics API Endpoint
 * Serves lyrics from DB or queries Musixmatch API
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../external/musixmatch.php';

$trackId = intval($_GET['id'] ?? $_GET['track_id'] ?? 0);
$title = trim($_GET['title'] ?? '');
$artist = trim($_GET['artist'] ?? '');
$duration = floatval($_GET['duration'] ?? 0);

$db = Database::getInstance();
$pdo = $db->getConnection();

// 1. If trackId provided or title/artist, check DB first
if ($pdo) {
    $row = null;
    if ($trackId > 0) {
        $stmt = $pdo->prepare("SELECT id, title, artist, lyrics FROM tracks WHERE id = ?");
        $stmt->execute([$trackId]);
        $row = $stmt->fetch();
    } elseif (!empty($title)) {
        $stmt = $pdo->prepare("SELECT id, title, artist, lyrics FROM tracks WHERE title = ? LIMIT 1");
        $stmt->execute([$title]);
        $row = $stmt->fetch();
    }

    if ($row && !empty($row['lyrics'])) {
        // If DB has obsolete rhythmic filler, simplify to single title line
        if (strpos($row['lyrics'], 'MinhDucEar - Tr') !== false || strpos($row['lyrics'], 'Âm thanh mở đầu') !== false) {
            $row['lyrics'] = "[00:00.00] " . $row['title'];
            try {
                $upStmt = $pdo->prepare("UPDATE tracks SET lyrics = ? WHERE id = ?");
                $upStmt->execute([$row['lyrics'], $row['id']]);
            } catch (Exception $e) {}
        }
        $isSynced = (strpos($row['lyrics'], '[00:') !== false || strpos($row['lyrics'], '[01:') !== false);
        echo json_encode([
            'success' => true,
            'source' => 'database',
            'title' => $row['title'],
            'artist' => $row['artist'],
            'lyrics' => $row['lyrics'],
            'is_synced' => $isSynced
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($row) {
        $trackId = intval($row['id']);
        if (empty($title)) $title = $row['title'];
        if (empty($artist)) $artist = $row['artist'];
    }
}

// 2. Fetch from Multi-Source (LRCLIB + Musixmatch + Curated fallback)
$result = MusixmatchService::getLyrics($title, $artist, $duration);

// 3. Cache in DB if track exists
if ($pdo && $trackId > 0 && !empty($result['lyrics'])) {
    try {
        $stmt = $pdo->prepare("UPDATE tracks SET lyrics = ? WHERE id = ?");
        $stmt->execute([$result['lyrics'], $trackId]);
    } catch (Exception $e) {
        // Silent error on cache
    }
}

echo json_encode([
    'success' => true,
    'source' => $result['source'],
    'title' => $title,
    'artist' => $artist,
    'lyrics' => $result['lyrics'],
    'is_synced' => $result['is_synced']
], JSON_UNESCAPED_UNICODE);

