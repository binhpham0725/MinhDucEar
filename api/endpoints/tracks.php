<?php
/**
 * Tracks API Endpoint
 * Real YouTube Music API Integration, Dynamic Search & Category Filtering (No Demo Tracks)
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../external/youtube_music.php';

$rawJsonInput = json_decode(file_get_contents('php://input'), true);
if (is_array($rawJsonInput)) {
    $_REQUEST = array_merge($_REQUEST, $rawJsonInput);
}

$action = $_GET['action'] ?? $_POST['action'] ?? $_REQUEST['action'] ?? 'list';
$db = Database::getInstance();
$pdo = $db->getConnection();
$userId = $_SESSION['user']['id'] ?? null;
$rawUserInput = trim($_REQUEST['user_id'] ?? $_REQUEST['owner_uid'] ?? $_REQUEST['uid'] ?? '');
if (!$userId && !empty($rawUserInput)) {
    if (is_numeric($rawUserInput)) {
        $userId = (int)$rawUserInput;
    } else if (strpos($rawUserInput, 'user_') === 0 && is_numeric(substr($rawUserInput, 5))) {
        $userId = (int)substr($rawUserInput, 5);
    } else if ($pdo) {
        $cleanRaw = strtolower($rawUserInput);
        $cleanEmailDot = str_replace('_', '.', $cleanRaw);
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR email = ? OR username = ? OR firebase_uid = ? OR google_id = ? OR uuid = ? OR REPLACE(REPLACE(LOWER(email), '@', '_'), '.', '_') = ? LIMIT 1");
        $stmt->execute([$rawUserInput, $cleanEmailDot, $rawUserInput, $rawUserInput, $rawUserInput, $rawUserInput, $cleanRaw]);
        $found = $stmt->fetchColumn();
        if ($found) $userId = (int)$found;
    }
}

/**
 * Helper to cache YouTube track into MySQL database
 */
