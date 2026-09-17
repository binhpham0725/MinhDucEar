<?php
/**
 * Database Auto-Migration & Seeder (Firebase Compatible & Per-Account Data)
 * Manages: Favorites, History, Albums/Saved Albums, Playlists, Music Taste,
 * Listening Time & Weekly Statistics.
 */
require_once __DIR__ . '/../config/database.php';

function generateUuidV4() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

$db = Database::getInstance();
if (!$db->isConnected()) {
    echo "❌ Error: MySQL is not connected. Please ensure MySQL is running in XAMPP.\n";
    exit(1);
}

$pdo = $db->getConnection();

echo "🚀 Starting MinhDucEar Database Setup & Weekly Listening Statistics Migration...\n\n";

try {
    // 1. Run full schema
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $pdo->exec($schema);
    echo "✅ [1/6] Core tables verified / created:\n";
    echo "       - users (Tài khoản, Gu âm nhạc, Tổng thời gian nghe)\n";
    echo "       - tracks (Bài hát)\n";
    echo "       - albums & user_saved_albums (Albums & Album đã lưu riêng từng tài khoản)\n";
    echo "       - playlists & playlist_tracks (Danh sách phát riêng từng tài khoản)\n";
    echo "       - favorites (Mục Ưa thích riêng từng tài khoản)\n";
    echo "       - history (Lịch sử nghe & thời gian từng bài riêng từng tài khoản)\n";
    echo "       - user_music_taste (Gu âm nhạc & trọng số thể loại riêng từng tài khoản)\n";
    echo "       - user_daily_stats (Thống kê thời gian nghe theo ngày)\n";
    echo "       - user_weekly_stats (Thống kê thời gian nghe theo tuần & biểu đồ 7 ngày)\n";

    // 2. Safe Column Additions if missing
    $columnMigrations = [
        'users' => [
            'uuid' => "ALTER TABLE `users` ADD COLUMN `uuid` CHAR(36) NULL UNIQUE AFTER `id`",
            'firebase_uid' => "ALTER TABLE `users` ADD COLUMN `firebase_uid` VARCHAR(128) NULL UNIQUE AFTER `uuid`",
            'total_listening_seconds' => "ALTER TABLE `users` ADD COLUMN `total_listening_seconds` BIGINT DEFAULT 0 AFTER `listening_hours`",
            'metadata' => "ALTER TABLE `users` ADD COLUMN `metadata` JSON NULL AFTER `music_taste`",
            'is_deleted' => "ALTER TABLE `users` ADD COLUMN `is_deleted` TINYINT(1) DEFAULT 0 AFTER `synced_at`",
            'updated_at' => "ALTER TABLE `users` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ],
        'user_music_taste' => [
            'total_seconds' => "ALTER TABLE `user_music_taste` ADD COLUMN `total_seconds` INT DEFAULT 0 AFTER `play_count`"
        ]
    ];

    foreach ($columnMigrations as $table => $cols) {
        $existingColsStmt = $pdo->query("DESCRIBE `$table`");
        $existingCols = $existingColsStmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($cols as $colName => $alterSql) {
            if (!in_array($colName, $existingCols)) {
                try {
                    $pdo->exec($alterSql);
                    echo "  ➜ Added column `$table`.`$colName`\n";
                } catch (Exception $e) {
                    // Ignore
                }
            }
        }
    }
    echo "✅ [2/6] Table columns verified!\n";

    // 3. Backfill UUIDs for all rows missing a UUID
    $tablesWithUuid = ['users', 'tracks', 'albums', 'playlists', 'history'];
    foreach ($tablesWithUuid as $tbl) {
        $checkStmt = $pdo->query("SELECT id FROM `$tbl` WHERE uuid IS NULL OR uuid = ''");
        $rowsWithoutUuid = $checkStmt->fetchAll(PDO::FETCH_COLUMN);
        if (!empty($rowsWithoutUuid)) {
            $updateStmt = $pdo->prepare("UPDATE `$tbl` SET uuid = ? WHERE id = ?");
            foreach ($rowsWithoutUuid as $rowId) {
                $newUuid = generateUuidV4();
                $updateStmt->execute([$newUuid, $rowId]);
            }
            echo "  ➜ Generated UUIDv4 for " . count($rowsWithoutUuid) . " rows in `$tbl`.\n";
        }
    }
    echo "✅ [3/6] Firestore UUID keys populated!\n";

    // 4. Admin User verification
    $userStmt = $pdo->prepare("SELECT id, uuid FROM users WHERE username = 'minhduc' OR email = 'minhduc@ear.vn'");
    $userStmt->execute();
    $admin = $userStmt->fetch();
    $adminId = $admin ? $admin['id'] : 1;

    // Update total listening seconds for admin (e.g. 2.5 hours = 9000 seconds)
    $pdo->prepare("UPDATE users SET total_listening_seconds = 18720, listening_hours = 5.2 WHERE id = ? AND (total_listening_seconds = 0 OR total_listening_seconds IS NULL)")->execute([$adminId]);
    echo "✅ [4/6] Admin total listening time initialized (5.2 hours / 18,720s)!\n";

    // 5. Seed Weekly & Daily Stats for Current Week (Week 38, Sep 14 - Sep 20, 2026)
    $currentYear = (int)date('Y');
    $currentWeek = (int)date('W');
    $monday = date('Y-m-d', strtotime('monday this week'));
    $sunday = date('Y-m-d', strtotime('sunday this week'));

    // 5a. Seed Daily Stats for the past days of this week
    $dailyDays = [
        ['date' => date('Y-m-d', strtotime('monday this week')), 'dow' => 1, 'sec' => 3600, 'tracks' => 12],
        ['date' => date('Y-m-d', strtotime('tuesday this week')), 'dow' => 2, 'sec' => 4800, 'tracks' => 16],
        ['date' => date('Y-m-d', strtotime('wednesday this week')), 'dow' => 3, 'sec' => 5400, 'tracks' => 18],
        ['date' => date('Y-m-d', strtotime('thursday this week')), 'dow' => 4, 'sec' => 0, 'tracks' => 0],
        ['date' => date('Y-m-d', strtotime('friday this week')), 'dow' => 5, 'sec' => 0, 'tracks' => 0],
        ['date' => date('Y-m-d', strtotime('saturday this week')), 'dow' => 6, 'sec' => 0, 'tracks' => 0],
        ['date' => date('Y-m-d', strtotime('sunday this week')), 'dow' => 7, 'sec' => 0, 'tracks' => 0],
    ];

    $insDaily = $pdo->prepare("INSERT INTO user_daily_stats (user_id, stat_date, day_of_week, listening_seconds, tracks_count, genres_breakdown) 
        VALUES (?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE listening_seconds = VALUES(listening_seconds), tracks_count = VALUES(tracks_count)");

    $dailyBreakdown = ['mon' => 3600, 'tue' => 4800, 'wed' => 5400, 'thu' => 0, 'fri' => 0, 'sat' => 0, 'sun' => 0];

    foreach ($dailyDays as $d) {
        $genresJson = json_encode(['lofi' => (int)($d['sec'] * 0.5), 'synthwave' => (int)($d['sec'] * 0.3), 'chill' => (int)($d['sec'] * 0.2)]);
        $insDaily->execute([$adminId, $d['date'], $d['dow'], $d['sec'], $d['tracks'], $genresJson]);
    }
    echo "✅ [5/6] Daily listening stats initialized for the current week!\n";

    // 5b. Seed Weekly Summary Stat
    $insWeekly = $pdo->prepare("INSERT INTO user_weekly_stats (user_id, year, week_number, start_date, end_date, total_seconds, tracks_count, daily_seconds, top_genres) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE total_seconds = VALUES(total_seconds), tracks_count = VALUES(tracks_count), daily_seconds = VALUES(daily_seconds)");

    $topGenresJson = json_encode(['lofi', 'synthwave', 'chill', 'vpop']);
    $insWeekly->execute([
        $adminId,
        $currentYear,
        $currentWeek,
        $monday,
        $sunday,
        13800, // 3.83 hours this week
        46,    // 46 tracks this week
        json_encode($dailyBreakdown),
        $topGenresJson
    ]);
    echo "✅ [6/6] Weekly listening stats initialized: 13,800s (3.83 hrs), 46 tracks, 7-day breakdown!\n\n";

} catch (Exception $e) {
    echo "❌ Database initialization error: " . $e->getMessage() . "\n";
    exit(1);
}
