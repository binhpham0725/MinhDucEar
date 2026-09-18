<?php
/**
 * Playlists & Favorites API Endpoint
 */
session_start();
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

$rawJsonInput = json_decode(file_get_contents('php://input'), true);
if (is_array($rawJsonInput)) {
    $_REQUEST = array_merge($_REQUEST, $rawJsonInput);
}

$action = $_GET['action'] ?? $_POST['action'] ?? $_REQUEST['action'] ?? 'list';
$db = Database::getInstance();
$pdo = $db->getConnection();
$userId = $_SESSION['user']['id'] ?? null;
$rawUser = trim($_GET['user_id'] ?? $_POST['user_id'] ?? $_REQUEST['user_id'] ?? '');
if (!$userId && !empty($rawUser)) {
    if (is_numeric($rawUser)) {
        $userId = (int)$rawUser;
    } else if ($pdo) {
        $cleanEmail = strtolower($rawUser);
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ? OR REPLACE(REPLACE(LOWER(email), '@', '_'), '.', '_') = ? OR google_id = ? OR uuid = ? LIMIT 1");
        $stmt->execute([$rawUser, $rawUser, $cleanEmail, $rawUser, $rawUser]);
        $found = $stmt->fetchColumn();
        if ($found) $userId = (int)$found;
    }
}

if ($action === 'favorite_albums_list') {
    if (!$userId || !$pdo) {
        echo json_encode(['success' => true, 'albums' => [], 'total' => 0]);
        exit;
    }
    $stmt = $pdo->prepare("
        SELECT a.id, a.uuid, a.title, a.artist, a.cover_url as cover, a.year, a.badge, a.genre as tag, a.description, usa.saved_at
        FROM user_saved_albums usa
        JOIN albums a ON usa.album_id = a.id
        WHERE usa.user_id = ?
        ORDER BY usa.saved_at DESC
    ");
    $stmt->execute([$userId]);
    $albums = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'albums' => $albums, 'total' => count($albums)]);
    exit;
}

if ($action === 'favorites_list') {
    if (!$userId || !$pdo) {
        echo json_encode(['success' => true, 'favorites' => [], 'total' => 0]);
        exit;
    }
    $limit = intval($_GET['limit'] ?? 0);
    $offset = max(0, intval($_GET['offset'] ?? 0));
    if ($pdo) {
        if ($limit > 0) {
            $stmt = $pdo->prepare("SELECT t.* FROM favorites f JOIN tracks t ON f.track_id = t.id WHERE f.user_id = ? ORDER BY f.created_at DESC LIMIT ? OFFSET ?");
            $stmt->bindValue(1, $userId, PDO::PARAM_INT);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->bindValue(3, $offset, PDO::PARAM_INT);
            $stmt->execute();
            $tracks = $stmt->fetchAll();

            $totalStmt = $pdo->prepare("SELECT COUNT(*) FROM favorites WHERE user_id = ?");
            $totalStmt->execute([$userId]);
            $total = (int)$totalStmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'favorites' => $tracks,
                'total' => $total,
                'offset' => $offset,
                'limit' => $limit,
                'has_more' => ($offset + count($tracks)) < $total
            ]);
        } else {
            $stmt = $pdo->prepare("SELECT t.* FROM favorites f JOIN tracks t ON f.track_id = t.id WHERE f.user_id = ? ORDER BY f.created_at DESC");
            $stmt->execute([$userId]);
            $tracks = $stmt->fetchAll();
            echo json_encode(['success' => true, 'favorites' => $tracks, 'total' => count($tracks)]);
        }
    } else {
        echo json_encode(['success' => true, 'favorites' => [], 'total' => 0]);
    }
    exit;
}

if ($action === 'favorite_remove') {
    $rawId = $_REQUEST['track_id'] ?? '';
    $trackId = is_numeric($rawId) ? intval($rawId) : 0;
    $ytId = trim($_REQUEST['youtube_id'] ?? '');

    if (!$userId) {
        $userId = 7; // Fallback to current primary user
    }

    if ($trackId <= 0 && !empty($ytId) && $pdo) {
        $chk = $pdo->prepare("SELECT id FROM tracks WHERE youtube_id = ?");
        $chk->execute([$ytId]);
        $existingId = $chk->fetchColumn();
        if ($existingId) {
            $trackId = (int)$existingId;
        }
    }

    if ($pdo && ($trackId > 0 || !empty($ytId))) {
        $del = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND (track_id = ? OR track_id IN (SELECT id FROM tracks WHERE youtube_id = ?))");
        $del->execute([$userId, $trackId, $ytId]);
        echo json_encode([
            'success' => true,
            'is_favorite' => false,
            'track_id' => $trackId,
            'message' => 'Đã xóa khỏi danh sách yêu thích!'
        ]);
        exit;
    }

    echo json_encode(['success' => true, 'is_favorite' => false, 'message' => 'Đã xóa khỏi danh sách yêu thích!']);
    exit;
}

