// Prévisions météo/marines pour décider si une sortie planifiée doit être
// annulée automatiquement (vent, houle, orage, fortes précipitations), et
// relevé des conditions passées pour l'affichage sur une sortie déjà
// réalisée (voir SortieService.getPrevisionMeteo).
// Open-Meteo : gratuit, sans clé API, HTTPS — choisi pour la même raison que
// Groq côté vie-associative-service (voir groqClient.js) : rien à
// configurer/payer pour que ça marche en local comme en prod.
//   - Forecast API (vent, code météo, précipitations) : jusqu'à 16 jours dans
//     le futur, et jusqu'à 92 jours dans le passé via `past_days` (mêmes
//     champs `daily`, ce sont alors des relevés observés, pas une
//     prévision).
//   - Marine API (houle) : mêmes fenêtres, mais couverture limitée aux zones
//     océaniques — best-effort, absent si le point n'est pas en mer ou hors
//     fenêtre, ça ne bloque pas le reste.
//   - Archive API : au-delà de 92 jours dans le passé, relevé historique
//     (des décennies de recul) mais sans données marines (pas de houle).
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const MARINE_FORECAST_DAYS_MAX = 10;
const PAST_DAYS_MAX = 92;
const TIMEOUT_MS = 10000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Météo : réponse ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function extractDayValue(daily, dateStr, field) {
  if (!daily?.time) return null;
  const idx = daily.time.indexOf(dateStr);
  if (idx === -1) return null;
  const arr = daily[field];
  return Array.isArray(arr) && arr[idx] !== undefined ? arr[idx] : null;
}

function joursDepuisAujourdhui(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

// Relevé purement historique (au-delà de la fenêtre `past_days` de l'API
// forecast) : que le vent/temps observé, pas de donnée marine (l'archive
// Open-Meteo n'en propose pas).
async function getArchivedWeatherForDate({ latitude, longitude, dateStr }) {
  const archive = await fetchJson(
    `${ARCHIVE_URL}?latitude=${latitude}&longitude=${longitude}&start_date=${dateStr}&end_date=${dateStr}&daily=weathercode,windspeed_10m_max,windgusts_10m_max,precipitation_sum&timezone=auto`,
  ).catch(() => null);

  const windspeed = extractDayValue(archive?.daily, dateStr, "windspeed_10m_max");
  const windgusts = extractDayValue(archive?.daily, dateStr, "windgusts_10m_max");
  const weathercode = extractDayValue(archive?.daily, dateStr, "weathercode");
  const precipitation = extractDayValue(archive?.daily, dateStr, "precipitation_sum");

  if (windspeed === null && weathercode === null) return null;

  return {
    date: dateStr,
    windspeed,
    windgusts,
    weathercode,
    precipitation,
    waveHeight: null,
    historique: true,
  };
}

// Renvoie les conditions du jour calendaire de `date` aux coordonnées
// données : une prévision si `date` est à venir (jusqu'à 16 jours), un
// relevé observé si `date` est passée (via `past_days` jusqu'à 92 jours en
// arrière, puis l'archive historique au-delà) — ou `null` si hors de toutes
// ces fenêtres (pas une erreur : juste "pas encore/plus disponible").
async function getForecastForDate({ latitude, longitude, date }) {
  const dateStr = dateKey(date);
  const offset = joursDepuisAujourdhui(dateStr);

  if (offset > 16) return null;
  if (offset < -PAST_DAYS_MAX) {
    return await getArchivedWeatherForDate({ latitude, longitude, dateStr });
  }

  const pastDays = offset < 0 ? Math.min(-offset, PAST_DAYS_MAX) : 0;
  const forecastDays = Math.max(offset + 1, 1);

  const [forecast, marine] = await Promise.all([
    fetchJson(
      `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&daily=weathercode,windspeed_10m_max,windgusts_10m_max,precipitation_sum&timezone=auto&past_days=${pastDays}&forecast_days=${Math.min(forecastDays, 16)}`,
    ),
    fetchJson(
      `${MARINE_URL}?latitude=${latitude}&longitude=${longitude}&daily=wave_height_max&timezone=auto&past_days=${pastDays}&forecast_days=${Math.min(forecastDays, MARINE_FORECAST_DAYS_MAX)}`,
    ).catch(() => null),
  ]);

  const windspeed = extractDayValue(forecast?.daily, dateStr, "windspeed_10m_max");
  const windgusts = extractDayValue(forecast?.daily, dateStr, "windgusts_10m_max");
  const weathercode = extractDayValue(forecast?.daily, dateStr, "weathercode");
  const precipitation = extractDayValue(forecast?.daily, dateStr, "precipitation_sum");
  const waveHeight = marine ? extractDayValue(marine.daily, dateStr, "wave_height_max") : null;

  if (windspeed === null && weathercode === null && waveHeight === null) {
    return null;
  }

  return {
    date: dateStr,
    windspeed,
    windgusts,
    weathercode,
    precipitation,
    waveHeight,
    ...(offset < 0 ? { historique: true } : {}),
  };
}

// Seuils "dangereux pour une sortie plongée loisir en mer" — pas des valeurs
// réglementaires officielles, juste un repli raisonnable tant que le
// président n'a pas d'avis contraire à faire ajuster ici. Codes météo : voir
// la table WMO utilisée par Open-Meteo (95/96/99 = orage, avec ou sans
// grêle).
const SEUIL_VENT_KMH = 38; // ~20 nœuds, force 5 Beaufort
const SEUIL_RAFALES_KMH = 55;
const SEUIL_HOULE_M = 2;
const SEUIL_PRECIPITATION_MM = 30;
const CODES_ORAGE = [95, 96, 99];

function evaluerDanger(forecast) {
  if (!forecast) return { dangereux: false, motifs: [] };
  const motifs = [];
  // "prévu" pour une date à venir, "observé" pour un relevé passé
  // (forecast.historique) — même seuils, juste le temps du verbe.
  const e = forecast.historique ? "observé" : "prévu";
  const es = forecast.historique ? "observée" : "prévue";
  const ees = forecast.historique ? "observées" : "prévues";

  if (forecast.windspeed !== null && forecast.windspeed >= SEUIL_VENT_KMH) {
    motifs.push(`Vent fort ${e} (${Math.round(forecast.windspeed)} km/h)`);
  }
  if (forecast.windgusts !== null && forecast.windgusts >= SEUIL_RAFALES_KMH) {
    motifs.push(`Rafales fortes ${ees} (${Math.round(forecast.windgusts)} km/h)`);
  }
  if (forecast.waveHeight !== null && forecast.waveHeight >= SEUIL_HOULE_M) {
    motifs.push(`Houle importante ${es} (${forecast.waveHeight.toFixed(1)} m)`);
  }
  if (forecast.weathercode !== null && CODES_ORAGE.includes(forecast.weathercode)) {
    motifs.push(forecast.historique ? "Orage observé" : "Orage prévu");
  }
  if (forecast.precipitation !== null && forecast.precipitation >= SEUIL_PRECIPITATION_MM) {
    motifs.push(`Fortes précipitations ${ees} (${Math.round(forecast.precipitation)} mm)`);
  }

  return { dangereux: motifs.length > 0, motifs };
}

module.exports = { getForecastForDate, evaluerDanger };
