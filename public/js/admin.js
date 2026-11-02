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
      if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
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

async function initAppointmentManagement() {
  const filterDate = document.getElementById('filterDate');
  const filterStatus = document.getElementById('filterStatus');
  const filterType = document.getElementById('filterType');

  if (filterDate) {
    filterDate.addEventListener('change', () => loadAppointments());
  }
  if (filterStatus) {
    filterStatus.addEventListener('change', () => loadAppointments());
  }
  if (filterType) {
    filterType.addEventListener('change', () => loadAppointments());
  }

  await loadAppointments();

  const updateForm = document.getElementById('updateForm');
  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('modalAlert');

      const id = document.getElementById('modalAppointmentId').value;
      const status = document.getElementById('modalStatus').value;
      const doctor_notes = document.getElementById('modalNotes').value.trim();
      const submitBtn = document.getElementById('modalSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        await api.request(`/admin/janji-temu/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, doctor_notes })
        });

        closeUpdateModal();
        await loadAppointments();
      } catch (err) {
        api.showAlert('modalAlert', 'Gagal memperbarui janji: ' + (err.message || 'Terjadi kesalahan sistem'), 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Perubahan';
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
    const res = await api.request(`/admin/janji-temu?${params.toString()}`);
    const items = res.data || [];

    if (items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center; padding: 2rem;">Tidak ada data janji temu yang sesuai filter.</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map(a => `
      <tr>
        <td>#${a.id}</td>
        <td><strong>${escapeHtml(a.appointment_date)}</strong><br><small class="text-muted">${a.type === 'kontrol_rutin' ? 'Kontrol Rutin' : 'Janji Baru'}</small></td>
        <td><strong>${escapeHtml(a.user?.name || '-')}</strong><br><small class="text-muted">${escapeHtml(a.user?.phone_number || a.user?.email || '-')}</small></td>
        <td>${escapeHtml(a.polyclinic?.name || '-')}<br><small class="text-muted">${escapeHtml(a.doctor?.name || '-')}</small></td>
        <td>
          <div style="max-width: 220px; font-size: 0.85rem; line-height: 1.4;">
            ${a.complaint ? `<div><strong>Keluhan:</strong> ${escapeHtml(a.complaint)}</div>` : ''}
            ${a.doctor_notes ? `<div style="color:var(--color-primary); margin-top: 0.2rem;"><strong>Catatan:</strong> ${escapeHtml(a.doctor_notes)}</div>` : ''}
          </div>
        </td>
        <td><span class="badge badge-${a.status}">${getStatusLabel(a.status)}</span></td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openUpdateModal(${a.id}, '${a.status}', '${escapeHtmlAttr(a.doctor_notes || '')}')">Kelola</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="color:var(--color-danger); text-align:center; padding: 1.5rem;">Gagal memuat: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function openUpdateModal(id, status, notes) {
  const modal = document.getElementById('updateModal');
  if (!modal) return;
  api.hideAlert('modalAlert');
  document.getElementById('modalAppointmentId').value = id;
  document.getElementById('modalStatus').value = status;
  document.getElementById('modalNotes').value = notes;
  modal.style.display = 'flex';

  setTimeout(() => {
    document.getElementById('modalStatus').focus();
  }, 50);
}

function closeUpdateModal() {
  const modal = document.getElementById('updateModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

window.openUpdateModal = openUpdateModal;
window.closeUpdateModal = closeUpdateModal;

async function initScheduleControlForm() {
  try {
    const patientRes = await api.request('/admin/pasien');
    const patientSelect = document.getElementById('controlPatientId');
    if (patientSelect) {
      patientSelect.innerHTML = '<option value="">-- Pilih Pasien --</option>' +
        (patientRes.data || []).map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.email)})</option>`).join('');
    }

    const poliRes = await api.request('/master-poli');
    adminMasterPoli = poliRes.data || [];

    const poliSelect = document.getElementById('controlPoliId');
    const doctorSelect = document.getElementById('controlDoctorId');

    if (poliSelect && doctorSelect) {
      poliSelect.innerHTML = '<option value="">-- Pilih Poliklinik --</option>' +
        adminMasterPoli.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

      poliSelect.addEventListener('change', () => {
        const pId = parseInt(poliSelect.value, 10);
        doctorSelect.innerHTML = '<option value="">-- Pilih Dokter --</option>';
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
      const doctor_notes = document.getElementById('controlNotes').value.trim();

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menetapkan Jadwal...';

        await api.request('/admin/jadwal-kontrol', {
          method: 'POST',
          body: JSON.stringify({
            user_id: parseInt(user_id, 10),
            polyclinic_id: parseInt(polyclinic_id, 10),
            doctor_id: parseInt(doctor_id, 10),
            appointment_date,
            doctor_notes
          })
        });

        api.showAlert('controlAlert', 'Jadwal kontrol rutin berhasil ditetapkan.', 'success');
        form.reset();
        doctorSelect.disabled = true;
        await loadAppointments();
      } catch (err) {
        api.showAlert('controlAlert', 'Gagal membuat jadwal kontrol: ' + err.message, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tetapkan Jadwal Kontrol';
      }
    });

  } catch (err) {
    console.error('Error init control form:', err);
  }
}

async function initMasterData() {
  await loadMasterDataList();

  const poliForm = document.getElementById('poliForm');
  if (poliForm) {
    poliForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('poliAlert');
      const name = document.getElementById('poliName').value.trim();
      const description = document.getElementById('poliDesc').value.trim();
      const btn = poliForm.querySelector('button[type="submit"]');

      try {
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        await api.request('/admin/poli', {
          method: 'POST',
          body: JSON.stringify({ name, description })
        });
        api.showAlert('poliAlert', 'Poliklinik berhasil ditambahkan!', 'success');
        poliForm.reset();
        await loadMasterDataList();
      } catch (err) {
        api.showAlert('poliAlert', err.message || 'Gagal menambah poliklinik.', 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Tambah Poli';
      }
    });
  }

  const doctorForm = document.getElementById('doctorForm');
  if (doctorForm) {
    doctorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('doctorAlert');
      const polyclinic_id = document.getElementById('docPoliId').value;
      const name = document.getElementById('docName').value.trim();
      const btn = doctorForm.querySelector('button[type="submit"]');

      try {
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        await api.request('/admin/dokter', {
          method: 'POST',
          body: JSON.stringify({ polyclinic_id: parseInt(polyclinic_id, 10), name, is_active: true })
        });
        api.showAlert('doctorAlert', 'Dokter berhasil ditambahkan!', 'success');
        doctorForm.reset();
        await loadMasterDataList();
      } catch (err) {
        api.showAlert('doctorAlert', err.message || 'Gagal menambah dokter.', 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Tambah Dokter';
      }
    });
  }
}

async function loadMasterDataList() {
  const poliListEl = document.getElementById('poliTableBody');
  const docPoliSelect = document.getElementById('docPoliId');

  try {
    const res = await api.request('/master-poli');
    const polis = res.data || [];

    if (docPoliSelect) {
      docPoliSelect.innerHTML = '<option value="">-- Pilih Poliklinik --</option>' +
        polis.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }

    if (poliListEl) {
      if (polis.length === 0) {
        poliListEl.innerHTML = '<tr><td colspan="3" class="text-muted" style="text-align:center; padding: 1.5rem;">Belum ada poliklinik terdaftar.</td></tr>';
        return;
      }

      poliListEl.innerHTML = polis.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td>${escapeHtml(p.description || '-')}</td>
          <td>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
              ${(p.doctors || []).length > 0
                ? p.doctors.map(d => `
                  <li style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
                    <span>
                      ${escapeHtml(d.name)}
                      <span class="badge ${d.is_active ? 'badge-selesai' : 'badge-dibatalkan'}" style="margin-left: 0.35rem;">
                        ${d.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </span>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="toggleDoctorStatus(${d.id}, ${!d.is_active})">
                      ${d.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </li>
                `).join('')
                : '<li class="text-muted">Belum ada dokter</li>'
              }
            </ul>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    if (poliListEl) poliListEl.innerHTML = `<tr><td colspan="3" style="color:var(--color-danger); text-align:center;">Gagal: ${escapeHtml(err.message)}</td></tr>`;
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

function escapeHtmlAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
