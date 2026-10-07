/* =========================================
   MOKA KOST — WhatsApp Messaging Service
   ========================================= */

import { formatCurrency, formatDate, formatWhatsAppPhone } from "../utils/formatters.js";
import { downloadReceiptImage, generateInvoiceImageFile } from "../utils/pdfGenerator.js";
import { showToast } from "../utils/toast.js";
import { KOST_INFO, rekeningWA } from "../data/config.js";

/**
 * Direct 1-Click Send Receipt Image to WhatsApp
 * Automatically downloads the exact official PNG receipt image and launches the WhatsApp chat with formatted receipt message.
 * @param {Object} r - Resident object
 */
export async function sendReceiptPdfToWhatsApp(r) {
    if (!r) return;

    const phone = formatWhatsAppPhone(r.phone);
    const filename = `Bukti_Pembayaran_${r.name.replace(/\s+/g, '_')}_${r.period.replace(/\s+/g, '_')}.png`;
    const message = getWhatsAppReceiptText(r);

    // 1. Generate & download the exact image receipt file
    try {
        await downloadReceiptImage(r);
    } catch (err) {
        console.error("Image download error in WhatsApp flow:", err);
    }

    // 2. Open WhatsApp direct chat with formatted receipt text
    const waUrl = buildWhatsAppUrl(phone, message);

    setTimeout(() => {
        window.open(waUrl, "_blank");
        showToast(
            "Membuka WhatsApp...",
            `Gambar bukti pembayaran (${filename}) telah diunduh. Silakan kirimkan di chat WhatsApp.`
        );
    }, 400);
}

// Alias
export const sendReceiptImageToWhatsApp = sendReceiptPdfToWhatsApp;

/**
 * Generate formatted WhatsApp reminder message for unpaid residents
 * @param {Object} r - Resident object
 * @returns {string}
 */
export function getWhatsAppReminderText(r) {
    return `🏠 *PENGINGAT TAGIHAN MOKA KOST*
----------------------------------------
Halo Sdr/i *${r.name}*,

Mengingatkan untuk pembayaran sewa kamar Moka Kost:

👤 *Nama Penghuni:* ${r.name}
🚪 *Kamar:* ${r.room}
📞 *No. Telepon:* ${r.phone}
📅 *Periode:* ${r.period}
⏰ *Jatuh Tempo:* ${formatDate(r.dueDate)}
💵 *Total Tagihan:* *${formatCurrency(r.amount)}*
📊 *Status:* Menunggu Pembayaran

💳 *Pembayaran via Transfer Bank:*
${rekeningWA()}

Mohon konfirmasi dan kirimkan bukti transfer setelah melakukan pembayaran. Terima kasih banyak atas kerjasamanya! 🙏✨`;
}

/**
 * Generate formatted WhatsApp receipt message for paid residents
 * @param {Object} r - Resident object
 * @returns {string}
 */
export function getWhatsAppReceiptText(r) {
    return `✅ *BUKTI PEMBAYARAN MOKA KOST*
----------------------------------------
No. Kuitansi: *#${r.id}*

Terima kasih Sdr/i *${r.name}*,
Pembayaran sewa kost Anda telah kami terima dengan rincian berikut:

👤 *Nama Penghuni:* ${r.name}
🚪 *Kamar:* ${r.room}
📞 *No. Telepon:* ${r.phone}
📅 *Periode:* ${r.period}
⏰ *Tanggal Bayar:* ${formatDate(r.paidDate)}
💳 *Metode Pembayaran:* ${r.method || 'Transfer BCA'}
💵 *Total Pembayaran:* *${formatCurrency(r.amount)}*
📊 *Status:* *LUNAS* ✅
----------------------------------------
Berikut terlampir gambar struk resmi Bukti Pembayaran.
Alamat: ${KOST_INFO.alamat}
Terima kasih dan semoga nyaman tinggal di ${KOST_INFO.nama}! 🙏✨`;
}

