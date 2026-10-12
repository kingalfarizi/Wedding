/**
 * VIDEO KISAH CINTA (2 bagian) — bar kontrol sendiri, TANPA fullscreen
 * - Kontrol per video: play/pause, geser waktu, dan mute/unmute (tanpa slider volume).
 *   (Kontrol bawaan browser tidak dipakai karena di iPhone selalu ada fullscreen.)
 * - Bar kontrol tidak selalu tampil: muncul saat video disentuh/di-hover, lalu
 *   memudar sendiri setelah beberapa detik (tetap tampil selama video di-pause).
 * - Kedua video berputar otomatis TANPA SUARA selama terlihat di layar dan
 *   berhenti saat di-scroll lewat. Video yang di-pause tamu tidak diputar ulang sendiri.
 * - Hanya satu video yang bersuara: unmute satu video otomatis membisukan lainnya.
 * - Selama ada video bersuara, musik latar website dijeda; lanjut lagi saat tidak ada.
 * - Video baru diunduh saat bagian Kisah Cinta hampir terlihat.
 */
(() => {
    const items = [...document.querySelectorAll('.love-video-wrap')].map((w) => ({
        w,
        v: w.querySelector('video'),
        play: w.querySelector('.lv-play'),
        seek: w.querySelector('.lv-seek'),
        time: w.querySelector('.lv-time'),
        mute: w.querySelector('.lv-mute'),
        ratio: 0,
        userPaused: false,
        seeking: false,
        hideTimer: 0,
        hinted: false,
    }));
    if (!items.length) {
        return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const VISIBLE = 0.2;   // diputar bila minimal 20% terlihat
    let opened = false;    // setelah "Buka Undangan"
    let holding = false;

    const fmt = (t) => {
        t = Math.max(0, Math.floor(t || 0));
        return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    };
    const fill = (input) => {
        const p = ((input.value - input.min) / (input.max - input.min)) * 100;
        input.style.setProperty('--p', `${p}%`);
    };
    const audible = (it) => !it.v.paused && !it.v.muted && it.v.volume > 0;

    const HIDE_MS = 2500;  // bar memudar setelah 2,5 detik tanpa interaksi

    // tampilkan bar kontrol; sembunyikan lagi otomatis (kecuali sedang pause / geser waktu)
    const reveal = (it) => {
        it.w.classList.add('lv-show');
        clearTimeout(it.hideTimer);
        it.hideTimer = setTimeout(() => {
            if (it.seeking || it.v.paused) {
                return;
            }
            it.w.classList.remove('lv-show');
        }, HIDE_MS);
    };

    const render = () => {
        const any = items.some(audible);
        items.forEach((it) => {
            const v = it.v;
            const loud = !v.muted;
            it.play.innerHTML = v.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
            it.play.setAttribute('aria-label', v.paused ? 'Putar video' : 'Jeda video');
            it.mute.innerHTML = loud ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
            it.mute.setAttribute('aria-label', loud ? 'Matikan suara video' : 'Nyalakan suara video');
            if (v.paused) {
                it.w.classList.add('lv-show');
            }
            it.w.classList.toggle('is-audible', audible(it));
        });
        if (any && !holding) {
            holding = true;
            document.dispatchEvent(new Event('undangan.music.hold'));
        } else if (!any && holding) {
            holding = false;
            document.dispatchEvent(new Event('undangan.music.release'));
        }
    };

    const progress = (it) => {
        if (it.seeking) {
            return;
        }
        const d = it.v.duration || 0;
        it.seek.value = d ? Math.round((it.v.currentTime / d) * 1000) : 0;
        fill(it.seek);
        it.time.textContent = fmt(it.v.currentTime);
    };

    const start = (it) => {
        it.v.preload = 'auto';
        const p = it.v.play();
        if (p && p.catch) {
            p.catch(() => {
                // suara ditolak browser: putar tanpa suara
                it.v.muted = true;
                it.v.play().catch(() => {});
            });
        }
    };

    const soundOn = (it) => {
        items.forEach((o) => {
            if (o !== it) {
                o.v.muted = true;
            }
        });
        it.v.muted = false;
        if (it.v.volume === 0) {
            it.v.volume = 1;
        }
        if (it.v.paused) {
            it.userPaused = false;
            start(it);
        }
    };

    const apply = () => {
        if (!opened || document.hidden) {
            return;
        }
        items.forEach((it) => {
            if (it.ratio >= VISIBLE) {
                if (it.v.paused && !it.userPaused && !reduce) {
                    start(it);
                }
                if (!it.hinted) {
                    it.hinted = true;
                    reveal(it);
                }
            } else if (!it.v.paused) {
                it.v.pause();
            }
        });
        render();
    };

    items.forEach((it) => {
        const v = it.v;
        v.addEventListener('loadeddata', () => v.classList.add('is-ready'), { once: true });
        ['play', 'pause', 'volumechange'].forEach((ev) => v.addEventListener(ev, render));
        ['timeupdate', 'loadedmetadata', 'durationchange'].forEach((ev) => v.addEventListener(ev, () => progress(it)));

        // play / pause (tombol atau ketuk video)
        const togglePlay = () => {
            if (v.paused) {
                it.userPaused = false;
                start(it);
            } else {
                it.userPaused = true;
                v.pause();
            }
        };
        it.play.addEventListener('click', togglePlay);
        v.addEventListener('click', () => {
            togglePlay();
            reveal(it);
        });

        // tampilkan bar saat disentuh / digerakkan mouse / difokus keyboard
        ['pointerdown', 'pointermove', 'focusin'].forEach((ev) => it.w.addEventListener(ev, () => reveal(it)));

        // saat diputar lagi, mulai hitung mundur sembunyi
        v.addEventListener('play', () => reveal(it));

        // mute / unmute (dijalankan langsung di dalam ketukan supaya diizinkan iPhone)
        it.mute.addEventListener('click', () => {
            if (v.muted || v.volume === 0) {
                soundOn(it);
            } else {
                v.muted = true;
            }
            render();
        });

        // geser waktu
        it.seek.addEventListener('input', () => {
            it.seeking = true;
            reveal(it);
            fill(it.seek);
            const d = v.duration || 0;
            if (d) {
                it.time.textContent = fmt((it.seek.value / 1000) * d);
            }
        });
        it.seek.addEventListener('change', () => {
            const d = v.duration || 0;
            if (d) {
                v.currentTime = (it.seek.value / 1000) * d;
            }
            it.seeking = false;
            reveal(it);
        });

        fill(it.seek);
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
