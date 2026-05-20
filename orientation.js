/**
 * orientation.js
 * Tracks device rotation vector / compass heading across Android and iOS browsers.
 */

class WebOrientationTracker {
    constructor() {
        this.heading = 0; // Relative to North (0-360 degrees)
        this.onHeadingChanged = null;
        this.isTracking = false;
        
        this.handleOrientation = this.handleOrientation.bind(this);
    }

    /**
     * Attempts to start tracking orientation.
     * Note: iOS requires an explicit user gesture (e.g., button click) to request sensor permissions.
     * @param {function} callback Called on heading degrees updates.
     */
    async startTracking(callback) {
        this.onHeadingChanged = callback;

        if (this.isTracking) return true;

        // 1. iOS 13+ sensor authorization check
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    this.attachListeners();
                    return true;
                } else {
                    console.error("Orientation permission denied.");
                    return false;
                }
            } catch (err) {
                console.error("Device orientation permission request failed:", err);
                return false;
            }
        } else {
            // 2. Android / Standard browser direct access
            this.attachListeners();
            return true;
        }
    }

    attachListeners() {
        // 'deviceorientationabsolute' returns absolute earth alignment (ideal for Android Chrome)
        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', this.handleOrientation, true);
        } else if ('ondeviceorientation' in window) {
            window.addEventListener('deviceorientation', this.handleOrientation, true);
        } else {
            console.warn("Compass sensors not supported on this browser.");
        }
        this.isTracking = true;
    }

    handleOrientation(event) {
        let headingDegrees = 0;

        // iOS Safari Specific
        if (event.webkitCompassHeading !== undefined) {
            headingDegrees = event.webkitCompassHeading;
        } 
        // Android absolute sensor Specific
        else if (event.alpha !== null) {
            // alpha is clockwise on standard deviceorientation, but absolute event is counter-clockwise
            // 360 - event.alpha aligns it to standard magnetic compass direction
            headingDegrees = (360 - event.alpha) % 360;
        }

        this.heading = headingDegrees;

        if (this.onHeadingChanged) {
            this.onHeadingChanged(this.heading);
        }
    }

    stopTracking() {
        if ('ondeviceorientationabsolute' in window) {
            window.removeEventListener('deviceorientationabsolute', this.handleOrientation, true);
        }
        window.removeEventListener('deviceorientation', this.handleOrientation, true);
        this.isTracking = false;
    }
}

// Export global orientation tracker
window.orientationTracker = new WebOrientationTracker();
