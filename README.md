# 🌤️ Atmosphere - Premium Full-Stack Weather Dashboard

Atmosphere is a high-fidelity, state-of-the-art web application providing real-time weather forecasts, air quality indices (AQI), and wind radar analytics. Built using the **MERN** stack (React.js + Node.js/Express.js), the app secures API integrations behind a backend proxy, leverages server-side caching, tracks search history, manages favorite locations, and renders dynamic particle animations corresponding to current weather conditions.

🚀 **Live Site Demo:** [weatherapp-smoky-three.vercel.app](https://weatherapp-smoky-three.vercel.app/)

---

## 🌟 Features

1. **API Security Backend Proxy**: Routes all weather searches and forecast checks through a secure Node/Express backend, keeping your `OPENWEATHER_API_KEY` hidden from the client browser.
2. **Precision Geolocation & Smart Fallback UI**: Queries the browser's Geolocation API to detect your local city. If coordinates are unavailable, it switches to popular city selections and autocomplete search.
3. **Air Quality Index & PM2.5 Cards**: Real-time air quality index (AQI) tracking mapped to descriptions (*Good, Fair, Moderate, Poor, Very Poor*) and PM2.5 particle density.
4. **Resilient Fallback Alerts**: Displays custom alerts on connection timeouts or geolocator blocks to prevent app crashes.
5. **Interactive Wind Radar**: Embeds a Windy.com live wind vector vector radar centered on search coordinates.
6. **Dynamic Particle Backgrounds**: Particle animation loops mapped to WMO codes (sun rays, twinkling stars, snowflakes, falling rain, and stormy lightning flashes).

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite, State Hooks, Lucide Icons, inline SVGs)
- **Backend**: Node.js, Express.js (`axios`, `cors`, `node-cache`, `dotenv`)
- **Hosting / Deployment**: Vercel (monorepo serverless functions configuration)

---

## 📐 Architecture

The application adopts a decoupled full-stack architecture where the React frontend client is strictly isolated from the backend API proxy. The backend enforces a clean **Router ➡️ Controller ➡️ Service** pattern:

```
[React Client] 
     ↓ (HTTP requests to local/Vercel endpoints)
[Express Router] (server/routes/)
     ↓
[Weather Controller] (server/controllers/) - Implements Caching & Validations
     ↓
[Weather Service] (server/services/) - Fires parallel requests via Axios
     ↓
[OpenWeatherMap API / OSM Nominatim]
```

---

## 🔌 API Integration

- **OpenWeatherMap API**:
  - `https://api.openweathermap.org/data/2.5/weather` (current temperature, wind speed, pressure, humidity).
  - `https://api.openweathermap.org/data/2.5/forecast` (hourly forecasts and 7-day calculations).
  - `https://api.openweathermap.org/data/2.5/air_pollution` (Air Quality Index and particulate components).
- **OSM Nominatim API**:
  - `https://nominatim.openstreetmap.org/reverse` (reverse-geocoding coords to local town/state names).

---

## ⚙️ Environment Setup

### Local environment
Create `.env` inside the `server/` directory:
```env
PORT=5000
OPENWEATHER_API_KEY=your_openweathermap_api_key
```

### Production environment
Set `OPENWEATHER_API_KEY` inside Vercel Dashboard -> Project Settings -> Environment Variables.

---

## 📦 Installation

From the project root directory, run the installation script to install dependencies for the root workspace, React client, and Express server:
```bash
npm run install:all
```

---

## 💻 Running Frontend

To start the Vite development server for the React client separately (runs on port `5173`):
```bash
npm run dev:frontend
```

---

## 🎛️ Running Backend

To run the Node/Express proxy server locally (runs on port `5000`):
```bash
npm run dev:backend
```

*Note: You can run both concurrently during development by calling `npm run dev` at the workspace root.*

---

## 🛡️ Error Handling

- **City not found (404)**: Backend returns structured error details, prompting the frontend to display: *"City not found. Please check the city name and try again."*
- **Invalid API key (401)**: Handled gracefully and notifies the admin to verify keys.
- **API Unavailable / Network failures**: If OWM is unreachable, backend catches Axios query codes, returns fallback warnings, and renders Retry button toggles.
- **Input Validation**: Search queries are filtered on both client and server to block numeric input and code injection.

---

## 💾 Caching

- Weather coordinate queries are cached for **10 minutes** using `node-cache` on the server to prevent API rate-limiting.
- Search queries are cached for **30 minutes** to accelerate suggestions box autocompletion.

---

## 🚀 Deployment

- The workspace root contains [vercel.json](file:///c:/Users/Varaprasad/OneDrive/Desktop/Weather%20Forecast/vercel.json) to deploy both modules concurrently.
- Pushing to GitHub triggers automatic deployments on Vercel.