/**
 * Generate formatted WhatsApp invoice message for newly created invoices
 * @param {Object} inv - Invoice data object
 * @returns {string}
 */
export function getWhatsAppInvoiceText(inv) {
    let extraText = inv.extra > 0 ? `• ${inv.extraNote || 'Biaya Tambahan'}: ${formatCurrency(inv.extra)}\n` : '';
    let notesText = inv.notes ? `\n📝 *Catatan:* ${inv.notes}\n` : '';

    return `🏠 *SURAT TAGIHAN SEWA MOKA KOST*
----------------------------------------
No. Tagihan: *#${inv.invoiceId}*

Kepada Yth. Sdr/i *${inv.name}*,
Berikut rincian tagihan sewa kamar Anda:

👤 *Nama Penghuni:* ${inv.name}
🚪 *Kamar:* ${inv.room}
📞 *No. Telepon:* ${inv.phone}
📅 *Periode:* ${inv.period}
⏰ *Jatuh Tempo:* ${formatDate(inv.dueDate)}

💰 *Rincian Biaya:*
• Biaya Sewa Pokok: ${formatCurrency(inv.amount)}
${extraText}----------------------------------------
*TOTAL TAGIHAN: ${formatCurrency(inv.total)}*

💳 *Rekening Pembayaran:*
${rekeningWA()}
${notesText}
Mohon melakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih! 🙏✨`;
}

/**
 * Build direct WhatsApp URL
 * @param {string} phone 
 * @param {string} text 
 * @returns {string}
 */
export function buildWhatsAppUrl(phone, text = "") {
    const cleanPhone = formatWhatsAppPhone(phone);
    if (!text) return `https://wa.me/${cleanPhone}`;
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Share invoice as an authentic image file via native Web Share API (common share, not direct to phone number)
 * Allows user to pick WhatsApp from native share sheet, and then choose contact manually.
 * Falls back to auto-downloading file + opening WhatsApp contact selector if Web Share is unavailable.
 * @param {Object} inv - Invoice data object
 */
export async function shareInvoiceFileCommon(inv) {
    if (!inv) return;

    showToast("Menyiapkan Berkas Tagihan...", "Sedang membuat berkas gambar tagihan untuk dibagikan...");

    let fileObj;
    try {
        fileObj = await generateInvoiceImageFile(inv);
    } catch (err) {
        console.error("Gagal membuat gambar tagihan:", err);
        showToast("Gagal Menyiapkan Berkas", "Terjadi kendala saat memproses berkas gambar tagihan.", "danger");
        return;
    }

    const { file, dataUrl, filename } = fileObj;
    const shareTitle = `Surat Tagihan — ${inv.name}`;
    const shareText = `Surat Tagihan Pembayaran Kost (${inv.period}) — Moka Kost`;

    // 1. Try native Web Share API with files (Android, iOS, supported desktop browsers)
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: shareTitle,
                text: shareText
            });
            showToast("Tagihan Dibagikan!", "Menu berbagi berhasil dibuka.");
            return;
        } catch (err) {
            // User dismissed or cancelled the share sheet
            if (err.name === "AbortError") {
                return;
            }
            console.warn("navigator.share gagal, menggunakan fallback:", err);
        }
    }

    // 2. Fallback: Download the invoice image file directly
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // 3. Open WhatsApp common sharing (WITHOUT targeting an exact phone number)
    // api.whatsapp.com/send?text=... lets user manually pick any chat or contact in WhatsApp
    const caption = `Surat Tagihan Sewa Moka Kost (${inv.period}) untuk ${inv.name}. Total: ${formatCurrency(inv.total)}`;
    const commonWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;

    setTimeout(() => {
        window.open(commonWaUrl, "_blank");
        showToast(
            "Membuka WhatsApp...",
            `Berkas (${filename}) telah tersimpan. Silakan pilih kontak di WhatsApp dan lampirkan berkas gambar tagihannya.`
        );
    }, 400);
}
