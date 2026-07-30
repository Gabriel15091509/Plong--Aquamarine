import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { CLUB_LOCATION } from "../../utils/constants";
import geocodingService from "../../services/Sortie/geocodingService";

const round6 = (n) => Math.round(n * 1e6) / 1e6;

const hasPosition = (latitude, longitude) =>
  latitude !== "" && latitude != null && longitude !== "" && longitude != null;

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(round6(e.latlng.lat), round6(e.latlng.lng));
    },
  });
  return null;
}

// Zoom minimal une fois un point choisi : un même lieu (ex. "Saint-Leu")
// regroupe plusieurs spots de plongée parfois distants de quelques centaines
// de mètres seulement — une vue large ne permet pas de les distinguer.
const PRECISE_ZOOM = 16;

// Recentre (et rapproche si besoin) la carte quand la position arrive après
// le montage initial (ex. chargement asynchrone d'une sortie existante en
// mode édition, ou premier clic) — MapContainer ne capture `center`/`zoom`
// qu'au premier rendu.
function RecenterOnChange({ latitude, longitude }) {
  const map = useMap();
  useEffect(() => {
    if (hasPosition(latitude, longitude)) {
      map.setView(
        [Number(latitude), Number(longitude)],
        Math.max(map.getZoom(), PRECISE_ZOOM),
      );
    }
  }, [latitude, longitude, map]);
  return null;
}

const SortieLocationPicker = ({
  latitude,
  longitude,
  onChange,
  onAddressResolved,
}) => {
  const positioned = hasPosition(latitude, longitude);
  const initialCenter = positioned
    ? [Number(latitude), Number(longitude)]
    : [CLUB_LOCATION.lat, CLUB_LOCATION.lng];
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const handleClick = (lat, lng) => {
    onChange(lat, lng);
    if (!onAddressResolved) return;
    setResolvingAddress(true);
    geocodingService
      .reverseGeocode(lat, lng)
      .then((result) => {
        if (result.lieu || result.site) onAddressResolved(result);
      })
      .catch(() => {})
      .finally(() => setResolvingAddress(false));
  };

  const autoFillNote = onAddressResolved
    ? " (Lieu et Site se remplissent automatiquement)"
    : "";

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
        style={{ height: 300 }}
      >
        <MapContainer
          center={initialCenter}
          zoom={positioned ? PRECISE_ZOOM : 13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleClick} />
          <RecenterOnChange latitude={latitude} longitude={longitude} />
          {positioned && <Marker position={[Number(latitude), Number(longitude)]} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
        Cliquez sur la carte pour positionner le site de plongée
        {autoFillNote}.
        {resolvingAddress && " Résolution de l'adresse..."}
        {!resolvingAddress &&
          positioned &&
          ` Position actuelle : ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`}
      </p>
    </div>
  );
};

export default SortieLocationPicker;
