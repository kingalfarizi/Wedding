/**
 * MUSIK LATAR
 * Lagu diputar secara streaming: undangan tidak perlu menunggu file lagu
 * selesai diunduh. Lagu mulai dimuat setelah halaman pembukaan tampil,
 * lalu diputar saat tombol "Buka Undangan" ditekan.
 */
(() => {
    const url = document.body.getAttribute('data-music');
    const button = document.getElementById('button-music');
    if (!url || !button) {
        return;
    }

    const ICON_PLAY = '<i class="fa-solid fa-circle-pause spin-button"></i>';
    const ICON_PAUSE = '<i class="fa-solid fa-circle-play"></i>';

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'none';
    audio.src = url;

    let wantPlay = false;

    const render = () => {
        button.innerHTML = audio.paused ? ICON_PAUSE : ICON_PLAY;
    };

    const play = () => {
        wantPlay = true;
        audio.play().then(render).catch(render);
    };

    const pause = () => {
        wantPlay = false;
        audio.pause();
        render();
    };

    // Mulai memuat lagu setelah semua foto selesai (tidak berebut koneksi)
    document.addEventListener('undangan.progress.done', () => {
        audio.preload = 'auto';
        audio.load();
    });

    document.addEventListener('undangan.open', () => {
        button.classList.remove('d-none');
        play();
    });

    // Video Kisah Cinta yang bersuara meminta musik latar berhenti sementara,
    // lalu musik dilanjutkan lagi saat video berhenti / di-scroll lewat.
    let held = false;
    document.addEventListener('undangan.music.hold', () => {
        held = true;
        audio.pause();
    });
    document.addEventListener('undangan.music.release', () => {
        held = false;
        if (wantPlay && !document.hidden) {
            audio.play().then(render).catch(render);
        }
    });

    button.addEventListener('click', () => {
        if (audio.paused) {
            // tamu sengaja menyalakan musik: suara video dimatikan
            if (held) {
                document.dispatchEvent(new Event('undangan.music.user-play'));
            }
            play();
        } else {
            pause();
        }
    });
    audio.addEventListener('play', render);
    audio.addEventListener('pause', render);

    // Jeda saat tamu pindah aplikasi/tab, lanjut lagi saat kembali
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            audio.pause();
        } else if (wantPlay && !held) {
            audio.play().catch(() => {});
        }
    });
})();
