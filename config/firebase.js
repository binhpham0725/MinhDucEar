/**
 * MinhDucEar - Google Firebase Configuration
 * 
 * Để kết nối tới project Firebase của bạn:
 * 1. Truy cập https://console.firebase.google.com -> Tạo Project hoặc chọn project có sẵn.
 * 2. Vào Project Settings -> General -> Your apps -> Chọn biểu tượng Web (</>) -> Đăng ký app.
 * 3. Copy các giá trị cấu hình và dán vào bên dưới (hoặc định nghĩa window.__FIREBASE_CONFIG__).
 */

export const firebaseConfig = {
  apiKey: window.__FIREBASE_CONFIG__?.apiKey || "AIzaSyA_dQjex_0sZj4h2rZl4Fb0Gk_aumJ-c0",
  authDomain: window.__FIREBASE_CONFIG__?.authDomain || "minhducear-f955d.firebaseapp.com",
  projectId: window.__FIREBASE_CONFIG__?.projectId || "minhducear-f955d",
  storageBucket: window.__FIREBASE_CONFIG__?.storageBucket || "minhducear-f955d.firebasestorage.app",
  messagingSenderId: window.__FIREBASE_CONFIG__?.messagingSenderId || "682003556218",
  appId: window.__FIREBASE_CONFIG__?.appId || "1:682003556218:web:a66ed9671fdfd3921fed7e",
  measurementId: window.__FIREBASE_CONFIG__?.measurementId || "G-DJ1M200QYC"
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
