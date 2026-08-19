// Géocodage (direct et inverse) via Nominatim (OpenStreetMap), gratuit et
// sans clé — utilisé pour remplir automatiquement les champs "Lieu" et
// "Site" (clic sur la carte → reverseGeocode, ou saisie au clavier avec
// suggestions → search) plutôt que de tout saisir à la main. Usage
// volontairement léger (recherche interactive dans un formulaire, pas un
// flux à fort volume) : respecte la limite d'1 req/s de Nominatim sans file
// d'attente dédiée — le composant appelant est responsable du debounce.
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

// Le club est basé à La Réunion : on biaise (sans exclure, `bounded=0`) les
// résultats de recherche vers l'île pour que "Saint-Leu" remonte avant une
// commune homonyme métropolitaine, sans empêcher de saisir un lieu ailleurs
// (sortie exceptionnelle hors département).
const REUNION_VIEWBOX = "55.0,-21.5,56.0,-20.7";

class GeocodingService {
  async reverseGeocode(lat, lng) {
    const url = `${NOMINATIM_REVERSE_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Nominatim request failed");
    const data = await response.json();
    return this._toLieuSite(data);
  }

  // Recherche directe (autocomplétion) : l'utilisateur tape dans le champ
  // "Lieu" et on propose des suggestions, chacune avec ses coordonnées pour
  // pouvoir recentrer la carte dès la sélection — même logique de mapping
  // adresse → { lieu, site } que le géocodage inverse, pour un résultat
  // cohérent quel que soit le sens (clic carte ↔ saisie clavier).
  //
  // `bounded=0` (essayé en premier lors de la mise en place) ne fait que
  // *préférer* la Réunion sans l'imposer : le classement par "importance"
  // de Nominatim continue à faire remonter des homonymes métropolitains
  // plus connus avant le vrai spot réunionnais (constaté en vérifiant avec
  // Playwright : "Saint-Gilles" ne renvoyait que des communes de métropole,
  // aucune ne correspondant à Saint-Gilles-les-Bains). On force donc
  // `bounded=1` (résultats strictement dans l'île) et on ne retente sans
  // borne que si ça ne renvoie rien — cas d'une sortie exceptionnelle hors
  // département, qui reste possible mais n'est plus le résultat par défaut.
  async search(query, { signal, limit = 5 } = {}) {
    const q = query?.trim();
    if (!q || q.length < 3) return [];
    const baseParams =
      `format=jsonv2&q=${encodeURIComponent(q)}` +
      `&addressdetails=1&limit=${limit}&accept-language=fr` +
      `&viewbox=${REUNION_VIEWBOX}`;
    let data = await this._fetchSearch(`${baseParams}&bounded=1`, signal);
    if (data.length === 0) {
      data = await this._fetchSearch(`${baseParams}&bounded=0`, signal);
    }
    return data.map((item) => ({
      id: item.place_id,
      lat: Number(item.lat),
      lng: Number(item.lon),
      label: item.display_name,
      ...this._toLieuSite(item),
    }));
  }

  async _fetchSearch(params, signal) {
    const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, { signal });
    if (!response.ok) throw new Error("Nominatim request failed");
    return response.json();
  }

  // "Lieu" = la localité (ex. "Saint-Leu") — "Site" = le repère le plus
  // précis renvoyé à cet endroit (nom de POI si le point tombe dessus, sinon
  // quartier/route) — les vrais surnoms de spots de plongée ("Tour de
  // Boucan"...) ne sont pas référencés dans OpenStreetMap, donc "Site" reste
  // une suggestion à affiner à la main plutôt qu'une valeur définitive.
  _toLieuSite(data) {
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
