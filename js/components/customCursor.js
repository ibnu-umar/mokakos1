/* =========================================
   MOKA KOST — Luxury Animated Cursor Component
   Features:
   - High precision central follower dot
   - Smooth spring-interpolated trailing ring
   - Ambient illumination spotlight glow (matches theme)
   - Canvas particle trail on velocity & sparkling shockwaves on click
   - Context-aware hover transformations (buttons, text inputs, cards)
   - Magnetic micro-snapping on interactive controls
   - Dynamic real-time theme palette synchronization
   - Native cursor graceful fallback & touch device safety
   - LocalStorage persistence & dock toggle integration
   ========================================= */

import { showToast } from "../utils/toast.js";

const STORAGE_KEY = "mokakos_cursor_enabled";

let isInitialized = false;
let isEnabled = true;

// DOM Elements
let containerEl = null;
let dotEl = null;
let ringEl = null;
let glowEl = null;
let canvasEl = null;
let ctx = null;

// Coordinates & Motion Physics
let mouseX = -100;
let mouseY = -100;
let prevMouseX = -100;
let prevMouseY = -100;
let ringX = -100;
let ringY = -100;
let glowX = -100;
let glowY = -100;

// Magnetic target coordinates
let targetRingX = -100;
let targetRingY = -100;
let isMagnetic = false;

// States
let isHovering = false;
let isText = false;
let isClicking = false;
let isHidden = true;
let isIdle = false;
let idleTimer = null;
let animationFrameId = null;

// Dynamic Theme Colors
let themeColors = {
    brand: "#c8956c",
    brandLight: "#e0b590",
    brandGlow: "rgba(200, 149, 108, 0.25)",
    rgb: { r: 200, g: 149, b: 108 }
};

// Canvas Particle Pools
const particles = [];
const shockwaves = [];
const MAX_PARTICLES = 60;

/**
 * Parse CSS color strings into RGB components
 */
function hexOrRgbToRgb(colorStr) {
    if (!colorStr) return { r: 200, g: 149, b: 108 };
    colorStr = colorStr.trim();

    if (colorStr.startsWith("#")) {
        let hex = colorStr.slice(1);
        if (hex.length === 3) {
            hex = hex.split("").map(c => c + c).join("");
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10)
        };
    }

    return { r: 200, g: 149, b: 108 };
}

/**
 * Synchronize colors with current active CSS theme
 */
function updateThemeColors() {
    const rootStyle = getComputedStyle(document.documentElement);
    const brand = rootStyle.getPropertyValue("--clr-brand").trim() || "#c8956c";
    const brandLight = rootStyle.getPropertyValue("--clr-brand-light").trim() || "#e0b590";
    const brandGlow = rootStyle.getPropertyValue("--clr-brand-glow").trim() || "rgba(200, 149, 108, 0.25)";

    themeColors.brand = brand;
    themeColors.brandLight = brandLight;
    themeColors.brandGlow = brandGlow;
    themeColors.rgb = hexOrRgbToRgb(brand);
}

/**
 * Check if current device supports precise pointer and hover
 */
function isPrecisionPointerDevice() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Handle Canvas Resize
 */
function handleResize() {
    if (!canvasEl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasEl.width = window.innerWidth * dpr;
    canvasEl.height = window.innerHeight * dpr;
    if (ctx) {
        ctx.scale(dpr, dpr);
    }
}

/**
 * Spawn sparkle burst and shockwave on click
 */
function createClickParticles(x, y) {
    if (!isEnabled || isHidden) return;

    // Shockwave ripple
    shockwaves.push({
        x,
        y,
        radius: 4,
        maxRadius: 28,
        alpha: 0.7,
        lineWidth: 1.5
    });

    // Particle burst
    const count = 8;
    for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();

        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 2.8 + 1.5;
        const size = Math.random() * 2.4 + 1.2;

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.025,
            size,
            shrink: 0.96,
            sparkle: Math.random() > 0.4
        });
    }
}

/**
 * Spawn light trail wake when moving swiftly
 */
function createTrailParticle(x, y, speed) {
    if (!isEnabled || isHidden || particles.length >= MAX_PARTICLES) return;
    if (speed < 7) return;

    const angle = Math.random() * Math.PI * 2;
    const drift = Math.random() * 1.5;

    particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * drift,
        vy: Math.sin(angle) * drift,
        alpha: 0.7,
        decay: 0.045,
        size: Math.random() * 2.2 + 1.2,
        shrink: 0.95,
        sparkle: Math.random() > 0.6
    });
}

