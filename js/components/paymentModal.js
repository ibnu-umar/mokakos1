/* =========================================
   MOKA KOST — Payment (Bayar & DP) Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { showReceipt } from "./receiptModal.js";
import { compressImageToBase64, formatFileSize } from "../utils/imageCompressor.js";

let activePaymentResidentId = null;
let activePaymentProofBase64 = null;
let activePaymentType = "full"; // 'full' | 'dp'

function updatePaymentModalUI() {
    const r = store.getResidentById(activePaymentResidentId);
    if (!r) return;

    const summaryBox = document.getElementById("paymentSummaryBox");
    const dpAmountGroup = document.getElementById("dpAmountGroup");
    const dpAmountInput = document.getElementById("dpAmount");
    const dpRemainingInfo = document.getElementById("dpRemainingInfo");
    const dpRemainingValue = document.getElementById("dpRemainingValue");
    const confirmBtn = document.getElementById("btnConfirmPayment");
    const toggleBtns = document.querySelectorAll(".payment-type-btn");

    // Update active button state
    toggleBtns.forEach(btn => {
        const type = btn.getAttribute("data-type");
        if (type === activePaymentType) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const isAlreadyDp = r.status === "dp";
    const existingDp = Number(r.dpAmount) || 0;
    const remainingToPay = Math.max(0, r.amount - existingDp);

    if (summaryBox) {
        if (isAlreadyDp) {
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
                    <span>Total Biaya Sewa</span>
                    <span>${formatCurrency(r.amount)}</span>
                </div>
                <div class="pay-summary-row" style="color: #3b82f6;">
                    <span>DP Sebelumnya</span>
                    <strong>${formatCurrency(existingDp)}</strong>
                </div>
                <div class="pay-summary-divider"></div>
                <div class="pay-summary-total">
                    <span>Sisa Pelunasan</span>
                    <span class="pay-summary-amount" style="color: #f59e0b;">${formatCurrency(remainingToPay)}</span>
                </div>
            `;
        } else {
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
                    <span>${activePaymentType === 'dp' ? 'Total Biaya Sewa' : 'Total Pelunasan'}</span>
                    <span class="pay-summary-amount">${formatCurrency(r.amount)}</span>
                </div>
            `;
        }
    }

    if (activePaymentType === "dp") {
        if (dpAmountGroup) dpAmountGroup.style.display = "block";
        if (confirmBtn) {
            confirmBtn.classList.add("btn-pay-confirm--dp");
        }

        const dpVal = Number(dpAmountInput ? dpAmountInput.value : 0);
        const maxAmount = isAlreadyDp ? remainingToPay : r.amount;

        if (dpVal > 0) {
            const sisa = Math.max(0, maxAmount - dpVal);
            if (dpRemainingInfo) dpRemainingInfo.style.display = "flex";
            if (dpRemainingValue) dpRemainingValue.textContent = formatCurrency(sisa);
            if (confirmBtn) {
                confirmBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                    </svg>
                    Konfirmasi Bayar DP (${formatCurrency(dpVal)})
                `;
            }
        } else {
            if (dpRemainingInfo) dpRemainingInfo.style.display = "none";
            if (confirmBtn) {
                confirmBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                    </svg>
                    Konfirmasi Bayar DP
                `;
            }
        }
    } else {
        if (dpAmountGroup) dpAmountGroup.style.display = "none";
        if (confirmBtn) {
            confirmBtn.classList.remove("btn-pay-confirm--dp");
            const payAmount = isAlreadyDp ? remainingToPay : r.amount;
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                ${isAlreadyDp ? `Konfirmasi Pelunasan Sisa (${formatCurrency(payAmount)})` : `Konfirmasi Lunas (${formatCurrency(payAmount)})`}
            `;
        }
    }
}

export function openPaymentModal(residentId) {
    const r = store.getResidentById(residentId);
    if (!r) return;

    activePaymentResidentId = residentId;
    activePaymentProofBase64 = r.proofImage || null;

    // If resident is already in DP state, default to Pelunasan (full settlement of remaining)
    // If unpaid, default to full payment
    activePaymentType = "full";

    const dpAmountInput = document.getElementById("dpAmount");
    if (dpAmountInput) {
        dpAmountInput.value = "";
        dpAmountInput.placeholder = `Contoh: ${Math.round(r.amount / 2)}`;
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

    updatePaymentModalUI();

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
    activePaymentType = "full";
}

function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!activePaymentResidentId) return;

    const residentId = activePaymentResidentId;
    const r = store.getResidentById(residentId);
    if (!r) return;

    const methodSelect = document.getElementById("paymentMethod");
    const dateInput = document.getElementById("paymentDate");
    const noteInput = document.getElementById("paymentNote");
    const dpAmountInput = document.getElementById("dpAmount");

    const method = methodSelect ? methodSelect.value : "Transfer BCA";
    const paidDate = dateInput ? dateInput.value : new Date().toISOString().split("T")[0];
    const note = noteInput ? noteInput.value.trim() : "";
    const proofImage = activePaymentProofBase64 || null;
    const residentName = r.name || "Penghuni";

    if (activePaymentType === "dp") {
        const dpVal = Number(dpAmountInput ? dpAmountInput.value : 0);

        if (!dpVal || dpVal <= 0) {
            showToast("Jumlah DP Tidak Valid", "Silakan masukkan nominal DP yang ingin dibayarkan.", "warning");
            if (dpAmountInput) dpAmountInput.focus();
            return;
        }

        const isAlreadyDp = r.status === "dp";
        const currentDp = Number(r.dpAmount) || 0;
        const remainingBeforeThis = isAlreadyDp ? (r.amount - currentDp) : r.amount;

        if (dpVal >= remainingBeforeThis) {
            showToast(
                "Nominal Mencukupi Pelunasan",
                "Nominal yang dimasukkan sama atau melebihi sisa tagihan. Silakan gunakan opsi 'Lunas'.",
                "warning"
            );
            return;
        }

        const totalDpNow = isAlreadyDp ? (currentDp + dpVal) : dpVal;
        const finalRemaining = Math.max(0, r.amount - totalDpNow);

        // Update resident state
        store.updateResident(residentId, {
            status: "dp",
            dpAmount: totalDpNow,
            dpRemaining: finalRemaining,
            dpPaidDate: paidDate,
            dpMethod: method,
            paidDate: paidDate,
            method: method,
            paymentNote: note,
            proofImage: proofImage,
            proofUploadedAt: proofImage ? new Date().toISOString() : null
        });

        // Add transaction to central payment history
        const trxId = `TRX-${Date.now().toString(36).toUpperCase()}`;
        store.addPaymentHistory({
            id: trxId,
            receiptNo: `${residentId}-DP`,
            residentId: residentId,
            name: r.name,
            room: r.room,
            phone: r.phone,
            amount: dpVal,
            totalAmount: r.amount,
            dpAmount: totalDpNow,
            remainingAmount: finalRemaining,
            period: r.period,
            dueDate: r.dueDate,
            paidDate: paidDate,
            method: method,
            notes: note || `Pembayaran DP (Uang Muka) sewa kamar ${r.period}`,
            status: "dp",
            type: "dp",
            avatar: r.avatar,
            proofImage: proofImage,
            proofUploadedAt: proofImage ? new Date().toISOString() : null
        });

        closePaymentModal();

        showToast(
            "Pembayaran DP Dikonfirmasi! 💵",
            `Uang muka sebesar ${formatCurrency(dpVal)} untuk ${residentName} berhasil dicatat. Sisa tagihan: ${formatCurrency(finalRemaining)}.`
        );

        // Show receipt for this DP
        setTimeout(() => {
            showReceipt(residentId);
        }, 400);

    } else {
        // FULL PAYMENT / PELUNASAN
        const isAlreadyDp = r.status === "dp";
        const previousDp = Number(r.dpAmount) || 0;
        const settlementAmount = isAlreadyDp ? Math.max(0, r.amount - previousDp) : r.amount;

        store.updateResident(residentId, {
            status: "paid",
            paidDate: paidDate,
            method: method,
            paymentNote: note,
            proofImage: proofImage || r.proofImage,
            proofUploadedAt: proofImage ? new Date().toISOString() : r.proofUploadedAt
        });

        const trxId = `TRX-${Date.now().toString(36).toUpperCase()}`;
        store.addPaymentHistory({
            id: trxId,
            receiptNo: isAlreadyDp ? `${residentId}-LUNAS` : residentId,
            residentId: residentId,
            name: r.name,
            room: r.room,
            phone: r.phone,
            amount: settlementAmount,
            totalAmount: r.amount,
            dpAmount: previousDp,
            period: r.period,
            dueDate: r.dueDate,
            paidDate: paidDate,
            method: method,
            notes: note || (isAlreadyDp ? `Pelunasan sisa tagihan sewa ${r.period} (sebelumnya DP: ${formatCurrency(previousDp)})` : `Lunas sewa kamar ${r.period}`),
            status: "paid",
            type: isAlreadyDp ? "pelunasan" : "full",
            avatar: r.avatar,
            proofImage: proofImage,
            proofUploadedAt: proofImage ? new Date().toISOString() : null
        });

        closePaymentModal();

        showToast(
            "Pembayaran Lunas Dikonfirmasi! 🎉",
            isAlreadyDp 
                ? `Pelunasan sisa sewa ${residentName} sebesar ${formatCurrency(settlementAmount)} berhasil dikonfirmasi.` 
                : `Status sewa ${residentName} kini telah LUNAS.`
        );

        setTimeout(() => {
            showReceipt(residentId);
        }, 400);
    }
}

export function initPaymentModal() {
    const modal = document.getElementById("paymentModal");
    const closeBtn = document.getElementById("paymentModalClose");
    const cancelBtn = document.getElementById("btnCancelPayment");
    const form = document.getElementById("paymentForm");
    const toggleGroup = document.getElementById("paymentTypeToggle");
    const dpAmountInput = document.getElementById("dpAmount");

    if (closeBtn) closeBtn.addEventListener("click", closePaymentModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closePaymentModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closePaymentModal();
        });
    }

    if (toggleGroup) {
        const buttons = toggleGroup.querySelectorAll(".payment-type-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const type = btn.getAttribute("data-type");
                activePaymentType = type;
                updatePaymentModalUI();
            });
        });
    }

    if (dpAmountInput) {
        dpAmountInput.addEventListener("input", () => {
            updatePaymentModalUI();
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
            showToast("Bukti Terlampir! 📸", "Bukti pembayaran siap dikonfirmasi bersama transaksi.");
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
