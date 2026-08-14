# Weather Forecast Application

A full-stack, API-driven weather forecasting application providing real-time weather analytics, air quality metrics, and interactive wind radars. Built using **React.js** on the frontend and a secure **Node.js + Express.js** proxy backend, the application utilizes OpenWeatherMap API integrations protected behind server-side calls, features robust server and client caching layers, and adapts dynamically to offline states.

🚀 **Live Production Link:** [weatherapp-smoky-three.vercel.app](https://weatherapp-smoky-three.vercel.app/)

---

## 🌟 Key Features

* **Current Weather**: Displays real-time temperature, condition summaries, and high/low ranges.
* **24-Hour Hourly Forecast**: Scrollable horizontal timeline displaying temperature, rain risk percentages, and icons for the next 24 hours.
* **5-Day Forecast**: Weekly Apple-style relative bar forecast visualizing minimum and maximum boundaries.
* **AQI / Pollution Information**: Live Air Quality Index tracking mapped to qualitative scales (*Good, Fair, Moderate, Poor, Very Poor*) and particulate density card displays (PM2.5, PM10, CO, NO2).
* **City Search**: Input-validated text fields mapping autocomplete queries.
* **Search Suggestions**: Instant drop-down menu autocompletion of matching global cities.
* **Recent Searches**: Records the last 5 successful city queries locally to facilitate quick-clicks.
* **Favorites**: Star-toggle location bookmarks saved inside browser storage.
* **Geolocation**: Detects user position on start via browser Geolocation API permissions.
* **Celsius/Fahrenheit Conversion**: Toggle metrics unit calculations locally without triggering new backend lookups.
* **Dynamic Weather Animations**: Fluid CSS keyframe background animations mapping particle nodes to active weather codes (star twinkling, cloud cover, falling snow, rain, and stormy lightning).
* **Wind/Radar Map**: Responsive live Windy.com wind vector map iframe tracking coordinates.
* **Loading States**: Full-screen loader overlay displaying dynamic text matching active city lookups (e.g., *"Searching Hyderabad..."*).
* **Error Handling**: Custom mappings for OWM response exceptions (401, 404, 429, 5xx) to clear, readable toast alerts.
* **Retry Functionality**: Integrated inline and overlay Retry buttons to reload data on network fail.
* **Offline Support**: Handles browser disconnect states gracefully via connection trackers.
* **Local Fallback Weather Data**: Displays last-known weather data on connection loss instead of breaking layouts.
* **Server-Side Caching**: 5-minute in-memory caching mapping search and coordinate parameters to reduce API traffic.
* **Responsive Design**: Auto-adjusting flex/grid columns supporting mobile, tablet, laptop, and desktop viewports.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite, State Hooks, SVGs, Lucide Icons)
* **Backend**: Node.js, Express.js (Axios)
* **Server Caching**: `node-cache` (in-memory)
* **Client Caching**: `localStorage` (offline preservation)
* **Styling**: Pure CSS (Glassmorphism, CSS Variables, Responsive Grid)
* **Hosting**: Vercel (Static Web Server + Serverless Functions)

---

## 📐 Architecture

The application is structured as a decoupled full-stack monorepo:

```
[React Client]
      ↓ (Secure HTTP calls)
[Express Proxy Router] 
      ↓
[Weather Controller] (Cache Check)
      ↓
[Weather Service] (Axios Parallel requests)
      ↓
[OpenWeatherMap API / OSM Nominatim API]
```

### 💾 Caching Strategy
* **Server-Side Cache**: In-memory `node-cache` on the backend with a **5-minute (300 seconds)** TTL. Protects against API rate limits and speeds up repeated queries for the same city across concurrent users.
* **Client-Side Cache**: Local browser `localStorage` containing the last successfully retrieved weather data. When the client is offline or the server fails, the client loads the city's cached backup payload as a resilient fallback.

---

## 🔌 API Endpoints

### 1. `GET /api/weather`
Fetches comprehensive weather, forecast, and air pollution details for a target location.
* **Query Parameters**:
  * `city` (string) - *Optional*. Resolves name queries (e.g., `/api/weather?city=Hyderabad`).
  * `lat` & `lon` (numbers) - *Optional*. Resolves direct coordinates (e.g., `/api/weather?lat=17.385&lon=78.486`).
