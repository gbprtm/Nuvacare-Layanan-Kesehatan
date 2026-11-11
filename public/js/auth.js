let otpState = {
  purpose: 'register',
  phoneNumber: '',
  registerPayload: null,
  expirySeconds: 0,
  resendSeconds: 0,
  timerInterval: null
};

let googleClientId = null;

document.addEventListener('DOMContentLoaded', async () => {
  initPasswordToggles();
  initOtpInputs();
  initAuthModals();

  const token = api.getToken();
  const user = api.getUser();
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const isStaffLoginPage = path.endsWith('/staf/login.html') || Boolean(document.getElementById('staffLoginForm'));

  if (isStaffLoginPage) {
    const reason = params.get('reason');
    if (reason === 'expired') {
      api.showAlert('staffLoginAlert', 'Sesi berakhir. Silakan masuk lagi.', 'danger');
    } else if (reason === 'forbidden') {
      api.showAlert('staffLoginAlert', 'Halaman ini khusus untuk akun staf klinik yang berwenang.', 'danger');
    }
  } else if (path.endsWith('/login.html')) {
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
    path.endsWith('/lupa-password.html') ||
    isStaffLoginPage;

  if (token && user && isAuthPage) {
    try {
      const verify = await api.request('/user', { skipAuthRedirect: true, priority: 'low' });
      const verifiedUser = verify.data || user;
      api.setUser(verifiedUser);

      if (verifiedUser.role === 'admin') {
        window.location.href = '/admin/kelola-janji.html';
        return;
      }

      if (verifiedUser.role === 'dokter') {
        window.location.href = '/dokter/janji-temu.html';
        return;
      }

      const isPhoneVerified = Boolean(verifiedUser.phone_verified || verifiedUser.phone_verified_at);
      if (isStaffLoginPage) {
        api.clearSession();
      } else if (verifiedUser.role === 'pasien' && !isPhoneVerified && (document.getElementById('googlePhoneModal') || typeof window.unlockAndGoToStage === 'function')) {
        openGooglePhoneModal(verifiedUser.phone_number || '');
      } else {
        window.location.href = getSafeNextUrl();
        return;
      }
    } catch {
      api.clearSession();
    }
  }

  if (path === '/' || path.endsWith('/index.html')) {
    loadPublicHomepage();
  }

  if (!isStaffLoginPage && (path.endsWith('/login.html') || path.endsWith('/daftar.html'))) {
    preserveNextParamOnAuthLinks();
    setupGoogleSignIn();
  }

  const staffLoginForm = document.getElementById('staffLoginForm');
  if (staffLoginForm) {
    staffLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('staffLoginAlert');

      const emailInput = document.getElementById('staffEmail');
      const passwordInput = document.getElementById('staffPassword');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const submitBtn = document.getElementById('staffSubmitBtn') || staffLoginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        api.showAlert('staffLoginAlert', 'Masukkan email staf dan kata sandi terlebih dahulu.', 'danger');
        if (!email && emailInput) emailInput.focus();
        else if (passwordInput) passwordInput.focus();
        return;
      }

      const btnLabelEl = submitBtn ? (submitBtn.querySelector('span') || submitBtn) : null;
      const originalLabel = btnLabelEl ? btnLabelEl.textContent : 'Masuk';

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (btnLabelEl) btnLabelEl.textContent = 'Memproses…';

        const res = await api.request('/login', {
          method: 'POST',
          skipAuthRedirect: true,
          body: JSON.stringify({ email, password })
        });

        handlePostLoginSuccess(res);
      } catch (err) {
        let msg = err.errors?.email?.[0] || err.errors?.password?.[0] || err.message;
        if (!msg) {
          msg = err.status === 403
            ? 'Akses ditolak. Akun ini tidak aktif atau tidak memiliki izin staf.'
            : 'Gagal masuk. Periksa kembali email dan kata sandi staf.';
        }
        api.showAlert('staffLoginAlert', msg, 'danger');
        if (err.status === 422 && err.errors?.password && passwordInput) {
          passwordInput.focus();
        } else if (emailInput) {
          emailInput.focus();
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnLabelEl) btnLabelEl.textContent = originalLabel;
      }
    });
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
        const textSpan = submitBtn.querySelector('span');
        if (textSpan) {
          textSpan.textContent = 'Memproses…';
        } else {
          submitBtn.textContent = 'Memproses…';
        }

        const res = await api.request('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        handlePostLoginSuccess(res);
      } catch (err) {
        const msg = err.errors?.email?.[0] || err.message || 'Gagal masuk. Periksa kembali email dan kata sandimu.';
        api.showAlert('loginAlert', msg, 'danger');
        emailInput.focus();
      } finally {
        const textSpan = submitBtn.querySelector('span');
        if (textSpan) {
          textSpan.textContent = 'Login & Lanjutkan';
        } else {
          submitBtn.textContent = 'Masuk';
        }
        if (typeof checkLoginValidity === 'function') {
          checkLoginValidity();
        } else {
          submitBtn.disabled = false;
        }
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

      const regPhoneInput = document.getElementById('regPhone');
      const regEmailInput = document.getElementById('regEmail');
      const regPhoneError = document.getElementById('regPhoneError');
      const regEmailError = document.getElementById('regEmailError');

      if (regPhoneError) {
        regPhoneError.style.display = 'none';
        regPhoneError.textContent = '';
      }
      if (regEmailError) {
        regEmailError.style.display = 'none';
        regEmailError.textContent = '';
      }
      if (regPhoneInput) regPhoneInput.removeAttribute('aria-invalid');
      if (regEmailInput) regEmailInput.removeAttribute('aria-invalid');

      const name = document.getElementById('regName').value.trim();
      const email = regEmailInput.value.trim();
      let rawPhone = regPhoneInput.value.trim().replace(/\D/g, '');
      if (rawPhone.startsWith('0062')) rawPhone = rawPhone.substring(4);
      while (rawPhone.startsWith('62')) rawPhone = rawPhone.substring(2);
      if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
      const phone_number = rawPhone ? '62' + rawPhone : '';
      const birth_date = document.getElementById('regBirthDate').value;
      const gender = document.getElementById('regGender')?.value || null;
      const address = document.getElementById('regAddress').value.trim();
      const password = document.getElementById('regPassword').value;
      const password_confirmation = document.getElementById('regPasswordConfirm').value;
      const submitBtn = document.getElementById('regSubmitBtn');

      if (!name || !email || !phone_number || !password) {
        api.showAlert('registerAlert', 'Lengkapi nama lengkap, email, nomor WhatsApp, dan kata sandi.', 'danger');
        return;
      }

      if (password !== password_confirmation) {
        api.showAlert('registerAlert', 'Konfirmasi kata sandi tidak cocok. Ketik ulang kata sandimu.', 'danger');
        document.getElementById('regPasswordConfirm').focus();
        return;
      }

      const payload = {
        name,
        email,
        phone_number,
        birth_date: birth_date || null,
        gender: gender || null,
        address: address || null,
        password,
        password_confirmation
      };

      try {
        submitBtn.disabled = true;
        const textSpan = submitBtn.querySelector('span');
        if (textSpan) {
          textSpan.textContent = 'Mengirim OTP ke WhatsApp…';
        } else {
          submitBtn.textContent = 'Mengirim OTP ke WhatsApp…';
        }

        const res = await api.request('/auth/register/send-otp', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        otpState.purpose = 'register';
        otpState.phoneNumber = res.data?.phone_number || phone_number;
        otpState.registerPayload = payload;

        openOtpVerifyModal(
          res.data?.masked_phone || phone_number,
          res.data?.expires_in || 300,
          res.data?.resend_in || 60,
          res.data?.debug_otp || null,
          res.data?.whatsapp_url || null,
          res.data?.sent_via_gateway ?? true
        );
      } catch (err) {
        const phoneErr = err.errors?.phone_number?.[0] || null;
        const emailErr = err.errors?.email?.[0] || null;

        if (phoneErr && regPhoneError) {
          regPhoneError.textContent = phoneErr;
          regPhoneError.style.display = 'block';
          if (regPhoneInput) regPhoneInput.setAttribute('aria-invalid', 'true');
        }
        if (emailErr && regEmailError) {
          regEmailError.textContent = emailErr;
          regEmailError.style.display = 'block';
          if (regEmailInput) regEmailInput.setAttribute('aria-invalid', 'true');
        }

        const msg =
          phoneErr ||
          emailErr ||
          err.errors?.password?.[0] ||
          err.errors?.birth_date?.[0] ||
          err.errors?.name?.[0] ||
          err.message ||
          'Gagal mengirim kode OTP. Periksa kembali isian formulirmu.';
        api.showAlert('registerAlert', msg, 'danger');

        if (phoneErr && regPhoneInput) {
          regPhoneInput.focus();
        } else if (emailErr && regEmailInput) {
          regEmailInput.focus();
        }
      } finally {
        const textSpan = submitBtn.querySelector('span');
        if (textSpan) {
          textSpan.textContent = 'Kirim OTP & Lanjutkan';
        } else {
          submitBtn.textContent = 'Kirim OTP & Buat Akun Pasien';
        }
        if (typeof checkRegisterValidity === 'function') {
          checkRegisterValidity();
        } else {
          submitBtn.disabled = false;
        }
      }
    });
  }

  const forgotForm = document.getElementById('forgotForm');
  const legacyForgotEmail = document.getElementById('forgotEmail');
  if (forgotForm && legacyForgotEmail) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('forgotAlert');

      const email = legacyForgotEmail.value.trim();
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

function getSafeNextUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawNext = params.get('next') || '';
  if (rawNext.startsWith('/pasien/') && !rawNext.startsWith('//')) {
    return rawNext;
  }
  return '/pasien/janji-temu.html';
}

function preserveNextParamOnAuthLinks() {
  const params = new URLSearchParams(window.location.search);
  const rawNext = params.get('next') || '';
  if (!rawNext.startsWith('/pasien/') || rawNext.startsWith('//')) return;

  const encodedNext = encodeURIComponent(rawNext);
  document.querySelectorAll('a[href="/daftar.html"], a[href="/login.html"]').forEach((link) => {
    const baseHref = link.getAttribute('href');
    link.setAttribute('href', `${baseHref}?next=${encodedNext}`);
  });
}

function handlePostLoginSuccess(res) {
  api.setToken(res.token);
  api.setUser(res.user);

  if (res.user?.role === 'admin') {
    window.location.href = '/admin/kelola-janji.html';
    return;
  }

  if (res.user?.role === 'dokter') {
    window.location.href = '/dokter/janji-temu.html';
    return;
  }

  if (res.requires_phone_verification) {
    openGooglePhoneModal(res.user.phone_number || '');
    return;
  }

  window.location.href = getSafeNextUrl();
}

function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('[data-toggle-password]');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-toggle-password');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isShowing = input.type === 'text';
      input.type = isShowing ? 'password' : 'text';
      btn.setAttribute('aria-pressed', isShowing ? 'false' : 'true');
      btn.setAttribute('aria-label', isShowing ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi');

      btn.innerHTML = isShowing
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    });
  });
}

