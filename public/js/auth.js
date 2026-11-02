document.addEventListener('DOMContentLoaded', async () => {
  const token = api.getToken();
  const isAuthPage = window.location.pathname.endsWith('login.html') ||
                     window.location.pathname.endsWith('daftar.html') ||
                     window.location.pathname.endsWith('lupa-password.html') ||
                     window.location.pathname.endsWith('reset-password.html');

  if (token && isAuthPage) {
    try {
      // Verify token against the server first to avoid redirect loops when a stored token is revoked.
      const verified = await api.request('/user');
      if (verified && verified.data) {
        api.setUser(verified.data);
        window.location.href = verified.data.role === 'admin'
          ? '/admin/kelola-janji.html'
          : '/pasien/janji-temu.html';
        return;
      }
    } catch {
      api.clearAuth();
    }
  }

  if (document.getElementById('publicPoliList')) {
    initHomePage();
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('loginAlert');

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = document.getElementById('submitBtn');

      if (!email || !password) {
        api.showAlert('loginAlert', 'Harap isi email dan kata sandi.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';

        const res = await api.request('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        api.setToken(res.token);
        api.setUser(res.user);

        window.location.href = res.user.role === 'admin'
          ? '/admin/kelola-janji.html'
          : '/pasien/janji-temu.html';
      } catch (err) {
        const msg = err.errors?.email?.[0] || err.message || 'Gagal masuk. Periksa email dan kata sandi.';
        api.showAlert('loginAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
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

      if (password !== password_confirmation) {
        api.showAlert('registerAlert', 'Konfirmasi kata sandi tidak cocok.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mendaftarkan Akun...';

        const res = await api.request('/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            password_confirmation,
            phone_number: phone_number || null,
            birth_date: birth_date || null,
            address: address || null
          })
        });

        api.setToken(res.token);
        api.setUser(res.user);

        api.showAlert('registerAlert', 'Pendaftaran berhasil! Mengalihkan ke halaman pasien...', 'success');
        setTimeout(() => {
          window.location.href = '/pasien/janji-temu.html';
        }, 1000);
      } catch (err) {
        const firstError = Object.values(err.errors || {})[0]?.[0];
        api.showAlert('registerAlert', firstError || err.message || 'Pendaftaran gagal.', 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Daftar Sekarang';
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

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim Tautan...';

        const res = await api.request('/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        api.showAlert('forgotAlert', res.message, 'success');
        forgotForm.reset();
      } catch (err) {
        const msg = err.errors?.email?.[0] || err.message || 'Gagal mengirim email reset kata sandi.';
        api.showAlert('forgotAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Tautan Reset';
      }
    });
  }

  const resetForm = document.getElementById('resetForm');
  if (resetForm) {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || '';
    const emailParam = params.get('email') || '';

    const tokenInput = document.getElementById('resetToken');
    const emailInput = document.getElementById('resetEmail');
    const submitBtn = document.getElementById('resetSubmitBtn');

    if (tokenInput) tokenInput.value = tokenParam;
    if (emailInput) emailInput.value = emailParam;

    if (!tokenParam) {
      api.showAlert(
        'resetAlert',
        'Tautan reset kata sandi tidak lengkap atau tidak sah. Silakan ajukan tautan baru di halaman Lupa Kata Sandi.',
        'warning'
      );
      if (submitBtn) submitBtn.disabled = true;
    }

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('resetAlert');

      const tokenVal = tokenInput ? tokenInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = document.getElementById('newPassword').value;
      const password_confirmation = document.getElementById('newPasswordConfirm').value;

      if (!tokenVal) {
        api.showAlert('resetAlert', 'Token reset kata sandi tidak ditemukan.', 'danger');
        return;
      }

      if (password !== password_confirmation) {
        api.showAlert('resetAlert', 'Konfirmasi kata sandi tidak cocok.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan Kata Sandi...';

        const res = await api.request('/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: tokenVal, email, password, password_confirmation })
        });

        api.showAlert('resetAlert', res.message, 'success');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
      } catch (err) {
        const msg = err.errors?.password?.[0] || err.errors?.email?.[0] || err.message || 'Gagal mengatur ulang kata sandi.';
        api.showAlert('resetAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Kata Sandi Baru';
      }
    });
  }
});

async function initHomePage() {
  const container = document.getElementById('publicPoliList');
  if (!container) return;

  const user = api.getUser();
  const navAuthAction = document.getElementById('navAuthAction');
  if (navAuthAction) {
    if (user && api.getToken()) {
      const targetUrl = user.role === 'admin' ? '/admin/kelola-janji.html' : '/pasien/janji-temu.html';
      navAuthAction.innerHTML = `<a href="${targetUrl}" class="btn btn-primary btn-sm">Buka Dashboard (${escapeHtml(user.name)})</a>`;
    } else {
      navAuthAction.innerHTML = `
        <a href="/login.html" class="btn btn-secondary btn-sm" style="margin-right: 0.5rem;">Masuk</a>
        <a href="/daftar.html" class="btn btn-primary btn-sm">Daftar Akun</a>
      `;
    }
  }

  try {
    const res = await api.request('/public-info');
    const data = res.data;

    if (document.getElementById('clinicName')) {
      document.getElementById('clinicName').textContent = data.clinic_name;
    }
    if (document.getElementById('clinicDesc')) {
      document.getElementById('clinicDesc').textContent = data.description;
    }
    if (document.getElementById('clinicAddress')) {
      document.getElementById('clinicAddress').textContent = data.address;
    }
    if (document.getElementById('clinicContact')) {
      document.getElementById('clinicContact').textContent = data.contact;
    }

    const polyclinics = data.polyclinics || [];
    if (polyclinics.length === 0) {
      container.innerHTML = '<p class="text-muted">Layanan poli sedang diperbarui.</p>';
      return;
    }

    container.innerHTML = polyclinics.map(p => `
      <div class="card" style="margin-bottom: 1rem;">
        <h3 style="color:var(--color-primary); font-size: 1.1rem; margin-bottom: 0.25rem;">${escapeHtml(p.name)}</h3>
        <p class="text-sm text-muted mb-2">${escapeHtml(p.description || 'Layanan konsultasi dan pemeriksaan komprehensif.')}</p>
        <div style="font-size: 0.85rem;">
          <strong style="color:var(--color-text);">Dokter Aktif Bertugas:</strong>
          <ul style="margin: 0.25rem 0 0 1.25rem;">
            ${(p.doctors || []).length > 0
              ? p.doctors.map(d => `<li>${escapeHtml(d.name)}</li>`).join('')
              : '<li class="text-muted">Tidak ada dokter aktif saat ini</li>'
            }
          </ul>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:var(--color-danger);">Gagal memuat informasi layanan: ${escapeHtml(err.message)}</p>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