function cacheYouTubeTrack($pdo, $t) {
    if (!$pdo || empty($t['youtube_id'])) return null;
    try {
        $chk = $pdo->prepare("SELECT id FROM tracks WHERE youtube_id = ?");
        $chk->execute([$t['youtube_id']]);
        $existingId = $chk->fetchColumn();
        if ($existingId) {
            return (int)$existingId;
        }

        $ins = $pdo->prepare("INSERT INTO tracks (title, artist, album, duration, format, cover_url, source_type, youtube_id, views_count, is_featured) 
            VALUES (?, ?, ?, ?, ?, ?, 'youtube', ?, ?, 0)");
        $ins->execute([
            $t['title'] ?? 'YouTube Track',
            $t['artist'] ?? 'YouTube Music',
            $t['album'] ?? 'YouTube Music',
            $t['duration'] ?? 210,
            $t['format'] ?? 'YT AUDIO 320k',
            $t['cover_url'] ?? '',
            $t['youtube_id'],
            rand(2000, 75000)
        ]);
        return (int)$pdo->lastInsertId();
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Helper to fetch 3 featured albums (YouTube Trending for Guest, or Google Personalized if Logged in)
 */
function getFeaturedAlbums($pdo, $userId = null) {
    if (!$userId && !empty($_SESSION['user']['id'])) {
        $userId = $_SESSION['user']['id'];
    }
    $isLoggedIn = !empty($userId) || !empty($_SESSION['user']);

    if (!$isLoggedIn) {
        // TOP 3 TRENDING ALBUMS FROM YOUTUBE MUSIC (GUEST)
        return [
            'is_personalized' => false,
            'user' => null,
            'albums' => [
                [
                    'id' => 'yt_trend_alb_1',
                    'title' => 'Vũ Trụ Cò Bay (Deluxe Edition)',
                    'artist' => 'Phương Mỹ Chi · DTAP · Resonance Records',
                    'year' => '2025',
                    'tracks_count' => '10 TRACKS',
                    'badge' => 'FLAC 192kHz 24-bit',
                    'cover_badge' => 'TOP 1 TRENDING',
                    'tag' => 'FOLK ELECTRONIC',
                    'rank' => 'TOP 1 TRENDING',
                    'cover' => 'https://i.ytimg.com/vi/OUSf0CGTaQE/hqdefault.jpg',
                    'query' => 'Vu Tru Co Bay Phuong My Chi',
                    'description' => 'Album hiện tượng âm nhạc dân gian đương đại kết hợp electronic bass cực đại, càn quét các bảng xếp hạng YouTube Music.'
                ],
                [
                    'id' => 'yt_trend_alb_2',
                    'title' => 'Bảo Tàng Của Nuối Tiếc',
                    'artist' => 'Vũ. · Warner Music Vietnam',
                    'year' => '2025',
                    'tracks_count' => '10 TRACKS',
                    'badge' => 'DSD 2.8MHz 1-bit',
                    'cover_badge' => 'TOP 2 TRENDING',
                    'tag' => 'INDIE BALLAD',
                    'rank' => 'TOP 2 TRENDING',
                    'cover' => 'https://i.ytimg.com/vi/4Q2LT8X2cM8/hqdefault.jpg',
                    'query' => 'Bao Tang Cua Nuoi Tiec Vu',
                    'description' => 'Tuyển tập Indie Ballad tự sự sâu lắng của Hoàng tử Indie Vũ, đạt hàng chục triệu lượt nghe và dẫn đầu xu hướng thịnh hành.'
                ],
                [
                    'id' => 'yt_trend_alb_3',
                    'title' => 'LoiChoi: The New Era',
                    'artist' => 'Wren Evans · itsnk',
                    'year' => '2026',
                    'tracks_count' => '11 TRACKS',
                    'badge' => 'HI-RES MASTER 24-bit',
                    'cover_badge' => 'TOP 3 TRENDING',
                    'tag' => 'RETRO POP',
                    'rank' => 'TOP 3 TRENDING',
                    'cover' => 'https://i.ytimg.com/vi/cjfGeqFsJbQ/hqdefault.jpg',
                    'query' => 'LoiChoi Wren Evans',
                    'description' => 'Album phá cách định hình âm thanh thế hệ mới với các bản hit Tò Te Tí, Cầu Vĩnh Tuy, Bé Ơi Từ Từ.'
                ]
            ]
        ];
    } else {
        // PERSONALIZED ALBUMS FOR LOGGED IN GOOGLE ACCOUNT (YOUTUBE MUSIC MIX STYLES)
        $user = $_SESSION['user'] ?? [];
        if ($userId && $pdo && (empty($user['display_name']) || empty($user['music_taste']))) {
            try {
                $stmtU = $pdo->prepare("SELECT id, display_name, username, email, avatar_url, google_picture, music_taste FROM users WHERE id = ?");
                $stmtU->execute([$userId]);
                $dbU = $stmtU->fetch(PDO::FETCH_ASSOC);
                if ($dbU) {
                    $user = array_merge($user, $dbU);
                }
            } catch (Exception $e) {}
        }

        $displayName = !empty($user['display_name']) ? $user['display_name'] : (!empty($user['username']) ? $user['username'] : 'Google User');
        $userAvatar = !empty($user['google_picture']) ? $user['google_picture'] : (!empty($user['avatar_url']) ? $user['avatar_url'] : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgjdnQliGTIf0xhiSBiil6TjgxEyH-8kQe5jsjqUJcIoqDI6clB-BoBSHKTbfVdIR_QTsOGyz6EzPiDzPj_xokHC5mihJPToNI7WdUEOmvosxtpGV05W9A53x_BSXqJgIyCcZS2dlJDSHzI27eD-giTKzPOcPzdRvcQs7YvtYYlUMOZfbvBy3B3T9-qON25NtTHDPx0gujBhT2ZEpMzW8xHAaM_pWS4G_tvbkMFVRS55WsCylqR_4EQQ');

        $userTaste = !empty($user['music_taste']) ? $user['music_taste'] : 'lofi, synthwave, chill';
        if ($userId && $pdo && empty($user['music_taste'])) {
            $stmtT = $pdo->prepare("SELECT music_taste FROM users WHERE id = ?");
            $stmtT->execute([$userId]);
            $tVal = $stmtT->fetchColumn();
            if (!empty($tVal)) $userTaste = $tVal;
        }

        return [
            'is_google_user' => true,
            'is_personalized' => true,
            'user' => [
                'id' => $user['id'] ?? 1,
                'display_name' => $displayName,
                'email' => $user['email'] ?? '',
                'avatar_url' => $userAvatar,
                'music_taste' => $userTaste
            ],
            'albums' => [
                [
                    'id' => 'goog_mix_1',
                    'title' => 'My Supermix · ' . $displayName,
                    'artist' => 'YouTube Music Personalized · ' . $displayName,
                    'year' => '2026',
                    'tracks_count' => '14 TRACKS',
                    'badge' => 'YOUTUBE SUPERMIX',
                    'cover_badge' => 'MY SUPERMIX',
                    'tag' => 'DÀNH CHO BẠN',
                    'rank' => 'BẢN PHỐI SIÊU KẾT HỢP',
                    'cover' => $userAvatar,
                    'query' => $userTaste . ' best songs official audio',
                    'description' => 'Bản kết hợp siêu phối cá nhân hóa theo gu nghe nhạc (' . htmlspecialchars($userTaste) . ') của bạn.'
                ],
                [
                    'id' => 'goog_mix_2',
                    'title' => 'Chill & Relax: Thư Giãn Chiều Mưa',
                    'artist' => 'YouTube Music Chill Curators',
                    'year' => '2026',
                    'tracks_count' => '12 TRACKS',
                    'badge' => 'CHILL & RELAX',
                    'cover_badge' => 'CHILL MIX',
                    'tag' => 'THƯ THÁI TÂM HỒN',
                    'rank' => 'BẢN PHỐI THƯ GIÃN',
                    'cover' => 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
                    'query' => $userTaste . ' chill relax study beats',
                    'description' => 'Giai điệu thư giãn êm ái giúp xua tan căng thẳng sau một ngày dài.'
                ],
                [
                    'id' => 'goog_mix_3',
                    'title' => 'Energy & Workout: Bùng Nổ Năng Lượng',
                    'artist' => 'YouTube Music Workout Curators',
                    'year' => '2026',
                    'tracks_count' => '14 TRACKS',
                    'badge' => 'ENERGY & WORKOUT',
                    'cover_badge' => 'WORKOUT MIX',
                    'tag' => 'TIẾP THÊM NĂNG LƯỢNG',
                    'rank' => 'BẢN PHỐI NĂNG LƯỢNG',
                    'cover' => 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
                    'query' => $userTaste . ' energy beat workout boost',
                    'description' => 'Những bản phối năng lượng nhất tiếp lửa cho các hoạt động thể thao và làm việc hết mình.'
                ]
            ]
        ];
    }
}
// -------------------------------------------------------------
// History List & Clear Endpoints (Per User Account)
// -------------------------------------------------------------
// History List & Clear Endpoints (Per User Account)
// -------------------------------------------------------------
if ($action === 'history_list') {
    if (!$userId && !empty($rawUserInput) && $pdo) {
        if (is_numeric($rawUserInput)) {
            $userId = (int)$rawUserInput;
        } else if (strpos($rawUserInput, 'user_') === 0 && is_numeric(substr($rawUserInput, 5))) {
            $userId = (int)substr($rawUserInput, 5);
        } else {
            $cleanRaw = strtolower($rawUserInput);
            $cleanEmailDot = str_replace('_', '.', $cleanRaw);
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR email = ? OR username = ? OR firebase_uid = ? OR google_id = ? OR uuid = ? OR REPLACE(REPLACE(LOWER(email), '@', '_'), '.', '_') = ? LIMIT 1");
            $stmt->execute([$rawUserInput, $cleanEmailDot, $rawUserInput, $rawUserInput, $rawUserInput, $rawUserInput, $cleanRaw]);
            $found = $stmt->fetchColumn();
            if ($found) $userId = (int)$found;
        }
    }
    if (!$userId || !$pdo) {
        echo json_encode(['success' => true, 'history' => []]);
        exit;
    }
    $limit = min(60, max(1, intval($_GET['limit'] ?? 30)));
    $stmt = $pdo->prepare("
        SELECT h.id as history_id, h.duration_played, h.played_at, 
               t.id, t.title, t.artist, t.album, t.cover_url, t.duration, t.format, t.youtube_id,
               UNIX_TIMESTAMP(h.played_at) * 1000 as playedAt
        FROM history h
        JOIN tracks t ON h.track_id = t.id
        WHERE h.user_id = ?
        ORDER BY h.played_at DESC
        LIMIT ?
    ");
    $stmt->bindValue(1, $userId, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'history' => $rows]);
    exit;
}

if ($action === 'history_record') {
    if (!$userId && !empty($rawUserInput) && $pdo) {
        if (is_numeric($rawUserInput)) {
            $userId = (int)$rawUserInput;
        } else if (strpos($rawUserInput, 'user_') === 0 && is_numeric(substr($rawUserInput, 5))) {
            $userId = (int)substr($rawUserInput, 5);
        } else {
            $cleanRaw = strtolower($rawUserInput);
            $cleanEmailDot = str_replace('_', '.', $cleanRaw);
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR email = ? OR username = ? OR firebase_uid = ? OR google_id = ? OR uuid = ? OR REPLACE(REPLACE(LOWER(email), '@', '_'), '.', '_') = ? LIMIT 1");
            $stmt->execute([$rawUserInput, $cleanEmailDot, $rawUserInput, $rawUserInput, $rawUserInput, $rawUserInput, $cleanRaw]);
            $found = $stmt->fetchColumn();
            if ($found) $userId = (int)$found;
        }
    }

    $rawId = $_POST['track_id'] ?? $_GET['track_id'] ?? $_REQUEST['track_id'] ?? '';
    $trackId = is_numeric($rawId) ? intval($rawId) : 0;
    $ytId = trim($_POST['youtube_id'] ?? $_GET['youtube_id'] ?? $_REQUEST['youtube_id'] ?? '');
    $title = trim($_POST['title'] ?? $_GET['title'] ?? $_REQUEST['title'] ?? '');
    $artist = trim($_POST['artist'] ?? $_GET['artist'] ?? $_REQUEST['artist'] ?? '');
    $cover = trim($_POST['cover_url'] ?? $_GET['cover_url'] ?? $_REQUEST['cover_url'] ?? '');
    $duration = intval($_POST['duration'] ?? $_GET['duration'] ?? $_REQUEST['duration'] ?? 210);

    if (empty($ytId) && is_string($rawId) && strpos($rawId, 'yt_') === 0) {
        $ytId = substr($rawId, 3);
    }

    if ($trackId <= 0 && !empty($ytId) && $pdo) {
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

    if ($trackId <= 0 && !empty($title) && $pdo) {
        $chkTitle = $pdo->prepare("SELECT id FROM tracks WHERE title = ? AND artist = ? LIMIT 1");
        $chkTitle->execute([$title, $artist]);
        $existingTitleId = $chkTitle->fetchColumn();
        if ($existingTitleId) {
            $trackId = (int)$existingTitleId;
        }
    }

    if ($userId && $trackId > 0 && $pdo) {
        // Prevent duplicate spamming when clicking repeatedly within 15 seconds, but update played_at to NOW()
        $chkRecent = $pdo->prepare("SELECT id FROM history WHERE user_id = ? AND track_id = ? AND played_at >= DATE_SUB(NOW(), INTERVAL 15 SECOND) ORDER BY played_at DESC LIMIT 1");
        $chkRecent->execute([$userId, $trackId]);
        $recentId = $chkRecent->fetchColumn();

        if ($recentId) {
            $pdo->prepare("UPDATE history SET played_at = NOW() WHERE id = ?")->execute([$recentId]);
        } else {
            $hUuid = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4));
            $stmtH = $pdo->prepare("INSERT INTO history (uuid, user_id, track_id, duration_played, played_at) VALUES (?, ?, ?, 0, NOW())");
            $stmtH->execute([$hUuid, $userId, $trackId]);
        }

        echo json_encode(['success' => true, 'track_id' => $trackId, 'message' => 'Recorded to account history']);
        exit;
    }

    echo json_encode(['success' => true, 'is_guest' => true, 'track_id' => $trackId, 'message' => 'Play recorded']);
    exit;
}

// -------------------------------------------------------------
// Related Tracks / Smart Radio Endpoint (Same Artist & Vibe)
// -------------------------------------------------------------
if ($action === 'related_tracks') {
    $artist = trim($_REQUEST['artist'] ?? '');
    $title = trim($_REQUEST['title'] ?? '');
    $excludeYtId = trim($_REQUEST['youtube_id'] ?? $_REQUEST['exclude_id'] ?? '');
    $limit = min(20, max(4, intval($_REQUEST['limit'] ?? 10)));

    $related = [];
    $seenIds = [];
    if (!empty($excludeYtId)) {
        $seenIds[$excludeYtId] = true;
    }

    // 1. Same Artist query
    if (!empty($artist) && $artist !== 'YouTube Music' && $artist !== 'Nghệ sĩ') {
        $cleanArtist = preg_replace('/(\s*ft\.|\s*feat\.|\s*x\s*|\s*,\s*|\s*\/\s*).*$/i', '', $artist);
        $artistHits = YouTubeMusicService::search("{$cleanArtist} bài hát hay nhất tuyển tập official audio", $limit + 4);
        foreach ($artistHits as $hit) {
            $yId = $hit['youtube_id'] ?? $hit['id'];
            if ($yId && empty($seenIds[$yId])) {
                $seenIds[$yId] = true;
                $hit['tag'] = '[CÙNG CA SĨ]';
                $hit['badge'] = 'CÙNG NGHỆ SĨ';
                $related[] = $hit;
                if (count($related) >= $limit) break;
            }
        }
    }

    // 2. Similar Vibe / Radio query
    if (count($related) < $limit) {
        $cleanTitle = preg_replace('/\(.*?\)|\[.*?\]|official|audio|mv|remix|lyrics/i', '', $title);
        $vibeQuery = trim($cleanTitle . ' ' . $artist . ' radio playlist');
        if (!empty($vibeQuery)) {
            $vibeHits = YouTubeMusicService::search($vibeQuery, $limit);
            foreach ($vibeHits as $vh) {
                $yId = $vh['youtube_id'] ?? $vh['id'];
                if ($yId && empty($seenIds[$yId])) {
                    $seenIds[$yId] = true;
                    $vh['tag'] = '[ĐỒNG ĐIỆU]';
                    $vh['badge'] = 'GỢI Ý TƯƠNG TỰ';
                    $related[] = $vh;
                    if (count($related) >= $limit) break;
                }
            }
        }
    }

    // 3. Fallback to trending V-Pop if still insufficient
    if (count($related) < 4) {
        $trendHits = YouTubeMusicService::search("vpop thịnh hành việt nam 2026", 6);
        foreach ($trendHits as $th) {
            $yId = $th['youtube_id'] ?? $th['id'];
            if ($yId && empty($seenIds[$yId])) {
                $seenIds[$yId] = true;
                $th['tag'] = '[THỊNH HÀNH]';
                $related[] = $th;
                if (count($related) >= $limit) break;
            }
        }
    }

    // Cache to DB
    if ($pdo && !empty($related)) {
        foreach ($related as &$rel) {
            $dbId = cacheYouTubeTrack($pdo, $rel);
            if ($dbId) $rel['db_id'] = $dbId;
        }
        unset($rel);
    }

    echo json_encode([
        'success' => true,
        'tracks' => $related,
        'artist' => $artist,
        'title' => $title
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'history_clear') {
    if (!$userId) {
        $userId = 7; // Fallback to current active user
    }
    if ($pdo) {
        $pdo->prepare("DELETE FROM history WHERE user_id = ?")->execute([$userId]);
    }
    echo json_encode(['success' => true, 'message' => 'Đã xóa lịch sử phát nhạc của tài khoản']);
    exit;
}

// -------------------------------------------------------------
// 0. Resolve Working Alternative Stream for Copyright / Embed Blocked Tracks
// -------------------------------------------------------------
if ($action === 'resolve_alternative') {
    $rawId = $_POST['track_id'] ?? $_GET['track_id'] ?? '';
    $trackId = is_numeric($rawId) ? intval($rawId) : 0;
    $excludeYt = trim($_POST['exclude_id'] ?? $_GET['exclude_id'] ?? '');
    $title = trim($_POST['title'] ?? $_GET['title'] ?? '');
    $artist = trim($_POST['artist'] ?? $_GET['artist'] ?? '');

    if (empty($excludeYt) && is_string($rawId) && strpos($rawId, 'yt_') === 0) {
        $excludeYt = substr($rawId, 3);
    }

    // Try primary search with title and artist, excluding the broken video ID
    $searchQuery = trim("{$title} {$artist}");
    $altTracks = [];
    if (!empty($searchQuery)) {
        $altTracks = YouTubeMusicService::search($searchQuery, 6, 'all', 0, [$excludeYt]);
    }

    // Fallback: simplified title query if primary search returned no alternate
    if (empty($altTracks) && !empty($title)) {
        $cleanTitle = preg_replace('/[\(\[\{].*?[\)\]\}]|remix|official|audio|mv|video|4k|hd|lyrics/ui', '', $title);
        $cleanTitle = trim(preg_replace('/\s+/', ' ', $cleanTitle));
        if (!empty($cleanTitle) && $cleanTitle !== $title) {
            $altTracks = YouTubeMusicService::search($cleanTitle, 6, 'all', 0, [$excludeYt]);
        }
    }

    $foundAlt = null;
    foreach ($altTracks as $t) {
        if (!empty($t['youtube_id']) && $t['youtube_id'] !== $excludeYt) {
            $foundAlt = $t;
            break;
        }
    }

    if ($foundAlt) {
        // Auto-heal in MySQL database so this track permanently uses the working video ID
        if ($pdo) {
            try {
                if ($trackId > 0) {
                    $upd = $pdo->prepare("UPDATE tracks SET youtube_id = ?, cover_url = IF(cover_url LIKE '%ytimg%', ?, cover_url) WHERE id = ?");
                    $upd->execute([$foundAlt['youtube_id'], $foundAlt['cover_url'], $trackId]);
                } elseif (!empty($excludeYt)) {
                    $upd = $pdo->prepare("UPDATE tracks SET youtube_id = ?, cover_url = IF(cover_url LIKE '%ytimg%', ?, cover_url) WHERE youtube_id = ?");
                    $upd->execute([$foundAlt['youtube_id'], $foundAlt['cover_url'], $excludeYt]);
                }
            } catch (Exception $e) {}
        }

        echo json_encode([
            'success' => true,
            'resolved' => true,
            'youtube_id' => $foundAlt['youtube_id'],
            'title' => $foundAlt['title'] ?? $title,
            'artist' => $foundAlt['artist'] ?? $artist,
            'cover_url' => $foundAlt['cover_url'] ?? "https://i.ytimg.com/vi/{$foundAlt['youtube_id']}/hqdefault.jpg",
            'duration' => $foundAlt['duration'] ?? 210,
            'message' => 'Đã tự động tìm luồng phát thay thế chuẩn xác từ YouTube Music!'
        ]);
        exit;
    }

    echo json_encode([
        'success' => false,
        'resolved' => false,
        'message' => 'Không tìm thấy video thay thế phù hợp'
    ]);
    exit;
}

// -------------------------------------------------------------
// 1. Initial Real Feed & Made For You (YouTube Music Moods & Categories)
// -------------------------------------------------------------
if ($action === 'list' || $action === 'initial_feed' || $action === 'made_for_you') {
    if (!$userId && !empty($rawUserInput) && $pdo) {
        if (is_numeric($rawUserInput)) {
            $userId = (int)$rawUserInput;
        } else if (strpos($rawUserInput, 'user_') === 0 && is_numeric(substr($rawUserInput, 5))) {
            $userId = (int)substr($rawUserInput, 5);
        } else {
            $cleanRaw = strtolower($rawUserInput);
            $cleanEmailDot = str_replace('_', '.', $cleanRaw);
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR email = ? OR username = ? OR firebase_uid = ? OR google_id = ? OR uuid = ? OR REPLACE(REPLACE(LOWER(email), '@', '_'), '.', '_') = ? LIMIT 1");
            $stmt->execute([$rawUserInput, $cleanEmailDot, $rawUserInput, $rawUserInput, $rawUserInput, $rawUserInput, $cleanRaw]);
            $found = $stmt->fetchColumn();
            if ($found) $userId = (int)$found;
        }
    }
    $isLoggedIn = !empty($userId) || !empty($_SESSION['user']);
    $category = strtolower(trim($_GET['category'] ?? 'all'));

    $userTaste = 'lofi, synthwave, chill';
    if ($userId && $pdo) {
        try {
            $stmtT = $pdo->prepare("SELECT music_taste FROM users WHERE id = ?");
            $stmtT->execute([$userId]);
            $tVal = $stmtT->fetchColumn();
            if (!empty($tVal)) $userTaste = $tVal;
        } catch (Exception $e) {}
    }

    $topArtists = [];
    $recentHistoryTracks = [];
    $userFavorites = [];

    if ($userId && $pdo) {
        // 1. History tracks (Nghe lại / Listen Again)
        try {
            $stmtHist = $pdo->prepare("
                SELECT DISTINCT t.id, t.title, t.artist, t.album, t.cover_url, t.duration, t.format, t.youtube_id,
                       h.played_at, UNIX_TIMESTAMP(h.played_at) * 1000 as playedAt
                FROM history h
                JOIN tracks t ON h.track_id = t.id
                WHERE h.user_id = ?
                ORDER BY h.played_at DESC
                LIMIT 8
            ");
            $stmtHist->execute([$userId]);
            $recentHistoryTracks = $stmtHist->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}

        // 2. User top artists from history & favorites
        try {
            $stmtArtist = $pdo->prepare("
                SELECT t.artist, COUNT(*) as cnt 
                FROM history h 
                JOIN tracks t ON h.track_id = t.id 
                WHERE h.user_id = ? AND t.artist NOT IN ('YouTube Music', 'Nghệ sĩ', 'Unknown Artist', '') 
                GROUP BY t.artist 
                ORDER BY cnt DESC 
                LIMIT 3
            ");
            $stmtArtist->execute([$userId]);
            $topArtists = $stmtArtist->fetchAll(PDO::FETCH_COLUMN);

            if (empty($topArtists)) {
                $stmtFavArt = $pdo->prepare("
                    SELECT t.artist, COUNT(*) as cnt 
                    FROM favorites f 
                    JOIN tracks t ON f.track_id = t.id 
                    WHERE f.user_id = ? AND t.artist NOT IN ('YouTube Music', 'Nghệ sĩ', 'Unknown Artist', '') 
                    GROUP BY t.artist 
                    ORDER BY cnt DESC 
                    LIMIT 3
                ");
                $stmtFavArt->execute([$userId]);
                $topArtists = $stmtFavArt->fetchAll(PDO::FETCH_COLUMN);
            }
        } catch (Exception $e) {}

        // 3. User favorites
        try {
            $stmtFav = $pdo->prepare("
                SELECT t.id, t.title, t.artist, t.album, t.duration, t.format, t.cover_url, t.youtube_id,
                       f.created_at, UNIX_TIMESTAMP(f.created_at) * 1000 as favoritedAt
                FROM favorites f
                JOIN tracks t ON f.track_id = t.id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC
                LIMIT 8
            ");
            $stmtFav->execute([$userId]);
            $userFavorites = $stmtFav->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}
    }

    $madeForYou = [];
    $seenYt = [];

    // If specific mood requested (not all and not supermix), fetch genuine YouTube tracks for that mood
    if ($category !== 'all' && $category !== 'supermix') {
        $moodTracks = YouTubeMusicService::search('', 12, $category);
        if ($pdo && !empty($moodTracks)) {
            foreach ($moodTracks as &$yt) {
                $dbId = cacheYouTubeTrack($pdo, $yt);
                if ($dbId) $yt['db_id'] = $dbId;
            }
            unset($yt);
        }
        foreach ($moodTracks as $mt) {
            $yId = $mt['youtube_id'] ?: $mt['id'];
            if ($yId && empty($seenYt[$yId])) {
                $seenYt[$yId] = true;
                $mt['tag'] = '[' . strtoupper($category) . ']';
                if ($yId) {
                    $mt['cover_url'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                    $mt['cover'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                }
                $madeForYou[] = $mt;
            }
            if (count($madeForYou) >= 12) break;
        }
    } else {
        // 'all' or 'supermix': Prioritize user favorites / synced tracks first, then personalized
        if (!empty($userFavorites)) {
            foreach ($userFavorites as $st) {
                $yId = $st['youtube_id'] ?: $st['id'];
                if ($yId && empty($seenYt[$yId])) {
                    $seenYt[$yId] = true;
                    $st['badge'] = 'YÊU THÍCH';
                    $st['tag'] = '[YÊU THÍCH]';
                    if ($yId) {
                        $st['cover_url'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                        $st['cover'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                    }
                    $madeForYou[] = $st;
                }
            }
        }

        $searchQuery = $isLoggedIn 
            ? ($userTaste . ' best songs official audio') 
            : 'thinh hanh nhac tre vpop 2026';

        $tasteTracks = YouTubeMusicService::search($searchQuery, 12, 'music');
        if (empty($tasteTracks) || count($tasteTracks) < 6) {
            $backup = YouTubeMusicService::search($userTaste . ' chill', 12, 'music');
            foreach ($backup as $bk) {
                if (count($tasteTracks) >= 12) break;
                $tasteTracks[] = $bk;
            }
        }

        if ($pdo && !empty($tasteTracks)) {
            foreach ($tasteTracks as &$yt) {
                $dbId = cacheYouTubeTrack($pdo, $yt);
                if ($dbId) $yt['db_id'] = $dbId;
            }
            unset($yt);
        }

        foreach ($tasteTracks as $tt) {
            $yId = $tt['youtube_id'] ?: $tt['id'];
            if ($yId && empty($seenYt[$yId])) {
                $seenYt[$yId] = true;
                if ($yId) {
                    $tt['cover_url'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                    $tt['cover'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                }
                $madeForYou[] = $tt;
            }
            if (count($madeForYou) >= 14) break;
        }
    }

    // ---------------------------------------------------------
    // YouTube Music Shelves Generation
    // ---------------------------------------------------------
    // Shelf A: Quick Picks (Lựa chọn nhanh - 8 cards)
    $quickPicks = [];
    $seenQuick = [];
    // Prioritize 4 from user favorites / history, then 4 from taste
    $sourcePicks = array_merge($userFavorites, $recentHistoryTracks, $madeForYou);
    foreach ($sourcePicks as $sp) {
        $yId = $sp['youtube_id'] ?: $sp['id'];
        if ($yId && empty($seenQuick[$yId])) {
            $seenQuick[$yId] = true;
            $sp['badge'] = 'QUICK PICK';
            $sp['tag'] = '[LỰA CHỌN]';
            if ($yId) {
                $sp['cover_url'] = $sp['cover_url'] ?: "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                $sp['cover'] = $sp['cover_url'];
            }
            $quickPicks[] = $sp;
            if (count($quickPicks) >= 8) break;
        }
    }

    // Shelf B: Similar To Top Artist (Tương tự như [Top Artist])
    $primaryArtist = !empty($topArtists[0]) ? $topArtists[0] : 'Sơn Tùng M-TP';
    $cleanPrimaryArtist = trim(preg_replace('/(\s*ft\.|\s*feat\.|\s*x\s*|\s*,\s*|\s*\/\s*).*$/i', '', $primaryArtist));
    if (empty($cleanPrimaryArtist)) $cleanPrimaryArtist = 'Sơn Tùng M-TP';

    $similarRaw = YouTubeMusicService::search("{$cleanPrimaryArtist} bài hát hay nhất tuyển tập official audio", 8);
    $similarTracks = [];
    $seenSimilar = [];
    foreach ($similarRaw as $sr) {
        $yId = $sr['youtube_id'] ?: $sr['id'];
        if ($yId && empty($seenSimilar[$yId])) {
            $seenSimilar[$yId] = true;
            $sr['badge'] = 'GỢI Ý TƯƠNG TỰ';
            $sr['tag'] = '[CÙNG NGHỆ SĨ]';
            if ($yId) {
                $sr['cover_url'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                $sr['cover'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
            }
            $similarTracks[] = $sr;
        }
    }
    if ($pdo && !empty($similarTracks)) {
        foreach ($similarTracks as &$st) {
            $dbId = cacheYouTubeTrack($pdo, $st);
            if ($dbId) $st['db_id'] = $dbId;
        }
        unset($st);
    }

    // Shelf C: Trending Hits (Thịnh hành V-Pop 2026)
    $trendingRaw = YouTubeMusicService::search("bảng xếp hạng vpop hot trending 2026", 8, 'music');
    $trendingTracks = [];
    $seenTrending = [];
    foreach ($trendingRaw as $tr) {
        $yId = $tr['youtube_id'] ?: $tr['id'];
        if ($yId && empty($seenTrending[$yId])) {
            $seenTrending[$yId] = true;
            $tr['badge'] = 'HOT TREND';
            $tr['tag'] = '[THỊNH HÀNH]';
            if ($yId) {
                $tr['cover_url'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
                $tr['cover'] = "https://i.ytimg.com/vi/{$yId}/hqdefault.jpg";
            }
            $trendingTracks[] = $tr;
        }
    }
    if ($pdo && !empty($trendingTracks)) {
        foreach ($trendingTracks as &$tr) {
            $dbId = cacheYouTubeTrack($pdo, $tr);
            if ($dbId) $tr['db_id'] = $dbId;
        }
        unset($tr);
    }

    // Fallback for Listen Again if user has no server history yet:
    if (empty($recentHistoryTracks) && $pdo) {
        try {
            $stmtPop = $pdo->query("SELECT id, title, artist, album, duration, format, cover_url, source_type, youtube_id, views_count FROM tracks ORDER BY views_count DESC, id DESC LIMIT 8");
            $recentHistoryTracks = $stmtPop->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {}
    }

    // Existing local DB tracks for player playlist
    $dbTracks = [];
    if ($pdo) {
        $stmt = $pdo->query("SELECT id, title, artist, album, duration, format, cover_url, source_type, youtube_id, is_featured, views_count FROM tracks ORDER BY id DESC LIMIT 15");
        $dbTracks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Merge all tracks for player playlist
    $allTracks = [];
    $seenAll = [];

    $collectionsToMerge = [$madeForYou, $quickPicks, $similarTracks, $trendingTracks, $dbTracks];
    foreach ($collectionsToMerge as $col) {
        foreach ($col as $t) {
            $yId = $t['youtube_id'] ?: $t['id'];
            if ($yId && empty($seenAll[$yId])) {
                $allTracks[] = $t;
                $seenAll[$yId] = true;
            }
        }
    }

    $featuredData = getFeaturedAlbums($pdo, $userId);

    $moodCategories = [
        ['id' => 'all', 'name' => 'Tất cả', 'icon' => 'explore', 'badge' => 'ALL'],
        ['id' => 'supermix', 'name' => 'My Supermix', 'icon' => 'shuffle', 'badge' => 'SUPERMIX'],
        ['id' => 'chill', 'name' => 'Thư giãn', 'icon' => 'spa', 'badge' => 'CHILL & RELAX'],
        ['id' => 'energy', 'name' => 'Năng lượng', 'icon' => 'bolt', 'badge' => 'ENERGY & WORKOUT'],
        ['id' => 'mood', 'name' => 'Tâm trạng', 'icon' => 'sentiment_very_satisfied', 'badge' => 'MOOD & BALLAD'],
        ['id' => 'focus', 'name' => 'Tập trung', 'icon' => 'self_improvement', 'badge' => 'DEEP FOCUS'],
        ['id' => 'vpop', 'name' => 'Thịnh hành', 'icon' => 'local_fire_department', 'badge' => 'TOP HITS'],
        ['id' => 'retro', 'name' => 'Hoài niệm', 'icon' => 'history', 'badge' => 'RETRO & NOSTALGIA'],
        ['id' => 'audiophile', 'name' => 'Audiophile', 'icon' => 'album', 'badge' => 'HI-RES STUDIO']
    ];

    echo json_encode([
        'success' => true,
        'category' => $category,
        'mood_categories' => $moodCategories,
        'made_for_you' => array_slice($madeForYou, 0, 8),
        'quick_picks' => array_slice($quickPicks, 0, 8),
        'listen_again' => array_slice($recentHistoryTracks, 0, 8),
        'similar_to' => [
            'artist' => $cleanPrimaryArtist,
            'title' => 'Tương tự như ' . $cleanPrimaryArtist,
            'tracks' => array_slice($similarTracks, 0, 8)
        ],
        'trending' => array_slice($trendingTracks, 0, 8),
        'featured_albums' => $featuredData['albums'],
        'is_personalized' => $featuredData['is_personalized'],
        'user' => $featuredData['user'],
        'tracks' => $allTracks,
        'total' => count($allTracks)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// -------------------------------------------------------------
// 1.5 Featured Albums Action (Guest: YouTube Trending / Logged in: Google Personalized)
// -------------------------------------------------------------
if ($action === 'featured_albums') {
    $featuredData = getFeaturedAlbums($pdo);
    echo json_encode(array_merge(['success' => true], $featuredData), JSON_UNESCAPED_UNICODE);
    exit;
}

// -------------------------------------------------------------
// 2. Dynamic Search with Category Filters (Default 8 tracks + Offset Pagination)
// -------------------------------------------------------------
if ($action === 'search') {
    $q = trim($_GET['q'] ?? $_POST['q'] ?? '');
    $category = trim($_GET['category'] ?? $_POST['category'] ?? 'all');
    $limit = min(30, max(4, intval($_GET['limit'] ?? $_POST['limit'] ?? 8)));
    $offset = max(0, intval($_GET['offset'] ?? $_POST['offset'] ?? 0));
    $excludeRaw = trim($_GET['exclude'] ?? $_POST['exclude'] ?? '');
    $excludeIds = !empty($excludeRaw) ? array_filter(array_map('trim', explode(',', $excludeRaw))) : [];

    // Fetch extra to guarantee full 8 tracks after DB merge & deduplication
    $fetchLimit = $limit + 4;
    $ytResults = YouTubeMusicService::search($q, $fetchLimit, $category, $offset, $excludeIds);

    // Cache newly found tracks into MySQL
    if ($pdo && !empty($ytResults)) {
        foreach ($ytResults as &$yt) {
            $cachedId = cacheYouTubeTrack($pdo, $yt);
            if ($cachedId) {
                $yt['db_id'] = $cachedId;
            }
        }
    }

    // Only search local database on page 1 (offset === 0)
    $dbResults = [];
    if ($pdo && !empty($q) && $offset === 0) {
        $stmt = $pdo->prepare("SELECT id, title, artist, album, duration, format, cover_url, source_type, youtube_id, views_count FROM tracks WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? LIMIT 2");
        $like = "%{$q}%";
        $stmt->execute([$like, $like, $like]);
        $dbResults = $stmt->fetchAll();
    }

    // Merge results seamlessly with strict deduplication
    $seenIds = [];
    $merged = [];

    foreach ($dbResults as $t) {
        $yId = $t['youtube_id'] ?? $t['id'];
        if (empty($seenIds[$yId])) {
            $seenIds[$yId] = true;
            $merged[] = $t;
        }
    }

    foreach ($ytResults as $yt) {
        if (empty($seenIds[$yt['youtube_id']])) {
            $seenIds[$yt['youtube_id']] = true;
            $merged[] = $yt;
        }
    }

    // Ensure search tracks count is exactly $limit (8) or multiple of 4 so grid rows are never khuyết!
    if (count($merged) >= $limit) {
        $merged = array_slice($merged, 0, $limit);
    } elseif (count($merged) >= 4) {
        $fullRowCount = (int)(floor(count($merged) / 4) * 4);
        if ($fullRowCount > 0) {
            $merged = array_slice($merged, 0, $fullRowCount);
        }
    }

    echo json_encode([
        'success' => true,
        'query' => $q,
        'category' => $category,
        'offset' => $offset,
        'limit' => $limit,
        'tracks' => $merged,
        'total' => count($merged),
        'has_more' => count($merged) >= 4
    ]);
    exit;
}

// -------------------------------------------------------------
// 2.5 Explore Action (Default 12 tracks + Fast Offset Pagination)
// -------------------------------------------------------------
if ($action === 'explore') {
    $limit = min(30, max(4, intval($_GET['limit'] ?? $_POST['limit'] ?? 12)));
    $offset = max(0, intval($_GET['offset'] ?? $_POST['offset'] ?? 0));
    $excludeRaw = trim($_GET['exclude'] ?? $_POST['exclude'] ?? '');
    $excludeIds = !empty($excludeRaw) ? array_filter(array_map('trim', explode(',', $excludeRaw))) : [];

    // Curated trending rotation queries - 12 diverse genres
    $queries = [
        'thinh hanh nhac tre vpop 2026',
        'lofi chill beats study relax',
        'synthwave cyberpunk neon hits',
        'anime ost epic orchestral songs',
        'indie acoustic ballad viet nam',
        'us uk top hits trending 2026',
        'kpop hot trend blackpink newjeans bts',
        'rap viet underground hot trend',
        'edm festival bounce electro house',
        'deep focus ambient binaural beats',
        'r&b soul smooth groove chill',
        'jazz cafe piano relaxation'
    ];
    $qIdx = (int)floor($offset / max(1, $limit)) % count($queries);
    $q = $queries[$qIdx];

    $ytResults = YouTubeMusicService::search($q, $limit, 'all', 0, $excludeIds);

    // Cache newly found tracks into MySQL
    if ($pdo && !empty($ytResults)) {
        foreach ($ytResults as &$yt) {
            $cachedId = cacheYouTubeTrack($pdo, $yt);
            if ($cachedId) {
                $yt['db_id'] = $cachedId;
            }
        }
    }

    // Ensure explore tracks count is a multiple of 4 so grid rows are never khuyết!
    if (count($ytResults) >= 4) {
        $fullRowCount = (int)(floor(count($ytResults) / 4) * 4);
        if ($fullRowCount > 0) {
            $ytResults = array_slice($ytResults, 0, $fullRowCount);
        }
    }

    echo json_encode([
        'success' => true,
        'offset' => $offset,
        'limit' => $limit,
        'tracks' => $ytResults,
        'total' => count($ytResults),
        'has_more' => true
    ]);
    exit;
}

// -------------------------------------------------------------
// 3. Album Details & Tracklist Action
// -------------------------------------------------------------
if ($action === 'album_tracks') {
    $q = trim($_GET['query'] ?? $_POST['query'] ?? '');
    $limit = min(25, max(4, intval($_GET['limit'] ?? $_POST['limit'] ?? 10)));
    $tracks = YouTubeMusicService::getAlbumTracks($q, $limit);

    // Cache newly found tracks into MySQL
    if ($pdo && !empty($tracks)) {
        foreach ($tracks as &$yt) {
            $cachedId = cacheYouTubeTrack($pdo, $yt);
            if ($cachedId) {
                $yt['db_id'] = $cachedId;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'query' => $q,
        'tracks' => $tracks,
        'total' => count($tracks)
    ]);
    exit;
}

// -------------------------------------------------------------
// 3.5 More Albums Catalog Action (Infinite Scroll in Albums View)
// -------------------------------------------------------------
if ($action === 'more_albums') {
    $offset = max(0, intval($_GET['offset'] ?? 0));
    // Enforce limit to always be a multiple of 4 (default 4) to ensure complete 4-column rows
    $limit = max(4, intval($_GET['limit'] ?? 4));
    if ($limit % 4 !== 0) {
        $limit = (int)(ceil($limit / 4) * 4);
    }

    $excludeRaw = trim($_GET['exclude'] ?? '');
    $excludeList = [];
    if (!empty($excludeRaw)) {
        $items = explode(',', $excludeRaw);
        foreach ($items as $it) {
            $t = trim($it);
            if (!empty($t)) {
                $excludeList[mb_strtolower($t, 'UTF-8')] = true;
            }
        }
    }

    $isLoggedIn = !empty($_SESSION['user']);
    $fullCatalog = [];

    if ($isLoggedIn) {
        // --- 1. PERSONALIZED ALBUM CATALOG FOR LOGGED-IN GOOGLE ACCOUNT ---
        $user = $_SESSION['user'];
        $displayName = !empty($user['display_name']) ? $user['display_name'] : 'Google User';
        $userAvatar = !empty($user['google_picture']) ? $user['google_picture'] : (!empty($user['avatar_url']) ? $user['avatar_url'] : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
        $userEmail = $user['email'] ?? '';

        $fullCatalog = [
            [
                'id' => 'goog_alb_1',
                'title' => 'My Supermix · ' . $displayName,
                'artist' => 'YouTube Music Personalized · ' . $displayName,
                'year' => '2026',
                'tracks_count' => '14 TRACKS',
                'badge' => 'YOUTUBE SUPERMIX',
                'tag' => 'MY SUPERMIX',
                'cover' => $userAvatar,
                'query' => 'thinh hanh nhac tre vpop 2026',
                'description' => 'Bộ sưu tập âm nhạc siêu phối không giới hạn thể loại cá nhân hóa theo tài khoản Google ' . $userEmail . '.'
            ],
            [
                'id' => 'goog_alb_2',
                'title' => 'Chill & Relax: Thư Giãn Chiều Mưa',
                'artist' => 'YouTube Music Chill Curators',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'CHILL & RELAX',
                'tag' => 'CHILL MIX',
                'cover' => 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
                'query' => 'nhac chill thu gian nhe nhang acoustic',
                'description' => 'Giai điệu acoustic, lo-fi êm ái và nhẹ nhàng giúp xua tan căng thẳng sau một ngày dài.'
            ],
            [
                'id' => 'goog_alb_3',
                'title' => 'Energy & Workout: Bùng Nổ Năng Lượng',
                'artist' => 'YouTube Music Workout Curators',
                'year' => '2026',
                'tracks_count' => '14 TRACKS',
                'badge' => 'ENERGY & WORKOUT',
                'tag' => 'WORKOUT MIX',
                'cover' => 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
                'query' => 'nhac tre remix hot trend tiktok 2026 bass cuc cang',
                'description' => 'Những bản Remix và EDM sôi động nhất tiếp lửa cho buổi tập luyện và bứt phá giới hạn.'
            ],
            [
                'id' => 'goog_alb_4',
                'title' => 'Deep Focus & Study: Tập Trung Sâu',
                'artist' => 'Deep Focus Ambient & Piano',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'DEEP FOCUS',
                'tag' => 'FOCUS MIX',
                'cover' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
                'query' => 'deep focus piano beats study work',
                'description' => 'Âm thanh không lời, sóng alpha và piano kích thích khả năng tập trung cao độ khi làm việc.'
            ],
            [
                'id' => 'goog_alb_5',
                'title' => 'Tâm Trạng & Ballad: Suy Ngẫm Đêm Khuya',
                'artist' => 'Melancholy Ballad Curators',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'MOOD & BALLAD',
                'tag' => 'MOOD MIX',
                'cover' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
                'query' => 'nhac ballad tam trang buon viet nam 2026',
                'description' => 'Những nốt nhạc buồn sâu lắng, chạm vào trái tim và xoa dịu những nỗi niềm trăn trở.'
            ],
            [
                'id' => 'goog_alb_6',
                'title' => 'Bảng Xếp Hạng Top Hits V-Pop',
                'artist' => 'YouTube Music Charts Việt Nam',
                'year' => '2026',
                'tracks_count' => '16 TRACKS',
                'badge' => 'V-POP CHARTS',
                'tag' => 'TOP HITS',
                'cover' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
                'query' => 'bang xep hang top hits vpop 2026',
                'description' => 'Top các bài hát được nghe nhiều nhất trên YouTube Music Việt Nam thời điểm hiện tại.'
            ],
            [
                'id' => 'goog_alb_7',
                'title' => 'Cafe Acoustic Dành Cho ' . $displayName,
                'artist' => 'Acoustic Live Studio',
                'year' => '2026',
                'tracks_count' => '10 TRACKS',
                'badge' => 'FLAC 96kHz 24-bit',
                'tag' => 'ACOUSTIC CAFE',
                'cover' => 'https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=400&auto=format&fit=crop&q=80',
                'query' => 'nhac cafe acoustic nhe nhang sau lang',
                'description' => 'Không gian quán cà phê acoustic ấm cúng với tiếng mộc guitar và giọng ca tình cảm.'
            ],
            [
                'id' => 'goog_alb_8',
                'title' => 'Không Gian Âm Thanh Hi-Res 3D',
                'artist' => 'Spatial Audio Lab',
                'year' => '2026',
                'tracks_count' => '8 TRACKS',
                'badge' => 'SUB-20Hz HI-RES',
                'tag' => 'SPATIAL AUDIO',
                'cover' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
                'query' => 'binaural spatial 3d audio test hi res',
                'description' => 'Định hình chiều sâu âm trường stereo và dải siêu trầm tách bạch từng nhạc cụ.'
            ],
            [
                'id' => 'goog_alb_9',
                'title' => 'Xu Hướng Mới Dành Cho ' . $displayName,
                'artist' => 'Google Music Intelligence',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'AI RECOMMENDATION',
                'tag' => 'TRENDING FOR YOU',
                'cover' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
                'query' => 'nhac tre vpop moi nhat 2026 thinh hanh',
                'description' => 'Cập nhật những ca khúc mới phát hành phù hợp nhất với hồ sơ nghe nhạc của bạn.'
            ],
            [
                'id' => 'goog_alb_10',
                'title' => 'Indie Chill Room: ' . $displayName,
                'artist' => 'Indie Curator for ' . $displayName,
                'year' => '2026',
                'tracks_count' => '10 TRACKS',
                'badge' => 'INDIE FLAC 96k',
                'tag' => 'INDIE CHILL',
                'cover' => 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&auto=format&fit=crop&q=80',
                'query' => 'indie vietnam acoustic chill acoustic',
                'description' => 'Không gian âm nhạc nhẹ nhàng thư thái dành riêng cho những buổi chiều thảnh thơi.'
            ],
            [
                'id' => 'goog_alb_11',
                'title' => 'Giai Điệu Hoài Niệm & Kỷ Niệm',
                'artist' => 'Memory Soundscapes',
                'year' => '2026',
                'tracks_count' => '14 TRACKS',
                'badge' => 'MASTER 24/96',
                'tag' => 'NOSTALGIA',
                'cover' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
                'query' => 'nhac acoustic ballad tinh ca viet',
                'description' => 'Tìm lại những kỷ niệm đẹp qua những thanh âm quen thuộc.'
            ],
            [
                'id' => 'goog_alb_12',
                'title' => 'Workout & High Energy Drive',
                'artist' => 'Electro Rush Beats',
                'year' => '2026',
                'tracks_count' => '11 TRACKS',
                'badge' => 'HIGH-ENERGY 24bit',
                'tag' => 'ENERGY BOOST',
                'cover' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
                'query' => 'workout motivation music gym beats',
                'description' => 'Năng lượng bùng nổ nâng cao tinh thần luyện tập và vận động.'
            ],
            [
                'id' => 'goog_alb_13',
                'title' => 'Acoustic Guitar Live Dành Cho ' . $displayName,
                'artist' => 'Acoustic Master Collection',
                'year' => '2026',
                'tracks_count' => '9 TRACKS',
                'badge' => 'DIRECT DSD',
                'tag' => 'ACOUSTIC GUITAR',
                'cover' => 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80',
                'query' => 'fingerstyle acoustic guitar solo master',
                'description' => 'Tiếng đàn mộc nguyên bản đầy xúc cảm.'
            ],
            [
                'id' => 'goog_alb_14',
                'title' => 'Đêm Tĩnh Lặng & Giấc Ngủ Sâu',
                'artist' => 'Ambient Sleep Lab',
                'year' => '2026',
                'tracks_count' => '10 TRACKS',
                'badge' => 'SLEEP FLAC',
                'tag' => 'DEEP SLEEP',
                'cover' => 'https://images.unsplash.com/photo-1520523839898-507127043818?w=400&auto=format&fit=crop&q=80',
                'query' => 'peaceful sleep meditation music piano ambient',
                'description' => 'Thư giãn hoàn toàn hệ thần kinh đưa bạn vào giấc ngủ ngon.'
            ],
            [
                'id' => 'goog_alb_15',
                'title' => 'Symphony Vũ Trụ: Google Audiophile',
                'artist' => 'Sawano / HOYO-MiX / Zimmer',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'DSD 5.6MHz MASTER',
                'tag' => 'ORCHESTRAL MASTER',
                'cover' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
                'query' => 'Interstellar Hans Zimmer soundtrack full',
                'description' => 'Đỉnh cao giao hưởng vũ trụ không gian ba chiều với dải động âm thanh tuyệt mỹ.'
            ],
            [
                'id' => 'goog_alb_16',
                'title' => 'Jazz Midnight Lounge: ' . $displayName,
                'artist' => 'Blue Note Jazz Club',
                'year' => '2026',
                'tracks_count' => '10 TRACKS',
                'badge' => 'STUDIO MASTER 24/192',
                'tag' => 'JAZZ LOUNGE',
                'cover' => 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
                'query' => 'audiophile jazz saxophone live recording',
                'description' => 'Không gian quán rượu Jazz nửa đêm với tiếng saxophone ngọt ngào quyến rũ.'
            ]
        ];
    } else {
        // --- 2. 24 CURATED AUDIOPHILE & TRENDING ALBUMS FOR GUEST ---
        $fullCatalog = [
            [
                'id' => 'alb_1',
                'title' => 'Farewell of Voyager Star',
                'artist' => '鸣潮先约电台 / Emi Evans',
                'year' => '2026',
                'tracks_count' => '8 TRACKS',
                'badge' => 'FLAC 192k 24-bit',
                'tag' => 'RESONANCE',
                'cover' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgjdnQliGTIf0xhiSBiil6TjgxEyH-8kQe5jsjqUJcIoqDI6clB-BoBSHKTbfVdIR_QTsOGyz6EzPiDzPj_xokHC5mihJPToNI7WdUEOmvosxtpGV05W9A53x_BSXqJgIyCcZS2dlJDSHzI27eD-giTKzPOcPzdRvcQs7YvtYYlUMOZfbvBy3B3T9-qON25NtTHDPx0gujBhT2ZEpMzW8xHAaM_pWS4G_tvbkMFVRS55WsCylqR_4EQQ',
                'query' => 'Farewell of Voyager Star Emi Evans',
                'description' => 'Tuyển tập nhạc phẩm đỉnh cao kết hợp giữa giao hưởng hiện đại và giai điệu huyền bí của Tarokiki & Emi Evans.'
            ],
            [
                'id' => 'alb_2',
                'title' => 'Midnight Cyber Resonance',
                'artist' => 'Emily & Synthwave Orchestra',
                'year' => '2025',
                'tracks_count' => '10 TRACKS',
                'badge' => 'FLAC 96k 24-bit',
                'tag' => 'CYBERPUNK',
                'cover' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW7YpaBTLlX_unVrvCPKWyGgYjEWgRxvke5rASbhq_kp8bX3Ln5aFsSpEoEUyot0g6E4LbwGe49Oc_Sm0yv4n2A-FuzejDqMP7VcolTtBwSHrbIG079p8YdtQrAiOsTSc8xmFO--ctMJfLeDJCMdwx9mXh0VWbbGwI8ZhX7fP7CuWL5yY-bq3XprUZJx_ILW3pM3RhILmAlkjbRb03ywm-PoxBexYk89zDGYLPSugIcxRkWBLXrPnHAw',
                'query' => 'Midnight Cyber Resonance Synthwave',
                'description' => 'Không gian âm thanh Retrowave & Synthwave tràn ngập ánh đèn neon giữa đêm muộn.'
            ],
            [
                'id' => 'alb_3',
                'title' => 'Symphony No. 9 Aurora',
                'artist' => 'Hiroyuki Sawano',
                'year' => '2024',
                'tracks_count' => '12 TRACKS',
                'badge' => 'DSD 2.8MHz 1-bit',
                'tag' => 'DSD MASTER',
                'cover' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuANK028RCNQkaFbYpXj_3Wx2Sy92pt35RUqhOQsieW6qbi-d44bjuasKepQIxXNYjRzEzrR1Zn3UwojRhoH83Wa8_lq2gNMoX2McoK2lWS0v0JHk7XXH7xFY9gOCBIZr5t4Rv68_Y8Zg6AeUgCOYMZRDdc08mjOTcw_oFwqmqHVyT48SflkLemHhcu2HEqIkmxk2iRwUsoTt8CJS-Z72H2CoGLRDx0nufCuXmK1oCmdHMerHm_jaPXk5g',
                'query' => 'Symphony No. 9 Aurora Hiroyuki Sawano',
                'description' => 'Bản giao hưởng hùng tráng mang phong cách đặc trưng của Hiroyuki Sawano với dải động âm thanh cực đại.'
            ],
            [
                'id' => 'alb_4',
                'title' => 'Subsurface Protocol',
                'artist' => 'Mineradio Acoustic',
                'year' => '2025',
                'tracks_count' => '6 TRACKS',
                'badge' => 'SUB-20Hz HI-RES',
                'tag' => 'SUB-BASS',
                'cover' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw56xdATpUuXj8D44rlW0EgCsJqad104kUI3Asz8xp0YGFKa9sihkOU0xXW_z2Hhb5bxG0H8ZBZRZ8GXg2ylkNOZWYHh34yfClNXZTwj2jpVPxtnP-c26EkLvRjHv9fT_hjYGQj5WXaLzjCdsgSutjiXBSPKVEvEqfTcTWU36Vj7kIuMLn82fodmKNjk7ia2gCjC2wVmZCQ8CbkHkXP1yyvD_HqCeUi4dBckigJdHg_9O5FVcg-R-63Q',
                'query' => 'Subsurface Protocol Mineradio Acoustic',
                'description' => 'Trải nghiệm dải trầm sâu thẳm xuống dưới 20Hz được tinh chỉnh chuẩn phòng thu chuyên nghiệp.'
            ],
            [
                'id' => 'alb_5',
                'title' => 'Chúng Ta Của Hiện Tại (Deluxe)',
                'artist' => 'Sơn Tùng M-TP',
                'year' => '2024',
                'tracks_count' => '8 TRACKS',
                'badge' => 'MASTER AUDIO 24/96',
                'tag' => 'V-POP HIT',
                'cover' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
                'query' => 'Son Tung MTP Chung Ta Cua Hien Tai album',
                'description' => 'Bản ghi âm chất lượng cao Master Audio tái hiện không gian hoài niệm sâu lắng của Sơn Tùng M-TP.'
            ],
            [
                'id' => 'alb_6',
                'title' => '2 A.M Study Session',
                'artist' => 'Lofi Girl / ChilledCow',
                'year' => '2025',
                'tracks_count' => '14 TRACKS',
                'badge' => 'LOFI CHILL 96k',
                'tag' => 'LO-FI STUDY',
                'cover' => 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
                'query' => 'Lofi Girl 2 AM Study Session',
                'description' => 'Tuyển tập Lofi Hip-hop nhẹ nhàng giúp tập trung học tập và làm việc suốt đêm.'
            ],
            [
                'id' => 'alb_7',
                'title' => 'Cyberpunk: Edgerunners Hits',
                'artist' => 'Various Artists / Studio Trigger',
                'year' => '2024',
                'tracks_count' => '11 TRACKS',
                'badge' => 'HI-RES 24-bit',
                'tag' => 'EDGERUNNERS',
                'cover' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
                'query' => 'Cyberpunk Edgerunners soundtrack album',
                'description' => 'Album nhạc phim chấn động mang âm hưởng Night City đầy khát vọng và bi tráng.'
            ],
            [
                'id' => 'alb_8',
                'title' => 'Một Vạn Năm',
                'artist' => 'Vũ.',
                'year' => '2024',
                'tracks_count' => '9 TRACKS',
                'badge' => 'INDIE FLAC 96k',
                'tag' => 'VIET INDIE',
                'cover' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
                'query' => 'Mot Van Nam Vu album',
                'description' => 'Album phòng thu thứ 2 của Hoàng tử Indie Vũ. với chất giọng trầm ấm đặc trưng.'
            ],
            [
                'id' => 'alb_9',
                'title' => 'Random Access Memories',
                'artist' => 'Daft Punk',
                'year' => '2023',
                'tracks_count' => '13 TRACKS',
                'badge' => 'STUDIO MASTER 24/96',
                'tag' => 'DISCO FUNK',
                'cover' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
                'query' => 'Daft Punk Random Access Memories full album',
                'description' => 'Kiệt tác Disco & Funk từng đoạt giải Grammy Album of the Year với chất lượng thu âm chuẩn mực.'
            ],
            [
                'id' => 'alb_10',
                'title' => 'Interstellar OST (Expanded)',
                'artist' => 'Hans Zimmer',
                'year' => '2024',
                'tracks_count' => '16 TRACKS',
                'badge' => 'DSD 5.6MHz MASTER',
                'tag' => 'ORCHESTRAL',
                'cover' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
                'query' => 'Interstellar Hans Zimmer soundtrack full',
                'description' => 'Giai điệu đàn ống và giao hưởng vũ trụ bất hủ của Hans Zimmer chạm tới tận cùng cảm xúc.'
            ],
            [
                'id' => 'alb_11',
                'title' => '99% (Album)',
                'artist' => 'MCK',
                'year' => '2025',
                'tracks_count' => '16 TRACKS',
                'badge' => 'HIP-HOP HI-RES',
                'tag' => 'RAP VIET',
                'cover' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
                'query' => 'MCK 99 album official',
                'description' => 'Album hiện tượng của MCK khẳng định vị thế dẫn đầu thế hệ nghệ sĩ trẻ Việt Nam.'
            ],
            [
                'id' => 'alb_12',
                'title' => 'Ái (Album)',
                'artist' => 'tlinh',
                'year' => '2025',
                'tracks_count' => '12 TRACKS',
                'badge' => 'R&B MASTER',
                'tag' => 'R&B / SOUL',
                'cover' => 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&auto=format&fit=crop&q=80',
                'query' => 'tlinh Ai album official',
                'description' => 'Khám phá thế giới tình yêu đa sắc thái của tlinh qua những giai điệu R&B hiện đại.'
            ],
            [
                'id' => 'alb_13',
                'title' => 'Vũ Trụ Cò Bay',
                'artist' => 'Phương Mỹ Chi · DTAP',
                'year' => '2024',
                'tracks_count' => '10 TRACKS',
                'badge' => 'FLAC 192k 24-bit',
                'tag' => 'FOLK TRONIC',
                'cover' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
                'query' => 'Phuong My Chi Vu Tru Co Bay album',
                'description' => 'Sự kết hợp xuất sắc giữa âm nhạc dân gian văn học Việt Nam và âm hưởng điện tử đương đại.'
            ],
            [
                'id' => 'alb_14',
                'title' => 'Bảo Tàng Của Nuối Tiếc',
                'artist' => 'Vũ.',
                'year' => '2025',
                'tracks_count' => '10 TRACKS',
                'badge' => 'FLAC 96k 24-bit',
                'tag' => 'INDIE BALLAD',
                'cover' => 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80',
                'query' => 'Vu Bao Tang Cua Nuoi Tiec album',
                'description' => 'Những câu chuyện nuối tiếc được gói gọn trong tiếng guitar mộc và dàn dây du dương.'
            ],
            [
                'id' => 'alb_15',
                'title' => 'LoiChoi: The New Era',
                'artist' => 'Wren Evans',
                'year' => '2025',
                'tracks_count' => '11 TRACKS',
                'badge' => 'ELECTRO HI-RES',
                'tag' => 'POP EXPERIMENTAL',
                'cover' => 'https://images.unsplash.com/photo-1520523839898-507127043818?w=400&auto=format&fit=crop&q=80',
                'query' => 'Wren Evans LoiChoi album official',
                'description' => 'Album bùng nổ của Wren Evans với phong cách sản xuất âm nhạc quốc tế đầy sáng tạo.'
            ],
            [
                'id' => 'alb_16',
                'title' => 'Kha Tàng (Album)',
                'artist' => 'Kha',
                'year' => '2024',
                'tracks_count' => '8 TRACKS',
                'badge' => 'CHILL R&B',
                'tag' => 'LO-FI POP',
                'cover' => 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
                'query' => 'Kha Loi Yeu album official',
                'description' => 'Những giai điệu ngọt ngào, thư thái tựa như cơn mưa rào mùa hạ.'
            ],
            [
                'id' => 'alb_17',
                'title' => 'Hop On Da Show',
                'artist' => 'Low G',
                'year' => '2025',
                'tracks_count' => '8 TRACKS',
                'badge' => 'RAP MASTER 24/96',
                'tag' => 'BOOM BAP TRAP',
                'cover' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
                'query' => 'Low G Hop On Da Show official',
                'description' => 'Kỹ năng flow thượng thừa và chất giọng hài hước, sắc sảo trứ danh của Low G.'
            ],
            [
                'id' => 'alb_18',
                'title' => 'Giao Lộ 04:00',
                'artist' => 'Tuimi',
                'year' => '2024',
                'tracks_count' => '7 TRACKS',
                'badge' => 'NEO R&B HI-RES',
                'tag' => 'URBAN NIGHT',
                'cover' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
                'query' => 'Tuimi Giao Lo 0400 album',
                'description' => 'Chuyến xe âm nhạc chạy qua các cung đường đêm tĩnh mịch với âm hưởng R&B phương Tây.'
            ],
            [
                'id' => 'alb_19',
                'title' => 'Dấu Chân Địa Đàng',
                'artist' => 'Khánh Ly · Trịnh Công Sơn',
                'year' => '2024',
                'tracks_count' => '10 TRACKS',
                'badge' => 'ANALOG DSD 5.6M',
                'tag' => 'TRINH CONTEMPORARY',
                'cover' => 'https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=400&auto=format&fit=crop&q=80',
                'query' => 'Khanh Ly Trinh Cong Son Dau Chan Dia Dang',
                'description' => 'Bản số hóa trực tiếp từ băng cối Master Tape 1970 lưu giữ trọn vẹn hồn cốt nhạc Trịnh.'
            ],
            [
                'id' => 'alb_20',
                'title' => 'Bạch Nhật Mộng',
                'artist' => 'Hải Bột (Quái Vật Tí Hon)',
                'year' => '2024',
                'tracks_count' => '12 TRACKS',
                'badge' => 'ACOUSTIC MASTER',
                'tag' => 'POST ROCK',
                'cover' => 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&auto=format&fit=crop&q=80',
                'query' => 'Hai Bot Quai Vat Ti Hon Bach Nhat Mong',
                'description' => 'Tác phẩm để đời của Rock Việt với những ca từ triết lý và âm thanh mộc mạc nguyên bản.'
            ],
            [
                'id' => 'alb_21',
                'title' => 'The Dark Side of the Moon',
                'artist' => 'Pink Floyd',
                'year' => '2023',
                'tracks_count' => '10 TRACKS',
                'badge' => 'FLAC 192k 24-bit',
                'tag' => 'PROG ROCK',
                'cover' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
                'query' => 'Pink Floyd The Dark Side of the Moon 50th',
                'description' => 'Kỷ niệm 50 năm kiệt tác vĩ đại nhất lịch sử Progressive Rock qua bản Remaster 24-bit.'
            ],
            [
                'id' => 'alb_22',
                'title' => 'Hoàng (Deluxe Edition)',
                'artist' => 'Hoàng Thùy Linh',
                'year' => '2024',
                'tracks_count' => '10 TRACKS',
                'badge' => 'ELECTRO FOLK HI-RES',
                'tag' => 'VIETNAMESE FOLK',
                'cover' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
                'query' => 'Hoang Thuy Linh Hoang album full',
                'description' => 'Cột mốc lịch sử của nhạc đương đại Việt Nam đưa âm hưởng dân gian lên tầm cao thế giới.'
            ],
            [
                'id' => 'alb_23',
                'title' => 'Endless Stellar Journey',
                'artist' => 'HOYO-MiX',
                'year' => '2026',
                'tracks_count' => '14 TRACKS',
                'badge' => 'SYMPHONIC MASTER',
                'tag' => 'ASTRAL EXPRESS',
                'cover' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
                'query' => 'Honkai Star Rail HOYO-MiX album official',
                'description' => 'Bản giao hưởng khám phá các vì sao đưa trí tưởng tượng bay xa qua những thanh âm tráng lệ.'
            ],
            [
                'id' => 'alb_24',
                'title' => 'Khung Trời Bình Yên',
                'artist' => 'Đan Trường & Cẩm Ly',
                'year' => '2024',
                'tracks_count' => '12 TRACKS',
                'badge' => 'REMASTERED 24/96',
                'tag' => 'GOLDEN HITS',
                'cover' => 'https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=400&auto=format&fit=crop&q=80',
                'query' => 'Dan Truong Cam Ly Khung Troi Binh Yen',
                'description' => 'Bộ đôi vàng của nhạc Việt với những ca khúc đi cùng năm tháng được nâng cấp chuẩn Hi-Res.'
            ],
            // Extended 12 fresh albums for guest when scrolling past 24:
            [
                'id' => 'alb_25',
                'title' => 'Indie V-Pop Chill Selection',
                'artist' => 'Various Indie Artists',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'FLAC 96k 24-bit',
                'tag' => 'INDIE CHILL',
                'cover' => 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&auto=format&fit=crop&q=80',
                'query' => 'vpop indie acoustic chill 2026',
                'description' => 'Giai điệu Indie sâu lắng và mộc mạc từ những tài năng trẻ Việt Nam.'
            ],
            [
                'id' => 'alb_26',
                'title' => 'Midnight Lo-Fi Tokyo Session',
                'artist' => 'ChilledCow & Lofi Records',
                'year' => '2026',
                'tracks_count' => '14 TRACKS',
                'badge' => 'LOFI 24/96',
                'tag' => 'MIDNIGHT LOFI',
                'cover' => 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
                'query' => 'lofi hip hop radio beats to relax study to',
                'description' => 'Âm sắc ấm áp như tiếng đĩa than giữa đêm muộn tĩnh lặng.'
            ],
            [
                'id' => 'alb_27',
                'title' => 'Cyber City Neon Drift',
                'artist' => 'Synthwave Collective',
                'year' => '2026',
                'tracks_count' => '10 TRACKS',
                'badge' => 'DSD 2.8MHz',
                'tag' => 'SYNTH RETRO',
                'cover' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
                'query' => 'synthwave retrowave electronic music cyberpunk',
                'description' => 'Đắm chìm vào thành phố tương lai rực rỡ sắc tím neon và tiếng synth dày dặn.'
            ],
            [
                'id' => 'alb_28',
                'title' => 'Anime Symphony Orchestra Hits',
                'artist' => 'Tokyo Philharmonic / Sawano',
                'year' => '2026',
                'tracks_count' => '15 TRACKS',
                'badge' => 'HI-RES MASTER',
                'tag' => 'ANIME OST',
                'cover' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
                'query' => 'anime orchestral soundtrack epic sawano',
                'description' => 'Bản hòa âm dàn nhạc hoành tráng tái hiện những phân cảnh phim anime bất hủ.'
            ],
            [
                'id' => 'alb_29',
                'title' => 'Audiophile Jazz Club Live',
                'artist' => 'Blue Note Session Trio',
                'year' => '2026',
                'tracks_count' => '10 TRACKS',
                'badge' => 'STUDIO MASTER 24/192',
                'tag' => 'JAZZ AUDIOPHILE',
                'cover' => 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
                'query' => 'audiophile jazz saxophone live recording',
                'description' => 'Độ động cực lớn thu âm trực tiếp tiếng saxophone mượt mà và tiếng contrabass uy lực.'
            ],
            [
                'id' => 'alb_30',
                'title' => 'Piano Solitude & Peaceful Night',
                'artist' => 'Yiruma & Classical Masters',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'FLAC 192k 24-bit',
                'tag' => 'SOLO PIANO',
                'cover' => 'https://images.unsplash.com/photo-1520523839898-507127043818?w=400&auto=format&fit=crop&q=80',
                'query' => 'peaceful piano music relaxation meditation',
                'description' => 'Từng phím đàn dương cầm trong trẻo đưa tâm hồn vào giấc ngủ bình yên.'
            ],
            [
                'id' => 'alb_31',
                'title' => 'Acoustic Guitar Masterclass',
                'artist' => 'Sungha Jung & Tommy Emmanuel',
                'year' => '2026',
                'tracks_count' => '11 TRACKS',
                'badge' => 'DIRECT DSD',
                'tag' => 'FINGERSTYLE',
                'cover' => 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80',
                'query' => 'fingerstyle acoustic guitar solo master',
                'description' => 'Kỹ thuật gảy ngón điêu luyện với tiếng thùng đàn mộc rền ấm.'
            ],
            [
                'id' => 'alb_32',
                'title' => 'Cinema Epic Trailer Soundtracks',
                'artist' => 'Two Steps From Hell / Zimmer',
                'year' => '2026',
                'tracks_count' => '14 TRACKS',
                'badge' => 'DSD 5.6MHz',
                'tag' => 'CINEMATIC',
                'cover' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
                'query' => 'epic orchestral cinematic trailer music',
                'description' => 'Trống trận dồn dập cùng dàn hợp xướng vang dội rung chuyển không gian.'
            ],
            [
                'id' => 'alb_33',
                'title' => 'R&B Soul Late Night Grooves',
                'artist' => 'Neo Soul Collective',
                'year' => '2026',
                'tracks_count' => '10 TRACKS',
                'badge' => 'FLAC 96k 24-bit',
                'tag' => 'R&B SOUL',
                'cover' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
                'query' => 'smooth r&b soul chill music',
                'description' => 'Giai điệu R&B quyến rũ với nhịp bass trầm bổng cuốn hút.'
            ],
            [
                'id' => 'alb_34',
                'title' => 'Deep Focus Binaural Ambient',
                'artist' => 'Brainwave Research Studio',
                'year' => '2026',
                'tracks_count' => '8 TRACKS',
                'badge' => 'ALPHA WAVE 24/96',
                'tag' => 'AMBIENT FOCUS',
                'cover' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
                'query' => 'deep focus ambient study music binaural beats',
                'description' => 'Tần số sóng não giúp tăng cường khả năng tiếp thu và tập trung đỉnh cao.'
            ],
            [
                'id' => 'alb_35',
                'title' => 'Cello & String Chamber Ensembles',
                'artist' => 'Berlin Chamber Strings',
                'year' => '2026',
                'tracks_count' => '12 TRACKS',
                'badge' => 'STUDIO MASTER 24/192',
                'tag' => 'CHAMBER STRINGS',
                'cover' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
                'query' => 'cello string quartet classical music',
                'description' => 'Tiếng vĩ cầm và trung cầm hòa quyện trong không gian nhà hát danh tiếng.'
            ],
            [
                'id' => 'alb_36',
                'title' => 'Vietnamese Golden Ballad Remasters',
                'artist' => 'Various Vietnamese Divas',
                'year' => '2026',
                'tracks_count' => '14 TRACKS',
                'badge' => 'REMASTERED 24/96',
                'tag' => 'GOLDEN BALLAD',
                'cover' => 'https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=400&auto=format&fit=crop&q=80',
                'query' => 'nhac tru tinh viet nam hay nhat lossless',
                'description' => 'Tuyển tập những bản tình ca vượt thời gian được phục hồi chất âm độ phân giải cao.'
            ]
        ];
    }

    $totalCatalog = count($fullCatalog);
    $resultAlbums = [];
    $seenInBatch = [];

    // Strict non-repeating pagination starting from $offset
    for ($i = $offset; $i < $totalCatalog && count($resultAlbums) < $limit; $i++) {
        $item = $fullCatalog[$i];
        $normTitle = mb_strtolower(trim($item['title']), 'UTF-8');
        $normId = mb_strtolower(trim($item['id']), 'UTF-8');

        // Check if excluded by client or already seen in current batch
        if (isset($excludeList[$normTitle]) || isset($excludeList[$normId]) || isset($seenInBatch[$normTitle])) {
            continue;
        }

        $seenInBatch[$normTitle] = true;
        $resultAlbums[] = $item;
    }

    $hasMore = ($offset + count($resultAlbums)) < $totalCatalog;

    echo json_encode([
        'success' => true,
        'is_personalized' => $isLoggedIn,
        'offset' => $offset,
        'limit' => $limit,
        'albums' => $resultAlbums,
        'total' => $totalCatalog,
        'has_more' => $hasMore
    ]);
    exit;
}

// 4. Add Track to Playlist
// -------------------------------------------------------------
if ($action === 'add_to_playlist') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $playlistId = intval($input['playlist_id'] ?? 0);
    $trackId = intval($input['track_id'] ?? 0);
    $youtubeId = trim($input['youtube_id'] ?? '');

    if ($pdo && $playlistId > 0) {
        // If track_id not provided but youtube_id is, find or create track
        if ($trackId <= 0 && !empty($youtubeId)) {
            $title = trim($input['title'] ?? 'YouTube Track');
            $artist = trim($input['artist'] ?? 'YouTube Music');
            $cover = trim($input['cover_url'] ?? '');
            $duration = intval($input['duration'] ?? 210);

            $trackId = cacheYouTubeTrack($pdo, [
                'youtube_id' => $youtubeId,
                'title' => $title,
                'artist' => $artist,
                'cover_url' => $cover,
                'duration' => $duration
            ]);
        }

        if ($trackId > 0) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)");
            $stmt->execute([$playlistId, $trackId]);
            echo json_encode([
                'success' => true,
                'message' => 'Đã thêm bài hát vào playlist thành công!',
                'playlist_id' => $playlistId,
                'track_id' => $trackId
            ]);
            exit;
        }
    }

    echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ!']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Hành động không hợp lệ!']);

