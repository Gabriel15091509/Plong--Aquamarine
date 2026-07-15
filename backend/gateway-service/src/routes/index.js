const express = require("express");
const router = express.Router();
const proxyTo = require("../middlewares/proxyTo");
const dashboardRoutes = require("./dashboardRoutes");

// Ce service n'héberge plus aucun domaine métier : il ne fait que relayer
// chaque préfixe vers son microservice via `proxyTo` (motif "strangler fig")
// et agréger le Dashboard par HTTP cross-service — zéro changement frontend,
// en attendant le vrai Ingress k8s (voir backend/<service>/ pour le code
// métier de chaque domaine).
const FORMATION_SERVICE_URL =
  process.env.FORMATION_SERVICE_URL || "http://localhost:5010";
const MATERIEL_SERVICE_URL =
  process.env.MATERIEL_SERVICE_URL || "http://localhost:5011";
const FINANCE_SERVICE_URL =
  process.env.FINANCE_SERVICE_URL || "http://localhost:5012";
const VIE_ASSOCIATIVE_SERVICE_URL =
  process.env.VIE_ASSOCIATIVE_SERVICE_URL || "http://localhost:5013";
const IDENTITE_SERVICE_URL =
  process.env.IDENTITE_SERVICE_URL || "http://localhost:5014";
const ACTIVITES_SERVICE_URL =
  process.env.ACTIVITES_SERVICE_URL || "http://localhost:5015";

// Routes
router.use("/auth", proxyTo(IDENTITE_SERVICE_URL));
router.use("/adherents", proxyTo(IDENTITE_SERVICE_URL));
router.use("/adhesions", proxyTo(VIE_ASSOCIATIVE_SERVICE_URL));
router.use("/certificats-medicaux", proxyTo(VIE_ASSOCIATIVE_SERVICE_URL));
router.use("/paiements", proxyTo(FINANCE_SERVICE_URL));
router.use("/sorties", proxyTo(ACTIVITES_SERVICE_URL));
router.use("/inscriptions", proxyTo(ACTIVITES_SERVICE_URL));
router.use("/plongees", proxyTo(ACTIVITES_SERVICE_URL));
router.use("/materiels", proxyTo(MATERIEL_SERVICE_URL));
router.use("/formations", proxyTo(FORMATION_SERVICE_URL));
router.use("/alertes", proxyTo(VIE_ASSOCIATIVE_SERVICE_URL));
router.use("/users", proxyTo(IDENTITE_SERVICE_URL));
router.use("/email", proxyTo(IDENTITE_SERVICE_URL));
router.use("/moniteurs", proxyTo(IDENTITE_SERVICE_URL));
router.use("/president", proxyTo(IDENTITE_SERVICE_URL));
router.use("/tresoriers", proxyTo(IDENTITE_SERVICE_URL));
router.use("/incidents", proxyTo(ACTIVITES_SERVICE_URL));
router.use("/palanquees", proxyTo(ACTIVITES_SERVICE_URL));
router.use("/attributions", proxyTo(ACTIVITES_SERVICE_URL));
router.use("/reparations", proxyTo(MATERIEL_SERVICE_URL));
router.use("/competences", proxyTo(FORMATION_SERVICE_URL));
router.use("/dashboard", dashboardRoutes);

// Route racine API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Plongée Club",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      adherents: "/api/adherents",
      adhesions: "/api/adhesions",
      certificats_medicaux: "/api/certificats-medicaux",
      paiements: "/api/paiements",
      sorties: "/api/sorties",
      inscriptions: "/api/inscriptions",
      plongees: "/api/plongees",
      materiels: "/api/materiels",
      formations: "/api/formations",
      alertes: "/api/alertes",
      emails: "/api/emails",
      moniteurs: "/api/moniteurs",
      president: "/api/president",
      tresoriers: "/api/tresoriers",
      incidents: "/api/incidents",
      palanquees: "/api/palanquees",
      attributions: "/api/attributions",
      reparations: "/api/reparations",
      competences: "/api/competences",
    },
  });
});

module.exports = router;
