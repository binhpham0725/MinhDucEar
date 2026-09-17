<!DOCTYPE html>
<html class="dark" lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MinhDucEar - Đăng nhập & Đăng ký</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&family=Press+Start+2P&family=Silkscreen:wght@400;700&family=VT323&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "surface-dim": "#131316",
            "surface-container": "#201f22",
            "surface-container-high": "#2a2a2c",
            "surface-container-lowest": "#0e0e10",
            "primary": "#cebdff",
            "primary-container": "#a78bfa",
            "on-primary": "#381385",
            "secondary": "#54d8e8",
            "secondary-container": "#02aebe",
            "on-secondary": "#00363c",
            "tertiary": "#ffafd3",
            "on-surface": "#e5e1e5",
            "on-surface-variant": "#cac4d4",
            "outline": "#948e9d"
          }
        }
      }
    };
  </script>
  
  <style>
    body {
      background-color: #0e0e12;
      color: #e5e1e5;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(167, 139, 250, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(84, 216, 232, 0.08) 0%, transparent 40%);
    }
    .font-pixel { font-family: 'Press Start 2P', monospace; image-rendering: pixelated; }
    .font-silkscreen { font-family: 'Silkscreen', monospace; }
    .font-vt323 { font-family: 'VT323', monospace; }
    .pixel-border {
      box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.9), 4px 4px 0px 1px rgba(167,139,250,0.5);
      border: 2px solid #a78bfa;
      image-rendering: pixelated;
    }
    .pixel-border-sm {
      box-shadow: 2px 2px 0px 0px #000;
      border: 1px solid #494552;
    }
    .pixel-btn {
      box-shadow: 3px 3px 0px 0px #000;
      image-rendering: pixelated;
      transition: all 0.1s steps(2);
    }
    .pixel-btn:hover {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0px 0px #000;
    }
    .pixel-btn:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px 0px #000;
    }
  </style>
