/**
 * MinhDucEar - Google Firebase Configuration
 * 
 * Để kết nối tới project Firebase của bạn:
 * 1. Truy cập https://console.firebase.google.com -> Tạo Project hoặc chọn project có sẵn.
 * 2. Vào Project Settings -> General -> Your apps -> Chọn biểu tượng Web (</>) -> Đăng ký app.
 * 3. Copy các giá trị cấu hình và dán vào bên dưới (hoặc định nghĩa window.__FIREBASE_CONFIG__).
 */

export const firebaseConfig = {
  apiKey: window.__FIREBASE_CONFIG__?.apiKey || "AIzaSy_YOUR_FIREBASE_API_KEY",
  authDomain: window.__FIREBASE_CONFIG__?.authDomain || "minhduc-ear.firebaseapp.com",
  projectId: window.__FIREBASE_CONFIG__?.projectId || "minhduc-ear",
  storageBucket: window.__FIREBASE_CONFIG__?.storageBucket || "minhduc-ear.appspot.com",
  messagingSenderId: window.__FIREBASE_CONFIG__?.messagingSenderId || "123456789012",
  appId: window.__FIREBASE_CONFIG__?.appId || "1:123456789012:web:abcdef123456"
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
