<?php
/**
 * YouTube Music & Audio Integration Service
 * 100% Genuine YouTube Music Innertube API (WEB_REMIX), Strict Music Filtering (<=15m, No Gaming/Vlog),
 * Disk Caching, Infinite Scroll Pagination & Album Tracks Provider
 */

class YouTubeMusicService {
    private static $cacheDir = __DIR__ . '/../../logs/yt_cache';

    /**
     * Search tracks exclusively from YouTube Music (Songs, Official MVs, Audio)
     * @param string $query User keyword
     * @param int $limit Number of tracks to return (e.g. 8 or 12)
     * @param string $category 'all' | 'vpop' | 'lofi' | 'synthwave' | 'anime' | 'audiophile'
     * @param int $offset Pagination offset (0, 8, 16...)
     */
    /**
     * Search tracks exclusively from YouTube Music (Songs, Official MVs, Audio)
     * @param string $query User keyword
     * @param int $limit Number of tracks to return (e.g. 8 or 12)
     * @param string $category 'all' | 'vpop' | 'lofi' | 'synthwave' | 'anime' | 'audiophile'
     * @param int $offset Pagination offset (0, 8, 16...)
     * @param array $excludeIds YouTube IDs already displayed to prevent duplicate cards
     */
    public static function search($query = '', $limit = 8, $category = 'all', $offset = 0, $excludeIds = []) {
        $q = trim($query);
        $isSpecificKeyword = !empty($q);

        $allTracks = [];
        $seenIds = array_flip($excludeIds);

        // Multi-variation query loop: query up to 4 variations to ensure exactly $limit fresh tracks
        for ($attempt = 0; $attempt < 4 && count($allTracks) < $limit; $attempt++) {
            $currOffset = $offset + ($attempt * $limit);
            $targetQuery = self::getQueryForOffset($q, $category, $currOffset, $limit);

            $batch = self::searchYouTubeMusic($targetQuery);

            foreach ($batch as $b) {
                $yId = $b['youtube_id'];
                if (!isset($seenIds[$yId])) {
                    $seenIds[$yId] = true;
                    $allTracks[] = $b;
                    if (count($allTracks) >= $limit) break 2;
                }
            }
        }

        // If still under limit for specific keyword, supplement with music-filtered search
        if (count($allTracks) < $limit && $isSpecificKeyword) {
            $suppQuery = "{$q} bài hát official audio";
            $fallbackTracks = self::searchDirectMusicFiltered($suppQuery);
            foreach ($fallbackTracks as $fb) {
                $yId = $fb['youtube_id'];
                if (!isset($seenIds[$yId])) {
                    $seenIds[$yId] = true;
                    $allTracks[] = $fb;
                    if (count($allTracks) >= $limit) break;
                }
            }
        }

        if (!empty($allTracks)) {
            return array_slice($allTracks, 0, $limit);
        }

        // Curated fallback only when no specific keyword was searched
        if (!$isSpecificKeyword) {
            return array_slice(self::getCuratedCatalog(), $offset % 12, $limit);
        }

        return [];
    }

