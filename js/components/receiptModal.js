/* =========================================
   MOKA KOST — Receipt Modal Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { downloadReceiptImage, printReceiptPDF, createReceiptHTML } from "../utils/pdfGenerator.js";
import { sendReceiptPdfToWhatsApp } from "../services/whatsappService.js";

let currentReceiptResident = null;

export function showReceipt(target) {
    let r = null;
    if (typeof target === "string") {
        r = store.getResidentById(target) || store.getPaymentHistoryById(target);
    } else if (typeof target === "object" && target !== null) {
        r = target;
    }

    if (!r) return;

    currentReceiptResident = r;
    const receiptContent = document.getElementById("receiptContent");
    if (!receiptContent) return;

    receiptContent.innerHTML = createReceiptHTML(r);

    const modal = document.getElementById("receiptModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

export function closeReceiptModal() {
    const modal = document.getElementById("receiptModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

export function initReceiptModal() {
    const modal = document.getElementById("receiptModal");
    const closeBtn = document.getElementById("modalClose");
    const btnPrint = document.getElementById("btnPrint");
    const btnWaReceipt = document.getElementById("btnWaReceipt");
    const btnDownload = document.getElementById("btnDownload");

    if (closeBtn) closeBtn.addEventListener("click", closeReceiptModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeReceiptModal();
        });
    }

    if (btnPrint) {
        btnPrint.addEventListener("click", () => {
            if (currentReceiptResident) {
                printReceiptPDF(currentReceiptResident);
            } else {
                window.print();
            }
        });
    }

    if (btnWaReceipt) {
        btnWaReceipt.addEventListener("click", () => {
            if (currentReceiptResident) {
                closeReceiptModal();
                sendReceiptPdfToWhatsApp(currentReceiptResident);
            }
        });
    }

    if (btnDownload) {
        btnDownload.addEventListener("click", () => {
            if (currentReceiptResident) {
                downloadReceiptImage(currentReceiptResident);
            }
        });
    }
}
