<?php
/**
 * MinhDucEar - Firebase Configuration Template
 * 
 * Khi bạn muốn kết nối hoặc chuyển đổi sang Google Firebase:
 * 1. Vào https://console.firebase.google.com -> Tạo Project "minhduc-ear"
 * 2. Kích hoạt:
 *    - Firebase Authentication (Google Sign-In, Email/Password)
 *    - Cloud Firestore Database (chế độ Production hoặc Test)
 *    - Cloud Storage (lưu trữ file âm thanh lossless, cover)
 * 3. Copy các thông số Project Settings vào file này và đổi tên thành `firebase_config.php`.
 */

return [
    'project_id' => 'minhducear-f055d',
    'api_key' => 'AIzaSyA_J0jnx_St1ZpHvUJZiaf4bSU_axmJ-c8',
    'auth_domain' => 'minhducear-f055d.firebaseapp.com',
    'database_url' => 'https://minhducear-f055d-default-rtdb.firebaseio.com',
    'storage_bucket' => 'minhducear-f055d.firebasestorage.app',
    'messaging_sender_id' => '682003556218',
    'app_id' => '1:682003556218:web:aaeee68209a9420322d8c3',

    // Đường dẫn tới Service Account JSON (nếu gọi Firebase Admin SDK từ PHP/Node)
    'service_account_path' => __DIR__ . '/service_account.json',

    // Chế độ dữ liệu:
    // 'mysql'    : Dùng MySQL/MariaDB trong XAMPP (Local)
    // 'firebase' : Dùng Google Firebase Firestore & Auth trực tiếp
    // 'hybrid'   : Lưu song song MySQL + đẩy event đồng bộ lên Firebase
    'driver_mode' => 'mysql'
];
