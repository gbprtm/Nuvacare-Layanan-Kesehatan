let doctorAppointmentsCache = [];
let doctorRequestsCache = [];
let doctorSlotRequestsCache = [];
let doctorPracticeDates = [];
let doctorMasterPoliCache = [];
let selectedDoctorAppointmentId = null;
let pendingWithdrawRequestId = null;
let batchPreviewSeq = 0;
let activeDoctorTabName = 'appointments';

function getDoctorEl(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function updateDoctorSyncTime() {
  const el = document.getElementById('staffSidebarSyncTime');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';
}

function formatCompactDateDoc(dateStr) {
  if (!dateStr) return '-';
  const parsed = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(parsed);
}

function getDoctorSearchQuery() {
  return (document.getElementById('staffSearchInput')?.value || '').trim().toLowerCase();
}

function handleDoctorLogout(e) {
  if (e) e.preventDefault();
  if (confirm('Keluar dari portal dokter sekarang?')) {
    api.logout();
  }
}

function renderDoctorSidebarSummary() {
  const container = document.getElementById('docSidebarSummaryMetrics');
  if (!container) return;

  const total = doctorAppointmentsCache.length;
  const scheduled = doctorAppointmentsCache.filter((a) => a.status === 'terjadwal').length;
  const completed = doctorAppointmentsCache.filter((a) => a.status === 'selesai').length;
  const openReqs = doctorRequestsCache.filter((r) => r.status === 'diajukan').length;

  container.innerHTML = `
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Total rentang</span><strong class="portal-summary-value">${total}</strong></div>
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Terjadwal</span><strong class="portal-summary-value">${scheduled}</strong></div>
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Selesai</span><strong class="portal-summary-value">${completed}</strong></div>
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Pengajuan aktif</span><strong class="portal-summary-value">${openReqs}</strong></div>
  `;
}

function initDoctorDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('staffDrawerOverlay');
  const panel = document.getElementById('staffDrawerPanel');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const expandBtn = document.getElementById('drawerQuickFilterExpandBtn');
  const subList = document.getElementById('drawerQuickFilterSub');
  const slotBtn = document.getElementById('drawerSlotRequestBtn');
  const primaryCta = document.getElementById('drawerPrimaryCta');

  if (!menuBtn || !overlay || !panel) return;

  const openDrawer = () => {
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    if (closeBtn) setTimeout(() => closeBtn.focus(), 40);
  };

  const closeDrawer = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!overlay.classList.contains('is-open')) {
        overlay.hidden = true;
      }
    }, 200);
  };

  window.closeDoctorStaffDrawer = closeDrawer;

  menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDrawer();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  if (expandBtn && subList) {
    expandBtn.addEventListener('click', () => {
      const nextExpanded = expandBtn.getAttribute('aria-expanded') !== 'true';
      expandBtn.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      subList.hidden = !nextExpanded;
      const plusEl = expandBtn.querySelector('.patient-drawer__plus');
      if (plusEl) plusEl.textContent = nextExpanded ? '-' : '+';
    });
  }

  document.querySelectorAll('[data-drawer-doc-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-drawer-doc-tab');
      switchDoctorTab(tab);
      if (tab === 'requests') loadDoctorRequests();
      else if (tab === 'slotRequests') loadDoctorSlotRequests();
      else if (tab === 'practiceSchedule') loadDoctorPracticeSchedule();
      closeDrawer();
    });
  });

  if (slotBtn) {
    slotBtn.addEventListener('click', () => {
      closeDrawer();
      const origSlotBtn = document.getElementById('openSlotRequestBtn');
      if (origSlotBtn) origSlotBtn.click();
    });
  }

  if (primaryCta) {
    primaryCta.addEventListener('click', () => {
      closeDrawer();
      const origBatchBtn = document.getElementById('openBatchCancelBtn');
      if (origBatchBtn) origBatchBtn.click();
    });
  }
}

function applyDoctorSearchForCurrentTab() {
  if (activeDoctorTabName === 'requests') {
    renderFilteredDoctorRequests();
  } else if (activeDoctorTabName === 'slotRequests') {
    renderFilteredDoctorSlotRequests();
  } else {
    renderFilteredDoctorAppointments();
  }
}

function initDoctorSearch() {
  const form = document.getElementById('staffSearchForm');
  const input = document.getElementById('staffSearchInput');
  const clearBtn = document.getElementById('staffSearchClearBtn');
  if (!input) return;

  const syncClear = () => {
    if (clearBtn) clearBtn.hidden = input.value.trim() === '';
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      applyDoctorSearchForCurrentTab();
    });
  }

  input.addEventListener('input', () => {
    syncClear();
    applyDoctorSearchForCurrentTab();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      syncClear();
      applyDoctorSearchForCurrentTab();
      input.focus();
    });
  }

  syncClear();
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!api.requireAuth('dokter')) return;

  const initialUser = api.getUser();
  syncDoctorHeader(initialUser);

  ['logoutBtn', 'logoutBtnTop', 'drawerLogoutBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handleDoctorLogout);
  });

  const notifBtn = document.getElementById('topbarNotifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      switchDoctorTab('requests');
      loadDoctorRequests();
    });
  }

  const headerBatchCancelBtn = document.getElementById('headerBatchCancelBtn');
  if (headerBatchCancelBtn) {
    headerBatchCancelBtn.addEventListener('click', () => {
      const origBatchBtn = document.getElementById('openBatchCancelBtn');
      if (origBatchBtn) origBatchBtn.click();
    });
  }

  initDoctorTabs();
  initDoctorDrawer();
  initDoctorSearch();
  initDoctorFilters();
  initDoctorModals();
  initDoctorPracticeSchedule();
  setupDoctorEscapeHandler();

  await syncDoctorUserFromServer();
  await Promise.all([
    loadDoctorAppointments(),
    loadDoctorRequests(),
    loadDoctorSlotRequests(),
    loadDoctorPracticeSchedule(),
    loadDoctorMasterPoli()
  ]);
  renderDoctorSidebarSummary();
});

function syncDoctorHeader(userObj) {
  if (!userObj) return;
  const doctorName = userObj.doctor?.name || userObj.name || '';
  const poliName =
    userObj.doctor?.polyclinic?.name ||
    userObj.polyclinic?.name ||
    userObj.polyclinic_name ||
    '';

  if (doctorName) {
    ['navDoctorName', 'navDoctorNameTop', 'drawerDoctorName'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = doctorName;
    });
  }
  if (poliName) {
    ['navDoctorPoli', 'drawerDoctorPoli'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = poliName;
    });
  }
}

async function syncDoctorUserFromServer() {
  try {
    const res = await api.request('/user', { priority: 'low' });
    const syncedUser = res.data || res.user || null;
    if (syncedUser) {
      api.setUser(syncedUser);
      syncDoctorHeader(syncedUser);
    }
  } catch (err) {
    if (err.status === 403) {
      api.showAlert('doctorPortalAlert', err.message || 'Akun dokter tidak aktif atau belum terhubung.', 'danger');
    }
  }
}

function getLocalIsoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initDoctorTabs() {
  const tabAppointmentsBtn = document.getElementById('tabBtnAppointments');
  const tabRequestsBtn = document.getElementById('tabBtnRequests');
  const tabSlotRequestsBtn = document.getElementById('tabBtnSlotRequests');
  const tabPracticeScheduleBtn = document.getElementById('tabBtnPracticeSchedule');

  if (tabAppointmentsBtn) {
    tabAppointmentsBtn.addEventListener('click', () => switchDoctorTab('appointments'));
  }
  if (tabRequestsBtn) {
    tabRequestsBtn.addEventListener('click', () => {
      switchDoctorTab('requests');
      loadDoctorRequests();
    });
  }
  if (tabSlotRequestsBtn) {
    tabSlotRequestsBtn.addEventListener('click', () => {
      switchDoctorTab('slotRequests');
      loadDoctorSlotRequests();
    });
  }
  if (tabPracticeScheduleBtn) {
    tabPracticeScheduleBtn.addEventListener('click', () => {
      switchDoctorTab('practiceSchedule');
      loadDoctorPracticeSchedule();
    });
  }
}

function switchDoctorTab(tabName) {
  activeDoctorTabName = tabName;
  const tabAppointmentsBtn = document.getElementById('tabBtnAppointments');
  const tabRequestsBtn = document.getElementById('tabBtnRequests');
  const tabSlotRequestsBtn = document.getElementById('tabBtnSlotRequests');
  const tabPracticeScheduleBtn = document.getElementById('tabBtnPracticeSchedule');
  const viewAppointments = document.getElementById('viewAppointments');
  const viewRequests = document.getElementById('viewRequests');
  const viewSlotRequests = document.getElementById('viewSlotRequests');
  const viewPracticeSchedule = document.getElementById('viewPracticeSchedule');

  const isAppointments = tabName === 'appointments';
  const isRequests = tabName === 'requests';
  const isSlotRequests = tabName === 'slotRequests';
  const isPracticeSchedule = tabName === 'practiceSchedule';

  if (tabAppointmentsBtn) {
    tabAppointmentsBtn.classList.toggle('is-active', isAppointments);
    tabAppointmentsBtn.setAttribute('aria-selected', isAppointments ? 'true' : 'false');
  }
  if (tabRequestsBtn) {
    tabRequestsBtn.classList.toggle('is-active', isRequests);
    tabRequestsBtn.setAttribute('aria-selected', isRequests ? 'true' : 'false');
  }
  if (tabSlotRequestsBtn) {
    tabSlotRequestsBtn.classList.toggle('is-active', isSlotRequests);
    tabSlotRequestsBtn.setAttribute('aria-selected', isSlotRequests ? 'true' : 'false');
  }
  if (tabPracticeScheduleBtn) {
    tabPracticeScheduleBtn.classList.toggle('is-active', isPracticeSchedule);
    tabPracticeScheduleBtn.setAttribute('aria-selected', isPracticeSchedule ? 'true' : 'false');
  }

  document.querySelectorAll('[data-drawer-doc-tab]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-drawer-doc-tab') === tabName);
  });

  if (viewAppointments) {
    viewAppointments.hidden = !isAppointments;
    viewAppointments.style.display = isAppointments ? '' : 'none';
  }
  if (viewRequests) {
    viewRequests.hidden = !isRequests;
    viewRequests.style.display = isRequests ? '' : 'none';
  }
  if (viewSlotRequests) {
    viewSlotRequests.hidden = !isSlotRequests;
    viewSlotRequests.style.display = isSlotRequests ? '' : 'none';
  }
  if (viewPracticeSchedule) {
    viewPracticeSchedule.hidden = !isPracticeSchedule;
    viewPracticeSchedule.style.display = isPracticeSchedule ? '' : 'none';
  }

  if (getDoctorSearchQuery()) {
    applyDoctorSearchForCurrentTab();
  }
}

