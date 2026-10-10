/* =========================================
   MOKA KOST — Payment History Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate, formatDateShort, formatWhatsAppPhone } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { showReceipt } from "./receiptModal.js";
import { sendReceiptPdfToWhatsApp } from "../services/whatsappService.js";
import { openProofViewerModal, openProofUploadModal } from "./proofModal.js";

let activeResidentHistoryId = null;

/**
 * Render the Payment History Stats Cards
 */
function renderHistoryStats() {
    const stats = store.getHistoryStats();

    const statCountEl = document.getElementById("historyStatCount");
    const statRevenueEl = document.getElementById("historyStatRevenue");
    const statAverageEl = document.getElementById("historyStatAverage");
    const statMethodEl = document.getElementById("historyStatMethod");

    if (statCountEl) statCountEl.textContent = `${stats.totalTransactions} Transaksi`;
    if (statRevenueEl) statRevenueEl.textContent = formatCurrency(stats.totalRevenue);
    if (statAverageEl) statAverageEl.textContent = formatCurrency(stats.averageTransaction);
    if (statMethodEl) statMethodEl.textContent = stats.topPaymentMethod;
}

/**
 * Populate dynamic filter dropdowns (Periods & Methods)
 */
function populateFilterOptions() {
    const periodSelect = document.getElementById("historyPeriodFilter");
    const methodSelect = document.getElementById("historyMethodFilter");

    if (periodSelect) {
        const currentVal = periodSelect.value || "all";
        const periods = store.getHistoryPeriods();
        periodSelect.innerHTML = '<option value="all">Semua Periode</option>';
        periods.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p;
            if (p === currentVal) opt.selected = true;
            periodSelect.appendChild(opt);
        });
    }

    if (methodSelect) {
        const currentVal = methodSelect.value || "all";
        const methods = store.getHistoryMethods();
        methodSelect.innerHTML = '<option value="all">Semua Metode</option>';
        methods.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            if (m === currentVal) opt.selected = true;
            methodSelect.appendChild(opt);
        });
    }
}

/**
 * Helper to get styling badge for payment method
 */
function getMethodBadgeClass(method = "") {
    const m = method.toLowerCase();
    if (m.includes("bca")) return "method-bca";
    if (m.includes("mandiri")) return "method-mandiri";
    if (m.includes("bri")) return "method-bri";
    if (m.includes("gopay")) return "method-gopay";
    if (m.includes("ovo")) return "method-ovo";
    if (m.includes("dana")) return "method-dana";
    if (m.includes("qris")) return "method-qris";
    if (m.includes("tunai") || m.includes("cash")) return "method-cash";
    return "method-default";
}

/**
 * Render the Payment History Table / Cards
 */
