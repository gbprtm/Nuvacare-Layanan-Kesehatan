document.addEventListener('DOMContentLoaded', () => {
  if (!api.requireAuth('pasien')) return;

  const currentUser = api.getUser();
  const userNameEl = document.getElementById('navUserName');
  const drawerBottomPillLabel = document.getElementById('drawerBottomPillLabel');
  if (currentUser) {
    if (userNameEl) {
      userNameEl.textContent = currentUser.name || 'Profil';
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

  if (document.getElementById('appointmentTableBody') || document.getElementById('patientAppointmentsContainer')) {
    initPatientCancelModal();
    initPatientDeleteModal();
    const reloadPatientBtn = document.getElementById('reloadPatientAppointmentsBtn');
    if (reloadPatientBtn) {
      reloadPatientBtn.addEventListener('click', () => {
        currentApptPage = 1;
        loadPatientAppointments();
      });
    }
    const sortSelect = document.getElementById('patientAppointmentsSort');
    if (sortSelect) {
      currentApptSort = sortSelect.value || 'schedule_desc';
      sortSelect.addEventListener('change', () => {
        currentApptSort = sortSelect.value || 'schedule_desc';
        currentApptPage = 1;
        renderPatientAppointmentsTable();
      });
    }
    document.querySelectorAll('[data-appt-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        setPatientAppointmentsFilter(chip.getAttribute('data-appt-filter') || 'all');
      });
    });
    loadPatientAppointments();
  }

  if (document.getElementById('historyCardsContainer') || document.getElementById('historyTableBody')) {
    loadExaminationHistory();

    const closeQrBtn = document.getElementById('closeModalQrBtn');
    if (closeQrBtn) closeQrBtn.addEventListener('click', closeMedicalQrModal);
    const closeQrBottomBtn = document.getElementById('closeModalQrBottomBtn');
    if (closeQrBottomBtn) closeQrBottomBtn.addEventListener('click', closeMedicalQrModal);
    const modalQrOverlay = document.getElementById('modalQrMedis');
    if (modalQrOverlay) {
      modalQrOverlay.addEventListener('click', (e) => {
        if (e.target === modalQrOverlay) closeMedicalQrModal();
      });
    }

    const searchInput = document.getElementById('medicalSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentHistoryPage = 1;
        filterAndRenderHistory();
      });
    }

    const yearSelect = document.getElementById('medicalYearSelect');
    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        currentHistoryPage = 1;
        filterAndRenderHistory();
      });
    }

    const historySortSelect = document.getElementById('medicalSortSelect');
    if (historySortSelect) {
      currentHistorySort = historySortSelect.value || 'date_desc';
      historySortSelect.addEventListener('change', () => {
        currentHistorySort = historySortSelect.value || 'date_desc';
        currentHistoryPage = 1;
        filterAndRenderHistory();
      });
    }

    const filterChips = document.querySelectorAll('.medical-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => {
          c.classList.remove('is-active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('is-active');
        chip.setAttribute('aria-pressed', 'true');
        currentHistoryPage = 1;
        filterAndRenderHistory();
      });
    });
  }

  if (document.getElementById('controlTableBody') || document.getElementById('controlCardsList')) {
    initControlSchedulePage();
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

  const step1Subtitle = document.getElementById('step1Subtitle');
  const submitBookingHint = document.getElementById('submitBookingHint');
  const mobileStepCurrent = document.getElementById('mobileStepCurrent');
  const mobileStepTitle = document.getElementById('mobileStepTitle');
  const mobileProgressFill = document.getElementById('mobileProgressFill');
  const STEP_TITLES = {
    1: 'Pilih Dokter',
    2: 'Pilih Tanggal',
    3: 'Pilih Jam',
    4: 'Keluhan & WA'
  };

  if (dateInput) {
    dateInput.min = todayStr;
    dateInput.removeAttribute('max');
    // Keep empty initially so date step must be completed by patient selection
    dateInput.value = '';
  }

  // Navigate to specific step (single active step wizard)
  const goToStep = (stepNumber) => {
    currentActiveStep = Math.max(1, Math.min(4, stepNumber));
    syncStepProgression();
    const targetCard = document.getElementById(`stepCard${currentActiveStep}`);
    if (targetCard && typeof targetCard.scrollIntoView === 'function') {
      targetCard.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  };

  // Progressive Disclosure: Sync Step Visibility & Stepper States (Poli & Dokter -> Tanggal -> Jam -> Keluhan & WA)
  const syncStepProgression = () => {
    const step1Done = Boolean(poliSelect && poliSelect.value && doctorSelect && doctorSelect.value);
    const step2Done = step1Done && Boolean(dateInput && dateInput.value && dateInput.value >= todayStr);
    const step3Done = step2Done && Boolean(timeSelect && timeSelect.value);
    const step4Done = step3Done;

    // Boundary check: cannot skip ahead to incomplete prerequisite steps
    if (currentActiveStep === 2 && !step1Done) currentActiveStep = 1;
    if (currentActiveStep === 3 && !step2Done) currentActiveStep = step1Done ? 2 : 1;
    if (currentActiveStep === 4 && !step3Done) currentActiveStep = step2Done ? 3 : (step1Done ? 2 : 1);

    const stepCards = [
      document.getElementById('stepCard1'),
      document.getElementById('stepCard2'),
      document.getElementById('stepCard3'),
      document.getElementById('stepCard4')
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
    if (backToStep1Label) {
      const selectedDocId = parseInt(doctorSelect?.value || '0', 10);
      const selectedPoliId = parseInt(poliSelect?.value || '0', 10);
      const pObj = Array.isArray(poliData) ? poliData.find((p) => p.id === selectedPoliId) : null;
      const dObj = pObj ? (pObj.doctors || []).find((d) => d.id === selectedDocId) : null;
      backToStep1Label.textContent = dObj ? `Ubah Dokter (${dObj.name})` : 'Ubah Dokter';
    }

    const backToStep2Label = document.getElementById('backToStep2Label');
    if (backToStep2Label) {
      backToStep2Label.textContent = (dateInput && dateInput.value)
        ? `Ubah Tanggal (${formatFullDateId(dateInput.value)})`
        : 'Ubah Tanggal';
    }

    const backToStep3Label = document.getElementById('backToStep3Label');
    if (backToStep3Label) {
      backToStep3Label.textContent = (timeSelect && timeSelect.value)
        ? `Ubah Jam Kunjungan (${timeSelect.value} WIB)`
        : 'Ubah Jam Kunjungan';
    }

    // Stepper Items (1-4)
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

    if (mobileStepCurrent) mobileStepCurrent.textContent = String(currentActiveStep);
    if (mobileStepTitle) mobileStepTitle.textContent = STEP_TITLES[currentActiveStep] || 'Pilih Dokter';
    if (mobileProgressFill) mobileProgressFill.style.width = `${(currentActiveStep / 4) * 100}%`;

    if (submitBookingBtn) {
      submitBookingBtn.disabled = !step3Done;
    }
    if (submitBookingHint) {
      submitBookingHint.hidden = step3Done;
    }
  };

  // Wire step back buttons
  const backToStep1Btn = document.getElementById('backToStep1Btn');
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener('click', () => goToStep(1));
  }

  const backToStep2Btn = document.getElementById('backToStep2Btn');
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener('click', () => goToStep(2));
  }

  const changeDoctorFromStep3Btn = document.getElementById('changeDoctorFromStep3Btn');
  if (changeDoctorFromStep3Btn) {
    changeDoctorFromStep3Btn.addEventListener('click', () => goToStep(1));
  }

  const backToStep3Btn = document.getElementById('backToStep3Btn');
  if (backToStep3Btn) {
    backToStep3Btn.addEventListener('click', () => goToStep(3));
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
    .catch(() => { });

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
      summaryPoli.textContent = poliObj ? poliObj.name : 'Belum dipilih';
    }
    if (summaryDoctor) {
      summaryDoctor.textContent = docObj
        ? docObj.name
        : (poliObj ? 'Pilih dokter pada Langkah 1' : 'Pilih dokter pada Langkah 1');
    }
    if (summaryRoom) {
      summaryRoom.textContent = poliObj
        ? (poliObj.room_label || `Gedung Utama • Ruang ${100 + poliObj.id}`)
        : 'Gedung Utama Rawat Jalan';
    }
    if (summaryDate) {
      summaryDate.textContent = selectedDate
        ? formatFullDateId(selectedDate)
        : (docObj ? 'Pilih tanggal pada Langkah 2' : 'Pilih setelah menentukan dokter');
    }
    if (summaryTime) {
      if (selectedTime) {
        const hour = parseInt(selectedTime.split(':')[0], 10);
        const sessionLabel = hour < 12 ? 'Sesi Pagi' : hour < 15 ? 'Sesi Siang' : 'Sesi Sore';
        summaryTime.textContent = `Pukul ${selectedTime} WIB (${sessionLabel})`;
      } else {
        summaryTime.textContent = selectedDate && docObj
          ? 'Pilih jam pada Langkah 3'
          : 'Pilih setelah menentukan tanggal';
      }
    }
    if (step1Subtitle) {
      step1Subtitle.textContent = poliObj
        ? `Menampilkan dokter aktif di ${poliObj.name}`
        : 'Filter poliklinik dan pilih dokter spesialis aktif';
    }
    if (step2Subtitle) {
      if (!docObj) {
        step2Subtitle.textContent = 'Pilih dokter terlebih dahulu pada Langkah 1';
      } else {
        const upcomingForDoc = getDoctorUpcomingAvailableDates(docObj);
        step2Subtitle.textContent = upcomingForDoc.length > 0
          ? `Jadwal ${docObj.name} tersedia pada ${upcomingForDoc.length} tanggal aktif. Tanggal di luar jadwal tidak dapat dipilih.`
          : `Dokter ${docObj.name} belum membuka jadwal praktik. Tanggal lain tidak dapat dipilih.`;
      }
    }

    syncStepProgression();
  };

  const getSelectedDoctorObject = () => {
    const docId = doctorSelect ? parseInt(doctorSelect.value, 10) : NaN;
    if (!docId || !Array.isArray(poliData)) return null;
    for (const poli of poliData) {
      const found = (poli.doctors || []).find((d) => Number(d.id) === docId);
      if (found) return found;
    }
    return null;
  };

  const getDoctorUpcomingAvailableDates = (doctor) => {
    if (!doctor || !Array.isArray(doctor.available_dates)) return [];
    return doctor.available_dates
      .map((d) => String(d || '').trim().slice(0, 10))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= todayStr)
      .filter((d, idx, arr) => arr.indexOf(d) === idx)
      .sort();
  };

  const isDateAvailableForDoctor = (dateStr, doctor) => {
    if (!dateStr || dateStr < todayStr || !doctor) return false;
    const upcoming = getDoctorUpcomingAvailableDates(doctor);
    return upcoming.includes(dateStr);
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

    const selectedDoc = getSelectedDoctorObject();

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSunday = dayOfWeek === 0;
      const isPast = dateStr < todayStr;
      const isAvailable = isDateAvailableForDoctor(dateStr, selectedDoc);
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
        const disabledTitle = isPast
          ? 'Tanggal sudah lewat'
          : (selectedDoc ? 'Dokter tidak praktik pada tanggal ini' : 'Pilih dokter terlebih dahulu');
        const closedBadge = isSunday ? '<span class="calendar-day-status is-closed">Tutup</span>' : '';
        cells.push(`
          <div class="calendar-day-cell is-disabled ${isSunday ? 'is-sunday' : ''} ${isToday ? 'is-today' : ''}" aria-disabled="true" title="${disabledTitle}">
            <span class="calendar-day-number">${d}</span>
            ${isToday ? '<span class="calendar-day-badge">Hari ini</span>' : closedBadge}
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
        goToStep(3);
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
    const selectedDoc = getSelectedDoctorObject();

    const buttonsHtml = [];
    for (let i = 0; i < 5; i++) {
      const currentStr = addDaysToIso(todayStr, i);
      const currentObj = parseIsoDateLocal(currentStr);
      const dayShort = DAY_NAMES_SHORT[currentObj.getDay()];
      const dateNum = currentObj.getDate();
      const isAvailable = isDateAvailableForDoctor(currentStr, selectedDoc);
      const isSelected = isAvailable && selectedDateStr ? currentStr === selectedDateStr : false;

      buttonsHtml.push(`
        <button
          type="button"
          class="date-card-btn ${isSelected ? 'is-selected' : ''} ${!isAvailable ? 'is-disabled' : ''}"
          data-date="${currentStr}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
          ${!isAvailable ? 'disabled aria-disabled="true"' : ''}
        >
          <span class="date-card-day">${dayShort}</span>
          <span class="date-card-num">${dateNum}</span>
          <span class="date-card-status">${!isAvailable ? 'Tutup' : (isSelected ? 'Terpilih' : 'Tersedia')}</span>
        </button>
      `);
    }

    dateStripContainer.innerHTML = buttonsHtml.join('');
    dateStripContainer.querySelectorAll('.date-card-btn:not(:disabled)').forEach((btn) => {
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
        goToStep(3);
      });
    });
  };

  // Apply session visibility filters (Morning, Afternoon, Evening)
  const mobileSessionTabs = document.getElementById('mobileSessionTabs');
  if (mobileSessionTabs && timeSlotColumns) {
    timeSlotColumns.setAttribute('data-mobile-session', 'all');
    mobileSessionTabs.querySelectorAll('.session-mobile-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const chosen = tabBtn.getAttribute('data-session-tab') || 'all';
        timeSlotColumns.setAttribute('data-mobile-session', chosen);
        mobileSessionTabs.querySelectorAll('.session-mobile-tab').forEach((btn) => {
          const active = btn === tabBtn;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      });
    });
  }

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
      const shortPoliName = polyclinic.short_name || polyclinic.name.replace(/^Poli\s+/i, '');
      const roomLabel = polyclinic.room_label || `Gedung Utama • Ruang ${100 + polyclinic.id}`;
      const upcomingDates = getDoctorUpcomingAvailableDates(doctor);
      let scheduleText = 'Belum ada jadwal tanggal praktik';
      if (upcomingDates.length > 0 && upcomingDates.length <= 3) {
        const formattedDates = upcomingDates.map((d) => {
          const dt = parseIsoDateLocal(d);
          return `${dt.getDate()} ${MONTH_NAMES_ID[dt.getMonth()].slice(0, 3)}`;
        }).join(', ');
        scheduleText = `Jadwal tersedia: ${formattedDates}`;
      } else if (upcomingDates.length > 3) {
        scheduleText = `Tersedia pada ${upcomingDates.length} tanggal`;
      }
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
              <span class="doctor-poli-badge">${escapeHtml(shortPoliName)}</span>
              <span class="doctor-select-indicator">${isSelected ? 'Terpilih &#10003;' : 'Tersedia'}</span>
            </div>
            <h3 class="doctor-card-name">${escapeHtml(doctor.name)}</h3>
            <p class="doctor-card-room">${escapeHtml(roomLabel)}</p>
            <div class="doctor-card-schedule">${escapeHtml(scheduleText)}</div>
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
        goToStep(2);
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
        renderTimeSlotColumns([], 'Pilih dokter dan tanggal terlebih dahulu untuk melihat jam kunjungan.');
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

    const syncCalendarToSelectedDoctor = () => {
      const selectedDoc = getSelectedDoctorObject();
      const step2Sub = document.getElementById('step2Subtitle');
      const upcoming = getDoctorUpcomingAvailableDates(selectedDoc);

      if (step2Sub) {
        if (selectedDoc) {
          step2Sub.textContent = upcoming.length > 0
            ? `Jadwal ${selectedDoc.name} tersedia pada ${upcoming.length} tanggal aktif. Tanggal di luar jadwal tidak dapat dipilih.`
            : `Dokter ${selectedDoc.name} belum membuka jadwal praktik. Tanggal lain tidak dapat dipilih.`;
        } else {
          step2Sub.textContent = 'Pilih dokter terlebih dahulu pada Langkah 1';
        }
      }

      if (dateInput && dateInput.value && !isDateAvailableForDoctor(dateInput.value, selectedDoc)) {
        dateInput.value = '';
        if (timeSelect) timeSelect.value = '';
      }

      if (upcoming && upcoming.length > 0) {
        const currentMonthPrefix = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}`;
        const hasDateInCurrentMonth = upcoming.some((d) => d.startsWith(currentMonthPrefix));
        if (!hasDateInCurrentMonth) {
          const firstObj = parseIsoDateLocal(upcoming[0]);
          currentCalYear = firstObj.getFullYear();
          currentCalMonth = firstObj.getMonth();
        }
      }

      renderMonthCalendar(currentCalYear, currentCalMonth);
      renderDateStrip();
    };

    poliSelect.addEventListener('change', () => {
      const selectedId = parseInt(poliSelect.value, 10);
      populateDoctorSelectOptions(selectedId);
      // Require patient to explicitly select doctor card
      doctorSelect.value = '';
      if (timeSelect) timeSelect.value = '';
      renderPoliPillsAndDoctorCards();
      syncCalendarToSelectedDoctor();
      updateBookingSummary();
      refreshAvailableSlots();
    });

    doctorSelect.addEventListener('change', () => {
      if (timeSelect) timeSelect.value = '';
      renderPoliPillsAndDoctorCards();
      syncCalendarToSelectedDoctor();
      updateBookingSummary();
      refreshAvailableSlots();
    });

    if (dateInput) {
      dateInput.addEventListener('change', () => {
        const chosen = dateInput.value;
        const selectedDoc = getSelectedDoctorObject();
        if (chosen && !isDateAvailableForDoctor(chosen, selectedDoc)) {
          dateInput.value = '';
          if (timeSelect) timeSelect.value = '';
          api.showAlert('bookingAlert', 'Dokter tidak memiliki jadwal praktik pada tanggal tersebut. Silakan pilih tanggal yang tersedia.');
          renderMonthCalendar(currentCalYear, currentCalMonth);
          renderDateStrip();
          updateBookingSummary();
          refreshAvailableSlots();
          return;
        }
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

    const urlParams = new URLSearchParams(window.location.search);
    const requestedPoliId = urlParams.get('polyclinic_id') || urlParams.get('poli');
    const requestedDoctorId = urlParams.get('doctor_id');

    if (requestedPoliId && poliData.some((p) => String(p.id) === String(requestedPoliId))) {
      const parsedPoliId = parseInt(requestedPoliId, 10);
      poliSelect.value = String(requestedPoliId);
      const activeDoctors = populateDoctorSelectOptions(parsedPoliId);

      const hasValidDoctor = requestedDoctorId && activeDoctors.some((d) => String(d.id) === String(requestedDoctorId));
      if (hasValidDoctor) {
        doctorSelect.value = String(requestedDoctorId);
      }

      renderPoliPillsAndDoctorCards();
      syncCalendarToSelectedDoctor();
      updateBookingSummary();
      refreshAvailableSlots();

      if (hasValidDoctor) {
        goToStep(2);
      }
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

      if (!isDateAvailableForDoctor(appointment_date, getSelectedDoctorObject())) {
        api.showAlert('bookingAlert', 'Dokter yang dipilih tidak memiliki jadwal praktik pada tanggal tersebut. Pilih tanggal praktik yang tersedia.');
        goToStep(2);
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
        dateInput.value = '';
        stripStartStr = todayStr;
        currentCalYear = todayObj.getFullYear();
        currentCalMonth = todayObj.getMonth();
        lastLoadedSlots = [];

        syncPatientInfoUI(api.getUser());
        syncCalendarToSelectedDoctor();
        renderPoliPillsAndDoctorCards();
        renderTimeSlotColumns([], 'Pilih dokter dan tanggal terlebih dahulu untuk melihat jam kunjungan.');
        if (slotCountBadge) slotCountBadge.textContent = 'Pilih dokter & tanggal';
        syncSymptomChipStates();
        updateBookingSummary();

        currentApptPage = 1;
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
          if (defaultBtnHtml) {
            submitBtn.innerHTML = defaultBtnHtml;
          } else {
            submitBtn.textContent = 'Konfirmasi & Buat Janji Temu';
          }
        }
        syncStepProgression();
      }
    });

  } catch {
    api.showAlert('bookingAlert', 'Gagal memuat data poliklinik. Coba muat ulang halaman.', 'danger');
  }
}

