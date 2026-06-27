# 🐾 PawRescue Hub

PawRescue Hub is a real-time, community-driven emergency coordination dashboard for roadside stray puppy and kitten sightings. Designed with high-end glassmorphism styling, this portal connects local volunteers to coordinate rescues, foster care, and transport.

## 🌟 Core Features

*   **📍 Live Sighting Map**: Interactive Leaflet maps styled with custom dark overlay grids. Spotting an animal allows reporters to click coordinates, select puppy/kitten types, and add description alerts.
*   **📡 Real-Time GPS Tracking**: Volunteers can share their live coordinates. A pulsing green runner pin represents their movement on everyone's map simultaneously.
*   **🤖 Rescue bot Navigation**: Automated chat responders simulate coordination routes, spawning pulsing pins on the map that move street-by-street towards strays and updating status cards upon arrival.
*   **💬 Direct Messaging (DM)**: Sighting cards calculate distances to the nearest online volunteers. Click **Chat** to coordinate fostering/adoptions in a private chat container (with simulated bot replies).
*   **🏆 Rescue Heroes Wall**: Rescuing animals awards points. The top sidebar displays crowned avatars with **HERO** status badges and rescue tallies.
*   **📖 "How to Help" Guide**: Features safety guides, first-aid basics, and emergency contact phone directories for local vet ambulances.
*   **💳 Donation Portal**: Allows secure checkout simulation supporting kibble and medical funds to keep the rescue operation running.

## 🛠️ Technology Stack

*   **HTML5 & CSS3**: Custom dark theme grids, scrollbars, and keyframe hover transitions.
*   **JavaScript (ES6)**: Canvas-based canvas image resizing (<100KB) to fit within browser `LocalStorage` quotas.
*   **Leaflet.js**: Vector layout overlays and custom FontAwesome pin markers.
*   **BroadcastChannel API**: Syncs sighting cards, public chats, direct DMs, and hero scores across open tabs in real-time.

## 🚀 How to Run Locally

1. Clone or download the folder.
2. Open `index.html` in your web browser, or serve it using a local server:
   ```bash
   python -m http.server 8080
   ```
3. Open `http://localhost:8080` in multiple tabs to test the real-time syncing features.

## 🌐 Deploy to Internet (Free)

This project is a static site. You can host it instantly for free:
*   **Netlify Drop**: Drag and drop the folder onto [Netlify Drop](https://app.netlify.com/drop).
*   **GitHub Pages**: Push this code to a public GitHub repository, enable **Pages** in settings, and choose the `main` branch.
