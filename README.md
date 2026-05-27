# SGSITS Campus AR Navigation

An Augmented Reality (AR) based campus navigation system designed for **SGSITS (Shri Govindram Seksaria Institute of Technology and Science)** to help students and visitors navigate the campus easily through interactive route guidance.

The project combines location tracking, orientation sensing, route generation, and AR-based visual navigation to provide a more intuitive navigation experience inside and around the campus.

## Live Demo

🌐 Project Link: : https://sgsits-campus-ar-navigation.vercel.app/

---

## Features

- 📍 Real-time campus navigation
- 🧭 Device orientation and direction tracking
- 🗺 Route generation and path calculation
- 🎯 AR-based directional guidance
- 🔊 Voice guidance support
- 📱 Mobile-friendly interface
- 🔄 Dynamic UI updates
- 🏫 Indoor and outdoor navigation support
- 📷 QR-based location assistance

---

## Project Structure

```bash
SGSITS-Campus-AR-Navigation/
│
├── backend/              # Backend services and APIs
├── indoor/               # Indoor navigation modules
│
├── app.js                # Main application logic
├── location.js           # Handles location tracking
├── navigation.js         # Navigation functionality
├── orientation.js        # Device orientation handling
├── qrCounter.js          # QR functionality
├── routeEngine.js        # Route calculation engine
├── speech.js             # Voice guidance system
├── ui.js                 # UI handling
│
├── index.html            # Main HTML page
├── styles.css            # Styling
│
├── vercel.json           # Deployment configuration
└── README.md
```

---

## Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript

### Navigation & AR
- Geolocation API
- Device Orientation API
- Sensor-based navigation
- AR interaction logic

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Deployment
- Vercel

---


## Usage

1. Open the application on a mobile device.
2. Allow:
   - Camera permission
   - Location permission
3. Select your destination.
4. Start navigation.
5. Follow AR guidance and route directions.

---

## Working Flow

```text
User opens app
        ↓
Camera permission granted
        ↓
Location permission granted
        ↓
Current location detected
        ↓
Destination selected
        ↓
Route generated
        ↓
Orientation + sensors activated
        ↓
AR navigation starts
        ↓
Voice and visual guidance
        ↓
Destination reached
```

---

## License

This project is intended for educational and academic use.

---

## Authors

Shrishty Alanse | Suhani Khare | Gourav Solanki 
---