const APPT_PAGE_SIZE = 5;
let currentApptPage = 1;
let currentApptFilter = 'all';
let currentApptSort = 'schedule_desc';
let currentHistorySort = 'date_desc';
const PATIENT_APPT_VISIBLE_LIMIT = 5;
let patientAppointmentsCache = [];

function getAppointmentCreatedMs(appt) {
  const parsed = appt?.created_at ? Date.parse(appt.created_at) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getAppointmentScheduleKey(appt) {
  const datePart = String(appt?.appointment_date || '').trim().slice(0, 10);
  const timePart = String(appt?.appointment_time || '').trim().slice(0, 5) || '00:00';
  return `${datePart} ${timePart}`;
}

function compareAppointmentsByDate(a, b, direction = 'desc') {
  const keyA = getAppointmentScheduleKey(a);
  const keyB = getAppointmentScheduleKey(b);
  const cmp = direction === 'asc' ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
  if (cmp !== 0) return cmp;
  const createdDiff = getAppointmentCreatedMs(b) - getAppointmentCreatedMs(a);
  if (createdDiff !== 0) return direction === 'asc' ? -createdDiff : createdDiff;
  const idDiff = (Number(b?.id) || 0) - (Number(a?.id) || 0);
  return direction === 'asc' ? -idDiff : idDiff;
}

function isRecentlyCreatedAppointment(appt) {
  const createdMs = getAppointmentCreatedMs(appt);
  if (!createdMs) return false;
  const now = new Date();
  const createdDate = new Date(createdMs);
  const within24Hours = (now.getTime() - createdMs) <= 24 * 60 * 60 * 1000 && createdMs <= now.getTime() + 60000;
  const sameLocalDay = createdDate.getFullYear() === now.getFullYear()
    && createdDate.getMonth() === now.getMonth()
    && createdDate.getDate() === now.getDate();
  return within24Hours || sameLocalDay;
}

function getFilteredSortedPatientAppointments() {
  const hiddenIds = getHiddenAppointmentIds();
  const activePool = patientAppointmentsCache.filter(
    a => a.status === 'terjadwal' && !hiddenIds.includes(String(a.id))
  );
  const recentCount = activePool.filter(isRecentlyCreatedAppointment).length;
  const filteredPool = currentApptFilter === 'recent'
    ? activePool.filter(isRecentlyCreatedAppointment)
    : activePool.slice();

  const visiblePool = filteredPool.sort((a, b) => {
    if (currentApptSort === 'created_desc') {
      return (getAppointmentCreatedMs(b) - getAppointmentCreatedMs(a)) || ((Number(b.id) || 0) - (Number(a.id) || 0));
    }
    if (currentApptSort === 'created_asc') {
      return (getAppointmentCreatedMs(a) - getAppointmentCreatedMs(b)) || ((Number(a.id) || 0) - (Number(b.id) || 0));
    }
    if (currentApptSort === 'schedule_asc') {
      return compareAppointmentsByDate(a, b, 'asc');
    }
    // Default: schedule_desc (tanggal terbaru di halaman 1, makin jauh halamannya makin lama)
    return compareAppointmentsByDate(a, b, 'desc');
  });

  return {
    activeCount: activePool.length,
    recentCount,
    visiblePool
  };
}

function setPatientAppointmentsFilter(filterValue) {
  currentApptFilter = filterValue === 'recent' ? 'recent' : 'all';
  currentApptPage = 1;
  document.querySelectorAll('[data-appt-filter]').forEach((chip) => {
    const isSelected = chip.getAttribute('data-appt-filter') === currentApptFilter;
    chip.classList.toggle('is-active', isSelected);
    chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });
  renderPatientAppointmentsTable();
}

function buildPaginationSequence(currentPage, totalPages, isCompact) {
  if (totalPages <= (isCompact ? 5 : 7)) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }
  if (isCompact) {
    if (currentPage <= 2) return [1, 2, '...', totalPages];
    if (currentPage >= totalPages - 1) return [1, '...', totalPages - 1, totalPages];
    return [1, '...', currentPage, '...', totalPages];
  }
  if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function renderSegmentedPagination(navEl, { currentPage, totalPages, onPageChange }) {
  if (!navEl) return;
  if (totalPages <= 1) {
    navEl.hidden = true;
    navEl.style.display = 'none';
    navEl.innerHTML = '';
    return;
  }

  const isCompact = typeof window.matchMedia === 'function'
    && window.matchMedia('(max-width: 540px)').matches;
  const items = buildPaginationSequence(currentPage, totalPages, isCompact);

  const prevChevron = '<svg class="segmented-page-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  const nextChevron = '<svg class="segmented-page-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

  const itemButtonsHtml = items.map((entry) => {
    if (entry === '...') {
      return '<span class="segmented-page-ellipsis" aria-hidden="true">…</span>';
    }
    const isActive = entry === currentPage;
    return `<button type="button" class="segmented-page-btn${isActive ? ' is-active' : ''}" data-page="${entry}" aria-label="Halaman ${entry}"${isActive ? ' aria-current="page"' : ''}>${entry}</button>`;
  }).join('');

  navEl.innerHTML = `
    <div class="segmented-pagination" role="group" aria-label="Daftar halaman">
      <button type="button" class="segmented-page-btn segmented-page-btn--nav" data-page-nav="prev" aria-label="Halaman sebelumnya"${currentPage <= 1 ? ' disabled' : ''}>
        ${prevChevron}
        <span class="segmented-page-label">Sebelumnya</span>
      </button>
      ${itemButtonsHtml}
      <button type="button" class="segmented-page-btn segmented-page-btn--nav" data-page-nav="next" aria-label="Halaman berikutnya"${currentPage >= totalPages ? ' disabled' : ''}>
        <span class="segmented-page-label">Berikutnya</span>
        ${nextChevron}
      </button>
    </div>
  `;

  navEl.hidden = false;
  navEl.style.display = 'flex';

  navEl.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = Number(btn.getAttribute('data-page'));
      if (target >= 1 && target <= totalPages && target !== currentPage) {
        onPageChange(target);
      }
    });
  });

  const prevBtn = navEl.querySelector('[data-page-nav="prev"]');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    });
  }

  const nextBtn = navEl.querySelector('[data-page-nav="next"]');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    });
  }
}