function initDoctorFilters() {
  const dateFrom = document.getElementById('filterDocDateFrom');
  const dateTo = document.getElementById('filterDocDateTo');
  const statusSelect = document.getElementById('filterDocStatus');
  const typeSelect = document.getElementById('filterDocType');
  const sortSelect = document.getElementById('filterDocSort');
  const refreshApptsBtn = document.getElementById('refreshDocAppointmentsBtn');
  const resetBtn = document.getElementById('resetDocFiltersBtn');

  const today = getLocalIsoDate(0);
  const plusSeven = getLocalIsoDate(7);

  if (dateFrom && !dateFrom.value) {
    dateFrom.value = today;
  }
  if (dateTo && !dateTo.value) {
    dateTo.value = plusSeven;
  }
  if (dateFrom && dateTo) {
    dateTo.min = dateFrom.value;
    dateFrom.addEventListener('change', () => {
      if (dateFrom.value) {
        dateTo.min = dateFrom.value;
        if (dateTo.value && dateTo.value < dateFrom.value) {
          dateTo.value = dateFrom.value;
        }
      }
      loadDoctorAppointments();
    });
    dateTo.addEventListener('change', loadDoctorAppointments);
  } else {
    if (dateFrom) dateFrom.addEventListener('change', loadDoctorAppointments);
    if (dateTo) dateTo.addEventListener('change', loadDoctorAppointments);
  }

  if (statusSelect) statusSelect.addEventListener('change', loadDoctorAppointments);
  if (typeSelect) typeSelect.addEventListener('change', renderFilteredDoctorAppointments);
  if (sortSelect) sortSelect.addEventListener('change', renderFilteredDoctorAppointments);
  if (refreshApptsBtn) refreshApptsBtn.addEventListener('click', loadDoctorAppointments);

  const resetDoctorFilters = () => {
    if (dateFrom) dateFrom.value = today;
    if (dateTo) {
      dateTo.min = today;
      dateTo.value = plusSeven;
    }
    if (statusSelect) statusSelect.value = '';
    if (typeSelect) typeSelect.value = '';
    if (sortSelect) sortSelect.value = 'date_asc';
    const searchInput = document.getElementById('staffSearchInput');
    const clearBtn = document.getElementById('staffSearchClearBtn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.hidden = true;
    document.querySelectorAll('[data-doc-quick]').forEach((el) => el.classList.remove('is-active'));
    loadDoctorAppointments();
  };

  if (resetBtn) {
    resetBtn.addEventListener('click', resetDoctorFilters);
  }

  document.querySelectorAll('[data-doc-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-doc-quick');
      document.querySelectorAll('[data-doc-quick]').forEach((el) => {
        el.classList.toggle('is-active', el.getAttribute('data-doc-quick') === preset);
      });
      switchDoctorTab('appointments');

      if (preset === 'today') {
        if (dateFrom) dateFrom.value = today;
        if (dateTo) {
          dateTo.min = today;
          dateTo.value = today;
        }
        if (statusSelect) statusSelect.value = '';
        loadDoctorAppointments();
      } else if (preset === 'week') {
        if (dateFrom) dateFrom.value = today;
        if (dateTo) {
          dateTo.min = today;
          dateTo.value = plusSeven;
        }
        if (statusSelect) statusSelect.value = '';
        loadDoctorAppointments();
      } else if (preset === 'scheduled') {
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (statusSelect) statusSelect.value = 'terjadwal';
        loadDoctorAppointments();
      } else {
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (statusSelect) statusSelect.value = '';
        if (typeSelect) typeSelect.value = '';
        loadDoctorAppointments();
      }

      if (typeof window.closeDoctorStaffDrawer === 'function') {
        window.closeDoctorStaffDrawer();
      }
    });
  });

  const reqStatusFilter = getDoctorEl('filterReqStatus', 'filterDocReqStatus', 'filterRequestStatus');
  if (reqStatusFilter) {
    reqStatusFilter.addEventListener('change', loadDoctorRequests);
  }

  const refreshRequestsBtn = document.getElementById('refreshDocRequestsBtn');
  if (refreshRequestsBtn) {
    refreshRequestsBtn.addEventListener('click', loadDoctorRequests);
  }
}

