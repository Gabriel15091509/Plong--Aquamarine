// Sous Vite/ESM, Leaflet ne résout pas correctement les URLs de ses icônes
// de marqueur par défaut (webpack-only resolution) — sans ce correctif les
// marqueurs affichent une icône cassée. À importer une seule fois, au
// démarrage de l'app (voir main.jsx), jamais dans les composants carte
// eux-mêmes.
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