if (typeof window.matchMedia === 'function') {
  const paginationMq = window.matchMedia('(max-width: 540px)');
  const onPaginationMqChange = () => {
    if (document.getElementById('patientAppointmentsPagination') && patientAppointmentsCache.length > 0) {
      renderPatientAppointmentsTable();
    }
    if (document.getElementById('riwayatPagination') && filteredHistoryRecords.length > 0) {
      renderHistoryCurrentPage();
    }
  };
  if (typeof paginationMq.addEventListener === 'function') {
    paginationMq.addEventListener('change', onPaginationMqChange);
  }
}

window.setPatientAppointmentsFilter = setPatientAppointmentsFilter;

function getStoredIdList(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendStoredId(storageKey, id) {
  try {
    const list = getStoredIdList(storageKey);
    const strId = String(id);
    if (!list.includes(strId)) {
      list.push(strId);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch { }
}

function getHiddenAppointmentsStorageKey() {
  return `nuvacare_hidden_appointments_${api.getUser()?.id || 'guest'}`;
}

function getHiddenAppointmentIds() {
  return getStoredIdList(getHiddenAppointmentsStorageKey());
}

function saveHiddenAppointmentId(id) {
  appendStoredId(getHiddenAppointmentsStorageKey(), id);
}

function formatAppointmentGroupLabel(item) {
  if (currentApptSort === 'created_desc' || currentApptSort === 'created_asc') {
    const createdMs = getAppointmentCreatedMs(item);
    if (!createdMs) return 'Dibuat: Lainnya';
    const d = new Date(createdMs);
    const localIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `Dibuat ${formatMonthYear(localIso)}`;
  }
  return formatMonthYear(item.appointment_date);
}

function renderPatientAppointmentsTable() {
  const container = document.getElementById('patientAppointmentsContainer');
  const tableBody = document.getElementById('appointmentTableBody');
  const subtitleEl = document.getElementById('patientAppointmentsSub');
  if (!container && !tableBody) return;

  const { activeCount, recentCount, visiblePool } = getFilteredSortedPatientAppointments();

  const countAllEl = document.getElementById('apptFilterCountAll');
  const countRecentEl = document.getElementById('apptFilterCountRecent');
  if (countAllEl) countAllEl.textContent = String(activeCount);
  if (countRecentEl) countRecentEl.textContent = String(recentCount);

  const quickCountEl = document.getElementById('activeApptsQuickCount');
  if (quickCountEl) {
    quickCountEl.textContent = String(activeCount);
    quickCountEl.hidden = activeCount === 0;
  }

  if (subtitleEl) {
    if (activeCount === 0) {
      subtitleEl.textContent = 'Pantau status kunjungan poliklinik Anda.';
    } else if (currentApptFilter === 'recent') {
      subtitleEl.textContent = `Menampilkan ${visiblePool.length} janji baru dibuat dari ${activeCount} janji aktif.`;
    } else {
      subtitleEl.textContent = `Terdapat ${activeCount} janji temu aktif terjadwal.`;
    }
  }

  if (visiblePool.length === 0) {
    const paginationNav = document.getElementById('patientAppointmentsPagination');
    renderSegmentedPagination(paginationNav, { currentPage: 1, totalPages: 1, onPageChange: () => { } });
    const isFilteredEmpty = activeCount > 0 && currentApptFilter === 'recent';
    const emptyTitle = isFilteredEmpty ? 'Belum ada janji temu yang baru dibuat' : 'Belum ada janji temu aktif';
    const emptySub = isFilteredEmpty
      ? 'Belum ada janji temu yang dibuat dalam 24 jam terakhir.'
      : 'Pilih dokter dan jadwal di atas untuk membuat janji temu baru.';
    const emptyAction = isFilteredEmpty
      ? '<button type="button" class="btn btn-secondary btn-sm mt-3" onclick="setPatientAppointmentsFilter(\'all\')">Tampilkan Semua</button>'
      : '';
    const emptyHtml = `
      <div class="medical-empty-card">
        <div class="medical-empty-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h3 class="medical-empty-title">${emptyTitle}</h3>
        <p class="medical-empty-sub">${emptySub}</p>
        ${emptyAction}
      </div>
    `;
    if (container) container.innerHTML = emptyHtml;
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="text-muted text-center" style="padding: var(--space-6);">${emptyTitle}.</td></tr>`;
    return;
  }

  // Render to container if present (Clinical Ledger matching riwayat.html)
  if (container) {
    const totalApptPages = Math.ceil(visiblePool.length / APPT_PAGE_SIZE) || 1;
    if (currentApptPage > totalApptPages) currentApptPage = totalApptPages;
    if (currentApptPage < 1) currentApptPage = 1;

    const pageStartIndex = (currentApptPage - 1) * APPT_PAGE_SIZE;
    const pageItems = visiblePool.slice(pageStartIndex, pageStartIndex + APPT_PAGE_SIZE);

    // Group by month
    const groupsMap = new Map();
    pageItems.forEach(item => {
      const monthKey = formatAppointmentGroupLabel(item);
      if (!groupsMap.has(monthKey)) groupsMap.set(monthKey, []);
      groupsMap.get(monthKey).push(item);
    });

    let html = '';
    groupsMap.forEach((groupItems, monthLabel) => {
      html += `
        <div class="timeline-group">
          <div class="timeline-group-header">
            <div class="timeline-month-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${escapeHtml(monthLabel)}</span>
            </div>
            <span class="timeline-month-count">${groupItems.length} jadwal</span>
          </div>
          <div class="timeline-group-items">
      `;

      groupItems.forEach(a => {
        const poliRoom = a.polyclinic?.room_label || a.polyclinic?.room || 'Gedung Utama • Ruang Konsultasi';
        const visitType = a.type === 'kontrol_rutin' ? 'Jadwal Kontrol Rutin' : 'Janji Temu Baru';

        html += `
          <article class="clinical-ledger-item" id="ledger-item-${a.id}">
            <div class="clinical-ledger-header">
              <div class="clinical-ledger-date-col">
                <span class="clinical-ledger-date">${escapeHtml(api.formatDate(a.appointment_date))}</span>
                <span class="clinical-ledger-time">${escapeHtml(a.appointment_time || '08:00')} WIB</span>
                <span class="clinical-ledger-created" title="Janji diajukan pada ${formatDateShort(a.created_at)}">Dibuat: ${formatDateShort(a.created_at)}</span>
              </div>

              <div class="clinical-ledger-main-col">
                <div class="clinical-ledger-poli">${escapeHtml(a.polyclinic?.name || 'Poliklinik')}</div>
                <div class="clinical-ledger-doc">${escapeHtml(a.doctor?.name || 'dr. Spesialis')} <span class="clinical-ledger-doc-spec">• ${escapeHtml(a.doctor?.specialization || 'Spesialis Medis')}</span></div>
              </div>

              <div class="clinical-ledger-status-col">
                <span class="clinical-badge clinical-badge--scheduled">Terjadwal</span>
              </div>

              <div class="clinical-ledger-actions-col">
                <button type="button" class="clinical-ledger-btn-qr" onclick="openPatientTicketModal(${a.id})" title="Lihat E-Tiket & Kode QR">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Kode QR</span>
                </button>
                <button type="button" class="clinical-ledger-btn-cancel" onclick="openPatientCancelModal(${a.id})" title="Batalkan janji temu ini">Batalkan</button>
                <button type="button" class="clinical-ledger-toggle-btn" onclick="toggleClinicalLedgerDrawer('${a.id}')" aria-expanded="false" aria-controls="ledger-drawer-${a.id}" aria-label="Buka rincian janji temu">
                  <span class="clinical-ledger-toggle-label">Rincian</span>
                  <svg class="clinical-ledger-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <div class="clinical-ledger-drawer" id="ledger-drawer-${a.id}" hidden>
              <div class="clinical-ledger-drawer-grid">
                <div class="clinical-drawer-cell">
                  <span class="clinical-drawer-label">Dibuat di Sistem</span>
                  <p class="clinical-drawer-value">${formatDateShort(a.created_at)}</p>
                </div>
                <div class="clinical-drawer-cell">
                  <span class="clinical-drawer-label">Keluhan Pasien</span>
                  <p class="clinical-drawer-value">${escapeHtml(a.complaint || 'Pemeriksaan rutin berkala.')}</p>
                </div>
                <div class="clinical-drawer-cell">
                  <span class="clinical-drawer-label">Catatan Dokter</span>
                  <p class="clinical-drawer-value">${escapeHtml(a.doctor_notes || 'Menunggu konsultasi.')}</p>
                </div>
                <div class="clinical-drawer-cell">
                  <span class="clinical-drawer-label">Lokasi Poliklinik</span>
                  <p class="clinical-drawer-value">${escapeHtml(poliRoom)}</p>
                </div>
                <div class="clinical-drawer-cell">
                  <span class="clinical-drawer-label">Jenis Kunjungan</span>
                  <p class="clinical-drawer-value">${visitType}</p>
                </div>
              </div>
            </div>
          </article>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    const paginationNav = document.getElementById('patientAppointmentsPagination');
    renderSegmentedPagination(paginationNav, {
      currentPage: currentApptPage,
      totalPages: totalApptPages,
      onPageChange: (nextPage) => {
        currentApptPage = nextPage;
        renderPatientAppointmentsTable();
        document.getElementById('patientAppointmentsSection')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Fallback to tableBody if present
  if (tableBody) {
    tableBody.innerHTML = visiblePool.map(a => `
      <tr>
        <td>
          <span class="appt-date-primary">${escapeHtml(api.formatDate(a.appointment_date))}</span>
          <span class="appt-time-sub">${escapeHtml(a.appointment_time || '09:00')} WIB</span>
        </td>
        <td>
          <span class="appt-poli-name">${escapeHtml(a.polyclinic?.name || '-')}</span>
          <span class="appt-doctor-sub">${escapeHtml(a.doctor?.name || '-')}</span>
        </td>
        <td class="appt-col-notes">
          <div class="appt-notes-main">${escapeHtml(a.complaint || '-')}</div>
        </td>
        <td>
          <span class="clinical-badge clinical-badge--scheduled">Terjadwal</span>
        </td>
        <td class="appt-col-actions">
          <button type="button" class="appt-btn-cancel" onclick="openPatientCancelModal(${a.id})">Batalkan</button>
        </td>
      </tr>
    `).join('');
  }
}

async function loadPatientAppointments() {
  const container = document.getElementById('patientAppointmentsContainer');
  const tableBody = document.getElementById('appointmentTableBody');
  if (!container && !tableBody) return;

  try {
    const res = await api.request('/janji-temu', { priority: 'high' });
    patientAppointmentsCache = Array.isArray(res.data) ? res.data : [];
    renderPatientAppointmentsTable();
  } catch {
    if (container) {
      container.innerHTML = `
        <div class="medical-empty-card" style="border-color: #FCA5A5; background: #FEF2F2;">
          <p style="color: #991B1B; font-weight: 600; margin: 0 0 8px 0;">Gagal memuat jadwal janji temu.</p>
          <button type="button" class="profile-btn-cancel" onclick="loadPatientAppointments()">Coba Lagi</button>
        </div>
      `;
    }
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
    }
  }
}

function initPatientCancelModal() {
  const modal = document.getElementById('patientCancelConfirmModal');
  if (!modal) return;

  const closeBtn = document.getElementById('closePatientCancelModalBtn');
  const cancelBtn = document.getElementById('cancelPatientCancelBtn');
  const confirmBtn = document.getElementById('confirmPatientCancelBtn');

  const closeModal = () => {
    modal.hidden = true;
    modal.style.display = 'none';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden && modal.style.display === 'flex') {
      closeModal();
    }
  });

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      api.hideAlert('patientCancelModalAlert');
      const apptId = Number(document.getElementById('patientCancelAppointmentId')?.value || 0);
      if (!apptId) return;

      const originalText = confirmBtn.textContent;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Membatalkan...';

      try {
        const res = await api.request(`/janji-temu/${apptId}/batal`, {
          method: 'POST',
          body: JSON.stringify({})
        });
        closeModal();
        api.showAlert('patientAppointmentsAlert', res.message || 'Janji temu dibatalkan dan dipindahkan ke Riwayat Pemeriksaan.', 'success');
        await loadPatientAppointments();
      } catch (err) {
        api.showAlert('patientCancelModalAlert', err.message || 'Gagal membatalkan janji temu.', 'danger');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
      }
    });
  }
}

function openPatientCancelModal(appointmentId) {
  const modal = document.getElementById('patientCancelConfirmModal');
  if (!modal) return;

  api.hideAlert('patientCancelModalAlert');
  const idInput = document.getElementById('patientCancelAppointmentId');
  const summaryEl = document.getElementById('patientCancelSummary');
  const item = patientAppointmentsCache.find(a => Number(a.id) === Number(appointmentId));

  if (idInput) idInput.value = String(appointmentId);
  if (summaryEl && item) {
    summaryEl.textContent = `Batalkan janji temu dengan ${item.doctor?.name || 'Dokter'} (${item.polyclinic?.name || 'Poliklinik'}) pada ${api.formatDate(item.appointment_date)} pukul ${item.appointment_time || '09:00'} WIB?`;
  }

  modal.hidden = false;
  modal.style.display = 'flex';
  const cancelBtn = document.getElementById('cancelPatientCancelBtn');
  if (cancelBtn) setTimeout(() => cancelBtn.focus(), 40);
}

window.openPatientCancelModal = openPatientCancelModal;

function initPatientDeleteModal() {
  const modal = document.getElementById('patientDeleteConfirmModal');
  if (!modal) return;

  const closeBtn = document.getElementById('closePatientDeleteModalBtn');
  const cancelBtn = document.getElementById('cancelPatientDeleteBtn');
  const confirmBtn = document.getElementById('confirmPatientDeleteBtn');

  const closeModal = () => {
    modal.hidden = true;
    modal.style.display = 'none';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden && modal.style.display === 'flex') {
      closeModal();
    }
  });

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const apptId = Number(document.getElementById('patientDeleteAppointmentId')?.value || 0);
      if (!apptId) return;
      saveHiddenAppointmentId(apptId);
      closeModal();
      api.showAlert('patientAppointmentsAlert', 'Baris janji temu dihapus dari tampilan daftar.', 'success');
      renderPatientAppointmentsTable();
    });
  }
}

