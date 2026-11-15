let adminMasterPoli = [];
let adminDoctorsCatalog = [];
let adminAppointmentsCache = [];
let adminAppointmentMeta = null;
let adminRequestsCache = [];
let adminSlotRequestsCache = [];
let activeAdminRequestId = null;
let selectedAdminAppointmentId = null;
let activeAdminTabName = 'appointments';
let masterDataCache = [];

function getAdminEl(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function getAdminAlertId(...ids) {
  for (const id of ids) {
    if (document.getElementById(id)) return id;
  }
  return ids[0];
}

function updateStaffSyncTime() {
  const label = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';
  const sidebarEl = document.getElementById('staffSidebarSyncTime');
  const railEl = document.getElementById('staffLastUpdated');
  if (sidebarEl) sidebarEl.textContent = label;
  if (railEl) railEl.textContent = label;
}

function formatCompactDateAdmin(dateStr) {
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

function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function handleAdminLogout(e) {
  if (e) e.preventDefault();
  if (confirm('Keluar dari panel admin sekarang?')) {
    api.logout();
  }
}

function initStaffDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('staffDrawerOverlay');
  const panel = document.getElementById('staffDrawerPanel');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const expandBtn = document.getElementById('drawerQuickFilterExpandBtn');
  const subList = document.getElementById('drawerQuickFilterSub');
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

  window.closeAdminStaffDrawer = closeDrawer;

  menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDrawer();
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

  document.querySelectorAll('[data-drawer-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-drawer-tab');
      if (target === 'appointments') {
        switchAdminTab('appointments');
        loadAppointments();
      } else if (target === 'requests') {
        switchAdminTab('requests');
        loadCancellationRequests();
      } else if (target === 'slot-requests') {
        switchAdminTab('slotRequests');
        loadAdminSlotRequests();
      }
      closeDrawer();
    });
  });

  if (primaryCta) {
    primaryCta.addEventListener('click', () => {
      if (typeof switchAdminTab === 'function' && document.getElementById('adminTabAppointments')) {
        switchAdminTab('appointments');
      }
      closeDrawer();
    });
  }
}

function getStaffSearchQuery() {
  return (document.getElementById('staffSearchInput')?.value || '').trim().toLowerCase();
}

function applyAdminSearchForCurrentPage() {
  if (document.getElementById('adminAppointmentTableBody')) {
    if (activeAdminTabName === 'requests') {
      renderFilteredAdminRequests();
    } else if (activeAdminTabName === 'slotRequests') {
      renderFilteredAdminSlotRequests();
    } else {
      renderFilteredAppointments();
    }
    return;
  }
  if (document.getElementById('poliTableBody')) {
    renderFilteredMasterData();
  }
}

function initStaffSearch() {
  const form = document.getElementById('staffSearchForm');
  const input = document.getElementById('staffSearchInput');
  const clearBtn = document.getElementById('staffSearchClearBtn');
  if (!input) return;

  const syncClearVisibility = () => {
    if (clearBtn) {
      clearBtn.hidden = input.value.trim() === '';
    }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      applyAdminSearchForCurrentPage();
    });
  }

  input.addEventListener('input', () => {
    syncClearVisibility();
    applyAdminSearchForCurrentPage();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      syncClearVisibility();
      applyAdminSearchForCurrentPage();
      input.focus();
    });
  }

  syncClearVisibility();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!api.requireAuth('admin')) return;

  const currentUser = api.getUser();
  if (currentUser) {
    ['navAdminName', 'navAdminNameTop', 'drawerAdminName'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = currentUser.name;
    });
  }

  ['logoutBtn', 'logoutBtnTop', 'drawerLogoutBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handleAdminLogout);
  });

  initStaffDrawer();
  initStaffSearch();

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllAdminModals();
      if (typeof window.closeAdminStaffDrawer === 'function') {
        window.closeAdminStaffDrawer();
      }
    }
  });

  initAdminBackdropAndCloseButtons();

  const notifBtn = document.getElementById('topbarNotifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      switchAdminTab('requests');
      loadCancellationRequests();
    });
  }

  const openPendingInboxBtn = document.getElementById('openPendingInboxBtn');
  if (openPendingInboxBtn) {
    openPendingInboxBtn.addEventListener('click', () => {
      switchAdminTab('requests');
      loadCancellationRequests();
    });
  }

  if (document.getElementById('adminAppointmentTableBody')) {
    initAppointmentManagement();
  }

  if (
    document.getElementById('adminTabBtnRequests') ||
    document.getElementById('adminRequestTableBody') ||
    document.getElementById('adminRequestsTableBody') ||
    document.getElementById('adminPendingReqBadge')
  ) {
    initAdminCancellationInbox();
  }

  if (
    document.getElementById('adminTabBtnSlotRequests') ||
    document.getElementById('adminSlotRequestsTableBody')
  ) {
    initAdminSlotRequests();
  }

  if (document.getElementById('poliForm') || document.getElementById('doctorForm')) {
    initMasterData();
  }
});

function closeAllAdminModals() {
  closeAdminApproveModal();
  closeAdminRescheduleModal();
  closeAdminRejectModal();
  closeAdminSlotApproveModal();
  closeAdminSlotRejectModal();
  closeAuditLogModal();
  closeDoctorAccountModal();
}

function initAdminBackdropAndCloseButtons() {
  const modalIds = [
    'adminApproveModal',
    'adminRescheduleModal',
    'adminRejectModal',
    'adminSlotApproveModal',
    'adminSlotRejectModal',
    'adminAuditLogModal',
    'auditLogModal',
    'doctorAccountModal'
  ];

  modalIds.forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideAdminModal(modal);
      }
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      hideAdminModal(document.getElementById(targetId));
    });
  });
}

function showAdminModal(modal, focusEl = null) {
  if (!modal) return;
  modal.hidden = false;
  modal.style.display = 'flex';
  if (focusEl) {
    setTimeout(() => focusEl.focus(), 50);
  }
}

function hideAdminModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  modal.style.display = 'none';
}

