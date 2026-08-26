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
