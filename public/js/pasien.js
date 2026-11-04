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
      if (confirm('Keluar dari akunmu sekarang?')) {
        api.logout();
      }
    });
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    const birthDateInput = document.getElementById('birth_date');
    if (birthDateInput) {
      birthDateInput.max = new Date().toISOString().split('T')[0];
    }

    loadProfile();

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('profileAlert');

      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const nameInput = document.getElementById('name');
      const name = nameInput.value.trim();
      const phone_number = document.getElementById('phone_number').value.trim();
      const birth_date = document.getElementById('birth_date').value;
      const address = document.getElementById('address').value.trim();
      const passwordInput = document.getElementById('password');
      const passwordConfirmInput = document.getElementById('password_confirmation');
      const password = passwordInput ? passwordInput.value : '';
      const password_confirmation = passwordConfirmInput ? passwordConfirmInput.value : '';

      if (!name) {
        api.showAlert('profileAlert', 'Nama lengkap wajib diisi.', 'danger');
        nameInput.focus();
        return;
      }

      if (password && password.length < 8) {
        api.showAlert('profileAlert', 'Kata sandi baru minimal 8 karakter.', 'danger');
        passwordInput.focus();
        return;
      }

      if (password && password !== password_confirmation) {
        api.showAlert('profileAlert', 'Konfirmasi kata sandi baru tidak cocok. Ketik ulang kata sandimu.', 'danger');
        passwordConfirmInput.focus();
        return;
      }

      const payload = { name, phone_number, birth_date: birth_date || null, address };
      if (password) {
        payload.password = password;
        payload.password_confirmation = password_confirmation;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';

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
          'Gagal memperbarui profil. Periksa kembali isianmu.';
        api.showAlert('profileAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan profil';
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
    const res = await api.request('/profil', { priority: 'high' });
    const user = res.data;

    document.getElementById('email').value = user.email || '';
    document.getElementById('name').value = user.name || '';
    document.getElementById('phone_number').value = user.phone_number || '';
    document.getElementById('birth_date').value = user.birth_date || '';
    document.getElementById('address').value = user.address || '';
  } catch (err) {
    api.showAlert('profileAlert', 'Gagal memuat profil. Coba muat ulang halaman. (' + err.message + ')', 'danger');
  }
}

let poliData = [];

async function initBookingPage() {
  try {
    const [masterRes] = await Promise.all([
      api.request('/master-poli', { priority: 'high' }),
      loadPatientAppointments()
    ]);
    poliData = masterRes.data || [];

    const poliSelect = document.getElementById('polyclinic_id');
    const doctorSelect = document.getElementById('doctor_id');
    const dateInput = document.getElementById('appointment_date');
    const timeSelect = document.getElementById('appointment_time');

    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }

    const refreshAvailableSlots = async () => {
      if (!timeSelect) return;
      const docId = doctorSelect.value;
      const dateVal = dateInput.value;

      if (!docId || !dateVal) {
        timeSelect.innerHTML = '<option value="">Pilih dokter dan tanggal terlebih dahulu…</option>';
        timeSelect.disabled = true;
        return;
      }

      timeSelect.innerHTML = '<option value="">Memeriksa ketersediaan slot…</option>';
      timeSelect.disabled = true;

      try {
        const slotRes = await api.request(
          `/slot-tersedia?doctor_id=${encodeURIComponent(docId)}&date=${encodeURIComponent(dateVal)}`,
          { priority: 'high' }
        );
        const slots = slotRes.data || [];
        const hasAvailable = slots.some((s) => s.available);

        if (!hasAvailable) {
          timeSelect.innerHTML = '<option value="">Semua slot penuh pada tanggal ini, pilih tanggal lain</option>';
          timeSelect.disabled = true;
          return;
        }

        timeSelect.innerHTML = '<option value="">Pilih jam kunjungan…</option>';
        slots.forEach((s) => {
          const opt = document.createElement('option');
          opt.value = s.time;
          opt.disabled = !s.available;
          opt.textContent = s.available ? `${s.time} WIB (Tersedia)` : `${s.time} WIB (Sudah dipesan)`;
          timeSelect.appendChild(opt);
        });
        timeSelect.disabled = false;
      } catch {
        timeSelect.innerHTML = '<option value="">Gagal memeriksa slot, coba lagi…</option>';
        timeSelect.disabled = true;
      }
    };

    poliSelect.innerHTML = '<option value="">Pilih poliklinik…</option>';
    poliData.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      poliSelect.appendChild(opt);
    });

    poliSelect.addEventListener('change', () => {
      const selectedId = parseInt(poliSelect.value, 10);
      doctorSelect.innerHTML = '<option value="">Pilih dokter…</option>';

      if (!selectedId) {
        doctorSelect.disabled = true;
        refreshAvailableSlots();
        return;
      }

      const poli = poliData.find((p) => p.id === selectedId);
      const activeDoctors = poli ? (poli.doctors || []).filter((d) => d.is_active) : [];

      if (activeDoctors.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Belum ada dokter aktif di poliklinik ini';
        doctorSelect.appendChild(opt);
        doctorSelect.disabled = true;
        refreshAvailableSlots();
        return;
      }

      activeDoctors.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        doctorSelect.appendChild(opt);
      });
      doctorSelect.disabled = false;
      if (activeDoctors.length === 1) {
        doctorSelect.value = String(activeDoctors[0].id);
      }
      refreshAvailableSlots();
    });

    const requestedPoliId = new URLSearchParams(window.location.search).get('poli');
    if (requestedPoliId && poliData.some((p) => String(p.id) === String(requestedPoliId))) {
      poliSelect.value = String(requestedPoliId);
      poliSelect.dispatchEvent(new Event('change'));
    }

    doctorSelect.addEventListener('change', refreshAvailableSlots);
    if (dateInput) {
      dateInput.addEventListener('change', refreshAvailableSlots);
    }

    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('bookingAlert');

      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      const polyclinic_id = poliSelect.value;
      const doctor_id = doctorSelect.value;
      const appointment_date = dateInput.value;
      const appointment_time = timeSelect ? timeSelect.value : '';
      const complaint = document.getElementById('complaint').value.trim();

      if (!polyclinic_id || !doctor_id || !appointment_date || !appointment_time) {
        api.showAlert('bookingAlert', 'Pilih poliklinik, dokter, tanggal, dan jam kunjungan terlebih dahulu.');
        (!polyclinic_id ? poliSelect : !doctor_id ? doctorSelect : !appointment_date ? dateInput : timeSelect).focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';

        const res = await api.request('/janji-temu', {
          method: 'POST',
          body: JSON.stringify({
            polyclinic_id: parseInt(polyclinic_id, 10),
            doctor_id: parseInt(doctor_id, 10),
            appointment_date,
            appointment_time,
            complaint: complaint || null
          })
        });

        api.showAlert('bookingAlert', res.message || 'Janji temu berhasil dibuat.', 'success');
        bookingForm.reset();
        doctorSelect.innerHTML = '<option value="">Pilih poliklinik terlebih dahulu…</option>';
        doctorSelect.disabled = true;
        if (timeSelect) {
          timeSelect.innerHTML = '<option value="">Pilih dokter dan tanggal terlebih dahulu…</option>';
          timeSelect.disabled = true;
        }
        dateInput.value = new Date().toISOString().split('T')[0];

        await loadPatientAppointments();
      } catch (err) {
        const msg =
          err.errors?.appointment_time?.[0] ||
          err.errors?.doctor_id?.[0] ||
          err.errors?.complaint?.[0] ||
          err.errors?.appointment_date?.[0] ||
          err.message ||
          'Gagal membuat janji temu. Periksa kembali pilihanmu.';
        api.showAlert('bookingAlert', msg, 'danger');
        await refreshAvailableSlots();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Buat janji';
      }
    });

  } catch {
    api.showAlert('bookingAlert', 'Gagal memuat data poliklinik. Coba muat ulang halaman.', 'danger');
  }
}

