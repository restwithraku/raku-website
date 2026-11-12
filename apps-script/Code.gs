/**
 * Raku website reviews: Google Apps Script for the reviews Google Sheet.
 *
 * - The website sends each new review here (POST). It is saved as a new row with "Approved" unticked.
 * - The website asks for reviews when a visitor opens the page (GET). Only rows with "Approved" ticked are returned.
 *
 * Setup (once): open your Google Sheet → Extensions → Apps Script, paste this whole file, Save,
 * run "setup" once (allow the permissions it asks for), then Deploy → New deployment → Web app,
 * Execute as: Me, Who has access: Anyone. Copy the web app URL into src/config.js on the website.
 */

var SHEET_NAME = 'Reviews';
var HEADERS = ['Date', 'Name', 'City', 'Product', 'Rating', 'Review', 'Approved'];
var COL = { date: 1, name: 2, city: 3, product: 4, rating: 5, review: 6, approved: 7 };
var LIMITS = { name: 60, city: 40, product: 80, reviewMin: 5, reviewMax: 600 };
var CACHE_SECONDS = 60;

/** Run once from the Apps Script editor: creates the Reviews sheet with headers and the Approved tick boxes. */
function setup() {
  var sheet = getSheet_();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(COL.review, 420);
}

/** New review from the website. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    // Hidden "website" field: people never see it, so only bots fill it in. Pretend success and drop it.
    if (data.website) return json_({ ok: true });
    var review = clean_(data.review, LIMITS.reviewMax);
    var rating = Math.round(Number(data.rating));
    if (!(rating >= 1 && rating <= 5)) return json_({ ok: false, error: 'rating' });
    if (review.length < LIMITS.reviewMin) return json_({ ok: false, error: 'review' });
    if (data.consent !== true) return json_({ ok: false, error: 'consent' });

    lock.waitLock(10000);
    var sheet = getSheet_();
    // Ignore an identical review sent again (for example a double tap on Submit).
    var last = sheet.getLastRow();
    if (last > 1) {
      var recent = sheet.getRange(Math.max(2, last - 19), COL.review, Math.min(20, last - 1), 1).getValues();
      for (var i = 0; i < recent.length; i++) if (String(recent[i][0]) === review) return json_({ ok: true, duplicate: true });
    }
    sheet.appendRow([new Date(), clean_(data.name, LIMITS.name), clean_(data.city, LIMITS.city), clean_(data.product, LIMITS.product), rating, review, false]);
    sheet.getRange(sheet.getLastRow(), COL.approved).insertCheckboxes();
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Approved reviews for the website. Cached briefly so busy pages do not slow the Sheet down. */
function doGet() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('approved');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  var rows = last > 1 ? sheet.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
  var reviews = rows.filter(function (r) { return r[COL.approved - 1] === true && String(r[COL.review - 1]).trim(); }).map(function (r) {
    var d = r[COL.date - 1] instanceof Date ? r[COL.date - 1] : new Date(r[COL.date - 1]);
    return {
      name: String(r[COL.name - 1] || 'Raku customer').trim(),
      city: String(r[COL.city - 1] || '').trim(),
      product: String(r[COL.product - 1] || '').trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(r[COL.rating - 1]) || 5))),
      text: String(r[COL.review - 1]).trim(),
      date: isNaN(d) ? '' : Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM'),
      source: 'Website'
    };
  }).reverse(); // newest first
  var body = JSON.stringify({ reviews: reviews });
  cache.put('approved', body, CACHE_SECONDS);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/** Ticking or unticking "Approved" clears the cache, so the change shows on the site right away. */
function onEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === SHEET_NAME && e.range.getColumn() === COL.approved) {
    CacheService.getScriptCache().remove('approved');
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

// Plain text only, trimmed and shortened. A leading = + - @ is neutralised so a review can never run as a formula.
function clean_(value, max) {
  var s = String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
