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
            statusPanel.style.background = 'var(--accent-gold-light, rgba(245, 158, 11, 0.15))';
            statusPanel.style.borderColor = 'var(--accent-gold-glowing, #f59e0b)';
            statusPanel.style.color = 'var(--accent-gold-glowing, #f59e0b)';
        }
    }

    reset() {
        this.currentFloor = "Ground Floor";
    }
}

window.floorNavigation = new FloorNavigationManager();
