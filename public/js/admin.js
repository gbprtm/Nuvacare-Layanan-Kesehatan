let adminMasterPoli = [];
let adminDoctorsCatalog = [];
let adminAppointmentsCache = [];
let adminRequestsCache = [];
let activeAdminRequestId = null;

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

document.addEventListener('DOMContentLoaded', () => {
  if (!api.requireAuth('admin')) return;

  const currentUser = api.getUser();
  const userNameEl = document.getElementById('navAdminName');
  if (userNameEl && currentUser) {
    userNameEl.textContent = currentUser.name;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Keluar dari panel admin sekarang?')) {
        api.logout();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllAdminModals();
    }
  });

  initAdminBackdropAndCloseButtons();

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

  if (document.getElementById('poliForm') || document.getElementById('doctorForm')) {
    initMasterData();
  }
});

function closeAllAdminModals() {
  closeUpdateModal();
  closeAdminApproveModal();
  closeAdminRescheduleModal();
  closeAdminRejectModal();
  closeAuditLogModal();
  closeDoctorAccountModal();
}

function initAdminBackdropAndCloseButtons() {
  const modalIds = [
    'updateModal',
    'adminApproveModal',
    'adminRescheduleModal',
    'adminRejectModal',
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

async function initAppointmentManagement() {
  const filterDate = document.getElementById('filterDate');
  const filterStatus = document.getElementById('filterStatus');
  const filterType = document.getElementById('filterType');

  const urlParams = new URLSearchParams(window.location.search);
  if (filterDate && urlParams.get('date')) filterDate.value = urlParams.get('date');
  if (filterStatus && urlParams.get('status')) filterStatus.value = urlParams.get('status');
  if (filterType && urlParams.get('type')) filterType.value = urlParams.get('type');

  const onFilterChange = () => {
    const nextParams = new URLSearchParams();
    if (filterDate?.value) nextParams.set('date', filterDate.value);
    if (filterType?.value) nextParams.set('type', filterType.value);
    if (filterStatus?.value) nextParams.set('status', filterStatus.value);
    const qs = nextParams.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    loadAppointments();
  };

  if (filterDate) filterDate.addEventListener('change', onFilterChange);
  if (filterStatus) filterStatus.addEventListener('change', onFilterChange);
  if (filterType) filterType.addEventListener('change', onFilterChange);

  await loadAppointments();

  const updateForm = document.getElementById('updateForm');
  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('modalAlert');

      const id = document.getElementById('modalAppointmentId').value;
      const status = document.getElementById('modalStatus').value;
      const appointment_date = document.getElementById('modalDate')?.value || undefined;
      const appointment_time = document.getElementById('modalTime')?.value || undefined;
      const doctor_notes = document.getElementById('modalNotes').value.trim();
      const submitBtn = document.getElementById('modalSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';

        const res = await api.request(`/admin/janji-temu/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, appointment_date, appointment_time, doctor_notes })
        });

        closeUpdateModal();
        showAdminWhatsAppFeedback(res, 'adminListAlert');
        await loadAppointments();
        if (getAdminEl('adminRequestTableBody', 'adminRequestsTableBody', 'adminPendingReqBadge')) {
          await loadCancellationRequests();
        }
      } catch (err) {
        const msg = err.errors?.appointment_time?.[0] || err.message || 'Coba ulangi kembali.';
        api.showAlert('modalAlert', 'Gagal menyimpan perubahan: ' + msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan';
      }
    });
  }

  const scheduleControlForm = document.getElementById('scheduleControlForm');
  if (scheduleControlForm) {
    initScheduleControlForm();
  }
}

async function loadAppointments() {
  const tableBody = document.getElementById('adminAppointmentTableBody');
  const cardsEl = document.getElementById('adminAppointmentCards');
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
    const res = await api.request(`/admin/janji-temu?${params.toString()}`, { priority: 'high' });
    adminAppointmentsCache = res.data || [];

    if (adminAppointmentsCache.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-muted text-center" style="padding: var(--space-6);">Belum ada janji pada filter ini.</td></tr>';
      if (cardsEl) {
        cardsEl.innerHTML = '<div class="portal-state-box"><p class="text-muted">Belum ada janji pada filter ini.</p></div>';
      }
      return;
    }

    tableBody.innerHTML = adminAppointmentsCache.map(a => {
      const openReq = a.open_cancellation_request || a.open_request || null;
      const openReqBadge = openReq
        ? `<div class="mt-2"><span class="badge badge-diajukan">Ada pengajuan batal</span>${openReq.is_overdue ? ' <span class="badge badge-overdue-sla">[Lewat SLA]</span>' : ''}</div>`
        : '';

      return `
        <tr>
          <td>
            <strong>${escapeHtml(a.user?.name || '-')}</strong>
            <div class="text-muted text-sm">${escapeHtml(a.user?.phone_number || a.user?.email || '-')}</div>
          </td>
          <td>
            <strong>${escapeHtml(a.polyclinic?.name || '-')}</strong>
            <div class="text-muted text-sm">${escapeHtml(a.doctor?.name || '-')}</div>
          </td>
          <td>
            <strong>${escapeHtml(api.formatDate(a.appointment_date))}</strong>
            <div class="text-muted text-sm">Pukul ${escapeHtml(a.appointment_time || '09:00')} WIB</div>
          </td>
          <td><span class="badge badge-${escapeHtml(a.type)}">${a.type === 'kontrol_rutin' ? 'Kontrol rutin' : 'Janji baru'}</span></td>
          <td>
            <span class="badge badge-${escapeHtml(a.status)}">${escapeHtml(getStatusLabel(a.status))}</span>
            ${openReqBadge}
          </td>
          <td>
            ${a.complaint ? `<div><strong>Keluhan:</strong> ${escapeHtml(a.complaint)}</div>` : ''}
            ${a.doctor_notes ? `<div class="mt-2"><strong>Catatan:</strong> ${escapeHtml(a.doctor_notes)}</div>` : ''}
            ${!a.complaint && !a.doctor_notes ? '<span class="text-muted">-</span>' : ''}
          </td>
          <td>
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openUpdateModal(${a.id}, 'selesai')">Selesaikan</button>
              <button type="button" class="btn btn-danger btn-sm" onclick="openUpdateModal(${a.id}, 'dibatalkan')">Batalkan</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="prefillControlForAppointment(${a.id})">Buat jadwal kontrol</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="openAuditLogModal(${a.id})">Riwayat Log</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (cardsEl) {
      cardsEl.innerHTML = adminAppointmentsCache.map(a => {
        const openReq = a.open_cancellation_request || a.open_request || null;
        const openReqBadge = openReq
          ? `<span class="badge badge-diajukan">Ada pengajuan batal</span>${openReq.is_overdue ? '<span class="badge badge-overdue-sla">[Lewat SLA]</span>' : ''}`
          : '';

        return `
          <article class="mobile-data-card">
            <div class="mobile-data-card__head">
              <div>
                <strong>${escapeHtml(a.user?.name || '-')}</strong>
                <div class="text-muted text-sm">${escapeHtml(a.user?.phone_number || a.user?.email || '-')}</div>
              </div>
              <span class="badge badge-${escapeHtml(a.status)}">${escapeHtml(getStatusLabel(a.status))}</span>
            </div>
            <div class="mobile-data-card__meta">
              <div><strong>Poli &amp; Dokter:</strong> ${escapeHtml(a.polyclinic?.name || '-')} (${escapeHtml(a.doctor?.name || '-')})</div>
              <div><strong>Jadwal:</strong> ${escapeHtml(api.formatDate(a.appointment_date))}, Pukul ${escapeHtml(a.appointment_time || '09:00')} WIB</div>
              <div class="mobile-data-card__badges">
                <span class="badge badge-${escapeHtml(a.type)}">${a.type === 'kontrol_rutin' ? 'Kontrol rutin' : 'Janji baru'}</span>
                ${openReqBadge}
              </div>
              ${a.complaint ? `<div><strong>Keluhan:</strong> ${escapeHtml(a.complaint)}</div>` : ''}
              ${a.doctor_notes ? `<div><strong>Catatan:</strong> ${escapeHtml(a.doctor_notes)}</div>` : ''}
            </div>
            <div class="mobile-data-card__actions">
              <button type="button" class="btn btn-secondary btn-touch" onclick="openUpdateModal(${a.id}, 'selesai')">Selesaikan</button>
              <button type="button" class="btn btn-danger btn-touch" onclick="openUpdateModal(${a.id}, 'dibatalkan')">Batalkan</button>
              <button type="button" class="btn btn-secondary btn-touch" onclick="prefillControlForAppointment(${a.id})">Buat jadwal kontrol</button>
              <button type="button" class="btn btn-secondary btn-touch" onclick="openAuditLogModal(${a.id})">Riwayat Log</button>
            </div>
          </article>
        `;
      }).join('');
    }
  } catch {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
    if (cardsEl) {
      cardsEl.innerHTML = '<div class="portal-state-box portal-state-box--error"><p>Gagal memuat data. Coba muat ulang halaman.</p></div>';
    }
  }
}

function openUpdateModal(id, presetStatus = null) {
  const modal = document.getElementById('updateModal');
  if (!modal) return;
  const item = adminAppointmentsCache.find(x => x.id === id);
  api.hideAlert('modalAlert');
  document.getElementById('modalAppointmentId').value = id;
  document.getElementById('modalStatus').value = presetStatus || item?.status || 'terjadwal';
  const modalDate = document.getElementById('modalDate');
  const modalTime = document.getElementById('modalTime');
  if (modalDate) modalDate.value = item?.appointment_date || '';
  if (modalTime) modalTime.value = item?.appointment_time || '09:00';
  document.getElementById('modalNotes').value = item?.doctor_notes || '';
  showAdminModal(modal, document.getElementById('modalNotes'));
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
        <a href="${escapeHtml(wa.whatsapp_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
          Kirim via WhatsApp
        </a>
      </div>
    `;
  } else {
    alertEl.textContent = baseMsg;
  }

  alertEl.style.display = 'block';
}

function closeUpdateModal() {
  hideAdminModal(document.getElementById('updateModal'));
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

window.openUpdateModal = openUpdateModal;
window.closeUpdateModal = closeUpdateModal;
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
        (patientRes.data || []).map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.email)})</option>`).join('');
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
  const tabApptsBtn = document.getElementById('adminTabBtnAppointments');
  const tabReqsBtn = document.getElementById('adminTabBtnRequests');
  const apptsPanel = getAdminTabPanel(tabApptsBtn, ['adminTabAppointments', 'adminViewAppointments', 'adminAppointmentsView']);
  const reqsPanel = getAdminTabPanel(tabReqsBtn, ['adminTabRequests', 'adminViewRequests', 'adminRequestsView']);

  const showAppointments = tabName === 'appointments';

  if (tabApptsBtn) {
    tabApptsBtn.classList.toggle('is-active', showAppointments);
    if (!tabApptsBtn.classList.contains('portal-tab-btn')) {
      tabApptsBtn.classList.toggle('btn-primary', showAppointments);
      tabApptsBtn.classList.toggle('btn-secondary', !showAppointments);
    }
    tabApptsBtn.setAttribute('aria-selected', showAppointments ? 'true' : 'false');
  }
  if (tabReqsBtn) {
    tabReqsBtn.classList.toggle('is-active', !showAppointments);
    if (!tabReqsBtn.classList.contains('portal-tab-btn')) {
      tabReqsBtn.classList.toggle('btn-primary', !showAppointments);
      tabReqsBtn.classList.toggle('btn-secondary', showAppointments);
    }
    tabReqsBtn.setAttribute('aria-selected', !showAppointments ? 'true' : 'false');
  }
  if (apptsPanel) {
    apptsPanel.hidden = !showAppointments;
    apptsPanel.style.display = showAppointments ? '' : 'none';
  }
  if (reqsPanel) {
    reqsPanel.hidden = showAppointments;
    reqsPanel.style.display = showAppointments ? 'none' : '';
  }
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

  setAdminRequestsState(stateEl, tableWrap, cardsEl, tableBody, 'loading', 'Memuat daftar pengajuan pembatalan dokter…');

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

    if (adminRequestsCache.length === 0) {
      const emptyMsg = filterStatus === 'diajukan'
        ? 'Tidak ada pengajuan yang menunggu.'
        : 'Belum ada pengajuan pembatalan pada filter ini.';
      setAdminRequestsState(stateEl, tableWrap, cardsEl, tableBody, 'empty', emptyMsg);
      return;
    }

    hideAdminRequestsState(stateEl, tableWrap, cardsEl);
    renderAdminRequests(adminRequestsCache, tableBody, cardsEl);
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

function updateAdminPendingBadge(count) {
  const badge = document.getElementById('adminPendingReqBadge');
  if (!badge) return;
  const safeCount = Number.isFinite(count) ? count : 0;
  badge.textContent = String(safeCount);
  badge.hidden = safeCount === 0;
  badge.style.display = safeCount > 0 ? 'inline-flex' : 'none';
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
          <button type="button" class="btn btn-secondary admin-req-retry-btn">Coba lagi</button>
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
                  <button type="button" class="btn btn-danger btn-sm" onclick="openAdminApproveModal(${r.id})">Batalkan janji</button>
                  <button type="button" class="btn btn-primary btn-sm" onclick="openAdminRescheduleModal(${r.id})">Jadwalkan ulang</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="openAdminRejectModal(${r.id})">Tolak</button>
                `
                : ''}
              ${apptId ? `<button type="button" class="btn btn-secondary btn-sm" onclick="openAuditLogModal(${apptId})">Riwayat Log</button>` : ''}
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
          class="btn btn-sm ${s.time === timeSelect.value ? 'btn-primary' : 'btn-secondary'}"
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
    const admin_note = noteInput ? noteInput.value.trim() : '';

    if (admin_note.length < 5 || admin_note.length > 500) {
      api.showAlert(alertId, 'Catatan penolakan wajib diisi minimal 5 hingga 500 karakter.', 'danger');
      if (noteInput) noteInput.focus();
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Tolak Pengajuan';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';
      }

      const res = await api.request(`/admin/pengajuan-pembatalan/${reqId}/tolak`, {
        method: 'POST',
        body: JSON.stringify({ admin_note })
      });

      closeAdminRejectModal();
      const targetAlert = getAdminAlertId('adminRequestAlert', 'adminRequestsAlert', 'adminListAlert');
      api.showAlert(targetAlert, res.message || 'Pengajuan pembatalan berhasil ditolak.', 'success');
      await Promise.all([
        loadCancellationRequests(),
        loadAppointments()
      ]);
    } catch (err) {
      const msg = err.status === 409
        ? 'Pengajuan ini sudah ditindak oleh admin lain. Muat ulang untuk melihat hasilnya.'
        : (err.errors?.admin_note?.[0] || err.message || 'Gagal menolak pengajuan pembatalan.');
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

function openAdminRejectModal(requestId) {
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
  if (summaryEl && item) {
    const appt = item.appointment || {};
    summaryEl.textContent = `Tolak pengajuan dari ${item.doctor?.name || 'Dokter'} untuk janji ${appt.user?.name || appt.patient?.name || 'Pasien'} (${api.formatDate(appt.appointment_date)}). Janji temu tetap berstatus terjadwal.`;
  }

  showAdminModal(modal, noteInput);
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
        <button type="button" class="btn btn-secondary btn-sm" onclick="openAuditLogModal(${appointmentId})">Coba lagi</button>
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
        btn.textContent = 'Menyimpan…';

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
        btn.textContent = 'Menyimpan…';

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

async function loadMasterDataList() {
  const poliListEl = document.getElementById('poliTableBody');
  const docPoliSelect = document.getElementById('docPoliId');

  try {
    const [poliRes, adminDoctorsRes] = await Promise.all([
      api.request('/master-poli', { priority: 'high' }),
      api.request('/admin/dokter', { priority: 'high' }).catch(() => null)
    ]);

    const polis = poliRes.data || [];
    adminDoctorsCatalog = Array.isArray(adminDoctorsRes?.data) ? adminDoctorsRes.data : [];
    const doctorById = new Map(adminDoctorsCatalog.map(d => [Number(d.id), d]));

    if (docPoliSelect) {
      docPoliSelect.innerHTML = '<option value="">Pilih poliklinik…</option>' +
        polis.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }

    if (poliListEl) {
      if (polis.length === 0) {
        poliListEl.innerHTML = '<tr><td colspan="3" class="text-muted text-center" style="padding: var(--space-6);">Belum ada poli/dokter.</td></tr>';
        return;
      }

      poliListEl.innerHTML = polis.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td>${escapeHtml(p.description || '-')}</td>
          <td>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3);">
              ${(p.doctors || []).length > 0
                ? p.doctors.map(rawDoc => {
                  const merged = { ...rawDoc, ...(doctorById.get(Number(rawDoc.id)) || {}) };
                  const hasAccount = Boolean(merged.user_id || merged.user || merged.account_email || merged.has_account);
                  const accountEmail = merged.user?.email || merged.account_email || '';
                  const isAccessEnabled = hasAccount && !(merged.user?.disabled_at || merged.disabled_at || merged.access_enabled === false);

                  const accountBadgeHtml = hasAccount
                    ? `<span class="badge ${isAccessEnabled ? 'badge-selesai' : 'badge-dibatalkan'}">${isAccessEnabled ? 'Akun Aktif' : 'Akses Nonaktif'}</span>`
                    : '<span class="badge badge-janji_baru">Belum Punya Akun</span>';

                  const accountActionHtml = hasAccount
                    ? `<button type="button" class="btn btn-secondary btn-sm" onclick="toggleDoctorAccountAccess(${merged.id}, ${!isAccessEnabled})">${isAccessEnabled ? 'Nonaktifkan Akses' : 'Aktifkan Akses'}</button>`
                    : `<button type="button" class="btn btn-primary btn-sm" onclick="openDoctorAccountModal(${merged.id}, '${escapeJsString(merged.name)}')">Buat Akun</button>`;

                  return `
                    <li style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; padding-bottom: var(--space-2); border-bottom: 1px solid var(--color-line);">
                      <div>
                        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2);">
                          <strong>${escapeHtml(merged.name)}</strong>
                          <span class="badge ${merged.is_active ? 'badge-selesai' : 'badge-dibatalkan'}">
                            ${merged.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                          ${accountBadgeHtml}
                        </div>
                        ${accountEmail ? `<div class="text-muted text-sm">${escapeHtml(accountEmail)}</div>` : ''}
                      </div>
                      <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="toggleDoctorStatus(${merged.id}, ${!merged.is_active})">
                          ${merged.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        ${accountActionHtml}
                      </div>
                    </li>
                  `;
                }).join('')
                : '<li class="text-muted">Belum ada poli/dokter.</li>'
              }
            </ul>
          </td>
        </tr>
      `).join('');
    }
  } catch {
    if (poliListEl) {
      poliListEl.innerHTML = '<tr><td colspan="3" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
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
