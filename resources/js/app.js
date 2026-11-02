/**
 * resources/js/app.js
 * JavaScript vanilla untuk progressive enhancement.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Progressive enhancement init
    const forms = document.querySelectorAll('form[data-confirm]');
    forms.forEach((form) => {
        form.addEventListener('submit', (e) => {
            const message = form.getAttribute('data-confirm') || 'Apakah Anda yakin?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
});