function renderFilteredDoctorAppointments() {
  const stateEl = document.getElementById('doctorAppointmentsState');
  const tableBody = document.getElementById('doctorAppointmentsBody');
  const cardsEl = document.getElementById('doctorAppointmentsCards');
  const resultInfo = document.getElementById('docAppointmentsResultInfo');
  const tableWrap = document.getElementById('doctorAppointmentsTableWrap') || (tableBody ? tableBody.closest('.table-responsive') : null);
  if (!tableBody && !cardsEl) return;

  const typeFilter = document.getElementById('filterDocType')?.value || '';
  const sortMode = document.getElementById('filterDocSort')?.value || 'date_asc';
  const query = getDoctorSearchQuery();

  let filtered = (doctorAppointmentsCache || []).filter((a) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (query) {
      const haystack = [
        a.patient?.name,
        a.patient?.masked_phone,
        a.polyclinic?.name,
        a.type,
        a.status,
        a.appointment_date
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  filtered = filtered.slice().sort((a, b) => {
    if (sortMode === 'date_desc') {
      const da = `${a.appointment_date || ''} ${a.appointment_time || ''}`;
      const db = `${b.appointment_date || ''} ${b.appointment_time || ''}`;
      return db.localeCompare(da);
    }
    if (sortMode === 'patient_asc') {
      return (a.patient?.name || '').localeCompare(b.patient?.name || '', 'id');
    }
    const da = `${a.appointment_date || ''} ${a.appointment_time || ''}`;
    const db = `${b.appointment_date || ''} ${b.appointment_time || ''}`;
    return da.localeCompare(db);
  });

  if (resultInfo) {
    resultInfo.textContent = `Menampilkan ${filtered.length} dari ${doctorAppointmentsCache.length} jadwal`;
  }

  renderDoctorSidebarSummary();

  if (filtered.length === 0) {
    const emptyMsg = doctorAppointmentsCache.length === 0
      ? 'Belum ada janji pada rentang ini.'
      : 'Tidak ada janji yang cocok dengan filter atau pencarian ini.';
    setDoctorListState(stateEl, tableWrap, cardsEl, 'empty', emptyMsg);
    if (doctorAppointmentsCache.length === 0) {
      resetDoctorDetailPanel();
    }
    return;
  }

  hideDoctorListState(stateEl, tableWrap, cardsEl);
  renderDoctorAppointments(filtered, tableBody, cardsEl);
}

async function loadDoctorAppointments() {
  const stateEl = document.getElementById('doctorAppointmentsState');
  const tableBody = document.getElementById('doctorAppointmentsBody');
  const cardsEl = document.getElementById('doctorAppointmentsCards');
  const tableWrap = document.getElementById('doctorAppointmentsTableWrap') || (tableBody ? tableBody.closest('.table-responsive') : null);

  if (tableWrap && cardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }

  setDoctorListState(stateEl, tableWrap, cardsEl, 'loading', 'Memuat jadwal janji temu...');

  const dateFrom = document.getElementById('filterDocDateFrom')?.value || '';
  const dateTo = document.getElementById('filterDocDateTo')?.value || '';
  const status = document.getElementById('filterDocStatus')?.value || '';

  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  if (status) params.set('status', status);

  try {
    const query = params.toString();
    const res = await api.request(`/dokter/janji-temu${query ? `?${query}` : ''}`, { priority: 'high' });
    doctorAppointmentsCache = Array.isArray(res.data) ? res.data : [];

    if (res.meta?.doctor) {
      syncDoctorHeader({ doctor: res.meta.doctor });
    } else if (doctorAppointmentsCache.length > 0) {
      const poliEl = document.getElementById('navDoctorPoli');
      if (poliEl && (!poliEl.textContent || poliEl.textContent === '-' || poliEl.textContent === 'Poliklinik')) {
        const firstPoli = doctorAppointmentsCache[0]?.polyclinic?.name;
        if (firstPoli) {
          poliEl.textContent = firstPoli;
          const drawerPoliEl = document.getElementById('drawerDoctorPoli');
          if (drawerPoliEl) drawerPoliEl.textContent = firstPoli;
        }
      }
    }

    renderFilteredDoctorAppointments();
    updateDoctorSyncTime();

    if (selectedDoctorAppointmentId && doctorAppointmentsCache.some((item) => item.id === selectedDoctorAppointmentId)) {
      await selectDoctorAppointment(selectedDoctorAppointmentId, { scrollToDetail: false });
    } else if (doctorAppointmentsCache.length > 0 && window.innerWidth > 900) {
      await selectDoctorAppointment(doctorAppointmentsCache[0].id, { scrollToDetail: false });
    } else if (selectedDoctorAppointmentId) {
      resetDoctorDetailPanel();
    }
  } catch (err) {
    const errorMsg = err.status === 403 && err.message ? err.message : 'Gagal memuat data. Coba lagi.';
    setDoctorListState(stateEl, tableWrap, cardsEl, 'error', errorMsg, loadDoctorAppointments);
  }
}

function setDoctorListState(stateEl, tableWrap, cardsEl, mode, message, retryFn = null) {
  if (tableWrap) {
    tableWrap.style.display = 'none';
  }
  if (cardsEl) {
    cardsEl.innerHTML = '';
    cardsEl.style.display = 'none';
  }
  if (!stateEl) return;

  stateEl.hidden = false;
  stateEl.style.display = 'block';

  if (mode === 'error') {
    stateEl.innerHTML = `
      <div class="portal-state-box portal-state-box--error">
        <p>${escapeHtml(message)}</p>
        <button type="button" class="btn btn-secondary btn-touch portal-retry-btn">Coba lagi</button>
      </div>
    `;
    const retryBtn = stateEl.querySelector('.portal-retry-btn');
    if (retryBtn && typeof retryFn === 'function') {
      retryBtn.addEventListener('click', retryFn);
    }
    return;
  }

  stateEl.innerHTML = `
    <div class="portal-state-box">
      <p class="text-muted">${escapeHtml(message)}</p>
    </div>
  `;
}

function hideDoctorListState(stateEl, tableWrap, cardsEl) {
  if (stateEl) {
    stateEl.hidden = true;
    stateEl.style.display = 'none';
    stateEl.innerHTML = '';
  }
  if (tableWrap) {
    tableWrap.style.display = '';
  }
  if (cardsEl) {
    cardsEl.style.display = '';
  }
}

function renderDoctorAppointments(items, tableBody, cardsEl) {
  if (tableBody) {
    tableBody.innerHTML = items.map((a) => {
      const isSelected = Number(selectedDoctorAppointmentId) === Number(a.id);
      const patientName = a.patient?.name || 'Pasien';
      const maskedPhone = a.patient?.masked_phone || '-';
      const poliName = a.polyclinic?.name || '-';
      const openBadge = a.open_request
        ? '<div class="mt-1"><span class="badge badge-diajukan">Pengajuan menunggu</span></div>'
        : '';

      return `
        <tr data-appointment-id="${a.id}" class="doctor-row ${isSelected ? 'is-selected' : ''}">
          <td>
            <div class="staff-date-compact">
              <strong>${escapeHtml(formatCompactDateDoc(a.appointment_date))}</strong>
              <span class="text-muted text-sm">${escapeHtml(a.appointment_time || '09:00')} WIB</span>
            </div>
          </td>
          <td>
            <strong>${escapeHtml(patientName)}</strong>
            <div class="text-muted text-sm">${escapeHtml(maskedPhone)}</div>
          </td>
          <td>
            <span>${escapeHtml(poliName)}</span>
            <div class="mt-1"><span class="badge badge-${escapeHtml(a.type)}">${escapeHtml(getAppointmentTypeLabel(a.type))}</span></div>
          </td>
          <td>
            <span class="badge badge-${escapeHtml(a.status)}">${escapeHtml(getAppointmentStatusLabel(a.status))}</span>
            ${openBadge}
          </td>
          <td>
            <div class="staff-row-actions">
              <button type="button" class="btn btn-secondary btn-sm btn-touch" data-view-detail-id="${a.id}">
                Rincian
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('tr[data-appointment-id]').forEach((row) => {
      row.addEventListener('click', (e) => {
        const apptId = Number(row.getAttribute('data-appointment-id'));
        if (!apptId) return;
        if (e.target.closest('button')) return;
        selectDoctorAppointment(apptId, { scrollToDetail: true });
      });
    });

    tableBody.querySelectorAll('[data-view-detail-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const apptId = Number(btn.getAttribute('data-view-detail-id'));
        if (apptId) selectDoctorAppointment(apptId, { scrollToDetail: true });
      });
    });
  }

  if (cardsEl) {
    cardsEl.innerHTML = items.map((a) => {
      const isSelected = Number(selectedDoctorAppointmentId) === Number(a.id);
      const patientName = a.patient?.name || 'Pasien';
      const maskedPhone = a.patient?.masked_phone || '-';
      const poliName = a.polyclinic?.name || '-';
      const openBadge = a.open_request
        ? '<span class="badge badge-diajukan">Pengajuan menunggu</span>'
        : '';

      return `
        <article class="mobile-data-card ${isSelected ? 'is-selected' : ''}" data-appointment-id="${a.id}">
          <div class="mobile-data-card__head">
            <div>
              <strong>${escapeHtml(patientName)}</strong>
              <div class="text-muted text-sm">${escapeHtml(maskedPhone)}</div>
            </div>
            <span class="badge badge-${escapeHtml(a.status)}">${escapeHtml(getAppointmentStatusLabel(a.status))}</span>
          </div>
          <div class="mobile-data-card__meta">
            <div><strong>Jadwal:</strong> ${escapeHtml(formatCompactDateDoc(a.appointment_date))}, ${escapeHtml(a.appointment_time || '09:00')} WIB</div>
            <div><strong>Poli:</strong> ${escapeHtml(poliName)}</div>
            <div class="mobile-data-card__badges">
              <span class="badge badge-${escapeHtml(a.type)}">${escapeHtml(getAppointmentTypeLabel(a.type))}</span>
              ${openBadge}
            </div>
          </div>
          <div class="mobile-data-card__actions">
            <button type="button" class="btn btn-secondary btn-block btn-touch" data-view-detail-id="${a.id}">
              Lihat rincian
            </button>
          </div>
        </article>
      `;
    }).join('');

    cardsEl.querySelectorAll('article.mobile-data-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const apptId = Number(card.getAttribute('data-appointment-id'));
        if (apptId) selectDoctorAppointment(apptId, { scrollToDetail: true });
      });
    });

    cardsEl.querySelectorAll('[data-view-detail-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const apptId = Number(btn.getAttribute('data-view-detail-id'));
        if (apptId) selectDoctorAppointment(apptId, { scrollToDetail: true });
      });
    });
  }
}

function highlightSelectedRow(appointmentId) {
  document.querySelectorAll('[data-appointment-id]').forEach((el) => {
    const matches = Number(el.getAttribute('data-appointment-id')) === Number(appointmentId);
    el.classList.toggle('is-selected', matches);
  });
}

function resetDoctorDetailPanel() {
  selectedDoctorAppointmentId = null;
  highlightSelectedRow(null);

  const emptyEl = getDoctorEl('detailPlaceholder', 'detailEmptyState');
  const contentEl = getDoctorEl('detailContent', 'detailContentBox');
  const loadingEl = document.getElementById('detailLoading');
  if (emptyEl) {
    emptyEl.hidden = false;
    emptyEl.style.display = '';
  }
  if (contentEl) {
    contentEl.hidden = true;
    contentEl.style.display = 'none';
  }
  if (loadingEl) {
    loadingEl.hidden = true;
    loadingEl.style.display = 'none';
  }

  const openReqBox = document.getElementById('detailOpenRequestBox');
  if (openReqBox) {
    openReqBox.hidden = true;
    openReqBox.style.display = 'none';
    openReqBox.innerHTML = '';
  }
  const reqCancelBtn = document.getElementById('detailRequestCancelBtn');
  if (reqCancelBtn) {
    reqCancelBtn.hidden = true;
    reqCancelBtn.style.display = 'none';
  }
  const hintEl = document.getElementById('detailEligibilityHint');
  if (hintEl) {
    hintEl.textContent = '';
    hintEl.style.display = 'none';
  }
}

async function selectDoctorAppointment(appointmentId, options = {}) {
  selectedDoctorAppointmentId = appointmentId;
  highlightSelectedRow(appointmentId);

  const emptyEl = getDoctorEl('detailPlaceholder', 'detailEmptyState');
  const contentEl = getDoctorEl('detailContent', 'detailContentBox');
  const loadingEl = document.getElementById('detailLoading');

  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.style.display = 'none';
  }

  const cached = doctorAppointmentsCache.find((item) => Number(item.id) === Number(appointmentId));
  if (cached) {
    renderDoctorDetailPanel(cached);
    if (contentEl) {
      contentEl.hidden = false;
      contentEl.style.display = '';
    }
    if (loadingEl) {
      loadingEl.hidden = true;
      loadingEl.style.display = 'none';
    }
  } else {
    if (loadingEl) {
      loadingEl.hidden = false;
      loadingEl.style.display = '';
    }
    if (contentEl) {
      contentEl.hidden = true;
      contentEl.style.display = 'none';
    }
  }

  try {
    const res = await api.request(`/dokter/janji-temu/${appointmentId}`, { priority: 'high' });
    const d = res.data || res;
    if (loadingEl) {
      loadingEl.hidden = true;
      loadingEl.style.display = 'none';
    }
    if (contentEl) {
      contentEl.hidden = false;
      contentEl.style.display = '';
    }
    renderDoctorDetailPanel(d);

    if (options.scrollToDetail) {
      const panel = getDoctorEl('appointmentDetailPanel', 'doctorDetailPanel') || contentEl;
      if (panel && window.innerWidth <= 900 && typeof panel.scrollIntoView === 'function') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  } catch (err) {
    if (loadingEl) {
      loadingEl.hidden = true;
      loadingEl.style.display = 'none';
    }
    if (!cached && emptyEl) {
      emptyEl.hidden = false;
      emptyEl.style.display = '';
    }
    api.showAlert('doctorPortalAlert', err.message || 'Gagal memuat rincian janji temu.', 'danger');
  }
}

function renderDoctorDetailPanel(d) {
  if (!d) return;

  const setField = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setField('detailPatientName', d.patient?.name || 'Pasien');
  setField('detailPatientPhone', d.patient?.masked_phone || '-');
  setField('detailDateTime', `${api.formatDate(d.appointment_date)}, ${d.appointment_time || '09:00'} WIB`);
  setField('detailPoli', d.polyclinic?.name || '-');
  setField('detailType', getAppointmentTypeLabel(d.type));
  setField('detailComplaint', d.complaint || '-');

  const docNotesEl = document.getElementById('detailDoctorNotes');
  const docNotesRow = document.getElementById('detailDoctorNotesRow');
  if (docNotesEl && docNotesRow) {
    if (d.doctor_notes) {
      docNotesEl.textContent = d.doctor_notes;
      docNotesRow.hidden = false;
      docNotesRow.style.display = '';
    } else {
      docNotesEl.textContent = '-';
      docNotesRow.hidden = true;
      docNotesRow.style.display = 'none';
    }
  }

  const statusEl = document.getElementById('detailStatus');
  if (statusEl) {
    const label = getAppointmentStatusLabel(d.status);
    if (statusEl.classList.contains('badge')) {
      statusEl.className = `badge badge-${d.status}`;
      statusEl.textContent = label;
    } else {
      statusEl.innerHTML = `<span class="badge badge-${escapeHtml(d.status)}">${escapeHtml(label)}</span>`;
    }
  }

  const openReqBox = document.getElementById('detailOpenRequestBox');
  if (openReqBox) {
    if (d.open_request) {
      const req = d.open_request;
      openReqBox.hidden = false;
      openReqBox.style.display = '';
      openReqBox.innerHTML = `
        <div class="detail-open-request-box">
          <div class="detail-open-request-box__head">
            <strong>Pengajuan Pembatalan Terbuka</strong>
            <span class="badge ${getRequestBadgeClass(req.status)}">${escapeHtml(getRequestStatusLabel(req.status))}</span>
          </div>
          <div class="detail-open-request-box__body">
            <div><strong>Kategori:</strong> ${escapeHtml(getReasonCategoryLabel(req.reason_category))}</div>
            <div><strong>Alasan:</strong> ${escapeHtml(req.reason || '-')}</div>
            <div><strong>Batas keputusan admin:</strong> ${escapeHtml(formatDateTimeId(req.due_at))}</div>
            ${req.batch_id ? `<div><strong>Batch cuti:</strong> <code>${escapeHtml(String(req.batch_id).slice(0, 8))}</code></div>` : ''}
          </div>
          ${req.status === 'diajukan'
            ? `<div class="mt-2"><button type="button" class="btn btn-secondary btn-touch" data-detail-withdraw-id="${req.id}">Tarik pengajuan</button></div>`
            : ''}
        </div>
      `;
      const withdrawBtn = openReqBox.querySelector('[data-detail-withdraw-id]');
      if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => openWithdrawModal(req.id, d));
      }
    } else {
      openReqBox.hidden = true;
      openReqBox.style.display = 'none';
      openReqBox.innerHTML = '';
    }
  }

  const completeBtn = document.getElementById('detailCompleteBtn');
  const quickCancelBtn = document.getElementById('detailQuickCancelBtn');
  const quickCancelHint = document.getElementById('detailQuickCancelHint');
  const reqCancelBtn = document.getElementById('detailRequestCancelBtn');
  const hintEl = document.getElementById('detailEligibilityHint');

  if (completeBtn) {
    if (d.status === 'terjadwal') {
      completeBtn.hidden = false;
      completeBtn.style.display = '';
      completeBtn.onclick = () => openCompleteAppointmentModal(d);
    } else {
      completeBtn.hidden = true;
      completeBtn.style.display = 'none';
      completeBtn.onclick = null;
    }
  }

  const canQuickCancel = isAppointmentQuickCancellable(d);
  if (quickCancelBtn) {
    if (canQuickCancel) {
      quickCancelBtn.hidden = false;
      quickCancelBtn.style.display = '';
      quickCancelBtn.onclick = () => openQuickCancelModal(d);
    } else {
      quickCancelBtn.hidden = true;
      quickCancelBtn.style.display = 'none';
      quickCancelBtn.onclick = null;
    }
  }
  if (quickCancelHint) {
    if (canQuickCancel && d.quick_cancel_deadline_at) {
      quickCancelHint.hidden = false;
      quickCancelHint.style.display = 'block';
      quickCancelHint.textContent = `Batas batal cepat 15 menit: ${formatDateTimeId(d.quick_cancel_deadline_at)}`;
    } else {
      quickCancelHint.hidden = true;
      quickCancelHint.style.display = 'none';
      quickCancelHint.textContent = '';
    }
  }

  if (d.can_request_cancellation) {
    if (reqCancelBtn) {
      reqCancelBtn.hidden = false;
      reqCancelBtn.style.display = '';
      reqCancelBtn.onclick = () => openSingleCancelModal(d);
    }
    if (hintEl) {
      hintEl.textContent = '';
      hintEl.style.display = 'none';
    }
  } else {
    if (reqCancelBtn) {
      reqCancelBtn.hidden = true;
      reqCancelBtn.style.display = 'none';
      reqCancelBtn.onclick = null;
    }
    if (hintEl) {
      hintEl.textContent = d.cannot_request_reason || 'Pengajuan pembatalan tidak tersedia untuk janji ini.';
      hintEl.style.display = 'block';
    }
  }
}

function initDoctorModals() {
  initSingleCancelModal();
  initBatchCancelModal();
  initWithdrawModal();
  initQuickCancelModal();
  initCompleteAppointmentModal();
  initSlotRequestModal();

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      closeDoctorModal(document.getElementById(targetId));
    });
  });

  [
    'singleCancelModal',
    'batchCancelModal',
    'withdrawConfirmModal',
    'quickCancelModal',
    'completeAppointmentModal',
    'slotRequestModal'
  ].forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeDoctorModal(modal);
      }
    });
  });
}

function setupDoctorEscapeHandler() {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modalIds = [
      'slotRequestModal',
      'completeAppointmentModal',
      'quickCancelModal',
      'withdrawConfirmModal',
      'batchCancelModal',
      'singleCancelModal'
    ];
    for (const id of modalIds) {
      const modal = document.getElementById(id);
      if (modal && isModalOpen(modal)) {
        closeDoctorModal(modal);
        break;
      }
    }
  });
}

function isModalOpen(modal) {
  return Boolean(modal && !modal.hidden && modal.style.display === 'flex');
}

function openDoctorModal(modal, focusEl = null) {
  if (!modal) return;
  modal.hidden = false;
  modal.style.display = 'flex';
  if (focusEl) {
    setTimeout(() => focusEl.focus(), 40);
  }
}

function closeDoctorModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  modal.style.display = 'none';
}

function initSingleCancelModal() {
  const modal = document.getElementById('singleCancelModal');
  const form = document.getElementById('singleCancelForm');
  const reasonInput = document.getElementById('singleCancelReason');
  const counterEl = getDoctorEl('singleCancelCharCount', 'singleCancelCounter');
  const closeBtn = getDoctorEl('closeSingleCancelModalBtn', 'closeSingleCancelBtn');
  const cancelBtn = document.getElementById('cancelSingleCancelBtn');

  if (closeBtn) closeBtn.addEventListener('click', () => closeDoctorModal(modal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeDoctorModal(modal));

  if (reasonInput && counterEl) {
    reasonInput.addEventListener('input', () => {
      counterEl.textContent = `${reasonInput.value.length}/500 karakter`;
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    api.hideAlert('singleCancelAlert');

    const appointmentId =
      Number(document.getElementById('singleCancelAppointmentId')?.value || selectedDoctorAppointmentId);
    if (!appointmentId) {
      api.showAlert('singleCancelAlert', 'Pilih janji temu terlebih dahulu.', 'danger');
      return;
    }

    const category = getSelectedCategory(modal, 'singleCancelCategory');
    const reason = reasonInput ? reasonInput.value.trim() : '';
    const submitBtn = document.getElementById('singleCancelSubmitBtn') || form.querySelector('button[type="submit"]');

    if (!category) {
      api.showAlert('singleCancelAlert', 'Pilih kategori alasan pembatalan terlebih dahulu.', 'danger');
      return;
    }

    if (reason.length < 10 || reason.length > 500) {
      api.showAlert('singleCancelAlert', 'Alasan pembatalan wajib diisi antara 10 hingga 500 karakter.', 'danger');
      if (reasonInput) reasonInput.focus();
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Kirim Pengajuan';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim…';
      }

      const res = await api.request(`/dokter/janji-temu/${appointmentId}/pengajuan-pembatalan`, {
        method: 'POST',
        body: JSON.stringify({
          reason_category: category,
          reason
        })
      });

      closeDoctorModal(modal);
      api.showAlert('doctorPortalAlert', res.message || 'Pengajuan pembatalan berhasil dikirim ke admin.', 'success');

      await Promise.all([
        loadDoctorAppointments(),
        loadDoctorRequests()
      ]);
      await selectDoctorAppointment(appointmentId, { scrollToDetail: false });
    } catch (err) {
      const fallbackMsg = err.status === 422
        ? 'Batas pengajuan sudah lewat. Hubungi admin secara langsung.'
        : 'Gagal mengirim pengajuan pembatalan.';
      const msg = err.errors?.reason?.[0] || err.errors?.reason_category?.[0] || err.message || fallbackMsg;
      api.showAlert('singleCancelAlert', msg, 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

function openSingleCancelModal(appointment) {
  const modal = document.getElementById('singleCancelModal');
  if (!modal || !appointment) return;

  api.hideAlert('singleCancelAlert');

  const hiddenId = document.getElementById('singleCancelAppointmentId');
  if (hiddenId) hiddenId.value = String(appointment.id);

  const summaryEl = getDoctorEl('singleCancelSummary', 'singleCancelAppointmentInfo');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <strong>${escapeHtml(appointment.patient?.name || 'Pasien')}</strong>
      <span> (${escapeHtml(api.formatDate(appointment.appointment_date))}, ${escapeHtml(appointment.appointment_time || '09:00')} WIB)</span>
    `;
  }

  modal.querySelectorAll('input[type="radio"]').forEach((radio, idx) => {
    radio.checked = idx === 0;
  });

  const reasonInput = document.getElementById('singleCancelReason');
  if (reasonInput) reasonInput.value = '';
  const counterEl = getDoctorEl('singleCancelCharCount', 'singleCancelCounter');
  if (counterEl) counterEl.textContent = '0/500 karakter';

  openDoctorModal(modal, reasonInput);
}

function initBatchCancelModal() {
  const modal = document.getElementById('batchCancelModal');
  const form = document.getElementById('batchCancelForm');
  const dateFromInput = document.getElementById('batchDateFrom');
  const dateToInput = document.getElementById('batchDateTo');
  const reasonInput = getDoctorEl('batchCancelReason', 'batchReason');
  const counterEl = getDoctorEl('batchCancelCharCount', 'batchReasonCharCount', 'batchCharCount');
  const closeBtn = getDoctorEl('closeBatchCancelModalBtn', 'closeBatchCancelBtn');
  const cancelBtn = document.getElementById('cancelBatchCancelBtn');

  document.querySelectorAll('#openBatchCancelBtn, #batchCancelOpenBtn, [data-open-batch-modal]').forEach((btn) => {
    btn.addEventListener('click', openBatchCancelModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', () => closeDoctorModal(modal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeDoctorModal(modal));

  if (reasonInput && counterEl) {
    reasonInput.addEventListener('input', () => {
      counterEl.textContent = `${reasonInput.value.length}/500 karakter`;
    });
  }

  if (dateFromInput && dateToInput) {
    const today = getLocalIsoDate(0);
    dateFromInput.min = today;
    dateToInput.min = dateFromInput.value || today;

    const onBatchRangeChange = () => {
      if (dateFromInput.value) {
        dateToInput.min = dateFromInput.value;
        if (dateToInput.value && dateToInput.value < dateFromInput.value) {
          dateToInput.value = dateFromInput.value;
        }
      }
      refreshBatchAffectedPreview();
    };

    dateFromInput.addEventListener('change', onBatchRangeChange);
    dateToInput.addEventListener('change', onBatchRangeChange);
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    api.hideAlert('batchCancelAlert');

    const date_from = dateFromInput ? dateFromInput.value : '';
    const date_to = dateToInput ? dateToInput.value : '';
    const reason_category =
      getSelectedCategory(modal, 'batchCancelCategory') ||
      getSelectedCategory(modal, 'batchReasonCategory');
    const reason = reasonInput ? reasonInput.value.trim() : '';
    const submitBtn = document.getElementById('batchCancelSubmitBtn') || form.querySelector('button[type="submit"]');

    if (!date_from || !date_to) {
      api.showAlert('batchCancelAlert', 'Pilih tanggal mulai dan tanggal selesai cuti.', 'danger');
      return;
    }

    if (date_to < date_from) {
      api.showAlert('batchCancelAlert', 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.', 'danger');
      return;
    }

    if (!reason_category) {
      api.showAlert('batchCancelAlert', 'Pilih kategori alasan pengajuan cuti.', 'danger');
      return;
    }

    if (reason.length < 10 || reason.length > 500) {
      api.showAlert('batchCancelAlert', 'Alasan tertulis wajib diisi antara 10 hingga 500 karakter.', 'danger');
      if (reasonInput) reasonInput.focus();
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Kirim Pengajuan Cuti';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses…';
      }

      const res = await api.request('/dokter/pengajuan-pembatalan/massal', {
        method: 'POST',
        body: JSON.stringify({
          date_from,
          date_to,
          reason_category,
          reason
        })
      });

      const result = res.data || res;
      const created = Array.isArray(result.created) ? result.created : [];
      const skipped = Array.isArray(result.skipped) ? result.skipped : [];
      const batchId = result.batch_id || '';

      renderBatchResultBox(batchId, created, skipped, modal);
      api.showAlert(
        'doctorPortalAlert',
        `Pengajuan massal diproses: ${created.length} janji diajukan, ${skipped.length} dilewati.`,
        created.length > 0 ? 'success' : 'info'
      );

      await Promise.all([
        loadDoctorAppointments(),
        loadDoctorRequests()
      ]);
    } catch (err) {
      const msg =
        err.errors?.date_to?.[0] ||
        err.errors?.date_from?.[0] ||
        err.errors?.reason?.[0] ||
        err.errors?.reason_category?.[0] ||
        err.message ||
        'Gagal mengirim pengajuan cuti massal.';
      api.showAlert('batchCancelAlert', msg, 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

function openBatchCancelModal() {
  const modal = document.getElementById('batchCancelModal');
  if (!modal) return;

  api.hideAlert('batchCancelAlert');
  const today = getLocalIsoDate(0);
  const dateFromInput = document.getElementById('batchDateFrom');
  const dateToInput = document.getElementById('batchDateTo');
  const reasonInput = getDoctorEl('batchCancelReason', 'batchReason');
  const counterEl = getDoctorEl('batchCancelCharCount', 'batchReasonCharCount', 'batchCharCount');
  const resultBox = document.getElementById('batchResultBox');

  if (dateFromInput) {
    dateFromInput.min = today;
    if (!dateFromInput.value || dateFromInput.value < today) {
      dateFromInput.value = today;
    }
  }
  if (dateToInput) {
    const minTo = dateFromInput?.value || today;
    dateToInput.min = minTo;
    if (!dateToInput.value || dateToInput.value < minTo) {
      dateToInput.value = minTo;
    }
  }

  modal.querySelectorAll('input[type="radio"]').forEach((radio, idx) => {
    radio.checked = idx === 0;
  });

  if (reasonInput) reasonInput.value = '';
  if (counterEl) counterEl.textContent = '0/500 karakter';
  if (resultBox && modal.contains(resultBox)) {
    resultBox.hidden = true;
    resultBox.style.display = 'none';
    resultBox.innerHTML = '';
  }

  openDoctorModal(modal, dateFromInput);
  refreshBatchAffectedPreview();
}

async function refreshBatchAffectedPreview() {
  const previewEl = document.getElementById('batchAffectedPreview');
  const dateFrom = document.getElementById('batchDateFrom')?.value || '';
  const dateTo = document.getElementById('batchDateTo')?.value || '';
  if (!previewEl) return;

  if (!dateFrom || !dateTo) {
    previewEl.textContent = 'Pilih rentang tanggal untuk melihat daftar janji temu terjadwal yang terdampak.';
    return;
  }

  if (dateTo < dateFrom) {
    previewEl.textContent = 'Tanggal selesai harus sama atau sesudah tanggal mulai.';
    return;
  }

  const startMs = new Date(`${dateFrom}T00:00:00`).getTime();
  const endMs = new Date(`${dateTo}T00:00:00`).getTime();
  const diffDays = Math.round((endMs - startMs) / 86400000);
  if (diffDays > 14) {
    previewEl.textContent = 'Rentang cuti massal maksimal 14 hari dari tanggal mulai.';
    return;
  }

  const currentSeq = ++batchPreviewSeq;
  previewEl.textContent = 'Memeriksa jumlah janji terjadwal pada rentang ini…';

  try {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      status: 'terjadwal'
    });
    const res = await api.request(`/dokter/janji-temu?${params.toString()}`, { priority: 'low' });
    if (currentSeq !== batchPreviewSeq) return;

    const items = Array.isArray(res.data) ? res.data : [];
    if (items.length === 0) {
      previewEl.textContent = 'Tidak ada janji berstatus terjadwal pada rentang tanggal ini.';
      return;
    }

    const eligibleCount = items.filter((item) => Boolean(item.can_request_cancellation)).length;
    previewEl.textContent = `Ditemukan ${items.length} janji terjadwal (${eligibleCount} memenuhi syarat minimal 2 jam sebelum jadwal).`;
  } catch {
    if (currentSeq !== batchPreviewSeq) return;
    previewEl.textContent = 'Gagal memeriksa pratinjau janji. Kamu tetap dapat mengirim pengajuan.';
  }
}

function renderBatchResultBox(batchId, created, skipped, modal) {
  const resultBox = document.getElementById('batchResultBox');
  if (!resultBox) {
    closeDoctorModal(modal);
    return;
  }

  const skippedHtml = skipped.length > 0
    ? `<ul class="batch-skipped-list">${skipped.map((item) => `<li>Janji #${escapeHtml(String(item.id || '-'))}: ${escapeHtml(item.sebab || item.reason || 'Dilewati')}</li>`).join('')}</ul>`
    : '<p class="text-sm text-muted">Tidak ada janji yang dilewati.</p>';

  resultBox.innerHTML = `
    <div class="batch-result-summary">
      <strong>Hasil Pengajuan Massal</strong>
      ${batchId ? `<div class="text-sm text-muted">ID Batch: <code>${escapeHtml(String(batchId).slice(0, 8))}</code></div>` : ''}
      <div class="mt-2" style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
        <span class="badge badge-disetujui">Berhasil diajukan: ${created.length}</span>
        <span class="badge badge-ditarik">Dilewati: ${skipped.length}</span>
      </div>
      <div class="mt-2">${skippedHtml}</div>
    </div>
  `;
  resultBox.hidden = false;
  resultBox.style.display = 'block';

  if (modal && !modal.contains(resultBox)) {
    closeDoctorModal(modal);
  }
}

function initWithdrawModal() {
  const modal = document.getElementById('withdrawConfirmModal');
  const form = document.getElementById('withdrawConfirmForm');
  const confirmBtn = getDoctorEl('confirmWithdrawBtn', 'withdrawConfirmSubmitBtn');
  const closeBtn = getDoctorEl('closeWithdrawModalBtn', 'closeWithdrawBtn');
  const cancelBtn = document.getElementById('cancelWithdrawBtn');

  if (closeBtn) closeBtn.addEventListener('click', () => closeDoctorModal(modal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeDoctorModal(modal));

  const submitWithdraw = async () => {
    const reqId = Number(document.getElementById('withdrawRequestId')?.value || pendingWithdrawRequestId);
    if (!reqId) return;
    api.hideAlert('withdrawAlert');

    const activeBtn = confirmBtn || form?.querySelector('button[type="submit"]');
    const originalText = activeBtn ? activeBtn.textContent : 'Tarik Pengajuan';

    try {
      if (activeBtn) {
        activeBtn.disabled = true;
        activeBtn.textContent = 'Memproses…';
      }

      const res = await api.request(`/dokter/pengajuan-pembatalan/${reqId}/tarik`, {
        method: 'POST'
      });

      closeDoctorModal(modal);
      pendingWithdrawRequestId = null;
      const hiddenInput = document.getElementById('withdrawRequestId');
      if (hiddenInput) hiddenInput.value = '';

      api.showAlert('doctorPortalAlert', res.message || 'Pengajuan pembatalan berhasil ditarik.', 'success');

      await Promise.all([
        loadDoctorRequests(),
        loadDoctorAppointments()
      ]);
    } catch (err) {
      const msg = err.message || 'Gagal menarik pengajuan pembatalan.';
      if (document.getElementById('withdrawAlert')) {
        api.showAlert('withdrawAlert', msg, 'danger');
      } else {
        closeDoctorModal(modal);
        api.showAlert('doctorPortalAlert', msg, 'danger');
      }
    } finally {
      if (activeBtn) {
        activeBtn.disabled = false;
        activeBtn.textContent = originalText;
      }
    }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitWithdraw();
    });
  } else if (confirmBtn) {
    confirmBtn.addEventListener('click', submitWithdraw);
  }
}

function openWithdrawModal(requestId, requestOrAppt = null) {
  const modal = document.getElementById('withdrawConfirmModal');
  if (!modal) return;

  pendingWithdrawRequestId = requestId;
  const hiddenInput = document.getElementById('withdrawRequestId');
  if (hiddenInput) hiddenInput.value = String(requestId);
  api.hideAlert('withdrawAlert');

  const summaryEl = getDoctorEl('withdrawSummary', 'withdrawTargetInfo');
  if (summaryEl && requestOrAppt) {
    const appt = requestOrAppt.appointment || requestOrAppt;
    const patientName = appt.patient?.name || appt.user?.name || 'Pasien';
    const dateStr = appt.appointment_date ? api.formatDate(appt.appointment_date) : '-';
    const timeStr = appt.appointment_time || '09:00';
    summaryEl.textContent = `Tarik pengajuan pembatalan untuk janji temu ${patientName} (${dateStr}, ${timeStr} WIB)?`;
  }

  const focusTarget = getDoctorEl('confirmWithdrawBtn', 'withdrawConfirmSubmitBtn') || modal.querySelector('button[type="submit"]');
  openDoctorModal(modal, focusTarget);
}

function renderFilteredDoctorRequests() {
  const stateEl = document.getElementById('doctorRequestsState');
  const tableBody = document.getElementById('doctorRequestsBody');
  const cardsEl = document.getElementById('doctorRequestsCards');
  const tableWrap = tableBody ? tableBody.closest('.table-responsive') : null;
  if (!tableBody && !cardsEl) return;

  const query = getDoctorSearchQuery();
  const filtered = (doctorRequestsCache || []).filter((r) => {
    if (!query) return true;
    const appt = r.appointment || {};
    const haystack = [
      appt.patient?.name,
      appt.user?.name,
      appt.polyclinic?.name,
      r.reason,
      r.reason_category,
      r.status,
      r.admin_note
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });

  if (filtered.length === 0) {
    const emptyMsg = query
      ? 'Tidak ada pengajuan yang cocok dengan pencarian Anda.'
      : 'Belum ada pengajuan pembatalan.';
    setDoctorListState(stateEl, tableWrap, cardsEl, 'empty', emptyMsg);
    return;
  }

  hideDoctorListState(stateEl, tableWrap, cardsEl);
  renderDoctorRequests(filtered, tableBody, cardsEl);
}

async function loadDoctorRequests() {
  const stateEl = document.getElementById('doctorRequestsState');
  const tableBody = document.getElementById('doctorRequestsBody');
  const cardsEl = document.getElementById('doctorRequestsCards');
  const tableWrap = tableBody ? tableBody.closest('.table-responsive') : null;

  if (tableWrap && cardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }

  setDoctorListState(stateEl, tableWrap, cardsEl, 'loading', 'Memuat daftar pengajuan pembatalan...');

  const reqStatusFilter = getDoctorEl('filterReqStatus', 'filterDocReqStatus', 'filterRequestStatus');
  const statusVal = reqStatusFilter ? reqStatusFilter.value : '';

  const params = new URLSearchParams();
  if (statusVal) params.set('status', statusVal);

  try {
    const query = params.toString();
    const res = await api.request(`/dokter/pengajuan-pembatalan${query ? `?${query}` : ''}`, { priority: 'high' });
    doctorRequestsCache = Array.isArray(res.data) ? res.data : [];

    updateDoctorRequestTabBadge(doctorRequestsCache, statusVal);
    renderFilteredDoctorRequests();
    renderDoctorSidebarSummary();
    updateDoctorSyncTime();
  } catch {
    setDoctorListState(stateEl, tableWrap, cardsEl, 'error', 'Gagal memuat data. Coba lagi.', loadDoctorRequests);
  }
}

async function updateDoctorRequestTabBadge(items, currentFilter = '') {
  let pendingCount = items.filter((item) => item.status === 'diajukan').length;
  if (currentFilter && currentFilter !== 'diajukan') {
    try {
      const res = await api.request('/dokter/pengajuan-pembatalan?status=diajukan', { priority: 'low' });
      if (Array.isArray(res.data)) {
        pendingCount = res.data.length;
      }
    } catch {
      // Keep best-known count
    }
  }

  ['openRequestNavCount', 'doctorRequestsBadge', 'topbarNotifCount', 'drawerOpenReqBadge'].forEach((id) => {
    const badgeEl = document.getElementById(id);
    if (!badgeEl) return;
    badgeEl.textContent = String(pendingCount);
    badgeEl.hidden = pendingCount === 0;
    badgeEl.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
  });
}

function renderDoctorRequests(items, tableBody, cardsEl) {
  if (tableBody) {
    tableBody.innerHTML = items.map((r) => {
      const appt = r.appointment || {};
      const patientName = appt.patient?.name || appt.user?.name || 'Pasien';
      const poliName = appt.polyclinic?.name || '-';
      const dateStr = appt.appointment_date ? api.formatDate(appt.appointment_date) : '-';
      const timeStr = appt.appointment_time || '09:00';
      const batchBadge = r.batch_id
        ? `<div class="mt-2"><span class="badge badge-kontrol_rutin">Batch ${escapeHtml(String(r.batch_id).slice(0, 8))}</span></div>`
        : '';
      const adminNoteHtml = r.admin_note
        ? `<div class="mt-2 text-sm"><strong>Catatan Admin:</strong> ${escapeHtml(r.admin_note)}</div>`
        : '';

      return `
        <tr>
          <td>
            <strong>${escapeHtml(dateStr)}</strong>
            <div class="text-muted text-sm">${escapeHtml(timeStr)} WIB</div>
            <div class="text-sm">${escapeHtml(patientName)} (${escapeHtml(poliName)})</div>
          </td>
          <td>
            <strong>${escapeHtml(getReasonCategoryLabel(r.reason_category))}</strong>
            <div class="text-sm text-muted">${escapeHtml(r.reason || '-')}</div>
            ${batchBadge}
          </td>
          <td>
            <span class="badge ${getRequestBadgeClass(r.status)}">${escapeHtml(getRequestStatusLabel(r.status))}</span>
            <div class="text-muted text-sm mt-2">SLA: ${escapeHtml(formatDateTimeId(r.due_at))}</div>
          </td>
          <td>${adminNoteHtml || '<span class="text-muted">-</span>'}</td>
          <td>
            ${r.status === 'diajukan'
              ? `<button type="button" class="btn btn-secondary btn-touch" data-withdraw-id="${r.id}">Tarik pengajuan</button>`
              : '<span class="text-muted text-sm">Selesai diproses</span>'}
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('[data-withdraw-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const reqId = Number(btn.getAttribute('data-withdraw-id'));
        const item = doctorRequestsCache.find((x) => x.id === reqId);
        if (reqId) openWithdrawModal(reqId, item);
      });
    });
  }

  if (cardsEl) {
    cardsEl.innerHTML = items.map((r) => {
      const appt = r.appointment || {};
      const patientName = appt.patient?.name || appt.user?.name || 'Pasien';
      const poliName = appt.polyclinic?.name || '-';
      const dateStr = appt.appointment_date ? api.formatDate(appt.appointment_date) : '-';
      const timeStr = appt.appointment_time || '09:00';

      return `
        <article class="mobile-data-card">
          <div class="mobile-data-card__head">
            <div>
              <strong>${escapeHtml(patientName)}</strong>
              <div class="text-muted text-sm">${escapeHtml(poliName)}</div>
            </div>
            <span class="badge ${getRequestBadgeClass(r.status)}">${escapeHtml(getRequestStatusLabel(r.status))}</span>
          </div>
          <div class="mobile-data-card__meta">
            <div><strong>Jadwal:</strong> ${escapeHtml(dateStr)}, ${escapeHtml(timeStr)} WIB</div>
            <div><strong>Alasan (${escapeHtml(getReasonCategoryLabel(r.reason_category))}):</strong> ${escapeHtml(r.reason || '-')}</div>
            ${r.batch_id ? `<div><span class="badge badge-kontrol_rutin">Batch ${escapeHtml(String(r.batch_id).slice(0, 8))}</span></div>` : ''}
            ${r.admin_note ? `<div><strong>Catatan Admin:</strong> ${escapeHtml(r.admin_note)}</div>` : ''}
            <div class="text-muted text-sm">Batas SLA: ${escapeHtml(formatDateTimeId(r.due_at))}</div>
          </div>
          ${r.status === 'diajukan'
            ? `<div class="mobile-data-card__actions">
                <button type="button" class="btn btn-secondary btn-block btn-touch" data-withdraw-id="${r.id}">Tarik pengajuan</button>
              </div>`
            : ''}
        </article>
      `;
    }).join('');

    cardsEl.querySelectorAll('[data-withdraw-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const reqId = Number(btn.getAttribute('data-withdraw-id'));
        const item = doctorRequestsCache.find((x) => x.id === reqId);
        if (reqId) openWithdrawModal(reqId, item);
      });
    });
  }
}

function getSelectedCategory(modalEl, selectFallbackId) {
  if (modalEl) {
    const checkedRadio = modalEl.querySelector('input[type="radio"]:checked');
    if (checkedRadio && checkedRadio.value) return checkedRadio.value;
  }
  const selectEl = document.getElementById(selectFallbackId);
  return selectEl ? selectEl.value : '';
}

function getAppointmentTypeLabel(type) {
  return type === 'kontrol_rutin' ? 'Kontrol rutin' : 'Janji baru';
}

function getAppointmentStatusLabel(status) {
  switch (status) {
    case 'terjadwal': return 'Terjadwal';
    case 'selesai': return 'Selesai';
    case 'dibatalkan': return 'Dibatalkan';
    default: return status || '-';
  }
}

function getRequestStatusLabel(status) {
  switch (status) {
    case 'diajukan': return 'Menunggu Admin';
    case 'disetujui': return 'Disetujui';
    case 'dijadwalkan_ulang': return 'Dijadwalkan Ulang';
    case 'ditolak': return 'Ditolak';
    case 'ditarik': return 'Ditarik';
    case 'gugur': return 'Gugur';
    case 'kedaluwarsa': return 'Kedaluwarsa';
    default: return status || '-';
  }
}

function getRequestBadgeClass(status) {
  const valid = [
    'diajukan',
    'disetujui',
    'dijadwalkan_ulang',
    'ditolak',
    'ditarik',
    'gugur',
    'kedaluwarsa'
  ];
  return valid.includes(status) ? `badge-${status}` : 'badge-janji_baru';
}

function getReasonCategoryLabel(category) {
  switch (category) {
    case 'cuti_mendadak': return 'Cuti Mendadak';
    case 'sakit': return 'Sakit';
    case 'tugas_darurat': return 'Tugas Darurat';
    case 'bentrok_jadwal': return 'Bentrok Jadwal';
    case 'lainnya': return 'Lainnya';
    default: return category || '-';
  }
}

function formatDateTimeId(isoString) {
  if (!isoString) return '-';
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return String(isoString);
  return `${new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dt)} WIB`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function isAppointmentQuickCancellable(d) {
  if (!d || d.status !== 'terjadwal') return false;
  if (typeof d.can_quick_cancel === 'boolean') return d.can_quick_cancel;
  if (!d.created_at) return false;
  const createdMs = new Date(d.created_at).getTime();
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs <= 15 * 60 * 1000;
}

async function loadDoctorMasterPoli() {
  try {
    const res = await api.request('/master-poli', { priority: 'low' });
    doctorMasterPoliCache = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    doctorMasterPoliCache = [];
  }
}

function getDoctorSamePoliDoctors(poliId) {
  if (!Array.isArray(doctorMasterPoliCache) || !doctorMasterPoliCache.length) return [];
  const poli = doctorMasterPoliCache.find((p) => Number(p.id) === Number(poliId));
  if (!poli || !Array.isArray(poli.doctors)) return [];
  return poli.doctors.filter((doc) => doc && (doc.is_active === undefined || Boolean(doc.is_active)));
}

function initQuickCancelModal() {
  const form = document.getElementById('quickCancelForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    api.hideAlert('quickCancelAlert');

    const apptId = Number(document.getElementById('quickCancelAppointmentId')?.value);
    const reason = (document.getElementById('quickCancelReason')?.value || '').trim();
    const submitBtn = document.getElementById('submitQuickCancelBtn');

    if (!apptId) {
      api.showAlert('quickCancelAlert', 'ID janji temu tidak ditemukan.', 'danger');
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Membatalkan…';
    }

    try {
      const payload = reason ? { reason } : {};
      const res = await api.request(`/dokter/janji-temu/${apptId}/batal-cepat`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      closeDoctorModal(document.getElementById('quickCancelModal'));
      api.showAlert('doctorPortalAlert', res.message || 'Janji temu berhasil dibatalkan dalam batas waktu 15 menit.', 'success');

      await Promise.all([
        loadDoctorAppointments(),
        loadDoctorRequests()
      ]);
      if (Number(selectedDoctorAppointmentId) === apptId) {
        await selectDoctorAppointment(apptId);
      }
    } catch (err) {
      api.showAlert('quickCancelAlert', err.message || 'Gagal melakukan pembatalan cepat.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || 'Ya, Batalkan Sekarang';
      }
    }
  });
}

function openQuickCancelModal(d) {
  const modal = document.getElementById('quickCancelModal');
  if (!modal || !d) return;

  api.hideAlert('quickCancelAlert');
  const idInput = document.getElementById('quickCancelAppointmentId');
  const reasonEl = document.getElementById('quickCancelReason');
  const summaryEl = document.getElementById('quickCancelSummary');

  if (idInput) idInput.value = String(d.id);
  if (reasonEl) reasonEl.value = '';
  if (summaryEl) {
    const patientName = d.patient?.name || 'Pasien';
    const deadlineText = d.quick_cancel_deadline_at ? formatDateTimeId(d.quick_cancel_deadline_at) : '15 menit sejak dibuat';
    summaryEl.innerHTML = `
      <div class="detail-open-request-box">
        <div><strong>Pasien:</strong> ${escapeHtml(patientName)}</div>
        <div><strong>Jadwal:</strong> ${escapeHtml(api.formatDate(d.appointment_date))}, ${escapeHtml(d.appointment_time || '09:00')} WIB</div>
        <div><strong>Batas batal cepat:</strong> ${escapeHtml(deadlineText)}</div>
      </div>
    `;
  }

  openDoctorModal(modal, reasonEl);
}

function initCompleteAppointmentModal() {
  const form = document.getElementById('completeAppointmentForm');
  const notesEl = document.getElementById('completeDoctorNotes');
  const countEl = document.getElementById('completeDoctorNotesCount');
  const followUpCheckbox = document.getElementById('completeScheduleFollowUp');
  const followUpFields = document.getElementById('completeFollowUpFields');
  const followUpDate = document.getElementById('completeFollowUpDate');

  if (notesEl && countEl) {
    notesEl.addEventListener('input', () => {
      countEl.textContent = `${notesEl.value.length}/1000`;
    });
  }

  if (followUpCheckbox && followUpFields) {
    followUpCheckbox.addEventListener('change', () => {
      const checked = followUpCheckbox.checked;
      followUpFields.hidden = !checked;
      followUpFields.style.display = checked ? 'block' : 'none';
      if (followUpDate) {
        followUpDate.required = checked;
      }
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    api.hideAlert('completeModalAlert');

    const apptId = Number(document.getElementById('completeAppointmentId')?.value);
    const notes = (notesEl?.value || '').trim();
    const shouldFollowUp = Boolean(followUpCheckbox?.checked);
    const followDate = followUpDate?.value || '';
    const followDoctorId = document.getElementById('completeFollowUpDoctorId')?.value || '';
    const submitBtn = document.getElementById('submitCompleteBtn');

    if (!apptId) {
      api.showAlert('completeModalAlert', 'ID janji temu tidak ditemukan.', 'danger');
      return;
    }
    if (notes.length < 5) {
      api.showAlert('completeModalAlert', 'Catatan pemeriksaan dokter minimal 5 karakter.', 'danger');
      notesEl?.focus();
      return;
    }
    if (shouldFollowUp && !followDate) {
      api.showAlert('completeModalAlert', 'Pilih tanggal kontrol rutin terlebih dahulu.', 'danger');
      followUpDate?.focus();
      return;
    }

    const payload = { doctor_notes: notes };
    if (shouldFollowUp) {
      payload.follow_up_date = followDate;
      if (followDoctorId) {
        payload.follow_up_doctor_id = Number(followDoctorId);
      }
    }

    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan…';
    }

    try {
      const res = await api.request(`/dokter/janji-temu/${apptId}/selesai`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      closeDoctorModal(document.getElementById('completeAppointmentModal'));
      const followUpCreated = res.data?.follow_up_appointment;
      const msg = followUpCreated
        ? `${res.message || 'Pemeriksaan selesai.'} Jadwal kontrol rutin berhasil dibuat untuk ${api.formatDate(followUpCreated.appointment_date)}.`
        : (res.message || 'Janji temu ditandai selesai dan catatan dokter tersimpan.');
      api.showAlert('doctorPortalAlert', msg, 'success');

      await Promise.all([
        loadDoctorAppointments(),
        loadDoctorRequests()
      ]);
      if (Number(selectedDoctorAppointmentId) === apptId) {
        await selectDoctorAppointment(apptId);
      }
    } catch (err) {
      api.showAlert('completeModalAlert', err.message || 'Gagal menyelesaikan pemeriksaan janji temu.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || 'Simpan & Selesai';
      }
    }
  });
}

async function openCompleteAppointmentModal(d) {
  const modal = document.getElementById('completeAppointmentModal');
  if (!modal || !d) return;

  api.hideAlert('completeModalAlert');
  const idInput = document.getElementById('completeAppointmentId');
  const notesEl = document.getElementById('completeDoctorNotes');
  const countEl = document.getElementById('completeDoctorNotesCount');
  const summaryEl = document.getElementById('completeModalSummary');
  const followUpCheckbox = document.getElementById('completeScheduleFollowUp');
  const followUpFields = document.getElementById('completeFollowUpFields');
  const followUpDate = document.getElementById('completeFollowUpDate');
  const followUpDoctorSelect = document.getElementById('completeFollowUpDoctorId');

  if (idInput) idInput.value = String(d.id);
  if (notesEl) notesEl.value = '';
  if (countEl) countEl.textContent = '0/1000';
  if (followUpCheckbox) followUpCheckbox.checked = false;
  if (followUpFields) {
    followUpFields.hidden = true;
    followUpFields.style.display = 'none';
  }
  if (followUpDate) {
    followUpDate.value = '';
    followUpDate.min = getLocalIsoDate(1);
    followUpDate.required = false;
  }

  if (summaryEl) {
    const patientName = d.patient?.name || 'Pasien';
    summaryEl.innerHTML = `
      <div class="detail-open-request-box">
        <div><strong>Pasien:</strong> ${escapeHtml(patientName)}</div>
        <div><strong>Poliklinik:</strong> ${escapeHtml(d.polyclinic?.name || '-')}</div>
        <div><strong>Jadwal:</strong> ${escapeHtml(api.formatDate(d.appointment_date))}, ${escapeHtml(d.appointment_time || '09:00')} WIB</div>
      </div>
    `;
  }

  openDoctorModal(modal, notesEl);

  if (followUpDoctorSelect) {
    if (!doctorMasterPoliCache.length) {
      await loadDoctorMasterPoli();
    }
    const user = api.getUser() || {};
    const currentDoctorId = Number(d.doctor_id || user.doctor?.id || 0);
    const currentDoctorName = d.doctor?.name || user.doctor?.name || user.name || 'Saya';
    const poliId = d.polyclinic_id || d.polyclinic?.id || user.doctor?.polyclinic_id;
    let doctors = getDoctorSamePoliDoctors(poliId);
    if (!doctors.length && currentDoctorId) {
      doctors = [{ id: currentDoctorId, name: currentDoctorName }];
    }
    followUpDoctorSelect.innerHTML = doctors.map((doc) => {
      const selected = Number(doc.id) === currentDoctorId ? 'selected' : '';
      return `<option value="${doc.id}" ${selected}>${escapeHtml(doc.name)}</option>`;
    }).join('');
  }
}

function initSlotRequestModal() {
  document.querySelectorAll('#openSlotRequestBtn, #slotTabOpenModalBtn, [data-open-slot-modal]').forEach((btn) => {
    btn.addEventListener('click', openSlotRequestModal);
  });

  const reloadBtn = document.getElementById('reloadSlotRequestsBtn');
  if (reloadBtn) reloadBtn.addEventListener('click', loadDoctorSlotRequests);

  const retryBtn = document.getElementById('retrySlotRequestsBtn');
  if (retryBtn) retryBtn.addEventListener('click', loadDoctorSlotRequests);

  const form = document.getElementById('slotRequestForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    api.hideAlert('slotRequestModalAlert');

    const scheduleDate = document.getElementById('slotScheduleDate')?.value || '';
    const startTime = document.getElementById('slotStartTime')?.value || '';
    const endTime = document.getElementById('slotEndTime')?.value || '';
    const quota = Number(document.getElementById('slotQuota')?.value || 0);
    const reason = (document.getElementById('slotReason')?.value || '').trim();
    const submitBtn = document.getElementById('submitSlotRequestBtn');

    if (!scheduleDate || !startTime || !endTime) {
      api.showAlert('slotRequestModalAlert', 'Tanggal, jam mulai, dan jam selesai wajib diisi.', 'danger');
      return;
    }
    if (endTime <= startTime) {
      api.showAlert('slotRequestModalAlert', 'Jam selesai harus lebih lambat daripada jam mulai.', 'danger');
      return;
    }
    if (!Number.isInteger(quota) || quota < 1 || quota > 50) {
      api.showAlert('slotRequestModalAlert', 'Kuota pasien harus antara 1 sampai 50.', 'danger');
      return;
    }
    if (reason.length < 5) {
      api.showAlert('slotRequestModalAlert', 'Alasan pengajuan slot minimal 5 karakter.', 'danger');
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim…';
    }

    try {
      const res = await api.request('/dokter/slot-tambahan', {
        method: 'POST',
        body: JSON.stringify({
          schedule_date: scheduleDate,
          start_time: startTime,
          end_time: endTime,
          quota,
          reason
        })
      });

      closeDoctorModal(document.getElementById('slotRequestModal'));
      api.showAlert('doctorPortalAlert', res.message || 'Pengajuan slot tambahan berhasil dikirim ke admin.', 'success');
      switchDoctorTab('slotRequests');
      await loadDoctorSlotRequests();
    } catch (err) {
      api.showAlert('slotRequestModalAlert', err.message || 'Gagal mengirim pengajuan slot tambahan.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || 'Kirim Pengajuan Slot';
      }
    }
  });
}

function openSlotRequestModal() {
  const modal = document.getElementById('slotRequestModal');
  if (!modal) return;

  api.hideAlert('slotRequestModalAlert');
  const dateInput = document.getElementById('slotScheduleDate');
  const startInput = document.getElementById('slotStartTime');
  const endInput = document.getElementById('slotEndTime');
  const quotaInput = document.getElementById('slotQuota');
  const reasonInput = document.getElementById('slotReason');

  const today = getLocalIsoDate(0);
  if (dateInput) {
    dateInput.min = today;
    dateInput.value = getLocalIsoDate(1);
  }
  if (startInput) startInput.value = '16:00';
  if (endInput) endInput.value = '18:00';
  if (quotaInput) quotaInput.value = '5';
  if (reasonInput) reasonInput.value = '';

  openDoctorModal(modal, dateInput);
}

function renderFilteredDoctorSlotRequests() {
  const emptyEl = document.getElementById('slotRequestsEmpty');
  const tableWrap = document.getElementById('slotRequestsTableWrap');
  const tableBody = document.getElementById('slotRequestsTableBody');
  const cardsEl = document.getElementById('slotRequestsCards');
  if (!tableBody && !cardsEl) return;

  const query = getDoctorSearchQuery();
  const items = (doctorSlotRequestsCache || []).filter((item) => {
    if (!query) return true;
    const haystack = [
      item.schedule_date,
      item.reason,
      item.status,
      item.admin_note
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });

  if (tableWrap) tableWrap.hidden = items.length === 0;
  if (emptyEl) emptyEl.hidden = items.length > 0;
  if (cardsEl) cardsEl.innerHTML = '';

  if (!items.length) return;

  if (tableBody) {
    tableBody.innerHTML = items.map((item) => {
      const startLabel = String(item.start_time || '').slice(0, 5);
      const endLabel = String(item.end_time || '').slice(0, 5);
      return `
        <tr>
          <td><strong>${escapeHtml(formatCompactDateDoc(item.schedule_date))}</strong></td>
          <td>${escapeHtml(startLabel)} - ${escapeHtml(endLabel)} WIB</td>
          <td>${escapeHtml(String(item.quota || 0))} pasien</td>
          <td>${escapeHtml(item.reason || '-')}</td>
          <td><span class="badge ${getRequestBadgeClass(item.status)}">${escapeHtml(getRequestStatusLabel(item.status))}</span></td>
          <td>${escapeHtml(item.admin_note || '-')}</td>
        </tr>
      `;
    }).join('');
  }

  if (cardsEl) {
    cardsEl.innerHTML = items.map((item) => {
      const startLabel = String(item.start_time || '').slice(0, 5);
      const endLabel = String(item.end_time || '').slice(0, 5);
      return `
        <article class="mobile-data-card">
          <div class="mobile-data-card__head">
            <div>
              <strong>${escapeHtml(formatCompactDateDoc(item.schedule_date))}</strong>
              <div class="text-sm text-muted">${escapeHtml(startLabel)} - ${escapeHtml(endLabel)} WIB</div>
            </div>
            <span class="badge ${getRequestBadgeClass(item.status)}">${escapeHtml(getRequestStatusLabel(item.status))}</span>
          </div>
          <div class="mobile-data-card__meta">
            <div><strong>Kuota:</strong> ${escapeHtml(String(item.quota || 0))} pasien</div>
            <div><strong>Alasan:</strong> ${escapeHtml(item.reason || '-')}</div>
            ${item.admin_note ? `<div><strong>Catatan admin:</strong> ${escapeHtml(item.admin_note)}</div>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }
}

async function loadDoctorSlotRequests() {
  const loadingEl = document.getElementById('slotRequestsLoading');
  const emptyEl = document.getElementById('slotRequestsEmpty');
  const errorEl = document.getElementById('slotRequestsError');
  const errorMsgEl = document.getElementById('slotRequestsErrorMsg');
  const tableWrap = document.getElementById('slotRequestsTableWrap');
  const tableBody = document.getElementById('slotRequestsTableBody');
  const cardsEl = document.getElementById('slotRequestsCards');

  if (!tableBody && !cardsEl) return;

  if (tableWrap && cardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }
  if (loadingEl) loadingEl.hidden = false;
  if (emptyEl) emptyEl.hidden = true;
  if (errorEl) errorEl.hidden = true;
  if (tableWrap) tableWrap.hidden = true;
  if (cardsEl) cardsEl.innerHTML = '';

  try {
    const res = await api.request('/dokter/slot-tambahan', { priority: 'low' });
    const items = Array.isArray(res.data) ? res.data : [];
    doctorSlotRequestsCache = items;

    if (loadingEl) loadingEl.hidden = true;

    renderFilteredDoctorSlotRequests();
    updateDoctorSyncTime();
  } catch (err) {
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) errorEl.hidden = false;
    if (errorMsgEl) errorMsgEl.textContent = err.message || 'Gagal memuat daftar pengajuan slot tambahan.';
  }
}

function renderDoctorPracticeDates() {
  const listEl = document.getElementById('docPracticeDatesList');
  const countEl = document.getElementById('docPracticeCountText');
  const clearBtn = document.getElementById('docClearPracticeDatesBtn');
  if (!listEl) return;

  const sorted = [...new Set(doctorPracticeDates)].sort();
  doctorPracticeDates = sorted;

  if (countEl) {
    countEl.textContent = `Tanggal Praktik Aktif (${sorted.length})`;
  }
  if (clearBtn) {
    clearBtn.hidden = sorted.length === 0;
  }

  if (sorted.length === 0) {
    listEl.innerHTML = '<span class="text-sm text-muted">Belum ada tanggal praktik dibuka. Pasien belum dapat memilih tanggal janji temu.</span>';
    return;
  }

  listEl.innerHTML = sorted.map((isoDate) => `
    <button type="button" class="medical-filter-chip is-active" data-remove-practice-date="${escapeHtml(isoDate)}" title="Hapus tanggal ${escapeHtml(isoDate)}">
      <span>${escapeHtml(formatCompactDateDoc(isoDate))}</span>
      <span aria-hidden="true">&times;</span>
    </button>
  `).join('');

  listEl.querySelectorAll('[data-remove-practice-date]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-remove-practice-date');
      doctorPracticeDates = doctorPracticeDates.filter((d) => d !== target);
      renderDoctorPracticeDates();
    });
  });
}

async function loadDoctorPracticeSchedule() {
  const listEl = document.getElementById('docPracticeDatesList');
  if (!listEl) return;

  try {
    const res = await api.request('/dokter/jadwal', { priority: 'low' });
    const dates = Array.isArray(res.data?.available_dates) ? res.data.available_dates : [];
    doctorPracticeDates = dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d)));
    renderDoctorPracticeDates();
  } catch (err) {
    api.showAlert('docScheduleAlert', err.message || 'Gagal memuat jadwal praktik Anda.', 'danger');
  }
}

function initDoctorPracticeSchedule() {
  const todayStr = getLocalIsoDate(0);
  const rangeStartEl = document.getElementById('docPracticeRangeStart');
  const rangeEndEl = document.getElementById('docPracticeRangeEnd');
  const includeSundayEl = document.getElementById('docPracticeIncludeSunday');
  const addRangeBtn = document.getElementById('docAddRangeBtn');
  const singleDateEl = document.getElementById('docPracticeSingleDate');
  const addSingleBtn = document.getElementById('docAddSingleDateBtn');
  const clearBtn = document.getElementById('docClearPracticeDatesBtn');
  const reloadBtn = document.getElementById('docReloadPracticeScheduleBtn');
  const saveBtn = document.getElementById('docSavePracticeScheduleBtn');
  const shortcutBtn = document.getElementById('openPracticeScheduleBtn');

  [rangeStartEl, rangeEndEl, singleDateEl].forEach((input) => {
    if (input) input.min = todayStr;
  });

  if (shortcutBtn) {
    shortcutBtn.addEventListener('click', () => {
      switchDoctorTab('practiceSchedule');
      loadDoctorPracticeSchedule();
    });
  }

  if (addRangeBtn && rangeStartEl && rangeEndEl) {
    addRangeBtn.addEventListener('click', () => {
      api.hideAlert('docScheduleAlert');
      const startVal = (rangeStartEl.value || '').trim();
      const endVal = (rangeEndEl.value || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startVal) || !/^\d{4}-\d{2}-\d{2}$/.test(endVal)) {
        api.showAlert('docScheduleAlert', 'Pilih tanggal mulai dan tanggal selesai terlebih dahulu.', 'danger');
        return;
      }
      if (startVal > endVal) {
        api.showAlert('docScheduleAlert', 'Tanggal selesai harus sama atau lebih lambat dari tanggal mulai.', 'danger');
        return;
      }

      const [sy, sm, sd] = startVal.split('-').map(Number);
      const [ey, em, ed] = endVal.split('-').map(Number);
      const cursor = new Date(sy, sm - 1, sd);
      const endObj = new Date(ey, em - 1, ed);
      const diffDays = Math.round((endObj - cursor) / 86400000);
      if (diffDays > 90) {
        api.showAlert('docScheduleAlert', 'Rentang sekali tambah maksimal 90 hari.', 'danger');
        return;
      }

      const includeSunday = Boolean(includeSundayEl?.checked);
      const added = [];
      while (cursor <= endObj) {
        if (includeSunday || cursor.getDay() !== 0) {
          const y = cursor.getFullYear();
          const m = String(cursor.getMonth() + 1).padStart(2, '0');
          const d = String(cursor.getDate()).padStart(2, '0');
          const iso = `${y}-${m}-${d}`;
          if (iso >= todayStr) {
            added.push(iso);
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      if (added.length === 0) {
        api.showAlert('docScheduleAlert', 'Tidak ada tanggal valid dalam rentang yang dipilih.', 'danger');
        return;
      }

      doctorPracticeDates = [...new Set([...doctorPracticeDates, ...added])].sort();
      renderDoctorPracticeDates();
      api.showAlert('docScheduleAlert', `${added.length} tanggal ditambahkan ke daftar. Klik Simpan Jadwal Praktik untuk menerapkan.`, 'info');
    });
  }

  if (addSingleBtn && singleDateEl) {
    addSingleBtn.addEventListener('click', () => {
      api.hideAlert('docScheduleAlert');
      const val = (singleDateEl.value || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        api.showAlert('docScheduleAlert', 'Pilih tanggal praktik yang valid.', 'danger');
        return;
      }
      if (val < todayStr) {
        api.showAlert('docScheduleAlert', 'Tanggal praktik tidak boleh di masa lalu.', 'danger');
        return;
      }
      if (!doctorPracticeDates.includes(val)) {
        doctorPracticeDates = [...doctorPracticeDates, val].sort();
        renderDoctorPracticeDates();
      }
      singleDateEl.value = '';
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      api.hideAlert('docScheduleAlert');
      doctorPracticeDates = [];
      renderDoctorPracticeDates();
    });
  }

  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      api.hideAlert('docScheduleAlert');
      loadDoctorPracticeSchedule();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      api.hideAlert('docScheduleAlert');
      const origText = saveBtn.textContent;
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan…';
        const res = await api.request('/dokter/jadwal', {
          method: 'PATCH',
          body: JSON.stringify({ available_dates: doctorPracticeDates })
        });
        doctorPracticeDates = Array.isArray(res.data?.available_dates) ? res.data.available_dates : doctorPracticeDates;
        renderDoctorPracticeDates();
        api.showAlert('docScheduleAlert', res.message || 'Jadwal praktik berhasil disimpan.', 'success');
        updateDoctorSyncTime();
      } catch (err) {
        api.showAlert('docScheduleAlert', err.message || 'Gagal menyimpan jadwal praktik.', 'danger');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = origText;
      }
    });
  }
}
