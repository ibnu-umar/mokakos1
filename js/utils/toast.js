/* =========================================
   MOKA KOST — Toast Notification Utility
   ========================================= */

/**
 * Show a floating toast notification
 * @param {string} title 
 * @param {string} message 
 * @param {'success'|'warning'|'info'|'danger'} type 
 */
export function showToast(title, message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
        </div>
        <div class="toast-body">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add("show");
        });
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
