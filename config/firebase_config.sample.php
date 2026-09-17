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
    'project_id' => 'minhduc-ear-project',
    'api_key' => 'AIzaSyYourApiKeyHere...',
    'auth_domain' => 'minhduc-ear-project.firebaseapp.com',
    'database_url' => 'https://minhduc-ear-project-default-rtdb.firebaseio.com',
    'storage_bucket' => 'minhduc-ear-project.appspot.com',
    'messaging_sender_id' => '1234567890',
    'app_id' => '1:1234567890:web:abcdef123456',

    // Đường dẫn tới Service Account JSON (nếu gọi Firebase Admin SDK từ PHP/Node)
    'service_account_path' => __DIR__ . '/service_account.json',

    // Chế độ dữ liệu:
    // 'mysql'    : Dùng MySQL/MariaDB trong XAMPP (Local)
    // 'firebase' : Dùng Google Firebase Firestore & Auth trực tiếp
    // 'hybrid'   : Lưu song song MySQL + đẩy event đồng bộ lên Firebase
    'driver_mode' => 'mysql'
];
