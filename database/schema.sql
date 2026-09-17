-- ==========================================================
-- Database Schema for MinhDucEar (Pro & Firebase Compatible)
-- ==========================================================
-- Thiết kế lưu trữ đầy đủ 7 mục cốt lõi CHO RIÊNG TỪNG TÀI KHOẢN:
-- 1. ƯA THÍCH (Favorites)
-- 2. LỊCH SỬ NGHE (History)
-- 3. ALBUM (Albums của User & Album đã lưu vào thư viện)
-- 4. PLAYLIST (Danh sách phát cá nhân)
-- 5. GU ÂM NHẠC (Music Taste / Preferences)
-- 6. THỜI GIAN NGHE (Listening Time - từng giây, từng giờ)
-- 7. THỐNG KÊ TUẦN (Weekly Listening Statistics & Daily Breakdown)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `minhduc_ear` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `minhduc_ear`;

-- ---------------------------------------------------------
-- 1. USERS TABLE
-- Maps to Firebase Auth & Firestore Collection: /users/{firebase_uid}
-- Lưu thông tin tài khoản, tổng thời gian nghe & Gu âm nhạc
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) UNIQUE NOT NULL COMMENT 'UUID v4 for Firestore Document ID fallback',
  `firebase_uid` VARCHAR(128) UNIQUE NULL COMMENT 'Firebase Authentication UID (Google / Email Auth)',
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `google_id` VARCHAR(255) UNIQUE NULL,
  `password_hash` VARCHAR(255) NULL COMMENT 'Nullable when using Firebase/Google SSO',
  `display_name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'MEMBER',
  `avatar_url` VARCHAR(500) DEFAULT 'assets/images/avatars/default.png',
  `google_picture` VARCHAR(500) NULL,
  `listening_hours` FLOAT DEFAULT 0.0 COMMENT 'Tổng số giờ nghe nhạc của tài khoản',
  `total_listening_seconds` BIGINT DEFAULT 0 COMMENT 'Tổng số giây nghe nhạc chính xác tích lũy',
  `music_taste` VARCHAR(500) DEFAULT 'lofi,synthwave,chill' COMMENT 'Gu âm nhạc cá nhân (danh sách thể loại)',
  `custom_sync_url` VARCHAR(500) NULL COMMENT 'URL nguồn YouTube Music đồng bộ riêng',
  `metadata` JSON NULL COMMENT 'Chi tiết gu âm nhạc NoSQL: EQ profile, favorite genres, top artists, bitrate',
  `synced_at` TIMESTAMP NULL COMMENT 'Mốc thời gian đồng bộ lần cuối với Firebase',
  `is_deleted` TINYINT(1) DEFAULT 0 COMMENT 'Soft delete flag cho sync 2 chiều',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_firebase_uid (`firebase_uid`),
  INDEX idx_users_email (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 2. TRACKS TABLE
-- Maps to Firestore Collection: /tracks/{track_uuid}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tracks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) UNIQUE NOT NULL COMMENT 'UUID v4 for Firestore Document ID',
  `firebase_id` VARCHAR(128) UNIQUE NULL COMMENT 'Firestore Document ID reference',
  `title` VARCHAR(255) NOT NULL,
  `artist` VARCHAR(255) NOT NULL,
  `album` VARCHAR(255) DEFAULT 'Single',
  `genre` VARCHAR(100) DEFAULT 'Chill',
  `duration` INT DEFAULT 180 COMMENT 'Thời lượng bài hát (giây)',
  `format` VARCHAR(50) DEFAULT 'FLAC 96k',
  `cover_url` TEXT NULL COMMENT 'Ảnh bìa bài hát',
  `audio_url` TEXT NULL COMMENT 'URL phát nhạc (Local stream hoặc Firebase Cloud Storage)',
  `storage_path` VARCHAR(500) NULL COMMENT 'Đường dẫn Firebase Storage: gs://bucket/tracks/audio/...',
  `source_type` ENUM('youtube', 'database', 'stream', 'firebase', 'synth') DEFAULT 'youtube',
  `youtube_id` VARCHAR(50) DEFAULT NULL,
  `audio_blob` LONGBLOB DEFAULT NULL COMMENT 'Fallback cục bộ - không lưu blob lên Firebase',
  `audio_mime` VARCHAR(50) DEFAULT 'audio/mpeg',
  `audio_size` BIGINT DEFAULT 0,
  `lyrics` LONGTEXT DEFAULT NULL,
  `views_count` INT DEFAULT 0,
  `likes_count` INT DEFAULT 0,
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `user_id` INT DEFAULT NULL COMMENT 'ID tài khoản tải lên / sở hữu track (nếu có)',
  `creator_uid` VARCHAR(128) DEFAULT NULL COMMENT 'Firebase UID của người tải lên',
  `metadata` JSON NULL COMMENT 'Metadata linh hoạt: waveform, bpm, bit depth, tags',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX idx_tracks_uuid (`uuid`),
  INDEX idx_tracks_youtube (`youtube_id`),
  INDEX idx_tracks_featured (`is_featured`),
  INDEX idx_tracks_views (`views_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3. ALBUMS TABLE
