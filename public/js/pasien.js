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

    const phoneInput = document.getElementById('phone_number');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '');
        if (val.startsWith('0062')) val = val.substring(4);
        while (val.startsWith('62')) val = val.substring(2);
        if (val.startsWith('0')) val = val.substring(1);
        if (this.value !== val) {
          this.value = val;
        }
      });
    }

    loadProfile();

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('profileAlert');

      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const nameInput = document.getElementById('name');
      const name = nameInput.value.trim();
      const rawPhone = document.getElementById('phone_number').value.trim();
      let phone_number = '';
      if (rawPhone) {
        let cleanDigits = rawPhone.replace(/\D/g, '');
        if (cleanDigits.startsWith('0062')) cleanDigits = cleanDigits.substring(4);
        while (cleanDigits.startsWith('62')) cleanDigits = cleanDigits.substring(2);
        if (cleanDigits.startsWith('0')) cleanDigits = cleanDigits.substring(1);
        phone_number = cleanDigits ? '62' + cleanDigits : '';
      }
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

        const updatedUser = { ...currentUser, name: res.data.name, phone_number: res.data.phone_number };
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
    let rawPhone = user.phone_number || '';
    if (rawPhone.startsWith('62')) rawPhone = rawPhone.substring(2);
    else if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
    document.getElementById('phone_number').value = rawPhone;
    document.getElementById('birth_date').value = user.birth_date || '';
    document.getElementById('address').value = user.address || '';
  } catch (err) {
    api.showAlert('profileAlert', 'Gagal memuat profil. Coba muat ulang halaman. (' + err.message + ')', 'danger');
  }
}

let poliData = [];

