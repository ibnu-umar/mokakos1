/* =========================================
   MOKA KOST — PDF & Print Receipt Generator
   ========================================= */

import { formatCurrency, formatDate } from "./formatters.js";
import { showToast } from "./toast.js";

/**
 * Generates the unified, authentic HTML string for the receipt
 * @param {Object} r - Resident object
 * @returns {string}
 */
export function createReceiptHTML(r) {
    return `
        <div style="text-align: center; margin-bottom: 14px;">
            <img src="logo.jpg" alt="Moka Kost" style="width: 52px; height: 52px; border-radius: 8px; object-fit: cover; margin-bottom: 6px; display: inline-block;">
            <div style="font-size: 19px; font-weight: 800; color: #a06a3a; letter-spacing: -0.3px; line-height: 1.2;">MOKA KOST</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Bukti Pembayaran Kost</div>
            <div style="display: inline-block; font-family: monospace; font-size: 11px; background: #f8fafc; color: #475569; padding: 3px 12px; border-radius: 20px; margin-top: 6px; font-weight: 700; border: 1px solid #e2e8f0;">
                No. Kuitansi: #${r.id}
            </div>
        </div>

        <div style="border-top: 1.5px dashed #cbd5e1; margin: 14px 0;"></div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; line-height: 1.5;">
            <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b; width: 42%;">Nama Penghuni</td>
                    <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${r.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Kamar</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${r.room}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">No. Telepon</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${r.phone}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Periode</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${r.period}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Tanggal Bayar</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${formatDate(r.paidDate)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Metode Pembayaran</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${r.method || 'Transfer BCA'}</td>
                </tr>
            </tbody>
        </table>

        <div style="border-top: 1.5px dashed #cbd5e1; margin: 14px 0;"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0 8px;">
            <span style="font-size: 13.5px; font-weight: 700; color: #1e293b;">Total Pembayaran</span>
            <span style="font-size: 18px; font-weight: 800; color: #a06a3a;">${formatCurrency(r.amount)}</span>
        </div>

        <div style="text-align: center; margin: 12px 0 14px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 22px; background: #ecfdf5; border: 1.5px solid #10b981; color: #047857; font-weight: 800; font-size: 12.5px; border-radius: 999px; letter-spacing: 0.5px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#047857" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                LUNAS
            </div>
        </div>

        <div style="text-align: center; font-size: 10.5px; color: #94a3b8; line-height: 1.5; margin-top: 14px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            Bukti pembayaran ini sah dan dikeluarkan secara digital.<br>
            Moka Kost — Jl. Harmoni No. 12, Jakarta &bull; 📞 0812-3456-7890<br>
            Dicetak pada: ${formatDate(new Date().toISOString())}
        </div>
    `;
}

/**
 * Creates the official printable DOM element for receipt printing and PDF export
 * @param {Object} r - Resident object
 * @returns {HTMLDivElement}
 */
export function createReceiptPrintableElement(r) {
    const container = document.createElement("div");
    container.id = "printableReceipt";
    container.style.cssText = `
        width: 480px;
        min-width: 480px;
        max-width: 480px;
        margin: 0 auto;
        padding: 24px 28px;
        background: #ffffff;
        color: #1e293b;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        page-break-inside: avoid;
        -webkit-font-smoothing: antialiased;
    `;

    container.innerHTML = createReceiptHTML(r);
    return container;
}

/**
 * Preload images inside an element to ensure html2canvas captures full assets
 * @param {HTMLElement} element 
 * @returns {Promise<void>}
 */
async function preloadImages(element) {
    const images = Array.from(element.querySelectorAll("img"));
    if (images.length === 0) return;

    await Promise.all(
        images.map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Resolve even if error to not block PDF
                // Timeout safety
                setTimeout(resolve, 600);
            });
        })
    );
}

/**
 * Downloads receipt as high-resolution PNG image file
 * @param {Object} r - Resident object
 * @returns {Promise<void>}
 */