    /**
     * Determine query expansion according to offset and category
     */
    private static function getQueryForOffset($q, $category, $offset, $limit) {
        $q = trim($q);
        $page = (int)floor($offset / max(1, $limit));

        if (!empty($q)) {
            $modifiers = [
                0 => '',
                1 => 'bài hát mới nhất',
                2 => 'official audio',
                3 => 'live acoustic chill',
                4 => 'remix tuyển tập',
                5 => 'album hits',
                6 => 'greatest songs',
                7 => 'special performance'
            ];
            $mod = $modifiers[$page % count($modifiers)];
            return empty($mod) ? $q : "{$q} {$mod}";
        }

        $categoryQueries = [
            'all' => [
                0 => 'thinh hanh nhac tre vpop 2026',
                1 => 'nhac tre remix hot trend tiktok 2026',
                2 => 'nhac chill acoustic ballad viet nam',
                3 => 'tuyen tap bai hat vpop trieu view',
                4 => 'nhac tre moi phat hanh 2026',
                5 => 'nhac hay nhat 2026 moi nguoi deu nghe'
            ],
            'supermix' => [
                0 => 'thinh hanh nhac tre vpop 2026',
                1 => 'nhac tre acoustic ballad viet nam',
                2 => 'vpop hot hits youtube music',
                3 => 'nhac tre remix hot trend tiktok 2026',
                4 => 'indie pop chill viet nam'
            ],
            'chill' => [
                0 => 'nhac chill thu gian nhe nhang acoustic',
                1 => 'lofi hip hop beats to relax study to',
                2 => 'coffee shop acoustic chill viet nam',
                3 => 'nhac ballad acoustic chill dem khuya',
                4 => 'r&b soul smooth chill viet nam',
                5 => 'nhac nhe nhang de ngu thu thai'
            ],
            'relax' => [
                0 => 'nhac chill thu gian nhe nhang acoustic',
                1 => 'lofi hip hop beats to relax study to',
                2 => 'coffee shop acoustic chill viet nam'
            ],
            'energy' => [
                0 => 'nhac tre remix hot trend tiktok 2026 bass cuc cang',
                1 => 'workout gym edm music boost',
                2 => 'vinahouse remix bass cang cuc dinh',
                3 => 'nhac edm nang luong tap luyen chay bo',
                4 => 'electro house festival dance mix'
            ],
            'workout' => [
                0 => 'nhac tre remix hot trend tiktok 2026 bass cuc cang',
                1 => 'workout gym edm music boost',
                2 => 'vinahouse remix bass cang cuc dinh'
            ],
            'mood' => [
                0 => 'nhac ballad tam trang buon viet nam 2026',
                1 => 'nhac suy ngam dem muon ballad hay nhat',
                2 => 'indie viet nam tam trang nhe nhang',
                3 => 'nhac buon cham vao trai tim',
                4 => 'nhac acoustic tam trang mua dem'
            ],
            'ballad' => [
                0 => 'nhac ballad tam trang buon viet nam 2026',
                1 => 'nhac suy ngam dem muon ballad hay nhat',
                2 => 'top ballad viet nam trieu view'
            ],
            'focus' => [
                0 => 'deep focus piano beats study work',
                1 => 'nhac khong loi tap trung lam viec hoc tap',
                2 => 'ambient deep focus alpha waves concentration',
                3 => 'lofi beats for coding and deep work',
                4 => 'classical piano for studying'
            ],
            'study' => [
                0 => 'deep focus piano beats study work',
                1 => 'lofi hip hop beats to relax study to',
                2 => 'nhac khong loi tap trung lam viec'
            ],
            'vpop' => [
                0 => 'bang xep hang top hits vpop 2026',
                1 => 'top nhac tre vpop thinh hanh nhat',
                2 => 'nhac tre moi phat hanh trieu view',
                3 => 'vpop trending youtube music',
                4 => 'ca khuc vpop hot trend tiktok'
            ],
            'trending' => [
                0 => 'bang xep hang top hits vpop 2026',
                1 => 'top nhac tre vpop thinh hanh nhat',
                2 => 'thinh hanh nhac tre vpop 2026'
            ],
            'retro' => [
                0 => 'synthwave cyberpunk retro chill beats',
                1 => 'retrowave darksynth neon night drive',
                2 => 'city pop japanese 80s retro groove',
                3 => 'nhac viet xua bat hu phong cach retro',
                4 => 'chillwave 80s futuristic electronic'
            ],
            'synthwave' => [
                0 => 'synthwave cyberpunk retro chill beats',
                1 => 'retrowave darksynth neon night drive',
                2 => 'chillwave 80s futuristic electronic',
                3 => 'cyberpunk 2077 ambient synthwave'
            ],
            'lofi' => [
                0 => 'lofi hip hop beats to relax study to',
                1 => 'lofi chill beats night rain sleep',
                2 => 'vietnamese lofi chill beats',
                3 => 'coffee shop lofi chill ambient',
                4 => 'japanese lofi city pop beats'
            ],
            'anime' => [
                0 => 'anime ost best epic soundtrack',
                1 => 'anime emotional piano orchestral ost',
                2 => 'epic battle anime soundtrack mix',
                3 => 'studio ghibli lofi chill orchestral'
            ],
            'audiophile' => [
                0 => 'audiophile hi-res flac 24bit vocal acoustic',
                1 => 'audiophile master dsd jazz vocal',
                2 => 'audiophile saxophone acoustic guitar reference',
                3 => 'audiophile classical symphony direct dsd'
            ]
        ];

        $catKey = strtolower(trim($category));
        $catList = $categoryQueries[$catKey] ?? $categoryQueries['all'];
        return $catList[$page % count($catList)];
    }

