/**
 * ORNAMEN & ANIMASI
 * - Memutar animasi cover (ornamen masuk + teks muncul bergantian)
 * - Ornamen cover "terbuka" saat tombol Buka Undangan ditekan
 * - Kelopak bunga berjatuhan setelah undangan dibuka
 */
(() => {
    document.documentElement.classList.add('orn-js');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const welcome = document.getElementById('welcome');

    // ---------- Cover ----------
    if (welcome) {
        const play = () => welcome.classList.add('orn-play');

        if (parseFloat(welcome.style.opacity || '0') > 0) {
            play();
        } else {
            const obs = new MutationObserver(() => {
                if (parseFloat(welcome.style.opacity || '0') > 0) {
                    play();
                    obs.disconnect();
                }
            });
            obs.observe(welcome, { attributes: true, attributeFilter: ['style'] });
        }
    }

    // ---------- Kelopak bunga ----------
    const PETAL_MAX = 12;        // jumlah kelopak maksimum di layar
    const PETAL_EVERY = 900;     // jeda munculnya kelopak baru (ms)
    let layer = null;
    let timer = null;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const spawnPetal = () => {
        if (document.hidden || layer.childElementCount >= PETAL_MAX) {
            return;
        }

        const p = document.createElement('span');
        p.className = 'petal';
        p.style.left = `${rand(0, 100)}%`;
        p.style.setProperty('--s', `${rand(8, 15).toFixed(1)}px`);
        p.style.setProperty('--fall', `${rand(8, 14).toFixed(1)}s`);
        p.style.setProperty('--drift', `${rand(2, 4).toFixed(1)}s`);
        p.style.opacity = rand(0.55, 0.9).toFixed(2);
        p.addEventListener('animationend', (e) => {
            if (e.animationName === 'petal-fall') {
                p.remove();
            }
        });

        layer.appendChild(p);
    };

    const startPetals = () => {
        if (reduceMotion || timer) {
            return;
        }

        layer = document.createElement('div');
        layer.className = 'petal-layer';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);

        for (let i = 0; i < 5; i++) {
            setTimeout(spawnPetal, i * 250);
        }
        timer = setInterval(spawnPetal, PETAL_EVERY);
    };

    // ---------- Sinkronkan posisi animasi scroll (AOS) ----------
    // Tinggi halaman berubah setelah foto, video, dan daftar ucapan selesai dimuat.
    // Tanpa refresh, AOS memakai posisi lama sehingga elemen telat muncul.
    let refreshTimer = null;
    const refreshAOS = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => window.AOS?.refresh(), 150);
    };

    if ('ResizeObserver' in window) {
        const root = document.getElementById('root');
        if (root) {
            new ResizeObserver(refreshAOS).observe(root);
        }
    }
    document.addEventListener('load', (e) => {
        if (e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement) {
            refreshAOS();
        }
    }, true);

    // ---------- Saat undangan dibuka ----------
    document.addEventListener('undangan.open', () => {
        welcome?.classList.add('orn-exit');
        setTimeout(startPetals, 800);
        setTimeout(refreshAOS, 400);
    });
})();
