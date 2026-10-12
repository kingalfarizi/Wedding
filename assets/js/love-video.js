/**
 * VIDEO KISAH CINTA (2 bagian)
 * - Kedua video berputar otomatis TANPA SUARA selama terlihat di layar,
 *   dan berhenti saat di-scroll lewat.
 * - Tiap video punya tombol speaker (atau ketuk videonya) untuk mute / unmute.
 * - Hanya satu video yang bersuara: unmute satu video otomatis membisukan
 *   video lainnya.
 * - Selama ada video bersuara, musik latar website dijeda; musik lanjut lagi
 *   saat tidak ada video yang bersuara.
 * - Video baru diunduh saat bagian Kisah Cinta hampir terlihat.
 */
(() => {
    const items = [...document.querySelectorAll('.love-video-wrap')].map((w) => ({
        w,
        v: w.querySelector('video'),
        b: w.querySelector('.love-video-sound'),
        ratio: 0,
    }));
    if (!items.length) {
        return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const VISIBLE = 0.2;   // diputar bila minimal 20% terlihat
    let opened = false;    // setelah "Buka Undangan"
    let holding = false;

    const audible = (it) => !it.v.paused && !it.v.muted;

    const render = () => {
        const any = items.some(audible);
        items.forEach((it) => {
            const on = audible(it);
            it.b.innerHTML = on ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
            it.b.setAttribute('aria-label', on ? 'Matikan suara video' : 'Nyalakan suara video');
            it.w.classList.toggle('is-audible', on);
        });
        if (any && !holding) {
            holding = true;
            document.dispatchEvent(new Event('undangan.music.hold'));
        } else if (!any && holding) {
            holding = false;
            document.dispatchEvent(new Event('undangan.music.release'));
        }
    };

    const apply = () => {
        if (!opened || document.hidden) {
            return;
        }
        items.forEach((it) => {
            if (it.ratio >= VISIBLE && !reduce) {
                if (it.v.paused) {
                    it.v.preload = 'auto';
                    it.v.play().catch(() => {
                        // suara ditolak browser: putar tanpa suara
                        it.v.muted = true;
                        it.v.play().catch(() => {});
                    });
                }
            } else if (!it.v.paused) {
                it.v.pause();
            }
        });
        render();
    };

    items.forEach((it) => {
        it.v.addEventListener('loadeddata', () => it.v.classList.add('is-ready'), { once: true });
        ['play', 'pause', 'volumechange'].forEach((ev) => it.v.addEventListener(ev, render));

        // mute / unmute (dijalankan langsung di dalam ketukan supaya diizinkan iPhone)
        const toggle = () => {
            if (it.v.muted) {
                items.forEach((o) => {
                    o.v.muted = true;
                });
                it.v.muted = false;
                if (it.v.paused) {
                    it.v.play().catch(() => {});
                }
            } else {
                it.v.muted = true;
            }
            render();
        };
        it.b.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });
        it.v.addEventListener('click', toggle);
    });

    // tamu menyalakan musik latar lewat tombol musik: semua video dibisukan
    document.addEventListener('undangan.music.user-play', () => {
        holding = false;
        items.forEach((o) => {
            o.v.muted = true;
        });
        render();
    });

    render();

    if (!('IntersectionObserver' in window)) {
        return;
    }

    // mulai unduh sedikit sebelum terlihat
    const preloader = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.preload = 'auto';
                preloader.unobserve(e.target);
            }
        });
    }, { rootMargin: '600px 0px' });

    const watcher = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            const it = items.find((o) => o.v === e.target);
            if (it) {
                it.ratio = e.isIntersecting ? e.intersectionRatio : 0;
            }
        });
        apply();
    }, { threshold: [0, 0.1, VISIBLE, 0.5, 1] });

    items.forEach((it) => {
        preloader.observe(it.v);
        watcher.observe(it.v);
    });

    document.addEventListener('undangan.open', () => {
        opened = true;
        setTimeout(apply, 300);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            items.forEach((o) => o.v.pause());
        } else {
            apply();
        }
    });
})();
