/**
 * WEDDING WISH
 * Ucapan tamu disimpan di Google Sheets melalui Google Apps Script.
 * Isi URL Web App pada atribut data-wish-url di <section id="wish"> (index.html).
 */
(() => {
    const PAGE_SIZE = 10;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const section = document.getElementById('wish');
    if (!section) {
        return;
    }

    const url = (section.getAttribute('data-wish-url') || '').trim();
    const form = document.getElementById('wish-form');
    const inputName = document.getElementById('wish-name');
    const inputWish = document.getElementById('wish-text');
    const inputTrap = document.getElementById('wish-website');
    const button = document.getElementById('wish-send');
    const alertBox = document.getElementById('wish-alert');
    const list = document.getElementById('wish-list');
    const more = document.getElementById('wish-more');

    let wishes = [];
    let shown = PAGE_SIZE;

    const pad = (n) => String(n).padStart(2, '0');

    const formatDate = (iso) => {
        const d = new Date(iso);
        if (!iso || isNaN(d.getTime())) {
            return '';
        }
        return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const showAlert = (msg, type = 'error') => {
        alertBox.textContent = msg;
        alertBox.className = `wish-alert wish-alert-${type}`;
        alertBox.hidden = !msg;
    };

    const createCard = (w) => {
        const card = document.createElement('article');
        card.className = 'wish-card';

        const name = document.createElement('p');
        name.className = 'wish-card-name';
        name.textContent = w.name;
        if (w.verified) {
            const check = document.createElement('i');
            check.className = 'fa-solid fa-check ms-1';
            check.setAttribute('aria-label', 'terverifikasi');
            name.appendChild(check);
        }

        const time = document.createElement('p');
        time.className = 'wish-card-time';
        time.textContent = formatDate(w.time);

        const text = document.createElement('p');
        text.className = 'wish-card-text';
        text.textContent = w.wish;

        card.append(name, time, text);
        return card;
    };

    // Animasi kartu ucapan: muncul bergantian saat di-scroll ke layar.
    const revealer = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            let order = 0;
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                const card = entry.target;
                card.style.setProperty('--stagger', `${Math.min(order * 0.12, 0.6)}s`);
                card.classList.add('is-in');
                revealer.unobserve(card);
                order++;
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
        : null;

    const reveal = (card) => {
        card.classList.add('wish-card-anim');
        if (revealer) {
            revealer.observe(card);
        } else {
            card.classList.add('is-in');
        }
    };

    const render = () => {
        list.replaceChildren();

        if (wishes.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'wish-empty';
            empty.textContent = 'Belum ada ucapan. Jadilah yang pertama!';
            list.appendChild(empty);
        }

        wishes.slice(0, shown).forEach((w) => {
            const card = createCard(w);
            list.appendChild(card);
            reveal(card);
        });
        more.hidden = wishes.length <= shown;
    };

    /**
     * Konfeti saat ucapan berhasil dikirim (memakai pustaka konfeti yang sama
     * dengan tombol "Buka Undangan"): letupan dari tombol Kirim + hati berjatuhan.
     * @param {HTMLElement} from
     */
    // Pustaka konfeti tidak lagi dimuat oleh template (konfeti "Buka Undangan" dimatikan),
    // jadi dimuat sendiri di sini hanya saat tamu mengirim ucapan.
    let confettiLoading = null;
    const loadConfetti = () => {
        if (window.confetti) {
            return Promise.resolve(window.confetti);
        }
        if (!confettiLoading) {
            confettiLoading = new Promise((resolve) => {
                const sc = document.createElement('script');
                sc.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.js';
                sc.async = true;
                sc.onload = () => resolve(window.confetti || null);
                sc.onerror = () => resolve(null);
                document.head.appendChild(sc);
            });
        }
        return confettiLoading;
    };

    const celebrate = async (from) => {
        // posisi tombol dicatat dulu, karena tombol bisa hilang (mis. tombol "Lihat")
        const rect = from.getBoundingClientRect();
        const confetti = await loadConfetti();
        if (!confetti || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const zIndex = 1057;
        const origin = {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
        };
        const gold = ['#e2c794', '#f3dc9f', '#c9a24f', '#fbf4e6', '#d07a4f'];

        // letupan dari tombol Kirim
        confetti({ particleCount: 70, spread: 75, startVelocity: 38, origin, colors: gold, zIndex });
        setTimeout(() => confetti({ particleCount: 45, spread: 110, startVelocity: 28, origin, colors: gold, scalar: 0.8, zIndex }), 220);

        // hati pink berjatuhan sebentar
        const heart = confetti.shapeFromPath ? confetti.shapeFromPath({
            path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
            matrix: [0.0333, 0, 0, 0.0333, -5.57, -5.53],
        }) : null;
        const end = Date.now() + 2500;
        const frame = () => {
            ['#FFC0CB', '#FF1493', '#C71585'].forEach((color) => {
                confetti({
                    particleCount: 1,
                    startVelocity: 0,
                    ticks: 90,
                    origin: { x: Math.random(), y: Math.random() * 0.3 },
                    colors: [color],
                    shapes: heart ? [heart] : undefined,
                    gravity: 0.6 + Math.random() * 0.4,
                    drift: Math.random() - 0.5,
                    scalar: 0.6 + Math.random() * 0.5,
                    zIndex,
                });
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        requestAnimationFrame(frame);
    };


    const load = async () => {
        if (!url) {
            list.innerHTML = '<p class="wish-empty">Wedding Wish belum terhubung ke Google Sheets.</p>';
            return;
        }

        list.innerHTML = '<p class="wish-empty">Memuat ucapan...</p>';
        try {
            const res = await fetch(url, { method: 'GET', redirect: 'follow' });
            const json = await res.json();
            wishes = Array.isArray(json.data) ? json.data : [];
            render();
        } catch {
            list.innerHTML = '<p class="wish-empty">Gagal memuat ucapan. Silakan muat ulang halaman.</p>';
        }
    };

    const send = async (e) => {
        e.preventDefault();
        showAlert('');

        const name = inputName.value.trim();
        const wish = inputWish.value.trim();

        if (name.length < 2) {
            showAlert('Nama minimal 2 karakter.');
            inputName.focus();
            return;
        }
        if (wish.length < 1) {
            showAlert('Ucapan tidak boleh kosong.');
            inputWish.focus();
            return;
        }
        if (!url) {
            showAlert('Wedding Wish belum terhubung ke Google Sheets.');
            return;
        }

        const label = button.innerHTML;
        button.disabled = true;
        loadConfetti(); // mulai muat konfeti sambil menunggu ucapan terkirim
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Mengirim...';

        try {
            // text/plain agar tidak memicu preflight CORS pada Apps Script.
            const res = await fetch(url, {
                method: 'POST',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ name, wish, website: inputTrap.value }),
            });
            const json = await res.json();

            if (!json.ok) {
                throw new Error(json.error || 'Gagal mengirim ucapan.');
            }

            const item = json.data || { name, wish, verified: false, time: new Date().toISOString() };
            wishes.unshift(item);

            // Tambahkan kartu baru di paling atas tanpa menggambar ulang kartu lain,
            // supaya kartu yang sudah tampil tidak ikut beranimasi ulang.
            list.querySelector('.wish-empty')?.remove();
            const card = createCard(item);
            card.classList.add('wish-card-anim', 'is-in', 'wish-card-new');
            list.prepend(card);

            const cards = list.querySelectorAll('.wish-card');
            if (cards.length > shown) {
                cards[cards.length - 1].remove();
            }
            more.hidden = wishes.length <= shown;

            inputWish.value = '';
            showAlert('Terima kasih atas ucapan dan doanya!', 'success');
            celebrate(button);
        } catch (err) {
            showAlert(err.message && err.message !== 'Failed to fetch' ? err.message : 'Gagal mengirim ucapan. Periksa koneksi internet Anda.');
        } finally {
            button.disabled = false;
            button.innerHTML = label;
        }
    };

    // Isi nama otomatis dari link undangan (?to=Nama) dan kunci kolomnya,
    // supaya nama pengirim selalu sama dengan nama tamu di halaman depan.
    // Kalau undangan dibuka tanpa ?to=, kolom nama tetap bisa diisi.
    const raw = window.location.search.split('to=');
    if (raw.length > 1 && raw[1]) {
        try {
            const guest = decodeURIComponent(raw[1].replace(/\+/g, ' ')).trim().slice(0, 50);
            if (guest) {
                inputName.value = guest;
                inputName.readOnly = true;
                inputName.classList.add('wish-input-locked');
                inputName.setAttribute('aria-readonly', 'true');
                inputName.title = 'Nama sesuai undangan';
            }
        } catch {
            // abaikan
        }
    }

    // Konfeti juga saat menekan "Lihat" di Kisah Cinta
    // (tombol bawaan template, konfetinya dulu ikut dimatikan bersama konfeti "Buka Undangan").
    document.querySelectorAll('[onclick*="showStory"]').forEach((btn) => {
        btn.addEventListener('click', () => celebrate(btn));
    });

    // "Lihat ucapan lainnya": hanya kartu baru yang ditambahkan & dianimasikan.
    more.addEventListener('click', () => {
        const start = list.querySelectorAll('.wish-card').length;
        shown += PAGE_SIZE;
        wishes.slice(start, shown).forEach((w) => {
            const card = createCard(w);
            list.appendChild(card);
            reveal(card);
        });
        more.hidden = wishes.length <= shown;
    });

    form.addEventListener('submit', send);
    load();
})();
