// Prévisions météo/marines pour décider si une sortie planifiée doit être
// annulée automatiquement (vent, houle, orage, fortes précipitations).
// Open-Meteo : gratuit, sans clé API, HTTPS — choisi pour la même raison que
// Groq côté vie-associative-service (voir groqClient.js) : rien à
// configurer/payer pour que ça marche en local comme en prod.
//   - Forecast API (vent, code météo, précipitations) : jusqu'à 16 jours.
//   - Marine API (houle) : couverture limitée aux zones océaniques, fenêtre
//     de prévision plus courte (~10 jours) — best-effort, absent si le point
//     n'est pas en mer ou hors fenêtre, ça ne bloque pas le reste.
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
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

// Renvoie les prévisions du jour calendaire de `date` aux coordonnées
// données, ou `null` si cette date est hors des fenêtres de prévision des
// deux API (pas une erreur : juste "pas encore prévisible", à revérifier au
// passage suivant du cron).
async function getForecastForDate({ latitude, longitude, date }) {
  const dateStr = dateKey(date);
  const [forecast, marine] = await Promise.all([
    fetchJson(
      `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&daily=weathercode,windspeed_10m_max,windgusts_10m_max,precipitation_sum&timezone=auto&forecast_days=16`,
    ),
    fetchJson(
      `${MARINE_URL}?latitude=${latitude}&longitude=${longitude}&daily=wave_height_max&timezone=auto&forecast_days=10`,
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

  return { date: dateStr, windspeed, windgusts, weathercode, precipitation, waveHeight };
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

  if (forecast.windspeed !== null && forecast.windspeed >= SEUIL_VENT_KMH) {
    motifs.push(`Vent fort prévu (${Math.round(forecast.windspeed)} km/h)`);
  }
  if (forecast.windgusts !== null && forecast.windgusts >= SEUIL_RAFALES_KMH) {
    motifs.push(`Rafales fortes prévues (${Math.round(forecast.windgusts)} km/h)`);
  }
  if (forecast.waveHeight !== null && forecast.waveHeight >= SEUIL_HOULE_M) {
    motifs.push(`Houle importante prévue (${forecast.waveHeight.toFixed(1)} m)`);
  }
  if (forecast.weathercode !== null && CODES_ORAGE.includes(forecast.weathercode)) {
    motifs.push("Orage prévu");
  }
  if (forecast.precipitation !== null && forecast.precipitation >= SEUIL_PRECIPITATION_MM) {
    motifs.push(`Fortes précipitations prévues (${Math.round(forecast.precipitation)} mm)`);
  }

  return { dangereux: motifs.length > 0, motifs };
}

module.exports = { getForecastForDate, evaluerDanger };