function populateAppointmentOrganizerOptions() {
  const poliSelect = document.getElementById('filterPoli');
  const docSelect = document.getElementById('filterDoctor');
  if (!poliSelect && !docSelect) return;

  const poliMap = new Map();
  const docMap = new Map();

  (adminMasterPoli || []).forEach((p) => {
    if (p?.id) poliMap.set(String(p.id), p.name || `Poli #${p.id}`);
    (p.doctors || []).forEach((d) => {
      if (d?.id) {
        docMap.set(String(d.id), {
          id: String(d.id),
          name: d.name || `Dokter #${d.id}`,
          poliId: String(p.id || '')
        });
      }
    });
  });

  (adminAppointmentsCache || []).forEach((a) => {
    const pId = a.polyclinic_id || a.polyclinic?.id;
    const pName = a.polyclinic?.name;
    if (pId && pName && !poliMap.has(String(pId))) {
      poliMap.set(String(pId), pName);
    }
    const dId = a.doctor_id || a.doctor?.id;
    const dName = a.doctor?.name;
    if (dId && dName && !docMap.has(String(dId))) {
      docMap.set(String(dId), {
        id: String(dId),
        name: dName,
        poliId: String(pId || '')
      });
    }
  });

  if (poliSelect) {
    const currentPoli = poliSelect.value;
    const options = Array.from(poliMap.entries()).sort((a, b) => a[1].localeCompare(b[1], 'id'));
    poliSelect.innerHTML = '<option value="">Semua Poli</option>' +
      options.map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join('');
    if (currentPoli && poliMap.has(currentPoli)) poliSelect.value = currentPoli;
  }

  if (docSelect) {
    const selectedPoli = poliSelect?.value || '';
    const currentDoc = docSelect.value;
    const docs = Array.from(docMap.values())
      .filter((d) => !selectedPoli || d.poliId === selectedPoli)
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
    docSelect.innerHTML = '<option value="">Semua Dokter</option>' +
      docs.map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)}</option>`).join('');
    if (currentDoc && docs.some((d) => d.id === currentDoc)) {
      docSelect.value = currentDoc;
    }
  }
}

async function initAppointmentManagement() {
  const filterDate = document.getElementById('filterDate');
  const filterPoli = document.getElementById('filterPoli');
  const filterDoctor = document.getElementById('filterDoctor');
  const filterStatus = document.getElementById('filterStatus');
  const filterType = document.getElementById('filterType');
  const filterSort = document.getElementById('filterSort');
  const quickTodayBtn = document.getElementById('quickTodayBtn');
  const resetBtn = document.getElementById('resetAdminFiltersBtn');

  const urlParams = new URLSearchParams(window.location.search);
  if (filterDate && urlParams.get('date')) filterDate.value = urlParams.get('date');
  if (filterStatus && urlParams.get('status')) filterStatus.value = urlParams.get('status');
  if (filterType && urlParams.get('type')) filterType.value = urlParams.get('type');

  const syncUrlAndReload = () => {
    const nextParams = new URLSearchParams();
    if (filterDate?.value) nextParams.set('date', filterDate.value);
    if (filterType?.value) nextParams.set('type', filterType.value);
    if (filterStatus?.value) nextParams.set('status', filterStatus.value);
    const qs = nextParams.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    loadAppointments();
  };

  if (filterDate) filterDate.addEventListener('change', syncUrlAndReload);
  if (filterStatus) filterStatus.addEventListener('change', syncUrlAndReload);
  if (filterType) filterType.addEventListener('change', syncUrlAndReload);

  if (filterPoli) {
    filterPoli.addEventListener('change', () => {
      populateAppointmentOrganizerOptions();
      renderFilteredAppointments();
    });
  }
  if (filterDoctor) filterDoctor.addEventListener('change', renderFilteredAppointments);
  if (filterSort) filterSort.addEventListener('change', renderFilteredAppointments);

  const resetAllFilters = () => {
    if (filterDate) filterDate.value = '';
    if (filterPoli) filterPoli.value = '';
    if (filterDoctor) filterDoctor.value = '';
    if (filterType) filterType.value = '';
    if (filterStatus) filterStatus.value = '';
    if (filterSort) filterSort.value = 'date_desc';
    const searchInput = document.getElementById('staffSearchInput');
    const clearBtn = document.getElementById('staffSearchClearBtn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.hidden = true;
    document.querySelectorAll('[data-quick-filter]').forEach((el) => el.classList.remove('is-active'));
    populateAppointmentOrganizerOptions();
    syncUrlAndReload();
  };

  if (quickTodayBtn) {
    quickTodayBtn.addEventListener('click', () => {
      if (filterDate) filterDate.value = getTodayIsoDate();
      document.querySelectorAll('[data-quick-filter]').forEach((el) => {
        el.classList.toggle('is-active', el.getAttribute('data-quick-filter') === 'today');
      });
      syncUrlAndReload();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  document.querySelectorAll('[data-quick-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-quick-filter');
      document.querySelectorAll('[data-quick-filter]').forEach((el) => {
        el.classList.toggle('is-active', el.getAttribute('data-quick-filter') === preset);
      });

      if (preset === 'today') {
        switchAdminTab('appointments');
        if (filterDate) filterDate.value = getTodayIsoDate();
        if (filterStatus) filterStatus.value = '';
        syncUrlAndReload();
      } else if (preset === 'scheduled') {
        switchAdminTab('appointments');
        if (filterDate) filterDate.value = '';
        if (filterStatus) filterStatus.value = 'terjadwal';
        syncUrlAndReload();
      } else if (preset === 'all') {
        switchAdminTab('appointments');
        resetAllFilters();
      } else if (preset === 'overdue') {
        switchAdminTab('requests');
        const reqStatus = document.getElementById('reqFilterStatus');
        const reqOverdue = document.getElementById('reqFilterOverdue');
        if (reqStatus) reqStatus.value = 'diajukan';
        if (reqOverdue) {
          if (reqOverdue.type === 'checkbox') reqOverdue.checked = true;
          else reqOverdue.value = '1';
        }
        loadCancellationRequests();
      }

      if (typeof window.closeAdminStaffDrawer === 'function') {
        window.closeAdminStaffDrawer();
      }
    });
  });

  await loadAppointments();

  const scheduleControlForm = document.getElementById('scheduleControlForm');
  if (scheduleControlForm) {
    initScheduleControlForm();
  }
}

function renderAdminFocusCard(items) {
  const focusBody = document.getElementById('adminFocusBody');
  const focusBadge = document.getElementById('adminFocusBadge');
  if (!focusBody) return;

  if (!items || items.length === 0) {
    if (focusBadge) {
      focusBadge.className = 'badge badge-neutral';
      focusBadge.textContent = 'Kosong';
    }
    focusBody.innerHTML = '<p class="text-muted text-sm">Belum ada kunjungan sesuai filter saat ini.</p>';
    return;
  }

  let selected = items.find((item) => item.id === selectedAdminAppointmentId);
  if (!selected) {
    selected = items.find((item) => item.open_cancellation_request || item.open_request) || items[0];
    selectedAdminAppointmentId = selected.id;
  }

  const rmId = selected.user?.medical_record_id || `RM-${String(selected.user_id || selected.user?.id || 0).padStart(4, '0')}`;
  const patientName = selected.user?.initial_name || selected.user?.name || '-';
  const poliName = selected.polyclinic?.name || '-';
  const docName = selected.doctor?.name || '-';
  const dateText = `${formatCompactDateAdmin(selected.appointment_date)}, ${selected.appointment_time || '09:00'} WIB`;
  const noteText = selected.complaint || selected.doctor_notes || 'Belum ada keluhan atau catatan.';

  if (focusBadge) {
    focusBadge.className = `badge badge-${escapeHtml(selected.status || 'terjadwal')}`;
    focusBadge.textContent = getStatusLabel(selected.status);
  }

  focusBody.innerHTML = `
    <div class="staff-focus-meta">
      <div class="staff-focus-kv">
        <span class="staff-focus-label">Pasien</span>
        <strong>${escapeHtml(rmId)} (${escapeHtml(patientName)})</strong>
      </div>
      <div class="staff-focus-kv">
        <span class="staff-focus-label">Jadwal</span>
        <span>${escapeHtml(dateText)}</span>
      </div>
      <div class="staff-focus-kv">
        <span class="staff-focus-label">Poli &amp; Dokter</span>
        <span>${escapeHtml(poliName)} / ${escapeHtml(docName)}</span>
      </div>
    </div>
    <div class="staff-focus-note">
      <span class="staff-focus-label">Keluhan / Catatan</span>
      <p>${escapeHtml(noteText)}</p>
      <div class="staff-row-actions">
        <button type="button" class="btn btn-primary btn-sm btn-touch" onclick="prefillControlForAppointment(${selected.id})">Buat jadwal kontrol</button>
        <button type="button" class="btn btn-secondary btn-sm btn-touch" onclick="openAuditLogModal(${selected.id})">Riwayat Log</button>
      </div>
    </div>
  `;
}

function updateRightSummaryRail(filteredItems, totalCount) {
  const metaEl = document.getElementById('adminAppointmentMetaSummary');
  if (!metaEl) return;

  const hasClientFilter = Boolean(
    document.getElementById('filterPoli')?.value ||
    document.getElementById('filterDoctor')?.value ||
    getStaffSearchQuery()
  );

  const source = (!hasClientFilter && adminAppointmentMeta && typeof adminAppointmentMeta.total_count === 'number')
    ? {
        total: adminAppointmentMeta.total_count,
        scheduled: adminAppointmentMeta.scheduled_count ?? 0,
        completed: adminAppointmentMeta.completed_count ?? 0,
        cancelled: adminAppointmentMeta.cancelled_count ?? 0
      }
    : {
        total: filteredItems.length,
        scheduled: filteredItems.filter((a) => a.status === 'terjadwal').length,
        completed: filteredItems.filter((a) => a.status === 'selesai').length,
        cancelled: filteredItems.filter((a) => a.status === 'dibatalkan').length
      };

  const pendingReqCount = adminRequestsCache.filter((r) => r.status === 'diajukan').length;
  const pendingSlotCount = adminSlotRequestsCache.filter((r) => r.status === 'diajukan').length;

  metaEl.hidden = false;
  metaEl.innerHTML = `
    <div class="staff-rail-metric-row"><span class="portal-summary-label">${hasClientFilter ? 'Cocok filter' : 'Total kunjungan'}</span><strong class="portal-summary-value">${source.total}</strong></div>
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Terjadwal</span><strong class="portal-summary-value">${source.scheduled}</strong></div>
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Selesai</span><strong class="portal-summary-value">${source.completed}</strong></div>
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Dibatalkan</span><strong class="portal-summary-value">${source.cancelled}</strong></div>
    <div class="staff-rail-metric-row"><span class="portal-summary-label">Antrean dokter</span><strong class="portal-summary-value">${pendingReqCount + pendingSlotCount}</strong></div>
  `;
  void totalCount;
}

function renderFilteredAppointments() {
  const tableBody = document.getElementById('adminAppointmentTableBody');
  const cardsEl = document.getElementById('adminAppointmentCards');
  const resultInfo = document.getElementById('adminAppointmentsResultInfo');
  if (!tableBody) return;

  const filterPoliVal = document.getElementById('filterPoli')?.value || '';
  const filterDoctorVal = document.getElementById('filterDoctor')?.value || '';
  const sortVal = document.getElementById('filterSort')?.value || 'date_desc';
  const query = getStaffSearchQuery();

  let filtered = (adminAppointmentsCache || []).filter((a) => {
    if (filterPoliVal && String(a.polyclinic_id || a.polyclinic?.id || '') !== filterPoliVal) {
      return false;
    }
    if (filterDoctorVal && String(a.doctor_id || a.doctor?.id || '') !== filterDoctorVal) {
      return false;
    }
    if (query) {
      const rm = a.user?.medical_record_id || `RM-${String(a.user_id || a.user?.id || 0).padStart(4, '0')}`;
      const haystack = [
        rm,
        a.user?.initial_name,
        a.user?.name,
        a.polyclinic?.name,
        a.doctor?.name,
        a.complaint,
        a.doctor_notes,
        a.status,
        a.type
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  filtered = filtered.slice().sort((a, b) => {
    if (sortVal === 'date_asc') {
      const da = `${a.appointment_date || ''} ${a.appointment_time || ''}`;
      const db = `${b.appointment_date || ''} ${b.appointment_time || ''}`;
      return da.localeCompare(db);
    }
    if (sortVal === 'patient_asc') {
      const na = a.user?.initial_name || a.user?.name || '';
      const nb = b.user?.initial_name || b.user?.name || '';
      return na.localeCompare(nb, 'id');
    }
    if (sortVal === 'status_asc') {
      return (a.status || '').localeCompare(b.status || '', 'id');
    }
    const da = `${a.appointment_date || ''} ${a.appointment_time || ''}`;
    const db = `${b.appointment_date || ''} ${b.appointment_time || ''}`;
    return db.localeCompare(da);
  });

  if (resultInfo) {
    resultInfo.textContent = `Menampilkan ${filtered.length} dari ${adminAppointmentsCache.length} janji`;
  }

  updateRightSummaryRail(filtered, adminAppointmentsCache.length);
  renderAdminFocusCard(filtered);

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-muted text-center">Belum ada janji yang cocok dengan filter atau pencarian ini.</td></tr>';
    if (cardsEl) {
      cardsEl.innerHTML = '<div class="portal-state-box"><p class="text-muted">Belum ada janji yang cocok dengan filter atau pencarian ini.</p></div>';
    }
    return;
  }

  tableBody.innerHTML = filtered.map((a) => {
    const openReq = a.open_cancellation_request || a.open_request || null;
    const openReqBadge = openReq
      ? `<div class="mt-1"><span class="badge badge-diajukan">Pengajuan batal</span>${openReq.is_overdue ? ' <span class="badge badge-overdue-sla">Lewat SLA</span>' : ''}</div>`
      : '';
    const patientRm = a.user?.medical_record_id || `RM-${String(a.user_id || a.user?.id || 0).padStart(4, '0')}`;
    const patientInitial = a.user?.initial_name || a.user?.name || '-';
    const isSelected = Number(a.id) === Number(selectedAdminAppointmentId);

    return `
      <tr class="${isSelected ? 'is-selected-row' : ''}" data-appt-row-id="${a.id}" tabindex="0">
        <td>
          <strong>${escapeHtml(patientRm)}</strong>
          <div class="text-muted text-sm">${escapeHtml(patientInitial)}</div>
        </td>
        <td>
          <strong>${escapeHtml(a.polyclinic?.name || '-')}</strong>
          <div class="text-muted text-sm">${escapeHtml(a.doctor?.name || '-')}</div>
        </td>
        <td>
          <div class="staff-date-compact">
            <strong>${escapeHtml(formatCompactDateAdmin(a.appointment_date))}</strong>
            <span class="text-muted text-sm">${escapeHtml(a.appointment_time || '09:00')} WIB</span>
          </div>
        </td>
        <td><span class="badge badge-${escapeHtml(a.type)}">${a.type === 'kontrol_rutin' ? 'Kontrol rutin' : 'Janji baru'}</span></td>
        <td>
          <span class="badge badge-${escapeHtml(a.status)}">${escapeHtml(getStatusLabel(a.status))}</span>
          ${openReqBadge}
        </td>
        <td>
          ${a.complaint ? `<div class="text-sm"><strong>Keluhan:</strong> ${escapeHtml(a.complaint)}</div>` : ''}
          ${a.doctor_notes ? `<div class="text-sm mt-1"><strong>Catatan:</strong> ${escapeHtml(a.doctor_notes)}</div>` : ''}
          ${!a.complaint && !a.doctor_notes ? '<span class="text-muted">-</span>' : ''}
        </td>
        <td>
          <div class="staff-row-actions">
            <button type="button" class="btn btn-secondary btn-sm btn-touch" onclick="event.stopPropagation(); prefillControlForAppointment(${a.id})">Kontrol</button>
            <button type="button" class="btn btn-ghost btn-sm btn-touch" onclick="event.stopPropagation(); openAuditLogModal(${a.id})">Log</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('tr[data-appt-row-id]').forEach((row) => {
    const selectRow = () => {
      selectedAdminAppointmentId = Number(row.getAttribute('data-appt-row-id'));
      tableBody.querySelectorAll('tr[data-appt-row-id]').forEach((tr) => {
        tr.classList.toggle('is-selected-row', Number(tr.getAttribute('data-appt-row-id')) === selectedAdminAppointmentId);
      });
      renderAdminFocusCard(filtered);
    };
    row.addEventListener('click', selectRow);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectRow();
      }
    });
  });

  if (cardsEl) {
    cardsEl.innerHTML = filtered.map((a) => {
      const openReq = a.open_cancellation_request || a.open_request || null;
      const openReqBadge = openReq
        ? `<span class="badge badge-diajukan">Pengajuan batal</span>${openReq.is_overdue ? '<span class="badge badge-overdue-sla">Lewat SLA</span>' : ''}`
        : '';
      const patientRm = a.user?.medical_record_id || `RM-${String(a.user_id || a.user?.id || 0).padStart(4, '0')}`;
      const patientInitial = a.user?.initial_name || a.user?.name || '-';

      return `
        <article class="mobile-data-card">
          <div class="mobile-data-card__head">
            <div>
              <strong>${escapeHtml(patientRm)}</strong>
              <div class="text-muted text-sm">${escapeHtml(patientInitial)}</div>
            </div>
            <span class="badge badge-${escapeHtml(a.status)}">${escapeHtml(getStatusLabel(a.status))}</span>
          </div>
          <div class="mobile-data-card__meta">
            <div><strong>Poli &amp; Dokter:</strong> ${escapeHtml(a.polyclinic?.name || '-')} (${escapeHtml(a.doctor?.name || '-')})</div>
            <div><strong>Jadwal:</strong> ${escapeHtml(formatCompactDateAdmin(a.appointment_date))}, ${escapeHtml(a.appointment_time || '09:00')} WIB</div>
            <div class="mobile-data-card__badges">
              <span class="badge badge-${escapeHtml(a.type)}">${a.type === 'kontrol_rutin' ? 'Kontrol rutin' : 'Janji baru'}</span>
              ${openReqBadge}
            </div>
            ${a.complaint ? `<div><strong>Keluhan:</strong> ${escapeHtml(a.complaint)}</div>` : ''}
            ${a.doctor_notes ? `<div><strong>Catatan:</strong> ${escapeHtml(a.doctor_notes)}</div>` : ''}
          </div>
          <div class="mobile-data-card__actions">
            <button type="button" class="btn btn-secondary btn-sm btn-touch" onclick="prefillControlForAppointment(${a.id})">Buat jadwal kontrol</button>
            <button type="button" class="btn btn-ghost btn-sm btn-touch" onclick="openAuditLogModal(${a.id})">Riwayat Log</button>
          </div>
        </article>
      `;
    }).join('');
  }
}

async function loadAppointments() {
  const tableBody = document.getElementById('adminAppointmentTableBody');
  const cardsEl = document.getElementById('adminAppointmentCards');
  const metaEl = document.getElementById('adminAppointmentMetaSummary');
  if (!tableBody) return;

  const tableWrap = tableBody.closest('.table-responsive');
  if (tableWrap && cardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }

  const date = document.getElementById('filterDate')?.value || '';
  const status = document.getElementById('filterStatus')?.value || '';
  const type = document.getElementById('filterType')?.value || '';

  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (status) params.append('status', status);
  if (type) params.append('type', type);

  try {
    const [res] = await Promise.all([
      api.request(`/admin/janji-temu?${params.toString()}`, { priority: 'high' }),
      adminMasterPoli.length === 0
        ? api.request('/master-poli', { priority: 'low' })
            .then((poliRes) => {
              adminMasterPoli = poliRes.data || [];
            })
            .catch(() => {})
        : Promise.resolve()
    ]);

    adminAppointmentsCache = res.data || [];
    adminAppointmentMeta = res.meta || null;

    populateAppointmentOrganizerOptions();
    renderFilteredAppointments();
    updateStaffSyncTime();
  } catch {
    if (metaEl) {
      metaEl.hidden = true;
      metaEl.textContent = '';
    }
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--color-danger-ink);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
    if (cardsEl) {
      cardsEl.innerHTML = '<div class="portal-state-box portal-state-box--error"><p>Gagal memuat data. Coba muat ulang halaman.</p></div>';
    }
  }
}

