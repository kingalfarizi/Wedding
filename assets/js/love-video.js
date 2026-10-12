/**
 * VIDEO KISAH CINTA (2 bagian, dengan suaranya sendiri)
 * - Hanya satu video yang diputar: yang paling terlihat di layar.
 * - Saat video bersuara diputar, musik latar website dijeda; saat video
 *   berhenti (di-scroll lewat / suara dimatikan), musik latar lanjut lagi.
 * - Kalau browser tidak mengizinkan video langsung bersuara, video tetap
 *   diputar tanpa suara dan tamu bisa mengetuk tombol speaker.
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
    let opened = false;     // setelah "Buka Undangan"
    let userMuted = false;  // tamu sengaja mematikan suara video
    let active = null;
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
        const audible = active && !active.v.paused && !active.v.muted;
        if (audible) {
            hold();
        } else {
            release();
        }
    };

    const icon = (it) => {
        const on = !it.v.muted;
        it.b.innerHTML = on ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
        it.b.setAttribute('aria-label', on ? 'Matikan suara video' : 'Nyalakan suara video');
        it.w.classList.toggle('is-muted', !on);
    };

    const start = (it) => {
        items.forEach((o) => {
            if (o !== it) {
                o.v.pause();
            }
        });
        active = it;
        it.v.preload = 'auto';
        it.v.muted = userMuted;
        icon(it);
        const p = it.v.play();
        if (p && p.catch) {
            p.catch(() => {
                // browser menolak video bersuara tanpa ketukan: putar tanpa suara
                it.v.muted = true;
                icon(it);
                it.v.play().catch(() => {});
                syncMusic();
            });
        }
    };

    const stopAll = () => {
        items.forEach((o) => o.v.pause());
        active = null;
        syncMusic();
    };

    const evaluate = () => {
        if (!opened || document.hidden) {
            return;
        }
        let best = null;
        items.forEach((it) => {
            if (it.ratio >= 0.5 && (!best || it.ratio > best.ratio)) {
                best = it;
            }
        });
        if (!best) {
            stopAll();
        } else if (best !== active || best.v.paused) {
            if (reduce && best !== active) {
                items.forEach((o) => o.v.pause());
                active = best;
                syncMusic();
                return;
            }
            if (!reduce) {
                start(best);
            }
        }
    };

    items.forEach((it) => {
        it.v.addEventListener('loadeddata', () => it.v.classList.add('is-ready'), { once: true });
        ['play', 'pause', 'volumechange'].forEach((ev) => it.v.addEventListener(ev, () => {
            icon(it);
            if (it === active) {
                syncMusic();
            }
        }));

        // tombol speaker (dan ketuk video) = nyalakan / matikan suara
        const toggle = () => {
            if (it.v.muted) {
                userMuted = false;
                items.forEach((o) => {
                    if (o !== it) {
                        o.v.pause();
                    }
                });
                active = it;
                it.v.muted = false;
                if (it.v.paused) {
                    it.v.play().catch(() => {});
                }
            } else {
                userMuted = true;
                it.v.muted = true;
            }
            icon(it);
            syncMusic();
        };
        it.b.addEventListener('click', toggle);
        it.v.addEventListener('click', toggle);
        icon(it);
    });

    // tamu menyalakan musik latar lewat tombol musik: suara video dimatikan
    document.addEventListener('undangan.music.user-play', () => {
        userMuted = true;
        items.forEach((o) => {
            o.v.muted = true;
            icon(o);
        });
        holding = false;
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
        evaluate();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    items.forEach((it) => {
        preloader.observe(it.v);
        watcher.observe(it.v);
    });

    document.addEventListener('undangan.open', () => {
        opened = true;
        setTimeout(evaluate, 300);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            items.forEach((o) => o.v.pause());
        } else {
            evaluate();
        }
    });
})();
