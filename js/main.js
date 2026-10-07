/* =========================================
   MOKA KOST — Application Entry Point (main.js)
   ========================================= */

import { initStats } from "./components/stats.js";
import { initResidentGrid } from "./components/residentGrid.js";
import { initReceiptModal, closeReceiptModal } from "./components/receiptModal.js";
import { initInvoiceModal, closeInvoiceModal } from "./components/invoiceModal.js";
import { initWhatsAppModal, closeWhatsAppModal } from "./components/whatsappModal.js";
import { initPaymentModal, closePaymentModal } from "./components/paymentModal.js";
import { initKtpModal, closeKtpUploadModal, closeKtpViewerModal } from "./components/ktpModal.js";
import { initResidentDirectory, closeResidentFormModal } from "./components/residentDirectory.js";
import { initPaymentHistory, closeResidentHistoryModal } from "./components/paymentHistory.js";
import { initThemeSwitcher } from "./components/themeSwitcher.js";
import { initCustomCursor } from "./components/customCursor.js";

// Global escape key handler to close all open modals
function setupGlobalKeybindings() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeReceiptModal();
            closeInvoiceModal();
            closeWhatsAppModal();
            closePaymentModal();
            closeKtpUploadModal();
            closeKtpViewerModal();
            closeResidentFormModal();
            closeResidentHistoryModal();
        }
    });
}

// Bootstrap all modular components
document.addEventListener("DOMContentLoaded", () => {
    initThemeSwitcher();
    initCustomCursor();
    initStats();
    initResidentGrid();
    initReceiptModal();
    initInvoiceModal();
    initWhatsAppModal();
    initPaymentModal();
    initKtpModal();
    initResidentDirectory();
    initPaymentHistory();
    setupGlobalKeybindings();
});

