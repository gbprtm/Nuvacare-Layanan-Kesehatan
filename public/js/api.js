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
  },

  buildPaginationSequence(currentPage, totalPages, isCompact) {
    if (totalPages <= (isCompact ? 5 : 7)) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    if (isCompact) {
      if (currentPage <= 2) return [1, 2, '...', totalPages];
      if (currentPage >= totalPages - 1) return [1, '...', totalPages - 1, totalPages];
      return [1, '...', currentPage, '...', totalPages];
    }
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  },

  paginateItems(items, page = 1, pageSize = 10) {
    const safeList = Array.isArray(items) ? items : [];
    const safeSize = Math.max(1, Number(pageSize) || 10);
    const totalItems = safeList.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
    const parsedPage = Math.floor(Number(page) || 1);
    const currentPage = Math.min(Math.max(1, parsedPage), totalPages);
    const offset = (currentPage - 1) * safeSize;
    const pageItems = safeList.slice(offset, offset + safeSize);

    return {
      pageItems,
      currentPage,
      totalPages,
      totalItems,
      startIndex: totalItems === 0 ? 0 : offset + 1,
      endIndex: totalItems === 0 ? 0 : offset + pageItems.length
    };
  },

  renderPagination(navEl, { currentPage, totalPages, onPageChange } = {}) {
    if (!navEl) return;
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages);

    if (safeTotalPages <= 1) {
      navEl.hidden = true;
      navEl.style.display = 'none';
      navEl.innerHTML = '';
      return;
    }

    const isCompact = typeof window.matchMedia === 'function'
      && window.matchMedia('(max-width: 540px)').matches;
    const items = this.buildPaginationSequence(safeCurrentPage, safeTotalPages, isCompact);

    const prevChevron = '<svg class="segmented-page-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    const nextChevron = '<svg class="segmented-page-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    const itemButtonsHtml = items.map((entry) => {
      if (entry === '...') {
        return '<span class="segmented-page-ellipsis" aria-hidden="true">…</span>';
      }
      const isActive = entry === safeCurrentPage;
      return `<button type="button" class="segmented-page-btn${isActive ? ' is-active' : ''}" data-page="${entry}" aria-label="Halaman ${entry}"${isActive ? ' aria-current="page"' : ''}>${entry}</button>`;
    }).join('');

    navEl.innerHTML = `
      <div class="segmented-pagination" role="group" aria-label="Daftar halaman">
        <button type="button" class="segmented-page-btn segmented-page-btn--nav" data-page-nav="prev" aria-label="Halaman sebelumnya"${safeCurrentPage <= 1 ? ' disabled' : ''}>
          ${prevChevron}
          <span class="segmented-page-label">Sebelumnya</span>
        </button>
        ${itemButtonsHtml}
        <button type="button" class="segmented-page-btn segmented-page-btn--nav" data-page-nav="next" aria-label="Halaman berikutnya"${safeCurrentPage >= safeTotalPages ? ' disabled' : ''}>
          <span class="segmented-page-label">Berikutnya</span>
          ${nextChevron}
        </button>
      </div>
    `;

    navEl.hidden = false;
    navEl.style.display = 'flex';

    const handleChange = typeof onPageChange === 'function' ? onPageChange : () => {};

    navEl.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.getAttribute('data-page'));
        if (target >= 1 && target <= safeTotalPages && target !== safeCurrentPage) {
          handleChange(target);
        }
      });
    });

    const prevBtn = navEl.querySelector('[data-page-nav="prev"]');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (safeCurrentPage > 1) handleChange(safeCurrentPage - 1);
      });
    }

    const nextBtn = navEl.querySelector('[data-page-nav="next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (safeCurrentPage < safeTotalPages) handleChange(safeCurrentPage + 1);
      });
    }
  }
};
