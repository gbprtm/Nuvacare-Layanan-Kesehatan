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

  getLoginPath(expectedRole = null) {
    const path = window.location.pathname || '';
    const surface = document.body?.dataset?.surface || '';
    const roles = Array.isArray(expectedRole)
      ? expectedRole
      : (expectedRole ? [expectedRole] : []);
    const isStaffRole = roles.includes('admin') || roles.includes('dokter');
    const isStaffPath =
      path.startsWith('/admin/') ||
      path.startsWith('/dokter/') ||
      path.startsWith('/staf/') ||
      path === '/staf';

    if (surface === 'staf' || isStaffPath || isStaffRole) {
      return '/staf/login.html';
    }
    return '/login.html';
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
      const loginPath = this.getLoginPath();
      if (!window.location.pathname.endsWith('/login.html')) {
        window.location.href = `${loginPath}?reason=expired`;
      }
      throw new Error('Sesi berakhir. Silakan masuk lagi.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Gagal memuat data. Coba muat ulang halaman.');
      error.status = response.status;
      error.errors = data.errors || {};
      error.data = data;
      throw error;
    }

    return data;
  },

  requireAuth(expectedRoleOrRoles = null) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      window.location.href = this.getLoginPath(expectedRoleOrRoles);
      return false;
    }

    if (expectedRoleOrRoles) {
      const allowedRoles = Array.isArray(expectedRoleOrRoles)
        ? expectedRoleOrRoles
        : [expectedRoleOrRoles];

      if (!allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
          window.location.href = '/admin/kelola-janji.html';
        } else if (user.role === 'dokter') {
          window.location.href = '/dokter/janji-temu.html';
        } else {
          window.location.href = '/pasien/janji-temu.html';
        }
        return false;
      }
    }

    return true;
  },

  async logout() {
    const currentRole = this.getUser()?.role || null;
    const loginPath = this.getLoginPath(currentRole);
    try {
      await this.request('/logout', { method: 'POST', priority: 'low', skipAuthRedirect: true });
    } catch {
      // Clear local session even if server token was already invalidated
    } finally {
      this.clearSession();
      window.location.href = loginPath;
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
