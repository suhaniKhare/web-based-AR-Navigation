/**
 * ui.js
 * Manages the premium landing page, animated transitions, loading/calibration screens,
 * responsive panels, and overlays for the SGSITS Smart AR Navigation System.
 */

class UIOrchestrator {
    constructor() {
        this.landingOverlay = null;
        this.calibrationOverlay = null;
        this.selectedDestinationId = "";

        // Hijack immediately during script execution so it overrides app.js before DOMContentLoaded
        this.hijackPermissionSetup();
    }

    /**
     * Hijacks the app.js permission handler to load the custom landing page instead.
     */
    hijackPermissionSetup() {
        if (window.setupPermissionOverlay) {
            console.log("Hijacking setupPermissionOverlay with premium SGSITS landing UI.");
            window.setupPermissionOverlay = () => {
                this.renderLandingPage();
            };
        }
    }

    /**
     * Renders the modern, clean campus-themed landing page.
     */
    renderLandingPage() {
        // Prevent duplicate landing overlays
        if (document.getElementById('sgsits-landing-overlay')) return;

        this.landingOverlay = document.createElement('div');
        this.landingOverlay.id = 'sgsits-landing-overlay';
        this.landingOverlay.className = 'landing-portal';

        // Inner HTML with SGSITS Logo, welcoming details, dropdown, and scan buttons
        this.landingOverlay.innerHTML = `
            <div class="landing-card glassmorphic-card">
                <!-- College Logo Center -->
                <div class="logo-wrapper">
                    <img src="https://upload.wikimedia.org/wikipedia/en/c/c5/Sgsits_logo.png" 
                         alt="SGSITS Logo" 
                         class="college-logo"
                         onerror="this.src='https://logo.clearbit.com/sgsits.ac.in';">
                </div>

                <!-- Animated Welcome Header -->
                <div class="welcome-header">
                    <span class="badge-title">ESTD. 1952</span>
                    <h1 class="portal-title">SGSITS Smart AR Navigation</h1>
                    <p class="portal-subtitle">Navigate your campus smartly with real-time augmented reality guidance.</p>
                </div>

                <!-- Action Dropdown Card -->
                <div class="action-card">
                    <label for="landing-destination-selector" class="input-label">Choose Campus Building</label>
                    <div class="select-wrapper">
                        <select id="landing-destination-selector">
                            <option value="">Select Destination...</option>
                        </select>
                        <div class="select-arrow">
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                    </div>

                    <button id="start-nav-portal-btn" class="ui-btn ui-btn-primary">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Start Navigation
                    </button>
                </div>

                <!-- Secondary Actions -->
                <div class="secondary-actions">
                    <button id="landing-qr-btn" class="ui-btn ui-btn-secondary">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5.01 16H5a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1H5.01zM16 12h2a1 1 0 001-1V9a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                        </svg>
                        Scan QR Code
                    </button>
                </div>
            </div>

            <!-- College info footer -->
            <footer class="portal-footer">
                Shri Govindram Seksaria Institute of Technology and Science, Indore
            </footer>
        `;

        document.body.appendChild(this.landingOverlay);

        // Populate destination dropdown inside the landing card
        this.populateLandingDropdown();

        // Add event listeners
        document.getElementById('start-nav-portal-btn').addEventListener('click', () => {
            this.handleStartNavigation();
        });

        document.getElementById('landing-qr-btn').addEventListener('click', () => {
            this.showQRModal();
        });

        // Sync landing dropdown with actual dropdown selector
        const landingSelector = document.getElementById('landing-destination-selector');
        landingSelector.addEventListener('change', (e) => {
            this.selectedDestinationId = e.target.value;
            const mainSelector = document.getElementById('destination-selector');
            if (mainSelector) {
                mainSelector.value = this.selectedDestinationId;
            }
        });
    }

