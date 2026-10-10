/* =========================================
   MOKA KOST — Payment (Bayar) Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { showReceipt } from "./receiptModal.js";
import { compressImageToBase64, formatFileSize } from "../utils/imageCompressor.js";

let activePaymentResidentId = null;
let activePaymentProofBase64 = null;

export function openPaymentModal(residentId) {
    const r = store.getResidentById(residentId);
    if (!r) return;

    activePaymentResidentId = residentId;
    activePaymentProofBase64 = r.proofImage || null;

    const summaryBox = document.getElementById("paymentSummaryBox");
    if (summaryBox) {
        summaryBox.innerHTML = `
            <div class="pay-summary-resident">
                <div class="pay-summary-avatar">${r.avatar}</div>
                <div>
                    <div class="pay-summary-name">${r.name}</div>
                    <div class="pay-summary-room">${r.room}</div>
                </div>
            </div>
            <div class="pay-summary-divider"></div>
            <div class="pay-summary-row">
                <span>Periode Tagihan</span>
                <strong>${r.period}</strong>
            </div>
            <div class="pay-summary-row">
                <span>Jatuh Tempo</span>
                <span>${formatDate(r.dueDate)}</span>
            </div>
            <div class="pay-summary-total">
                <span>Total Pelunasan</span>
                <span class="pay-summary-amount">${formatCurrency(r.amount)}</span>
            </div>
        `;
    }

    // Set today's date in payment date input
    const dateInput = document.getElementById("paymentDate");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
    }

    const noteInput = document.getElementById("paymentNote");
    if (noteInput) noteInput.value = "";

    // Reset or display existing payment proof preview
    const dropzone = document.getElementById("paymentProofDropzone");
    const fileInput = document.getElementById("paymentProofFile");
    const previewContainer = document.getElementById("paymentProofPreviewContainer");
    const previewImg = document.getElementById("paymentProofPreviewImg");
    const sizeEl = document.getElementById("paymentProofFileSize");

    if (fileInput) fileInput.value = "";

    if (activePaymentProofBase64) {
        if (previewImg) previewImg.src = activePaymentProofBase64;
        if (sizeEl) sizeEl.textContent = "Bukti Sebelumnya";
        if (previewContainer) previewContainer.style.display = "block";
        if (dropzone) dropzone.style.display = "none";
    } else {
        if (previewImg) previewImg.src = "";
        if (sizeEl) sizeEl.textContent = "";
        if (previewContainer) previewContainer.style.display = "none";
        if (dropzone) dropzone.style.display = "flex";
    }

    const modal = document.getElementById("paymentModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

export function closePaymentModal() {
    const modal = document.getElementById("paymentModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
    activePaymentResidentId = null;
    activePaymentProofBase64 = null;
}

function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!activePaymentResidentId) return;

    const methodSelect = document.getElementById("paymentMethod");
    const dateInput = document.getElementById("paymentDate");
    const noteInput = document.getElementById("paymentNote");

    const method = methodSelect ? methodSelect.value : "Transfer BCA";
    const paidDate = dateInput ? dateInput.value : new Date().toISOString().split("T")[0];
    const note = noteInput ? noteInput.value.trim() : "";
    const proofImage = activePaymentProofBase64 || null;

    const residentId = activePaymentResidentId;
    const r = store.getResidentById(residentId);
    const residentName = r ? r.name : "Penghuni";

    // Update state to PAID
    store.updateResident(residentId, {
        status: "paid",
        paidDate: paidDate,
        method: method,
        paymentNote: note,
        proofImage: proofImage,
        proofUploadedAt: proofImage ? new Date().toISOString() : null
    });

    // Record into central payment history
    store.addPaymentHistory({
        receiptNo: residentId,
        residentId: residentId,
        name: r ? r.name : "Penghuni",
        room: r ? r.room : "",
        phone: r ? r.phone : "",
        amount: r ? r.amount : 0,
        period: r ? r.period : "Oktober 2026",
        dueDate: r ? r.dueDate : "",
        paidDate: paidDate,
        method: method,
        notes: note,
        avatar: r ? r.avatar : "MK",
        proofImage: proofImage,
        proofUploadedAt: proofImage ? new Date().toISOString() : null
    });

    closePaymentModal();

    showToast(
        "Pembayaran Berhasil Dikonfirmasi! 🎉",
        `Status sewa ${residentName} kini telah LUNAS${proofImage ? ' beserta bukti transfer' : ''}.`
    );

    // Auto prompt to show receipt modal
    setTimeout(() => {
        showReceipt(residentId);
    }, 400);
}

export function initPaymentModal() {
    const modal = document.getElementById("paymentModal");
    const closeBtn = document.getElementById("paymentModalClose");
    const cancelBtn = document.getElementById("btnCancelPayment");
    const form = document.getElementById("paymentForm");

    if (closeBtn) closeBtn.addEventListener("click", closePaymentModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closePaymentModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closePaymentModal();
        });
    }

    if (form) {
        form.addEventListener("submit", handlePaymentSubmit);
    }

    // Proof upload elements
    const dropzone = document.getElementById("paymentProofDropzone");
    const fileInput = document.getElementById("paymentProofFile");
    const browseBtn = document.getElementById("btnBrowsePaymentProof");
    const changeBtn = document.getElementById("btnChangePaymentProof");
    const removeBtn = document.getElementById("btnRemovePaymentProof");
    const previewContainer = document.getElementById("paymentProofPreviewContainer");
    const previewImg = document.getElementById("paymentProofPreviewImg");
    const sizeEl = document.getElementById("paymentProofFileSize");

    const processProofFile = async (file) => {
        if (!file) return;
        try {
            showToast("Memproses Gambar...", "Mengompresi berkas bukti transfer...");
            const base64 = await compressImageToBase64(file, 1200, 0.84);
            activePaymentProofBase64 = base64;

            if (previewImg) previewImg.src = base64;
            if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
            if (previewContainer) previewContainer.style.display = "block";
            if (dropzone) dropzone.style.display = "none";
            showToast("Bukti Terlampir! 📸", "Bukti pembayaran siap dikonfirmasi bersama pelunasan.");
        } catch (err) {
            showToast("Gagal Membaca Gambar", err.message || "Format berkas tidak didukung.", "error");
        }
    };

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());
        if (browseBtn) {
            browseBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });

        dropzone.addEventListener("dragleave", () => {
            dropzone.classList.remove("dragover");
        });

        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) processProofFile(file);
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) processProofFile(file);
        });
    }

    if (changeBtn && fileInput) {
        changeBtn.addEventListener("click", () => fileInput.click());
    }

    if (removeBtn) {
        removeBtn.addEventListener("click", () => {
            activePaymentProofBase64 = null;
            if (fileInput) fileInput.value = "";
            if (previewContainer) previewContainer.style.display = "none";
            if (dropzone) dropzone.style.display = "flex";
            if (previewImg) previewImg.src = "";
            if (sizeEl) sizeEl.textContent = "";
        });
    }
}
