/**
 * VIDEO KISAH CINTA (2 bagian, dengan kontrol pemutar)
 * - Tiap video punya kontrol bawaan browser: play/pause, volume, geser waktu,
 *   dan fullscreen.
 * - Kedua video berputar otomatis selama terlihat di layar dan berhenti saat
 *   di-scroll lewat. Video yang sengaja di-pause tamu tidak diputar ulang.
 * - Kedua video awalnya tanpa suara (mute). Suara baru keluar setelah tamu
 *   menekan tombol volume (unmute) di video tersebut.
 * - Hanya satu video yang bersuara: menyalakan suara satu video otomatis
 *   membisukan video lainnya.
 * - Selama ada video bersuara, musik latar website dijeda; musik lanjut lagi
 *   saat tidak ada video yang bersuara.
 */
(() => {
    const items = [...document.querySelectorAll('.love-video-wrap')].map((w) => ({
        w,
        v: w.querySelector('video'),
        ratio: 0,
        userPaused: false,
        quietUntil: 0,   // abaikan event yang dipicu oleh script ini sendiri
    }));
    if (!items.length) {
        return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const VISIBLE = 0.2;   // diputar bila minimal 20% terlihat

    let opened = false;    // setelah "Buka Undangan"
    let holding = false;

    const quiet = (it) => {
        it.quietUntil = Date.now() + 400;
    };
    const isQuiet = (it) => Date.now() < it.quietUntil;
    const audible = (it) => !it.v.paused && !it.v.muted && it.v.volume > 0;

    const syncMusic = () => {
        const any = items.some(audible);
        items.forEach((it) => it.w.classList.toggle('is-audible', audible(it)));
        if (any && !holding) {
            holding = true;
            document.dispatchEvent(new Event('undangan.music.hold'));
        } else if (!any && holding) {
            holding = false;
            document.dispatchEvent(new Event('undangan.music.release'));
        }
    };

    const muteOthers = (keep) => {
        items.forEach((o) => {
            if (o !== keep && !o.v.muted) {
                quiet(o);
                o.v.muted = true;
            }
        });
    };

    const playIt = (it, withSound) => {
        quiet(it);
        it.v.preload = 'auto';
        it.v.muted = !withSound;
        const p = it.v.play();
        if (p && p.catch) {
            p.catch(() => {
                // browser menolak video bersuara tanpa ketukan: putar tanpa suara
                quiet(it);
                it.v.muted = true;
                it.v.play().catch(() => {});
                syncMusic();
            });
        }
    };

    const apply = () => {
        if (!opened || document.hidden) {
            return;
        }

        items.forEach((it) => {
            const visible = it.ratio >= VISIBLE;
            if (!visible) {
                if (!it.v.paused) {
                    quiet(it);
                    it.v.pause();
                }
                return;
            }
            if (reduce || it.userPaused) {
                return;
            }
            if (it.v.paused) {
                // awalnya tanpa suara; suara hanya keluar setelah tamu unmute sendiri
                playIt(it, !it.v.muted);
            }
        });
        syncMusic();
    };

    items.forEach((it) => {
        const v = it.v;
        v.addEventListener('loadeddata', () => v.classList.add('is-ready'), { once: true });

        v.addEventListener('volumechange', () => {
            if (!isQuiet(it)) {
                if (!v.muted && v.volume > 0) {
                    muteOthers(it);
                }
            }
            syncMusic();
        });

        v.addEventListener('play', () => {
            if (!isQuiet(it)) {
                it.userPaused = false;
                if (!v.muted && v.volume > 0) {
                    muteOthers(it);
                }
            }
            syncMusic();
        });

        v.addEventListener('pause', () => {
            if (!isQuiet(it) && !document.hidden && it.ratio >= VISIBLE) {
                it.userPaused = true;
            }
            syncMusic();
        });

        // keluar dari fullscreen: lanjutkan aturan normal
        v.addEventListener('webkitendfullscreen', () => setTimeout(apply, 200));
    });

    document.addEventListener('fullscreenchange', () => setTimeout(apply, 200));

    // tamu menyalakan musik latar lewat tombol musik: semua video dibisukan
    document.addEventListener('undangan.music.user-play', () => {
        holding = false;
        items.forEach((o) => {
            quiet(o);
            o.v.muted = true;
            o.w.classList.remove('is-audible');
        });
    });

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
        // saat fullscreen, posisi scroll tidak relevan
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            return;
        }
        entries.forEach((e) => {
            const it = items.find((o) => o.v === e.target);
            if (it) {
                it.ratio = e.isIntersecting ? e.intersectionRatio : 0;
            }
        });
        apply();
    }, { threshold: [0, 0.1, VISIBLE, 0.35, 0.5, 0.65, 0.8, 1] });

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
            items.forEach((o) => {
                quiet(o);
                o.v.pause();
            });
        } else {
            apply();
        }
    });
})();