export function renderPaymentHistory() {
    const tbody = document.getElementById("historyTableBody");
    const cardsContainer = document.getElementById("historyCardsList");
    const countInfoEl = document.getElementById("historyResultCount");
    const emptyState = document.getElementById("historyEmptyState");

    renderHistoryStats();

    const items = store.getFilteredPaymentHistory();
    const totalCount = store.paymentHistory.length;

    if (countInfoEl) {
        countInfoEl.textContent = `Menampilkan ${items.length} dari ${totalCount} catatan transaksi pembayaran`;
    }

    if (items.length === 0) {
        if (tbody) tbody.innerHTML = "";
        if (cardsContainer) cardsContainer.innerHTML = "";
        if (emptyState) emptyState.style.display = "flex";
        return;
    } else {
        if (emptyState) emptyState.style.display = "none";
    }

    // 1. Render Desktop / Tablet Table View
    if (tbody) {
        tbody.innerHTML = items.map((item, index) => {
            const badgeClass = getMethodBadgeClass(item.method);
            const displayDate = item.paidDate ? formatDate(item.paidDate) : formatDate(item.createdAt);

            return `
                <tr class="history-row" data-id="${item.id}">
                    <td class="history-col-id">
                        <div class="history-id-badge">#${item.receiptNo || item.id}</div>
                        <span class="history-time-meta">${formatDateShort(item.paidDate)}</span>
                    </td>
                    <td class="history-col-resident">
                        <div class="history-resident-cell">
                            <div class="history-resident-avatar">${item.avatar || 'MK'}</div>
                            <div>
                                <div class="history-resident-name" data-action="view-resident-history" data-resident-id="${item.residentId}" title="Lihat semua riwayat penghuni ini">
                                    ${item.name}
                                </div>
                                <div class="history-resident-room">${item.room}</div>
                            </div>
                        </div>
                    </td>
                    <td class="history-col-period">
                        <span class="history-period-tag">${item.period}</span>
                    </td>
                    <td class="history-col-amount">
                        <div class="history-amount-val">${formatCurrency(item.amount)}</div>
                        <div class="history-status-paid">
                            <span class="status-dot dot-paid"></span> Lunas
                        </div>
                    </td>
                    <td class="history-col-method">
                        <span class="history-method-badge ${badgeClass}">
                            ${item.method || 'Transfer BCA'}
                        </span>
                        ${item.notes ? `<div class="history-notes-text" title="${item.notes}">📝 ${item.notes}</div>` : ''}
                    </td>
                    <td class="history-col-actions">
                        <div class="history-actions-group">
                            <button class="btn-hist-action btn-hist-receipt" data-action="view-receipt" data-id="${item.id}" title="Lihat & Cetak Bukti Pembayaran">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                                <span>Bukti</span>
                            </button>
                            <button class="btn-hist-action ${item.proofImage ? 'btn-hist-proof' : 'btn-hist-proof-upload'}" data-action="${item.proofImage ? 'view-proof' : 'upload-proof'}" data-id="${item.id}" title="${item.proofImage ? 'Lihat Foto Bukti Transfer Asli' : 'Upload Foto Bukti Transfer'}">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                </svg>
                                <span>${item.proofImage ? 'Foto' : '+Bukti'}</span>
                            </button>
                            <button class="btn-hist-action btn-hist-wa" data-action="send-wa" data-id="${item.id}" title="Kirim Bukti Pembayaran ke WhatsApp">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                </svg>
                                <span>WA</span>
                            </button>
                            <button class="btn-hist-action btn-hist-delete" data-action="delete-history" data-id="${item.id}" title="Hapus catatan riwayat ini">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // 2. Render Mobile Cards View
    if (cardsContainer) {
        cardsContainer.innerHTML = items.map(item => {
            const badgeClass = getMethodBadgeClass(item.method);
            return `
                <div class="history-card-mobile" data-id="${item.id}">
                    <div class="hcm-header">
                        <div class="hcm-user">
                            <div class="history-resident-avatar">${item.avatar || 'MK'}</div>
                            <div>
                                <div class="hcm-name">${item.name}</div>
                                <div class="hcm-room">${item.room}</div>
                            </div>
                        </div>
                        <span class="history-id-badge">#${item.receiptNo || item.id}</span>
                    </div>

                    <div class="hcm-details">
                        <div class="hcm-row">
                            <span class="hcm-label">Periode</span>
                            <span class="hcm-val font-semibold">${item.period}</span>
                        </div>
                        <div class="hcm-row">
                            <span class="hcm-label">Tanggal Bayar</span>
                            <span class="hcm-val">${formatDate(item.paidDate)}</span>
                        </div>
                        <div class="hcm-row">
                            <span class="hcm-label">Metode</span>
                            <span class="history-method-badge ${badgeClass}">${item.method || 'Transfer BCA'}</span>
                        </div>
                        <div class="hcm-row hcm-total-row">
                            <span class="hcm-label">Total Dibayar</span>
                            <span class="hcm-amount">${formatCurrency(item.amount)}</span>
                        </div>
                        ${item.notes ? `
                        <div class="hcm-notes">
                            <span>Catatan:</span> ${item.notes}
                        </div>
                        ` : ''}
                    </div>

                    <div class="hcm-actions">
                        <button class="btn-hist-action btn-hist-receipt" data-action="view-receipt" data-id="${item.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            Lihat Bukti
                        </button>
                        <button class="btn-hist-action ${item.proofImage ? 'btn-hist-proof' : 'btn-hist-proof-upload'}" data-action="${item.proofImage ? 'view-proof' : 'upload-proof'}" data-id="${item.id}">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            ${item.proofImage ? 'Foto' : '+Bukti'}
                        </button>
                        <button class="btn-hist-action btn-hist-wa" data-action="send-wa" data-id="${item.id}">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            Kirim WA
                        </button>
                        <button class="btn-hist-action btn-hist-delete" data-action="delete-history" data-id="${item.id}" title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }
}

/**
 * Export payment history as CSV file with Indonesian format
 */
export function exportHistoryToCSV() {
    const items = store.getFilteredPaymentHistory();
    if (items.length === 0) {
        showToast("Data Kosong", "Tidak ada data transaksi yang dapat diexport.", "warning");
        return;
    }

    const headers = ["No. Kuitansi", "ID Transaksi", "Nama Penghuni", "Kamar", "No. Telepon", "Periode", "Tanggal Bayar", "Metode", "Nominal (Rp)", "Catatan"];
    
    const rows = items.map(item => [
        `"${item.receiptNo || item.id}"`,
        `"${item.id}"`,
        `"${item.name || ''}"`,
        `"${item.room || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.period || ''}"`,
        `"${item.paidDate || ''}"`,
        `"${item.method || ''}"`,
        item.amount || 0,
        `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `Riwayat_Pembayaran_MokaKost_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Export Berhasil! 📊", `File ${filename} berhasil diunduh.`);
}

/**
 * Print printable payment history report
 */
export function printHistoryReport() {
    const items = store.getFilteredPaymentHistory();
    const stats = store.getHistoryStats();

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        window.print();
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Riwayat Pembayaran — Moka Kost</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
                .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: bold; color: #a06a3a; margin-bottom: 4px; }
                .subtitle { font-size: 13px; color: #64748b; }
                .stats-box { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
                .stat-item { text-align: center; }
                .stat-val { font-size: 16px; font-weight: bold; color: #0f172a; }
                .stat-lbl { font-size: 11px; color: #64748b; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
                th { background: #f1f5f9; color: #334155; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; }
                td { padding: 8px 10px; border: 1px solid #e2e8f0; }
                tr:nth-child(even) { background: #f8fafc; }
                .amount { font-weight: bold; text-align: right; }
                .footer { margin-top: 30px; text-align: right; font-size: 11px; color: #64748b; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">MOKA KOST — LAPORAN RIWAYAT PEMBAYARAN</div>
                <div class="subtitle">Jl. Mulawarman IV RT 03 RW 01 Kramas, Tembalang, Semarang &bull; Telp: 0851-7545-0467</div>
                <div class="subtitle">Dicetak pada: ${formatDate(new Date().toISOString())}</div>
            </div>

            <div class="stats-box">
                <div class="stat-item">
                    <div class="stat-val">${items.length}</div>
                    <div class="stat-lbl">Total Transaksi</div>
                </div>
                <div class="stat-item">
                    <div class="stat-val">${formatCurrency(stats.totalRevenue)}</div>
                    <div class="stat-lbl">Total Dana Diterima</div>
                </div>
                <div class="stat-item">
                    <div class="stat-val">${formatCurrency(stats.averageTransaction)}</div>
                    <div class="stat-lbl">Rata-rata Transaksi</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>No. Kuitansi</th>
                        <th>Tanggal Bayar</th>
                        <th>Nama Penghuni</th>
                        <th>Kamar</th>
                        <th>Periode</th>
                        <th>Metode</th>
                        <th style="text-align:right;">Nominal</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${item.receiptNo || item.id}</td>
                            <td>${item.paidDate || '-'}</td>
                            <td><strong>${item.name}</strong></td>
                            <td>${item.room}</td>
                            <td>${item.period}</td>
                            <td>${item.method || '-'}</td>
                            <td class="amount">${formatCurrency(item.amount)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div class="footer">
                <p>Pengelola Moka Kost</p>
                <br><br>
                <p>( _______________________ )</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Open Modal showing specific resident's payment history timeline
 */
export function openResidentHistoryModal(residentId) {
    activeResidentHistoryId = residentId;
    const resident = store.getResidentById(residentId);
    if (!resident) return;

    const modal = document.getElementById("residentHistoryModal");
    const nameEl = document.getElementById("resHistName");
    const roomEl = document.getElementById("resHistRoom");
    const totalSpentEl = document.getElementById("resHistTotalSpent");
    const countEl = document.getElementById("resHistCount");
    const timelineEl = document.getElementById("resHistTimeline");

    if (nameEl) nameEl.textContent = resident.name;
    if (roomEl) roomEl.textContent = resident.room;

    const historyItems = store.getResidentPaymentHistory(residentId);
    const totalPaid = historyItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    if (totalSpentEl) totalSpentEl.textContent = formatCurrency(totalPaid);
    if (countEl) countEl.textContent = `${historyItems.length} Transaksi`;

    if (timelineEl) {
        if (historyItems.length === 0) {
            timelineEl.innerHTML = `
                <div class="res-hist-empty">
                    <p>Belum ada riwayat pembayaran yang tercatat untuk penghuni ini.</p>
                </div>
            `;
        } else {
            timelineEl.innerHTML = historyItems.map(item => `
                <div class="res-hist-timeline-item">
                    <div class="res-hist-tl-dot"></div>
                    <div class="res-hist-tl-card">
                        <div class="res-hist-tl-header">
                            <div>
                                <span class="res-hist-period">${item.period}</span>
                                <span class="res-hist-date">${formatDate(item.paidDate)}</span>
                            </div>
                            <span class="res-hist-amount">${formatCurrency(item.amount)}</span>
                        </div>
                        <div class="res-hist-tl-meta">
                            <span class="history-method-badge ${getMethodBadgeClass(item.method)}">${item.method || 'Transfer'}</span>
                            <span class="res-hist-receipt-no">#${item.receiptNo || item.id}</span>
                        </div>
                        ${item.notes ? `<div class="res-hist-notes">📝 ${item.notes}</div>` : ''}
                        <div class="res-hist-actions">
                            <button class="btn-hist-action btn-hist-receipt" data-action="view-receipt" data-id="${item.id}">
                                Lihat Bukti
                            </button>
                            <button class="btn-hist-action ${item.proofImage ? 'btn-hist-proof' : 'btn-hist-proof-upload'}" data-action="${item.proofImage ? 'view-proof' : 'upload-proof'}" data-id="${item.id}">
                                ${item.proofImage ? 'Foto Transfer' : '+ Bukti'}
                            </button>
                            <button class="btn-hist-action btn-hist-wa" data-action="send-wa" data-id="${item.id}">
                                Kirim WA
                            </button>
                        </div>
                    </div>
                </div>
            `).join("");
        }
    }

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

export function closeResidentHistoryModal() {
    const modal = document.getElementById("residentHistoryModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
    activeResidentHistoryId = null;
}

/**
 * Setup Event Listeners for Payment History
 */
function setupHistoryEvents() {
    // Toolbar search & filters
    const searchInput = document.getElementById("historySearchInput");
    const periodSelect = document.getElementById("historyPeriodFilter");
    const methodSelect = document.getElementById("historyMethodFilter");
    const sortBtn = document.getElementById("btnHistorySort");
    const btnResetFilter = document.getElementById("btnHistoryReset");
    const btnExportCSV = document.getElementById("btnExportHistoryCSV");
    const btnPrintReport = document.getElementById("btnPrintHistoryReport");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            store.setHistoryFilter("search", e.target.value);
            renderPaymentHistory();
        });
    }

    if (periodSelect) {
        periodSelect.addEventListener("change", (e) => {
            store.setHistoryFilter("period", e.target.value);
            renderPaymentHistory();
        });
    }

    if (methodSelect) {
        methodSelect.addEventListener("change", (e) => {
            store.setHistoryFilter("method", e.target.value);
            renderPaymentHistory();
        });
    }

    if (sortBtn) {
        sortBtn.addEventListener("click", () => {
            const nextSort = store.historySort === "desc" ? "asc" : "desc";
            store.setHistoryFilter("sort", nextSort);
            sortBtn.setAttribute("data-sort", nextSort);
            const sortLabel = sortBtn.querySelector(".sort-label");
            if (sortLabel) sortLabel.textContent = nextSort === "desc" ? "Terbaru" : "Terlama";
            renderPaymentHistory();
        });
    }

    if (btnResetFilter) {
        btnResetFilter.addEventListener("click", () => {
            store.resetHistoryFilters();
            if (searchInput) searchInput.value = "";
            if (periodSelect) periodSelect.value = "all";
            if (methodSelect) methodSelect.value = "all";
            renderPaymentHistory();
            showToast("Filter Direset", "Menampilkan seluruh riwayat pembayaran.");
        });
    }

    if (btnExportCSV) {
        btnExportCSV.addEventListener("click", exportHistoryToCSV);
    }

    if (btnPrintReport) {
        btnPrintReport.addEventListener("click", printHistoryReport);
    }

    // Event delegation on table / cards
    const section = document.getElementById("historySection");
    if (section) {
        section.addEventListener("click", (e) => {
            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;

            const action = actionBtn.getAttribute("data-action");
            const id = actionBtn.getAttribute("data-id");
            const residentId = actionBtn.getAttribute("data-resident-id");

            if (action === "view-receipt") {
                const item = store.getPaymentHistoryById(id);
                if (item) showReceipt(item);
            } else if (action === "view-proof") {
                openProofViewerModal(id);
            } else if (action === "upload-proof") {
                openProofUploadModal(id);
            } else if (action === "send-wa") {
                const item = store.getPaymentHistoryById(id);
                if (item) sendReceiptPdfToWhatsApp(item);
            } else if (action === "delete-history") {
                const item = store.getPaymentHistoryById(id);
                if (item && confirm(`Hapus catatan pembayaran untuk ${item.name} (${item.period})?`)) {
                    store.deletePaymentHistory(id);
                    renderPaymentHistory();
                    showToast("Riwayat Dihapus", "Catatan pembayaran berhasil dihapus dari log.", "info");
                }
            } else if (action === "view-resident-history" && residentId) {
                openResidentHistoryModal(residentId);
            }
        });
    }

    // Resident History Modal events
    const modal = document.getElementById("residentHistoryModal");
    const closeBtn = document.getElementById("residentHistoryModalClose");
    if (closeBtn) closeBtn.addEventListener("click", closeResidentHistoryModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeResidentHistoryModal();
        });
        modal.addEventListener("click", (e) => {
            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;
            const action = actionBtn.getAttribute("data-action");
            const id = actionBtn.getAttribute("data-id");
            if (action === "view-receipt") {
                const item = store.getPaymentHistoryById(id);
                if (item) {
                    closeResidentHistoryModal();
                    showReceipt(item);
                }
            } else if (action === "view-proof") {
                openProofViewerModal(id);
            } else if (action === "upload-proof") {
                openProofUploadModal(id);
            } else if (action === "send-wa") {
                const item = store.getPaymentHistoryById(id);
                if (item) {
                    closeResidentHistoryModal();
                    sendReceiptPdfToWhatsApp(item);
                }
            }
        });
    }
}

/**
 * Initialize Payment History Component
 */
export function initPaymentHistory() {
    setupHistoryEvents();
    populateFilterOptions();
    renderPaymentHistory();

    store.subscribe(() => {
        populateFilterOptions();
        if (store.getView() === "history") {
            renderPaymentHistory();
        }
    });
}