function openPatientDeleteModal(appointmentId) {
  const modal = document.getElementById('patientDeleteConfirmModal');
  if (!modal) return;

  const idInput = document.getElementById('patientDeleteAppointmentId');
  const summaryEl = document.getElementById('patientDeleteSummary');
  const item = patientAppointmentsCache.find(a => Number(a.id) === Number(appointmentId));

  if (idInput) idInput.value = String(appointmentId);
  if (summaryEl && item) {
    summaryEl.textContent = `Hapus catatan janji temu ${item.polyclinic?.name || 'Poliklinik'} dengan ${item.doctor?.name || 'Dokter'} (${api.formatDate(item.appointment_date)}) dari daftar tampilan Anda?`;
  }

  modal.hidden = false;
  modal.style.display = 'flex';
  const cancelBtn = document.getElementById('cancelPatientDeleteBtn');
  if (cancelBtn) setTimeout(() => cancelBtn.focus(), 40);
}

window.openPatientDeleteModal = openPatientDeleteModal;

let examinationHistoryData = [];

function getDoctorInitials(name) {
  if (!name) return 'DR';
  const clean = name.replace(/^(dr\.|drg\.|prof\.|dr\s+|drg\s+)/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return 'DR';
}

function renderSafeQrSvg(container, payload, options = { cellSize: 4, margin: 1 }) {
  if (!container) return;
  const safeText = escapeHtml(String(payload || ''));
  if (typeof QRCode !== 'undefined' && typeof QRCode.generateSvg === 'function') {
    try {
      container.innerHTML = QRCode.generateSvg(String(payload || ''), options);
      return;
    } catch {
      // Fallback below if payload exceeds QR version capacity
    }
  }
  container.innerHTML = `<span style="font-size: 12px; font-weight: 700; color: #0037B0; word-break: break-all; overflow-wrap: anywhere; text-align: center;">${safeText}</span>`;
}

function openMedicalQrModal(id) {
  const pool = [
    ...(Array.isArray(historicalRecordsData) ? historicalRecordsData : []),
    ...(Array.isArray(examinationHistoryData) ? examinationHistoryData : []),
    ...(Array.isArray(upcomingAppointmentsData) ? upcomingAppointmentsData : []),
  ];
  const item = pool.find(x => String(x.id) === String(id));
  if (!item) return;

  const modal = document.getElementById('modalQrMedis');
  const qrBox = document.getElementById('medicalQrCanvasBox');
  const poliEl = document.getElementById('qrModalPoli');
  const doctorEl = document.getElementById('qrModalDoctor');
  const dateEl = document.getElementById('qrModalDate');

  if (poliEl) poliEl.textContent = item.polyclinic?.name || '-';
  if (doctorEl) doctorEl.textContent = item.doctor?.name || '-';
  if (dateEl) dateEl.textContent = api.formatDate(item.appointment_date);

  const dateClean = String(item.appointment_date || '').split('T')[0].replace(/[^0-9]/g, '');
  const verificationPayload = `NUVACARE-MEDREC-${item.id}-${dateClean}-${item.user_id || 'P'}`;

  renderSafeQrSvg(qrBox, verificationPayload, { cellSize: 5, margin: 1 });

  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMedicalQrModal() {
  const modal = document.getElementById('modalQrMedis');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    document.body.style.overflow = '';
  }
}

window.openMedicalQrModal = openMedicalQrModal;
window.closeMedicalQrModal = closeMedicalQrModal;

let upcomingAppointmentsData = [];
let historicalRecordsData = [];
let filteredHistoryRecords = [];
let currentHistoryPage = 1;
const HISTORY_PAGE_SIZE = 5;

function formatDateShort(dateInput) {
  if (!dateInput) return '-';
  try {
    const raw = String(dateInput).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-');
      return `${d}/${m}/${y}`;
    }
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    const parts = raw.split('T')[0].split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return raw;
  } catch {
    return String(dateInput);
  }
}

