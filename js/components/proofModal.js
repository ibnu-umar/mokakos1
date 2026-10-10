/* =========================================
   MOKA KOST — Proof of Payment Modal Component (proofModal.js)
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { compressImageToBase64, formatFileSize } from "../utils/imageCompressor.js";

let currentProofTargetId = null;
let currentQuickProofTargetId = null;
let currentQuickProofBase64 = null;

/**
 * Resolve resident or transaction object from ID or object
 * @param {string|Object} target 
 * @returns {Object|null}
 */
function resolvePaymentData(target) {
    if (!target) return null;
    if (typeof target === "object") return target;

    // Check residents first
    const r = store.getResidentById(target);
    if (r) return r;

    // Check payment history
    const h = store.getPaymentHistoryById(target);
    if (h) return h;

    // Search by receiptNo or residentId in history
    const byResId = store.paymentHistory.find(item => item.residentId === target || item.receiptNo === target);
    if (byResId) return byResId;

    return null;
}

/**
 * Open Bukti Pembayaran Viewer Modal (Lightbox)
 * @param {string|Object} target - Resident ID, Transaction ID, or data object
 */
export function openProofViewerModal(target) {
    const data = resolvePaymentData(target);
    if (!data) {
        showToast("Data Tidak Ditemukan", "Informasi pembayaran tidak ditemukan.", "error");
        return;
    }

    const proofImg = data.proofImage;
    if (!proofImg) {
        showToast("Bukti Belum Tersedia", "Belum ada foto bukti transfer yang diunggah untuk pembayaran ini.", "warning");
        return;
    }

    currentProofTargetId = data.id || data.residentId || target;

    const modal = document.getElementById("proofViewerModal");
    const titleEl = document.getElementById("proofViewerTitle");
    const subEl = document.getElementById("proofViewerSubtitle");
    const amountEl = document.getElementById("proofViewerAmount");
    const dateEl = document.getElementById("proofViewerDate");
    const badgesEl = document.getElementById("proofViewerDetailsBadge");
    const imgEl = document.getElementById("proofViewerImg");

    if (titleEl) titleEl.textContent = `Bukti Transfer — ${data.name || 'Penghuni'}`;
    if (subEl) subEl.textContent = `${data.room || 'Kamar Kost'} • Periode ${data.period || 'Bulan Ini'}`;
    if (amountEl) amountEl.textContent = formatCurrency(data.amount || 0);
    if (dateEl) dateEl.textContent = `Dibayar: ${formatDate(data.paidDate || data.dueDate)}`;

    if (badgesEl) {
        const method = data.method || "Transfer Bank";
        badgesEl.innerHTML = `
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center;">
                <span class="proof-method-pill">💳 ${method}</span>
                <span class="proof-verified-pill">✅ Bukti Terverifikasi</span>
                ${data.notes ? `<span class="proof-notes-pill" title="${data.notes}">📝 ${data.notes}</span>` : ''}
            </div>
        `;
    }

    if (imgEl) {
        imgEl.src = proofImg;
        imgEl.alt = `Bukti Pembayaran ${data.name || ''}`;
    }

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

/**
 * Close Bukti Pembayaran Viewer Modal
 */
export function closeProofViewerModal() {
    const modal = document.getElementById("proofViewerModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
    currentProofTargetId = null;
}

/**
 * Open Quick Upload Modal for adding/updating proof of an existing record
 * @param {string|Object} target 
 */
export function openProofUploadModal(target) {
    const data = resolvePaymentData(target);
    if (!data) return;

    currentQuickProofTargetId = data.id || data.residentId || target;
    currentQuickProofBase64 = data.proofImage || null;

    const modal = document.getElementById("proofUploadModal");
    const nameEl = document.getElementById("quickProofResidentName");
    const dropzone = document.getElementById("quickProofDropzone");
    const previewContainer = document.getElementById("quickProofPreviewContainer");
    const previewImg = document.getElementById("quickProofPreviewImg");
    const fileInput = document.getElementById("quickProofFileInput");

    if (nameEl) {
        nameEl.textContent = `${data.name} (${data.room}) • ${data.period || ''}`;
    }

    if (fileInput) fileInput.value = "";

    if (currentQuickProofBase64) {
        if (previewContainer) previewContainer.style.display = "block";
        if (dropzone) dropzone.style.display = "none";
        if (previewImg) previewImg.src = currentQuickProofBase64;
    } else {
        if (previewContainer) previewContainer.style.display = "none";
        if (dropzone) dropzone.style.display = "flex";
        if (previewImg) previewImg.src = "";
    }

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

/**
 * Close Quick Upload Modal
 */
export function closeProofUploadModal() {
    const modal = document.getElementById("proofUploadModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
    currentQuickProofTargetId = null;
    currentQuickProofBase64 = null;
}

/**
 * Download currently viewed proof image
 */
function downloadProofImage() {
    const imgEl = document.getElementById("proofViewerImg");
    if (!imgEl || !imgEl.src) return;

    const data = resolvePaymentData(currentProofTargetId);
    const safeName = data && data.name ? data.name.replace(/\s+/g, "_") : "Pembayaran";
    const safePeriod = data && data.period ? data.period.replace(/\s+/g, "_") : "Struk";
    const filename = `Bukti_Transfer_${safeName}_${safePeriod}.jpg`;

    const a = document.createElement("a");
    a.href = imgEl.src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast("Mengunduh Bukti... 📥", `Berkas ${filename} berhasil diunduh.`);
}

/**
 * Delete currently viewed proof image
 */
function deleteProofImage() {
    if (!currentProofTargetId) return;

    if (!confirm("Apakah Anda yakin ingin menghapus foto bukti pembayaran ini?")) {
        return;
    }

    store.removePaymentProof(currentProofTargetId);
    closeProofViewerModal();
    showToast("Bukti Berhasil Dihapus", "Foto bukti transfer telah dihapus dari data pembayaran.", "info");
}

/**
 * Initialize Proof Modal event listeners
 */
export function initProofModal() {
    // Lightbox Viewer Modal
    const viewerModal = document.getElementById("proofViewerModal");
    const closeViewerBtn = document.getElementById("proofViewerModalClose");
    const btnViewerClose = document.getElementById("btnViewerCloseProof");
    const btnDownload = document.getElementById("btnViewerDownloadProof");
    const btnDelete = document.getElementById("btnViewerDeleteProof");

    if (closeViewerBtn) closeViewerBtn.addEventListener("click", closeProofViewerModal);
    if (btnViewerClose) btnViewerClose.addEventListener("click", closeProofViewerModal);
    if (viewerModal) {
        viewerModal.addEventListener("click", (e) => {
            if (e.target === viewerModal) closeProofViewerModal();
        });
    }

    if (btnDownload) btnDownload.addEventListener("click", downloadProofImage);
    if (btnDelete) btnDelete.addEventListener("click", deleteProofImage);

    // Quick Upload Modal
    const uploadModal = document.getElementById("proofUploadModal");
    const closeUploadBtn = document.getElementById("proofUploadModalClose");
    const btnCancelUpload = document.getElementById("btnCancelQuickProof");
    const uploadForm = document.getElementById("quickProofUploadForm");
    const quickDropzone = document.getElementById("quickProofDropzone");
    const quickFileInput = document.getElementById("quickProofFileInput");
    const quickBrowseBtn = document.getElementById("btnBrowseQuickProof");
    const quickChangeBtn = document.getElementById("btnChangeQuickProof");
    const quickRemoveBtn = document.getElementById("btnRemoveQuickProof");
    const quickPreviewContainer = document.getElementById("quickProofPreviewContainer");
    const quickPreviewImg = document.getElementById("quickProofPreviewImg");

    if (closeUploadBtn) closeUploadBtn.addEventListener("click", closeProofUploadModal);
    if (btnCancelUpload) btnCancelUpload.addEventListener("click", closeProofUploadModal);
    if (uploadModal) {
        uploadModal.addEventListener("click", (e) => {
            if (e.target === uploadModal) closeProofUploadModal();
        });
    }

    const handleQuickFile = async (file) => {
        if (!file) return;
        try {
            showToast("Memproses Gambar...", "Mengompresi bukti transfer...");
            const base64 = await compressImageToBase64(file, 1200, 0.84);
            currentQuickProofBase64 = base64;

            if (quickPreviewImg) quickPreviewImg.src = base64;
            if (quickPreviewContainer) quickPreviewContainer.style.display = "block";
            if (quickDropzone) quickDropzone.style.display = "none";
            showToast("Foto Siap! 📸", "Klik 'Simpan Bukti' untuk menyelesaikan.");
        } catch (err) {
            showToast("Gagal Memuat Gambar", err.message || "Pastikan format berkas didukung.", "error");
        }
    };

    if (quickDropzone && quickFileInput) {
        quickDropzone.addEventListener("click", () => quickFileInput.click());
        if (quickBrowseBtn) {
            quickBrowseBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                quickFileInput.click();
            });
        }

        quickDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            quickDropzone.classList.add("dragover");
        });
        quickDropzone.addEventListener("dragleave", () => {
            quickDropzone.classList.remove("dragover");
        });
        quickDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            quickDropzone.classList.remove("dragover");
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) handleQuickFile(file);
        });

        quickFileInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) handleQuickFile(file);
        });
    }

    if (quickChangeBtn && quickFileInput) {
        quickChangeBtn.addEventListener("click", () => quickFileInput.click());
    }

    if (quickRemoveBtn) {
        quickRemoveBtn.addEventListener("click", () => {
            currentQuickProofBase64 = null;
            if (quickFileInput) quickFileInput.value = "";
            if (quickPreviewContainer) quickPreviewContainer.style.display = "none";
            if (quickDropzone) quickDropzone.style.display = "flex";
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!currentQuickProofTargetId) return;

            if (!currentQuickProofBase64) {
                showToast("Pilih Berkas", "Silakan pilih foto bukti transfer terlebih dahulu.", "warning");
                return;
            }

            store.updatePaymentProof(currentQuickProofTargetId, currentQuickProofBase64);
            closeProofUploadModal();
            showToast("Bukti Pembayaran Tersimpan! 🎉", "Foto bukti pembayaran berhasil diperbarui.");
        });
    }
}
