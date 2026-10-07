/* =========================================
   MOKA KOST — Resident Grid Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDateShort } from "../utils/formatters.js";
import { showReceipt } from "./receiptModal.js";
import { openWhatsAppReminder } from "./whatsappModal.js";
import { openInvoiceModal } from "./invoiceModal.js";
import { sendReceiptPdfToWhatsApp } from "../services/whatsappService.js";
import { openPaymentModal } from "./paymentModal.js";

import { openResidentHistoryModal } from "./paymentHistory.js";

export function renderCards(filter = store.getFilter()) {
    const grid = document.getElementById("residentsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const filtered = store.getResidents(filter);

    filtered.forEach((r, idx) => {
        const card = document.createElement("div");
        card.className = "resident-card";
        card.setAttribute("data-status", r.status);
        card.style.animationDelay = `${idx * 0.06}s`;

        const isPaid = r.status === "paid";

        card.innerHTML = `
            <div class="card-header">
                <div class="card-avatar">${r.avatar}</div>
                <div class="card-status ${isPaid ? 'status-paid' : 'status-unpaid'}">
                    <span class="status-dot"></span>
                    ${isPaid ? 'Lunas' : 'Belum Bayar'}
                </div>
            </div>
            <div class="card-name">${r.name}</div>
            <div class="card-room">${r.room}</div>
            <div class="card-details">
                <div class="card-detail-row">
                    <span class="card-detail-label">Periode</span>
                    <span class="card-detail-value">${r.period}</span>
                </div>
                <div class="card-detail-row">
                    <span class="card-detail-label">Biaya Kost</span>
                    <span class="card-detail-value amount">${formatCurrency(r.amount)}</span>
                </div>
                <div class="card-divider"></div>
                <div class="card-detail-row">
                    <span class="card-detail-label">Jatuh Tempo</span>
                    <span class="card-detail-value">${formatDateShort(r.dueDate)}</span>
                </div>
                ${isPaid ? `
                <div class="card-detail-row">
                    <span class="card-detail-label">Tanggal Bayar</span>
                    <span class="card-detail-value">${formatDateShort(r.paidDate)}</span>
                </div>
                <div class="card-detail-row">
                    <span class="card-detail-label">Metode</span>
                    <span class="card-detail-value">${r.method}</span>
                </div>
                ` : ''}
            </div>
            <div class="card-actions ${isPaid ? 'card-actions--paid' : 'card-actions--unpaid'}">
                ${isPaid ? `
                <div class="card-actions-paid-row">
                    <button class="btn-receipt" data-action="view-receipt" data-id="${r.id}" title="Lihat Bukti Pembayaran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <span>Lihat Bukti</span>
                    </button>
                    <button class="btn-card-wa" data-action="send-receipt-wa" data-id="${r.id}" title="Kirim Bukti ke WhatsApp">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        <span>Kirim WA</span>
                    </button>
                    <button class="btn-card-hist" data-action="view-resident-history" data-id="${r.id}" title="Riwayat Pembayaran" aria-label="Riwayat Pembayaran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </button>
                </div>
                ` : `
                <div class="card-actions-primary-row">
                    <button class="btn-card-pay" data-action="pay-resident" data-id="${r.id}" title="Catat Pembayaran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Konfirmasi Bayar</span>
                    </button>
                    <button class="btn-card-hist" data-action="view-resident-history" data-id="${r.id}" title="Riwayat Pembayaran" aria-label="Riwayat Pembayaran">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </button>
                </div>
                <div class="card-actions-secondary-row">
                    <button class="btn-card-reminder" data-action="send-reminder-wa" data-id="${r.id}" title="Kirim Pengingat WhatsApp">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        <span>Ingatkan WA</span>
                    </button>
                    <button class="btn-card-invoice" data-action="create-invoice" data-id="${r.id}" title="Buat Surat Tagihan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                        <span>Tagihan</span>
                    </button>
                </div>
                `}
            </div>
        `;

        grid.appendChild(card);
    });
}

function setupEventDelegation() {
    const grid = document.getElementById("residentsGrid");
    if (!grid) return;

    grid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");

        if (action === "view-receipt") {
            showReceipt(id);
        } else if (action === "send-receipt-wa") {
            const resident = store.getResidentById(id);
            if (resident) {
                sendReceiptPdfToWhatsApp(resident);
            }
        } else if (action === "pay-resident") {
            openPaymentModal(id);
        } else if (action === "send-reminder-wa") {
            openWhatsAppReminder(id);
        } else if (action === "create-invoice") {
            openInvoiceModal(id);
        } else if (action === "view-resident-history") {
            openResidentHistoryModal(id);
        }
    });
}

function setupFilters() {
    const filterBar = document.getElementById("filterBar");
    if (!filterBar) return;
    const buttons = filterBar.querySelectorAll(".filter-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const filter = btn.getAttribute("data-filter");
            store.setFilter(filter);
        });
    });
}

export function initResidentGrid() {
    renderCards();
    setupEventDelegation();
    setupFilters();
    store.subscribe(() => renderCards());
}
