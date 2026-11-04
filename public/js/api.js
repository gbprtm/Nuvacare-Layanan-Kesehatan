const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('klinik_token');
  },

  setToken(token) {
    localStorage.setItem('klinik_token', token);
  },

  getUser() {
    const raw = localStorage.getItem('klinik_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('klinik_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('klinik_token');
    localStorage.removeItem('klinik_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const { skipAuthRedirect, priority, headers: customHeaders, ...fetchOptions } = options;
    const method = (fetchOptions.method || 'GET').toUpperCase();

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(customHeaders || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const resolvedPriority = priority || (method !== 'GET' ? 'high' : 'auto');

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      priority: resolvedPriority
    });

    if (response.status === 401 && !skipAuthRedirect) {
      this.clearSession();
      if (!window.location.pathname.endsWith('/login.html')) {
        window.location.href = '/login.html?reason=expired';
      }
      throw new Error('Sesi berakhir. Silakan masuk lagi.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Gagal memuat data. Coba muat ulang halaman.');
      error.status = response.status;
      error.errors = data.errors || {};
      throw error;
    }

    return data;
  },

  requireAuth(expectedRole = null) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      window.location.href = '/login.html';
      return false;
    }

    if (expectedRole && user.role !== expectedRole) {
      if (user.role === 'admin') {
        window.location.href = '/admin/kelola-janji.html';
      } else {
        window.location.href = '/pasien/janji-temu.html';
      }
      return false;
    }

    return true;
  },

  async logout() {
    try {
      await this.request('/logout', { method: 'POST', priority: 'low' });
    } catch {
      // Clear local session even if server token was already invalidated
    } finally {
      this.clearSession();
      window.location.href = '/login.html';
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  },

  showAlert(elementId, message, type = 'danger') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = message;
    el.style.display = 'block';
  },

  hideAlert(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.display = 'none';
    el.textContent = '';
  }
};
