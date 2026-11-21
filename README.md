# WeatherNow — Live Weather Dashboard

A responsive, modern live weather forecasting dashboard built with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)** using the **Fetch API** and the free **Open-Meteo API** (no API key required).

## Project Folder Structure

```text
weather-dashboard/
├── index.html        # Semantic HTML5 layout (Header, Search, Current, Insights, 5-Day Forecast)
├── css/
│   └── style.css     # Dark/Light themes, glassmorphism cards, responsive grid & animations
├── js/
│   └── script.js     # Fetch API calls, WMO weather code mapping, safe DOM rendering & error handling
└── README.md         # Setup, API guide, step-by-step build walkthrough & testing checklist
```

## Features

- **Real-time Global Weather Search:** Search any city worldwide via button click, pressing `Enter`, or clicking quick-search city chips.
- **Current Conditions Card:** Displays city & country, live temperature (°C), feels-like temperature, custom weather icon, condition label, relative humidity, wind speed, precipitation, sunrise, and sunset.
- **Atmospheric Insights:** Visual progress bars and contextual notes for humidity, wind speed, atmospheric pressure (hPa), cloud cover (%), and daily maximum UV index.
- **5-Day Forecast:** Five daily forecast cards with day/date, weather icon, condition description, and high/low temperatures.
- **Dark & Light Mode:** Toggle between the default dark navy glassmorphism theme and a clean light sky theme (persisted in `localStorage`).
- **Robust Error Handling & Security:** Validates empty input, handles invalid cities, network disconnections, and API errors gracefully without crashing, disables controls while loading, avoids keystroke API spam, and uses `textContent` for safe DOM insertion.

---

## How to Run in VS Code with Live Server

1. **Extract or create the project folder** named `weather-dashboard/` with the exact structure shown above.
2. **Open the folder in VS Code:**
   - Launch Visual Studio Code.
   - Go to **File → Open Folder...** and select `weather-dashboard/`.
3. **Install the Live Server extension** (if not already installed):
   - Open Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`).
   - Search for **Live Server** (by Ritwick Dey) and click **Install**.
4. **Start the live preview:**
   - Open `index.html`.
   - Click **Go Live** in the bottom-right status bar (or right-click `index.html` → **Open with Live Server**).
5. Your browser will open at `http://127.0.0.1:5500/index.html` and automatically fetch live weather data.

---

## API Integration Explanation

WeatherNow uses two free, CORS-enabled **Open-Meteo** endpoints with `async/await` and `fetch()`:

1. **Open-Meteo Geocoding API (`findCity(cityName)`):**
   ```text
   https://geocoding-api.open-meteo.com/v1/search?name=CITY_NAME&count=1&language=en&format=json
   ```
   - Encodes the user's input with `encodeURIComponent(cityName.trim())`.
   - Checks `response.ok` before parsing JSON.
   - Extracts `name`, `country`, `admin1`, `latitude`, and `longitude` from `data.results[0]`.

2. **Open-Meteo Forecast API (`getWeather(latitude, longitude)`):**
   ```text
   https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure,cloud_cover&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=5
   ```
   - Fetches real-time `current` readings and 5-day `daily` forecasts automatically adjusted to the searched city's local timezone (`timezone=auto`).
   - Maps WMO numeric weather codes (`0` through `99`) via `getWeatherDescription(code)` and custom SVG weather illustrations via `getWeatherIconSvg(code, isDay)`.

---

## Step-by-Step Development Guide

1. **Step 1 — Structure (`index.html`):** Build semantic containers for the Header (`WeatherNow`, live date, theme toggle), Search form (input, submit button, quick chips, loading/error banners), Current Weather card, Atmospheric Insights grid, and 5-Day Forecast grid.
2. **Step 2 — Styling (`css/style.css`):** Define CSS custom properties for Dark and Light themes (`[data-theme="light"]`), glassmorphism cards (`backdrop-filter: blur(18px)`), smooth hover lifts, animated loading spinner, and responsive breakpoints (`1024px`, `680px`, `420px`).
3. **Step 3 — Logic (`js/script.js`):** Implement `WEATHER_CODES`, `findCity`, `getWeather`, `renderCurrentWeather`, `renderForecast`, `getWeatherDescription`, `showLoading`, and `showError`, wired to the form `submit` event so API calls only fire on explicit searches.

---

## Testing Checklist

### 1. City Search Verification
Test searching each of the following cities and confirm accurate city/country labels, temperatures, icons, and 5-day cards:
- `Pune`
- `Mumbai`
- `Delhi`
- `Jabalpur`
- `Indore`
- `London`
- `New York`

### 2. Edge Cases & Error Handling
- **Empty input:** Clear the input and click **Search** (or press `Enter`) → should display `"Please enter a city name."`
- **Invalid city:** Search `"XyzNotARealCity123"` → should display `"City not found. Please check the spelling."`
- **Network disconnection:** Open DevTools → **Network** tab → set throttling to **Offline** → search any city → should display `"Unable to connect. Please check your internet connection."` without crashing.
- **Loading state:** Observe `"Fetching weather information..."` and verify the Search button and input are disabled during the request.
- **Multiple consecutive searches:** Search `Pune`, then `London`, then `New York` back-to-back → confirm old error banners clear and all metrics/forecast cards refresh cleanly.
- **Theme toggle & responsiveness:** Switch between Dark and Light modes and test viewport widths at desktop (`1280px`), tablet (`768px`), and mobile (`375px`).
