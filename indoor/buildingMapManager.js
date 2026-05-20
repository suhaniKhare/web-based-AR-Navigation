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
                    { "id": "DEAN_OFFICE", "label": "Dean's Office", "type": "route" },
                    { "id": "LABS", "label": "Labs", "type": "submenu" }
                ],
                "labs": [
                    { "id": "LAB_111", "label": "Lab 111 (Wireless Network Lab)" },
                    { "id": "LAB_101", "label": "Lab 101 (DBMS)" },
                    { "id": "LAB_107", "label": "Lab 107 (English Lab)" },
                    { "id": "LAB_105", "label": "Lab 105" },
                    { "id": "LAB_104", "label": "Lab 104" }
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
                        { "step": 1, "instruction": "Face the stairs" },
                        { "step": 2, "instruction": "Turn left then go straight" }
                    ]
                },
                "DEAN_OFFICE": {
                    "name": "Dean's Office",
                    "steps": [
                        { "step": 1, "instruction": "Face the stairs" },
                        { "step": 2, "instruction": "Turn right then go straight" }
                    ]
                },
                "LAB_111": {
                    "name": "Lab 111 (Wireless Network Lab)",
                    "steps": [
                        { "step": 1, "instruction": "Face the stairs" },
                        { "step": 2, "instruction": "Turn left and go straight to the end" }
                    ]
                },
                "LAB_101": {
                    "name": "Lab 101 (DBMS)",
                    "steps": [
                        { "step": 1, "instruction": "Face the stairs" },
                        { "step": 2, "instruction": "Turn left and go straight to the end" }
                    ]
                },
                "LAB_107": {
                    "name": "Lab 107 (English Lab)",
                    "steps": [
                        { "step": 1, "instruction": "Face the stairs" },
                        { "step": 2, "instruction": "Turn right and go straight to the end" }
                    ]
                },
                "LAB_105": {
                    "name": "Lab 105",
                    "steps": [
                        { "step": 1, "instruction": "Face the stairs" },
                        { "step": 2, "instruction": "Turn right and go straight to the end" }
                    ]
                },
                "LAB_104": {
                    "name": "Lab 104",
                    "steps": [
                        { "step": 1, "instruction": "Face the stairs" },
                        { "step": 2, "instruction": "Turn right and go straight to the end" }
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
