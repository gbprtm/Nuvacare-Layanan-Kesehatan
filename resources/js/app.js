/**
 * resources/js/app.js
 * Vanilla JavaScript untuk peningkatan interaksi pengguna (Progressive Enhancement).
 * Seluruh form dan navigasi tetap bekerja 100% normal tanpa JavaScript.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mencegah Double Submit pada Formulir Pengiriman
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            // Jika form tidak valid secara native HTML5, biarkan browser menangani
            if (!form.checkValidity()) {
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                // Beri indikasi visual proses tanpa merusak pengiriman data POST
                submitBtn.setAttribute('aria-busy', 'true');
                const originalText = submitBtn.textContent.trim();
                submitBtn.setAttribute('data-original-text', originalText);
                
                // Jangan disable sebelum data dikirim agar nilai tombol tetap masuk jika dibutuhkan
                setTimeout(() => {
                    submitBtn.style.opacity = '0.7';
                    submitBtn.style.pointerEvents = 'none';
                }, 50);
            }
        });
    });

    // 2. Aksesibilitas Keyboard: Pengelolaan Fokus untuk Skip Link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            const target = document.querySelector(skipLink.getAttribute('href'));
            if (target) {
                target.setAttribute('tabindex', '-1');
                target.focus();
            }
        });
    }
});
