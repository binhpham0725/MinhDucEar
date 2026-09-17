/**
 * MinhDucEar - Google Firebase Configuration
 * 
 * Để kết nối tới project Firebase của bạn:
 * 1. Truy cập https://console.firebase.google.com -> Tạo Project hoặc chọn project có sẵn.
 * 2. Vào Project Settings -> General -> Your apps -> Chọn biểu tượng Web (</>) -> Đăng ký app.
 * 3. Copy các giá trị cấu hình và dán vào bên dưới (hoặc định nghĩa window.__FIREBASE_CONFIG__).
 */

export const firebaseConfig = {
  apiKey: (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__?.apiKey) || process?.env?.FIREBASE_API_KEY || "AIzaSyA_dQjex_0sZj4h2rZl4Fb0Gk_aumJ-c0",
  authDomain: (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__?.authDomain) || process?.env?.FIREBASE_AUTH_DOMAIN || "minhducear-f055d.firebaseapp.com",
  projectId: (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__?.projectId) || process?.env?.FIREBASE_PROJECT_ID || "minhducear-f055d",
  storageBucket: (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__?.storageBucket) || process?.env?.FIREBASE_STORAGE_BUCKET || "minhducear-f055d.firebasestorage.app",
  messagingSenderId: (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__?.messagingSenderId) || process?.env?.FIREBASE_MESSAGING_SENDER_ID || "682003556218",
  appId: (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__?.appId) || process?.env?.FIREBASE_APP_ID || "1:682003556218:web:a66ed9671fdfd3921fed7e",
  measurementId: (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__?.measurementId) || process?.env?.FIREBASE_MEASUREMENT_ID || "G-DJ1M200QYC"
};

/**
 * Kiểm tra xem Firebase đã được cấu hình khóa hợp lệ chưa
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "AIzaSy_YOUR_FIREBASE_API_KEY" &&
    !firebaseConfig.apiKey.includes("YOUR_")
  );
}

/**
 * URL Firestore REST API Endpoint
 */
export function getFirestoreRestUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents${cleanPath ? '/' + cleanPath : ''}?key=${firebaseConfig.apiKey}`;
}
