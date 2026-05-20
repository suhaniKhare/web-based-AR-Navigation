/**
 * indoorNavigator.js
 * Coordinates all indoor navigation states, menus, and text directions guides.
 */

class IndoorNavigator {
    constructor() {
        this.isActive = false;
        this.currentBuildingId = null;

        // Initialize databases on document ready
        window.addEventListener('DOMContentLoaded', () => {
            window.buildingMapManager.initialize();
        });
    }

    /**
     * Checks if a destination building has indoor mapping configured.
     */
    hasDataFor(buildingId) {
        return window.buildingMapManager.getBuildingDirectory(buildingId) !== null;
    }

    getBuildingDirectory(buildingId) {
        return window.buildingMapManager.getBuildingDirectory(buildingId);
    }

    /**
     * Triggers the step-by-step indoor guide.
     */
    startIndoorRoute(buildingId, routeId) {
        const routeData = window.buildingMapManager.getRoute(buildingId, routeId);
        if (!routeData) {
            alert(`No path found to: ${routeId}`);
            this.exitNavigation();
            return;
        }

        this.isActive = true;
        this.currentBuildingId = buildingId;
        window.floorNavigation.reset();

        // Start step HUD text overlay
        window.indoorTextGuide.start(routeData.steps);
        
        console.log(`Started indoor navigation for: ${routeData.name}`);
    }

    exitNavigation() {
        this.isActive = false;
        this.currentBuildingId = null;
        
        // Hide indoor overlays
        window.indoorTextGuide.stop();
        window.destinationMenu.closeMenu();

        // Reset HUD status panel to outdoor tracking mode
        const statusPanel = document.getElementById('status-panel');
        if (statusPanel) {
            statusPanel.innerText = 'GPS OK';
            statusPanel.style.background = 'rgba(16, 185, 129, 0.15)';
            statusPanel.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        }

        // Call the original outdoor teardown function to clean up routes
        if (window.originalStopActiveNavigation) {
            window.originalStopActiveNavigation();
        }
    }
}

window.indoorNavigator = new IndoorNavigator();
