import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { FiAlertCircle } from "react-icons/fi";
import { CLUB_LOCATION } from "../../utils/constants";
import routingService from "../../services/Sortie/routingService";

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(points, { padding: [30, 30] });
  }, [points, map]);
  return null;
}

const SortieRouteMap = ({ siteLat, siteLng, siteName }) => {
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRouteError(false);
    setRoute(null);
    routingService
      .getDrivingRoute(CLUB_LOCATION, { lat: siteLat, lng: siteLng })
      .then((result) => {
        if (!cancelled) setRoute(result);
      })
      .catch(() => {
        if (!cancelled) setRouteError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [siteLat, siteLng]);

  const clubPoint = [CLUB_LOCATION.lat, CLUB_LOCATION.lng];
  const sitePoint = [siteLat, siteLng];
  const polylinePositions =
    route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) ?? [];

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{ height: 320 }}
      >
        <MapContainer
          center={sitePoint}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={[clubPoint, sitePoint]} />
          <Marker position={clubPoint}>
            <Popup>
              {CLUB_LOCATION.name}
              <br />
              {CLUB_LOCATION.address}
            </Popup>
          </Marker>
          <Marker position={sitePoint}>
            <Popup>{siteName || "Site de plongée"}</Popup>
          </Marker>
          {polylinePositions.length > 0 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: "#2563eb", weight: 4 }}
            />
          )}
        </MapContainer>
      </div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {loading && "Calcul de l'itinéraire..."}
        {!loading && route && (
          <span>
            {(route.distanceMeters / 1000).toFixed(1)} km · environ{" "}
            {Math.round(route.durationSeconds / 60)} min en voiture depuis{" "}
            {CLUB_LOCATION.name} ({CLUB_LOCATION.address})
          </span>
        )}
        {!loading && routeError && (
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
            <FiAlertCircle className="w-4 h-4" />
            Itinéraire indisponible
          </span>
        )}
      </div>
    </div>
  );
};

export default SortieRouteMap;
