/**
 * MinhDucEar - Auth Page Controller (scripts/auth.js)
 * (hluv-magazine-architecture standard)
 *
 * Orchestrates the login/register page: form validation, API calls via authService,
 * Google Sign-In handling, and redirect on success.
 */

import { authService } from '../services/authService.js';
import { showToast } from '../components/toast.js';
import { Validators } from '../utils/validators.js';
import { MESSAGES } from '../config/messages.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  // ── Login ──────────────────────────────────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="email"]')?.value.trim() ?? '';
      const password = loginForm.querySelector('[name="password"]')?.value ?? '';

      if (!Validators.isEmail(email) || !Validators.isRequired(password)) {
        showToast('Vui lòng nhập đầy đủ email và mật khẩu.', 'error');
        return;
      }

      const data = await authService.login(email, password);
      if (data?.success) {
        showToast(MESSAGES.LOGIN_SUCCESS, 'success');
        setTimeout(() => { window.location.href = 'index.php'; }, 1000);
      } else {
        showToast(data?.message || 'Đăng nhập thất bại.', 'error');
      }
    });
  }

  // ── Register ───────────────────────────────────────────────────────────────
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = registerForm.querySelector('[name="username"]')?.value.trim() ?? '';
      const email = registerForm.querySelector('[name="email"]')?.value.trim() ?? '';
      const password = registerForm.querySelector('[name="password"]')?.value ?? '';

      if (!Validators.isRequired(username) || !Validators.isEmail(email) || !Validators.isPasswordValid(password)) {
        showToast('Vui lòng kiểm tra lại thông tin đăng ký.', 'error');
        return;
      }

      const data = await authService.register(username, email, password);
      if (data?.success) {
        showToast(MESSAGES.REGISTER_SUCCESS, 'success');
        setTimeout(() => { window.location.href = 'auth.php'; }, 1200);
      } else {
        showToast(data?.message || 'Đăng ký thất bại.', 'error');
      }
    });
  }

  console.info('[MinhDucEar] auth.js controller loaded.');
});
