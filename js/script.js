/**
 * WeatherNow — Live Weather Dashboard
 * Vanilla JavaScript (ES6+) with Fetch API, Async/Await & Open-Meteo APIs
 */

"use strict";

/* ==========================================================================
   1. Constants & WMO Weather Code Mapping
   ========================================================================== */
const GEOCODING_API_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API_BASE = "https://api.open-meteo.com/v1/forecast";
const DEFAULT_CITY = "Jabalpur";
const THEME_STORAGE_KEY = "weathernow-theme";

/**
 * Open-Meteo WMO Weather Interpretation Codes
 * Maps numeric WMO codes to human-readable descriptions and icon keys.
 */
const WEATHER_CODES = {
  0: { label: "Clear Sky", icon: "clear" },
  1: { label: "Mainly Clear", icon: "mainly-clear" },
  2: { label: "Partly Cloudy", icon: "partly-cloudy" },
  3: { label: "Overcast", icon: "overcast" },
  45: { label: "Fog", icon: "fog" },
  48: { label: "Fog", icon: "fog" },
  51: { label: "Drizzle", icon: "drizzle" },
  53: { label: "Drizzle", icon: "drizzle" },
  55: { label: "Drizzle", icon: "drizzle" },
  56: { label: "Freezing Drizzle", icon: "freezing" },
  57: { label: "Freezing Drizzle", icon: "freezing" },
  61: { label: "Rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Rain", icon: "rain" },
  66: { label: "Freezing Rain", icon: "freezing" },
  67: { label: "Freezing Rain", icon: "freezing" },
  71: { label: "Snowfall", icon: "snow" },
  73: { label: "Snowfall", icon: "snow" },
  75: { label: "Snowfall", icon: "snow" },
  77: { label: "Snow Grains", icon: "snow" },
  80: { label: "Rain Showers", icon: "showers" },
  81: { label: "Rain Showers", icon: "showers" },
  82: { label: "Rain Showers", icon: "showers" },
  85: { label: "Snow Showers", icon: "snow" },
  86: { label: "Snow Showers", icon: "snow" },
  95: { label: "Thunderstorm", icon: "thunderstorm" },
  96: { label: "Thunderstorm with Hail", icon: "hail" },
  99: { label: "Thunderstorm with Hail", icon: "hail" }
};

const ERROR_MESSAGES = {
  EMPTY_INPUT: "Please enter a city name.",
  CITY_NOT_FOUND: "City not found. Please check the spelling.",
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  API_ERROR: "Weather data is temporarily unavailable.",
  LOADING: "Fetching weather information..."
};

/* ==========================================================================
   2. DOM Element References
   ========================================================================== */
const dom = {
  currentDateDisplay: document.getElementById("current-date-display"),
  themeToggle: document.getElementById("theme-toggle"),
  themeIconSun: document.getElementById("theme-icon-sun"),
  themeIconMoon: document.getElementById("theme-icon-moon"),
  themeToggleLabel: document.getElementById("theme-toggle-label"),

  searchForm: document.getElementById("search-form"),
  cityInput: document.getElementById("city-input"),
  clearInputBtn: document.getElementById("clear-input-btn"),
  searchBtn: document.getElementById("search-btn"),
  cityChips: document.querySelectorAll(".city-chip"),

  loadingBanner: document.getElementById("loading-banner"),
  loadingText: document.getElementById("loading-text"),
  errorBanner: document.getElementById("error-banner"),
  errorText: document.getElementById("error-text"),

  weatherContent: document.getElementById("weather-content"),
  cityRegion: document.getElementById("city-region"),
  cityName: document.getElementById("city-name"),
  weatherUpdated: document.getElementById("weather-updated"),
  currentWeatherIcon: document.getElementById("current-weather-icon"),
  currentTemp: document.getElementById("current-temp"),
  weatherDescription: document.getElementById("weather-description"),
  feelsLike: document.getElementById("feels-like"),
  currentHumidity: document.getElementById("current-humidity"),
  currentWind: document.getElementById("current-wind"),
  currentPrecipitation: document.getElementById("current-precipitation"),
  currentSunrise: document.getElementById("current-sunrise"),
  currentSunset: document.getElementById("current-sunset"),

  timezoneBadge: document.getElementById("timezone-badge"),
  metricHumidityVal: document.getElementById("metric-humidity-val"),
  metricHumidityBar: document.getElementById("metric-humidity-bar"),
  metricHumidityNote: document.getElementById("metric-humidity-note"),
  metricWindVal: document.getElementById("metric-wind-val"),
  metricWindBar: document.getElementById("metric-wind-bar"),
  metricWindNote: document.getElementById("metric-wind-note"),
  metricPressureVal: document.getElementById("metric-pressure-val"),
  metricPressureBar: document.getElementById("metric-pressure-bar"),
  metricPressureNote: document.getElementById("metric-pressure-note"),
  metricCloudsVal: document.getElementById("metric-clouds-val"),
  metricCloudsBar: document.getElementById("metric-clouds-bar"),
  metricCloudsNote: document.getElementById("metric-clouds-note"),
  metricUvVal: document.getElementById("metric-uv-val"),
  metricUvBadge: document.getElementById("metric-uv-badge"),
  metricUvBar: document.getElementById("metric-uv-bar"),
  metricUvNote: document.getElementById("metric-uv-note"),

  forecastGrid: document.getElementById("forecast-grid")
};

