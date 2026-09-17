/**
 * MinhDucEar - Google Firebase Configuration
 * 
 * Để kết nối tới project Firebase của bạn:
 * 1. Truy cập https://console.firebase.google.com -> Tạo Project hoặc chọn project có sẵn.
 * 2. Vào Project Settings -> General -> Your apps -> Chọn biểu tượng Web (</>) -> Đăng ký app.
 * 3. Copy các giá trị cấu hình và dán vào bên dưới (hoặc định nghĩa window.__FIREBASE_CONFIG__).
 */

export const firebaseConfig = {
  apiKey: window.__FIREBASE_CONFIG__?.apiKey || "AIzaSyA_J0jnx_St1ZpHvUJZiaf4bSU_axmJ-c8",
  authDomain: window.__FIREBASE_CONFIG__?.authDomain || "minhducear-f055d.firebaseapp.com",
  projectId: window.__FIREBASE_CONFIG__?.projectId || "minhducear-f055d",
  storageBucket: window.__FIREBASE_CONFIG__?.storageBucket || "minhducear-f055d.firebasestorage.app",
  messagingSenderId: window.__FIREBASE_CONFIG__?.messagingSenderId || "682003556218",
  appId: window.__FIREBASE_CONFIG__?.appId || "1:682003556218:web:aaeee68209a9420322d8c3",
  measurementId: window.__FIREBASE_CONFIG__?.measurementId || "G-8JJN009GY5"
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