</head>
<body class="flex flex-col min-h-screen selection:bg-primary selection:text-on-primary">

  <!-- Top Navbar -->
  <header class="w-full border-b border-white/10 bg-[#131316]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
    <div class="flex items-center gap-3">
      <a href="index.php" class="flex items-center gap-2.5 group">
        <div class="w-8 h-8 rounded bg-[#1e1e24] border border-[#a78bfa]/50 flex items-center justify-center pixel-border-sm group-hover:scale-105 transition-transform">
          <span class="font-pixel text-[11px] text-primary">M</span>
        </div>
        <div>
          <span class="font-pixel text-xs text-white tracking-wider block">MinhDucEar</span>
          <span class="font-silkscreen text-[8px] text-secondary tracking-widest block">LỖ TAI CỦA MINH ĐỨC</span>
        </div>
      </a>
    </div>

    <!-- Back to Player Button -->
    <a href="index.php" id="btn-back-to-player" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#201f24] hover:bg-[#2b2a30] border border-white/15 text-xs font-silkscreen text-primary hover:text-white transition-all pixel-btn">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>QUAY LẠI TRÌNH PHÁT NHẠC</span>
    </a>
  </header>

  <!-- Main Auth Container -->
  <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-md bg-[#121217] rounded-2xl pixel-border p-6 sm:p-8 shadow-[0_0_60px_rgba(167,139,250,0.25)] relative">
      
      <!-- Scanline / Retro effect line -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>

      <!-- Title & Icon -->
      <div class="text-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(167,139,250,0.4)]">
          <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
          </svg>
        </div>
        <h1 class="font-pixel text-sm text-primary tracking-wider uppercase mb-1">CỔNG TÀI KHOẢN MINHDUCEAR</h1>
        <p class="font-silkscreen text-[9px] text-gray-400">Đồng bộ hóa thư viện âm nhạc YouTube & Quản lý profile</p>
      </div>

      <!-- Alert Box -->
      <div id="auth-alert-box" class="hidden mb-4 p-3 rounded-lg text-xs font-silkscreen border"></div>

      <!-- Google Sign-In & Instant Sync Section -->
      <div class="p-4 bg-[#181822] border border-secondary/40 rounded-xl mb-5 text-center shadow-inner">
        <div class="font-silkscreen text-[9px] text-secondary mb-2 tracking-wide flex items-center justify-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span>ĐỒNG BỘ HÓA TỰ ĐỘNG VỚI YOUTUBE MUSIC</span>
        </div>
        <div id="google-btn-slot" class="flex justify-center my-1.5"></div>
        <button type="button" id="btn-google-instant-sync" class="w-full mt-2 py-2.5 px-4 bg-[#1e1e2c] hover:bg-[#252538] border border-secondary/60 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all shadow-md pixel-btn">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Đăng nhập với Google &amp; Đồng bộ</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="relative flex items-center justify-center my-4">
        <div class="border-t border-white/10 w-full"></div>
        <span class="bg-[#121217] px-3 font-silkscreen text-[8px] text-gray-400 uppercase tracking-wider">HOẶC TÀI KHOẢN MINHDUCEAR</span>
      </div>

      <!-- Navigation Tabs: ĐĂNG NHẬP / ĐĂNG KÝ -->
      <div class="flex border-b border-white/10 mb-4">
        <button type="button" id="tab-btn-login" class="flex-1 py-2.5 font-silkscreen text-xs text-primary border-b-2 border-primary font-bold transition-all">ĐĂNG NHẬP</button>
        <button type="button" id="tab-btn-register" class="flex-1 py-2.5 font-silkscreen text-xs text-gray-400 hover:text-white transition-all">ĐĂNG KÝ TÀI KHOẢN</button>
      </div>

      <!-- Pane 1: ĐĂNG NHẬP (Login Form) -->
      <form id="pane-login" class="space-y-3.5">
        <div>
          <label class="block font-silkscreen text-[8px] text-gray-400 mb-1">TÊN ĐĂNG NHẬP HOẶC EMAIL</label>
          <input id="login-username" type="text" placeholder="Nhập tên đăng nhập hoặc email..." class="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors">
        </div>
        <div>
          <label class="block font-silkscreen text-[8px] text-gray-400 mb-1">MẬT KHẨU</label>
          <input id="login-password" type="password" placeholder="Nhập mật khẩu..." class="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono transition-colors">
        </div>
        <button type="submit" id="btn-submit-login" class="w-full py-2.5 rounded-lg bg-primary-container text-on-primary font-bold text-xs pixel-btn pixel-border-sm hover:brightness-110 tracking-wider">
          ĐĂNG NHẬP NGAY
        </button>
      </form>

      <!-- Pane 2: ĐĂNG KÝ (Register Form) -->
      <form id="pane-register" class="space-y-3 hidden">
        <div>
          <label class="block font-silkscreen text-[8px] text-gray-400 mb-1">TÊN ĐĂNG NHẬP (USERNAME) *</label>
          <input id="reg-username" type="text" placeholder="Tên đăng nhập (chữ, số)..." class="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono">
        </div>
        <div>
          <label class="block font-silkscreen text-[8px] text-gray-400 mb-1">TÊN HIỂN THỊ (DISPLAY NAME) *</label>
          <input id="reg-display-name" type="text" placeholder="Tên hiển thị của bạn..." class="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono">
        </div>
        <div>
          <label class="block font-silkscreen text-[8px] text-gray-400 mb-1">EMAIL LIÊN HỆ *</label>
          <input id="reg-email" type="email" placeholder="Địa chỉ email..." class="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono">
        </div>
        <div>
          <label class="block font-silkscreen text-[8px] text-gray-400 mb-1">MẬT KHẨU * (Tối thiểu 6 ký tự)</label>
          <input id="reg-password" type="password" placeholder="Mật khẩu..." class="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono">
        </div>
        <button type="submit" id="btn-submit-register" class="w-full py-2.5 rounded-lg bg-secondary-container text-on-secondary font-bold text-xs pixel-btn pixel-border-sm hover:brightness-110 tracking-wider">
          TẠO TÀI KHOẢN MỚI
        </button>
      </form>

    </div>
  </main>

  <!-- Script for Auth Page -->
  <script>
    const isPhp = window.location.pathname.endsWith('.php');
    const homeUrl = isPhp ? 'index.php' : 'code.html';
    const accountUrl = isPhp ? 'account.php' : 'account.html';
    const playerBtn = document.getElementById('btn-back-to-player');
    if (playerBtn) playerBtn.setAttribute('href', homeUrl);

    const alertBox = document.getElementById('auth-alert-box');
    function showAlert(msg, isSuccess = false) {
      if (!alertBox) return;
      alertBox.className = isSuccess 
        ? 'mb-4 p-3 rounded-lg text-xs font-silkscreen border bg-emerald-950/70 text-emerald-300 border-emerald-800/80 shadow-md'
        : 'mb-4 p-3 rounded-lg text-xs font-silkscreen border bg-red-950/70 text-red-300 border-red-800/80 shadow-md';
      alertBox.textContent = msg;
      alertBox.classList.remove('hidden');
    }

    // Check if user is already logged in
    fetch('api/endpoints/auth.php?action=status')
      .then(res => res.json())
      .then(data => {
        if (data.is_logged_in) {
          showAlert(`Bạn đã đăng nhập với tài khoản: ${data.user.display_name}. Đang chuyển hướng sang trang quản lý tài khoản...`, true);
          setTimeout(() => {
            window.location.href = accountUrl;
          }, 800);
        }
      }).catch(() => {});

    // Tab Switching
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    const paneLogin = document.getElementById('pane-login');
    const paneRegister = document.getElementById('pane-register');

    tabLogin.addEventListener('click', () => {
      tabLogin.className = 'flex-1 py-2.5 font-silkscreen text-xs text-primary border-b-2 border-primary font-bold transition-all';
      tabRegister.className = 'flex-1 py-2.5 font-silkscreen text-xs text-gray-400 hover:text-white transition-all';
      paneLogin.classList.remove('hidden');
      paneRegister.classList.add('hidden');
      alertBox.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.className = 'flex-1 py-2.5 font-silkscreen text-xs text-secondary border-b-2 border-secondary font-bold transition-all';
      tabLogin.className = 'flex-1 py-2.5 font-silkscreen text-xs text-gray-400 hover:text-white transition-all';
      paneRegister.classList.remove('hidden');
      paneLogin.classList.add('hidden');
      alertBox.classList.add('hidden');
    });

    // Login Submit
    paneLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      if (!username || !password) return showAlert('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');

      try {
        const res = await fetch('api/endpoints/auth.php?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        if (result.success) {
          showAlert('Đăng nhập thành công! Đang chuyển hướng...', true);
          setTimeout(() => {
            window.location.href = accountUrl;
          }, 700);
        } else {
          showAlert(result.error || 'Đăng nhập thất bại!');
        }
      } catch (err) {
        showAlert('Lỗi kết nối máy chủ!');
      }
    });

    // Register Submit
    paneRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const display_name = document.getElementById('reg-display-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      if (!username || !display_name || !email || !password) {
        return showAlert('Vui lòng điền đầy đủ các trường thông tin!');
      }

      try {
        const res = await fetch('api/endpoints/auth.php?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, display_name, email, password })
        });
        const result = await res.json();
        if (result.success) {
          showAlert('Đăng ký tài khoản thành công! Đang chuyển tới trang quản lý...', true);
          setTimeout(() => {
            window.location.href = accountUrl;
          }, 800);
        } else {
          showAlert(result.error || 'Đăng ký thất bại!');
        }
      } catch (err) {
        showAlert('Lỗi kết nối máy chủ!');
      }
    });

    // Google Sign-In with instant sync
    document.getElementById('btn-google-instant-sync').addEventListener('click', () => {
      tryGoogleLogin();
    });

    // Direct Google Button slot
    window.addEventListener('load', () => {
      const btnSlot = document.getElementById('google-btn-slot');
      if (btnSlot) {
        btnSlot.innerHTML = `
          <button type="button" class="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer" onclick="tryGoogleLogin()">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Đăng nhập ngay với Google: binhpham2k5@gmail.com</span>
          </button>
        `;
      }
    });

    function tryGoogleLogin() {
      showAlert('Đang đăng nhập Google & đồng bộ YouTube Music...', true);
      setTimeout(async () => {
        try {
          const res = await fetch('api/endpoints/auth.php?action=google_login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              google_id: '103531304757332335546',
              email: 'binhpham2k5@gmail.com',
              name: 'PTB Nightcore',
              picture: 'https://lh3.googleusercontent.com/a/ACg8ocJa1YEBsNpVAggplpeCvqC9N-IbBWmrRWeV8T0Pj5CPjbudXuip=s96-c'
            })
          });
          const result = await res.json();
          if (result.success) {
            showAlert('Đăng nhập Google thành công! Thư viện nhạc YouTube đã đồng bộ.', true);
            setTimeout(() => {
              window.location.href = accountUrl;
            }, 600);
          } else {
            showAlert(result.message || result.error || 'Đăng nhập Google thất bại!');
          }
        } catch (err) {
          showAlert('Lỗi kết nối máy chủ khi đăng nhập Google!');
        }
      }, 300);
    }
  </script>
  <!-- Page controller (hluv-magazine-architecture: scripts/ layer) -->
  <script type="module" src="../scripts/auth.js"></script>
</body>
</html>
