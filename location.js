/**
 * location.js
 * Accesses and polls high-accuracy GPS positions from the browser.
 */

class WebLocationTracker {
    constructor() {
        this.watchId = null;
        this.onLocationChanged = null;
        this.onErrorOccurred = null;
    }

    /**
     * Starts tracking GPS position with high accuracy.
     * @param {function} callback Handles LocationResult updates.
     * @param {function} errorCallback Handles location error logs.
     */
    startTracking(callback, errorCallback) {
        if (!navigator.geolocation) {
            if (errorCallback) errorCallback({ message: "Geolocation not supported by this browser." });
            return;
        }

        this.onLocationChanged = callback;
        this.onErrorOccurred = errorCallback;

        // Clean up previous watchers if any
        this.stopTracking();

        const options = {
            enableHighAccuracy: true, // Forces phone to activate internal hardware GPS rather than IP fallback
            timeout: 10000,           // 10 second timeout limit
            maximumAge: 0             // Do not use cached location records
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                if (this.onLocationChanged) {
                    this.onLocationChanged({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    });
                }
            },
            (error) => {
                if (this.onErrorOccurred) {
                    this.onErrorOccurred(error);
                }
            },
            options
        );
    }

    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}

// Export global location tracker
window.locationTracker = new WebLocationTracker();
