/**
 * app.js
 * Renders the WebRTC camera background, orchestrates location/compass updates,
 * handles Leaflet 2D Map overlays, and renders the 3D-style AR navigation arrows.
 */

// Application state variables
let userLoc = null;
let currentAzimuth = -1;
let activeRoute = [];
let currentWaypointIndex = 0;
let pendingDestinationId = null;

// UI & Media elements
let videoElement;
let canvasElement;
let canvasContext;
let mapObject;
let userMarker = null;
let destinationMarker = null;
let routePolyline = null;

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    videoElement = document.getElementById('camera-stream');
    canvasElement = document.getElementById('ar-canvas');
    canvasContext = canvasElement.getContext('2d');

    // Parse destination code from QR link (e.g. ?dest=GG)
    const urlParams = new URLSearchParams(window.location.search);
    pendingDestinationId = urlParams.get('dest');

    setupDestinationList();
    initLeafletMap();

    window.addEventListener('resize', () => {
        if (mapObject) {
            mapObject.invalidateSize();
        }
    });

    // Show landing overlay to comply with browser gesture requirements for Camera & Sensors
    setupPermissionOverlay();
});

// 1. Splash Page Consent Handler (required for WebRTC camera & iOS sensors)
function setupPermissionOverlay() {
    const overlay = document.getElementById('landing-page');
    const startBtn = document.getElementById('start-ar-btn');

    if (!overlay || !startBtn) return;

    startBtn.addEventListener('click', async () => {
        // Request orientation sensors first to preserve iOS user gesture context
        const compassStarted = await window.orientationTracker.startTracking((heading) => {
            currentAzimuth = heading;
            drawAROverlay();
        });

        // Activate Camera second
        const cameraStarted = await initCamera();

        if (cameraStarted) {
            // Activate GPS Geolocation
            window.locationTracker.startTracking(handleLocationUpdate, handleLocationError);
            
            // Add CSS class to fade out the landing overlay smoothly
            overlay.classList.add('fade-out');
            
            // Remove the landing splash overlay from DOM after the transition completes
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 800); // Matches the 0.8s transition duration defined in CSS
            
            // Kick off Canvas drawing render loop
            requestAnimationFrame(renderLoop);
        } else {
            // Re-enable and show error state on the button
            startBtn.disabled = false;
            startBtn.classList.remove('loading');
            startBtn.innerHTML = 'Camera access is required. Retry';
            startBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            
            // Render detailed guidance text if camera is blocked
            let errMsg = overlay.querySelector('.camera-error-msg');
            if (!errMsg) {
                errMsg = document.createElement('p');
                errMsg.className = 'camera-error-msg';
                errMsg.style.color = '#f87171';
                errMsg.style.fontSize = '12px';
                errMsg.style.marginTop = '15px';
                errMsg.style.fontWeight = '600';
                errMsg.style.lineHeight = '1.5';
                errMsg.innerText = 'Please enable camera access in browser permissions and reload the page.';
                
                const card = overlay.querySelector('.glass-card');
                if (card) {
                    card.appendChild(errMsg);
                }
            }
        }
    }, true); // Use capture phase so this event listener executes before ui.js disables the button!
}

// 2. WebRTC Camera Initialization
async function initCamera() {
    try {
        const constraints = {
            video: {
                facingMode: 'environment', // Rear-facing camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        return true;
    } catch (err) {
        console.error("Camera access error:", err);
        return false;
    }
}

// 3. Leaflet 2D Map Initialization
function initLeafletMap() {
    // Default centering to SGSITS Campus Indore
    mapObject = L.map('mini-map', {
        zoomControl: false,
        attributionControl: false
    }).setView([22.72630, 75.87413], 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(mapObject);
}

// 4. Populate drop-down destination spinner
function setupDestinationList() {
    const selector = document.getElementById('destination-selector');
    
    // Sort destinations alphabetically by name
    const sortedNodes = Array.from(window.campusGraph.nodes.values())
        .filter(node => node.id !== node.name) // Filter to named building nodes
        .sort((a, b) => a.name.localeCompare(b.name));

    sortedNodes.forEach(node => {
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = node.name;
        selector.appendChild(option);
    });

    selector.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
            triggerNavigation(selectedId);
        } else {
            stopActiveNavigation();
        }
    });
}

