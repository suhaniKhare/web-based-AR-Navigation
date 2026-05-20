/**
 * buildingMapManager.js
 * Asynchronously loads room maps and pre-calculated routes.
 */

class BuildingMapManager {
    constructor() {
        this.routes = {};
        this.directory = {};
    }

    /**
     * Fetches route database configurations.
     */
    async initialize() {
        try {
            const routeResponse = await fetch('indoor/indoorRoutes.json');
            this.routes = await routeResponse.json();

            const dirResponse = await fetch('indoor/labDirectory.json');
            this.directory = await dirResponse.json();
            
            console.log("Indoor databases loaded successfully.");
            return true;
        } catch (err) {
            console.warn("Failed fetching indoor routes via HTTP. Using local fallback configurations.", err);
            this.loadFallbackConfig();
            return false;
        }
    }

    loadFallbackConfig() {
        // Fallback structures to support double-click offline testing (file:// protocol)
        this.directory = {
            "ATC": {
                "hasIndoor": true,
                "primaryOptions": [
                    { "id": "HOD_OFFICE", "label": "HOD Office", "type": "route" },
                    { "id": "LABS", "label": "Labs", "type": "submenu" }
                ],
                "labs": [
                    { "id": "LAB_101", "label": "Lab 101" },
                    { "id": "LAB_102", "label": "Lab 102" },
                    { "id": "AIML_LAB", "label": "AI/ML Research Lab" }
                ]
            },
            "GG": {
                "hasIndoor": true,
                "primaryOptions": [
                    { "id": "HOD_OFFICE", "label": "Administrative Office", "type": "route" }
                ]
            }
        };

        this.routes = {
            "ATC": {
                "HOD_OFFICE": {
                    "name": "HOD Office",
                    "steps": [
                        { "step": 1, "instruction": "Enter the main lobby of the ATC Building and walk straight past the reception desk.", "distance": 10 },
                        { "step": 2, "instruction": "Turn left and go up the main staircase to the 1st Floor.", "distance": 12 },
                        { "step": 3, "instruction": "The HOD Office is the second room on your left.", "distance": 5 }
                    ]
                },
                "LAB_101": {
                    "name": "Lab 101",
                    "steps": [
                        { "step": 1, "instruction": "Enter the lobby, walk past reception, and walk 12 meters down the east hallway.", "distance": 12 },
                        { "step": 2, "instruction": "Lab 101 is straight ahead at the end of the hall.", "distance": 6 }
                    ]
                }
            }
        };
    }

    getBuildingDirectory(buildingId) {
        return this.directory[buildingId] || null;
    }

    getRoute(buildingId, routeId) {
        if (this.routes[buildingId] && this.routes[buildingId][routeId]) {
            return this.routes[buildingId][routeId];
        }
        return null;
    }
}

window.buildingMapManager = new BuildingMapManager();
