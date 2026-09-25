/**
 * HADIAH PERNIKAHAN
 * Kartu rekening disembunyikan dulu; muncul dengan animasi setelah
 * tombol "Kirim Hadiah" ditekan, dan tertutup lagi saat ditekan kembali.
 */
(() => {
    const button = document.getElementById('gift-open');
    const panel = document.getElementById('gift-collapse');
    if (!button || !panel) {
        return;
    }

    const label = button.querySelector('span');

    button.addEventListener('click', () => {
        const open = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', open);
        button.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
        label.textContent = open ? 'Tutup' : 'Kirim Hadiah';

        // setelah terbuka, gulir pelan supaya kartu terlihat
        if (open) {
            setTimeout(() => {
                const r = panel.getBoundingClientRect();
                if (r.bottom > window.innerHeight) {
                    window.scrollBy({ top: Math.min(r.bottom - window.innerHeight + 80, r.top - 80), behavior: 'smooth' });
                }
            }, 650);
        }
    });
})();