let isFetching = false;

/* ==========================================================================
   3. Weather Description & SVG Icon Helpers
   ========================================================================== */

/**
 * Returns the human-readable description for an Open-Meteo WMO weather code.
 * @param {number} code
 * @returns {string}
 */
function getWeatherDescription(code) {
  const entry = WEATHER_CODES[code];
  return entry ? entry.label : "Unknown Weather";
}

/**
 * Returns a crisp custom SVG illustration for a given WMO code and day/night flag.
 * Uses only static trusted SVG templates.
 * @param {number} code
 * @param {boolean} isDay
 * @returns {string}
 */
function getWeatherIconSvg(code, isDay = true) {
  const key = WEATHER_CODES[code] ? WEATHER_CODES[code].icon : "overcast";

  const sunSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="14" fill="#FBBF24"/>
      <g stroke="#FCD34D" stroke-width="3.2" stroke-linecap="round">
        <line x1="32" y1="6" x2="32" y2="12"/>
        <line x1="32" y1="52" x2="32" y2="58"/>
        <line x1="6" y1="32" x2="12" y2="32"/>
        <line x1="52" y1="32" x2="58" y2="32"/>
        <line x1="13.6" y1="13.6" x2="17.8" y2="17.8"/>
        <line x1="46.2" y1="46.2" x2="50.4" y2="50.4"/>
        <line x1="50.4" y1="13.6" x2="46.2" y2="17.8"/>
        <line x1="17.8" y1="46.2" x2="13.6" y2="50.4"/>
      </g>
    </svg>`;

  const moonSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.5 39.5C33.8 39.5 26 31.7 26 22C26 17.7 27.5 13.8 30.1 10.7C21.1 11.7 14 19.3 14 28.6C14 38.6 22.1 46.7 32.1 46.7C39.8 46.7 46.4 41.9 49 35.1C47.3 37.8 45.5 39.5 43.5 39.5Z" fill="#E0F2FE" stroke="#93C5FD" stroke-width="2"/>
      <circle cx="46" cy="18" r="2.2" fill="#FDE68A"/>
      <circle cx="52" cy="25" r="1.5" fill="#FDE68A"/>
    </svg>`;

  const partlyCloudyDaySvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="10" fill="#FBBF24"/>
      <g stroke="#FCD34D" stroke-width="2.5" stroke-linecap="round">
        <line x1="24" y1="8" x2="24" y2="11"/>
        <line x1="8" y1="24" x2="11" y2="24"/>
        <line x1="12.7" y1="12.7" x2="15" y2="15"/>
        <line x1="35.3" y1="12.7" x2="33" y2="15"/>
      </g>
      <path d="M20 48H47C51.4 48 55 44.4 55 40C55 35.9 51.9 32.5 47.9 32.1C46.5 26.8 41.7 23 36 23C29.4 23 24 28.4 24 35C24 35.3 24 35.5 24.1 35.8C19.5 36.3 16 40.2 16 44.8C16 46.6 17.8 48 20 48Z" fill="#E2E8F0"/>
    </svg>`;

  const partlyCloudyNightSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29 27C23.5 27 19 22.5 19 17C19 14.8 19.7 12.8 20.9 11.2C15.9 12 12 16.3 12 21.6C12 27.4 16.7 32 22.5 32C26.5 32 29.9 29.8 31.6 26.5C30.8 26.8 29.9 27 29 27Z" fill="#BAE6FD"/>
      <path d="M20 48H47C51.4 48 55 44.4 55 40C55 35.9 51.9 32.5 47.9 32.1C46.5 26.8 41.7 23 36 23C29.4 23 24 28.4 24 35C24 35.3 24 35.5 24.1 35.8C19.5 36.3 16 40.2 16 44.8C16 46.6 17.8 48 20 48Z" fill="#CBD5E1"/>
    </svg>`;

  const overcastSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 46H48C52.4 46 56 42.4 56 38C56 33.9 52.8 30.5 48.8 30.1C47.3 24.3 42.1 20 35.8 20C28.7 20 23 25.7 23 32.8C23 33.1 23 33.4 23.1 33.7C18.1 34.2 14 38.4 14 43.5C14 44.9 14.9 46 16 46Z" fill="#CBD5E1"/>
      <path d="M10 42H26C28.8 42 31 39.8 31 37C31 34.4 29 32.2 26.4 32C25.5 28.5 22.3 26 18.6 26C14.4 26 11 29.4 11 33.6C8.2 34.1 6 36.5 6 39.4C6 40.8 7.8 42 10 42Z" fill="#94A3B8" opacity="0.85"/>
    </svg>`;

  const fogSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 36H48C51.9 36 55 32.9 55 29C55 25.3 52.2 22.3 48.6 22C47.3 17.2 42.9 13.7 37.6 13.7C31.5 13.7 26.5 18.7 26.5 24.8C22.2 25.2 18.8 28.8 18.8 33.2C18.8 34.7 17.5 36 16 36Z" fill="#CBD5E1"/>
      <g stroke="#94A3B8" stroke-width="3" stroke-linecap="round">
        <line x1="12" y1="43" x2="52" y2="43"/>
        <line x1="18" y1="50" x2="46" y2="50"/>
        <line x1="24" y1="57" x2="40" y2="57"/>
      </g>
    </svg>`;

  const drizzleSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 38H48C52 38 55 34.8 55 31C55 27.3 52.2 24.3 48.6 24C47.2 19 42.6 15.3 37.2 15.3C30.8 15.3 25.6 20.5 25.6 26.9C21 27.4 17.4 31.2 17.4 35.8C17.4 37 16.7 38 16 38Z" fill="#CBD5E1"/>
      <g stroke="#38BDF8" stroke-width="2.8" stroke-linecap="round">
        <line x1="23" y1="44" x2="21" y2="50"/>
        <line x1="33" y1="45" x2="31" y2="51"/>
        <line x1="43" y1="44" x2="41" y2="50"/>
      </g>
    </svg>`;

  const rainSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 37H48C52.1 37 55.4 33.7 55.4 29.6C55.4 25.8 52.5 22.6 48.7 22.3C47.2 17 42.4 13.2 36.7 13.2C30.1 13.2 24.7 18.6 24.7 25.2C19.8 25.7 16 29.8 16 34.8C16 36 15.5 37 15 37Z" fill="#94A3B8"/>
      <g stroke="#0EA5E9" stroke-width="3.2" stroke-linecap="round">
        <line x1="21" y1="43" x2="18" y2="54"/>
        <line x1="31" y1="43" x2="28" y2="56"/>
        <line x1="41" y1="43" x2="38" y2="54"/>
        <line x1="49" y1="43" x2="46" y2="52"/>
      </g>
    </svg>`;

  const freezingSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 37H48C52.1 37 55.4 33.7 55.4 29.6C55.4 25.8 52.5 22.6 48.7 22.3C47.2 17 42.4 13.2 36.7 13.2C30.1 13.2 24.7 18.6 24.7 25.2C19.8 25.7 16 29.8 16 34.8C16 36 15.5 37 15 37Z" fill="#94A3B8"/>
      <line x1="22" y1="43" x2="19" y2="53" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <line x1="42" y1="43" x2="39" y2="53" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="31" cy="49" r="3" fill="#E0F2FE"/>
    </svg>`;

  const snowSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 37H48C52.1 37 55.4 33.7 55.4 29.6C55.4 25.8 52.5 22.6 48.7 22.3C47.2 17 42.4 13.2 36.7 13.2C30.1 13.2 24.7 18.6 24.7 25.2C19.8 25.7 16 29.8 16 34.8C16 36 15.5 37 15 37Z" fill="#CBD5E1"/>
      <g fill="#E0F2FE">
        <circle cx="22" cy="46" r="3"/>
        <circle cx="33" cy="51" r="3"/>
        <circle cx="44" cy="46" r="3"/>
        <circle cx="27" cy="55" r="2.2"/>
        <circle cx="39" cy="55" r="2.2"/>
      </g>
    </svg>`;

  const thunderstormSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 37H48C52.1 37 55.4 33.7 55.4 29.6C55.4 25.8 52.5 22.6 48.7 22.3C47.2 17 42.4 13.2 36.7 13.2C30.1 13.2 24.7 18.6 24.7 25.2C19.8 25.7 16 29.8 16 34.8C16 36 15.5 37 15 37Z" fill="#64748B"/>
      <polygon points="34,37 25,50 32,50 29,60 41,46 34,46" fill="#FBBF24"/>
    </svg>`;

  const hailSvg = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 37H48C52.1 37 55.4 33.7 55.4 29.6C55.4 25.8 52.5 22.6 48.7 22.3C47.2 17 42.4 13.2 36.7 13.2C30.1 13.2 24.7 18.6 24.7 25.2C19.8 25.7 16 29.8 16 34.8C16 36 15.5 37 15 37Z" fill="#64748B"/>
      <polygon points="33,37 25,49 31,49 28,58 39,46 33,46" fill="#FBBF24"/>
      <circle cx="20" cy="48" r="2.6" fill="#E0F2FE"/>
      <circle cx="45" cy="48" r="2.6" fill="#E0F2FE"/>
      <circle cx="42" cy="55" r="2.2" fill="#BAE6FD"/>
    </svg>`;

  switch (key) {
    case "clear":
      return isDay ? sunSvg : moonSvg;
    case "mainly-clear":
    case "partly-cloudy":
      return isDay ? partlyCloudyDaySvg : partlyCloudyNightSvg;
    case "overcast":
      return overcastSvg;
    case "fog":
      return fogSvg;
    case "drizzle":
      return drizzleSvg;
    case "freezing":
      return freezingSvg;
    case "rain":
    case "showers":
      return rainSvg;
    case "snow":
      return snowSvg;
    case "thunderstorm":
      return thunderstormSvg;
    case "hail":
      return hailSvg;
    default:
      return overcastSvg;
  }
}

