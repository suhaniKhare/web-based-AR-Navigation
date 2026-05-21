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
                background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                display: flex; align-items: center; justify-content: center;
                z-index: 1000; font-family: 'Outfit', 'Inter', sans-serif; padding: 20px;
                box-sizing: border-box;
            }
            .indoor-modal-card {
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 24px; width: 100%; max-width: 360px;
                padding: 30px; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                box-sizing: border-box; text-align: center;
                animation: modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes modal-slide-up {
                from { transform: translateY(40px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .indoor-modal-title {
                font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0;
                letter-spacing: -0.5px;
            }
            .indoor-modal-subtitle {
                font-size: 13.5px; color: #94a3b8; margin: 0 0 25px 0; line-height: 1.5;
            }
            .indoor-btn {
                width: 100%; padding: 14px 20px; border-radius: 14px; border: none;
                font-size: 15px; font-weight: 600; cursor: pointer; margin-bottom: 12px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-sizing: border-box; display: flex;
                align-items: center; justify-content: center; gap: 10px;
                text-decoration: none; text-align: center;
            }
            .indoor-btn:last-child {
                margin-bottom: 0;
            }
            .indoor-btn-primary {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            }
            .indoor-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
            }
            .indoor-btn-primary:active { transform: translateY(0); }
            
            .indoor-btn-secondary {
                background: rgba(255, 255, 255, 0.05); color: white;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .indoor-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
            }
            .indoor-btn-secondary:active { background: rgba(255, 255, 255, 0.15); }
            
            .indoor-btn-danger {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
            }
            .indoor-btn-danger:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
            }
            .indoor-btn-danger:active { transform: translateY(0); }
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
            <div style="font-size: 44px; margin-bottom: 15px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));">🏢</div>
            <h3 class="indoor-modal-title">Reached ${buildingName}</h3>
            <p class="indoor-modal-subtitle">Outdoor navigation completed. Please select your next step:</p>
            <div id="modal-button-container"></div>
        `;

        this.overlay.appendChild(card);
        document.body.appendChild(this.overlay);

        const container = card.querySelector('#modal-button-container');

        // Render Option 1: Exit Button
        const exitBtn = document.createElement('button');
        exitBtn.className = 'indoor-btn indoor-btn-danger';
        exitBtn.innerHTML = `
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Exit
        `;
        exitBtn.addEventListener('click', () => {
            this.closeMenu();
            window.indoorNavigator.exitNavigation();
            setTimeout(() => {
                alert("Navigation completed successfully.");
            }, 100);
        });
        container.appendChild(exitBtn);

        // Render Option 2: Primary Route Options (e.g. HOD Office)
        directory.primaryOptions.forEach(opt => {
            if (opt.type === 'route') {
                const btn = document.createElement('button');
                btn.className = 'indoor-btn indoor-btn-primary';
                btn.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    ${opt.label}
                `;
                btn.addEventListener('click', () => {
                    this.closeMenu();
                    window.indoorNavigator.startIndoorRoute(buildingId, opt.id);
                });
                container.appendChild(btn);
            }
        });

        // Render Option 3: Submenu Options (e.g. Labs)
        directory.primaryOptions.forEach(opt => {
            if (opt.type === 'submenu') {
                const btn = document.createElement('button');
                btn.className = 'indoor-btn indoor-btn-primary';
                btn.innerHTML = `
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    ${opt.label}
                `;
                btn.addEventListener('click', () => {
                    this.showLabSelectionMenu(buildingId, buildingName, directory.labs);
                });
                container.appendChild(btn);
            }
        });
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