/**
 * Physics & Render loop
 */
function renderLoop() {
    if (!isEnabled) return;

    // Smooth Lerp physics for Outer Ring (lower = silkier trail)
    const lerpFactor = isMagnetic ? 0.18 : 0.1;
    ringX += (targetRingX - ringX) * lerpFactor;
    ringY += (targetRingY - ringY) * lerpFactor;

    // Gentle Lerp for ambient glow aura (0.08 = floating ambient delay)
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;

    // Apply transforms
    if (ringEl) {
        ringEl.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    }
    if (glowEl) {
        glowEl.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
    }

    // Render Canvas Particles & Shockwaves
    if (ctx && canvasEl) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const { r, g, b } = themeColors.rgb;

        // Render Shockwaves
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            const sw = shockwaves[i];
            sw.radius += (sw.maxRadius - sw.radius) * 0.16;
            sw.alpha -= 0.04;

            if (sw.alpha <= 0.01 || sw.radius >= sw.maxRadius - 1) {
                shockwaves.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, sw.alpha)})`;
            ctx.lineWidth = sw.lineWidth;
            ctx.stroke();
        }

        // Render Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.vy += 0.06; // subtle gravity
            p.alpha -= p.decay;
            p.size *= p.shrink;

            if (p.alpha <= 0.02 || p.size <= 0.4) {
                particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            const displayAlpha = p.sparkle ? p.alpha * (0.8 + Math.random() * 0.4) : p.alpha;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, displayAlpha))})`;
            ctx.shadowColor = themeColors.brandLight;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        }
    }

    animationFrameId = requestAnimationFrame(renderLoop);
}

/**
 * Handle Mouse Movement
 */
function handleMouseMove(e) {
    if (!isEnabled) return;

    mouseX = e.clientX;
    mouseY = e.clientY;

    if (isHidden) {
        isHidden = false;
        containerEl?.classList.remove("is-hidden");
    }

    // Direct 1:1 hardware-accelerated tracking for center dot
    if (dotEl) {
        dotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    }

    // Default target for follower ring
    if (!isMagnetic) {
        targetRingX = mouseX;
        targetRingY = mouseY;
    }

    // Wake Trail Calculation
    if (prevMouseX !== -100) {
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        createTrailParticle(mouseX, mouseY, speed);
    }
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // Reset Idle Timer
    if (isIdle) {
        isIdle = false;
        containerEl?.classList.remove("is-idle");
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        isIdle = true;
        containerEl?.classList.add("is-idle");
    }, 3500);
}

/**
 * Interactive Element Detection (Delegated)
 */
function handleMouseOver(e) {
    if (!isEnabled) return;

    const target = e.target;
    if (!target) return;

    // Check for Text Fields
    const textTarget = target.closest("input[type='text'], input[type='number'], input[type='search'], input[type='tel'], input[type='email'], textarea, [contenteditable='true']");
    if (textTarget) {
        isText = true;
        isHovering = false;
        isMagnetic = false;
        containerEl?.classList.add("is-text");
        containerEl?.classList.remove("is-hovering");
        return;
    }

    // Check for Interactive Clickable Elements
    const interactiveTarget = target.closest(
        "button, a, .btn, .nav-tab, .theme-switcher-btn, .theme-switcher-toggle, .theme-switcher-tool-btn, .clickable, .card, .resident-card, .badge, .status-badge, .filter-chip, select, label, [role='button'], .stat-card, tr.resident-row"
    );

    if (interactiveTarget) {
        isHovering = true;
        isText = false;
        containerEl?.classList.remove("is-text");
        containerEl?.classList.add("is-hovering");

        // Magnetic Attraction on compact buttons & icons
        const rect = interactiveTarget.getBoundingClientRect();
        const isSmallButton = rect.width <= 140 && rect.height <= 60;

        if (isSmallButton) {
            isMagnetic = true;
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            // Magnetic pull formula (blend 60% button center, 40% mouse)
            targetRingX = centerX * 0.6 + mouseX * 0.4;
            targetRingY = centerY * 0.6 + mouseY * 0.4;
        } else {
            isMagnetic = false;
            targetRingX = mouseX;
            targetRingY = mouseY;
        }
    } else {
        resetHoverState();
    }
}

function resetHoverState() {
    isHovering = false;
    isText = false;
    isMagnetic = false;
    targetRingX = mouseX;
    targetRingY = mouseY;
    containerEl?.classList.remove("is-hovering", "is-text");
}

