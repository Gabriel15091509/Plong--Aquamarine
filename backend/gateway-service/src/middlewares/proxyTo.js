// Passerelle "strangler fig" : pendant la migration en microservices, chaque
// domaine déjà découpé (ex. Formation/Competence) est retiré du monolithe et
// remplacé ici par un simple relais HTTP vers son nouveau service. Le
// frontend continue de parler à une seule URL (`/api/...` sur le monolithe)
// sans rien savoir du découpage ; le jour où un vrai Ingress k8s existe, ce
// fichier est simplement supprimé et remplacé par une règle de routage
// Ingress équivalente — même contrat, une implémentation différente.
function proxyTo(baseUrl) {
  return async (req, res, next) => {
    try {
      const target = `${baseUrl}${req.originalUrl}`;
      const headers = { ...req.headers };
      delete headers.host;
      delete headers["content-length"];
      delete headers.connection;

      const hasBody = !["GET", "HEAD"].includes(req.method);
      // Un upload (photo, document...) arrive en multipart/form-data : le
      // body-parser JSON global ne le touche pas, donc req.body est encore
      // {} à ce stade et le flux brut de la requête est toujours lisible.
      // Il faut le relayer tel quel (avec son Content-Type/boundary
      // d'origine) plutôt que de le réécrire en JSON, sous peine de
      // transmettre "{}" à la place du fichier au service cible.
      const isMultipart = (req.headers["content-type"] || "").startsWith(
        "multipart/form-data",
      );
      if (hasBody && !isMultipart) headers["content-type"] = "application/json";

      const response = await fetch(target, {
        method: req.method,
        headers,
        body: !hasBody ? undefined : isMultipart ? req : JSON.stringify(req.body),
        duplex: isMultipart ? "half" : undefined,
      });

      const contentType = response.headers.get("content-type") || "application/json";
      res.status(response.status);
      res.set("Content-Type", contentType);
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = proxyTo;