function initOtpInputs() {
  const inputs = Array.from(document.querySelectorAll('.otp-digit-input:not(.stage-otp-input)'));
  if (inputs.length === 0) return;

  inputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const cleanVal = e.target.value.replace(/\D/g, '');
      e.target.value = cleanVal.slice(-1);

      if (cleanVal && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        inputs[idx + 1].select();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        inputs[idx - 1].value = '';
        inputs[idx - 1].focus();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        inputs[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
        e.preventDefault();
        inputs[idx + 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 4);
      if (!pasted) return;

      pasted.split('').forEach((char, i) => {
        if (inputs[i]) inputs[i].value = char;
      });

      const targetFocus = inputs[Math.min(pasted.length, inputs.length - 1)];
      if (targetFocus) targetFocus.focus();
    });
  });
}

function getOtpCodeFromInputs() {
  const inputs = Array.from(document.querySelectorAll('.otp-digit-input'));
  return inputs.map((el) => el.value.trim()).join('');
}

function clearOtpInputs() {
  const inputs = Array.from(document.querySelectorAll('.otp-digit-input'));
  inputs.forEach((el) => {
    el.value = '';
  });
  if (inputs[0]) inputs[0].focus();
}

function maskPhoneNumber(phone) {
  if (!phone) return '+62 -';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length <= 6) return phone;
  if (clean.startsWith('62')) {
    return `+62 ${clean.slice(2, 5)}-••••-${clean.slice(-3)}`;
  }
  return `${clean.slice(0, 4)}-••••-${clean.slice(-3)}`;
}

function openOtpVerifyModal(maskedPhone, expiresInSeconds = 300, resendInSeconds = 60, debugOtp = null, whatsappUrl = null, sentViaGateway = true) {
  const displayPhone = maskPhoneNumber(maskedPhone);
  const actualPhone = otpState.phoneNumber || maskedPhone;
  if (typeof window.unlockAndGoToStage === 'function') {
    const targetStage = window.AUTH_OTP_STAGE || 3;
    window.unlockAndGoToStage(targetStage, actualPhone, expiresInSeconds, resendInSeconds, debugOtp, whatsappUrl, sentViaGateway, displayPhone);
    return;
  }

  const modal = document.getElementById('otpVerifyModal');
  if (!modal) return;

  api.hideAlert('otpVerifyAlert');
  const maskedEl = document.getElementById('otpMaskedPhone');
  if (maskedEl) maskedEl.textContent = displayPhone;

  modal.style.display = 'flex';
  clearOtpInputs();
  startOtpTimers(expiresInSeconds, resendInSeconds);
}

function closeOtpVerifyModal() {
  const modal = document.getElementById('otpVerifyModal');
  if (modal) modal.style.display = 'none';
  if (otpState.timerInterval) {
    clearInterval(otpState.timerInterval);
    otpState.timerInterval = null;
  }
}

function startOtpTimers(expiresInSeconds, resendInSeconds) {
  otpState.expirySeconds = expiresInSeconds;
  otpState.resendSeconds = resendInSeconds;

  if (otpState.timerInterval) {
    clearInterval(otpState.timerInterval);
  }

  updateOtpTimerDom();

  otpState.timerInterval = setInterval(() => {
    if (otpState.expirySeconds > 0) {
      otpState.expirySeconds -= 1;
    }
    if (otpState.resendSeconds > 0) {
      otpState.resendSeconds -= 1;
    }

    updateOtpTimerDom();

    if (otpState.expirySeconds <= 0 && otpState.resendSeconds <= 0) {
      clearInterval(otpState.timerInterval);
      otpState.timerInterval = null;
    }
  }, 1000);
}