function formatMonthYear(dateStr) {
  if (!dateStr) return 'Lainnya';
  try {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${monthNames[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function updateStatusFilterCounts(items) {
  const total = items.length;
  const completed = items.filter(i => i.status === 'selesai').length;
  const cancelled = items.filter(i => i.status === 'dibatalkan').length;

  const elAll = document.getElementById('countAll');
  const elSelesai = document.getElementById('countSelesai');
  const elDibatalkan = document.getElementById('countDibatalkan');
  const elArchiveTotal = document.getElementById('archiveTotalCount');

  if (elAll) elAll.textContent = total;
  if (elSelesai) elSelesai.textContent = completed;
  if (elDibatalkan) elDibatalkan.textContent = cancelled;
  if (elArchiveTotal) elArchiveTotal.textContent = `${total} riwayat`;
}

function toggleClinicalLedgerDrawer(id) {
  const targetDrawer = document.getElementById(`ledger-drawer-${id}`);
  const targetItem = document.getElementById(`ledger-item-${id}`);
  if (!targetDrawer || !targetItem) return;

  const btn = targetItem.querySelector('.clinical-ledger-toggle-btn');
  const isOpening = targetDrawer.hasAttribute('hidden');

  // Single-Expand Exclusive Accordion: Tutup drawer lain agar tidak menumpuk
  const allOpenItems = document.querySelectorAll('.clinical-ledger-item.is-expanded');
  allOpenItems.forEach(item => {
    if (item.id !== `ledger-item-${id}`) {
      item.classList.remove('is-expanded');
      const otherDrawer = item.querySelector('.clinical-ledger-drawer');
      if (otherDrawer) otherDrawer.setAttribute('hidden', '');
      const otherBtn = item.querySelector('.clinical-ledger-toggle-btn');
      if (otherBtn) {
        otherBtn.setAttribute('aria-expanded', 'false');
        const otherLabel = otherBtn.querySelector('.clinical-ledger-toggle-label');
        if (otherLabel) otherLabel.textContent = 'Rincian';
      }
    }
  });

  if (isOpening) {
    targetDrawer.removeAttribute('hidden');
    targetItem.classList.add('is-expanded');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      const label = btn.querySelector('.clinical-ledger-toggle-label');
      if (label) label.textContent = 'Tutup';
    }
  } else {
    targetDrawer.setAttribute('hidden', '');
    targetItem.classList.remove('is-expanded');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      const label = btn.querySelector('.clinical-ledger-toggle-label');
      if (label) label.textContent = 'Rincian';
    }
  }
}

window.toggleClinicalLedgerDrawer = toggleClinicalLedgerDrawer;
window.updateStatusFilterCounts = updateStatusFilterCounts;

function populateYearDropdown(items) {
  const yearSelect = document.getElementById('medicalYearSelect');
  if (!yearSelect) return;

  const currentVal = yearSelect.value || 'all';
  const yearsSet = new Set();

  if (Array.isArray(items)) {
    items.forEach(item => {
      const year = (item.appointment_date || '').split('-')[0];
      if (year && /^\d{4}$/.test(year)) {
        yearsSet.add(year);
      }
    });
  }

  const currentYear = new Date().getFullYear().toString();
  if (yearsSet.size === 0) {
    yearsSet.add(currentYear);
    yearsSet.add((parseInt(currentYear, 10) - 1).toString());
  }

  const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  let optionsHtml = '<option value="all">Semua Tahun</option>';

  sortedYears.forEach(yr => {
    optionsHtml += `<option value="${escapeHtml(yr)}">Tahun ${escapeHtml(yr)}</option>`;
  });

  yearSelect.innerHTML = optionsHtml;
  if (sortedYears.includes(currentVal) || currentVal === 'all') {
    yearSelect.value = currentVal;
  } else {
    yearSelect.value = 'all';
  }
}

function filterAndRenderHistory() {
  const query = (document.getElementById('medicalSearchInput')?.value || '').toLowerCase().trim();
  const yearSelect = document.getElementById('medicalYearSelect');
  const activeChip = document.querySelector('#medicalStatusFilters .medical-filter-chip.is-active, .medical-filter-chip.is-active');
  const filterYear = yearSelect ? yearSelect.value : 'all';
  const filterStatus = activeChip?.dataset?.status || 'all';

  filteredHistoryRecords = historicalRecordsData.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }
    if (filterYear !== 'all') {
      const apptYear = (item.appointment_date || '').split('-')[0];
      if (apptYear !== filterYear) return false;
    }
    if (!query) return true;
    const doctorName = (item.doctor?.name || '').toLowerCase();
    const poliName = (item.polyclinic?.name || '').toLowerCase();
    const complaint = (item.complaint || '').toLowerCase();
    const doctorNotes = (item.doctor_notes || '').toLowerCase();
    return doctorName.includes(query) || poliName.includes(query) || complaint.includes(query) || doctorNotes.includes(query);
  }).sort((a, b) => compareAppointmentsByDate(a, b, currentHistorySort === 'date_asc' ? 'asc' : 'desc'));

  renderHistoryCurrentPage();
}

