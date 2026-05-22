/**
 * navigation.js
 * Tracks active route segments, handles waypoint index progression,
 * and triggers voice navigation prompts based on user progress.
 */

const TurnInstruction = {
    START_NAVIGATION: "Starting navigation. Follow the route.",
    GO_STRAIGHT: "Continue straight",
    TURN_LEFT: "Turn left",
    TURN_RIGHT: "Turn right",
    SHARP_LEFT: "Turn sharp left",
    SHARP_RIGHT: "Turn sharp right",
    DESTINATION: "You have reached your destination."
};

class WebNavigationManager {
    constructor() {
        this.routeWaypoints = [];
        this.waypointInstructions = [];
        this.preAnnounced = [];
        this.actionAnnounced = [];
        
        this.destinationName = "";
        this.destinationAnnounced = false;
        this.lastSpokenIndex = -1;
        this.lastSpokenGoStraightIndex = -1;
    }

    /**
     * Resets navigation states and pre-calculates turn instructions along the route.
     * @param {Array} route Array of node objects [{id, name, latitude, longitude}]
     * @param {string} destinationName Name of destination building
     */
    setRoute(route, destinationName) {
        if (!route || route.length === 0) {
            this.routeWaypoints = [];
            this.waypointInstructions = [];
            return;
        }

        this.routeWaypoints = [...route];
        this.destinationName = destinationName;
        const size = this.routeWaypoints.length;

        this.waypointInstructions = new Array(size);
        this.preAnnounced = new Array(size).fill(false);
        this.actionAnnounced = new Array(size).fill(false);
        this.destinationAnnounced = false;
        this.lastSpokenIndex = -1;
        this.lastSpokenGoStraightIndex = -1;

        // Pre-calculate bearings and turn directions for intermediate nodes
        for (let i = 0; i < size; i++) {
            if (i === 0) {
                this.waypointInstructions[i] = TurnInstruction.START_NAVIGATION;
            } else if (i === size - 1) {
                this.waypointInstructions[i] = TurnInstruction.DESTINATION;
            } else {
                const prev = this.routeWaypoints[i - 1];
                const curr = this.routeWaypoints[i];
                const next = this.routeWaypoints[i + 1];

                const incomingBearing = window.campusGraph.getBearing(
                    prev.latitude, prev.longitude,
                    curr.latitude, curr.longitude
                );
                const outgoingBearing = window.campusGraph.getBearing(
                    curr.latitude, curr.longitude,
                    next.latitude, next.longitude
                );

                const angleChange = this.normalizeAngle(outgoingBearing - incomingBearing);

                // Replicate Android angle thresholds
                if (angleChange >= 30 && angleChange < 120) {
                    this.waypointInstructions[i] = TurnInstruction.TURN_RIGHT;
                } else if (angleChange >= 120) {
                    this.waypointInstructions[i] = TurnInstruction.SHARP_RIGHT;
                } else if (angleChange <= -30 && angleChange > -120) {
                    this.waypointInstructions[i] = TurnInstruction.TURN_LEFT;
                } else if (angleChange <= -120) {
                    this.waypointInstructions[i] = TurnInstruction.SHARP_LEFT;
                } else {
                    this.waypointInstructions[i] = TurnInstruction.GO_STRAIGHT;
                }
            }
        }

        console.log("Route instructions calculated successfully:", this.waypointInstructions);

        // Speak initial navigation greeting
        const initialMessage = `Navigation started to ${destinationName}. Follow the green arrows.`;
        window.speechManager.speak(initialMessage);
        this.lastSpokenIndex = 0;
    }

    /**
     * Invoked whenever GPS updates. Determines if turn instructions or post-turn announcements are needed.
     * @param {Object} userLoc {latitude, longitude}
     * @param {number} currentWaypointIndex The active node index we are walking towards
     * @param {number} currentAzimuth Degrees heading from orientation sensor
     */
    updateLocation(userLoc, currentWaypointIndex, currentAzimuth) {
        if (!userLoc || this.routeWaypoints.length === 0) return;
        if (currentWaypointIndex < 0 || currentWaypointIndex >= this.routeWaypoints.length) return;

        const targetWaypoint = this.routeWaypoints[currentWaypointIndex];
        const distance = window.campusGraph.getDistance(
            userLoc.latitude, userLoc.longitude,
            targetWaypoint.latitude, targetWaypoint.longitude
        );
        const instruction = this.waypointInstructions[currentWaypointIndex];

        // Scenario 1: Destination Arrival (Handled in app.js for better synchronization)
        if (currentWaypointIndex === this.routeWaypoints.length - 1) {
            return;
        }

        // Scenario 2: Post-Turn Completion ("Go straight for X meters")
        if (currentWaypointIndex > this.lastSpokenGoStraightIndex && currentWaypointIndex > 0) {
            const prevWaypoint = this.routeWaypoints[currentWaypointIndex - 1];
            const distanceFromTurn = window.campusGraph.getDistance(
                userLoc.latitude, userLoc.longitude,
                prevWaypoint.latitude, prevWaypoint.longitude
            );

            let turnCompleted = false;
            if (currentAzimuth >= 0) {
                const bearingToNext = window.campusGraph.getBearing(
                    userLoc.latitude, userLoc.longitude,
                    targetWaypoint.latitude, targetWaypoint.longitude
                );
                const headingDifference = Math.abs(this.normalizeAngle(currentAzimuth - bearingToNext));
                
                // Moved 7m from turn and facing the new route OR moved 15m away as fallback
                turnCompleted = (distanceFromTurn >= 7 && headingDifference <= 50) || (distanceFromTurn >= 15);
            } else {
                turnCompleted = (distanceFromTurn >= 15);
            }

            if (turnCompleted) {
                const remainingDistance = Math.round(distance);
                const speechText = `Go straight for ${remainingDistance} meters`;
                window.speechManager.speak(speechText);
                this.lastSpokenGoStraightIndex = currentWaypointIndex;
            }
        }

        // Scenario 3: Intermediate Waypoint Announcements (Skip speaking "GO_STRAIGHT" to avoid sound pollution)
        if (instruction === TurnInstruction.TURN_LEFT || instruction === TurnInstruction.TURN_RIGHT ||
            instruction === TurnInstruction.SHARP_LEFT || instruction === TurnInstruction.SHARP_RIGHT) {

            // A. Pre-announcement: Speaks when user is between 18 to 35 meters away from the turn
            if (distance > 18 && distance <= 35) {
                if (!this.preAnnounced[currentWaypointIndex]) {
                    const speechText = `In ${Math.round(distance)} meters, ${instruction.toLowerCase()}`;
                    window.speechManager.speak(speechText);
                    this.preAnnounced[currentWaypointIndex] = true;
                }
            }

            // B. Action announcement: Speaks when user is within 12 meters of the turn point
            if (distance <= 12) {
                if (!this.actionAnnounced[currentWaypointIndex]) {
                    const speechText = `${instruction} now`;
                    window.speechManager.speak(speechText);
                    this.actionAnnounced[currentWaypointIndex] = true;
                }
            }
        }
    }

    announceArrival() {
        if (!this.destinationAnnounced) {
            const speechText = `You have arrived at ${this.destinationName}. Destination reached.`;
            window.speechManager.speak(speechText);
            this.destinationAnnounced = true;
        }
    }

    normalizeAngle(angle) {
        let normalized = angle;
        while (normalized > 180) normalized -= 360;
        while (normalized < -180) normalized += 360;
        return normalized;
    }
}

// Export global navigation manager
window.navigationManager = new WebNavigationManager();
