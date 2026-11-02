document.addEventListener('DOMContentLoaded', () => {
  if (!api.requireAuth('pasien')) return;

  const currentUser = api.getUser();
  const userNameEl = document.getElementById('navUserName');
  if (userNameEl && currentUser) {
    userNameEl.textContent = currentUser.name;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        api.logout();
      }
    });
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    loadProfile();

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('profileAlert');

      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const name = document.getElementById('name').value.trim();
      const phone_number = document.getElementById('phone_number').value.trim();
      const birth_date = document.getElementById('birth_date').value;
      const address = document.getElementById('address').value.trim();
      const passwordInput = document.getElementById('password');
      const passwordConfirmInput = document.getElementById('password_confirmation');
      const password = passwordInput ? passwordInput.value : '';
      const password_confirmation = passwordConfirmInput ? passwordConfirmInput.value : '';

      if (password && password.length < 8) {
        api.showAlert('profileAlert', 'Kata sandi baru minimal 8 karakter.', 'danger');
        return;
      }

      if (password && password !== password_confirmation) {
        api.showAlert('profileAlert', 'Konfirmasi kata sandi baru tidak cocok.', 'danger');
        return;
      }

      const payload = { name, phone_number, birth_date, address };
      if (password) {
        payload.password = password;
        payload.password_confirmation = password_confirmation;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        const res = await api.request('/profil', {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });

        const updatedUser = { ...currentUser, name: res.data.name };
        api.setUser(updatedUser);
        if (userNameEl) userNameEl.textContent = res.data.name;
        if (passwordInput) passwordInput.value = '';
        if (passwordConfirmInput) passwordConfirmInput.value = '';

        api.showAlert('profileAlert', res.message || 'Profil berhasil diperbarui.', 'success');
      } catch (err) {
        const msg =
          err.errors?.password?.[0] ||
          err.errors?.birth_date?.[0] ||
          err.errors?.name?.[0] ||
          err.message ||
          'Gagal memperbarui profil.';
        api.showAlert('profileAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Perubahan';
      }
    });
  }

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    initBookingPage();
  }

  if (document.getElementById('historyTableBody')) {
    loadExaminationHistory();
  }

  if (document.getElementById('controlTableBody')) {
    loadControlSchedules();
  }
});

async function loadProfile() {
  try {
    const res = await api.request('/profil');
    const user = res.data;

    document.getElementById('email').value = user.email || '';
    document.getElementById('name').value = user.name || '';
    document.getElementById('phone_number').value = user.phone_number || '';
    document.getElementById('birth_date').value = user.birth_date || '';
    document.getElementById('address').value = user.address || '';
  } catch (err) {
    api.showAlert('profileAlert', 'Gagal memuat profil: ' + err.message, 'danger');
  }
}

let poliData = [];

