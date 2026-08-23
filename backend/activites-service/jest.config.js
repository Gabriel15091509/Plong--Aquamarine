module.exports = {
  testEnvironment: "node",
  verbose: true,
  // Sequelize garde le pool de connexions ouvert après les tests
  // d'intégration ; on force la sortie plutôt que de laisser chaque
  // fichier gérer sa propre fermeture explicite.
  forceExit: true,
  // Le défaut Jest (5000 ms) est trop juste pour les hooks beforeAll qui
  // écrivent en base : les 3 suites d'intégration tournent en parallèle
  // sur le même conteneur Postgres CI (runner à 2 cœurs), et une
  // contention CPU normale suffit à dépasser 5s sans qu'il y ait de bug
  // applicatif (observé en CI : "Exceeded timeout of 5000 ms for a
  // hook"). Marge large plutôt qu'un chiffre ajusté au plus juste.
  testTimeout: 20000,
};