-- Maps to Firestore Collection: /albums/{album_uuid}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `albums` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) UNIQUE NOT NULL COMMENT 'UUID v4 for Firestore Document ID',
  `firebase_id` VARCHAR(128) UNIQUE NULL,
  `user_id` INT NULL COMMENT 'ID tài khoản sở hữu/tạo album (NULL nếu là Album công cộng)',
  `creator_uid` VARCHAR(128) NULL COMMENT 'Firebase UID của người tạo album',
  `title` VARCHAR(255) NOT NULL,
  `artist` VARCHAR(255) NOT NULL,
  `cover_url` TEXT NULL,
  `year` VARCHAR(10) DEFAULT '2026',
  `badge` VARCHAR(50) DEFAULT 'FLAC 96k',
  `genre` VARCHAR(100) DEFAULT 'Chill',
  `description` TEXT NULL,
  `is_public` TINYINT(1) DEFAULT 1,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX idx_albums_uuid (`uuid`),
  INDEX idx_albums_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3b. ALBUM TRACKS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `album_tracks` (
  `album_id` INT NOT NULL,
  `track_id` INT NOT NULL,
  `position` INT DEFAULT 0 COMMENT 'Thứ tự bài hát trong album',
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`album_id`, `track_id`),
  FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE,
  INDEX idx_album_tracks_pos (`album_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3c. USER SAVED ALBUMS (Mục Album đã lưu CHO RIÊNG TỪNG TÀI KHOẢN)
-- Maps to Firestore: /users/{user_uid}/saved_albums/{album_uuid}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_saved_albums` (
  `user_id` INT NOT NULL COMMENT 'ID tài khoản người dùng đã lưu album',
  `album_id` INT NOT NULL COMMENT 'ID album được lưu vào thư viện riêng',
  `saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `album_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON DELETE CASCADE,
  INDEX idx_saved_albums_user (`user_id`),
  INDEX idx_saved_albums_album (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 4. PLAYLISTS TABLE (Danh sách phát CHO RIÊNG TỪNG TÀI KHOẢN)
-- Maps to Firestore Collection: /playlists/{playlist_uuid}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) UNIQUE NOT NULL COMMENT 'UUID v4 for Firestore Document ID',
  `firebase_id` VARCHAR(128) UNIQUE NULL,
  `user_id` INT NOT NULL COMMENT 'ID tài khoản sở hữu playlist này',
  `owner_uid` VARCHAR(128) DEFAULT NULL COMMENT 'Firebase UID của chủ playlist',
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `cover_url` VARCHAR(500) DEFAULT NULL,
  `is_public` TINYINT(1) DEFAULT 1,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_playlists_uuid (`uuid`),
  INDEX idx_playlists_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 4b. PLAYLIST TRACKS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `playlist_tracks` (
  `playlist_id` INT NOT NULL,
  `track_id` INT NOT NULL,
  `position` INT DEFAULT 0 COMMENT 'Thứ tự bài hát trong playlist',
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`playlist_id`, `track_id`),
  FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE,
  INDEX idx_pl_tracks_pos (`playlist_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 5. FAVORITES TABLE (Mục Ưa Thích CHO RIÊNG TỪNG TÀI KHOẢN)
-- Maps to Firestore: /users/{user_uid}/favorites/{track_uuid}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `favorites` (
  `user_id` INT NOT NULL COMMENT 'ID tài khoản người thả tim',
  `track_id` INT NOT NULL COMMENT 'ID bài hát được yêu thích',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `track_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE,
  INDEX idx_fav_user (`user_id`),
  INDEX idx_fav_track (`track_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 6. HISTORY TABLE (Lịch Sử Nghe & Thời Gian Nghe Từng Bài CHO RIÊNG TỪNG TÀI KHOẢN)
-- Maps to Firestore: /users/{user_uid}/history/{history_uuid}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) UNIQUE NOT NULL,
  `user_id` INT NOT NULL COMMENT 'ID tài khoản người đã nghe',
  `track_id` INT NOT NULL COMMENT 'ID bài hát đã nghe',
  `duration_played` INT DEFAULT 0 COMMENT 'Thời gian nghe của phiên này (tính bằng giây)',
  `played_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE,
  INDEX idx_history_user (`user_id`, `played_at`),
  INDEX idx_history_track (`track_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 7. USER MUSIC TASTE (Chi Tiết Gu Âm Nhạc CHO RIÊNG TỪNG TÀI KHOẢN)
-- Maps to Firestore: /users/{user_uid}/music_taste/{genre}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_music_taste` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'ID tài khoản người dùng',
  `genre` VARCHAR(100) NOT NULL COMMENT 'Thể loại hoặc phong cách (lofi, synthwave, vpop...)',
  `score` FLOAT DEFAULT 1.0 COMMENT 'Trọng số yêu thích (tăng dần theo thời gian nghe)',
  `play_count` INT DEFAULT 1 COMMENT 'Số bài đã nghe thuộc thể loại này',
  `total_seconds` INT DEFAULT 0 COMMENT 'Tổng số giây đã nghe thể loại này',
  `last_listened_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_genre` (`user_id`, `genre`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_user_taste_score (`user_id`, `score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 8. USER DAILY STATS (Thống Kê Nghe Nhạc Theo Ngày)
-- Maps to Firestore: /users/{user_uid}/daily_stats/{YYYY-MM-DD}
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_daily_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'ID tài khoản',
  `stat_date` DATE NOT NULL COMMENT 'Ngày ghi nhận thống kê (YYYY-MM-DD)',
  `day_of_week` TINYINT NOT NULL COMMENT '1 = Thứ 2, 2 = Thứ 3, ..., 7 = Chủ Nhật',
  `listening_seconds` INT DEFAULT 0 COMMENT 'Tổng số giây nghe trong ngày này',
  `tracks_count` INT DEFAULT 0 COMMENT 'Tổng số bài hát đã nghe trong ngày',
  `genres_breakdown` JSON NULL COMMENT 'Chi tiết thể loại nghe trong ngày: {"lofi": 1200, "chill": 600}',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_daily` (`user_id`, `stat_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_daily_user_date (`user_id`, `stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 9. USER WEEKLY STATS (Thống Kê Nghe Nhạc Theo Tuần)
-- Maps to Firestore: /users/{user_uid}/weekly_stats/{YYYY_WW}
-- Phân tích chi tiết 7 ngày trong tuần, tổng giờ, và bài hát hot nhất
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_weekly_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'ID tài khoản',
  `year` INT NOT NULL COMMENT 'Năm (VD: 2026)',
  `week_number` INT NOT NULL COMMENT 'Số thứ tự tuần trong năm (1 - 53)',
  `start_date` DATE NOT NULL COMMENT 'Ngày Thứ 2 đầu tuần',
  `end_date` DATE NOT NULL COMMENT 'Ngày Chủ Nhật cuối tuần',
  `total_seconds` INT DEFAULT 0 COMMENT 'Tổng thời gian nghe trong tuần (giây)',
  `total_hours` FLOAT GENERATED ALWAYS AS (ROUND(`total_seconds` / 3600, 2)) STORED COMMENT 'Số giờ nghe trong tuần',
  `tracks_count` INT DEFAULT 0 COMMENT 'Tổng số bài đã nghe trong tuần',
  `daily_seconds` JSON NULL COMMENT 'Số giây nghe 7 ngày: {"mon": 1800, "tue": 2400, "wed": 3600, "thu": 1200, "fri": 4500, "sat": 6000, "sun": 3200}',
  `top_genres` JSON NULL COMMENT 'Top thể loại nghe nhiều nhất tuần: ["lofi", "synthwave", "chill"]',
  `top_tracks` JSON NULL COMMENT 'Danh sách ID bài hát nghe nhiều nhất trong tuần',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_weekly` (`user_id`, `year`, `week_number`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_weekly_user_year_week (`user_id`, `year`, `week_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 10. FIREBASE SYNC LOGS (Đồng Bộ 2 Chiều Firebase)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `firebase_sync_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entity_type` ENUM('users', 'tracks', 'albums', 'playlists', 'favorites', 'history', 'saved_albums', 'music_taste', 'weekly_stats', 'daily_stats') NOT NULL,
  `entity_id` INT NOT NULL,
  `entity_uuid` CHAR(36) NOT NULL,
  `user_id` INT NULL COMMENT 'Tài khoản liên quan đến sự kiện đồng bộ',
  `action` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `status` ENUM('PENDING', 'SYNCED', 'FAILED') DEFAULT 'PENDING',
  `retry_count` INT DEFAULT 0,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `synced_at` TIMESTAMP NULL,
  INDEX idx_sync_status (`status`, `entity_type`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
