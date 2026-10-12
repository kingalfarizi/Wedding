/**
 * VIDEO KISAH CINTA (2 bagian, dengan suaranya sendiri)
 * - Kedua video berputar otomatis (autoplay) selama terlihat di layar.
 * - Hanya SATU video yang bersuara. Awalnya suara mengikuti video yang paling
 *   terlihat; tamu bisa memilih sendiri lewat tombol speaker di tiap video.
 * - Saat ada video bersuara, musik latar website dijeda; saat tidak ada
 *   (di-scroll lewat / suara dimatikan), musik latar lanjut lagi.
 * - Kalau browser menolak video langsung bersuara, video tetap berputar tanpa
 *   suara dan tombol speaker berdenyut agar tamu mengetuknya.
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
    const VISIBLE = 0.2;   // video diputar bila minimal 20% terlihat
    const FOCUS = 0.5;     // suara otomatis ke video yang ≥50% terlihat

    let opened = false;    // setelah "Buka Undangan"
    let manual = false;    // tamu sudah memilih sendiri lewat tombol speaker
    let silent = false;    // tamu memilih semua video tanpa suara
    let chosen = null;     // video yang dipilih tamu
    let owner = null;      // video yang sedang bersuara
    let holding = false;

    const hold = () => {
        if (!holding) {
            holding = true;
            document.dispatchEvent(new Event('undangan.music.hold'));
        }
    };
    const release = () => {
        if (holding) {
            holding = false;
            document.dispatchEvent(new Event('undangan.music.release'));
        }
    };
    const syncMusic = () => {
        if (owner && !owner.v.paused && !owner.v.muted) {
            hold();
        } else {
            release();
        }
    };

    const icon = (it) => {
        const on = !it.v.muted && !it.v.paused;
        it.b.innerHTML = on ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
        it.b.setAttribute('aria-label', on ? 'Matikan suara video ini' : 'Dengarkan suara video ini');
        it.w.classList.toggle('is-muted', !on);
        it.w.classList.toggle('is-audible', on);
    };

    // tentukan video mana yang bersuara
    const pickOwner = () => {
        if (silent) {
            return null;
        }
        if (manual) {
            return chosen && chosen.ratio >= VISIBLE ? chosen : null;
        }
        let best = null;
        items.forEach((it) => {
            if (it.ratio >= FOCUS && (!best || it.ratio > best.ratio)) {
                best = it;
            }
        });
        return best;
    };

    const apply = () => {
        if (!opened || document.hidden) {
            return;
        }
        owner = pickOwner();

        items.forEach((it) => {
            const shouldPlay = it.ratio >= VISIBLE && !reduce;
            const loud = it === owner;

            if (!loud) {
                it.v.muted = true;
            }

            if (!shouldPlay && !loud) {
                it.v.pause();
            } else if (it.v.paused || (loud && it.v.muted)) {
                it.v.preload = 'auto';
                it.v.muted = !loud;
                const p = it.v.play();
                if (p && p.catch) {
                    p.catch(() => {
                        // video bersuara ditolak browser: putar tanpa suara
                        if (loud) {
                            it.w.classList.add('needs-tap');
                            it.v.muted = true;
                            if (owner === it) {
                                owner = null;
                            }
                            it.v.play().catch(() => {});
                            syncMusic();
                        }
                        icon(it);
                    });
                }
            }
            icon(it);
        });
        syncMusic();
    };

    items.forEach((it) => {
        it.v.addEventListener('loadeddata', () => it.v.classList.add('is-ready'), { once: true });
        ['play', 'pause', 'volumechange'].forEach((ev) => it.v.addEventListener(ev, () => {
            icon(it);
            syncMusic();
        }));

        // tombol speaker (atau ketuk video): pilih suara video ini / matikan
        const toggle = () => {
            manual = true;
            items.forEach((o) => o.w.classList.remove('needs-tap'));
            if (it === owner && !it.v.muted) {
                silent = true;
                chosen = null;
                it.v.muted = true;
                owner = null;
            } else {
                silent = false;
                chosen = it;
                // dijalankan langsung di dalam ketukan supaya diizinkan browser (iPhone)
                items.forEach((o) => {
                    if (o !== it) {
                        o.v.muted = true;
                    }
                });
                it.v.muted = false;
                owner = it;
                it.v.play().catch(() => {});
            }
            apply();
        };
        it.b.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });
        it.v.addEventListener('click', toggle);
        icon(it);
    });

    // tamu menyalakan musik latar lewat tombol musik: semua video tanpa suara
    document.addEventListener('undangan.music.user-play', () => {
        manual = true;
        silent = true;
        chosen = null;
        owner = null;
        holding = false;
        items.forEach((o) => {
            o.v.muted = true;
            icon(o);
        });
    });

    if (!('IntersectionObserver' in window)) {
        items.forEach((it) => {
            it.v.controls = true;
            it.b.hidden = true;
        });
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
    }, { threshold: [0, 0.1, VISIBLE, 0.35, FOCUS, 0.65, 0.8, 1] });

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
