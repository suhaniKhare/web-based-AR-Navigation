/**
 * floorNavigation.js
 * Monitors vertical floor-wise navigation state and draws floor level indicators.
 */

class FloorNavigationManager {
    constructor() {
        this.currentFloor = "Ground Floor";
    }

    /**
     * Inspects a routing step to check for floor change announcements.
     * @param {Object} step Step object from routes database.
     */
    processStepElevation(step) {
        if (step.floorChange) {
            if (step.floorChange === "up") {
                this.currentFloor = "First Floor";
            } else if (step.floorChange === "down") {
                this.currentFloor = "Ground Floor";
            }
            this.updateFloorUI();
        }
    }

    updateFloorUI() {
        const statusPanel = document.getElementById('status-panel');
        if (statusPanel) {
            statusPanel.innerText = `LEVEL: ${this.currentFloor.toUpperCase()}`;
            statusPanel.style.background = '#2563eb'; // Blue theme for indoor
            statusPanel.style.borderColor = '#3b82f6';
        }
    }

    reset() {
        this.currentFloor = "Ground Floor";
    }
}

window.floorNavigation = new FloorNavigationManager();
