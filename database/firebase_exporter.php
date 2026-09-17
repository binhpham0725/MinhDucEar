<?php
/**
 * Firebase Firestore JSON Exporter & Bridge Tool
 * Exports current MySQL data from XAMPP into Firestore-ready JSON documents.
 * Full per-account data coverage:
 *  - users/{uid}
 *  - users/{uid}/favorites/{track_id}
 *  - users/{uid}/history/{history_id}
 *  - users/{uid}/saved_albums/{album_id}
 *  - users/{uid}/music_taste/{genre}
 *  - playlists/{playlist_id}
 *  - tracks/{track_id}
 *  - albums/{album_id}
 */
require_once __DIR__ . '/../config/database.php';

$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
}

$db = Database::getInstance();
if (!$db->isConnected()) {
    $err = ['success' => false, 'message' => 'MySQL is not connected.'];
    echo $isCli ? "Error: MySQL not connected.\n" : json_encode($err);
    exit;
}

$pdo = $db->getConnection();
$exportDir = __DIR__ . '/firebase_exports';
if (!is_dir($exportDir)) {
    mkdir($exportDir, 0777, true);
}

// -------------------------------------------------------------
// 1. Export Users Collection & Their Isolated Per-Account Data
// -------------------------------------------------------------
$usersStmt = $pdo->query("SELECT id, uuid, firebase_uid, username, email, display_name, role, avatar_url, listening_hours, music_taste, metadata, created_at FROM users WHERE is_deleted = 0");
$usersRows = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