// 5. GPS coordinate update handler
function handleLocationUpdate(location) {
    userLoc = location;

    // Draw user dot on Leaflet map
    const userGeoPoint = [userLoc.latitude, userLoc.longitude];
    if (userMarker === null) {
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div style="width: 14px; height: 14px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #3b82f6;"></div>`,
            iconSize: [14, 14]
        });
        userMarker = L.marker(userGeoPoint, { icon: userIcon }).addTo(mapObject);
    } else {
        userMarker.setLatLng(userGeoPoint);
    }

    // Auto-center map on first GPS sync
    mapObject.panTo(userGeoPoint);

    // Process queued destination if we got it from the QR code parameters
    if (pendingDestinationId !== null) {
        const destId = pendingDestinationId;
        pendingDestinationId = null; // Clear queue
        
        // Select it in spinner dropdown
        const selector = document.getElementById('destination-selector');
        selector.value = destId;
        
        triggerNavigation(destId);
    }

    // If navigation is active, perform waypoint proximity math
    if (activeRoute.length > 0) {
        // Advance waypoints if user is within 12 meters
        currentWaypointIndex = advanceWaypointIfNeeded(userLoc, activeRoute, currentWaypointIndex);
        
        if (currentWaypointIndex >= activeRoute.length) {
            stopActiveNavigation();
            return;
        }

        // Trigger turn voice prompts via navigation engine
        window.navigationManager.updateLocation(userLoc, currentWaypointIndex, currentAzimuth);
        
        // Check final destination arrival
        checkDestinationReached();
    }
}

function handleLocationError(error) {
    console.error("GPS tracking error:", error);
    document.getElementById('status-panel').innerText = "GPS Error";
}

// 6. Navigation Initializer
function triggerNavigation(destinationNodeId) {
    if (!userLoc) {
        pendingDestinationId = destinationNodeId;
        alert("Waiting for GPS lock to start navigation...");
        return;
    }

    const startNodeId = window.campusGraph.findNearestNode(userLoc.latitude, userLoc.longitude);
    if (!startNodeId) {
        alert("Could not locate your campus starting point.");
        return;
    }

    const route = window.campusGraph.findShortestPath(startNodeId, destinationNodeId);
    if (!route || route.length === 0) {
        alert("No path found to selected destination.");
        return;
    }

    // Prepare route mapping data
    activeRoute = route;
    currentWaypointIndex = 0;

    // Reset Voice Navigation Manager
    const destNode = window.campusGraph.nodes.get(destinationNodeId);
    window.navigationManager.setRoute(activeRoute, destNode.name);

    // Draw route line on Leaflet map
    if (routePolyline !== null) {
        mapObject.removeLayer(routePolyline);
    }
    const latLnds = activeRoute.map(node => [node.latitude, node.longitude]);
    routePolyline = L.polyline(latLnds, { color: '#10b981', weight: 4 }).addTo(mapObject);

    // Place flag icon on destination building
    if (destinationMarker !== null) {
        mapObject.removeLayer(destinationMarker);
    }
    destinationMarker = L.marker([destNode.latitude, destNode.longitude]).addTo(mapObject)
        .bindPopup(destNode.name).openPopup();

    mapObject.fitBounds(routePolyline.getBounds(), { padding: [20, 20] });
}

// 7. Check if user is at destination coordinates
function checkDestinationReached() {
    if (activeRoute.length === 0) return;
    
    const finalNode = activeRoute[activeRoute.length - 1];
    const distToDest = window.campusGraph.getDistance(
        userLoc.latitude, userLoc.longitude,
        finalNode.latitude, finalNode.longitude
    );

    // Dynamic GPS arrival threshold (5 meters standard)
    const arrivalThreshold = Math.max(5.0, Math.min(userLoc.accuracy, 10.0));

    if (distToDest <= arrivalThreshold) {
        window.navigationManager.announceArrival();
        
        // Automatically stop active navigation and trigger the indoor transition
        setTimeout(() => {
            stopActiveNavigation();
        }, 800);
    }
}

// 8. Progress target index if user gets close to node
function advanceWaypointIfNeeded(location, path, currentIndex) {
    if (currentIndex >= path.length) return currentIndex;

    let index = currentIndex;
    const distance = window.campusGraph.getDistance(
        location.latitude, location.longitude,
        path[index].latitude, path[index].longitude
    );

    // If within 12 meters (matching Java threshold), progress to next segment
    if (distance <= 12.0 && index < path.length - 1) {
        index++;
        console.log(`Progressing to next waypoint. New target index: ${index}`);
    }
    return index;
}

function stopActiveNavigation() {
    activeRoute = [];
    currentWaypointIndex = 0;
    
    if (routePolyline !== null) {
        mapObject.removeLayer(routePolyline);
        routePolyline = null;
    }
    if (destinationMarker !== null) {
        mapObject.removeLayer(destinationMarker);
        destinationMarker = null;
    }
    document.getElementById('destination-selector').value = "";
    window.speechManager.shutdown();
}

// 9. Canvas rendering loop
function renderLoop() {
    drawAROverlay();
    requestAnimationFrame(renderLoop);
}

// 10. Draw custom 3D-styled direction arrows
function drawAROverlay() {
    // Sync canvas sizing with mobile viewport layout
    const targetHeight = window.innerHeight * 0.5;
    if (canvasElement.width !== window.innerWidth || canvasElement.height !== targetHeight) {
        canvasElement.width = window.innerWidth;
        canvasElement.height = targetHeight;
    }

    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Require location and compass heading to draw arrows
    if (!userLoc || currentAzimuth < 0 || activeRoute.length === 0) return;
    if (currentWaypointIndex >= activeRoute.length) return;

    // Draw sequential path arrows (draw up to 4 arrows forward)
    const maxVisibleArrows = 4;
    let arrowsAdded = 0;
    
    for (let i = currentWaypointIndex; i < activeRoute.length && arrowsAdded < maxVisibleArrows; i++) {
        const point = activeRoute[i];
        
        const distance = window.campusGraph.getDistance(
            userLoc.latitude, userLoc.longitude,
            point.latitude, point.longitude
        );

        const targetBearing = window.campusGraph.getBearing(
            userLoc.latitude, userLoc.longitude,
            point.latitude, point.longitude
        );

        // Relative direction difference
        let relativeAngle = targetBearing - currentAzimuth;
        while (relativeAngle > 180) relativeAngle -= 360;
        while (relativeAngle < -180) relativeAngle += 360;

        // Show arrow if target node is in user's front FOV (95 degrees left or right)
        // Force the immediate target arrow visible even if off-screen to help orientation
        const isTargetVisible = Math.abs(relativeAngle) <= 95 || (i === currentWaypointIndex);

        if (isTargetVisible) {
            // Draw sequential arrows stacked vertically to represent route path
            const yOffsetMultiplier = arrowsAdded * 240; // Spacing between arrows
            drawSingleDirectionalArrow(relativeAngle, Math.round(distance), yOffsetMultiplier);
            arrowsAdded++;
        }
    }
}

function drawSingleDirectionalArrow(angleDegrees, distanceMeters, verticalOffset) {
    const centerX = canvasElement.width / 2;
    // Overlay bottom anchor center + vertical stacking
    const centerY = (canvasElement.height * 0.65) - verticalOffset;

    // Avoid drawing arrows too high off the screen view
    if (centerY < 80) return;

    canvasContext.save();
    canvasContext.translate(centerX, centerY);
    
    // Scale arrows: closer arrows are larger, farther ones are smaller
    const scaleFactor = Math.max(0.4, Math.min(1.0, 150 / (distanceMeters + 50)));
    canvasContext.scale(scaleFactor, scaleFactor);
    
    canvasContext.rotate(angleDegrees * Math.PI / 180);

    // 3D-styled shadow glow
    canvasContext.shadowColor = 'rgba(16, 185, 129, 0.5)';
    canvasContext.shadowBlur = 15;

    // Gradient filling for dynamic glow aesthetic
    const gradient = canvasContext.createLinearGradient(0, -60, 0, 40);
    gradient.addColorStop(0, '#10b981'); // Vivid Emerald
    gradient.addColorStop(1, '#059669'); // Darker Emerald

    canvasContext.fillStyle = gradient;
    canvasContext.strokeStyle = '#ffffff';
    canvasContext.lineWidth = 4;
    canvasContext.lineJoin = 'round';

    // Draw Arrow Geometry
    canvasContext.beginPath();
    canvasContext.moveTo(0, -60);        // Pointer tip
    canvasContext.lineTo(25, -15);       // Right flange
    canvasContext.lineTo(10, -15);       // Right notch inner
    canvasContext.lineTo(10, 40);        // Right base
    canvasContext.lineTo(-10, 40);       // Left base
    canvasContext.lineTo(-10, -15);      // Left notch inner
    canvasContext.lineTo(-25, -15);      // Left flange
    canvasContext.closePath();

    canvasContext.fill();
    canvasContext.stroke();

    canvasContext.restore();

    // Render text label tag (e.g. "30 m") directly underneath the arrow
    canvasContext.shadowColor = 'transparent'; // Reset shadows
    canvasContext.fillStyle = '#ffffff';
    canvasContext.font = 'bold 15px system-ui, sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(`${distanceMeters} m`, centerX, centerY + (55 * scaleFactor));
}