/* ==========================================================================
   4. UI State Helpers (Loading, Error, Formatting, Theme)
   ========================================================================== */

/**
 * Toggles the loading indicator and disables search controls during API calls.
 * @param {boolean} active
 */
function showLoading(active = true) {
  isFetching = active;
  dom.loadingText.textContent = ERROR_MESSAGES.LOADING;
  dom.loadingBanner.classList.toggle("hidden", !active);

  if (active) {
    dom.errorBanner.classList.add("hidden");
  }

  dom.searchBtn.disabled = active;
  dom.cityInput.disabled = active;
  dom.cityChips.forEach((chip) => {
    chip.disabled = active;
  });
}

/**
 * Displays a user-friendly error message banner.
 * Pass an empty string or null to hide the banner.
 * @param {string} message
 */
function showError(message) {
  if (!message) {
    dom.errorBanner.classList.add("hidden");
    dom.errorText.textContent = "";
    return;
  }
  dom.errorText.textContent = message;
  dom.errorBanner.classList.remove("hidden");
}

/**
 * Formats an ISO time string (e.g. "2026-11-21T06:34") to "06:34 AM".
 * @param {string|undefined} isoString
 * @returns {string}
 */
function formatClockTime(isoString) {
  if (!isoString || typeof isoString !== "string") return "N/A";
  const parts = isoString.split("T");
  if (parts.length < 2) return isoString;
  const [hourStr, minStr] = parts[1].split(":");
  const hourNum = Number(hourStr);
  if (Number.isNaN(hourNum) || !minStr) return parts[1];
  const period = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minStr} ${period}`;
}

/**
 * Formats a YYYY-MM-DD date string into weekday and short date labels.
 * @param {string} dateStr
 * @param {number} index
 * @returns {{ dayName: string, shortDate: string }}
 */
function formatForecastDate(dateStr, index) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayName =
    index === 0
      ? "Today"
      : dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const shortDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
  return { dayName, shortDate };
}

/**
 * Updates the header date and day display.
 */
function updateHeaderDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  dom.currentDateDisplay.textContent = formatted;
}

/**
 * Applies and persists the selected theme ("dark" or "light").
 * @param {"dark"|"light"} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  dom.themeIconSun.classList.toggle("hidden", !isDark);
  dom.themeIconMoon.classList.toggle("hidden", isDark);
  dom.themeToggleLabel.textContent = isDark ? "Light" : "Dark";

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage restrictions in sandboxed environments
  }
}

/**
 * Initializes saved or default dark theme.
 */
function initTheme() {
  let savedTheme = "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      savedTheme = stored;
    }
  } catch {
    savedTheme = "dark";
  }
  applyTheme(savedTheme);
}

/**
 * Helper descriptors for additional atmospheric metrics.
 */
function getHumidityNote(humidity) {
  if (humidity < 30) return "Dry air — stay hydrated";
  if (humidity <= 60) return "Comfortable humidity level";
  if (humidity <= 80) return "Moderately humid conditions";
  return "High humidity — feels muggy";
}

function getWindNote(windKmh) {
  if (windKmh < 6) return "Calm breeze";
  if (windKmh < 20) return "Gentle to moderate breeze";
  if (windKmh < 39) return "Fresh, noticeable wind";
  return "Strong winds — take care outdoors";
}

function getPressureNote(hpa) {
  if (hpa < 1005) return "Low pressure — unsettled weather likely";
  if (hpa <= 1020) return "Normal atmospheric pressure";
  return "High pressure — generally stable skies";
}

function getCloudNote(clouds) {
  if (clouds <= 20) return "Mostly clear skies";
  if (clouds <= 50) return "Scattered cloud cover";
  if (clouds <= 80) return "Broken to mostly cloudy";
  return "Dense overcast sky";
}

function getUvInfo(uv) {
  if (uv === null || uv === undefined || Number.isNaN(uv)) {
    return { badge: "Unavailable", note: "UV index data not provided", percent: 0 };
  }
  const percent = Math.min(100, Math.round((uv / 11) * 100));
  if (uv < 3) return { badge: "Low", note: "Minimal sun protection needed", percent };
  if (uv < 6) return { badge: "Moderate", note: "Wear sunglasses & SPF 30+ midday", percent };
  if (uv < 8) return { badge: "High", note: "Protection required — seek shade near noon", percent };
  if (uv < 11) return { badge: "Very High", note: "Extra protection needed — limit midday sun", percent };
  return { badge: "Extreme", note: "Avoid direct sun exposure if possible", percent };
}

/* ==========================================================================
   5. API Integration (Open-Meteo Geocoding & Forecast)
   ========================================================================== */

/**
 * Searches for a city using the Open-Meteo Geocoding API.
 * @param {string} cityName
 * @returns {Promise<{name: string, country: string, admin1: string, latitude: number, longitude: number}>}
 */
async function findCity(cityName) {
  const encodedCity = encodeURIComponent(cityName.trim());
  const url = `${GEOCODING_API_BASE}?name=${encodedCity}&count=1&language=en&format=json`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.API_ERROR);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    throw new Error(ERROR_MESSAGES.CITY_NOT_FOUND);
  }

  const match = data.results[0];
  return {
    name: match.name,
    country: match.country || "",
    admin1: match.admin1 || "",
    latitude: match.latitude,
    longitude: match.longitude
  };
}

/**
 * Fetches current weather and 5-day forecast from Open-Meteo Forecast API.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Object>}
 */
async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure,cloud_cover",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "5"
  });

  const url = `${FORECAST_API_BASE}?${params.toString()}`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.API_ERROR);
  }

  const data = await response.json();
  if (!data || !data.current || !data.daily) {
    throw new Error(ERROR_MESSAGES.API_ERROR);
  }

  return data;
}

/* ==========================================================================
   6. DOM Rendering Functions
   ========================================================================== */

/**
 * Renders the Current Weather Card and Additional Weather Information.
 * Uses textContent for all API/user-derived strings to prevent XSS.
 * @param {Object} data - Open-Meteo forecast API response
 * @param {Object} city - Geocoded city object
 */
function renderCurrentWeather(data, city) {
  const current = data.current;
  const daily = data.daily;
  const isDay = current.is_day === 1;
  const description = getWeatherDescription(current.weather_code);

  // Location & Metadata
  const regionParts = [city.admin1, city.country].filter(Boolean);
  dom.cityRegion.textContent = regionParts.join(", ") || "Global Location";
  dom.cityName.textContent = city.country
    ? `${city.name}, ${city.country}`
    : city.name;
  dom.weatherUpdated.textContent = `Coordinates: ${city.latitude.toFixed(2)}°, ${city.longitude.toFixed(2)}° · ${isDay ? "Daytime" : "Nighttime"}`;
  dom.timezoneBadge.textContent = data.timezone_abbreviation || data.timezone || "Local Time";

  // Primary Temperature & Condition
  dom.currentTemp.textContent = Math.round(current.temperature_2m);
  dom.weatherDescription.textContent = description;
  dom.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  dom.currentWeatherIcon.innerHTML = getWeatherIconSvg(current.weather_code, isDay);

  // Current Highlights
  const humidity = Math.round(current.relative_humidity_2m ?? 0);
  const windSpeed = Number(current.wind_speed_10m ?? 0);
  const precipitation = Number(current.precipitation ?? 0);
  const sunrise = Array.isArray(daily.sunrise) ? formatClockTime(daily.sunrise[0]) : "N/A";
  const sunset = Array.isArray(daily.sunset) ? formatClockTime(daily.sunset[0]) : "N/A";

  dom.currentHumidity.textContent = `${humidity}%`;
  dom.currentWind.textContent = `${windSpeed.toFixed(1)} km/h`;
  dom.currentPrecipitation.textContent = `${precipitation.toFixed(1)} mm`;
  dom.currentSunrise.textContent = sunrise;
  dom.currentSunset.textContent = sunset;

  // Additional Atmospheric Insights
  const pressure = Math.round(current.surface_pressure ?? 1013);
  const cloudCover = Math.round(current.cloud_cover ?? 0);
  const uvMax =
    Array.isArray(daily.uv_index_max) && daily.uv_index_max[0] !== null && daily.uv_index_max[0] !== undefined
      ? Number(daily.uv_index_max[0])
      : null;

  dom.metricHumidityVal.textContent = `${humidity}%`;
  dom.metricHumidityBar.style.width = `${Math.min(100, Math.max(0, humidity))}%`;
  dom.metricHumidityNote.textContent = getHumidityNote(humidity);

  dom.metricWindVal.textContent = `${windSpeed.toFixed(1)} km/h`;
  dom.metricWindBar.style.width = `${Math.min(100, Math.round((windSpeed / 60) * 100))}%`;
  dom.metricWindNote.textContent = getWindNote(windSpeed);

  dom.metricPressureVal.textContent = `${pressure} hPa`;
  const pressurePct = Math.min(100, Math.max(8, Math.round(((pressure - 970) / 80) * 100)));
  dom.metricPressureBar.style.width = `${pressurePct}%`;
  dom.metricPressureNote.textContent = getPressureNote(pressure);

  dom.metricCloudsVal.textContent = `${cloudCover}%`;
  dom.metricCloudsBar.style.width = `${Math.min(100, Math.max(0, cloudCover))}%`;
  dom.metricCloudsNote.textContent = getCloudNote(cloudCover);

  const uvInfo = getUvInfo(uvMax);
  dom.metricUvVal.textContent = uvMax !== null ? uvMax.toFixed(1) : "N/A";
  dom.metricUvBadge.textContent = uvInfo.badge;
  dom.metricUvBar.style.width = `${uvInfo.percent}%`;
  dom.metricUvNote.textContent = uvInfo.note;

  dom.weatherContent.classList.remove("hidden");
}

/**
 * Renders the 5-Day Weather Forecast cards.
 * Uses DOM node creation and textContent for safe rendering.
 * @param {Object} data - Open-Meteo forecast API response
 */
function renderForecast(data) {
  const daily = data.daily;
  dom.forecastGrid.textContent = "";

  const dates = Array.isArray(daily.time) ? daily.time : [];
  const count = Math.min(5, dates.length);

  for (let i = 0; i < count; i += 1) {
    const { dayName, shortDate } = formatForecastDate(dates[i], i);
    const code = daily.weather_code[i];
    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const minTemp = Math.round(daily.temperature_2m_min[i]);
    const conditionText = getWeatherDescription(code);

    const card = document.createElement("article");
    card.className = "forecast-card";

    const dayEl = document.createElement("p");
    dayEl.className = "forecast-day";
    dayEl.textContent = dayName;

    const dateEl = document.createElement("p");
    dateEl.className = "forecast-date";
    dateEl.textContent = shortDate;

    const iconWrap = document.createElement("div");
    iconWrap.className = "forecast-icon";
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.innerHTML = getWeatherIconSvg(code, true);

    const condEl = document.createElement("p");
    condEl.className = "forecast-condition";
    condEl.textContent = conditionText;

    const tempsWrap = document.createElement("div");
    tempsWrap.className = "forecast-temps";

    const maxEl = document.createElement("span");
    maxEl.className = "temp-max";
    maxEl.textContent = `${maxTemp}°`;

    const minEl = document.createElement("span");
    minEl.className = "temp-min";
    minEl.textContent = `${minTemp}°`;

    tempsWrap.append(maxEl, minEl);
    card.append(dayEl, dateEl, iconWrap, condEl, tempsWrap);
    dom.forecastGrid.appendChild(card);
  }
}

/* ==========================================================================
   7. Main Search Orchestrator & Event Listeners
   ========================================================================== */

/**
 * Coordinates input validation, geocoding, weather fetching, and rendering.
 * @param {string} rawCityName
 */
async function handleCitySearch(rawCityName) {
  if (isFetching) return;

  const trimmedCity = rawCityName.trim();
  if (!trimmedCity) {
    showError(ERROR_MESSAGES.EMPTY_INPUT);
    dom.cityInput.focus();
    return;
  }

  showError("");
  showLoading(true);

  try {
    const city = await findCity(trimmedCity);
    const weatherData = await getWeather(city.latitude, city.longitude);
    renderCurrentWeather(weatherData, city);
    renderForecast(weatherData);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : ERROR_MESSAGES.API_ERROR;
    showError(message);
  } finally {
    showLoading(false);
  }
}

function initEventListeners() {
  // Form submit handles both Search button click and Enter key
  dom.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleCitySearch(dom.cityInput.value);
  });

  // Show/hide clear button without triggering any API requests on keystroke
  dom.cityInput.addEventListener("input", () => {
    const hasValue = dom.cityInput.value.length > 0;
    dom.clearInputBtn.classList.toggle("hidden", !hasValue);
  });

  dom.clearInputBtn.addEventListener("click", () => {
    dom.cityInput.value = "";
    dom.clearInputBtn.classList.add("hidden");
    dom.cityInput.focus();
  });

  // Quick-search city shortcuts
  dom.cityChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selectedCity = chip.getAttribute("data-city") || "";
      dom.cityInput.value = selectedCity;
      dom.clearInputBtn.classList.remove("hidden");
      handleCitySearch(selectedCity);
    });
  });

  // Dark / Light Theme toggle
  dom.themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

function initApp() {
  updateHeaderDate();
  initTheme();
  initEventListeners();

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Load real-time weather for default city on startup
  dom.cityInput.value = DEFAULT_CITY;
  dom.clearInputBtn.classList.remove("hidden");
  handleCitySearch(DEFAULT_CITY);
}

document.addEventListener("DOMContentLoaded", initApp);