export async function downloadReceiptImage(r) {
    showToast("Membuat Gambar Struk...", "Sedang menyiapkan berkas Gambar Bukti Pembayaran.");

    // Create offscreen staging container
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
        position: fixed;
        top: 0;
        left: -9999px;
        width: 480px;
        z-index: -9999;
        opacity: 0;
        pointer-events: none;
    `;

    const element = createReceiptPrintableElement(r);
    wrapper.appendChild(element);
    document.body.appendChild(wrapper);

    // Wait for image assets to decode & load
    await preloadImages(element);

    const filename = `Bukti_Pembayaran_${r.name.replace(/\s+/g, '_')}_${r.period.replace(/\s+/g, '_')}.png`;

    try {
        if (typeof html2canvas !== "undefined") {
            const canvas = await html2canvas(element, {
                scale: 2.5,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            // Trigger direct PNG image download
            const imageURL = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = imageURL;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            wrapper.remove();
            showToast("Gambar Berhasil Diunduh!", `Berkas ${filename} telah tersimpan.`);
        } else {
            wrapper.remove();
            printReceiptPDF(r);
        }
    } catch (err) {
        console.error("Image generation failed:", err);
        wrapper.remove();
        printReceiptPDF(r);
    }
}

/**
 * Downloads receipt as authentic PDF using html2pdf library
 * @param {Object} r - Resident object
 * @returns {Promise<void>}
 */
export async function downloadReceiptPDF(r) {
    return downloadReceiptImage(r);
}

/**
 * Print receipt in dedicated print window
 * @param {Object} r - Resident object
 */
export function printReceiptPDF(r) {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
        window.print();
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bukti Pembayaran — ${r.name} (${r.period})</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                body {
                    margin: 0;
                    padding: 40px 20px;
                    background: #f8fafc;
                    display: flex;
                    justify-content: center;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div style="width: 100%; max-width: 500px;">
                <div class="no-print" style="text-align: right; margin-bottom: 16px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #a06a3a; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                        🖨️ Cetak / Simpan PDF
                    </button>
                </div>
                ${createReceiptPrintableElement(r).outerHTML}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 400);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

/**
 * Generates the authentic HTML string for the invoice
 * @param {Object} inv - Invoice data object
 * @returns {string}
 */
export function createInvoiceHTML(inv) {
    return `
        <div style="text-align: center; margin-bottom: 14px;">
            <img src="logo.jpg" alt="Moka Kost" style="width: 52px; height: 52px; border-radius: 8px; object-fit: cover; margin-bottom: 6px; display: inline-block;">
            <div style="font-size: 19px; font-weight: 800; color: #a06a3a; letter-spacing: -0.3px; line-height: 1.2;">MOKA KOST</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Surat Tagihan Pembayaran Sewa Kost</div>
            <div style="display: inline-block; font-family: monospace; font-size: 11px; background: #f8fafc; color: #475569; padding: 3px 12px; border-radius: 20px; margin-top: 6px; font-weight: 700; border: 1px solid #e2e8f0;">
                No. Tagihan: #${inv.invoiceId}
            </div>
        </div>

        <div style="border-top: 1.5px dashed #cbd5e1; margin: 14px 0;"></div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; line-height: 1.5;">
            <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b; width: 42%;">Nama Penghuni</td>
                    <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${inv.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Kamar</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${inv.room}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">No. Telepon</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${inv.phone}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Periode Tagihan</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${inv.period}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Jatuh Tempo</td>
                    <td style="padding: 8px 0; font-weight: 700; color: #dc2626; text-align: right;">${formatDate(inv.dueDate)}</td>
                </tr>
            </tbody>
        </table>

        <div style="border-top: 1.5px dashed #cbd5e1; margin: 14px 0;"></div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; line-height: 1.5;">
            <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px 0; color: #64748b;">Biaya Sewa Pokok</td>
                    <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${formatCurrency(inv.amount)}</td>
                </tr>
                ${inv.extra > 0 ? `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px 0; color: #64748b;">${inv.extraNote || 'Biaya Tambahan'}</td>
                    <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${formatCurrency(inv.extra)}</td>
                </tr>
                ` : ''}
            </tbody>
        </table>

        <div style="border-top: 1.5px dashed #cbd5e1; margin: 14px 0;"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0 8px;">
            <span style="font-size: 13.5px; font-weight: 700; color: #1e293b;">Total Tagihan</span>
            <span style="font-size: 18px; font-weight: 800; color: #a06a3a;">${formatCurrency(inv.total)}</span>
        </div>

        <div style="text-align: center; margin: 12px 0 14px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 20px; background: #fffbeb; border: 1.5px solid #f59e0b; color: #b45309; font-weight: 800; font-size: 12px; border-radius: 999px; letter-spacing: 0.5px;">
                MENUNGGU PEMBAYARAN
            </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 11.5px; color: #334155; line-height: 1.6; margin-top: 10px; text-align: left;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 3px;">💳 Rekening Pembayaran:</div>
            <div>• BCA: <strong>8830-123-456</strong> (a/n Moka Kost)</div>
            <div>• Mandiri: <strong>137-00-1234567-8</strong> (a/n Moka Kost)</div>
            ${inv.notes ? `<div style="margin-top: 6px; font-style: italic; color: #64748b;"><strong>Catatan:</strong> ${inv.notes}</div>` : ''}
        </div>

        <div style="text-align: center; font-size: 10.5px; color: #94a3b8; line-height: 1.5; margin-top: 14px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            Surat tagihan ini diterbitkan secara digital oleh Moka Kost.<br>
            Moka Kost — Jl. Harmoni No. 12, Jakarta &bull; 📞 0812-3456-7890<br>
            Diterbitkan pada: ${formatDate(new Date().toISOString())}
        </div>
    `;
}

/**
 * Creates the official printable DOM element for invoice image export
 * @param {Object} inv - Invoice data object
 * @returns {HTMLDivElement}
 */
export function createInvoicePrintableElement(inv) {
    const container = document.createElement("div");
    container.id = "printableInvoice";
    container.style.cssText = `
        width: 480px;
        min-width: 480px;
        max-width: 480px;
        margin: 0 auto;
        padding: 24px 28px;
        background: #ffffff;
        color: #1e293b;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        page-break-inside: avoid;
        -webkit-font-smoothing: antialiased;
    `;

    container.innerHTML = createInvoiceHTML(inv);
    return container;
}

/**
 * Generates an authentic image File object for an invoice
 * @param {Object} inv - Invoice data object
 * @returns {Promise<{ file: File, blob: Blob, dataUrl: string, filename: string }>}
 */
export async function generateInvoiceImageFile(inv) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
        position: fixed;
        top: 0;
        left: -9999px;
        width: 480px;
        z-index: -9999;
        opacity: 0;
        pointer-events: none;
    `;

    const element = createInvoicePrintableElement(inv);
    wrapper.appendChild(element);
    document.body.appendChild(wrapper);

    await preloadImages(element);

    const safeName = (inv.name || "Penghuni").replace(/\s+/g, '_');
    const safePeriod = (inv.period || "Tagihan").replace(/\s+/g, '_');
    const filename = `Tagihan_${safeName}_${safePeriod}.png`;

    try {
        if (typeof html2canvas !== "undefined") {
            const canvas = await html2canvas(element, {
                scale: 2.5,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            wrapper.remove();

            const blob = await new Promise((resolve) => {
                canvas.toBlob((b) => resolve(b), "image/png");
            });

            if (!blob) throw new Error("Gagal membuat blob gambar tagihan.");

            const file = new File([blob], filename, { type: "image/png" });
            const dataUrl = canvas.toDataURL("image/png");

            return { file, blob, dataUrl, filename };
        } else {
            wrapper.remove();
            throw new Error("Library html2canvas tidak tersedia.");
        }
    } catch (err) {
        wrapper.remove();
        throw err;
    }
}

/**
 * Downloads invoice as high-resolution PNG image file
 * @param {Object} inv - Invoice data object
 * @returns {Promise<void>}
 */
export async function downloadInvoiceImage(inv) {
    showToast("Membuat Gambar Tagihan...", "Sedang menyiapkan berkas Surat Tagihan.");
    try {
        const { dataUrl, filename } = await generateInvoiceImageFile(inv);
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast("Gambar Tagihan Diunduh!", `Berkas ${filename} telah tersimpan.`);
    } catch (err) {
        console.error("Gagal mengunduh gambar tagihan:", err);
        showToast("Gagal Mengunduh", "Terjadi kesalahan saat memproses gambar tagihan.", "danger");
    }
}

