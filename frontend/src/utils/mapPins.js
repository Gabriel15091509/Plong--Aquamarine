import L from "leaflet";

// Repères départ/arrivée partagés entre SortieRouteMap.jsx (itinéraire
// complet, modale) et SortieRouteMapMini.jsx (vignette de la liste en
// grille) — un seul SVG à maintenir, mêmes couleurs partout dans l'app pour
// représenter "départ club" / "arrivée site".
const createPinIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<svg width="26" height="38" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 25 13 25s13-15.3 13-25C26 5.8 20.2 0 13 0z" fill="${color}"/>
      <circle cx="13" cy="13" r="5" fill="white"/>
    </svg>`,
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
  });

export const departureIcon = createPinIcon("#16a34a");
export const arrivalIcon = createPinIcon("#dc2626");

// Icône "site de plongée" de la carte globale (SortieCartePage) : un
// regroupement par coordonnées peut représenter plusieurs sorties (même spot
// visité à des dates différentes) — badge numéroté au coin du pin quand
// count > 1, pin nu sinon. Couleur passée en paramètre (voir
// STATUT_PIN_COLOR dans SortieCartePage.jsx) : reflète le statut de la/des
// sortie(s) à cet endroit plutôt qu'une teinte fixe. Le badge de comptage
// reste toujours gris foncé, neutre, pour ne jamais se confondre avec cette
// couleur de statut (ex: site "Annulée" — pin rouge — avec 3 sorties : le
// badge "3" doit rester lisible comme un simple compteur, pas comme un
// second signal de statut).
export const createSiteIcon = (count = 1, color = "#4f46e5") =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;width:26px;height:38px;">
      <svg width="26" height="38" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 25 13 25s13-15.3 13-25C26 5.8 20.2 0 13 0z" fill="${color}"/>
        <circle cx="13" cy="13" r="5" fill="white"/>
      </svg>
      ${
        count > 1
          ? `<span style="position:absolute;top:-6px;right:-7px;min-width:16px;height:16px;padding:0 3px;border-radius:9999px;background:#1f2937;color:#fff;font:700 10px/16px sans-serif;text-align:center;box-shadow:0 0 0 2px #fff;">${count}</span>`
          : ""
      }
    </div>`,
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
  });
