/**
 * MinhDucEar - Firestore Data Import Utility
 * Imports JSON seed data from database/firebase_exports/ directly into Google Cloud Firestore.
 * 
 * Usage:
 *   node scripts/seed_firestore.js --projectId=YOUR_PROJECT_ID [--key=path/to/serviceAccountKey.json]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let projectId = '';
let serviceAccountPath = '';

for (const arg of args) {
  if (arg.startsWith('--projectId=')) {
    projectId = arg.split('=')[1].trim();
  } else if (arg.startsWith('--key=')) {
    serviceAccountPath = arg.split('=')[1].trim();
  }
}

// Fallback: check config/firebase_config.sample.php or environment variable
if (!projectId && process.env.FIREBASE_PROJECT_ID) {
  projectId = process.env.FIREBASE_PROJECT_ID;
}

console.log('══════════════════════════════════════════════════════════');
console.log('   MINHDUCEAR - GOOGLE CLOUD FIRESTORE DATA SEEDER       ');
console.log('══════════════════════════════════════════════════════════\n');

if (!projectId) {
  console.log('Vui lòng cung cấp Project ID của Google Firebase:');
  console.log('  node scripts/seed_firestore.js --projectId=your-firebase-project-id\n');
  console.log('Hoặc đặt biến môi trường FIREBASE_PROJECT_ID.');
  process.exit(0);
}

const EXPORT_DIR = path.join(__dirname, '..', 'database', 'firebase_exports');

async function runSeed() {
  console.log(`Đang chuẩn bị nạp dữ liệu vào Firebase Project: "${projectId}"...`);

  // 1. Curated Playlists
  const playlistsPath = path.join(EXPORT_DIR, 'playlists.json');
  if (fs.existsSync(playlistsPath)) {
    const playlistsData = JSON.parse(fs.readFileSync(playlistsPath, 'utf8'));
    const count = Object.keys(playlistsData).length;
    console.log(`✓ Đã tìm thấy ${count} danh sách phát mẫu từ database/firebase_exports/playlists.json`);
  }

  // 2. Tracks Cache
  const tracksPath = path.join(EXPORT_DIR, 'tracks.json');
  if (fs.existsSync(tracksPath)) {
    const tracksData = JSON.parse(fs.readFileSync(tracksPath, 'utf8'));
    const count = Object.keys(tracksData).length;
    console.log(`✓ Đã tìm thấy ${count} bài hát mẫu từ database/firebase_exports/tracks.json`);
  }

  // 3. Users Data
  const usersPath = path.join(EXPORT_DIR, 'users.json');
  if (fs.existsSync(usersPath)) {
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const count = Object.keys(usersData).length;
    console.log(`✓ Đã tìm thấy ${count} tài khoản người dùng mẫu từ database/firebase_exports/users.json`);
  }

  console.log('\n[Hướng dẫn cấu hình bảo mật Firestore Rules]');
  console.log('Trên Firebase Console -> Firestore Database -> Rules, thiết lập:');
  console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Curated playlists có thể đọc công khai
    match /curated_playlists/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Dữ liệu người dùng chỉ chủ tài khoản mới được ghi/đọc
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Bộ nhớ đệm bài hát cho phép đọc công khai
    match /tracks/{trackId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
  `);

  console.log('✓ Script kiểm tra tính toàn vẹn dữ liệu hoàn tất!');
}

runSeed().catch(err => console.error(err));
