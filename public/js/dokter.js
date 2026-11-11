let doctorAppointmentsCache = [];
let doctorRequestsCache = [];
let selectedDoctorAppointmentId = null;
let pendingWithdrawRequestId = null;
let batchPreviewSeq = 0;

function getDoctorEl(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!api.requireAuth('dokter')) return;

  const initialUser = api.getUser();
  syncDoctorHeader(initialUser);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Keluar dari portal dokter sekarang?')) {
        api.logout();
      }
    });
  }

  initDoctorTabs();
  initDoctorFilters();
  initDoctorModals();
  setupDoctorEscapeHandler();

  await syncDoctorUserFromServer();
  await Promise.all([
    loadDoctorAppointments(),
    loadDoctorRequests()
  ]);
});

function syncDoctorHeader(userObj) {
  if (!userObj) return;
  const nameEl = document.getElementById('navDoctorName');
  const poliEl = document.getElementById('navDoctorPoli');

  const doctorName = userObj.doctor?.name || userObj.name || '';
  const poliName =
    userObj.doctor?.polyclinic?.name ||
    userObj.polyclinic?.name ||
    userObj.polyclinic_name ||
    '';

  if (nameEl && doctorName) {
    nameEl.textContent = doctorName;
  }
  if (poliEl && poliName) {
    poliEl.textContent = poliName;
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

  if (tabAppointmentsBtn) {
    tabAppointmentsBtn.addEventListener('click', () => switchDoctorTab('appointments'));
  }
  if (tabRequestsBtn) {
    tabRequestsBtn.addEventListener('click', () => {
      switchDoctorTab('requests');
      loadDoctorRequests();
    });
  }
}

function switchDoctorTab(tabName) {
  const tabAppointmentsBtn = document.getElementById('tabBtnAppointments');
  const tabRequestsBtn = document.getElementById('tabBtnRequests');
  const viewAppointments = document.getElementById('viewAppointments');
  const viewRequests = document.getElementById('viewRequests');

  const isAppointments = tabName === 'appointments';

  if (tabAppointmentsBtn) {
    tabAppointmentsBtn.classList.toggle('is-active', isAppointments);
    tabAppointmentsBtn.setAttribute('aria-selected', isAppointments ? 'true' : 'false');
  }
  if (tabRequestsBtn) {
    tabRequestsBtn.classList.toggle('is-active', !isAppointments);
    tabRequestsBtn.setAttribute('aria-selected', !isAppointments ? 'true' : 'false');
  }
  if (viewAppointments) {
    viewAppointments.hidden = !isAppointments;
    viewAppointments.style.display = isAppointments ? '' : 'none';
  }
  if (viewRequests) {
    viewRequests.hidden = isAppointments;
    viewRequests.style.display = isAppointments ? 'none' : '';
  }
}

function initDoctorFilters() {
  const dateFrom = document.getElementById('filterDocDateFrom');
  const dateTo = document.getElementById('filterDocDateTo');
  const statusSelect = document.getElementById('filterDocStatus');
  const refreshApptsBtn = document.getElementById('refreshDocAppointmentsBtn');

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

  if (statusSelect) {
    statusSelect.addEventListener('change', loadDoctorAppointments);
  }
  if (refreshApptsBtn) {
    refreshApptsBtn.addEventListener('click', loadDoctorAppointments);
  }

  const reqStatusFilter = getDoctorEl('filterReqStatus', 'filterDocReqStatus', 'filterRequestStatus');
  if (reqStatusFilter) {
    reqStatusFilter.addEventListener('change', loadDoctorRequests);
  }

  const refreshRequestsBtn = document.getElementById('refreshDocRequestsBtn');
  if (refreshRequestsBtn) {
    refreshRequestsBtn.addEventListener('click', loadDoctorRequests);
  }
}

async function loadDoctorAppointments() {
  const stateEl = document.getElementById('doctorAppointmentsState');
  const tableBody = document.getElementById('doctorAppointmentsBody');
  const cardsEl = document.getElementById('doctorAppointmentsCards');
  const tableWrap = document.getElementById('doctorAppointmentsTableWrap') || (tableBody ? tableBody.closest('.table-responsive') : null);

  if (tableWrap && cardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }

  setDoctorListState(stateEl, tableWrap, cardsEl, 'loading', 'Memuat jadwal janji temu…');

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
      if (poliEl && (!poliEl.textContent || poliEl.textContent === '-')) {
        const firstPoli = doctorAppointmentsCache[0]?.polyclinic?.name;
        if (firstPoli) poliEl.textContent = firstPoli;
      }
    }

    if (doctorAppointmentsCache.length === 0) {
      setDoctorListState(stateEl, tableWrap, cardsEl, 'empty', 'Belum ada janji pada rentang ini.');
      resetDoctorDetailPanel();
      return;
    }

    hideDoctorListState(stateEl, tableWrap, cardsEl);
    renderDoctorAppointments(doctorAppointmentsCache, tableBody, cardsEl);

    if (selectedDoctorAppointmentId && doctorAppointmentsCache.some((item) => item.id === selectedDoctorAppointmentId)) {
      await selectDoctorAppointment(selectedDoctorAppointmentId, { scrollToDetail: false });
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
        <button type="button" class="btn btn-secondary portal-retry-btn">Coba lagi</button>
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
        ? '<div class="mt-2"><span class="badge badge-diajukan">Pengajuan menunggu</span></div>'
        : '';

      return `
        <tr data-appointment-id="${a.id}" class="doctor-row ${isSelected ? 'is-selected' : ''}">
          <td>
            <strong>${escapeHtml(api.formatDate(a.appointment_date))}</strong>
            <div class="text-muted text-sm">${escapeHtml(a.appointment_time || '09:00')} WIB</div>
          </td>
          <td>
            <strong>${escapeHtml(patientName)}</strong>
            <div class="text-muted text-sm">${escapeHtml(maskedPhone)}</div>
          </td>
          <td>
            <span>${escapeHtml(poliName)}</span>
            <div class="mt-2"><span class="badge badge-${escapeHtml(a.type)}">${escapeHtml(getAppointmentTypeLabel(a.type))}</span></div>
          </td>
          <td>
            <span class="badge badge-${escapeHtml(a.status)}">${escapeHtml(getAppointmentStatusLabel(a.status))}</span>
            ${openBadge}
          </td>
          <td>
            <button type="button" class="btn btn-secondary btn-touch" data-view-detail-id="${a.id}">
              Lihat rincian
            </button>
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
            <div><strong>Jadwal:</strong> ${escapeHtml(api.formatDate(a.appointment_date))}, ${escapeHtml(a.appointment_time || '09:00')} WIB</div>
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
  if (emptyEl) {
    emptyEl.hidden = false;
    emptyEl.style.display = '';
  }
  if (contentEl) {
    contentEl.hidden = true;
    contentEl.style.display = 'none';
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
  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.style.display = 'none';
  }
  if (contentEl) {
    contentEl.hidden = false;
    contentEl.style.display = '';
  }

  try {
    const res = await api.request(`/dokter/janji-temu/${appointmentId}`, { priority: 'high' });
    const d = res.data || res;
    renderDoctorDetailPanel(d);

    if (options.scrollToDetail) {
      const panel = getDoctorEl('appointmentDetailPanel', 'doctorDetailPanel') || contentEl;
      if (panel && window.innerWidth <= 900 && typeof panel.scrollIntoView === 'function') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  } catch (err) {
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

  const reqCancelBtn = document.getElementById('detailRequestCancelBtn');
  const hintEl = document.getElementById('detailEligibilityHint');

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

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      closeDoctorModal(document.getElementById(targetId));
    });
  });

  ['singleCancelModal', 'batchCancelModal', 'withdrawConfirmModal'].forEach((modalId) => {
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
    const modalIds = ['withdrawConfirmModal', 'batchCancelModal', 'singleCancelModal'];
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

async function loadDoctorRequests() {
  const stateEl = document.getElementById('doctorRequestsState');
  const tableBody = document.getElementById('doctorRequestsBody');
  const cardsEl = document.getElementById('doctorRequestsCards');
  const tableWrap = tableBody ? tableBody.closest('.table-responsive') : null;

  if (tableWrap && cardsEl) {
    tableWrap.classList.add('has-mobile-cards');
  }

  setDoctorListState(stateEl, tableWrap, cardsEl, 'loading', 'Memuat daftar pengajuan pembatalan…');

  const reqStatusFilter = getDoctorEl('filterReqStatus', 'filterDocReqStatus', 'filterRequestStatus');
  const statusVal = reqStatusFilter ? reqStatusFilter.value : '';

  const params = new URLSearchParams();
  if (statusVal) params.set('status', statusVal);

  try {
    const query = params.toString();
    const res = await api.request(`/dokter/pengajuan-pembatalan${query ? `?${query}` : ''}`, { priority: 'high' });
    doctorRequestsCache = Array.isArray(res.data) ? res.data : [];

    updateDoctorRequestTabBadge(doctorRequestsCache, statusVal);

    if (doctorRequestsCache.length === 0) {
      setDoctorListState(stateEl, tableWrap, cardsEl, 'empty', 'Belum ada pengajuan pembatalan.');
      return;
    }

    hideDoctorListState(stateEl, tableWrap, cardsEl);
    renderDoctorRequests(doctorRequestsCache, tableBody, cardsEl);
  } catch {
    setDoctorListState(stateEl, tableWrap, cardsEl, 'error', 'Gagal memuat data. Coba lagi.', loadDoctorRequests);
  }
}

async function updateDoctorRequestTabBadge(items, currentFilter = '') {
  const badgeEl = getDoctorEl('openRequestNavCount', 'doctorRequestsBadge');
  if (!badgeEl) return;

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

  badgeEl.textContent = String(pendingCount);
  badgeEl.hidden = pendingCount === 0;
  badgeEl.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
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
