/* =========================================
   MOKA KOST — Stats Component
   ========================================= */

import { store } from "../state/store.js";
import { formatCurrency, getCurrentDateString } from "../utils/formatters.js";

function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 20));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current;
    }, 40);
}

function animateValue(el, start, end, duration, formatter) {
    if (!el) return;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = Math.round(start + (end - start) * eased);
        el.textContent = formatter(value);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

export function updateStats() {
    const { paidCount, unpaidCount, totalRevenue } = store.getStats();

    animateNumber("paidCount", paidCount);
    animateNumber("unpaidCount", unpaidCount);

    const revenueEl = document.getElementById("totalRevenue");
    if (revenueEl) {
        animateValue(revenueEl, 0, totalRevenue, 800, formatCurrency);
    }
}

export function initStats() {
    const dateEl = document.getElementById("currentDate");
    if (dateEl) {
        dateEl.textContent = getCurrentDateString();
    }
    updateStats();
    store.subscribe(() => updateStats());
}
