document.addEventListener('DOMContentLoaded', async () => {
  const token = api.getToken();
  const user = api.getUser();
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  if (path.endsWith('/login.html')) {
    const reason = params.get('reason');
    if (reason === 'expired') {
      api.showAlert('loginAlert', 'Sesi berakhir. Silakan masuk lagi.', 'danger');
    } else if (reason === 'forbidden') {
      api.showAlert('loginAlert', 'Halaman ini bukan untuk akunmu.', 'danger');
    }
  }

  const isAuthPage =
    path.endsWith('/login.html') ||
    path.endsWith('/daftar.html') ||
    path.endsWith('/lupa-password.html');

  if (token && user && isAuthPage) {
    try {
      const verify = await api.request('/user', { skipAuthRedirect: true });
      const verifiedUser = verify.data || user;
      api.setUser(verifiedUser);
      window.location.href =
        verifiedUser.role === 'admin' ? '/admin/kelola-janji.html' : '/pasien/janji-temu.html';
      return;
    } catch {
      api.clearSession();
    }
  }

  if (path === '/' || path.endsWith('/index.html')) {
    loadPublicHomepage();
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('loginAlert');

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const submitBtn = document.getElementById('submitBtn');

      if (!email || !password) {
        api.showAlert('loginAlert', 'Masukkan alamat email dan kata sandi terlebih dahulu.');
        (!email ? emailInput : passwordInput).focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses…';

        const res = await api.request('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        api.setToken(res.token);
        api.setUser(res.user);

        if (res.user.role === 'admin') {
          window.location.href = '/admin/kelola-janji.html';
        } else {
          window.location.href = '/pasien/janji-temu.html';
        }
      } catch (err) {
        const msg = err.errors?.email?.[0] || err.message || 'Gagal masuk. Periksa kembali email dan kata sandimu.';
        api.showAlert('loginAlert', msg, 'danger');
        emailInput.focus();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const birthDateInput = document.getElementById('regBirthDate');
    if (birthDateInput) {
      birthDateInput.max = new Date().toISOString().split('T')[0];
    }

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('registerAlert');

      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phone_number = document.getElementById('regPhone').value.trim();
      const birth_date = document.getElementById('regBirthDate').value;
      const address = document.getElementById('regAddress').value.trim();
      const password = document.getElementById('regPassword').value;
      const password_confirmation = document.getElementById('regPasswordConfirm').value;
      const submitBtn = document.getElementById('regSubmitBtn');

      if (!name || !email || !password) {
        api.showAlert('registerAlert', 'Lengkapi nama lengkap, email, dan kata sandi.', 'danger');
        return;
      }

      if (password !== password_confirmation) {
        api.showAlert('registerAlert', 'Konfirmasi kata sandi tidak cocok. Ketik ulang kata sandimu.', 'danger');
        document.getElementById('regPasswordConfirm').focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';

        const res = await api.request('/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            phone_number: phone_number || null,
            birth_date: birth_date || null,
            address: address || null,
            password,
            password_confirmation
          })
        });

        api.setToken(res.token);
        api.setUser(res.user);
        window.location.href = '/pasien/janji-temu.html';
      } catch (err) {
        const msg =
          err.errors?.email?.[0] ||
          err.errors?.password?.[0] ||
          err.errors?.birth_date?.[0] ||
          err.errors?.name?.[0] ||
          err.message ||
          'Gagal mendaftarkan akun. Periksa kembali isian formulirmu.';
        api.showAlert('registerAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Buat Akun Pasien';
      }
    });
  }

  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('forgotAlert');

      const email = document.getElementById('forgotEmail').value.trim();
      const submitBtn = document.getElementById('forgotSubmitBtn');

      if (!email) {
        api.showAlert('forgotAlert', 'Masukkan alamat email terdaftar terlebih dahulu.', 'danger');
        document.getElementById('forgotEmail').focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim…';

        const res = await api.request('/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        api.showAlert('forgotAlert', res.message || 'Tautan reset kata sandi telah dikirim ke emailmu.', 'success');
        forgotForm.reset();
      } catch (err) {
        const msg = err.errors?.email?.[0] || err.message || 'Gagal mengirim tautan reset. Coba beberapa saat lagi.';
        api.showAlert('forgotAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Tautan Reset';
      }
    });
  }

  const resetForm = document.getElementById('resetForm');
  if (resetForm) {
    const tokenParam = params.get('token') || '';
    const emailParam = params.get('email') || '';

    const tokenInput = document.getElementById('resetToken');
    const emailInput = document.getElementById('resetEmail');
    const submitBtn = document.getElementById('resetSubmitBtn');

    if (tokenInput) tokenInput.value = tokenParam;
    if (emailInput && emailParam) emailInput.value = emailParam;

    if (!tokenParam) {
      api.showAlert(
        'resetAlert',
        'Tautan pengaturan ulang kata sandi tidak lengkap atau kedaluwarsa. Minta tautan baru melalui halaman Lupa Kata Sandi.',
        'danger'
      );
      if (submitBtn) submitBtn.disabled = true;
    }

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('resetAlert');

      const resetToken = document.getElementById('resetToken').value.trim();
      const email = document.getElementById('resetEmail').value.trim();
      const password = document.getElementById('newPassword').value;
      const password_confirmation = document.getElementById('newPasswordConfirm').value;

      if (!resetToken) {
        api.showAlert('resetAlert', 'Token reset tidak ditemukan. Kirim ulang tautan reset dari halaman Lupa Kata Sandi.', 'danger');
        return;
      }

      if (password !== password_confirmation) {
        api.showAlert('resetAlert', 'Konfirmasi kata sandi baru tidak cocok. Ketik ulang kata sandimu.', 'danger');
        document.getElementById('newPasswordConfirm').focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan…';

        const res = await api.request('/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: resetToken,
            email,
            password,
            password_confirmation
          })
        });

        api.clearSession();
        api.showAlert('resetAlert', (res.message || 'Kata sandi berhasil diperbarui.') + ' Mengalihkan ke halaman Masuk…', 'success');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1800);
      } catch (err) {
        const msg =
          err.errors?.email?.[0] ||
          err.errors?.password?.[0] ||
          err.message ||
          'Gagal mengatur ulang kata sandi. Minta tautan reset baru.';
        api.showAlert('resetAlert', msg, 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Kata Sandi Baru';
      }
    });
  }
});

