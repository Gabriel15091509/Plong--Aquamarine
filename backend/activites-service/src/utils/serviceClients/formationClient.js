// Client HTTP vers formation-service. Utilisé lors de la validation d'une
// plongée de type "Formation" liée à une séance pratique planifiée, pour
// faire progresser cette séance à "Réalisée" (voir PlongeeService.validatePlongee).
const BASE_URL = process.env.FORMATION_SERVICE_URL
  ? `${process.env.FORMATION_SERVICE_URL}/api`
  : "http://localhost:5010/api";

async function marquerSeanceRealisee(id_seance, authHeader) {
  const response = await fetch(`${BASE_URL}/seances/${id_seance}/statut`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({ statut: "Réalisée" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `formation-service: échec mise à jour séance (${response.status})`);
  }
  return body.data;
}

module.exports = { marquerSeanceRealisee };
