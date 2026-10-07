/* =========================================
   MOKA KOST — Utility Formatters
   ========================================= */

/**
 * Format number to Indonesian Rupiah currency format (e.g. Rp 1.500.000)
 * @param {number} num 
 * @returns {string}
 */
export function formatCurrency(num) {
    if (typeof num !== "number") num = Number(num) || 0;
    return "Rp " + num.toLocaleString("id-ID");
}

/**
 * Format ISO date string to full Indonesian date (e.g. 2 Oktober 2026)
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format ISO date string to short date (e.g. 02/10/2026)
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatDateShort(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Normalize Indonesian phone numbers to WhatsApp international format (e.g. 0812... -> 62812...)
 * @param {string} phone 
 * @returns {string}
 */
export function formatWhatsAppPhone(phone) {
    if (!phone) return "";
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
    }
    return clean;
}

/**
 * Get formatted current date in Indonesian
 * @returns {string} (e.g. Minggu, 4 Oktober 2026)
 */
export function getCurrentDateString() {
    const now = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