function updateOtpTimerDom() {
  const countdownEl = document.getElementById('otpCountdownText');
  const resendBtn = document.getElementById('otpResendBtn');

  if (countdownEl) {
    if (otpState.expirySeconds > 0) {
      const mins = String(Math.floor(otpState.expirySeconds / 60)).padStart(2, '0');
      const secs = String(otpState.expirySeconds % 60).padStart(2, '0');
      countdownEl.textContent = `Berlaku selama ${mins}:${secs}`;
    } else {
      countdownEl.textContent = 'Kode OTP telah kedaluwarsa. Silakan kirim ulang.';
    }
  }

  if (resendBtn) {
    if (otpState.resendSeconds > 0) {
      resendBtn.disabled = true;
      resendBtn.textContent = `Kirim Ulang (${otpState.resendSeconds}d)`;
    } else {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Kirim Ulang Kode OTP';
    }
  }
}

function openGooglePhoneModal(prefillPhone = '') {
  if (typeof window.unlockAndGoToStage === 'function') {
    window.unlockAndGoToStage(2, prefillPhone);
    return;
  }

  const modal = document.getElementById('googlePhoneModal');
  if (!modal) return;

  api.hideAlert('googlePhoneAlert');
  const input = document.getElementById('googlePhoneInput');
  if (input) {
    input.value = prefillPhone;
  }

  modal.style.display = 'flex';
  if (input) input.focus();
}

function closeGooglePhoneModal() {
  const modal = document.getElementById('googlePhoneModal');
  if (modal) modal.style.display = 'none';
}

