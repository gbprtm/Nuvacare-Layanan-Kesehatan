document.addEventListener('DOMContentLoaded', () => {
  if (!api.requireAuth('pasien')) return;

  const currentUser = api.getUser();
  const userNameEl = document.getElementById('navUserName');
  const drawerBottomPillLabel = document.getElementById('drawerBottomPillLabel');
  if (currentUser) {
    if (userNameEl) {
      userNameEl.textContent = `${currentUser.name} · Profil`;
    }
    if (drawerBottomPillLabel) {
      drawerBottomPillLabel.textContent = `PROFIL (${currentUser.name})`;
    }
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

  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Keluar dari akunmu sekarang?')) {
        api.logout();
      }
    });
  }

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const drawerOverlay = document.getElementById('patientDrawerOverlay');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerExpandBtn = document.getElementById('drawerExpandBtn');
  const drawerSubInfo = document.getElementById('drawerSubInfo');

  const closeDrawer = () => {
    if (!drawerOverlay) return;
    drawerOverlay.classList.remove('is-open');
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  };

  const openDrawer = () => {
    if (!drawerOverlay) return;
    drawerOverlay.classList.add('is-open');
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  };

  if (mobileMenuBtn && drawerOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
      openDrawer();
    });
  }

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', () => {
      closeDrawer();
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) {
        closeDrawer();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerOverlay && drawerOverlay.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  if (drawerExpandBtn && drawerSubInfo) {
    drawerExpandBtn.addEventListener('click', () => {
      const isExpanded = drawerExpandBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        drawerExpandBtn.setAttribute('aria-expanded', 'false');
        drawerExpandBtn.textContent = '+';
        drawerSubInfo.hidden = true;
      } else {
        drawerExpandBtn.setAttribute('aria-expanded', 'true');
        drawerExpandBtn.textContent = '−';
        drawerSubInfo.hidden = false;
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

    const resetBtn = document.getElementById('resetProfileBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        api.hideAlert('profileAlert');
        loadProfile();
      });
    }

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      api.hideAlert('profileAlert');

      const submitBtn = document.getElementById('saveProfileBtn') || profileForm.querySelector('button[type="submit"]');
      const submitBtnText = document.getElementById('saveProfileBtnText');
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
      const gender = document.getElementById('gender')?.value || null;
      const address = document.getElementById('address').value.trim();

      if (!name) {
        api.showAlert('profileAlert', 'Nama lengkap wajib diisi.', 'danger');
        nameInput.focus();
        return;
      }

      const payload = { name, phone_number, birth_date: birth_date || null, gender, address };

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.textContent = 'Menyimpan…';

        const res = await api.request('/profil', {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });

        const updatedUser = { ...currentUser, name: res.data.name, phone_number: res.data.phone_number, gender: res.data.gender };
        api.setUser(updatedUser);
        if (userNameEl) userNameEl.textContent = res.data.name;
        if (drawerBottomPillLabel) drawerBottomPillLabel.textContent = `PROFIL (${res.data.name})`;

        api.showAlert('profileAlert', res.message || 'Profil berhasil diperbarui.', 'success');
      } catch (err) {
        const msg =
          err.errors?.gender?.[0] ||
          err.errors?.birth_date?.[0] ||
          err.errors?.name?.[0] ||
          err.message ||
          'Gagal memperbarui profil. Periksa kembali isianmu.';
        api.showAlert('profileAlert', msg, 'danger');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.textContent = 'Simpan Perubahan';
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
    const genderEl = document.getElementById('gender');
    if (genderEl) genderEl.value = user.gender || '';
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

  // Date Boundaries: Open calendar from today onwards based on doctor availability
  const todayObj = new Date();
  const todayStr = formatIsoDateLocal(todayObj);

  let currentCalYear = todayObj.getFullYear();
  let currentCalMonth = todayObj.getMonth();
  let stripStartStr = todayStr;
  let lastLoadedSlots = [];
  let currentActiveStep = 1;

  if (dateInput) {
    dateInput.min = todayStr;
    dateInput.removeAttribute('max');
    // Keep empty initially so step 1 must be completed by patient selection
    dateInput.value = '';
  }

  // Navigate to specific step (single active step wizard)
  const goToStep = (stepNumber) => {
    currentActiveStep = Math.max(1, Math.min(5, stepNumber));
    syncStepProgression();
    const targetCard = document.getElementById(`stepCard${currentActiveStep}`);
    if (targetCard && typeof targetCard.scrollIntoView === 'function') {
      targetCard.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  };

  // Progressive Disclosure: Sync Step Visibility & Stepper States
  const syncStepProgression = () => {
    const step1Done = Boolean(dateInput && dateInput.value && dateInput.value >= todayStr);
    const step2Done = step1Done && Boolean(doctorSelect && doctorSelect.value);
    const step3Done = step2Done && Boolean(timeSelect && timeSelect.value);
    const step4Done = step3Done; // WhatsApp connected
    const step5Done = step3Done; // Ready to submit

    // Boundary check: cannot skip ahead to incomplete prerequisite steps
    if (currentActiveStep === 2 && !step1Done) currentActiveStep = 1;
    if (currentActiveStep === 3 && !step2Done) currentActiveStep = step1Done ? 2 : 1;
    if (currentActiveStep === 4 && !step3Done) currentActiveStep = step2Done ? 3 : (step1Done ? 2 : 1);
    if (currentActiveStep === 5 && !step3Done) currentActiveStep = step2Done ? 3 : (step1Done ? 2 : 1);

    const stepCards = [
      document.getElementById('stepCard1'),
      document.getElementById('stepCard2'),
      document.getElementById('stepCard3'),
      document.getElementById('stepCard4'),
      document.getElementById('stepCard5')
    ];

    stepCards.forEach((card, idx) => {
      if (!card) return;
      const stepNum = idx + 1;
      const isCurrent = stepNum === currentActiveStep;
      card.classList.toggle('is-step-hidden', !isCurrent);
      card.classList.toggle('is-step-active', isCurrent);
      if (stepNum === 1) card.classList.toggle('is-step-completed', step1Done);
      if (stepNum === 2) card.classList.toggle('is-step-completed', step2Done);
      if (stepNum === 3) card.classList.toggle('is-step-completed', step3Done);
      if (stepNum === 4) card.classList.toggle('is-step-completed', step4Done);
    });

    // Dynamic Back Button Labels
    const backToStep1Label = document.getElementById('backToStep1Label');
    if (backToStep1Label && dateInput && dateInput.value) {
      backToStep1Label.textContent = `Ubah Tanggal (${formatFullDateId(dateInput.value)})`;
    }

    const backToStep2Label = document.getElementById('backToStep2Label');
    if (backToStep2Label) {
      const selectedDocId = parseInt(doctorSelect?.value || '0', 10);
      const selectedPoliId = parseInt(poliSelect?.value || '0', 10);
      const pObj = Array.isArray(poliData) ? poliData.find((p) => p.id === selectedPoliId) : null;
      const dObj = pObj ? (pObj.doctors || []).find((d) => d.id === selectedDocId) : null;
      backToStep2Label.textContent = dObj ? `Ubah Dokter (${dObj.name})` : 'Ubah Dokter Spesialis';
    }

    const backToStep3Label = document.getElementById('backToStep3Label');
    if (backToStep3Label && timeSelect && timeSelect.value) {
      backToStep3Label.textContent = `Ubah Jam Kunjungan (${timeSelect.value} WIB)`;
    }

    // Stepper Items (1-5)
    const updateStepperItem = (stepId, stepNum, isDone) => {
      const el = document.getElementById(stepId);
      if (!el) return;
      el.classList.remove('is-completed', 'is-active', 'is-upcoming', 'is-disabled');
      if (stepNum === currentActiveStep) {
        el.classList.add('is-active');
      } else if (isDone) {
        el.classList.add('is-completed');
      } else {
        el.classList.add('is-upcoming', 'is-disabled');
      }
    };

    updateStepperItem('stepperStep1', 1, step1Done);
    updateStepperItem('stepperStep2', 2, step2Done);
    updateStepperItem('stepperStep3', 3, step3Done);
    updateStepperItem('stepperStep4', 4, step4Done);
    updateStepperItem('stepperStep5', 5, step5Done);

    if (submitBookingBtn) {
      submitBookingBtn.disabled = !step3Done;
    }
  };

  // Wire step back and next buttons
  const backToStep1Btn = document.getElementById('backToStep1Btn');
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener('click', () => goToStep(1));
  }

  const backToStep2Btn = document.getElementById('backToStep2Btn');
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener('click', () => goToStep(2));
  }

  const changeDateFromStep3Btn = document.getElementById('changeDateFromStep3Btn');
  if (changeDateFromStep3Btn) {
    changeDateFromStep3Btn.addEventListener('click', () => goToStep(1));
  }

  const backToStep3Btn = document.getElementById('backToStep3Btn');
  if (backToStep3Btn) {
    backToStep3Btn.addEventListener('click', () => goToStep(3));
  }

  const nextToStep5Btn = document.getElementById('nextToStep5Btn');
  if (nextToStep5Btn) {
    nextToStep5Btn.addEventListener('click', () => goToStep(5));
  }

  const backToStep4Btn = document.getElementById('backToStep4Btn');
  if (backToStep4Btn) {
    backToStep4Btn.addEventListener('click', () => goToStep(4));
  }

  // Wire click to navigate stepper (only for unlocked/completed steps or active)
  document.querySelectorAll('.stepper-step, .booking-stepper-item, .booking-nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (item.classList.contains('is-disabled')) {
        e.preventDefault();
        return;
      }
      const stepVal = parseInt(item.getAttribute('data-step') || '0', 10);
      if (stepVal) goToStep(stepVal);
    });
  });

  // Sync patient info from authenticated session
  const waPreview = document.getElementById('bookingWhatsappPreview');
  const syncPatientInfoUI = (userObj) => {
    if (!userObj) return;
    const phoneInfo = formatPatientPhoneDisplay(userObj.phone_number);
    if (waDisplay) waDisplay.value = phoneInfo.localPart || '';
    if (waPreview) {
      waPreview.textContent = phoneInfo.localPart ? `+62 ${phoneInfo.localPart}` : '+62 8xx-xxxx-xxxx';
    }
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

  // Month Calendar Grid Renderer (Bebas Navigasi Bulan, Sinkron Jadwal Dokter)
  const renderMonthCalendar = (year, month) => {
    if (calendarMonthLabel) {
      calendarMonthLabel.textContent = `${MONTH_NAMES_ID[month]} ${year}`;
    }

    // Free month navigation: previous and next buttons remain enabled for exploring calendar
    if (calendarPrevBtn) {
      calendarPrevBtn.disabled = false;
      calendarPrevBtn.removeAttribute('aria-disabled');
    }

    if (calendarNextBtn) {
      calendarNextBtn.disabled = false;
      calendarNextBtn.removeAttribute('aria-disabled');
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
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSunday = dayOfWeek === 0;
      const isPast = dateStr < todayStr;
      const isAvailable = !isPast && !isSunday;
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
            ${isToday ? '<span class="calendar-day-badge">Hari ini</span>' : ''}
          </button>
        `);
      } else {
        cells.push(`
          <div class="calendar-day-cell is-disabled ${isSunday ? 'is-sunday' : ''} ${isToday ? 'is-today' : ''}" aria-disabled="true" title="${isSunday ? 'Klinik Tutup (Hari Minggu)' : 'Tanggal tidak tersedia'}">
            <span class="calendar-day-number">${d}</span>
            ${isToday ? '<span class="calendar-day-badge">Hari ini</span>' : (isSunday ? '<span class="calendar-day-status is-closed">Tutup</span>' : '')}
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
        goToStep(2);
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
        goToStep(2);
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
        goToStep(4);
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
        goToStep(3);
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

        // Success Confirmation Modal
        openBookingSuccessModal(res.data, {
          polyclinic_id,
          doctor_id,
          appointment_date,
          appointment_time
        });

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
        goToStep(1);
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

function openBookingSuccessModal(appointment, fallbackForm) {
  const modal = document.getElementById('bookingSuccessModal');
  if (!modal) return;

  const user = api.getUser() || {};
  const apptId = appointment?.id || Math.floor(Math.random() * 90 + 10);
  const dateStr = appointment?.appointment_date || fallbackForm?.appointment_date || '';
  const timeStr = appointment?.appointment_time || fallbackForm?.appointment_time || '';
  const dateClean = dateStr.replace(/-/g, '');
  const poliId = appointment?.polyclinic_id || fallbackForm?.polyclinic_id || 1;
  const docId = appointment?.doctor_id || fallbackForm?.doctor_id || 1;

  const poliObj = Array.isArray(poliData) ? poliData.find((p) => p.id === parseInt(poliId, 10)) : null;
  const docObj = poliObj ? (poliObj.doctors || []).find((d) => d.id === parseInt(docId, 10)) : null;

  const bookingCode = `NC-POLI-${dateClean}-${String(apptId).padStart(2, '0')}`;
  const queueBadge = `Poli #${String(apptId % 50 || 1).padStart(2, '0')}`;
  const docName = appointment?.doctor?.name || docObj?.name || 'dr. Spesialis Nuvacare';
  const poliName = appointment?.polyclinic?.name || poliObj?.name || 'Poliklinik Nuvacare';
  const roomName = `Gedung Utama Lt. ${(parseInt(poliId, 10) % 3) + 1} \u2022 Ruang ${100 + parseInt(poliId, 10)}`;

  let hour = parseInt(String(timeStr).split(':')[0], 10) || 9;
  let endHour = String(hour + 1).padStart(2, '0');
  let sessionName = hour < 12 ? 'Pagi' : hour < 15 ? 'Siang' : 'Sore';
  let timeRange = `${timeStr} - ${endHour}:00 WIB (${sessionName})`;

  const modalCode = document.getElementById('modalBookingCode');
  const modalQueue = document.getElementById('modalQueueBadge');
  const modalDoc = document.getElementById('modalDoctorName');
  const modalPoli = document.getElementById('modalPoliName');
  const modalRoom = document.getElementById('modalRoomName');
  const modalDate = document.getElementById('modalDateVal');
  const modalTime = document.getElementById('modalTimeVal');
  const modalPatientName = document.getElementById('modalPatientNameVal');
  const modalPatientRm = document.getElementById('modalPatientRmVal');
  const modalPhoneDisplay = document.getElementById('modalPatientPhoneDisplay');

  if (modalCode) modalCode.textContent = bookingCode;
  if (modalQueue) modalQueue.textContent = queueBadge;
  if (modalDoc) modalDoc.textContent = docName;
  if (modalPoli) modalPoli.textContent = poliName;
  if (modalRoom) modalRoom.textContent = roomName;
  if (modalDate) modalDate.textContent = formatFullDateId(dateStr);
  if (modalTime) modalTime.textContent = timeRange;
  if (modalPatientName) modalPatientName.textContent = user.name || 'Pasien Nuvacare';
  if (modalPatientRm) modalPatientRm.textContent = `#NC-${String(user.id || 1000).padStart(6, '0')}`;
  if (modalPhoneDisplay) {
    const pInfo = formatPatientPhoneDisplay(user.phone_number);
    modalPhoneDisplay.textContent = pInfo.localPart ? `+62 ${pInfo.localPart}` : '+62 8xx-xxxx-xxxx';
  }

  // Generate QR Code for Ticket
  const qrContainer = document.getElementById('ticketQrcodeContainer');
  if (qrContainer) {
    if (typeof QRCode !== 'undefined' && typeof QRCode.generateSvg === 'function') {
      qrContainer.innerHTML = QRCode.generateSvg(bookingCode, { cellSize: 3.5, margin: 1 });
    } else {
      qrContainer.innerHTML = `<span style="font-size: 11px; color: #0037B0; font-weight: 700;">${bookingCode}</span>`;
    }
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const closeBtn = document.getElementById('closeSuccessModalBtn');
  const handleClose = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (closeBtn) {
    closeBtn.onclick = handleClose;
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      handleClose();
    }
  };
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
