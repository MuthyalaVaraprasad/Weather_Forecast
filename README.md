# 🌤️ Atmosphere - Premium Full-Stack Weather Dashboard

Atmosphere is a high-fidelity, state-of-the-art web application providing real-time weather forecasts, air quality indices (AQI), and wind radar analytics. Built using the **MERN** stack (React.js + Node.js/Express.js), the app secures API integrations behind a backend proxy, leverages server-side caching, tracks search history, manages favorite locations, and renders dynamic particle animations corresponding to current weather conditions.

🚀 **Live Site Demo:** [weatherapp-smoky-three.vercel.app](https://weatherapp-smoky-three.vercel.app/)

---

## 🌟 Key Features

1. **API Security Backend Proxy**:
   - Routes all weather searches and forecast checks through a secure Node/Express backend.
   - Hides your `OPENWEATHER_API_KEY` on the server-side, preventing API key exposure in the client browser.

2. **Real-Time API Integrations**:
   - Integrates secure calls to **OpenWeatherMap API** endpoints (Current Weather, 5-Day/3-Hour Forecasts, and Air Pollution tracking).
   - Resolves location coordinates and names using **OSM Nominatim API**.

3. **Performance Optimization Caching**:
   - Leverages server-side in-memory caching via `node-cache` (weather/pollution queries stored for 10 minutes, searches stored for 30 minutes) to minimize rate-limiting and maximize response times.

4. **Connection Failure & Fallback Resilience**:
   - Includes real-time browser online/offline status banners.
   - Embeds **Connection Retry** buttons on the dashboard and fallback overlays if calls fail.
   - Implements a fail-safe Demo Mock Mode if OpenWeatherMap API keys are missing.

5. **Search History & Favorites Manager**:
   - Persists a dynamic "Recent Searches" history checklist (up to 5 cities).
   - Allows users to star favored cities, saving bookmark locations to `localStorage` for rapid quick-chip navigation.

6. **Interactive Wind Radar**:
   - Embeds a Windy.com live wind vector vector radar centered on search coordinates.

7. **Dynamic Particle Sky Backgrounds**:
   - Renders background animations mapped to active weather states (sun rays, twinkling stars, snowflakes, falling rain, and stormy lightning flashes).

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite, State Hooks, Lucide Icons, inline SVGs)
- **Backend**: Node.js, Express.js (`dotenv`, `cors`, `node-cache`)
- **Hosting / Deployment**: Vercel (monorepo serverless functions configuration)

---

## 📁 Project Structure

```bash
Weather Forecast/
├── api/
│   ├── index.js          # Express app (Serverless-ready API Proxy)
│   └── cache.js          # In-memory caching utility (node-cache wrapper)
├── src/
│   ├── App.jsx           # Main React component
│   ├── index.css         # Glassmorphic layout & animation system
│   ├── main.jsx          # React entrypoint
├── public/               # Static assets
├── vercel.json           # Vercel deployment routes & overrides
├── vite.config.js        # Vite + local proxy configurations
├── .env                  # Local environment configuration
└── README.md             # Project documentation
```

---

## 🚀 Running Locally

To run the application locally:

1. **Configure Environment Variables**:
   Duplicate `.env.example` as `.env` and insert your OpenWeatherMap API credentials:
   ```env
   PORT=5000
   OPENWEATHER_API_KEY=your_openweathermap_api_key
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Servers**:
   Run the following command to boot both the Express server (port 5000) and the Vite frontend (port 5173) concurrently:
   ```bash
   npm run dev
   ```

4. **View in Browser**:
   Open `http://localhost:5173` in your web browser.
