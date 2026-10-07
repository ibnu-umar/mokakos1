/* =========================================
   MOKA KOST — WhatsApp Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { formatWhatsAppPhone } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { downloadReceiptImage } from "../utils/pdfGenerator.js";
import { 
    getWhatsAppReminderText, 
    getWhatsAppReceiptText, 
    buildWhatsAppUrl,
    sendReceiptPdfToWhatsApp
} from "../services/whatsappService.js";

let activeWaPhone = "";
let activeReceiptResidentForWa = null;

export function openWhatsAppModal({ title, recipientName, phone, message, resident = null }) {
    activeWaPhone = formatWhatsAppPhone(phone);
    activeReceiptResidentForWa = resident;

    const titleEl = document.getElementById("waModalTitle");
    const recipientEl = document.getElementById("waModalRecipient");
    const textareaEl = document.getElementById("waMessageText");
    const attBox = document.getElementById("waAttachmentBox");
    const noticeText = document.getElementById("waNoticeText");
    const confirmBtn = document.getElementById("btnConfirmSendWa");

    if (titleEl) titleEl.textContent = title;
    if (recipientEl) recipientEl.textContent = `Ke: ${recipientName} (${phone})`;
    if (textareaEl) textareaEl.value = message;

    if (resident && resident.status === "paid") {
        if (attBox) {
            attBox.style.display = "flex";
            const filename = `Bukti_Pembayaran_${resident.name.replace(/\s+/g, '_')}_${resident.period.replace(/\s+/g, '_')}.png`;
            const filenameEl = document.getElementById("waAttachmentFilename");
            if (filenameEl) filenameEl.textContent = filename;
        }
        if (noticeText) {
            noticeText.innerHTML = `🖼️ <strong>Lampiran Gambar:</strong> Berkas gambar struk resmi (PNG) akan otomatis diunduh saat Anda membuka WhatsApp untuk langsung dilampirkan ke penghuni.`;
        }
        if (confirmBtn) {
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                Buka WA & Unduh Gambar
            `;
        }
    } else {
        if (attBox) attBox.style.display = "none";
        if (noticeText) {
            noticeText.innerHTML = `💬 <strong>Pengingat Tagihan:</strong> Pesan pengingat pembayaran sewa kamar akan dikirimkan langsung ke nomor WhatsApp penghuni.`;
        }
        if (confirmBtn) {
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                Buka WhatsApp →
            `;
        }
    }

    const modal = document.getElementById("waModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

export function closeWhatsAppModal() {
    const modal = document.getElementById("waModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
    activeReceiptResidentForWa = null;
}

export function openWhatsAppReminder(residentId) {
    const r = store.getResidentById(residentId);
    if (!r) return;

    const message = getWhatsAppReminderText(r);
    openWhatsAppModal({
        title: "Kirim Pengingat Tagihan",
        recipientName: r.name,
        phone: r.phone,
        message: message,
        resident: null
    });
}

export function openWhatsAppReceipt(residentId) {
    const r = store.getResidentById(residentId);
    if (!r) return;
    sendReceiptPdfToWhatsApp(r);
}

export function initWhatsAppModal() {
    const modal = document.getElementById("waModal");
    const closeBtn = document.getElementById("waModalClose");
    const copyBtn = document.getElementById("btnCopyWaText");
    const sendBtn = document.getElementById("btnConfirmSendWa");
    const btnDownloadAtt = document.getElementById("btnDownloadAttachedPdf");

    if (closeBtn) closeBtn.addEventListener("click", closeWhatsAppModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeWhatsAppModal();
        });
    }

    if (btnDownloadAtt) {
        btnDownloadAtt.addEventListener("click", () => {
            if (activeReceiptResidentForWa) {
                downloadReceiptImage(activeReceiptResidentForWa);
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            const textarea = document.getElementById("waMessageText");
            const text = textarea ? textarea.value : "";
            navigator.clipboard.writeText(text).then(() => {
                showToast("Teks Berhasil Disalin!", "Teks pesan WhatsApp telah disalin ke clipboard.");
            }).catch(() => {
                showToast("Gagal Menyalin", "Silakan salin teks secara manual.", "warning");
            });
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener("click", async () => {
            const textarea = document.getElementById("waMessageText");
            const text = textarea ? textarea.value : "";
            const url = buildWhatsAppUrl(activeWaPhone, text);

            if (activeReceiptResidentForWa) {
                try {
                    await downloadReceiptImage(activeReceiptResidentForWa);
                } catch (err) {
                    console.error("Error during image download:", err);
                }
                setTimeout(() => {
                    window.open(url, "_blank");
                    closeWhatsAppModal();
                    showToast("Membuka WhatsApp...", "Gambar bukti pembayaran telah diunduh. Silakan lampirkan di chat WhatsApp.");
                }, 300);
            } else {
                window.open(url, "_blank");
                closeWhatsAppModal();
                showToast("Membuka WhatsApp...", "Jendela chat WhatsApp sedang dibuka.");
            }
        });
    }
}