function handleMouseDown(e) {
    if (!isEnabled) return;
    isClicking = true;
    containerEl?.classList.add("is-active");
    createClickParticles(e.clientX, e.clientY);
}

function handleMouseUp() {
    if (!isEnabled) return;
    isClicking = false;
    containerEl?.classList.remove("is-active");
}

function handleMouseLeave() {
    isHidden = true;
    containerEl?.classList.add("is-hidden");
}

function handleMouseEnter(e) {
    isHidden = false;
    containerEl?.classList.remove("is-hidden");
    mouseX = e.clientX;
    mouseY = e.clientY;
    targetRingX = mouseX;
    targetRingY = mouseY;
    ringX = mouseX;
    ringY = mouseY;
    glowX = mouseX;
    glowY = mouseY;
}

/**
 * Setup DOM Nodes for Cursor
 */
function createCursorDOM() {
    if (document.getElementById("mokaCursorContainer")) return;

    containerEl = document.createElement("div");
    containerEl.id = "mokaCursorContainer";
    containerEl.className = "moka-cursor-container is-hidden";
    containerEl.setAttribute("aria-hidden", "true");

    containerEl.innerHTML = `
        <div id="mokaCursorGlow" class="moka-cursor-glow"></div>
        <div id="mokaCursorRing" class="moka-cursor-ring">
            <div class="moka-cursor-ring-inner"></div>
        </div>
        <div id="mokaCursorDot" class="moka-cursor-dot"></div>
        <canvas id="mokaCursorCanvas" class="moka-cursor-canvas"></canvas>
    `;

    document.body.appendChild(containerEl);

    dotEl = containerEl.querySelector("#mokaCursorDot");
    ringEl = containerEl.querySelector("#mokaCursorRing");
    glowEl = containerEl.querySelector("#mokaCursorGlow");
    canvasEl = containerEl.querySelector("#mokaCursorCanvas");

    if (canvasEl) {
        ctx = canvasEl.getContext("2d");
        handleResize();
    }
}

/**
 * Enable or Disable Cursor Animation
 */
export function setCursorEnabled(enabled, notify = false) {
    isEnabled = !!enabled;
    try {
        localStorage.setItem(STORAGE_KEY, isEnabled ? "true" : "false");
    } catch (e) {}

    // Update body class for system cursor hiding
    if (isEnabled && isPrecisionPointerDevice()) {
        document.body.classList.add("moka-custom-cursor-enabled");
        if (containerEl) {
            containerEl.style.display = "block";
            handleResize();
        }
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(renderLoop);
        }
    } else {
        document.body.classList.remove("moka-custom-cursor-enabled");
        if (containerEl) {
            containerEl.style.display = "none";
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // Update toggle button active indicator if present in UI
    const toggleBtn = document.getElementById("cursorEffectToggle");
    if (toggleBtn) {
        toggleBtn.classList.toggle("active", isEnabled);
        toggleBtn.setAttribute("aria-pressed", isEnabled ? "true" : "false");
        toggleBtn.setAttribute("title", isEnabled ? "Efek Animasi Kursor: Aktif (Klik untuk matikan)" : "Efek Animasi Kursor: Nonaktif (Klik untuk hidupkan)");
    }

    if (notify) {
        showToast(
            "Efek Kursor",
            isEnabled ? "Animasi kursor mewah diaktifkan ✨" : "Animasi kursor dinonaktifkan",
            isEnabled ? "success" : "info"
        );
    }
}

/**
 * Toggle Cursor State
 */
export function toggleCursor() {
    setCursorEnabled(!isEnabled, true);
}

/**
 * Get current cursor state
 */
export function getCursorState() {
    return isEnabled;
}

/**
 * Initialize Animated Cursor Component
 */
export function initCustomCursor() {
    if (isInitialized) return;
    isInitialized = true;

    // Safety check for coarse/touch screen devices
    if (!isPrecisionPointerDevice()) {
        console.info("[Moka Kost] Touchscreen/mobile device detected; custom cursor skipped for optimal touch UX.");
        return;
    }

    // Read stored user preference
    let savedPref = true;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            savedPref = stored === "true";
        }
    } catch (e) {}

    createCursorDOM();
    updateThemeColors();

    // Listen to theme changes to dynamically sync palette
    const themeObserver = new MutationObserver(() => {
        updateThemeColors();
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });

    // Event Listeners
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget) {
            handleMouseLeave();
        }
    }, { passive: true });
    document.addEventListener("mousedown", handleMouseDown, { passive: true });
    document.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true });

    // Activate according to preference
    setCursorEnabled(savedPref, false);
}
