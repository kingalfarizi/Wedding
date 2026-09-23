/**
 * WEDDING WISH - Google Apps Script
 * Tempel seluruh isi file ini ke Extensions > Apps Script pada Google Sheets Anda,
 * lalu Deploy sebagai Web App (lihat PANDUAN-WEDDING-WISH.md).
 *
 * Kolom sheet "Wishes":
 * A: Waktu | B: Nama | C: Ucapan | D: Centang | E: Sembunyikan
 *  - Isi kolom D dengan TRUE (atau centang) agar nama tampil dengan tanda ✓
 *  - Isi kolom E dengan TRUE (atau centang) untuk menyembunyikan ucapan dari web
 */

const SHEET_NAME = 'Wishes';
const MAX_NAME = 50;
const MAX_WISH = 1000;

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Waktu', 'Nama', 'Ucapan', 'Centang', 'Sembunyikan']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:E1').setFontWeight('bold');
    sheet.setColumnWidth(3, 400);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isTrue_(v) {
  return v === true || String(v).trim().toUpperCase() === 'TRUE' || String(v).trim().toUpperCase() === 'YA';
}

// Cegah teks dianggap rumus oleh Google Sheets.
function safeText_(s) {
  s = String(s || '').replace(/\r\n/g, '\n').trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** GET: ambil semua ucapan (terbaru di atas). */
function doGet() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return json_({ ok: true, data: [] });

  const rows = sheet.getRange(2, 1, last - 1, 5).getValues();
  const data = rows
    .filter(function (r) { return r[1] && r[2] && !isTrue_(r[4]); })
    .map(function (r) {
      const t = r[0] instanceof Date ? r[0] : new Date(r[0]);
      return {
        name: String(r[1]),
        wish: String(r[2]),
        verified: isTrue_(r[3]),
        time: isNaN(t.getTime()) ? null : t.toISOString()
      };
    })
    .reverse();

  return json_({ ok: true, data: data });
}

/** POST: simpan ucapan baru. Body berupa JSON teks: {name, wish, website} */
function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Format data tidak valid.' });
  }

  // Honeypot anti-bot: field "website" harus kosong.
  if (body.website) return json_({ ok: true });

  const name = String(body.name || '').trim();
  const wish = String(body.wish || '').trim();

  if (name.length < 2 || name.length > MAX_NAME) {
    return json_({ ok: false, error: 'Nama harus 2-' + MAX_NAME + ' karakter.' });
  }
  if (wish.length < 1 || wish.length > MAX_WISH) {
    return json_({ ok: false, error: 'Ucapan harus 1-' + MAX_WISH + ' karakter.' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const now = new Date();
    getSheet_().appendRow([now, safeText_(name), safeText_(wish), false, false]);
    return json_({
      ok: true,
      data: { name: name, wish: wish, verified: false, time: now.toISOString() }
    });
  } finally {
    lock.releaseLock();
  }
}

/** Jalankan sekali dari editor untuk membuat sheet & memberi izin. */
function setup() {
  getSheet_();
}