$firestoreUsers = [];
foreach ($usersRows as $u) {
    $uId = (int)$u['id'];
    $docId = !empty($u['firebase_uid']) ? $u['firebase_uid'] : $u['uuid'];

    // 1a. Favorites for this specific user
    $favStmt = $pdo->prepare("SELECT t.uuid, f.created_at FROM favorites f JOIN tracks t ON f.track_id = t.id WHERE f.user_id = ? ORDER BY f.created_at DESC");
    $favStmt->execute([$uId]);
    $favorites = $favStmt->fetchAll(PDO::FETCH_ASSOC);

    // 1b. History for this specific user
    $histStmt = $pdo->prepare("SELECT h.uuid, t.uuid as track_uuid, h.duration_played, h.played_at FROM history h JOIN tracks t ON h.track_id = t.id WHERE h.user_id = ? ORDER BY h.played_at DESC LIMIT 50");
    $histStmt->execute([$uId]);
    $history = $histStmt->fetchAll(PDO::FETCH_ASSOC);

    // 1c. Saved Albums for this specific user
    $albStmt = $pdo->prepare("SELECT a.uuid, usa.saved_at FROM user_saved_albums usa JOIN albums a ON usa.album_id = a.id WHERE usa.user_id = ?");
    $albStmt->execute([$uId]);
    $savedAlbums = $albStmt->fetchAll(PDO::FETCH_ASSOC);

    // 1d. Music Taste Preferences for this specific user
    $tasteStmt = $pdo->prepare("SELECT genre, score, play_count, last_listened_at FROM user_music_taste WHERE user_id = ? ORDER BY score DESC");
    $tasteStmt->execute([$uId]);
    $musicTasteList = $tasteStmt->fetchAll(PDO::FETCH_ASSOC);

    // 1e. Weekly Stats for this user
    $weekStmt = $pdo->prepare("SELECT year, week_number, start_date, end_date, total_seconds, total_hours, tracks_count, daily_seconds, top_genres FROM user_weekly_stats WHERE user_id = ? ORDER BY year DESC, week_number DESC LIMIT 8");
    $weekStmt->execute([$uId]);
    $weeklyStats = $weekStmt->fetchAll(PDO::FETCH_ASSOC);

    // 1f. Daily Stats for this user (past 14 days)
    $dayStmt = $pdo->prepare("SELECT stat_date, day_of_week, listening_seconds, tracks_count, genres_breakdown FROM user_daily_stats WHERE user_id = ? ORDER BY stat_date DESC LIMIT 14");
    $dayStmt->execute([$uId]);
    $dailyStats = $dayStmt->fetchAll(PDO::FETCH_ASSOC);

    $firestoreUsers[$docId] = [
        'id' => $uId,
        'uuid' => $u['uuid'],
        'firebaseUid' => $u['firebase_uid'],
        'username' => $u['username'],
        'email' => $u['email'],
        'displayName' => $u['display_name'],
        'role' => $u['role'],
        'photoURL' => $u['avatar_url'],
        'listeningHours' => (float)$u['listening_hours'],
        'totalListeningSeconds' => (int)($u['total_listening_seconds'] ?? 0),
        'musicTasteTags' => $u['music_taste'] ? explode(',', $u['music_taste']) : [],
        'detailedMusicTaste' => $musicTasteList,
        'metadata' => $u['metadata'] ? json_decode($u['metadata'], true) : new stdClass(),
        'subcollections' => [
            'favorites' => $favorites,
            'history' => $history,
            'savedAlbums' => $savedAlbums,
            'weeklyStats' => $weeklyStats,
            'dailyStats' => $dailyStats
        ],
        'createdAt' => $u['created_at']
    ];
}
file_put_contents($exportDir . '/users.json', json_encode($firestoreUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// -------------------------------------------------------------
// 2. Export Tracks Collection -> /tracks/{track_uuid}
// -------------------------------------------------------------
$tracksStmt = $pdo->query("SELECT id, uuid, firebase_id, title, artist, album, genre, duration, format, cover_url, audio_url, storage_path, source_type, youtube_id, views_count, likes_count, is_featured, lyrics, metadata, created_at FROM tracks WHERE is_deleted = 0");
$tracksRows = $tracksStmt->fetchAll(PDO::FETCH_ASSOC);

$firestoreTracks = [];
foreach ($tracksRows as $t) {
    $docId = $t['uuid'];
    $firestoreTracks[$docId] = [
        'id' => (int)$t['id'],
        'uuid' => $t['uuid'],
        'title' => $t['title'],
        'artist' => $t['artist'],
        'album' => $t['album'],
        'genre' => $t['genre'] ?? 'Chill',
        'duration' => (int)$t['duration'],
        'format' => $t['format'],
        'coverUrl' => $t['cover_url'],
        'audioUrl' => $t['audio_url'] ?? '',
        'storagePath' => $t['storage_path'] ?? '',
        'sourceType' => $t['source_type'],
        'youtubeId' => $t['youtube_id'],
        'viewsCount' => (int)$t['views_count'],
        'likesCount' => (int)$t['likes_count'],
        'isFeatured' => (bool)$t['is_featured'],
        'hasLyrics' => !empty($t['lyrics']),
        'metadata' => $t['metadata'] ? json_decode($t['metadata'], true) : new stdClass(),
        'createdAt' => $t['created_at']
    ];
}
file_put_contents($exportDir . '/tracks.json', json_encode($firestoreTracks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// -------------------------------------------------------------
// 3. Export Playlists Collection -> /playlists/{playlist_uuid}
// -------------------------------------------------------------
$plStmt = $pdo->query("SELECT p.id, p.uuid, p.name, p.description, p.cover_url, p.is_public, p.created_at, u.uuid as user_uuid, u.firebase_uid 
                       FROM playlists p 
                       JOIN users u ON p.user_id = u.id 
                       WHERE p.is_deleted = 0");
$plRows = $plStmt->fetchAll(PDO::FETCH_ASSOC);

$firestorePlaylists = [];
foreach ($plRows as $pl) {
    $trStmt = $pdo->prepare("SELECT t.uuid, pt.position FROM playlist_tracks pt JOIN tracks t ON pt.track_id = t.id WHERE pt.playlist_id = ? ORDER BY pt.position ASC");
    $trStmt->execute([$pl['id']]);
    $trackUuids = $trStmt->fetchAll(PDO::FETCH_COLUMN);

    $docId = $pl['uuid'];
    $firestorePlaylists[$docId] = [
        'id' => (int)$pl['id'],
        'uuid' => $pl['uuid'],
        'name' => $pl['name'],
        'description' => $pl['description'],
        'coverUrl' => $pl['cover_url'],
        'isPublic' => (bool)$pl['is_public'],
        'ownerUid' => !empty($pl['firebase_uid']) ? $pl['firebase_uid'] : $pl['user_uuid'],
        'trackUuids' => $trackUuids,
        'tracksCount' => count($trackUuids),
        'createdAt' => $pl['created_at']
    ];
}
file_put_contents($exportDir . '/playlists.json', json_encode($firestorePlaylists, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// -------------------------------------------------------------
// 3b. Export Albums Collection -> /albums/{album_uuid}
// -------------------------------------------------------------
$albStmt = $pdo->query("SELECT id, uuid, title, artist, cover_url, year, badge, genre, description, is_public, created_at FROM albums WHERE is_deleted = 0");
$albRows = $albStmt ? $albStmt->fetchAll(PDO::FETCH_ASSOC) : [];
$firestoreAlbums = [];
foreach ($albRows as $a) {
    $docId = $a['uuid'];
    $firestoreAlbums[$docId] = [
        'id' => (int)$a['id'],
        'uuid' => $a['uuid'],
        'title' => $a['title'],
        'artist' => $a['artist'],
        'coverUrl' => $a['cover_url'],
        'year' => (int)($a['year'] ?? 2026),
        'badge' => $a['badge'] ?? 'ALBUM',
        'genre' => $a['genre'] ?? 'Chill',
        'description' => $a['description'] ?? '',
        'isPublic' => (bool)($a['is_public'] ?? true),
        'createdAt' => $a['created_at']
    ];
}
file_put_contents($exportDir . '/albums.json', json_encode($firestoreAlbums, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// -------------------------------------------------------------
// 4. Output Summary
// -------------------------------------------------------------
$summary = [
    'success' => true,
    'message' => 'Export to Firebase Firestore JSON completed successfully!',
    'export_directory' => realpath($exportDir),
    'counts' => [
        'users' => count($firestoreUsers),
        'tracks' => count($firestoreTracks),
        'playlists' => count($firestorePlaylists)
    ],
    'files' => [
        'users.json' => filesize($exportDir . '/users.json') . ' bytes',
        'tracks.json' => filesize($exportDir . '/tracks.json') . ' bytes',
        'playlists.json' => filesize($exportDir . '/playlists.json') . ' bytes'
    ]
];

if ($isCli) {
    echo "🎉 Firebase Firestore JSON Export Finished!\n";
    echo "📁 Export Folder: " . realpath($exportDir) . "\n";
    echo "📊 Summary:\n";
    echo "  - Users: " . count($firestoreUsers) . " documents (With subcollections: Favorites, History, Saved Albums, Music Taste)\n";
    echo "  - Tracks: " . count($firestoreTracks) . " documents\n";
    echo "  - Playlists: " . count($firestorePlaylists) . " documents\n";
    echo "🚀 Tất cả 5 mục (Ưa thích, Lịch sử, Album, Playlist, Gu âm nhạc) đã được phân tách và liên kết chính xác cho riêng từng tài khoản.\n";
} else {
    echo json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
