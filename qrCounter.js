/**
 * qrCounter.js - Decoupled QR Scan Counter and Logger
 * This script runs on the frontend page load. It counts and displays the QR scans.
 */

// ==========================================
// API CONFIGURATION
// REPLACE THE PLACEHOLDER BELOW WITH YOUR ACTUAL DEPLOYED API URL
// Example: "https://your-webar-backend.onrender.com/api/scan"
// ==========================================
const API_URL = "/api/scan";

function initQRCounter() {
    const urlParams = new URLSearchParams(window.location.search);
    const dest = urlParams.get('dest');
    
    // Deem it a QR scan entry if 'ref=qr' is in URL or a specific destination is queried directly
    const isFromQR = urlParams.get('ref') === 'qr' || dest !== null;
    
    // Session flag prevents double-counting if user hits refresh
    const sessionFlag = sessionStorage.getItem('qr_scanned');

    let requestUrl = API_URL;

    // Build query params based on whether this scan should be registered (increment=true)
    if (isFromQR && !sessionFlag) {
        const queryParams = new URLSearchParams({
            dest: dest || 'landing',
            ref: urlParams.get('ref') || 'qr',
            increment: 'true'
        });
        requestUrl += `?${queryParams.toString()}`;
    } else {
        requestUrl += `?increment=false`;
    }

    // Connect to backend API
    fetch(requestUrl)
        .then(res => res.json())
        .then(data => {
            const countDisplay = document.getElementById('scan-count');
            if (countDisplay) {
                countDisplay.innerText = data.count !== undefined ? data.count : 0;
            }
            
            // Set session flag once the scan has successfully been incremented
            if (isFromQR && !sessionFlag) {
                sessionStorage.setItem('qr_scanned', 'true');
            }
        })
        .catch(err => {
            console.error("Failed to query QR scan API:", err);
            const countDisplay = document.getElementById('scan-count');
            if (countDisplay) {
                countDisplay.innerText = "—"; // Fallback display character
            }
        });
}

// Start processing when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', initQRCounter);