function initAuthModals() {
  const otpForm = document.getElementById('otpVerifyForm');
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('otpVerifyAlert');

      const otpCode = getOtpCodeFromInputs();
      if (otpCode.length !== 4) {
        api.showAlert('otpVerifyAlert', 'Masukkan 4 digit angka kode OTP secara lengkap.', 'danger');
        return;
      }

      const submitBtn = document.getElementById('otpVerifySubmitBtn');
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memverifikasi…';

        const endpoint =
          otpState.purpose === 'verify_phone'
            ? '/auth/phone/verify-otp'
            : '/auth/register/verify-otp';

        const res = await api.request(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            phone_number: otpState.phoneNumber,
            otp: otpCode
          })
        });

        if (res.token) {
          api.setToken(res.token);
        }
        if (res.user) {
          api.setUser(res.user);
        }

        closeOtpVerifyModal();
        window.location.href = getSafeNextUrl();
      } catch (err) {
        const msg =
          err.errors?.otp?.[0] ||
          err.errors?.phone_number?.[0] ||
          err.errors?.email?.[0] ||
          err.message ||
          'Kode OTP tidak sesuai atau sudah kedaluwarsa.';
        api.showAlert('otpVerifyAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verifikasi & Lanjutkan';
      }
    });
  }

  const resendBtn = document.getElementById('otpResendBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      api.hideAlert('otpVerifyAlert');

      try {
        resendBtn.disabled = true;
        resendBtn.textContent = 'Mengirim ulang…';

        let res;
        if (otpState.purpose === 'verify_phone') {
          res = await api.request('/auth/phone/send-otp', {
            method: 'POST',
            body: JSON.stringify({ phone_number: otpState.phoneNumber })
          });
        } else {
          res = await api.request('/auth/register/send-otp', {
            method: 'POST',
            body: JSON.stringify(otpState.registerPayload)
          });
        }

        clearOtpInputs();
        startOtpTimers(res.data?.expires_in || 300, res.data?.resend_in || 60);

        const devNotice = document.getElementById('stageOtpDevNotice');
        if (devNotice) {
          if (res.data?.debug_otp) {
            devNotice.textContent = `Mode Uji/Lokal: Kode OTP baru Anda adalah ${res.data.debug_otp}`;
            devNotice.style.display = 'block';
          } else if (res.data?.whatsapp_url && res.data?.sent_via_gateway === false) {
            devNotice.innerHTML = `Gateway WhatsApp belum terhubung. Anda dapat <a href="${res.data.whatsapp_url}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; font-weight: 600;">mengirim pesan verifikasi secara manual melalui tautan WhatsApp ini</a>.`;
            devNotice.style.display = 'block';
          } else {
            devNotice.style.display = 'none';
          }
        }

        api.showAlert('otpVerifyAlert', 'Kode OTP baru telah dikirimkan ke WhatsApp Anda.', 'success');
      } catch (err) {
        const msg = err.errors?.phone_number?.[0] || err.message || 'Gagal mengirim ulang kode OTP.';
        api.showAlert('otpVerifyAlert', msg, 'danger');
        updateOtpTimerDom();
      }
    });
  }

  const changeNumberBtn = document.getElementById('otpChangeNumberBtn');
  if (changeNumberBtn) {
    changeNumberBtn.addEventListener('click', () => {
      closeOtpVerifyModal();
      if (otpState.purpose === 'verify_phone') {
        openGooglePhoneModal(otpState.phoneNumber);
      } else {
        const regPhone = document.getElementById('regPhone');
        if (regPhone) regPhone.focus();
      }
    });
  }

  const googlePhoneForm = document.getElementById('googlePhoneForm');
  if (googlePhoneForm) {
    googlePhoneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('googlePhoneAlert');

      const phoneInput = document.getElementById('googlePhoneInput');
      const phone = phoneInput.value.trim();
      const sendBtn = document.getElementById('sendGooglePhoneOtpBtn');

      if (!phone) {
        api.showAlert('googlePhoneAlert', 'Masukkan nomor WhatsApp aktif Anda terlebih dahulu.', 'danger');
        phoneInput.focus();
        return;
      }

      try {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Mengirim OTP…';

        const res = await api.request('/auth/phone/send-otp', {
          method: 'POST',
          body: JSON.stringify({ phone_number: phone })
        });

        otpState.purpose = 'verify_phone';
        otpState.phoneNumber = res.data?.phone_number || phone;

        closeGooglePhoneModal();
        openOtpVerifyModal(
          res.data?.masked_phone || phone,
          res.data?.expires_in || 300,
          res.data?.resend_in || 60,
          res.data?.debug_otp || null,
          res.data?.whatsapp_url || null,
          res.data?.sent_via_gateway ?? true
        );
      } catch (err) {
        const msg = err.errors?.phone_number?.[0] || err.message || 'Gagal mengirim kode OTP ke nomor tersebut.';
        api.showAlert('googlePhoneAlert', msg, 'danger');
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Kirim Kode OTP';
      }
    });
  }

  const cancelGooglePhoneBtn = document.getElementById('cancelGooglePhoneBtn');
  if (cancelGooglePhoneBtn) {
    cancelGooglePhoneBtn.addEventListener('click', async () => {
      try {
        await api.request('/logout', { method: 'POST', skipAuthRedirect: true });
      } catch { }
      api.clearSession();
      closeGooglePhoneModal();
    });
  }

  const googleAccountForm = document.getElementById('googleAccountForm');
  if (googleAccountForm) {
    googleAccountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('googleAccountAlert');

      const emailInput = document.getElementById('googleModalEmail');
      const nameInput = document.getElementById('googleModalName');
      const email = emailInput.value.trim();
      const name = nameInput.value.trim();
      const submitBtn = document.getElementById('submitGoogleAccountBtn');

      if (!email || !name) {
        api.showAlert('googleAccountAlert', 'Masukkan alamat email Google dan nama lengkap Anda.', 'danger');
        (!email ? emailInput : nameInput).focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menghubungkan…';

        const res = await api.request('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ email, name })
        });

        document.getElementById('googleAccountModal').style.display = 'none';
        handlePostLoginSuccess(res);
      } catch (err) {
        const msg = err.errors?.google?.[0] || err.errors?.email?.[0] || err.message || 'Gagal masuk dengan akun Google.';
        api.showAlert('googleAccountAlert', msg, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Lanjutkan dengan Google';
      }
    });
  }

  const closeGoogleAccountBtn = document.getElementById('closeGoogleAccountBtn');
  if (closeGoogleAccountBtn) {
    closeGoogleAccountBtn.addEventListener('click', () => {
      const modal = document.getElementById('googleAccountModal');
      if (modal) modal.style.display = 'none';
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const googleAccModal = document.getElementById('googleAccountModal');
    if (googleAccModal && googleAccModal.style.display === 'flex') {
      googleAccModal.style.display = 'none';
      return;
    }

    const otpModal = document.getElementById('otpVerifyModal');
    if (otpModal && otpModal.style.display === 'flex') {
      closeOtpVerifyModal();
      if (otpState.purpose === 'verify_phone') {
        openGooglePhoneModal(otpState.phoneNumber);
      }
    }
  });
}

async function setupGoogleSignIn() {
  const container = document.getElementById('googleSignInContainer');
  const googleBtn = document.getElementById('googleAuthBtn');
  if (!container || !googleBtn) return;

  try {
    const infoRes = await api.request('/public-info', { skipAuthRedirect: true, priority: 'low' });
    googleClientId = infoRes.data?.google_client_id || null;
  } catch {
    googleClientId = null;
  }

  if (googleClientId) {
    const loadGsi = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render official Google button into container for seamless 1-click sync
      const hiddenRenderDiv = document.createElement('div');
      hiddenRenderDiv.id = 'googleOfficialBtnWrapper';
      hiddenRenderDiv.style.display = 'none';
      container.appendChild(hiddenRenderDiv);

      window.google.accounts.id.renderButton(hiddenRenderDiv, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'pill',
        text: 'continue_with',
      });
    };

    if (window.google?.accounts?.id) {
      loadGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = loadGsi;
      document.head.appendChild(script);
    }
  }

  googleBtn.addEventListener('click', () => {
    if (googleClientId && window.google?.accounts?.id) {
      const renderedBtn = document.querySelector('#googleOfficialBtnWrapper div[role="button"]');
      if (renderedBtn) {
        renderedBtn.click();
        return;
      }

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const fallbackRender = document.querySelector('#googleOfficialBtnWrapper div[role="button"]');
          if (fallbackRender) {
            fallbackRender.click();
          } else {
            openSimulatedGoogleModal();
          }
        }
      });
      return;
    }

    openSimulatedGoogleModal();
  });
}

