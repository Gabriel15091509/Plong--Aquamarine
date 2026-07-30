// Géocodage inverse via Nominatim (OpenStreetMap), gratuit et sans clé —
// utilisé pour remplir automatiquement les champs "Lieu" et "Site" quand le
// président clique sur la carte, plutôt que de les saisir à la main. Usage
// volontairement léger (un clic occasionnel dans un formulaire, pas un flux à
// fort volume) : respecte la limite d'1 req/s de Nominatim sans file
// d'attente dédiée.
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

class GeocodingService {
  // "Lieu" = la localité (ex. "Saint-Leu") — "Site" = le repère le plus
  // précis renvoyé à cet endroit (nom de POI si le point tombe dessus, sinon
  // quartier/route) — les vrais surnoms de spots de plongée ("Tour de
  // Boucan"...) ne sont pas référencés dans OpenStreetMap, donc "Site" reste
  // une suggestion à affiner à la main plutôt qu'une valeur définitive.
  async reverseGeocode(lat, lng) {
    const url = `${NOMINATIM_REVERSE_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Nominatim request failed");
    const data = await response.json();
    const a = data.address || {};

    const lieu =
      a.town || a.city || a.village || a.municipality || a.county || null;
    const site =
      data.name ||
      a.neighbourhood ||
      a.suburb ||
      a.quarter ||
      a.hamlet ||
      a.road ||
      null;

    return { lieu, site: site && site !== lieu ? site : null };
  }
}

export default new GeocodingService();