function renderHistoryCurrentPage() {
  const cardsContainer = document.getElementById('historyCardsContainer');
  const paginationNav = document.getElementById('riwayatPagination');
  if (!cardsContainer) return;

  if (filteredHistoryRecords.length === 0) {
    cardsContainer.innerHTML = `
      <div class="medical-empty-card">
        <div class="medical-empty-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="4"></rect>
            <path d="M6 12h3l2-3 3 6 2-3h3"></path>
          </svg>
        </div>
        <h3 class="medical-empty-title">Tidak ada riwayat pemeriksaan</h3>
        <p class="medical-empty-sub">Tidak ditemukan catatan kunjungan yang sesuai dengan filter Anda.</p>
      </div>
    `;
    renderSegmentedPagination(paginationNav, { currentPage: 1, totalPages: 1, onPageChange: () => { } });
    return;
  }

  const totalPages = Math.ceil(filteredHistoryRecords.length / HISTORY_PAGE_SIZE) || 1;
  if (currentHistoryPage > totalPages) currentHistoryPage = totalPages;
  if (currentHistoryPage < 1) currentHistoryPage = 1;

  const startIndex = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
  const pageItems = filteredHistoryRecords.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);

  // Group pageItems by Month & Year (Timeline Grouping)
  const groupsMap = new Map();
  pageItems.forEach(item => {
    const monthKey = formatMonthYear(item.appointment_date);
    if (!groupsMap.has(monthKey)) {
      groupsMap.set(monthKey, []);
    }
    groupsMap.get(monthKey).push(item);
  });

  let html = '';
  groupsMap.forEach((groupItems, monthLabel) => {
    html += `
      <div class="timeline-group">
        <div class="timeline-group-header">
          <div class="timeline-month-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${escapeHtml(monthLabel)}</span>
          </div>
          <span class="timeline-month-count">${groupItems.length} kunjungan</span>
        </div>
        <div class="timeline-group-items">
    `;

    groupItems.forEach(a => {
      const isCancelled = a.status === 'dibatalkan';
      const isCompleted = a.status === 'selesai';

      const badgeClass = isCancelled ? 'clinical-badge--cancelled' : 'clinical-badge--completed';
      const statusLabel = isCancelled ? 'Dibatalkan' : 'Selesai';

      const qrButtonHtml = isCompleted
        ? `<button type="button" class="clinical-ledger-btn-qr" onclick="openMedicalQrModal('${a.id}')" title="Buka validasi digital QR medis">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
               <rect x="3" y="3" width="7" height="7"></rect>
               <rect x="14" y="3" width="7" height="7"></rect>
               <rect x="14" y="14" width="7" height="7"></rect>
               <rect x="3" y="14" width="7" height="7"></rect>
             </svg>
             <span>QR Medis</span>
           </button>`
        : '';

      const actionLinkHtml = isCompleted
        ? `<a href="/pasien/janji-temu.html?polyclinic_id=${a.polyclinic_id || a.polyclinic?.id || ''}&doctor_id=${a.doctor_id || a.doctor?.id || ''}" class="clinical-ledger-btn-action" title="Jadwalkan kontrol ulang">
             <span>Kontrol</span>
           </a>`
        : `<a href="/pasien/janji-temu.html?polyclinic_id=${a.polyclinic_id || a.polyclinic?.id || ''}&doctor_id=${a.doctor_id || a.doctor?.id || ''}" class="clinical-ledger-btn-action" title="Buat janji temu baru">
             <span>Janji Baru</span>
           </a>`;

      const noteLabel = isCancelled ? 'Alasan Pembatalan' : 'Catatan Dokter';
      const noteValue = a.doctor_notes || (isCancelled ? 'Janji temu telah dibatalkan.' : 'Pemeriksaan rutin berkala.');
      const poliRoom = a.polyclinic?.room_label || a.polyclinic?.room || 'Gedung Utama • Ruang Konsultasi';
      const visitType = a.type === 'kontrol_rutin' ? 'Jadwal Kontrol Rutin' : 'Janji Temu Baru';

      html += `
        <article class="clinical-ledger-item" id="ledger-item-${a.id}">
          <div class="clinical-ledger-header">
            <div class="clinical-ledger-date-col">
              <span class="clinical-ledger-date">${escapeHtml(api.formatDate(a.appointment_date))}</span>
              <span class="clinical-ledger-time">${escapeHtml(a.appointment_time || '08:00')} WIB</span>
              <span class="clinical-ledger-created" title="Janji diajukan pada ${formatDateShort(a.created_at)}">Dibuat: ${formatDateShort(a.created_at)}</span>
            </div>

            <div class="clinical-ledger-main-col">
              <div class="clinical-ledger-poli">${escapeHtml(a.polyclinic?.name || 'Poliklinik')}</div>
              <div class="clinical-ledger-doc">${escapeHtml(a.doctor?.name || 'dr. Spesialis')} <span class="clinical-ledger-doc-spec">• ${escapeHtml(a.doctor?.specialization || 'Spesialis Medis')}</span></div>
            </div>

            <div class="clinical-ledger-status-col">
              <span class="clinical-badge ${badgeClass}">${statusLabel}</span>
            </div>

            <div class="clinical-ledger-actions-col">
              ${qrButtonHtml}
              ${actionLinkHtml}
              <button type="button" class="clinical-ledger-toggle-btn" onclick="toggleClinicalLedgerDrawer('${a.id}')" aria-expanded="false" aria-controls="ledger-drawer-${a.id}" aria-label="Buka rincian pemeriksaan">
                <span class="clinical-ledger-toggle-label">Rincian</span>
                <svg class="clinical-ledger-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div class="clinical-ledger-drawer" id="ledger-drawer-${a.id}" hidden>
            <div class="clinical-ledger-drawer-grid">
              <div class="clinical-drawer-cell">
                <span class="clinical-drawer-label">Dibuat di Sistem</span>
                <p class="clinical-drawer-value">${formatDateShort(a.created_at)}</p>
              </div>
              <div class="clinical-drawer-cell">
                <span class="clinical-drawer-label">Keluhan Pasien</span>
                <p class="clinical-drawer-value">${escapeHtml(a.complaint || 'Pemeriksaan rutin berkala.')}</p>
              </div>
              <div class="clinical-drawer-cell">
                <span class="clinical-drawer-label">${noteLabel}</span>
                <p class="clinical-drawer-value">${escapeHtml(noteValue)}</p>
              </div>
              <div class="clinical-drawer-cell">
                <span class="clinical-drawer-label">Lokasi Poliklinik</span>
                <p class="clinical-drawer-value">${escapeHtml(poliRoom)}</p>
              </div>
              <div class="clinical-drawer-cell">
                <span class="clinical-drawer-label">Jenis Kunjungan</span>
                <p class="clinical-drawer-value">${visitType}</p>
              </div>
            </div>
          </div>
        </article>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  cardsContainer.innerHTML = html;

  renderSegmentedPagination(paginationNav, {
    currentPage: currentHistoryPage,
    totalPages,
    onPageChange: (nextPage) => {
      currentHistoryPage = nextPage;
      renderHistoryCurrentPage();
      document.getElementById('historyCardsContainer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

window.renderHistoryCurrentPage = renderHistoryCurrentPage;
window.filterAndRenderHistory = filterAndRenderHistory;
window.populateYearDropdown = populateYearDropdown;

async function loadExaminationHistory() {
  const cardsContainer = document.getElementById('historyCardsContainer');
  const tableBody = document.getElementById('historyTableBody');
  if (!cardsContainer && !tableBody) return;

  try {
    const historyRes = await api.request('/riwayat-pemeriksaan', { priority: 'high' }).catch(() => ({ data: [] }));

    const history = (Array.isArray(historyRes) ? historyRes : (Array.isArray(historyRes?.data) ? historyRes.data : [])).filter(item => item.status !== 'terjadwal');

    upcomingAppointmentsData = [];
    historicalRecordsData = history.sort((a, b) => compareAppointmentsByDate(a, b, 'desc'));
    examinationHistoryData = historicalRecordsData;

    updateStatusFilterCounts(historicalRecordsData);
    populateYearDropdown(historicalRecordsData);

    currentHistoryPage = 1;
    if (cardsContainer) {
      filterAndRenderHistory();
    }

    if (tableBody) {
      if (historicalRecordsData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center" style="padding: var(--space-6);">Belum ada pemeriksaan yang selesai.</td></tr>';
      } else {
        tableBody.innerHTML = historicalRecordsData.map(a => `
          <tr>
            <td><strong>${escapeHtml(api.formatDate(a.appointment_date))}</strong></td>
            <td>${escapeHtml(a.polyclinic?.name || '-')}</td>
            <td>${escapeHtml(a.doctor?.name || '-')}</td>
            <td>${escapeHtml(a.complaint || '-')}</td>
            <td>${escapeHtml(a.doctor_notes || 'Tidak ada catatan.')}</td>
          </tr>
        `).join('');
      }
    }
  } catch {
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="medical-empty-card" style="border-color: #FCA5A5; background: #FEF2F2;">
          <p style="color: #991B1B; font-weight: 600; margin: 0 0 8px 0;">Gagal memuat riwayat pemeriksaan.</p>
          <button type="button" class="profile-btn-cancel" onclick="loadExaminationHistory()">Coba Lagi</button>
        </div>
      `;
    }
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--color-danger-ink); padding: var(--space-6);">Gagal memuat data. Coba muat ulang halaman.</td></tr>';
    }
  }
}

const controlScheduleState = {
  items: [],
  filter: 'all',
  clinicWhatsappDigits: '6281123456789',
  activeModal: null,
  lastModalTrigger: null,
  initialized: false,
};

