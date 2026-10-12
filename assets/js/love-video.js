/**
 * VIDEO KISAH CINTA
 * Dua video diputar otomatis (tanpa suara, berulang) hanya saat terlihat di layar,
 * dan dijeda saat di-scroll lewat supaya hemat kuota & baterai tamu.
 * Video baru mulai diunduh ketika bagian Kisah Cinta hampir terlihat.
 */
(() => {
    const vids = document.querySelectorAll('.love-video');
    if (!vids.length) {
        return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    vids.forEach((v) => {
        v.muted = true;
        v.addEventListener('loadeddata', () => v.classList.add('is-ready'), { once: true });
    });

    if (!('IntersectionObserver' in window)) {
        vids.forEach((v) => {
            v.preload = 'metadata';
            v.controls = true;
        });
        return;
    }

    // Mulai unduh sedikit sebelum terlihat
    const preloader = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.preload = 'auto';
                preloader.unobserve(e.target);
            }
        });
    }, { rootMargin: '600px 0px' });

    // Putar saat terlihat, jeda saat tidak
    const player = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            const v = e.target;
            if (e.isIntersecting && !reduce) {
                v.play().catch(() => { v.controls = true; });
            } else {
                v.pause();
            }
        });
    }, { threshold: 0.35 });

    vids.forEach((v) => {
        preloader.observe(v);
        player.observe(v);
        if (reduce) {
            v.controls = true;
        }
    });
})();