    /**
     * Populates the landing dropdown options from the campus graph.
     */
    populateLandingDropdown() {
        const landingSelector = document.getElementById('landing-destination-selector');
        if (!landingSelector || !window.campusGraph) return;

        // Sort named building nodes alphabetically
        const sortedNodes = Array.from(window.campusGraph.nodes.values())
            .filter(node => node.id !== node.name)
            .sort((a, b) => a.name.localeCompare(b.name));

        sortedNodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = node.name;
            landingSelector.appendChild(option);
        });
    }

    /**
     * Triggers permission requests and displays calibration details.
     */
    async handleStartNavigation() {
        if (!this.selectedDestinationId) {
            alert("Please select a destination campus building first!");
            return;
        }

        // Show loading/calibration indicator
        this.showCalibrationScreen();

        try {
            // Activate camera stream
            const cameraStarted = await window.initCamera();
            if (!cameraStarted) {
                this.removeCalibrationScreen();
                alert("Camera access is mandatory for AR view. Please enable it in permissions and retry.");
                return;
            }

            // Start orienting compass tracking
            const compassStarted = await window.orientationTracker.startTracking((heading) => {
                window.currentAzimuth = heading;
                if (window.drawAROverlay) window.drawAROverlay();
            });

            // Start High-Accuracy location coordinates polling
            window.locationTracker.startTracking(window.handleLocationUpdate, window.handleLocationError);

            // Animate transition, tear down portals, and fire navigation route engine
            setTimeout(() => {
                this.removeCalibrationScreen();
                if (this.landingOverlay) {
                    this.landingOverlay.classList.add('portal-fade-out');
                    setTimeout(() => {
                        if (this.landingOverlay.parentNode) {
                            this.landingOverlay.parentNode.removeChild(this.landingOverlay);
                        }
                    }, 500);
                }

                // Show top HUD floating container
                const hud = document.querySelector('.hud-container');
                if (hud) hud.style.display = 'flex';

                // Render first arrows
                requestAnimationFrame(window.renderLoop);

                // Run main navigator route calculator
                window.triggerNavigation(this.selectedDestinationId);

                // Setup Exit Button inside Navigation screen
                this.setupNavigationExitButton();
            }, 1200);

        } catch (err) {
            console.error("Sensor initialization crash:", err);
            this.removeCalibrationScreen();
            alert("Could not calibrate sensors. Check device permissions.");
        }
    }

    /**
     * Renders a glowing full-screen calibration screen.
     */
    showCalibrationScreen() {
        this.calibrationOverlay = document.createElement('div');
        this.calibrationOverlay.className = 'calibration-overlay';
        this.calibrationOverlay.innerHTML = `
            <div class="calibration-card">
                <div class="pulse-loader">
                    <div class="pulse-ring"></div>
                    <div class="pulse-center">📍</div>
                </div>
                <h3 class="calibration-title">Calibrating Sensors</h3>
                <p class="calibration-subtitle">Securing GPS coordinates and calibrating compass heading...</p>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill"></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.calibrationOverlay);
    }

    removeCalibrationScreen() {
        if (this.calibrationOverlay && this.calibrationOverlay.parentNode) {
            this.calibrationOverlay.parentNode.removeChild(this.calibrationOverlay);
            this.calibrationOverlay = null;
        }
    }

    /**
     * Shows instructions to scan QR code.
     */
    showQRModal() {
        const modal = document.createElement('div');
        modal.className = 'ui-modal-overlay';
        modal.innerHTML = `
            <div class="ui-modal-card glassmorphic-card">
                <h3 class="modal-title">Scan Campus QR Code</h3>
                <p class="modal-subtitle">Point your mobile camera at any QR code placard around the campus to load instant navigation routes.</p>
                <div style="font-size: 60px; margin: 20px 0;">📱🔍</div>
                <button id="close-qr-modal" class="ui-btn ui-btn-primary">Got it</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-qr-modal').addEventListener('click', () => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        });
    }

    /**
     * Setup an elegant way to cancel navigation and return to the landing portal.
     */
    setupNavigationExitButton() {
        // Check if back button already exists in the header
        if (document.getElementById('hud-exit-btn')) return;

        const header = document.querySelector('.header');
        if (!header) return;

        const exitBtn = document.createElement('button');
        exitBtn.id = 'hud-exit-btn';
        exitBtn.className = 'hud-back-btn';
        exitBtn.innerHTML = `
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
        `;

        exitBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to end navigation and return to campus home?")) {
                window.stopActiveNavigation();
                location.reload(); // Reload cleans up WebRTC stream and resets cleanly
            }
        });

        // Insert at the beginning of header
        header.insertBefore(exitBtn, header.firstChild);
    }
}

// Instantiate global orchestrator
window.uiOrchestrator = new UIOrchestrator();