async function loadPatientAppointments() {
  const tableBody = document.getElementById('appointmentTableBody');
  if (!tableBody) return;

  try {
    const res = await api.request('/janji-temu', { priority: 'high' });
    const appointments = res.data || [];

    if (appointments.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-muted text-center" style="padding: var(--space-6);">Belum ada janji. Buat janji pertamamu.</td></tr>';
      return;
    }

    tableBody.innerHTML = appointments.map(a => `
      <tr>
        <td>
          <strong>${escapeHtml(api.formatDate(a.appointment_date))}</strong>
          <div class="text-muted text-sm">Pukul ${escapeHtml(a.appointment_time || '09:00')} WIB</div>
        </td>
        <td>${escapeHtml(a.polyclinic?.name || '-')}</td>
        <td>${escapeHtml(a.doctor?.name || '-')}</td>
        <td>${escapeHtml(a.complaint || '-')}</td>
        <td><span class="badge badge-${a.status}">${getStatusLabel(a.status)}</span></td>
        <td>${escapeHtml(a.doctor_notes || '-')}</td>
      </tr>
    `).join('');
  } catch {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
  }
}

async function loadExaminationHistory() {
  const tableBody = document.getElementById('historyTableBody');
  if (!tableBody) return;

  try {
    const res = await api.request('/riwayat-pemeriksaan', { priority: 'high' });
    const items = res.data || [];

    if (items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center" style="padding: var(--space-6);">Belum ada pemeriksaan yang selesai.</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map(a => `
      <tr>
        <td><strong>${escapeHtml(api.formatDate(a.appointment_date))}</strong></td>
        <td>${escapeHtml(a.polyclinic?.name || '-')}</td>
        <td>${escapeHtml(a.doctor?.name || '-')}</td>
        <td>${escapeHtml(a.complaint || '-')}</td>
        <td>${escapeHtml(a.doctor_notes || 'Tidak ada catatan khusus dari dokter.')}</td>
      </tr>
    `).join('');
  } catch {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
  }
}

async function loadControlSchedules() {
  const tableBody = document.getElementById('controlTableBody');
  if (!tableBody) return;

  try {
    const res = await api.request('/jadwal-kontrol', { priority: 'high' });
    const items = res.data || [];

    if (items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center" style="padding: var(--space-6);">Belum ada jadwal kontrol dari dokter.</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map(a => `
      <tr>
        <td><strong>${escapeHtml(api.formatDate(a.appointment_date))}</strong></td>
        <td>${escapeHtml(a.polyclinic?.name || '-')}</td>
        <td>${escapeHtml(a.doctor?.name || '-')}</td>
        <td>${escapeHtml(a.doctor_notes || 'Kontrol evaluasi rutin')}</td>
        <td><span class="badge badge-terjadwal">Terjadwal</span></td>
      </tr>
    `).join('');
  } catch {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
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