* **Response**: Combined JSON payload mapping current conditions, 24-hour hourly slots, 7-day daily values, AQI components, and geocoded name tags.

### 2. `GET /api/search`
Queries location matches for search bar autocompletion.
* **Query Parameters**:
  * `q` (string) - *Required*. Match characters (e.g., `/api/search?q=lon`).
* **Response**: List of up to 5 matching locations with name tags, state tags, and coordinates.

---

## 🛡️ Security Measures

* **Hidden API Keys**: All OpenWeatherMap requests are proxy-routed. The browser never accesses the private `OPENWEATHER_API_KEY`.
* **Git Ignored Secrets**: `.env` and `server/.env` files are ignored by Git.
* **CORS Restrictions**: Express middleware permits API access only to configured origins.
* **Input Validation**: Search queries are sanitized against malicious scripts using a strict regex allowing alphanumeric characters: `/^[a-zA-Z0-9\s-,\u00C0-\u017F]+$/`.
* **Request Timeout**: Outbound service fetches to external endpoints enforce a strict **8-second timeout** to avoid resource leaks.

---

## 🛡️ Error & Fallback Handling

* **401 Invalid Key**: Handled gracefully and notifies coordinates to check backend credentials.
* **404 City Not Found**: Bubbles up clean warnings: *"City not found. Please check the city name and try again."*
* **Offline Fallbacks**: Displays previously saved local backups. A warning is shown next to the timestamp: *"Showing cached fallback data (from: [Time])"*.
* **Different City Isolation**: Local caches are isolated per city, preventing one city from displaying stale data belonging to another.

---

## ⚙️ Environment Variables

Create `server/.env` with these keys (which is git-excluded):
```env
PORT=5000
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
DEMO_MODE=false
```

---

## 📂 Project Structure

```bash
Weather_Forecast/
├── api/
│   └── index.js             # Vercel entrypoint proxying server/server.js
├── client/                  # React Frontend Subdirectory
│   ├── src/
│   │   ├── components/      # Particle overlays, metrics, forecasts
│   │   ├── pages/           # Dashboard page, fallback overlays
│   │   ├── services/        # Client API proxy callers
│   │   ├── hooks/           # Offline status trackers, localStorage bookmarks
│   │   ├── App.jsx          # Root component
│   │   ├── index.css        # Responsive stylesheet
│   │   └── main.jsx         # App mounting
│   ├── package.json         # React dependencies
│   └── vite.config.js       # Vite React server configuration
├── server/                  # Node.js + Express.js Subdirectory
│   ├── routes/              # Express route endpoints (/api/*)
│   ├── controllers/         # Caching check and coord resolvers
│   ├── services/            # Axios requests querying OpenWeatherMap
│   ├── middleware/          # JSON global errorHandler
│   ├── server.js            # Server file
│   └── package.json         # Backend dependencies
├── vercel.json              # Monorepo serverless deployment configs
├── package.json             # Root Concurrent workspace configs
├── .gitignore               # Ignored files
└── README.md                # Application documentation
```

---

## 📦 Installation & Local Run

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MuthyalaVaraprasad/Weather_Forecast.git
   cd Weather_Forecast
   ```
2. **Install Dependencies**:
   Install client, server, and workspace modules concurrently:
   ```bash
   npm run install:all
   ```
3. **Configure Environment Variables**:
   Create a `.env` inside `/server` as shown in the **Environment Variables** section.
4. **Start Development Servers**:
   Concurrently boot the Express proxy and the Vite development client:
   ```bash
   npm run dev
   ```
5. **Run Production Build**:
   Verify compilation output redirects to the root `dist/` directory:
   ```bash
   npm run build
   ```

---

## 🚀 Deployment

The project is configured for continuous delivery on **Vercel** using `vercel.json` configurations. Pushing to your GitHub repository triggers a fresh build automatically. Production environment variables are mapped inside Vercel Dashboard -> Project Settings -> Environment Variables.
