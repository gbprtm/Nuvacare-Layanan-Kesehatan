const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('auth_token');
  },

  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  getUser() {
    const raw = localStorage.getItem('auth_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearAuth();
      const isPublicAuthPage = window.location.pathname.endsWith('login.html') ||
                               window.location.pathname.endsWith('daftar.html') ||
                               window.location.pathname.endsWith('lupa-password.html') ||
                               window.location.pathname.endsWith('reset-password.html') ||
                               window.location.pathname.endsWith('index.html') ||
                               window.location.pathname === '/';
      if (!isPublicAuthPage) {
        window.location.href = '/login.html';
      }
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Terjadi kesalahan sistem');
      error.status = response.status;
      error.errors = data.errors || {};
      throw error;
    }

    return data;
  },

  async logout() {
    try {
      await this.request('/logout', { method: 'POST' });
    } catch {
      // Clear local credentials even if the server token was already revoked.
    } finally {
      this.clearAuth();
      window.location.href = '/login.html';
    }
  },

  requireAuth(expectedRole = null) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      this.clearAuth();
      window.location.href = '/login.html';
      return false;
    }

    if (expectedRole && user.role !== expectedRole) {
      window.location.href = user.role === 'admin'
        ? '/admin/kelola-janji.html'
        : '/pasien/janji-temu.html';
      return false;
    }

    return true;
  },

  showAlert(elemId, message, type = 'danger') {
    const el = document.getElementById(elemId);
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = message;
    el.style.display = 'block';
  },

  hideAlert(elemId) {
    const el = document.getElementById(elemId);
    if (el) el.style.display = 'none';
  }
};
