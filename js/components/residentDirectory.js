/* =========================================
   MOKA KOST — Resident Directory & KTP Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatWhatsAppPhone } from "../utils/formatters.js";
import { showToast } from "../utils/toast.js";
import { openKtpUploadModal, openKtpViewerModal, compressImageToBase64 } from "./ktpModal.js";
import { openResidentHistoryModal } from "./paymentHistory.js";

let editingResidentId = null;
let formKtpBase64 = null;

/**
 * Render the Resident Directory Grid
 */
export function renderResidentDirectory() {
    const grid = document.getElementById("directoryGrid");
    const countEl = document.getElementById("directoryResultCount");
    const emptyEl = document.getElementById("directoryEmptyState");
    if (!grid) return;

    const residents = store.getDirectoryResidents();
    const stats = store.getStats();

    // Update stats counters
    const statTotalEl = document.getElementById("dirStatTotal");
    const statWithKtpEl = document.getElementById("dirStatWithKtp");
    const statWithoutKtpEl = document.getElementById("dirStatWithoutKtp");

    if (statTotalEl) statTotalEl.textContent = stats.total;
    if (statWithKtpEl) statWithKtpEl.textContent = stats.withKtpCount;
    if (statWithoutKtpEl) statWithoutKtpEl.textContent = stats.withoutKtpCount;

    if (countEl) {
        countEl.textContent = `Menampilkan ${residents.length} dari ${stats.total} penghuni`;
    }

    grid.innerHTML = "";

    if (residents.length === 0) {
        if (emptyEl) emptyEl.style.display = "flex";
        return;
    } else {
        if (emptyEl) emptyEl.style.display = "none";
    }

    residents.forEach((r, idx) => {
        const card = document.createElement("div");
        card.className = "dir-card";
        card.style.animationDelay = `${idx * 0.05}s`;

        const hasKtp = Boolean(r.ktpImage);
        const cleanPhone = formatWhatsAppPhone(r.phone);

        card.innerHTML = `
            <div class="dir-card-header">
                <div class="dir-card-avatar">${r.avatar || 'MK'}</div>
                <div class="dir-card-badge ${hasKtp ? 'badge-ktp-yes' : 'badge-ktp-no'}">
                    ${hasKtp ? `
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        KTP Terupload
                    ` : `
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Belum Ada KTP
                    `}
                </div>
            </div>

            <div class="dir-card-body">
                <div class="dir-card-name">${r.name}</div>
                <div class="dir-card-room">${r.room}</div>

                <div class="dir-card-info-list">
                    <div class="dir-info-item">
                        <span class="dir-info-label">No. Telepon / WA</span>
                        <a href="https://wa.me/${cleanPhone}" target="_blank" class="dir-info-val dir-info-link" title="Chat WhatsApp">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                            ${r.phone}
                        </a>
                    </div>
                    <div class="dir-info-item">
                        <span class="dir-info-label">NIK KTP</span>
                        <span class="dir-info-val">${r.nik || '<span class="text-dim">—</span>'}</span>
                    </div>
                    <div class="dir-info-item">
                        <span class="dir-info-label">Biaya Sewa</span>
                        <span class="dir-info-val amount">${formatCurrency(r.amount)}</span>
                    </div>
                </div>

                <!-- KTP Preview / Upload Box -->
                <div class="dir-ktp-box ${hasKtp ? 'has-ktp' : 'empty-ktp'}">
                    ${hasKtp ? `
                        <div class="dir-ktp-thumbnail" data-action="view-ktp" data-id="${r.id}" title="Klik untuk memperbesar KTP">
                            <img src="${r.ktpImage}" alt="KTP ${r.name}" class="dir-ktp-img">
                            <div class="dir-ktp-hover-overlay">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                                <span>Lihat KTP</span>
                            </div>
                        </div>
                    ` : `
                        <div class="dir-ktp-placeholder" data-action="upload-ktp" data-id="${r.id}">
                            <div class="dir-ktp-ph-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><path d="M7 16h10"/></svg>
                            </div>
                            <div class="dir-ktp-ph-text">
                                <strong>Belum ada foto KTP</strong>
                                <span>Klik tombol di bawah untuk mengunggah</span>
                            </div>
                        </div>
                    `}
                </div>
            </div>

            <div class="dir-card-actions">
                ${hasKtp ? `
                    <button class="btn-dir btn-dir-view" data-action="view-ktp" data-id="${r.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Lihat KTP
                    </button>
                    <button class="btn-dir btn-dir-upload" data-action="upload-ktp" data-id="${r.id}" title="Ganti Foto KTP">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Ganti KTP
                    </button>
                ` : `
                    <button class="btn-dir btn-dir-upload-primary" data-action="upload-ktp" data-id="${r.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Upload KTP
                    </button>
                `}
                <button class="btn-dir btn-dir-edit" data-action="edit-resident" data-id="${r.id}" title="Edit Data Penghuni">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

import { renderPaymentHistory } from "./paymentHistory.js";

/**
 * Switch view between 'dashboard', 'history', and 'directory'
 */
export function switchMainView(view) {
    store.setView(view);

    const navDashboardBtn = document.getElementById("navTabDashboard");
    const navHistoryBtn = document.getElementById("navTabHistory");
    const navDirectoryBtn = document.getElementById("navTabDirectory");

    const heroSection = document.getElementById("hero");
    const filterSection = document.querySelector(".filter-section");
    const residentsSection = document.getElementById("residentsSection");
    const historySection = document.getElementById("historySection");
    const directorySection = document.getElementById("directorySection");

    // Remove active class from all tabs
    if (navDashboardBtn) navDashboardBtn.classList.remove("active");
    if (navHistoryBtn) navHistoryBtn.classList.remove("active");
    if (navDirectoryBtn) navDirectoryBtn.classList.remove("active");

    if (view === "history") {
        if (navHistoryBtn) navHistoryBtn.classList.add("active");
        if (heroSection) heroSection.style.display = "none";
        if (filterSection) filterSection.style.display = "none";
        if (residentsSection) residentsSection.style.display = "none";
        if (directorySection) directorySection.style.display = "none";
        if (historySection) historySection.style.display = "block";
        renderPaymentHistory();
    } else if (view === "directory") {
        if (navDirectoryBtn) navDirectoryBtn.classList.add("active");
        if (heroSection) heroSection.style.display = "none";
        if (filterSection) filterSection.style.display = "none";
        if (residentsSection) residentsSection.style.display = "none";
        if (historySection) historySection.style.display = "none";
        if (directorySection) directorySection.style.display = "block";
        renderResidentDirectory();
    } else {
        if (navDashboardBtn) navDashboardBtn.classList.add("active");
        if (heroSection) heroSection.style.display = "";
        if (filterSection) filterSection.style.display = "";
        if (residentsSection) residentsSection.style.display = "";
        if (historySection) historySection.style.display = "none";
        if (directorySection) directorySection.style.display = "none";
    }
}

/**
 * Open Modal to Add or Edit Resident
 */
export function openResidentFormModal(residentId = null) {
    editingResidentId = residentId;
    formKtpBase64 = null;

    const modal = document.getElementById("residentFormModal");
    const titleEl = document.getElementById("residentFormTitle");
    const subEl = document.getElementById("residentFormSubtitle");
    const form = document.getElementById("residentForm");
    const deleteBtn = document.getElementById("btnDeleteResident");

    const nameInput = document.getElementById("residentFormName");
    const roomInput = document.getElementById("residentFormRoom");
    const phoneInput = document.getElementById("residentFormPhone");
    const amountInput = document.getElementById("residentFormAmount");
    const nikInput = document.getElementById("residentFormNik");
    const periodInput = document.getElementById("residentFormPeriod");
    const ktpFileInput = document.getElementById("residentFormKtpFile");
    const ktpPreviewBox = document.getElementById("residentFormKtpPreview");
    const ktpPreviewImg = document.getElementById("residentFormKtpPreviewImg");

    if (form) form.reset();
    if (ktpPreviewBox) ktpPreviewBox.style.display = "none";

    if (residentId) {
        const r = store.getResidentById(residentId);
        if (!r) return;

        if (titleEl) titleEl.textContent = "Edit Data Penghuni";
        if (subEl) subEl.textContent = `Perbarui informasi ${r.name}`;
        if (deleteBtn) deleteBtn.style.display = "inline-flex";

        if (nameInput) nameInput.value = r.name || "";
        if (roomInput) roomInput.value = r.room || "";
        if (phoneInput) phoneInput.value = r.phone || "";
        if (amountInput) amountInput.value = r.amount || 1500000;
        if (nikInput) nikInput.value = r.nik || "";
        if (periodInput) periodInput.value = r.period || "Oktober 2026";

        if (r.ktpImage) {
            formKtpBase64 = r.ktpImage;
            if (ktpPreviewBox) ktpPreviewBox.style.display = "block";
            if (ktpPreviewImg) ktpPreviewImg.src = r.ktpImage;
        }
    } else {
        if (titleEl) titleEl.textContent = "Tambah Penghuni Baru";
        if (subEl) subEl.textContent = "Daftarkan penghuni baru dan unggah dokumen KTP";
        if (deleteBtn) deleteBtn.style.display = "none";
        if (amountInput) amountInput.value = "1500000";
        if (periodInput) periodInput.value = "Oktober 2026";
    }

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

/**
 * Close Resident Form Modal
 */
export function closeResidentFormModal() {
    const modal = document.getElementById("residentFormModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
    editingResidentId = null;
    formKtpBase64 = null;
}

/**
 * Setup Event Delegation for Directory
 */
function setupDirectoryEvents() {
    // Nav tabs
    const navDashboardBtn = document.getElementById("navTabDashboard");
    const navHistoryBtn = document.getElementById("navTabHistory");
    const navDirectoryBtn = document.getElementById("navTabDirectory");
    const btnAddResident = document.getElementById("btnAddResident");
    const btnAddResidentEmpty = document.getElementById("btnAddResidentEmpty");

    if (navDashboardBtn) navDashboardBtn.addEventListener("click", () => switchMainView("dashboard"));
    if (navHistoryBtn) navHistoryBtn.addEventListener("click", () => switchMainView("history"));
    if (navDirectoryBtn) navDirectoryBtn.addEventListener("click", () => switchMainView("directory"));
    if (btnAddResident) btnAddResident.addEventListener("click", () => openResidentFormModal());
    if (btnAddResidentEmpty) btnAddResidentEmpty.addEventListener("click", () => openResidentFormModal());

    // Search bar
    const searchInput = document.getElementById("directorySearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            store.setSearchQuery(e.target.value);
            renderResidentDirectory();
        });
    }

    // KTP Filter pills
    const ktpFilterBar = document.getElementById("ktpFilterBar");
    if (ktpFilterBar) {
        const buttons = ktpFilterBar.querySelectorAll(".ktp-filter-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const filter = btn.getAttribute("data-ktp-filter");
                store.setKtpFilter(filter);
                renderResidentDirectory();
            });
        });
    }

    // Grid action delegation
    const grid = document.getElementById("directoryGrid");
    if (grid) {
        grid.addEventListener("click", (e) => {
            const actionEl = e.target.closest("[data-action]");
            if (!actionEl) return;

            const action = actionEl.getAttribute("data-action");
            const id = actionEl.getAttribute("data-id");

            if (action === "upload-ktp") {
                openKtpUploadModal(id);
            } else if (action === "view-ktp") {
                openKtpViewerModal(id);
            } else if (action === "edit-resident") {
                openResidentFormModal(id);
            } else if (action === "view-resident-history") {
                openResidentHistoryModal(id);
            }
        });
    }

    // Resident Form Modal events
    const formModal = document.getElementById("residentFormModal");
    const formCloseBtn = document.getElementById("residentFormModalClose");
    const formCancelBtn = document.getElementById("btnCancelResidentForm");
    const deleteBtn = document.getElementById("btnDeleteResident");
    const residentForm = document.getElementById("residentForm");
    const ktpFileInput = document.getElementById("residentFormKtpFile");
    const ktpDropzone = document.getElementById("residentFormKtpDropzone");
    const btnRemoveFormKtp = document.getElementById("btnRemoveFormKtp");

    if (formCloseBtn) formCloseBtn.addEventListener("click", closeResidentFormModal);
    if (formCancelBtn) formCancelBtn.addEventListener("click", closeResidentFormModal);
    if (formModal) {
        formModal.addEventListener("click", (e) => {
            if (e.target === formModal) closeResidentFormModal();
        });
    }

    // Handle KTP file upload inside resident form
    if (ktpDropzone && ktpFileInput) {
        ktpDropzone.addEventListener("click", () => ktpFileInput.click());
        ktpFileInput.addEventListener("change", async (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                try {
                    const base64 = await compressImageToBase64(file);
                    formKtpBase64 = base64;
                    const previewBox = document.getElementById("residentFormKtpPreview");
                    const previewImg = document.getElementById("residentFormKtpPreviewImg");
                    if (previewImg) previewImg.src = base64;
                    if (previewBox) previewBox.style.display = "block";
                } catch (err) {
                    showToast("Format Tidak Valid", "Harap pilih gambar KTP (JPG/PNG).", "warning");
                }
            }
        });
    }

    if (btnRemoveFormKtp) {
        btnRemoveFormKtp.addEventListener("click", () => {
            formKtpBase64 = null;
            const previewBox = document.getElementById("residentFormKtpPreview");
            const previewImg = document.getElementById("residentFormKtpPreviewImg");
            if (ktpFileInput) ktpFileInput.value = "";
            if (previewImg) previewImg.src = "";
            if (previewBox) previewBox.style.display = "none";
        });
    }

    // Delete resident
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            if (!editingResidentId) return;
            const r = store.getResidentById(editingResidentId);
            const name = r ? r.name : "Penghuni";

            if (confirm(`Apakah Anda yakin ingin menghapus data penghuni ${name}? Semua data dan kuitansi akan dihapus.`)) {
                store.deleteResident(editingResidentId);
                closeResidentFormModal();
                renderResidentDirectory();
                showToast("Penghuni Dihapus", `Data ${name} telah dihapus dari sistem.`, "info");
            }
        });
    }

    // Save resident form
    if (residentForm) {
        residentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("residentFormName")?.value.trim() || "";
            const room = document.getElementById("residentFormRoom")?.value.trim() || "";
            const phone = document.getElementById("residentFormPhone")?.value.trim() || "";
            const amount = parseInt(document.getElementById("residentFormAmount")?.value) || 1500000;
            const nik = document.getElementById("residentFormNik")?.value.trim() || "";
            const period = document.getElementById("residentFormPeriod")?.value || "Oktober 2026";

            if (!name || !room || !phone) {
                showToast("Lengkapi Form", "Nama, kamar, dan nomor telepon wajib diisi.", "warning");
                return;
            }

            if (editingResidentId) {
                store.updateResident(editingResidentId, {
                    name, room, phone, amount, nik, period,
                    ktpImage: formKtpBase64,
                    ktpUploadedAt: formKtpBase64 ? new Date().toISOString() : null
                });
                showToast("Data Diperbarui! 🎉", `Data penghuni ${name} berhasil disimpan.`);
            } else {
                store.addResident({
                    name, room, phone, amount, nik, period,
                    ktpImage: formKtpBase64
                });
                showToast("Penghuni Ditambahkan! 👥", `${name} berhasil didaftarkan di Moka Kost.`);
            }

            closeResidentFormModal();
            renderResidentDirectory();
        });
    }
}

/**
 * Initialize Resident Directory Component
 */
export function initResidentDirectory() {
    setupDirectoryEvents();
    renderResidentDirectory();
    store.subscribe(() => {
        if (store.getView() === "directory") {
            renderResidentDirectory();
        }
    });
}
