/* =========================================
   MOKA KOST — Invoice (Buat Tagihan & Tagihan DP) Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { shareInvoiceFileCommon } from "../services/whatsappService.js";
import { KOST_INFO } from "../data/config.js";

let currentInvoiceData = null;
let activeInvoiceType = "full"; // 'full' | 'dp' | 'dp_remaining'

function populateResidentSelect() {
    const select = document.getElementById("invoiceResident");
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>— Pilih penghuni —</option>';
    store.getResidents("all").forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        const statusBadge = r.status === "dp" ? " (DP)" : r.status === "paid" ? " (Lunas)" : "";
        opt.textContent = `${r.name} • ${r.room}${statusBadge}`;
        select.appendChild(opt);
    });
}

function resetInvoiceForm() {
    const form = document.getElementById("invoiceForm");
    if (form) form.reset();
    activeInvoiceType = "full";
    currentInvoiceData = null;

    const dpRemainingBox = document.getElementById("invoiceDpRemainingBox");
    const dpRemainingBtn = document.getElementById("btnInvoiceTypeDpRemaining");
    const dpGroup = document.getElementById("invoiceDpGroup");
    const dpRemainingInfo = document.getElementById("invoiceDpRemainingInfo");
    const totalPreview = document.getElementById("formTotalValue");

    if (dpRemainingBox) dpRemainingBox.style.display = "none";
    if (dpRemainingBtn) dpRemainingBtn.style.display = "none";
    if (dpGroup) dpGroup.style.display = "none";
    if (dpRemainingInfo) dpRemainingInfo.style.display = "none";
    if (totalPreview) totalPreview.textContent = "Rp 0";

    updateInvoiceTypeButtons();
}

function updateInvoiceTypeButtons() {
    const buttons = document.querySelectorAll(".invoice-type-btn");
    buttons.forEach(btn => {
        const type = btn.getAttribute("data-type");
        if (type === activeInvoiceType) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function updateInvoiceFieldsVisibility() {
    const select = document.getElementById("invoiceResident");
    const r = select ? store.getResidentById(select.value) : null;

    const dpGroup = document.getElementById("invoiceDpGroup");
    const dpRemainingBox = document.getElementById("invoiceDpRemainingBox");
    const dpRemainingBtn = document.getElementById("btnInvoiceTypeDpRemaining");
    const dpRemainingInfo = document.getElementById("invoiceDpRemainingInfo");
    const dpRemainingValue = document.getElementById("invoiceDpRemainingValue");
    const dpAmountInput = document.getElementById("invoiceDpAmount");
    const amountInput = document.getElementById("invoiceAmount");

    if (r && r.status === "dp") {
        if (dpRemainingBtn) dpRemainingBtn.style.display = "inline-flex";
    } else {
        if (dpRemainingBtn) dpRemainingBtn.style.display = "none";
        if (activeInvoiceType === "dp_remaining") {
            activeInvoiceType = "full";
        }
    }

    updateInvoiceTypeButtons();

    const baseAmount = parseInt(amountInput ? amountInput.value : 0) || 0;
    const dpPaid = r && r.status === "dp" ? (Number(r.dpAmount) || 0) : 0;
    const sisaExisting = Math.max(0, baseAmount - dpPaid);

    // Dynamic labels based on invoice type
    const amountLabel = document.querySelector('label[for="invoiceAmount"]');
    const totalLabel = document.querySelector('.form-total-label');

    if (activeInvoiceType === "dp") {
        if (dpGroup) dpGroup.style.display = "block";
        if (dpRemainingBox) dpRemainingBox.style.display = "none";
        if (amountLabel) amountLabel.textContent = "Total Biaya Sewa Pokok (Rp)";
        if (totalLabel) totalLabel.textContent = "Total Tagihan DP";

        const dpVal = parseInt(dpAmountInput ? dpAmountInput.value : 0) || 0;
        if (dpVal > 0) {
            const sisaNanti = Math.max(0, baseAmount - dpVal);
            if (dpRemainingInfo) dpRemainingInfo.style.display = "flex";
            if (dpRemainingValue) dpRemainingValue.textContent = formatCurrency(sisaNanti);
        } else {
            if (dpRemainingInfo) dpRemainingInfo.style.display = "none";
        }
    } else if (activeInvoiceType === "dp_remaining") {
        if (dpGroup) dpGroup.style.display = "none";
        if (dpRemainingBox) dpRemainingBox.style.display = "block";
        if (amountLabel) amountLabel.textContent = "Total Biaya Sewa Pokok (Rp)";
        if (totalLabel) totalLabel.textContent = "Total Sisa Pelunasan";

        const totalSewaLabel = document.getElementById("invDpTotalSewaLabel");
        const alreadyPaidLabel = document.getElementById("invDpAlreadyPaidLabel");
        const remainingBillLabel = document.getElementById("invDpRemainingBillLabel");

        if (totalSewaLabel) totalSewaLabel.textContent = formatCurrency(baseAmount);
        if (alreadyPaidLabel) alreadyPaidLabel.textContent = formatCurrency(dpPaid);
        if (remainingBillLabel) remainingBillLabel.textContent = formatCurrency(sisaExisting);
    } else {
        if (dpGroup) dpGroup.style.display = "none";
        if (dpRemainingBox) dpRemainingBox.style.display = "none";
        if (amountLabel) amountLabel.textContent = "Biaya Kost (Rp)";
        if (totalLabel) totalLabel.textContent = "Total Tagihan";
    }

    updateInvoiceTotal();
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
    const select = document.getElementById("invoiceResident");
    const r = select ? store.getResidentById(select.value) : null;

    const amountEl = document.getElementById("invoiceAmount");
    const extraEl = document.getElementById("invoiceExtra");
    const dpAmountEl = document.getElementById("invoiceDpAmount");
    const totalEl = document.getElementById("formTotalValue");

    const amount = parseInt(amountEl ? amountEl.value : 0) || 0;
    const extra = parseInt(extraEl ? extraEl.value : 0) || 0;
    let total = 0;

    if (activeInvoiceType === "dp") {
        const dpAmount = parseInt(dpAmountEl ? dpAmountEl.value : 0) || 0;
        total = dpAmount + extra;
    } else if (activeInvoiceType === "dp_remaining") {
        const dpPaid = r && r.status === "dp" ? (Number(r.dpAmount) || 0) : 0;
        const sisa = Math.max(0, amount - dpPaid);
        total = sisa + extra;
    } else {
        total = amount + extra;
    }

    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function onResidentSelect() {
    const select = document.getElementById("invoiceResident");
    if (!select) return;
    const r = store.getResidentById(select.value);
    if (!r) return;

    const amountEl = document.getElementById("invoiceAmount");
    const periodEl = document.getElementById("invoicePeriod");
    const dueDateEl = document.getElementById("invoiceDueDate");
    const dpAmountEl = document.getElementById("invoiceDpAmount");

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

    if (r.status === "dp") {
        activeInvoiceType = "dp_remaining";
    } else {
        if (activeInvoiceType === "dp_remaining") {
            activeInvoiceType = "full";
        }
        if (dpAmountEl) {
            dpAmountEl.placeholder = `Contoh: ${Math.round(r.amount / 2)}`;
        }
    }

    updateInvoiceFieldsVisibility();
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
    const dpAmountEl = document.getElementById("invoiceDpAmount");

    const period = periodEl ? periodEl.value : "";
    const dueDate = dueDateEl ? dueDateEl.value : "";
    const totalSewaPokok = parseInt(amountEl ? amountEl.value : 0) || r.amount || 0;
    const extra = parseInt(extraEl ? extraEl.value : 0) || 0;
    const extraNote = extraNoteEl ? extraNoteEl.value.trim() : "";
    const notes = notesEl ? notesEl.value.trim() : "";

    let billedAmount = totalSewaPokok;
    let dpTarget = null;
    let dpPaidExisting = null;
    let remainingAmount = null;
    let total = totalSewaPokok + extra;

    if (activeInvoiceType === "dp") {
        dpTarget = parseInt(dpAmountEl ? dpAmountEl.value : 0) || 0;
        if (dpTarget <= 0) {
            showToast("Nominal DP Belum Diisi", "Masukkan jumlah DP yang ingin ditagihkan.", "warning");
            if (dpAmountEl) dpAmountEl.focus();
            return false;
        }
        if (dpTarget >= totalSewaPokok) {
            showToast("Nominal DP Terlalu Besar", "Nominal DP sama atau melebihi sewa pokok. Gunakan Tagihan Penuh.", "warning");
            return false;
        }
        billedAmount = dpTarget;
        remainingAmount = Math.max(0, totalSewaPokok - dpTarget);
        total = dpTarget + extra;
    } else if (activeInvoiceType === "dp_remaining") {
        dpPaidExisting = Number(r.dpAmount) || 0;
        billedAmount = Math.max(0, totalSewaPokok - dpPaidExisting);
        remainingAmount = billedAmount;
        total = billedAmount + extra;
    }

    const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;

    currentInvoiceData = {
        invoiceId,
        residentId,
        name: r.name,
        room: r.room,
        phone: r.phone,
        period,
        dueDate,
        amount: billedAmount,
        totalSewa: totalSewaPokok,
        dpAmount: dpTarget,
        dpPaid: dpPaidExisting,
        remainingAmount,
        extra,
        extraNote,
        notes,
        total,
        invoiceType: activeInvoiceType
    };

    const preview = document.getElementById("invoicePreviewContent");
    if (!preview) return true;

    let subTitle = "Surat Tagihan Pembayaran Kost";
    let badgeHTML = `<div class="invoice-preview-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> MENUNGGU PEMBAYARAN</div>`;
    let breakdownRows = "";

    if (activeInvoiceType === "dp") {
        subTitle = "Surat Tagihan Uang Muka (DP) Sewa Kost";
        badgeHTML = `<div class="invoice-preview-badge invoice-preview-badge--dp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg> TAGIHAN UANG MUKA (DP)</div>`;
        breakdownRows = `
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Total Sewa Pokok</span>
                <span class="invoice-preview-row-value">${formatCurrency(totalSewaPokok)}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label" style="color: #2563eb; font-weight: 700;">Nominal DP Ditagihkan</span>
                <span class="invoice-preview-row-value" style="color: #2563eb; font-weight: 800;">${formatCurrency(dpTarget)}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label" style="color: #f59e0b;">Sisa Pelunasan Nanti</span>
                <span class="invoice-preview-row-value" style="color: #d97706; font-weight: 700;">${formatCurrency(remainingAmount)}</span>
            </div>
            ${extra > 0 ? `
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">${extraNote || 'Biaya Tambahan'}</span>
                <span class="invoice-preview-row-value">${formatCurrency(extra)}</span>
            </div>
            ` : ''}
        `;
    } else if (activeInvoiceType === "dp_remaining") {
        subTitle = "Surat Tagihan Sisa Pelunasan Sewa Kost";
        badgeHTML = `<div class="invoice-preview-badge invoice-preview-badge--remaining"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> TAGIHAN SISA PELUNASAN</div>`;
        breakdownRows = `
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Total Sewa Pokok</span>
                <span class="invoice-preview-row-value">${formatCurrency(totalSewaPokok)}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label" style="color: #3b82f6;">DP yang Telah Diterima</span>
                <span class="invoice-preview-row-value" style="color: #2563eb; font-weight: 600;">${formatCurrency(dpPaidExisting)}</span>
            </div>
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label" style="color: #d97706; font-weight: 700;">Sisa yang Harus Dilunasi</span>
                <span class="invoice-preview-row-value" style="color: #b45309; font-weight: 800;">${formatCurrency(billedAmount)}</span>
            </div>
            ${extra > 0 ? `
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">${extraNote || 'Biaya Tambahan'}</span>
                <span class="invoice-preview-row-value">${formatCurrency(extra)}</span>
            </div>
            ` : ''}
        `;
    } else {
        breakdownRows = `
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">Biaya Kost Pokok</span>
                <span class="invoice-preview-row-value">${formatCurrency(totalSewaPokok)}</span>
            </div>
            ${extra > 0 ? `
            <div class="invoice-preview-row">
                <span class="invoice-preview-row-label">${extraNote || 'Biaya Tambahan'}</span>
                <span class="invoice-preview-row-value">${formatCurrency(extra)}</span>
            </div>
            ` : ''}
        `;
    }

    preview.innerHTML = `
        <div class="invoice-preview-header">
            <img src="logo.jpg" alt="Moka Kost" class="invoice-preview-logo">
            <div class="invoice-preview-title">MOKA KOST</div>
            <div class="invoice-preview-sub">${subTitle}</div>
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
                <span class="invoice-preview-row-value" style="color: #dc2626; font-weight: 700;">${formatDate(dueDate)}</span>
            </div>
        </div>

        <hr class="invoice-preview-divider">

        <div class="invoice-preview-rows">
            ${breakdownRows}
        </div>

        <hr class="invoice-preview-divider">

        <div class="invoice-preview-total">
            <span class="invoice-preview-total-label">${activeInvoiceType === 'dp' ? 'Total Uang Muka (DP)' : activeInvoiceType === 'dp_remaining' ? 'Total Sisa Pelunasan' : 'Total Tagihan'}</span>
            <span class="invoice-preview-total-value">${formatCurrency(total)}</span>
        </div>

        <div style="text-align:center;">
            ${badgeHTML}
        </div>

        ${notes ? `
        <div class="invoice-preview-notes">
            <strong>Catatan:</strong> ${notes}
        </div>
        ` : ''}

        <div class="invoice-preview-footer">
            Tagihan ini dikeluarkan secara digital oleh ${KOST_INFO.nama}.<br>
            Mohon melakukan pembayaran sebelum tanggal jatuh tempo.<br>
            ${KOST_INFO.nama} — ${KOST_INFO.alamat}
        </div>
    `;

    return true;
}

async function saveInvoice(shareWa = false) {
    if (!currentInvoiceData) return;

    const res = store.getResidentById(currentInvoiceData.residentId);

    if (currentInvoiceData.invoiceType === "dp_remaining") {
        // If billing for remaining DP, preserve DP status and dpAmount
        store.updateResident(currentInvoiceData.residentId, {
            period: currentInvoiceData.period,
            dueDate: currentInvoiceData.dueDate
        });
    } else if (currentInvoiceData.invoiceType === "dp") {
        // If billing for DP, reset status to unpaid and clear old payment data
        store.updateResident(currentInvoiceData.residentId, {
            period: currentInvoiceData.period,
            dueDate: currentInvoiceData.dueDate,
            amount: currentInvoiceData.totalSewa,
            status: "unpaid",
            paidDate: null,
            method: null,
            dpAmount: null,
            dpPaidDate: null,
            dpMethod: null,
            dpRemaining: null
        });
    } else {
        // Full new bill
        store.updateResident(currentInvoiceData.residentId, {
            period: currentInvoiceData.period,
            dueDate: currentInvoiceData.dueDate,
            amount: currentInvoiceData.total,
            status: "unpaid",
            paidDate: null,
            method: null,
            dpAmount: null,
            dpPaidDate: null,
            dpMethod: null,
            dpRemaining: null
        });
    }

    const savedData = { ...currentInvoiceData };
    closeInvoiceModal();

    const typeDesc = savedData.invoiceType === "dp" ? "Tagihan DP" : savedData.invoiceType === "dp_remaining" ? "Tagihan Sisa Pelunasan" : "Tagihan";
    showToast(
        `${typeDesc} Berhasil Dibuat!`,
        `${typeDesc} untuk ${savedData.name} (${formatCurrency(savedData.total)}) telah disimpan.`
    );

    if (shareWa) {
        await shareInvoiceFileCommon(savedData);
    }

    currentInvoiceData = null;
}

export function openInvoiceModal(residentId = null, forcedType = null) {
    populateResidentSelect();
    resetInvoiceForm();

    if (residentId) {
        const select = document.getElementById("invoiceResident");
        if (select) {
            select.value = residentId;
            onResidentSelect();
            if (forcedType) {
                activeInvoiceType = forcedType;
                updateInvoiceFieldsVisibility();
            }
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
    const dpAmountInput = document.getElementById("invoiceDpAmount");
    const toggleGroup = document.getElementById("invoiceTypeToggle");
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

    if (toggleGroup) {
        const buttons = toggleGroup.querySelectorAll(".invoice-type-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const type = btn.getAttribute("data-type");
                activeInvoiceType = type;
                updateInvoiceFieldsVisibility();
            });
        });
    }

    if (select) select.addEventListener("change", onResidentSelect);
    if (amountInput) amountInput.addEventListener("input", () => {
        updateInvoiceFieldsVisibility();
    });
    if (dpAmountInput) dpAmountInput.addEventListener("input", () => {
        updateInvoiceFieldsVisibility();
    });
    if (extraInput) extraInput.addEventListener("input", () => {
        updateInvoiceTotal();
    });

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const valid = generateInvoicePreview();
            if (valid) {
                goToInvoiceStep(2);
            }
        });
    }

    if (backBtn) backBtn.addEventListener("click", () => goToInvoiceStep(1));
    if (saveBtn) saveBtn.addEventListener("click", () => saveInvoice(false));
    if (saveAndWaBtn) saveAndWaBtn.addEventListener("click", () => saveInvoice(true));
}
