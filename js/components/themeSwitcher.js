/* =========================================
   MOKA KOST — Bottom Theme Switcher Component (Ultra Smooth Edition)
   ========================================= */

import { toggleCursor, getCursorState } from "./customCursor.js";

const THEME_KEY = "mokakos_theme";

export const THEMES = [
    {
        id: "dark",
        name: "Espresso",
        desc: "Dark Warm (Default)",
        accent: "#c8956c",
        bgPreview: "#0f0f14",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    },
    {
        id: "light",
        name: "Latte",
        desc: "Clean Light",
        accent: "#b3733d",
        bgPreview: "#f8f6f0",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    },
    {
        id: "midnight",
        name: "Midnight",
        desc: "Deep Indigo",
        accent: "#6366f1",
        bgPreview: "#090c15",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>`
    },
    {
        id: "emerald",
        name: "Matcha",
        desc: "Emerald Forest",
        accent: "#10b981",
        bgPreview: "#07120c",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`
    }
];

let transitionTimeout = null;

/**
 * Trigger smooth global theme transition class on root
 */
function triggerSmoothTransition() {
    const docEl = document.documentElement;
    docEl.classList.add("theme-transitioning");

    if (transitionTimeout) clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
        docEl.classList.remove("theme-transitioning");
    }, 450);
}

/**
 * Get current saved theme or default to "dark"
 */
export function getCurrentTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved && THEMES.some(t => t.id === saved)) {
            return saved;
        }
    } catch (e) {
        console.warn("Could not read theme from localStorage", e);
    }
    return "dark";
}

/**
 * Update the sliding active glider indicator position
 */
export function updateGliderPosition(animate = true) {
    const optionsContainer = document.querySelector(".theme-switcher-options");
    const glider = document.querySelector(".theme-slider-glider");
    const activeBtn = document.querySelector(".theme-switcher-btn.active");

    if (!optionsContainer || !glider || !activeBtn) return;

    const optRect = optionsContainer.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    const left = btnRect.left - optRect.left;
    const width = btnRect.width;

    if (!animate) {
        glider.style.transition = "none";
    } else {
        glider.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease";
    }

    glider.style.transform = `translateX(${left}px)`;
    glider.style.width = `${width}px`;
    glider.style.opacity = "1";
}

/**
 * Apply theme to document element and persist in localStorage
 */
export function setTheme(themeId, animate = true) {
    if (!THEMES.some(t => t.id === themeId)) {
        themeId = "dark";
    }

    if (animate) {
        triggerSmoothTransition();
    }

    document.documentElement.setAttribute("data-theme", themeId);
    
    // Save to localStorage
    try {
        localStorage.setItem(THEME_KEY, themeId);
    } catch (e) {
        console.warn("Could not save theme to localStorage", e);
    }

    // Update active state in bottom switcher buttons
    updateSwitcherUI(themeId, animate);
}

/**
 * Update UI buttons active state and position
 */
function updateSwitcherUI(activeThemeId, animate = true) {
    const buttons = document.querySelectorAll(".theme-switcher-btn");
    buttons.forEach(btn => {
        const tid = btn.dataset.themeId;
        if (tid === activeThemeId) {
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");
        } else {
            btn.classList.remove("active");
            btn.setAttribute("aria-pressed", "false");
        }
    });

    const activeTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
    const currentLabel = document.getElementById("themeCurrentLabel");
    if (currentLabel) {
        currentLabel.textContent = activeTheme.name;
    }

    // Update glider position
    requestAnimationFrame(() => {
        updateGliderPosition(animate);
    });
}

/**
 * Render and initialize the bottom Theme Switcher
 */
