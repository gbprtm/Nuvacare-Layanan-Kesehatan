// Dimuat sinkron di <head> agar data-theme terpasang sebelum halaman dilukis (tanpa kedip tema).
(function () {
  const STORAGE_KEY = 'nuvacare_theme';
  const root = document.documentElement;
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function storedTheme() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      return null;
    }
  }

  function systemTheme() {
    return media && media.matches ? 'dark' : 'light';
  }

  function syncControls(theme) {
    const isDark = theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
      btn.setAttribute('title', isDark ? 'Tema terang' : 'Tema gelap');
      const label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = isDark ? 'TEMA TERANG' : 'TEMA GELAP';
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0B1220' : '#F8FAFC');
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    syncControls(theme);
  }

  window.syncThemeControls = () => syncControls(root.getAttribute('data-theme'));

  apply(storedTheme() || systemTheme());

  if (media) {
    const onSystemChange = () => {
      if (!storedTheme()) apply(systemTheme());
    };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Penyimpanan diblokir: tema tetap berganti untuk sesi ini.
    }
    apply(next);
  });

  document.addEventListener('DOMContentLoaded', () => {
    syncControls(root.getAttribute('data-theme'));
  });
})();

