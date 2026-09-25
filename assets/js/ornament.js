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

    // ---------- Divider: tirai terbuka saat di-scroll ----------
    const dividers = document.querySelectorAll('.section-divider');
    dividers.forEach((d, i) => {
        d.classList.add('divider-anim');
        d.style.setProperty('--shine-delay', `${1.5 + (i % 3) * 1.2}s`);
    });

    const startDividers = () => {
        if (!('IntersectionObserver' in window)) {
            dividers.forEach((d) => d.classList.add('is-in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        dividers.forEach((d) => io.observe(d));
    };

    // Mulai setelah undangan dibuka, supaya animasinya terlihat oleh tamu.
    if (!welcome) {
        startDividers();
    }

    // ---------- Burung terbang ke sana kemari ----------
    const BIRD_MAX = 3;          // jumlah burung maksimum di layar
    const BIRD_SVG = '<svg viewBox="0 0 60 30" aria-hidden="true">'
        + '<path class="wing" d="M30 17 C25 7 14 2 1 7 C11 11 20 15 28 20 Z"/>'
        + '<path class="wing" d="M30 17 C35 7 46 2 59 7 C49 11 40 15 32 20 Z"/>'
        + '<ellipse cx="30" cy="18.5" rx="6.5" ry="3"/>'
        + '<path d="M35 16.5 L41 16 L36 19 Z"/></svg>';
    let birdLayer = null;
    let birdTimer = null;

    const spawnBird = () => {
        if (document.hidden || birdLayer.childElementCount >= BIRD_MAX) {
            return;
        }

        const W = birdLayer.clientWidth;
        const H = birdLayer.clientHeight;
        const size = rand(36, 56);
        const fromLeft = Math.random() < 0.5;
        const uTurn = Math.random() < 0.35;   // sebagian burung berbalik arah
        const off = size + 20;

        const bird = document.createElement('div');
        bird.className = 'bird';
        bird.style.setProperty('--size', `${size.toFixed(0)}px`);
        bird.style.setProperty('--flap', `${rand(0.3, 0.45).toFixed(2)}s`);
        bird.style.setProperty('--bob', `${rand(1.2, 2).toFixed(2)}s`);
        bird.innerHTML = `<div class="bird-bob"><div class="bird-dir${fromLeft ? '' : ' to-left'}">${BIRD_SVG}</div></div>`;
        birdLayer.appendChild(bird);

        const dir = bird.querySelector('.bird-dir');
        const startX = fromLeft ? -off : W + off;
        const y = () => rand(H * 0.08, H * 0.6);
        let points;

        if (uTurn) {
            const turnX = fromLeft ? rand(W * 0.55, W * 0.85) : rand(W * 0.15, W * 0.45);
            points = [[startX, y()], [(startX + turnX) / 2, y()], [turnX, y()], [(startX + turnX) / 2, y()], [startX, y()]];
        } else {
            const endX = fromLeft ? W + off : -off;
            points = [[startX, y()], [startX + (endX - startX) * 0.33, y()], [startX + (endX - startX) * 0.66, y()], [endX, y()]];
        }

        const duration = rand(9000, 15000) * (uTurn ? 1.3 : 1);
        const anim = bird.animate(
            points.map(([x, yy]) => ({ transform: `translate(${x.toFixed(0)}px, ${yy.toFixed(0)}px)` })),
            { duration, easing: 'ease-in-out', fill: 'forwards' },
        );

        if (uTurn) {
            setTimeout(() => dir.classList.toggle('to-left'), duration * 0.5);
        }

        anim.onfinish = () => bird.remove();
    };

    const startBirds = () => {
        if (reduceMotion || birdTimer || !Element.prototype.animate) {
            return;
        }

        birdLayer = document.createElement('div');
        birdLayer.className = 'bird-layer';
        birdLayer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(birdLayer);

        spawnBird();
        setTimeout(spawnBird, 1800);
        birdTimer = setInterval(() => {
            if (Math.random() < 0.7) {
                spawnBird();
            }
        }, 4500);
    };

    // ---------- Saat undangan dibuka ----------
    document.addEventListener('undangan.open', () => {
        welcome?.classList.add('orn-exit');
        setTimeout(startPetals, 800);
        setTimeout(refreshAOS, 400);
        setTimeout(startDividers, 300);
        setTimeout(startBirds, 1500);
    });
})();
