/* =========================================
   MOKA KOST — Invoice (Buat Tagihan) Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { shareInvoiceFileCommon } from "../services/whatsappService.js";

let currentInvoiceData = null;

function populateResidentSelect() {
    const select = document.getElementById("invoiceResident");
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>— Pilih penghuni —</option>';
    store.getResidents("all").forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `${r.name}  •  ${r.room}`;
        select.appendChild(opt);
    });
}

function resetInvoiceForm() {
    const form = document.getElementById("invoiceForm");
    if (form) form.reset();
    const totalPreview = document.getElementById("formTotalValue");
    if (totalPreview) totalPreview.textContent = "Rp 0";
    currentInvoiceData = null;
}

function goToInvoiceStep(step) {
    const step1El = document.getElementById("invoiceStep1");
    const step2El = document.getElementById("invoiceStep2");
    const steps = document.querySelectorAll(".invoice-step");
    const connector = document.querySelector(".step-connector");

    if (step === 1) {
        if (step1El) step1El.style.display = "";
        if (step2El) step2El.style.display = "none";
        if (steps[0]) {
            steps[0].classList.add("active");
            steps[0].classList.remove("completed");
        }
        if (steps[1]) steps[1].classList.remove("active");
        if (connector) connector.classList.remove("filled");
    } else {
        if (step1El) step1El.style.display = "none";
        if (step2El) step2El.style.display = "";
        if (steps[0]) {
            steps[0].classList.remove("active");
            steps[0].classList.add("completed");
        }
        if (steps[1]) steps[1].classList.add("active");
        if (connector) connector.classList.add("filled");
    }
}

function updateInvoiceTotal() {
    const amountEl = document.getElementById("invoiceAmount");
    const extraEl = document.getElementById("invoiceExtra");
    const amount = parseInt(amountEl ? amountEl.value : 0) || 0;
    const extra = parseInt(extraEl ? extraEl.value : 0) || 0;
    const total = amount + extra;
    const totalEl = document.getElementById("formTotalValue");
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function onResidentSelect() {
    const select = document.getElementById("invoiceResident");
    if (!select) return;
    const r = store.getResidentById(select.value);
    if (r) {
        const amountEl = document.getElementById("invoiceAmount");
        const periodEl = document.getElementById("invoicePeriod");
        const dueDateEl = document.getElementById("invoiceDueDate");

        if (amountEl) amountEl.value = r.amount;

        if (periodEl && r.period) {
            const hasOption = Array.from(periodEl.options).some(o => o.value === r.period);
            if (hasOption) {
                periodEl.value = r.period;
            } else {
                const opt = document.createElement("option");
                opt.value = r.period;
                opt.textContent = r.period;
                periodEl.appendChild(opt);
                periodEl.value = r.period;
            }
        }

        if (dueDateEl && r.dueDate) {
            dueDateEl.value = r.dueDate;
        }

        updateInvoiceTotal();
    }
}

function generateInvoicePreview() {
    const select = document.getElementById("invoiceResident");
    const residentId = select ? select.value : "";
    const r = store.getResidentById(residentId);
    if (!r) return;

    const periodEl = document.getElementById("invoicePeriod");
    const dueDateEl = document.getElementById("invoiceDueDate");
    const amountEl = document.getElementById("invoiceAmount");
    const extraEl = document.getElementById("invoiceExtra");
    const extraNoteEl = document.getElementById("invoiceExtraNote");
    const notesEl = document.getElementById("invoiceNotes");

    const period = periodEl ? periodEl.value : "";
    const dueDate = dueDateEl ? dueDateEl.value : "";
    const amount = parseInt(amountEl ? amountEl.value : 0) || 0;
    const extra = parseInt(extraEl ? extraEl.value : 0) || 0;
    const extraNote = extraNoteEl ? extraNoteEl.value.trim() : "";
    const notes = notesEl ? notesEl.value.trim() : "";
    const total = amount + extra;
    const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;

    currentInvoiceData = {
        invoiceId, residentId, name: r.name, room: r.room, phone: r.phone,
        period, dueDate, amount, extra, extraNote, notes, total
    };

    const preview = document.getElementById("invoicePreviewContent");
    if (!preview) return;

    preview.innerHTML = `
        <div class="invoice-preview-header">
            <img src="logo.jpg" alt="Moka Kost" class="invoice-preview-logo">
            <div class="invoice-preview-title">MOKA KOST</div>
            <div class="invoice-preview-sub">Surat Tagihan Pembayaran Kost</div>
            <div class="invoice-preview-id">#${invoiceId}</div>
        </div>

        <div class="invoice-preview-rows">
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Nama Penghuni</span>
                <span class="invoice-preview-row-value">${r.name}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Kamar</span>
                <span class="invoice-preview-row-value">${r.room}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">No. Telepon</span>
                <span class="invoice-preview-row-value">${r.phone}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Periode</span>
                <span class="invoice-preview-row-value">${period}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Jatuh Tempo</span>
                <span class="invoice-preview-row-value">${formatDate(dueDate)}</span>
            </div>
        </div>

        <hr class="invoice-preview-divider">

        <div class="invoice-preview-rows">
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Biaya Kost</span>
                <span class="invoice-preview-row-value">${formatCurrency(amount)}</span>
            </div>
            ${extra > 0 ? `
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">${extraNote || 'Biaya Tambahan'}</span>
                <span class="invoice-preview-row-value">${formatCurrency(extra)}</span>
            </div>
            ` : ''}
        </div>

        <hr class="invoice-preview-divider">

        <div class="invoice-preview-total">
            <span class="invoice-preview-total-label">Total Tagihan</span>
            <span class="invoice-preview-total-value">${formatCurrency(total)}</span>
        </div>

        <div style="text-align:center;">
            <div class="invoice-preview-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                MENUNGGU PEMBAYARAN
            </div>
        </div>

        ${notes ? `
        <div class="invoice-preview-notes">
            <strong>Catatan:</strong> ${notes}
        </div>
        ` : ''}

        <div class="invoice-preview-footer">
            Tagihan ini dikeluarkan secara digital oleh Moka Kost.<br>
            Mohon melakukan pembayaran sebelum tanggal jatuh tempo.<br>
            Moka Kost — Jl. Harmoni No. 12, Jakarta
        </div>
    `;
}

async function saveInvoice(shareWa = false) {
    if (!currentInvoiceData) return;

    store.updateResident(currentInvoiceData.residentId, {
        period: currentInvoiceData.period,
        dueDate: currentInvoiceData.dueDate,
        amount: currentInvoiceData.total,
        status: "unpaid",
        paidDate: null,
        method: null
    });

    const savedData = { ...currentInvoiceData };
    closeInvoiceModal();

    showToast(
        "Tagihan Berhasil Dibuat!",
        `Tagihan untuk ${savedData.name} — ${savedData.period} telah disimpan.`
    );

    if (shareWa) {
        await shareInvoiceFileCommon(savedData);
    }

    currentInvoiceData = null;
}

export function openInvoiceModal(residentId = null) {
    populateResidentSelect();
    resetInvoiceForm();
    if (residentId) {
        const select = document.getElementById("invoiceResident");
        if (select) {
            select.value = residentId;
            onResidentSelect();
        }
    }
    goToInvoiceStep(1);
    const modal = document.getElementById("invoiceModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

export function closeInvoiceModal() {
    const modal = document.getElementById("invoiceModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

export function initInvoiceModal() {
    const btnCreate = document.getElementById("btnCreateInvoice");
    const closeBtn = document.getElementById("invoiceModalClose");
    const cancelBtn = document.getElementById("btnCancelInvoice");
    const modal = document.getElementById("invoiceModal");
    const select = document.getElementById("invoiceResident");
    const amountInput = document.getElementById("invoiceAmount");
    const extraInput = document.getElementById("invoiceExtra");
    const form = document.getElementById("invoiceForm");
    const backBtn = document.getElementById("btnBackToForm");
    const saveBtn = document.getElementById("btnSaveInvoice");
    const saveAndWaBtn = document.getElementById("btnSaveAndWaInvoice");

    if (btnCreate) btnCreate.addEventListener("click", () => openInvoiceModal());
    if (closeBtn) closeBtn.addEventListener("click", closeInvoiceModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeInvoiceModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target.id === "invoiceModal") closeInvoiceModal();
        });
    }

    if (select) select.addEventListener("change", onResidentSelect);
    if (amountInput) amountInput.addEventListener("input", updateInvoiceTotal);
    if (extraInput) extraInput.addEventListener("input", updateInvoiceTotal);

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            generateInvoicePreview();
            goToInvoiceStep(2);
        });
    }

    if (backBtn) backBtn.addEventListener("click", () => goToInvoiceStep(1));
    if (saveBtn) saveBtn.addEventListener("click", () => saveInvoice(false));
    if (saveAndWaBtn) saveAndWaBtn.addEventListener("click", () => saveInvoice(true));
}
