/* =========================================
   MOKA KOST — Payment (Bayar) Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { showReceipt } from "./receiptModal.js";

let activePaymentResidentId = null;

export function openPaymentModal(residentId) {
    const r = store.getResidentById(residentId);
    if (!r) return;

    activePaymentResidentId = residentId;

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

    const residentId = activePaymentResidentId;
    const r = store.getResidentById(residentId);
    const residentName = r ? r.name : "Penghuni";

    // Update state to PAID
    store.updateResident(residentId, {
        status: "paid",
        paidDate: paidDate,
        method: method,
        paymentNote: note
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
        avatar: r ? r.avatar : "MK"
    });

    closePaymentModal();

    showToast(
        "Pembayaran Berhasil Dikonfirmasi! 🎉",
        `Status sewa ${residentName} kini telah LUNAS.`
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
}
