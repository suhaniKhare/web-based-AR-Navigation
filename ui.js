/**
 * ui.js
 * Premium visual overlay manager and micro-interactions script.
 * Orchestrates entry animations, active button states, and seamless landing-to-AR view transition phases.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("SGSITS premium UI subsystem initialized.");

    const landingPage = document.getElementById('landing-page');
    const startBtn = document.getElementById('start-ar-btn');

    if (landingPage) {
        // Trigger subtle smooth entry transitions once fully loaded
        requestAnimationFrame(() => {
            landingPage.classList.add('active');
        });
    }

    if (startBtn) {
        // Add premium click effect and loading state feedback
        startBtn.addEventListener('click', () => {
            startBtn.classList.add('loading');
            // startBtn.disabled = true;
            startBtn.innerHTML = `
                <span class="spinner"></span> Calibrating Sensors...
            `;
        });
    }
});
