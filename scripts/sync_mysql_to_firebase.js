/**
 * MinhDucEar - Full MySQL to Cloud Firestore Migration & Bridge
 * Synchronizes:
 *  1. Tracks Collection -> /tracks/{id}
 *  2. Playlists Collection -> /playlists/{id}
 *  3. Albums Collection -> /albums/{id}
 *  4. Users Collection & Subcollections:
 *     - users/{uid}
 *     - users/{uid}/favorites/{trackKey}
 *     - users/{uid}/history/{trackKey}
 *     - users/{uid}/saved_albums/{albumKey}
 *     - users/{uid}/taste/profile
 *     - users/{uid}/weekly_stats/{weekKey}
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIREBASE_CONFIG = {
  projectId: 'minhducear-f055d',
  apiKey: 'AIzaSyA_dQjex_0sZj4h2rZl4Fb0Gk_aumJ-c0'
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

function cleanId(str) {
  return String(str || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'object' && item !== null) {
              return { mapValue: { fields: toFirestoreFields(item) } };
            }
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

async function patchDocument(docPath, data) {
  const url = `${BASE_URL}/${docPath}?key=${FIREBASE_CONFIG.apiKey}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });
  if (!res.ok) {
    const errText = await res.text();
    console.warn(`[Failed PATCH] ${docPath}: ${res.status} ${errText}`);
    return false;
  }
  return true;
}

async function runConcurrent(items, concurrency, fn) {
  let index = 0;
  const total = items.length;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < total) {
      const i = index++;
      await fn(items[i], i, total);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log('🚀 Starting Full MySQL -> Cloud Firestore Sync...');
  const exportDir = path.join(__dirname, '../database/firebase_exports');

  // 1. Load exported data
  const tracksFile = path.join(exportDir, 'tracks.json');
  const playlistsFile = path.join(exportDir, 'playlists.json');
  const albumsFile = path.join(exportDir, 'albums.json');
  const usersFile = path.join(exportDir, 'users.json');

  const tracks = fs.existsSync(tracksFile) ? JSON.parse(fs.readFileSync(tracksFile, 'utf8')) : {};
  const playlists = fs.existsSync(playlistsFile) ? JSON.parse(fs.readFileSync(playlistsFile, 'utf8')) : {};
  const albums = fs.existsSync(albumsFile) ? JSON.parse(fs.readFileSync(albumsFile, 'utf8')) : {};
  const users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : {};

  const tracksList = Object.values(tracks);
  const playlistsList = Object.values(playlists);
  const albumsList = Object.values(albums);
  const usersList = Object.values(users);

  console.log(`📦 Loaded: ${tracksList.length} tracks, ${playlistsList.length} playlists, ${albumsList.length} albums, ${usersList.length} users.`);

  // Lookup map for tracks by UUID and by ID
  const tracksByUuid = {};
  const tracksById = {};
  for (const t of tracksList) {
    if (t.uuid) tracksByUuid[t.uuid] = t;
    if (t.id) tracksById[t.id] = t;
  }

  // -------------------------------------------------------------
  // 1. SYNC TRACKS COLLECTION (/tracks/{id})
  // -------------------------------------------------------------
  console.log(`\n🎵 [1/4] Syncing ${tracksList.length} tracks to /tracks...`);
  let tracksDone = 0;
  await runConcurrent(tracksList, 20, async (t) => {
    const docId = t.youtubeId || t.uuid || ('trk_' + t.id);
    const cleanDocId = cleanId(docId);
    await patchDocument(`tracks/${cleanDocId}`, {
      id: t.id,
      uuid: t.uuid,
      title: t.title || 'Bản nhạc',
      artist: t.artist || 'Nghệ sĩ',
      album: t.album || 'YouTube Music',
      genre: t.genre || 'Chill',
      duration: t.duration || 210,
      format: t.format || 'YT AUDIO 320k',
      cover_url: t.coverUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : ''),
      coverUrl: t.coverUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : ''),
      youtube_id: t.youtubeId || '',
      youtubeId: t.youtubeId || '',
      audio_url: t.audioUrl || '',
      source_type: t.sourceType || 'youtube',
      views_count: t.viewsCount || 0,
      likes_count: t.likesCount || 0,
      is_featured: Boolean(t.isFeatured),
      has_lyrics: Boolean(t.hasLyrics),
      created_at: t.createdAt || new Date().toISOString()
    });
    tracksDone++;
    if (tracksDone % 100 === 0 || tracksDone === tracksList.length) {
      console.log(`   Processed ${tracksDone}/${tracksList.length} tracks...`);
    }
  });

  // -------------------------------------------------------------
  // 2. SYNC PLAYLISTS COLLECTION (/playlists/{id})
  // -------------------------------------------------------------
  console.log(`\n📂 [2/4] Syncing ${playlistsList.length} playlists to /playlists...`);
  for (const pl of playlistsList) {
    const docId = cleanId(pl.uuid || ('pl_' + pl.id));
    const resolvedTracks = (pl.trackUuids || []).map(u => {
      const trk = tracksByUuid[u];
      if (!trk) return null;
      return {
        id: 'yt_' + (trk.youtubeId || trk.id),
        db_id: trk.id,
        youtube_id: trk.youtubeId || '',
        title: trk.title,
        artist: trk.artist,
        album: trk.album,
        duration: trk.duration || 210,
        format: trk.format || 'YT 320k',
        cover_url: trk.coverUrl || (trk.youtubeId ? `https://i.ytimg.com/vi/${trk.youtubeId}/hqdefault.jpg` : '')
      };
    }).filter(Boolean);

    await patchDocument(`playlists/${docId}`, {
      id: pl.id,
      uuid: pl.uuid,
      name: pl.name,
      description: pl.description || '',
      cover_url: pl.coverUrl || '',
      coverUrl: pl.coverUrl || '',
      is_public: Boolean(pl.isPublic),
      owner_uid: pl.ownerUid || '',
      track_uuids: pl.trackUuids || [],
      tracks_count: resolvedTracks.length,
      tracks: resolvedTracks,
      created_at: pl.createdAt || new Date().toISOString()
    });
    console.log(`   Synced playlist: ${pl.name} (${resolvedTracks.length} tracks)`);
  }

  // -------------------------------------------------------------
  // 3. SYNC ALBUMS COLLECTION (/albums/{id})
  // -------------------------------------------------------------
  if (albumsList.length > 0) {
    console.log(`\n💿 [3/4] Syncing ${albumsList.length} albums to /albums...`);
    for (const alb of albumsList) {
      const docId = cleanId(alb.uuid || ('alb_' + alb.id));
      await patchDocument(`albums/${docId}`, {
        id: alb.id,
        uuid: alb.uuid,
        title: alb.title,
        artist: alb.artist,
        cover_url: alb.coverUrl || '',
        coverUrl: alb.coverUrl || '',
        year: alb.year || 2026,
        badge: alb.badge || 'ALBUM',
        genre: alb.genre || 'Chill',
        description: alb.description || '',
        is_public: Boolean(alb.isPublic),
        created_at: alb.createdAt || new Date().toISOString()
      });
      console.log(`   Synced album: ${alb.title}`);
    }
  }

  // -------------------------------------------------------------
  // 4. SYNC USERS & THEIR PER-ACCOUNT SUBCOLLECTIONS (/users/{uid})
  // -------------------------------------------------------------
  console.log(`\n👥 [4/4] Syncing ${usersList.length} users with isolated Favorites & History...`);
  for (const u of usersList) {
    const canonicalUid = cleanId(u.email || u.uuid);
    const uidsToSync = [canonicalUid];
    // If this is the active user hirasakai0725@gmail.com, also alias to legacy keys
    if (u.email === 'hirasakai0725@gmail.com') {
      uidsToSync.push('goog_115424860304779353235');
      uidsToSync.push('6400');
    }

    for (const uid of uidsToSync) {
      // 4a. User document
      await patchDocument(`users/${uid}`, {
        id: u.id,
        uuid: u.uuid,
        username: u.username,
        email: u.email,
        display_name: u.displayName || u.username,
        displayName: u.displayName || u.username,
        name: u.displayName || u.username,
        role: u.role || 'AUDIOPHILE',
        avatar_url: u.photoURL || '',
        photoURL: u.photoURL || '',
        listening_hours: u.listeningHours || 0.0,
        listeningHours: u.listeningHours || 0.0,
        total_listening_seconds: u.totalListeningSeconds || 0,
        music_taste_tags: u.musicTasteTags || [],
        created_at: u.createdAt || new Date().toISOString(),
        synced_at: new Date().toLocaleString('vi-VN')
      });

      // 4b. Subcollection: Favorites
      const favs = u.subcollections?.favorites || [];
      for (const f of favs) {
        const trk = tracksByUuid[f.uuid];
        if (!trk) continue;
        const rawKey = trk.youtubeId || trk.id || trk.uuid;
        const trackKey = cleanId(rawKey);
        await patchDocument(`users/${uid}/favorites/${trackKey}`, {
          id: 'yt_' + (trk.youtubeId || trk.id),
          db_id: trk.id,
          youtube_id: trk.youtubeId || '',
          title: trk.title,
          artist: trk.artist,
          album: trk.album,
          cover_url: trk.coverUrl || (trk.youtubeId ? `https://i.ytimg.com/vi/${trk.youtubeId}/hqdefault.jpg` : ''),
          duration: trk.duration || 210,
          format: trk.format || 'YT AUDIO 320k',
          created_at: f.created_at || new Date().toISOString()
        });
      }

      // 4c. Subcollection: History
      const hist = u.subcollections?.history || [];
      for (const h of hist) {
        const trk = tracksByUuid[h.track_uuid];
        if (!trk) continue;
        const rawKey = trk.youtubeId || trk.id || trk.uuid;
        const trackKey = cleanId(rawKey);
        await patchDocument(`users/${uid}/history/${trackKey}`, {
          track: {
            id: 'yt_' + (trk.youtubeId || trk.id),
            db_id: trk.id,
            youtube_id: trk.youtubeId || '',
            title: trk.title,
            artist: trk.artist,
            cover_url: trk.coverUrl || (trk.youtubeId ? `https://i.ytimg.com/vi/${trk.youtubeId}/hqdefault.jpg` : ''),
            duration: trk.duration || 210,
            format: trk.format || 'YT 320k'
          },
          durationPlayed: h.duration_played || 0,
          playedAt: h.played_at ? new Date(h.played_at).getTime() : Date.now(),
          played_at: h.played_at || new Date().toISOString()
        });
      }

      // 4d. Music Taste
      if (Array.isArray(u.detailedMusicTaste) && u.detailedMusicTaste.length > 0) {
        await patchDocument(`users/${uid}/taste/profile`, {
          genres: u.detailedMusicTaste,
          updated_at: new Date().toISOString()
        });
      }

      // 4e. Weekly Stats
      if (Array.isArray(u.subcollections?.weeklyStats)) {
        for (const ws of u.subcollections.weeklyStats) {
          const weekKey = `${ws.year}_w${ws.week_number}`;
          await patchDocument(`users/${uid}/weekly_stats/${weekKey}`, {
            year: ws.year,
            week_number: ws.week_number,
            start_date: ws.start_date,
            end_date: ws.end_date,
            total_seconds: ws.total_seconds,
            total_hours: ws.total_hours,
            tracks_count: ws.tracks_count,
            daily_seconds: ws.daily_seconds,
            top_genres: ws.top_genres
          });
        }
      }

      console.log(`   User ${u.username} (${uid}) synced: ${favs.length} favs, ${hist.length} history.`);
    }
  }

  console.log('\n✅ ALL MySQL DATA HAS BEEN FULLY SYNCHRONIZED INTO CLOUD FIRESTORE!');
}

main().catch(console.error);
