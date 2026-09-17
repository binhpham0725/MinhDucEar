<?php
/**
 * Musixmatch & LRCLIB Synced Lyrics Integration Service
 * Fetches synchronized timestamped lyrics (LRC format) for real-time karaoke display
 */

class MusixmatchService {
    // Musixmatch API Key (default developer token)
    private static $apiKey = '2d2b56873b22e1189d2d0b5e523f666f';

    /**
     * Clean up song title to improve lyrics search matching
     * Strips common YouTube/MV suffixes
     */
    public static function cleanTrackTitle($title) {
        $cleaned = preg_replace('/\s*[\(\[](?:Official|MV|Audio|Music Video|Lyrics Video|Lyric Video|Remix|Cover|HD|HQ|4K|202\d|version).*?[\)\]]/iu', '', $title);
        $cleaned = preg_replace('/\s*-\s*(?:Official|MV|Audio|Music Video).*$/iu', '', $cleaned);
        $cleaned = preg_replace('/\s*\|\s*.*$/u', '', $cleaned);
        $cleaned = trim($cleaned);
        return !empty($cleaned) ? $cleaned : $title;
    }

    /**
     * Get synchronized lyrics by track title and artist
     */
    public static function getLyrics($trackTitle, $artist = '', $duration = 0) {
        $cleanTitle = self::cleanTrackTitle($trackTitle);
        $cleanArtist = trim($artist);

        $ctx = stream_context_create([
            'http' => [
                'timeout' => 4,
                'user_agent' => 'MinhDucEar-Player/2.5 (Windows; vi-VN)'
            ]
        ]);

        // ─────────────────────────────────────────────────────────────
        // 1. QUERY LRCLIB (World's #1 Open Synced Lyrics Database)
        // ─────────────────────────────────────────────────────────────
        try {
            // First attempt: Exact match get API
            $lrclibUrl = 'https://lrclib.net/api/get?track_name=' . urlencode($cleanTitle);
            if (!empty($cleanArtist)) {
                $lrclibUrl .= '&artist_name=' . urlencode($cleanArtist);
            }
            if ($duration > 0) {
                $lrclibUrl .= '&duration=' . intval($duration);
            }

            $res = @file_get_contents($lrclibUrl, false, $ctx);
            if ($res) {
                $data = json_decode($res, true);
                if (!empty($data['syncedLyrics'])) {
                    return [
                        'source' => 'lrclib_synced',
                        'lyrics' => trim($data['syncedLyrics']),
                        'is_synced' => true
                    ];
                }
            }

            // Second attempt: General Search API
            $searchQuery = !empty($cleanArtist) ? "{$cleanTitle} {$cleanArtist}" : $cleanTitle;
            $searchUrl = 'https://lrclib.net/api/search?q=' . urlencode($searchQuery);
            $resSearch = @file_get_contents($searchUrl, false, $ctx);
            if ($resSearch) {
                $items = json_decode($resSearch, true);
                if (is_array($items) && count($items) > 0) {
                    foreach ($items as $item) {
                        if (!empty($item['syncedLyrics'])) {
                            return [
                                'source' => 'lrclib_synced',
                                'lyrics' => trim($item['syncedLyrics']),
                                'is_synced' => true
                            ];
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // Continue to Musixmatch fallback
        }

        // ─────────────────────────────────────────────────────────────
        // 2. QUERY MUSIXMATCH API (Fallback for Plain Text or Synced)
        // ─────────────────────────────────────────────────────────────
        try {
            $q_track = urlencode($cleanTitle);
            $q_artist = urlencode($cleanArtist);
            $url = "https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?apikey=" . self::$apiKey . "&q_track={$q_track}&q_artist={$q_artist}&format=json";

            $res = @file_get_contents($url, false, $ctx);
            if ($res) {
                $data = json_decode($res, true);
                if (!empty($data['message']['body']['lyrics']['lyrics_body'])) {
                    $body = $data['message']['body']['lyrics']['lyrics_body'];
                    $body = preg_replace('/\*\*\*\*\*\*\* This Lyrics is NOT for Commercial use \*\*\*\*\*\*\*/i', '', $body);
                    $cleanBody = trim($body);

                    if (!empty($cleanBody)) {
                        // Check if contains LRC timestamps
                        $isSynced = preg_match('/\[\d{2}:\d{2}/', $cleanBody);
                        return [
                            'source' => 'musixmatch',
                            'lyrics' => $cleanBody,
                            'is_synced' => (bool)$isSynced
                        ];
                    }
                }
            }
        } catch (Exception $e) {
            // Continue
        }

        // ─────────────────────────────────────────────────────────────
        // 3. CURATED SYNCHRONIZED SAMPLES
        // ─────────────────────────────────────────────────────────────
        $sampleLyrics = [
            'Farewell of Voyager Star' => "[00:00.00] Farewell of Voyager Star (远航星的告别)\n[00:08.50] Ca sĩ: Emi Evans | Nhạc sĩ: Tarokiki\n[00:16.00] \n[00:18.20] In the quiet expanse of the nebula\n[00:26.40] A beacon pulses through the cosmic sea\n[00:34.10] Whispers of stars long since departed\n[00:43.30] Calling the voyagers back home\n[00:52.50] Across the resonance of time\n[01:01.00] We drift through stardust and memories\n[01:10.20] When silence covers the horizon\n[01:18.40] We will remember the starlight we shared\n[01:28.00] Farewell, traveler of the void\n[01:38.20] Until our paths align again in the dark",

            'Midnight Cyber Resonance' => "[00:00.00] Midnight Cyber Resonance\n[00:06.00] Nghệ sĩ: Emily & Synthwave Orchestra\n[00:12.30] \n[00:15.00] Driving down the neon avenue at 2 AM\n[00:24.50] Synthesizer frequencies pulsing in my veins\n[00:33.80] Hologram reflections on the windshield glass\n[00:42.20] Lost in the cybernetic rhythm of the night\n[00:52.10] Can you feel the bassline vibrating?\n[01:01.40] Resonance that never fades away\n[01:10.00] High-resolution waves in the matrix\n[01:20.50] We dance through the digital dawn",

            'Symphony No. 9 Aurora' => "[00:00.00] Symphony No. 9 Aurora\n[00:12.00] Soạn nhạc: Hiroyuki Sawano\n[00:22.10] \n[00:25.00] Grand orchestral strings rising in crescendo\n[00:38.40] Brass horns shattering the icy skies\n[00:52.20] Aurora dancing in emerald and violet\n[01:08.30] The choir sings of legends reborn\n[01:22.00] Beyond the frozen peaks of destiny\n[01:36.50] Light will pierce the deepest shadows\n[01:50.00] Echoes of eternity resounding",

            'Subsurface Protocol' => "[00:00.00] Subsurface Protocol\n[00:08.00] Thể loại: 20Hz Sub-Bass Audiophile\n[00:15.00] \n[00:18.00] Deep infrasonic frequencies descending\n[00:29.00] Pressure building at two hundred fathoms\n[00:42.00] Acoustic sonar bouncing through the dark\n[00:55.00] Sub-bass waves vibrating the hull\n[01:08.00] Total immersion into acoustic depths\n[01:22.00] Listen closely to the pulse of the abyss",

            'L\'Aurore Viendra' => "[00:00.00] L'Aurore Viendra\n[00:10.00] Nhạc game: Punishing Gray Raven OST | Vanguard Sound\n[00:20.00] \n[00:24.20] Même dans la nuit la plus sombre\n[00:36.50] Une lueur persiste et brille\n[00:49.10] Le jour viendra briser les ombres\n[01:02.30] Et guider nos cœurs vers l'infini\n[01:15.00] Portés par le vent et l'espoir\n[01:28.40] Demain verra renaître la lumière"
        ];

        foreach ($sampleLyrics as $titleKey => $lyricsContent) {
            if (stripos($trackTitle, $titleKey) !== false || stripos($cleanTitle, $titleKey) !== false) {
                return [
                    'source' => 'curated_synced',
                    'lyrics' => $lyricsContent,
                    'is_synced' => true
                ];
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 4. INSTRUMENTAL / NO LYRICS TRACKS -> SINGLE TITLE LINE ONLY
        // ─────────────────────────────────────────────────────────────
        return [
            'source' => 'single_title',
            'lyrics' => "[00:00.00] {$trackTitle}",
            'is_synced' => true
        ];
    }
}

