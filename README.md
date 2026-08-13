# 🌤️ Atmosphere - Premium Glassmorphic Weather Dashboard

Atmosphere is a high-fidelity, state-of-the-art web application providing real-time weather forecasts and analytics. Featuring a premium glassmorphic UI, dynamic weather-based animated particles, interactive wind maps, and instant unit conversion, the app delivers a fluid, responsive weather intelligence dashboard tailored to any device.

🚀 **Live Site Demo:** [weatherapp-smoky-three.vercel.app](https://weatherapp-smoky-three.vercel.app/)

---

## 🌟 Key Features

1. **Precision Geolocation & Smart Fallback UI**:
   - Seamlessly queries the browser's Geolocation API to instantly detect your local city.
   - If coordinates are restricted or unavailable, it automatically switches to a beautiful fallback prompt modal offering popular cities (New York, London, Tokyo, Paris, Sydney, Singapore) and a live autocomplete search bar.
   - Saves searches to `localStorage` to instantly bypass search alerts on return visits.

2. **Real-Time API Integrations**:
   - Integrates keyless endpoints from **Open-Meteo API** to load current weather conditions, 24-hour hourly temperatures, and 7-day extended forecasts.
   - Leverages **OSM Nominatim API** for reverse-geocoding coordinates to actual location names.

3. **Interactive Windy.com Map Integration**:
   - Embeds an interactive wind layer radar widget that automatically centers on your searched city's coordinates to let you inspect wind vectors.

4. **Dynamic Particle Backgrounds**:
   - Spawns background particle systems responding to current WMO weather codes:
     - **Clear Days**: Pulse solar rays.
     - **Clear Nights**: Twinkle 40 stars.
     - **Rain / Drizzle**: Animate falling rain lines.
     - **Snow / Sleet**: Drift floating snowflakes.
     - **Storms**: Fall rain coupled with random simulated lightning screen flashes.

5. **Locked Viewport Responsive Layout**:
   - **Desktop Screens (>=1024px)**: Fits strictly to the screen viewport (`100vh`) with no main body scrollbar, allowing left and right panels to scroll independently.
   - **Mobile Screens (<1024px)**: Collapses seamlessly to stack panels vertically with fluid mobile dimensions.

6. **Instant Unit Switcher**:
   - Switch between **Celsius (°C)** and **Fahrenheit (°F)** dynamically. Converts values instantly on the client side without triggering extra API requests.

---

## 🛠️ Technology Stack

- **Markup & Structure**: HTML5 (Semantic elements, modern attributes)
- **Styles & Layout**: Vanilla CSS3 (Custom properties, CSS Grids, Flexbox, Keyframes)
- **Logic & Interactions**: JavaScript ES6+ (Async/Await, Geolocation API, LocalStorage, Nominatim search debouncing)
- **Icons**: [Lucide Icons Library](https://lucide.dev/)
- **Hosting / Deploy**: Vercel

---

## 📁 Project Structure

```bash
PRODIGY_WD_05/
├── index.html       # Application layout & UI overlays
├── style.css        # Dashboard styling, animation keyframes, & media queries
├── app.js           # API fetching, particle loops, toggling state, & search debouncing
└── README.md        # Project documentation
```

---

## 🚀 Running Locally

To run the application locally with full Geolocation support:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MuthyalaVaraprasad/PRODIGY_WD_05.git
   cd PRODIGY_WD_05
   ```

2. **Start a local server**:
   - **Python**:
     ```bash
     python -m http.server 8080
     ```
   - **Node.js (NPM)**:
     ```bash
     npx http-server -p 8080
     ```

3. **View in browser**:
   Navigate to `http://localhost:8080` in your web browser.

---

## 🧑‍💻 Designed By

Designed & developed by **Muthyala Varaprasad**.
Licensed under the MIT License.
