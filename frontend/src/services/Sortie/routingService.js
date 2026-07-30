// Appelle directement le serveur de démo public OSRM (gratuit, sans clé) —
// volontairement en dehors de l'instance axios partagée `api.js` (baseURL
// "/api" + intercepteurs d'authentification propres à notre propre backend),
// puisqu'il s'agit d'une URL absolue publique non liée à notre API.
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

class RoutingService {
  async getDrivingRoute(from, to) {
    const url = `${OSRM_BASE_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("OSRM request failed");
    const data = await response.json();
    if (data.code !== "Ok" || !data.routes?.length) {
      throw new Error("Aucun itinéraire trouvé");
    }
    const route = data.routes[0];
    return {
      geometry: route.geometry,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  }
}

export default new RoutingService();