function openSimulatedGoogleModal() {
  const modal = document.getElementById('googleAccountModal');
  if (modal) {
    api.hideAlert('googleAccountAlert');
    modal.style.display = 'flex';
    const emailInput = document.getElementById('googleModalEmail');
    if (emailInput) emailInput.focus();
  }
}

async function handleGoogleCredentialResponse(response) {
  const alertId = document.getElementById('loginAlert') ? 'loginAlert' : 'registerAlert';
  api.hideAlert(alertId);

  try {
    const res = await api.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: response.credential })
    });

    handlePostLoginSuccess(res);
  } catch (err) {
    const msg = err.errors?.google?.[0] || err.message || 'Autentikasi Google gagal diproses.';
    api.showAlert(alertId, msg, 'danger');
  }
}

let publicPolisCache = [];

async function loadPublicHomepage() {
  initHomeMobileMenu();

  const token = api.getToken();
  const user = api.getUser();
  const navLinks = document.getElementById('homeNavLinks') || document.querySelector('.home-nav-center');
  const navAction = document.getElementById('navAuthAction');
  const navBookingLink = document.getElementById('navBookingLink');
  const heroBookingCta = document.getElementById('heroBookingCta');
  const highlightActionLink = document.getElementById('highlightActionLink');
  const isLoggedInPatient = Boolean(token && user && user.role === 'pasien');

  if (token && user && navAction) {
    if (user.role === 'pasien') {
      if (navLinks) {
        navLinks.innerHTML = `
          <li><a href="/index.html" class="patient-nav-link active" aria-current="page">BERANDA</a></li>
          <li><a href="/pasien/janji-temu.html" id="navBookingLink" class="patient-nav-link">JANJI TEMU</a></li>
          <li><a href="/pasien/jadwal-kontrol.html" class="patient-nav-link">JADWAL KONTROL</a></li>
          <li><a href="/pasien/riwayat.html" class="patient-nav-link">RIWAYAT</a></li>
        `;
      }

      navAction.innerHTML = `
        <button type="button" id="homeLogoutBtn" class="patient-nav-link" style="background:none;border:none;cursor:pointer;">KELUAR</button>
        <a href="/pasien/profil.html" id="navAuthPrimary" class="patient-pill-cta" title="Profil Pasien">
          <span id="navUserName">${escapeHtml(user.name)}</span>
          <span>· Profil</span>
          <span class="patient-arrow" aria-hidden="true">&#x2197;</span>
        </a>
      `;

      const homeLogoutBtn = document.getElementById('homeLogoutBtn');
      if (homeLogoutBtn) {
        homeLogoutBtn.addEventListener('click', () => {
          if (confirm('Keluar dari akunmu sekarang?')) {
            api.logout();
          }
        });
      }

      // Update mobile drawer items for logged in patient to match navbar items
      const drawerList = document.querySelector('.patient-drawer__list');
      if (drawerList) {
        drawerList.innerHTML = `
          <li class="patient-drawer__item">
            <div class="patient-drawer__row">
              <a href="/index.html" class="patient-drawer__link active" aria-current="page">BERANDA</a>
              <span class="patient-arrow" aria-hidden="true">&#x2197;</span>
            </div>
          </li>
          <li class="patient-drawer__item">
            <div class="patient-drawer__row">
              <a href="/pasien/janji-temu.html" class="patient-drawer__link">JANJI TEMU</a>
              <span class="patient-arrow" aria-hidden="true">&#x2197;</span>
            </div>
          </li>
          <li class="patient-drawer__item patient-drawer__item--expandable" id="drawerRowJadwalKontrol">
            <div class="patient-drawer__row">
              <a href="/pasien/jadwal-kontrol.html" class="patient-drawer__link">JADWAL KONTROL</a>
              <button type="button" id="drawerExpandBtn" class="patient-drawer__toggle-expand" aria-expanded="false" aria-controls="drawerSubInfo" aria-label="Rincian informasi jadwal kontrol">+</button>
            </div>
            <div id="drawerSubInfo" class="patient-drawer__subinfo" hidden>
              <p class="patient-drawer__subtext">Kunjungan ulang terjadwal dari dokter Anda.</p>
              <a href="/pasien/jadwal-kontrol.html" class="patient-drawer__sublink">Buka Jadwal Kontrol &#x2197;</a>
            </div>
          </li>
          <li class="patient-drawer__item">
            <div class="patient-drawer__row">
              <a href="/pasien/riwayat.html" class="patient-drawer__link">RIWAYAT PEMERIKSAAN</a>
              <span class="patient-arrow" aria-hidden="true">&#x2197;</span>
            </div>
          </li>
          <li class="patient-drawer__item">
            <div class="patient-drawer__row">
              <a href="/pasien/profil.html" class="patient-drawer__link">PROFIL SAYA</a>
              <span class="patient-arrow" aria-hidden="true">&#x2197;</span>
            </div>
          </li>
          <li class="patient-drawer__item">
            <div class="patient-drawer__row">
              <button type="button" id="drawerLogoutBtn" class="patient-drawer__link" style="background:none;border:none;text-align:left;width:100%;cursor:pointer;">KELUAR</button>
              <span class="patient-arrow" aria-hidden="true">&#x2197;</span>
            </div>
          </li>
        `;

        const expandBtn = document.getElementById('drawerExpandBtn');
        const subInfo = document.getElementById('drawerSubInfo');
        if (expandBtn && subInfo) {
          expandBtn.addEventListener('click', () => {
            const isHidden = subInfo.hidden;
            subInfo.hidden = !isHidden;
            expandBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
            expandBtn.textContent = isHidden ? '−' : '+';
          });
        }

        const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');
        if (drawerLogoutBtn) {
          drawerLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Keluar dari akunmu sekarang?')) {
              api.logout();
            }
          });
        }
      }

      const drawerCtaBtn = document.getElementById('drawerCtaBtn');
      if (drawerCtaBtn) {
        drawerCtaBtn.setAttribute('href', '/pasien/profil.html');
        drawerCtaBtn.innerHTML = `<span>PROFIL (${escapeHtml(user.name)})</span><span class="patient-arrow" aria-hidden="true">&#x2197;</span>`;
      }

      if (heroBookingCta) {
        heroBookingCta.setAttribute('href', '/pasien/janji-temu.html');
        heroBookingCta.textContent = 'Buat Janji Sekarang';
      }
      if (highlightActionLink) {
        highlightActionLink.setAttribute('href', '/pasien/janji-temu.html');
        highlightActionLink.textContent = 'Buat Janji Sekarang';
      }
    } else {
      const dashboardUrl = user.role === 'dokter' ? '/dokter/janji-temu.html' : '/admin/kelola-janji.html';
      navAction.innerHTML = `
        <span class="patient-nav-link">${escapeHtml(user.name)}</span>
        <a href="${dashboardUrl}" class="patient-pill-cta">
          <span>PORTAL STAF</span>
          <span class="patient-arrow" aria-hidden="true">&#x2197;</span>
        </a>
      `;

      const drawerCtaBtn = document.getElementById('drawerCtaBtn');
      if (drawerCtaBtn) {
        drawerCtaBtn.setAttribute('href', dashboardUrl);
        drawerCtaBtn.innerHTML = `<span>DASHBOARD</span><span class="patient-arrow" aria-hidden="true">&#x2197;</span>`;
      }

      if (navBookingLink) {
        navBookingLink.setAttribute('href', dashboardUrl);
      }
      if (heroBookingCta) {
        heroBookingCta.setAttribute('href', dashboardUrl);
        heroBookingCta.textContent = user.role === 'dokter' ? 'Buka Portal Dokter' : 'Kelola Janji';
      }
      if (highlightActionLink) {
        highlightActionLink.setAttribute('href', dashboardUrl);
        highlightActionLink.textContent = user.role === 'dokter' ? 'Buka Portal Dokter' : 'Buat Janji Sekarang';
      }
    }
  }

  const searchInput = document.getElementById('poliSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderPublicPoliCards(publicPolisCache, searchInput.value.trim(), isLoggedInPatient);
    });
  }

  try {
    const res = await api.request('/public-info', { priority: 'high' });
    const info = res.data || {};

    if (info.clinic_name) {
      const nameEl = document.getElementById('clinicName');
      const navNameEl = document.getElementById('navClinicName');
      if (nameEl) nameEl.textContent = info.clinic_name;
      if (navNameEl) {
        const brandTextEl = navNameEl.querySelector('.brand-text');
        if (brandTextEl) {
          brandTextEl.textContent = info.clinic_name;
        } else {
          navNameEl.textContent = info.clinic_name;
        }
      }
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

    publicPolisCache = info.polyclinics || [];
    renderPublicPoliCards(publicPolisCache, searchInput ? searchInput.value.trim() : '', isLoggedInPatient);
  } catch {
    const poliContainer = document.getElementById('publicPoliList');
    if (poliContainer) {
      poliContainer.innerHTML = '<div class="poli-card"><p class="text-muted">Gagal memuat daftar layanan. Coba muat ulang halaman.</p></div>';
    }
  }
}