    /**
     * Get tracklist for a specific album
     */
    public static function getAlbumTracks($albumQuery, $limit = 10) {
        if (empty($albumQuery)) return [];
        $tracks = self::search($albumQuery, $limit, 'all', 0);
        if (empty($tracks)) {
            $tracks = self::search($albumQuery . ' full album', $limit, 'all', 0);
        }
        return $tracks;
    }

    /**
     * Search official YouTube Music API via Innertube WEB_REMIX endpoint
     */
    private static function searchYouTubeMusic($query) {
        if (!is_dir(self::$cacheDir)) {
            @mkdir(self::$cacheDir, 0777, true);
        }

        $cacheKey = md5('ytm_' . strtolower(trim($query)));
        $cacheFile = self::$cacheDir . "/yt_{$cacheKey}.json";

        // 15-minute disk cache validation
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 900)) {
            $cached = json_decode(@file_get_contents($cacheFile), true);
            if (!empty($cached) && is_array($cached)) {
                return $cached;
            }
        }

        $postData = json_encode([
            'context' => [
                'client' => [
                    'clientName' => 'WEB_REMIX',
                    'clientVersion' => '1.20240401.01.00',
                    'hl' => 'vi',
                    'gl' => 'VN'
                ]
            ],
            'query' => $query
        ]);

        $ch = curl_init('https://music.youtube.com/youtubei/v1/search');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer: https://music.youtube.com/'
        ]);

        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $results = [];
        if ($res && $httpCode === 200) {
            $data = json_decode($res, true);
            $items = [];
            self::extractMusicItemsRecursively($data, $items);

            $seen = [];
            foreach ($items as $item) {
                $navEndpoint = $item['navigationEndpoint'] ?? ($item['overlay']['musicItemThumbnailOverlayRenderer']['content']['musicPlayButtonRenderer']['playNavigationEndpoint'] ?? null);
                $videoId = $item['playlistItemData']['videoId'] ?? ($navEndpoint['watchEndpoint']['videoId'] ?? null);
                if (!$videoId || isset($seen[$videoId])) continue;

                // Title
                $titleRuns = $item['flexColumns'][0]['musicResponsiveListItemFlexColumnRenderer']['text']['runs'] ?? [];
                $title = '';
                foreach ($titleRuns as $r) $title .= $r['text'] ?? '';
                $title = trim($title);
                if (empty($title)) continue;

                // Non-music filter: skip gaming streams, vlogs, long videos
                if (self::isNonMusicTitle($title)) continue;

                // Artist & Duration in flexColumns & Accessibility Label
                $subRuns = $item['flexColumns'][1]['musicResponsiveListItemFlexColumnRenderer']['text']['runs'] ?? [];
                $artist = '';
                $durationText = '';
                $durationSeconds = 210;

                // Priority 1: Check Play Button accessibility label (e.g. "Phát [Title] - [Artist]")
                $playLabel = $item['overlay']['musicItemThumbnailOverlayRenderer']['content']['musicPlayButtonRenderer']['accessibilityPlayData']['accessibilityData']['label'] ?? '';
                if ($playLabel) {
                    $parts = explode(' - ', $playLabel, 2);
                    if (count($parts) === 2 && !empty(trim($parts[1]))) {
                        $artist = trim($parts[1]);
                    }
                }

                // Priority 2: Extract duration & secondary artist from subRuns
                foreach ($subRuns as $r) {
                    $t = trim($r['text'] ?? '');
                    if (empty($t) || $t === '•') continue;
                    if (preg_match('/^(\d+):(\d+)(?::(\d+))?$/', $t)) {
                        $durationText = $t;
                        $durationSeconds = self::parseDurationSeconds($t);
                    } elseif (empty($artist) && !str_contains($t, 'lượt xem') && !str_contains($t, 'views') && !str_contains($t, 'Video') && !str_contains($t, 'Bài hát') && !str_contains($t, 'Song') && !str_contains($t, 'Năm')) {
                        if (!preg_match('/^\d+$/', $t)) {
                            $artist = $t;
                        }
                    }
                }
                if (empty($artist)) {
                    $artist = 'Nghệ sĩ YouTube';
                }

                // Non-music filter: skip gaming streams, vlogs, audiobooks, drama, dharma talks
                if (self::isNonMusicTitle($title, $artist)) {
                    continue;
                }

                // Strict Song Filter: Duration must be between 60s (1 min) and 540s (9 min)
                // Exclude full albums, 1-hour compilations, tutorials, and non-music streams
                if ($durationSeconds > 540 || $durationSeconds < 60) {
                    continue;
                }

                $thumbs = $item['thumbnail']['musicThumbnailRenderer']['thumbnail']['thumbnails'] ?? [];
                $cover = !empty($thumbs) ? end($thumbs)['url'] : '';
                if (empty($cover) || strpos($cover, 'googleusercontent') !== false || strpos($cover, 'sqp=') !== false) {
                    $cover = "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg";
                }

                $results[] = [
                    'id' => 'yt_' . $videoId,
                    'youtube_id' => $videoId,
                    'title' => $title,
                    'artist' => $artist,
                    'album' => 'YouTube Music',
                    'duration' => $durationSeconds,
                    'duration_str' => $durationText ?: self::formatDurationString($durationSeconds),
                    'cover_url' => $cover,
                    'source_type' => 'youtube',
                    'format' => 'YT AUDIO 320k'
                ];
                $seen[$videoId] = true;
            }
        }

        if (!empty($results)) {
            @file_put_contents($cacheFile, json_encode($results));
        }

        return $results;
    }

    /**
     * Fallback YouTube search with strict duration and music-only keyword filtering
     */
    private static function searchDirectMusicFiltered($query) {
        if (!is_dir(self::$cacheDir)) {
            @mkdir(self::$cacheDir, 0777, true);
        }

        $cacheKey = md5('ytd_' . strtolower(trim($query)));
        $cacheFile = self::$cacheDir . "/yt_{$cacheKey}.json";

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 900)) {
            $cached = json_decode(@file_get_contents($cacheFile), true);
            if (!empty($cached)) return $cached;
        }

        $url = "https://www.youtube.com/results?search_query=" . urlencode($query . ' music');

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept-Language: vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        ]);

        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $results = [];
        if ($html && $httpCode === 200) {
            $data = self::extractYtInitialData($html);
            if ($data) {
                $sections = $data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'] ?? [];
                foreach ($sections as $section) {
                    $items = $section['itemSectionRenderer']['contents'] ?? [];
                    foreach ($items as $item) {
                        if (isset($item['videoRenderer'])) {
                            $v = $item['videoRenderer'];
                            $videoId = $v['videoId'] ?? null;
                            $title = $v['title']['runs'][0]['text'] ?? '';
                            $artist = $v['ownerText']['runs'][0]['text'] ?? ($v['shortBylineText']['runs'][0]['text'] ?? 'YouTube Music');
                            // Skip videos without lengthText (livestreams, podcasts, upcoming premieres)
                            if (!isset($v['lengthText'])) {
                                continue;
                            }
                            $durationText = $v['lengthText']['simpleText'] ?? '';
                            $durationSeconds = self::parseDurationSeconds($durationText);

                            // Strict Music Filter: duration between 60s and 540s, and no non-music / compilation titles!
                            if ($durationSeconds > 540 || $durationSeconds < 60 || self::isNonMusicTitle($title, $artist)) {
                                continue;
                            }

                            $thumb = $v['thumbnail']['thumbnails'][0]['url'] ?? '';
                            if (empty($thumb) || strpos($thumb, 'googleusercontent') !== false || strpos($thumb, 'sqp=') !== false) {
                                $thumb = "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg";
                            }

                            if ($videoId && $title) {
                                $results[] = [
                                    'id' => 'yt_' . $videoId,
                                    'youtube_id' => $videoId,
                                    'title' => $title,
                                    'artist' => $artist,
                                    'album' => 'YouTube Music',
                                    'duration' => $durationSeconds,
                                    'duration_str' => $durationText,
                                    'cover_url' => $thumb,
                                    'source_type' => 'youtube',
                                    'format' => 'YT AUDIO 320k'
                                ];
                            }
                        }
                    }
                }
            }
        }

        if (!empty($results)) {
            @file_put_contents($cacheFile, json_encode($results));
        }

        return $results;
    }

    /**
     * Check if a video title or artist is non-music (gaming stream, podcast, vlog, restream, audiobook, story, drama, compilation)
     */
    private static function isNonMusicTitle($title, $artist = '') {
        $combined = mb_strtolower(trim($title . ' ' . $artist), 'UTF-8');
        $nonMusicKeywords = [
            'buổi nhậu', 'chơi game', 'gameplay', 'playthrough', 'tập #', 'tập 1', 'tập 2', 'tập 3',
            'goose goose duck', 'the isle', 'backrooms', 'mimic party', 'restream', 'livestream',
            'highlight stream', 'độ đi date', 'doly phiêu lưu', 'đômakase', 'reaction video',
            'hài hước', 'liên quân', 'pubg', 'gta 5', 'talkshow', 'review phim', 'tâm sự',
            'haveasip', 'podcast', 'phỏng vấn', 'tin tức', 'vlog', '#shorts', 'hút shisha',
            'tiểu thuyết', 'đọc truyện', 'kể truyện', 'chú đại bi', 'phim', 'movie', 'phần 1', 'phần 2',
            'văn chương', 'ngoại cảm', 'tâm lý', 'truyện ngắn', 'sách nói', 'audiobook',
            'ngôn tình', 'ngược tâm', 'trọn bộ', 'vấn đáp', 'tâm linh', 'thuyết pháp', 'thích đạo thịnh',
            'phật pháp', 'thầy thích', 'giảng pháp', 'kinh phật', 'người yêu cũ', 'phim ngắn', 'web drama',
            'tóm tắt', 'giải mã', 'bản tin', 'thời sự', 'phóng sự', 'chính trị', 'truyện audio',
            'kể chuyện đêm khuya', 'truyện ma', 'quàng a tũn', 'nguyễn ngọc ngạn', 'cười nhạo', 'ăn mày',
            'bài học cuộc sống', 'truyện thực tế', 'chuyện lạ', 'phim tài liệu', 'chuyện đời', 'radio:',
            'vở kịch', 'nàng dâu', 'mẹ chồng', 'spiderum', 'phân tích', 'bình luận',
            // Compilations, Tutorials & Non-singles
            'tuyển tập', 'liên khúc', 'lk ', 'nonstop', 'full album', 'tổng hợp', 'karaoke',
            'beat chuẩn', 'guitar cover', 'hướng dẫn', 'học đàn', 'dạy đàn', 'đệm hát',
            'fingerstyle', '1 tiếng', '2 tiếng', '3 tiếng', '1h', '2h', '3h', 'nhạc sống'
        ];

        foreach ($nonMusicKeywords as $bad) {
            if (str_contains($combined, $bad)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extract music items recursively from Innertube API response
     */
    private static function extractMusicItemsRecursively($arr, &$out) {
        if (!is_array($arr)) return;
        if (isset($arr['musicResponsiveListItemRenderer'])) {
            $out[] = $arr['musicResponsiveListItemRenderer'];
        }
        foreach ($arr as $v) {
            if (is_array($v)) self::extractMusicItemsRecursively($v, $out);
        }
    }

    /**
     * Robust extraction of ytInitialData JSON object from YouTube response
     */
    private static function extractYtInitialData($html) {
        if (!$html) return null;

        if (preg_match('/(?:var\s+|window\[[\'"]ytInitialData[\'"]\]\s*=\s*|ytInitialData\s*=\s*)({.+?});\s*<\/script>/s', $html, $m)) {
            $json = json_decode($m[1], true);
            if (!empty($json)) return $json;
        }

        $needle = 'var ytInitialData = ';
        $pos = strpos($html, $needle);
        if ($pos !== false) {
            $start = $pos + strlen($needle);
            $braceCount = 0;
            $len = strlen($html);
            for ($i = $start; $i < $len; $i++) {
                if ($html[$i] === '{') $braceCount++;
                elseif ($html[$i] === '}') {
                    $braceCount--;
                    if ($braceCount === 0) {
                        $jsonStr = substr($html, $start, $i - $start + 1);
                        $json = json_decode($jsonStr, true);
                        if (!empty($json)) return $json;
                        break;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Helper to parse "3:45" or "1:02:30" into integer seconds
     */
    private static function parseDurationSeconds($str) {
        if (empty($str)) return 210;
        $parts = array_map('intval', explode(':', $str));
        if (count($parts) === 3) {
            return $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
        } elseif (count($parts) === 2) {
            return $parts[0] * 60 + $parts[1];
        }
        return 210;
    }

    /**
     * Helper to format integer seconds into "MM:SS"
     */
    private static function formatDurationString($sec) {
        if ($sec <= 0) return '03:30';
        $h = floor($sec / 3600);
        $m = floor(($sec % 3600) / 60);
        $s = $sec % 60;
        if ($h > 0) {
            return sprintf('%d:%02d:%02d', $h, $m, $s);
        }
        return sprintf('%02d:%02d', $m, $s);
    }

    /**
     * Curated catalog for initial feed or explore view
     */
    public static function getCuratedCatalog() {
        return [
            [
                'id' => 'yt_SlQR9iu09bQ',
                'youtube_id' => 'SlQR9iu09bQ',
                'title' => 'COME MY WAY (Official Music Video)',
                'artist' => 'Sơn Tùng M-TP x Tyga',
                'album' => 'M-TP Entertainment',
                'duration' => 208,
                'duration_str' => '03:28',
                'cover_url' => 'https://i.ytimg.com/vi/SlQR9iu09bQ/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'FLAC 192k 24-bit'
            ],
            [
                'id' => 'yt_2WWYO8Kd5Gc',
                'youtube_id' => '2WWYO8Kd5Gc',
                'title' => 'Đừng Làm Trái Tim Anh Đau',
                'artist' => 'Sơn Tùng M-TP',
                'album' => 'M-TP Records',
                'duration' => 334,
                'duration_str' => '05:34',
                'cover_url' => 'https://i.ytimg.com/vi/2WWYO8Kd5Gc/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'FLAC 96k 24-bit'
            ],
            [
                'id' => 'yt_jfKfPfyJRdk',
                'youtube_id' => 'jfKfPfyJRdk',
                'title' => 'lofi hip hop radio - beats to relax/study to',
                'artist' => 'Lofi Girl',
                'album' => 'ChilledCow Records',
                'duration' => 360,
                'duration_str' => '06:00',
                'cover_url' => 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'VINYL LO-FI'
            ],
            [
                'id' => 'yt_MVPTGNGiI-4',
                'youtube_id' => 'MVPTGNGiI-4',
                'title' => 'Synthwave Radio - Chill synth / retro beats',
                'artist' => 'Lofi Girl Synthwave',
                'album' => 'Retro Cyberpunk',
                'duration' => 360,
                'duration_str' => '06:00',
                'cover_url' => 'https://i.ytimg.com/vi/MVPTGNGiI-4/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'DSD 2.8M'
            ],
            [
                'id' => 'yt_N29Tsihv998',
                'youtube_id' => 'N29Tsihv998',
                'title' => 'Chúng Ta Của Tương Lai',
                'artist' => 'Sơn Tùng M-TP',
                'album' => 'M-TP Entertainment',
                'duration' => 252,
                'duration_str' => '04:12',
                'cover_url' => 'https://i.ytimg.com/vi/N29Tsihv998/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'V-POP MASTER'
            ],
            [
                'id' => 'yt_G7KNmW9a75Y',
                'youtube_id' => 'G7KNmW9a75Y',
                'title' => 'Nấu Ăn Cho Em',
                'artist' => 'Đen ft. PiaLinh',
                'album' => 'Đen Vâu Official',
                'duration' => 280,
                'duration_str' => '04:40',
                'cover_url' => 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'ACOUSTIC 24b'
            ],
            [
                'id' => 'yt_488ceQWoGGw',
                'youtube_id' => '488ceQWoGGw',
                'title' => 'Có Chắc Yêu Là Đây',
                'artist' => 'Sơn Tùng M-TP',
                'album' => 'M-TP Records',
                'duration' => 202,
                'duration_str' => '03:22',
                'cover_url' => 'https://i.ytimg.com/vi/488ceQWoGGw/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'V-POP MASTER'
            ],
            [
                'id' => 'yt_J2U_5x6NcrM',
                'youtube_id' => 'J2U_5x6NcrM',
                'title' => 'Lạ Lùng',
                'artist' => 'Vũ.',
                'album' => 'Vũ. Official',
                'duration' => 264,
                'duration_str' => '04:24',
                'cover_url' => 'https://i.ytimg.com/vi/J2U_5x6NcrM/hqdefault.jpg',
                'source_type' => 'youtube',
                'format' => 'INDIE FLAC'
            ]
        ];
    }
}