function formatControlItemView(item) {
  const isCompleted = item.status === 'selesai';
  return {
    id: String(item.id),
    isCompleted,
    dateFormatted: api.formatDate(item.appointment_date),
    timeLabel: `${item.appointment_time || '08:00'} WIB`,
    poliName: item.polyclinic?.name || 'Poliklinik',
    roomLabel: item.polyclinic?.room_label || 'Gedung Utama Klinik',
    doctorName: item.doctor?.name || 'Dokter Pemeriksa',
    doctorInitials: getDoctorInitials(item.doctor?.name),
    doctorSpec: item.doctor?.specialization || 'Dokter Poliklinik',
    notes: item.doctor_notes || (isCompleted
      ? 'Pemeriksaan kontrol telah selesai dilaksanakan.'
      : 'Kontrol evaluasi rutin sesuai arahan dokter.'),
    statusLabel: isCompleted ? 'Selesai' : 'Terjadwal',
    statusClass: isCompleted ? 'control-status-pill--selesai' : 'control-status-pill--terjadwal',
  };
}

function buildControlActionButtons(view) {
  if (view.isCompleted) {
    return `
      <button type="button" class="control-btn-secondary" data-control-action="note" data-control-id="${escapeHtml(view.id)}">
        Lihat Catatan
      </button>
    `;
  }

  return `
    <button type="button" class="control-btn-primary" data-control-action="ticket" data-control-id="${escapeHtml(view.id)}">
      Lihat Tiket
    </button>
    <button type="button" class="control-btn-secondary" data-control-action="manage" data-control-id="${escapeHtml(view.id)}">
      Batalkan
    </button>
  `;
}

function renderControlTableRow(view) {
  const iconClass = view.isCompleted ? 'control-cell-date-icon control-cell-date-icon--done' : 'control-cell-date-icon';
  return `
    <tr>
      <td>
        <div class="control-cell-date">
          <div class="${iconClass}" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div>
            <span class="control-date-primary">${escapeHtml(view.dateFormatted)}</span>
            <span class="control-time-sub">${escapeHtml(view.timeLabel)}</span>
            <span class="control-room-sub">${escapeHtml(view.roomLabel)}</span>
          </div>
        </div>
      </td>
      <td><span class="control-poli-chip">${escapeHtml(view.poliName)}</span></td>
      <td>
        <div class="control-doctor-cell">
          <div class="control-doctor-avatar" aria-hidden="true">${escapeHtml(view.doctorInitials)}</div>
          <div>
            <span class="control-doctor-name">${escapeHtml(view.doctorName)}</span>
            <span class="control-doctor-meta">${escapeHtml(view.doctorSpec)}</span>
          </div>
        </div>
      </td>
      <td><p class="control-notes-snippet">${escapeHtml(view.notes)}</p></td>
      <td><span class="control-status-pill ${view.statusClass}">${escapeHtml(view.statusLabel)}</span></td>
      <td class="control-col-actions">
        <div class="control-row-actions">
          ${buildControlActionButtons(view)}
        </div>
      </td>
    </tr>
  `;
}

function renderControlMobileCard(view) {
  const notesClass = view.isCompleted
    ? 'control-visit-card__notes control-visit-card__notes--done'
    : 'control-visit-card__notes';
  const actionsClass = view.isCompleted
    ? 'control-visit-card__actions control-visit-card__actions--single'
    : 'control-visit-card__actions';

  return `
    <article class="control-visit-card">
      <div class="control-visit-card__top">
        <span class="control-visit-card__datetime">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>${escapeHtml(view.dateFormatted)}, ${escapeHtml(view.timeLabel)}</span>
        </span>
        <span class="control-status-pill ${view.statusClass}">${escapeHtml(view.statusLabel)}</span>
      </div>

      <div class="control-visit-card__location">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${escapeHtml(view.roomLabel)}</span>
      </div>

      <div class="control-visit-card__doctor-box">
        <div class="control-doctor-avatar" aria-hidden="true">${escapeHtml(view.doctorInitials)}</div>
        <div>
          <span class="control-visit-card__poli">${escapeHtml(view.poliName)}</span>
          <span class="control-doctor-name">${escapeHtml(view.doctorName)}</span>
          <span class="control-doctor-meta">${escapeHtml(view.doctorSpec)}</span>
        </div>
      </div>

      <div class="${notesClass}">
        <strong>Arahan Dokter:</strong> ${escapeHtml(view.notes)}
      </div>

      <div class="${actionsClass}">
        ${buildControlActionButtons(view)}
      </div>
    </article>
  `;
}

function renderControlStateBox({ mode, title, description, showRetry = false, showCreateCta = false }) {
  const stateBox = document.getElementById('controlStateBox');
  const tableWrap = document.getElementById('controlTableWrap');
  const cardsList = document.getElementById('controlCardsList');
  if (!stateBox) return;

  if (tableWrap) tableWrap.hidden = true;
  if (cardsList) cardsList.hidden = true;
  stateBox.hidden = false;

  const isError = mode === 'error';
  const iconClass = isError ? 'control-state-icon control-state-icon--error' : 'control-state-icon';
  const iconSvg = isError
    ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

  const actionHtml = showRetry
    ? `<button type="button" class="control-btn-secondary" id="retryControlLoadBtn">Muat Ulang Data</button>`
    : (showCreateCta ? `<a href="/pasien/janji-temu.html" class="control-btn-primary">Buat Janji Temu Baru</a>` : '');

  stateBox.innerHTML = `
    <div class="${iconClass}">${iconSvg}</div>
    <p class="control-state-title">${escapeHtml(title)}</p>
    <p class="control-state-desc">${escapeHtml(description)}</p>
    ${actionHtml}
  `;

  const retryBtn = document.getElementById('retryControlLoadBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      fetchControlScheduleData();
    });
  }
}

function updateControlBannerAndCounts(scheduledItems, completedItems) {
  const userName = api.getUser()?.name || 'Pasien';

  const summaryTextEl = document.getElementById('controlSummaryText');
  const summaryHintEl = document.getElementById('controlSummaryHint');

  if (scheduledItems.length > 0) {
    const nextVisit = scheduledItems[0];
    if (summaryTextEl) {
      summaryTextEl.innerHTML = `Halo, <strong id="controlPatientGreeting">${escapeHtml(userName)}</strong>! Jadwal kontrol terdekat Anda pada <strong>${escapeHtml(api.formatDate(nextVisit.appointment_date))}</strong> pukul <strong>${escapeHtml(nextVisit.appointment_time || '08:00')} WIB</strong>.`;
    }
    if (summaryHintEl) {
      summaryHintEl.textContent = `${nextVisit.polyclinic?.name || 'Poliklinik'} bersama ${nextVisit.doctor?.name || 'Dokter Pemeriksa'}. Hadir 15 menit sebelum sesi dimulai.`;
    }
  } else if (completedItems.length > 0) {
    if (summaryTextEl) {
      summaryTextEl.innerHTML = `Halo, <strong id="controlPatientGreeting">${escapeHtml(userName)}</strong>! Belum ada jadwal kontrol aktif saat ini.`;
    }
    if (summaryHintEl) {
      summaryHintEl.textContent = `Anda memiliki ${completedItems.length} riwayat kunjungan kontrol yang telah selesai.`;
    }
  } else {
    if (summaryTextEl) {
      summaryTextEl.innerHTML = `Halo, <strong id="controlPatientGreeting">${escapeHtml(userName)}</strong>! Belum ada jadwal kontrol dari dokter.`;
    }
    if (summaryHintEl) {
      summaryHintEl.textContent = 'Jika membutuhkan pemeriksaan baru, Anda dapat membuat janji temu poliklinik secara langsung.';
    }
  }
}

function renderControlScheduleViews() {
  const stateBox = document.getElementById('controlStateBox');
  const tableWrap = document.getElementById('controlTableWrap');
  const tableBody = document.getElementById('controlTableBody');
  const cardsList = document.getElementById('controlCardsList');
  if (!tableBody || !cardsList) return;

  const filtered = controlScheduleState.items.filter(item => {
    if (controlScheduleState.filter === 'all') return true;
    return item.status === controlScheduleState.filter;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    cardsList.innerHTML = '';

    if (controlScheduleState.filter === 'terjadwal') {
      renderControlStateBox({
        mode: 'empty',
        title: 'Belum ada jadwal kontrol terjadwal',
        description: 'Saat ini tidak ada kunjungan kontrol rutin yang berstatus terjadwal.',
        showCreateCta: true,
      });
    } else if (controlScheduleState.filter === 'selesai') {
      renderControlStateBox({
        mode: 'empty',
        title: 'Belum ada riwayat kontrol selesai',
        description: 'Kunjungan kontrol rutin yang sudah diselesaikan dokter akan tampil di tab ini.',
        showCreateCta: false,
      });
    } else {
      renderControlStateBox({
        mode: 'empty',
        title: 'Belum ada jadwal kontrol dari dokter',
        description: 'Anda dapat membuat janji temu baru jika membutuhkan konsultasi poliklinik.',
        showCreateCta: true,
      });
    }
    return;
  }

  const views = filtered.map(formatControlItemView);
  if (stateBox) stateBox.hidden = true;
  if (tableWrap) tableWrap.hidden = false;
  cardsList.hidden = false;

  tableBody.innerHTML = views.map(renderControlTableRow).join('');
  cardsList.innerHTML = views.map(renderControlMobileCard).join('');
}

function openControlModal(modalEl, triggerEl) {
  if (!modalEl) return;
  controlScheduleState.lastModalTrigger = triggerEl || document.activeElement;
  controlScheduleState.activeModal = modalEl;
  modalEl.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    const closeBtn = modalEl.querySelector('.control-modal-close') || modalEl.querySelector('button, a');
    if (closeBtn) closeBtn.focus();
  });
}

function closeControlModal(modalEl, restoreFocus = true) {
  if (!modalEl || modalEl.classList.contains('hidden')) return;
  modalEl.classList.add('hidden');
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
  document.body.style.overflow = '';
  if (controlScheduleState.activeModal === modalEl) {
    controlScheduleState.activeModal = null;
  }

  if (restoreFocus && controlScheduleState.lastModalTrigger && typeof controlScheduleState.lastModalTrigger.focus === 'function') {
    controlScheduleState.lastModalTrigger.focus();
  }
  controlScheduleState.lastModalTrigger = null;
}

