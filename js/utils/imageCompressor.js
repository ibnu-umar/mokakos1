/* =========================================
   MOKA KOST — Image Compression Utility
   ========================================= */

/**
 * Compress an image File and convert to Base64 data URL
 * @param {File} file - Image file from file input or drag-and-drop
 * @param {number} maxWidth - Maximum width in pixels (default 1200)
 * @param {number} quality - JPEG compression quality 0-1 (default 0.82)
 * @returns {Promise<string>} Base64 data URL
 */
export function compressImageToBase64(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith("image/")) {
            return reject(new Error("Berkas harus berupa gambar (JPG, PNG, WebP)"));
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const elem = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = elem.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(new Error("Gagal membaca berkas gambar"));
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Format bytes into human readable string (KB / MB)
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
