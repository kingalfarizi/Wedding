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

    const render = () => {
        list.replaceChildren();

        if (wishes.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'wish-empty';
            empty.textContent = 'Belum ada ucapan. Jadilah yang pertama!';
            list.appendChild(empty);
        }

        wishes.slice(0, shown).forEach((w) => list.appendChild(createCard(w)));
        more.hidden = wishes.length <= shown;
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

            wishes.unshift(json.data || { name, wish, verified: false, time: new Date().toISOString() });
            shown = Math.max(shown, PAGE_SIZE);
            render();

            inputWish.value = '';
            showAlert('Terima kasih atas ucapan dan doanya!', 'success');
            list.firstElementChild?.classList.add('wish-card-new');
        } catch (err) {
            showAlert(err.message && err.message !== 'Failed to fetch' ? err.message : 'Gagal mengirim ucapan. Periksa koneksi internet Anda.');
        } finally {
            button.disabled = false;
            button.innerHTML = label;
        }
    };

    // Isi nama otomatis dari link undangan (?to=Nama).
    const raw = window.location.search.split('to=');
    if (raw.length > 1 && raw[1]) {
        try {
            inputName.value = decodeURIComponent(raw[1].replace(/\+/g, ' ')).slice(0, 50);
        } catch {
            // abaikan
        }
    }

    more.addEventListener('click', () => {
        shown += PAGE_SIZE;
        render();
    });

    form.addEventListener('submit', send);
    load();
})();