function openControlTicketModal(item, triggerEl) {
  const modal = document.getElementById('controlTicketModal');
  if (!modal || !item) return;

  const view = formatControlItemView(item);
  const dateCompact = String(item.appointment_date || '').replace(/[^0-9]/g, '');
  const ticketCode = `NC-KONTROL-${dateCompact || 'JADWAL'}-${view.id}`;
  const patientName = api.getUser()?.name || 'Pasien Nuvacare';

  const codeEl = document.getElementById('controlTicketCode');
  const patientEl = document.getElementById('ticketPatientName');
  const poliEl = document.getElementById('ticketPoliName');
  const roomEl = document.getElementById('ticketRoomLabel');
  const doctorEl = document.getElementById('ticketDoctorName');
  const dateTimeEl = document.getElementById('ticketDateTime');
  const qrBox = document.getElementById('controlTicketQrBox');

  if (codeEl) codeEl.textContent = `NO. REG: ${ticketCode}`;
  if (patientEl) patientEl.textContent = patientName;
  if (poliEl) poliEl.textContent = view.poliName;
  if (roomEl) roomEl.textContent = view.roomLabel;
  if (doctorEl) doctorEl.textContent = view.doctorName;
  if (dateTimeEl) dateTimeEl.textContent = `${view.dateFormatted}, ${view.timeLabel}`;

  if (qrBox) {
    renderSafeQrSvg(qrBox, ticketCode, { cellSize: 4, margin: 1 });
  }

  openControlModal(modal, triggerEl);
}

function openControlNoteModal(item, triggerEl) {
  const modal = document.getElementById('controlNoteModal');
  if (!modal || !item) return;

  const view = formatControlItemView(item);
  const metaEl = document.getElementById('controlNoteMeta');
  const doctorEl = document.getElementById('controlNoteDoctor');
  const roomEl = document.getElementById('controlNoteRoom');
  const textEl = document.getElementById('controlNoteText');

  if (metaEl) metaEl.textContent = `${view.poliName} | ${view.dateFormatted}, ${view.timeLabel}`;
  if (doctorEl) doctorEl.textContent = `${view.doctorName} (${view.doctorSpec})`;
  if (roomEl) roomEl.textContent = view.roomLabel;
  if (textEl) textEl.textContent = view.notes;

  openControlModal(modal, triggerEl);
}

function openControlManageModal(item, triggerEl) {
  const modal = document.getElementById('controlManageModal');
  if (!modal || !item) return;

  const view = formatControlItemView(item);
  api.hideAlert('controlManageAlert');

  const idInput = document.getElementById('controlManageAppointmentId');
  const summaryEl = document.getElementById('controlManageSummary');
  const waLinkEl = document.getElementById('controlManageWaLink');

  if (idInput) idInput.value = view.id;
  if (summaryEl) {
    summaryEl.textContent = `${view.poliName} | ${view.doctorName} | ${view.dateFormatted}, ${view.timeLabel}`;
  }
  if (waLinkEl) {
    const waText = encodeURIComponent(
      `Halo Resepsionis Nuvacare, saya ingin mengajukan perubahan jadwal kontrol ${view.poliName} dengan ${view.doctorName} pada ${view.dateFormatted} (${view.timeLabel}).`
    );
    waLinkEl.href = `https://wa.me/${controlScheduleState.clinicWhatsappDigits}?text=${waText}`;
  }

  openControlModal(modal, triggerEl);
}

function bindControlScheduleInteractions() {
  if (controlScheduleState.initialized) return;
  controlScheduleState.initialized = true;

  document.querySelectorAll('.control-filter-tab[data-control-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      const nextFilter = tab.dataset.controlFilter || 'all';
      controlScheduleState.filter = nextFilter;

      document.querySelectorAll('.control-filter-tab[data-control-filter]').forEach(btn => {
        const isSelected = btn === tab;
        btn.classList.toggle('is-active', isSelected);
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });

      renderControlScheduleViews();
    });
  });

  const handleActionClick = (event) => {
    const actionBtn = event.target.closest('[data-control-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.controlAction;
    const itemId = actionBtn.dataset.controlId;
    const item = controlScheduleState.items.find(entry => String(entry.id) === String(itemId));
    if (!item) return;

    if (action === 'ticket') {
      openControlTicketModal(item, actionBtn);
    } else if (action === 'note') {
      openControlNoteModal(item, actionBtn);
    } else if (action === 'manage') {
      openControlManageModal(item, actionBtn);
    }
  };

  document.getElementById('controlTableBody')?.addEventListener('click', handleActionClick);
  document.getElementById('controlCardsList')?.addEventListener('click', handleActionClick);

  const ticketModal = document.getElementById('controlTicketModal');
  const noteModal = document.getElementById('controlNoteModal');
  const manageModal = document.getElementById('controlManageModal');

  document.getElementById('closeControlTicketBtn')?.addEventListener('click', () => closeControlModal(ticketModal));
  document.getElementById('closeControlTicketBottomBtn')?.addEventListener('click', () => closeControlModal(ticketModal));
  document.getElementById('printControlTicketBtn')?.addEventListener('click', () => window.print());

  document.getElementById('closeControlNoteBtn')?.addEventListener('click', () => closeControlModal(noteModal));
  document.getElementById('closeControlNoteBottomBtn')?.addEventListener('click', () => closeControlModal(noteModal));

  document.getElementById('closeControlManageBtn')?.addEventListener('click', () => closeControlModal(manageModal));
  document.getElementById('cancelControlManageBtn')?.addEventListener('click', () => closeControlModal(manageModal));

  [ticketModal, noteModal, manageModal].forEach(modal => {
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeControlModal(modal);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && controlScheduleState.activeModal) {
      closeControlModal(controlScheduleState.activeModal);
    }
  });

  const confirmCancelBtn = document.getElementById('confirmControlCancelBtn');
  confirmCancelBtn?.addEventListener('click', async () => {
    const id = document.getElementById('controlManageAppointmentId')?.value;
    if (!id) return;

    api.hideAlert('controlManageAlert');
    confirmCancelBtn.disabled = true;
    confirmCancelBtn.textContent = 'Membatalkan...';

    try {
      await api.request(`/janji-temu/${encodeURIComponent(id)}/batal`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      closeControlModal(manageModal);
      api.showAlert('controlScheduleAlert', 'Jadwal kontrol berhasil dibatalkan.', 'success');
      await fetchControlScheduleData();
    } catch (err) {
      api.showAlert('controlManageAlert', err.message || 'Gagal membatalkan jadwal kontrol. Coba lagi nanti.', 'error');
    } finally {
      confirmCancelBtn.disabled = false;
      confirmCancelBtn.textContent = 'Batalkan Jadwal';
    }
  });
}

async function loadControlClinicInfo() {
  try {
    const info = await api.request('/public-info');
    if (info?.clinic_address) {
      const footerAddr = document.getElementById('footerClinicAddress');
      if (footerAddr) footerAddr.textContent = info.clinic_address;
    }

    if (info?.clinic_contact) {
      const footerContact = document.getElementById('footerClinicContact');
      if (footerContact) footerContact.textContent = info.clinic_contact;

      const rawDigits = String(info.clinic_contact).replace(/[^0-9]/g, '');
      const waDigits = rawDigits.startsWith('0') ? `62${rawDigits.slice(1)}` : rawDigits;
      if (waDigits.length >= 8) {
        controlScheduleState.clinicWhatsappDigits = waDigits;
      }
    }
  } catch {
    // Abaikan error non-kritis agar data kontak fallback tetap tampil.
  }
}

async function fetchControlScheduleData() {
  renderControlStateBox({
    mode: 'loading',
    title: 'Memuat jadwal kontrol...',
    description: 'Mengambil data kunjungan kontrol terbaru dari server klinik.',
  });

  try {
    const [controlRes, historyRes] = await Promise.all([
      api.request('/jadwal-kontrol', { priority: 'high' }),
      api.request('/riwayat-pemeriksaan'),
    ]);

    const scheduledItems = (Array.isArray(controlRes?.data) ? controlRes.data : []).map(item => ({
      ...item,
      status: item.status || 'terjadwal',
    }));

    const completedItems = (Array.isArray(historyRes?.data) ? historyRes.data : []).filter(
      item => item.type === 'kontrol_rutin' && item.status === 'selesai'
    );

    controlScheduleState.items = [...scheduledItems, ...completedItems];
    updateControlBannerAndCounts(scheduledItems, completedItems);
    renderControlScheduleViews();
  } catch {
    renderControlStateBox({
      mode: 'error',
      title: 'Gagal memuat jadwal kontrol',
      description: 'Periksa koneksi internet Anda lalu coba muat ulang data.',
      showRetry: true,
    });
  }
}

async function initControlSchedulePage() {
  const tableBody = document.getElementById('controlTableBody');
  const cardsList = document.getElementById('controlCardsList');
  if (!tableBody || !cardsList) return;

  const greetingEl = document.getElementById('controlPatientGreeting');
  if (greetingEl) {
    greetingEl.textContent = api.getUser()?.name || 'Pasien';
  }

  bindControlScheduleInteractions();
  loadControlClinicInfo();
  await fetchControlScheduleData();
}

window.initControlSchedulePage = initControlSchedulePage;

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
  const roomName = appointment?.polyclinic?.room_label || poliObj?.room_label || `Gedung Utama \u2022 Ruang ${100 + parseInt(poliId, 10)}`;

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
    renderSafeQrSvg(qrContainer, bookingCode, { cellSize: 3.5, margin: 1 });
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  const closeBtn = document.getElementById('closeSuccessModalBtn');
  const handleClose = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
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

function openPatientTicketModal(appointmentId) {
  const item = Array.isArray(patientAppointmentsCache)
    ? patientAppointmentsCache.find(a => Number(a.id) === Number(appointmentId))
    : null;
  if (!item) return;
  openBookingSuccessModal(item, null);
}

window.openPatientTicketModal = openPatientTicketModal;

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
