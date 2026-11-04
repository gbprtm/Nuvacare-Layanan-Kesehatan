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
      closeUpdateModal();
    }
  });

  if (document.getElementById('adminAppointmentTableBody')) {
    initAppointmentManagement();
  }

  if (document.getElementById('poliForm') || document.getElementById('doctorForm')) {
    initMasterData();
  }
});

let adminMasterPoli = [];
let adminAppointmentsCache = [];

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
        showAdminWhatsAppFeedback(res);
        await loadAppointments();
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
  if (!tableBody) return;

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
      return;
    }

    tableBody.innerHTML = adminAppointmentsCache.map(a => `
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
        <td><span class="badge badge-${a.type}">${a.type === 'kontrol_rutin' ? 'Kontrol rutin' : 'Janji baru'}</span></td>
        <td><span class="badge badge-${a.status}">${getStatusLabel(a.status)}</span></td>
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
          </div>
        </td>
      </tr>
    `).join('');
  } catch {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
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
  modal.style.display = 'flex';

  setTimeout(() => {
    document.getElementById('modalNotes').focus();
  }, 50);
}

function showAdminWhatsAppFeedback(res) {
  const alertEl = document.getElementById('adminListAlert');
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
  const modal = document.getElementById('updateModal');
  if (modal) {
    modal.style.display = 'none';
  }
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
      dateInput.min = new Date().toISOString().split('T')[0];
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

async function initMasterData() {
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
    const res = await api.request('/master-poli', { priority: 'high' });
    const polis = res.data || [];

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
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2);">
              ${(p.doctors || []).length > 0
                ? p.doctors.map(d => `
                  <li style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap;">
                    <span>
                      ${escapeHtml(d.name)}
                      <span class="badge ${d.is_active ? 'badge-selesai' : 'badge-dibatalkan'}" style="margin-left: var(--space-2);">
                        ${d.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </span>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="toggleDoctorStatus(${d.id}, ${!d.is_active})">
                      ${d.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </li>
                `).join('')
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

function getStatusLabel(status) {
  switch (status) {
    case 'terjadwal': return 'Terjadwal';
    case 'selesai': return 'Selesai';
    case 'dibatalkan': return 'Dibatalkan';
    default: return status;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