const DAY_NAMES_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const DAY_NAMES_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function parseIsoDateLocal(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatIsoDateLocal(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysToIso(dateStr, days) {
  const d = parseIsoDateLocal(dateStr);
  d.setDate(d.getDate() + days);
  return formatIsoDateLocal(d);
}

function formatFullDateId(dateStr) {
  if (!dateStr) return 'Pilih tanggal';
  const d = parseIsoDateLocal(dateStr);
  return `${DAY_NAMES_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function getDoctorInitials(name) {
  if (!name) return 'DR';
  const cleaned = name
    .replace(/^drg?\.\s*/i, '')
    .split(',')[0]
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPatientPhoneDisplay(rawPhone) {
  if (!rawPhone) return { localPart: 'Belum diatur di profil', fullLabel: 'WhatsApp belum diatur' };
  let clean = String(rawPhone).replace(/\D/g, '');
  if (clean.startsWith('0062')) clean = clean.substring(4);
  while (clean.startsWith('62')) clean = clean.substring(2);
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (!clean) return { localPart: 'Belum diatur di profil', fullLabel: 'WhatsApp belum diatur' };
  const grouped = clean.replace(/^(\d{3,4})(\d{4})(\d+)$/, '$1-$2-$3');
  return {
    localPart: grouped,
    fullLabel: `WhatsApp +62 ${grouped}`
  };
}

async function initBookingPage() {
  const poliSelect = document.getElementById('polyclinic_id');
  const doctorSelect = document.getElementById('doctor_id');
  const dateInput = document.getElementById('appointment_date');
  const timeSelect = document.getElementById('appointment_time');
  const complaintInput = document.getElementById('complaint');

  // Month Calendar & Strip Elements
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const calendarMonthLabel = document.getElementById('calendarMonthLabel') || document.getElementById('calMonthLabel') || document.getElementById('dateStripMonthLabel');
  const calendarPrevBtn = document.getElementById('calendarPrevMonth') || document.getElementById('calPrevMonth') || document.getElementById('dateStripPrev');
  const calendarNextBtn = document.getElementById('calendarNextMonth') || document.getElementById('calNextMonth') || document.getElementById('dateStripNext');
  const dateStripContainer = document.getElementById('dateStripContainer');

  // Doctor & Poli Filter Elements
  const poliFilterPills = document.getElementById('poliFilterPills');
  const doctorCardsGrid = document.getElementById('doctorCardsGrid');
  const activeDoctorCount = document.getElementById('activeDoctorCount');
  const step2Subtitle = document.getElementById('step2Subtitle');

  // Time Slots & Session Columns Elements
  const timeSlotColumns = document.getElementById('timeSlotColumns');
  const morningSlotsGrid = document.getElementById('morningSlotsGrid');
  const afternoonSlotsGrid = document.getElementById('afternoonSlotsGrid');
  const eveningSlotsGrid = document.getElementById('eveningSlotsGrid');
  const timeSlotGroups = document.getElementById('timeSlotGroups');
  const slotCountBadge = document.getElementById('slotCountBadge');

  // Session Filter Checkboxes
  const filterSessionPagi = document.getElementById('filterSessionPagi') || document.getElementById('filterMorning');
  const filterSessionSore = document.getElementById('filterSessionSore') || document.getElementById('filterEvening');
  const filterSessionAfternoon = document.getElementById('filterAfternoon');

  // WhatsApp & Summary Elements
  const waDisplay = document.getElementById('bookingWhatsappDisplay');
  const summaryPoli = document.getElementById('summaryPoli');
  const summaryDoctor = document.getElementById('summaryDoctor');
  const summaryDate = document.getElementById('summaryDate');
  const summaryTime = document.getElementById('summaryTime');
  const summaryRoom = document.getElementById('summaryRoom');
  const summaryPatientName = document.getElementById('summaryPatientName');
  const summaryPatientPhone = document.getElementById('summaryPatientPhone');
  const submitBookingBtn = document.getElementById('submitBookingBtn');

  // Date Boundaries: Today up to 4 days ahead (H to H+4)
  const todayObj = new Date();
  const todayStr = formatIsoDateLocal(todayObj);
  const maxAllowedDateStr = addDaysToIso(todayStr, 4);
  const maxAllowedDateObj = parseIsoDateLocal(maxAllowedDateStr);

  let currentCalYear = todayObj.getFullYear();
  let currentCalMonth = todayObj.getMonth();
  let stripStartStr = todayStr;
  let lastLoadedSlots = [];

  if (dateInput) {
    dateInput.min = todayStr;
    dateInput.max = maxAllowedDateStr;
    // Keep empty initially so step 1 must be completed by patient selection
    dateInput.value = '';
  }

  // Smooth scroll to step helper
  const scrollToStep = (stepNumber) => {
    const targetCard = document.getElementById(`stepCard${stepNumber}`) ||
      document.querySelector(`[aria-labelledby="step${stepNumber}Title"]`) ||
      document.querySelector(`[data-step="${stepNumber}"]`);
    if (targetCard && typeof targetCard.scrollIntoView === 'function') {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Progressive Disclosure: Sync Step Visibility & Stepper States
  const syncStepProgression = () => {
    const step1Done = Boolean(dateInput && dateInput.value && dateInput.value >= todayStr && dateInput.value <= maxAllowedDateStr);
    const step2Done = step1Done && Boolean(doctorSelect && doctorSelect.value);
    const step3Done = step2Done && Boolean(timeSelect && timeSelect.value);
    const step4Done = step3Done; // WhatsApp connected
    const step5Done = step3Done; // Ready to submit

    const stepCard1 = document.getElementById('stepCard1');
    const stepCard2 = document.getElementById('stepCard2');
    const stepCard3 = document.getElementById('stepCard3');
    const stepCard4 = document.getElementById('stepCard4');
    const stepCard5 = document.getElementById('stepCard5');

    // Step 1: Always visible
    if (stepCard1) {
      stepCard1.classList.remove('is-step-hidden');
      stepCard1.classList.toggle('is-step-completed', step1Done);
      stepCard1.classList.toggle('is-step-active', !step1Done);
    }

    // Step 2: Visible only if Step 1 is done
    if (stepCard2) {
      if (step1Done) {
        stepCard2.classList.remove('is-step-hidden');
        stepCard2.classList.toggle('is-step-completed', step2Done);
        stepCard2.classList.toggle('is-step-active', !step2Done);
      } else {
        stepCard2.classList.add('is-step-hidden');
        stepCard2.classList.remove('is-step-completed', 'is-step-active');
      }
    }

    // Step 3: Visible only if Step 2 is done
    if (stepCard3) {
      if (step2Done) {
        stepCard3.classList.remove('is-step-hidden');
        stepCard3.classList.toggle('is-step-completed', step3Done);
        stepCard3.classList.toggle('is-step-active', !step3Done);
      } else {
        stepCard3.classList.add('is-step-hidden');
        stepCard3.classList.remove('is-step-completed', 'is-step-active');
      }
    }

    // Step 4 & 5: Visible only if Step 3 is done
    if (stepCard4) {
      if (step3Done) {
        stepCard4.classList.remove('is-step-hidden');
        stepCard4.classList.add('is-step-completed');
      } else {
        stepCard4.classList.add('is-step-hidden');
        stepCard4.classList.remove('is-step-completed', 'is-step-active');
      }
    }

    if (stepCard5) {
      if (step3Done) {
        stepCard5.classList.remove('is-step-hidden');
        stepCard5.classList.add('is-step-active');
      } else {
        stepCard5.classList.add('is-step-hidden');
        stepCard5.classList.remove('is-step-completed', 'is-step-active');
      }
    }

    // Stepper Items
    const updateStepperItem = (stepId, isCompleted, isActive, isDisabled) => {
      const el = document.getElementById(stepId);
      if (!el) return;
      el.classList.remove('is-completed', 'is-active', 'is-upcoming', 'is-disabled');
      if (isCompleted) {
        el.classList.add('is-completed');
      } else if (isActive) {
        el.classList.add('is-active');
      } else if (isDisabled) {
        el.classList.add('is-upcoming', 'is-disabled');
      }
    };

    updateStepperItem('stepperStep1', step1Done, !step1Done, false);
    updateStepperItem('stepperStep2', step2Done, step1Done && !step2Done, !step1Done);
    updateStepperItem('stepperStep3', step3Done, step2Done && !step3Done, !step2Done);
    updateStepperItem('stepperStep4', step4Done, false, !step3Done);
    updateStepperItem('stepperStep5', false, step3Done, !step3Done);

    if (submitBookingBtn) {
      submitBookingBtn.disabled = !step3Done;
    }
  };

  // Wire click to navigate stepper (only for unlocked steps)
  document.querySelectorAll('.stepper-step, .booking-stepper-item, .booking-nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (item.classList.contains('is-disabled')) {
        e.preventDefault();
        return;
      }
      const stepVal = parseInt(item.getAttribute('data-step') || '0', 10);
      if (stepVal) scrollToStep(stepVal);
    });
  });

  // Sync patient info from authenticated session
  const syncPatientInfoUI = (userObj) => {
    if (!userObj) return;
    const phoneInfo = formatPatientPhoneDisplay(userObj.phone_number);
    if (waDisplay) waDisplay.value = phoneInfo.localPart;
    if (summaryPatientName) summaryPatientName.textContent = userObj.name || 'Pasien Nuvacare';
    if (summaryPatientPhone) summaryPatientPhone.textContent = phoneInfo.fullLabel;
  };

  syncPatientInfoUI(api.getUser());

  api.request('/profil', { priority: 'low' })
    .then((res) => {
      if (res && res.data) {
        const merged = { ...(api.getUser() || {}), ...res.data };
        api.setUser(merged);
        syncPatientInfoUI(merged);
      }
    })
    .catch(() => {});

  // Update live reservation receipt sidebar
  const updateBookingSummary = () => {
    const selectedPoliId = parseInt(poliSelect?.value || '0', 10);
    const selectedDocId = parseInt(doctorSelect?.value || '0', 10);
    const selectedDate = dateInput?.value || '';
    const selectedTime = timeSelect?.value || '';

    const poliObj = poliData.find((p) => p.id === selectedPoliId);
    const docObj = poliObj
      ? (poliObj.doctors || []).find((d) => d.id === selectedDocId)
      : null;

    if (summaryPoli) {
      if (selectedDate && poliObj) {
        summaryPoli.textContent = poliObj.name;
      } else if (selectedDate) {
        summaryPoli.textContent = 'Pilih dokter spesialis pada Langkah 2';
      } else {
        summaryPoli.textContent = 'Belum dipilih';
      }
    }
    if (summaryDoctor) {
      if (selectedDate && docObj) {
        summaryDoctor.textContent = docObj.name;
      } else if (selectedDate) {
        summaryDoctor.textContent = 'Pilih dokter spesialis pada Langkah 2';
      } else {
        summaryDoctor.textContent = 'Pilih tanggal kunjungan terlebih dahulu';
      }
    }
    if (summaryRoom) {
      summaryRoom.textContent = poliObj
        ? `Gedung Utama Lt. ${(poliObj.id % 3) + 1}, Ruang ${100 + poliObj.id}`
        : 'Gedung Utama Rawat Jalan';
    }
    if (summaryDate) {
      summaryDate.textContent = selectedDate ? formatFullDateId(selectedDate) : 'Pilih tanggal kunjungan';
    }
    if (summaryTime) {
      if (selectedTime) {
        const hour = parseInt(selectedTime.split(':')[0], 10);
        const sessionLabel = hour < 12 ? 'Sesi Pagi' : hour < 15 ? 'Sesi Siang' : 'Sesi Sore';
        summaryTime.textContent = `Pukul ${selectedTime} WIB (${sessionLabel})`;
      } else {
        summaryTime.textContent = selectedDate && docObj ? 'Pilih sesi jam pada Langkah 3' : 'Pilih setelah menentukan dokter';
      }
    }
    if (step2Subtitle) {
      step2Subtitle.textContent = selectedDate
        ? `Poliklinik aktif pada ${formatFullDateId(selectedDate)}`
        : 'Filter poliklinik dan pilih dokter yang aktif bertugas';
    }

    syncStepProgression();
  };

  // Month Calendar Grid Renderer
  const renderMonthCalendar = (year, month) => {
    if (calendarMonthLabel) {
      calendarMonthLabel.textContent = `${MONTH_NAMES_ID[month]} ${year}`;
    }

    // Boundary check for Previous Button: user cannot navigate before current month
    if (calendarPrevBtn) {
      const isPastMonth = (year < todayObj.getFullYear()) ||
        (year === todayObj.getFullYear() && month <= todayObj.getMonth());
      calendarPrevBtn.disabled = isPastMonth;
      if (isPastMonth) {
        calendarPrevBtn.setAttribute('aria-disabled', 'true');
      } else {
        calendarPrevBtn.removeAttribute('aria-disabled');
      }
    }

    // Boundary check for Next Button: cannot navigate past month of max allowed date (H+4)
    if (calendarNextBtn) {
      const nextMonthFirstDate = new Date(year, month + 1, 1);
      const isBeyondWindow = formatIsoDateLocal(nextMonthFirstDate) > maxAllowedDateStr;
      calendarNextBtn.disabled = isBeyondWindow;
      if (isBeyondWindow) {
        calendarNextBtn.setAttribute('aria-disabled', 'true');
      } else {
        calendarNextBtn.removeAttribute('aria-disabled');
      }
    }

    if (!calendarDaysGrid) return;

    const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 = Min, 1 = Sen ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const selectedDateStr = dateInput ? dateInput.value : '';

    const cells = [];

    // Leading days from previous month
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const num = daysInPrevMonth - i;
      cells.push(`
        <div class="calendar-day-cell is-outside-month is-disabled" aria-hidden="true">
          <span class="calendar-day-number">${num}</span>
        </div>
      `);
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isAvailable = dateStr >= todayStr && dateStr <= maxAllowedDateStr;
      const isSelected = dateStr === selectedDateStr;

      if (isAvailable) {
        cells.push(`
          <button
            type="button"
            class="calendar-day-cell is-available ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}"
            data-date="${dateStr}"
            aria-label="${formatFullDateId(dateStr)}"
            aria-pressed="${isSelected ? 'true' : 'false'}"
          >
            <span class="calendar-day-number">${d}</span>
            ${isToday ? '<span class="calendar-day-badge">Hari ini</span>' : '<span class="calendar-day-status">Tersedia</span>'}
          </button>
        `);
      } else {
        cells.push(`
          <div class="calendar-day-cell is-disabled ${isToday ? 'is-today' : ''}" aria-disabled="true">
            <span class="calendar-day-number">${d}</span>
            ${isToday ? '<span class="calendar-day-badge">Hari ini</span>' : ''}
          </div>
        `);
      }
    }

    // Trailing days to finish 7-day grid row
    const totalCells = firstDayWeekday + daysInMonth;
    const trailingCount = (7 - (totalCells % 7)) % 7;
    for (let t = 1; t <= trailingCount; t++) {
      cells.push(`
        <div class="calendar-day-cell is-outside-month is-disabled" aria-hidden="true">
          <span class="calendar-day-number">${t}</span>
        </div>
      `);
    }

    calendarDaysGrid.innerHTML = cells.join('');

    calendarDaysGrid.querySelectorAll('.calendar-day-cell.is-available').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosenDate = btn.getAttribute('data-date');
        if (!chosenDate || !dateInput) return;
        const dateChanged = dateInput.value !== chosenDate;
        dateInput.value = chosenDate;
        if (dateChanged && timeSelect) {
          timeSelect.value = '';
        }
        dateInput.dispatchEvent(new Event('change'));
        renderMonthCalendar(currentCalYear, currentCalMonth);
        renderDateStrip();
        updateBookingSummary();
        if (!doctorSelect.value) {
          scrollToStep(2);
        }
      });
    });
  };

  // Month navigation handlers
  if (calendarPrevBtn) {
    calendarPrevBtn.addEventListener('click', () => {
      if (currentCalMonth === 0) {
        currentCalMonth = 11;
        currentCalYear -= 1;
      } else {
        currentCalMonth -= 1;
      }
      renderMonthCalendar(currentCalYear, currentCalMonth);
    });
  }

  if (calendarNextBtn) {
    calendarNextBtn.addEventListener('click', () => {
      if (currentCalMonth === 11) {
        currentCalMonth = 0;
        currentCalYear += 1;
      } else {
        currentCalMonth += 1;
      }
      renderMonthCalendar(currentCalYear, currentCalMonth);
    });
  }

  // Date strip fallback renderer
  const renderDateStrip = () => {
    if (!dateStripContainer || !dateInput) return;
    const selectedDateStr = dateInput.value || '';

    const buttonsHtml = [];
    for (let i = 0; i < 5; i++) {
      const currentStr = addDaysToIso(todayStr, i);
      const currentObj = parseIsoDateLocal(currentStr);
      const dayShort = DAY_NAMES_SHORT[currentObj.getDay()];
      const dateNum = currentObj.getDate();
      const isSelected = selectedDateStr ? currentStr === selectedDateStr : false;

      buttonsHtml.push(`
        <button
          type="button"
          class="date-card-btn ${isSelected ? 'is-selected' : ''}"
          data-date="${currentStr}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >
          <span class="date-card-day">${dayShort}</span>
          <span class="date-card-num">${dateNum}</span>
          <span class="date-card-status">${isSelected ? 'Terpilih' : 'Tersedia'}</span>
        </button>
      `);
    }

    dateStripContainer.innerHTML = buttonsHtml.join('');
    dateStripContainer.querySelectorAll('.date-card-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetDate = btn.getAttribute('data-date');
        if (!targetDate || !dateInput) return;
        const dateChanged = dateInput.value !== targetDate;
        dateInput.value = targetDate;
        if (dateChanged && timeSelect) {
          timeSelect.value = '';
        }
        dateInput.dispatchEvent(new Event('change'));
        renderMonthCalendar(currentCalYear, currentCalMonth);
        renderDateStrip();
        updateBookingSummary();
        if (!doctorSelect.value) {
          scrollToStep(2);
        }
      });
    });
  };

  // Apply session visibility filters (Morning, Afternoon, Evening)
  const applySessionFilters = () => {
    const pagiChecked = (filterSessionPagi ? filterSessionPagi.checked : true);
    const soreChecked = (filterSessionSore ? filterSessionSore.checked : true);
    const afternoonChecked = filterSessionAfternoon ? filterSessionAfternoon.checked : soreChecked;

    const morningCol = document.querySelector('[data-session-col="morning"]');
    const afternoonCol = document.querySelector('[data-session-col="afternoon"]');
    const eveningCol = document.querySelector('[data-session-col="evening"]');

    if (morningCol) morningCol.style.display = pagiChecked ? '' : 'none';
    if (afternoonCol) afternoonCol.style.display = afternoonChecked ? '' : 'none';
    if (eveningCol) eveningCol.style.display = soreChecked ? '' : 'none';
  };

  if (filterSessionPagi) filterSessionPagi.addEventListener('change', applySessionFilters);
  if (filterSessionSore) filterSessionSore.addEventListener('change', applySessionFilters);
  if (filterSessionAfternoon) filterSessionAfternoon.addEventListener('change', applySessionFilters);

  // Time Slots Renderer across Morning, Afternoon, and Evening columns
  const renderTimeSlotColumns = (slots, stateMessage = '') => {
    const emptyNotice = (msg) => `<div class="booking-empty-hint">${escapeHtml(msg)}</div>`;

    if (stateMessage) {
      if (morningSlotsGrid) morningSlotsGrid.innerHTML = emptyNotice(stateMessage);
      if (afternoonSlotsGrid) afternoonSlotsGrid.innerHTML = emptyNotice('-');
      if (eveningSlotsGrid) eveningSlotsGrid.innerHTML = emptyNotice('-');
      if (timeSlotGroups) timeSlotGroups.innerHTML = emptyNotice(stateMessage);
      return;
    }

    const selectedTime = timeSelect ? timeSelect.value : '';
    const morningSlots = slots.filter((s) => parseInt(String(s.time).split(':')[0], 10) < 12);
    const afternoonSlots = slots.filter((s) => {
      const h = parseInt(String(s.time).split(':')[0], 10);
      return h >= 12 && h < 15;
    });
    const eveningSlots = slots.filter((s) => parseInt(String(s.time).split(':')[0], 10) >= 15);

    const buildPillsHtml = (items, fallbackText) => {
      if (!items || items.length === 0) {
        return `<div class="booking-empty-hint">${escapeHtml(fallbackText)}</div>`;
      }
      return items.map((s) => {
        const isSelected = s.available && s.time === selectedTime;
        const statusText = !s.available ? 'Penuh' : isSelected ? 'Terpilih' : 'Tersedia';
        return `
          <button
            type="button"
            class="slot-pill-btn ${isSelected ? 'is-selected' : ''} ${!s.available ? 'is-booked' : 'is-available'}"
            data-time="${escapeHtml(s.time)}"
            ${!s.available ? 'disabled' : ''}
            aria-pressed="${isSelected ? 'true' : 'false'}"
          >
            <span class="slot-pill-time">${escapeHtml(s.time)} WIB</span>
            <span class="slot-pill-meta">${statusText}</span>
          </button>
        `;
      }).join('');
    };

    if (morningSlotsGrid) morningSlotsGrid.innerHTML = buildPillsHtml(morningSlots, 'Tidak ada slot pagi');
    if (afternoonSlotsGrid) afternoonSlotsGrid.innerHTML = buildPillsHtml(afternoonSlots, 'Tidak ada slot siang');
    if (eveningSlotsGrid) eveningSlotsGrid.innerHTML = buildPillsHtml(eveningSlots, 'Tidak ada slot sore');

    // Also populate fallback timeSlotGroups for accessibility
    if (timeSlotGroups) {
      const buildGroupBlock = (title, items) => {
        if (!items || items.length === 0) return '';
        return `
          <div class="slot-session-block">
            <div class="slot-session-title">${escapeHtml(title)}</div>
            <div class="slot-pills-grid">${buildPillsHtml(items, 'Tidak ada slot')}</div>
          </div>
        `;
      };
      timeSlotGroups.innerHTML =
        buildGroupBlock('Sesi Pagi (Sebelum 12:00 WIB)', morningSlots) +
        buildGroupBlock('Sesi Siang (12:00 - 15:00 WIB)', afternoonSlots) +
        buildGroupBlock('Sesi Sore (15:00 WIB ke atas)', eveningSlots);
    }

    applySessionFilters();

    // Attach click handlers to all clickable slot buttons
    const allSlotButtons = document.querySelectorAll(
      '#morningSlotsGrid .slot-pill-btn:not(:disabled), ' +
      '#afternoonSlotsGrid .slot-pill-btn:not(:disabled), ' +
      '#eveningSlotsGrid .slot-pill-btn:not(:disabled), ' +
      '#timeSlotGroups .slot-pill-btn:not(:disabled)'
    );

    allSlotButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosenTime = btn.getAttribute('data-time');
        if (!chosenTime || !timeSelect) return;
        timeSelect.value = chosenTime;
        timeSelect.dispatchEvent(new Event('change'));
        scrollToStep(4);
      });
    });
  };

  // Render Polyclinic Filter Pills and Doctor Cards
  const renderPoliPillsAndDoctorCards = () => {
    const selectedPoliId = poliSelect && poliSelect.value ? parseInt(poliSelect.value, 10) : 0;
    const selectedDocId = doctorSelect && doctorSelect.value ? parseInt(doctorSelect.value, 10) : 0;

    if (poliFilterPills) {
      const allPills = [
        `<button type="button" class="poli-pill-btn ${!selectedPoliId ? 'is-active' : ''}" data-poli-id="" aria-pressed="${!selectedPoliId ? 'true' : 'false'}">Semua Poli</button>`
      ];
      poliData.forEach((p) => {
        const isActive = selectedPoliId === p.id;
        allPills.push(`
          <button
            type="button"
            class="poli-pill-btn ${isActive ? 'is-active' : ''}"
            data-poli-id="${p.id}"
            aria-pressed="${isActive ? 'true' : 'false'}"
          >${escapeHtml(p.name)}</button>
        `);
      });
      poliFilterPills.innerHTML = allPills.join('');

      poliFilterPills.querySelectorAll('.poli-pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetPoliId = btn.getAttribute('data-poli-id') || '';
          if (poliSelect.value !== targetPoliId) {
            poliSelect.value = targetPoliId;
            poliSelect.dispatchEvent(new Event('change'));
          }
        });
      });
    }

    const matchingPolis = selectedPoliId
      ? poliData.filter((p) => p.id === selectedPoliId)
      : poliData;

    const doctorEntries = [];
    matchingPolis.forEach((p) => {
      (p.doctors || []).forEach((d) => {
        if (d.is_active) {
          doctorEntries.push({
            doctor: d,
            polyclinic: p
          });
        }
      });
    });

    if (activeDoctorCount) {
      activeDoctorCount.textContent = `${doctorEntries.length} Dokter Aktif`;
    }

    if (!doctorCardsGrid) return;

    if (doctorEntries.length === 0) {
      doctorCardsGrid.innerHTML = '<div class="booking-empty-hint">Belum ada dokter aktif pada pilihan poliklinik ini.</div>';
      return;
    }

    doctorCardsGrid.innerHTML = doctorEntries.map(({ doctor, polyclinic }) => {
      const isSelected = doctor.id === selectedDocId;
      const initials = getDoctorInitials(doctor.name);
      const roomLabel = `Ruang ${100 + polyclinic.id}, Gedung Utama Lt. ${(polyclinic.id % 3) + 1}`;
      return `
        <button
          type="button"
          class="doctor-card-item ${isSelected ? 'is-selected' : ''}"
          data-poli-id="${polyclinic.id}"
          data-doctor-id="${doctor.id}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >
          <div class="doctor-card-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
          <div class="doctor-card-content">
            <div class="doctor-card-top">
              <span class="doctor-poli-badge">${escapeHtml(polyclinic.name)}</span>
              <span class="doctor-select-indicator">${isSelected ? 'Terpilih &#10003;' : 'Tersedia'}</span>
            </div>
            <h3 class="doctor-card-name">${escapeHtml(doctor.name)}</h3>
            <p class="doctor-card-room">${escapeHtml(roomLabel)}</p>
            <div class="doctor-card-schedule">Praktik Pagi, Siang &amp; Sore (09:00 - 17:00 WIB)</div>
          </div>
        </button>
      `;
    }).join('');

    doctorCardsGrid.querySelectorAll('.doctor-card-item').forEach((cardBtn) => {
      cardBtn.addEventListener('click', () => {
        const targetPoliId = cardBtn.getAttribute('data-poli-id');
        const targetDocId = cardBtn.getAttribute('data-doctor-id');
        if (!targetPoliId || !targetDocId) return;

        if (poliSelect.value !== targetPoliId) {
          poliSelect.value = targetPoliId;
          populateDoctorSelectOptions(parseInt(targetPoliId, 10));
        }
        doctorSelect.value = targetDocId;
        doctorSelect.dispatchEvent(new Event('change'));
        scrollToStep(3);
      });
    });
  };

  const populateDoctorSelectOptions = (selectedPoliId) => {
    doctorSelect.innerHTML = '<option value="">Pilih dokter…</option>';
    if (!selectedPoliId) {
      doctorSelect.disabled = true;
      return [];
    }

    const poli = poliData.find((p) => p.id === selectedPoliId);
    const activeDoctors = poli ? (poli.doctors || []).filter((d) => d.is_active) : [];

    if (activeDoctors.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Belum ada dokter aktif di poliklinik ini';
      doctorSelect.appendChild(opt);
      doctorSelect.disabled = true;
      return [];
    }

    activeDoctors.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      doctorSelect.appendChild(opt);
    });
    doctorSelect.disabled = false;
    return activeDoctors;
  };

  // Initial renders
  renderMonthCalendar(currentCalYear, currentCalMonth);
  renderDateStrip();
  updateBookingSummary();

  try {
    const [masterRes] = await Promise.all([
      api.request('/master-poli', { priority: 'high' }),
      loadPatientAppointments()
    ]);
    poliData = masterRes.data || [];

    const refreshAvailableSlots = async () => {
      if (!timeSelect) return;
      const docId = doctorSelect.value;
      const dateVal = dateInput.value;

      if (!docId || !dateVal) {
        lastLoadedSlots = [];
        timeSelect.innerHTML = '<option value="">Pilih dokter dan tanggal terlebih dahulu…</option>';
        timeSelect.disabled = true;
        if (slotCountBadge) slotCountBadge.textContent = 'Pilih dokter & tanggal';
        renderTimeSlotColumns([], 'Pilih dokter spesialis pada Langkah 2 untuk melihat jam kunjungan.');
        updateBookingSummary();
        return;
      }

      timeSelect.innerHTML = '<option value="">Memeriksa ketersediaan slot…</option>';
      timeSelect.disabled = true;
      if (slotCountBadge) slotCountBadge.textContent = 'Memeriksa slot...';
      renderTimeSlotColumns([], 'Memeriksa ketersediaan sesi jam kunjungan...');

      try {
        const slotRes = await api.request(
          `/slot-tersedia?doctor_id=${encodeURIComponent(docId)}&date=${encodeURIComponent(dateVal)}`,
          { priority: 'high' }
        );
        const slots = slotRes.data || [];
        lastLoadedSlots = slots;
        const availableSlots = slots.filter((s) => s.available);
        const hasAvailable = availableSlots.length > 0;

        if (!hasAvailable) {
          timeSelect.innerHTML = '<option value="">Semua slot penuh pada tanggal ini, pilih tanggal lain</option>';
          timeSelect.disabled = true;
          if (slotCountBadge) slotCountBadge.textContent = 'Slot penuh';
          renderTimeSlotColumns(slots);
          updateBookingSummary();
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
        if (slotCountBadge) slotCountBadge.textContent = `Tersedia ${availableSlots.length} slot`;
        renderTimeSlotColumns(slots);
        updateBookingSummary();
      } catch {
        lastLoadedSlots = [];
        timeSelect.innerHTML = '<option value="">Gagal memeriksa slot, coba lagi…</option>';
        timeSelect.disabled = true;
        if (slotCountBadge) slotCountBadge.textContent = 'Gagal memuat slot';
        renderTimeSlotColumns([], 'Gagal memeriksa ketersediaan slot. Silakan pilih ulang tanggal atau dokter.');
        updateBookingSummary();
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
      populateDoctorSelectOptions(selectedId);
      // Require patient to explicitly select doctor card
      doctorSelect.value = '';
      if (timeSelect) timeSelect.value = '';
      renderPoliPillsAndDoctorCards();
      updateBookingSummary();
      refreshAvailableSlots();
    });

    doctorSelect.addEventListener('change', () => {
      if (timeSelect) timeSelect.value = '';
      renderPoliPillsAndDoctorCards();
      updateBookingSummary();
      refreshAvailableSlots();
    });

    if (dateInput) {
      dateInput.addEventListener('change', () => {
        const chosen = dateInput.value;
        if (chosen) {
          const chosenObj = parseIsoDateLocal(chosen);
          currentCalYear = chosenObj.getFullYear();
          currentCalMonth = chosenObj.getMonth();
        }

        renderMonthCalendar(currentCalYear, currentCalMonth);
        renderDateStrip();
        updateBookingSummary();
        refreshAvailableSlots();
      });
    }

    if (timeSelect) {
      timeSelect.addEventListener('change', () => {
        if (lastLoadedSlots.length > 0) {
          renderTimeSlotColumns(lastLoadedSlots);
        }
        updateBookingSummary();
      });
    }

    const syncSymptomChipStates = () => {
      if (!complaintInput) return;
      const currentVal = complaintInput.value.toLowerCase();
      document.querySelectorAll('.symptom-chip-btn').forEach((chip) => {
        const sym = (chip.getAttribute('data-symptom') || '').toLowerCase();
        const active = sym && currentVal.includes(sym);
        chip.classList.toggle('is-active', Boolean(active));
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    };

    document.querySelectorAll('.symptom-chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (!complaintInput) return;
        const symptom = chip.getAttribute('data-symptom') || '';
        if (!symptom) return;
        const current = complaintInput.value.trim();
        if (!current) {
          complaintInput.value = symptom;
        } else if (!current.toLowerCase().includes(symptom.toLowerCase())) {
          const combined = `${current}, ${symptom}`;
          complaintInput.value = combined.slice(0, 500);
        }
        syncSymptomChipStates();
        complaintInput.focus();
      });
    });

    if (complaintInput) {
      complaintInput.addEventListener('input', syncSymptomChipStates);
    }

    renderPoliPillsAndDoctorCards();

    const requestedPoliId = new URLSearchParams(window.location.search).get('poli');
    if (requestedPoliId && poliData.some((p) => String(p.id) === String(requestedPoliId))) {
      poliSelect.value = String(requestedPoliId);
      poliSelect.dispatchEvent(new Event('change'));
    }

    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('bookingAlert');

      const submitBtn = submitBookingBtn || bookingForm.querySelector('button[type="submit"]');
      const polyclinic_id = poliSelect.value;
      const doctor_id = doctorSelect.value;
      const appointment_date = dateInput.value;
      const appointment_time = timeSelect ? timeSelect.value : '';
      const complaint = complaintInput ? complaintInput.value.trim() : '';

      if (!polyclinic_id || !doctor_id || !appointment_date || !appointment_time) {
        api.showAlert('bookingAlert', 'Pilih poliklinik, dokter, tanggal, dan jam kunjungan terlebih dahulu.');
        (!polyclinic_id ? poliSelect : !doctor_id ? doctorSelect : !appointment_date ? dateInput : timeSelect).focus();
        return;
      }

      const defaultBtnHtml = submitBtn ? submitBtn.innerHTML : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Menyimpan…';
        }

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
        dateInput.value = todayStr;
        stripStartStr = todayStr;
        currentCalYear = todayObj.getFullYear();
        currentCalMonth = todayObj.getMonth();
        lastLoadedSlots = [];

        syncPatientInfoUI(api.getUser());
        renderMonthCalendar(currentCalYear, currentCalMonth);
        renderDateStrip();
        renderPoliPillsAndDoctorCards();
        renderTimeSlotColumns([], 'Pilih dokter spesialis pada Langkah 2 untuk melihat jam kunjungan.');
        if (slotCountBadge) slotCountBadge.textContent = 'Pilih dokter & tanggal';
        syncSymptomChipStates();
        updateBookingSummary();

        await loadPatientAppointments();
        scrollToStep(1);
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
        if (submitBtn) {
          submitBtn.disabled = false;
          if (defaultBtnHtml) {
            submitBtn.innerHTML = defaultBtnHtml;
          } else {
            submitBtn.textContent = 'Konfirmasi & Buat Janji Temu';
          }
        }
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