if ($action === 'favorite_toggle') {
    if (!$userId) {
        echo json_encode(['success' => false, 'auth_required' => true, 'message' => 'Vui lòng đăng nhập để lưu bài hát yêu thích!']);
        exit;
    }
    $rawId = $_POST['track_id'] ?? $_GET['track_id'] ?? '';
    $trackId = is_numeric($rawId) ? intval($rawId) : 0;
    $ytId = trim($_POST['youtube_id'] ?? $_GET['youtube_id'] ?? '');
    $title = trim($_POST['title'] ?? $_GET['title'] ?? '');
    $artist = trim($_POST['artist'] ?? $_GET['artist'] ?? '');
    $cover = trim($_POST['cover_url'] ?? $_GET['cover_url'] ?? '');
    $duration = intval($_POST['duration'] ?? $_GET['duration'] ?? 210);

    if (empty($ytId) && is_string($rawId) && strpos($rawId, 'yt_') === 0) {
        $ytId = substr($rawId, 3);
    }

    if ($pdo) {
        // If trackId not found but YouTube ID is present, find or create track record
        if ($trackId <= 0 && !empty($ytId)) {
            $chk = $pdo->prepare("SELECT id FROM tracks WHERE youtube_id = ?");
            $chk->execute([$ytId]);
            $existingId = $chk->fetchColumn();
            if ($existingId) {
                $trackId = (int)$existingId;
            } else {
                $ins = $pdo->prepare("INSERT INTO tracks (title, artist, album, duration, format, cover_url, source_type, youtube_id, views_count, is_featured) 
                    VALUES (?, ?, 'YouTube Music', ?, 'YT AUDIO 320k', ?, 'youtube', ?, 1500, 0)");
                $ins->execute([
                    $title ?: 'YouTube Music Track',
                    $artist ?: 'YouTube Music',
                    $duration ?: 210,
                    $cover ?: "https://i.ytimg.com/vi/{$ytId}/hqdefault.jpg",
                    $ytId
                ]);
                $trackId = (int)$pdo->lastInsertId();
            }
        }

        if ($trackId > 0) {
            $check = $pdo->prepare("SELECT COUNT(*) FROM favorites WHERE user_id = ? AND track_id = ?");
            $check->execute([$userId, $trackId]);
            $isFav = $check->fetchColumn() > 0;

            if ($isFav) {
                $del = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND track_id = ?");
                $del->execute([$userId, $trackId]);
                echo json_encode([
                    'success' => true,
                    'is_favorite' => false,
                    'track_id' => $trackId,
                    'message' => 'Đã xóa khỏi danh sách yêu thích!'
                ]);
            } else {
                $ins = $pdo->prepare("INSERT INTO favorites (user_id, track_id) VALUES (?, ?)");
                $ins->execute([$userId, $trackId]);
                echo json_encode([
                    'success' => true,
                    'is_favorite' => true,
                    'track_id' => $trackId,
                    'message' => 'Đã thêm vào danh sách yêu thích!'
                ]);
            }
            exit;
        }
    }

    echo json_encode(['success' => true, 'is_favorite' => true, 'message' => 'Đã cập nhật yêu thích (Local)!']);
    exit;
}

if ($action === 'album_favorite_toggle') {
    if (!$userId) {
        echo json_encode(['success' => false, 'auth_required' => true, 'message' => 'Vui lòng đăng nhập để lưu album yêu thích!']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $title = trim($input['title'] ?? '');
    $artist = trim($input['artist'] ?? '');
    $cover = trim($input['cover'] ?? $input['cover_url'] ?? '');
    $year = trim($input['year'] ?? '2026');
    $badge = trim($input['badge'] ?? 'FLAC 96k');
    $albumId = intval($input['album_id'] ?? 0);

    if ($albumId <= 0 && !empty($title)) {
        $chk = $pdo->prepare("SELECT id FROM albums WHERE title = ?");
        $chk->execute([$title]);
        $existingId = $chk->fetchColumn();
        if ($existingId) {
            $albumId = (int)$existingId;
        } else {
            $aUuid = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4));
            $ins = $pdo->prepare("INSERT INTO albums (uuid, title, artist, cover_url, year, badge, is_public) VALUES (?, ?, ?, ?, ?, ?, 1)");
            $ins->execute([$aUuid, $title, $artist ?: 'Various Artists', $cover, $year, $badge]);
            $albumId = (int)$pdo->lastInsertId();
        }
    }

    if ($albumId > 0) {
        $check = $pdo->prepare("SELECT COUNT(*) FROM user_saved_albums WHERE user_id = ? AND album_id = ?");
        $check->execute([$userId, $albumId]);
        $isFav = $check->fetchColumn() > 0;

        if ($isFav) {
            $del = $pdo->prepare("DELETE FROM user_saved_albums WHERE user_id = ? AND album_id = ?");
            $del->execute([$userId, $albumId]);
            echo json_encode([
                'success' => true,
                'is_favorite' => false,
                'album_id' => $albumId,
                'message' => 'Đã xóa album khỏi danh sách yêu thích!'
            ]);
        } else {
            $ins = $pdo->prepare("INSERT INTO user_saved_albums (user_id, album_id) VALUES (?, ?)");
            $ins->execute([$userId, $albumId]);
            echo json_encode([
                'success' => true,
                'is_favorite' => true,
                'album_id' => $albumId,
                'message' => 'Đã thêm album vào danh sách yêu thích!'
            ]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Không tìm thấy thông tin album!']);
    exit;
}

if ($action === 'playlists_list') {
    $playlists = [];
    $rawUserInput = trim($_GET['user_id'] ?? $_POST['user_id'] ?? $_REQUEST['user_id'] ?? '');
    if (!$userId && !empty($rawUserInput)) {
        if (is_numeric($rawUserInput)) {
            $userId = (int)$rawUserInput;
        } else if ($pdo) {
            $cleanEmail = strtolower($rawUserInput);
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ? OR REPLACE(REPLACE(LOWER(email), '@', '_'), '.', '_') = ? OR google_id = ? OR uuid = ? LIMIT 1");
            $stmt->execute([$rawUserInput, $rawUserInput, $cleanEmail, $rawUserInput, $rawUserInput]);
            $found = $stmt->fetchColumn();
            if ($found) $userId = (int)$found;
        }
    }

    if ($pdo) {
        $conditions = [];
        $params = [];
        if ($userId) {
            $conditions[] = "p.user_id = ?";
            $params[] = $userId;
        }
        if (!empty($rawUserInput)) {
            $conditions[] = "p.owner_uid = ?";
            $params[] = $rawUserInput;
        }

        if (!empty($conditions)) {
            $sqlWhere = implode(' OR ', $conditions);
            $stmt = $pdo->prepare("SELECT p.*, 0 as is_curated, COUNT(pt.track_id) as total_tracks FROM playlists p LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id WHERE ($sqlWhere) AND (p.is_deleted IS NULL OR p.is_deleted = 0) GROUP BY p.id ORDER BY p.created_at DESC");
            $stmt->execute($params);
            $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        // If user has no custom playlists, include public playlists as fallback
        if (empty($playlists)) {
            $stmt = $pdo->query("SELECT p.*, 1 as is_curated, COUNT(pt.track_id) as total_tracks FROM playlists p LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id WHERE p.is_public = 1 AND (p.is_deleted IS NULL OR p.is_deleted = 0) GROUP BY p.id ORDER BY p.created_at DESC LIMIT 10");
            $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    echo json_encode(['success' => true, 'playlists' => $playlists]);
    exit;
}

if ($action === 'playlist_create') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $rawUserInput = trim($input['user_id'] ?? $_GET['user_id'] ?? $_POST['user_id'] ?? '');
    $ownerUid = trim($input['owner_uid'] ?? $input['uid'] ?? $rawUserInput);

    // If userId not yet resolved from session, check rawUserInput
    if (!$userId && !empty($rawUserInput)) {
        if (is_numeric($rawUserInput)) {
            $userId = (int)$rawUserInput;
        } else if ($pdo) {
            $cleanEmail = strtolower($rawUserInput);
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ? OR REPLACE(REPLACE(LOWER(email), '@', '_'), '.', '_') = ? OR google_id = ? OR uuid = ? LIMIT 1");
            $stmt->execute([$rawUserInput, $rawUserInput, $cleanEmail, $rawUserInput, $rawUserInput]);
            $found = $stmt->fetchColumn();
            if ($found) $userId = (int)$found;
        }
    }

    $effectiveUserId = $userId ?: 1;
    // Verify that $effectiveUserId actually exists in users table to prevent FK constraint failure
    if ($pdo) {
        $chkUser = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $chkUser->execute([$effectiveUserId]);
        if (!$chkUser->fetchColumn()) {
            $firstUser = $pdo->query("SELECT id FROM users ORDER BY id ASC LIMIT 1")->fetchColumn();
            $effectiveUserId = $firstUser ? (int)$firstUser : 1;
        }
    }

    $name = trim($input['name'] ?? '');
    $desc = trim($input['description'] ?? '');
    $cover = trim($input['cover_url'] ?? '');
    if (empty($cover)) {
        $cover = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=60';
    }

    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Tên playlist không được để trống!']);
        exit;
    }

    if ($pdo) {
        try {
            $uuid = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4));
            $stmt = $pdo->prepare("INSERT INTO playlists (user_id, owner_uid, uuid, name, description, cover_url, is_public) VALUES (?, ?, ?, ?, ?, ?, 1)");
            $stmt->execute([$effectiveUserId, $ownerUid ?: null, $uuid, $name, $desc, $cover]);
            $newId = (int)$pdo->lastInsertId();
            echo json_encode([
                'success' => true,
                'id' => $newId,
                'uuid' => $uuid,
                'name' => $name,
                'description' => $desc,
                'cover_url' => $cover,
                'user_id' => $effectiveUserId,
                'owner_uid' => $ownerUid,
                'message' => 'Đã tạo playlist thành công!'
            ]);
            exit;
        } catch (Exception $e) {
            error_log('[playlists.php] Create playlist error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Lỗi lưu playlist: ' . $e->getMessage()]);
            exit;
        }
    }

    echo json_encode(['success' => false, 'message' => 'Lỗi kết nối cơ sở dữ liệu!']);
    exit;
}

if ($action === 'playlist_update') {
    if (!$userId) {
        echo json_encode(['success' => false, 'auth_required' => true, 'message' => 'Vui lòng đăng nhập!']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $plId = intval($input['id'] ?? 0);
    $name = trim($input['name'] ?? '');
    $desc = trim($input['description'] ?? '');
    $cover = trim($input['cover_url'] ?? '');

    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Tên playlist không được để trống!']);
        exit;
    }

    if ($pdo && $plId > 0) {
        $chk = $pdo->prepare("SELECT id FROM playlists WHERE id = ? AND user_id = ?");
        $chk->execute([$plId, $userId]);
        if (!$chk->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Playlist không tồn tại!']);
            exit;
        }

        if (!empty($cover)) {
            $stmt = $pdo->prepare("UPDATE playlists SET name = ?, description = ?, cover_url = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$name, $desc, $cover, $plId, $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE playlists SET name = ?, description = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$name, $desc, $plId, $userId]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Cập nhật playlist thành công!',
            'playlist' => [
                'id' => $plId,
                'name' => $name,
                'description' => $desc,
                'cover_url' => $cover
            ]
        ]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ!']);
    exit;
}

if ($action === 'playlist_delete') {
    $input = $_REQUEST;
    $rawId = trim($input['id'] ?? $input['uuid'] ?? '');
    $plId = is_numeric($rawId) ? intval($rawId) : 0;
    $name = trim($input['name'] ?? '');

    if ($pdo && (!empty($rawId) || !empty($name))) {
        if ($plId <= 0 && !empty($rawId)) {
            $stmt = $pdo->prepare("SELECT id FROM playlists WHERE uuid = ? OR firebase_id = ? LIMIT 1");
            $stmt->execute([$rawId, $rawId]);
            $found = $stmt->fetchColumn();
            if ($found) $plId = (int)$found;
        }
        if ($plId <= 0 && !empty($name) && $userId) {
            $stmt = $pdo->prepare("SELECT id FROM playlists WHERE name = ? AND user_id = ? LIMIT 1");
            $stmt->execute([$name, $userId]);
            $found = $stmt->fetchColumn();
            if ($found) $plId = (int)$found;
        }

        if ($plId > 0) {
            $pdo->prepare("DELETE FROM playlist_tracks WHERE playlist_id = ?")->execute([$plId]);
            if ($userId) {
                $pdo->prepare("DELETE FROM playlists WHERE id = ? AND (user_id = ? OR user_id IS NULL OR user_id = 1)")->execute([$plId, $userId]);
            } else {
                $pdo->prepare("DELETE FROM playlists WHERE id = ?")->execute([$plId]);
            }
        } else if (!empty($rawId)) {
            $pdo->prepare("DELETE FROM playlists WHERE uuid = ? OR firebase_id = ?")->execute([$rawId, $rawId]);
        }

        echo json_encode([
            'success' => true,
            'id' => $rawId,
            'message' => 'Đã xóa playlist thành công!'
        ]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'ID playlist không hợp lệ!']);
    exit;
}

if ($action === 'playlist_tracks') {
    $plId = intval($_GET['id'] ?? $_POST['id'] ?? 0);
    if ($pdo && $plId > 0) {
        $stmt = $pdo->prepare("SELECT t.* FROM playlist_tracks pt JOIN tracks t ON pt.track_id = t.id WHERE pt.playlist_id = ? ORDER BY pt.added_at ASC");
        $stmt->execute([$plId]);
        $tracks = $stmt->fetchAll();
        echo json_encode(['success' => true, 'tracks' => $tracks]);
        exit;
    }
    echo json_encode(['success' => false, 'message' => 'Playlist không tồn tại!']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Hành động không hợp lệ!']);
