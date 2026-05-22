/**
 * transitionController.js
 * Hooks into the outdoor app events at runtime without editing outdoor files.
 */

window.addEventListener('DOMContentLoaded', () => {
    // Intercept when navigation finishes or cancels
    if (window.stopActiveNavigation) {
        window.originalStopActiveNavigation = window.stopActiveNavigation;

        window.stopActiveNavigation = function() {
            const selector = document.getElementById('destination-selector');
            const destinationId = selector.value;

            // Check if the destination has registered indoor paths
            if (destinationId && window.indoorNavigator.hasDataFor(destinationId)) {
                const targetNode = window.campusGraph.nodes.get(destinationId);
                const buildingName = targetNode ? targetNode.name : "Building";

                console.log(`Arrival intercepted: Transitioning user to ${buildingName} indoor menu.`);

                // 1. Call original teardown to clear outdoor navigation states (clears activeRoute, stops AR arrows, removes map layers)
                window.originalStopActiveNavigation();

                // 2. Temporarily pause GPS tracking to prevent coordinate shifts inside walls
                if (window.locationTracker) {
                    window.locationTracker.stopTracking();
                }

                // 3. Hide the 2D mini-map to maximize AR camera space and prevent HUD overlaps
                const mapEl = document.getElementById('mini-map');
                if (mapEl) {
                    mapEl.style.display = 'none';
                }

                // 4. Open the building floor options selection menu
                window.destinationMenu.showArrivalMenu(destinationId, buildingName);
            } else {
                // Fallback to default outdoor teardown
                window.originalStopActiveNavigation();
            }
        };
    }
});
