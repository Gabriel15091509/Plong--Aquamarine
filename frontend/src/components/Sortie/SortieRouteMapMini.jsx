import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { CLUB_LOCATION } from "../../utils/constants";
import { departureIcon, arrivalIcon } from "../../utils/mapPins";

// Aperçu compact et non interactif de l'itinéraire (départ club -> site),
// utilisé dans la vignette de la liste en grille des sorties (SortiesPage) à
// la place de l'icône générique quand aucune photo n'est définie. Pas de
// calcul d'itinéraire OSRM ici (ce serait une requête réseau par carte
// affichée, potentiellement une douzaine par page) : seuls les deux repères
// sont posés, le tracé complet ne se calcule que dans la modale
// (SortieRouteModal, via SortieRouteMap) ouverte au clic sur la vignette.
// Interactions désactivées (dragging, zoom...) : c'est un aperçu, pas une
// vraie carte navigable — le conteneur parent gère le clic pour ouvrir la
// modale.
const SortieRouteMapMini = ({ siteLat, siteLng }) => {
  const clubPoint = [CLUB_LOCATION.lat, CLUB_LOCATION.lng];
  const sitePoint = [siteLat, siteLng];

  return (
    <MapContainer
      bounds={[clubPoint, sitePoint]}
      boundsOptions={{ padding: [24, 24] }}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={clubPoint} icon={departureIcon} />
      <Marker position={sitePoint} icon={arrivalIcon} />
    </MapContainer>
  );
};

export default SortieRouteMapMini;