async function initBookingPage() {
  try {
    const masterRes = await api.request('/master-poli');
    poliData = masterRes.data || [];

    const poliSelect = document.getElementById('polyclinic_id');
    const doctorSelect = document.getElementById('doctor_id');

    poliSelect.innerHTML = '<option value="">-- Pilih Poliklinik --</option>';
    poliData.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      poliSelect.appendChild(opt);
    });

    poliSelect.addEventListener('change', () => {
      const selectedId = parseInt(poliSelect.value, 10);
      doctorSelect.innerHTML = '<option value="">-- Pilih Dokter --</option>';

      if (!selectedId) {
        doctorSelect.disabled = true;
        return;
      }

      const poli = poliData.find((p) => p.id === selectedId);
      const activeDoctors = poli ? (poli.doctors || []).filter((d) => d.is_active) : [];

      if (activeDoctors.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Tidak ada dokter yang aktif di poli ini';
        doctorSelect.appendChild(opt);
        doctorSelect.disabled = true;
        return;
      }

      activeDoctors.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        doctorSelect.appendChild(opt);
      });
      doctorSelect.disabled = false;
    });

    const dateInput = document.getElementById('appointment_date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }

    await loadPatientAppointments();

    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('bookingAlert');

      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      const polyclinic_id = poliSelect.value;
      const doctor_id = doctorSelect.value;
      const appointment_date = dateInput.value;
      const complaint = document.getElementById('complaint').value.trim();

      if (!polyclinic_id || !doctor_id || !appointment_date || !complaint) {
        api.showAlert('bookingAlert', 'Mohon lengkapi semua kolom yang wajib diisi.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Membuat Janji...';

        const res = await api.request('/janji-temu', {
          method: 'POST',
          body: JSON.stringify({
            polyclinic_id: parseInt(polyclinic_id, 10),
            doctor_id: parseInt(doctor_id, 10),
            appointment_date,
            complaint
          })
        });

        api.showAlert('bookingAlert', res.message || 'Janji temu berhasil dibuat.', 'success');
        bookingForm.reset();
        doctorSelect.innerHTML = '<option value="">-- Pilih Poli Terlebih Dahulu --</option>';
        doctorSelect.disabled = true;
        dateInput.value = new Date().toISOString().split('T')[0];

        await loadPatientAppointments();
      } catch (err) {
        const msg =
          err.errors?.doctor_id?.[0] ||
          err.errors?.complaint?.[0] ||
          err.errors?.appointment_date?.[0] ||
          err.message ||
          'Gagal membuat janji temu.';
        api.showAlert('bookingAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ajukan Janji Temu';
      }
    });

  } catch (err) {
    api.showAlert('bookingAlert', 'Gagal memuat form booking: ' + err.message, 'danger');
  }
}

async function loadPatientAppointments() {
  const tableBody = document.getElementById('appointmentTableBody');
  if (!tableBody) return;

  try {
    const res = await api.request('/janji-temu');
    const appointments = res.data || [];

    if (appointments.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center; padding: 1.5rem;">Belum ada janji temu.</td></tr>';
      return;
    }

    tableBody.innerHTML = appointments.map(a => `
      <tr>
        <td><strong>${escapeHtml(a.appointment_date)}</strong></td>
        <td>${escapeHtml(a.polyclinic?.name || '-')}</td>
        <td>${escapeHtml(a.doctor?.name || '-')}</td>
        <td>${escapeHtml(a.complaint || '-')}</td>
        <td><span class="badge badge-${a.status}">${getStatusLabel(a.status)}</span></td>
        <td>${escapeHtml(a.doctor_notes || '-')}</td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Gagal memuat riwayat: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadExaminationHistory() {
  const tableBody = document.getElementById('historyTableBody');
  if (!tableBody) return;

  try {
    const res = await api.request('/riwayat-pemeriksaan');
    const items = res.data || [];

    if (items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align:center; padding: 2rem;">Belum ada riwayat pemeriksaan yang selesai.</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map(a => `
      <tr>
        <td><strong>${escapeHtml(a.appointment_date)}</strong></td>
        <td>${escapeHtml(a.polyclinic?.name || '-')}</td>
        <td>${escapeHtml(a.doctor?.name || '-')}</td>
        <td>${escapeHtml(a.complaint || '-')}</td>
        <td>
          <div style="background-color: var(--color-bg); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid var(--color-accent);">
            ${escapeHtml(a.doctor_notes || 'Tidak ada catatan khusus dari dokter.')}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Gagal memuat riwayat: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadControlSchedules() {
  const tableBody = document.getElementById('controlTableBody');
  if (!tableBody) return;

  try {
    const res = await api.request('/jadwal-kontrol');
    const items = res.data || [];

    if (items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align:center; padding: 2rem;">Tidak ada jadwal kontrol rutin yang perlu dihadiri saat ini.</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map(a => `
      <tr>
        <td><strong style="color:var(--color-primary);">${escapeHtml(a.appointment_date)}</strong></td>
        <td>${escapeHtml(a.polyclinic?.name || '-')}</td>
        <td>${escapeHtml(a.doctor?.name || '-')}</td>
        <td>${escapeHtml(a.doctor_notes || 'Kontrol evaluasi rutin')}</td>
        <td><span class="badge badge-terjadwal">Wajib Hadir</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Gagal memuat jadwal kontrol: ${escapeHtml(err.message)}</td></tr>`;
  }
}

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
