/**
 * VIDEO KISAH CINTA (2 bagian) — bar kontrol sendiri, TANPA fullscreen
 * - Kontrol per video: play/pause, geser waktu, mute/unmute, dan volume.
 *   (Kontrol bawaan browser tidak dipakai karena di iPhone selalu ada fullscreen.)
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
        vol: w.querySelector('.lv-vol'),
        ratio: 0,
        userPaused: false,
        seeking: false,
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

    // iPhone: volume hanya bisa diatur dengan tombol HP, jadi slider disembunyikan
    const probe = document.createElement('video');
    probe.volume = 0.5;
    const volumeWorks = Math.abs(probe.volume - 0.5) < 0.01;

    const render = () => {
        const any = items.some(audible);
        items.forEach((it) => {
            const v = it.v;
            const loud = !v.muted && v.volume > 0;
            it.play.innerHTML = v.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
            it.play.setAttribute('aria-label', v.paused ? 'Putar video' : 'Jeda video');
            it.mute.innerHTML = loud ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
            it.mute.setAttribute('aria-label', loud ? 'Matikan suara video' : 'Nyalakan suara video');
            it.vol.value = v.muted ? 0 : v.volume;
            fill(it.vol);
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
            } else if (!it.v.paused) {
                it.v.pause();
            }
        });
        render();
    };

    items.forEach((it) => {
        const v = it.v;
        if (!volumeWorks) {
            it.w.classList.add('no-vol');
        }

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
        v.addEventListener('click', togglePlay);

        // mute / unmute (dijalankan langsung di dalam ketukan supaya diizinkan iPhone)
        it.mute.addEventListener('click', () => {
            if (v.muted || v.volume === 0) {
                soundOn(it);
            } else {
                v.muted = true;
            }
            render();
        });

        // volume
        it.vol.addEventListener('input', () => {
            const val = Number(it.vol.value);
            v.volume = val;
            if (val > 0 && v.muted) {
                soundOn(it);
            } else if (val === 0) {
                v.muted = true;
            }
            fill(it.vol);
        });

        // geser waktu
        it.seek.addEventListener('input', () => {
            it.seeking = true;
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
        });

        fill(it.seek);
        fill(it.vol);
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