function renderPublicPoliCards(polis, query, isLoggedInPatient) {
  const poliContainer = document.getElementById('publicPoliList');
  if (!poliContainer) return;

  if (!Array.isArray(polis) || polis.length === 0) {
    poliContainer.innerHTML = '<div class="poli-card"><p class="text-muted">Daftar poli belum tersedia</p></div>';
    return;
  }

  const keyword = String(query || '').toLowerCase();
  const filtered = keyword
    ? polis.filter((p) => {
      const nameMatch = String(p.name || '').toLowerCase().includes(keyword);
      const descMatch = String(p.description || '').toLowerCase().includes(keyword);
      const docMatch = Array.isArray(p.doctors) && p.doctors.some((d) => String(d.name || '').toLowerCase().includes(keyword));
      return nameMatch || descMatch || docMatch;
    })
    : polis;

  if (filtered.length === 0) {
    poliContainer.innerHTML = `
      <div class="poli-card">
        <div>
          <h3 class="poli-card__title">Poli tidak ditemukan</h3>
          <p class="poli-card__desc">Tidak ada poliklinik yang cocok dengan kata kunci "${escapeHtml(query)}".</p>
        </div>
        <div class="poli-card__action">
          <button type="button" id="resetPoliSearchBtn" class="btn btn-pill-outline">Tampilkan Semua Poli</button>
        </div>
      </div>
    `;
    const resetBtn = document.getElementById('resetPoliSearchBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('poliSearchInput');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        renderPublicPoliCards(publicPolisCache, '', isLoggedInPatient);
      });
    }
    return;
  }

  poliContainer.innerHTML = filtered.map((p) => {
    const iconId = resolvePoliIconId(p.name);
    const targetBookingPath = `/pasien/janji-temu.html?poli=${encodeURIComponent(p.id)}`;
    const actionHref = isLoggedInPatient
      ? targetBookingPath
      : `/login.html?next=${encodeURIComponent(targetBookingPath)}`;
    const doctors = Array.isArray(p.doctors) ? p.doctors : [];

    return `
      <article class="poli-card">
        <div>
          <div class="poli-card__top mb-2">
            <span class="icon-box" aria-hidden="true">
              <svg width="22" height="22"><use href="/images/icons.svg#${iconId}"></use></svg>
            </span>
            <div>
              <h3 class="poli-card__title">${escapeHtml(p.name)}</h3>
              <p class="poli-card__desc">${escapeHtml(p.description || 'Layanan konsultasi dan pemeriksaan rawat jalan.')}</p>
            </div>
          </div>

          <div class="poli-card__doctors mt-4">
            <span class="poli-card__doctors-label">Dokter Praktik Aktif (${doctors.length}):</span>
            <ul class="poli-card__doctors-list">
              ${doctors.length > 0
        ? doctors.map((d) => `<li>${escapeHtml(d.name)}</li>`).join('')
        : '<li>Jadwal dokter sedang diperbarui</li>'
      }
            </ul>
          </div>
        </div>

        <div class="poli-card__action">
          <a href="${actionHref}" class="btn btn-pill-dark" aria-label="Buat janji di ${escapeHtml(p.name)}">Buat Janji</a>
        </div>
      </article>
    `;
  }).join('');
}

function initHomeMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('patientDrawerOverlay') || document.getElementById('navbarMenuPanel');
  const closeBtn = document.getElementById('closeDrawerBtn');
  const expandBtn = document.getElementById('drawerExpandBtn');
  const subInfo = document.getElementById('drawerSubInfo');

  if (!menuBtn || !overlay) return;

  const openDrawer = () => {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  };

  const closeDrawer = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menuBtn.focus();
  };

  menuBtn.addEventListener('click', () => {
    if (overlay.classList.contains('is-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  // Close when clicking outside drawer panel (peek area / backdrop)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeDrawer();
    }
  });

  // Toggle drawer subinfo accordion
  if (expandBtn && subInfo) {
    expandBtn.addEventListener('click', () => {
      const isExpanded = expandBtn.getAttribute('aria-expanded') === 'true';
      expandBtn.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
      expandBtn.textContent = !isExpanded ? '−' : '+';
      subInfo.hidden = isExpanded;
    });
  }

  // Close drawer when an internal anchor link is clicked
  const drawerLinks = overlay.querySelectorAll('a[href^="#"]');
  drawerLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeDrawer();
    }
  });
}

function resolvePoliIconId(poliName) {
  const lower = String(poliName || '').toLowerCase();
  if (lower.includes('gigi')) return 'icon-tooth';
  if (lower.includes('dalam') || lower.includes('jantung') || lower.includes('penyakit')) return 'icon-internal';
  if (lower.includes('umum')) return 'icon-stethoscope';
  return 'icon-medical-plus';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