function showAdminWhatsAppFeedback(res, targetAlertId = 'adminListAlert') {
  const alertEl = document.getElementById(targetAlertId) || document.getElementById('adminListAlert');
  if (!alertEl) return;
  const wa = res?.whatsapp;
  const baseMsg = res?.message || 'Data janji temu berhasil diperbarui.';

  alertEl.className = 'alert alert-success';
  alertEl.setAttribute('role', 'status');
  alertEl.setAttribute('aria-live', 'polite');

  if (wa && wa.whatsapp_url) {
    const gatewayStatus = wa.sent
      ? 'Notifikasi WhatsApp otomatis telah dikirim ke pasien.'
      : 'Kirim pemberitahuan perubahan jadwal ke WhatsApp pasien:';
    alertEl.innerHTML = `
      <div class="flex-between" style="flex-wrap: wrap;">
        <span>${escapeHtml(baseMsg)}. ${escapeHtml(gatewayStatus)}</span>
        <a href="${escapeHtml(wa.whatsapp_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-touch">
          Kirim via WhatsApp
        </a>
      </div>
    `;
  } else {
    alertEl.textContent = baseMsg;
  }

  alertEl.style.display = 'block';
}

function prefillControlForAppointment(id) {
  const item = adminAppointmentsCache.find(x => x.id === id);
  if (!item) return;

  const patientSelect = document.getElementById('controlPatientId');
  const poliSelect = document.getElementById('controlPoliId');
  const doctorSelect = document.getElementById('controlDoctorId');
  const dateInput = document.getElementById('controlDate');

  if (patientSelect && item.user_id) {
    patientSelect.value = String(item.user_id);
  }
  if (poliSelect && item.polyclinic_id) {
    poliSelect.value = String(item.polyclinic_id);
    poliSelect.dispatchEvent(new Event('change'));
  }
  if (doctorSelect && item.doctor_id) {
    doctorSelect.value = String(item.doctor_id);
  }

  const section = document.getElementById('controlFormSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (dateInput) {
    setTimeout(() => dateInput.focus(), 150);
  }
}

window.prefillControlForAppointment = prefillControlForAppointment;

async function initScheduleControlForm() {
  try {
    const [patientRes, poliRes] = await Promise.all([
      api.request('/admin/pasien', { priority: 'low' }),
      api.request('/master-poli', { priority: 'low' })
    ]);
    const patientSelect = document.getElementById('controlPatientId');
    if (patientSelect) {
      patientSelect.innerHTML = '<option value="">Pilih pasien…</option>' +
        (patientRes.data || []).map(p => {
          const rmPrefix = p.medical_record_id ? `${p.medical_record_id} - ` : '';
          const displayName = p.initial_name || p.name || 'Pasien';
          const suffix = p.email ? ` (${p.email})` : '';
          return `<option value="${p.id}">${escapeHtml(rmPrefix + displayName + suffix)}</option>`;
        }).join('');
    }

    adminMasterPoli = poliRes.data || [];
    populateRequestDoctorFilter(adminMasterPoli);

    const poliSelect = document.getElementById('controlPoliId');
    const doctorSelect = document.getElementById('controlDoctorId');

    if (poliSelect && doctorSelect) {
      poliSelect.innerHTML = '<option value="">Pilih poliklinik…</option>' +
        adminMasterPoli.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

      poliSelect.addEventListener('change', () => {
        const pId = parseInt(poliSelect.value, 10);
        doctorSelect.innerHTML = '<option value="">Pilih dokter…</option>';
        if (!pId) {
          doctorSelect.disabled = true;
          return;
        }
        const pObj = adminMasterPoli.find(x => x.id === pId);
        const docs = pObj ? (pObj.doctors || []).filter(d => d.is_active) : [];
        docs.forEach(d => {
          doctorSelect.innerHTML += `<option value="${d.id}">${escapeHtml(d.name)}</option>`;
        });
        doctorSelect.disabled = false;
      });
    }

    const dateInput = document.getElementById('controlDate');
    if (dateInput) {
      dateInput.min = getLocalIsoDateAdmin(0);
    }

    const form = document.getElementById('scheduleControlForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('controlAlert');

      const submitBtn = form.querySelector('button[type="submit"]');
      const user_id = patientSelect.value;
      const polyclinic_id = poliSelect.value;
      const doctor_id = doctorSelect.value;
      const appointment_date = dateInput.value;
      const appointment_time = document.getElementById('controlTime')?.value || '09:00';
      const doctor_notes = document.getElementById('controlNotes').value.trim();

      if (!user_id || !polyclinic_id || !doctor_id || !appointment_date) {
        api.showAlert('controlAlert', 'Pilih pasien, poliklinik, dokter, dan tanggal kontrol terlebih dahulu.', 'danger');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';

        await api.request('/admin/jadwal-kontrol', {
          method: 'POST',
          body: JSON.stringify({
            user_id: parseInt(user_id, 10),
            polyclinic_id: parseInt(polyclinic_id, 10),
            doctor_id: parseInt(doctor_id, 10),
            appointment_date,
            appointment_time,
            doctor_notes
          })
        });

        api.showAlert('controlAlert', 'Jadwal kontrol rutin berhasil dibuat.', 'success');
        form.reset();
        doctorSelect.innerHTML = '<option value="">Pilih poliklinik terlebih dahulu…</option>';
        doctorSelect.disabled = true;
        await loadAppointments();
      } catch (err) {
        api.showAlert('controlAlert', 'Gagal membuat jadwal kontrol: ' + err.message, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Buat jadwal kontrol';
      }
    });

  } catch {
    api.showAlert('controlAlert', 'Gagal memuat data formulir kontrol. Coba muat ulang halaman.', 'danger');
  }
}

/* Inbox Pengajuan Pembatalan Dokter & Tab Switching */
async function initAdminCancellationInbox() {
  const tabApptsBtn = document.getElementById('adminTabBtnAppointments');
  const tabReqsBtn = document.getElementById('adminTabBtnRequests');

  if (tabApptsBtn) {
    tabApptsBtn.addEventListener('click', () => switchAdminTab('appointments'));
  }
  if (tabReqsBtn) {
    tabReqsBtn.addEventListener('click', () => {
      switchAdminTab('requests');
      loadCancellationRequests();
    });
  }

  document.querySelectorAll('a[href="#controlFormSection"]').forEach((link) => {
    link.addEventListener('click', () => {
      switchAdminTab('appointments');
    });
  });

  const reqFilterStatus = document.getElementById('reqFilterStatus');
  const reqFilterDoctor = document.getElementById('reqFilterDoctor');
  const reqFilterOverdue = document.getElementById('reqFilterOverdue');
  const refreshReqsBtn = getAdminEl('reqRefreshBtn', 'refreshAdminRequestsBtn');

  if (reqFilterStatus && !reqFilterStatus.value && reqFilterStatus.querySelector('option[value="diajukan"]')) {
    reqFilterStatus.value = 'diajukan';
  }

  if (reqFilterStatus) reqFilterStatus.addEventListener('change', loadCancellationRequests);
  if (reqFilterDoctor) reqFilterDoctor.addEventListener('change', loadCancellationRequests);
  if (reqFilterOverdue) reqFilterOverdue.addEventListener('change', loadCancellationRequests);
  if (refreshReqsBtn) refreshReqsBtn.addEventListener('click', loadCancellationRequests);

  initAdminDecisionModals();

  if (reqFilterDoctor && adminMasterPoli.length === 0) {
    api.request('/master-poli', { priority: 'low' })
      .then((res) => {
        adminMasterPoli = res.data || [];
        populateRequestDoctorFilter(adminMasterPoli);
      })
      .catch(() => {});
  } else if (adminMasterPoli.length > 0) {
    populateRequestDoctorFilter(adminMasterPoli);
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'pengajuan' || window.location.hash === '#pengajuan') {
    switchAdminTab('requests');
  } else if (urlParams.get('tab') === 'slot-tambahan' || window.location.hash === '#slot-tambahan') {
    switchAdminTab('slotRequests');
  }

  await loadCancellationRequests();
}

function getAdminTabPanel(btn, fallbackIds) {
  if (btn) {
    const controlledId = btn.getAttribute('aria-controls');
    if (controlledId) {
      const panel = document.getElementById(controlledId);
      if (panel) return panel;
    }
  }
  for (const id of fallbackIds) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function switchAdminTab(tabName) {
  activeAdminTabName = tabName;
  const tabApptsBtn = document.getElementById('adminTabBtnAppointments');
  const tabReqsBtn = document.getElementById('adminTabBtnRequests');
  const tabSlotsBtn = document.getElementById('adminTabBtnSlotRequests');
  const apptsPanel = getAdminTabPanel(tabApptsBtn, ['adminTabAppointments', 'adminViewAppointments', 'adminAppointmentsView']);
  const reqsPanel = getAdminTabPanel(tabReqsBtn, ['adminTabRequests', 'adminViewRequests', 'adminRequestsView']);
  const slotsPanel = getAdminTabPanel(tabSlotsBtn, ['adminTabSlotRequests']);

  const showAppointments = tabName === 'appointments';
  const showRequests = tabName === 'requests';
  const showSlots = tabName === 'slotRequests';

  if (tabApptsBtn) {
    tabApptsBtn.classList.toggle('is-active', showAppointments);
    if (!tabApptsBtn.classList.contains('portal-tab-btn')) {
      tabApptsBtn.classList.toggle('btn-primary', showAppointments);
      tabApptsBtn.classList.toggle('btn-secondary', !showAppointments);
    }
    tabApptsBtn.setAttribute('aria-selected', showAppointments ? 'true' : 'false');
  }
  if (tabReqsBtn) {
    tabReqsBtn.classList.toggle('is-active', showRequests);
    if (!tabReqsBtn.classList.contains('portal-tab-btn')) {
      tabReqsBtn.classList.toggle('btn-primary', showRequests);
      tabReqsBtn.classList.toggle('btn-secondary', !showRequests);
    }
    tabReqsBtn.setAttribute('aria-selected', showRequests ? 'true' : 'false');
  }
  if (tabSlotsBtn) {
    tabSlotsBtn.classList.toggle('is-active', showSlots);
    if (!tabSlotsBtn.classList.contains('portal-tab-btn')) {
      tabSlotsBtn.classList.toggle('btn-primary', showSlots);
      tabSlotsBtn.classList.toggle('btn-secondary', !showSlots);
    }
    tabSlotsBtn.setAttribute('aria-selected', showSlots ? 'true' : 'false');
  }

  document.querySelectorAll('[data-drawer-tab]').forEach((btn) => {
    const target = btn.getAttribute('data-drawer-tab');
    const isMatch = (target === 'appointments' && showAppointments) ||
      (target === 'requests' && showRequests) ||
      (target === 'slot-requests' && showSlots);
    btn.classList.toggle('is-active', isMatch);
  });

  if (apptsPanel) {
    apptsPanel.hidden = !showAppointments;
    apptsPanel.style.display = showAppointments ? '' : 'none';
  }
  if (reqsPanel) {
    reqsPanel.hidden = !showRequests;
    reqsPanel.style.display = showRequests ? '' : 'none';
  }
  if (slotsPanel) {
    slotsPanel.hidden = !showSlots;
    slotsPanel.style.display = showSlots ? '' : 'none';
  }

  if (getStaffSearchQuery()) {
    applyAdminSearchForCurrentPage();
  }
}

function renderAdminPendingPreview() {
  const previewEl = document.getElementById('adminPendingPreviewList');
  if (!previewEl) return;

  const openCancelItems = (adminRequestsCache || [])
    .filter((r) => r.status === 'diajukan')
    .map((r) => ({
      kind: 'cancel',
      doctorName: r.doctor?.name || r.appointment?.doctor?.name || '-',
      poliName: r.appointment?.polyclinic?.name || r.doctor?.polyclinic?.name || '-',
      dateLabel: r.appointment?.appointment_date ? formatCompactDateAdmin(r.appointment.appointment_date) : '-',
      tag: isRequestOverdue(r) ? 'Lewat SLA' : 'Batal',
      tagClass: isRequestOverdue(r) ? 'badge-overdue-sla' : 'badge-diajukan'
    }));

  const openSlotItems = (adminSlotRequestsCache || [])
    .filter((s) => s.status === 'diajukan')
    .map((s) => ({
      kind: 'slot',
      doctorName: s.doctor?.name || `Dokter #${s.doctor_id}`,
      poliName: s.doctor?.polyclinic?.name || '-',
      dateLabel: s.schedule_date ? formatCompactDateAdmin(s.schedule_date) : '-',
      tag: `Slot +${s.quota || 0}`,
      tagClass: 'badge-kontrol_rutin'
    }));

  const combined = [...openCancelItems, ...openSlotItems].slice(0, 3);

  if (combined.length === 0) {
    previewEl.innerHTML = '<p class="text-muted text-sm">Tidak ada pengajuan dokter yang menunggu keputusan saat ini.</p>';
    return;
  }

  previewEl.innerHTML = combined.map((item) => `
    <div class="staff-queue-item">
      <div class="staff-queue-item__meta">
        <strong>${escapeHtml(item.doctorName)}</strong>
        <span class="text-muted text-xs">${escapeHtml(item.poliName)}, ${escapeHtml(item.dateLabel)}</span>
      </div>
      <div class="staff-queue-item__actions">
        <span class="badge ${item.tagClass}">${escapeHtml(item.tag)}</span>
        <button type="button" class="btn btn-secondary btn-sm btn-touch" data-preview-jump="${item.kind}">Tinjau</button>
      </div>
    </div>
  `).join('');

  previewEl.querySelectorAll('[data-preview-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-preview-jump');
      if (kind === 'slot') {
        switchAdminTab('slotRequests');
        loadAdminSlotRequests();
      } else {
        switchAdminTab('requests');
        loadCancellationRequests();
      }
    });
  });
}

