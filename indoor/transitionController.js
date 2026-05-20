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

                // 1. Temporarily pause GPS tracking to prevent coordinate shifts inside walls
                if (window.locationTracker) {
                    window.locationTracker.stopTracking();
                }

                // 2. Erase the outdoor 2D map lines to clear screen space
                if (window.routePolyline && window.mapObject) {
                    window.mapObject.removeLayer(window.routePolyline);
                    window.routePolyline = null;
                }

                // 3. Open the building floor options selection menu
                window.destinationMenu.showArrivalMenu(destinationId, buildingName);
            } else {
                // Fallback to default outdoor teardown
                window.originalStopActiveNavigation();
            }
        };
    }
});
