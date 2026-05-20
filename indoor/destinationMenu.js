/**
 * destinationMenu.js
 * Renders the interactive selection menus when the user arrives at a building.
 */

class DestinationMenuManager {
    constructor() {
        this.overlay = null;
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('indoor-menu-styles')) return;
        const style = document.createElement('style');
        style.id = 'indoor-menu-styles';
        style.textContent = `
            .indoor-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px);
                display: flex; align-items: center; justify-content: center;
                z-index: 1000; font-family: 'Outfit', sans-serif; padding: 20px;
                box-sizing: border-box;
            }
            .indoor-modal-card {
                background: rgba(30, 41, 59, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px; width: 100%; max-width: 360px;
                padding: 25px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                box-sizing: border-box; text-align: center;
                animation: modal-slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes modal-slide-up {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .indoor-modal-title {
                font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0;
            }
            .indoor-modal-subtitle {
                font-size: 13px; color: #94a3b8; margin: 0 0 25px 0; line-height: 1.4;
            }
            .indoor-btn {
                width: 100%; padding: 12px 16px; border-radius: 12px; border: none;
                font-size: 15px; font-weight: 600; cursor: pointer; margin-bottom: 12px;
                transition: all 0.2s ease; box-sizing: border-box; display: block;
                text-decoration: none; text-align: center;
            }
            .indoor-btn-primary {
                background: #10b981; color: white;
                box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
            }
            .indoor-btn-primary:active { transform: scale(0.98); }
            
            .indoor-btn-secondary {
                background: rgba(255, 255, 255, 0.08); color: white;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .indoor-btn-secondary:active { background: rgba(255, 255, 255, 0.15); }
            
            .indoor-btn-danger {
                background: rgba(239, 68, 68, 0.15); color: #f87171;
                border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 10px;
            }
            .indoor-btn-danger:active { background: rgba(239, 68, 68, 0.25); }
        `;
        document.head.appendChild(style);
    }

    /**
     * Spawns the main transition options dialog.
     * @param {string} buildingId Key ID of arrival building (e.g. ATC)
     * @param {string} buildingName Readable name (e.g. ATC Building)
     */
    showArrivalMenu(buildingId, buildingName) {
        this.closeMenu();

        // Query available options for this specific building
        const directory = window.indoorNavigator.getBuildingDirectory(buildingId);
        if (!directory) {
            console.warn(`No indoor layout registered for building: ${buildingId}`);
            window.indoorNavigator.exitNavigation();
            return;
        }

        this.overlay = document.createElement('div');
        this.overlay.className = 'indoor-modal-overlay';

        const card = document.createElement('div');
        card.className = 'indoor-modal-card';
        card.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 12px;">🏢</div>
            <h3 class="indoor-modal-title">Reached ${buildingName}</h3>
            <p class="indoor-modal-subtitle">Would you like to start indoor room guidance or exit?</p>
            <div id="modal-button-container"></div>
        `;

        this.overlay.appendChild(card);
        document.body.appendChild(this.overlay);

        const container = card.querySelector('#modal-button-container');

        // Dynamically add buttons based on directory metadata configuration
        directory.primaryOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'indoor-btn indoor-btn-primary';
            btn.textContent = opt.label;
            btn.addEventListener('click', () => {
                if (opt.type === 'submenu' && opt.id === 'LABS') {
                    this.showLabSelectionMenu(buildingId, buildingName, directory.labs);
                } else if (opt.type === 'route') {
                    this.closeMenu();
                    window.indoorNavigator.startIndoorRoute(buildingId, opt.id);
                }
            });
            container.appendChild(btn);
        });

        // Add Exit Button
        const exitBtn = document.createElement('button');
        exitBtn.className = 'indoor-btn indoor-btn-danger';
        exitBtn.textContent = 'Exit Navigation';
        exitBtn.addEventListener('click', () => {
            this.closeMenu();
            window.indoorNavigator.exitNavigation();
        });
        container.appendChild(exitBtn);
    }

    /**
     * Overwrites dialog content with sub-menu list of labs.
     */
    showLabSelectionMenu(buildingId, buildingName, labs) {
        const card = this.overlay.querySelector('.indoor-modal-card');
        card.innerHTML = `
            <h3 class="indoor-modal-title">Available Labs</h3>
            <p class="indoor-modal-subtitle">Select a classroom/lab inside ${buildingName}</p>
            <div id="modal-button-container" style="max-height: 240px; overflow-y: auto; padding-right: 5px;"></div>
            <button id="modal-back-btn" class="indoor-btn indoor-btn-secondary" style="margin-top: 15px;">Back</button>
        `;

        const container = card.querySelector('#modal-button-container');
        window.labMenu.populate(container, labs, (labId) => {
            this.closeMenu();
            window.indoorNavigator.startIndoorRoute(buildingId, labId);
        });

        card.querySelector('#modal-back-btn').addEventListener('click', () => {
            this.showArrivalMenu(buildingId, buildingName);
        });
    }

    closeMenu() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }
    }
}

// Export global instance
window.destinationMenu = new DestinationMenuManager();