function renderFilteredAdminRequests() {
  const stateEl = getAdminEl('adminRequestState', 'adminRequestsState');
  const tableBody = getAdminEl('adminRequestTableBody', 'adminRequestsTableBody');
  const cardsEl = getAdminEl('adminRequestCards', 'adminRequestsCards');
  const tableWrap = tableBody ? tableBody.closest('.table-responsive') : null;
  if (!tableBody && !cardsEl) return;

  const query = getStaffSearchQuery();
  const filtered = (adminRequestsCache || []).filter((r) => {
    if (!query) return true;
    const appt = r.appointment || {};
    const haystack = [
      r.doctor?.name,
      appt.doctor?.name,
      appt.polyclinic?.name,
      r.doctor?.polyclinic?.name,
      appt.user?.name,
      appt.patient?.name,
      r.reason,
      r.reason_category,
      r.status
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });

  if (filtered.length === 0) {
    const filterStatus = document.getElementById('reqFilterStatus')?.value ?? 'diajukan';
    const emptyMsg = query
      ? 'Tidak ada pengajuan dokter yang cocok dengan pencarian Anda.'
      : (filterStatus === 'diajukan'
          ? 'Tidak ada pengajuan yang menunggu.'
          : 'Belum ada pengajuan pembatalan pada filter ini.');
    setAdminRequestsState(stateEl, tableWrap, cardsEl, tableBody, 'empty', emptyMsg);
    return;
  }

  hideAdminRequestsState(stateEl, tableWrap, cardsEl);
  renderAdminRequests(filtered, tableBody, cardsEl);
}

function populateRequestDoctorFilter(polis) {
  const select = document.getElementById('reqFilterDoctor');
  if (!select) return;

  const currentVal = select.value;
  const doctors = [];
  (polis || []).forEach((p) => {
    (p.doctors || []).forEach((d) => {
      doctors.push({ id: d.id, name: d.name, poli: p.name });
    });
  });

  select.innerHTML = '<option value="">Semua Dokter</option>' +
    doctors.map(d => `<option value="${d.id}">${escapeHtml(d.name)} (${escapeHtml(d.poli)})</option>`).join('');

  if (currentVal) {
    select.value = currentVal;
  }
}

async function loadCancellationRequests() {
  const stateEl = getAdminEl('adminRequestState', 'adminRequestsState');
  const tableBody = getAdminEl('adminRequestTableBody', 'adminRequestsTableBody');
  const cardsEl = getAdminEl('adminRequestCards', 'adminRequestsCards');
  const tableWrap = tableBody ? tableBody.closest('.table-responsive') : null;

  if (tableWrap && cardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }

  const filterStatus = document.getElementById('reqFilterStatus')?.value ?? 'diajukan';
  const filterDoctor = document.getElementById('reqFilterDoctor')?.value || '';
  const overdueEl = document.getElementById('reqFilterOverdue');
  const filterOverdue = overdueEl
    ? (overdueEl.type === 'checkbox' ? (overdueEl.checked ? '1' : '') : overdueEl.value)
    : '';

  setAdminRequestsState(stateEl, tableWrap, cardsEl, tableBody, 'loading', 'Memuat daftar pengajuan pembatalan dokter...');

  const params = new URLSearchParams();
  if (filterStatus) params.set('status', filterStatus);
  if (filterDoctor) params.set('doctor_id', filterDoctor);
  if (filterOverdue) params.set('overdue', filterOverdue);

  try {
    const query = params.toString();
    const res = await api.request(`/admin/pengajuan-pembatalan${query ? `?${query}` : ''}`, { priority: 'high' });
    const rawItems = Array.isArray(res.data) ? res.data : [];

    adminRequestsCache = rawItems.slice().sort((a, b) => {
      const aTime = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

    if (res.meta && typeof res.meta.pending_count === 'number') {
      updateAdminPendingBadge(res.meta.pending_count);
    } else if (filterStatus === 'diajukan' && !filterDoctor && !filterOverdue) {
      updateAdminPendingBadge(adminRequestsCache.length);
    } else {
      refreshAdminPendingBadgeCount();
    }

    renderAdminPendingPreview();
    renderFilteredAdminRequests();
    if (document.getElementById('adminAppointmentTableBody')) {
      updateRightSummaryRail(adminAppointmentsCache, adminAppointmentsCache.length);
    }
    updateStaffSyncTime();
  } catch {
    setAdminRequestsState(stateEl, tableWrap, cardsEl, tableBody, 'error', 'Gagal memuat data. Coba lagi.', loadCancellationRequests);
  }
}

async function refreshAdminPendingBadgeCount() {
  const badge = document.getElementById('adminPendingReqBadge');
  if (!badge) return;
  try {
    const res = await api.request('/admin/pengajuan-pembatalan?status=diajukan', { priority: 'low' });
    const count = typeof res.meta?.pending_count === 'number'
      ? res.meta.pending_count
      : (Array.isArray(res.data) ? res.data.length : 0);
    updateAdminPendingBadge(count);
  } catch {
    // Keep existing badge count on transient error
  }
}

function syncAdminTopbarNotifCount() {
  const reqCount = Number(document.getElementById('adminPendingReqBadge')?.textContent || '0') || 0;
  const slotCount = Number(document.getElementById('adminPendingSlotBadge')?.textContent || '0') || 0;
  const total = reqCount + slotCount;
  const topbarBadge = document.getElementById('topbarNotifCount');
  if (topbarBadge) {
    topbarBadge.textContent = String(total);
    topbarBadge.hidden = total === 0;
    topbarBadge.style.display = total > 0 ? 'inline-flex' : 'none';
  }
}

function updateAdminPendingBadge(count) {
  const safeCount = Number.isFinite(count) ? count : 0;
  ['adminPendingReqBadge', 'drawerPendingReqBadge'].forEach((id) => {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.textContent = String(safeCount);
    badge.hidden = safeCount === 0;
    badge.style.display = safeCount > 0 ? 'inline-flex' : 'none';
  });
  syncAdminTopbarNotifCount();
}

function setAdminRequestsState(stateEl, tableWrap, cardsEl, tableBody, mode, message, retryFn = null) {
  if (cardsEl) {
    cardsEl.innerHTML = '';
    cardsEl.style.display = 'none';
  }

  if (stateEl) {
    if (tableWrap) tableWrap.style.display = 'none';
    stateEl.hidden = false;
    stateEl.style.display = 'block';

    if (mode === 'error') {
      stateEl.innerHTML = `
        <div class="portal-state-box portal-state-box--error">
          <p>${escapeHtml(message)}</p>
          <button type="button" class="btn btn-secondary btn-touch admin-req-retry-btn">Coba lagi</button>
        </div>
      `;
      const retryBtn = stateEl.querySelector('.admin-req-retry-btn');
      if (retryBtn && typeof retryFn === 'function') {
        retryBtn.addEventListener('click', retryFn);
      }
      return;
    }

    stateEl.innerHTML = `<div class="portal-state-box"><p class="text-muted">${escapeHtml(message)}</p></div>`;
    return;
  }

  if (tableWrap) tableWrap.style.display = '';
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: var(--space-6);">${escapeHtml(message)}</td></tr>`;
  }
}

function hideAdminRequestsState(stateEl, tableWrap, cardsEl) {
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

function isRequestOverdue(r) {
  if (typeof r.is_overdue === 'boolean') return r.is_overdue;
  if (r.status !== 'diajukan' || !r.due_at) return false;
  return new Date(r.due_at).getTime() <= Date.now();
}

function renderAdminRequests(items, tableBody, cardsEl) {
  if (tableBody) {
    tableBody.innerHTML = items.map((r) => {
      const appt = r.appointment || {};
      const doctorName = r.doctor?.name || appt.doctor?.name || '-';
      const poliName = appt.polyclinic?.name || r.doctor?.polyclinic?.name || '-';
      const patientName = appt.user?.name || appt.patient?.name || '-';
      const dateStr = appt.appointment_date ? api.formatDate(appt.appointment_date) : '-';
      const timeStr = appt.appointment_time || '09:00';
      const overdue = isRequestOverdue(r);
      const batchBadge = r.batch_id
        ? `<div class="mt-2"><span class="badge badge-kontrol_rutin">Cuti Massal (${escapeHtml(String(r.batch_id).slice(0, 8))})</span></div>`
        : '';
      const overdueBadge = overdue
        ? '<div class="mt-2"><span class="badge badge-overdue-sla">[Lewat SLA]</span></div>'
        : '';
      const apptId = r.appointment_id || appt.id;

      return `
        <tr class="${overdue ? 'is-overdue-row' : ''}">
          <td>
            <strong>${escapeHtml(formatDateTimeIdAdmin(r.due_at))}</strong>
            ${overdueBadge}
            ${batchBadge}
          </td>
          <td>
            <strong>${escapeHtml(doctorName)}</strong>
            <div class="text-muted text-sm">${escapeHtml(poliName)}</div>
          </td>
          <td>
            <strong>${escapeHtml(patientName)}</strong>
            <div class="text-muted text-sm">${escapeHtml(dateStr)}, ${escapeHtml(timeStr)} WIB</div>
          </td>
          <td>
            <strong>${escapeHtml(getReasonCategoryLabelAdmin(r.reason_category))}</strong>
            <div class="text-sm text-muted">${escapeHtml(r.reason || '-')}</div>
            ${r.admin_note ? `<div class="mt-2 text-sm"><strong>Catatan Admin:</strong> ${escapeHtml(r.admin_note)}</div>` : ''}
          </td>
          <td>
            <span class="badge ${getRequestBadgeClassAdmin(r.status)}">${escapeHtml(getRequestStatusLabelAdmin(r.status))}</span>
          </td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
              ${r.status === 'diajukan'
                ? `
                  <button type="button" class="btn btn-danger btn-touch" onclick="openAdminApproveModal(${r.id})">Batalkan janji</button>
                  <button type="button" class="btn btn-primary btn-touch" onclick="openAdminRescheduleModal(${r.id})">Jadwalkan ulang</button>
                  <button type="button" class="btn btn-secondary btn-touch" onclick="openAdminRejectModal(${r.id})">Tolak</button>
                `
                : ''}
              ${apptId ? `<button type="button" class="btn btn-secondary btn-touch" onclick="openAuditLogModal(${apptId})">Riwayat Log</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (cardsEl) {
    cardsEl.innerHTML = items.map((r) => {
      const appt = r.appointment || {};
      const doctorName = r.doctor?.name || appt.doctor?.name || '-';
      const poliName = appt.polyclinic?.name || r.doctor?.polyclinic?.name || '-';
      const patientName = appt.user?.name || appt.patient?.name || '-';
      const dateStr = appt.appointment_date ? api.formatDate(appt.appointment_date) : '-';
      const timeStr = appt.appointment_time || '09:00';
      const overdue = isRequestOverdue(r);
      const apptId = r.appointment_id || appt.id;

      return `
        <article class="mobile-data-card ${overdue ? 'is-overdue-row' : ''}">
          <div class="mobile-data-card__head">
            <div>
              <strong>${escapeHtml(doctorName)}</strong>
              <div class="text-muted text-sm">${escapeHtml(poliName)}</div>
            </div>
            <span class="badge ${getRequestBadgeClassAdmin(r.status)}">${escapeHtml(getRequestStatusLabelAdmin(r.status))}</span>
          </div>
          <div class="mobile-data-card__meta">
            <div><strong>Pasien:</strong> ${escapeHtml(patientName)}</div>
            <div><strong>Jadwal:</strong> ${escapeHtml(dateStr)}, ${escapeHtml(timeStr)} WIB</div>
            <div><strong>Alasan (${escapeHtml(getReasonCategoryLabelAdmin(r.reason_category))}):</strong> ${escapeHtml(r.reason || '-')}</div>
            <div class="mobile-data-card__badges">
              ${overdue ? '<span class="badge badge-overdue-sla">[Lewat SLA]</span>' : ''}
              ${r.batch_id ? `<span class="badge badge-kontrol_rutin">Cuti Massal (${escapeHtml(String(r.batch_id).slice(0, 8))})</span>` : ''}
            </div>
            <div class="text-muted text-sm">Batas SLA: ${escapeHtml(formatDateTimeIdAdmin(r.due_at))}</div>
            ${r.admin_note ? `<div><strong>Catatan Admin:</strong> ${escapeHtml(r.admin_note)}</div>` : ''}
          </div>
          <div class="mobile-data-card__actions">
            ${r.status === 'diajukan'
              ? `
                <button type="button" class="btn btn-danger btn-touch" onclick="openAdminApproveModal(${r.id})">Batalkan janji</button>
                <button type="button" class="btn btn-primary btn-touch" onclick="openAdminRescheduleModal(${r.id})">Jadwalkan ulang</button>
                <button type="button" class="btn btn-secondary btn-touch" onclick="openAdminRejectModal(${r.id})">Tolak</button>
              `
              : ''}
            ${apptId ? `<button type="button" class="btn btn-secondary btn-touch" onclick="openAuditLogModal(${apptId})">Riwayat Log</button>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }
}

function initAdminDecisionModals() {
  initApproveModal();
  initRescheduleModal();
  initRejectModal();
}

function initApproveModal() {
  const modal = document.getElementById('adminApproveModal');
  if (!modal) return;
  const form = document.getElementById('adminApproveForm');
  const submitBtn = getAdminEl('approveSubmitBtn', 'adminApproveSubmitBtn') || form?.querySelector('button[type="submit"]');

  const submitApprove = async () => {
    const alertId = getAdminAlertId('approveAlert', 'adminApproveAlert');
    api.hideAlert(alertId);

    const reqId = Number(document.getElementById('approveRequestId')?.value || activeAdminRequestId);
    const admin_note = document.getElementById('approveAdminNote')?.value.trim() || '';
    const originalText = submitBtn ? submitBtn.textContent : 'Batalkan Janji';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses…';
      }

      const res = await api.request(`/admin/pengajuan-pembatalan/${reqId}/setujui`, {
        method: 'POST',
        body: JSON.stringify({ admin_note: admin_note || null })
      });

      closeAdminApproveModal();
      const targetAlert = getAdminAlertId('adminRequestAlert', 'adminRequestsAlert', 'adminListAlert');
      showAdminWhatsAppFeedback(res, targetAlert);
      await Promise.all([
        loadCancellationRequests(),
        loadAppointments()
      ]);
    } catch (err) {
      const msg = err.status === 409
        ? 'Pengajuan ini sudah ditindak oleh admin lain. Muat ulang untuk melihat hasilnya.'
        : (err.errors?.admin_note?.[0] || err.message || 'Gagal menyetujui pembatalan.');
      api.showAlert(alertId, msg, 'danger');
      if (err.status === 409) {
        loadCancellationRequests();
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitApprove();
    });
  } else if (submitBtn) {
    submitBtn.addEventListener('click', submitApprove);
  }
}

function openAdminApproveModal(requestId) {
  const modal = document.getElementById('adminApproveModal');
  if (!modal) return;

  activeAdminRequestId = requestId;
  api.hideAlert(getAdminAlertId('approveAlert', 'adminApproveAlert'));

  const item = adminRequestsCache.find(x => x.id === requestId);
  const hiddenId = document.getElementById('approveRequestId');
  if (hiddenId) hiddenId.value = String(requestId);

  const noteInput = document.getElementById('approveAdminNote');
  if (noteInput) noteInput.value = '';

  const summaryEl = getAdminEl('approveSummary', 'approveModalSummary');
  if (summaryEl && item) {
    const appt = item.appointment || {};
    summaryEl.textContent = `${item.doctor?.name || 'Dokter'} mengajukan pembatalan untuk ${appt.user?.name || appt.patient?.name || 'Pasien'} (${api.formatDate(appt.appointment_date)}, ${appt.appointment_time || '09:00'} WIB).`;
  }

  showAdminModal(modal, noteInput);
}

function closeAdminApproveModal() {
  hideAdminModal(document.getElementById('adminApproveModal'));
}

function initRescheduleModal() {
  const modal = document.getElementById('adminRescheduleModal');
  if (!modal) return;
  const form = document.getElementById('adminRescheduleForm');
  const doctorSelect = getAdminEl('reschedDoctorId', 'rescheduleDoctorId');
  const dateInput = getAdminEl('reschedDate', 'rescheduleDate');
  const submitBtn = getAdminEl('reschedSubmitBtn', 'adminRescheduleSubmitBtn') || form?.querySelector('button[type="submit"]');

  if (doctorSelect) {
    doctorSelect.addEventListener('change', () => {
      loadRescheduleAvailableSlots(doctorSelect.value, dateInput?.value || '');
    });
  }
  if (dateInput) {
    dateInput.min = getLocalIsoDateAdmin(0);
    dateInput.addEventListener('change', () => {
      loadRescheduleAvailableSlots(doctorSelect?.value || '', dateInput.value);
    });
  }

  const submitReschedule = async () => {
    const alertId = getAdminAlertId('reschedAlert', 'adminRescheduleAlert');
    api.hideAlert(alertId);

    const reqId = Number(getAdminEl('reschedRequestId', 'rescheduleRequestId')?.value || activeAdminRequestId);
    const doctor_id = doctorSelect ? doctorSelect.value : '';
    const appointment_date = dateInput ? dateInput.value : '';
    const appointment_time = getAdminEl('reschedTime', 'rescheduleTime')?.value || '';
    const admin_note = getAdminEl('reschedAdminNote', 'rescheduleAdminNote')?.value.trim() || '';

    if (!appointment_date || !appointment_time) {
      api.showAlert(alertId, 'Pilih tanggal dan jam slot tersedia terlebih dahulu.', 'danger');
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Simpan Jadwal Baru';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';
      }

      const payload = {
        appointment_date,
        appointment_time,
        admin_note: admin_note || null
      };
      if (doctor_id) {
        payload.doctor_id = Number(doctor_id);
      }

      const res = await api.request(`/admin/pengajuan-pembatalan/${reqId}/jadwalkan-ulang`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      closeAdminRescheduleModal();
      const targetAlert = getAdminAlertId('adminRequestAlert', 'adminRequestsAlert', 'adminListAlert');
      showAdminWhatsAppFeedback(res, targetAlert);
      await Promise.all([
        loadCancellationRequests(),
        loadAppointments()
      ]);
    } catch (err) {
      const msg = err.status === 409
        ? 'Pengajuan ini sudah ditindak oleh admin lain. Muat ulang untuk melihat hasilnya.'
        : (
          err.errors?.appointment_time?.[0] ||
          err.errors?.appointment_date?.[0] ||
          err.errors?.doctor_id?.[0] ||
          err.errors?.admin_note?.[0] ||
          err.message ||
          'Gagal menjadwalkan ulang janji temu.'
        );
      api.showAlert(alertId, msg, 'danger');
      if (err.status === 409) {
        loadCancellationRequests();
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitReschedule();
    });
  } else if (submitBtn) {
    submitBtn.addEventListener('click', submitReschedule);
  }
}

async function openAdminRescheduleModal(requestId) {
  const modal = document.getElementById('adminRescheduleModal');
  if (!modal) return;

  activeAdminRequestId = requestId;
  api.hideAlert(getAdminAlertId('reschedAlert', 'adminRescheduleAlert'));

  const item = adminRequestsCache.find(x => x.id === requestId);
  if (!item) return;

  const hiddenId = getAdminEl('reschedRequestId', 'rescheduleRequestId');
  if (hiddenId) hiddenId.value = String(requestId);

  const appt = item.appointment || {};
  const poliId = Number(appt.polyclinic_id || appt.polyclinic?.id || item.doctor?.polyclinic_id || 0);
  const currentDoctorId = Number(appt.doctor_id || item.doctor_id || 0);
  const today = getLocalIsoDateAdmin(0);
  const initialDate = appt.appointment_date && appt.appointment_date >= today ? appt.appointment_date : today;

  const summaryEl = getAdminEl('reschedSummary', 'rescheduleModalSummary');
  if (summaryEl) {
    summaryEl.textContent = `Pasien: ${appt.user?.name || appt.patient?.name || '-'} (${appt.polyclinic?.name || 'Poliklinik'})`;
  }

  const noteInput = getAdminEl('reschedAdminNote', 'rescheduleAdminNote');
  if (noteInput) noteInput.value = '';

  if (adminMasterPoli.length === 0) {
    try {
      const poliRes = await api.request('/master-poli', { priority: 'high' });
      adminMasterPoli = poliRes.data || [];
    } catch {
      adminMasterPoli = [];
    }
  }

  const doctorSelect = getAdminEl('reschedDoctorId', 'rescheduleDoctorId');
  const poliObj = adminMasterPoli.find(p => Number(p.id) === poliId);
  const samePoliDocs = poliObj ? (poliObj.doctors || []).filter(d => d.is_active) : [];

  if (doctorSelect) {
    if (samePoliDocs.length > 0) {
      doctorSelect.innerHTML = samePoliDocs
        .map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`)
        .join('');
      const hasCurrent = samePoliDocs.some(d => Number(d.id) === currentDoctorId);
      doctorSelect.value = String(hasCurrent ? currentDoctorId : samePoliDocs[0].id);
    } else if (currentDoctorId) {
      doctorSelect.innerHTML = `<option value="${currentDoctorId}">${escapeHtml(item.doctor?.name || 'Dokter terkait')}</option>`;
      doctorSelect.value = String(currentDoctorId);
    } else {
      doctorSelect.innerHTML = '<option value="">Tidak ada dokter aktif di poli ini</option>';
    }
  }

  const dateInput = getAdminEl('reschedDate', 'rescheduleDate');
  if (dateInput) {
    dateInput.min = today;
    dateInput.value = initialDate;
  }

  showAdminModal(modal, doctorSelect || dateInput);

  await loadRescheduleAvailableSlots(
    doctorSelect ? doctorSelect.value : currentDoctorId,
    dateInput ? dateInput.value : initialDate,
    appt.appointment_time || ''
  );
}

async function loadRescheduleAvailableSlots(doctorId, date, preferredTime = '') {
  const timeSelect = getAdminEl('reschedTime', 'rescheduleTime');
  const slotsHint = getAdminEl('reschedSlotHint', 'rescheduleSlotHint');
  const slotsGrid = getAdminEl('reschedSlotsGrid', 'rescheduleSlotsGrid');
  if (!timeSelect) return;

  if (!doctorId || !date) {
    timeSelect.innerHTML = '<option value="">Pilih dokter dan tanggal terlebih dahulu…</option>';
    if (slotsHint) slotsHint.textContent = '';
    if (slotsGrid) slotsGrid.innerHTML = '';
    return;
  }

  timeSelect.disabled = true;
  timeSelect.innerHTML = '<option value="">Memuat slot tersedia…</option>';
  if (slotsHint) slotsHint.textContent = 'Memeriksa ketersediaan slot…';

  try {
    const params = new URLSearchParams({ doctor_id: String(doctorId), date });
    const res = await api.request(`/slot-tersedia?${params.toString()}`, { priority: 'high' });
    const slots = Array.isArray(res.data) ? res.data : [];
    const availableSlots = slots.filter(s => s.available);

    timeSelect.innerHTML = slots.map((s) => {
      const suffix = s.available ? '' : ' (Terisi)';
      return `<option value="${escapeHtml(s.time)}" ${s.available ? '' : 'disabled'}>${escapeHtml(s.time)} WIB${suffix}</option>`;
    }).join('');

    const preferredAvailable = availableSlots.find(s => s.time === preferredTime);
    if (preferredAvailable) {
      timeSelect.value = preferredAvailable.time;
    } else if (availableSlots.length > 0) {
      timeSelect.value = availableSlots[0].time;
    }

    timeSelect.disabled = availableSlots.length === 0;

    if (slotsHint) {
      slotsHint.textContent = availableSlots.length > 0
        ? `Tersedia ${availableSlots.length} slot pada tanggal ini.`
        : 'Semua slot pada tanggal dan dokter ini sudah terisi.';
    }

    if (slotsGrid) {
      slotsGrid.innerHTML = slots.map((s) => `
        <button type="button"
          class="btn btn-touch ${s.time === timeSelect.value ? 'btn-primary' : 'btn-secondary'}"
          data-reschedule-slot="${escapeHtml(s.time)}"
          ${s.available ? '' : 'disabled'}>
          ${escapeHtml(s.time)} WIB
        </button>
      `).join('');

      slotsGrid.querySelectorAll('[data-reschedule-slot]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-reschedule-slot');
          if (!val) return;
          timeSelect.value = val;
          slotsGrid.querySelectorAll('[data-reschedule-slot]').forEach((b) => {
            b.classList.toggle('btn-primary', b === btn);
            b.classList.toggle('btn-secondary', b !== btn);
          });
        });
      });
    }
  } catch (err) {
    timeSelect.innerHTML = '<option value="">Gagal memuat slot</option>';
    timeSelect.disabled = true;
    if (slotsHint) slotsHint.textContent = err.message || 'Gagal memuat slot tersedia.';
  }
}

function closeAdminRescheduleModal() {
  hideAdminModal(document.getElementById('adminRescheduleModal'));
}

function initRejectModal() {
  const modal = document.getElementById('adminRejectModal');
  if (!modal) return;
  const form = document.getElementById('adminRejectForm');
  const noteInput = document.getElementById('rejectAdminNote');
  const substituteSelect = document.getElementById('rejectSubstituteDoctorId');
  const countEl = document.getElementById('rejectAdminNoteCount');
  const submitBtn = getAdminEl('rejectSubmitBtn', 'adminRejectSubmitBtn') || form?.querySelector('button[type="submit"]');

  if (noteInput && countEl) {
    noteInput.addEventListener('input', () => {
      countEl.textContent = `${noteInput.value.length}/500`;
    });
  }

  const submitReject = async () => {
    const alertId = getAdminAlertId('rejectAlert', 'adminRejectAlert');
    api.hideAlert(alertId);

    const reqId = Number(document.getElementById('rejectRequestId')?.value || activeAdminRequestId);
    const substituteDoctorId = Number(substituteSelect?.value || 0);
    const admin_note = noteInput ? noteInput.value.trim() : '';

    if (!substituteDoctorId) {
      api.showAlert(alertId, 'Dokter pengganti dalam poliklinik yang sama wajib dipilih sebelum menolak pengajuan.', 'danger');
      if (substituteSelect) substituteSelect.focus();
      return;
    }

    if (admin_note.length < 5 || admin_note.length > 500) {
      api.showAlert(alertId, 'Catatan penolakan wajib diisi minimal 5 hingga 500 karakter.', 'danger');
      if (noteInput) noteInput.focus();
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Tolak & Alihkan';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';
      }

      const res = await api.request(`/admin/pengajuan-pembatalan/${reqId}/tolak`, {
        method: 'POST',
        body: JSON.stringify({
          substitute_doctor_id: substituteDoctorId,
          admin_note
        })
      });

      closeAdminRejectModal();
      const targetAlert = getAdminAlertId('adminRequestAlert', 'adminRequestsAlert', 'adminListAlert');
      api.showAlert(targetAlert, res.message || 'Pengajuan ditolak dan janji dialihkan ke dokter pengganti.', 'success');
      await Promise.all([
        loadCancellationRequests(),
        loadAppointments()
      ]);
    } catch (err) {
      const msg = err.status === 409
        ? 'Pengajuan ini sudah ditindak oleh admin lain. Muat ulang untuk melihat hasilnya.'
        : (err.errors?.substitute_doctor_id?.[0] || err.errors?.admin_note?.[0] || err.message || 'Gagal menolak pengajuan pembatalan.');
      api.showAlert(alertId, msg, 'danger');
      if (err.status === 409) {
        loadCancellationRequests();
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitReject();
    });
  } else if (submitBtn) {
    submitBtn.addEventListener('click', submitReject);
  }
}

async function openAdminRejectModal(requestId) {
  const modal = document.getElementById('adminRejectModal');
  if (!modal) return;

  activeAdminRequestId = requestId;
  api.hideAlert(getAdminAlertId('rejectAlert', 'adminRejectAlert'));

  const item = adminRequestsCache.find(x => x.id === requestId);
  const hiddenId = document.getElementById('rejectRequestId');
  if (hiddenId) hiddenId.value = String(requestId);

  const noteInput = document.getElementById('rejectAdminNote');
  if (noteInput) noteInput.value = '';
  const countEl = document.getElementById('rejectAdminNoteCount');
  if (countEl) countEl.textContent = '0/500';

  const summaryEl = getAdminEl('rejectSummary', 'rejectModalSummary');
  const appt = item?.appointment || {};
  if (summaryEl && item) {
    const patientLabel = appt.user?.initial_name || appt.user?.name || appt.patient?.initial_name || appt.patient?.name || 'Pasien';
    summaryEl.textContent = `Tolak pengajuan dari ${item.doctor?.name || 'Dokter'} untuk janji ${patientLabel} (${api.formatDate(appt.appointment_date)}). Pilih dokter pengganti aktif pada poliklinik yang sama.`;
  }

  const substituteSelect = document.getElementById('rejectSubstituteDoctorId');
  if (substituteSelect) {
    substituteSelect.innerHTML = '<option value="">Memuat daftar dokter pengganti…</option>';
    substituteSelect.disabled = true;
  }

  showAdminModal(modal, substituteSelect || noteInput);

  if (substituteSelect) {
    if (adminMasterPoli.length === 0) {
      try {
        const poliRes = await api.request('/master-poli', { priority: 'high' });
        adminMasterPoli = poliRes.data || [];
      } catch {
        adminMasterPoli = [];
      }
    }

    const poliId = Number(appt.polyclinic_id || appt.polyclinic?.id || item?.doctor?.polyclinic_id || 0);
    const originalDoctorId = Number(appt.doctor_id || item?.doctor_id || 0);
    const poliObj = adminMasterPoli.find(p => Number(p.id) === poliId);
    const eligibleDoctors = (poliObj?.doctors || []).filter(
      d => d && (d.is_active === undefined || Boolean(d.is_active)) && Number(d.id) !== originalDoctorId
    );

    if (eligibleDoctors.length > 0) {
      substituteSelect.innerHTML = '<option value="">Pilih dokter pengganti…</option>' +
        eligibleDoctors.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
      substituteSelect.disabled = false;
    } else {
      substituteSelect.innerHTML = '<option value="">Tidak ada dokter aktif lain di poliklinik ini</option>';
      substituteSelect.disabled = false;
    }
  }
}

function closeAdminRejectModal() {
  hideAdminModal(document.getElementById('adminRejectModal'));
}

/* Riwayat Log Status (Audit Log Modal) */
async function openAuditLogModal(appointmentId) {
  const modal = getAdminEl('adminAuditLogModal', 'auditLogModal');
  const bodyEl = document.getElementById('auditLogBody');
  const summaryEl = document.getElementById('auditLogSummary');
  if (!modal || !bodyEl) return;

  api.hideAlert('auditLogAlert');
  if (summaryEl) summaryEl.textContent = `Memuat log untuk janji temu #${appointmentId}…`;
  bodyEl.innerHTML = '<div class="portal-state-box"><p class="text-muted">Memuat riwayat perubahan status…</p></div>';

  showAdminModal(modal, modal.querySelector('button'));

  try {
    const res = await api.request(`/admin/janji-temu/${appointmentId}/log`, { priority: 'high' });
    const payload = res.data || res;
    const logs = Array.isArray(payload) ? payload : (Array.isArray(payload.logs) ? payload.logs : []);
    const appt = res.appointment || payload.appointment || adminAppointmentsCache.find(x => x.id === appointmentId) || null;

    if (summaryEl) {
      if (appt) {
        const patientName = appt.user?.name || appt.patient?.name || 'Pasien';
        const dateStr = appt.appointment_date ? api.formatDate(appt.appointment_date) : '-';
        summaryEl.textContent = `${patientName} (${dateStr}, ${appt.appointment_time || '09:00'} WIB)`;
      } else {
        summaryEl.textContent = `Janji Temu #${appointmentId}`;
      }
    }

    if (logs.length === 0) {
      bodyEl.innerHTML = '<div class="portal-state-box"><p class="text-muted">Belum ada catatan perubahan status.</p></div>';
      return;
    }

    const headerSummaryHtml = !summaryEl && appt
      ? `<p class="text-sm mb-4"><strong>${escapeHtml(appt.user?.name || appt.patient?.name || 'Pasien')}</strong> (${escapeHtml(api.formatDate(appt.appointment_date))}, ${escapeHtml(appt.appointment_time || '09:00')} WIB)</p>`
      : '';

    bodyEl.innerHTML = `
      ${headerSummaryHtml}
      <ol class="audit-timeline">
        ${logs.map((log) => {
          const subjectLabel = log.subject_type === 'cancellation_request'
            ? 'Pengajuan Pembatalan'
            : 'Janji Temu';
          const fromLabel = log.from_status ? getAnyStatusLabelAdmin(log.from_status) : 'Baru';
          const toLabel = getAnyStatusLabelAdmin(log.to_status);
          const actorName = log.actor?.name || getActorRoleLabel(log.actor_role);
          const actorRoleLabel = getActorRoleLabel(log.actor_role);
          const changesHtml = formatAuditChangesHtml(log.changes);

          return `
            <li class="audit-timeline-item">
              <div class="audit-timeline-item__head">
                <strong>${escapeHtml(subjectLabel)}: ${escapeHtml(fromLabel)} ke ${escapeHtml(toLabel)}</strong>
                <span class="text-muted text-sm">${escapeHtml(formatDateTimeIdAdmin(log.created_at))}</span>
              </div>
              <div class="text-sm text-muted">
                Pelaku: ${escapeHtml(actorName)} (${escapeHtml(actorRoleLabel)})
              </div>
              ${log.reason ? `<div class="text-sm mt-2">${escapeHtml(log.reason)}</div>` : ''}
              ${changesHtml}
            </li>
          `;
        }).join('')}
      </ol>
    `;
  } catch (err) {
    bodyEl.innerHTML = `
      <div class="portal-state-box portal-state-box--error">
        <p>${escapeHtml(err.message || 'Gagal memuat riwayat perubahan status.')}</p>
        <button type="button" class="btn btn-secondary btn-touch" onclick="openAuditLogModal(${appointmentId})">Coba lagi</button>
      </div>
    `;
  }
}

function closeAuditLogModal() {
  hideAdminModal(getAdminEl('adminAuditLogModal', 'auditLogModal'));
}

function formatAuditChangesHtml(changes) {
  if (!changes || typeof changes !== 'object') return '';
  const entries = Object.entries(changes).filter(([, val]) => val !== null && val !== undefined && val !== '');
  if (entries.length === 0) return '';

  const formatted = entries.map(([key, val]) => {
    if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
      return `${escapeHtml(key)}: ${escapeHtml(String(val.old ?? '-'))} -> ${escapeHtml(String(val.new ?? '-'))}`;
    }
    return `${escapeHtml(key)}: ${escapeHtml(typeof val === 'object' ? JSON.stringify(val) : String(val))}`;
  });

  return `<div class="audit-timeline-item__changes text-sm mt-2">${formatted.join(' | ')}</div>`;
}

window.openAdminApproveModal = openAdminApproveModal;
window.closeAdminApproveModal = closeAdminApproveModal;
window.openAdminRescheduleModal = openAdminRescheduleModal;
window.closeAdminRescheduleModal = closeAdminRescheduleModal;
window.openAdminRejectModal = openAdminRejectModal;
window.closeAdminRejectModal = closeAdminRejectModal;
window.openAuditLogModal = openAuditLogModal;
window.closeAuditLogModal = closeAuditLogModal;

/* Master Data & Akun Dokter */
async function initMasterData() {
  initDoctorAccountModal();

  const practiceSelect = document.getElementById('masterFilterPractice');
  const accountSelect = document.getElementById('masterFilterAccount');
  const sortSelect = document.getElementById('masterSort');
  const resetBtn = document.getElementById('resetMasterFiltersBtn');

  if (practiceSelect) practiceSelect.addEventListener('change', renderFilteredMasterData);
  if (accountSelect) accountSelect.addEventListener('change', renderFilteredMasterData);
  if (sortSelect) sortSelect.addEventListener('change', renderFilteredMasterData);

  const resetMasterFilters = () => {
    if (practiceSelect) practiceSelect.value = '';
    if (accountSelect) accountSelect.value = '';
    if (sortSelect) sortSelect.value = 'name_asc';
    const searchInput = document.getElementById('staffSearchInput');
    const clearBtn = document.getElementById('staffSearchClearBtn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.hidden = true;
    document.querySelectorAll('[data-master-quick]').forEach((el) => el.classList.remove('is-active'));
    renderFilteredMasterData();
  };

  if (resetBtn) {
    resetBtn.addEventListener('click', resetMasterFilters);
  }

  document.querySelectorAll('[data-master-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-master-quick');
      document.querySelectorAll('[data-master-quick]').forEach((el) => {
        el.classList.toggle('is-active', el.getAttribute('data-master-quick') === preset);
      });

      if (preset === 'active_practice') {
        if (practiceSelect) practiceSelect.value = 'active';
        if (accountSelect) accountSelect.value = '';
      } else if (preset === 'has_account') {
        if (practiceSelect) practiceSelect.value = '';
        if (accountSelect) accountSelect.value = 'active';
      } else if (preset === 'no_account') {
        if (practiceSelect) practiceSelect.value = '';
        if (accountSelect) accountSelect.value = 'none';
      } else {
        resetMasterFilters();
        if (typeof window.closeAdminStaffDrawer === 'function') window.closeAdminStaffDrawer();
        return;
      }

      renderFilteredMasterData();
      if (typeof window.closeAdminStaffDrawer === 'function') {
        window.closeAdminStaffDrawer();
      }
    });
  });

  await loadMasterDataList();

  const poliForm = document.getElementById('poliForm');
  if (poliForm) {
    poliForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('poliAlert');
      const nameInput = document.getElementById('poliName');
      const name = nameInput.value.trim();
      const description = document.getElementById('poliDesc').value.trim();
      const btn = poliForm.querySelector('button[type="submit"]');

      if (!name) {
        api.showAlert('poliAlert', 'Nama poliklinik wajib diisi.', 'danger');
        nameInput.focus();
        return;
      }

      try {
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        await api.request('/admin/poli', {
          method: 'POST',
          body: JSON.stringify({ name, description })
        });
        api.showAlert('poliAlert', 'Poliklinik berhasil ditambahkan.', 'success');
        poliForm.reset();
        await loadMasterDataList();
      } catch (err) {
        api.showAlert('poliAlert', err.message || 'Gagal menambah poliklinik.', 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Tambah poli';
      }
    });
  }

  const doctorForm = document.getElementById('doctorForm');
  if (doctorForm) {
    doctorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('doctorAlert');
      const polyclinic_id = document.getElementById('docPoliId').value;
      const nameInput = document.getElementById('docName');
      const name = nameInput.value.trim();
      const btn = doctorForm.querySelector('button[type="submit"]');

      if (!polyclinic_id || !name) {
        api.showAlert('doctorAlert', 'Pilih poliklinik dan isi nama lengkap dokter terlebih dahulu.', 'danger');
        return;
      }

      try {
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        await api.request('/admin/dokter', {
          method: 'POST',
          body: JSON.stringify({ polyclinic_id: parseInt(polyclinic_id, 10), name, is_active: true })
        });
        api.showAlert('doctorAlert', 'Dokter berhasil ditambahkan.', 'success');
        doctorForm.reset();
        await loadMasterDataList();
      } catch (err) {
        api.showAlert('doctorAlert', err.message || 'Gagal menambah dokter.', 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Tambah dokter';
      }
    });
  }
}

function getMergedMasterDoctors(doctors, doctorById) {
  return (doctors || []).map((rawDoc) => {
    const merged = { ...rawDoc, ...(doctorById.get(Number(rawDoc.id)) || {}) };
    const hasAccount = Boolean(merged.user_id || merged.user || merged.account_email || merged.has_account);
    const accountEmail = merged.user?.email || merged.account_email || '';
    const isAccessEnabled = hasAccount && !(merged.user?.disabled_at || merged.disabled_at || merged.access_enabled === false);
    const accountState = !hasAccount ? 'none' : (isAccessEnabled ? 'active' : 'disabled');
    return {
      ...merged,
      hasAccount,
      accountEmail,
      isAccessEnabled,
      accountState
    };
  });
}

function renderFilteredMasterData() {
  const poliListEl = document.getElementById('poliTableBody');
  const masterCardsEl = document.getElementById('masterDataCards');
  const resultInfoEl = document.getElementById('masterResultInfo');
  if (!poliListEl) return;

  const doctorById = new Map(adminDoctorsCatalog.map(d => [Number(d.id), d]));
  const practiceFilter = document.getElementById('masterFilterPractice')?.value || '';
  const accountFilter = document.getElementById('masterFilterAccount')?.value || '';
  const sortMode = document.getElementById('masterSort')?.value || 'name_asc';
  const query = getStaffSearchQuery();

  let prepared = (masterDataCache || []).map((p) => {
    const poliHaystack = `${p.name || ''} ${p.description || ''}`.toLowerCase();
    const poliMatchesQuery = Boolean(query && poliHaystack.includes(query));
    const allDoctors = getMergedMasterDoctors(p.doctors || [], doctorById);

    const visibleDoctors = allDoctors.filter((doc) => {
      if (practiceFilter === 'active' && !doc.is_active) return false;
      if (practiceFilter === 'inactive' && doc.is_active) return false;
      if (accountFilter && doc.accountState !== accountFilter) return false;
      if (query && !poliMatchesQuery) {
        const docHaystack = `${doc.name || ''} ${doc.accountEmail || ''}`.toLowerCase();
        if (!docHaystack.includes(query)) return false;
      }
      return true;
    });

    return {
      ...p,
      visibleDoctors
    };
  });

  if (practiceFilter || accountFilter || query) {
    prepared = prepared.filter((p) => {
      if (p.visibleDoctors.length > 0) return true;
      if (!practiceFilter && !accountFilter && query) {
        return `${p.name || ''} ${p.description || ''}`.toLowerCase().includes(query);
      }
      return false;
    });
  }

  prepared = prepared.slice().sort((a, b) => {
    if (sortMode === 'doctors_desc') {
      return b.visibleDoctors.length - a.visibleDoctors.length;
    }
    return (a.name || '').localeCompare(b.name || '', 'id');
  });

  const totalVisibleDoctors = prepared.reduce((acc, p) => acc + p.visibleDoctors.length, 0);
  if (resultInfoEl) {
    resultInfoEl.textContent = `Menampilkan ${prepared.length} poliklinik, ${totalVisibleDoctors} dokter`;
  }

  const renderDoctorListHtml = (doctors) => {
    if (!doctors || doctors.length === 0) {
      return '<ul class="master-doctor-list"><li class="text-muted text-sm">Belum ada dokter sesuai filter.</li></ul>';
    }
    return `
      <ul class="master-doctor-list">
        ${doctors.map((merged) => {
          const accountBadgeHtml = merged.hasAccount
            ? `<span class="badge ${merged.isAccessEnabled ? 'badge-selesai' : 'badge-dibatalkan'}">${merged.isAccessEnabled ? 'Akun Aktif' : 'Akses Nonaktif'}</span>`
            : '<span class="badge badge-janji_baru">Belum Punya Akun</span>';

          const accountActionHtml = merged.hasAccount
            ? `<button type="button" class="btn btn-secondary btn-sm btn-touch" onclick="toggleDoctorAccountAccess(${merged.id}, ${!merged.isAccessEnabled})">${merged.isAccessEnabled ? 'Nonaktifkan Akses' : 'Aktifkan Akses'}</button>`
            : `<button type="button" class="btn btn-primary btn-sm btn-touch" onclick="openDoctorAccountModal(${merged.id}, '${escapeJsString(merged.name)}')">Buat Akun</button>`;

          return `
            <li class="master-doctor-item">
              <div>
                <div class="master-doctor-item__info">
                  <strong>${escapeHtml(merged.name)}</strong>
                  <span class="badge ${merged.is_active ? 'badge-selesai' : 'badge-dibatalkan'}">
                    ${merged.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  ${accountBadgeHtml}
                </div>
                ${merged.accountEmail ? `<div class="text-muted text-xs">${escapeHtml(merged.accountEmail)}</div>` : ''}
              </div>
              <div class="master-doctor-item__actions">
                <button type="button" class="btn btn-secondary btn-sm btn-touch" onclick="toggleDoctorStatus(${merged.id}, ${!merged.is_active})">
                  ${merged.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                ${accountActionHtml}
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  };

  if (prepared.length === 0) {
    poliListEl.innerHTML = '<tr><td colspan="3" class="text-muted text-center">Belum ada poliklinik atau dokter yang cocok dengan filter.</td></tr>';
    if (masterCardsEl) {
      masterCardsEl.innerHTML = '<div class="portal-state-box"><p class="text-muted">Belum ada poliklinik atau dokter yang cocok dengan filter.</p></div>';
    }
    return;
  }

  poliListEl.innerHTML = prepared.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${escapeHtml(p.description || '-')}</td>
      <td>${renderDoctorListHtml(p.visibleDoctors)}</td>
    </tr>
  `).join('');

  if (masterCardsEl) {
    masterCardsEl.innerHTML = prepared.map(p => `
      <article class="mobile-data-card">
        <div class="mobile-data-card__head">
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <div class="text-muted text-sm">${escapeHtml(p.description || '-')}</div>
          </div>
        </div>
        <div class="mobile-data-card__meta">
          ${renderDoctorListHtml(p.visibleDoctors)}
        </div>
      </article>
    `).join('');
  }
}

async function loadMasterDataList() {
  const poliListEl = document.getElementById('poliTableBody');
  const masterCardsEl = document.getElementById('masterDataCards');
  const docPoliSelect = document.getElementById('docPoliId');
  const tableWrap = poliListEl ? poliListEl.closest('.table-responsive') : null;

  if (tableWrap && masterCardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }

  try {
    const [poliRes, adminDoctorsRes] = await Promise.all([
      api.request('/master-poli', { priority: 'high' }),
      api.request('/admin/dokter', { priority: 'high' }).catch(() => null)
    ]);

    const polis = poliRes.data || [];
    masterDataCache = polis;
    adminDoctorsCatalog = Array.isArray(adminDoctorsRes?.data) ? adminDoctorsRes.data : [];

    if (docPoliSelect) {
      docPoliSelect.innerHTML = '<option value="">Pilih poliklinik...</option>' +
        polis.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }

    renderFilteredMasterData();
    updateStaffSyncTime();
  } catch {
    if (poliListEl) {
      poliListEl.innerHTML = '<tr><td colspan="3" class="text-center" style="color: var(--color-danger-ink);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
    }
    if (masterCardsEl) {
      masterCardsEl.innerHTML = '<div class="portal-state-box portal-state-box--error"><p>Gagal memuat data. Coba muat ulang halaman.</p></div>';
    }
  }
}

function initDoctorAccountModal() {
  const modal = document.getElementById('doctorAccountModal');
  const form = getAdminEl('docAccForm', 'doctorAccountForm');
  if (!modal || !form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertId = getAdminAlertId('docAccAlert', 'doctorAccountAlert');
    api.hideAlert(alertId);

    const doctorId = getAdminEl('docAccDoctorId', 'doctorAccountDoctorId')?.value;
    const emailInput = getAdminEl('docAccEmail', 'doctorAccountEmail');
    const phoneInput = document.getElementById('docAccPhone');
    const passwordInput = getAdminEl('docAccPassword', 'doctorAccountPassword');
    const email = emailInput ? emailInput.value.trim() : '';
    const phone_number = phoneInput ? phoneInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const submitBtn = getAdminEl('docAccSubmitBtn', 'doctorAccountSubmitBtn') || form.querySelector('button[type="submit"]');

    if (!email) {
      api.showAlert(alertId, 'Masukkan email login dokter terlebih dahulu.', 'danger');
      if (emailInput) emailInput.focus();
      return;
    }

    if (!password || password.length < 8) {
      api.showAlert(alertId, 'Kata sandi awal minimal 8 karakter.', 'danger');
      if (passwordInput) passwordInput.focus();
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Buat Akun Dokter';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';
      }

      const payload = { email, password };
      if (phone_number) {
        payload.phone_number = phone_number;
      }

      const res = await api.request(`/admin/dokter/${doctorId}/akun`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      closeDoctorAccountModal();
      api.showAlert('masterListAlert', res.message || 'Akun login dokter berhasil dibuat.', 'success');
      await loadMasterDataList();
    } catch (err) {
      const msg =
        err.errors?.email?.[0] ||
        err.errors?.phone_number?.[0] ||
        err.errors?.password?.[0] ||
        err.message ||
        'Gagal membuat akun login dokter.';
      api.showAlert(alertId, msg, 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

function openDoctorAccountModal(doctorId, doctorName = '') {
  const modal = document.getElementById('doctorAccountModal');
  if (!modal) return;

  api.hideAlert(getAdminAlertId('docAccAlert', 'doctorAccountAlert'));
  const idInput = getAdminEl('docAccDoctorId', 'doctorAccountDoctorId');
  const labelEl = getAdminEl('docAccDoctorLabel', 'doctorAccountDoctorName');
  const emailInput = getAdminEl('docAccEmail', 'doctorAccountEmail');
  const phoneInput = document.getElementById('docAccPhone');
  const passwordInput = getAdminEl('docAccPassword', 'doctorAccountPassword');

  if (idInput) idInput.value = String(doctorId);
  if (labelEl) labelEl.textContent = doctorName ? `Dokter: ${doctorName}` : `Dokter #${doctorId}`;
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (passwordInput) passwordInput.value = '';

  showAdminModal(modal, emailInput);
}

function closeDoctorAccountModal() {
  hideAdminModal(document.getElementById('doctorAccountModal'));
}

async function toggleDoctorAccountAccess(doctorId, accessEnabled) {
  api.hideAlert('masterListAlert');
  try {
    const res = await api.request(`/admin/dokter/${doctorId}/akun`, {
      method: 'PATCH',
      body: JSON.stringify({ access_enabled: Boolean(accessEnabled) })
    });
    api.showAlert('masterListAlert', res.message || 'Status akses login dokter diperbarui.', 'success');
    await loadMasterDataList();
  } catch (err) {
    api.showAlert('masterListAlert', err.message || 'Gagal memperbarui akses akun dokter.', 'danger');
  }
}

async function toggleDoctorStatus(doctorId, isActive) {
  api.hideAlert('masterListAlert');
  try {
    const res = await api.request(`/admin/dokter/${doctorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
    api.showAlert('masterListAlert', res.message || 'Status dokter diperbarui.', 'success');
    await loadMasterDataList();
  } catch (err) {
    api.showAlert('masterListAlert', err.message || 'Gagal mengubah status dokter.', 'danger');
  }
}

window.toggleDoctorStatus = toggleDoctorStatus;
window.openDoctorAccountModal = openDoctorAccountModal;
window.closeDoctorAccountModal = closeDoctorAccountModal;
window.toggleDoctorAccountAccess = toggleDoctorAccountAccess;

function getStatusLabel(status) {
  switch (status) {
    case 'terjadwal': return 'Terjadwal';
    case 'selesai': return 'Selesai';
    case 'dibatalkan': return 'Dibatalkan';
    default: return status;
  }
}

function getRequestStatusLabelAdmin(status) {
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

function getRequestBadgeClassAdmin(status) {
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

function getAnyStatusLabelAdmin(status) {
  if (['terjadwal', 'selesai', 'dibatalkan'].includes(status)) {
    return getStatusLabel(status);
  }
  return getRequestStatusLabelAdmin(status);
}

function getReasonCategoryLabelAdmin(category) {
  switch (category) {
    case 'cuti_mendadak': return 'Cuti Mendadak';
    case 'sakit': return 'Sakit';
    case 'tugas_darurat': return 'Tugas Darurat';
    case 'bentrok_jadwal': return 'Bentrok Jadwal';
    case 'lainnya': return 'Lainnya';
    default: return category || '-';
  }
}

function getActorRoleLabel(role) {
  switch (role) {
    case 'admin': return 'Admin';
    case 'dokter': return 'Dokter';
    case 'pasien': return 'Pasien';
    case 'system': return 'Sistem';
    default: return role || 'Sistem';
  }
}

function getLocalIsoDateAdmin(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTimeIdAdmin(isoString) {
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

function escapeJsString(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/* Pengajuan Slot Tambahan Dokter */
async function initAdminSlotRequests() {
  const tabSlotsBtn = document.getElementById('adminTabBtnSlotRequests');
  const statusFilter = document.getElementById('adminSlotStatusFilter');
  const reloadBtn = document.getElementById('adminReloadSlotRequestsBtn');
  const retryBtn = document.getElementById('adminRetrySlotRequestsBtn');

  if (tabSlotsBtn) {
    tabSlotsBtn.addEventListener('click', () => {
      switchAdminTab('slotRequests');
      loadAdminSlotRequests();
    });
  }
  if (statusFilter) {
    statusFilter.addEventListener('change', loadAdminSlotRequests);
  }
  if (reloadBtn) {
    reloadBtn.addEventListener('click', loadAdminSlotRequests);
  }
  if (retryBtn) {
    retryBtn.addEventListener('click', loadAdminSlotRequests);
  }

  initAdminSlotApproveModal();
  initAdminSlotRejectModal();
  await loadAdminSlotRequests();
}

function updateAdminSlotBadge(count) {
  const safeCount = Number.isFinite(count) ? count : 0;
  ['adminPendingSlotBadge', 'drawerPendingSlotBadge'].forEach((id) => {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.textContent = String(safeCount);
    badge.hidden = safeCount === 0;
    badge.style.display = safeCount > 0 ? 'inline-flex' : 'none';
  });
  syncAdminTopbarNotifCount();
}

function renderFilteredAdminSlotRequests() {
  const emptyEl = document.getElementById('adminSlotRequestsEmpty');
  const tableWrap = document.getElementById('adminSlotRequestsTableWrap');
  const tableBody = document.getElementById('adminSlotRequestsTableBody');
  const cardsEl = document.getElementById('adminSlotRequestsCards');
  if (!tableBody && !cardsEl) return;

  const query = getStaffSearchQuery();
  const items = (adminSlotRequestsCache || []).filter((item) => {
    if (!query) return true;
    const haystack = [
      item.doctor?.name,
      item.doctor?.polyclinic?.name,
      item.schedule_date,
      item.reason,
      item.admin_note,
      item.status
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });

  if (tableWrap) tableWrap.hidden = items.length === 0;
  if (emptyEl) emptyEl.hidden = items.length > 0;
  if (cardsEl) cardsEl.innerHTML = '';

  if (!items.length) return;

  if (tableBody) {
    tableBody.innerHTML = items.map((item) => {
      const docName = item.doctor?.name || `Dokter #${item.doctor_id}`;
      const poliName = item.doctor?.polyclinic?.name || '-';
      const startLabel = String(item.start_time || '').slice(0, 5);
      const endLabel = String(item.end_time || '').slice(0, 5);

      return `
        <tr>
          <td>
            <strong>${escapeHtml(docName)}</strong>
            <div class="text-muted text-sm">${escapeHtml(poliName)}</div>
          </td>
          <td><strong>${escapeHtml(formatCompactDateAdmin(item.schedule_date))}</strong></td>
          <td>${escapeHtml(startLabel)} - ${escapeHtml(endLabel)} WIB</td>
          <td>${escapeHtml(String(item.quota || 0))} pasien</td>
          <td>
            <div>${escapeHtml(item.reason || '-')}</div>
            ${item.admin_note ? `<div class="mt-2 text-sm"><strong>Catatan Admin:</strong> ${escapeHtml(item.admin_note)}</div>` : ''}
          </td>
          <td><span class="badge ${getRequestBadgeClassAdmin(item.status)}">${escapeHtml(getRequestStatusLabelAdmin(item.status))}</span></td>
          <td>
            <div class="staff-row-actions">
              ${item.status === 'diajukan'
                ? `
                  <button type="button" class="btn btn-primary btn-sm btn-touch" onclick="openAdminSlotApproveModal(${item.id})">Setujui</button>
                  <button type="button" class="btn btn-danger btn-sm btn-touch" onclick="openAdminSlotRejectModal(${item.id})">Tolak</button>
                `
                : '<span class="text-muted text-sm">Sudah diproses</span>'}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (cardsEl) {
    cardsEl.innerHTML = items.map((item) => {
      const docName = item.doctor?.name || `Dokter #${item.doctor_id}`;
      const poliName = item.doctor?.polyclinic?.name || '-';
      const startLabel = String(item.start_time || '').slice(0, 5);
      const endLabel = String(item.end_time || '').slice(0, 5);

      return `
        <article class="mobile-data-card">
          <div class="mobile-data-card__head">
            <div>
              <strong>${escapeHtml(docName)}</strong>
              <div class="text-muted text-sm">${escapeHtml(poliName)}</div>
            </div>
            <span class="badge ${getRequestBadgeClassAdmin(item.status)}">${escapeHtml(getRequestStatusLabelAdmin(item.status))}</span>
          </div>
          <div class="mobile-data-card__meta">
            <div><strong>Tanggal:</strong> ${escapeHtml(formatCompactDateAdmin(item.schedule_date))}</div>
            <div><strong>Jam:</strong> ${escapeHtml(startLabel)} - ${escapeHtml(endLabel)} WIB</div>
            <div><strong>Kuota:</strong> ${escapeHtml(String(item.quota || 0))} pasien</div>
            <div><strong>Alasan:</strong> ${escapeHtml(item.reason || '-')}</div>
            ${item.admin_note ? `<div><strong>Catatan Admin:</strong> ${escapeHtml(item.admin_note)}</div>` : ''}
          </div>
          ${item.status === 'diajukan'
            ? `
              <div class="mobile-data-card__actions">
                <button type="button" class="btn btn-primary btn-sm btn-touch" onclick="openAdminSlotApproveModal(${item.id})">Setujui</button>
                <button type="button" class="btn btn-danger btn-sm btn-touch" onclick="openAdminSlotRejectModal(${item.id})">Tolak</button>
              </div>
            `
            : ''}
        </article>
      `;
    }).join('');
  }
}

async function loadAdminSlotRequests() {
  const loadingEl = document.getElementById('adminSlotRequestsLoading');
  const emptyEl = document.getElementById('adminSlotRequestsEmpty');
  const errorEl = document.getElementById('adminSlotRequestsError');
  const errorMsgEl = document.getElementById('adminSlotRequestsErrorMsg');
  const tableWrap = document.getElementById('adminSlotRequestsTableWrap');
  const tableBody = document.getElementById('adminSlotRequestsTableBody');
  const cardsEl = document.getElementById('adminSlotRequestsCards');
  const statusFilter = document.getElementById('adminSlotStatusFilter')?.value || 'diajukan';

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
    const query = statusFilter && statusFilter !== 'semua'
      ? `?status=${encodeURIComponent(statusFilter)}`
      : '';
    const res = await api.request(`/admin/slot-tambahan${query}`, { priority: 'low' });
    const items = Array.isArray(res.data) ? res.data : [];
    adminSlotRequestsCache = items;

    if (statusFilter === 'diajukan') {
      updateAdminSlotBadge(items.length);
    } else if (statusFilter === 'semua') {
      updateAdminSlotBadge(items.filter(x => x.status === 'diajukan').length);
    }

    if (loadingEl) loadingEl.hidden = true;

    renderAdminPendingPreview();
    renderFilteredAdminSlotRequests();
    if (document.getElementById('adminAppointmentTableBody')) {
      updateRightSummaryRail(adminAppointmentsCache, adminAppointmentsCache.length);
    }
    updateStaffSyncTime();
  } catch (err) {
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) errorEl.hidden = false;
    if (errorMsgEl) errorMsgEl.textContent = err.message || 'Gagal memuat daftar pengajuan slot tambahan.';
  }
}

function initAdminSlotApproveModal() {
  const form = document.getElementById('adminSlotApproveForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    api.hideAlert('slotApproveAlert');

    const reqId = Number(document.getElementById('slotApproveRequestId')?.value || 0);
    const admin_note = (document.getElementById('slotApproveAdminNote')?.value || '').trim();
    const submitBtn = document.getElementById('slotApproveSubmitBtn');
    const originalText = submitBtn ? submitBtn.textContent : 'Ya, Setujui Slot';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses…';
      }

      const res = await api.request(`/admin/slot-tambahan/${reqId}/setujui`, {
        method: 'POST',
        body: JSON.stringify({ admin_note: admin_note || null })
      });

      closeAdminSlotApproveModal();
      api.showAlert('adminSlotRequestsAlert', res.message || 'Pengajuan slot tambahan berhasil disetujui.', 'success');
      await loadAdminSlotRequests();
    } catch (err) {
      api.showAlert('slotApproveAlert', err.message || 'Gagal menyetujui pengajuan slot tambahan.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

function openAdminSlotApproveModal(requestId) {
  const modal = document.getElementById('adminSlotApproveModal');
  if (!modal) return;

  api.hideAlert('slotApproveAlert');
  const item = adminSlotRequestsCache.find(x => Number(x.id) === Number(requestId));
  const idInput = document.getElementById('slotApproveRequestId');
  const noteInput = document.getElementById('slotApproveAdminNote');
  const summaryEl = document.getElementById('slotApproveSummary');

  if (idInput) idInput.value = String(requestId);
  if (noteInput) noteInput.value = '';
  if (summaryEl && item) {
    const docName = item.doctor?.name || `Dokter #${item.doctor_id}`;
    const startLabel = String(item.start_time || '').slice(0, 5);
    const endLabel = String(item.end_time || '').slice(0, 5);
    summaryEl.textContent = `Setujui slot tambahan ${docName} pada ${api.formatDate(item.schedule_date)} (${startLabel} - ${endLabel} WIB, kuota ${item.quota} pasien).`;
  }

  showAdminModal(modal, noteInput);
}

function closeAdminSlotApproveModal() {
  hideAdminModal(document.getElementById('adminSlotApproveModal'));
}

function initAdminSlotRejectModal() {
  const form = document.getElementById('adminSlotRejectForm');
  const noteInput = document.getElementById('slotRejectAdminNote');
  const countEl = document.getElementById('slotRejectAdminNoteCount');

  if (noteInput && countEl) {
    noteInput.addEventListener('input', () => {
      countEl.textContent = `${noteInput.value.length}/500`;
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    api.hideAlert('slotRejectAlert');

    const reqId = Number(document.getElementById('slotRejectRequestId')?.value || 0);
    const admin_note = (noteInput?.value || '').trim();
    const submitBtn = document.getElementById('slotRejectSubmitBtn');

    if (admin_note.length < 5 || admin_note.length > 500) {
      api.showAlert('slotRejectAlert', 'Alasan penolakan wajib diisi minimal 5 hingga 500 karakter.', 'danger');
      noteInput?.focus();
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Tolak Pengajuan Slot';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses…';
      }

      const res = await api.request(`/admin/slot-tambahan/${reqId}/tolak`, {
        method: 'POST',
        body: JSON.stringify({ admin_note })
      });

      closeAdminSlotRejectModal();
      api.showAlert('adminSlotRequestsAlert', res.message || 'Pengajuan slot tambahan berhasil ditolak.', 'success');
      await loadAdminSlotRequests();
    } catch (err) {
      const msg = err.errors?.admin_note?.[0] || err.message || 'Gagal menolak pengajuan slot tambahan.';
      api.showAlert('slotRejectAlert', msg, 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

function openAdminSlotRejectModal(requestId) {
  const modal = document.getElementById('adminSlotRejectModal');
  if (!modal) return;

  api.hideAlert('slotRejectAlert');
  const item = adminSlotRequestsCache.find(x => Number(x.id) === Number(requestId));
  const idInput = document.getElementById('slotRejectRequestId');
  const noteInput = document.getElementById('slotRejectAdminNote');
  const countEl = document.getElementById('slotRejectAdminNoteCount');
  const summaryEl = document.getElementById('slotRejectSummary');

  if (idInput) idInput.value = String(requestId);
  if (noteInput) noteInput.value = '';
  if (countEl) countEl.textContent = '0/500';
  if (summaryEl && item) {
    const docName = item.doctor?.name || `Dokter #${item.doctor_id}`;
    const startLabel = String(item.start_time || '').slice(0, 5);
    const endLabel = String(item.end_time || '').slice(0, 5);
    summaryEl.textContent = `Tolak usulan slot tambahan ${docName} pada ${api.formatDate(item.schedule_date)} (${startLabel} - ${endLabel} WIB).`;
  }

  showAdminModal(modal, noteInput);
}

function closeAdminSlotRejectModal() {
  hideAdminModal(document.getElementById('adminSlotRejectModal'));
}

window.openAdminSlotApproveModal = openAdminSlotApproveModal;
window.closeAdminSlotApproveModal = closeAdminSlotApproveModal;
window.openAdminSlotRejectModal = openAdminSlotRejectModal;
window.closeAdminSlotRejectModal = closeAdminSlotRejectModal;