export function initThemeSwitcher() {
    const initialTheme = getCurrentTheme();
    document.documentElement.setAttribute("data-theme", initialTheme);

    // Locate or create bottom container
    let container = document.getElementById("themeSwitcherDock");
    if (!container) {
        container = document.createElement("aside");
        container.id = "themeSwitcherDock";
        container.className = "theme-switcher-dock";
        container.setAttribute("aria-label", "Theme Switcher");
        document.body.appendChild(container);
    }

    // Build buttons HTML
    const buttonsHtml = THEMES.map(t => `
        <button 
            type="button" 
            class="theme-switcher-btn ${t.id === initialTheme ? "active" : ""}" 
            data-theme-id="${t.id}"
            title="${t.name} (${t.desc})"
            aria-label="Ubah tema ke ${t.name}"
            aria-pressed="${t.id === initialTheme ? "true" : "false"}"
        >
            <span class="theme-icon">${t.icon}</span>
            <span class="theme-name">${t.name}</span>
            <span class="theme-dot" style="background-color: ${t.accent};"></span>
        </button>
    `).join("");

    container.innerHTML = `
        <div class="theme-switcher-inner" id="themeSwitcherInner">
            <div class="theme-switcher-header" id="themeSwitcherHeader" role="button" tabindex="0" title="Klik untuk membuka/menutup tema">
                <span class="theme-switcher-title">
                    <svg class="theme-brand-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2"/>
                        <path d="M12 20v2"/>
                        <path d="m4.93 4.93 1.41 1.41"/>
                        <path d="m17.66 17.66 1.41 1.41"/>
                        <path d="M2 12h2"/>
                        <path d="M20 12h2"/>
                        <path d="m6.34 17.66-1.41 1.41"/>
                        <path d="m19.07 4.93-1.41 1.41"/>
                    </svg>
                    Tema
                </span>
                <span class="theme-current-badge" id="themeCurrentLabel">${(THEMES.find(t => t.id === initialTheme) || THEMES[0]).name}</span>
            </div>
            <div class="theme-switcher-options-wrapper" id="themeOptionsWrapper">
                <div class="theme-switcher-options" role="group" aria-label="Pilihan Tema">
                    <div class="theme-slider-glider" aria-hidden="true"></div>
                    ${buttonsHtml}
                </div>
            </div>
            <button type="button" class="theme-switcher-tool-btn ${getCursorState() ? "active" : ""}" id="cursorEffectToggle" title="${getCursorState() ? "Animasi Kursor: Aktif (Klik untuk matikan)" : "Animasi Kursor: Nonaktif (Klik untuk hidupkan)"}" aria-label="Toggle efek animasi kursor" aria-pressed="${getCursorState() ? "true" : "false"}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
            </button>
            <button type="button" class="theme-switcher-toggle" id="themeSwitcherToggle" title="Sembunyikan / Buka Tema" aria-label="Toggle tema switcher" aria-expanded="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        </div>
    `;

    // Button interactions
    container.querySelectorAll(".theme-switcher-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const themeId = btn.dataset.themeId;
            setTheme(themeId, true);

            // Add smooth ripple feedback
            createClickPulse(btn, e);
        });
    });

    // Cursor effect toggle interaction
    const cursorToggleBtn = container.querySelector("#cursorEffectToggle");
    if (cursorToggleBtn) {
        cursorToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleCursor();
        });
    }

    // Toggle collapse/expand interactions
    const toggleBtn = container.querySelector("#themeSwitcherToggle");
    const headerBtn = container.querySelector("#themeSwitcherHeader");

    const toggleDock = () => {
        const isCollapsed = container.classList.toggle("collapsed");
        toggleBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        if (!isCollapsed) {
            setTimeout(() => updateGliderPosition(false), 200);
        }
    };

    if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleDock();
        });
    }

    if (headerBtn) {
        headerBtn.addEventListener("click", () => {
            if (container.classList.contains("collapsed")) {
                toggleDock();
            }
        });
        headerBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleDock();
            }
        });
    }

    // Set initial position without animation delay
    setTimeout(() => {
        updateGliderPosition(false);
    }, 50);

    // Re-adjust glider on window resize
    window.addEventListener("resize", () => {
        updateGliderPosition(false);
    });
}

/**
 * Click micro-animation pulse
 */
function createClickPulse(element, event) {
    element.classList.remove("theme-btn-pulse");
    void element.offsetWidth; // trigger reflow
    element.classList.add("theme-btn-pulse");
    setTimeout(() => {
        element.classList.remove("theme-btn-pulse");
    }, 400);
}