async function loadPublicHomepage() {
  const token = api.getToken();
  const user = api.getUser();
  const navAction = document.getElementById('navAuthAction');

  if (token && user && navAction) {
    const dashboardUrl = user.role === 'admin' ? '/admin/kelola-janji.html' : '/pasien/janji-temu.html';
    navAction.innerHTML = `
      <span class="nav-user-name">${escapeHtml(user.name)}</span>
      <a href="${dashboardUrl}" class="btn btn-secondary btn-sm">Buka Dashboard</a>
    `;
  }

  try {
    const res = await api.request('/public-info');
    const info = res.data || {};

    if (info.clinic_name) {
      const nameEl = document.getElementById('clinicName');
      const navNameEl = document.getElementById('navClinicName');
      if (nameEl) nameEl.textContent = info.clinic_name;
      if (navNameEl) navNameEl.textContent = info.clinic_name;
    }
    if (info.description) {
      const descEl = document.getElementById('clinicDesc');
      if (descEl) descEl.textContent = info.description;
    }
    if (info.address) {
      const addrEl = document.getElementById('clinicAddress');
      if (addrEl) addrEl.textContent = info.address;
    }
    if (info.contact) {
      const contactEl = document.getElementById('clinicContact');
      if (contactEl) contactEl.textContent = info.contact;
    }

    const poliContainer = document.getElementById('publicPoliList');
    if (poliContainer) {
      const polis = info.polyclinics || [];
      if (polis.length === 0) {
        poliContainer.innerHTML = '<div class="card"><p class="text-muted">Belum ada poliklinik yang terdaftar saat ini.</p></div>';
        return;
      }

      poliContainer.innerHTML = polis.map(p => `
        <article class="card">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="text-sm text-muted mb-2">${escapeHtml(p.description || 'Layanan konsultasi dan pemeriksaan rawat jalan.')}</p>
          <div style="border-top: 1px solid var(--color-line); padding-top: var(--space-2); margin-top: var(--space-2);">
            <span class="text-sm" style="font-weight: 600;">Dokter Praktik:</span>
            <ul style="margin: var(--space-1) 0 0 var(--space-6); font-size: 14px; line-height: 22px;">
              ${(p.doctors || []).length > 0
                ? p.doctors.map(d => `<li>${escapeHtml(d.name)}</li>`).join('')
                : '<li class="text-muted">Jadwal dokter sedang diperbarui</li>'
              }
            </ul>
          </div>
        </article>
      `).join('');
    }
  } catch {
    const poliContainer = document.getElementById('publicPoliList');
    if (poliContainer) {
      poliContainer.innerHTML = '<div class="card"><p class="text-muted">Gagal memuat daftar layanan. Coba muat ulang halaman.</p></div>';
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
