/* =========================================
   MOKA KOST — KTP Upload & Viewer Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { showToast } from "../utils/toast.js";
import { formatDate } from "../utils/formatters.js";

let currentKtpResidentId = null;
let currentKtpBase64 = null;

import { compressImageToBase64 } from "../utils/imageCompressor.js";
export { compressImageToBase64 };

/**
 * Open KTP Upload Modal for a resident
 * @param {string} residentId 
 */
export function openKtpUploadModal(residentId) {
    const r = store.getResidentById(residentId);
    if (!r) return;

    currentKtpResidentId = residentId;
    currentKtpBase64 = r.ktpImage || null;

    const modal = document.getElementById("ktpUploadModal");
    const nameEl = document.getElementById("ktpUploadResidentName");
    const roomEl = document.getElementById("ktpUploadResidentRoom");
    const nikInput = document.getElementById("ktpNikInput");
    const previewContainer = document.getElementById("ktpPreviewContainer");
    const dropzone = document.getElementById("ktpDropzone");
    const previewImg = document.getElementById("ktpPreviewImg");
    const fileInput = document.getElementById("ktpFileInput");

    if (nameEl) nameEl.textContent = r.name;
    if (roomEl) roomEl.textContent = `${r.room} • ${r.phone}`;
    if (nikInput) nikInput.value = r.nik || "";
    if (fileInput) fileInput.value = "";

    if (currentKtpBase64) {
        if (previewContainer) previewContainer.style.display = "block";
        if (dropzone) dropzone.style.display = "none";
        if (previewImg) previewImg.src = currentKtpBase64;
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
 * Close KTP Upload Modal
 */
export function closeKtpUploadModal() {
    const modal = document.getElementById("ktpUploadModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
    currentKtpResidentId = null;
    currentKtpBase64 = null;
}

/**
 * Open KTP Fullscreen Viewer / Lightbox
 * @param {string} residentId 
 */
export function openKtpViewerModal(residentId) {
    const r = store.getResidentById(residentId);
    if (!r || !r.ktpImage) {
        showToast("KTP Belum Tersedia", "Penghuni ini belum mengunggah foto KTP.", "warning");
        return;
    }

    currentKtpResidentId = residentId;

    const modal = document.getElementById("ktpViewerModal");
    const imgEl = document.getElementById("ktpViewerImg");
    const titleEl = document.getElementById("ktpViewerTitle");
    const subEl = document.getElementById("ktpViewerSubtitle");
    const nikEl = document.getElementById("ktpViewerNik");
    const dateEl = document.getElementById("ktpViewerDate");

    if (imgEl) imgEl.src = r.ktpImage;
    if (titleEl) titleEl.textContent = `KTP — ${r.name}`;
    if (subEl) subEl.textContent = `${r.room} • ${r.phone}`;
    if (nikEl) nikEl.textContent = r.nik ? `NIK: ${r.nik}` : "NIK: Belum diisi";
    if (dateEl) dateEl.textContent = r.ktpUploadedAt ? `Diunggah: ${formatDate(r.ktpUploadedAt)}` : "";

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

/**
 * Close KTP Fullscreen Viewer
 */
export function closeKtpViewerModal() {
    const modal = document.getElementById("ktpViewerModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

/**
 * Handle file selection from input or drag-drop
 */
async function handleKtpFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        showToast("Format Tidak Didukung", "Harap pilih file gambar (JPG, PNG, JPEG, WEBP).", "warning");
        return;
    }

    showToast("Memproses Foto...", "Sedang mengoptimalkan foto KTP.");

    try {
        const base64 = await compressImageToBase64(file);
        currentKtpBase64 = base64;

        const previewContainer = document.getElementById("ktpPreviewContainer");
        const dropzone = document.getElementById("ktpDropzone");
        const previewImg = document.getElementById("ktpPreviewImg");

        if (previewImg) previewImg.src = base64;
        if (previewContainer) previewContainer.style.display = "block";
        if (dropzone) dropzone.style.display = "none";

        showToast("Foto Siap Disimpan", "Silakan periksa pratinjau dan klik Simpan KTP.");
    } catch (err) {
        console.error("Gagal memproses gambar:", err);
        showToast("Gagal Membaca File", "Terjadi kesalahan saat memproses gambar.", "error");
    }
}

/**
 * Save KTP to store
 */
function handleSaveKtp(e) {
    e.preventDefault();
    if (!currentKtpResidentId) return;

    if (!currentKtpBase64) {
        showToast("Pilih Foto KTP", "Harap unggah atau pilih foto KTP terlebih dahulu.", "warning");
        return;
    }

    const nikInput = document.getElementById("ktpNikInput");
    const nik = nikInput ? nikInput.value.trim() : "";

    const updated = store.updateKtp(currentKtpResidentId, {
        ktpImage: currentKtpBase64,
        nik: nik
    });

    const residentName = updated ? updated.name : "Penghuni";
    closeKtpUploadModal();

    showToast(
        "KTP Berhasil Disimpan! 🪪",
        `Data identitas KTP ${residentName} telah terverifikasi.`
    );
}

/**
 * Initialize event listeners for KTP modals
 */
export function initKtpModal() {
    // Upload Modal elements
    const uploadModal = document.getElementById("ktpUploadModal");
    const uploadCloseBtn = document.getElementById("ktpUploadModalClose");
    const cancelBtn = document.getElementById("btnCancelKtpUpload");
    const form = document.getElementById("ktpUploadForm");
    const dropzone = document.getElementById("ktpDropzone");
    const fileInput = document.getElementById("ktpFileInput");
    const btnChangeKtp = document.getElementById("btnChangeKtpPhoto");
    const btnRemoveKtpPreview = document.getElementById("btnRemoveKtpPreview");

    // Viewer Modal elements
    const viewerModal = document.getElementById("ktpViewerModal");
    const viewerCloseBtn = document.getElementById("ktpViewerModalClose");
    const btnViewerDownload = document.getElementById("btnViewerDownloadKtp");
    const btnViewerChange = document.getElementById("btnViewerChangeKtp");
    const btnViewerDelete = document.getElementById("btnViewerDeleteKtp");

    // Close handlers
    if (uploadCloseBtn) uploadCloseBtn.addEventListener("click", closeKtpUploadModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeKtpUploadModal);
    if (uploadModal) {
        uploadModal.addEventListener("click", (e) => {
            if (e.target === uploadModal) closeKtpUploadModal();
        });
    }

    if (viewerCloseBtn) viewerCloseBtn.addEventListener("click", closeKtpViewerModal);
    if (viewerModal) {
        viewerModal.addEventListener("click", (e) => {
            if (e.target === viewerModal) closeKtpViewerModal();
        });
    }

    // Dropzone & File Input
    if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());

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
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleKtpFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleKtpFile(e.target.files[0]);
            }
        });
    }

    if (btnChangeKtp && fileInput) {
        btnChangeKtp.addEventListener("click", () => fileInput.click());
    }

    if (btnRemoveKtpPreview) {
        btnRemoveKtpPreview.addEventListener("click", () => {
            currentKtpBase64 = null;
            const previewContainer = document.getElementById("ktpPreviewContainer");
            const dropzone = document.getElementById("ktpDropzone");
            const previewImg = document.getElementById("ktpPreviewImg");
            if (fileInput) fileInput.value = "";
            if (previewImg) previewImg.src = "";
            if (previewContainer) previewContainer.style.display = "none";
            if (dropzone) dropzone.style.display = "flex";
        });
    }

    if (form) {
        form.addEventListener("submit", handleSaveKtp);
    }

    // Viewer Actions
    if (btnViewerDownload) {
        btnViewerDownload.addEventListener("click", () => {
            if (!currentKtpResidentId) return;
            const r = store.getResidentById(currentKtpResidentId);
            if (!r || !r.ktpImage) return;

            const link = document.createElement("a");
            link.href = r.ktpImage;
            link.download = `KTP_${r.name.replace(/\s+/g, '_')}.jpg`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast("Mengunduh KTP...", `Berkas KTP ${r.name} telah diunduh.`);
        });
    }

    if (btnViewerChange) {
        btnViewerChange.addEventListener("click", () => {
            const residentId = currentKtpResidentId;
            closeKtpViewerModal();
            if (residentId) {
                setTimeout(() => openKtpUploadModal(residentId), 200);
            }
        });
    }

    if (btnViewerDelete) {
        btnViewerDelete.addEventListener("click", () => {
            if (!currentKtpResidentId) return;
            const r = store.getResidentById(currentKtpResidentId);
            const name = r ? r.name : "Penghuni";

            if (confirm(`Apakah Anda yakin ingin menghapus foto KTP untuk ${name}?`)) {
                store.removeKtp(currentKtpResidentId);
                closeKtpViewerModal();
                showToast("KTP Dihapus", `Foto KTP untuk ${name} telah dihapus.`, "info");
            }
        });
    }
}
